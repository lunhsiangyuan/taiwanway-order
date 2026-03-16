// lib/square/orders.ts
import { getSquareClient, getLocationId } from './client'
import type { CreateSquareOrderParams } from './types'
import { randomUUID } from 'crypto'

export async function createSquareOrder(params: CreateSquareOrderParams) {
  const client = getSquareClient()
  const locationId = getLocationId()

  // Convert pickup time string (HH:MM) to ISO 8601 for today
  const today = new Date()
  const [hh, mm] = params.pickupTime.split(':')
  today.setHours(Number(hh), Number(mm), 0, 0)
  const pickupAt = today.toISOString()

  const idempotencyKey = randomUUID()
  const response = await client.ordersApi.createOrder({
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
    idempotencyKey,
  })

  return {
    orderId: response.result.order?.id,
    version: response.result.order?.version,
  }
}

export async function updateSquareOrderFulfillment(
  orderId: string,
  fulfillmentUid: string,
  state: 'RESERVED' | 'PREPARED' | 'COMPLETED',
  version: number,
) {
  const client = getSquareClient()
  await client.ordersApi.updateOrder(orderId, {
    order: {
      locationId: getLocationId(),
      fulfillments: [{ uid: fulfillmentUid, state }],
      version: BigInt(version),
    },
    idempotencyKey: randomUUID(),
  })
}
