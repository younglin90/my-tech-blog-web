'use client'

import { useCallback, useEffect, useState } from 'react'

interface Row { id: number; slug: string; name: string; body: string; ts: number; hidden: number }

// 최근 댓글 100개 + 숨김/복원. API는 /admin/* 라 Basic Auth 뒤에 있다.
export function AdminComments() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/admin/api/comments', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http-${r.status}`))))
      .then((d: { items?: Row[]; error?: string }) => {
        setRows(d.items ?? [])
        setError(d.error ?? null)
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const toggle = async (row: Row) => {
    const r = await fetch('/admin/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, hidden: !row.hidden }),
    })
    if (r.ok) setRows((prev) => prev?.map((x) => (x.id === row.id ? { ...x, hidden: x.hidden ? 0 : 1 } : x)) ?? null)
    else setError(`http-${r.status}`)
  }

  return (
    <section className="mt-12">
      <h2 className="mb-3 text-lg font-bold">Comments</h2>
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-zinc-500">loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((c) => (
            <li key={c.id} className={`flex items-start gap-3 py-3 ${c.hidden ? 'opacity-50' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-zinc-500">
                  <b className="text-zinc-800 dark:text-zinc-200">{c.name}</b> · {new Date(c.ts).toLocaleString()} ·{' '}
                  <a href={`/ko/posts/${c.slug}/#comment-${c.id}`} className="underline" target="_blank" rel="noreferrer">{c.slug}</a>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.body}</p>
              </div>
              <button
                onClick={() => toggle(c)}
                className="shrink-0 rounded px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {c.hidden ? 'Restore' : 'Hide'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
