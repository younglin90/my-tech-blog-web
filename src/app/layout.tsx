import '@/styles/globals.css'
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { Search } from '@/components/Search'
import { Nav } from '@/components/Nav'
import { BackToTop } from '@/components/BackToTop'
import { MobileNav } from '@/components/MobileNav'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
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
    default: 'CFD.Lab',
    template: '%s | CFD.Lab',
  },
  description: 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화',
  metadataBase: new URL('https://tech-blog.dev'),
  authors: [{ name: 'CFD.Lab', url: 'https://tech-blog.dev/about' }],
  creator: 'CFD.Lab',
  category: 'technology',
  openGraph: {
    title: 'CFD.Lab',
    description: 'CFD 엔지니어를 위한 기술 저널',
    url: 'https://tech-blog.dev',
    siteName: 'CFD.Lab',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFD.Lab',
    description: 'CFD 엔지니어를 위한 기술 저널',
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="alternate" type="application/rss+xml" title="CFD.Lab RSS" href="/feed.xml" />
        <link rel="alternate" type="application/feed+json" title="CFD.Lab JSON Feed" href="/feed.json" />
      </head>
      <body
        className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
        style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
            style={{ background: 'var(--accent)', color: '#08111f' }}
          >
            Skip to content
          </a>
          <div className="mx-auto max-w-2xl px-4 py-8 pb-20 sm:px-6 sm:py-10 sm:pb-10">
            <header
              className="sticky top-0 z-30 mb-12 flex items-center justify-between border-b pb-5 sm:mb-16 sm:pb-6"
              style={{
                borderColor: 'var(--border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
                marginLeft: 'calc(-1 * var(--px, 1rem))',
                marginRight: 'calc(-1 * var(--px, 1rem))',
                paddingLeft: 'var(--px, 1rem)',
                paddingRight: 'var(--px, 1rem)',
                paddingTop: '1rem',
              }}
            >
              <Link
                href="/"
                className="text-lg font-bold tracking-tight sm:text-xl"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text)' }}
              >
                CFD<span style={{ color: 'var(--accent)' }}>.</span>Lab
              </Link>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Search />
                <Nav />
                <ThemeToggle />
              </div>
            </header>
            <main id="main-content" className="animate-fade-up">{children}</main>
            <KeyboardShortcuts />
            <MobileNav />
            <BackToTop />
            <footer
              className="mt-24 border-t pt-8 pb-10"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-4">
                  <Link href="/tags" className="link-hover-text">Tags</Link>
                  <Link href="/bookmarks" className="link-hover-text">Saved</Link>
                  <Link href="/about" className="link-hover-text">About</Link>
                  <a href="/feed.xml" className="link-hover-text-accent">RSS</a>
                  <a href="https://github.com/younglin90" target="_blank" rel="noopener noreferrer" className="link-hover-text">GitHub</a>
                </div>
                <div className="flex items-center gap-3">
                  <span>&copy; 2026 CFD.Lab</span>
                  <span className="hidden sm:inline" style={{ color: 'var(--text-faint)' }}>·</span>
                  <span className="hidden sm:inline text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    Press <kbd className="rounded px-1 py-0.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '10px' }}>?</kbd> for shortcuts
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
