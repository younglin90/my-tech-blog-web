'use client'

import { useEffect, useRef, useState } from 'react'

// Conditioning of the least-squares moment matrix M = sum_k w_k d_k d_k^T.
//
// Solving M g = b amplifies noise by the condition number cond(M) = lam_max/lam_min.
// When the neighbor offsets d_k line up along one direction, M becomes nearly
// singular: the gradient is well determined along the stencil but almost free
// across it. The ellipse below is drawn from the eigenvectors of M^{-1}; a long
// thin ellipse is a warning that the reconstruction is one bad neighbor away
// from blowing up. Squeeze the stencil toward a line and watch cond(M) explode.

type Vec = { x: number; y: number }

function ring(count: number, collinear: number): Vec[] {
  const pts: Vec[] = []
  for (let k = 0; k < count; k++) {
    const theta = (2 * Math.PI * (k + 0.5)) / count
    // collinear -> 0 flattens the y-extent, pushing every point toward the x-axis
    pts.push({ x: Math.cos(theta), y: (1 - collinear) * Math.sin(theta) })
  }
  return pts
}

function moment(pts: Vec[]) {
  let a = 0, b = 0, c = 0
  for (const d of pts) {
    const w = 1 / Math.max(Math.hypot(d.x, d.y), 1e-6)
    a += w * d.x * d.x
    b += w * d.x * d.y
    c += w * d.y * d.y
  }
  const tr = a + c
  const dsc = Math.sqrt(Math.max(((a - c) / 2) ** 2 + b * b, 0))
  const lamMax = tr / 2 + dsc
  const lamMin = tr / 2 - dsc
  // principal axis angle
  const angle = 0.5 * Math.atan2(2 * b, a - c)
  return { lamMax, lamMin, angle }
}

export function StencilConditioningExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [collinear, setCollinear] = useState(0.2)
  const [count, setCount] = useState(6)

  const pts = ring(count, collinear)
  const { lamMax, lamMin, angle } = moment(pts)
  const cond = lamMin > 1e-9 ? lamMax / lamMin : Infinity

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
    const s = 110

    // error ellipse: semi-axes ~ 1/sqrt(lambda) of M (large where lambda small)
    const axMax = 1 / Math.sqrt(Math.max(lamMin, 1e-6)) // long axis (weak direction)
    const axMin = 1 / Math.sqrt(Math.max(lamMax, 1e-6))
    const eScale = 48
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-angle)
    ctx.beginPath()
    ctx.ellipse(0, 0, Math.min(axMax * eScale, 320), axMin * eScale, 0, 0, 2 * Math.PI)
    ctx.fillStyle = cond > 30 ? 'rgba(255,120,90,0.18)' : 'rgba(120,200,150,0.16)'
    ctx.fill()
    ctx.strokeStyle = cond > 30 ? 'rgba(255,140,110,0.9)' : 'rgba(130,220,160,0.9)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    // neighbor offsets
    for (const d of pts) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + d.x * s, cy - d.y * s)
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + d.x * s, cy - d.y * s, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#7aa7ff'
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI)
    ctx.fillStyle = '#f4f6fb'
    ctx.fill()
  }, [collinear, count, pts, lamMin, lamMax, angle, cond])

  const danger = cond > 30
  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'system-ui, sans-serif' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={320}
        style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 10, display: 'block' }}
      />
      <div style={{ marginTop: 8, fontSize: 13, color: danger ? '#ff8c6e' : '#6fd08c' }}>
        {`cond(M) = ${cond === Infinity ? '∞' : cond.toFixed(1)}  (λ_max ${lamMax.toFixed(2)} / λ_min ${lamMin.toFixed(3)})`}
        {danger ? ' — ill-conditioned: gradient poorly determined across the stencil' : ' — well-conditioned'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.6rem', fontSize: 13, color: '#c9d3e0' }}>
        <label style={lab}>
          Collinearity: {collinear.toFixed(2)}
          <input type="range" min={0} max={0.98} step={0.02} value={collinear} onChange={(e) => setCollinear(+e.target.value)} />
        </label>
        <label style={lab}>
          Neighbor count: {count}
          <input type="range" min={3} max={12} step={1} value={count} onChange={(e) => setCount(+e.target.value)} />
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
