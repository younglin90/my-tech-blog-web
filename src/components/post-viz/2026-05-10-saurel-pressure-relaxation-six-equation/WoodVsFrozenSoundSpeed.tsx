'use client'

import { useEffect, useRef, useState } from 'react'

type Pt = { x: number; y: number }

const W = 720
const H = 360
const PAD_L = 56
const PAD_R = 16
const PAD_T = 18
const PAD_B = 36

function woodSpeed(alpha1: number, rho1: number, c1: number, rho2: number, c2: number) {
  const a1 = Math.min(Math.max(alpha1, 1e-6), 1 - 1e-6)
  const a2 = 1 - a1
  const rho = a1 * rho1 + a2 * rho2
  const inv = a1 / (rho1 * c1 * c1) + a2 / (rho2 * c2 * c2)
  return Math.sqrt(1 / (rho * inv))
}

function frozenSpeed(alpha1: number, rho1: number, c1: number, rho2: number, c2: number) {
  const a1 = Math.min(Math.max(alpha1, 1e-6), 1 - 1e-6)
  const a2 = 1 - a1
  const rho = a1 * rho1 + a2 * rho2
  const Y1 = (a1 * rho1) / rho
  const Y2 = (a2 * rho2) / rho
  return Math.sqrt(Y1 * c1 * c1 + Y2 * c2 * c2)
}

function logScale(v: number, vmin: number, vmax: number) {
  const lv = Math.log10(Math.max(v, 1e-6))
  return (lv - Math.log10(vmin)) / (Math.log10(vmax) - Math.log10(vmin))
}

export function WoodVsFrozenSoundSpeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rho1, setRho1] = useState(1000) // water
  const [c1, setC1] = useState(1500)
  const [rho2, setRho2] = useState(10) // air-ish
  const [c2, setC2] = useState(340)
  const [hover, setHover] = useState<number | null>(null)

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
    ctx.clearRect(0, 0, W, H)

    const N = 400
    const eqPts: Pt[] = []
    const frPts: Pt[] = []
    let ymin = Infinity
    let ymax = -Infinity
    for (let i = 0; i <= N; i++) {
      const a1 = i / N
      const ce = woodSpeed(a1, rho1, c1, rho2, c2)
      const cf = frozenSpeed(a1, rho1, c1, rho2, c2)
      eqPts.push({ x: a1, y: ce })
      frPts.push({ x: a1, y: cf })
      ymin = Math.min(ymin, ce, cf)
      ymax = Math.max(ymax, ce, cf)
    }
    const yLo = Math.max(1, ymin / 1.4)
    const yHi = ymax * 1.05

    const sx = (x: number) => PAD_L + x * (W - PAD_L - PAD_R)
    const sy = (y: number) => PAD_T + (1 - logScale(y, yLo, yHi)) * (H - PAD_T - PAD_B)

    ctx.fillStyle = '#0b1322'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(120,140,170,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let g = 0; g <= 10; g++) {
      const x = sx(g / 10)
      ctx.moveTo(x, PAD_T)
      ctx.lineTo(x, H - PAD_B)
    }
    const decades = [10, 100, 1000, 10000]
    decades.forEach((d) => {
      if (d >= yLo && d <= yHi) {
        const y = sy(d)
        ctx.moveTo(PAD_L, y)
        ctx.lineTo(W - PAD_R, y)
      }
    })
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    for (let g = 0; g <= 10; g += 2) {
      ctx.fillText((g / 10).toFixed(1), sx(g / 10), H - PAD_B + 16)
    }
    ctx.textAlign = 'right'
    decades.forEach((d) => {
      if (d >= yLo && d <= yHi) {
        ctx.fillText(`${d}`, PAD_L - 6, sy(d) + 4)
      }
    })
    ctx.textAlign = 'center'
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText('volume fraction α₁ (phase 1)', (PAD_L + W - PAD_R) / 2, H - 6)
    ctx.save()
    ctx.translate(14, (PAD_T + H - PAD_B) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('sound speed [m/s]  (log)', 0, 0)
    ctx.restore()

    ctx.lineWidth = 2.2
    ctx.strokeStyle = '#22d3ee'
    ctx.beginPath()
    frPts.forEach((p, i) => {
      const X = sx(p.x)
      const Y = sy(p.y)
      if (i === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    })
    ctx.stroke()

    ctx.strokeStyle = '#f97316'
    ctx.beginPath()
    eqPts.forEach((p, i) => {
      const X = sx(p.x)
      const Y = sy(p.y)
      if (i === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    })
    ctx.stroke()

    let valIdx = 0
    let valMin = Infinity
    eqPts.forEach((p, i) => {
      if (p.y < valMin) {
        valMin = p.y
        valIdx = i
      }
    })
    const valX = sx(eqPts[valIdx].x)
    const valY = sy(eqPts[valIdx].y)
    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.arc(valX, valY, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fed7aa'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`min ≈ ${valMin.toFixed(0)} m/s @ α₁=${eqPts[valIdx].x.toFixed(2)}`, valX + 8, valY - 6)

    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(PAD_L + 8, PAD_T + 8, 18, 3)
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText('frozen  c_f  (mass-fraction weighted)', PAD_L + 30, PAD_T + 14)
    ctx.fillStyle = '#f97316'
    ctx.fillRect(PAD_L + 8, PAD_T + 28, 18, 3)
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText('Wood  c_eq  (mechanical equilibrium)', PAD_L + 30, PAD_T + 34)

    if (hover !== null) {
      const a1 = Math.min(Math.max(hover, 0), 1)
      const ce = woodSpeed(a1, rho1, c1, rho2, c2)
      const cf = frozenSpeed(a1, rho1, c1, rho2, c2)
      const X = sx(a1)
      ctx.strokeStyle = 'rgba(226,232,240,0.4)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(X, PAD_T)
      ctx.lineTo(X, H - PAD_B)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(X, sy(cf), 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.arc(X, sy(ce), 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0b1322'
      ctx.fillRect(X + 6, PAD_T + 4, 168, 36)
      ctx.strokeStyle = 'rgba(226,232,240,0.3)'
      ctx.strokeRect(X + 6, PAD_T + 4, 168, 36)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`α₁ = ${a1.toFixed(3)}`, X + 12, PAD_T + 16)
      ctx.fillText(`c_f  = ${cf.toFixed(1)} m/s`, X + 12, PAD_T + 28)
      ctx.fillText(`c_eq = ${ce.toFixed(1)} m/s`, X + 12, PAD_T + 38)
    }
  }, [rho1, c1, rho2, c2, hover])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', borderRadius: 8, background: 'var(--surface, #0b1322)', border: '1px solid var(--border, #1f2a3a)' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect()
          const x = e.clientX - r.left
          const a1 = (x - PAD_L) / (W - PAD_L - PAD_R)
          if (a1 >= 0 && a1 <= 1) setHover(a1)
          else setHover(null)
        }}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 6, cursor: 'crosshair' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem 1.2rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <label>
          ρ₁ (phase 1, kg/m³): <strong>{rho1}</strong>
          <input type="range" min={50} max={2000} step={10} value={rho1} onChange={(e) => setRho1(parseInt(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          c₁ (phase 1, m/s): <strong>{c1}</strong>
          <input type="range" min={300} max={2500} step={10} value={c1} onChange={(e) => setC1(parseInt(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          ρ₂ (phase 2, kg/m³): <strong>{rho2}</strong>
          <input type="range" min={1} max={500} step={1} value={rho2} onChange={(e) => setRho2(parseInt(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          c₂ (phase 2, m/s): <strong>{c2}</strong>
          <input type="range" min={100} max={2000} step={10} value={c2} onChange={(e) => setC2(parseInt(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <p style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-faint, #64748b)' }}>
        Default: water (ρ=1000, c=1500) + air (ρ=10, c=340). The Wood (orange) curve dips far below both pure-fluid sound speeds — that valley is the source of spurious wave delays at diffuse interfaces.
      </p>
    </div>
  )
}
