'use client'

import { useEffect, useRef, useState } from 'react'

const W = 680
const H = 372
const NX = 160
const D = 4
const MOB = 1 / 3
const DT = 0.2
const SIG12 = 1
const COLORS = ['#38bdf8', '#fbbf24', '#f87171']
const NAMES = ['c1', 'c2', 'c3']

type Closure = 'independent' | 'projected'

const ext = (a: Float64Array, i: number) => a[i < 0 ? 0 : i > NX - 1 ? NX - 1 : i]

function makeField(seed: number) {
  const c = [new Float64Array(NX), new Float64Array(NX), new Float64Array(NX)]
  for (let i = 0; i < NX; i += 1) {
    const x = i - NX / 2
    const c3 = seed * Math.exp(-((x / D) ** 2))
    c[2][i] = c3
    c[0][i] = 0.5 * (1 - Math.tanh((2 * x) / D)) * (1 - c3)
    c[1][i] = 0.5 * (1 + Math.tanh((2 * x) / D)) * (1 - c3)
  }
  return c
}

export function TernaryLeakProfileLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [sigma13, setSigma13] = useState(0.8)
  const [lambda3, setLambda3] = useState(0)
  const [closure, setClosure] = useState<Closure>('projected')
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [readout, setReadout] = useState({ step: 0, drift: 0, c3: 0, sigma: 0, kappa3: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s12 = SIG12
    const s13 = sigma13
    const s23 = sigma13
    const kap = [
      0.75 * D * (s12 + s13 - s23),
      0.75 * D * (s12 + s23 - s13),
      0.75 * D * (s13 + s23 - s12),
    ]
    const b12 = (12 / D) * s12
    const b13 = (12 / D) * s13
    const b23 = (12 / D) * s23

    let c = makeField(1e-3)
    let step = 0
    let frame = 0
    let raf = 0
    let blown = false

    const mu = [new Float64Array(NX), new Float64Array(NX), new Float64Array(NX)]

    const advance = () => {
      const [c1, c2, c3] = c
      for (let i = 0; i < NX; i += 1) {
        const a = c1[i]
        const b = c2[i]
        const d = c3[i]
        const l1 = ext(c1, i - 1) - 2 * a + ext(c1, i + 1)
        const l2 = ext(c2, i - 1) - 2 * b + ext(c2, i + 1)
        const l3 = ext(c3, i - 1) - 2 * d + ext(c3, i + 1)
        mu[0][i] = 2 * b12 * a * b * b + 2 * b13 * a * d * d + 2 * lambda3 * a * (b * d) ** 2 - kap[0] * l1
        mu[1][i] = 2 * b12 * b * a * a + 2 * b23 * b * d * d + 2 * lambda3 * b * (a * d) ** 2 - kap[1] * l2
        mu[2][i] = 2 * b13 * d * a * a + 2 * b23 * d * b * b + 2 * lambda3 * d * (a * b) ** 2 - kap[2] * l3
      }
      for (let i = 0; i < NX; i += 1) {
        const shift = closure === 'projected' ? (mu[0][i] + mu[1][i] + mu[2][i]) / 3 : 0
        for (let k = 0; k < 3; k += 1) c[k][i] -= MOB * DT * (mu[k][i] - shift)
      }
      step += 1
      if (!Number.isFinite(c[0][NX >> 1]) || Math.abs(c[0][NX >> 1]) > 1e3) blown = true
    }

    const metrics = () => {
      let drift = 0
      let c3max = 0
      let energy = 0
      for (let i = 0; i < NX; i += 1) {
        const a = c[0][i]
        const b = c[1][i]
        const d = c[2][i]
        drift = Math.max(drift, Math.abs(a + b + d - 1))
        c3max = Math.max(c3max, d)
        energy += b12 * (a * b) ** 2 + b13 * (a * d) ** 2 + b23 * (b * d) ** 2 + lambda3 * (a * b * d) ** 2
        for (let k = 0; k < 3; k += 1) {
          const g = (ext(c[k], i + 1) - ext(c[k], i - 1)) / 2
          energy += 0.5 * kap[k] * g * g
        }
      }
      return { drift, c3max, energy }
    }

    const PX0 = 54
    const PX1 = W - 150
    const TOP = 42
    const BOT = 214
    const SB0 = 258
    const SB1 = 344

    const px = (i: number) => PX0 + (i / (NX - 1)) * (PX1 - PX0)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = '#f8fafc'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Three-component Allen-Cahn: a 1-2 interface with phase 3 seeded at 1e-3', 16, 20)

      ctx.strokeStyle = 'rgba(148,163,184,0.6)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PX0, TOP)
      ctx.lineTo(PX0, BOT)
      ctx.lineTo(PX1, BOT)
      ctx.stroke()
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'right'
      ctx.fillText('1.0', PX0 - 6, TOP + 4)
      ctx.fillText('0.5', PX0 - 6, (TOP + BOT) / 2 + 4)
      ctx.fillText('0.0', PX0 - 6, BOT + 4)
      ctx.textAlign = 'center'
      ctx.fillText('x / lattice cells', (PX0 + PX1) / 2, BOT + 16)
      ctx.save()
      ctx.translate(16, (TOP + BOT) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('volume fraction', 0, 0)
      ctx.restore()

      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.beginPath()
      ctx.moveTo(PX0, (TOP + BOT) / 2)
      ctx.lineTo(PX1, (TOP + BOT) / 2)
      ctx.stroke()

      ctx.fillStyle = 'rgba(248,113,113,0.22)'
      ctx.beginPath()
      ctx.moveTo(px(0), BOT)
      for (let i = 0; i < NX; i += 1) {
        const v = Math.max(0, Math.min(1.2, c[2][i]))
        ctx.lineTo(px(i), BOT - v * (BOT - TOP))
      }
      ctx.lineTo(px(NX - 1), BOT)
      ctx.closePath()
      ctx.fill()

      for (let k = 0; k < 3; k += 1) {
        ctx.strokeStyle = COLORS[k]
        ctx.lineWidth = k === 2 ? 2.4 : 1.8
        ctx.beginPath()
        for (let i = 0; i < NX; i += 1) {
          const v = Math.max(-0.2, Math.min(1.2, c[k][i]))
          const y = BOT - v * (BOT - TOP)
          if (i === 0) ctx.moveTo(px(i), y)
          else ctx.lineTo(px(i), y)
        }
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(148,163,184,0.6)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PX0, (SB0 + SB1) / 2)
      ctx.lineTo(PX1, (SB0 + SB1) / 2)
      ctx.stroke()
      const m = metrics()
      const scale = Math.max(1e-3, m.drift) * 1.3
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let i = 0; i < NX; i += 1) {
        const s = c[0][i] + c[1][i] + c[2][i] - 1
        const y = (SB0 + SB1) / 2 - (s / scale) * ((SB1 - SB0) / 2)
        if (i === 0) ctx.moveTo(px(i), Math.max(SB0, Math.min(SB1, y)))
        else ctx.lineTo(px(i), Math.max(SB0, Math.min(SB1, y)))
      }
      ctx.stroke()
      ctx.fillStyle = '#c4b5fd'
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`sum c_i - 1   (full scale +/-${scale.toExponential(1)})`, PX0, SB0 - 8)

      const lx = PX1 + 16
      ctx.textAlign = 'left'
      ctx.font = '11px ui-sans-serif, system-ui'
      for (let k = 0; k < 3; k += 1) {
        ctx.fillStyle = COLORS[k]
        ctx.fillRect(lx, TOP + 2 + k * 18, 10, 3)
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(NAMES[k], lx + 16, TOP + 7 + k * 18)
      }
      const rows: [string, string][] = [
        ['sigma_12', s12.toFixed(2)],
        ['sigma_13=23', s13.toFixed(2)],
        ['kappa_3', kap[2].toFixed(2)],
        ['Lambda', lambda3.toFixed(0)],
        ['step', String(step)],
        ['max c_3', m.c3max.toFixed(3)],
        ['|sum-1|', m.drift.toExponential(1)],
        ['sigma_eff', blown ? 'blown' : m.energy.toFixed(3)],
      ]
      rows.forEach(([k, v], i) => {
        const y = TOP + 72 + i * 17
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(k, lx, y)
        ctx.fillStyle = k === 'sigma_eff' ? '#fde68a' : '#e2e8f0'
        ctx.textAlign = 'right'
        ctx.fillText(v, W - 14, y)
        ctx.textAlign = 'left'
      })
      if (kap[2] <= 0) {
        ctx.fillStyle = '#fca5a5'
        ctx.fillText('kappa_3 < 0: ill-posed', lx, TOP + 72 + 8 * 17 + 6)
      }
      return m
    }

    const loop = () => {
      if (running && !blown) for (let s = 0; s < 25; s += 1) advance()
      const m = draw()
      frame += 1
      if (frame % 12 === 0) {
        setReadout({ step, drift: m.drift, c3: m.c3max, sigma: m.energy, kappa3: kap[2] })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [sigma13, lambda3, closure, running, resetKey])

  return (
    <div className="my-6 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded" style={{ maxWidth: '100%' }} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <div className="flex gap-1">
          {(['independent', 'projected'] as Closure[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setClosure(m)
                setResetKey((k) => k + 1)
              }}
              className={`rounded border px-2 py-1 ${
                closure === m ? 'border-sky-400 bg-sky-900/40 text-sky-200' : 'border-slate-600 hover:bg-slate-800'
              }`}
            >
              {m === 'independent' ? '3 equations, no closure' : 'mean projection'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span>sigma_13 = sigma_23 {sigma13.toFixed(2)}</span>
          <input
            type="range"
            min={0.3}
            max={1.2}
            step={0.05}
            value={sigma13}
            onChange={(e) => {
              setSigma13(Number(e.target.value))
              setResetKey((k) => k + 1)
            }}
            className="w-28"
          />
        </label>
        <label className="flex items-center gap-2">
          <span>triple penalty Lambda {lambda3.toFixed(0)}</span>
          <input
            type="range"
            min={0}
            max={400}
            step={10}
            value={lambda3}
            onChange={(e) => {
              setLambda3(Number(e.target.value))
              setResetKey((k) => k + 1)
            }}
            className="w-28"
          />
        </label>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        >
          {running ? 'pause' : 'run'}
        </button>
        <button
          type="button"
          onClick={() => setResetKey((k) => k + 1)}
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        >
          reset
        </button>
        <span className="text-slate-400">
          step {readout.step} · max c_3 {readout.c3.toFixed(3)} · sigma_eff {readout.sigma.toFixed(3)} (input 1.00)
        </span>
      </div>
    </div>
  )
}
