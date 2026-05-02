'use client'

import { Component, type ReactNode } from 'react'

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

// viz 컴포넌트를 단위 boundary로 감싸는 HOC.
// MDX components 매핑에서 적용해 viz 하나가 throw해도 본문 다른 부분은 살아남게 한다.
export function withVizBoundary<P extends object>(
  Comp: React.ComponentType<P>,
  name: string,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <MDXErrorBoundary name={name}>
      <Comp {...props} />
    </MDXErrorBoundary>
  )
  Wrapped.displayName = `withVizBoundary(${name})`
  return Wrapped
}
