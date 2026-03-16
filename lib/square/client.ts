// lib/square/client.ts
import { Client, Environment } from 'square'

// Square SDK uses BigInt internally; ensure JSON serialization works
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

let _client: Client | null = null

// Check if Square is configured (call before any Square operation)
export function isSquareConfigured(): boolean {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID)
}

export function getSquareClient(): Client {
  if (_client) return _client

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  if (!accessToken) throw new Error('SQUARE_ACCESS_TOKEN is not set')

  _client = new Client({
    accessToken,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? Environment.Production
        : Environment.Sandbox,
  })

  return _client
}

export function getLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID
  if (!id) throw new Error('SQUARE_LOCATION_ID is not set')
  return id
}
