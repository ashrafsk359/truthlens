'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Link2, FileText, MessageSquare } from 'lucide-react'
import type { InputType } from '@/types'

interface Props {
  onSubmit: (input: string, type: InputType) => void
  loading?: boolean
  defaultValue?: string
}

const inputTypes: { value: InputType; label: string; icon: React.ElementType; placeholder: string }[] = [
  { value: 'claim', label: 'Claim / Headline', icon: MessageSquare, placeholder: 'e.g. "Scientists discover coffee cures all diseases"' },
  { value: 'article', label: 'Article text', icon: FileText, placeholder: 'Paste full article text here (300+ characters)...' },
  { value: 'url', label: 'URL', icon: Link2, placeholder: 'https://example.com/article...' },
]

const EXAMPLE_CLAIMS = [
  "Scientists discover a new planet with signs of liquid water",
  "India overtakes China as world's most populous country",
  "New study links 5G towers to memory loss",
  "WHO declares global health emergency over new virus",
]

export default function ClaimInput({ onSubmit, loading, defaultValue = '' }: Props) {
  const [inputType, setInputType] = useState<InputType>('claim')
  const [input, setInput] = useState(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeType = inputTypes.find((t) => t.value === inputType)!
  const isUrl = inputType === 'url'
  const canSubmit = input.trim().length > 0 && !loading

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(input.trim(), inputType)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex gap-1.5 mb-4 bg-gray-50 p-1 rounded-xl">
        {inputTypes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setInputType(value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all',
              inputType === value
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {isUrl ? (
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeType.placeholder}
          className="input-base mb-4"
        />
      ) : (
        <>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeType.placeholder}
            rows={inputType === 'article' ? 6 : 3}
            className="input-base resize-none mb-1"
          />
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-400">{input.length} characters</span>
            <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
          </div>
        </>
      )}

      {inputType === 'claim' && !input && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_CLAIMS.map((c) => (
              <button
                key={c}
                onClick={() => setInput(c)}
                className="text-xs px-2.5 py-1 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-lg border border-gray-100 transition-colors"
              >
                {c.substring(0, 40)}…
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
          canSubmit
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <> ⚡ Analyze claim </>
        )}
      </button>
    </div>
  )
}
