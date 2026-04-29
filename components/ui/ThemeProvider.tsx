'use client'

import { useEffect } from 'react'
import { getStoredTheme, applyTheme } from '@/lib/theme'

// Runs client-side immediately to apply saved theme without flash
export default function ThemeProvider() {
  useEffect(() => {
    applyTheme(getStoredTheme())
    // Sync across tabs
    function onStorage(e: StorageEvent) {
      if (e.key === 'tl-theme') applyTheme((e.newValue as 'dark' | 'light') || 'dark')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return null
}
