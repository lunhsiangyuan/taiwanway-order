export interface OrderableProduct {
  id: string
  category: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  price: number
  image: string
  available: boolean
  tags: string[]
}

export interface Order {
  id: string
  items: OrderItem[]
  customer_name: string
  customer_phone: string
  pickup_time: string
  note?: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  payment_method?: 'card' | 'cash' | 'zelle' | 'venmo'
  square_order_id?: string
  square_payment_id?: string
  receipt_url?: string
  created_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface Campaign {
  id: string
  title: { zh: string; en: string }
  description: { zh: string; en: string }
  image?: string
  unit_price: number
  min_quantity: number
  max_quantity?: number
  current_quantity: number
  deadline: string
  status: 'active' | 'reached' | 'closed' | 'cancelled'
  created_at: string
}

export interface CampaignEntry {
  id: string
  campaign_id: string
  customer_name: string
  customer_phone: string
  quantity: number
  note?: string
  status: 'joined' | 'confirmed' | 'cancelled'
  created_at: string
}

export type Language = 'zh' | 'en'

export interface CartItem {
  product: OrderableProduct
  quantity: number
}
