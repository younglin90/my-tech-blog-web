'use client'

import { useEffect, useRef, useState } from 'react'

// World box: x in [0,10], y in [0,7]. The point P sweeps P0 -> P1 over t in [0,1].
// The wall (segment A-B) optionally drifts vertically by `drift` over the same step.
// We compare a DISCRETE endpoint test (t=0 and t=1 only) against the CONTINUOUS
// time-of-impact found by densely sampling the swept geometry.

const W = 480
const H = 336
const WORLD_X = 10
const WORLD_Y = 7

function toPx(x: number, y: number): [number, number] {
  return [(x / WORLD_X) * W, H - (y / WORLD_Y) * H]
}

// Closest distance from point p to segment (a,b) in world units.
function pointSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let s = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  s = Math.max(0, Math.min(1, s))
  const cx = ax + s * dx
  const cy = ay + s * dy
  return Math.hypot(px - cx, py - cy)
}

export function MovingPointSegmentCCD2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const tRef = useRef<number>(0)

  const [speed, setSpeed] = useState(8.0) // horizontal travel of the point
  const [wallX, setWallX] = useState(5.0)
  const [drift, setDrift] = useState(0.0) // vertical wall drift over the step
  const [radius, setRadius] = useState(0.18) // collision radius (contact distance)
  const [playing, setPlaying] = useState(true)

  // Endpoints of the moving point trajectory.
  const P0: [number, number] = [0.7, 3.5]
  const P1: [number, number] = [0.7 + speed, 3.5]
  // Static-frame wall endpoints (before drift).
  const A0: [number, number] = [wallX, 1.0]
  const B0: [number, number] = [wallX, 6.0]

  function pAt(t: number): [number, number] {
    return [P0[0] + t * (P1[0] - P0[0]), P0[1] + t * (P1[1] - P0[1])]
  }
  function wallAt(t: number): { a: [number, number]; b: [number, number] } {
    return {
      a: [A0[0], A0[1] + t * drift],
      b: [B0[0], B0[1] + t * drift],
    }
  }

  // Continuous time-of-impact by dense sampling (contact when gap < radius).
  function continuousTOI(): number | null {
    const N = 600
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const [px, py] = pAt(t)
      const { a, b } = wallAt(t)
      if (pointSegDist(px, py, a[0], a[1], b[0], b[1]) <= radius) return t
    }
    return null
  }

  // Discrete test: only the two endpoints are checked.
  function discreteHit(): boolean {
    for (const t of [0, 1]) {
      const [px, py] = pAt(t)
      const { a, b } = wallAt(t)
      if (pointSegDist(px, py, a[0], a[1], b[0], b[1]) <= radius) return true
    }
    return false
  }

  const toi = continuousTOI()
  const discrete = discreteHit()

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1727'
      ctx.fillRect(0, 0, W, H)

      // grid
      ctx.strokeStyle = 'rgba(120,150,180,0.12)'
      ctx.lineWidth = 1
      for (let gx = 1; gx < WORLD_X; gx++) {
        const [sx] = toPx(gx, 0)
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke()
      }
      for (let gy = 1; gy < WORLD_Y; gy++) {
        const [, sy] = toPx(0, gy)
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke()
      }

      const t = tRef.current

      // swept path of the point (the trajectory the discrete test ignores)
      ctx.strokeStyle = 'rgba(34,211,238,0.35)'
      ctx.setLineDash([6, 6])
      ctx.lineWidth = 1.5
      const [s0x, s0y] = toPx(P0[0], P0[1])
      const [s1x, s1y] = toPx(P1[0], P1[1])
      ctx.beginPath(); ctx.moveTo(s0x, s0y); ctx.lineTo(s1x, s1y); ctx.stroke()
      ctx.setLineDash([])

      // wall at current t
      const { a, b } = wallAt(t)
      const [ax, ay] = toPx(a[0], a[1])
      const [bx, by] = toPx(b[0], b[1])
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()

      // ghost endpoints of the point (discrete samples)
      for (const te of [0, 1]) {
        const [gx, gy] = pAt(te)
        const [px, py] = toPx(gx, gy)
        ctx.fillStyle = 'rgba(148,163,184,0.5)'
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill()
      }

      // time-of-impact marker
      if (toi !== null) {
        const [gx, gy] = pAt(toi)
        const [px, py] = toPx(gx, gy)
        ctx.strokeStyle = '#f43f5e'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.stroke()
      }

      // moving point at current t
      const [cgx, cgy] = pAt(t)
      const [cpx, cpy] = toPx(cgx, cgy)
      const collidingNow = toi !== null && t >= toi
      ctx.fillStyle = collidingNow ? '#f43f5e' : '#22d3ee'
      ctx.beginPath(); ctx.arc(cpx, cpy, 7, 0, Math.PI * 2); ctx.fill()

      // label
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '13px monospace'
      ctx.fillText(`t = ${t.toFixed(2)}`, 12, 22)
    }

    const loop = () => {
      if (playing) {
        tRef.current += 0.006
        if (tRef.current > 1) tRef.current = 0
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [speed, wallX, drift, radius, playing, toi])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
          <span>point travel: {speed.toFixed(1)}</span>
          <input type="range" min={1} max={9} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
          <span>wall x: {wallX.toFixed(1)}</span>
          <input type="range" min={2} max={8} step={0.1} value={wallX} onChange={(e) => setWallX(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
          <span>wall drift: {drift.toFixed(1)}</span>
          <input type="range" min={-3} max={3} step={0.1} value={drift} onChange={(e) => setDrift(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
          <span>contact radius: {radius.toFixed(2)}</span>
          <input type="range" min={0.05} max={0.6} step={0.01} value={radius} onChange={(e) => setRadius(+e.target.value)} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}
        >
          {playing ? '⏸ pause' : '▶ play'}
        </button>
        <span style={{ fontSize: 13, color: discrete ? '#f43f5e' : '#94a3b8' }}>
          discrete (endpoints only): {discrete ? 'HIT' : 'MISS'}
        </span>
        <span style={{ fontSize: 13, color: toi !== null ? '#22d3ee' : '#94a3b8' }}>
          continuous TOI: {toi !== null ? `t = ${toi.toFixed(3)}` : 'no collision'}
        </span>
      </div>
    </div>
  )
}
