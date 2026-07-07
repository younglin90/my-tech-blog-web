'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// A point in the plane.
type Pt = { x: number; y: number }
// A triangle as three vertex indices into the working point array.
type Tri = [number, number, number]

// Circumcircle of triangle (a, b, c): returns center and squared radius.
function circumcircle(a: Pt, b: Pt, c: Pt): { cx: number; cy: number; r2: number } | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(d) < 1e-9) return null // collinear
  const a2 = a.x * a.x + a.y * a.y
  const b2 = b.x * b.x + b.y * b.y
  const c2 = c.x * c.x + c.y * c.y
  const cx = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d
  const cy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d
  const r2 = (a.x - cx) ** 2 + (a.y - cy) ** 2
  return { cx, cy, r2 }
}

// Bowyer–Watson incremental Delaunay triangulation, rebuilt from scratch.
// Returns final triangles plus the circumcircles of the "current" triangulation.
function bowyerWatson(input: Pt[]): { tris: Tri[]; pts: Pt[] } {
  // Super-triangle large enough to contain every input point.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of input) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
  }
  const dx = maxX - minX || 1
  const dy = maxY - minY || 1
  const dmax = Math.max(dx, dy) * 20
  const midx = (minX + maxX) / 2
  const midy = (minY + maxY) / 2
  const pts: Pt[] = [
    { x: midx - dmax, y: midy - dmax },
    { x: midx + dmax, y: midy - dmax },
    { x: midx, y: midy + dmax },
  ]
  const superIdx = [0, 1, 2]
  let tris: Tri[] = [[0, 1, 2]]

  input.forEach((p) => {
    const pi = pts.length
    pts.push(p)
    const bad: number[] = []
    tris.forEach((t, ti) => {
      const cc = circumcircle(pts[t[0]], pts[t[1]], pts[t[2]])
      if (cc && (p.x - cc.cx) ** 2 + (p.y - cc.cy) ** 2 < cc.r2 - 1e-9) bad.push(ti)
    })
    // Collect boundary edges of the cavity (edges not shared by two bad triangles).
    const edges: [number, number][] = []
    bad.forEach((ti) => {
      const t = tris[ti]
      const es: [number, number][] = [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]
      es.forEach((e) => {
        let shared = false
        bad.forEach((tj) => {
          if (tj === ti) return
          const t2 = tris[tj]
          const has = (a: number, b: number) =>
            (t2[0] === a || t2[1] === a || t2[2] === a) &&
            (t2[0] === b || t2[1] === b || t2[2] === b)
          if (has(e[0], e[1])) shared = true
        })
        if (!shared) edges.push(e)
      })
    })
    const badSet = new Set(bad)
    tris = tris.filter((_, ti) => !badSet.has(ti))
    edges.forEach((e) => tris.push([e[0], e[1], pi]))
  })

  // Drop triangles that still touch a super-triangle vertex.
  tris = tris.filter((t) => !t.some((i) => superIdx.includes(i)))
  return { tris, pts }
}

export function BowyerWatsonDelaunay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [points, setPoints] = useState<Pt[]>([])
  const [showCircles, setShowCircles] = useState(false)
  const W = 560, H = 380, PAD = 30

  // Seed with a handful of scattered points on mount (deterministic pseudo-random).
  useEffect(() => {
    const seed: Pt[] = []
    let s = 7
    const rnd = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
    for (let i = 0; i < 8; i++) {
      seed.push({ x: PAD + rnd() * (W - 2 * PAD), y: PAD + rnd() * (H - 2 * PAD) })
    }
    setPoints(seed)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, W, H)

    if (points.length >= 3) {
      const { tris, pts } = bowyerWatson(points)

      if (showCircles) {
        ctx.lineWidth = 1
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.16)'
        tris.forEach((t) => {
          const cc = circumcircle(pts[t[0]], pts[t[1]], pts[t[2]])
          if (!cc) return
          ctx.beginPath()
          ctx.arc(cc.cx, cc.cy, Math.sqrt(cc.r2), 0, Math.PI * 2)
          ctx.stroke()
        })
      }

      ctx.lineWidth = 1.4
      ctx.strokeStyle = '#22d3ee'
      ctx.fillStyle = 'rgba(34, 211, 238, 0.06)'
      tris.forEach((t) => {
        ctx.beginPath()
        ctx.moveTo(pts[t[0]].x, pts[t[0]].y)
        ctx.lineTo(pts[t[1]].x, pts[t[1]].y)
        ctx.lineTo(pts[t[2]].x, pts[t[2]].y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      })
    }

    // Vertices.
    ctx.fillStyle = '#fbbf24'
    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)'
    ctx.font = '12px monospace'
    ctx.fillText(`points: ${points.length}`, 10, 20)
  }, [points, showCircles])

  useEffect(() => { draw() }, [draw])

  const addPointAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * W
    const y = ((clientY - rect.top) / rect.height) * H
    if (x < 4 || x > W - 4 || y < 4 || y > H - 4) return
    setPoints((prev) => [...prev, { x, y }])
  }

  const addRandom = () => {
    setPoints((prev) => {
      // Nudge by index count so successive clicks land in different spots.
      const k = prev.length + 1
      const x = PAD + ((k * 97) % (W - 2 * PAD))
      const y = PAD + ((k * 53 + 40) % (H - 2 * PAD))
      return [...prev, { x, y }]
    })
  }

  return (
    <div style={{ margin: '1.5rem 0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, padding: 14, background: 'rgba(15,23,42,0.35)' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        <button onClick={addRandom} style={btn}>+ Add point</button>
        <button onClick={() => setPoints([])} style={btn}>Clear</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#cbd5e1', cursor: 'pointer' }}>
          <input type="checkbox" checked={showCircles} onChange={(e) => setShowCircles(e.target.checked)} />
          Show circumcircles
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={(e) => addPointAt(e.clientX, e.clientY)}
        style={{ width: '100%', maxWidth: W, borderRadius: 8, cursor: 'crosshair', display: 'block' }}
      />
      <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.85)', marginTop: 8 }}>
        Click on the canvas to insert a point. Each insertion rebuilds the Delaunay triangulation via Bowyer&ndash;Watson.
        Toggle the circumcircles: every one stays empty of other vertices &mdash; that is the Delaunay property.
      </p>
    </div>
  )
}

const btn: React.CSSProperties = {
  background: 'rgba(34,211,238,0.12)',
  color: '#22d3ee',
  border: '1px solid rgba(34,211,238,0.35)',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 13,
  cursor: 'pointer',
}

export default BowyerWatsonDelaunay
