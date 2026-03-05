import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tags',
  description: 'Browse posts by tag',
}

function getAllTags() {
  const tagCount: Record<string, number> = {}
  allPosts
    .filter((post) => !post.draft)
    .forEach((post) => {
      post.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
  return Object.entries(tagCount).sort((a, b) => b[1] - a[1])
}

export default function TagsPage() {
  const tags = getAllTags()

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Tags</h1>
      <div className="flex flex-wrap gap-3">
        {tags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {tag} <span className="text-zinc-400">({count})</span>
          </Link>
        ))}
        {tags.length === 0 && (
          <p className="text-zinc-500">No tags found.</p>
        )}
      </div>
    </div>
  )
}
