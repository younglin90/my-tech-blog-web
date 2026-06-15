'use client'

import { useEffect, useRef, useState } from 'react'

// Jurin's law: a wetting liquid climbs a thin tube to h = 2*sigma*cos(theta)/(rho*g*r).
// Adjust tube radius and contact angle; the column animates to its equilibrium
// height. theta > 90 deg gives a depressed (convex) meniscus, like mercury.
const SIGMA = 0.072 // N/m, water-air at room temperature
const RHO = 1000 // kg/m^3
const G = 9.81 // m/s^2

export function CapillaryRiseExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [radiusMm, setRadiusMm] = useState(0.5)
  const [thetaDeg, setThetaDeg] = useState(30)
  const hCurRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const theta = (thetaDeg * Math.PI) / 180
    const r = radiusMm / 1000 // m
    const hTarget = (2 * SIGMA * Math.cos(theta)) / (RHO * G * r) // m (can be negative)

    // scaling: map up to 80 mm of rise to the drawable height
    const mmToPx = (H - 140) / 80
    const reservoirY = H - 90
    const tubeWpx = Math.max(8, Math.min(46, radiusMm * 36 + 6))
    const cx = W / 2

    const draw = () => {
      // ease current height toward target
      const targetMm = hTarget * 1000
      hCurRef.current += (targetMm - hCurRef.current) * 0.08

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // reservoir
      ctx.fillStyle = 'rgba(14,116,144,0.55)'
      ctx.fillRect(40, reservoirY, W - 80, H - reservoirY - 20)
      ctx.strokeStyle = '#7a90a8'
      ctx.lineWidth = 2
      ctx.strokeRect(40, reservoirY, W - 80, H - reservoirY - 20)

      // tube walls
      const tubeLeft = cx - tubeWpx / 2
      const tubeRight = cx + tubeWpx / 2
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tubeLeft, 40)
      ctx.lineTo(tubeLeft, reservoirY)
      ctx.moveTo(tubeRight, 40)
      ctx.lineTo(tubeRight, reservoirY)
      ctx.stroke()

      // liquid column inside tube
      const colTop = reservoirY - hCurRef.current * mmToPx
      ctx.fillStyle = 'rgba(34,211,238,0.5)'
      ctx.fillRect(tubeLeft + 1, colTop, tubeWpx - 2, reservoirY - colTop)

      // meniscus: concave for theta<90, convex for theta>90
      const dip = (tubeWpx / 2) * Math.cos(theta) * 0.8
      ctx.beginPath()
      ctx.moveTo(tubeLeft + 1, colTop)
      ctx.quadraticCurveTo(cx, colTop + dip, tubeRight - 1, colTop)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.stroke()

      // height readout line
      ctx.strokeStyle = '#fbbf24'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(tubeRight + 6, colTop)
      ctx.lineTo(W - 24, colTop)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#fbbf24'
      ctx.font = '13px monospace'
      ctx.fillText(`h = ${targetMm.toFixed(1)} mm`, W - 120, colTop - 6)

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '13px monospace'
      ctx.fillText(`r = ${radiusMm.toFixed(2)} mm`, 24, 28)
      ctx.fillText(`theta = ${thetaDeg} deg`, 24, 48)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [radiusMm, thetaDeg])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0b1626', borderRadius: 12 }}>
      <canvas
        ref={canvasRef}
        width={520}
        height={340}
        style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto', borderRadius: 8 }}
      />
      <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 13 }}>
        <label>
          tube radius r: {radiusMm.toFixed(2)} mm
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.05}
            value={radiusMm}
            onChange={(e) => setRadiusMm(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <label style={{ display: 'block', marginTop: 10 }}>
          contact angle theta: {thetaDeg}&deg;
          <input
            type="range"
            min={0}
            max={150}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
      </div>
    </div>
  )
}
