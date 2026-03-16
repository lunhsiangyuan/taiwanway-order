// lib/square/webhooks.ts — Square SDK v44 WebhooksHelper
import { WebhooksHelper } from 'square'

// Fail-closed: reject ALL webhooks if signature key is not configured
// C3 fix: previous version was fail-open (accepted when key missing)
export async function verifyWebhookSignature(
  body: string,
  signature: string,
): Promise<boolean> {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  const url = process.env.SQUARE_WEBHOOK_URL
  if (!key || !url) return false // no key = reject (fail-closed)

  return WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: signature,
    signatureKey: key,
    notificationUrl: url,
  })
}

export type SquareWebhookEvent = {
  merchant_id: string
  type: string
  event_id: string
  created_at: string
  data: {
    type: string
    id: string
    object: Record<string, any>
  }
}
