'use client'

import { useLanguage } from '@/lib/i18n/language-context'

export function Footer() {
  const { t } = useLanguage()
  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://taiwanway.vercel.app'

  return (
    <footer className="border-t border-border bg-dark text-cream/80">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm">
            <p>{t('footer.phone')}</p>
            <p>{t('footer.address')}</p>
            <p>{t('footer.hours')}</p>
          </div>
          <a
            href={mainSiteUrl}
            className="text-sm text-gold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.backToMain')}
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-cream/50">
          &copy; {new Date().getFullYear()} TaiwanWay. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
