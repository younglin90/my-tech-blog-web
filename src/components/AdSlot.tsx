'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'
import { ADSENSE } from '@/lib/monetization'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/**
 * AdSense 디스플레이 단위 하나.
 *
 * 환경변수가 없으면 null을 반환하므로 미설정 상태에서는 DOM에 아무것도 남지 않는다.
 * 정적 export(out/)에서도 동작한다 — 로더 <script>는 layout.tsx의 <head>에 있고,
 * 여기서는 마운트 시 adsbygoogle 큐에 한 번만 push한다.
 */
export function AdSlot({ slot }: { slot?: string }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const unit = slot ?? ADSENSE.articleSlot
  const enabled = Boolean(ADSENSE.client) && Boolean(unit)
  const pushed = useRef(false)

  useEffect(() => {
    if (!enabled || pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle ?? []).push({})
    } catch {
      // 광고 차단기나 로더 실패는 조용히 넘긴다.
    }
  }, [enabled, unit])

  if (!enabled) return null

  return (
    <aside
      className="my-12 border-y py-6"
      style={{ borderColor: 'var(--border)' }}
      aria-label={t(locale, 'ad.label')}
    >
      <p
        className="mb-1.5 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {t(locale, 'ad.label')}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE.client}
        data-ad-slot={unit}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
