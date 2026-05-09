'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 320
const PAD_L = 56
const PAD_R = 16
const PAD_T = 18
const PAD_B = 36

const GAMMA1 = 4.4
const PINF1 = 6e8
const GAMMA2 = 1.4
const PINF2 = 0
const RHO1_0 = 1000
const RHO2_0 = 50

function vk(p: number, vk0: number, pk0: number, gk: number, pInfk: number, pIhat: number) {
  const num = pk0 + gk * pInfk + (gk - 1) * pIhat
  const den = p + gk * pInfk + (gk - 1) * pIhat
  return vk0 * (num / den)
}

function residual(p: number, alpha1_0: number, p1_0: number, p2_0: number, pIhat: number) {
  const v1_0 = 1 / RHO1_0
  const v2_0 = 1 / RHO2_0
  const v1 = vk(p, v1_0, p1_0, GAMMA1, PINF1, pIhat)
  const v2 = vk(p, v2_0, p2_0, GAMMA2, PINF2, pIhat)
  const aq1 = alpha1_0 * RHO1_0
  const aq2 = (1 - alpha1_0) * RHO2_0
  return aq1 * v1 + aq2 * v2 - 1
}

function solveRelaxed(alpha1_0: number, p1_0: number, p2_0: number) {
  const pIhat = (RHO2_0 * 340 * p1_0 + RHO1_0 * 1500 * p2_0) / (RHO1_0 * 1500 + RHO2_0 * 340)
  const trail: { p: number; res: number }[] = []
  let pLo = 1e3
  let pHi = Math.max(p1_0, p2_0) * 5 + 1e7
  let pMid = 0.5 * (pLo + pHi)
  for (let it = 0; it < 60; it++) {
    pMid = 0.5 * (pLo + pHi)
    const r = residual(pMid, alpha1_0, p1_0, p2_0, pIhat)
    trail.push({ p: pMid, res: r })
    if (Math.abs(r) < 1e-10) break
    if (r > 0) pLo = pMid
    else pHi = pMid
  }
  return { pEq: pMid, trail }
}

export function PressureRelaxationNewton() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [alpha1, setAlpha1] = useState(0.5)
  const [p1Init, setP1Init] = useState(2e6)
  const [p2Init, setP2Init] = useState(1e5)
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastTime = useRef<number>(0)

  const { pEq, trail } = solveRelaxed(alpha1, p1Init, p2Init)
  const visibleTrail = trail.slice(0, Math.max(1, Math.min(step + 1, trail.length)))

  useEffect(() => {
    if (!auto) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = (t: number) => {
      if (t - lastTime.current > 280) {
        lastTime.current = t
        setStep((s) => {
          if (s >= Math.min(28, trail.length - 1)) {
            setAuto(false)
            return s
          }
          return s + 1
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [auto, trail.length])

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

    const xMax = Math.min(28, trail.length - 1)
    const allP = trail.slice(0, xMax + 1).map((t) => t.p).concat([p1Init, p2Init, pEq])
    const yLo = Math.min(...allP) * 0.85
    const yHi = Math.max(...allP) * 1.05
    const sx = (i: number) => PAD_L + (i / Math.max(xMax, 1)) * (W - PAD_L - PAD_R)
    const sy = (p: number) => PAD_T + (1 - (p - yLo) / (yHi - yLo)) * (H - PAD_T - PAD_B)

    ctx.strokeStyle = 'rgba(120,140,170,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let g = 0; g <= 5; g++) {
      const px = PAD_L + (g / 5) * (W - PAD_L - PAD_R)
      ctx.moveTo(px, PAD_T)
      ctx.lineTo(px, H - PAD_B)
    }
    for (let g = 0; g <= 4; g++) {
      const py = PAD_T + (g / 4) * (H - PAD_T - PAD_B)
      ctx.moveTo(PAD_L, py)
      ctx.lineTo(W - PAD_R, py)
    }
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.textAlign = 'right'
    for (let g = 0; g <= 4; g++) {
      const py = PAD_T + (g / 4) * (H - PAD_T - PAD_B)
      const pv = yHi - (g / 4) * (yHi - yLo)
      ctx.fillText(`${(pv / 1e5).toFixed(1)}`, PAD_L - 6, py + 4)
    }
    ctx.textAlign = 'center'
    for (let g = 0; g <= 5; g++) {
      const px = PAD_L + (g / 5) * (W - PAD_L - PAD_R)
      ctx.fillText(`${Math.round((g / 5) * xMax)}`, px, H - PAD_B + 16)
    }
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText('iteration k', (PAD_L + W - PAD_R) / 2, H - 6)
    ctx.save()
    ctx.translate(14, (PAD_T + H - PAD_B) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('pressure  p  [bar]', 0, 0)
    ctx.restore()

    const yEq = sy(pEq)
    ctx.strokeStyle = 'rgba(34,211,238,0.55)'
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(PAD_L, yEq)
    ctx.lineTo(W - PAD_R, yEq)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#22d3ee'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`p_eq ≈ ${(pEq / 1e5).toFixed(2)} bar`, W - PAD_R - 130, yEq - 6)

    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    ctx.beginPath()
    visibleTrail.forEach((t, i) => {
      const X = sx(i)
      const Y = sy(t.p)
      if (i === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    })
    ctx.stroke()
    visibleTrail.forEach((t, i) => {
      const X = sx(i)
      const Y = sy(t.p)
      ctx.fillStyle = i === visibleTrail.length - 1 ? '#fed7aa' : '#f97316'
      ctx.beginPath()
      ctx.arc(X, Y, i === visibleTrail.length - 1 ? 5 : 3, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.textAlign = 'left'
    const last = visibleTrail[visibleTrail.length - 1]
    ctx.fillText(`k = ${visibleTrail.length - 1}`, PAD_L + 8, PAD_T + 16)
    ctx.fillText(`p^(k) = ${(last.p / 1e5).toFixed(3)} bar`, PAD_L + 8, PAD_T + 32)
    ctx.fillText(`|res| = ${Math.abs(last.res).toExponential(2)}`, PAD_L + 8, PAD_T + 48)
  }, [step, alpha1, p1Init, p2Init, pEq, trail, visibleTrail])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', borderRadius: 8, background: 'var(--surface, #0b1322)', border: '1px solid var(--border, #1f2a3a)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem 1.2rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <label>
          α₁ initial: <strong>{alpha1.toFixed(2)}</strong>
          <input type="range" min={0.05} max={0.95} step={0.01} value={alpha1} onChange={(e) => { setAlpha1(parseFloat(e.target.value)); setStep(0) }} style={{ width: '100%' }} />
        </label>
        <label>
          p₁ initial [bar]: <strong>{(p1Init / 1e5).toFixed(1)}</strong>
          <input type="range" min={1} max={500} step={1} value={p1Init / 1e5} onChange={(e) => { setP1Init(parseFloat(e.target.value) * 1e5); setStep(0) }} style={{ width: '100%' }} />
        </label>
        <label>
          p₂ initial [bar]: <strong>{(p2Init / 1e5).toFixed(1)}</strong>
          <input type="range" min={0.1} max={50} step={0.1} value={p2Init / 1e5} onChange={(e) => { setP2Init(parseFloat(e.target.value) * 1e5); setStep(0) }} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', alignItems: 'center' }}>
        <button onClick={() => { setStep((s) => Math.max(0, s - 1)); setAuto(false) }} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: 4, border: '1px solid var(--border, #2a3a52)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>‹ step</button>
        <button onClick={() => { setStep((s) => Math.min(trail.length - 1, s + 1)); setAuto(false) }} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: 4, border: '1px solid var(--border, #2a3a52)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>step ›</button>
        <button onClick={() => { setStep(0); setAuto(true) }} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: 4, border: '1px solid var(--accent, #22d3ee)', background: 'var(--accent, #22d3ee)', color: '#0b1322', cursor: 'pointer' }}>{auto ? '...' : '▶ run'}</button>
        <button onClick={() => { setStep(0); setAuto(false) }} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: 4, border: '1px solid var(--border, #2a3a52)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>reset</button>
      </div>
      <p style={{ marginTop: '0.8rem', fontSize: '0.78rem', color: 'var(--text-faint, #64748b)' }}>
        Bisection on Σ (αρ)ₖ vₖ(p) = 1 with stiffened-gas EOS for water (γ=4.4, p∞=6×10⁸) and ideal gas (γ=1.4). Starting from p₁ ≠ p₂ the iteration finds the single equilibrium pressure that satisfies the saturation constraint.
      </p>
    </div>
  )
}
