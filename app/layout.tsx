import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Suspense } from 'react'
import NavigationProgress from '@/components/ui/NavigationProgress'
import ThemeProvider from '@/components/ui/ThemeProvider'

export const metadata: Metadata = {
  title: { default: 'TruthLens — Intelligence Verification Platform', template: '%s | TruthLens' },
  description: 'Verify news, claims, and viral posts using evidence-backed AI reasoning. Sourced, scored, transparent.',
  keywords: ['fact check', 'verification', 'AI', 'credibility', 'misinformation', 'news analysis'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: '/icons/icon.svg',
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'TruthLens' },
  openGraph: {
    title: 'TruthLens — Intelligence Verification Platform',
    description: 'Evidence-backed AI verification for news and viral claims.',
    type: 'website',
  },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="noise dark" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <ThemeProvider />
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <script dangerouslySetInnerHTML={{ __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))}` }} />
        <Footer />
      </body>
    </html>
  )
}
