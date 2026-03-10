'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/i18n/language-context'

export function CampaignJoinForm({ campaignId }: { campaignId: string }) {
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.get('name'),
          customer_phone: form.get('phone'),
          quantity: Number(form.get('quantity')),
          note: form.get('note') || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/success?type=campaign&id=${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t('order.name')} *</Label>
        <Input id="name" name="name" required placeholder={t('order.namePlaceholder')} />
      </div>
      <div>
        <Label htmlFor="phone">{t('order.phone')} *</Label>
        <Input id="phone" name="phone" type="tel" required placeholder={t('order.phonePlaceholder')} />
      </div>
      <div>
        <Label htmlFor="quantity">{t('groupBuy.quantity')} *</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
      </div>
      <div>
        <Label htmlFor="note">{t('order.note')}</Label>
        <Textarea id="note" name="note" placeholder={t('order.notePlaceholder')} rows={2} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('common.loading') : t('groupBuy.join')}
      </Button>
    </form>
  )
}
