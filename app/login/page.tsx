'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowRight, Chrome, Mail } from 'lucide-react'
import { signIn, signInWithGoogle, parseAuthError } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [showPw,    setShowPw]   = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')
  const [errorType, setErrType]  = useState<'error' | 'unverified'>('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim())    { setError('Please enter your email.');    setErrType('error'); return }
    if (!password.trim()) { setError('Please enter your password.'); setErrType('error'); return }
    setLoading(true); setError('')
    const { data, error: err } = await signIn(email.trim(), password)
    setLoading(false)
    if (err) {
      const isUnverified = err.message.toLowerCase().includes('email not confirmed') || err.message.toLowerCase().includes('email_not_confirmed')
      setErrType(isUnverified ? 'unverified' : 'error')
      setError(parseAuthError(err.message)); return
    }
    if (data.session) { router.push('/dashboard'); router.refresh() }
  }

  async function handleGoogle() {
    setLoading(true); setError('')
    const { error: err } = await signInWithGoogle()
    if (err) { setLoading(false); setError(parseAuthError(err.message)) }
  }

  const noSupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL

  // ── Shared styles ──────────────────────────────────────────────
  const S = {
    page:   { minHeight: 'calc(100vh - 54px)', display: 'flex' } as React.CSSProperties,
    panel:  { display: 'none' } as React.CSSProperties, // overridden by className
    formWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg-base)' } as React.CSSProperties,
    inner:  { width: '100%', maxWidth: 400 } as React.CSSProperties,
    h1:     { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.015em' } as React.CSSProperties,
    sub:    { fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 } as React.CSSProperties,
    label:  { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 },
    divRow: { display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' } as React.CSSProperties,
    divLine:{ flex: 1, height: 1, background: 'var(--bg-border)' } as React.CSSProperties,
    divTxt: { fontSize: 11, color: 'var(--text-muted)' } as React.CSSProperties,
    footer: { textAlign: 'center' as const, fontSize: 13, color: 'var(--text-muted)', marginTop: 24 },
    link:   { color: 'var(--signal-indigo)', textDecoration: 'none', fontWeight: 600 },
    googleBtn: {
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
      marginBottom: 4,
    } as React.CSSProperties,
    submitActive: {
      width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: 'var(--signal-indigo)', color: 'white', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: '0 0 16px rgba(108,142,255,0.25)', transition: 'opacity 0.15s',
    } as React.CSSProperties,
    submitOff: {
      width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: 'var(--bg-elevated)', color: 'var(--text-muted)',
      border: '1px solid var(--bg-border)', cursor: 'not-allowed',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    } as React.CSSProperties,
  }

  return (
    <div style={S.page}>
      {/* Left branding panel — indigo, only on lg */}
      <div className="hidden lg:flex" style={{ width: '48%', background: 'var(--signal-indigo)', flexDirection: 'column', justifyContent: 'center', padding: '0 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'white' }}>TruthLens</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 14 }}>
          Evidence over opinion.<br />Facts over assumptions.
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 28 }}>
          Sign in to access your personal fact-check history, saved claims, and credibility insights.
        </p>
        {['Save your verification history', 'Track credibility scores over time', 'Bookmark important claims'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', flexShrink: 0 }}>✓</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Form side */}
      <div style={S.formWrap}>
        <div style={S.inner}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, background: 'var(--signal-indigo)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield style={{ width: 14, height: 14, color: 'white' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>TruthLens</span>
          </div>

          <h1 style={S.h1}>Welcome back</h1>
          <p style={S.sub}>Sign in to your account</p>

          {noSupabase && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(244,161,24,0.08)', border: '1px solid rgba(244,161,24,0.22)', borderRadius: 10 }}>
              <p style={{ fontSize: 11.5, color: 'var(--signal-mixed)', lineHeight: 1.6 }}>
                <strong>Setup needed:</strong> Add <code style={{ background: 'rgba(244,161,24,0.12)', padding: '1px 4px', borderRadius: 3 }}>NEXT_PUBLIC_SUPABASE_URL</code> to your <code style={{ background: 'rgba(244,161,24,0.12)', padding: '1px 4px', borderRadius: 3 }}>.env.local</code> file.
              </p>
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading || noSupabase} style={S.googleBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border-hi)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          >
            <Chrome style={{ width: 15, height: 15 }} /> Continue with Google
          </button>

          <div style={S.divRow}>
            <div style={S.divLine} /><span style={S.divTxt}>or continue with email</span><div style={S.divLine} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={S.label}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-base"
                autoComplete="email" autoCapitalize="off" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={S.label}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: 'var(--signal-indigo)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" className="input-base"
                  style={{ paddingRight: 36 }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                }}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              errorType === 'unverified' ? (
                <div style={{ padding: '12px 14px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Mail style={{ width: 14, height: 14, color: 'var(--signal-live)', marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--signal-live)', marginBottom: 3 }}>Check your inbox</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{error}</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', background: 'rgba(240,71,71,0.07)', border: '1px solid rgba(240,71,71,0.2)', borderRadius: 10 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--signal-false)' }}>⚠ {error}</p>
                </div>
              )
            )}

            <button type="submit" disabled={loading || noSupabase}
              style={loading || noSupabase ? S.submitOff : S.submitActive}>
              {loading
                ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} /> Signing in...</>
                : <>Sign in <ArrowRight style={{ width: 13, height: 13 }} /></>
              }
            </button>
          </form>

          <p style={S.footer}>
            Don't have an account?{' '}
            <Link href="/signup" style={S.link}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
