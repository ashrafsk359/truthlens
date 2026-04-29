// aiAnalyzer v5 — claim-type-aware, calibrated confidence, provider-abstracted
import type { VerificationResult, VerdictType, ConfidenceLevel } from '@/types'
import { resolveProvider, callProvider } from './aiProvider'

export type Freshness    = 'Recent' | 'Mixed' | 'Unknown' | 'Breaking'
export type ClaimCategory =
  | 'scientific_study'    // research findings, health stats, meta-analyses
  | 'technical_advice'    // device tips, software, engineering guidance
  | 'environmental_metric'// water usage, carbon, resource consumption
  | 'economic_business'   // productivity studies, economic data, surveys
  | 'policy_historical'   // government stats, historical records
  | 'sensational_viral'   // shocking headlines, extraordinary claims
  | 'established_fact'    // widely confirmed historical/demographic/geopolitical facts
  | 'general'             // everything else

export interface EnrichedResult extends VerificationResult {
  why: string[]
  freshness: Freshness
  search_topic: string
  search_url: string
  freshness_note: string
  claim_category: ClaimCategory
}

// ── Claim category detector ─────────────────────────────────────────
// Determines reasoning mode before sending to AI
export function detectClaimCategory(claim: string): ClaimCategory {
  const c = claim.toLowerCase()

  // Sensational viral markers — check first so they don't bleed into others
  const sensational = [
    'alien', 'ufo', 'nasa confirms', 'scientists prove', 'cure for cancer',
    'end of world', 'world war', 'secret', 'they don\'t want you',
    'doctors hate', 'one weird trick', 'miracle', 'conspiracy',
  ]
  if (sensational.some(s => c.includes(s))) return 'sensational_viral'

  // Scientific / health studies
  const sciMarkers = [
    'study', 'research', 'trial', 'journal', 'published', 'scientists',
    'risk', 'mortality', 'death', 'cancer', 'diabetes', 'heart', 'brain',
    'memory', 'neurological', 'cognitive', 'mental health',
    'calories', 'steps', 'exercise', 'sleep', 'diet', 'nutrients',
    'reduces', 'lowers', 'increases', 'linked to', 'associated with',
    'causes', 'effects', 'side effect', 'radiation', 'exposure',
    'percent', '%', 'fold', 'times more', 'risk of', 'loss',
  ]
  if (sciMarkers.filter(m => c.includes(m)).length >= 2) return 'scientific_study'

  // Technical advice
  const techMarkers = [
    'battery', 'charge', 'phone', 'laptop', 'computer', 'software',
    'extend', 'lifespan', 'performance', 'speed', 'cpu', 'ram', 'storage',
    'screen', 'wifi', 'internet', 'app', 'update', 'settings', 'mode',
  ]
  if (techMarkers.filter(m => c.includes(m)).length >= 2) return 'technical_advice'

  // Environmental / resource metrics
  const envMarkers = [
    'litre', 'liter', 'gallon', 'water', 'carbon', 'co2', 'emission',
    'footprint', 'energy', 'plastic', 'waste', 'recycle', 'pollution',
    'kg', 'produce', 'produce', 'agriculture', 'ethanol', 'fuel',
  ]
  if (envMarkers.filter(m => c.includes(m)).length >= 2) return 'environmental_metric'

  // Economic / business studies
  const bizMarkers = [
    'productivity', 'workweek', 'week', 'salary', 'wage', 'gdp',
    'economy', 'business', 'company', 'profit', 'revenue', 'worker',
    'employee', 'burnout', 'remote', 'hybrid', 'output', 'efficiency',
  ]
  if (bizMarkers.filter(m => c.includes(m)).length >= 2) return 'economic_business'

  // Policy / historical
  const policyMarkers = [
    'government', 'policy', 'law', 'bill', 'act', 'parliament', 'congress',
    'president', 'minister', 'election', 'vote', 'history', 'according to',
    'report says', 'data shows', 'statistics', 'census',
  ]
  if (policyMarkers.filter(m => c.includes(m)).length >= 2) return 'policy_historical'

  // Established facts — well-documented historical, demographic, geopolitical events
  // These should NOT rely on recent news — authoritative sources suffice
  const establishedMarkers = [
    // Demographics & geography
    'most populous', 'population', 'overtook', 'overtaken', 'largest', 'smallest',
    'capital', 'continent', 'country', 'nation', "world's", 'officially',
    // Historical events with specific years
    'declared', 'founded', 'established', 'signed', 'ratified', 'passed',
    'independence', 'partition', 'war ended', 'treaty', 'constitution',
    // Scientific consensus / geography
    'revolves', 'orbits', 'gravity', 'speed of light', 'dna', 'evolution',
    // UN / WHO / international body facts
    'united nations', 'world health', 'world bank', 'imf', 'who declared',
    'pandemic declared', 'global', 'international',
    // Indian political / legislative milestones
    'reservation bill', 'article', 'amendment', 'lok sabha', 'rajya sabha',
    'supreme court', 'high court', 'budget', 'gst', 'demonetisation',
  ]
  // Must have 2+ markers AND no strong time-sensitive marker (not a breaking story)
  const freshMarkers = ['quits','quit','joins','joined','resigns','resigned','fired','just','breaking','hours ago']
  const isFreshBreaking = freshMarkers.some(m => c.includes(m))
  if (!isFreshBreaking && establishedMarkers.filter(m => c.includes(m)).length >= 2) {
    return 'established_fact'
  }
  // Single very strong established-fact markers
  const strongEstablished = [
    'most populous country', 'revolves around', 'orbits the sun',
    'pandemic in 2020', "women's reservation", 'covid pandemic declared',
  ]
  if (strongEstablished.some(m => c.includes(m))) return 'established_fact'

  return 'general'
}

// ── Category-specific reasoning instructions ────────────────────────
const CATEGORY_CONTEXT: Record<ClaimCategory, string> = {
  scientific_study: `CLAIM TYPE: Scientific/Health Study Claim
REASONING RULES:
- Many health statistics come from real peer-reviewed studies. Do NOT dismiss them for being "niche".
- Check if the general principle (not just the exact number) is supported by research.
- If exact figure varies by study but direction is correct: verdict = Likely True, score 65-80.
- If claim reflects established health consensus: score 75-90.
- NEVER give score below 45 for a claim with directional scientific support.
- State clearly: "Research supports the general finding, though exact figures vary by study."`,

  technical_advice: `CLAIM TYPE: Technical/Device Advice Claim
REASONING RULES:
- Battery optimization and tech maintenance tips often come from real engineering documentation.
- If claim reflects widely documented technical guidance: score 60-80.
- If claim is directionally correct but simplified: Mixed / score 55-70.
- Do NOT penalize technical simplification as "false".
- State: "This reflects standard technical guidance, though results vary by device/conditions."`,

  environmental_metric: `CLAIM TYPE: Environmental/Resource Metric
REASONING RULES:
- Water usage, carbon footprint, and resource consumption figures come from agricultural/industrial reports.
- Exact numbers vary by source, region, and method. This is EXPECTED, not a sign of falsehood.
- If claim is in the documented range: Likely True / score 65-80.
- If claim uses one methodology's figure: Mixed / score 55-70.
- Never dismiss numeric resource claims without checking ranges.
- State: "This figure appears in documented sources, though exact amounts vary by methodology."`,

  economic_business: `CLAIM TYPE: Economic/Business Study Claim
REASONING RULES:
- Productivity studies, 4-day workweek trials, salary surveys are real and widely published.
- Exact percentages vary by study, company size, and sector. This is normal, not suspicious.
- If claim directionally matches published research: Likely True or Mixed / score 55-75.
- If only one or two studies support it: Mixed / Medium confidence / score 50-68.
- State: "Multiple studies support this directionally, though exact figures vary."`,

  policy_historical: `CLAIM TYPE: Policy/Historical Statistic
REASONING RULES:
- Government statistics, historical data, and official reports are generally verifiable.
- If claim matches known policy or historical record: Verified or Likely True / score 70-90.
- If from single report or contested data: Mixed / score 55-70.
- Use calibrated confidence, not blanket skepticism.`,

  sensational_viral: `CLAIM TYPE: Sensational/Viral Claim
REASONING RULES:
- Apply heightened skepticism. Extraordinary claims need extraordinary evidence.
- If no credible source found: Unverified or Likely False / score 10-35.
- If partially true but misleadingly framed: Misleading / score 25-45.`,

  established_fact: `CLAIM TYPE: Established Fact Claim
REASONING RULES:
- These are well-documented facts confirmed by authoritative international or official sources.
- Do NOT rely only on recent news headlines. Use your training knowledge from authoritative sources.
- Acceptable authoritative sources: UN, WHO, World Bank, IMF, national census bureaus, Supreme Courts, parliaments, encyclopedic sources, peer-reviewed data.
- If claim is widely confirmed: verdict = Verified or Likely True, score 75-92.
- If claim has minor nuance (timing, exact number): verdict = Likely True, score 68-80.
- NEVER say "No recent evidence confirms" for established facts. Instead use:
  * "Widely reported and confirmed by authoritative estimates"
  * "Established by official data and reputable international sources"
  * "Historically confirmed by multiple authoritative sources"
  * "Supported by UN/official data as of [year]"
- Score floor: 60. These are not fringe claims.
- Example verdicts: India's population surpassing China → Verified / 80-88`,

  general: `CLAIM TYPE: General Claim
REASONING RULES:
- Apply standard fact-checking. Look for supporting and contradicting evidence.
- If no evidence found either way: Unverified / score 35-50. Do NOT default to very low scores.
- If partial support exists: Mixed / score 45-65.`,
}

// ── Search URL builder ──────────────────────────────────────────────
export function buildSearchUrl(claim: string): string {
  const stopWords = new Set([
    'did','does','is','are','was','were','has','have','had','will','can','a','an',
    'the','this','that','these','those','in','on','at','by','for','with','to','of',
    'from','about','really','actually','apparently','reportedly','allegedly',
  ])
  const words = claim.replace(/[?!.,;:'"]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())).slice(0, 7)
  return `https://www.google.com/search?q=${encodeURIComponent(words.join(' ') + ' is it true research')}`
}

export function extractSearchTopic(claim: string): string {
  const stopWords = new Set([
    'did','does','is','are','was','were','has','have','had','will','can','a','an',
    'the','this','that','in','on','at','by','for','with','to','of','from',
    'really','actually','apparently','reportedly','allegedly','today','just','now',
  ])
  return claim.replace(/[?!.,;:'"]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())).slice(0, 6).join(' ')
}

// ── OCR context builder ─────────────────────────────────────────────
function buildOcrContext(ocrText: string): string {
  if (!ocrText?.trim()) return ''
  const hasUsername  = /@\w+/.test(ocrText)
  const hasTimestamp = /\d{1,2}[:/]\d{2}|\d{4}[-/]\d{2}[-/]\d{2}|am|pm|ago|today/i.test(ocrText)
  const hasNumbers   = /\d{3,}/.test(ocrText)
  const hasHashtag   = /#\w+/.test(ocrText)
  const mentionedSource = ocrText.match(/(?:reuters|bbc|ndtv|cnn|apnews|guardian|times|post|news|pib|government|ministry|official)/i)?.[0]
  const signals = [
    hasUsername && 'contains username/handle',
    hasTimestamp && 'contains timestamp',
    hasNumbers && 'contains numerical data',
    hasHashtag && 'contains hashtags',
    mentionedSource && `mentions source: ${mentionedSource}`,
  ].filter(Boolean)

  return `SCREENSHOT/IMAGE EVIDENCE (treat as primary source):
Raw OCR text:
${ocrText.substring(0, 1500)}

Detected signals: ${signals.length ? signals.join(', ') : 'general text'}
Note: This text was extracted from a screenshot. Acknowledge visible content as real evidence.`
}

// ── System prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TruthLens — a precise, calibrated evidence analyst. Your role is to assess claims fairly, neither too harshly nor too leniently.

CRITICAL ANTI-BIAS RULES:
1. Do NOT default to low confidence for niche, statistical, or research-based claims.
2. Many real studies produce findings that are not "mainstream news" — that does not make them false.
3. If a claim is directionally supported by evidence but exact figures vary: use Likely True or Mixed, NOT Unverified.
4. If claim comes from documented research: minimum score 50. Never 15-30 for study-backed claims.
5. If screenshot/OCR text is present, it IS evidence — never say "no evidence exists."
6. No political bias. No assumptions beyond supplied evidence.

CONFIDENCE CALIBRATION:
- HIGH: Multiple credible sources confirm. Established consensus. Score 75-100.
- MEDIUM: Direction supported, exact figures vary. One or few studies. Score 45-74.
- LOW: No credible support found. Contradictory evidence. Sensational unsupported. Score 0-44.

SUMMARY STYLE — use nuanced language:
✓ "Research supports this finding, though exact figures vary by study."
✓ "This reflects documented technical guidance, with results varying by conditions."
✓ "The general principle is well-established; the specific figure is an approximation."
✗ "No evidence confirms this." (banned unless truly no evidence exists)
✗ "This claim cannot be verified." (banned for study-based claims with directional support)

VERDICTS: Verified | Likely True | Mixed / Context Needed | Misleading | Unverified | Likely False | Disputed | Developing Story

OUTPUT: Return valid JSON only. No markdown fences. No text outside JSON.`

// ── Prompt builder ──────────────────────────────────────────────────
function buildPrompt(
  claim: string,
  context: string,
  evidence: string,
  ocrText?: string,
  claimCategory?: ClaimCategory
): string {
  const ocrSection      = ocrText ? `\n${buildOcrContext(ocrText)}\n` : ''
  const categoryContext = CATEGORY_CONTEXT[claimCategory || 'general']

  return `${categoryContext}

CLAIM: "${claim.substring(0, 400)}"
${context ? `\nCONTEXT:\n${context.substring(0, 500)}\n` : ''}${ocrSection}
RETRIEVED EVIDENCE:
${evidence.substring(0, 1800) || 'No web sources retrieved. Use your training knowledge. For study/research claims, apply MEDIUM confidence floor of 45 if the topic is a real research area.'}

Return JSON with EXACTLY these fields:
{
  "verdict": "<verdict>",
  "confidence": "<Low|Medium|High>",
  "freshness": "<Recent|Breaking|Mixed|Unknown>",
  "credibility_score": <0-100>,
  "summary": "<2-3 sentences — nuanced, not dismissive. State what research says, not just what you can't confirm.>",
  "why": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "freshness_note": "<one sentence on source recency>",
  "search_topic": "<3-6 word search phrase>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "recommended_next_step": "<specific action to verify further>",
  "supporting_sources": [{"name":"<outlet>","url":"<url>","snippet":"<what it says>","supports":true}],
  "contradictions": ["<any contradicting finding>"],
  "claim_category": "${claimCategory || 'general'}"
}`
}

// ── API caller — uses provider abstraction ──────────────────────────
async function callAI(prompt: string): Promise<string> {
  const provider = resolveProvider()
  const ctrl     = new AbortController()
  const timeout  = setTimeout(() => ctrl.abort(), 28000)
  try {
    return await callProvider(provider, SYSTEM_PROMPT, prompt, ctrl.signal)
  } finally {
    clearTimeout(timeout)
  }
}

// ── Score floor enforcer ────────────────────────────────────────────
// Prevents AI from giving absurdly low scores to study-backed claims
function enforceScoreFloor(score: number, category: ClaimCategory, verdict: VerdictType): number {
  const FLOORS: Partial<Record<ClaimCategory, number>> = {
    scientific_study:     45,
    technical_advice:     45,
    environmental_metric: 40,
    economic_business:    40,
    policy_historical:    40,
    established_fact:     60,
  }
  const floor = FLOORS[category] ?? 0
  // Only apply floor for non-false verdicts
  const isFalse = verdict === 'Likely False' || verdict === 'Disputed'
  return isFalse ? score : Math.max(score, floor)
}

// ── Response parser ─────────────────────────────────────────────────
function parseResponse(text: string, claim: string, category: ClaimCategory): EnrichedResult {
  const clean = text.replace(/```json|```/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI returned invalid JSON. Response: ' + text.substring(0, 300))

  const p = JSON.parse(match[0]) as Record<string, unknown>

  const verdict    = (p.verdict as VerdictType) || 'Unverified'
  const rawScore   = Math.min(100, Math.max(0, Number(p.credibility_score) || 50))
  const finalScore = enforceScoreFloor(rawScore, category, verdict)

  const searchTopic = String(p.search_topic || extractSearchTopic(claim))
  const searchUrl   = buildSearchUrl(claim)

  return {
    verdict,
    confidence:        (p.confidence as ConfidenceLevel) || 'Low',
    freshness:         (p.freshness as Freshness) || 'Unknown',
    credibility_score: finalScore,
    summary:           String(p.summary || 'Analysis unavailable.'),
    why:               (p.why as string[]) || [],
    reasoning_points:  (p.why as string[]) || [],
    contradictions:    (p.contradictions as string[]) || [],
    source_alignment:  ((p.supporting_sources as Array<{ name: string; url: string; snippet: string; supports: boolean }>) || []).map(s => ({
      name: s.name || '',
      url: s.url || '#',
      snippet: s.snippet || '',
      supports: s.supports !== false,
      domain: (() => { try { return new URL(s.url).hostname.replace('www.', '') } catch { return s.name } })(),
    })),
    tags:               (p.tags as string[]) || [],
    recommended_next_step: String(p.recommended_next_step || ''),
    search_topic:       searchTopic,
    search_url:         searchUrl,
    freshness_note:     String(p.freshness_note || ''),
    claim_category:     category,
    claim,
    input_type: 'claim',
    recommended_links: {
      google:   searchUrl,
      news:     `https://news.google.com/search?q=${encodeURIComponent(searchTopic)}`,
      youtube:  `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTopic)}`,
      official: `https://www.google.com/search?q=${encodeURIComponent(searchTopic + ' site:gov OR site:who.int OR site:pubmed.ncbi.nlm.nih.gov')}`,
    },
  }
}

// ── Main export ─────────────────────────────────────────────────────
export async function analyzeWithAI(
  claim: string,
  context: string,
  evidenceText: string,
  ocrText?: string,
): Promise<EnrichedResult> {
  const category = detectClaimCategory(claim)
  const prompt   = buildPrompt(claim, context, evidenceText, ocrText, category)

  const text = await callAI(prompt)

  return parseResponse(text, claim, category)
}
