import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { PostList } from '@/components/PostList'
import { QuoteHero } from '@/components/QuoteHero'
import { DAY_META } from '@/lib/day-meta'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: 'https://tech-blog.dev' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: "영린's CFD Blog",
  description: '압축성 다상유동 CFD 연구자의 작업 노트',
  url: 'https://tech-blog.dev',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://tech-blog.dev/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const DAY_ORDER: Array<keyof typeof DAY_META> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export default function Home() {
  const posts = allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .map((post) => ({
      id: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      tags: post.tags ?? [],
      readingTime: post.readingTime,
      url: post.url,
      isDynamic: false as const,
    }))

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <QuoteHero />

      {/* Weekly schedule strip */}
      <div
        className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 rounded-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span
          className="mono"
          style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.2em', fontWeight: 600 }}
        >
          WEEKLY
        </span>
        {DAY_ORDER.map((k) => {
          const m = DAY_META[k]
          return (
            <span key={k} className="inline-flex items-center gap-1.5" style={{ fontSize: 12 }}>
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: m.colorVar }}
              />
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>
                {m.short}
              </span>
              <span style={{ color: 'var(--text)' }}>{m.label}</span>
            </span>
          )
        })}
      </div>

      <PostList staticPosts={posts} />
    </div>
  )
}
