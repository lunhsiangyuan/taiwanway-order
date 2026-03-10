'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { ProgressBar } from '@/components/progress-bar'
import type { Campaign } from '@/lib/types'
import { Plus } from 'lucide-react'

export default function AdminCampaignsPage() {
  const { language, t } = useLanguage()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => loadCampaigns())
      .catch(() => router.push('/admin/login'))
  }, [router])

  const loadCampaigns = async () => {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadCampaigns()
  }

  if (loading) return <div className="py-12 text-center">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">{t('admin.campaigns')}</h1>
        <Button render={<Link href="/admin/campaigns/new" />}>
          <Plus className="mr-1 h-4 w-4" />{t('admin.newCampaign')}
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.map(campaign => (
          <Card key={campaign.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold">{campaign.title[language]}</h3>
                  <p className="text-sm text-muted-foreground">${campaign.unit_price.toFixed(2)} | Deadline: {new Date(campaign.deadline).toLocaleDateString()}</p>
                </div>
                <Badge>{campaign.status}</Badge>
              </div>

              <ProgressBar current={campaign.current_quantity} target={campaign.min_quantity} className="mb-3" />

              <div className="flex gap-2">
                {campaign.status === 'active' && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(campaign.id, 'closed')}>
                    Close
                  </Button>
                )}
                {campaign.status === 'reached' && (
                  <Button size="sm" onClick={() => updateStatus(campaign.id, 'closed')}>
                    Mark Closed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No campaigns</p>
        )}
      </div>
    </div>
  )
}
