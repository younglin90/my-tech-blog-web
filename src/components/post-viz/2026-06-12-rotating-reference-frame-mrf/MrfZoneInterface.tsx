'use client'

import { useEffect, useRef, useState } from 'react'

// MRF (Multiple Reference Frame). A circular rotating zone holds a
// spinning impeller; outside is a stationary zone. Toggle the frame:
// in the ABSOLUTE view the inner fluid shows solid-body rotation
// (omega x r), so the arrows grow toward the interface. In the RELATIVE
// (MRF) view the inner flow is "frozen" — near zero — because we solve
// the steady equations in the rotating frame. The dashed interface
// circle is where u_abs = u_rel + omega x r reconciles the two.

export function MrfZoneInterface() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const angRef = useRef(0)
  const [omega, setOmega] = useState(1.0)
  const [relative, setRelative] = useState(false)
  const omegaRef = useRef(omega)
  const relRef = useRef(relative)
  omegaRef.current = omega
  relRef.current = relative

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const Rzone = 110 // interface radius
    const nBlades = 4

    // sample grid for velocity arrows
    const step = 34
    const pts: { x: number; y: number }[] = []
    for (let gx = step / 2; gx < W; gx += step) {
      for (let gy = step / 2; gy < H; gy += step) {
        pts.push({ x: gx, y: gy })
      }
    }

    const tick = () => {
      const om = omegaRef.current
      const rel = relRef.current
      angRef.current += om * 0.02
      const a = angRef.current

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // rotating zone disk
      ctx.fillStyle = 'rgba(34,211,238,0.06)'
      ctx.beginPath()
      ctx.arc(cx, cy, Rzone, 0, Math.PI * 2)
      ctx.fill()

      // velocity arrows
      for (const p of pts) {
        const dx = p.x - cx
        const dy = p.y - cy
        const r = Math.hypot(dx, dy)
        if (r < 6) continue
        const inside = r < Rzone
        // tangential unit vector (counter-clockwise)
        const tx = -dy / r
        const ty = dx / r
        let mag: number
        if (inside) {
          // absolute: solid-body omega*r ; relative (MRF): frozen ~ 0
          mag = rel ? 0.04 * om * r : om * r * 0.16
        } else {
          // outside: free-vortex-like decay, same in both frames
          mag = (om * Rzone * Rzone * 0.16) / r
        }
        const ex = p.x + tx * mag
        const ey = p.y + ty * mag
        const inten = Math.min(1, mag / 22)
        ctx.strokeStyle = inside
          ? `rgba(34,211,238,${0.25 + 0.6 * inten})`
          : `rgba(244,114,182,${0.25 + 0.6 * inten})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        // arrow head
        const hl = 4
        const ah = Math.atan2(ey - p.y, ex - p.x)
        ctx.beginPath()
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - hl * Math.cos(ah - 0.5), ey - hl * Math.sin(ah - 0.5))
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - hl * Math.cos(ah + 0.5), ey - hl * Math.sin(ah + 0.5))
        ctx.stroke()
      }

      // impeller blades (always shown spinning so the geometry reads)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      for (let b = 0; b < nBlades; b++) {
        ctx.rotate((Math.PI * 2) / nBlades)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Rzone * 0.72, 0)
        ctx.stroke()
      }
      ctx.fillStyle = '#0f1f33'
      ctx.beginPath()
      ctx.arc(0, 0, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      // interface circle (dashed)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 5])
      ctx.beginPath()
      ctx.arc(cx, cy, Rzone, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // labels
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px monospace'
      ctx.fillText(rel ? 'RELATIVE frame (MRF): inner flow frozen' : 'ABSOLUTE frame: inner solid-body rotation', 10, 18)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('dashed: MRF interface', 10, H - 12)

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
        height={320}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#08111f' }}
      />
      <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={() => setRelative((v) => !v)}
          style={{
            padding: '0.45rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            border: '1px solid var(--border)',
            background: relative ? '#22d3ee' : 'var(--bg)',
            color: relative ? '#08111f' : 'var(--text)',
          }}
        >
          {relative ? 'relative (MRF) frame' : 'absolute frame'}
        </button>
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          omega
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={omega}
            onChange={(e) => setOmega(parseFloat(e.target.value))}
            style={{ width: 150 }}
          />
          <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{omega.toFixed(2)}</span>
        </label>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Switch to the relative frame: the inner cyan arrows collapse toward zero because the rotating zone becomes
          steady, while the pink outer field is unchanged. The dashed circle is where the two velocity descriptions
          must be transformed into each other.
        </p>
      </div>
    </div>
  )
}
