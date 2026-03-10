'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { Suspense } from 'react'

function SuccessContent() {
  const { t } = useLanguage()
  const params = useSearchParams()
  const id = params.get('id')
  const type = params.get('type') // 'order' | 'campaign'

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
      <h1 className="mb-2 text-3xl font-bold">{t('success.title')}</h1>
      {id && (
        <p className="mb-2 text-muted-foreground">
          {t('success.orderNumber')}: <span className="font-mono font-bold">{id.slice(0, 8).toUpperCase()}</span>
        </p>
      )}
      <p className="mb-6 text-muted-foreground">{t('success.message')}</p>

      <div className="rounded-lg border bg-muted/50 p-4 text-left text-sm mb-8">
        <h3 className="font-semibold mb-2">{t('success.pickupInfo')}</h3>
        <p>{t('success.address')}</p>
      </div>

      <div className="flex gap-3 justify-center">
        {type === 'order' && (
          <Button render={<Link href="/order" />}>
            {t('success.backToMenu')}
          </Button>
        )}
        <Button variant="outline" render={<Link href="/" />}>
          {t('success.backToHome')}
        </Button>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
