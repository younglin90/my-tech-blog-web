'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Pt = { x: number; y: number }

// In-circle predicate: is d strictly inside the circumcircle of (a, b, c)?
// Uses the classic 3x3 determinant with (a,b,c) in counter-clockwise order.
function inCircle(a: Pt, b: Pt, c: Pt, d: Pt): number {
  const ax = a.x - d.x, ay = a.y - d.y
  const bx = b.x - d.x, by = b.y - d.y
  const cx = c.x - d.x, cy = c.y - d.y
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)
  return det // >0 → d inside (when a,b,c are CCW)
}

// Signed area to enforce CCW ordering before the in-circle test.
function ccw(a: Pt, b: Pt, c: Pt): boolean {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0
}

function circum(a: Pt, b: Pt, c: Pt) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(d) < 1e-9) return null
  const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, c2 = c.x * c.x + c.y * c.y
  const cx = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d
  const cy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d
  return { cx, cy, r: Math.hypot(a.x - cx, a.y - cy) }
}

export function DelaunayEdgeFlip() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const W = 520, H = 360
  // Convex quad: L(left) B(bottom) R(right) T(top). Drag T up/down to flip.
  const [pts, setPts] = useState<Record<string, Pt>>({
    L: { x: 90, y: 180 },
    R: { x: 430, y: 180 },
    B: { x: 260, y: 300 },
    T: { x: 260, y: 90 },
  })
  const [drag, setDrag] = useState<string | null>(null)

  // Delaunay diagonal choice. Diagonal LR splits into (L,B,R)+(L,R,T);
  // diagonal BT splits into (L,B,T)+(B,R,T). Pick the empty-circumcircle option.
  const chooseDiagonal = (P: Record<string, Pt>): 'LR' | 'BT' => {
    let a = P.L, b = P.B, c = P.R
    if (!ccw(a, b, c)) { const t = a; a = c; c = t }
    // If opposite vertex T is inside circumcircle of (L,B,R), edge LR is illegal → flip to BT.
    return inCircle(a, b, c, P.T) > 1e-6 ? 'BT' : 'LR'
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, W, H)

    const diag = chooseDiagonal(pts)
    const tris: [Pt, Pt, Pt][] =
      diag === 'LR'
        ? [[pts.L, pts.B, pts.R], [pts.L, pts.R, pts.T]]
        : [[pts.L, pts.B, pts.T], [pts.B, pts.R, pts.T]]

    // Circumcircles of both triangles — they stay empty in the Delaunay choice.
    tris.forEach((t) => {
      const c = circum(t[0], t[1], t[2])
      if (!c) return
      ctx.beginPath()
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(34,211,238,0.22)'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Filled triangles.
    ctx.fillStyle = 'rgba(34,211,238,0.08)'
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 1.6
    tris.forEach((t) => {
      ctx.beginPath()
      ctx.moveTo(t[0].x, t[0].y)
      ctx.lineTo(t[1].x, t[1].y)
      ctx.lineTo(t[2].x, t[2].y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    })

    // Highlight the active diagonal.
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    if (diag === 'LR') { ctx.moveTo(pts.L.x, pts.L.y); ctx.lineTo(pts.R.x, pts.R.y) }
    else { ctx.moveTo(pts.B.x, pts.B.y); ctx.lineTo(pts.T.x, pts.T.y) }
    ctx.stroke()

    // Vertices with labels.
    Object.entries(pts).forEach(([k, p]) => {
      ctx.fillStyle = k === 'T' ? '#f472b6' : '#fbbf24'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(226,232,240,0.9)'
      ctx.font = '13px monospace'
      ctx.fillText(k, p.x + 9, p.y - 9)
    })

    ctx.fillStyle = 'rgba(226,232,240,0.85)'
    ctx.font = '13px monospace'
    ctx.fillText(`diagonal = ${diag}`, 12, 24)
    ctx.fillStyle = 'rgba(244,114,182,0.9)'
    ctx.fillText('drag the pink vertex T', 12, H - 14)
  }, [pts])

  useEffect(() => { draw() }, [draw])

  const pos = (clientX: number, clientY: number): Pt => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H }
  }

  const onDown = (clientX: number, clientY: number) => {
    const m = pos(clientX, clientY)
    let best: string | null = null
    let bd = 18
    Object.entries(pts).forEach(([k, p]) => {
      const d = Math.hypot(p.x - m.x, p.y - m.y)
      if (d < bd) { bd = d; best = k }
    })
    setDrag(best)
  }

  const onMove = (clientX: number, clientY: number) => {
    if (!drag) return
    const m = pos(clientX, clientY)
    setPts((prev) => ({
      ...prev,
      [drag]: { x: Math.max(20, Math.min(W - 20, m.x)), y: Math.max(20, Math.min(H - 20, m.y)) },
    }))
  }

  return (
    <div style={{ margin: '1.5rem 0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, padding: 14, background: 'rgba(15,23,42,0.35)' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onMouseDown={(e) => onDown(e.clientX, e.clientY)}
        onMouseMove={(e) => onMove(e.clientX, e.clientY)}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
        onTouchStart={(e) => { const t = e.touches[0]; onDown(t.clientX, t.clientY) }}
        onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY) }}
        onTouchEnd={() => setDrag(null)}
        style={{ width: '100%', maxWidth: W, borderRadius: 8, cursor: 'grab', display: 'block', touchAction: 'none' }}
      />
      <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.85)', marginTop: 8 }}>
        Drag vertex T through the shared edge. When T enters the circumcircle of the lower triangle,
        the diagonal snaps from LR to BT &mdash; a single Lawson flip restoring the empty-circumcircle rule.
      </p>
    </div>
  )
}

export default DelaunayEdgeFlip
