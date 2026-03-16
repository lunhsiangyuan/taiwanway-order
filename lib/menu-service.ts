import { createServerClient, createBrowserClient } from './supabase'
import type { OrderableProduct } from './types'

interface CategoryRow {
  id: string
  name: { zh: string; en: string }
  sort_order: number
}

interface MenuItemRow {
  id: string
  category_id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  price: number
  image: string
  available: boolean
  tags: string[]
  sort_order: number
}

// 將 DB 行轉換為現有 OrderableProduct 介面（零破壞性變更）
function toOrderableProduct(row: MenuItemRow): OrderableProduct {
  return {
    id: row.id,
    category: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image,
    available: row.available,
    tags: row.tags,
  }
}

// 伺服器端：取得所有可用商品
export async function getProducts(): Promise<OrderableProduct[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return (data as MenuItemRow[]).map(toOrderableProduct)
}

// 伺服器端：根據 ID 取得商品（用於訂單驗證）
export async function getProductById(id: string): Promise<OrderableProduct | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toOrderableProduct(data as MenuItemRow)
}

// 伺服器端：取得所有分類
export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as CategoryRow[]
}

// 瀏覽器端：取得完整菜單供顯示用
export async function fetchMenuClient(): Promise<{ products: OrderableProduct[]; categories: CategoryRow[] }> {
  const supabase = createBrowserClient()
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('menu_items').select('*').eq('available', true).order('sort_order'),
    supabase.from('categories').select('*').order('sort_order'),
  ])
  if (productsRes.error) throw productsRes.error
  if (categoriesRes.error) throw categoriesRes.error
  return {
    products: (productsRes.data as MenuItemRow[]).map(toOrderableProduct),
    categories: categoriesRes.data as CategoryRow[],
  }
}
