'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/language-context'
import { ProgressBar } from '@/components/progress-bar'
import { CountdownTimer } from '@/components/countdown-timer'
import { CampaignJoinForm } from '@/components/campaign-join-form'
import type { Campaign } from '@/lib/types'

export default function CampaignDetailPage() {
  const { language, t } = useLanguage()
  const params = useParams()
  const campaignId = params.campaignId as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then(r => r.json())
      .then(data => setCampaign(data.campaign || null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [campaignId])

  if (loading) return <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>
  if (!campaign) return <div className="py-12 text-center text-muted-foreground">{t('common.error')}</div>

  const isActive = campaign.status === 'active'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" render={<Link href="/group-buy" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />{t('common.back')}
      </Button>

      <Card>
        {/* 圖片 */}
        <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
          <span className="text-6xl">🛒</span>
        </div>

        <CardHeader>
          <CardTitle className="text-2xl">{campaign.title[language]}</CardTitle>
          <p className="text-muted-foreground">{campaign.description[language]}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">${campaign.unit_price.toFixed(2)}</span>
            <CountdownTimer deadline={campaign.deadline} />
          </div>

          <ProgressBar current={campaign.current_quantity} target={campaign.min_quantity} />

          <Separator />

          {isActive ? (
            <>
              <h3 className="font-semibold">{t('groupBuy.joinForm')}</h3>
              <CampaignJoinForm campaignId={campaignId} />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {campaign.status === 'reached' ? t('groupBuy.reached') : t('groupBuy.closed')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
