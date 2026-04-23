// Umami 이벤트 트래킹 경량 래퍼.
// window.umami가 없어도 호출은 no-op으로 처리 (광고 차단/로드 실패 대응).
declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string | ((props: Record<string, unknown>) => Record<string, unknown>),
        props?: Record<string, unknown>,
      ) => void
    }
  }
}

export function trackEvent(eventName: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    window.umami?.track(eventName, props)
  } catch {
    // silent
  }
}
