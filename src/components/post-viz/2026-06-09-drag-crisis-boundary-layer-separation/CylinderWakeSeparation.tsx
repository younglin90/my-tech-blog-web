'use client'

import { useEffect, useRef, useState } from 'react'

// Stylized flow past a circular cylinder. Particles advect in the
// potential-flow field outside the cylinder; behind it they enter a
// low-momentum wake. Toggling "turbulent boundary layer" pushes the
// separation points further back, which narrows the wake and drops the
// pressure drag. This is the same mechanism behind the drag crisis.

interface P { x: number; y: number }

export function CylinderWakeSeparation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const partsRef = useRef<P[]>([])
  const rafRef = useRef<number>(0)
  const [turbulent, setTurbulent] = useState(false)
  const turbRef = useRef(turbulent)
  turbRef.current = turbulent

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W * 0.4
    const cy = H * 0.5
    const R = 42
    const U = 1.6

    if (partsRef.current.length === 0) {
      partsRef.current = Array.from({ length: 320 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
      }))
    }

    const respawn = (p: P) => {
      p.x = -5
      p.y = Math.random() * H
    }

    const tick = () => {
      const turb = turbRef.current
      // separation angle from front stagnation: turbulent stays attached longer
      const sepDeg = turb ? 118 : 82
      // wake geometry: half-width at cylinder + downstream spread
      const wakeBase = turb ? R * 0.55 : R * 1.05
      const spread = turb ? 0.16 : 0.34

      // fade trail
      ctx.fillStyle = 'rgba(8,17,31,0.32)'
      ctx.fillRect(0, 0, W, H)

      // wake shading
      const wakeMaxW = wakeBase + (W - cx) * spread
      ctx.fillStyle = turb ? 'rgba(244,114,182,0.10)' : 'rgba(251,191,36,0.10)'
      ctx.beginPath()
      ctx.moveTo(cx, cy - wakeBase)
      ctx.lineTo(W, cy - wakeMaxW)
      ctx.lineTo(W, cy + wakeMaxW)
      ctx.lineTo(cx, cy + wakeBase)
      ctx.closePath()
      ctx.fill()

      for (const p of partsRef.current) {
        const dx = p.x - cx
        const dy = p.y - cy
        const r = Math.hypot(dx, dy)

        if (r < R) { respawn(p); continue }

        let vx: number
        let vy: number
        const inWake = dx > 0 && Math.abs(dy) < wakeBase + dx * spread

        if (inWake) {
          // low-momentum recirculating wake
          vx = 0.18 * U
          vy = 0.6 * Math.sin(p.x * 0.05 + performance.now() * 0.004) * (turb ? 0.4 : 1)
        } else {
          // potential flow around cylinder
          const th = Math.atan2(dy, dx)
          const rr = (R * R) / (r * r)
          const ur = U * (1 - rr) * Math.cos(th)
          const ut = -U * (1 + rr) * Math.sin(th)
          vx = ur * Math.cos(th) - ut * Math.sin(th)
          vy = ur * Math.sin(th) + ut * Math.cos(th)
        }

        const speed = Math.hypot(vx, vy)
        p.x += vx
        p.y += vy
        if (p.x > W + 5 || p.y < -5 || p.y > H + 5) respawn(p)

        // color by speed (cyan fast -> slate slow)
        const s = Math.min(1, speed / (2 * U))
        ctx.fillStyle = `rgb(${Math.round(60 + 80 * (1 - s))}, ${Math.round(120 + 90 * s)}, ${Math.round(160 + 50 * s)})`
        ctx.fillRect(p.x, p.y, 2, 2)
      }

      // cylinder
      ctx.fillStyle = '#0f1f33'
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // separation points (measured from front stagnation, upstream side)
      const sepRad = (sepDeg * Math.PI) / 180
      for (const sgn of [-1, 1]) {
        const a = Math.PI - sgn * sepRad // from +x axis
        const sxp = cx + R * Math.cos(a)
        const syp = cy + R * Math.sin(a)
        ctx.fillStyle = turb ? '#f472b6' : '#fbbf24'
        ctx.beginPath()
        ctx.arc(sxp, syp, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // labels
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px monospace'
      ctx.fillText(turb ? 'turbulent BL' : 'laminar BL', 10, 18)
      ctx.fillText(`separation ${sepDeg}° from front`, 10, 34)
      const relDrag = turb ? 0.42 : 1.0
      ctx.fillStyle = turb ? '#f472b6' : '#fbbf24'
      ctx.fillText(`relative drag ~ ${relDrag.toFixed(2)}`, 10, 50)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#08111f' }}
      />
      <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={() => setTurbulent((t) => !t)}
          style={{
            padding: '0.45rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            border: '1px solid var(--border)',
            background: turbulent ? '#f472b6' : 'var(--bg)',
            color: turbulent ? '#08111f' : 'var(--text)',
          }}
        >
          {turbulent ? 'turbulent boundary layer' : 'laminar boundary layer'}
        </button>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Toggle the boundary layer. The turbulent one carries momentum closer to the wall, separates later, and leaves a
          thinner wake — the shaded region behind the cylinder shrinks and the pressure drag drops.
        </p>
      </div>
    </div>
  )
}
