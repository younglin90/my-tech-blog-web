// /api/post-stats 를 페이지당 한 번만 부른다 (조회수·추천수 컴포넌트가 공유).
export interface PostStats {
  views: number
  up: number
  down: number
}

const pending = new Map<string, Promise<PostStats | null>>()

export function getPostStats(slug: string): Promise<PostStats | null> {
  let p = pending.get(slug)
  if (!p) {
    p = fetch(`/api/post-stats?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Partial<PostStats> | null) =>
        d && typeof d.views === 'number' ? { views: d.views, up: d.up ?? 0, down: d.down ?? 0 } : null,
      )
      .catch(() => null)
    pending.set(slug, p)
  }
  return p
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
