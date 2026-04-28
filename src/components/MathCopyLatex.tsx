'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

// 블록 수식(.katex-display)에 호버 시 등장하는 "Copy LaTeX" 버튼을 부착한다.
// KaTeX 기본 출력은 htmlAndMathml — MathML 안에 <annotation encoding="application/x-tex">
// 형태로 원본 LaTeX가 그대로 보존되어 있어 추가 데이터 없이 바로 복사 가능.
//
// 인라인 수식($...$)은 너무 짧고 마우스 타깃이 작아 의도적으로 제외.
// 클립보드 실패 시 textarea fallback. 모바일은 hover가 없으니 항상 보이게 하지 않고
// 탭 영역 자체가 버튼이 되도록 큰 hit area + 짧은 노출 시간을 둔다.
export function MathCopyLatex() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const labelCopy = t(locale, 'math.copyLatex')
  const labelCopied = t(locale, 'math.copied')

  useEffect(() => {
    if (typeof document === 'undefined') return

    const decorate = (block: HTMLElement) => {
      if (block.dataset.mathCopyAttached === '1') return
      const annotation = block.querySelector('annotation[encoding="application/x-tex"]')
      const tex = annotation?.textContent?.trim()
      if (!tex) return

      block.dataset.mathCopyAttached = '1'
      const wrapper = block as HTMLElement
      // KaTeX block은 보통 inline-block 자식 + 가운데 정렬이라 position: relative가 안전
      const prevPos = wrapper.style.position
      if (!prevPos || prevPos === 'static') wrapper.style.position = 'relative'

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'math-copy-btn'
      btn.setAttribute('aria-label', labelCopy)
      btn.title = labelCopy
      btn.textContent = 'TeX'

      const flash = (msg: string) => {
        const original = btn.textContent
        btn.textContent = msg
        btn.dataset.flashed = '1'
        window.setTimeout(() => {
          btn.textContent = original
          delete btn.dataset.flashed
        }, 1200)
      }

      btn.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(tex)
          } else {
            const ta = document.createElement('textarea')
            ta.value = tex
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
          }
          flash(labelCopied)
        } catch {
          flash('!')
        }
      })

      wrapper.appendChild(btn)
    }

    const scan = () => {
      document.querySelectorAll<HTMLElement>('.katex-display').forEach(decorate)
    }

    scan()
    // MDX 콘텐츠는 클라이언트 라우팅 이후에도 들어올 수 있으니 가벼운 옵저버 유지
    const obs = new MutationObserver(() => scan())
    obs.observe(document.body, { childList: true, subtree: true })

    return () => obs.disconnect()
  }, [labelCopy, labelCopied])

  return null
}
