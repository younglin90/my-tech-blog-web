'use client'

import { useEffect } from 'react'

// 클라이언트에서 1회 SW 등록. 개발 모드에서는 SW 등록 안 함 (HMR 충돌 방지).
// 새 SW가 발견되면 즉시 활성화하고 1번만 reload — 사용자가 수동으로 캐시를 지우지 않아도
// 항상 최신 페이지를 보게 한다.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    // 최초 방문인지(=아직 이 페이지를 제어하는 SW가 없는지)를 등록 전에 기록해 둔다.
    // sw.js가 activate에서 clients.claim()을 부르므로 최초 설치에서도 controllerchange가
    // 발생한다. 이걸 구분하지 않으면 처음 온 방문자가 1.5초 뒤 페이지를 통째로 리로드당한다.
    const hadController = !!navigator.serviceWorker.controller

    const id = setTimeout(async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })

        // 페이지 진입 시 항상 신규 SW 확인 (CDN/브라우저가 sw.js를 캐시하지 못하게 함)
        reg.update().catch(() => {})

        // 새 SW가 install되어 waiting 상태면 즉시 active 화
        const promote = (sw: ServiceWorker | null) => {
          if (sw && sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING')
          }
        }
        promote(reg.waiting)
        reg.addEventListener('updatefound', () => {
          const next = reg.installing
          next?.addEventListener('statechange', () => promote(next))
        })

        // controller가 바뀌면(=새 SW 활성화) 1회 새로고침해 최신 HTML 적용.
        // 단 최초 설치는 제외한다 — 이미 최신 HTML을 보고 있는 사람을 리로드할 이유가 없다.
        let didReload = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!hadController || didReload) return
          didReload = true
          window.location.reload()
        })
      } catch {
        // ignore
      }
    }, 1500)
    return () => clearTimeout(id)
  }, [])
  return null
}
