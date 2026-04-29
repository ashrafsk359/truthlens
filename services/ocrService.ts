// OCR service v2 — multi-language, client-side Tesseract.js

export interface OcrResult {
  text: string
  confidence: number
  detectedLang: string
  success: boolean
  error?: string
}

// Language configs for Tesseract — maps lang code to tesseract lang string
const LANG_MAP: Record<string, string> = {
  en:  'eng',
  hi:  'hin',
  te:  'tel',
  ta:  'tam',
  ur:  'urd',
  kn:  'kan',
  ml:  'mal',
  auto: 'eng+hin+tel+tam',   // try common Indian langs together
}

// Simple heuristic language detector based on Unicode ranges
export function detectLanguage(text: string): string {
  if (!text) return 'en'
  const counts: Record<string, number> = { hi: 0, te: 0, ta: 0, kn: 0, ml: 0, ur: 0 }

  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp >= 0x0900 && cp <= 0x097F) counts.hi++   // Devanagari (Hindi)
    if (cp >= 0x0C00 && cp <= 0x0C7F) counts.te++   // Telugu
    if (cp >= 0x0B80 && cp <= 0x0BFF) counts.ta++   // Tamil
    if (cp >= 0x0C80 && cp <= 0x0CFF) counts.kn++   // Kannada
    if (cp >= 0x0D00 && cp <= 0x0D7F) counts.ml++   // Malayalam
    if (cp >= 0x0600 && cp <= 0x06FF) counts.ur++   // Arabic/Urdu
  }

  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (max[1] > text.length * 0.1) return max[0]
  return 'en'
}

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en',   label: 'English' },
  { code: 'hi',   label: 'हिंदी (Hindi)' },
  { code: 'te',   label: 'తెలుగు (Telugu)' },
  { code: 'ta',   label: 'தமிழ் (Tamil)' },
  { code: 'ur',   label: 'اردو (Urdu)' },
  { code: 'kn',   label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml',   label: 'മലയാളം (Malayalam)' },
]

export async function extractTextFromImage(
  imageFile: File,
  langCode = 'auto'
): Promise<OcrResult> {
  try {
    const Tesseract = await import('tesseract.js')
    const tessLang  = LANG_MAP[langCode] || 'eng'

    const result = await Tesseract.recognize(imageFile, tessLang, {
      logger: () => {},
    })

    const text       = result.data.text.trim()
    const confidence = result.data.confidence

    if (!text || text.length < 3) {
      return { text: '', confidence: 0, detectedLang: 'en', success: false,
        error: 'No readable text found in the image.' }
    }

    const detectedLang = langCode === 'auto' ? detectLanguage(text) : langCode

    return { text, confidence, detectedLang, success: true }
  } catch (err) {
    return {
      text: '', confidence: 0, detectedLang: 'en', success: false,
      error: err instanceof Error ? err.message : 'OCR failed. Try a clearer image.',
    }
  }
}

export function getImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}
