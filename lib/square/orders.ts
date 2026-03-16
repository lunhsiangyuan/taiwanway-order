// lib/square/orders.ts — Square SDK v44 (client.orders.create / .update)
import { getSquareClient, getLocationId } from './client'
import type { CreateSquareOrderParams } from './types'
import { randomUUID } from 'crypto'

const TAX_RATE_PERCENT = '8.125' // Middletown, NY (Orange County)

export async function createSquareOrder(params: CreateSquareOrderParams) {
  const client = getSquareClient()
  const locationId = getLocationId()

  // Convert pickup time string (HH:MM) to ISO 8601 for today
  const today = new Date()
  const [hh, mm] = params.pickupTime.split(':')
  today.setHours(Number(hh), Number(mm), 0, 0)
  const pickupAt = today.toISOString()

  // SDK v44: client.orders.create({ ... })
  const response = await client.orders.create({
    order: {
      locationId,
      lineItems: params.lineItems.map(item => ({
        name: item.name,
        quantity: String(item.quantity),
        basePriceMoney: {
          amount: item.basePriceMoney.amount,
          currency: 'USD',
        },
      })),
      // Include tax so POS/receipt shows correct total (fixes I3)
      taxes: [{
        uid: 'ny-sales-tax',
        name: 'NY Sales Tax',
        percentage: TAX_RATE_PERCENT,
        scope: 'ORDER',
      }],
      fulfillments: [
        {
          type: 'PICKUP',
          state: 'PROPOSED',
          pickupDetails: {
            recipient: {
              displayName: params.customerName,
              phoneNumber: params.customerPhone,
            },
            pickupAt,
            note: params.note || undefined,
          },
        },
      ],
    },
    idempotencyKey: randomUUID(),
  })

  const order = response.body?.order
  return {
    orderId: order?.id,
    version: order?.version,
  }
}

export async function updateSquareOrderFulfillment(
  orderId: string,
  fulfillmentUid: string,
  state: 'RESERVED' | 'PREPARED' | 'COMPLETED',
  version: number,
) {
  const client = getSquareClient()
  // SDK v44: client.orders.update({ orderId, ... })
  await client.orders.update({
    orderId,
    order: {
      locationId: getLocationId(),
      fulfillments: [{ uid: fulfillmentUid, state }],
      version: BigInt(version),
    },
    idempotencyKey: randomUUID(),
  })
}
