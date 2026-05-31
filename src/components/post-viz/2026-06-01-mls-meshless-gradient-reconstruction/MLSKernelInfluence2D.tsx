'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

type Node = { x: number; y: number; u: number }

const U_FIELD = (x: number, y: number) =>
  Math.sin(2 * Math.PI * x) * Math.cos(2 * Math.PI * y)

function gaussianW(dist: number, h: number) {
  const r = dist / h
  return Math.exp(-r * r)
}

function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = A.length
  const M: number[][] = Array.from({ length: n }, (_, i) => [...A[i], b[i]])
  for (let i = 0; i < n; i++) {
    let pivot = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[pivot][i])) pivot = k
    }
    if (Math.abs(M[pivot][i]) < 1e-13) return null
    if (pivot !== i) {
      const tmp = M[i]
      M[i] = M[pivot]
      M[pivot] = tmp
    }
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i]
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n]
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]
    x[i] = s / M[i][i]
  }
  return x
}

function basis2D(dx: number, dy: number, order: number): number[] {
  if (order === 1) return [1, dx, dy]
  return [1, dx, dy, 0.5 * dx * dx, dx * dy, 0.5 * dy * dy]
}

// Returns [u, ∂u/∂x, ∂u/∂y, ...] at (xq, yq) given Taylor-scaled basis.
function mlsAt(
  nodes: Node[],
  xq: number,
  yq: number,
  h: number,
  order: number,
): { coeffs: number[]; activeWeight: number; activeCount: number } | null {
  const m = order === 1 ? 3 : 6
  const A: number[][] = Array.from({ length: m }, () => new Array(m).fill(0))
  const B = new Array(m).fill(0)
  let activeWeight = 0
  let activeCount = 0
  for (const n of nodes) {
    const dx = n.x - xq
    const dy = n.y - yq
    const w = gaussianW(Math.hypot(dx, dy), h)
    if (w < 1e-7) continue
    activeWeight += w
    activeCount++
    const p = basis2D(dx, dy, order)
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) A[r][c] += w * p[r] * p[c]
      B[r] += w * p[r] * n.u
    }
  }
  if (activeCount < m) return { coeffs: [], activeWeight, activeCount }
  const a = solveLinear(A, B)
  if (!a) return { coeffs: [], activeWeight, activeCount }
  return { coeffs: a, activeWeight, activeCount }
}

export function MLSKernelInfluence2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [h, setH] = useState(0.18)
  const [order, setOrder] = useState(2)
  const [query, setQuery] = useState({ x: 0.5, y: 0.5 })
  const draggingRef = useRef(false)

  const nodes = useMemo<Node[]>(() => {
    const rng = mulberry32(11)
    const out: Node[] = []
    const N = 28
    while (out.length < N) {
      const x = 0.06 + rng() * 0.88
      const y = 0.06 + rng() * 0.88
      // light Poisson-like rejection so points are not too clustered
      let ok = true
      for (const n of out) {
        if (Math.hypot(n.x - x, n.y - y) < 0.08) {
          ok = false
          break
        }
      }
      if (ok) out.push({ x, y, u: U_FIELD(x, y) })
    }
    return out
  }, [])

  const fit = useMemo(() => mlsAt(nodes, query.x, query.y, h, order), [nodes, query, h, order])

  const exactU = U_FIELD(query.x, query.y)
  const reconU = fit && fit.coeffs.length > 0 ? fit.coeffs[0] : Number.NaN
  const err = Number.isFinite(reconU) ? reconU - exactU : Number.NaN

  const handlePointer = useCallback((evt: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = (evt.clientX - rect.left) / rect.width
    const py = (evt.clientY - rect.top) / rect.height
    const xn = Math.max(0.02, Math.min(0.98, px))
    const yn = Math.max(0.02, Math.min(0.98, py))
    setQuery({ x: xn, y: yn })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const toPx = (x: number, y: number) => [x * W, y * H] as const

    // background grid
    ctx.strokeStyle = 'rgba(110,135,170,0.13)'
    ctx.lineWidth = 1
    for (let g = 1; g < 6; g++) {
      const f = g / 6
      ctx.beginPath()
      ctx.moveTo(f * W, 0)
      ctx.lineTo(f * W, H)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, f * H)
      ctx.lineTo(W, f * H)
      ctx.stroke()
    }

    // kernel radius circle (h)
    const [qpx, qpy] = toPx(query.x, query.y)
    ctx.strokeStyle = 'rgba(34,211,238,0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(qpx, qpy, h * W, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // nodes with weight-modulated alpha
    for (const n of nodes) {
      const d = Math.hypot(n.x - query.x, n.y - query.y)
      const w = gaussianW(d, h)
      const [x, y] = toPx(n.x, n.y)
      const tint = Math.max(0.12, w)
      ctx.fillStyle = `rgba(34,211,238,${0.18 + 0.72 * w})`
      ctx.strokeStyle = `rgba(34,211,238,${0.4 + 0.6 * w})`
      ctx.beginPath()
      ctx.arc(x, y, 4 + 7 * w, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 1
      ctx.stroke()
      // connect to query if weight above threshold
      if (w > 0.05) {
        ctx.strokeStyle = `rgba(34,211,238,${0.06 + 0.35 * w})`
        ctx.beginPath()
        ctx.moveTo(qpx, qpy)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      void tint
    }

    // query point
    ctx.fillStyle = 'rgba(245,210,90,0.95)'
    ctx.strokeStyle = 'rgba(40,40,60,0.85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(qpx, qpy, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // label near top-left
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(210,220,240,0.85)'
    ctx.textAlign = 'left'
    ctx.fillText('drag the yellow point — query x*', 8, 16)
  }, [nodes, query, h])

  return (
    <div
      style={{
        margin: '1.5rem 0',
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
        u(x, y) = sin(2πx) cos(2πy) sampled at 28 scattered nodes
      </div>
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        style={{
          width: '100%',
          maxWidth: 420,
          aspectRatio: '1 / 1',
          display: 'block',
          touchAction: 'none',
          cursor: 'crosshair',
          background: 'transparent',
        }}
        onPointerDown={(e) => {
          ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
          draggingRef.current = true
          handlePointer(e)
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) handlePointer(e)
        }}
        onPointerUp={(e) => {
          draggingRef.current = false
          ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem 1rem',
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <label>
          kernel radius h: <strong>{h.toFixed(3)}</strong>
          <input
            type="range"
            min={0.05}
            max={0.45}
            step={0.005}
            value={h}
            onChange={(e) => setH(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          polynomial order: <strong>{order}</strong>
          <input
            type="range"
            min={1}
            max={2}
            step={1}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          fontSize: 13,
        }}
      >
        <div>
          exact u(x*):{' '}
          <strong style={{ color: 'rgba(248,180,80,0.95)' }}>{exactU.toFixed(3)}</strong>
        </div>
        <div>
          MLS u^h(x*):{' '}
          <strong style={{ color: '#22d3ee' }}>
            {Number.isFinite(reconU) ? reconU.toFixed(3) : '—'}
          </strong>
        </div>
        <div>
          error:{' '}
          <strong style={{ color: Math.abs(err) > 0.2 ? '#f87171' : '#86efac' }}>
            {Number.isFinite(err) ? err.toFixed(3) : '—'}
          </strong>
        </div>
        <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
          active nodes inside kernel: {fit?.activeCount ?? 0}
          {fit && fit.coeffs.length === 0 ? ' — singular (need ≥ m nodes)' : ''}
        </div>
      </div>
    </div>
  )
}
