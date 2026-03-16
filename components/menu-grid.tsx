'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { MenuItemCard } from './menu-item-card'
import type { OrderableProduct } from '@/lib/types'

interface MenuGridProps {
  products: OrderableProduct[]
  categories: { id: string; name: { zh: string; en: string } }[]
}

export function MenuGrid({ products, categories }: MenuGridProps) {
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products

  return (
    <div>
      {/* 頁面標題（從 order/page.tsx 移入，因為此為 client component） */}
      <h1 className="mb-6 font-heading text-3xl font-bold">
        {language === 'zh' ? '菜單' : 'Menu'}
      </h1>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          {language === 'zh' ? '全部' : 'All'}
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name[language]}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(product => (
          <MenuItemCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
