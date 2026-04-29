'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { resetPassword, parseAuthError } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email.'); return }
    setLoading(true); setError('')
    const { error: err } = await resetPassword(email.trim())
    setLoading(false)
    if (err) { setError(parseAuthError(err.message)); return }
    setSent(true)
  }

  const S = {
    page:   { minHeight: 'calc(100vh - 54px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg-base)' } as React.CSSProperties,
    inner:  { width: '100%', maxWidth: 380 } as React.CSSProperties,
    h1:     { fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.015em' } as React.CSSProperties,
    sub:    { fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 } as React.CSSProperties,
    label:  { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 },
    submitActive: {
      width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: 'var(--signal-indigo)', color: 'white', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: '0 0 16px rgba(108,142,255,0.25)',
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
      <div style={S.inner}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, background: 'var(--signal-indigo)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: 14, height: 14, color: 'white' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>TruthLens</span>
        </div>

        {sent ? (
          <div className="surface" style={{ padding: '36px 28px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,217,141,0.1)', border: '1px solid rgba(16,217,141,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 style={{ width: 22, height: 22, color: 'var(--signal-verified)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            </p>
            <Link href="/login" style={{ fontSize: 13, color: 'var(--signal-indigo)', textDecoration: 'none', fontWeight: 600 }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={S.h1}>Reset password</h1>
            <p style={S.sub}>Enter your email and we'll send a reset link.</p>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input-base"
                  autoComplete="email" autoCapitalize="off" autoFocus />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(240,71,71,0.07)', border: '1px solid rgba(240,71,71,0.2)', borderRadius: 10 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--signal-false)' }}>⚠ {error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                style={loading ? S.submitOff : S.submitActive}>
                {loading
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} /> Sending...</>
                  : <>Send reset link <ArrowRight style={{ width: 13, height: 13 }} /></>
                }
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
              <Link href="/login" style={{ color: 'var(--signal-indigo)', textDecoration: 'none', fontWeight: 600 }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
