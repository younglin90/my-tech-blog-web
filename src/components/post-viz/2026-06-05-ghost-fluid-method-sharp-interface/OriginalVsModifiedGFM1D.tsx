'use client'

import { useEffect, useRef, useState } from 'react'

// A pressure pulse travels through a stiff material interface. The original GFM
// builds ghost states by plain copy/extrapolation and rings near the interface
// for high stiffness ratios; the modified (Riemann-based) GFM solves an
// interface Riemann problem and stays clean. This is a pedagogical model of
// that spurious oscillation, not a full Euler solver.

export function OriginalVsModifiedGFM1D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stiffness, setStiffness] = useState(6) // EOS stiffness ratio of the right fluid
  const [modified, setModified] = useState(false)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const N = 220
    const xi = 0.55 // interface location (fraction)
    let raf = 0

    const draw = () => {
      phaseRef.current += 0.006
      const ph = phaseRef.current % 1
      ctx.clearRect(0, 0, W, H)
      const pad = 34
      const toX = (f: number) => pad + f * (W - 2 * pad)
      const lo = 0.4
      const hi = 1.85
      const toY = (p: number) => H - pad - ((p - lo) / (hi - lo)) * (H - 2 * pad)

      // baseline pressure + a gaussian pulse centered at pulse position
      const center = 0.08 + ph * 0.9
      const ampl = 0.7
      const width = 0.05
      // oscillation strength grows with stiffness for the original method
      const ringK = modified ? 0 : (stiffness - 1) / 9

      const pAt = (x: number) => {
        let p = 1.0 + ampl * Math.exp(-((x - center) ** 2) / (2 * width * width))
        // spurious ringing localised just past the interface once the pulse
        // has reached it (original GFM artefact)
        if (!modified && center > xi - 0.04) {
          const d = x - xi
          if (d > 0) {
            const env = Math.exp(-(d ** 2) / (2 * 0.04 * 0.04))
            p += ringK * 0.55 * env * Math.sin(d * 160 - phaseRef.current * 40)
          }
        }
        return p
      }

      // interface band (right fluid shaded)
      ctx.fillStyle = 'rgba(248,113,113,0.08)'
      ctx.fillRect(toX(xi), pad, W - pad - toX(xi), H - 2 * pad)
      ctx.strokeStyle = 'rgba(248,113,113,0.7)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(toX(xi), pad)
      ctx.lineTo(toX(xi), H - pad)
      ctx.stroke()
      ctx.setLineDash([])

      // axis baseline at p = 1
      ctx.strokeStyle = 'rgba(120,144,168,0.3)'
      ctx.beginPath()
      ctx.moveTo(pad, toY(1.0))
      ctx.lineTo(W - pad, toY(1.0))
      ctx.stroke()

      // pressure curve
      ctx.strokeStyle = modified ? '#34d399' : '#f59e0b'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i / N
        const px = toX(x)
        const py = toY(pAt(x))
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      ctx.fillStyle = '#7a90a8'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('pressure p(x)', pad + 2, pad + 4)
      ctx.fillStyle = '#f87171'
      ctx.fillText('stiff fluid', toX(xi) + 6, pad + 16)
      ctx.fillStyle = modified ? '#34d399' : '#f59e0b'
      ctx.fillText(modified ? 'modified GFM (Riemann interface)' : 'original GFM (copy + extrapolate)', pad + 2, H - 10)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [stiffness, modified])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, margin: '1.4rem 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={680} height={260} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 220px' }}>
          stiffness ratio of right fluid: {stiffness.toFixed(1)}
          <input type="range" min={1} max={10} step={0.1} value={stiffness} onChange={(e) => setStiffness(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 200px' }}>
          <input type="checkbox" checked={modified} onChange={(e) => setModified(e.target.checked)} />
          use modified (Riemann-based) GFM
        </label>
      </div>
    </div>
  )
}
