import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'  // never statically cache this route

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string       // always ISO 8601 UTC
  publishedMs: number       // Unix ms — reliable for sorting/filtering
  domain: string
  imageUrl: string
  ageHours: number          // computed at fetch time
}

interface TrendingResponse {
  latest: NewsItem[]        // past 12h, sorted newest first
  headlines: NewsItem[]     // past 48h by relevance/popularity
  fetchedAt: string         // UTC ISO — client uses this to show "updated X ago"
  source: string
}

// ── Server cache: 2 min TTL (short so news feels live) ─────────────
const cache = new Map<string, { data: TrendingResponse; ts: number }>()
const CACHE_TTL = 2 * 60 * 1000

// ── RSS feeds — multiple per category for coverage breadth ─────────
const RSS_FEEDS: Record<string, { url: string; weight: number }[]> = {
  india: [
    { url: 'https://feeds.feedburner.com/ndtvnews-india-news',           weight: 2 },
    { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', weight: 2 },
    { url: 'https://www.thehindu.com/news/national/feeder/default.rss',  weight: 2 },
    { url: 'https://indianexpress.com/feed/',                            weight: 1 },
    { url: 'https://feeds.feedburner.com/NDTV-LatestNews',              weight: 3 },
  ],
  technology: [
    { url: 'https://feeds.feedburner.com/ndtvnews-tech',                 weight: 2 },
    { url: 'https://techcrunch.com/feed/',                               weight: 3 },
    { url: 'https://feeds.arstechnica.com/arstechnica/index',            weight: 2 },
    { url: 'https://www.wired.com/feed/rss',                             weight: 1 },
  ],
  business: [
    { url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',   weight: 3 },
    { url: 'https://feeds.feedburner.com/fortuneindia',                  weight: 1 },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',            weight: 2 },
  ],
  health: [
    { url: 'https://www.who.int/rss-feeds/news-english.xml',             weight: 2 },
    { url: 'https://feeds.feedburner.com/ndtvnews-health',               weight: 2 },
    { url: 'https://feeds.bbci.co.uk/news/health/rss.xml',              weight: 3 },
  ],
  world: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',               weight: 3 },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',    weight: 2 },
    { url: 'https://feeds.bbci.co.uk/news/rss.xml',                     weight: 2 },
  ],
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return '' }
}

// Normalise any date string → UTC ms (handles RSS quirks)
function toMs(dateStr: string): number {
  if (!dateStr) return 0
  try {
    // RSS dates sometimes come without timezone — assume UTC
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.getTime()
    // Try adding 'UTC' suffix for bare formats like "Mon, 01 Jan 2024 12:00:00"
    const d2 = new Date(dateStr + ' UTC')
    return isNaN(d2.getTime()) ? 0 : d2.getTime()
  } catch { return 0 }
}

function toIso(ms: number): string {
  return ms ? new Date(ms).toISOString() : new Date().toISOString()
}

// rss2json with _t buster so it doesn't serve its own stale cache
async function fetchRSS(feedUrl: string): Promise<NewsItem[]> {
  const bust = Math.floor(Date.now() / (2 * 60 * 1000)) // changes every 2 min
  const api  = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10&_t=${bust}`
  const res  = await fetch(api, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
  if (!res.ok) throw new Error(`rss2json ${res.status} for ${feedUrl}`)

  const d = await res.json() as {
    status: string
    feed:  { title: string }
    items: Array<{
      title: string; description: string; link: string
      pubDate: string; thumbnail?: string
      enclosure?: { link: string; type?: string }
      content?: string
    }>
  }
  if (d.status !== 'ok') throw new Error(`rss2json not ok for ${feedUrl}`)

  const feedName = (d.feed?.title || getDomain(feedUrl))
    .replace(/ - RSS Feed$| RSS$/, '').trim()

  const now = Date.now()

  return (d.items || []).map(item => {
    // Clean description
    const desc = (item.description || item.content || '')
      .replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().substring(0, 240)

    // Best image: prefer thumbnail, then enclosure if it's an image
    const encImg = item.enclosure?.type?.startsWith('image') ? item.enclosure.link : ''
    const imageUrl = item.thumbnail || encImg || ''

    const pubMs  = toMs(item.pubDate)
    const ageH   = pubMs ? (now - pubMs) / 3_600_000 : 9999

    return {
      title:       (item.title || '').replace(/<[^>]+>/g, '').trim(),
      description: desc,
      url:         item.link || '',
      source:      feedName,
      publishedAt: pubMs ? toIso(pubMs) : new Date().toISOString(),
      publishedMs: pubMs,
      domain:      getDomain(item.link || ''),
      imageUrl,
      ageHours:    ageH,
    }
  }).filter(i => i.title && i.url && i.publishedMs > 0)
}

async function fetchNewsAPI(query: string, key: string): Promise<NewsItem[]> {
  const now  = Date.now()
  // Last 48h from param
  const from = new Date(now - 48 * 3_600_000).toISOString().split('T')[0]
  const p    = new URLSearchParams({
    q: query, sortBy: 'publishedAt', pageSize: '15',
    language: 'en', apiKey: key, from,
  })
  const res = await fetch(`https://newsapi.org/v2/everything?${p}`,
    { signal: AbortSignal.timeout(8000), cache: 'no-store' })
  if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
  const d = await res.json() as {
    articles: Array<{
      title: string; description: string; url: string
      urlToImage: string; source: { name: string }; publishedAt: string
    }>
  }
  return (d.articles || []).map(a => {
    const pubMs = toMs(a.publishedAt)
    return {
      title: a.title || '', description: a.description || '',
      url: a.url || '', source: a.source?.name || '',
      publishedAt: pubMs ? toIso(pubMs) : a.publishedAt,
      publishedMs: pubMs,
      domain: getDomain(a.url || ''),
      imageUrl: a.urlToImage || '',
      ageHours: pubMs ? (now - pubMs) / 3_600_000 : 9999,
    }
  }).filter(a => a.title && a.url && a.publishedMs > 0)
}

async function fetchGNews(query: string, key: string): Promise<NewsItem[]> {
  const now = Date.now()
  const p   = new URLSearchParams({ q: query, lang: 'en', max: '15', token: key, sortby: 'publishedAt' })
  const res = await fetch(`https://gnews.io/api/v4/search?${p}`,
    { signal: AbortSignal.timeout(8000), cache: 'no-store' })
  if (!res.ok) throw new Error(`GNews ${res.status}`)
  const d = await res.json() as {
    articles: Array<{
      title: string; description: string; url: string
      image: string; source: { name: string }; publishedAt: string
    }>
  }
  return (d.articles || []).map(a => {
    const pubMs = toMs(a.publishedAt)
    return {
      title: a.title || '', description: a.description || '',
      url: a.url || '', source: a.source?.name || '',
      publishedAt: pubMs ? toIso(pubMs) : a.publishedAt,
      publishedMs: pubMs,
      domain: getDomain(a.url || ''),
      imageUrl: a.image || '',
      ageHours: pubMs ? (now - pubMs) / 3_600_000 : 9999,
    }
  }).filter(a => a.title && a.url && a.publishedMs > 0)
}

// ── Split into Latest Now (<12h) and Headlines (<48h) ──────────────
function splitAndFilter(all: NewsItem[]): { latest: NewsItem[]; headlines: NewsItem[] } {
  // Remove duplicates by URL
  const seen = new Set<string>()
  const unique = all.filter(a => { if (seen.has(a.url)) return false; seen.add(a.url); return true })

  // Sort by newest first
  unique.sort((a, b) => b.publishedMs - a.publishedMs)

  const latest    = unique.filter(a => a.ageHours <= 12).slice(0, 8)
  const headlines = unique.filter(a => a.ageHours <= 48).slice(0, 12)

  // If nothing fresh enough, relax threshold progressively
  if (latest.length === 0 && unique.length > 0) {
    // Fill latest with whatever is freshest
    const freshest = unique.slice(0, 4)
    return { latest: freshest, headlines: unique.slice(0, 12) }
  }

  return { latest, headlines }
}

export async function GET(req: NextRequest) {
  const category = (req.nextUrl.searchParams.get('category') || 'india').toLowerCase()
  const force    = req.nextUrl.searchParams.get('force') === '1'

  // Serve cache unless force-refresh
  if (!force) {
    const hit = cache.get(category)
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return NextResponse.json({ ...hit.data, cached: true })
    }
  }

  const newsKey  = process.env.NEWS_API_KEY
  const gnewsKey = process.env.GNEWS_API_KEY

  const QUERIES: Record<string, string> = {
    india:      'India news',
    technology: 'technology news',
    business:   'business economy news',
    health:     'health news',
    world:      'world news',
  }
  const query = QUERIES[category] || `${category} news`

  let allArticles: NewsItem[] = []
  let source = 'rss'

  // Try paid APIs first
  if (newsKey) {
    try { allArticles = await fetchNewsAPI(query, newsKey); source = 'newsapi' }
    catch (e) { console.error('NewsAPI failed:', e); allArticles = [] }
  } else if (gnewsKey) {
    try { allArticles = await fetchGNews(query, gnewsKey); source = 'gnews' }
    catch (e) { console.error('GNews failed:', e); allArticles = [] }
  }

  // RSS fallback — fetch all feeds in parallel
  if (allArticles.length < 4) {
    const feeds  = (RSS_FEEDS[category] || RSS_FEEDS.india)
    const settled = await Promise.allSettled(feeds.map(f => fetchRSS(f.url)))
    for (const r of settled) {
      if (r.status === 'fulfilled') allArticles = [...allArticles, ...r.value]
    }
    if (source !== 'newsapi' && source !== 'gnews') source = 'rss'
  }

  const { latest, headlines } = splitAndFilter(allArticles)
  const fetchedAt = new Date().toISOString()

  const response: TrendingResponse = { latest, headlines, fetchedAt, source }

  if (latest.length > 0 || headlines.length > 0) {
    cache.set(category, { data: response, ts: Date.now() })
  }

  return NextResponse.json(response)
}
