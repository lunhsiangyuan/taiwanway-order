'use client'

import { CreditCard, Smartphone, Banknote } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'

export function PaymentInfo() {
  const { t } = useLanguage()

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <h3 className="mb-3 font-semibold">{t('order.paymentTitle')}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{t('order.paymentDesc')}</p>
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-primary" />
          <span>Zelle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>Venmo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Banknote className="h-4 w-4 text-primary" />
          <span>{t('order.paymentCash')}</span>
        </div>
      </div>
    </div>
  )
}
