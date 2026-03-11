'use client'

import Link from 'next/link'
import { ShoppingCart, Globe, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/language-context'
import { useCart } from '@/lib/cart-context'
import { useState } from 'react'

export function Header({ onCartOpen }: { onCartOpen?: () => void }) {
  const { language, setLanguage, t } = useLanguage()
  const { totalItems } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-bold text-primary">
          {t('site.title').split(' ')[0]}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/order" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.order')}
          </Link>
          <Link href="/group-buy" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.groupBuy')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* 語言切換 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="gap-1"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs">{language === 'zh' ? 'EN' : '中'}</span>
          </Button>

          {/* 購物車 */}
          <Button variant="ghost" size="sm" className="relative" onClick={onCartOpen}>
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {totalItems}
              </Badge>
            )}
          </Button>

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/order" className="text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>
              {t('nav.order')}
            </Link>
            <Link href="/group-buy" className="text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>
              {t('nav.groupBuy')}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
