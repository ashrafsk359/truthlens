import type { VerificationResult, VerdictType, ConfidenceLevel } from '@/types'

export type AIProvider = 'openrouter' | 'groq' | 'gemini' | 'openai'

export function detectProvider(): AIProvider {
  if (process.env.OPENROUTER_API_KEY) return 'openrouter'
  if (process.env.GROQ_API_KEY) return 'groq'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENAI_API_KEY) return 'openai'
  throw new Error('No AI API key found. Add OPENROUTER_API_KEY or GROQ_API_KEY to your .env.local file.')
}

const SYSTEM_PROMPT = `You are a neutral, evidence-based fact-check analyst for TruthLens.
RULES:
- Be strictly neutral. No political, cultural, or ideological bias.
- Never guess. If evidence is insufficient, say "Unverified".
- If sources conflict, use "Mixed / Context Needed" or "Disputed".
- Admit uncertainty clearly.
VERDICTS (choose exactly one): Verified | Likely True | Mixed / Context Needed | Misleading | Unverified | Likely False | Disputed
CREDIBILITY SCORE (0-100): 80-100 strong support, 60-79 mostly supported, 40-59 mixed, 20-39 leans false, 0-19 strong evidence against.
Return ONLY valid JSON — no markdown fences, no text outside the JSON object.`

const buildUserPrompt = (claim: string, evidence?: string) => `Analyze this claim for factual accuracy:

CLAIM: "${claim}"
${evidence ? `\nRELATED EVIDENCE:\n${evidence}\n` : ''}
Return a JSON object with EXACTLY these fields:
{
  "verdict": "<one of the 7 verdict types>",
  "confidence": "<Low|Medium|High>",
  "credibility_score": <0-100 integer>,
  "summary": "<2-3 neutral sentences>",
  "reasoning_points": ["<point 1>", "<point 2>", "<point 3>"],
  "contradictions": ["<contra 1>", "<contra 2>"],
  "source_alignment": [
    {"name": "<source name>", "url": "<https://url>", "snippet": "<brief description>", "supports": true, "domain": "<domain.com>"}
  ],
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}`

function parseResult(text: string, claim: string): VerificationResult {
  const clean = text.replace(/```json|```/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(match ? match[0] : clean) as Partial<VerificationResult>
  return {
    verdict: (parsed.verdict as VerdictType) || 'Unverified',
    confidence: (parsed.confidence as ConfidenceLevel) || 'Low',
    credibility_score: Math.min(100, Math.max(0, parsed.credibility_score || 50)),
    summary: parsed.summary || 'Insufficient information to provide a summary.',
    reasoning_points: parsed.reasoning_points || [],
    contradictions: parsed.contradictions || [],
    source_alignment: parsed.source_alignment || [],
    tags: parsed.tags || [],
    claim,
    input_type: 'claim',
  }
}

// OpenRouter — free models available
// Free model options: meta-llama/llama-3.1-8b-instruct:free | mistralai/mistral-7b-instruct:free | google/gemma-2-9b-it:free
export async function verifyWithOpenRouter(claim: string, evidence?: string): Promise<VerificationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY!
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free'
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'TruthLens',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(claim, evidence) },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenRouter error (${res.status})`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  return parseResult(text, claim)
}

// Groq — very fast, generous free tier
// Free model options: llama-3.1-8b-instant | llama3-8b-8192 | mixtral-8x7b-32768
export async function verifyWithGroq(claim: string, evidence?: string): Promise<VerificationResult> {
  const apiKey = process.env.GROQ_API_KEY!
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(claim, evidence) },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq error (${res.status})`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  return parseResult(text, claim)
}

// Gemini
export async function verifyWithGemini(claim: string, apiKey: string, evidence?: string): Promise<VerificationResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: buildUserPrompt(claim, evidence) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1200 },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini error (${res.status})`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseResult(text, claim)
}

// OpenAI
export async function verifyWithOpenAI(claim: string, apiKey: string, evidence?: string): Promise<VerificationResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(claim, evidence) },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI error (${res.status})`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  return parseResult(text, claim)
}