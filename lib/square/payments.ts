// lib/square/payments.ts
import { getSquareClient, getLocationId } from './client'
import type { SquarePaymentResult } from './types'
import { randomUUID } from 'crypto'

export async function processPayment(
  sourceId: string,
  squareOrderId: string,
  amountCents: bigint,
): Promise<SquarePaymentResult> {
  const client = getSquareClient()

  const response = await client.paymentsApi.createPayment({
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

  const payment = response.result.payment!
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
