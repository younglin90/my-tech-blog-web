'use client'

import { useEffect, useRef, useState } from 'react'

// Droplet sitting on a flat solid surface, drawn as a spherical-cap cross section.
// The contact angle theta is the angle the liquid-gas interface makes with the
// solid, measured through the liquid. Volume is held fixed: lower theta spreads
// the droplet (wetting), higher theta beads it up (non-wetting).
export function ContactAngleWettingLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [thetaDeg, setThetaDeg] = useState(60)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const theta = (thetaDeg * Math.PI) / 180

    // Fixed cross-sectional area V0 (2D analogue of fixed volume).
    // Circle radius R chosen so the visible cap area stays roughly constant.
    const V0 = 9000
    const capAreaFactor = theta - Math.sin(theta) * Math.cos(theta) // area = R^2 * factor
    const R = Math.sqrt(V0 / Math.max(capAreaFactor, 0.02))
    const Rdraw = Math.min(R, 150)

    const groundY = H - 60
    const cx = W / 2
    // center of the circle relative to the surface: yc = -R cos(theta)
    const ycScreen = groundY + Rdraw * Math.cos(theta)

    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)

    // solid surface
    ctx.strokeStyle = '#7a90a8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(20, groundY)
    ctx.lineTo(W - 20, groundY)
    ctx.stroke()
    // hatching under the solid
    ctx.strokeStyle = '#3a4a5e'
    ctx.lineWidth = 1
    for (let x = 30; x < W - 20; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, groundY)
      ctx.lineTo(x - 10, groundY + 12)
      ctx.stroke()
    }

    // droplet: arc from (pi/2 - theta) to (pi/2 + theta), through the top
    const a0 = Math.PI / 2 - theta
    const a1 = Math.PI / 2 + theta
    ctx.beginPath()
    // canvas y is downward, so use ycScreen - R sin(angle)
    const steps = 120
    for (let i = 0; i <= steps; i++) {
      const ang = a0 + ((a1 - a0) * i) / steps
      const x = cx + Rdraw * Math.cos(ang)
      const y = ycScreen - Rdraw * Math.sin(ang)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, ycScreen - Rdraw, 0, groundY)
    grad.addColorStop(0, 'rgba(34,211,238,0.55)')
    grad.addColorStop(1, 'rgba(14,116,144,0.85)')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.stroke()

    // contact angle marker at right contact point
    const px = cx + Rdraw * Math.sin(theta)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(px, groundY, 26, -theta, 0)
    ctx.stroke()
    ctx.fillStyle = '#fbbf24'
    ctx.font = '13px monospace'
    ctx.fillText(`theta = ${thetaDeg} deg`, px + 16, groundY - 14)

    // regime label
    const regime =
      thetaDeg < 90 ? 'wetting (hydrophilic)' : thetaDeg > 90 ? 'non-wetting (hydrophobic)' : 'neutral'
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '14px monospace'
    ctx.fillText(regime, 24, 30)
  }, [thetaDeg])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0b1626', borderRadius: 12 }}>
      <canvas
        ref={canvasRef}
        width={520}
        height={320}
        style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto', borderRadius: 8 }}
      />
      <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 13 }}>
        <label>
          contact angle theta: {thetaDeg}&deg;
          <input
            type="range"
            min={10}
            max={170}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
      </div>
    </div>
  )
}
