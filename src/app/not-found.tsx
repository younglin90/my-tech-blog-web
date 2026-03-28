import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p
        className="text-[7rem] font-bold leading-none tracking-tighter"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--border)' }}
      >
        404
      </p>
      <p className="mt-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
        Diverged from the solution
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        The page you&apos;re looking for doesn&apos;t exist — like a simulation that left the mesh.
      </p>
      <div className="mt-8 flex items-center gap-3">
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
  )
}
