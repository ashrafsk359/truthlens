import { cn } from '@/lib/utils'
import type { VerdictType } from '@/types'

interface Props {
  verdict: VerdictType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getColors(verdict: VerdictType) {
  switch (verdict) {
    case 'Verified':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    case 'Likely True':
      return { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' }
    case 'Mixed / Context Needed':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' }
    case 'Misleading':
      return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' }
    case 'Unverified':
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
    case 'Likely False':
      return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' }
    case 'Disputed':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400' }
    case 'Developing Story':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500 animate-pulse' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
  }
}

export default function VerdictBadge({ verdict, size = 'md', className }: Props) {
  const c = getColors(verdict)
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full border',
      c.bg, c.text, c.border,
      size === 'sm' && 'text-xs px-2.5 py-0.5',
      size === 'md' && 'text-sm px-3 py-1',
      size === 'lg' && 'text-base px-4 py-1.5',
      className
    )}>
      <span className={cn('rounded-full flex-shrink-0', c.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {verdict}
    </span>
  )
}