'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

function gaussianWeight(dist: number, h: number): number {
  const r = dist / h
  return Math.exp(-r * r)
}

function solveSym(A: number[][], b: number[]): number[] | null {
  const n = A.length
  const M: number[][] = Array.from({ length: n }, (_, i) => [...A[i], b[i]])
  for (let i = 0; i < n; i++) {
    let pivot = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[pivot][i])) pivot = k
    }
    if (Math.abs(M[pivot][i]) < 1e-14) return null
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

// Taylor basis with factorial scaling: p_k(dx) = dx^k / k!
// Solves min_a sum_i w_i (sum_k a_k p_k(x_i - x*) - u_i)^2
// → a_k approximates u^(k)(x*)
function mlsTaylor(
  xs: number[],
  us: number[],
  xStar: number,
  h: number,
  order: number,
): number[] | null {
  const m = order + 1
  const A: number[][] = Array.from({ length: m }, () => new Array(m).fill(0))
  const B = new Array(m).fill(0)
  const p = new Array(m).fill(0)
  let usedW = 0
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - xStar
    const w = gaussianWeight(Math.abs(dx), h)
    if (w < 1e-9) continue
    usedW += w
    let pk = 1
    let fact = 1
    p[0] = 1
    for (let k = 1; k < m; k++) {
      pk *= dx
      fact *= k
      p[k] = pk / fact
    }
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) A[r][c] += w * p[r] * p[c]
      B[r] += w * p[r] * us[i]
    }
  }
  if (usedW < 1e-9) return null
  return solveSym(A, B)
}

const TARGET = (x: number) => Math.sin(2 * Math.PI * x)
const TARGET_PRIME = (x: number) => 2 * Math.PI * Math.cos(2 * Math.PI * x)

export function MLSGradientRecovery1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [h, setH] = useState(0.07)
  const [order, setOrder] = useState(2)
  const [N, setN] = useState(25)
  const [seed, setSeed] = useState(7)

  const samples = useMemo(() => {
    const rng = mulberry32(seed)
    const xs: number[] = []
    for (let i = 0; i < N; i++) xs.push(rng())
    xs.sort((a, b) => a - b)
    const us = xs.map(TARGET)
    return { xs, us }
  }, [N, seed])

  const result = useMemo(() => {
    const xEval: number[] = []
    const uHat: number[] = []
    const duHat: number[] = []
    const valid: boolean[] = []
    const M = 220
    for (let i = 0; i < M; i++) {
      const x = i / (M - 1)
      xEval.push(x)
      const a = mlsTaylor(samples.xs, samples.us, x, h, order)
      if (!a) {
        uHat.push(0)
        duHat.push(0)
        valid.push(false)
        continue
      }
      uHat.push(a[0])
      duHat.push(order >= 1 ? a[1] : 0)
      valid.push(true)
    }
    let sqErr = 0
    let count = 0
    for (let i = 0; i < M; i++) {
      if (!valid[i]) continue
      const x = xEval[i]
      if (x < 0.05 || x > 0.95) continue
      const e = duHat[i] - TARGET_PRIME(x)
      sqErr += e * e
      count++
    }
    const rmse = count > 0 ? Math.sqrt(sqErr / count) : Number.NaN
    return { xEval, uHat, duHat, valid, rmse }
  }, [samples, h, order])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const padL = 44
    const padR = 16
    const padT = 18
    const padB = 28
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const yMin = -8
    const yMax = 8
    const xToPx = (x: number) => padL + x * plotW
    const yToPx = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin)) * plotH

    // grid
    ctx.strokeStyle = 'rgba(120,140,170,0.18)'
    ctx.lineWidth = 1
    for (let g = -8; g <= 8; g += 2) {
      ctx.beginPath()
      ctx.moveTo(padL, yToPx(g))
      ctx.lineTo(padL + plotW, yToPx(g))
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(120,140,170,0.32)'
    ctx.beginPath()
    ctx.moveTo(padL, yToPx(0))
    ctx.lineTo(padL + plotW, yToPx(0))
    ctx.stroke()

    // axes labels
    ctx.fillStyle = 'rgba(180,200,225,0.7)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('+8', padL - 4, yToPx(8) + 4)
    ctx.fillText('0', padL - 4, yToPx(0) + 4)
    ctx.fillText('-8', padL - 4, yToPx(-8) + 4)
    ctx.textAlign = 'left'
    ctx.fillText('x', padL + plotW - 10, H - 8)

    // True derivative
    ctx.strokeStyle = 'rgba(248,180,80,0.85)'
    ctx.lineWidth = 1.6
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    for (let i = 0; i < result.xEval.length; i++) {
      const x = result.xEval[i]
      const y = TARGET_PRIME(x)
      if (i === 0) ctx.moveTo(xToPx(x), yToPx(y))
      else ctx.lineTo(xToPx(x), yToPx(y))
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Reconstructed derivative
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    let drawing = false
    for (let i = 0; i < result.xEval.length; i++) {
      if (!result.valid[i]) {
        drawing = false
        continue
      }
      const x = result.xEval[i]
      const y = result.duHat[i]
      if (!drawing) {
        ctx.moveTo(xToPx(x), yToPx(y))
        drawing = true
      } else {
        ctx.lineTo(xToPx(x), yToPx(y))
      }
    }
    ctx.stroke()

    // Sample points on bottom
    ctx.fillStyle = 'rgba(245,245,250,0.85)'
    for (const x of samples.xs) {
      ctx.beginPath()
      ctx.arc(xToPx(x), H - padB + 8, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Legend
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(248,180,80,0.95)'
    ctx.fillText('--- true u\'(x) = 2π cos(2πx)', padL + 8, padT + 12)
    ctx.fillStyle = '#22d3ee'
    ctx.fillText('— MLS reconstruction', padL + 8, padT + 28)
  }, [samples, result])

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
        Derivative recovery from {N} scattered samples of u(x) = sin(2πx)
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', maxWidth: 560, display: 'block' }}
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
            min={0.02}
            max={0.30}
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
            max={3}
            step={1}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          sample count N: <strong>{N}</strong>
          <input
            type="range"
            min={10}
            max={60}
            step={1}
            value={N}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </label>
        <button
          type="button"
          onClick={() => setSeed((s) => (s + 1) % 1000)}
          style={{
            justifySelf: 'end',
            alignSelf: 'center',
            padding: '4px 10px',
            border: '1px solid var(--border)',
            borderRadius: 4,
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          resample (seed = {seed})
        </button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13 }}>
        RMSE on derivative (x ∈ [0.05, 0.95]):{' '}
        <strong style={{ color: '#22d3ee' }}>
          {Number.isFinite(result.rmse) ? result.rmse.toFixed(3) : '— (singular A)'}
        </strong>
      </div>
    </div>
  )
}
