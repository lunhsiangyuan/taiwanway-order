// lib/square/payments.ts — Square SDK v44 (client.payments.create)
import { getSquareClient, getLocationId } from './client'
import type { SquarePaymentResult } from './types'
import { randomUUID } from 'crypto'

export async function processPayment(
  sourceId: string,
  squareOrderId: string,
  amountCents: bigint,
): Promise<SquarePaymentResult> {
  const client = getSquareClient()

  // SDK v44: client.payments.create({ ... })
  const response = await client.payments.create({
    sourceId,
    idempotencyKey: randomUUID(),
    amountMoney: {
      amount: amountCents,
      currency: 'USD',
    },
    orderId: squareOrderId,
    locationId: getLocationId(),
    autocomplete: true,
  })

  const payment = response.body?.payment
  if (!payment) throw new Error('No payment returned from Square')
  return {
    paymentId: payment.id!,
    orderId: payment.orderId!,
    status: payment.status!,
    receiptUrl: payment.receiptUrl,
    totalMoney: {
      amount: Number(payment.totalMoney!.amount!),
      currency: payment.totalMoney!.currency!,
    },
  }
}
