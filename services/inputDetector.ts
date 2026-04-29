// Detects input type from raw user input

export type InputKind =
  | 'plain_text'
  | 'news_url'
  | 'twitter_url'
  | 'youtube_url'
  | 'reddit_url'
  | 'generic_url'
  | 'mixed'          // text + URL(s)
  | 'multi_url'

const URL_REGEX = /https?:\/\/[^\s]+/gi

const TWITTER_DOMAINS = ['twitter.com', 'x.com', 't.co']
const YOUTUBE_DOMAINS = ['youtube.com', 'youtu.be']
const REDDIT_DOMAINS  = ['reddit.com', 'redd.it']

const NEWS_DOMAINS = [
  'reuters.com','apnews.com','bbc.com','bbc.co.uk','theguardian.com',
  'nytimes.com','washingtonpost.com','cnn.com','bbc.com','ndtv.com',
  'thehindu.com','hindustantimes.com','indiatoday.in','timesofindia.com',
  'aljazeera.com','bloomberg.com','forbes.com','techcrunch.com',
  'wired.com','nature.com','science.org','who.int','cdc.gov',
]

export interface DetectionResult {
  kind: InputKind
  urls: string[]
  textOnly: string          // input with URLs stripped
  primaryUrl: string | null
  domain: string | null
  isTwitter: boolean
  isNews: boolean
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return '' }
}

export function detectInput(raw: string): DetectionResult {
  const trimmed = raw.trim()
  const urls = trimmed.match(URL_REGEX) ?? []
  const textOnly = trimmed.replace(URL_REGEX, '').trim()
  const primaryUrl = urls[0] ?? null
  const domain = primaryUrl ? extractDomain(primaryUrl) : null

  const isTwitter = urls.some(u => TWITTER_DOMAINS.some(d => u.includes(d)))
  const isYoutube = urls.some(u => YOUTUBE_DOMAINS.some(d => u.includes(d)))
  const isReddit  = urls.some(u => REDDIT_DOMAINS.some(d => u.includes(d)))
  const isNews    = urls.some(u => NEWS_DOMAINS.some(d => u.includes(d)))

  let kind: InputKind

  if (urls.length === 0) {
    kind = 'plain_text'
  } else if (urls.length > 1) {
    kind = textOnly.length > 20 ? 'mixed' : 'multi_url'
  } else if (isTwitter) {
    kind = 'twitter_url'
  } else if (isYoutube) {
    kind = 'youtube_url'
  } else if (isReddit) {
    kind = 'reddit_url'
  } else if (isNews) {
    kind = 'news_url'
  } else if (textOnly.length > 20) {
    kind = 'mixed'
  } else {
    kind = 'generic_url'
  }

  return { kind, urls, textOnly, primaryUrl, domain, isTwitter, isNews }
}
