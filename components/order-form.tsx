'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { SquarePaymentForm } from './square-payment-form'

const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ''
const SQUARE_LOC_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''
const HAS_SQUARE = !!(SQUARE_APP_ID && SQUARE_LOC_ID)

function getMinPickupTime(totalItems: number): { minTime: string; prepMinutes: number } {
  const prepMinutes = totalItems > 5 ? 60 : 30
  const now = new Date()
  now.setMinutes(now.getMinutes() + prepMinutes)
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return { minTime: `${hh}:${mm}`, prepMinutes }
}

const OPEN_DAYS = new Set([1, 2, 5, 6])
function isStoreOpen(): boolean {
  return OPEN_DAYS.has(new Date().getDay())
}

export function OrderForm() {
  const { items, totalItems, subtotal, taxAmount, totalAmount, clearCart } = useCart()
  const { language, t } = useLanguage()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [pickupLimits, setPickupLimits] = useState(() => getMinPickupTime(totalItems))
  const [storeOpen, setStoreOpen] = useState(() => isStoreOpen())
  const [paymentNonce, setPaymentNonce] = useState<string | null>(null)

  useEffect(() => {
    setPickupLimits(getMinPickupTime(totalItems))
    setStoreOpen(isStoreOpen())
    const timer = setInterval(() => {
      setPickupLimits(getMinPickupTime(totalItems))
      setStoreOpen(isStoreOpen())
    }, 60_000)
    return () => clearInterval(timer)
  }, [totalItems])

  const { minTime, prepMinutes } = pickupLimits

  const validatePickupTime = useCallback((time: string): boolean => {
    const { minTime: currentMin, prepMinutes: currentPrep } = getMinPickupTime(totalItems)
    if (time < currentMin) {
      setTimeError(
        t('order.pickupTimeTooEarly')
          .replace('{time}', currentMin)
          .replace('{minutes}', String(currentPrep))
      )
      return false
    }
    setTimeError('')
    return true
  }, [totalItems, t])

  // When card nonce received, auto-submit the order
  useEffect(() => {
    if (paymentNonce && formRef.current) {
      submitOrder(new FormData(formRef.current), paymentNonce)
    }
  }, [paymentNonce]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitOrder(formData: FormData, nonce?: string | null) {
    setLoading(true)
    setError('')

    const pickupTime = formData.get('pickup_time') as string
    if (!validatePickupTime(pickupTime)) {
      setLoading(false)
      return
    }

    const payload = {
      customer_name: formData.get('name') as string,
      customer_phone: formData.get('phone') as string,
      pickup_time: pickupTime,
      note: (formData.get('note') as string) || undefined,
      items: items.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name[language],
        quantity: i.quantity,
        unit_price: i.product.price,
      })),
      total_amount: totalAmount,
      payment_method: 'card',
      payment_nonce: nonce || undefined,
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/success?type=order&id=${data.id}`)
      setTimeout(() => clearCart(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
      setPaymentNonce(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Card flow: user clicks SquarePaymentForm button → nonce → useEffect auto-submits
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t('cart.empty')}
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.product.id} className="flex justify-between text-sm">
            <span>{item.product.name[language]} x{item.quantity}</span>
            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm">
          <span>{t('cart.subtotal')}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t('cart.tax')}</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>{t('cart.total')}</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Customer info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t('order.name')} *</Label>
          <Input id="name" name="name" required placeholder={t('order.namePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="phone">{t('order.phone')} *</Label>
          <Input
            id="phone" name="phone" type="tel" required
            pattern=".*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*"
            title={t('order.phoneValidation')}
            placeholder={t('order.phonePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="pickup_time">{t('order.pickupTime')} *</Label>
          {!storeOpen ? (
            <p className="mt-1 text-sm text-destructive font-medium">{t('order.closedToday')}</p>
          ) : minTime > '19:00' ? (
            <p className="mt-1 text-sm text-destructive font-medium">
              {language === 'zh'
                ? `準備時間需 ${prepMinutes} 分鐘，已超過今日營業時間（7PM），請明日再訂`
                : `${prepMinutes} min prep needed, past today's closing (7PM). Please order tomorrow.`}
            </p>
          ) : (
            <>
              <Input
                id="pickup_time" name="pickup_time" type="time" required
                min={minTime > '11:00' ? minTime : '11:00'} max="19:00"
                onChange={(e) => validatePickupTime(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('order.pickupTimeHint')}: {minTime} ({prepMinutes} {language === 'zh' ? '分鐘' : 'min'})
              </p>
              {timeError && <p className="mt-1 text-xs text-destructive">{timeError}</p>}
            </>
          )}
        </div>
        <div>
          <Label htmlFor="note">{t('order.note')}</Label>
          <Textarea id="note" name="note" placeholder={t('order.notePlaceholder')} rows={3} />
        </div>
      </div>

      {/* 到店自取提示 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        <p className="font-medium">📍 {language === 'zh' ? '到店自取' : 'In-store Pickup'}</p>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
          {language === 'zh'
            ? '線上付款完成後，請於指定時間到店取餐'
            : 'After payment, please pick up your order at the store at the scheduled time'}
        </p>
      </div>

      {/* Payment — card / Apple Pay / Google Pay */}
      {HAS_SQUARE ? (
        <SquarePaymentForm
          applicationId={SQUARE_APP_ID}
          locationId={SQUARE_LOC_ID}
          amount={totalAmount}
          disabled={loading || !storeOpen || minTime > '19:00'}
          onPaymentNonce={(nonce) => setPaymentNonce(nonce)}
          onError={(msg) => setError(msg)}
        />
      ) : (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {language === 'zh' ? '付款系統暫時無法使用，請稍後再試' : 'Payment system temporarily unavailable'}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
