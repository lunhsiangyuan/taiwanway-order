'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { MenuGrid } from '@/components/menu-grid'

export default function OrderPage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-heading text-3xl font-bold">{t('menu.title')}</h1>
      <MenuGrid />
    </div>
  )
}
