import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p
        className="text-8xl font-bold tracking-tighter"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--border)' }}
      >
        404
      </p>
      <p className="mt-4 text-lg font-medium" style={{ color: 'var(--text)' }}>
        Page not found
      </p>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-75"
        style={{ background: 'var(--accent)', color: '#08111f' }}
      >
        Back to Home
      </Link>
    </div>
  )
}
