import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { PostList } from '@/components/PostList'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: 'https://tech-blog.dev' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CFD.Lab',
  description: 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화',
  url: 'https://tech-blog.dev',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://tech-blog.dev/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

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
      <div className="mb-10">
        <div className="flex items-baseline justify-between">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            CFD.Lab
          </h1>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
            {posts.length} posts
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            수식, 코드, 시각화로 풀어내는 전산유체역학 기술 저널.
            <span style={{ color: 'var(--accent)' }}> 매일 자동 발행.</span>
          </p>
          <a
            href="/feed.xml"
            className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
            style={{ color: 'var(--accent)' }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
            </svg>
            RSS
          </a>
        </div>
      </div>
      <PostList staticPosts={posts} />
    </div>
  )
}
