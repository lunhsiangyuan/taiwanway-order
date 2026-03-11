'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { PaymentInfo } from './payment-info'

function getMinPickupTime(totalItems: number): { minTime: string; prepMinutes: number } {
  const prepMinutes = totalItems > 5 ? 60 : 30
  const now = new Date()
  now.setMinutes(now.getMinutes() + prepMinutes)
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return { minTime: `${hh}:${mm}`, prepMinutes }
}

export function OrderForm() {
  const { items, totalItems, subtotal, taxAmount, totalAmount, clearCart } = useCart()
  const { language, t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [pickupLimits, setPickupLimits] = useState(() => getMinPickupTime(totalItems))

  // 每 60 秒更新最早取餐時間，避免頁面停留過久後 hint 過期
  useEffect(() => {
    setPickupLimits(getMinPickupTime(totalItems))
    const timer = setInterval(() => setPickupLimits(getMinPickupTime(totalItems)), 60_000)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const pickupTime = form.get('pickup_time') as string

    if (!validatePickupTime(pickupTime)) {
      setLoading(false)
      return
    }

    const payload = {
      customer_name: form.get('name') as string,
      customer_phone: form.get('phone') as string,
      pickup_time: pickupTime,
      note: form.get('note') as string || undefined,
      items: items.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name[language],
        quantity: i.quantity,
        unit_price: i.product.price,
      })),
      total_amount: totalAmount,
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
      // 導航啟動後才清空購物車，避免跳轉失敗時購物車已空
      setTimeout(() => clearCart(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t('cart.empty')}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 訂單摘要 */}
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

      {/* 客戶資訊 */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t('order.name')} *</Label>
          <Input id="name" name="name" required placeholder={t('order.namePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="phone">{t('order.phone')} *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            pattern=".*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*"
            title={language === 'zh' ? '請輸入有效的電話號碼（至少10碼）' : 'Please enter a valid phone number (at least 10 digits)'}
            placeholder={t('order.phonePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="pickup_time">{t('order.pickupTime')} *</Label>
          {minTime > '19:00' ? (
            <p className="mt-1 text-sm text-destructive font-medium">
              {language === 'zh'
                ? `準備時間需 ${prepMinutes} 分鐘，已超過今日營業時間（7PM），請明日再訂`
                : `${prepMinutes} min prep needed, past today's closing (7PM). Please order tomorrow.`}
            </p>
          ) : (
            <>
              <Input
                id="pickup_time"
                name="pickup_time"
                type="time"
                required
                min={minTime > '11:00' ? minTime : '11:00'}
                max="19:00"
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

      <PaymentInfo />

      {/* 訂單確認警語 */}
      <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('order.confirmWarning')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading || minTime > '19:00'}>
        {loading ? t('common.loading') : t('order.submit')}
      </Button>
    </form>
  )
}
