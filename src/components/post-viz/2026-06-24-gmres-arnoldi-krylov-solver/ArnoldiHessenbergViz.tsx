'use client'

import { useEffect, useRef, useState } from 'react'

// Visualizes the Arnoldi process: building the upper-Hessenberg matrix H
// and showing that the Krylov basis stays orthonormal (Gram matrix -> identity).

type Vec = number[]
type Mat = number[][]

function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function buildMatrix(n: number, seed: number): Mat {
  const rng = makeRng(seed)
  const A: Mat = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // diagonally dominant, mildly non-symmetric
      A[i][j] = (rng() - 0.5) * 0.8
    }
    A[i][i] += 2 + i * 0.5
  }
  return A
}

// run full Arnoldi, recording H column-by-column and the orthonormal basis V
function arnoldi(A: Mat, n: number) {
  const rng = makeRng(99)
  let v: Vec = new Array(n).fill(0).map(() => rng() - 0.5)
  let nv = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  v = v.map((x) => x / nv)
  const V: Vec[] = [v]
  const H: Mat = Array.from({ length: n + 1 }, () => new Array(n).fill(0))
  for (let j = 0; j < n; j++) {
    let w: Vec = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      let s = 0
      for (let k = 0; k < n; k++) s += A[i][k] * V[j][k]
      w[i] = s
    }
    for (let i = 0; i <= j; i++) {
      let h = 0
      for (let k = 0; k < n; k++) h += w[k] * V[i][k]
      H[i][j] = h
      for (let k = 0; k < n; k++) w[k] -= h * V[i][k]
    }
    const hj = Math.sqrt(w.reduce((s, x) => s + x * x, 0))
    H[j + 1][j] = hj
    if (j + 1 < n && hj > 1e-12) V.push(w.map((x) => x / hj))
  }
  return { V, H }
}

export function ArnoldiHessenbergViz() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [n, setN] = useState(8)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const rafRef = useRef<number | null>(null)
  const tRef = useRef(0)

  // recompute Arnoldi when n changes
  const dataRef = useRef<{ V: Vec[]; H: Mat } | null>(null)
  useEffect(() => {
    const A = buildMatrix(n, 2024)
    dataRef.current = arnoldi(A, n)
    setStep(0)
    tRef.current = 0
  }, [n])

  // animation driver
  useEffect(() => {
    if (!playing) return
    const tick = () => {
      tRef.current += 1
      if (tRef.current % 28 === 0) {
        setStep((s) => (s + 1) % (n + 1))
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, n])

  // draw
  useEffect(() => {
    const canvas = canvasRef.current
    const data = dataRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const Hgt = canvas.height
    ctx.clearRect(0, 0, W, Hgt)

    const { V, H } = data
    const j = step // number of completed Arnoldi steps

    // ---- left panel: Hessenberg matrix H ((n+1) x n) ----
    const cell = Math.min(26, Math.floor((W / 2 - 40) / n))
    const ox = 20
    const oy = 44
    ctx.font = '12px ui-sans-serif, sans-serif'
    ctx.fillStyle = 'var(--text)'
    ctx.textAlign = 'left'
    ctx.fillText('Hessenberg H', ox, 28)

    let maxAbs = 1e-6
    for (let r = 0; r <= n; r++)
      for (let c = 0; c < n; c++) maxAbs = Math.max(maxAbs, Math.abs(H[r][c]))

    for (let r = 0; r <= n; r++) {
      for (let c = 0; c < n; c++) {
        const filled = c < j
        const val = H[r][c]
        const mag = Math.abs(val) / maxAbs
        if (filled) {
          // cyan for entries, dim for structural zeros (below subdiagonal)
          if (r > c + 1) {
            ctx.fillStyle = 'rgba(122,144,168,0.10)'
          } else {
            const a = 0.15 + 0.75 * Math.sqrt(mag)
            ctx.fillStyle = `rgba(34,211,238,${a})`
          }
        } else {
          ctx.fillStyle = 'rgba(122,144,168,0.06)'
        }
        ctx.fillRect(ox + c * cell, oy + r * cell, cell - 2, cell - 2)
      }
    }
    // highlight current column
    if (j < n) {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.strokeRect(ox + j * cell - 1, oy - 1, cell, (n + 1) * cell)
    }

    // ---- right panel: Gram matrix V^T V (should be identity) ----
    const gx = W / 2 + 24
    const gcell = Math.min(26, Math.floor((W / 2 - 50) / Math.max(j, 1)))
    ctx.fillStyle = 'var(--text)'
    ctx.fillText('Gram  Vᵀ V  (→ I)', gx, 28)
    const cols = Math.max(j, 1)
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        let g = 0
        if (V[r] && V[c]) for (let k = 0; k < n; k++) g += V[r][k] * V[c][k]
        const onDiag = r === c
        const a = Math.min(1, Math.abs(g))
        ctx.fillStyle = onDiag
          ? `rgba(34,211,238,${0.25 + 0.7 * a})`
          : `rgba(245,158,11,${0.12 + 0.85 * a})`
        ctx.fillRect(gx + c * gcell, oy + r * gcell, gcell - 2, gcell - 2)
      }
    }

    ctx.fillStyle = '#7a90a8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`step ${j} / ${n}`, ox, oy + (n + 1) * cell + 20)
    ctx.fillText('orange = off-diagonal leak', gx, oy + cols * gcell + 20)
  }, [step, n])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={560}
        height={320}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 14, alignItems: 'center' }}>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {playing ? '⏸ pause' : '▶ play'}
        </button>
        <button
          onClick={() => {
            setPlaying(false)
            setStep((s) => Math.min(s + 1, n))
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          step ▷
        </button>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          dimension n = {n}
          <input
            type="range"
            min={4}
            max={14}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            style={{ display: 'block', width: 160 }}
          />
        </label>
      </div>
    </div>
  )
}
