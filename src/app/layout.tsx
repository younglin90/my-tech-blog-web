import '@/styles/globals.css'
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { BackToTop } from '@/components/BackToTop'
import { MobileNav } from '@/components/MobileNav'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { TerminalHeader } from '@/components/TerminalHeader'
import { TerminalFooter } from '@/components/TerminalFooter'
import type { Metadata, Viewport } from 'next'

// Display / hero — editorial authority (see DESIGN.md)
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
})

// Body / UI — clean, tabular-nums friendly
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// Code / mono — ligatures, code blocks
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08111f' },
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "영린's CFD Blog",
    template: "%s | 영린's CFD Blog",
  },
  description: '압축성 다상유동 CFD 연구자의 작업 노트 — Riemann solver, interface capturing, 논문 리뷰',
  metadataBase: new URL('https://tech-blog.dev'),
  authors: [{ name: "영린's CFD Blog", url: 'https://tech-blog.dev/about' }],
  creator: "영린's CFD Blog",
  category: 'technology',
  openGraph: {
    title: "영린's CFD Blog",
    description: '압축성 다상유동 CFD 연구자의 작업 노트',
    url: 'https://tech-blog.dev',
    siteName: "영린's CFD Blog",
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "영린's CFD Blog",
    description: '압축성 다상유동 CFD 연구자의 작업 노트',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          integrity="sha384-GvrOXuhMATgEsSwCs4sm5uE9lXNVF9FgJGatdrcxAfjYAMjzJH8pU/iEvVqnGZkH"
          crossOrigin="anonymous"
        />
        <link rel="alternate" type="application/rss+xml" title="영린's CFD Blog RSS" href="/feed.xml" />
        <link rel="alternate" type="application/feed+json" title="영린's CFD Blog JSON Feed" href="/feed.json" />
      </head>
      <body
        className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
        style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            Skip to content
          </a>
          <div className="mx-auto max-w-3xl px-4 py-6 pb-20 sm:px-7 sm:py-8 sm:pb-10">
            <TerminalHeader />
            <main id="main-content" className="animate-fade-up">{children}</main>
            <KeyboardShortcuts />
            <MobileNav />
            <BackToTop />
            <TerminalFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
