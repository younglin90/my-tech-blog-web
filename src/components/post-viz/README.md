# Post-specific visualizations

이 폴더는 **각 블로그 포스트마다 즉석에서 작성되는 custom 인터랙티브 시각화 컴포넌트**를 담는다. Pre-built 풀(`src/components/viz/`, `src/components/NumericalDungeon.tsx`, `src/components/MachArchitect.tsx`)을 재사용하면 주제 수가 늘수록 시각적 중복이 심해진다. 이 폴더 구조는 그 문제를 해결하기 위한 것.

## 구조

```
post-viz/
  2026-04-22-riemann-shock/
    RiemannShockTube1D.tsx
    RoeFluxSpectrum.tsx
  2026-04-23-bernoulli-jet/
    BernoulliJetDemo.tsx
  ...
```

폴더 이름 = 포스트 slug (파일명 `YYYY-MM-DD-slug.mdx`와 동일).

## 사용 (MDX 파일)

```mdx
---
title: "Riemann solver와 충격파"
date: 2026-04-22
...
---

import { RiemannShockTube1D } from '@/components/post-viz/2026-04-22-riemann-shock/RiemannShockTube1D'

(본문 서두)

아래 시뮬레이션에서 직접 파라미터를 조작해보자.

<RiemannShockTube1D />
```

## 작성 규칙

1. **첫 줄**: `'use client'`
2. **외부 라이브러리 금지** — `react`, 내장 Canvas/SVG API, 프로젝트 내 `@/lib/*`만 사용
3. **Props 최소화** — 내부 state + 슬라이더/버튼으로 파라미터 조작 UI
4. **성능** — `requestAnimationFrame` + cleanup in `useEffect`, 60fps 유지, gridSize 100 이하
5. **네이밍** — PascalCase + 주제 반영 + 전역 유일 (예: `RiemannShockTube1D`, `LBMBGKCollision`)
6. **자급자족** — 이 폴더의 컴포넌트는 다른 포스트에서 재사용하지 않는다. 비슷한 주제면 새로 작성한다.

## 최소 템플릿

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export function MyCustomViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [param, setParam] = useState(1.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    const render = () => {
      // Canvas 드로잉 로직
      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [param])

  return (
    <figure className="my-6">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ width: '100%', height: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}
      />
      <div className="mt-2 flex items-center gap-3 text-xs">
        <label>파라미터: {param.toFixed(2)}</label>
        <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={param}
          onChange={(e) => setParam(parseFloat(e.target.value))}
        />
      </div>
    </figure>
  )
}
```
