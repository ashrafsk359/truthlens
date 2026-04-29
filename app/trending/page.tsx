'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Search, ExternalLink, RefreshCw, Newspaper,
  Globe, Cpu, Heart, Briefcase, AlertCircle, Clock, Zap, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QuickCheckModal from '@/components/ui/QuickCheckModal'

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  publishedMs: number
  domain: string
  imageUrl: string
  ageHours: number
}

interface TrendingData {
  latest:     NewsItem[]
  headlines:  NewsItem[]
  fetchedAt:  string
  source:     string
  cached?:    boolean
}

const CATEGORIES = [
  { id: 'india',      label: 'India',      icon: Globe },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'business',   label: 'Business',   icon: Briefcase },
  { id: 'health',     label: 'Health',     icon: Heart },
  { id: 'world',      label: 'World',      icon: Newspaper },
]

// Client-side cache — 90 seconds only so the page feels live
const clientCache = new Map<string, { data: TrendingData; ts: number }>()
const CLIENT_TTL  = 90 * 1000

// ── Time formatting — runs client-side only to respect local TZ ───
function useRelativeTime(isoString: string): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function compute() {
      if (!isoString) { setLabel(''); return }
      try {
        const pubMs  = new Date(isoString).getTime()
        if (isNaN(pubMs)) { setLabel(''); return }
        const diffMs = Date.now() - pubMs
        const diffS  = diffMs / 1000
        const diffM  = diffS / 60
        const diffH  = diffM / 60
        const diffD  = diffH / 24

        if (diffS < 30)           setLabel('just now')
        else if (diffM < 2)       setLabel('1 minute ago')
        else if (diffM < 60)      setLabel(`${Math.floor(diffM)} minutes ago`)
        else if (diffH < 2)       setLabel('1 hour ago')
        else if (diffH < 24)      setLabel(`${Math.floor(diffH)} hours ago`)
        else if (diffD < 2)       setLabel('Yesterday')
        else                      setLabel(`${Math.floor(diffD)} days ago`)
      } catch { setLabel('') }
    }
    compute()
    const timer = setInterval(compute, 60_000)  // update every minute
    return () => clearInterval(timer)
  }, [isoString])

  return label
}

// Urgency color based on age
function ageColor(ageHours: number): string {
  if (ageHours <= 2)  return 'text-emerald-600 bg-emerald-50'
  if (ageHours <= 6)  return 'text-blue-600 bg-blue-50'
  if (ageHours <= 12) return 'text-indigo-600 bg-indigo-50'
  if (ageHours <= 24) return 'text-amber-600 bg-amber-50'
  return 'text-gray-500 bg-gray-100'
}

function TimeLabel({ publishedAt, ageHours }: { publishedAt: string; ageHours: number }) {
  const label = useRelativeTime(publishedAt)
  if (!label) return null
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0', ageColor(ageHours))}>
      <Clock className="w-2.5 h-2.5" />{label}
    </span>
  )
}

function UpdatedLabel({ fetchedAt }: { fetchedAt: string }) {
  const label = useRelativeTime(fetchedAt)
  if (!label) return null
  return (
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>updated {label}</span>
  )
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, overflow: 'hidden' }}>
      <div className="skeleton h-36 w-full" />
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <div className="skeleton h-3 w-20 rounded-full" />
          <div className="skeleton h-3 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="flex gap-2 mt-3">
          <div className="skeleton h-7 w-16 rounded-lg" />
          <div className="skeleton h-7 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function NewsCard({ item, featured = false, onFactCheck }: { item: NewsItem; featured?: boolean; onFactCheck: (title: string, url: string) => void }) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div className={cn(
      'rounded-xl overflow-hidden transition-all group flex flex-col',
      'hover:shadow-md cursor-default',
      featured && 'border-indigo-100'
    )}>
      {/* Thumbnail */}
      {item.imageUrl && !imgErr ? (
        <div className={cn('bg-gray-100 overflow-hidden flex-shrink-0', featured ? 'h-48' : 'h-36')}>
          <img src={item.imageUrl} alt="" loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            onError={() => setImgErr(true)} />
        </div>
      ) : (
        // Color bar based on age for visual freshness cue
        <div className={cn('h-1 flex-shrink-0',
          item.ageHours <= 2  ? 'bg-emerald-500' :
          item.ageHours <= 6  ? 'bg-blue-500' :
          item.ageHours <= 12 ? 'bg-indigo-400' :
          item.ageHours <= 24 ? 'bg-amber-400' : 'bg-gray-300'
        )} />
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Source + time */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
            {item.source || item.domain}
          </span>
          <TimeLabel publishedAt={item.publishedAt} ageHours={item.ageHours} />
        </div>

        {/* Title */}
        <p className={cn(
          'font-semibold text-gray-800 leading-snug mb-2 group-hover:text-indigo-700 transition-colors flex-1',
          featured ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2'
        )}>
          {item.title}
        </p>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto flex-wrap">
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
            <ExternalLink className="w-3 h-3" /> Read
          </a>
          <button onClick={() => onFactCheck(item.title, item.url)}
            className="flex items-center gap-1.5 px-3 py-1.5 active:scale-95 transition-all"
            style={{ background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.2)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--signal-indigo)', cursor: 'pointer' }}>
            <Search className="w-3 h-3" /> Fact-check
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, count, color }: {
  icon: React.ElementType; title: string; count: number; color: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {count > 0 && (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  )
}

export default function TrendingPage() {
  const [activeCat, setCat]      = useState('india')
  const [data,      setData]     = useState<TrendingData | null>(null)
  const [loading,   setLoading]  = useState(true)
  const [error,     setError]    = useState('')
  const [quickCheck,setQuickCheck] = useState<{ title: string; url: string } | null>(null)
  const abortRef   = useRef<AbortController | null>(null)
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadNews = useCallback(async (cat: string, force = false) => {
    // Client cache check
    if (!force) {
      const hit = clientCache.get(cat)
      if (hit && Date.now() - hit.ts < CLIENT_TTL) {
        setData(hit.data); setLoading(false); return
      }
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    if (force) setLoading(false)  // silent refresh — don't show skeleton
    else setLoading(true)
    setError('')

    try {
      const url  = `/api/trending?category=${encodeURIComponent(cat)}${force ? '&force=1' : ''}`
      const res  = await fetch(url, { signal: abortRef.current.signal })
      const json = await res.json() as TrendingData & { error?: string }

      if (json.error) { setError(json.error); setLoading(false); return }

      const hasContent = json.latest?.length > 0 || json.headlines?.length > 0
      if (hasContent) {
        clientCache.set(cat, { data: json, ts: Date.now() })
        setData(json)
      } else {
        setError('No recent articles found. Try refreshing.')
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Failed to load news. Please try again.')
      }
    }
    setLoading(false)
  }, [])

  // Initial load + auto-refresh every 3 minutes
  useEffect(() => {
    loadNews(activeCat)
    refreshRef.current = setInterval(() => loadNews(activeCat, true), 3 * 60 * 1000)
    return () => {
      clearInterval(refreshRef.current!)
      abortRef.current?.abort()
    }
  }, [activeCat, loadNews])

  function handleCategoryChange(cat: string) {
    setCat(cat)
    setData(null)
    setError('')
  }

  function handleRefresh() {
    clientCache.delete(activeCat)
    loadNews(activeCat, true)
    setLoading(true)
  }

  const hasLatest    = (data?.latest?.length    ?? 0) > 0
  const hasHeadlines = (data?.headlines?.length ?? 0) > 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-medium text-gray-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Trending News
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500">Click any story to fact-check it instantly</p>
            {data?.fetchedAt && <UpdatedLabel fetchedAt={data.fetchedAt} />}
          </div>
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 active:scale-95 transition-all whitespace-nowrap">
          <RefreshCw className={cn('w-3.5 h-3.5 transition-transform', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => handleCategoryChange(id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border active:scale-95',
              activeCat === id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            )}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Could not load news</p>
            <p className="text-xs text-amber-700 mt-0.5">{error}</p>
            <button onClick={handleRefresh} className="text-xs text-amber-700 underline mt-1">Retry</button>
          </div>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && (
        <div className="space-y-8">
          <div>
            <div className="skeleton h-5 w-36 rounded mb-4" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
          <div>
            <div className="skeleton h-5 w-32 rounded mb-4" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div className="space-y-10">
          {/* Latest Now — articles < 12h */}
          {hasLatest && (
            <section>
              <SectionHeader
                icon={Zap}
                title="Latest now"
                count={data.latest.length}
                color="bg-emerald-100 text-emerald-700"
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                {data.latest.map((item, i) => (
                  <NewsCard key={`latest-${item.url}-${i}`} item={item} onFactCheck={(title, url) => setQuickCheck({ title, url })} />
                ))}
              </div>
            </section>
          )}

          {/* Top Headlines — articles < 48h */}
          {hasHeadlines && (
            <section>
              <SectionHeader
                icon={Star}
                title="Top headlines"
                count={data.headlines.length}
                color="bg-indigo-100 text-indigo-700"
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                {data.headlines.map((item, i) => (
                  <NewsCard key={`headline-${item.url}-${i}`} item={item} featured={i === 0} onFactCheck={(title, url) => setQuickCheck({ title, url })} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!hasLatest && !hasHeadlines && !error && (
            <div className="py-16 text-center">
              <Newspaper className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">No recent articles found</p>
              <p className="text-xs text-gray-400 mb-4">RSS feeds may be temporarily unavailable.</p>
              <button onClick={handleRefresh}
                className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      {!loading && (hasLatest || hasHeadlines) && (
        <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Have a claim to verify?</p>
            <p className="text-xs text-indigo-600 mt-0.5">Paste any headline, URL, or text for an AI verdict.</p>
          </div>
                {/* Quick Check Modal */}
      {quickCheck && (
        <QuickCheckModal
          title={quickCheck.title}
          url={quickCheck.url}
          onClose={() => setQuickCheck(null)}
        />
      )}
          <Link href="/check"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex-shrink-0">
            <Search className="w-3.5 h-3.5" /> Check a claim
          </Link>
        </div>
      )}
    </div>
  )
}
