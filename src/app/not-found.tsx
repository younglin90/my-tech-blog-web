import Link from 'next/link'
import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO, format } from 'date-fns'
import { NotFoundSearch } from '@/components/NotFoundSearch'

// Global fallback (out of [locale] segment) — defaults to English copy.
// CF Pages middleware redirects '/' to a locale, so this only fires for true 404s.
export default function NotFound() {
  // Use ko base for recent posts (5-locale dedupe handled by single locale filter)
  const recent = allPosts
    .filter((p) => !p.draft && p.locale === 'ko')
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .slice(0, 3)

  return (
    <div className="py-16">
      <div className="mb-12 text-center">
        <p
          className="text-[7rem] font-bold leading-none tracking-tighter"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--border)' }}
        >
          404
        </p>
        <p className="mt-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          Diverged from the solution
        </p>
        <p className="mt-2 max-w-sm mx-auto text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          The page you&apos;re looking for doesn&apos;t exist — like a simulation that left the mesh.
        </p>
        <div className="mt-6 flex justify-center">
          <NotFoundSearch />
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/en"
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#08111f' }}
          >
            Back to Home
          </Link>
          <Link
            href="/en/tags"
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Browse Tags
          </Link>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-faint)' }}>
          Other languages: <Link href="/ko" className="underline">한국어</Link> · <Link href="/ja" className="underline">日本語</Link> · <Link href="/zh" className="underline">中文</Link> · <Link href="/es" className="underline">Español</Link>
        </p>
      </div>

      {recent.length > 0 && (
        <div className="mx-auto max-w-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Recent Posts
          </p>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recent.map((post) => (
              <div key={post.slug} className="py-3">
                <Link href={`/en/posts/${post.slug}`} className="link-hover-accent text-sm font-medium">
                  {post.title}
                </Link>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {format(parseISO(post.date), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
