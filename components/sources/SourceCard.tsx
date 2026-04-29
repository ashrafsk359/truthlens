import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import type { SourceAlignment } from '@/types'
import { cn, getDomainFromUrl } from '@/lib/utils'

interface Props {
  source: SourceAlignment
  index?: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

const BG_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
]

export default function SourceCard({ source, index = 0 }: Props) {
  const domain = source.domain || getDomainFromUrl(source.url)
  const initials = getInitials(source.name || domain)
  const bgColor = BG_COLORS[index % BG_COLORS.length]

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
    >
      {/* Logo / initials */}
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0',
          bgColor
        )}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-medium text-gray-500">{domain}</span>
          {source.supports ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
          <span className={cn('text-xs', source.supports ? 'text-emerald-600' : 'text-red-500')}>
            {source.supports ? 'Supporting' : 'Contradicting'}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 truncate">{source.name}</p>
        {source.snippet && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{source.snippet}</p>
        )}
        {source.publishedAt && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(source.publishedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </p>
        )}
      </div>

      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
    </a>
  )
}
