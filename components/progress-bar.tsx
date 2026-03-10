'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  current: number
  target: number
  className?: string
}

export function ProgressBar({ current, target, className }: ProgressBarProps) {
  const percent = Math.min((current / target) * 100, 100)

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percent >= 100 ? 'bg-green-500' :
            percent >= 50 ? 'bg-gold' : 'bg-muted-foreground/30'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {current} / {target} ({Math.round(percent)}%)
      </p>
    </div>
  )
}
