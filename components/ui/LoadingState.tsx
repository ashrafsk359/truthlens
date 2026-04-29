'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Detecting input type',      ms: 500  },
  { id: 2, label: 'Extracting content',         ms: 900  },
  { id: 3, label: 'Searching recent sources',   ms: 1400 },
  { id: 4, label: 'Comparing evidence',         ms: 1800 },
  { id: 5, label: 'Generating verdict',         ms: 1400 },
  { id: 6, label: 'Preparing links & result',   ms: 400  },
]

export default function LoadingState() {
  const [step, setStep]   = useState(1)
  const [done, setDone]   = useState<number[]>([])

  useEffect(() => {
    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((s, i) => {
      elapsed += s.ms
      const t = setTimeout(() => {
        setDone(p => [...p, s.id])
        if (i < STEPS.length - 1) setStep(s.id + 1)
      }, elapsed)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col items-center py-14 px-4">
      <div className="relative mb-8">
        <div className="w-14 h-14 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-2 border-2 border-transparent border-t-indigo-200 rounded-full animate-spin"
          style={{ animationDuration: '1.6s', animationDirection: 'reverse' }} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Analyzing claim</h3>
      <p className="text-sm text-gray-400 mb-8">Searching recent sources + running AI analysis</p>
      <div className="w-full max-w-xs space-y-3">
        {STEPS.map(s => {
          const isDone   = done.includes(s.id)
          const isActive = step === s.id && !isDone
          return (
            <div key={s.id} className={cn('flex items-center gap-3 transition-all duration-300',
              isDone ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-20'
            )}>
              {isDone
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                    isActive ? 'border-indigo-500 bg-indigo-50 animate-pulse' : 'border-gray-200'
                  )} />
              }
              <span className={cn('text-sm transition-colors',
                isDone   ? 'text-emerald-600 line-through decoration-emerald-200'
                : isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
              )}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
