import Link from 'next/link'
import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO, format } from 'date-fns'

export default function NotFound() {
  const recent = allPosts
    .filter((p) => !p.draft)
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
        <div className="mt-6 text-xs" style={{ color: 'var(--text-faint)' }}>
          Press <kbd className="rounded px-1.5 py-0.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '10px' }}>⌘K</kbd> or <kbd className="rounded px-1.5 py-0.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '10px' }}>/</kbd> to search
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#08111f' }}
          >
            Back to Home
          </Link>
          <Link
            href="/tags"
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Browse Tags
          </Link>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mx-auto max-w-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Recent Posts
          </p>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recent.map((post) => (
              <div key={post.slug} className="py-3">
                <Link href={post.url} className="link-hover-accent text-sm font-medium">
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
