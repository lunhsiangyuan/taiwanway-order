'use client'

import Link from 'next/link'
import { ShoppingBag, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center animate-fade-in-up">
        <h1 className="font-heading text-4xl font-bold text-dark sm:text-5xl">
          {t('home.welcome')}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('home.tagline')}
        </p>
      </div>

      {/* 兩大入口 */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/order">
          <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                <ShoppingBag className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">{t('home.orderNow')}</h2>
              <p className="text-muted-foreground">{t('home.orderDesc')}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/group-buy">
          <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-gold hover:shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="rounded-full bg-gold/10 p-4 transition-colors group-hover:bg-gold/20">
                <Users className="h-10 w-10 text-gold" />
              </div>
              <h2 className="text-2xl font-bold">{t('home.groupBuy')}</h2>
              <p className="text-muted-foreground">{t('home.groupBuyDesc')}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
