'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { OrderForm } from '@/components/order-form'

export default function ConfirmPage() {
  const { language, t } = useLanguage()

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/order"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {language === 'zh' ? '返回菜單' : 'Back to Menu'}
      </Link>
      <h1 className="mb-6 font-heading text-3xl font-bold">{t('order.title')}</h1>
      <OrderForm />
    </div>
  )
}
