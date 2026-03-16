// lib/square/types.ts
export interface SquarePaymentResult {
  paymentId: string
  orderId: string
  status: string
  receiptUrl?: string
  totalMoney: { amount: number; currency: string }
}

export interface CreateSquareOrderParams {
  lineItems: {
    name: string
    quantity: number
    basePriceMoney: { amount: bigint; currency: string }
  }[]
  pickupTime: string
  customerName: string
  customerPhone: string
  note?: string
}
