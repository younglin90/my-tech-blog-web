'use client'

import { useEffect, useRef, useState } from 'react'

type Pt = [number, number]

function inCircle(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const ax = a[0] - d[0], ay = a[1] - d[1]
  const bx = b[0] - d[0], by = b[1] - d[1]
  const cx = c[0] - d[0], cy = c[1] - d[1]
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)
  const o = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  return det * Math.sign(o) > 1e-9
}

function circumcircle(a: Pt, b: Pt, c: Pt): { cx: number; cy: number; r: number } | null {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  if (Math.abs(d) < 1e-9) return null
  const a2 = a[0] * a[0] + a[1] * a[1]
  const b2 = b[0] * b[0] + b[1] * b[1]
  const c2 = c[0] * c[0] + c[1] * c[1]
  const cx = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d
  const cy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d
  return { cx, cy, r: Math.hypot(a[0] - cx, a[1] - cy) }
}

function minAngleDeg(a: Pt, b: Pt, c: Pt): number {
  const ang = (p: Pt, q: Pt, r: Pt) => {
    const v1 = [q[0] - p[0], q[1] - p[1]]
    const v2 = [r[0] - p[0], r[1] - p[1]]
    const d = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]))
    return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI
  }
  return Math.min(ang(a, b, c), ang(b, c, a), ang(c, a, b))
}

export function EdgeFlipInCircleTest() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [yBottom, setYBottom] = useState(235)

  // P0 left, P2 right share the horizontal diagonal; P3 top, P1 bottom
  const P0: Pt = [80, 150]
  const P2: Pt = [400, 150]
  const P3: Pt = [240, 70]
  const P1: Pt = [240, yBottom]

  const p3Inside = inCircle(P0, P1, P2, P3)
  const minAC = Math.min(minAngleDeg(P0, P1, P2), minAngleDeg(P0, P2, P3))
  const minBD = Math.min(minAngleDeg(P0, P1, P3), minAngleDeg(P1, P2, P3))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1422'
    ctx.fillRect(0, 0, W, H)

    // circumcircle of the bottom triangle (P0,P1,P2)
    const c = circumcircle(P0, P1, P2)
    if (c) {
      ctx.strokeStyle = p3Inside ? 'rgba(248, 113, 113, 0.55)' : 'rgba(34, 211, 238, 0.45)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // quad outline
    ctx.strokeStyle = 'rgba(150, 200, 230, 0.5)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(P0[0], P0[1])
    ctx.lineTo(P1[0], P1[1])
    ctx.lineTo(P2[0], P2[1])
    ctx.lineTo(P3[0], P3[1])
    ctx.closePath()
    ctx.stroke()

    // the Delaunay diagonal solid green, the illegal one dashed red
    const drawDiag = (a: Pt, b: Pt, ok: boolean) => {
      ctx.strokeStyle = ok ? '#34d399' : 'rgba(248, 113, 113, 0.7)'
      ctx.lineWidth = ok ? 2.4 : 1.4
      ctx.setLineDash(ok ? [] : [6, 5])
      ctx.beginPath()
      ctx.moveTo(a[0], a[1])
      ctx.lineTo(b[0], b[1])
      ctx.stroke()
      ctx.setLineDash([])
    }
    // if P3 sits inside the circle, AC is illegal → flip to BD
    drawDiag(P0, P2, !p3Inside)
    drawDiag(P1, P3, p3Inside)

    // vertices + labels
    const dot = (p: Pt, label: string) => {
      ctx.fillStyle = '#f0b429'
      ctx.beginPath()
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(200, 215, 230, 0.9)'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(label, p[0] + 7, p[1] - 6)
    }
    dot(P0, 'A')
    dot(P2, 'C')
    dot(P3, 'D')
    dot(P1, 'B')

    ctx.fillStyle = p3Inside ? '#f87171' : '#34d399'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText(
      p3Inside ? 'D inside circle → flip to B–D' : 'D outside circle → A–C is Delaunay',
      12,
      24,
    )
    ctx.fillStyle = 'rgba(180, 200, 220, 0.8)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText(`min-angle  A–C: ${minAC.toFixed(1)}°    B–D: ${minBD.toFixed(1)}°`, 12, H - 14)
  }, [yBottom, p3Inside, minAC, minBD])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '16px 0',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: 320, display: 'block', borderRadius: 6 }} />
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, fontSize: 13 }}>
        <span>vertex B height (drag B up toward the diagonal)</span>
        <input
          type="range"
          min={165}
          max={300}
          step={1}
          value={yBottom}
          onChange={(e) => setYBottom(parseInt(e.target.value))}
        />
      </label>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        The circle is the circumcircle of triangle A–B–C. Slide B upward: when D
        crosses into the circle the diagonal A–C becomes illegal and the
        Delaunay solution flips to B–D. Notice the larger of the two min-angle
        numbers always belongs to the chosen diagonal — Delaunay maximizes the
        smallest angle.
      </p>
    </div>
  )
}
