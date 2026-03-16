'use client'

import { Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { useCart } from '@/lib/cart-context'
import type { OrderableProduct } from '@/lib/types'
import { useState } from 'react'

export function MenuItemCard({ product }: { product: OrderableProduct }) {
  const { language, t } = useLanguage()
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* 圖片區塊 — 有照片用 img，否則 fallback emoji */}
      <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {product.image && !product.image.endsWith('.webp') ? (
          <img
            src={product.image}
            alt={product.name.en}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl">
            {product.category === 'main-dishes' ? '🍚' :
             product.category === 'desserts' ? '🍍' :
             product.category === 'matcha' ? '🍵' :
             product.category === 'oolong' ? '🍃' : '🧋'}
          </span>
        )}
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded bg-white px-3 py-1 text-sm font-bold text-destructive">
              {t('menu.soldOut')}
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{product.name[language]}</h3>
          <span className="shrink-0 font-bold text-primary">${product.price.toFixed(2)}</span>
        </div>
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {product.description[language]}
        </p>
        <Button
          size="sm"
          className="w-full"
          disabled={!product.available || added}
          onClick={handleAdd}
        >
          {added ? (
            <><Check className="mr-1 h-4 w-4" />{t('menu.added')}</>
          ) : (
            <><Plus className="mr-1 h-4 w-4" />{t('menu.addToCart')}</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
