'use client'

import { useEffect, useRef, useState } from 'react'

type Mode = 'jacobi' | 'vcycle'

function buildRhs(n: number): Float64Array {
  const f = new Float64Array(n + 1)
  for (let i = 0; i <= n; i++) {
    const x = i / n
    f[i] = Math.sin(Math.PI * x) + 0.6 * Math.sin(8 * Math.PI * x)
  }
  return f
}

function exactSolution(n: number, f: Float64Array): Float64Array {
  const u = new Float64Array(n + 1)
  const h = 1 / n
  const rhs = new Float64Array(n - 1)
  for (let i = 1; i < n; i++) rhs[i - 1] = f[i]
  const a = new Float64Array(n - 1)
  const b = new Float64Array(n - 1)
  const c = new Float64Array(n - 1)
  for (let i = 0; i < n - 1; i++) {
    a[i] = -1 / (h * h)
    b[i] = 2 / (h * h)
    c[i] = -1 / (h * h)
  }
  const cp = new Float64Array(n - 1)
  const dp = new Float64Array(n - 1)
  cp[0] = c[0] / b[0]
  dp[0] = rhs[0] / b[0]
  for (let i = 1; i < n - 1; i++) {
    const m = b[i] - a[i] * cp[i - 1]
    cp[i] = c[i] / m
    dp[i] = (rhs[i] - a[i] * dp[i - 1]) / m
  }
  const sol = new Float64Array(n - 1)
  sol[n - 2] = dp[n - 2]
  for (let i = n - 3; i >= 0; i--) sol[i] = dp[i] - cp[i] * sol[i + 1]
  for (let i = 1; i < n; i++) u[i] = sol[i - 1]
  return u
}

function gaussSeidelSweep(u: Float64Array, f: Float64Array, n: number, sweeps: number) {
  const h2 = (1 / n) * (1 / n)
  for (let s = 0; s < sweeps; s++) {
    for (let i = 1; i < n; i++) {
      u[i] = 0.5 * (u[i - 1] + u[i + 1] + h2 * f[i])
    }
  }
}

function residual(u: Float64Array, f: Float64Array, n: number): Float64Array {
  const r = new Float64Array(n + 1)
  const h2 = (1 / n) * (1 / n)
  for (let i = 1; i < n; i++) {
    r[i] = f[i] - (2 * u[i] - u[i - 1] - u[i + 1]) / h2
  }
  return r
}

function restrict(rFine: Float64Array, nFine: number): Float64Array {
  const nCoarse = nFine / 2
  const rCoarse = new Float64Array(nCoarse + 1)
  for (let i = 1; i < nCoarse; i++) {
    const j = 2 * i
    rCoarse[i] = 0.25 * rFine[j - 1] + 0.5 * rFine[j] + 0.25 * rFine[j + 1]
  }
  return rCoarse
}

function prolongate(eCoarse: Float64Array, nFine: number): Float64Array {
  const nCoarse = nFine / 2
  const eFine = new Float64Array(nFine + 1)
  for (let i = 1; i < nCoarse; i++) eFine[2 * i] = eCoarse[i]
  for (let i = 1; i < nFine; i += 2) {
    eFine[i] = 0.5 * (eFine[i - 1] + eFine[i + 1])
  }
  return eFine
}

function vCycle(u: Float64Array, f: Float64Array, n: number, pre: number, post: number) {
  gaussSeidelSweep(u, f, n, pre)
  if (n <= 4) {
    gaussSeidelSweep(u, f, n, 20)
    return
  }
  const r = residual(u, f, n)
  const rCoarse = restrict(r, n)
  const eCoarse = new Float64Array(n / 2 + 1)
  vCycle(eCoarse, rCoarse, n / 2, pre, post)
  const eFine = prolongate(eCoarse, n)
  for (let i = 1; i < n; i++) u[i] += eFine[i]
  gaussSeidelSweep(u, f, n, post)
}

function rmsError(u: Float64Array, uExact: Float64Array, n: number): number {
  let s = 0
  for (let i = 1; i < n; i++) {
    const d = u[i] - uExact[i]
    s += d * d
  }
  return Math.sqrt(s / (n - 1))
}

export function MultigridVCycleDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('vcycle')
  const [n, setN] = useState(64)
  const [running, setRunning] = useState(false)
  const [iter, setIter] = useState(0)
  const [errHistory, setErrHistory] = useState<number[]>([])

  const stateRef = useRef<{ u: Float64Array; f: Float64Array; exact: Float64Array } | null>(null)

  useEffect(() => {
    const f = buildRhs(n)
    const u = new Float64Array(n + 1)
    const exact = exactSolution(n, f)
    stateRef.current = { u, f, exact }
    setIter(0)
    setErrHistory([rmsError(u, exact, n)])
  }, [n, mode])

  useEffect(() => {
    if (!running) return
    let stopped = false
    let raf = 0
    const tick = () => {
      if (stopped) return
      const st = stateRef.current
      if (!st) return
      if (mode === 'jacobi') {
        gaussSeidelSweep(st.u, st.f, n, 4)
      } else {
        vCycle(st.u, st.f, n, 2, 2)
      }
      setIter((k) => k + 1)
      setErrHistory((h) => {
        const err = rmsError(st.u, st.exact, n)
        const next = [...h, err]
        return next.length > 200 ? next.slice(-200) : next
      })
      if (stateRef.current && rmsError(st.u, st.exact, n) < 1e-8) {
        setRunning(false)
        return
      }
      if (iter > 400) {
        setRunning(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [running, mode, n, iter])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)'
    ctx.fillRect(0, 0, W, H)

    const leftW = W * 0.55
    const rightW = W - leftW - 20
    const rightX = leftW + 20

    const st = stateRef.current
    if (st) {
      const { u, exact } = st
      let vmin = Infinity
      let vmax = -Infinity
      for (let i = 0; i <= n; i++) {
        vmin = Math.min(vmin, u[i], exact[i])
        vmax = Math.max(vmax, u[i], exact[i])
      }
      const pad = (vmax - vmin) * 0.15 || 0.01
      vmin -= pad
      vmax += pad
      const mapY = (v: number) => H - 30 - ((v - vmin) / (vmax - vmin)) * (H - 60)
      const mapX = (i: number) => 20 + (i / n) * (leftW - 40)

      ctx.strokeStyle = 'rgba(122, 144, 168, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(20, H - 30)
      ctx.lineTo(leftW - 20, H - 30)
      ctx.stroke()

      ctx.strokeStyle = '#7a90a8'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const x = mapX(i)
        const y = mapY(exact[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const x = mapX(i)
        const y = mapY(u[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '11px system-ui'
      ctx.fillText('u (현재 해)', 24, 18)
      ctx.fillStyle = '#7a90a8'
      ctx.fillText('u* (정확해, 점선)', 24, 32)
    }

    ctx.strokeStyle = 'rgba(122, 144, 168, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(rightX, 12, rightW, H - 24)

    if (errHistory.length > 1) {
      const logMax = Math.log10(Math.max(...errHistory) + 1e-12)
      const logMin = Math.log10(Math.min(...errHistory) + 1e-12)
      const span = Math.max(logMax - logMin, 1)
      const mapYY = (v: number) =>
        12 + ((logMax - Math.log10(v + 1e-12)) / span) * (H - 36)
      const mapXX = (i: number) => rightX + (i / Math.max(errHistory.length - 1, 1)) * rightW
      ctx.strokeStyle = mode === 'vcycle' ? '#22d3ee' : '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < errHistory.length; i++) {
        const x = mapXX(i)
        const y = mapYY(errHistory[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '11px system-ui'
      ctx.fillText('RMS error (log scale)', rightX + 6, 26)
      ctx.fillText(
        `iter ${iter}, err ${errHistory[errHistory.length - 1].toExponential(2)}`,
        rightX + 6,
        H - 10,
      )
    }
  })

  const reset = () => {
    const f = buildRhs(n)
    const u = new Float64Array(n + 1)
    const exact = exactSolution(n, f)
    stateRef.current = { u, f, exact }
    setIter(0)
    setErrHistory([rmsError(u, exact, n)])
    setRunning(false)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => {
              setMode('jacobi')
              reset()
            }}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid var(--border)',
              background: mode === 'jacobi' ? '#f59e0b' : 'transparent',
              color: mode === 'jacobi' ? '#08111f' : 'inherit',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Gauss-Seidel만
          </button>
          <button
            onClick={() => {
              setMode('vcycle')
              reset()
            }}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid var(--border)',
              background: mode === 'vcycle' ? '#22d3ee' : 'transparent',
              color: mode === 'vcycle' ? '#08111f' : 'inherit',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            V-cycle
          </button>
        </div>
        <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          격자 N={n}
          <input
            type="range"
            min={16}
            max={128}
            step={16}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <button
          onClick={() => setRunning((v) => !v)}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            border: '1px solid var(--border)',
            background: 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {running ? '일시정지' : '시작'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            border: '1px solid var(--border)',
            background: 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          초기화
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={260}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
      />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        좌: 1D Poisson 문제의 현재 해(시안)와 정확해(점선). 우: RMS 오차를 log 스케일로 누적.
        Gauss-Seidel 단독은 저주파 오차에서 정체하지만, V-cycle은 거친 격자에서 그 오차를 잡아 속도가 한 자릿수 이상 빨라진다.
      </div>
    </div>
  )
}
