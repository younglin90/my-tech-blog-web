'use client'

import { useEffect, useRef, useState } from 'react'

// A free particle moves in a perfectly straight line in the inertial
// (absolute) frame. We re-plot the same motion in a frame rotating at
// rate omega. The trail bends into a Coriolis spiral even though no real
// force acts on the particle. Raise omega to see the deflection grow;
// the faint gray line is the true straight path in the inertial frame.

export function RotatingFrameParticleTrajectory() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const tRef = useRef(0)
  const [omega, setOmega] = useState(0.9)
  const omegaRef = useRef(omega)
  omegaRef.current = omega

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const scale = 1.0 // px per unit

    // inertial-frame launch: from center, constant velocity along +x with slight +y
    const vx = 1.05
    const vy = 0.18
    const rotTrail: { x: number; y: number }[] = []
    const T = 200 // frames per pass

    const tick = () => {
      const om = omegaRef.current
      tRef.current += 1
      let t = tRef.current

      // restart the pass
      if (t > T) {
        tRef.current = 0
        t = 0
        rotTrail.length = 0
      }

      // absolute position (straight line) in world units
      const ax = vx * t
      const ay = vy * t
      // rotate into frame turning at +om (rad per frame, scaled)
      const ang = om * 0.018 * t
      const c = Math.cos(-ang)
      const s = Math.sin(-ang)
      const rx = c * ax - s * ay
      const ry = s * ax + c * ay
      rotTrail.push({ x: rx, y: ry })

      // clear
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // rotating reference grid (turntable) — faint radial spokes
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(ang)
      ctx.strokeStyle = 'rgba(122,144,168,0.18)'
      ctx.lineWidth = 1
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * 260, Math.sin(a) * 260)
        ctx.stroke()
      }
      for (let rr = 60; rr <= 240; rr += 60) {
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      // inertial straight path (faint gray) — the real trajectory
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + vx * T * scale, cy + vy * T * scale)
      ctx.stroke()

      // Coriolis trail (cyan) — path as seen in the rotating frame
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i < rotTrail.length; i++) {
        const px = cx + rotTrail[i].x * scale
        const py = cy + rotTrail[i].y * scale
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      // current particle
      const px = cx + rx * scale
      const py = cy + ry * scale
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fill()

      // labels
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px monospace'
      ctx.fillText('gray: true straight path (inertial frame)', 10, 18)
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('cyan: same motion seen in rotating frame', 10, 34)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(`omega = ${om.toFixed(2)} rad/s`, 10, H - 12)

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
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          omega
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={omega}
            onChange={(e) => setOmega(parseFloat(e.target.value))}
            style={{ width: 180 }}
          />
          <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{omega.toFixed(2)}</span>
        </label>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          At omega = 0 both paths coincide. Increase omega and the cyan trail curls into a spiral — the Coriolis
          deflection that an observer riding the turntable mistakes for a force.
        </p>
      </div>
    </div>
  )
}
