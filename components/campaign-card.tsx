'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/language-context'
import { ProgressBar } from './progress-bar'
import { CountdownTimer } from './countdown-timer'
import type { Campaign } from '@/lib/types'

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { language, t } = useLanguage()

  return (
    <Link href={`/group-buy/${campaign.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        {/* 圖片 */}
        <div className="relative aspect-video bg-muted flex items-center justify-center">
          <span className="text-5xl">🛒</span>
          <Badge className="absolute top-2 right-2" variant={campaign.status === 'reached' ? 'default' : 'secondary'}>
            {campaign.status === 'active' ? <CountdownTimer deadline={campaign.deadline} /> :
             campaign.status === 'reached' ? t('groupBuy.reached') : t('groupBuy.closed')}
          </Badge>
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {campaign.title[language]}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description[language]}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-primary">${campaign.unit_price.toFixed(2)}</span>
            <span className="text-muted-foreground">
              {t('groupBuy.target')}: {campaign.min_quantity}
            </span>
          </div>
          <ProgressBar current={campaign.current_quantity} target={campaign.min_quantity} />
        </CardContent>
      </Card>
    </Link>
  )
}
