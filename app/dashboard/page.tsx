'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase, getUserChecks, getUserStats, getSavedClaims, saveClaim } from '@/lib/supabase'
import VerdictBadge from '@/components/verdict/VerdictBadge'
import type { VerdictType } from '@/types'

interface Check {
  id: string; claim_text: string; verdict: VerdictType
  credibility_score: number; confidence: string; created_at: string
}
interface Stats { total: number; saved: number; thisWeek: number; mostCommonVerdict: string }
interface SavedItem { id: string; claim: string; result: { verdict?: string; credibility_score?: number }; created_at: string }

function timeAgo(d: string): string {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function scoreColor(s: number) {
  if (s >= 70) return 'var(--signal-verified)'
  if (s >= 40) return 'var(--signal-mixed)'
  return 'var(--signal-false)'
}

function StatCard({ label, val, color, sub }: { label: string; val: string; color: string; sub?: string }) {
  return (
    <div className="surface" style={{ padding: '20px 22px' }}>
      <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{val}</p>
      {sub && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [user,        setUser]       = useState<{ id: string; email: string; user_metadata?: { full_name?: string } } | null>(null)
  const [checks,      setChecks]     = useState<Check[]>([])
  const [saved,       setSaved]      = useState<SavedItem[]>([])
  const [stats,       setStats]      = useState<Stats>({ total: 0, saved: 0, thisWeek: 0, mostCommonVerdict: '—' })
  const [loading,     setLoading]    = useState(true)
  const [activeTab,   setActiveTab]  = useState<'history' | 'saved'>('history')

  const loadData = useCallback(async (uid: string) => {
    const [c, s, st] = await Promise.all([
      getUserChecks(uid, 15),
      getSavedClaims(uid),
      getUserStats(uid),
    ])
    setChecks(c as Check[])
    setSaved(s as SavedItem[])
    setStats(st as Stats)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u as typeof user)
      if (u) loadData(u.id).finally(() => setLoading(false))
      else setLoading(false)
    })
  }, [loadData])

  async function handleUnsave(itemId: string) {
    await supabase.from('saved_claims').delete().eq('id', itemId)
    setSaved(prev => prev.filter(s => s.id !== itemId))
    setStats(prev => ({ ...prev, saved: Math.max(0, prev.saved - 1) }))
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  if (loading) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[70, 45, 90, 55].map((w, i) => <div key={i} className="skeleton" style={{ height: 36, width: `${w}%`, borderRadius: 8 }} />)}
      </div>
    </div>
  )

  if (!user) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
      <div className="surface" style={{ padding: '56px 36px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, margin: '0 auto 18px', background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2.5" stroke="var(--signal-indigo)" strokeWidth="1.4"/><path d="M7 2.5h6" stroke="var(--signal-indigo)" strokeWidth="1.4" strokeLinecap="round"/><path d="M6 10h8M6 13h4" stroke="var(--signal-indigo)" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Your intelligence dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 26 }}>
          Sign in to track your verification history, save claims, and access credibility insights.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ padding: '10px 20px', borderRadius: 9, fontSize: 13, border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--signal-indigo)', color: 'white', textDecoration: 'none' }}>Create free account</Link>
        </div>
      </div>
      <div className="surface" style={{ padding: '18px 22px', marginTop: 14, maxWidth: 480, margin: '14px auto 0' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>No account? You can still verify claims:</p>
        <Link href="/check" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 9, background: 'rgba(108,142,255,0.06)', border: '1px solid rgba(108,142,255,0.15)', textDecoration: 'none' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--signal-indigo)' }}>Analyze a claim now</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="var(--signal-indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="label-mono" style={{ marginBottom: 7 }}>Intelligence dashboard</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.35rem, 2.8vw, 1.85rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{user.email}</p>
        </div>
        <Link href="/check" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--signal-indigo)', color: 'white', textDecoration: 'none', boxShadow: '0 0 14px rgba(108,142,255,0.25)', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.3"/><path d="M6 4v2l1.5 1" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
          New analysis
        </Link>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 10, marginBottom: 28 }}>
        <StatCard label="Total checks"      val={String(stats.total)}              color="var(--signal-indigo)" />
        <StatCard label="Saved claims"       val={String(stats.saved)}              color="var(--signal-verified)" />
        <StatCard label="This week"          val={String(stats.thisWeek)}           color="var(--signal-live)"    sub="claims checked" />
        <StatCard label="Top verdict"        val={stats.mostCommonVerdict === '—' ? '—' : stats.mostCommonVerdict.split(' ')[0]} color="var(--signal-gold)" sub={stats.mostCommonVerdict !== '—' ? 'most common result' : 'no checks yet'} />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--bg-border)' }}>
        {([['history', 'Recent checks'], ['saved', 'Saved claims']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
          }}>{label} {tab === 'saved' && stats.saved > 0 && <span style={{ marginLeft: 4, fontSize: 10, background: 'rgba(16,217,141,0.15)', color: 'var(--signal-verified)', padding: '1px 5px', borderRadius: 99 }}>{stats.saved}</span>}</button>
        ))}
      </div>

      {/* ── Recent checks tab ──────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="surface" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--bg-border)' }}>
            <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Recent checks</p>
          </div>
          {checks.length === 0 ? (
            <div style={{ padding: '44px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 5 }}>No checks yet</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 18 }}>Start verifying claims to build your history.</p>
              <Link href="/check" style={{ padding: '10px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--signal-indigo)', color: 'white', textDecoration: 'none' }}>Analyze your first claim</Link>
            </div>
          ) : checks.map((item, i) => (
            <Link key={item.id} href={`/check?q=${encodeURIComponent(item.claim_text)}`} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 22px',
              borderBottom: i < checks.length - 1 ? '1px solid var(--bg-border)' : 'none',
              textDecoration: 'none', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.claim_text}</p>
                <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{timeAgo(item.created_at)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: scoreColor(item.credibility_score) }}>{item.credibility_score}</span>
                <VerdictBadge verdict={item.verdict} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Saved claims tab ───────────────────────────────────── */}
      {activeTab === 'saved' && (
        <div className="surface" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--bg-border)' }}>
            <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Saved claims</p>
          </div>
          {saved.length === 0 ? (
            <div style={{ padding: '44px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 5 }}>No saved claims</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Bookmark verified claims from the result page.</p>
            </div>
          ) : saved.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 22px',
              borderBottom: i < saved.length - 1 ? '1px solid var(--bg-border)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.claim}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{timeAgo(item.created_at)}</p>
                  {item.result?.verdict && <VerdictBadge verdict={item.result.verdict as VerdictType} size="sm" />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {item.result?.credibility_score && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(item.result.credibility_score), fontFamily: 'var(--font-display)' }}>
                    {item.result.credibility_score}
                  </span>
                )}
                <button onClick={() => handleUnsave(item.id)} title="Remove saved claim" style={{
                  width: 28, height: 28, borderRadius: 7, border: '1px solid var(--bg-border)',
                  background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--signal-false)'; (e.currentTarget as HTMLElement).style.color = 'var(--signal-false)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick nav ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 10 }}>
        {[
          { href: '/trending',  label: 'Live signals',  desc: 'Latest headlines', color: 'var(--signal-live)' },
          { href: '/check',     label: 'New analysis',  desc: 'Verify a claim',   color: 'var(--signal-indigo)' },
          { href: '/about',     label: 'Methodology',   desc: 'How scoring works', color: 'var(--signal-gold)' },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} className="card-lift" style={{
            display: 'flex', alignItems: 'flex-start', gap: 11, padding: '16px 18px',
            borderRadius: 12, border: '1px solid var(--bg-border)',
            background: 'var(--bg-surface)', textDecoration: 'none',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: color, boxShadow: `0 0 7px ${color}` }} />
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontFamily: 'var(--font-display)' }}>{label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
