'use client'

import { useState, useRef, useCallback } from 'react'
import { MessageSquare, Link2, Twitter, Image, Sparkles, Upload, X, AlertCircle, Camera, Globe } from 'lucide-react'
import { extractTextFromImage, getImagePreviewUrl, SUPPORTED_LANGUAGES } from '@/services/ocrService'
import type { InputMode } from '@/types'

interface Props {
  onSubmit: (input: string, mode: InputMode, manualText?: string, ocrExtracted?: string) => void
  loading?: boolean
  defaultValue?: string
}

const MODES: { value: InputMode; label: string; icon: React.ElementType; placeholder: string }[] = [
  { value: 'smart',  label: 'Smart',  icon: Sparkles,      placeholder: 'Paste anything — text, URL, tweet link, article...' },
  { value: 'text',   label: 'Text',   icon: MessageSquare, placeholder: 'Enter a claim, headline, or paste article text...' },
  { value: 'url',    label: 'URL',    icon: Link2,         placeholder: 'https://news-article.com/story...' },
  { value: 'social', label: 'Social', icon: Twitter,       placeholder: 'Paste tweet/X URL or Reddit/YouTube link...' },
  { value: 'image',  label: 'Image',  icon: Image,         placeholder: '' },
]

const EXAMPLES = [
  "Scientists discover that drinking coffee cures type-2 diabetes",
  "India overtakes China to become world's most populous country",
  "5G towers cause memory loss and neurological disorders",
  "NASA confirms discovery of liquid water on Europa moon",
]

export default function SmartInput({ onSubmit, loading, defaultValue = '' }: Props) {
  const [mode,        setMode]        = useState<InputMode>('smart')
  const [input,       setInput]       = useState(defaultValue)
  const [manualText,  setManualText]  = useState('')
  const [showManual,  setShowManual]  = useState(false)
  const [imageFile,   setImageFile]   = useState<File | null>(null)
  const [imagePreview,setImagePreview]= useState<string | null>(null)
  const [ocrText,     setOcrText]     = useState('')
  const [ocrLoading,  setOcrLoading]  = useState(false)
  const [ocrError,    setOcrError]    = useState('')
  const [dragOver,    setDragOver]    = useState(false)
  const [selectedLang,setLang]        = useState('auto')
  const [detectedLang,setDetected]    = useState('')
  const fileRef   = useRef<HTMLInputElement>(null)
  const inlineRef = useRef<HTMLInputElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  const isImage   = mode === 'image'
  const isUrl     = mode === 'url'
  const canSubmit = !loading && (isImage ? ocrText.length > 0 : input.trim().length > 2)

  function handleSubmit() {
    if (!canSubmit) return
    if (isImage) onSubmit(ocrText, 'image', undefined, ocrText)
    else onSubmit(input.trim(), mode, showManual ? manualText.trim() : undefined, undefined)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  async function processImageFile(file: File) {
    if (!file.type.startsWith('image/')) { setOcrError('Please upload an image file (PNG, JPG, WEBP)'); return }
    setImageFile(file); setOcrText(''); setOcrError(''); setOcrLoading(true)
    const preview = await getImagePreviewUrl(file)
    setImagePreview(preview)
    const result  = await extractTextFromImage(file, selectedLang)
    setOcrLoading(false)
    if (result.success) { setOcrText(result.text); setDetected(result.detectedLang) }
    else setOcrError(result.error || 'Could not extract text.')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processImageFile(file)
  }, [selectedLang]) // eslint-disable-line

  function clearImage() { setImageFile(null); setImagePreview(null); setOcrText(''); setOcrError('') }

  // ── Shared inline style helpers ─────────────────────────────────
  const S = {
    wrap: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: 18,
      overflow: 'hidden',
    } as React.CSSProperties,

    tabBar: {
      display: 'flex',
      borderBottom: '1px solid var(--bg-border)',
      background: 'var(--bg-elevated)',
    } as React.CSSProperties,

    tabActive: {
      flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      gap: 4, padding: '10px 4px', fontSize: 11, fontWeight: 600,
      color: 'var(--signal-indigo)', background: 'var(--bg-surface)',
      border: 'none', borderBottom: '2px solid var(--signal-indigo)',
      cursor: 'pointer', transition: 'all 0.15s',
    } as React.CSSProperties,

    tabInactive: {
      flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      gap: 4, padding: '10px 4px', fontSize: 11, fontWeight: 400,
      color: 'var(--text-muted)', background: 'transparent',
      border: 'none', borderBottom: '2px solid transparent',
      cursor: 'pointer', transition: 'all 0.15s',
    } as React.CSSProperties,

    body: { padding: 20 } as React.CSSProperties,

    metaRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 4, marginBottom: 12,
    } as React.CSSProperties,

    metaText: { fontSize: 11, color: 'var(--text-muted)' } as React.CSSProperties,

    exampleLabel: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 } as React.CSSProperties,

    exampleChips: { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 14 } as React.CSSProperties,

    chip: {
      fontSize: 11, padding: '5px 11px', borderRadius: 8,
      border: '1px solid var(--bg-border)',
      background: 'var(--bg-elevated)',
      color: 'var(--text-secondary)',
      cursor: 'pointer', transition: 'all 0.15s',
    } as React.CSSProperties,

    submitActive: {
      width: '100%', padding: '13px', borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: 'var(--signal-indigo)', color: 'white',
      border: 'none', cursor: 'pointer',
      boxShadow: '0 0 18px rgba(108,142,255,0.25)',
      transition: 'opacity 0.15s',
    } as React.CSSProperties,

    submitDisabled: {
      width: '100%', padding: '13px', borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: 'var(--bg-elevated)', color: 'var(--text-muted)',
      border: '1px solid var(--bg-border)', cursor: 'not-allowed',
    } as React.CSSProperties,

    dropzone: (over: boolean): React.CSSProperties => ({
      border: `2px dashed ${over ? 'var(--signal-indigo)' : 'var(--bg-border-hi)'}`,
      borderRadius: 12, padding: '40px 20px', textAlign: 'center',
      cursor: 'pointer',
      background: over ? 'rgba(108,142,255,0.05)' : 'var(--bg-elevated)',
      transition: 'all 0.15s',
    }),

    twitterBar: {
      marginBottom: 12, padding: '12px 14px',
      background: 'rgba(244,161,24,0.07)',
      border: '1px solid rgba(244,161,24,0.2)',
      borderRadius: 10,
    } as React.CSSProperties,

    errorBar: {
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 12px', borderRadius: 9,
      background: 'rgba(240,71,71,0.07)',
      border: '1px solid rgba(240,71,71,0.2)',
      marginBottom: 10,
    } as React.CSSProperties,

    inlineCameraBtn: {
      position: 'absolute' as const, right: 10, top: 10,
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--text-muted)', padding: 2,
      transition: 'color 0.15s',
    } as React.CSSProperties,

    select: {
      flex: 1, fontSize: 11,
      border: '1px solid var(--bg-border)',
      borderRadius: 7, padding: '4px 8px',
      background: 'var(--bg-elevated)',
      color: 'var(--text-secondary)',
      outline: 'none',
    } as React.CSSProperties,
  }

  return (
    <div style={S.wrap}>
      {/* ── Mode tabs ─────────────────────────────────────────── */}
      <div style={S.tabBar}>
        {MODES.map(({ value, label, icon: Icon }) => (
          <button key={value}
            onClick={() => { setMode(value); setShowManual(false) }}
            style={mode === value ? S.tabActive : S.tabInactive}
          >
            <Icon style={{ width: 14, height: 14 }} />
            <span style={{ display: 'none' }} className="sm-show">{label}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div style={S.body}>
        {/* ── Image mode ────────────────────────────────────── */}
        {isImage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Language selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe style={{ width: 13, height: 13, color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>OCR language:</span>
              <select value={selectedLang}
                onChange={e => { setLang(e.target.value); if (imageFile) processImageFile(imageFile) }}
                style={S.select}
              >
                {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>

            {!imageFile ? (
              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={S.dropzone(dragOver)}
              >
                <Upload style={{ width: 28, height: 28, color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>Drop screenshot here</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>or click to browse · PNG, JPG, WEBP</p>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && processImageFile(e.target.files[0])} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--bg-border)' }}>
                  {imagePreview && <img src={imagePreview} alt="Upload" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />}
                  <button onClick={clearImage} style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </div>

                {ocrLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--signal-indigo)' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(108,142,255,0.3)', borderTop: '2px solid var(--signal-indigo)', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />
                    Extracting text...
                  </div>
                )}

                {ocrError && (
                  <div style={S.errorBar}>
                    <AlertCircle style={{ width: 14, height: 14, color: 'var(--signal-false)', marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--signal-false)' }}>{ocrError}</span>
                  </div>
                )}

                {ocrText && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Extracted text
                        {detectedLang && detectedLang !== 'en' && (
                          <span style={{ marginLeft: 6, color: 'var(--signal-indigo)' }}>· {detectedLang} detected</span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ocrText.length} chars</span>
                    </div>
                    <textarea value={ocrText} onChange={e => setOcrText(e.target.value)}
                      rows={4} className="input-base" style={{ resize: 'none', fontSize: 13 }} />
                  </div>
                )}
              </div>
            )}
          </div>

        ) : (
          /* ── Text / URL / Social / Smart ─────────────────── */
          <div>
            <div style={{ position: 'relative' }}>
              {isUrl ? (
                <input type="url" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={MODES.find(m => m.value === mode)?.placeholder}
                  className="input-base"
                  style={{ paddingRight: 36 }}
                />
              ) : (
                <textarea ref={textRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={MODES.find(m => m.value === mode)?.placeholder}
                  rows={mode === 'text' ? 4 : 3}
                  className="input-base"
                  style={{ resize: 'none', paddingRight: 36 }}
                />
              )}
              {/* Inline camera button */}
              <button title="Upload screenshot"
                onClick={() => inlineRef.current?.click()}
                style={S.inlineCameraBtn}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--signal-indigo)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Camera style={{ width: 15, height: 15 }} />
              </button>
              <input ref={inlineRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { setMode('image'); processImageFile(f) } }} />
            </div>

            <div style={S.metaRow}>
              <span style={S.metaText}>{input.length} chars</span>
              <span style={S.metaText}>Ctrl+Enter to submit</span>
            </div>

            {/* Twitter manual paste prompt */}
            {(mode === 'social' || (mode === 'smart' && (input.includes('twitter.com') || input.includes('x.com')))) && !showManual && (
              <button onClick={() => setShowManual(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
                color: 'var(--signal-indigo)', background: 'none', border: 'none',
                cursor: 'pointer', marginBottom: 12, padding: 0,
              }}>
                <Twitter style={{ width: 11, height: 11 }} />
                Add tweet text manually
              </button>
            )}

            {showManual && (
              <div style={S.twitterBar}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <AlertCircle style={{ width: 13, height: 13, color: 'var(--signal-mixed)', marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 11.5, color: 'var(--signal-mixed)', lineHeight: 1.5 }}>
                    Twitter/X blocks automated access. Paste the tweet text below.
                  </p>
                </div>
                <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                  rows={3} placeholder="Paste tweet text here..."
                  className="input-base" style={{ resize: 'none', fontSize: 13 }} />
              </div>
            )}

            {/* Example suggestions */}
            {(mode === 'text' || mode === 'smart') && !input && (
              <div style={{ marginBottom: 14 }}>
                <p style={S.exampleLabel}>Try an example:</p>
                <div style={S.exampleChips}>
                  {EXAMPLES.map(c => (
                    <button key={c}
                      onClick={() => { setInput(c); textRef.current?.focus() }}
                      style={S.chip}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(108,142,255,0.1)'
                        ;(e.currentTarget as HTMLElement).style.color = 'var(--signal-indigo)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(108,142,255,0.25)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
                        ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'
                      }}
                    >
                      {c.substring(0, 38)}…
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Submit button ─────────────────────────────────── */}
        <button onClick={handleSubmit} disabled={!canSubmit}
          style={canSubmit ? S.submitActive : S.submitDisabled}
          onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          {loading ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles style={{ width: 14, height: 14 }} />
              Analyze claim
            </>
          )}
        </button>
      </div>
    </div>
  )
}
