// Extracts readable article content from a URL server-side

export interface ParsedArticle {
  url: string
  domain: string
  title: string
  author: string
  publishDate: string
  content: string          // cleaned main text
  excerpt: string          // first 300 chars
  wordCount: number
  success: boolean
  error?: string
  faviconUrl: string
  imageUrl: string
}

const BLOCKED_PATTERNS = [
  /^javascript:/i,
  /^data:/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /192\.168\./,
  /10\.\d+\.\d+\.\d+/,
]

function isBlockedUrl(url: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(url))
}

// Remove noise tags from HTML
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractTitle(html: string): string {
  return (
    extractMeta(html, 'og:title') ||
    extractMeta(html, 'twitter:title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    ''
  )
}

function extractMainContent(html: string): string {
  // Try article / main tags first
  const articleMatch =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<div[^>]*class=["'][^"']*(?:article|content|story|body|post)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)

  const source = articleMatch ? articleMatch[1] : html
  return stripHtml(source)
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const domain = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return '' } })()
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  const empty: ParsedArticle = { url, domain, title: '', author: '', publishDate: '', content: '', excerpt: '', wordCount: 0, success: false, faviconUrl, imageUrl: '' }

  if (isBlockedUrl(url)) return { ...empty, error: 'Blocked URL' }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TruthLens-Bot/1.0; +https://truthlens.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('html')) throw new Error('Not an HTML page')

    const html = await res.text()

    const title       = extractTitle(html)
    const author      = extractMeta(html, 'author') || extractMeta(html, 'article:author')
    const publishDate = extractMeta(html, 'article:published_time') || extractMeta(html, 'datePublished') || extractMeta(html, 'pubdate')
    const imageUrl    = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || ''
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || ''

    const rawContent  = extractMainContent(html)
    // Limit to 3000 chars to avoid token overflow
    const content     = rawContent.substring(0, 3000)
    const excerpt     = description || rawContent.substring(0, 300)
    const wordCount   = rawContent.split(/\s+/).length

    return { url, domain, title, author, publishDate, content, excerpt, wordCount, success: true, faviconUrl, imageUrl }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Fetch failed', success: false }
  }
}
