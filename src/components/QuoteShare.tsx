'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

// 본문 텍스트를 드래그하면 작은 부유 버튼이 떠서, 클릭하면 W3C
// "scroll to text fragment" URL(#:~:text=...)을 클립보드에 담는다.
// 받는 사람이 링크를 열면 해당 문장이 자동 하이라이트되어 스크롤됨.
//
// 지원: Chrome 80+, Edge, Safari 16.4+, Firefox 131+. 미지원 브라우저도
// 같은 URL이 그냥 일반 링크로 동작 → fragment는 무시됨 (안전).
//
// post 본문(<article>) 안 selection만 트리거되도록 anchorNode 검사.
export function QuoteShare() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [bubble, setBubble] = useState<{ x: number; y: number; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const update = () => {
      const sel = window.getSelection?.()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setBubble(null)
        return
      }
      const text = sel.toString().trim()
      // 너무 짧거나 너무 긴 선택은 무시 — 인용에 적합한 범위만
      if (text.length < 12 || text.length > 380) {
        setBubble(null)
        return
      }
      // 본문 article 내부 selection만
      const anchor = sel.anchorNode
      if (!anchor) return
      const article = (anchor.nodeType === Node.ELEMENT_NODE
        ? (anchor as Element)
        : anchor.parentElement)?.closest('article')
      if (!article) {
        setBubble(null)
        return
      }
      // 첫 range의 bounding box 위쪽 가운데에 버튼 위치
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return
      setBubble({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY,
        text,
      })
    }

    // selectionchange는 너무 자주 발생 → mouseup/keyup으로 디바운스
    const onMouseUp = () => setTimeout(update, 0)
    const onKeyUp = (e: KeyboardEvent) => {
      // Shift+Arrow로 키보드 선택 시에만
      if (e.shiftKey || e.key.startsWith('Arrow')) setTimeout(update, 0)
    }
    const onScroll = () => setBubble(null)

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection?.()
      if (!sel || sel.isCollapsed) setBubble(null)
    })
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!bubble) return null

  const handleCopy = async () => {
    // 안전한 fragment encoding — encodeURIComponent로 충분, 단 -,&,는 보존돼야 함
    const encoded = encodeURIComponent(bubble.text)
    const base = `${window.location.origin}${window.location.pathname}`
    const url = `${base}#:~:text=${encoded}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
        setBubble(null)
        window.getSelection?.()?.removeAllRanges()
      }, 1300)
    } catch {
      // ignore
    }
  }

  // 화면 위쪽으로 8px, 가운데 정렬되어 떠있는 버튼
  return (
    <div
      role="toolbar"
      aria-label={t(locale, 'quote.label')}
      className="absolute z-50"
      style={{
        top: bubble.y - 38,
        left: bubble.x,
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}   // selection 유지
        onClick={handleCopy}
        className="mono flex items-center gap-1.5 rounded-md text-xs font-medium shadow-lg"
        style={{
          padding: '6px 10px',
          background: copied ? 'var(--accent)' : 'var(--surface)',
          color: copied ? 'var(--on-accent)' : 'var(--accent)',
          border: '1px solid var(--accent)',
          transition: 'background 120ms ease, color 120ms ease',
        }}
      >
        <span aria-hidden style={{ fontSize: 13 }}>❝</span>
        <span>{copied ? t(locale, 'quote.copied') : t(locale, 'quote.copyLink')}</span>
      </button>
    </div>
  )
}
