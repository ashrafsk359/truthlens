// Theme management — persists to localStorage, syncs across tabs
export type Theme = 'dark' | 'light'

const KEY = 'tl-theme'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem(KEY) as Theme) || 'dark'
}

export function setStoredTheme(t: Theme) {
  localStorage.setItem(KEY, t)
}

export function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'light') {
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
    root.classList.remove('light')
  }
}
