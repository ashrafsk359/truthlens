import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { VerdictType, ConfidenceLevel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVerdictColor(verdict: VerdictType): {
  bg: string; text: string; border: string; dot: string
} {
  switch (verdict) {
    case 'Verified':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    case 'Likely True':
      return { bg: 'bg-emerald-50/60', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' }
    case 'Mixed / Context Needed':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' }
    case 'Misleading':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-orange-200', dot: 'bg-orange-500' }
    case 'Unverified':
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
    case 'Likely False':
      return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' }
    case 'Disputed':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'High': return 'text-emerald-600'
    case 'Medium': return 'text-amber-600'
    case 'Low': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export const TRUSTED_DOMAINS = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk',
  'who.int', 'cdc.gov', 'nih.gov', 'pib.gov.in',
  'theguardian.com', 'nytimes.com', 'washingtonpost.com',
  'economist.com', 'nature.com', 'science.org',
  'factcheck.org', 'snopes.com', 'politifact.com',
  'altnews.in', 'boomlive.in', 'thelogicalindian.com',
]
