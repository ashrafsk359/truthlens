import { NextRequest, NextResponse } from 'next/server'
import { detectInput } from '@/services/inputDetector'
import { parseArticle } from '@/services/articleParser'
import { fetchRedditPost } from '@/services/socialParser'
import { searchEvidence } from '@/services/evidenceSearch'
import { analyzeWithAI } from '@/services/aiAnalyzer'
import { generateId } from '@/lib/utils'

export const maxDuration = 40

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { input, manualText, ocrText } = body   // ocrText NEW: passed from client OCR

    if (!input?.trim() && !ocrText?.trim()) {
      return NextResponse.json({ error: 'Input is required.' }, { status: 400 })
    }

    const rawInput   = input?.trim() || ocrText?.trim()
    const detected   = detectInput(rawInput)
    let claimText    = ''
    let context      = ''
    let articleMeta  = null

    // ── Content extraction ───────────────────────────────────────────
    switch (detected.kind) {
      case 'plain_text': {
        claimText = detected.textOnly
        break
      }
      case 'news_url':
      case 'generic_url': {
        const parsed = await parseArticle(detected.primaryUrl!)
        if (parsed.success) {
          claimText   = parsed.content.substring(0, 2000)
          articleMeta = parsed
          context     = [
            parsed.title       && `Title: ${parsed.title}`,
            parsed.author      && `Author: ${parsed.author}`,
            parsed.publishDate && `Published: ${parsed.publishDate}`,
            parsed.domain      && `Source: ${parsed.domain}`,
            parsed.excerpt     && `Excerpt: ${parsed.excerpt.substring(0, 200)}`,
          ].filter(Boolean).join('\n')
        } else {
          // Extraction blocked — build fallback claim from URL metadata
          // The caller (QuickCheckModal) may pass title/description as manualText
          const fallbackParts = [
            manualText?.trim(),                          // title+description from modal
            detected.primaryUrl,
          ].filter(Boolean)
          if (fallbackParts.length === 0) {
            return NextResponse.json({
              error: `Couldn't read that page. ${parsed.error || ''} Try pasting article text instead.`,
              errorType: 'extraction_failed',
            }, { status: 422 })
          }
          claimText  = fallbackParts.join(' — ').substring(0, 800)
          context    = `Source URL: ${detected.primaryUrl}\nNote: Page could not be scraped. Analysis based on headline/description only.`
          // Signal to frontend that fallback was used
          ;(body as Record<string, unknown>)._usedFallback = true
        }
        break
      }
      case 'twitter_url': {
        if (manualText?.trim()) {
          claimText = manualText.trim()
          context   = `Source: Twitter/X post at ${detected.primaryUrl}`
        } else {
          return NextResponse.json({
            error: 'Twitter/X blocks automated access. Please paste the post text below.',
            errorType: 'manual_input_needed', platform: 'twitter',
            hint: 'Twitter/X blocks automated access. Please paste the tweet text.',
          }, { status: 422 })
        }
        break
      }
      case 'reddit_url': {
        const post = await fetchRedditPost(detected.primaryUrl!)
        if (post.extractedText) {
          claimText = post.extractedText
          context   = `Source: Reddit u/${post.author || 'unknown'}`
        } else if (manualText?.trim()) {
          claimText = manualText.trim()
          context   = `Source: Reddit post at ${detected.primaryUrl}`
        } else {
          return NextResponse.json({
            error: post.hint, errorType: 'manual_input_needed', platform: 'reddit',
          }, { status: 422 })
        }
        break
      }
      case 'youtube_url': {
        if (manualText?.trim()) {
          claimText = manualText.trim()
          context   = `Source: YouTube at ${detected.primaryUrl}`
        } else {
          return NextResponse.json({
            error: "YouTube can't be auto-analyzed. Paste the claim or quote from the video.",
            errorType: 'manual_input_needed', platform: 'youtube',
          }, { status: 422 })
        }
        break
      }
      case 'mixed': {
        claimText = detected.textOnly
        if (detected.primaryUrl) {
          const parsed = await parseArticle(detected.primaryUrl).catch(() => null)
          if (parsed?.success) {
            context     = `Supporting URL — ${parsed.title} (${parsed.domain}): ${parsed.excerpt?.substring(0, 200)}`
            articleMeta = parsed
          } else {
            context = `Supporting URL: ${detected.primaryUrl}`
          }
        }
        break
      }
      case 'multi_url': {
        const parsed = await parseArticle(detected.urls[0]).catch(() => null)
        if (parsed?.success) {
          claimText   = parsed.content.substring(0, 2000)
          articleMeta = parsed
          context     = `Title: ${parsed.title} · Source: ${parsed.domain}`
        } else {
          claimText = detected.urls.join(' ')
        }
        break
      }
    }

    // If input was from OCR, use it as the claim
    if (!claimText.trim() && ocrText?.trim()) {
      claimText = ocrText.trim()
      context   = 'Content extracted from screenshot via OCR.'
    }

    if (!claimText.trim()) {
      return NextResponse.json({ error: 'Could not extract content to analyze.' }, { status: 422 })
    }

    // ── Parallel: search evidence + (skip heavy ops) ─────────────────
    const { articles, evidenceText, hasFreshSources, freshnessSummary, isTimeSensitive } =
      await searchEvidence(claimText)

    // ── AI analysis — pass ocrText separately for proper treatment ───
    const result = await analyzeWithAI(claimText, context, evidenceText, ocrText?.trim())

    // ── Merge news articles into source_alignment ────────────────────
    if (articles.length > 0) {
      const existing = new Set(result.source_alignment.map(s => s.url))
      const extras   = articles.slice(0, 3)
        .filter(a => !existing.has(a.url))
        .map(a => ({
          name: a.source || a.domain,
          url: a.url, snippet: a.description || a.title,
          supports: true, domain: a.domain, publishedAt: a.publishedAt,
        }))
      result.source_alignment = [...result.source_alignment, ...extras].slice(0, 5)
    }

    result.id         = generateId()
    result.claim      = rawInput.substring(0, 500)
    result.created_at = new Date().toISOString()
    if (!result.freshness_note && freshnessSummary) result.freshness_note = freshnessSummary

    return NextResponse.json({
      result,
      meta: {
        inputKind: detected.kind,
        domain: detected.domain,
        hasFreshSources,
        freshnessSummary,
        isTimeSensitive,
        articleMeta: articleMeta ? {
          title:       (articleMeta as { title: string }).title,
          domain:      (articleMeta as { domain: string }).domain,
          author:      (articleMeta as { author: string }).author,
          publishDate: (articleMeta as { publishDate: string }).publishDate,
          imageUrl:    (articleMeta as { imageUrl: string }).imageUrl,
          faviconUrl:  (articleMeta as { faviconUrl: string }).faviconUrl,
          excerpt:     (articleMeta as { excerpt: string }).excerpt,
          wordCount:   (articleMeta as { wordCount: number }).wordCount,
        } : null,
      },
    }, { status: 200 })

  } catch (error) {
    console.error('Verify error:', error)
    const msg = error instanceof Error ? error.message : 'Verification failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
