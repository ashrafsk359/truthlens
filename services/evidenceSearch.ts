// evidenceSearch v6 — fresh-news mode, multi-variant queries, calibrated summaries
import { detectClaimCategory, type ClaimCategory } from './aiAnalyzer'

export interface EvidenceArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  domain: string
  ageHours: number
}

export interface EvidenceResult {
  articles: EvidenceArticle[]
  evidenceText: string
  query: string
  hasFreshSources: boolean
  freshnessSummary: string
  isTimeSensitive: boolean
  isFreshMode: boolean       // NEW: flag so AI prompt knows to expect breaking-news rules
}

// ── Breaking / fresh news signal words ────────────────────────────
const FRESH_MARKERS = [
  'breaking','today','just now','just announced','just released','just confirmed',
  'hours ago','minutes ago','this morning','this evening','tonight','live',
  'developing','ongoing','latest','now','quits','quit','joins','joined',
  'resigned','resigns','fired','appointed','wins','won','loses','lost',
  'launches','launched','announces','announced','declares','declared',
  'arrested','charged','killed','dies','died','elected','passed','signed',
]

// Generic time-sensitivity (wider net — includes research/date references)
const TIME_MARKERS = [
  ...FRESH_MARKERS,
  'recently','this week','yesterday','last night',
]

export function isTimeSensitiveClaim(claim: string): boolean {
  const lower = claim.toLowerCase()
  return TIME_MARKERS.some(m => lower.includes(m))
    || /\d+\s*(hour|minute|min|hr)s?\s*ago/i.test(claim)
    || /\b(yesterday|today|tonight)\b/i.test(claim)
    || /\b202[4-9]\b/.test(claim)
}

export function isFreshNewsClaim(claim: string): boolean {
  const lower = claim.toLowerCase()
  return FRESH_MARKERS.some(m => lower.includes(m))
    || /\d+\s*(hour|minute|min|hr)s?\s*ago/i.test(claim)
}

// ── Stop words ─────────────────────────────────────────────────────
const STOP = new Set([
  'the','a','an','is','are','was','were','be','have','has','had',
  'do','does','did','will','would','could','should','may','might','can',
  'and','but','or','in','on','at','by','for','with','to','of','as',
  'this','that','these','those','it','its','just','now',
  'today','yesterday','tonight','recently','breaking','latest','hours','minutes',
])

export function buildSearchQuery(claim: string): string {
  return claim
    .replace(/[?!.,;:'"]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))
    .slice(0, 7)
    .join(' ')
}

// ── Multi-variant query builder for fresh/breaking claims ──────────
// Generates 2-3 alternate search phrases to maximise retrieval coverage
function buildFreshQueryVariants(claim: string): string[] {
  const base    = buildSearchQuery(claim)
  const words   = base.split(' ')
  const queries = [base]

  // Variant 1: base + "latest news"
  queries.push(`${base} latest news`)

  // Variant 2: first 4 meaningful words + "today"
  if (words.length >= 4) {
    queries.push(`${words.slice(0, 4).join(' ')} today`)
  }

  // Variant 3: if claim mentions a person + action, try name + topic only
  // e.g. "Raghav Chadha quits AAP joins BJP" → "Raghav Chadha BJP"
  const nameMatch = claim.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/)
  if (nameMatch) {
    const actionWords = words.filter(w => !nameMatch[1].toLowerCase().includes(w.toLowerCase()))
    queries.push(`${nameMatch[1]} ${actionWords.slice(0, 3).join(' ')}`)
  }

  return Array.from(new Set(queries)).slice(0, 3)
}

// ── Research claim query expansion (unchanged from v5) ─────────────
function buildResearchQueries(claim: string, category: ClaimCategory): string[] {
  const base    = buildSearchQuery(claim)
  const queries = [base]
  const nums    = (claim.match(/\d[\d,.]*/g) || []).slice(0, 2).join(' ')

  switch (category) {
    case 'scientific_study':
      queries.push(`${base} study research evidence`)
      queries.push(`${base} health science findings`)
      if (nums) queries.push(`${base} ${nums} percent study`)
      break
    case 'technical_advice':
      queries.push(`${base} guide explanation`)
      queries.push(`${base} technical documentation`)
      break
    case 'environmental_metric':
      queries.push(`${base} resource consumption data`)
      if (nums) queries.push(`${base} ${nums} litres water`)
      break
    case 'economic_business':
      queries.push(`${base} productivity study results`)
      break
    case 'policy_historical':
      queries.push(`${base} official data government report`)
      break
  }
  return Array.from(new Set(queries)).slice(0, 3)
}

// ── Freshness helpers ──────────────────────────────────────────────
function ageHours(ts: string): number {
  if (!ts) return 9999
  try { return (Date.now() - new Date(ts).getTime()) / 3_600_000 }
  catch { return 9999 }
}

function fmtAge(h: number): string {
  if (h < 1)   return '<1h ago'
  if (h < 24)  return `${Math.floor(h)}h ago`
  if (h < 168) return `${Math.floor(h / 24)}d ago`
  return `${Math.floor(h / 168)}w ago`
}

// ── API fetchers ───────────────────────────────────────────────────
async function fetchNewsAPI(
  query: string, key: string,
  maxAgeHours = 0   // 0 = no limit, >0 = restrict to that many hours
): Promise<EvidenceArticle[]> {
  const params: Record<string, string> = {
    q: query, sortBy: 'publishedAt', pageSize: '6', language: 'en', apiKey: key,
  }
  if (maxAgeHours > 0) {
    params.from = new Date(Date.now() - maxAgeHours * 3_600_000)
      .toISOString().split('T')[0]
  }
  const res = await fetch(
    `https://newsapi.org/v2/everything?${new URLSearchParams(params)}`,
    { signal: AbortSignal.timeout(6000) }
  )
  if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
  const d = await res.json() as {
    articles: Array<{ title: string; description: string; url: string; source: { name: string }; publishedAt: string }>
  }
  return (d.articles || []).map(a => ({
    title: a.title, description: a.description || '',
    url: a.url, source: a.source?.name || '',
    publishedAt: a.publishedAt || '',
    domain: (() => { try { return new URL(a.url).hostname.replace('www.', '') } catch { return '' } })(),
    ageHours: ageHours(a.publishedAt),
  }))
}

async function fetchGNews(query: string, key: string): Promise<EvidenceArticle[]> {
  const res = await fetch(
    `https://gnews.io/api/v4/search?${new URLSearchParams({ q: query, lang: 'en', max: '6', token: key, sortby: 'publishedAt' })}`,
    { signal: AbortSignal.timeout(6000) }
  )
  if (!res.ok) throw new Error(`GNews ${res.status}`)
  const d = await res.json() as {
    articles: Array<{ title: string; description: string; url: string; source: { name: string }; publishedAt: string }>
  }
  return (d.articles || []).map(a => ({
    title: a.title, description: a.description || '',
    url: a.url, source: a.source?.name || '',
    publishedAt: a.publishedAt || '',
    domain: (() => { try { return new URL(a.url).hostname.replace('www.', '') } catch { return '' } })(),
    ageHours: ageHours(a.publishedAt),
  }))
}

function dedupe(articles: EvidenceArticle[]): EvidenceArticle[] {
  const seen = new Set<string>()
  return articles.filter(a => { if (seen.has(a.url)) return false; seen.add(a.url); return true })
}

// ── In-memory cache ────────────────────────────────────────────────
const cache = new Map<string, { result: EvidenceResult; ts: number }>()

export async function searchEvidence(claim: string): Promise<EvidenceResult> {
  const freshMode     = isFreshNewsClaim(claim)
  const timeSensitive = freshMode || isTimeSensitiveClaim(claim)
  const category      = detectClaimCategory(claim)
  const isResearch    = ['scientific_study','technical_advice','environmental_metric','economic_business'].includes(category)

  // Shorter cache for fresh/breaking claims (60s), medium for research (10m), default 5m
  const CACHE_TTL = freshMode ? 45_000 : timeSensitive ? 60_000 : isResearch ? 10 * 60_000 : 5 * 60_000
  const baseQuery = buildSearchQuery(claim)
  const cacheKey  = `${baseQuery}__${freshMode ? 'fresh' : category}`

  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.result

  const newsKey  = process.env.NEWS_API_KEY
  const gnewsKey = process.env.GNEWS_API_KEY
  let   articles: EvidenceArticle[] = []

  // ── FRESH NEWS MODE ────────────────────────────────────────────
  if (freshMode) {
    const variants = buildFreshQueryVariants(claim)

    // Stage 1: Last 24h with first variant
    try {
      if (newsKey) {
        articles = await fetchNewsAPI(variants[0], newsKey, 24)
      } else if (gnewsKey) {
        articles = await fetchGNews(variants[0], gnewsKey)
      }
    } catch { articles = [] }

    // Stage 2: If < 3 hits in 24h, widen to 48h with more variants
    if (articles.length < 3) {
      for (const q of variants.slice(1)) {
        if (articles.length >= 5) break
        try {
          const extras = newsKey
            ? await fetchNewsAPI(q, newsKey, 48)
            : gnewsKey ? await fetchGNews(q, gnewsKey) : []
          articles = dedupe([...articles, ...extras])
        } catch { /* continue */ }
      }
    }

    // Stage 3: Last resort — no date filter, all variants
    if (articles.length === 0) {
      for (const q of variants) {
        try {
          const extras = newsKey
            ? await fetchNewsAPI(q, newsKey, 0)
            : gnewsKey ? await fetchGNews(q, gnewsKey) : []
          articles = dedupe([...articles, ...extras])
          if (articles.length >= 3) break
        } catch { /* continue */ }
      }
    }

  // ── RESEARCH / NUMERIC MODE ────────────────────────────────────
  } else if (isResearch) {
    try {
      if (newsKey)  articles = await fetchNewsAPI(baseQuery, newsKey, 0)
      else if (gnewsKey) articles = await fetchGNews(baseQuery, gnewsKey)
    } catch { articles = [] }

    if (articles.length < 3) {
      const expanded = buildResearchQueries(claim, category).slice(1)
      for (const q of expanded) {
        if (articles.length >= 5) break
        try {
          const extras = newsKey
            ? await fetchNewsAPI(q, newsKey, 0)
            : gnewsKey ? await fetchGNews(q, gnewsKey) : []
          articles = dedupe([...articles, ...extras])
        } catch { /* continue */ }
      }
    }

  // ── STANDARD MODE ──────────────────────────────────────────────
  } else {
    try {
      if (newsKey)  articles = await fetchNewsAPI(baseQuery, newsKey, timeSensitive ? 168 : 0)
      else if (gnewsKey) articles = await fetchGNews(baseQuery, gnewsKey)
    } catch { articles = [] }
  }

  // Sort freshest first
  articles.sort((a, b) => a.ageHours - b.ageHours)

  const hasFresh  = articles.some(a => a.ageHours < 168)
  const freshest  = articles[0]

  // ── Freshness summary — calibrated wording per mode ────────────
  let freshnessSummary: string
  if (freshMode && articles.length === 0) {
    freshnessSummary = 'No reliable recent reporting found for this claim. It may be very new, unverified, or not yet widely covered.'
  } else if (freshMode && freshest && freshest.ageHours < 6) {
    freshnessSummary = `Breaking coverage found — sources from the past ${Math.round(freshest.ageHours) || 1} hour(s).`
  } else if (freshMode && freshest && freshest.ageHours < 24) {
    freshnessSummary = 'Sources from the past 24 hours retrieved.'
  } else if (freshMode && freshest) {
    freshnessSummary = 'Recent sources found, though story may still be developing.'
  } else if (!articles.length) {
    freshnessSummary = isResearch
      ? 'No recent news coverage found. This is common for research/statistical claims — AI will use training knowledge.'
      : 'No web sources retrieved.'
  } else if (freshest.ageHours < 6) {
    freshnessSummary = 'Sources from the past 6 hours.'
  } else if (freshest.ageHours < 24) {
    freshnessSummary = 'Sources from past 24 hours.'
  } else if (freshest.ageHours < 168) {
    freshnessSummary = 'Sources from past week.'
  } else {
    freshnessSummary = 'Sources available but may not reflect the very latest developments.'
  }

  // ── Evidence text with mode-specific AI instruction ────────────
  const freshModeNote = freshMode
    ? `FRESH NEWS MODE ACTIVE: This is a breaking or very recent claim.
RULES:
- If multiple sources confirm: verdict = "Likely True" or "Verified", score 65-80
- If story is emerging with 1-2 sources: verdict = "Developing Story", score 40-55
- If no sources confirm but claim is plausible: verdict = "Developing Story" or "Unverified", score 35-50
- If sources actively deny the claim: verdict = "Likely False", score 20-35
- NEVER give "Developing Story" a score below 35
- Do NOT say "no evidence exists" — say "no reliable recent reporting currently confirms this claim"\n\n`
    : ''

  const researchNote = isResearch && articles.length < 3 && !freshMode
    ? `NOTE: This is a ${category.replace('_', ' ')} claim. Limited news coverage is normal. Use training knowledge with calibrated confidence.\n\n`
    : ''

  const evidenceText = freshModeNote + researchNote + (articles.length
    ? articles.map((a, i) =>
        `[${i + 1}] ${a.source} (${fmtAge(a.ageHours)}): ${a.title}. ${a.description}`
      ).join('\n')
    : freshMode
      ? 'No news sources retrieved for this claim. It may be too recent, false, or not yet widely reported.'
      : 'No news articles retrieved.'
  )

  const result: EvidenceResult = {
    articles, evidenceText, query: baseQuery,
    hasFreshSources: hasFresh, freshnessSummary,
    isTimeSensitive: timeSensitive,
    isFreshMode: freshMode,
  }

  cache.set(cacheKey, { result, ts: Date.now() })
  return result
}
