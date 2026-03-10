'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { CampaignCard } from '@/components/campaign-card'
import type { Campaign } from '@/lib/types'

export default function GroupBuyPage() {
  const { t } = useLanguage()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => setCampaigns(data.campaigns || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">{t('groupBuy.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('groupBuy.subtitle')}</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">{t('common.loading')}</p>
      ) : campaigns.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('groupBuy.noActive')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
