import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { PRODUCTS } from '@/lib/menu-data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_name, customer_phone, pickup_time, note, items } = body

    // 驗證必填欄位
    if (!customer_name || !customer_phone || !pickup_time || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 驗證電話號碼（至少 10 碼數字）
    const digitsOnly = customer_phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number (at least 10 digits required)' }, { status: 400 })
    }

    // 驗證取餐時間格式與營業時間
    if (!/^\d{2}:\d{2}$/.test(pickup_time) || pickup_time < '11:00' || pickup_time > '19:00') {
      return NextResponse.json({ error: 'Pickup time must be between 11:00 and 19:00' }, { status: 400 })
    }

    // 驗證營業日（週一=1, 週二=2, 週五=5, 週六=6）
    const today = new Date().getDay()
    if (![1, 2, 5, 6].includes(today)) {
      return NextResponse.json({ error: 'Store is closed today' }, { status: 400 })
    }

    // 伺服器端重算金額（防止客戶端篡改）
    const TAX_RATE = 0.08125
    let serverSubtotal = 0
    for (const item of items) {
      const product = PRODUCTS.find(p => p.id === item.product_id)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      }
      if (!product.available) {
        return NextResponse.json({ error: `Product unavailable: ${item.product_id}` }, { status: 400 })
      }
      serverSubtotal += product.price * item.quantity
      // 覆寫客戶端的 unit_price 為伺服器端的真實價格
      item.unit_price = product.price
    }
    const serverTax = Math.round(serverSubtotal * TAX_RATE * 100) / 100
    const serverTotal = serverSubtotal + serverTax

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        pickup_time,
        note: note || null,
        items,
        total_amount: serverTotal,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    // 嘗試發送 email 通知（非阻塞）
    sendNotificationEmail(data.id, customer_name, customer_phone, pickup_time, items, serverTotal).catch(console.error)

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Order creation error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

async function sendNotificationEmail(
  orderId: string,
  name: string,
  phone: string,
  pickupTime: string,
  items: Array<{ product_name: string; quantity: number; unit_price: number }>,
  total: number,
) {
  const apiKey = process.env.RESEND_API_KEY
  const storeEmail = process.env.STORE_EMAIL
  if (!apiKey || !storeEmail) return

  const itemList = items.map(i => `${i.product_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n')

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: 'TaiwanWay Orders <orders@taiwanway.com>',
    to: storeEmail,
    subject: `New Order #${orderId.slice(0, 8).toUpperCase()} — ${name}`,
    text: `New order received!\n\nCustomer: ${name}\nPhone: ${phone}\nPickup: ${pickupTime}\n\nItems:\n${itemList}\n\nTotal: $${total.toFixed(2)}`,
  })
}
