import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/MDX'
import { format, parseISO, compareDesc } from 'date-fns'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PostProps {
  params: Promise<{
    slug: string
  }>
}

function getPublishedPosts() {
  return allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
}

function getPostFromParams(slug: string) {
  return allPosts.find((post) => post._raw.flattenedPath === slug) ?? null
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostFromParams(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `https://tech-blog.dev/posts/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export async function generateStaticParams() {
  return allPosts
    .filter((post) => !post.draft)
    .map((post) => ({
      slug: post._raw.flattenedPath,
    }))
}

export default async function PostPage({ params }: PostProps) {
  const { slug } = await params
  const post = getPostFromParams(slug)

  if (!post) {
    notFound()
  }

  const posts = getPublishedPosts()
  const currentIndex = posts.findIndex((p) => p._raw.flattenedPath === slug)
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null

  return (
    <article className="py-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <time dateTime={post.date}>
            {format(parseISO(post.date), 'LLLL d, yyyy')}
          </time>
          {post.readingTime && (
            <>
              <span>&middot;</span>
              <span>{post.readingTime}</span>
            </>
          )}
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {post.title}
        </h1>
        {post.tags && post.tags.length > 0 && (
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

      <Mdx code={post.body.code} />

      <nav className="mt-16 flex items-center justify-between border-t border-zinc-200 pt-8 dark:border-zinc-800">
        {prevPost ? (
          <Link href={prevPost.url} className="group flex flex-col">
            <span className="text-xs text-zinc-500">&larr; Previous</span>
            <span className="text-sm font-medium group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
              {prevPost.title}
            </span>
          </Link>
        ) : <div />}
        {nextPost ? (
          <Link href={nextPost.url} className="group flex flex-col text-right">
            <span className="text-xs text-zinc-500">Next &rarr;</span>
            <span className="text-sm font-medium group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
              {nextPost.title}
            </span>
          </Link>
        ) : <div />}
      </nav>
    </article>
  )
}
