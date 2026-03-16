// app/order/page.tsx — Server Component (dynamic, not prerendered)
import { getProducts, getCategories } from '@/lib/menu-service'
import { MenuGrid } from '@/components/menu-grid'

export const dynamic = 'force-dynamic'

export default async function OrderPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  const available = products.filter(p => p.available)
  const activeCategoryIds = new Set(available.map(p => p.category))
  const activeCategories = categories.filter(c => activeCategoryIds.has(c.id))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <MenuGrid products={available} categories={activeCategories} />
    </div>
  )
}
