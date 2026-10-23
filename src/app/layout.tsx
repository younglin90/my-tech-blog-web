import '@/styles/globals.css'
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { ThemeProvider } from '@/components/ThemeProvider'
import { BackToTop } from '@/components/BackToTop'
import { MobileNav } from '@/components/MobileNav'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { TerminalHeader } from '@/components/TerminalHeader'
import { TerminalFooter } from '@/components/TerminalFooter'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import type { Metadata, Viewport } from 'next'
import { SITE_URL } from '@/lib/site'
import { ADSENSE } from '@/lib/monetization'
import { PageviewBeacon } from '@/components/PageviewBeacon'

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

// Root metadata는 locale-neutral 영어 기본. 페이지별 metadata는
// src/app/[locale]/layout.tsx의 generateMetadata가 locale-specific 값으로 덮어쓴다.
export const metadata: Metadata = {
  title: {
    default: "Younglin's CFD Blog",
    template: "%s | Younglin's CFD Blog",
  },
  description: 'Field notes from a compressible multiphase CFD researcher — Riemann solvers, interface capturing, paper reviews.',
  metadataBase: new URL(SITE_URL),
  authors: [{ name: "Younglin's CFD Blog", url: `${SITE_URL}/en/about/` }],
  creator: "Younglin's CFD Blog",
  category: 'technology',
  openGraph: {
    title: "Younglin's CFD Blog",
    description: 'Field notes from a compressible multiphase CFD researcher',
    url: SITE_URL,
    siteName: "Younglin's CFD Blog",
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Younglin's CFD Blog",
    description: 'Field notes from a compressible multiphase CFD researcher',
  },
  // Search Console 인증: 환경변수 NEXT_PUBLIC_GOOGLE_VERIFICATION 등에 등록하면 자동 inject
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
   process.env.NEXT_PUBLIC_BING_VERIFICATION ||
   process.env.NEXT_PUBLIC_NAVER_VERIFICATION
    ? {
        verification: {
          ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
            ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION }
            : {}),
          ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
            ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION } }
            : {}),
          ...(process.env.NEXT_PUBLIC_NAVER_VERIFICATION
            ? { other: { 'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_VERIFICATION } }
            : {}),
        },
      }
    : {}),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  ...(ADSENSE.client ? { other: { 'google-adsense-account': ADSENSE.client } } : {}),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" hrefLang="ko" title="영린's CFD Blog RSS" href="/feed.xml" />
        <link rel="alternate" type="application/feed+json" hrefLang="ko" title="영린's CFD Blog JSON Feed" href="/feed.json" />
        <link rel="alternate" type="application/rss+xml" hrefLang="en" title="Younglin's CFD Blog RSS (EN)" href="/feed-en.xml" />
        <link rel="alternate" type="application/rss+xml" hrefLang="ja" title="Younglin's CFD Blog RSS (JA)" href="/feed-ja.xml" />
        <link rel="alternate" type="application/rss+xml" hrefLang="zh" title="Younglin's CFD Blog RSS (ZH)" href="/feed-zh.xml" />
        <link rel="alternate" type="application/rss+xml" hrefLang="es" title="Younglin's CFD Blog RSS (ES)" href="/feed-es.xml" />
      </head>
      <body
        className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
        style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
      >
        <PageviewBeacon />
        {ADSENSE.client && (
          // 광고는 hydration 뒤에 로드한다. AdSense가 실행 직후 <head>에 관리 script를
          // 삽입해 React와 충돌하는 것을 막고, publisher 확인은 위 meta가 담당한다.
          <Script
            id="adsense-loader"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.client}`}
            crossOrigin="anonymous"
          />
        )}
        {/* 글자 크기 선호를 첫 페인트 전에 적용한다. hydration 후에 적용하면
            'large'를 고른 재방문자는 본문 전체가 1.0 → 1.2로 리플로우되는 걸 보게 된다. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=localStorage.getItem('cfd-lab-reading-scale');" +
              "var f={sm:'1',md:'1.1',lg:'1.2'}[s];" +
              "if(f)document.documentElement.style.setProperty('--reading-scale',f)}catch(e){}",
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ServiceWorkerRegister />
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
