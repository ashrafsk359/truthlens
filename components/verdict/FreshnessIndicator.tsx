import { cn } from '@/lib/utils'
import type { Freshness } from '@/types'
import { Zap, Clock, RefreshCw, HelpCircle } from 'lucide-react'

interface Props {
  freshness: Freshness
  note?: string
  className?: string
}

const CONFIG: Record<Freshness, {
  label: string
  icon: React.ElementType
  bg: string
  text: string
  dot: string
}> = {
  Recent:   { label: 'Recent sources',   icon: RefreshCw, bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Breaking: { label: 'Breaking story',   icon: Zap,       bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500 animate-pulse' },
  Mixed:    { label: 'Mixed coverage',   icon: Clock,     bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
  Unknown:  { label: 'Limited sources',  icon: HelpCircle,bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
}

export default function FreshnessIndicator({ freshness, note, className }: Props) {
  const c = CONFIG[freshness] || CONFIG.Unknown
  const Icon = c.icon
  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', c.bg, c.text)}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot)} />
        <Icon className="w-3 h-3" />
        {c.label}
      </div>
      {note && (
        <p className="text-xs text-gray-400 px-1">{note}</p>
      )}
    </div>
  )
}
