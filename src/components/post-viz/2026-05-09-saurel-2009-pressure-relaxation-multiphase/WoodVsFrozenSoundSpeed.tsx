'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 360
const PAD_L = 64
const PAD_R = 16
const PAD_T = 24
const PAD_B = 48

const N_SAMPLES = 401

type Material = { rho: number; c: number }

function woodSpeed(alpha1: number, m1: Material, m2: Material) {
  const a1 = clamp(alpha1, 1e-6, 1 - 1e-6)
  const a2 = 1 - a1
  const rhoMix = a1 * m1.rho + a2 * m2.rho
  const inv = a1 / (m1.rho * m1.c * m1.c) + a2 / (m2.rho * m2.c * m2.c)
  return 1 / Math.sqrt(rhoMix * inv)
}

function frozenSpeed(alpha1: number, m1: Material, m2: Material) {
  const a1 = clamp(alpha1, 1e-6, 1 - 1e-6)
  const a2 = 1 - a1
  const rhoMix = a1 * m1.rho + a2 * m2.rho
  const Y1 = (a1 * m1.rho) / rhoMix
  const Y2 = (a2 * m2.rho) / rhoMix
  return Math.sqrt(Y1 * m1.c * m1.c + Y2 * m2.c * m2.c)
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x))
}

export function WoodVsFrozenSoundSpeed() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rho1, setRho1] = useState(1000)
  const [c1, setC1] = useState(1500)
  const [rho2, setRho2] = useState(10)
  const [c2, setC2] = useState(340)
  const [alphaCursor, setAlphaCursor] = useState(0.5)
  const [yLog, setYLog] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const m1: Material = { rho: rho1, c: c1 }
    const m2: Material = { rho: rho2, c: c2 }

    const wood = new Float64Array(N_SAMPLES)
    const frozen = new Float64Array(N_SAMPLES)
    for (let i = 0; i < N_SAMPLES; i++) {
      const a = i / (N_SAMPLES - 1)
      wood[i] = woodSpeed(a, m1, m2)
      frozen[i] = frozenSpeed(a, m1, m2)
    }

    let yMin = Infinity
    let yMax = -Infinity
    for (let i = 0; i < N_SAMPLES; i++) {
      if (wood[i] < yMin) yMin = wood[i]
      if (frozen[i] < yMin) yMin = frozen[i]
      if (wood[i] > yMax) yMax = wood[i]
      if (frozen[i] > yMax) yMax = frozen[i]
    }
    yMin = Math.max(yMin, 1)
    yMax = yMax * 1.05

    const plotW = W - PAD_L - PAD_R
    const plotH = H - PAD_T - PAD_B
    const xToPx = (a: number) => PAD_L + a * plotW
    const yToPx = (y: number) => {
      const t = yLog
        ? (Math.log10(y) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))
        : (y - yMin) / (yMax - yMin)
      return PAD_T + (1 - t) * plotH
    }

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(PAD_L, PAD_T, plotW, plotH)

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let k = 0; k <= 10; k++) {
      const x = xToPx(k / 10)
      ctx.moveTo(x, PAD_T)
      ctx.lineTo(x, PAD_T + plotH)
    }
    ctx.stroke()

    ctx.beginPath()
    const yTicks = yLog
      ? [10, 30, 100, 300, 1000, 3000]
      : Array.from({ length: 6 }, (_, k) => yMin + (k * (yMax - yMin)) / 5)
    for (const v of yTicks) {
      if (v < yMin * 0.95 || v > yMax * 1.05) continue
      const y = yToPx(v)
      ctx.moveTo(PAD_L, y)
      ctx.lineTo(PAD_L + plotW, y)
    }
    ctx.stroke()

    ctx.fillStyle = 'rgba(203,213,225,0.7)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.textAlign = 'right'
    for (const v of yTicks) {
      if (v < yMin * 0.95 || v > yMax * 1.05) continue
      const y = yToPx(v)
      ctx.fillText(`${v.toFixed(0)}`, PAD_L - 6, y + 4)
    }
    ctx.textAlign = 'center'
    for (let k = 0; k <= 10; k++) {
      const x = xToPx(k / 10)
      ctx.fillText((k / 10).toFixed(1), x, PAD_T + plotH + 16)
    }

    ctx.fillStyle = 'rgba(203,213,225,0.85)'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('volume fraction α₁ (phase 1)', PAD_L + plotW / 2, H - 12)
    ctx.save()
    ctx.translate(16, PAD_T + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('mixture sound speed [m/s]', 0, 0)
    ctx.restore()

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < N_SAMPLES; i++) {
      const x = xToPx(i / (N_SAMPLES - 1))
      const y = yToPx(wood[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    for (let i = 0; i < N_SAMPLES; i++) {
      const x = xToPx(i / (N_SAMPLES - 1))
      const y = yToPx(frozen[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    const aC = clamp(alphaCursor, 0, 1)
    const xC = xToPx(aC)
    ctx.strokeStyle = 'rgba(248,250,252,0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xC, PAD_T)
    ctx.lineTo(xC, PAD_T + plotH)
    ctx.stroke()

    const wC = woodSpeed(aC, m1, m2)
    const fC = frozenSpeed(aC, m1, m2)
    ctx.fillStyle = '#22d3ee'
    ctx.beginPath()
    ctx.arc(xC, yToPx(wC), 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.arc(xC, yToPx(fC), 4, 0, Math.PI * 2)
    ctx.fill()

    const labelX = xC + 10 < PAD_L + plotW - 160 ? xC + 10 : xC - 170
    ctx.fillStyle = 'rgba(8,17,31,0.85)'
    ctx.fillRect(labelX, PAD_T + 6, 160, 44)
    ctx.fillStyle = '#22d3ee'
    ctx.textAlign = 'left'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText(`Wood    : ${wC.toFixed(1)} m/s`, labelX + 6, PAD_T + 22)
    ctx.fillStyle = '#f97316'
    ctx.fillText(`Frozen  : ${fC.toFixed(1)} m/s`, labelX + 6, PAD_T + 40)

    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(PAD_L + plotW - 158, PAD_T + plotH - 50, 16, 2)
    ctx.fillStyle = 'rgba(203,213,225,0.85)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText('Wood (equilibrium)', PAD_L + plotW - 138, PAD_T + plotH - 46)
    ctx.fillStyle = '#f97316'
    ctx.fillRect(PAD_L + plotW - 158, PAD_T + plotH - 30, 16, 2)
    ctx.fillStyle = 'rgba(203,213,225,0.85)'
    ctx.fillText('Frozen', PAD_L + plotW - 138, PAD_T + plotH - 26)
  }, [rho1, c1, rho2, c2, alphaCursor, yLog])

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <canvas ref={canvasRef} className="block w-full max-w-full" />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slider label={`ρ₁ = ${rho1.toFixed(0)} kg/m³`} value={rho1} min={1} max={2000} step={1} onChange={setRho1} />
        <Slider label={`c₁ = ${c1.toFixed(0)} m/s`} value={c1} min={100} max={3000} step={10} onChange={setC1} />
        <Slider label={`ρ₂ = ${rho2.toFixed(1)} kg/m³`} value={rho2} min={0.1} max={500} step={0.1} onChange={setRho2} />
        <Slider label={`c₂ = ${c2.toFixed(0)} m/s`} value={c2} min={50} max={2000} step={10} onChange={setC2} />
        <Slider label={`cursor α₁ = ${alphaCursor.toFixed(3)}`} value={alphaCursor} min={0} max={1} step={0.001} onChange={setAlphaCursor} />
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input type="checkbox" checked={yLog} onChange={(e) => setYLog(e.target.checked)} />
          log scale on y-axis
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Preset label="water / air" onClick={() => { setRho1(1000); setC1(1500); setRho2(10); setC2(340) }} />
        <Preset label="water / vapor" onClick={() => { setRho1(1000); setC1(1500); setRho2(0.6); setC2(420) }} />
        <Preset label="epoxy / spinel" onClick={() => { setRho1(1185); setC1(2730); setRho2(3622); setC2(8030) }} />
        <Preset label="oil / gas" onClick={() => { setRho1(870); setC1(1300); setRho2(50); setC2(280) }} />
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Wood (equilibrium) sound speed dips far below either pure-fluid value near intermediate α; frozen speed stays inside the [c₂, c₁] band.
      </p>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-[var(--accent)]"
      />
    </label>
  )
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {label}
    </button>
  )
}
