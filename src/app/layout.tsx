import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { Search } from '@/components/Search'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Tech Blog',
    template: '%s | Tech Blog',
  },
  description: 'Fast and SEO-optimized static tech blog',
  metadataBase: new URL('https://tech-blog.dev'),
  openGraph: {
    title: 'Tech Blog',
    description: 'Fast and SEO-optimized static tech blog',
    url: 'https://tech-blog.dev',
    siteName: 'Tech Blog',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Blog',
    description: 'Fast and SEO-optimized static tech blog',
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
        <link rel="alternate" type="application/rss+xml" title="Tech Blog RSS" href="/feed.xml" />
      </head>
      <body className={`${inter.className} min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="mx-auto max-w-2xl px-6 py-10">
            <header className="mb-16 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tighter">
                Tech.blog
              </Link>
              <div className="flex items-center gap-2">
                <Search />
                <nav className="flex items-center gap-3 text-sm font-medium">
                  <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-400">Posts</Link>
                  <Link href="/tags" className="hover:text-zinc-600 dark:hover:text-zinc-400">Tags</Link>
                  <Link href="/about" className="hover:text-zinc-600 dark:hover:text-zinc-400">About</Link>
                </nav>
                <ThemeToggle />
              </div>
            </header>
            <main>{children}</main>
            <footer className="mt-24 border-t border-zinc-100 py-10 text-center text-xs text-zinc-500 dark:border-zinc-800">
              &copy; 2026 Tech Blog. Built with Next.js & Contentlayer.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
