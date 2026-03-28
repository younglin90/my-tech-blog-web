import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import type { Metadata } from 'next'
import { BookmarksClient } from '@/components/BookmarksClient'

export const metadata: Metadata = {
  title: 'Bookmarks',
  description: 'Your saved CFD.Lab posts.',
  robots: { index: false },
}

export default function BookmarksPage() {
  const posts = allPosts
    .filter((p) => !p.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .map((p) => ({
      id: p.slug,
      title: p.title,
      date: p.date,
      description: p.description,
      tags: p.tags ?? [],
      readingTime: p.readingTime,
      url: p.url,
    }))

  return (
    <div className="max-w-none">
      <h1
        className="mb-2 text-4xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        Bookmarks
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        Posts you&apos;ve saved for later — stored locally in your browser.
      </p>
      <BookmarksClient posts={posts} />
    </div>
  )
}
