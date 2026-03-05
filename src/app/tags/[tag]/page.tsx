import { allPosts, Post } from 'contentlayer/generated'
import Link from 'next/link'
import { format, parseISO, compareDesc } from 'date-fns'
import type { Metadata } from 'next'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded}`,
    description: `Posts tagged with "${decoded}"`,
  }
}

export async function generateStaticParams() {
  const tags = new Set<string>()
  allPosts
    .filter((post) => !post.draft)
    .forEach((post) => post.tags?.forEach((tag) => tags.add(tag)))
  return Array.from(tags).map((tag) => ({ tag: encodeURIComponent(tag) }))
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)

  const posts = allPosts
    .filter((post) => !post.draft && post.tags?.includes(decoded))
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        <span className="text-zinc-400">#</span>{decoded}
      </h1>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {posts.map((post) => (
          <div key={post.slug} className="py-6">
            <h2 className="mb-1 text-xl">
              <Link href={post.url} className="text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400">
                {post.title}
              </Link>
            </h2>
            <time dateTime={post.date} className="mb-2 block text-xs text-zinc-400">
              {format(parseISO(post.date), 'LLLL d, yyyy')}
            </time>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {post.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
