# TruthLens — AI-Powered Claim Verification Platform

> Verify news headlines, viral claims, and articles using Gemini AI + real-time evidence retrieval.

![TruthLens](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4)

---

## Features

- **7 verdict levels** — Verified, Likely True, Mixed, Misleading, Unverified, Likely False, Disputed
- **0–100 credibility score** — weighted multi-factor scoring
- **Evidence sources** — supporting and contradicting source cards
- **3 input types** — claim text, full article, or URL
- **Gemini 1.5 Flash** primary + OpenAI GPT-4o-mini fallback
- **Trending page** — most checked and disputed claims
- **Dashboard** — search history and saved claims
- **Admin panel** — domain management, feature toggles, API logs
- **Mobile-first** — fully responsive, touch-optimized

---

## Quick Start (Local)

### 1. Clone and install

```bash
git clone https://github.com/your-username/truthlens.git
cd truthlens
npm install
```

### 2. Configure environment

```bash
cp .env.template .env.local
```

Open `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (or OpenAI) | Get free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | Optional | Fallback AI provider |
| `NEWS_API_KEY` | Optional | Better evidence quality ([newsapi.org](https://newsapi.org)) |
| `GNEWS_API_KEY` | Optional | Alternative news provider |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Enables auth + history |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase public key |
| `NEXT_PUBLIC_ADMIN_KEY` | Recommended | Change from default `admin123` |

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/truthlens)

### Manual deploy

```bash
npm install -g vercel
vercel
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Set up Supabase (optional)

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste contents of `supabase/schema.sql`
3. Run the SQL to create all tables
4. Copy your project URL and anon key to `.env.local`

---

## Project Structure

```
truthlens/
├── app/
│   ├── page.tsx              # Landing page
│   ├── check/page.tsx        # Claim verification page
│   ├── trending/page.tsx     # Trending claims
│   ├── dashboard/page.tsx    # User dashboard
│   ├── about/page.tsx        # Methodology
│   ├── pricing/page.tsx      # Pricing plans
│   ├── admin/page.tsx        # Admin panel
│   ├── privacy/page.tsx      # Privacy policy
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Design system
│   └── api/
│       ├── verify/route.ts   # Core verification API
│       └── trending/route.ts # Trending data API
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── ui/                   # ClaimInput, LoadingState
│   ├── verdict/              # VerdictBadge, CredibilityGauge, ResultCard
│   └── sources/              # SourceCard
├── lib/
│   ├── gemini.ts             # Gemini + OpenAI integration
│   ├── newsapi.ts            # News evidence fetching
│   ├── scraper.ts            # URL content scraping
│   ├── supabase.ts           # Database helpers
│   ├── trending.ts           # Trending data
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema
├── .env.template             # Environment variables template
└── README.md
```

---

## API Reference

### POST `/api/verify`

Verifies a claim using Gemini AI.

**Request body:**
```json
{
  "input": "Your claim text or URL",
  "inputType": "claim | article | url",
  "geminiApiKey": "AIza...",
  "openaiApiKey": "sk-... (optional fallback)"
}
```

**Response:**
```json
{
  "result": {
    "id": "abc123",
    "verdict": "Likely True",
    "confidence": "Medium",
    "credibility_score": 72,
    "summary": "...",
    "reasoning_points": ["..."],
    "contradictions": ["..."],
    "source_alignment": [...],
    "tags": ["..."],
    "claim": "...",
    "input_type": "claim",
    "created_at": "2025-06-01T12:00:00Z"
  }
}
```

### GET `/api/trending`

Returns trending claims data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + DM Sans font |
| AI Primary | Google Gemini 1.5 Flash |
| AI Fallback | OpenAI GPT-4o-mini |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| News APIs | NewsAPI / GNews (optional) |

---

## License

MIT — Build on this freely.

---

## Roadmap

- [ ] Browser extension for in-page fact checking
- [ ] Screenshot OCR upload
- [ ] Compare two headlines side by side
- [ ] Follow-up AI chat on results
- [ ] Multi-language support
- [ ] Shareable result URLs
- [ ] Mobile app (React Native)
