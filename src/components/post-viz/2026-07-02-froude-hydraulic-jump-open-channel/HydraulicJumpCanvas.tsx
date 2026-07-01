'use client'

import { useEffect, useRef, useState } from 'react'

// Side-view of a hydraulic jump in a rectangular channel.
// Upstream: thin, fast supercritical sheet (Fr1 > 1).
// Downstream: deep, slow subcritical flow, set by the conjugate-depth law
//   h2/h1 = 1/2 ( sqrt(1 + 8 Fr1^2) - 1 ).
// Tracer dots advect with the depth-averaged velocity; a turbulent roller
// sits over the jump.

const G = 9.81

export function HydraulicJumpCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fr1, setFr1] = useState(3.0)
  const rafRef = useRef<number>(0)

  const ratio = 0.5 * (Math.sqrt(1 + 8 * fr1 * fr1) - 1) // h2/h1
  const fr2 = fr1 / Math.pow(ratio, 1.5) // Fr2 = Fr1 (h1/h2)^{3/2}
  const loss = Math.pow(ratio - 1, 3) / (4 * ratio) // ΔE / h1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = 460
    const H = 240
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const bed = H - 24
    const jumpX = W * 0.46
    const h1px = 30
    const h2px = Math.min(h1px * ratio, bed - 30)
    // depth-averaged speeds scale so that u*h = const (continuity)
    const u1 = 2.6
    const u2 = u1 * (h1px / h2px)

    const N = 90
    const dots = Array.from({ length: N }, (_, i) => ({
      x: (i / N) * W,
      // relative height within the local water column (0 bed .. 1 surface)
      f: (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.85 + 0.05,
    }))

    const surface = (x: number) => {
      if (x < jumpX) return bed - h1px
      if (x > jumpX + 46) return bed - h2px
      // roller transition
      const t = (x - jumpX) / 46
      const s = t * t * (3 - 2 * t)
      return bed - (h1px + (h2px - h1px) * s)
    }

    let running = true
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, W, H)

      // channel bed
      ctx.fillStyle = 'rgba(122,144,168,0.25)'
      ctx.fillRect(0, bed, W, H - bed)
      ctx.strokeStyle = '#7a90a8'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, bed)
      ctx.lineTo(W, bed)
      ctx.stroke()

      // water body
      ctx.beginPath()
      ctx.moveTo(0, bed)
      for (let x = 0; x <= W; x += 4) ctx.lineTo(x, surface(x))
      ctx.lineTo(W, bed)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, 'rgba(34,211,238,0.28)')
      grad.addColorStop(1, 'rgba(56,189,248,0.42)')
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x <= W; x += 4) {
        const yy = surface(x)
        if (x === 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.stroke()

      // roller foam over the jump
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      for (let k = 0; k < 14; k++) {
        const rx = jumpX + (k % 7) * 7 + ((k * 13) % 5)
        const ry = bed - h1px - (k * 5) % (h2px - h1px + 6) - 4
        ctx.beginPath()
        ctx.arc(rx, ry, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // tracer dots
      ctx.fillStyle = '#0e2233'
      for (const d of dots) {
        const local = d.x < jumpX ? u1 : u2
        d.x += local
        if (d.x > W) d.x -= W
        const top = surface(d.x)
        const depth = bed - top
        const py = bed - d.f * depth
        ctx.beginPath()
        ctx.arc(d.x, py, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // labels
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px monospace'
      ctx.fillText('Fr1 = ' + fr1.toFixed(1) + ' (사류)', 12, 18)
      ctx.fillText('Fr2 = ' + fr2.toFixed(2) + ' (상류)', W - 150, 18)

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [fr1, ratio, fr2])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', display: 'block' }} />
      <div style={{ marginTop: 12, fontSize: 14 }}>
        <label style={{ display: 'block', marginBottom: 10 }}>
          upstream Froude number Fr1: <strong>{fr1.toFixed(1)}</strong>
          <input type="range" min={1.5} max={8} step={0.1} value={fr1} onChange={(e) => setFr1(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <div style={{ fontFamily: 'monospace', display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
          <span>h2/h1 = <strong style={{ color: '#22d3ee' }}>{ratio.toFixed(2)}</strong></span>
          <span>Fr2 = <strong>{fr2.toFixed(2)}</strong></span>
          <span>ΔE/h1 = <strong style={{ color: '#f59e0b' }}>{loss.toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
  )
}
