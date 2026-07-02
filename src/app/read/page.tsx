'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import Link from 'next/link'
import { format } from 'date-fns'
import { getDynamicPost, type DynamicPost } from '@/lib/dynamic-posts'
import { ReadingProgress } from '@/components/ReadingProgress'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

function ReadContent() {
  const searchParams = useSearchParams()
  const [post, setPost] = useState<DynamicPost | null>(null)
  const [loading, setLoading] = useState(true)
  // /read는 locale 세그먼트 밖이라 쿠키로 locale을 판별해 내부 링크에 prefix를 붙인다.
  // /tags/... 같은 locale 없는 경로는 실제 라우트가 없어 404가 난다.
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setPost(getDynamicPost(id))
    }
    const cookieLocale = document.cookie.match(/(?:^|;\s*)locale=(ko|en|ja|zh|es)/)?.[1]
    if (cookieLocale) setLocale(cookieLocale as Locale)
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <div className="py-24 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-24 text-center">
        <p
          className="text-6xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--border)' }}
        >
          :(
        </p>
        <h1 className="mt-4 text-xl font-semibold" style={{ color: 'var(--text)' }}>
          Post not found
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          This post may have been deleted or is only available on the device where it was created.
        </p>
        <Link
          href={`/${locale}`}
          className="mt-8 inline-block rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-75"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <article className="py-6">
      <ReadingProgress />
      <div className="mb-8">
        <Link href={`/${locale}`} className="link-hover-text-accent text-xs">
          ← All posts
        </Link>
      </div>
      <div className="mb-10 flex flex-col items-center text-center">
        <time className="text-sm" style={{ color: 'var(--text-muted)' }} dateTime={post.date}>
          {format(new Date(post.date), 'MMMM d, yyyy')}
        </time>
        <h1
          className="mt-3 text-4xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {post.title}
        </h1>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/tags/${encodeURIComponent(tag)}`}
                className="tag-pill"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  )
}

export default function ReadPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </div>
    }>
      <ReadContent />
    </Suspense>
  )
}
