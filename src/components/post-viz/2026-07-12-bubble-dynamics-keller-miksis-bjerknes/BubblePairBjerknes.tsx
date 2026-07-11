'use client'

import { useEffect, useRef, useState } from 'react'

const P0 = 1.0e5
const RHO = 998
const KAPPA = 1.4
const ZETA = 0.12 // effective damping ratio (viscous + acoustic + thermal, lumped)

// Minnaert angular resonance frequency for a bubble of equilibrium radius RE [m].
function omega0(REum: number) {
  const RE = REum * 1e-6
  return Math.sqrt((3 * KAPPA * P0) / RHO) / RE
}

// Steady-state driven-oscillator response: amplitude (arbitrary units) and phase lag.
function response(REum: number, fkHz: number) {
  const w = 2 * Math.PI * fkHz * 1e3
  const w0 = omega0(REum)
  const beta = ZETA * w0
  const denom = Math.sqrt((w0 * w0 - w * w) ** 2 + (2 * beta * w) ** 2)
  const amp = 1 / denom
  const phase = Math.atan2(2 * beta * w, w0 * w0 - w * w) // in [0, pi]
  return { amp, phase, w, w0 }
}

export function BubblePairBjerknes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [r1, setR1] = useState(40)
  const [r2, setR2] = useState(70)
  const [fkHz, setFkHz] = useState(50)
  const [dist, setDist] = useState(6) // center distance in units of (R1+R2)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const render = () => {
      const w = canvas.width
      const h = canvas.height
      tRef.current += 0.03

      const a = response(r1, fkHz)
      const b = response(r2, fkHz)
      const dphi = a.phase - b.phase
      const cosd = Math.cos(dphi)
      const attract = cosd >= 0
      // secondary Bjerknes magnitude ~ A1 A2 w^2 cos(dphi) / D^2 (relative units)
      const D = dist
      const bjMag = (a.amp * b.amp * a.w * a.w * cosd) / (D * D)
      // normalize for arrow length display
      const arrowLen = Math.min(60, Math.abs(bjMag) * 2.2e-9)

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1020'
      ctx.fillRect(0, 0, w, h)

      const phase = tRef.current
      const eps = 0.28
      // pixel scale so the larger equilibrium bubble is a fixed size
      const maxRE = Math.max(r1, r2)
      const basePix = h * 0.16
      const scale = basePix / maxRE
      const rp1e = r1 * scale
      const rp2e = r2 * scale
      // instantaneous radii (normalized amplitude for visibility)
      const ampMax = Math.max(a.amp, b.amp)
      const osc1 = eps * (a.amp / ampMax) * Math.sin(phase - a.phase)
      const osc2 = eps * (b.amp / ampMax) * Math.sin(phase - b.phase)
      const rp1 = rp1e * (1 + osc1)
      const rp2 = rp2e * (1 + osc2)

      // centers along horizontal axis, separated by D*(R1+R2)*scale (clamped to canvas)
      const cy = h * 0.42
      const wanted = D * (r1 + r2) * scale
      const gap = Math.min(wanted, w * 0.5)
      const cx1 = w * 0.5 - gap / 2
      const cx2 = w * 0.5 + gap / 2

      // draw bubbles
      const drawBubble = (cx: number, rp: number, hot: boolean) => {
        const grd = ctx.createRadialGradient(cx, cy - rp * 0.3, rp * 0.1, cx, cy, rp)
        grd.addColorStop(0, hot ? '#a5f3fc' : '#bae6fd')
        grd.addColorStop(1, '#0e7490')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(cx, cy, Math.max(2, rp), 0, 2 * Math.PI)
        ctx.fill()
      }
      drawBubble(cx1, rp1, osc1 > 0)
      drawBubble(cx2, rp2, osc2 > 0)

      // force arrows
      const drawArrow = (from: number, to: number) => {
        ctx.strokeStyle = attract ? '#34d399' : '#f87171'
        ctx.fillStyle = attract ? '#34d399' : '#f87171'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(from, cy)
        ctx.lineTo(to, cy)
        ctx.stroke()
        const dir = Math.sign(to - from)
        ctx.beginPath()
        ctx.moveTo(to, cy)
        ctx.lineTo(to - dir * 8, cy - 5)
        ctx.lineTo(to - dir * 8, cy + 5)
        ctx.closePath()
        ctx.fill()
      }
      if (arrowLen > 3) {
        if (attract) {
          drawArrow(cx1 + rp1 + 6, cx1 + rp1 + 6 + arrowLen)
          drawArrow(cx2 - rp2 - 6, cx2 - rp2 - 6 - arrowLen)
        } else {
          drawArrow(cx1 - rp1 - 6, cx1 - rp1 - 6 - arrowLen)
          drawArrow(cx2 + rp2 + 6, cx2 + rp2 + 6 + arrowLen)
        }
      }

      // labels
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`R_E1 = ${r1} um  (f0 = ${(a.w0 / (2 * Math.PI) / 1e3).toFixed(0)} kHz)`, 12, 20)
      ctx.fillText(`R_E2 = ${r2} um  (f0 = ${(b.w0 / (2 * Math.PI) / 1e3).toFixed(0)} kHz)`, 12, 38)
      ctx.font = 'bold 16px ui-sans-serif, system-ui'
      ctx.fillStyle = attract ? '#34d399' : '#f87171'
      ctx.fillText(attract ? 'ATTRACT' : 'REPEL', w * 0.5 - 34, h - 40)
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(`phase diff = ${((dphi * 180) / Math.PI).toFixed(0)} deg`, w * 0.5 - 60, h - 18)

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [r1, r2, fkHz, dist])

  return (
    <div
      style={{
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 16,
        background: '#0f172a',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 14,
          color: '#cbd5e1',
          fontSize: 13,
        }}
      >
        <label>
          Bubble 1 radius: {r1} um
          <input
            type="range"
            min={5}
            max={120}
            step={1}
            value={r1}
            onChange={(e) => setR1(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Bubble 2 radius: {r2} um
          <input
            type="range"
            min={5}
            max={120}
            step={1}
            value={r2}
            onChange={(e) => setR2(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Driving frequency f: {fkHz} kHz
          <input
            type="range"
            min={10}
            max={400}
            step={5}
            value={fkHz}
            onChange={(e) => setFkHz(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Separation D: {dist} x (R1+R2)
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={dist}
            onChange={(e) => setDist(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
    </div>
  )
}
