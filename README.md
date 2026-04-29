# TruthLens

TruthLens is an AI-powered fact-checking platform built to help users quickly assess the credibility of online claims, headlines, URLs, and trending stories. It combines evidence retrieval, source comparison, and structured AI reasoning to present clear verdicts in a fast and user-friendly experience.

**Live Demo:** https://YOUR-LIVE-LINK.vercel.app

---

## Overview

Misinformation spreads quickly across social platforms, messaging apps, and news feeds. TruthLens was created as a practical response to that problem — giving users a simple way to verify information before sharing or trusting it.

The platform is designed to be accessible for everyday users while also demonstrating a modern full-stack implementation using real-world APIs, authentication, and production deployment workflows.

---

## Key Features

- **Claim Verification**  
  Analyze text-based claims and receive a verdict with supporting reasoning.

- **URL & Article Checking**  
  Submit article links for content-based credibility analysis.

- **Quick Fact Check**  
  Perform fast checks on trending headlines directly from the Signals page.

- **Signals Feed**  
  Discover current news topics and rapidly evaluate emerging stories.

- **Credibility Score**  
  Each result includes a confidence score to help interpret reliability.

- **User Dashboard**  
  Logged-in users can review previous checks and saved items.

- **Authentication**  
  Secure sign-in with email and Google authentication.

- **Theme Support**  
  Clean light and dark mode experience across devices.

- **Responsive Design**  
  Optimized for desktop, tablet, and mobile screens.

---

## How It Works

1. A user submits a claim, URL, or trending topic.  
2. Relevant evidence and contextual signals are gathered.  
3. AI reasoning evaluates consistency, credibility, and contradictions.  
4. TruthLens returns a structured result with score, verdict, and summary.

---

## Technology Stack

| Layer | Tools Used |
|------|------------|
| Frontend | Next.js 14, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase |
| Authentication | Supabase Auth |
| AI Integration | OpenRouter API |
| Deployment | Vercel |

---

## Screenshots

### Home
Add: `screenshots/home.png`

### Login
Add: `screenshots/login.png`

### Verify Claim
Add: `screenshots/verify.png`

### Quick Fact Check
Add: `screenshots/quick-check.png`

### Signals Feed
Add: `screenshots/signals.png`

### Dashboard
Add: `screenshots/dashboard.png`

### About Page
Add: `screenshots/about.png`

### Dark Mode
Add: `screenshots/dark-home.png`

---

## Local Development

```bash
git clone https://github.com/YOUR-USERNAME/truthlens.git
cd truthlens
npm install
npm run dev
