'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { OrderForm } from '@/components/order-form'

export default function ConfirmPage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 font-heading text-3xl font-bold">{t('order.title')}</h1>
      <OrderForm />
    </div>
  )
}
