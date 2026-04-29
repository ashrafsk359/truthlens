'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { supabase, signOut } from '@/lib/supabase'
import { getStoredTheme, setStoredTheme, applyTheme, type Theme } from '@/lib/theme'
import type { User } from '@supabase/supabase-js'

const NAV = [
  { href: '/check',     label: 'Verify' },
  { href: '/trending',  label: 'Signals' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/about',     label: 'About' },
]

// Sun icon
const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1 1M11.1 11.1l1 1M2.9 12.1l1-1M11.1 3.9l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

// Moon icon
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 9a6 6 0 01-7-7 6 6 0 100 14 6 6 0 007-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
)

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open,   setOpen]   = useState(false)
  const [drop,   setDrop]   = useState(false)
  const [user,   setUser]   = useState<User | null>(null)
  const [ready,  setReady]  = useState(false)
  const [theme,  setTheme]  = useState<Theme>('dark')
  const dropRef = useRef<HTMLDivElement>(null)

  // ── Fast auth hydration: check cache first, then Supabase ─────────
  useEffect(() => {
    // Check in-memory session immediately (avoids network on re-renders)
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

  // ── Theme init ────────────────────────────────────────────────────
  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  // ── Close dropdown on outside click ──────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDrop(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setStoredTheme(next)
    applyTheme(next)
  }

  async function handleOut() {
    await signOut(); setDrop(false); router.push('/'); router.refresh()
  }

  const initials = (user?.user_metadata?.full_name || user?.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0] || ''

  const navBg     = 'rgba(13,14,18,0.92)'
  const navBgLt   = 'rgba(245,246,250,0.95)'
  const isLight   = theme === 'light'

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid var(--bg-border)',
      background: isLight ? navBgLt : navBg,
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
    }}>
      <nav style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 20px',
        height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
      }}>

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{
            width: 27, height: 27,
            background: 'linear-gradient(135deg, var(--signal-indigo), var(--signal-live))',
            borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(108,142,255,0.3)',
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="white" strokeWidth="1.5"/>
              <path d="M7 4.5v2.5l1.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="11.5" cy="2.5" r="1.5" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5,
            color: 'var(--text-primary)', letterSpacing: '-0.01em',
          }}>TruthLens</span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────── */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                padding: '5px 13px', borderRadius: 8, fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                border: active ? '1px solid var(--bg-border)' : '1px solid transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* ── Right: theme toggle + auth ────────────────────────── */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} style={{
            width: 34, height: 34, borderRadius: 9,
            border: '1px solid var(--bg-border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
            flexShrink: 0,
          }}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Auth */}
          {!ready ? (
            <div className="skeleton" style={{ width: 78, height: 30, borderRadius: 8 }} />
          ) : user ? (
            <div style={{ position: 'relative' }} ref={dropRef}>
              <button onClick={() => setDrop(!drop)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '4px 8px 4px 4px', borderRadius: 99,
                border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: 25, height: 25, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--signal-indigo), var(--signal-live))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>{initials}</div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <svg width="9" height="6" viewBox="0 0 9 6" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0, transform: drop ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <path d="M1 1l3.5 4L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {drop && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: 176, background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)', borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100,
                }}>
                  <div style={{ padding: '9px 13px', borderBottom: '1px solid var(--bg-border)' }}>
                    <p style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                  {[
                    { href: '/dashboard', label: 'Dashboard' },
                    { href: '/check',     label: 'New check' },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setDrop(false)} style={{
                      display: 'block', padding: '9px 13px', fontSize: 13,
                      color: 'var(--text-secondary)', textDecoration: 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                    >{label}</Link>
                  ))}
                  <button onClick={handleOut} style={{
                    width: '100%', textAlign: 'left', padding: '9px 13px',
                    fontSize: 13, color: 'var(--signal-false)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    borderTop: '1px solid var(--bg-border)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,71,71,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" style={{
                padding: '6px 13px', borderRadius: 8, fontSize: 13,
                color: 'var(--text-secondary)', textDecoration: 'none',
                transition: 'color 0.15s',
              }}>Sign in</Link>
              <Link href="/signup" style={{
                padding: '7px 15px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: 'white', background: 'var(--signal-indigo)', textDecoration: 'none',
                boxShadow: '0 0 14px rgba(108,142,255,0.25)',
              }}>Get started</Link>
            </>
          )}
        </div>

        {/* ── Mobile right: hamburger only (theme toggle is in drawer) ── */}
        <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setOpen(!open)} style={{
            padding: 7, borderRadius: 8,
            border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {open
                ? <><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
                : <><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {open && (
        <div style={{
          borderTop: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
          padding: '10px 20px 18px',
        }} className="md:hidden" aria-hidden="true">
          {/* Theme toggle in mobile drawer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)', marginBottom: 2 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            <button onClick={toggleTheme} style={{
              width: 34, height: 20, borderRadius: 99, position: 'relative', cursor: 'pointer',
              background: theme === 'dark' ? 'var(--signal-indigo)' : 'var(--bg-border)',
              border: 'none', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3,
                left: theme === 'dark' ? 17 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '10px 0',
              borderBottom: '1px solid var(--bg-border)',
              fontSize: 14, textDecoration: 'none',
              color: pathname === href ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === href ? 600 : 400,
            }}>{label}</Link>
          ))}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ready && user ? (
              <>
                <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                <Link href="/dashboard" onClick={() => setOpen(false)} style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, textAlign: 'center',
                  border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)', textDecoration: 'none',
                }}>Dashboard</Link>
                <button onClick={() => { handleOut(); setOpen(false) }} style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13,
                  color: 'var(--signal-false)', background: 'rgba(240,71,71,0.08)',
                  border: '1px solid rgba(240,71,71,0.2)', cursor: 'pointer',
                }}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, textAlign: 'center',
                  border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)', textDecoration: 'none',
                }}>Sign in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  textAlign: 'center', color: 'white', background: 'var(--signal-indigo)',
                  textDecoration: 'none',
                }}>Get started free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
