'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Renders the correct hero CTAs based on auth state
export default function HomeCTA() {
  const [user,  setUser]  = useState<{ email?: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setUser(s?.user ?? null)
      setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!ready) {
    // Skeleton that matches button dimensions
    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: 160, height: 46, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 130, height: 46, borderRadius: 10 }} />
      </div>
    )
  }

  if (user) {
    // Logged-in CTAs
    return (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/check" style={{
          padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          color: 'white', background: 'var(--signal-indigo)', textDecoration: 'none',
          boxShadow: '0 0 20px rgba(108,142,255,0.3)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.4"/><path d="M7 4.5v2.5l1.5 1" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Analyze a claim
        </Link>
        <Link href="/dashboard" style={{
          padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          color: 'var(--text-secondary)',
          border: '1px solid var(--bg-border)',
          background: 'var(--bg-elevated)',
          textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 7h4M5 9.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          My dashboard
        </Link>
      </div>
    )
  }

  // Logged-out CTAs
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link href="/check" style={{
        padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
        color: 'white', background: 'var(--signal-indigo)', textDecoration: 'none',
        boxShadow: '0 0 20px rgba(108,142,255,0.3)',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.4"/><path d="M7 4.5v2.5l1.5 1" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
        Analyze a claim
      </Link>
      <Link href="/signup" style={{
        padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 500,
        color: 'var(--text-secondary)',
        border: '1px solid var(--bg-border)',
        background: 'var(--bg-elevated)',
        textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        Create free account
      </Link>
    </div>
  )
}
