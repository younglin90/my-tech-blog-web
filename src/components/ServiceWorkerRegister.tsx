'use client'

import { useEffect } from 'react'

// 클라이언트에서 1회 SW 등록. 개발 모드에서는 SW 등록 안 함 (HMR 충돌 방지).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return
    // 짧게 지연 → 페이지 critical path 영향 0
    const id = setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }, 1500)
    return () => clearTimeout(id)
  }, [])
  return null
}
