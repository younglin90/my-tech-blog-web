'use client'

import * as React from 'react'
import { Mdx } from '@/components/MDX'
import { format, parseISO } from 'date-fns'
import { Lock } from 'lucide-react'

interface PreviewProps {
  post: {
    title: string
    date: string
    body: {
      code: string
    }
    draft: boolean
  }
}

export function PreviewContent({ post }: PreviewProps) {
  const [password, setPassword] = React.useState('')
  const [isAuthorized, setIsAuthorized] = React.useState(false)
  const ADMIN_PASSWORD = 'admin' // Simple example, could be an env var (though client-side is never fully secure)

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true)
    } else {
      alert('Wrong password')
    }
  }

  if (!isAuthorized && post.draft) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Lock className="mb-4 h-12 w-12 text-zinc-300" />
        <h2 className="mb-4 text-xl font-semibold">Admin Preview</h2>
        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            type="password"
            placeholder="Enter password"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Verify
          </button>
        </form>
      </div>
    )
  }

  return (
    <article className="py-6">
      <div className="mb-8 flex flex-col items-center text-center">
        {post.draft && (
          <span className="mb-2 rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            Draft Preview
          </span>
        )}
        <time dateTime={post.date} className="text-sm text-zinc-500">
          {format(parseISO(post.date), 'LLLL d, yyyy')}
        </time>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {post.title}
        </h1>
      </div>
      <Mdx code={post.body.code} />
    </article>
  )
}
