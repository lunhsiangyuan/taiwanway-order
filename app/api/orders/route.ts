import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_name, customer_phone, pickup_time, note, items, total_amount } = body

    // 驗證必填欄位
    if (!customer_name || !customer_phone || !pickup_time || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 驗證電話號碼（至少 10 碼數字）
    const digitsOnly = customer_phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number (at least 10 digits required)' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        pickup_time,
        note: note || null,
        items,
        total_amount,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    // 嘗試發送 email 通知（非阻塞）
    sendNotificationEmail(data.id, customer_name, customer_phone, pickup_time, items, total_amount).catch(console.error)

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
