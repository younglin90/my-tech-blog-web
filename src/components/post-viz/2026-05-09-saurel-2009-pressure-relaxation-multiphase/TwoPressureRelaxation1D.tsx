'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 360
const PAD_L = 64
const PAD_R = 16
const PAD_T = 24
const PAD_B = 48
const N = 120

type State = {
  p1: Float64Array
  p2: Float64Array
  step: number
}

function initState(pLeft1: number, pLeft2: number, pRight1: number, pRight2: number): State {
  const p1 = new Float64Array(N)
  const p2 = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    if (i < N / 2) {
      p1[i] = pLeft1
      p2[i] = pLeft2
    } else {
      p1[i] = pRight1
      p2[i] = pRight2
    }
  }
  return { p1, p2, step: 0 }
}

function relaxStep(state: State, Z1: number, Z2: number, muDt: number) {
  const { p1, p2 } = state
  const factor = 1 - Math.exp(-muDt)
  for (let i = 0; i < N; i++) {
    const pI = (Z2 * p1[i] + Z1 * p2[i]) / (Z1 + Z2)
    p1[i] += factor * (pI - p1[i])
    p2[i] += factor * (pI - p2[i])
  }
  state.step += 1
}

export function TwoPressureRelaxation1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<State>(initState(5e5, 1e5, 1e5, 5e5))
  const rafRef = useRef<number | null>(null)
  const [Z1, setZ1] = useState(1.5e6)
  const [Z2, setZ2] = useState(3.4e3)
  const [muDt, setMuDt] = useState(0.05)
  const [running, setRunning] = useState(true)
  const [pL1, setPL1] = useState(5e5)
  const [pL2, setPL2] = useState(1e5)
  const [pR1, setPR1] = useState(1e5)
  const [pR2, setPR2] = useState(5e5)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    stateRef.current = initState(pL1, pL2, pR1, pR2)
    setTick((t) => t + 1)
  }, [pL1, pL2, pR1, pR2])

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(now - last, 32)
      last = now
      const stepsPerFrame = Math.max(1, Math.round(dt / 16))
      for (let k = 0; k < stepsPerFrame; k++) {
        relaxStep(stateRef.current, Z1, Z2, muDt)
      }
      setTick((t) => t + 1)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [running, Z1, Z2, muDt])

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

    const { p1, p2, step } = stateRef.current
    const plotW = W - PAD_L - PAD_R
    const plotH = H - PAD_T - PAD_B

    const yMin = 0
    const yMax = 7e5
    const xToPx = (i: number) => PAD_L + (i / (N - 1)) * plotW
    const yToPx = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(PAD_L, PAD_T, plotW, plotH)

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let k = 0; k <= 7; k++) {
      const y = PAD_T + (k / 7) * plotH
      ctx.moveTo(PAD_L, y)
      ctx.lineTo(PAD_L + plotW, y)
    }
    ctx.stroke()

    ctx.fillStyle = 'rgba(203,213,225,0.7)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.textAlign = 'right'
    for (let k = 0; k <= 7; k++) {
      const v = yMin + ((7 - k) / 7) * (yMax - yMin)
      const y = PAD_T + (k / 7) * plotH
      ctx.fillText(`${(v / 1e5).toFixed(1)}`, PAD_L - 6, y + 4)
    }
    ctx.textAlign = 'center'
    ctx.fillText('cell index i', PAD_L + plotW / 2, H - 12)
    ctx.save()
    ctx.translate(16, PAD_T + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('pressure [bar]', 0, 0)
    ctx.restore()

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const x = xToPx(i)
      const y = yToPx(p1[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const x = xToPx(i)
      const y = yToPx(p2[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    let s1 = 0
    let s2 = 0
    for (let i = 0; i < N; i++) {
      s1 += p1[i]
      s2 += p2[i]
    }
    const gap = Math.abs(s1 - s2) / N

    ctx.fillStyle = 'rgba(8,17,31,0.85)'
    ctx.fillRect(PAD_L + 8, PAD_T + 6, 220, 60)
    ctx.fillStyle = '#22d3ee'
    ctx.textAlign = 'left'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText(`p₁ (phase 1) — solid`, PAD_L + 14, PAD_T + 22)
    ctx.fillStyle = '#f97316'
    ctx.fillText(`p₂ (phase 2) — dashed`, PAD_L + 14, PAD_T + 38)
    ctx.fillStyle = 'rgba(203,213,225,0.85)'
    ctx.fillText(`step ${step.toString().padStart(4)} | ⟨|p₁−p₂|⟩ = ${(gap / 1e5).toFixed(3)} bar`, PAD_L + 14, PAD_T + 56)
  }, [tick])

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <canvas ref={canvasRef} className="block w-full max-w-full" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Slider label={`Z₁ = ${(Z1 / 1e6).toFixed(2)} MPa·s/m`} value={Z1} min={1e3} max={5e6} step={1e3} onChange={setZ1} />
        <Slider label={`Z₂ = ${(Z2 / 1e3).toFixed(2)} kPa·s/m`} value={Z2} min={1e2} max={5e6} step={1e2} onChange={setZ2} />
        <Slider label={`μ·Δt = ${muDt.toFixed(3)}`} value={muDt} min={0} max={1} step={0.005} onChange={setMuDt} />
        <Slider label={`p₁(left) = ${(pL1 / 1e5).toFixed(2)} bar`} value={pL1} min={1e4} max={6e5} step={1e4} onChange={setPL1} />
        <Slider label={`p₂(left) = ${(pL2 / 1e5).toFixed(2)} bar`} value={pL2} min={1e4} max={6e5} step={1e4} onChange={setPL2} />
        <Slider label={`p₁(right) = ${(pR1 / 1e5).toFixed(2)} bar`} value={pR1} min={1e4} max={6e5} step={1e4} onChange={setPR1} />
        <Slider label={`p₂(right) = ${(pR2 / 1e5).toFixed(2)} bar`} value={pR2} min={1e4} max={6e5} step={1e4} onChange={setPR2} />
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {running ? 'pause' : 'resume'}
        </button>
        <button
          type="button"
          onClick={() => { stateRef.current = initState(pL1, pL2, pR1, pR2); setTick((t) => t + 1) }}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          reset
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Stiff relaxation drives both p₁ and p₂ toward the impedance-weighted average p̂ᴵ = (Z₂p₁ + Z₁p₂)/(Z₁+Z₂). Increase μ·Δt for faster pull-in.
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
