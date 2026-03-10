'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { PRODUCTS, getAllCategories } from '@/lib/menu-data'
import { MenuItemCard } from './menu-item-card'

export function MenuGrid() {
  const { t } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categories = getAllCategories()

  const filtered = activeCategory
    ? PRODUCTS.filter(p => p.category === activeCategory)
    : PRODUCTS

  return (
    <div>
      {/* 分類篩選 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          {t('menu.allCategories')}
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
          >
            {t(`menu.categories.${cat}`)}
          </Button>
        ))}
      </div>

      {/* 商品格子 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(product => (
          <MenuItemCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
