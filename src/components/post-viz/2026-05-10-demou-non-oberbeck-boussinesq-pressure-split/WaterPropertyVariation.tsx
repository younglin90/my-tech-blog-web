'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 360
const PAD_L = 56
const PAD_R = 16
const PAD_T = 30
const PAD_B = 36
const PANEL_GAP = 14
const PANEL_W = (W - PAD_L - PAD_R - PANEL_GAP) / 2
const PANEL_H = (H - PAD_T - PAD_B - PANEL_GAP) / 2

const T0 = 313

function waterDensity(T: number) {
  const dT = T - T0
  return 992.2 * (1 - 3.736e-4 * dT - 3.98e-6 * dT * dT)
}
function waterViscosity(T: number) {
  return 0.001 * Math.exp(247.8 / (T - 140))
}
function waterConductivity(T: number) {
  const Tn = T / 298.15
  return 0.6065 * (-1.48445 + 4.12292 * Tn - 1.63866 * Tn * Tn)
}
function waterCp(T: number) {
  const dT = T - T0
  return 4178 * (1 + 4.0e-5 * dT * dT)
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  title: string,
  unit: string,
  fn: (T: number) => number,
  Tlo: number,
  Thi: number,
  Th: number,
  Tc: number,
  color: string,
) {
  ctx.fillStyle = '#0b1322'
  ctx.fillRect(ox, oy, PANEL_W, PANEL_H)
  ctx.strokeStyle = 'rgba(120,140,170,0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(ox + 0.5, oy + 0.5, PANEL_W - 1, PANEL_H - 1)

  const N = 200
  const vals: number[] = []
  for (let i = 0; i <= N; i++) {
    const T = Tlo + (i / N) * (Thi - Tlo)
    vals.push(fn(T))
  }
  const vmin = Math.min(...vals)
  const vmax = Math.max(...vals)
  const vlo = vmin - 0.04 * (vmax - vmin + 1e-9)
  const vhi = vmax + 0.04 * (vmax - vmin + 1e-9)

  const sx = (T: number) => ox + ((T - Tlo) / (Thi - Tlo)) * PANEL_W
  const sy = (v: number) => oy + (1 - (v - vlo) / (vhi - vlo)) * PANEL_H

  const vOB = fn(T0)
  ctx.strokeStyle = 'rgba(148,163,184,0.55)'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(ox, sy(vOB))
  ctx.lineTo(ox + PANEL_W, sy(vOB))
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= N; i++) {
    const T = Tlo + (i / N) * (Thi - Tlo)
    const X = sx(T)
    const Y = sy(fn(T))
    if (i === 0) ctx.moveTo(X, Y)
    else ctx.lineTo(X, Y)
  }
  ctx.stroke()

  const Th_ = Math.min(Math.max(Th, Tlo), Thi)
  const Tc_ = Math.min(Math.max(Tc, Tlo), Thi)
  ctx.fillStyle = '#f97316'
  ctx.beginPath()
  ctx.arc(sx(Th_), sy(fn(Th_)), 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#22d3ee'
  ctx.beginPath()
  ctx.arc(sx(Tc_), sy(fn(Tc_)), 4, 0, Math.PI * 2)
  ctx.fill()

  const dv = (fn(Th_) - fn(Tc_)) / vOB * 100
  ctx.fillStyle = '#e2e8f0'
  ctx.font = 'bold 12px ui-sans-serif, system-ui'
  ctx.textAlign = 'left'
  ctx.fillText(title, ox + 8, oy - 8)
  ctx.font = '11px ui-monospace, monospace'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#fde68a'
  ctx.fillText(`Δ${unit} = ${dv >= 0 ? '+' : ''}${dv.toFixed(1)}%`, ox + PANEL_W - 6, oy + 14)
}

export function WaterPropertyVariation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [Th, setTh] = useState(333)
  const [Tc, setTc] = useState(293)

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
    ctx.fillStyle = '#080d18'
    ctx.fillRect(0, 0, W, H)

    drawPanel(ctx, PAD_L, PAD_T, 'ρ(T)  [kg/m³]', 'ρ/ρ₀', waterDensity, 283, 343, Th, Tc, '#22d3ee')
    drawPanel(ctx, PAD_L + PANEL_W + PANEL_GAP, PAD_T, 'μ(T)  [Pa·s]', 'μ/μ₀', waterViscosity, 283, 343, Th, Tc, '#a78bfa')
    drawPanel(ctx, PAD_L, PAD_T + PANEL_H + PANEL_GAP, 'k(T)  [W/m/K]', 'k/k₀', waterConductivity, 283, 343, Th, Tc, '#34d399')
    drawPanel(ctx, PAD_L + PANEL_W + PANEL_GAP, PAD_T + PANEL_H + PANEL_GAP, 'Cₚ(T)  [J/kg/K]', 'Cₚ/Cₚ₀', waterCp, 283, 343, Th, Tc, '#f87171')

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('283 K', PAD_L, H - 20)
    ctx.textAlign = 'right'
    ctx.fillText('343 K', PAD_L + PANEL_W, H - 20)
    ctx.textAlign = 'left'
    ctx.fillText('283 K', PAD_L + PANEL_W + PANEL_GAP, H - 20)
    ctx.textAlign = 'right'
    ctx.fillText('343 K', PAD_L + PANEL_W + PANEL_GAP + PANEL_W, H - 20)

    ctx.textAlign = 'left'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.fillText('water properties, T₀ = 313 K, polynomials from Ahlers et al. (Demou §3.2)', PAD_L, 16)
  }, [Th, Tc])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', borderRadius: 8, background: 'var(--surface, #0b1322)', border: '1px solid var(--border, #1f2a3a)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem 1.2rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <label>
          T_hot: <strong style={{ color: '#f97316' }}>{Th} K</strong> ({(Th - 273).toFixed(0)} °C)
          <input type="range" min={313} max={343} step={1} value={Th} onChange={(e) => setTh(parseInt(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          T_cold: <strong style={{ color: '#22d3ee' }}>{Tc} K</strong> ({(Tc - 273).toFixed(0)} °C)
          <input type="range" min={283} max={313} step={1} value={Tc} onChange={(e) => setTc(parseInt(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <p style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-faint, #64748b)' }}>
        Dashed line marks the reference value at T₀ = 313 K. Δ% is the relative change between hot and cold. For ΔT ≈ 50 K, density moves about 2%, but viscosity changes by tens of percent — the OB approximation hides that.
      </p>
    </div>
  )
}
