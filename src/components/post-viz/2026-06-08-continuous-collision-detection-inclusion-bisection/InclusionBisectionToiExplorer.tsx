'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Visualizes the inclusion-based bisection of Snyder/Redon over the (t,s)
// parameter square [0,1]^2 for a 2D point-vs-segment CCD query.
// Gap function  F(t,s) = P(t) - [A(t) + s (B(t) - A(t))].
// A box is kept iff the axis-aligned bounding box of its 4 corner F-values
// contains the origin (the tightest AABB inclusion for an affine/bilinear F).

const SZ = 340 // canvas size (square)
const PAD = 28

type Box = { t0: number; t1: number; s0: number; s1: number; solved: boolean }

export function InclusionBisectionToiExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [travel, setTravel] = useState(8.0)
  const [drift, setDrift] = useState(1.5)
  const [delta, setDelta] = useState(0.06)
  const [boxes, setBoxes] = useState<Box[]>([{ t0: 0, t1: 1, s0: 0, s1: 1, solved: false }])
  const [level, setLevel] = useState(0)
  const [auto, setAuto] = useState(false)

  // F(t,s): wall at x=5, point sweeps in x; wall may drift in y.
  const F = useCallback(
    (t: number, s: number): [number, number] => {
      const fx = 0.7 + t * travel - 5
      const fy = 2.5 - t * drift - 5 * s
      return [fx, fy]
    },
    [travel, drift]
  )

  const originInBox = useCallback(
    (b: Box): boolean => {
      const corners: [number, number][] = [
        F(b.t0, b.s0), F(b.t0, b.s1), F(b.t1, b.s0), F(b.t1, b.s1),
      ]
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity
      for (const [fx, fy] of corners) {
        if (fx < minx) minx = fx
        if (fx > maxx) maxx = fx
        if (fy < miny) miny = fy
        if (fy > maxy) maxy = fy
      }
      return minx <= 0 && maxx >= 0 && miny <= 0 && maxy >= 0
    },
    [F]
  )

  const reset = useCallback(() => {
    setBoxes([{ t0: 0, t1: 1, s0: 0, s1: 1, solved: false }])
    setLevel(0)
  }, [])

  useEffect(() => { reset() }, [travel, drift, delta, reset])

  const step = useCallback(() => {
    setBoxes((prev) => {
      const next: Box[] = []
      for (const b of prev) {
        if (b.solved) { next.push(b); continue }
        const w = Math.max(b.t1 - b.t0, b.s1 - b.s0)
        if (w < delta) { next.push({ ...b, solved: true }); continue }
        // subdivide the wider dimension
        let children: Box[]
        if (b.t1 - b.t0 >= b.s1 - b.s0) {
          const tm = 0.5 * (b.t0 + b.t1)
          children = [
            { t0: b.t0, t1: tm, s0: b.s0, s1: b.s1, solved: false },
            { t0: tm, t1: b.t1, s0: b.s0, s1: b.s1, solved: false },
          ]
        } else {
          const sm = 0.5 * (b.s0 + b.s1)
          children = [
            { t0: b.t0, t1: b.t1, s0: b.s0, s1: sm, solved: false },
            { t0: b.t0, t1: b.t1, s0: sm, s1: b.s1, solved: false },
          ]
        }
        for (const c of children) if (originInBox(c)) next.push(c)
      }
      return next
    })
    setLevel((l) => l + 1)
  }, [delta, originInBox])

  const allSolved = boxes.length > 0 && boxes.every((b) => b.solved)
  const toi = boxes.length ? Math.min(...boxes.map((b) => b.t0)) : null

  useEffect(() => {
    if (!auto || allSolved) return
    const id = setTimeout(step, 450)
    return () => clearTimeout(id)
  }, [auto, allSolved, step, boxes])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, SZ, SZ)
    ctx.fillStyle = '#0b1727'
    ctx.fillRect(0, 0, SZ, SZ)

    const span = SZ - 2 * PAD
    const tx = (t: number) => PAD + t * span
    const sy = (s: number) => SZ - PAD - s * span

    // outer square
    ctx.strokeStyle = 'rgba(120,150,180,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(tx(0), sy(1), span, span)

    // surviving boxes
    for (const b of boxes) {
      const x = tx(b.t0)
      const y = sy(b.s1)
      const w = (b.t1 - b.t0) * span
      const h = (b.s1 - b.s0) * span
      if (b.solved) {
        ctx.fillStyle = 'rgba(244,63,94,0.55)'
        ctx.fillRect(x, y, w, h)
      } else {
        ctx.fillStyle = 'rgba(34,211,238,0.16)'
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = 'rgba(34,211,238,0.8)'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
      }
    }

    // axes labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px monospace'
    ctx.fillText('t (time) →', PAD, SZ - 8)
    ctx.save()
    ctx.translate(12, SZ - PAD)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('s (segment param) →', 0, 0)
    ctx.restore()
  }, [boxes])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <canvas
          ref={canvasRef}
          width={SZ}
          height={SZ}
          style={{ width: SZ, maxWidth: '100%', height: 'auto', borderRadius: 8, background: '#0b1727' }}
        />
        <div style={{ flex: '1 1 180px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>point travel: {travel.toFixed(1)}</span>
            <input type="range" min={3} max={9} step={0.1} value={travel} onChange={(e) => setTravel(+e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>wall drift: {drift.toFixed(1)}</span>
            <input type="range" min={-3} max={3} step={0.1} value={drift} onChange={(e) => setDrift(+e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>tolerance δ: {delta.toFixed(3)}</span>
            <input type="range" min={0.01} max={0.2} step={0.005} value={delta} onChange={(e) => setDelta(+e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={step} disabled={allSolved} style={btn}>step ▸</button>
            <button onClick={() => setAuto((a) => !a)} style={btn}>{auto ? '⏸ auto' : '▶ auto'}</button>
            <button onClick={reset} style={btn}>reset</button>
          </div>
          <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
            level: <b>{level}</b><br />
            active boxes: <b>{boxes.length}</b><br />
            {boxes.length === 0
              ? <span style={{ color: '#94a3b8' }}>no collision (all pruned)</span>
              : <span style={{ color: allSolved ? '#f43f5e' : '#22d3ee' }}>
                  earliest TOI ≈ {toi!.toFixed(3)}{allSolved ? ' (converged)' : ''}
                </span>}
          </div>
        </div>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 13,
}
