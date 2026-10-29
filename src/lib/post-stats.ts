// /api/post-stats 를 페이지당 한 번만 부른다 (조회수·추천수·댓글수 컴포넌트가 공유).
export interface PostStats {
  views: number
  up: number
  down: number
  comments: number
}

const pending = new Map<string, Promise<PostStats | null>>()

export function getPostStats(slug: string): Promise<PostStats | null> {
  let p = pending.get(slug)
  if (!p) {
    p = fetch(`/api/post-stats?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Partial<PostStats> | null) =>
        d && typeof d.views === 'number'
          ? { views: d.views, up: d.up ?? 0, down: d.down ?? 0, comments: d.comments ?? 0 }
          : null,
      )
      .catch(() => null)
    pending.set(slug, p)
  }
  return p
}

// 글 목록용: 모든 글의 [조회수, 좋아요, 댓글수]를 한 번에 (/api/stats, 엣지 5분 캐시).
export type StatTriple = [views: number, likes: number, comments: number]
let allStats: Promise<Record<string, StatTriple>> | null = null

export function getAllStats(): Promise<Record<string, StatTriple>> {
  if (!allStats) {
    allStats = fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: Record<string, StatTriple> } | null) => d?.items ?? {})
      .catch(() => ({}))
  }
  return allStats
}

export async function sendVote(slug: string, vote: 'up' | 'down', reason?: string): Promise<{ up: number; down: number } | null> {
  try {
    const r = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, vote, reason }),
    })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export interface CommentItem {
  id: number
  name: string
  body: string
  ts: number
}

export async function getComments(slug: string): Promise<CommentItem[] | null> {
  try {
    const r = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
    if (!r.ok) return null
    const d = (await r.json()) as { items?: CommentItem[]; error?: string }
    return d.error ? null : d.items ?? []
  } catch {
    return null
  }
}

export async function postComment(
  slug: string,
  name: string,
  body: string,
  website: string,
): Promise<{ item: CommentItem | null } | { error: string }> {
  try {
    const r = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, body, website }),
    })
    const d = await r.json().catch(() => ({ error: `http-${r.status}` }))
    return r.ok ? d : { error: d.error ?? `http-${r.status}` }
  } catch {
    return { error: 'network' }
  }
}

// "3분 전" 같은 상대 시간. 7일이 넘으면 날짜로.
export function timeAgo(ts: number, locale: string): string {
  const diff = (ts - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day')
  return new Date(ts).toLocaleDateString(locale)
}
