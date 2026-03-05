'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import Link from 'next/link'
import { format } from 'date-fns'
import { getDynamicPost, type DynamicPost } from '@/lib/dynamic-posts'
import { Suspense } from 'react'

function ReadContent() {
  const searchParams = useSearchParams()
  const [post, setPost] = useState<DynamicPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setPost(getDynamicPost(id))
    }
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return <div className="py-20 text-center text-zinc-400">Loading...</div>
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-zinc-300 dark:text-zinc-700">Post not found</h1>
        <p className="mb-6 text-zinc-500">This post may have been deleted or is only available on the device where it was created.</p>
        <Link
          href="/"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <article className="py-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <time dateTime={post.date}>
            {format(new Date(post.date), 'LLLL d, yyyy')}
          </time>
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {post.title}
        </h1>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
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
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
      <ReadContent />
    </Suspense>
  )
}
