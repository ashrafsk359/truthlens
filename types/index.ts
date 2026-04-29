export type VerdictType =
  | 'Verified'
  | 'Likely True'
  | 'Mixed / Context Needed'
  | 'Misleading'
  | 'Unverified'
  | 'Likely False'
  | 'Disputed'
  | 'Developing Story'

export type ConfidenceLevel = 'Low' | 'Medium' | 'High'
export type Freshness = 'Recent' | 'Mixed' | 'Unknown' | 'Breaking'

export interface SourceAlignment {
  name: string
  url: string
  snippet: string
  supports: boolean
  publishedAt?: string
  domain?: string
}

export interface VerificationResult {
  id?: string
  verdict: VerdictType
  confidence: ConfidenceLevel
  credibility_score: number
  summary: string
  reasoning_points: string[]
  why?: string[]
  contradictions: string[]
  source_alignment: SourceAlignment[]
  tags: string[]
  claim: string
  input_type: 'claim' | 'article' | 'url' | 'social' | 'image' | 'mixed'
  created_at?: string
  recommended_next_step?: string
  claim_category?: string
  // v2 fields
  freshness?: Freshness
  freshness_note?: string
  search_topic?: string
  recommended_links?: {
    google: string
    news: string
    youtube: string
    official: string
  }
}

export interface ArticleMeta {
  title: string
  domain: string
  author: string
  publishDate: string
  imageUrl: string
  faviconUrl: string
  excerpt: string
  wordCount: number
}

export interface VerifyResponse {
  result: VerificationResult
  meta: {
    inputKind: string
    domain: string | null
    articleMeta: ArticleMeta | null
    freshnessSummary?: string
  }
}

export interface TrendingClaim {
  id: string
  text: string
  verdict: VerdictType
  check_count: number
  category: string
  created_at: string
}

export type InputType =
  | 'claim'
  | 'article'
  | 'url'
  | 'smart'
  | 'text'
  | 'social'
  | 'image'

export type InputMode = InputType
