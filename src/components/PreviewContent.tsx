'use client'

import * as React from 'react'
import { Mdx } from '@/components/MDX'
import { format, parseISO } from 'date-fns'
import { Lock } from 'lucide-react'
import { adminLogin } from '@/lib/dynamic-posts'

interface PreviewProps {
  post: {
    title: string
    date: string
    body: { code: string }
    draft: boolean
  }
}

export function PreviewContent({ post }: PreviewProps) {
  const [password, setPassword] = React.useState('')
  const [isAuthorized, setIsAuthorized] = React.useState(false)
  const [error, setError] = React.useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await adminLogin(password)
    if (ok) {
      setIsAuthorized(true)
    } else {
      setError(true)
    }
  }

  if (!isAuthorized && post.draft) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
        <h2
          className="mb-1 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Draft Preview
        </h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter your admin password to view this draft.
        </p>
        <form onSubmit={handleVerify} className="flex flex-col items-center gap-3 w-full max-w-xs">
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-md px-4 py-2.5 text-sm focus:outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
          />
          {error && <p className="text-xs" style={{ color: 'var(--error)' }}>Incorrect password.</p>}
          <button
            type="submit"
            className="w-full rounded-md py-2.5 text-sm font-medium transition-opacity hover:opacity-75"
            style={{ background: 'var(--accent)', color: '#08111f' }}
          >
            Unlock Preview
          </button>
        </form>
      </div>
    )
  }

  return (
    <article className="py-6">
      <div className="mb-10 flex flex-col items-center text-center">
        {post.draft && (
          <span
            className="mb-3 rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'var(--warning)', color: '#08111f', opacity: 0.9 }}
          >
            Draft
          </span>
        )}
        <time dateTime={post.date} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {format(parseISO(post.date), 'MMMM d, yyyy')}
        </time>
        <h1
          className="mt-3 text-4xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {post.title}
        </h1>
      </div>
      <Mdx code={post.body.code} />
    </article>
  )
}
