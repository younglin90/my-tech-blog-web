'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Curve = { name: string; color: string; residuals: number[] }

function applyLaplacian(x: Float64Array, out: Float64Array) {
  const N = x.length
  for (let i = 0; i < N; i++) {
    const left = i > 0 ? x[i - 1] : 0
    const right = i < N - 1 ? x[i + 1] : 0
    out[i] = 2 * x[i] - left - right
  }
}

function dot(a: Float64Array, b: Float64Array) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function norm2(a: Float64Array) {
  return Math.sqrt(dot(a, a))
}

function solveJacobi(N: number, b: Float64Array, maxIter: number): number[] {
  const x = new Float64Array(N)
  const xn = new Float64Array(N)
  const r = new Float64Array(N)
  const b0 = norm2(b)
  const res: number[] = []
  for (let k = 0; k < maxIter; k++) {
    for (let i = 0; i < N; i++) {
      const left = i > 0 ? x[i - 1] : 0
      const right = i < N - 1 ? x[i + 1] : 0
      xn[i] = (b[i] + left + right) * 0.5
    }
    x.set(xn)
    applyLaplacian(x, r)
    for (let i = 0; i < N; i++) r[i] = b[i] - r[i]
    res.push(norm2(r) / b0)
    if (res[res.length - 1] < 1e-10) break
  }
  return res
}

function solveGaussSeidel(N: number, b: Float64Array, maxIter: number): number[] {
  const x = new Float64Array(N)
  const r = new Float64Array(N)
  const b0 = norm2(b)
  const res: number[] = []
  for (let k = 0; k < maxIter; k++) {
    for (let i = 0; i < N; i++) {
      const left = i > 0 ? x[i - 1] : 0
      const right = i < N - 1 ? x[i + 1] : 0
      x[i] = (b[i] + left + right) * 0.5
    }
    applyLaplacian(x, r)
    for (let i = 0; i < N; i++) r[i] = b[i] - r[i]
    res.push(norm2(r) / b0)
    if (res[res.length - 1] < 1e-10) break
  }
  return res
}

function solveConjugateGradient(N: number, b: Float64Array, maxIter: number): number[] {
  const x = new Float64Array(N)
  const r = new Float64Array(b)
  const p = new Float64Array(r)
  const Ap = new Float64Array(N)
  const b0 = norm2(b)
  const res: number[] = [norm2(r) / b0]
  let rr = dot(r, r)
  for (let k = 0; k < maxIter; k++) {
    applyLaplacian(p, Ap)
    const alpha = rr / dot(p, Ap)
    for (let i = 0; i < N; i++) {
      x[i] += alpha * p[i]
      r[i] -= alpha * Ap[i]
    }
    const rrNew = dot(r, r)
    res.push(Math.sqrt(rrNew) / b0)
    if (res[res.length - 1] < 1e-10) break
    const beta = rrNew / rr
    for (let i = 0; i < N; i++) p[i] = r[i] + beta * p[i]
    rr = rrNew
  }
  return res
}

function solveBiCGSTAB(N: number, b: Float64Array, maxIter: number): number[] {
  const x = new Float64Array(N)
  const r = new Float64Array(b)
  const rHat = new Float64Array(b)
  const p = new Float64Array(N)
  const v = new Float64Array(N)
  const s = new Float64Array(N)
  const t = new Float64Array(N)
  let rho = 1
  let alpha = 1
  let omega = 1
  const b0 = norm2(b)
  const res: number[] = [norm2(r) / b0]
  for (let k = 0; k < maxIter; k++) {
    const rhoNew = dot(rHat, r)
    if (Math.abs(rhoNew) < 1e-30) break
    const beta = (rhoNew / rho) * (alpha / omega)
    for (let i = 0; i < N; i++) p[i] = r[i] + beta * (p[i] - omega * v[i])
    applyLaplacian(p, v)
    const rv = dot(rHat, v)
    if (Math.abs(rv) < 1e-30) break
    alpha = rhoNew / rv
    for (let i = 0; i < N; i++) s[i] = r[i] - alpha * v[i]
    applyLaplacian(s, t)
    const tt = dot(t, t)
    omega = tt > 1e-30 ? dot(t, s) / tt : 0
    for (let i = 0; i < N; i++) {
      x[i] += alpha * p[i] + omega * s[i]
      r[i] = s[i] - omega * t[i]
    }
    rho = rhoNew
    res.push(norm2(r) / b0)
    if (res[res.length - 1] < 1e-10) break
    if (Math.abs(omega) < 1e-30) break
  }
  return res
}

export function KrylovConvergenceRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [N, setN] = useState(40)
  const [maxIter, setMaxIter] = useState(200)
  const [runKey, setRunKey] = useState(0)
  const [frame, setFrame] = useState(0)
  const curvesRef = useRef<Curve[]>([])

  useEffect(() => {
    const b = new Float64Array(N).fill(1)
    curvesRef.current = [
      { name: 'Jacobi', color: '#ef4444', residuals: solveJacobi(N, b, maxIter) },
      { name: 'Gauss-Seidel', color: '#f59e0b', residuals: solveGaussSeidel(N, b, maxIter) },
      { name: 'CG', color: '#22d3ee', residuals: solveConjugateGradient(N, b, maxIter) },
      { name: 'BiCGSTAB', color: '#a78bfa', residuals: solveBiCGSTAB(N, b, maxIter) },
    ]
    setFrame(0)
  }, [N, maxIter, runKey])

  useEffect(() => {
    if (frame >= maxIter) return
    const id = requestAnimationFrame(() => {
      setFrame((f) => Math.min(f + 3, maxIter))
    })
    return () => cancelAnimationFrame(id)
  }, [frame, maxIter])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const pad = { l: 54, r: 16, t: 14, b: 34 }
    const plotW = W - pad.l - pad.r
    const plotH = H - pad.t - pad.b
    const yMin = -10
    const yMax = 0
    const xMax = maxIter

    ctx.fillStyle = 'rgba(148,163,184,0.75)'
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.strokeStyle = 'rgba(148,163,184,0.12)'
    ctx.lineWidth = 1
    for (let y = yMax; y >= yMin; y -= 2) {
      const py = pad.t + plotH * (1 - (y - yMin) / (yMax - yMin))
      ctx.beginPath()
      ctx.moveTo(pad.l, py)
      ctx.lineTo(pad.l + plotW, py)
      ctx.stroke()
      ctx.fillText(`10^${y}`, 4, py + 3)
    }
    const xStep = Math.max(20, Math.ceil(xMax / 6 / 10) * 10)
    for (let xt = 0; xt <= xMax; xt += xStep) {
      const px = pad.l + plotW * (xt / xMax)
      ctx.beginPath()
      ctx.moveTo(px, pad.t)
      ctx.lineTo(px, pad.t + plotH)
      ctx.stroke()
      ctx.fillText(String(xt), px - 8, pad.t + plotH + 16)
    }

    ctx.strokeStyle = 'rgba(148,163,184,0.4)'
    ctx.beginPath()
    ctx.moveTo(pad.l, pad.t)
    ctx.lineTo(pad.l, pad.t + plotH)
    ctx.lineTo(pad.l + plotW, pad.t + plotH)
    ctx.stroke()

    for (const c of curvesRef.current) {
      ctx.strokeStyle = c.color
      ctx.lineWidth = 2
      ctx.beginPath()
      const upto = Math.min(frame, c.residuals.length - 1)
      for (let i = 0; i <= upto; i++) {
        const yLog = Math.max(yMin, Math.log10(Math.max(c.residuals[i], 1e-12)))
        const px = pad.l + plotW * (i / xMax)
        const py = pad.t + plotH * (1 - (yLog - yMin) / (yMax - yMin))
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(148,163,184,0.9)'
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText('iteration', pad.l + plotW * 0.5 - 28, H - 4)
    ctx.save()
    ctx.translate(14, pad.t + plotH * 0.5 + 28)
    ctx.rotate(-Math.PI * 0.5)
    ctx.fillText('‖r‖ / ‖b‖', 0, 0)
    ctx.restore()
  }, [frame, maxIter])

  const curves = curvesRef.current
  return (
    <div
      className="my-6 rounded-lg p-4"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>격자 N</span>
          <input
            type="range"
            min={20}
            max={80}
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
          />
          <span className="tabular-nums" style={{ color: 'var(--text)' }}>
            {N}
          </span>
        </label>
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>최대 반복</span>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={maxIter}
            onChange={(e) => setMaxIter(Number(e.target.value))}
          />
          <span className="tabular-nums" style={{ color: 'var(--text)' }}>
            {maxIter}
          </span>
        </label>
        <button
          type="button"
          onClick={() => setRunKey((k) => k + 1)}
          className="rounded px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          다시 실행
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 260, display: 'block' }}
        aria-label="Krylov 수렴 곡선 비교"
      />
      <div
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        {curves.map((c) => (
          <span key={c.name} className="flex items-center gap-1.5">
            <span
              aria-hidden
              style={{
                width: 14,
                height: 2,
                background: c.color,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text)' }}>{c.name}</span>
            <span className="tabular-nums">
              ({c.residuals.length}회 / 최종 {c.residuals[c.residuals.length - 1].toExponential(1)})
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
