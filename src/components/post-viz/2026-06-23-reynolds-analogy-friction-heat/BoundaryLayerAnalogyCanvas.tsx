'use client'

import { useEffect, useRef, useState } from 'react'

// Laminar flat-plate boundary layers (Blasius).
//   momentum thickness scale: delta(x)  = 5 x / sqrt(Re_x)
//   thermal  thickness scale: deltaT(x) = delta(x) / Pr^(1/3)
//   Cf,x/2 = 0.332 / sqrt(Re_x)
//   St     = 0.332 Re_x^(-1/2) Pr^(-2/3)   (Chilton-Colburn)
// Drag the sliders: at Pr = 1 the two layers overlap and Cf/2 = St exactly.
export function BoundaryLayerAnalogyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logReL, setLogReL] = useState(5) // Re_L = 10^logReL
  const [pr, setPr] = useState(1)
  const tRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const ReL = Math.pow(10, logReL)
    const plateY = H - 70
    const x0 = 60
    const x1 = W - 30
    const plateLen = x1 - x0

    // pick a vertical scale so the thicker layer fills ~ 60% of the height
    const deltaL = 5 / Math.sqrt(ReL) // delta/x at trailing edge (x*=1)
    const deltaTL = deltaL / Math.pow(pr, 1 / 3)
    const maxDelta = Math.max(deltaL, deltaTL)
    const yScale = (plateY - 40) / (maxDelta * 1.15)

    const draw = () => {
      tRef.current += 0.018
      const t = tRef.current

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // free-stream arrows
      ctx.strokeStyle = 'rgba(122,144,168,0.5)'
      ctx.lineWidth = 1.5
      for (let k = 0; k < 5; k++) {
        const ay = 36 + k * 14
        const ph = (t * 60 + k * 40) % (plateLen + 40)
        const ax = x0 - 30 + ph
        if (ax < x1 - 6) {
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(ax + 16, ay)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(ax + 16, ay)
          ctx.lineTo(ax + 11, ay - 3)
          ctx.lineTo(ax + 11, ay + 3)
          ctx.closePath()
          ctx.fillStyle = 'rgba(122,144,168,0.5)'
          ctx.fill()
        }
      }

      // plate
      ctx.fillStyle = '#475569'
      ctx.fillRect(x0, plateY, plateLen, 10)
      for (let hx = x0; hx < x1; hx += 10) {
        ctx.strokeStyle = '#334155'
        ctx.beginPath()
        ctx.moveTo(hx, plateY + 10)
        ctx.lineTo(hx - 6, plateY + 16)
        ctx.stroke()
      }

      // thermal boundary layer (orange) — draw first so momentum sits on top
      const drawLayer = (deltaRel: number, color: string, fill: string) => {
        ctx.beginPath()
        ctx.moveTo(x0, plateY)
        for (let px = 0; px <= plateLen; px += 4) {
          const xs = px / plateLen // x* in [0,1]
          const d = deltaRel * Math.sqrt(Math.max(xs, 1e-4)) // delta ~ sqrt(x)
          ctx.lineTo(x0 + px, plateY - d * yScale)
        }
        ctx.lineTo(x1, plateY)
        ctx.closePath()
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let px = 0; px <= plateLen; px += 4) {
          const xs = px / plateLen
          const d = deltaRel * Math.sqrt(Math.max(xs, 1e-4))
          const X = x0 + px
          const Y = plateY - d * yScale
          if (px === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      }

      drawLayer(deltaTL, '#f59e0b', 'rgba(245,158,11,0.16)') // thermal
      drawLayer(deltaL, '#22d3ee', 'rgba(34,211,238,0.16)') // momentum

      // velocity / temperature profiles at a station
      const stX = x0 + plateLen * 0.72
      const stXs = 0.72
      const dM = deltaL * Math.sqrt(stXs)
      const dT = deltaTL * Math.sqrt(stXs)
      const drawProfile = (d: number, color: string, dir: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let yy = 0; yy <= d * yScale; yy += 2) {
          const eta = yy / (d * yScale) // 0..1
          const f = 1 - Math.exp(-3 * eta) // smooth profile 0->1
          ctx.lineTo(stX + dir * f * 26, plateY - yy)
        }
        ctx.stroke()
      }
      drawProfile(dM, '#22d3ee', 1)
      drawProfile(dT, '#f59e0b', -1)

      // labels
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px monospace'
      ctx.fillText('U∞ , T∞', 8, 30)
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('δ  (momentum)', x0, 24)
      ctx.fillStyle = '#f59e0b'
      ctx.fillText('δ_T (thermal)', x0 + 150, 24)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [logReL, pr])

  const ReL = Math.pow(10, logReL)
  const cfHalf = 0.332 / Math.sqrt(ReL)
  const st = 0.332 / (Math.sqrt(ReL) * Math.pow(pr, 2 / 3))
  const ratio = deltaTRatio(pr)

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0b1626', borderRadius: 12 }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto', borderRadius: 8 }}
      />
      <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 13 }}>
        <label>
          log₁₀ Re_L: {logReL.toFixed(1)} &nbsp;(Re_L = {ReL.toExponential(1)})
          <input
            type="range"
            min={4}
            max={6}
            step={0.1}
            value={logReL}
            onChange={(e) => setLogReL(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <label style={{ display: 'block', marginTop: 10 }}>
          Prandtl number Pr: {pr.toFixed(2)} &nbsp;(δ_T/δ = {ratio.toFixed(2)})
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.05}
            value={pr}
            onChange={(e) => setPr(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>
          C_f/2 = {cfHalf.toExponential(3)} &nbsp;|&nbsp; St = {st.toExponential(3)}
          <br />
          St &middot; Pr^(2/3) = {(st * Math.pow(pr, 2 / 3)).toExponential(3)}
          {Math.abs(pr - 1) < 0.06 ? '  ← Pr≈1: C_f/2 = St' : '  → equals C_f/2 (Chilton-Colburn)'}
        </div>
      </div>
    </div>
  )
}

function deltaTRatio(pr: number) {
  return 1 / Math.pow(pr, 1 / 3)
}
