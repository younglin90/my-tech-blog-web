'use client'

import { useEffect, useRef, useState } from 'react'

export function PolarSourceTermBalance() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [r, setR] = useState(2.0)
  const [dr, setDr] = useState(0.3)
  const [P, setP] = useState(1.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1422'
    ctx.fillRect(0, 0, W, H)

    // Layout: left half = polar cell sketch, right half = numeric bars.
    const splitX = W * 0.5

    // --- Left panel: polar cell sketch ---
    const cx = splitX * 0.5
    const cy = H * 0.55
    const scale = Math.min(splitX, H) * 0.18

    const rMid = r
    const rIn = Math.max(0.05, rMid - dr * 0.5)
    const rOut = rMid + dr * 0.5

    // sketch sweep (in radians) — visual only
    const theta0 = -0.55
    const theta1 = 0.55

    ctx.strokeStyle = 'rgba(120, 144, 168, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let t = 0; t < Math.PI * 2; t += 0.05) {
      const px = cx + Math.cos(t) * rOut * scale
      const py = cy + Math.sin(t) * rOut * scale
      if (t === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()

    // Cell shape (annular wedge)
    ctx.fillStyle = 'rgba(34, 211, 238, 0.18)'
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, rIn * scale, theta0, theta1, false)
    ctx.lineTo(
      cx + Math.cos(theta1) * rOut * scale,
      cy + Math.sin(theta1) * rOut * scale,
    )
    ctx.arc(cx, cy, rOut * scale, theta1, theta0, true)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // arrows for pressure on each face
    ctx.fillStyle = 'rgba(244, 114, 182, 0.9)'
    ctx.font = '11px ui-sans-serif, system-ui'
    const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      // arrowhead
      const ang = Math.atan2(y2 - y1, x2 - x1)
      const ah = 5
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4))
      ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    const mid = (theta0 + theta1) * 0.5
    const inX = cx + Math.cos(mid) * rIn * scale
    const inY = cy + Math.sin(mid) * rIn * scale
    const outX = cx + Math.cos(mid) * rOut * scale
    const outY = cy + Math.sin(mid) * rOut * scale

    // P pushing inward from outer face (toward center)
    drawArrow(outX + 18 * Math.cos(mid), outY + 18 * Math.sin(mid), outX, outY)
    // P pushing outward from inner face
    drawArrow(inX - 18 * Math.cos(mid), inY - 18 * Math.sin(mid), inX, inY)

    ctx.fillStyle = 'rgba(244, 114, 182, 0.9)'
    ctx.fillText(`P·S_out`, outX + 6, outY - 4)
    ctx.fillText(`P·S_in`, inX - 40, inY + 14)

    // labels
    ctx.fillStyle = 'rgba(180, 200, 220, 0.85)'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.fillText(`r = ${r.toFixed(2)}`, 8, 16)
    ctx.fillText(`Δr = ${dr.toFixed(2)}`, 8, 30)
    ctx.fillText(`P = ${P.toFixed(2)}`, 8, 44)

    // --- Right panel: numeric comparison ---
    const rIn2 = rIn
    const rOut2 = rOut
    const S_in = rIn2 * rIn2
    const S_out = rOut2 * rOut2
    const V = (rOut2 ** 3 - rIn2 ** 3) / 3.0

    const naive = (2 * P / r) * V
    const balanced = P * (S_out - S_in)
    const physFlux = P * (S_out - S_in)
    const residualNaive = naive - physFlux
    const residualBalanced = balanced - physFlux

    const x0 = splitX + 16
    const y0 = 18
    ctx.fillStyle = 'rgba(180, 200, 220, 0.85)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText('cell geometry', x0, y0)
    ctx.font = '11px ui-monospace, ui-monospace'
    ctx.fillText(`S_in  = r²_in  = ${S_in.toFixed(4)}`, x0, y0 + 18)
    ctx.fillText(`S_out = r²_out = ${S_out.toFixed(4)}`, x0, y0 + 34)
    ctx.fillText(`V     = (r³_out − r³_in)/3 = ${V.toFixed(4)}`, x0, y0 + 50)

    ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText('naive   2P/r · V', x0, y0 + 84)
    ctx.font = '14px ui-monospace, ui-monospace'
    ctx.fillText(`  = ${naive.toFixed(4)}`, x0, y0 + 102)

    ctx.fillStyle = 'rgba(34, 211, 238, 0.95)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText('well-balanced   P · (S_out − S_in)', x0, y0 + 130)
    ctx.font = '14px ui-monospace, ui-monospace'
    ctx.fillText(`  = ${balanced.toFixed(4)}`, x0, y0 + 148)

    ctx.fillStyle = 'rgba(180, 200, 220, 0.8)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText('physical pressure-flux through faces', x0, y0 + 176)
    ctx.font = '14px ui-monospace, ui-monospace'
    ctx.fillText(`  P·(S_out − S_in) = ${physFlux.toFixed(4)}`, x0, y0 + 194)

    ctx.fillStyle = '#fbbf24'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText(`net source naive  = ${residualNaive.toFixed(5)}`, x0, y0 + 220)
    ctx.fillStyle = '#34d399'
    ctx.fillText(
      `net source balanced = ${residualBalanced.toFixed(5)}`,
      x0,
      y0 + 236,
    )
  }, [r, dr, P])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '16px 0',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 290, display: 'block', borderRadius: 6 }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>r (cell radius) = {r.toFixed(2)}</span>
          <input
            type="range"
            min={0.4}
            max={3.5}
            step={0.05}
            value={r}
            onChange={(e) => setR(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Δr = {dr.toFixed(2)}</span>
          <input
            type="range"
            min={0.05}
            max={0.8}
            step={0.01}
            value={dr}
            onChange={(e) => setDr(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>P = {P.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.05}
            value={P}
            onChange={(e) => setP(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Naive 2P/r · V is only a Taylor approximation of P·(S<sub>out</sub> −
        S<sub>in</sub>); the residual grows with Δr, so coarser radial grids
        produce stronger spurious accelerations.
      </p>
    </div>
  )
}
