'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowRight, Chrome, Mail, CheckCircle2 } from 'lucide-react'
import { signUp, signInWithGoogle, parseAuthError } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [formState, setFormState] = useState<'idle' | 'success_confirm' | 'success_direct'>('idle')

  const pwStrong   = password.length >= 8
  const noSupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())  { setError('Please enter your name.');     return }
    if (!email.trim()) { setError('Please enter your email.');    return }
    if (!password)     { setError('Please enter a password.');    return }
    if (!pwStrong)     { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { data, error: err } = await signUp(email.trim(), password, name.trim())
    setLoading(false)
    if (err) { setError(parseAuthError(err.message)); return }
    if (data.session) { setFormState('success_direct'); router.push('/dashboard'); router.refresh() }
    else setFormState('success_confirm')
  }

  async function handleGoogle() {
    setLoading(true); setError('')
    const { error: err } = await signInWithGoogle()
    if (err) { setLoading(false); setError(parseAuthError(err.message)) }
  }

  const S = {
    page: { minHeight: 'calc(100vh - 54px)', display: 'flex' } as React.CSSProperties,
    formWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg-base)' } as React.CSSProperties,
    inner: { width: '100%', maxWidth: 400 } as React.CSSProperties,
    h1: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.015em' } as React.CSSProperties,
    sub: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 } as React.CSSProperties,
    label: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 },
    divRow: { display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' } as React.CSSProperties,
    divLine: { flex: 1, height: 1, background: 'var(--bg-border)' } as React.CSSProperties,
    divTxt: { fontSize: 11, color: 'var(--text-muted)' } as React.CSSProperties,
    footer: { textAlign: 'center' as const, fontSize: 13, color: 'var(--text-muted)', marginTop: 24 },
    link: { color: 'var(--signal-indigo)', textDecoration: 'none', fontWeight: 600 },
    googleBtn: {
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', marginBottom: 4,
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

  /* ── Email confirmation screen ─────────────────────────────── */
  if (formState === 'success_confirm') {
    return (
      <div style={{ minHeight: 'calc(100vh - 54px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <div className="surface" style={{ padding: '44px 36px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Mail style={{ width: 24, height: 24, color: 'var(--signal-live)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 4 }}>
              We sent a confirmation link to
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>{email}</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 24 }}>
              Click the link in that email to verify your account, then sign in.
            </p>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: 'var(--signal-indigo)', color: 'white', textDecoration: 'none',
            }}>
              Go to sign in <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 16 }}>
              Didn't receive it? Check spam or{' '}
              <button onClick={() => setFormState('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal-indigo)', fontSize: 11.5, padding: 0 }}>
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* Left branding */}
      <div className="hidden lg:flex" style={{ width: '48%', background: 'linear-gradient(160deg, var(--signal-indigo) 0%, #7C3AED 100%)', flexDirection: 'column', justifyContent: 'center', padding: '0 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'white' }}>TruthLens</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 14 }}>
          Join TruthLens.<br />Verify smarter.
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 28 }}>
          Create a free account to save your research, track verdicts, and build your personal fact-check history.
        </p>
        {['Personal fact-check history', 'Save and bookmark claims', 'Credibility score tracking', 'Completely free — no credit card'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', flexShrink: 0 }}>✓</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={S.formWrap}>
        <div style={S.inner}>
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, background: 'var(--signal-indigo)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield style={{ width: 14, height: 14, color: 'white' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>TruthLens</span>
          </div>

          <h1 style={S.h1}>Create your account</h1>
          <p style={S.sub}>Free forever. No credit card required.</p>

          {noSupabase && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(244,161,24,0.08)', border: '1px solid rgba(244,161,24,0.22)', borderRadius: 10 }}>
              <p style={{ fontSize: 11.5, color: 'var(--signal-mixed)', lineHeight: 1.6 }}>
                <strong>Setup needed:</strong> Add Supabase keys to your <code style={{ background: 'rgba(244,161,24,0.12)', padding: '1px 4px', borderRadius: 3 }}>.env.local</code> file.
              </p>
            </div>
          )}

          <button onClick={handleGoogle} disabled={loading || noSupabase} style={S.googleBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border-hi)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          >
            <Chrome style={{ width: 15, height: 15 }} /> Continue with Google
          </button>

          <div style={S.divRow}>
            <div style={S.divLine} /><span style={S.divTxt}>or sign up with email</span><div style={S.divLine} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { lbl: 'Full name',      val: name,     set: setName,     type: 'text',     ph: 'Your name',         ac: 'name' },
              { lbl: 'Email address',  val: email,    set: setEmail,    type: 'email',    ph: 'you@example.com',   ac: 'email' },
            ].map(({ lbl, val, set, type, ph, ac }) => (
              <div key={lbl}>
                <label style={S.label}>{lbl}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)}
                  placeholder={ph} className="input-base" autoComplete={ac} />
              </div>
            ))}
            <div>
              <label style={S.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters" className="input-base"
                  style={{ paddingRight: 36 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                }}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
              {password && (
                <p style={{ fontSize: 11, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, color: pwStrong ? 'var(--signal-verified)' : 'var(--signal-mixed)' }}>
                  {pwStrong
                    ? <><CheckCircle2 style={{ width: 11, height: 11 }} /> Strong password</>
                    : '⚠ At least 8 characters required'
                  }
                </p>
              )}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(240,71,71,0.07)', border: '1px solid rgba(240,71,71,0.2)', borderRadius: 10 }}>
                <p style={{ fontSize: 12.5, color: 'var(--signal-false)' }}>⚠ {error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || noSupabase}
              style={loading || noSupabase ? S.submitOff : S.submitActive}>
              {loading
                ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} /> Creating account...</>
                : <>Create free account <ArrowRight style={{ width: 13, height: 13 }} /></>
              }
            </button>

            <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-muted)' }}>
              By signing up you agree to our{' '}
              <Link href="/privacy" style={{ color: 'var(--signal-indigo)', textDecoration: 'none' }}>Privacy Policy</Link>.
            </p>
          </form>

          <p style={S.footer}>
            Already have an account?{' '}
            <Link href="/login" style={S.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
