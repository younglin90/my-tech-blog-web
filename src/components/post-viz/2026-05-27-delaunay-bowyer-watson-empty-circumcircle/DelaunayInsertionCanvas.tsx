'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Pt = [number, number]
type Tri = [Pt, Pt, Pt]

function orient(a: Pt, b: Pt, c: Pt): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

// True if d lies strictly inside the circumcircle of (a,b,c).
// Sign is normalized by triangle orientation, so winding does not matter.
function inCircle(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const ax = a[0] - d[0], ay = a[1] - d[1]
  const bx = b[0] - d[0], by = b[1] - d[1]
  const cx = c[0] - d[0], cy = c[1] - d[1]
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)
  const o = orient(a, b, c)
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
  const r = Math.hypot(a[0] - cx, a[1] - cy)
  return { cx, cy, r }
}

const same = (p: Pt, q: Pt) => p[0] === q[0] && p[1] === q[1]
const triHas = (t: Tri, p: Pt) => same(t[0], p) || same(t[1], p) || same(t[2], p)

function bowyerWatson(points: Pt[], W: number, H: number): Tri[] {
  if (points.length < 3) return []
  const M = Math.max(W, H) * 4
  const s0: Pt = [W / 2 - 2 * M, H / 2 - M]
  const s1: Pt = [W / 2 + 2 * M, H / 2 - M]
  const s2: Pt = [W / 2, H / 2 + 2 * M]
  let tris: Tri[] = [[s0, s1, s2]]

  for (const p of points) {
    const bad: Tri[] = []
    for (const t of tris) if (inCircle(t[0], t[1], t[2], p)) bad.push(t)

    const edgeCount = new Map<string, { e: [Pt, Pt]; n: number }>()
    for (const t of bad) {
      const edges: [Pt, Pt][] = [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ]
      for (const e of edges) {
        const key =
          e[0][0] < e[1][0] || (e[0][0] === e[1][0] && e[0][1] <= e[1][1])
            ? `${e[0][0]},${e[0][1]}|${e[1][0]},${e[1][1]}`
            : `${e[1][0]},${e[1][1]}|${e[0][0]},${e[0][1]}`
        const cur = edgeCount.get(key)
        if (cur) cur.n += 1
        else edgeCount.set(key, { e, n: 1 })
      }
    }
    tris = tris.filter((t) => !bad.includes(t))
    for (const { e, n } of edgeCount.values()) {
      if (n === 1) tris.push([e[0], e[1], p])
    }
  }

  return tris.filter(
    (t) =>
      !triHas(t, s0) && !triHas(t, s1) && !triHas(t, s2),
  )
}

export function DelaunayInsertionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [points, setPoints] = useState<Pt[]>([])
  const [showCircles, setShowCircles] = useState(true)

  const scatter = useCallback((n: number) => {
    const cv = canvasRef.current
    const W = cv ? cv.clientWidth : 480
    const H = 320
    const pad = 28
    const pts: Pt[] = []
    for (let i = 0; i < n; i++) {
      pts.push([pad + Math.random() * (W - 2 * pad), pad + Math.random() * (H - 2 * pad)])
    }
    setPoints(pts)
  }, [])

  useEffect(() => {
    if (points.length === 0) scatter(12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    const tris = bowyerWatson(points, W, H)

    if (showCircles) {
      ctx.lineWidth = 1
      for (const t of tris) {
        const c = circumcircle(t[0], t[1], t[2])
        if (!c || c.r > Math.max(W, H)) continue
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.16)'
        ctx.beginPath()
        ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    ctx.strokeStyle = 'rgba(150, 200, 230, 0.85)'
    ctx.lineWidth = 1.3
    for (const t of tris) {
      ctx.beginPath()
      ctx.moveTo(t[0][0], t[0][1])
      ctx.lineTo(t[1][0], t[1][1])
      ctx.lineTo(t[2][0], t[2][1])
      ctx.closePath()
      ctx.stroke()
    }

    ctx.fillStyle = '#f0b429'
    for (const p of points) {
      ctx.beginPath()
      ctx.arc(p[0], p[1], 3.2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = 'rgba(180, 200, 220, 0.8)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText(`points ${points.length}   triangles ${tris.length}`, 10, 18)
    ctx.fillText('click to add a vertex', 10, H - 12)
  }, [points, showCircles])

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPoints((prev) => [...prev, [x, y]])
  }

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
      <canvas
        ref={canvasRef}
        onClick={onClick}
        style={{ width: '100%', height: 320, display: 'block', borderRadius: 6, cursor: 'crosshair' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => scatter(12)} style={btn}>scatter 12</button>
        <button onClick={() => scatter(40)} style={btn}>scatter 40</button>
        <button onClick={() => setPoints([])} style={btn}>clear</button>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showCircles}
            onChange={(e) => setShowCircles(e.target.checked)}
          />
          show circumcircles
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Each thin cyan ring is the circumcircle of one triangle. In a valid
        Delaunay mesh no vertex (yellow dot) ever sits inside another triangle&apos;s
        ring — that is the empty-circumcircle property. Add points and watch the
        mesh repair itself.
      </p>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 12,
}
