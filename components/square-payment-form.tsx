'use client'

import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk'
import { useLanguage } from '@/lib/i18n/language-context'
import { useState } from 'react'

interface SquarePaymentFormProps {
  applicationId: string
  locationId: string
  onPaymentNonce: (nonce: string) => void
  onError: (error: string) => void
  disabled?: boolean
  amount: number
}

export function SquarePaymentForm({
  applicationId,
  locationId,
  onPaymentNonce,
  onError,
  disabled,
  amount,
}: SquarePaymentFormProps) {
  const { language } = useLanguage()
  const [processing, setProcessing] = useState(false)

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h3 className="mb-3 font-semibold">
        {language === 'zh' ? '信用卡付款' : 'Credit Card Payment'}
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        {language === 'zh'
          ? `將收取 $${amount.toFixed(2)}（含稅）`
          : `You will be charged $${amount.toFixed(2)} (tax included)`}
      </p>
      <PaymentForm
        applicationId={applicationId}
        locationId={locationId}
        cardTokenizeResponseReceived={(token) => {
          if (token.status === 'OK') {
            setProcessing(true)
            onPaymentNonce(token.token)
          } else if (token.status === 'Error' || token.status === 'Invalid') {
            onError(token.errors.map((e) => e.message).join(', '))
            setProcessing(false)
          }
        }}
        createPaymentRequest={() => ({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: String(amount), label: 'TaiwanWay Order' },
        })}
      >
        <CreditCard
          buttonProps={{
            isLoading: processing || disabled,
          }}
        />
      </PaymentForm>
    </div>
  )
}
