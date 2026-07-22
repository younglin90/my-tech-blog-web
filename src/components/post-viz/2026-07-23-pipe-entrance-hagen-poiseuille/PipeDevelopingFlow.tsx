'use client'

import { useEffect, useRef, useState } from 'react'

// Entrance (developing) region of laminar pipe flow.
// Inlet profile is nearly flat; wall boundary layers grow, merge, and the
// profile relaxes into the Hagen-Poiseuille parabola. The hydrodynamic
// entrance length scales as L_h / D ~ 0.05 * Re.

export function PipeDevelopingFlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [re, setRe] = useState(800)
  const [running, setRunning] = useState(true)

  const reRef = useRef(re)
  reRef.current = re
  const runRef = useRef(running)
  runRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 760
    const H = 220
    canvas.width = W
    canvas.height = H

    const padL = 40
    const padR = 20
    const cy = H / 2
    const Dpx = 110 // pipe diameter in pixels
    const R = Dpx / 2
    const viewLenD = 40 // pipe length shown, in diameters
    const pxPerD = (W - padL - padR) / viewLenD

    // seed tracer particles
    const N = 320
    const parts = Array.from({ length: N }, (_, i) => ({
      x: padL + Math.random() * (W - padL - padR),
      // y in [-R, R] with slight bias toward center packing
      y: (Math.random() * 2 - 1) * R * 0.94,
    }))

    // velocity (normalized by mean) at wall-distance-fraction, at station fraction s
    const uNorm = (y: number, s: number) => {
      const t = Math.min(s, 1)
      const par = 2 * (1 - (y / R) * (y / R))
      return (1 - t) * 1 + t * par
    }

    let raf = 0
    let last = performance.now()

    const draw = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now

      const Re = reRef.current
      const LhD = 0.05 * Re // entrance length in diameters
      const LhPx = padL + LhD * pxPerD

      ctx.clearRect(0, 0, W, H)

      // pipe walls
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(padL, cy - R)
      ctx.lineTo(W - padR, cy - R)
      ctx.moveTo(padL, cy + R)
      ctx.lineTo(W - padR, cy + R)
      ctx.stroke()

      // developed marker
      if (LhPx < W - padR) {
        ctx.strokeStyle = '#f59e0b'
        ctx.setLineDash([6, 5])
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(LhPx, cy - R - 12)
        ctx.lineTo(LhPx, cy + R + 12)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#f59e0b'
        ctx.font = '12px ui-sans-serif, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('fully developed', LhPx, cy + R + 26)
      } else {
        ctx.fillStyle = '#f59e0b'
        ctx.font = '12px ui-sans-serif, system-ui'
        ctx.textAlign = 'right'
        ctx.fillText('entrance longer than view →', W - padR, cy - R - 8)
      }

      // velocity profiles at stations
      const stations = 8
      ctx.strokeStyle = 'rgba(56,189,248,0.9)'
      ctx.fillStyle = 'rgba(56,189,248,0.12)'
      ctx.lineWidth = 2
      for (let k = 1; k <= stations; k++) {
        const x0 = padL + (k / (stations + 1)) * (W - padL - padR)
        const s = LhD > 0 ? ((x0 - padL) / pxPerD) / LhD : 2
        ctx.beginPath()
        ctx.moveTo(x0, cy - R)
        for (let iy = -20; iy <= 20; iy++) {
          const y = (iy / 20) * R
          const u = uNorm(y, s)
          ctx.lineTo(x0 + u * 13, cy + y)
        }
        ctx.lineTo(x0, cy + R)
        ctx.stroke()
      }

      // tracer particles
      const speedScale = 0.06 * dt
      ctx.fillStyle = '#e0f2fe'
      for (const p of parts) {
        const s = LhD > 0 ? ((p.x - padL) / pxPerD) / LhD : 2
        const u = uNorm(p.y, s)
        if (runRef.current) {
          p.x += u * pxPerD * speedScale
          if (p.x > W - padR) {
            p.x = padL
            p.y = (Math.random() * 2 - 1) * R * 0.94
          }
        }
        ctx.globalAlpha = 0.75
        ctx.beginPath()
        ctx.arc(p.x, cy + p.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // labels
      ctx.fillStyle = '#64748b'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('flat inlet', padL + 2, cy - R - 8)
      ctx.textAlign = 'right'
      ctx.fillText(`L_h / D ≈ ${LhD.toFixed(1)}`, W - padR, H - 6)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: 760, border: '1px solid #334155', borderRadius: 8, background: '#0f172a' }}
      />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          Reynolds Re<sub>D</sub>
          <input
            type="range"
            min={100}
            max={2200}
            step={50}
            value={re}
            onChange={(e) => setRe(Number(e.target.value))}
          />
          <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 44 }}>{re}</span>
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  )
}
