'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [pct,     setPct]     = useState(0)
  const [visible, setVisible] = useState(false)
  const iRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any running animation
    clearInterval(iRef.current!)
    clearTimeout(tRef.current!)

    setVisible(true)
    setPct(0)

    // Fast ramp to 70%, pause, then complete
    let p = 0
    iRef.current = setInterval(() => {
      // Exponential slowdown — fast at start, slows near 70
      const step = Math.max(1, (72 - p) * 0.22)
      p = Math.min(p + step, 72)
      setPct(p)
      if (p >= 72) clearInterval(iRef.current!)
    }, 40)

    // Complete bar quickly
    tRef.current = setTimeout(() => {
      clearInterval(iRef.current!)
      setPct(100)
      setTimeout(() => { setVisible(false); setPct(0) }, 200)
    }, 320)

    return () => {
      clearInterval(iRef.current!)
      clearTimeout(tRef.current!)
    }
  }, [pathname, searchParams])

  if (!visible && pct === 0) return null

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
        height: 2.5,
        width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--signal-indigo) 0%, var(--signal-live) 100%)',
        boxShadow: '0 0 10px var(--signal-indigo)',
        // GPU-accelerated — no layout reflow
        transform: 'translateZ(0)',
        transition: pct === 100 ? 'width 0.15s ease-out, opacity 0.2s ease' : 'none',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        willChange: 'width',
      }}
    />
  )
}
