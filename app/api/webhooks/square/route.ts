import { NextResponse } from 'next/server'
import { verifyWebhookSignature, type SquareWebhookEvent } from '@/lib/square/webhooks'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-square-hmacsha256-signature') || ''

  // C3 fix: ALWAYS verify signature (fail-closed)
  // verifyWebhookSignature returns false when key is not configured
  const valid = await verifyWebhookSignature(body, signature)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event: SquareWebhookEvent
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createServerClient()

  switch (event.type) {
    case 'order.fulfillment.updated': {
      const squareOrderId = event.data.id
      const fulfillments = event.data.object?.order_fulfillment_updated?.fulfillment_update || []
      for (const f of fulfillments) {
        const stateMap: Record<string, string> = {
          PROPOSED: 'pending',
          RESERVED: 'confirmed',
          PREPARED: 'ready',
          COMPLETED: 'completed',
        }
        const newStatus = stateMap[f.new_state]
        if (newStatus) {
          await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('square_order_id', squareOrderId)
        }
      }
      break
    }

    case 'catalog.version.updated': {
      console.log('[webhook] Catalog updated:', event.data.id)
      break
    }

    case 'payment.updated': {
      const paymentId = event.data.id
      const status = event.data.object?.payment?.status
      if (status === 'COMPLETED') {
        // Avoid status downgrade: only promote to 'confirmed' if currently 'pending'
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('square_payment_id', paymentId)
          .eq('status', 'pending')
      }
      break
    }

    default:
      console.log(`[webhook] Unhandled event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
