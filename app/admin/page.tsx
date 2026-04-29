'use client'

import { useState } from 'react'
import { Shield, Globe, Ban, Activity, ToggleLeft, ToggleRight, Plus, Trash2, Lock } from 'lucide-react'

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'

const INITIAL_TRUSTED = [
  'reuters.com', 'apnews.com', 'bbc.com', 'who.int',
  'cdc.gov', 'nih.gov', 'pib.gov.in', 'theguardian.com',
  'nature.com', 'science.org', 'factcheck.org', 'snopes.com',
]

const INITIAL_BLOCKED: string[] = ['fakenews-daily.com', 'clickbait-central.net']

const MOCK_LOGS = [
  { id: '1', claim: 'Scientists discover coffee cures cancer', verdict: 'Likely False', score: 18, ip: '192.168.1.x', ts: '2 min ago' },
  { id: '2', claim: 'India surpasses China in population', verdict: 'Verified', score: 92, ip: '10.0.0.x', ts: '8 min ago' },
  { id: '3', claim: 'WHO declares new global emergency', verdict: 'Unverified', score: 45, ip: '172.16.x.x', ts: '15 min ago' },
]

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keyErr, setKeyErr] = useState(false)
  const [trusted, setTrusted] = useState(INITIAL_TRUSTED)
  const [blocked, setBlocked] = useState(INITIAL_BLOCKED)
  const [newTrusted, setNewTrusted] = useState('')
  const [newBlocked, setNewBlocked] = useState('')
  const [features, setFeatures] = useState({
    newsapi: true, gnews: false, urlScraping: true, rateLimit: true, guestMode: true,
  })

  function login() {
    if (keyInput === ADMIN_KEY) { setAuthed(true); setKeyErr(false) }
    else setKeyErr(true)
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Admin access</h1>
        <p className="text-sm text-gray-500 mb-6">Enter admin key to continue</p>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()}
          placeholder="Admin key..."
          className={`input-base mb-3 ${keyErr ? 'border-red-400' : ''}`}
        />
        {keyErr && <p className="text-xs text-red-500 mb-3">Invalid key</p>}
        <button onClick={login} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
          Login
        </button>
        <p className="text-xs text-gray-400 mt-3">Default key: admin123 (change in .env)</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-medium text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" /> Admin panel
        </h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
          Authenticated
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'API calls today', val: '284' },
          { label: 'Checks today', val: '127' },
          { label: 'Error rate', val: '2.1%' },
          { label: 'Avg latency', val: '4.2s' },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-xl font-semibold text-gray-900">{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Trusted domains */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" /> Trusted domains ({trusted.length})
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              className="input-base flex-1 py-1.5 text-xs"
              placeholder="domain.com"
              value={newTrusted}
              onChange={(e) => setNewTrusted(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTrusted.trim()) {
                  setTrusted([...trusted, newTrusted.trim()])
                  setNewTrusted('')
                }
              }}
            />
            <button
              onClick={() => { if (newTrusted.trim()) { setTrusted([...trusted, newTrusted.trim()]); setNewTrusted('') } }}
              className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {trusted.map((d) => (
              <div key={d} className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-700 font-mono">{d}</span>
                <button onClick={() => setTrusted(trusted.filter((x) => x !== d))} className="text-gray-300 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked domains */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" /> Blocked domains ({blocked.length})
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              className="input-base flex-1 py-1.5 text-xs"
              placeholder="spamsite.com"
              value={newBlocked}
              onChange={(e) => setNewBlocked(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newBlocked.trim()) {
                  setBlocked([...blocked, newBlocked.trim()])
                  setNewBlocked('')
                }
              }}
            />
            <button
              onClick={() => { if (newBlocked.trim()) { setBlocked([...blocked, newBlocked.trim()]); setNewBlocked('') } }}
              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {blocked.map((d) => (
              <div key={d} className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-700 font-mono">{d}</span>
                <button onClick={() => setBlocked(blocked.filter((x) => x !== d))} className="text-gray-300 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Feature toggles</h2>
        <div className="space-y-2">
          {Object.entries(features).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
              <button
                onClick={() => setFeatures({ ...features, [key]: !val })}
                className={val ? 'text-indigo-600' : 'text-gray-300'}
              >
                {val ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation logs */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" /> Recent API logs
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_LOGS.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{log.claim}</p>
                <p className="text-xs text-gray-400 mt-0.5">{log.ip} · {log.ts}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-gray-500">{log.score}/100</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{log.verdict}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
