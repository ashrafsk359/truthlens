'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Footer() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setLoggedIn(!!s))
    return () => subscription.unsubscribe()
  }, [])

  const authLinks = loggedIn
    ? [{ href: '/dashboard', label: 'Dashboard' }]
    : [{ href: '/login', label: 'Sign in' }, { href: '/signup', label: 'Sign up' }]

  return (
    <footer style={{ borderTop: '1px solid var(--bg-border)', background: 'var(--bg-surface)', marginTop: 'auto' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '18px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 14,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 19, height: 19,
            background: 'linear-gradient(135deg, var(--signal-indigo), var(--signal-live))',
            borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="white" strokeWidth="1.5"/>
              <path d="M7 4.5v2.5l1.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-secondary)' }}>TruthLens</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>· Evidence-based AI verification</span>
        </div>

        {/* Nav links — auth-aware */}
        <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {[
            { href: '/about',    label: 'Methodology' },
            { href: '/pricing',  label: 'Pricing' },
            { href: '/trending', label: 'Signals' },
            { href: '/privacy',  label: 'Privacy' },
            ...authLinks,
          ].map(({ href, label }) => (
            <Link key={`${href}-${label}`} href={href} style={{
              fontSize: 11.5, color: 'var(--text-muted)', textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >{label}</Link>
          ))}
        </nav>

        <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          AI-assisted · Not a substitute for expert judgement
        </p>
      </div>
    </footer>
  )
}
