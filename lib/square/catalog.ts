// lib/square/catalog.ts
import { getSquareClient } from './client'
import { createServerClient } from '@/lib/supabase'

export async function syncCatalogFromSquare() {
  const client = getSquareClient()
  const supabase = createServerClient()

  // SDK v44: client.catalog.search({ ... })
  const response = await client.catalog.search({
    objectTypes: ['ITEM'],
    includeRelatedObjects: true,
    includeDeletedObjects: false,
  })

  const items = response.objects || []
  let updated = 0

  for (const item of items) {
    // CatalogObject is a union type; narrow to ITEM
    if (item.type !== 'ITEM' || !('itemData' in item)) continue
    const catalogId = item.id
    const itemData = (item as any).itemData
    const variation = itemData?.variations?.[0]
    if (!variation?.itemVariationData?.priceMoney) continue

    const priceCents = Number(variation.itemVariationData.priceMoney.amount)
    const price = priceCents / 100

    const { data } = await supabase
      .from('menu_items')
      .update({
        price,
        available: !itemData?.isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq('square_catalog_id', catalogId)
      .select('id')

    if (data && data.length > 0) updated++
  }

  return { total: items.length, updated }
}
