import { NextResponse } from 'next/server'
import { verifyWebhookSignature, type SquareWebhookEvent } from '@/lib/square/webhooks'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-square-hmacsha256-signature') || ''

  // 驗證簽名（若無金鑰則略過開發環境驗證）
  if (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
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
      console.log('[webhook] 目錄已更新:', event.data.id)
      break
    }

    case 'payment.updated': {
      const paymentId = event.data.id
      const status = event.data.object?.payment?.status
      if (status === 'COMPLETED') {
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('square_payment_id', paymentId)
      }
      break
    }

    default:
      console.log(`[webhook] 未處理的事件: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
