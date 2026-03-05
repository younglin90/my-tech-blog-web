'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { getAllDynamicPosts, type DynamicPost } from '@/lib/dynamic-posts'

interface StaticPostItem {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime?: string
  url: string
  isDynamic: false
}

interface DynamicPostItem {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  isDynamic: true
}

type PostItem = StaticPostItem | DynamicPostItem

export function PostList({ staticPosts }: { staticPosts: StaticPostItem[] }) {
  const [mounted, setMounted] = useState(false)
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPostItem[]>([])

  useEffect(() => {
    setMounted(true)
    const dyn = getAllDynamicPosts().map((p): DynamicPostItem => ({
      id: p.id,
      title: p.title,
      date: p.date,
      description: p.description,
      tags: p.tags,
      isDynamic: true,
    }))
    setDynamicPosts(dyn)
  }, [])

  // Use only static posts until client mounts to avoid hydration mismatch
  const all: PostItem[] = [...staticPosts, ...(mounted ? dynamicPosts : [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {all.map((post) => (
        <div key={post.id} className="py-6">
          <h2 className="mb-1 text-xl">
            {post.isDynamic ? (
              <Link
                href={`/read?id=${post.id}`}
                className="text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
              >
                {post.title}
              </Link>
            ) : (
              <Link
                href={post.url}
                className="text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
              >
                {post.title}
              </Link>
            )}
          </h2>
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <time dateTime={post.date}>
              {format(post.isDynamic ? new Date(post.date) : parseISO(post.date), 'LLLL d, yyyy')}
            </time>
            {!post.isDynamic && post.readingTime && (
              <>
                <span>&middot;</span>
                <span>{post.readingTime}</span>
              </>
            )}
            {post.isDynamic && (
              <>
                <span>&middot;</span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-800">Dynamic</span>
              </>
            )}
          </div>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {post.description}
          </p>
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
