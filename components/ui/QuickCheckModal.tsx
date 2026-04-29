'use client'

import { useState, useEffect } from 'react'
import type { VerificationResult } from '@/types'
import VerdictBadge from '@/components/verdict/VerdictBadge'

interface Props {
  title: string
  url: string
  onClose: () => void
}

export default function QuickCheckModal({ title, url, onClose }: Props) {
  const [state,      setState]     = useState<'loading' | 'result' | 'error'>('loading')
  const [usedFallback, setFallback] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error,  setError]  = useState('')

  useEffect(() => {
    // Close on Escape
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    async function run() {
      try {
        const res  = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Use URL if available, else title as plain text claim
          body: JSON.stringify({
          input: url || title,
          // Pass title+description as fallback text for blocked URLs
          manualText: url ? `${title}` : undefined,
        }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed')
        setResult(data.result)
        setFallback(!!(data.meta?._usedFallback || data._usedFallback))
        setState('result')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
        setState('error')
      }
    }
    run()
  }, [title, url])

  function scoreColor(s: number) {
    if (s >= 70) return 'var(--signal-verified)'
    if (s >= 40) return 'var(--signal-mixed)'
    return 'var(--signal-false)'
  }

  return (
    // Backdrop
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        animation: 'revealUp 0.25s cubic-bezier(0.22,1,0.36,1) forwards',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--signal-indigo)', marginBottom: 5, fontWeight: 600 }}>Quick fact check</p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {state === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2.5px solid var(--bg-border)', borderTop: '2.5px solid var(--signal-indigo)', animation: 'spin 0.75s linear infinite', marginBottom: 14 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Cross-checking evidence...</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Searching trusted sources</p>
            </div>
          )}

          {state === 'error' && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--signal-false)', marginBottom: 6 }}>Analysis failed</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {state === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {usedFallback && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(244,161,24,0.07)',
                  border: '1px solid rgba(244,161,24,0.2)',
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L1 10h10L6 1z" stroke="var(--signal-mixed)" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M6 5v2.5M6 8.5v.5" stroke="var(--signal-mixed)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 11, color: 'var(--signal-mixed)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
                    Using headline-based analysis
                  </span>
                </div>
              )}
              {/* Verdict + score row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <VerdictBadge verdict={result.verdict} size="md" />
                <div style={{ display: 'flex', flex: 1, gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Score</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: scoreColor(result.credibility_score), letterSpacing: '-0.02em' }}>{result.credibility_score}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Confidence</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: result.confidence === 'High' ? 'var(--signal-verified)' : result.confidence === 'Medium' ? 'var(--signal-mixed)' : 'var(--signal-false)', letterSpacing: '-0.02em' }}>{result.confidence}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.summary}</p>
              </div>

              {/* Key findings */}
              {(result.reasoning_points?.length > 0 || (result as { why?: string[] }).why?.length) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {((result as { why?: string[] }).why?.length ? (result as { why?: string[] }).why! : result.reasoning_points).slice(0, 3).map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--signal-indigo)', flexShrink: 0, marginTop: 1, fontWeight: 700 }}>{i+1}</span>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Full report link */}
              {url && (
                <a href={`/check?q=${encodeURIComponent(url)}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 500,
                  border: '1px solid rgba(108,142,255,0.2)', background: 'rgba(108,142,255,0.06)',
                  color: 'var(--signal-indigo)', textDecoration: 'none',
                }}>
                  View full report
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
