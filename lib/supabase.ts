import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(url, anon)

// ── Auth error translator ─────────────────────────────────────────
// Maps raw Supabase error messages to human-readable strings
export function parseAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Incorrect email or password. Please try again.'

  if (m.includes('email not confirmed') || m.includes('email_not_confirmed'))
    return 'Your email is not verified yet. Please check your inbox and click the confirmation link before signing in.'

  if (m.includes('user not found') || m.includes('no user found'))
    return 'No account found with that email. Please sign up first.'

  if (m.includes('too many requests') || m.includes('rate limit') || m.includes('over_email_send_rate_limit'))
    return 'Too many attempts. Please wait a few minutes and try again.'

  if (m.includes('password') && m.includes('weak'))
    return 'Password is too weak. Use at least 8 characters with letters and numbers.'

  if (m.includes('already registered') || m.includes('user already registered') || m.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.'

  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Check your connection and try again.'

  if (m.includes('signup_disabled') || m.includes('signups not allowed'))
    return 'New signups are currently disabled. Please contact support.'

  // Return a cleaned version of the original if no match
  return message.charAt(0).toUpperCase() + message.slice(1)
}

// ── Auth helpers ──────────────────────────────────────────────────
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard` },
  })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
  })
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ── DB helpers ────────────────────────────────────────────────────
export async function saveCheck(userId: string, payload: {
  claim_text: string
  input_type: string
  verdict: string
  credibility_score: number
  confidence: string
  summary: string
  tags: string[]
}) {
  if (!url) return null
  const { data, error } = await supabase.from('checks').insert({
    user_id: userId,
    ...payload,
    created_at: new Date().toISOString(),
  })
  if (error) console.error('saveCheck error:', error)
  return data
}

export async function getUserChecks(userId: string, limit = 20) {
  if (!url) return []
  const { data } = await supabase
    .from('checks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getUserStats(userId: string) {
  if (!url) return { total: 0, saved: 0, thisWeek: 0, mostCommonVerdict: '—' }

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  const [{ data: checks }, { data: saved }, { data: recent }] = await Promise.all([
    supabase.from('checks').select('verdict, credibility_score, created_at').eq('user_id', userId),
    supabase.from('saved_claims').select('id').eq('user_id', userId),
    supabase.from('checks').select('id').eq('user_id', userId).gte('created_at', weekAgo),
  ])

  const total   = checks?.length || 0
  const thisWeek = recent?.length || 0

  // Most common verdict
  const verdictCounts: Record<string, number> = {}
  checks?.forEach(c => { if (c.verdict) verdictCounts[c.verdict] = (verdictCounts[c.verdict] || 0) + 1 })
  const mostCommonVerdict = total
    ? Object.entries(verdictCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    : '—'

  return {
    total,
    saved: saved?.length || 0,
    thisWeek,
    mostCommonVerdict,
  }
}

export async function saveClaim(userId: string, claim: string, result: object) {
  if (!url) return null
  const { data, error } = await supabase.from('saved_claims').insert({
    user_id: userId, claim: claim.substring(0, 500), result,
    created_at: new Date().toISOString(),
  })
  if (error) console.error('saveClaim error:', error)
  return data
}

export async function getSavedClaims(userId: string) {
  if (!url) return []
  const { data } = await supabase
    .from('saved_claims').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}
