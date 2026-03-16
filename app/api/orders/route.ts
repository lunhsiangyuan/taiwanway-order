// app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isSquareConfigured } from '@/lib/square/client'
import { createSquareOrder } from '@/lib/square/orders'
import { processPayment } from '@/lib/square/payments'

const TAX_RATE = 0.08125

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customer_name, customer_phone, pickup_time, note, items,
      payment_method,
      payment_nonce,
    } = body

    // --- Validation ---
    if (!customer_name || !customer_phone || !pickup_time || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const digitsOnly = customer_phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    if (!/^\d{2}:\d{2}$/.test(pickup_time) || pickup_time < '11:00' || pickup_time > '19:00') {
      return NextResponse.json({ error: 'Pickup time must be between 11:00 and 19:00' }, { status: 400 })
    }
    const today = new Date().getDay()
    if (![1, 2, 5, 6].includes(today)) {
      return NextResponse.json({ error: 'Store is closed today' }, { status: 400 })
    }
    if (payment_method === 'card' && !payment_nonce) {
      return NextResponse.json({ error: 'Payment nonce required for card payment' }, { status: 400 })
    }

    // --- Server-side price validation from DB ---
    const supabase = createServerClient()
    let serverSubtotal = 0
    for (const item of items) {
      const { data: product } = await supabase
        .from('menu_items')
        .select('id, price, available')
        .eq('id', item.product_id)
        .single()
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      }
      if (!product.available) {
        return NextResponse.json({ error: `Product unavailable: ${item.product_id}` }, { status: 400 })
      }
      serverSubtotal += Number(product.price) * item.quantity
      item.unit_price = Number(product.price)
    }
    const serverTax = Math.round(serverSubtotal * TAX_RATE * 100) / 100
    const serverTotal = Math.round((serverSubtotal + serverTax) * 100) / 100

    // --- Square integration (only if configured) ---
    let squareOrderId: string | null = null
    let squarePaymentId: string | null = null
    let receiptUrl: string | null = null

    if (isSquareConfigured()) {
      const squareOrder = await createSquareOrder({
        lineItems: items.map((item: any) => ({
          name: item.product_name,
          quantity: item.quantity,
          basePriceMoney: {
            amount: BigInt(Math.round(item.unit_price * 100)),
            currency: 'USD',
          },
        })),
        pickupTime: pickup_time,
        customerName: customer_name,
        customerPhone: customer_phone,
        note,
      })
      squareOrderId = squareOrder.orderId || null

      if (payment_method === 'card' && squareOrderId) {
        const totalCents = BigInt(Math.round(serverTotal * 100))
        const paymentResult = await processPayment(payment_nonce, squareOrderId, totalCents)
        squarePaymentId = paymentResult.paymentId
        receiptUrl = paymentResult.receiptUrl || null
      }
    }

    // --- Save to Supabase ---
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
        payment_method: payment_method || 'cash',
        square_order_id: squareOrderId,
        square_payment_id: squarePaymentId,
        receipt_url: receiptUrl,
      })
      .select('id')
      .single()

    if (error) throw error

    sendNotificationEmail(data.id, customer_name, customer_phone, pickup_time, items, serverTotal).catch(console.error)

    return NextResponse.json({
      id: data.id,
      square_order_id: squareOrderId,
      receipt_url: receiptUrl,
    })
  } catch (err: any) {
    console.error('Order creation error:', err)
    const message = err?.errors?.[0]?.detail || err?.message || 'Failed to create order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function sendNotificationEmail(
  orderId: string, name: string, phone: string, pickupTime: string,
  items: Array<{ product_name: string; quantity: number; unit_price: number }>, total: number,
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
    text: `New order!\n\nCustomer: ${name}\nPhone: ${phone}\nPickup: ${pickupTime}\n\nItems:\n${itemList}\n\nTotal: $${total.toFixed(2)}`,
  })
}
