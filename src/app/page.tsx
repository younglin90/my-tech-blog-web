import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { PostList } from '@/components/PostList'

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
