'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { InputMode, VerificationResult, ArticleMeta } from '@/types'
import SmartInput from '@/components/ui/SmartInput'
import LoadingState from '@/components/ui/LoadingState'
import ResultCard from '@/components/verdict/ResultCard'
import { ArrowLeft, AlertCircle, Twitter, Youtube, MessageSquare } from 'lucide-react'
import { supabase, saveCheck, saveClaim } from '@/lib/supabase'

interface ManualPrompt {
  platform: 'twitter' | 'reddit' | 'youtube' | 'unknown'
  hint: string
  originalInput: string
}

function CheckContent() {
  const searchParams   = useSearchParams()
  const defaultClaim   = searchParams.get('q') || ''

  const [state,       setState]    = useState<'idle' | 'loading' | 'result' | 'error' | 'manual'>('idle')
  const [result,      setResult]   = useState<VerificationResult | null>(null)
  const [articleMeta, setMeta]     = useState<ArticleMeta | null>(null)
  const [originalUrl, setUrl]      = useState('')
  const [usedOcrText, setOcrText]  = useState('')
  const [error,       setError]    = useState('')
  const [manualPrompt,setManual]   = useState<ManualPrompt | null>(null)
  const [manualText,  setManualTxt]= useState('')
  const [autoSaved,   setAutoSaved]= useState(false)  // auto-saved on check complete

  async function runVerify(input: string, mode: InputMode, manualOverride?: string, ocrText?: string) {
    setState('loading'); setError(''); setAutoSaved(false)

    try {
      const res  = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, manualText: manualOverride, ocrText: ocrText || undefined }),
      })
      const data = await res.json()

      if (res.status === 422 && data.errorType === 'manual_input_needed') {
        setManual({ platform: data.platform || 'unknown', hint: data.hint || data.error, originalInput: input })
        setState('manual'); return
      }
      if (!res.ok || data.error) throw new Error(data.error || 'Verification failed')

      const r = data.result as VerificationResult
      setResult(r)
      setMeta(data.meta?.articleMeta ?? null)
      setUrl(data.meta?.domain ? input : '')
      setOcrText(ocrText || '')
      setState('result')

      // Auto-save check to history (not saved_claims — that's manual)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await saveCheck(user.id, {
          claim_text:        input.substring(0, 500),
          input_type:        mode,
          verdict:           r.verdict,
          credibility_score: r.credibility_score,
          confidence:        r.confidence,
          summary:           r.summary?.substring(0, 500) || '',
          tags:              r.tags || [],
        })
        setAutoSaved(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  async function handleSaveClaim() {
    if (!result) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Check for duplicates before saving
    const { data: existing } = await supabase
      .from('saved_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('claim', result.claim.substring(0, 500))
      .single()
    if (existing) return  // already saved
    await saveClaim(user.id, result.claim, {
      verdict: result.verdict,
      credibility_score: result.credibility_score,
      summary: result.summary,
      tags: result.tags,
    })
  }

  function handleManualSubmit() {
    if (!manualText.trim() || !manualPrompt) return
    runVerify(manualPrompt.originalInput, 'social', manualText.trim())
    setManual(null)
  }

  function reset() {
    setState('idle'); setResult(null); setMeta(null)
    setError(''); setManual(null); setManualTxt(''); setOcrText(''); setAutoSaved(false)
  }

  const PlatformIcon = manualPrompt?.platform === 'twitter' ? Twitter
    : manualPrompt?.platform === 'youtube' ? Youtube : MessageSquare

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Idle / Error ─────────────────────────────────────── */}
      {(state === 'idle' || state === 'error') && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.015em' }}>
              Verify a claim
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Paste text, news URL, social post, or upload a screenshot</p>
          </div>
          <SmartInput onSubmit={runVerify} loading={false} defaultValue={defaultClaim} />
          {state === 'error' && (
            <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(240,71,71,0.07)', border: '1px solid rgba(240,71,71,0.2)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--signal-false)', marginTop: 1, flexShrink: 0 } as React.CSSProperties} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--signal-false)', marginBottom: 2 }}>Analysis failed</p>
                <p style={{ fontSize: 12.5, color: 'rgba(240,71,71,0.8)' }}>{error}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Manual input ─────────────────────────────────────── */}
      {state === 'manual' && manualPrompt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="surface" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,161,24,0.1)', border: '1px solid rgba(244,161,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlatformIcon style={{ width: 18, height: 18, color: 'var(--signal-mixed)' } as React.CSSProperties} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Manual text needed</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{manualPrompt.platform} post</p>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'rgba(244,161,24,0.06)', border: '1px solid rgba(244,161,24,0.15)', borderRadius: 9, padding: '10px 13px', marginBottom: 14, lineHeight: 1.6 }}>
              {manualPrompt.hint}
            </p>
            <textarea value={manualText} onChange={e => setManualTxt(e.target.value)}
              rows={4} placeholder="Paste the post content here..."
              className="input-base" style={{ resize: 'none', marginBottom: 14 }} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleManualSubmit} disabled={!manualText.trim()} style={{
                flex: 1, padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: manualText.trim() ? 'var(--signal-indigo)' : 'var(--bg-elevated)',
                color: manualText.trim() ? 'white' : 'var(--text-muted)',
                border: 'none', cursor: manualText.trim() ? 'pointer' : 'not-allowed',
              }}>Analyze now</button>
              <button onClick={reset} style={{ padding: '11px 16px', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────── */}
      {state === 'loading' && <LoadingState />}

      {/* ── Result ──────────────────────────────────────────── */}
      {state === 'result' && result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft className="w-4 h-4" /> Check another claim
            </button>
            {autoSaved && (
              <span style={{ fontSize: 11, color: 'var(--signal-verified)', background: 'rgba(16,217,141,0.1)', border: '1px solid rgba(16,217,141,0.2)', padding: '3px 10px', borderRadius: 99, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                ✓ Saved to history
              </span>
            )}
          </div>
          <ResultCard
            result={result}
            articleMeta={articleMeta}
            originalUrl={originalUrl}
            ocrText={usedOcrText}
            onSave={handleSaveClaim}
          />
        </>
      )}
    </div>
  )
}

export default function CheckPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 28, width: '55%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 180, width: '100%', borderRadius: 16 }} />
        </div>
      </div>
    }>
      <CheckContent />
    </Suspense>
  )
}
