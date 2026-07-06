'use client'

import { useEffect, useRef, useState } from 'react'

// TAB (Taylor Analogy Breakup) oscillator.
// Integrates the dimensionless deformation y(t) driven by aerodynamic
// forcing (Weber number) against surface-tension restoring + viscous damping.
// Breakup is declared once y crosses 1.

const C_F = 1 / 3
const C_k = 8
const C_d = 5
const C_b = 1 / 2

export function TabDropletOscillator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [weber, setWeber] = useState(18) // gas Weber number based on diameter
  const [ohnesorge, setOhnesorge] = useState(0.02)
  const [running, setRunning] = useState(true)

  // mutable simulation state kept in refs so RAF sees fresh values
  const stateRef = useRef({ y: 0, ydot: 0, t: 0, broke: false })
  const paramRef = useRef({ weber, ohnesorge, running })
  paramRef.current = { weber, ohnesorge, running }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const trail: number[] = []

    const step = () => {
      const { weber: We, ohnesorge: Oh, running: run } = paramRef.current
      const s = stateRef.current

      // dimensionless natural frequency: with r-scaled time, omega^2 = C_k
      const omega2 = C_k
      // steady deformation target y_eq = We/(some const). With diameter-Weber,
      // y_eq = (C_F/(C_b*C_k)) * (We/2)  -> breakup (y>1) near We ~ 12.
      const forcing = (C_F / C_b) * (We / 2)
      // damping ~ Ohnesorge: zeta grows with Oh
      const damp = C_d * Oh * Math.sqrt(C_k)

      if (run && !s.broke) {
        const dt = 0.02
        for (let i = 0; i < 4; i++) {
          const acc = forcing - omega2 * s.y - damp * s.ydot
          s.ydot += acc * dt
          s.y += s.ydot * dt
          s.t += dt
          if (s.y >= 1) {
            s.y = 1
            s.broke = true
            break
          }
        }
      }

      trail.push(s.y)
      if (trail.length > 240) trail.shift()

      // --- render ---
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // left: droplet shape. deformation y stretches into an oblate ellipsoid.
      const cx = W * 0.28
      const cy = H * 0.5
      const R = 46
      const yy = Math.max(0, Math.min(1.15, s.y))
      // oblate: horizontal radius grows, vertical shrinks
      const rx = R * (1 + 0.9 * yy)
      const ry = R * (1 - 0.55 * yy)

      // incoming gas arrows
      ctx.strokeStyle = 'rgba(122,144,168,0.5)'
      ctx.lineWidth = 1.5
      for (let k = 0; k < 4; k++) {
        const ay = cy - 60 + k * 40
        ctx.beginPath()
        ctx.moveTo(8, ay)
        ctx.lineTo(cx - rx - 14, ay)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - rx - 14, ay)
        ctx.lineTo(cx - rx - 22, ay - 4)
        ctx.moveTo(cx - rx - 14, ay)
        ctx.lineTo(cx - rx - 22, ay + 4)
        ctx.stroke()
      }

      if (!s.broke) {
        const grad = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 4, cx, cy, rx)
        grad.addColorStop(0, '#67e8f9')
        grad.addColorStop(1, '#22d3ee')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      } else {
        // shatter into child droplets
        ctx.fillStyle = '#22d3ee'
        const seed = [
          [0, 0, 20], [40, -24, 12], [46, 26, 14], [78, -8, 9],
          [24, 40, 8], [30, -46, 7], [70, 30, 8], [96, 10, 6],
        ]
        for (const [dx, dy, r] of seed) {
          ctx.beginPath()
          ctx.arc(cx + dx * 0.9, cy + dy, r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#fca5a5'
        ctx.font = '600 13px system-ui, sans-serif'
        ctx.fillText('breakup: y > 1', cx - 30, cy + ry + 46)
      }

      // right: y(t) trace
      const px = W * 0.52
      const pw = W - px - 16
      const ph = H - 40
      const py = 20
      ctx.strokeStyle = 'rgba(122,144,168,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(px, py, pw, ph)
      // y=1 breakup line
      const y1 = py + ph * (1 - 1 / 1.2)
      ctx.strokeStyle = 'rgba(252,165,165,0.7)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(px, y1)
      ctx.lineTo(px + pw, y1)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#fca5a5'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('y = 1', px + 6, y1 - 5)

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < trail.length; i++) {
        const tx = px + (i / 240) * pw
        const ty = py + ph * (1 - Math.min(1.15, trail[i]) / 1.2)
        if (i === 0) ctx.moveTo(tx, ty)
        else ctx.lineTo(tx, ty)
      }
      ctx.stroke()
      ctx.fillStyle = '#7a90a8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('deformation y(t)', px + 6, py + 14)

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const reset = () => {
    stateRef.current = { y: 0, ydot: 0, t: 0, broke: false }
  }

  return (
    <div
      style={{
        border: '1px solid var(--border, #1e293b)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface, #0b1523)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 14, alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted, #7a90a8)', flex: '1 1 220px' }}>
          Weber number We = {weber.toFixed(0)}
          <input
            type="range"
            min={2}
            max={60}
            step={1}
            value={weber}
            onChange={(e) => { setWeber(+e.target.value); reset() }}
            style={{ width: '100%', accentColor: '#22d3ee' }}
          />
        </label>
        <label style={{ fontSize: 13, color: 'var(--text-muted, #7a90a8)', flex: '1 1 220px' }}>
          Ohnesorge Oh = {ohnesorge.toFixed(3)}
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.005}
            value={ohnesorge}
            onChange={(e) => { setOhnesorge(+e.target.value); reset() }}
            style={{ width: '100%', accentColor: '#22d3ee' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #22d3ee',
              background: 'transparent', color: '#22d3ee', cursor: 'pointer', fontSize: 13,
            }}
          >
            {running ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={reset}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #7a90a8',
              background: 'transparent', color: '#7a90a8', cursor: 'pointer', fontSize: 13,
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
