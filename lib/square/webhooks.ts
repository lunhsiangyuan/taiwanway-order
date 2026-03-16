import crypto from 'crypto'

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  const url = process.env.SQUARE_WEBHOOK_URL
  if (!key || !url) return false
  const hmac = crypto.createHmac('sha256', key)
  hmac.update(url + body)
  const expected = hmac.digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
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
