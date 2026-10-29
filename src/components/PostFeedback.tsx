'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Heart, ThumbsDown } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { getPostStats, sendVote } from '@/lib/post-stats'

const STORAGE_KEY = 'cfd-lab-post-feedback'

type Store = Record<string, { vote: 'up' | 'down'; ts: number }>

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

// 글 끝 좋아요/아쉬움. 표는 /api/feedback (D1, IP당 글마다 1표 — 다시 누르면 바뀌기만 한다).
// 내가 누른 쪽은 localStorage로 기억해 강조한다.
export function PostFeedback({ postId }: { postId: string }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [mine, setMine] = useState<'up' | 'down' | null>(null)
  const [up, setUp] = useState<number | null>(null)

  useEffect(() => {
    setMine(load()[postId]?.vote ?? null)
    let cancelled = false
    getPostStats(postId).then((s) => { if (!cancelled && s) setUp(s.up) })
    return () => { cancelled = true }
  }, [postId])

  const vote = (v: 'up' | 'down') => {
    if (mine === v) return
    const store = load()
    store[postId] = { vote: v, ts: Date.now() }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch {}
    // 서버 응답 전에 숫자를 먼저 움직인다
    setUp((n) => (n ?? 0) + (v === 'up' ? 1 : mine === 'up' ? -1 : 0))
    setMine(v)
    sendVote(postId, v).then((c) => { if (c) setUp(c.up) })
  }

  const liked = mine === 'up'
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => vote('up')}
        aria-pressed={liked}
        className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors"
        style={{
          border: `1px solid ${liked ? 'var(--accent)' : 'var(--border)'}`,
          background: liked ? 'var(--accent-glow)' : 'transparent',
          color: liked ? 'var(--accent)' : 'var(--text)',
        }}
      >
        <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
        {t(locale, 'stats.likes')}
        {up !== null && <span className="tabular" style={{ color: liked ? 'var(--accent)' : 'var(--text-muted)' }}>{up}</span>}
      </button>
      <button
        type="button"
        onClick={() => vote('down')}
        aria-pressed={mine === 'down'}
        title={t(locale, 'feedback.down')}
        aria-label={t(locale, 'feedback.down')}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        style={{
          border: '1px solid var(--border)',
          color: mine === 'down' ? 'var(--text)' : 'var(--text-faint)',
          background: mine === 'down' ? 'var(--surface)' : 'transparent',
        }}
      >
        <ThumbsDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
