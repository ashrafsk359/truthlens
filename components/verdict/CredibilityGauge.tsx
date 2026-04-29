'use client'

import { useEffect, useState } from 'react'
import { cn, getScoreColor, getScoreBarColor } from '@/lib/utils'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function CredibilityGauge({ score, size = 'md' }: Props) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 200)
    return () => clearTimeout(timer)
  }, [score])

  const label = score >= 70 ? 'High credibility' : score >= 40 ? 'Moderate credibility' : 'Low credibility'

  return (
    <div className={cn('flex flex-col gap-2', size === 'sm' && 'gap-1')}>
      <div className="flex items-center justify-between">
        <span className={cn('font-semibold tabular-nums', getScoreColor(score),
          size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'
        )}>
          {score}
        </span>
        <span className={cn('text-xs', size === 'sm' ? 'hidden' : 'text-gray-500')}>/100</span>
      </div>
      <div className={cn('w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', getScoreBarColor(score))}
          style={{ width: `${animated}%` }}
        />
      </div>
      {size !== 'sm' && (
        <p className="text-xs text-gray-500">{label}</p>
      )}
    </div>
  )
}
