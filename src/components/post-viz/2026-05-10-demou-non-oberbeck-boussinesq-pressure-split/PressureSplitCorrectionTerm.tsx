'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 360
const PAD_L = 60
const PAD_R = 20
const PAD_T = 30
const PAD_B = 40

export function PressureSplitCorrectionTerm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rhoMin, setRhoMin] = useState(0.978)
  const [rhoMax, setRhoMax] = useState(1.000)
  const [showTwoPhase, setShowTwoPhase] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#0b1322'
    ctx.fillRect(0, 0, W, H)

    const xLo = 0.0
    const xHi = showTwoPhase ? 1.0 : 0.05
    const yLo = -0.02
    const yHi = showTwoPhase ? 1.0 : 0.15
    const sx = (x: number) => PAD_L + ((x - xLo) / (xHi - xLo)) * (W - PAD_L - PAD_R)
    const sy = (y: number) => PAD_T + (1 - (y - yLo) / (yHi - yLo)) * (H - PAD_T - PAD_B)

    ctx.strokeStyle = 'rgba(120,140,170,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    const xTicks = showTwoPhase ? [0, 0.2, 0.4, 0.6, 0.8, 1.0] : [0, 0.01, 0.02, 0.03, 0.04, 0.05]
    xTicks.forEach((xt) => {
      const X = sx(xt)
      ctx.moveTo(X, PAD_T)
      ctx.lineTo(X, H - PAD_B)
    })
    const yTicks = showTwoPhase ? [0, 0.2, 0.4, 0.6, 0.8, 1.0] : [0, 0.04, 0.08, 0.12]
    yTicks.forEach((yt) => {
      const Y = sy(yt)
      ctx.moveTo(PAD_L, Y)
      ctx.lineTo(W - PAD_R, Y)
    })
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    xTicks.forEach((xt) => {
      ctx.fillText(showTwoPhase ? xt.toFixed(1) : xt.toFixed(2), sx(xt), H - PAD_B + 16)
    })
    ctx.textAlign = 'right'
    yTicks.forEach((yt) => {
      ctx.fillText(yt.toFixed(2), PAD_L - 6, sy(yt) + 4)
    })

    ctx.fillStyle = '#cbd5e1'
    ctx.textAlign = 'center'
    ctx.fillText('Δρ/ρ₀  (relative density variation)', (PAD_L + W - PAD_R) / 2, H - 8)
    ctx.save()
    ctx.translate(16, (PAD_T + H - PAD_B) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('|1 − ρ₀ / ρ|  (correction term)', 0, 0)
    ctx.restore()

    const N = 300
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const dRho = xLo + (i / N) * (xHi - xLo)
      const correction = dRho / (1 + dRho)
      const X = sx(dRho)
      const Y = sy(correction)
      if (i === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    }
    ctx.stroke()

    const dRhoNOB = Math.max(0, (1 - rhoMin / rhoMax))
    const correctionNOB = dRhoNOB / (1 + dRhoNOB)
    if (dRhoNOB <= xHi) {
      ctx.fillStyle = '#34d399'
      ctx.beginPath()
      ctx.arc(sx(dRhoNOB), sy(correctionNOB), 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0b1322'
      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 1.5
      ctx.fillRect(sx(dRhoNOB) + 10, sy(correctionNOB) - 22, 168, 36)
      ctx.strokeRect(sx(dRhoNOB) + 10, sy(correctionNOB) - 22, 168, 36)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`Δρ/ρ = ${(dRhoNOB * 100).toFixed(2)}%`, sx(dRhoNOB) + 16, sy(correctionNOB) - 8)
      ctx.fillText(`correction = ${correctionNOB.toFixed(4)}`, sx(dRhoNOB) + 16, sy(correctionNOB) + 6)
    }

    if (showTwoPhase) {
      const xWater = 0.999
      const yWater = xWater / (1 + xWater)
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.arc(sx(xWater), sy(yWater), 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fed7aa'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.fillText('water/air interface', sx(xWater) - 8, sy(yWater))
    }

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(showTwoPhase ? 'full range (two-phase regime)' : 'NOB zoom (Δρ/ρ < 5%)', PAD_L + 8, PAD_T - 8)
  }, [rhoMin, rhoMax, showTwoPhase])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', borderRadius: 8, background: 'var(--surface, #0b1322)', border: '1px solid var(--border, #1f2a3a)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem 1.2rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <label>
          ρ_min / ρ_ref: <strong>{rhoMin.toFixed(3)}</strong>
          <input type="range" min={0.5} max={1.0} step={0.001} value={rhoMin} onChange={(e) => setRhoMin(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          ρ_max / ρ_ref: <strong>{rhoMax.toFixed(3)}</strong>
          <input type="range" min={0.8} max={1.0} step={0.001} value={rhoMax} onChange={(e) => setRhoMax(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span>x-range:</span>
          <button onClick={() => setShowTwoPhase((v) => !v)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: 4, border: '1px solid var(--border, #2a3a52)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
            {showTwoPhase ? '← zoom NOB (<5%)' : 'show full (two-phase) →'}
          </button>
        </label>
      </div>
      <p style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-faint, #64748b)' }}>
        The splitting scheme rewrites the variable Poisson coefficient as constant ρ₀ plus a residual proportional to |1 − ρ₀/ρ|. For water at ΔT = 50 K the correction stays under 3% — that is why a constant-coefficient FFT solver can replace an iterative variable solver without losing accuracy.
      </p>
    </div>
  )
}
