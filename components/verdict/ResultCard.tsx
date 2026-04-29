'use client'

import { useState } from 'react'
import { Share2, Bookmark, ChevronDown, ChevronUp, AlertTriangle,
         CheckCircle2, HelpCircle, Clock, Lightbulb } from 'lucide-react'
import type { VerificationResult, ArticleMeta, Freshness } from '@/types'
import { cn, getConfidenceColor, truncate } from '@/lib/utils'
import VerdictBadge from './VerdictBadge'
import CredibilityGauge from './CredibilityGauge'
import FreshnessIndicator from './FreshnessIndicator'
import FindMoreSection from './FindMoreSection'
import SourceCard from '../sources/SourceCard'
import UrlPreviewCard from '../ui/UrlPreviewCard'

interface Props {
  result: VerificationResult
  articleMeta?: ArticleMeta | null
  originalUrl?: string
  ocrText?: string          // show OCR evidence basis if present
  onSave?: () => void
}

export default function ResultCard({ result, articleMeta, originalUrl, ocrText, onSave }: Props) {
  const [expanded, setExpanded] = useState<string | null>('why')
  const [saved, setSaved]       = useState(false)
  const [copied, setCopied]     = useState(false)

  const supporting    = result.source_alignment?.filter(s => s.supports) ?? []
  const contradicting = result.source_alignment?.filter(s => !s.supports) ?? []
  const whyPoints     = (result as { why?: string[] }).why?.length
    ? (result as { why?: string[] }).why!
    : result.reasoning_points ?? []
  const freshness     = ((result as { freshness?: Freshness }).freshness || 'Unknown') as Freshness
  const searchTopic   = (result as { search_topic?: string }).search_topic || result.claim.substring(0, 50)

  // Build search URLs — always from result data, never empty
  const searchUrl = (result as { search_url?: string }).search_url
    || (result as { recommended_links?: { google: string } }).recommended_links?.google
    || `https://www.google.com/search?q=${encodeURIComponent(searchTopic + ' is it true latest news')}`
  const newsUrl = `https://news.google.com/search?q=${encodeURIComponent(searchTopic + ' latest news')}`

  function toggle(id: string) { setExpanded(expanded === id ? null : id) }

  function handleShare() {
    navigator.clipboard.writeText(
      `"${truncate(result.claim, 100)}"\n\nVerdict: ${result.verdict}\nScore: ${result.credibility_score}/100\n\nChecked with TruthLens`
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const ts = result.created_at
    ? new Date(result.created_at).toLocaleString('en-US',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Just now'

  return (
    <div className="space-y-3 stagger">

      {/* ── Header ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {ts}
          </p>
          <FreshnessIndicator freshness={freshness} />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">{result.claim}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <VerdictBadge verdict={result.verdict} size="md" />
          {result.tags?.map(t => <span key={t} className="tag-pill">{t}</span>)}
        </div>
        {(result as { freshness_note?: string }).freshness_note && (
          <p className="text-xs text-gray-400 mt-2 italic">
            {(result as { freshness_note?: string }).freshness_note}
          </p>
        )}
      </div>

      {/* ── Score row ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-2">Score</p>
          <CredibilityGauge score={result.credibility_score} size="sm" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Confidence</p>
          <p className={cn('text-2xl font-semibold', getConfidenceColor(result.confidence))}>
            {result.confidence}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Sources</p>
          <p className="text-2xl font-semibold text-gray-800">
            {result.source_alignment?.length ?? 0}
          </p>
        </div>
      </div>

      {/* ── OCR evidence basis ───────────────────────── */}
      {ocrText && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => toggle('ocr')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/40 transition-colors">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Screenshot evidence used
            </h3>
            {expanded === 'ocr' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
          </button>
          {expanded === 'ocr' && (
            <div className="px-5 pb-5">
              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
                {ocrText.substring(0, 600)}{ocrText.length > 600 ? '…' : ''}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Article source preview ───────────────────── */}
      {articleMeta && originalUrl && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5 px-1">Analyzed source</p>
          <UrlPreviewCard meta={articleMeta} url={originalUrl} />
        </div>
      )}

      {/* ── Summary ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-500" /> Summary
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
      </div>

      {/* ── Why this verdict ─────────────────────────── */}
      {whyPoints.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => toggle('why')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/40 transition-colors">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Why this verdict
            </h3>
            {expanded === 'why' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
          </button>
          {expanded === 'why' && (
            <div className="px-5 pb-5 space-y-3">
              {whyPoints.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Contradictions ──────────────────────────── */}
      {result.contradictions?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => toggle('contra')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/40 transition-colors">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Contradicting factors
              <span className="ml-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                {result.contradictions.length}
              </span>
            </h3>
            {expanded === 'contra' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
          </button>
          {expanded === 'contra' && (
            <div className="px-5 pb-5 space-y-2.5">
              {result.contradictions.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✕</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Supporting sources ──────────────────────── */}
      {supporting.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Supporting sources
            <span className="ml-1 text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{supporting.length}</span>
          </h3>
          <div className="space-y-2">
            {supporting.map((s, i) => <SourceCard key={i} source={s} index={i} />)}
          </div>
        </div>
      )}

      {/* ── Contradicting sources ───────────────────── */}
      {contradicting.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Contradicting sources
            <span className="ml-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{contradicting.length}</span>
          </h3>
          <div className="space-y-2">
            {contradicting.map((s, i) => <SourceCard key={i} source={s} index={i} />)}
          </div>
        </div>
      )}

      {/* ── Find More ───────────────────────────────── */}
      <FindMoreSection searchUrl={searchUrl} newsUrl={newsUrl} topic={searchTopic} />

      {/* ── Next step ───────────────────────────────── */}
      {result.recommended_next_step && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-700 mb-0.5">Next step</p>
            <p className="text-sm text-indigo-600">{result.recommended_next_step}</p>
          </div>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────── */}
      <div className="flex gap-2">
        <button onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Share2 className="w-4 h-4" />
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button onClick={() => { setSaved(true); onSave?.() }}
          className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm transition-colors',
            saved ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}>
          <Bookmark className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        AI-assisted analysis · Verify critical claims with primary sources
      </p>
    </div>
  )
}
