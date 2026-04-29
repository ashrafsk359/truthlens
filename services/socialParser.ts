// Handles social media URL parsing (Twitter/X, Reddit)

export interface SocialPost {
  platform: 'twitter' | 'reddit' | 'youtube' | 'unknown'
  url: string
  extractedText: string | null
  author: string | null
  timestamp: string | null
  canAutoExtract: boolean
  manualInputNeeded: boolean
  hint: string
}

export function parseSocialUrl(url: string): SocialPost {
  const lower = url.toLowerCase()

  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    // Extract tweet ID for potential oEmbed
    const tweetIdMatch = url.match(/status\/(\d+)/)
    const tweetId = tweetIdMatch?.[1]

    return {
      platform: 'twitter',
      url,
      extractedText: null,
      author: null,
      timestamp: null,
      canAutoExtract: false,  // Twitter blocks server-side scraping without auth
      manualInputNeeded: true,
      hint: tweetId
        ? `Tweet ID: ${tweetId}. Twitter blocks automated access — please paste the tweet text below.`
        : 'Please paste the tweet text manually for accurate verification.',
    }
  }

  if (lower.includes('reddit.com') || lower.includes('redd.it')) {
    return {
      platform: 'reddit',
      url,
      extractedText: null,
      author: null,
      timestamp: null,
      canAutoExtract: true,  // Reddit has a JSON API
      manualInputNeeded: false,
      hint: 'Fetching Reddit post content...',
    }
  }

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      platform: 'youtube',
      url,
      extractedText: null,
      author: null,
      timestamp: null,
      canAutoExtract: false,
      manualInputNeeded: true,
      hint: 'YouTube videos cannot be auto-analyzed. Paste the relevant quote or claim from the video.',
    }
  }

  return {
    platform: 'unknown',
    url,
    extractedText: null,
    author: null,
    timestamp: null,
    canAutoExtract: false,
    manualInputNeeded: true,
    hint: 'Unable to auto-extract this URL. Please paste the relevant text below.',
  }
}

// Fetch Reddit post via public JSON API
export async function fetchRedditPost(url: string): Promise<SocialPost> {
  const base = parseSocialUrl(url)
  try {
    const jsonUrl = url.replace(/\/$/, '') + '.json?limit=1'
    const res = await fetch(jsonUrl, {
      headers: { 'User-Agent': 'TruthLens-Bot/1.0' },
    })
    if (!res.ok) throw new Error('Reddit fetch failed')
    const data = await res.json()
    const post = data?.[0]?.data?.children?.[0]?.data
    if (!post) throw new Error('No post data')

    return {
      ...base,
      extractedText: `${post.title || ''} ${post.selftext || ''}`.trim().substring(0, 2000),
      author: post.author || null,
      timestamp: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
      canAutoExtract: true,
      manualInputNeeded: false,
      hint: '',
    }
  } catch {
    return { ...base, manualInputNeeded: true, hint: 'Could not fetch Reddit post. Please paste the content.' }
  }
}
