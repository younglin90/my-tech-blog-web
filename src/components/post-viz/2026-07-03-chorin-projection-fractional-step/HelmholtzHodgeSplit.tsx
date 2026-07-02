'use client'

import { useEffect, useRef, useState } from 'react'

// Helmholtz-Hodge in one picture. We build a velocity field u* as a swirling
// (divergence-free) base plus a radial "source" of adjustable strength. The
// left panel shows u* and its divergence as a heatmap. The right panel applies
// the projection operator P: solve the pressure Poisson equation for q with
// grad^2 q = div(u*), then subtract grad q. Only the divergence-free part
// survives -- exactly what the corrector step of a fractional-step solver does.

const M = 44 // field grid (periodic)
const ITERS = 60

function ix(i: number, j: number) {
  return j * M + i
}
function w(a: number) {
  return ((a % M) + M) % M
}

function buildField(source: number) {
  const u = new Float32Array(M * M)
  const v = new Float32Array(M * M)
  const cx = M * 0.5
  const cy = M * 0.5
  const sig = M * 0.16
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      const x = (i + 0.5) / M
      const y = (j + 0.5) / M
      // divergence-free swirl from stream function psi = sin(2pi x) sin(2pi y)
      const su = 2 * Math.PI * Math.sin(2 * Math.PI * x) * Math.cos(2 * Math.PI * y)
      const sv = -2 * Math.PI * Math.cos(2 * Math.PI * x) * Math.sin(2 * Math.PI * y)
      // radial source: gradient of a Gaussian bump -> pure divergence
      const dx = i + 0.5 - cx
      const dy = j + 0.5 - cy
      const r2 = dx * dx + dy * dy
      const g = Math.exp(-r2 / (2 * sig * sig))
      const gx = (-dx / (sig * sig)) * g
      const gy = (-dy / (sig * sig)) * g
      u[ix(i, j)] = 0.12 * su + source * gx
      v[ix(i, j)] = 0.12 * sv + source * gy
    }
  }
  return { u, v }
}

function project(u: Float32Array, v: Float32Array) {
  const div = new Float32Array(M * M)
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      div[ix(i, j)] =
        0.5 * (u[ix(w(i + 1), j)] - u[ix(w(i - 1), j)]) +
        0.5 * (v[ix(i, w(j + 1))] - v[ix(i, w(j - 1))])
    }
  }
  let q = new Float32Array(M * M)
  let q1 = new Float32Array(M * M)
  for (let k = 0; k < ITERS; k++) {
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        q1[ix(i, j)] =
          (q[ix(w(i + 1), j)] +
            q[ix(w(i - 1), j)] +
            q[ix(i, w(j + 1))] +
            q[ix(i, w(j - 1))] -
            div[ix(i, j)]) *
          0.25
      }
    }
    const t = q
    q = q1
    q1 = t
  }
  const pu = new Float32Array(M * M)
  const pv = new Float32Array(M * M)
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      pu[ix(i, j)] = u[ix(i, j)] - 0.5 * (q[ix(w(i + 1), j)] - q[ix(w(i - 1), j)])
      pv[ix(i, j)] = v[ix(i, j)] - 0.5 * (q[ix(i, w(j + 1))] - q[ix(i, w(j - 1))])
    }
  }
  return { pu, pv }
}

function divOf(u: Float32Array, v: Float32Array) {
  const d = new Float32Array(M * M)
  let dmax = 0
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      const val =
        0.5 * (u[ix(w(i + 1), j)] - u[ix(w(i - 1), j)]) +
        0.5 * (v[ix(i, w(j + 1))] - v[ix(i, w(j - 1))])
      d[ix(i, j)] = val
      if (Math.abs(val) > dmax) dmax = Math.abs(val)
    }
  }
  return { d, dmax }
}

export function HelmholtzHodgeSplit() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [source, setSource] = useState(6)
  const [rawMax, setRawMax] = useState(0)
  const [projMax, setProjMax] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g2d: CanvasRenderingContext2D = ctx // non-null ref for use in closures

    const PANEL = 240
    const GAP = 28
    const W = PANEL * 2 + GAP
    const H = PANEL + 30
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    g2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    g2d.clearRect(0, 0, W, H)

    const { u, v } = buildField(source)
    const before = divOf(u, v)
    const { pu, pv } = project(u, v)
    const after = divOf(pu, pv)
    setRawMax(before.dmax)
    setProjMax(after.dmax)

    const scaleDiv = Math.max(0.02, before.dmax)

    function drawPanel(
      ox: number,
      uu: Float32Array,
      vv: Float32Array,
      dd: Float32Array,
      title: string
    ) {
      const cell = PANEL / M
      // divergence heatmap background
      for (let j = 0; j < M; j++) {
        for (let i = 0; i < M; i++) {
          const t = Math.max(-1, Math.min(1, dd[ix(i, j)] / scaleDiv))
          let r: number, g: number, b: number
          if (t >= 0) {
            r = Math.round(248 - t * 20)
            g = Math.round(113 + (1 - t) * 120)
            b = Math.round(113 + (1 - t) * 100)
          } else {
            const s = -t
            r = Math.round(34 + (1 - s) * 190)
            g = Math.round(150 + (1 - s) * 80)
            b = Math.round(220)
          }
          const bg = Math.abs(t)
          // blend toward panel background when near zero divergence
          r = Math.round(r * bg + 12 * (1 - bg))
          g = Math.round(g * bg + 22 * (1 - bg))
          b = Math.round(b * bg + 38 * (1 - bg))
          g2d.fillStyle = `rgb(${r},${g},${b})`
          g2d.fillRect(ox + i * cell, 24 + j * cell, cell + 1, cell + 1)
        }
      }
      // arrows (subsampled)
      const stride = 4
      g2d.strokeStyle = 'rgba(240,244,248,0.85)'
      g2d.lineWidth = 1
      let amax = 1e-6
      for (let j = 0; j < M; j += stride) {
        for (let i = 0; i < M; i += stride) {
          const s = Math.hypot(uu[ix(i, j)], vv[ix(i, j)])
          if (s > amax) amax = s
        }
      }
      const len = (cell * stride) * 0.9
      for (let j = 0; j < M; j += stride) {
        for (let i = 0; i < M; i += stride) {
          const uij = uu[ix(i, j)]
          const vij = vv[ix(i, j)]
          const s = Math.hypot(uij, vij) / amax
          const px = ox + (i + 0.5) * cell
          const py = 24 + (j + 0.5) * cell
          const ex = px + (uij / amax) * len
          const ey = py + (vij / amax) * len
          g2d.beginPath()
          g2d.moveTo(px, py)
          g2d.lineTo(ex, ey)
          g2d.stroke()
          // arrowhead
          const ang = Math.atan2(ey - py, ex - px)
          const hl = 3 + s * 2
          g2d.beginPath()
          g2d.moveTo(ex, ey)
          g2d.lineTo(ex - hl * Math.cos(ang - 0.4), ey - hl * Math.sin(ang - 0.4))
          g2d.moveTo(ex, ey)
          g2d.lineTo(ex - hl * Math.cos(ang + 0.4), ey - hl * Math.sin(ang + 0.4))
          g2d.stroke()
        }
      }
      g2d.fillStyle = '#cbd5e1'
      g2d.font = '12px ui-monospace, monospace'
      g2d.fillText(title, ox, 16)
      g2d.strokeStyle = 'rgba(120,140,160,0.4)'
      g2d.strokeRect(ox, 24, PANEL, PANEL)
    }

    drawPanel(0, u, v, before.d, 'u*  (before projection)')
    drawPanel(PANEL + GAP, pu, pv, after.d, 'P u*  (divergence-free)')
  }, [source])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          source strength
          <input
            type="range"
            min={0}
            max={14}
            step={0.5}
            value={source}
            onChange={(e) => setSource(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', width: 30 }}>{source.toFixed(1)}</span>
        </label>
        <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--text-muted)' }}>
          max|∇·u*| = {rawMax.toFixed(3)} → {projMax.toFixed(4)}
        </span>
      </div>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '10px 0 0' }}>
        Red = positive divergence (source), blue = negative (sink), dark = zero. Raise the
        source and the left panel lights up; the right panel stays dark — projection strips
        the compressible part and keeps only the swirl.
      </p>
    </div>
  )
}
