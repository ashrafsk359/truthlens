import type { TrendingClaim, VerdictType } from '@/types'

export const TRENDING_CLAIMS: TrendingClaim[] = [
  {
    id: '1',
    text: 'WHO declares new global health emergency over respiratory virus spread',
    verdict: 'Unverified',
    check_count: 2847,
    category: 'Health',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    text: 'Scientists achieve room-temperature superconductivity breakthrough',
    verdict: 'Disputed',
    check_count: 1923,
    category: 'Science',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    text: 'Drinking alkaline water reverses aging and prevents cancer',
    verdict: 'Likely False',
    check_count: 4210,
    category: 'Health',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    text: 'India surpasses China to become world\'s most populous country',
    verdict: 'Verified',
    check_count: 3102,
    category: 'Demographics',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    text: 'New AI model passes medical board exam with 95% accuracy',
    verdict: 'Likely True',
    check_count: 1567,
    category: 'Technology',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    text: '5G towers cause migraines and neurological damage in children',
    verdict: 'Likely False',
    check_count: 8934,
    category: 'Health',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    text: 'Electric vehicles catch fire at 3x higher rate than petrol cars',
    verdict: 'Misleading',
    check_count: 2311,
    category: 'Technology',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    text: 'NASA confirms discovery of liquid water ocean on Europa moon',
    verdict: 'Mixed / Context Needed',
    check_count: 1876,
    category: 'Science',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const CATEGORIES = ['All', 'Health', 'Technology', 'Science', 'Politics', 'Demographics', 'Economy']

export function getTrendingByCategory(category: string): TrendingClaim[] {
  if (category === 'All') return TRENDING_CLAIMS
  return TRENDING_CLAIMS.filter((c) => c.category === category)
}

export function getMostChecked(): TrendingClaim[] {
  return [...TRENDING_CLAIMS].sort((a, b) => b.check_count - a.check_count).slice(0, 5)
}

export function getRecentlyDisputed(): TrendingClaim[] {
  return TRENDING_CLAIMS.filter((c) =>
    ['Disputed', 'Likely False', 'Misleading'].includes(c.verdict as string)
  )
}
