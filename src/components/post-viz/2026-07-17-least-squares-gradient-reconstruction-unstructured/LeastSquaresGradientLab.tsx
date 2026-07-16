'use client'

import { useEffect, useRef, useState } from 'react'

// Weighted least-squares gradient reconstruction on a scattered stencil.
//
// A center cell C sits at the origin. Its neighbors k live at offsets d_k.
// The underlying field is linear plus a curvature bump:
//
//   phi(p) = g_true . p + 0.5 * kappa * |p|^2 ,   phi(C) = 0.
//
// Least squares minimizes  sum_k w_k ( phi_k - g . d_k )^2  over the gradient g.
// The normal equations are the 2x2 system  M g = b  with
//
//   M = sum_k w_k d_k d_k^T ,   b = sum_k w_k phi_k d_k ,   w_k = |d_k|^{-n}.
//
// With kappa = 0 the fit is exact for any stencil. Curvature injects an error
// that a distance weighting (n -> 1) suppresses, because far neighbors — where
// the quadratic term is largest — get down-weighted. Drag the sliders and watch
// the orange (reconstructed) arrow swing back toward the green (true) one.

type Vec = { x: number; y: number }

function buildStencil(count: number, aniso: number, cluster: number): Vec[] {
  const pts: Vec[] = []
  for (let k = 0; k < count; k++) {
    const base = (k + 0.5) / count // 0..1
    // clustering biases the angular spread toward one side
    const t = base + cluster * 0.5 * Math.sin(2 * Math.PI * base)
    const theta = 2 * Math.PI * t
    const r = 1 + 0.35 * Math.cos(3 * theta) // mild radius variation
    pts.push({ x: aniso * r * Math.cos(theta), y: r * Math.sin(theta) })
  }
  return pts
}

function lsqGradient(pts: Vec[], gx: number, gy: number, kappa: number, n: number): Vec {
  let m11 = 0, m12 = 0, m22 = 0, b1 = 0, b2 = 0
  for (const d of pts) {
    const r2 = d.x * d.x + d.y * d.y
    const phi = gx * d.x + gy * d.y + 0.5 * kappa * r2
    const w = Math.pow(Math.max(Math.sqrt(r2), 1e-6), -n)
    m11 += w * d.x * d.x
    m12 += w * d.x * d.y
    m22 += w * d.y * d.y
    b1 += w * phi * d.x
    b2 += w * phi * d.y
  }
  const det = m11 * m22 - m12 * m12
  if (Math.abs(det) < 1e-9) return { x: gx, y: gy }
  return { x: (m22 * b1 - m12 * b2) / det, y: (m11 * b2 - m12 * b1) / det }
}

export function LeastSquaresGradientLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [aniso, setAniso] = useState(0.35)
  const [kappa, setKappa] = useState(1.4)
  const [n, setN] = useState(0)
  const [cluster, setCluster] = useState(0.6)

  const gx = 1.0
  const gy = 0.4

  const pts = buildStencil(9, aniso, cluster)
  const gEst = lsqGradient(pts, gx, gy, kappa, n)
  const errAngle =
    (Math.atan2(gEst.y, gEst.x) - Math.atan2(gy, gx)) * (180 / Math.PI)
  const trueMag = Math.hypot(gx, gy)
  const estMag = Math.hypot(gEst.x, gEst.y)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0e1420'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2
    const scale = 92 // px per unit offset

    // connect center to neighbors
    ctx.strokeStyle = 'rgba(120,140,170,0.35)'
    ctx.lineWidth = 1
    for (const d of pts) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + d.x * scale, cy - d.y * scale)
      ctx.stroke()
    }
    // neighbor nodes
    for (const d of pts) {
      ctx.beginPath()
      ctx.arc(cx + d.x * scale, cy - d.y * scale, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#7aa7ff'
      ctx.fill()
    }

    const arrow = (vx: number, vy: number, color: string, lw: number) => {
      const L = 120
      const ex = cx + vx * L
      const ey = cy - vy * L
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(ex, ey)
      ctx.stroke()
      const ang = Math.atan2(ey - cy, ex - cx)
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - 10 * Math.cos(ang - 0.4), ey - 10 * Math.sin(ang - 0.4))
      ctx.lineTo(ex - 10 * Math.cos(ang + 0.4), ey - 10 * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    // true gradient (green), reconstructed (orange)
    arrow(gx / trueMag, gy / trueMag, '#6fd08c', 3)
    const em = Math.hypot(gEst.x, gEst.y) || 1
    arrow(gEst.x / em, gEst.y / em, '#ffb27a', 3)

    // center cell
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI)
    ctx.fillStyle = '#f4f6fb'
    ctx.fill()

    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = '#6fd08c'
    ctx.fillText('true ∇φ', cx + 128 * (gx / trueMag) - 10, cy - 128 * (gy / trueMag))
    ctx.fillStyle = '#ffb27a'
    ctx.fillText('LSQ ∇φ', cx + 130 * (gEst.x / em) - 10, cy - 130 * (gEst.y / em) + 14)
  }, [aniso, kappa, n, cluster, gEst.x, gEst.y, gx, gy, pts, trueMag])

  const bad = Math.abs(errAngle) > 6
  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'system-ui, sans-serif' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={340}
        style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 10, display: 'block' }}
      />
      <div style={{ marginTop: 8, fontSize: 13, color: bad ? '#ffb27a' : '#6fd08c' }}>
        {`angle error ${errAngle.toFixed(1)}° · |∇φ| ${estMag.toFixed(2)} vs ${trueMag.toFixed(2)} true`}
        {bad ? ' — the reconstructed gradient is skewed' : ' — close to exact'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.6rem', fontSize: 13, color: '#c9d3e0' }}>
        <label style={lab}>
          Stencil anisotropy: {aniso.toFixed(2)}
          <input type="range" min={0.15} max={1} step={0.05} value={aniso} onChange={(e) => setAniso(+e.target.value)} />
        </label>
        <label style={lab}>
          Field curvature κ: {kappa.toFixed(2)}
          <input type="range" min={0} max={3} step={0.1} value={kappa} onChange={(e) => setKappa(+e.target.value)} />
        </label>
        <label style={lab}>
          Weight exponent n: {n.toFixed(1)}
          <input type="range" min={0} max={2} step={0.1} value={n} onChange={(e) => setN(+e.target.value)} />
        </label>
        <label style={lab}>
          Neighbor clustering: {cluster.toFixed(2)}
          <input type="range" min={0} max={1} step={0.05} value={cluster} onChange={(e) => setCluster(+e.target.value)} />
        </label>
      </div>
    </div>
  )
}

const lab: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}
