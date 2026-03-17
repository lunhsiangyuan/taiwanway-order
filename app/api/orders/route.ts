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
    // Sanitize text inputs (prevent stored XSS)
    const sanitize = (s: string) => s.replace(/[<>]/g, '')
    const safeCustomerName = sanitize(String(customer_name)).slice(0, 100)
    // Validate item quantities
    for (const item of items) {
      const qty = Number(item.quantity)
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return NextResponse.json({ error: `Invalid quantity: must be 1-99` }, { status: 400 })
      }
      item.quantity = qty
    }
    const digitsOnly = customer_phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    if (!/^\d{2}:\d{2}$/.test(pickup_time) || pickup_time < '11:00' || pickup_time > '18:30') {
      return NextResponse.json({ error: 'Pickup time must be between 11:00 and 18:30' }, { status: 400 })
    }
    // Use NY timezone (Vercel servers run UTC)
    const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const todayDay = nyNow.getDay()
    if (![1, 2, 5, 6].includes(todayDay)) {
      return NextResponse.json({ error: 'Store is closed today' }, { status: 400 })
    }
    // Validate payment method whitelist
    const validMethods = ['card', 'cash', 'zelle', 'venmo']
    if (payment_method && !validMethods.includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
    // Validate card payment requires both nonce AND server-side Square config
    if (payment_method === 'card') {
      if (!payment_nonce) {
        return NextResponse.json({ error: 'Payment nonce required for card payment' }, { status: 400 })
      }
      if (!isSquareConfigured()) {
        return NextResponse.json({ error: 'Card payments not available' }, { status: 400 })
      }
    }

    // --- Server-side price + name validation from DB (batch query) ---
    const supabase = createServerClient()
    const productIds = items.map((i: any) => i.product_id)
    const { data: products } = await supabase
      .from('menu_items')
      .select('id, name, price, available')
      .in('id', productIds)
    const productMap = new Map((products || []).map((p: any) => [p.id, p]))

    let serverSubtotal = 0
    for (const item of items) {
      const product = productMap.get(item.product_id)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      }
      if (!product.available) {
        return NextResponse.json({ error: `Product unavailable: ${item.product_id}` }, { status: 400 })
      }
      serverSubtotal += Number(product.price) * item.quantity
      item.unit_price = Number(product.price)
      item.product_name = product.name?.en || item.product_name
    }
    const serverTax = Math.round(serverSubtotal * TAX_RATE * 100) / 100
    const serverTotal = Math.round((serverSubtotal + serverTax) * 100) / 100

    // --- C2 fix: Save to Supabase FIRST (as 'pending'), then process payment ---
    // This ensures we never have a charged card with no local order record
    let squareOrderId: string | null = null
    let squarePaymentId: string | null = null
    let receiptUrl: string | null = null

    const { data: orderRow, error: insertErr } = await supabase
      .from('orders')
      .insert({
        customer_name: safeCustomerName,
        customer_phone,
        pickup_time,
        note: note ? sanitize(String(note)).slice(0, 500) : null,
        items,
        total_amount: serverTotal,
        status: 'pending',
        payment_method: payment_method || 'cash',
      })
      .select('id')
      .single()

    if (insertErr) throw insertErr
    const orderId = orderRow.id

    // --- Square integration (only for card payments when configured) ---
    // Cash orders skip Square entirely — they always succeed even if Square is down (I2 fix)
    if (isSquareConfigured() && payment_method === 'card') {
      try {
        // Create Square order
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
          customerName: safeCustomerName,
          customerPhone: customer_phone,
          note,
        })
        squareOrderId = squareOrder.orderId || null

        // Process card payment
        if (squareOrderId) {
          const totalCents = BigInt(Math.round(serverTotal * 100))
          const paymentResult = await processPayment(payment_nonce, squareOrderId, totalCents)
          squarePaymentId = paymentResult.paymentId
          receiptUrl = paymentResult.receiptUrl || null
        }

        // Update order with Square IDs on success
        await supabase
          .from('orders')
          .update({
            square_order_id: squareOrderId,
            square_payment_id: squarePaymentId,
            receipt_url: receiptUrl,
            status: 'confirmed', // card paid = confirmed
          })
          .eq('id', orderId)
      } catch (paymentErr: any) {
        // Payment failed — mark order as cancelled, return error
        await supabase
          .from('orders')
          .update({ status: 'cancelled', square_order_id: squareOrderId })
          .eq('id', orderId)
        const msg = paymentErr?.errors?.[0]?.detail || paymentErr?.message || 'Payment failed'
        return NextResponse.json({ error: msg, order_id: orderId }, { status: 402 })
      }
    }

    // Non-blocking notifications (email + Telegram)
    sendNotificationEmail(orderId, safeCustomerName, customer_phone, pickup_time, items, serverTotal).catch(console.error)
    sendTelegramNotification(orderId, safeCustomerName, customer_phone, pickup_time, items, serverTotal, payment_method || 'cash').catch(console.error)

    return NextResponse.json({
      id: orderId,
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
  const storeEmails = process.env.STORE_EMAIL
  if (!apiKey || !storeEmails) return
  // Support comma-separated emails: "a@x.com,b@x.com"
  const recipients = storeEmails.split(',').map(e => e.trim()).filter(Boolean)
  const itemList = items.map(i => `${i.product_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n')
  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'TaiwanWay Orders <orders@taiwanwayny.com>',
    to: recipients,
    subject: `🧋 New Order #${orderId.slice(0, 8).toUpperCase()} — ${name}`,
    text: `New order received!\n\nCustomer: ${name}\nPhone: ${phone}\nPickup: ${pickupTime}\n\nItems:\n${itemList}\n\nTotal: $${total.toFixed(2)}\n\nPlease call the customer to confirm.`,
  })
}

async function sendTelegramNotification(
  orderId: string, name: string, phone: string, pickupTime: string,
  items: Array<{ product_name: string; quantity: number; unit_price: number }>,
  total: number, paymentMethod: string,
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return

  const paymentLabel = paymentMethod === 'card' ? '💳 信用卡（已付款）' : '💵 到店付現'
  const itemLines = items.map(i => `  • ${i.product_name} x${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n')

  const text = `🧋 <b>新訂單 #${orderId.slice(0, 8).toUpperCase()}</b>

👤 ${name}
📞 ${phone}
🕐 取餐：${pickupTime}
${paymentLabel}

📋 品項：
${itemLines}

💰 <b>合計：$${total.toFixed(2)}</b>`

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}
