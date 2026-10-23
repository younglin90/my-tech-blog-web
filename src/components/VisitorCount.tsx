'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

interface WindowStats {
  visitors: number | null
  pageviews: number | null
}

interface Stats {
  today?: WindowStats
  yesterday?: WindowStats
  total?: WindowStats
  // 구버전 API 호환 (today/yesterday/total이 없으면 24h 값으로 fallback)
  visitors?: number | null
  pageviews?: number | null
  error?: string
}

// Umami 통계 프록시(/api/visitors, Cloudflare Pages Function)에서
// 오늘·어제·누적 방문자 수를 가져온다 (KST 자정 경계).
// API 미구성/오류여도 자리는 유지하고 "—" 로 표시 → 사용자가 작동 여부를 직접 확인 가능.
export function VisitorCount() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [stats, setStats] = useState<Stats | null>(null)
  const [errored, setErrored] = useState(false)
  // 실패 사유(api-key-missing, upstream-401 …) — 툴팁에 노출해 원인을 바로 확인
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/visitors', { cache: 'no-store' })
      .then(async (r) => {
        if (r.ok) return r.json()
        const body = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `http-${r.status}`)
      })
      .then((d: Stats) => {
        if (cancelled) return
        setStats(d)
        if (d.error) {
          setErrored(true)
          setReason(d.error)
        }
      })
      .catch((e: Error) => {
        if (cancelled) return
        setErrored(true)
        setReason(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 누적치는 커지면 compact 표기 (12.3K), 나머지는 그대로
  const nf = new Intl.NumberFormat('en-US')
  const nfCompact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
  const fmt = (n: number | null | undefined, compact = false): string => {
    if (typeof n !== 'number') return errored ? '—' : stats ? '—' : '…'
    return compact && n >= 10000 ? nfCompact.format(n) : nf.format(n)
  }

  // 신 API 필드 우선, 없으면 구버전(24h) 필드로 fallback
  const today = stats?.today?.visitors ?? stats?.visitors
  const yesterday = stats?.yesterday?.visitors
  const total = stats?.total?.visitors

  return (
    <span title={reason ? `${t(locale, 'visitors.tooltip')} — error: ${reason}` : t(locale, 'visitors.tooltip')} className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: 999,
          background: errored ? 'var(--text-faint)' : 'var(--accent)',
          boxShadow: errored ? 'none' : '0 0 6px var(--accent)',
        }}
      />
      {t(locale, 'visitors.today')} {fmt(today)}
      {' · '}
      {t(locale, 'visitors.yesterday')} {fmt(yesterday)}
      {' · '}
      {t(locale, 'visitors.total')} {fmt(total, true)}
    </span>
  )
}
