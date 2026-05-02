'use client'

import { Component, useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  name?: string   // 깨진 컴포넌트 식별 (viz 단위 boundary에 유용)
}

interface State {
  hasError: boolean
  error?: Error
}

export class MDXErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="my-8 rounded-lg p-6 text-center"
          style={{ background: 'var(--surface)', border: '1px dashed var(--error)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--error)' }}>
            {this.props.name
              ? `Failed to render <${this.props.name} />`
              : 'Failed to render post content.'}
          </p>
          {this.state.error?.message && (
            <p className="mt-1 text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
              {this.state.error.message}
            </p>
          )}
          <p className="mono mt-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>
            (the rest of the post is still readable)
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

// IntersectionObserver로 viewport 진입 시점까지 mount를 지연.
// rootMargin 200px → 사용자가 viz에 도달 직전 미리 mount되어 매끄러움.
function LazyMount({ children, name }: { children: ReactNode; name: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (visible) return
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)   // 미지원 브라우저 → 즉시 mount
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [visible])

  if (visible) return <>{children}</>
  return (
    <div
      ref={ref}
      role="presentation"
      aria-label={`${name} (loading on scroll)`}
      className="my-6 rounded-lg"
      style={{
        minHeight: 220,
        background: 'var(--surface)',
        border: '1px dashed var(--border)',
      }}
    />
  )
}

// viz 컴포넌트를 lazy mount + 단위 boundary로 감싸는 HOC.
// 1) IntersectionObserver로 viewport 진입 직전까지 mount 지연 → LCP/INP 개선
// 2) ErrorBoundary로 throw 격리 → 본문 다른 부분 안전
export function withVizBoundary<P extends object>(
  Comp: React.ComponentType<P>,
  name: string,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <MDXErrorBoundary name={name}>
      <LazyMount name={name}>
        <Comp {...props} />
      </LazyMount>
    </MDXErrorBoundary>
  )
  Wrapped.displayName = `withVizBoundary(${name})`
  return Wrapped
}
