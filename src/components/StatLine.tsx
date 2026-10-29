'use client'

import { useEffect, useState } from 'react'
import { Eye, Heart, MessageCircle } from 'lucide-react'
import { t } from '@/lib/i18n'
import { getAllStats, getPostStats, type StatTriple } from '@/lib/post-stats'

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(0)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

// 조회수 · 좋아요 · 댓글수 한 줄. 숫자가 아직 없으면(로딩/집계 없음) 0을 흐리게 보여 줄 자리만 잡는다.
export function StatLine({ stats, locale }: { stats: StatTriple | null; locale: string }) {
  const [views, likes, comments] = stats ?? [0, 0, 0]
  const items = [
    { Icon: Eye, n: views, label: t(locale, 'stats.views') },
    { Icon: Heart, n: likes, label: t(locale, 'stats.likes') },
    { Icon: MessageCircle, n: comments, label: t(locale, 'stats.comments') },
  ]
  return (
    <span className="stat-line" style={{ opacity: stats ? 1 : 0.45 }}>
      {items.map(({ Icon, n, label }) => (
        <span key={label} title={`${label} ${n.toLocaleString()}`} aria-label={`${label} ${n}`}>
          <Icon aria-hidden="true" />
          <span className="tabular">{fmt(n)}</span>
        </span>
      ))}
    </span>
  )
}

// 글 목록 행: /api/stats 한 번으로 모든 글의 숫자를 받는다.
export function ListStats({ slug, locale }: { slug: string; locale: string }) {
  const [stats, setStats] = useState<StatTriple | null>(null)
  useEffect(() => {
    let cancelled = false
    getAllStats().then((all) => { if (!cancelled) setStats(all[slug] ?? [0, 0, 0]) })
    return () => { cancelled = true }
  }, [slug])
  return <StatLine stats={stats} locale={locale} />
}

// 글 본문 상단: /api/post-stats (글 하나, 엣지 60초 캐시).
export function PostStatLine({ slug, locale }: { slug: string; locale: string }) {
  const [stats, setStats] = useState<StatTriple | null>(null)
  useEffect(() => {
    let cancelled = false
    getPostStats(slug).then((s) => { if (!cancelled) setStats(s ? [s.views, s.up, s.comments] : [0, 0, 0]) })
    return () => { cancelled = true }
  }, [slug])
  return <StatLine stats={stats} locale={locale} />
}
