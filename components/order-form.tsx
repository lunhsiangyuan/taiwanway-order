'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { PaymentInfo } from './payment-info'

export function OrderForm() {
  const { items, subtotal, taxAmount, totalAmount, clearCart } = useCart()
  const { language, t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const payload = {
      customer_name: form.get('name') as string,
      customer_phone: form.get('phone') as string,
      pickup_time: form.get('pickup_time') as string,
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
      clearCart()
      router.push(`/success?type=order&id=${data.id}`)
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
          <Input id="phone" name="phone" type="tel" required placeholder={t('order.phonePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="pickup_time">{t('order.pickupTime')} *</Label>
          <Input id="pickup_time" name="pickup_time" type="time" required min="11:00" max="20:00" />
        </div>
        <div>
          <Label htmlFor="note">{t('order.note')}</Label>
          <Textarea id="note" name="note" placeholder={t('order.notePlaceholder')} rows={3} />
        </div>
      </div>

      <PaymentInfo />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? t('common.loading') : t('order.submit')}
      </Button>
    </form>
  )
}
