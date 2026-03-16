'use client'

import { CreditCard, Banknote } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'

export type PaymentMethod = 'card' | 'cash'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  const { language } = useLanguage()

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">
        {language === 'zh' ? '付款方式' : 'Payment Method'}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={selected === 'card' ? 'default' : 'outline'}
          className="h-auto flex-col gap-1 py-3"
          onClick={() => onSelect('card')}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs">{language === 'zh' ? '信用卡' : 'Credit Card'}</span>
        </Button>
        <Button
          type="button"
          variant={selected === 'cash' ? 'default' : 'outline'}
          className="h-auto flex-col gap-1 py-3"
          onClick={() => onSelect('cash')}
        >
          <Banknote className="h-5 w-5" />
          <span className="text-xs">{language === 'zh' ? '到店付現' : 'Pay Cash'}</span>
        </Button>
      </div>
    </div>
  )
}
