// AI Provider abstraction — switch models/APIs via environment variables
//
// .env.local options:
//   AI_PROVIDER=openrouter   AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
//   AI_PROVIDER=groq         AI_MODEL=llama-3.1-8b-instant
//   AI_PROVIDER=openai       AI_MODEL=gpt-4o-mini
//   AI_PROVIDER=gemini       (uses GEMINI_API_KEY)
//
// If unset: falls back to OPENROUTER_API_KEY → GROQ_API_KEY detection

export type ProviderName = 'openrouter' | 'groq' | 'openai' | 'gemini'

export interface ProviderConfig {
  name: ProviderName
  model: string
  apiKey: string
  baseUrl: string
  authHeader: string  // 'Bearer' or 'x-goog-api-key'
}

export function resolveProvider(): ProviderConfig {
  const envProvider = (process.env.AI_PROVIDER || '').toLowerCase() as ProviderName
  const envModel    = process.env.AI_MODEL || ''
  const envKey      = process.env.AI_API_KEY || ''

  // Explicit env config takes priority
  if (envProvider && envKey) {
    return buildConfig(envProvider, envModel, envKey)
  }

  // Auto-detect from individual keys (backward compat)
  if (process.env.OPENROUTER_API_KEY) {
    return buildConfig(
      'openrouter',
      process.env.OPENROUTER_MODEL || 'openrouter/free',
      process.env.OPENROUTER_API_KEY
    )
  }
  if (process.env.GROQ_API_KEY) {
    return buildConfig(
      'groq',
      process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      process.env.GROQ_API_KEY
    )
  }
  if (process.env.OPENAI_API_KEY) {
    return buildConfig('openai', 'gpt-4o-mini', process.env.OPENAI_API_KEY)
  }

  throw new Error(
    'No AI provider configured. Add OPENROUTER_API_KEY, GROQ_API_KEY, or set AI_PROVIDER + AI_API_KEY in .env.local'
  )
}

function buildConfig(name: ProviderName, model: string, apiKey: string): ProviderConfig {
  const CONFIGS: Record<ProviderName, Omit<ProviderConfig, 'apiKey'>> = {
    openrouter: {
      name: 'openrouter',
      model: model || 'meta-llama/llama-3.1-8b-instruct:free',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      authHeader: 'Bearer',
    },
    groq: {
      name: 'groq',
      model: model || 'llama-3.1-8b-instant',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      authHeader: 'Bearer',
    },
    openai: {
      name: 'openai',
      model: model || 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      authHeader: 'Bearer',
    },
    gemini: {
      name: 'gemini',
      model: model || 'gemini-2.0-flash',
      baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent`,
      authHeader: 'x-goog-api-key',
    },
  }
  return { ...CONFIGS[name], apiKey }
}

// Normalized call — same interface regardless of provider
export async function callProvider(
  config: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (config.name === 'gemini') {
    return callGemini(config, systemPrompt, userPrompt, signal)
  }
  return callOpenAICompatible(config, systemPrompt, userPrompt, signal)
}

async function callOpenAICompatible(
  config: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `${config.authHeader} ${config.apiKey}`,
  }
  if (config.name === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    headers['X-Title'] = 'TruthLens'
  }

  const res = await fetch(config.baseUrl, {
    method: 'POST', signal,
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1400,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message || `${config.name} API error ${res.status}`)
  }
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

async function callGemini(
  config: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const url = `${config.baseUrl}?key=${config.apiKey}`
  const res = await fetch(url, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1400 },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`)
  }
  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
