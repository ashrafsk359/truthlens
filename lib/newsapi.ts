import type { SourceAlignment } from '@/types'

export interface NewsArticle {
  title: string
  description: string
  url: string
  source: { name: string; id?: string }
  publishedAt: string
  content?: string
}

async function fetchFromNewsAPI(query: string, apiKey: string): Promise<NewsArticle[]> {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&language=en&apiKey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NewsAPI error: ${res.status}`)
  const data = await res.json()
  return data.articles || []
}

async function fetchFromGNews(query: string, apiKey: string): Promise<NewsArticle[]> {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&token=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GNews error: ${res.status}`)
  const data = await res.json()
  return (data.articles || []).map((a: { title: string; description: string; url: string; source: { name: string }; publishedAt: string; content?: string }) => ({
    title: a.title,
    description: a.description,
    url: a.url,
    source: { name: a.source.name },
    publishedAt: a.publishedAt,
    content: a.content,
  }))
}

export async function fetchRelatedEvidence(
  claim: string
): Promise<{ articles: NewsArticle[]; evidenceText: string }> {
  const newsApiKey = process.env.NEWS_API_KEY
  const gnewsKey = process.env.GNEWS_API_KEY

  const query = claim.length > 100 ? claim.substring(0, 100) : claim
  let articles: NewsArticle[] = []

  try {
    if (newsApiKey) {
      articles = await fetchFromNewsAPI(query, newsApiKey)
    } else if (gnewsKey) {
      articles = await fetchFromGNews(query, gnewsKey)
    }
  } catch {
    articles = []
  }

  const evidenceText = articles
    .slice(0, 5)
    .map(
      (a, i) =>
        `[Source ${i + 1}] ${a.source.name} (${a.publishedAt?.slice(0, 10) || 'unknown date'})\nTitle: ${a.title}\nDescription: ${a.description || 'N/A'}`
    )
    .join('\n\n')

  return { articles, evidenceText }
}

export function articlesToSourceAlignment(articles: NewsArticle[]): SourceAlignment[] {
  return articles.slice(0, 4).map((a) => ({
    name: a.source.name,
    url: a.url,
    snippet: a.description || a.title,
    supports: true,
    publishedAt: a.publishedAt,
    domain: new URL(a.url).hostname.replace('www.', ''),
  }))
}
