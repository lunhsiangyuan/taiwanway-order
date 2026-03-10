'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'

export function CountdownTimer({ deadline }: { deadline: string }) {
  const { t } = useLanguage()
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      setDaysLeft(diff > 0 ? Math.ceil(diff / 86400000) : 0)
    }
    calc()
    const timer = setInterval(calc, 60000)
    return () => clearInterval(timer)
  }, [deadline])

  if (daysLeft === null) return null

  return (
    <span className="text-sm font-medium">
      {daysLeft > 0 ? `${daysLeft} ${t('groupBuy.daysLeft')}` : t('groupBuy.closed')}
    </span>
  )
}
