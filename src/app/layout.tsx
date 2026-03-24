import '@/styles/globals.css'
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { Search } from '@/components/Search'
import type { Metadata } from 'next'

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

export const metadata: Metadata = {
  title: {
    default: 'CFD.Lab',
    template: '%s | CFD.Lab',
  },
  description: 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화',
  metadataBase: new URL('https://tech-blog.dev'),
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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          integrity="sha384-GvrOXuhMATgEsSwCs4sm5uE9lXNVF9FgJGatdrcxAfjYAMjzJH8pU/iEvVqnGZkH"
          crossOrigin="anonymous"
        />
        <link rel="alternate" type="application/rss+xml" title="CFD.Lab RSS" href="/feed.xml" />
      </head>
      <body
        className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
        style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="mx-auto max-w-2xl px-6 py-10">
            <header className="mb-16 flex items-center justify-between">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              >
                CFD<span style={{ color: 'var(--accent)' }}>.</span>Lab
              </Link>
              <div className="flex items-center gap-2">
                <Search />
                <nav className="flex items-center gap-4 text-sm">
                  <Link href="/" className="nav-link">Posts</Link>
                  <Link href="/tags" className="nav-link">Tags</Link>
                  <Link href="/about" className="nav-link">About</Link>
                </nav>
                <ThemeToggle />
              </div>
            </header>
            <main>{children}</main>
            <footer
              className="mt-24 border-t py-10 text-center text-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              &copy; 2026 CFD.Lab. Built with Next.js &amp; Contentlayer.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
