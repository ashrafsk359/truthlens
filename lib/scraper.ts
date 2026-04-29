export interface ScrapedContent {
  title: string
  body: string
  domain: string
  url: string
  success: boolean
  error?: string
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const domain = (() => {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return '' }
  })()

  if (!domain) {
    return { title: '', body: '', domain: '', url, success: false, error: 'Invalid URL' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TruthLens-Bot/1.0 (fact-checking service)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown title'

    const body = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000)

    return { title, body, domain, url, success: true }
  } catch (error) {
    return {
      title: '',
      body: '',
      domain,
      url,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape URL',
    }
  }
}

export function detectInputType(input: string): 'url' | 'article' | 'claim' {
  const trimmed = input.trim()
  if (/^https?:\/\//i.test(trimmed)) return 'url'
  if (trimmed.length > 300) return 'article'
  return 'claim'
}
