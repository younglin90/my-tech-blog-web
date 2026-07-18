'use client'

import { useEffect, useRef, useState } from 'react'

// Dynamic surface tension: an ellipse released in gas oscillates between
// ellipse and circle, trading surface (potential) energy for kinetic energy and
// back, forever in ideal flow. The small-oscillation period follows the
// modified Rayleigh formula for mode n=2:
//
//   omega^2 = (n^3 - n) * sigma / ((rho_l + rho_g) * R^3),  omega = 2*pi / T.
//
// A perfect scheme keeps the amplitude constant; a diffusive scheme damps it.
// The "numerical damping" slider mimics that scheme dissipation -- exactly the
// effect Tallois et al. (2025) fight with a low-Mach correction so the drop
// keeps oscillating over many periods instead of quickly relaxing to a circle.

export function EllipsoidalDropOscillation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const tRef = useRef(0)

  const [sigma, setSigma] = useState(340) // N/m (paper's ellipsoid case)
  const [rhoL, setRhoL] = useState(100) // kg/m^3 liquid
  const [damp, setDamp] = useState(0.4) // numerical damping, 0..1
  const [running, setRunning] = useState(true)

  const R = 0.15 // mean radius (m)
  const rhoG = 1
  const n = 2
  const omega = Math.sqrt(((n ** 3 - n) * sigma) / ((rhoL + rhoG) * R ** 3))
  const T = (2 * Math.PI) / omega // seconds
  const lambda = damp * 1.4 // decay rate

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const e0 = 0.42 // initial eccentricity amplitude

    const render = () => {
      const dt = 0.016
      if (running) tRef.current += dt
      const t = tRef.current
      // eccentricity oscillates at omega, damped; map animation seconds to
      // several visible periods regardless of physical T.
      const phase = (t / 0.9) * 2 * Math.PI
      const env = Math.exp(-lambda * (t / 0.9) / (2 * Math.PI))
      const e = e0 * env * Math.cos(phase)
      // area-preserving semi-axes
      const Rpx = 92
      const a = Rpx * Math.sqrt(1 + e)
      const b = Rpx / Math.sqrt(1 + e)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0a0a0d'
      ctx.fillRect(0, 0, W, H)

      // droplet
      const grd = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(a, b))
      grd.addColorStop(0, '#5fd0ff')
      grd.addColorStop(1, '#2a6ea8')
      ctx.beginPath()
      ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI)
      ctx.fillStyle = grd
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 2
      ctx.stroke()

      // rest circle reference
      ctx.beginPath()
      ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])

      // energy bars: surface(potential) ~ e^2, kinetic ~ (de/dt)^2
      const ePot = (e * e) / (e0 * e0)
      const de = -e0 * env * Math.sin(phase)
      const eKin = (de * de) / (e0 * e0)
      const barX = W - 46
      const drawBar = (x: number, val: number, col: string, label: string) => {
        const h = 150 * Math.min(1, val)
        ctx.fillStyle = '#17171d'
        ctx.fillRect(x, H - 24 - 150, 16, 150)
        ctx.fillStyle = col
        ctx.fillRect(x, H - 24 - h, 16, h)
        ctx.fillStyle = '#c8c8cc'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(label, x + 8, H - 8)
      }
      drawBar(barX, eKin, '#ffb454', 'KE')
      drawBar(barX + 24, ePot, '#5ad19a', 'surf')

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [sigma, rhoL, damp, running])

  return (
    <div
      style={{
        border: '1px solid #2a2a33',
        borderRadius: 12,
        padding: 16,
        background: '#101014',
        margin: '1.5rem 0',
        color: '#e8e8ea',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={280}
          style={{ width: 300, height: 280, borderRadius: 8, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={lab}>
            surface tension σ: {sigma} N/m
            <input type="range" min={40} max={600} step={10} value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <label style={lab}>
            liquid density ρ_l: {rhoL} kg/m³
            <input type="range" min={20} max={1000} step={10} value={rhoL}
              onChange={(e) => setRhoL(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <label style={lab}>
            numerical damping: {damp.toFixed(2)} {damp === 0 && '— ideal (no diffusion)'}
            <input type="range" min={0} max={1} step={0.05} value={damp}
              onChange={(e) => setDamp(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <div style={{ fontSize: 13, lineHeight: 1.7, background: '#17171d', borderRadius: 6, padding: '8px 10px' }}>
            <div>Rayleigh period T = 2π/ω = <b style={{ color: '#ffb454' }}>{(T * 1000).toFixed(1)} ms</b></div>
            <div>ω = √[(n³−n)σ / ((ρ_l+ρ_g)R³)] , n = 2</div>
          </div>
          <button onClick={() => setRunning((r) => !r)} style={btn}>
            {running ? '⏸ pause' : '▶ play'}
          </button>
        </div>
      </div>
    </div>
  )
}

const lab: React.CSSProperties = { fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }
const btn: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 6,
  border: '1px solid #33333d',
  background: '#1a1a20',
  color: '#c8c8cc',
  cursor: 'pointer',
  fontSize: 12,
}
