'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'

export default function NewCampaignPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => { if (!r.ok) throw new Error() })
      .catch(() => router.push('/admin/login'))
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: { zh: form.get('title_zh'), en: form.get('title_en') },
          description: { zh: form.get('desc_zh'), en: form.get('desc_en') },
          unit_price: Number(form.get('unit_price')),
          min_quantity: Number(form.get('min_quantity')),
          deadline: form.get('deadline'),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/admin/campaigns')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.newCampaign')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('admin.campaignTitle')} (中文) *</Label>
              <Input name="title_zh" required />
            </div>
            <div>
              <Label>{t('admin.campaignTitle')} (English) *</Label>
              <Input name="title_en" required />
            </div>
            <div>
              <Label>{t('admin.campaignDesc')} (中文)</Label>
              <Textarea name="desc_zh" rows={2} />
            </div>
            <div>
              <Label>{t('admin.campaignDesc')} (English)</Label>
              <Textarea name="desc_en" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.unitPrice')} ($) *</Label>
                <Input name="unit_price" type="number" step="0.01" min="0" required />
              </div>
              <div>
                <Label>{t('admin.minQty')} *</Label>
                <Input name="min_quantity" type="number" min="1" required />
              </div>
            </div>
            <div>
              <Label>{t('admin.deadline')} *</Label>
              <Input name="deadline" type="date" required />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('admin.create')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
