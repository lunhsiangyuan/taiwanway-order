// lib/square/client.ts
import { SquareClient, SquareEnvironment } from 'square'

// SDK v44 has its own BigInt-safe toJson() — do NOT add BigInt.prototype.toJSON
// (it would convert BigInt to string before SDK's replacer sees it, causing "Expected integer" errors)

let _client: SquareClient | null = null

// Check if Square is configured (call before any Square operation)
export function isSquareConfigured(): boolean {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID)
}

export function getSquareClient(): SquareClient {
  if (_client) return _client

  const token = process.env.SQUARE_ACCESS_TOKEN
  if (!token) throw new Error('SQUARE_ACCESS_TOKEN is not set')

  _client = new SquareClient({
    token,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  })

  return _client
}

export function getLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID
  if (!id) throw new Error('SQUARE_LOCATION_ID is not set')
  return id
}
