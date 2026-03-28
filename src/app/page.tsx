import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { PostList } from '@/components/PostList'

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
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          CFD.Lab
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          수식, 코드, 시각화로 풀어내는 전산유체역학 기술 저널.
          <span style={{ color: 'var(--accent)' }}> 매일 자동 발행.</span>
        </p>
      </div>
      <PostList staticPosts={posts} />
    </div>
  )
}
