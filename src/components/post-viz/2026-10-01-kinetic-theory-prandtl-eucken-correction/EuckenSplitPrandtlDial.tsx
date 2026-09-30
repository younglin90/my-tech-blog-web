'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 680
const H = 348
const CH = { left: 62, right: 330, top: 34, bottom: 272 }
const CP = 1005

type Gas = { name: string; gamma: number; measured: number }

const GASES: Gas[] = [
  { name: 'He', gamma: 1.667, measured: 0.68 },
  { name: 'Air', gamma: 1.4, measured: 0.707 },
  { name: 'CO₂', gamma: 1.289, measured: 0.77 },
  { name: 'H₂O', gamma: 1.329, measured: 0.98 },
]

const prMeanFreePath = (gamma: number) => gamma
const prEucken = (gamma: number) => (4 * gamma) / (9 * gamma - 5)

export function EuckenSplitPrandtlDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gasIndex, setGasIndex] = useState(1)
  const [gamma, setGamma] = useState(1.4)
  const [speed, setSpeed] = useState(600)
  const [eucken, setEucken] = useState(true)
  const [running, setRunning] = useState(true)
  const phaseRef = useRef(0)

  const gas = GASES[gasIndex]
  const derived = useMemo(() => {
    const a = prMeanFreePath(gamma)
    const b = prEucken(gamma)
    const scale = (speed * speed) / (2 * CP)
    return { prA: a, prB: b, riseA: a * scale, riseB: b * scale, riseM: gas.measured * scale, scale }
  }, [gamma, speed, gas.measured])

  useEffect(() => {
    setGamma(GASES[gasIndex].gamma)
  }, [gasIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const maxRise = 330

    const profile = (pr: number, color: string, dashed: boolean, label: string) => {
      const peak = (pr * derived.scale) / maxRise
      ctx.strokeStyle = color
      ctx.lineWidth = 2.2
      ctx.setLineDash(dashed ? [5, 4] : [])
      ctx.beginPath()
      for (let i = 0; i <= 60; i += 1) {
        const yn = i / 60
        const t = peak * (1 - yn * yn)
        const px = CH.left + t * (CH.right - CH.left)
        const py = CH.bottom - yn * (CH.bottom - CH.top)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
      const tipX = CH.left + peak * (CH.right - CH.left)
      ctx.beginPath()
      ctx.arc(tipX, CH.bottom, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(label, Math.min(tipX + 7, CH.right - 92), CH.bottom - 7)
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = '#f8fafc'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Couette shear layer — viscous heating scales with Pr', 18, 20)

      ctx.strokeStyle = 'rgba(148,163,184,0.65)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(CH.left, CH.top)
      ctx.lineTo(CH.left, CH.bottom)
      ctx.lineTo(CH.right, CH.bottom)
      ctx.stroke()

      ctx.fillStyle = 'rgba(203,213,225,0.85)'
      ctx.font = '10px ui-sans-serif, system-ui'
      for (let t = 0; t <= 3; t += 1) {
        const px = CH.left + ((CH.right - CH.left) * t) / 3
        ctx.strokeStyle = 'rgba(148,163,184,0.3)'
        ctx.beginPath()
        ctx.moveTo(px, CH.top)
        ctx.lineTo(px, CH.bottom)
        ctx.stroke()
        ctx.textAlign = 'center'
        ctx.fillText(((maxRise * t) / 3).toFixed(0), px, CH.bottom + 14)
      }
      ctx.textAlign = 'center'
      ctx.fillText('T − T_wall  [K]', (CH.left + CH.right) / 2, CH.bottom + 30)
      ctx.save()
      ctx.translate(26, (CH.top + CH.bottom) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('y / H   (0 = adiabatic wall)', 0, 0)
      ctx.restore()

      ctx.fillStyle = 'rgba(203,213,225,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText(`moving wall  u = ${speed} m/s`, CH.left + 4, CH.top - 8)
      ctx.fillText('adiabatic wall  u = 0,  q = 0', CH.left + 4, CH.bottom + 46)

      const phase = phaseRef.current
      for (let i = 1; i <= 7; i += 1) {
        const yn = i / 8
        const py = CH.bottom - yn * (CH.bottom - CH.top)
        const span = CH.right - CH.left - 18
        const off = (phase * yn * 2.4) % 26
        ctx.strokeStyle = 'rgba(56,189,248,0.32)'
        ctx.setLineDash([9, 17])
        ctx.lineDashOffset = -off
        ctx.beginPath()
        ctx.moveTo(CH.left + 2, py)
        ctx.lineTo(CH.left + 2 + span, py)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineDashOffset = 0
        const hx = CH.left + 2 + ((phase * yn * 2.4) % span)
        ctx.fillStyle = 'rgba(56,189,248,0.85)'
        ctx.beginPath()
        ctx.arc(hx, py, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      profile(gas.measured, 'rgba(250,204,21,0.95)', true, `measured  Pr=${gas.measured.toFixed(3)}`)
      profile(derived.prA, 'rgba(248,113,113,0.95)', false, `mean-free-path  Pr=${derived.prA.toFixed(3)}`)
      if (eucken) profile(derived.prB, 'rgba(96,165,250,0.95)', false, `Eucken  Pr=${derived.prB.toFixed(3)}`)

      const bx = 384
      ctx.fillStyle = '#f8fafc'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`γ = ${gamma.toFixed(3)}   ${gas.name}`, bx, 20)

      const rows: [string, number, string][] = [
        ['Pr = γ            (μ, k same route)', derived.prA, 'rgba(248,113,113,0.9)'],
        ['Pr = 4γ/(9γ−5)   (Eucken)', derived.prB, 'rgba(96,165,250,0.9)'],
        ['measured', gas.measured, 'rgba(250,204,21,0.9)'],
      ]
      rows.forEach(([label, value, color], i) => {
        const y = 44 + i * 46
        const bw = 258
        ctx.fillStyle = 'rgba(148,163,184,0.85)'
        ctx.font = '10px ui-sans-serif, system-ui'
        ctx.fillText(label, bx, y - 5)
        ctx.fillStyle = 'rgba(148,163,184,0.18)'
        ctx.fillRect(bx, y, bw, 15)
        ctx.fillStyle = color
        ctx.fillRect(bx, y, Math.min(1, value / 1.8) * bw, 15)
        ctx.strokeStyle = 'rgba(250,204,21,0.9)'
        ctx.lineWidth = 1.5
        const mx = bx + Math.min(1, gas.measured / 1.8) * bw
        ctx.beginPath()
        ctx.moveTo(mx, y - 2)
        ctx.lineTo(mx, y + 17)
        ctx.stroke()
        ctx.fillStyle = '#e2e8f0'
        ctx.font = '11px ui-mono, monospace'
        ctx.fillText(value.toFixed(3), bx + bw + 6, y + 12)
      })
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '9px ui-sans-serif, system-ui'
      ctx.fillText('vertical tick = measured Pr', bx, 44 + 3 * 46 - 12)

      const cx = bx + 44
      const cy = 258
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(bx, 216, 258, 108)
      ctx.fillStyle = 'rgba(203,213,225,0.9)'
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.fillText(eucken ? 'internal energy hops 9/4 × faster' : 'all energy hops at one speed', bx + 6, 232)
      const spin = phase * (eucken ? 0.09 : 0.04)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(spin)
      ctx.strokeStyle = 'rgba(167,139,250,0.95)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-14, 0)
      ctx.lineTo(14, 0)
      ctx.stroke()
      ctx.fillStyle = 'rgba(167,139,250,0.95)'
      ctx.beginPath()
      ctx.arc(-14, 0, 5, 0, Math.PI * 2)
      ctx.arc(14, 0, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = 'rgba(148,163,184,0.85)'
      ctx.font = '9px ui-sans-serif, system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('rotation', cx, cy + 28)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText(`ΔT at adiabatic wall`, bx + 92, 254)
      ctx.font = '11px ui-mono, monospace'
      ctx.fillStyle = 'rgba(248,113,113,0.95)'
      ctx.fillText(`Pr=γ      ${derived.riseA.toFixed(1)} K`, bx + 92, 270)
      if (eucken) {
        ctx.fillStyle = 'rgba(96,165,250,0.95)'
        ctx.fillText(`Eucken    ${derived.riseB.toFixed(1)} K`, bx + 92, 286)
      }
      ctx.fillStyle = 'rgba(250,204,21,0.95)'
      ctx.fillText(`measured  ${derived.riseM.toFixed(1)} K`, bx + 92, 302)
      ctx.fillStyle = 'rgba(203,213,225,0.9)'
      ctx.fillText(`gap       ${(derived.riseA - derived.riseM).toFixed(1)} K`, bx + 92, 318)
    }

    const loop = () => {
      if (running) phaseRef.current += 1
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gamma, speed, eucken, running, gas, derived])

  return (
    <div className="my-6 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded" style={{ maxWidth: '100%' }} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <div className="flex gap-1">
          {GASES.map((g, i) => (
            <button
              key={g.name}
              type="button"
              onClick={() => setGasIndex(i)}
              className={`rounded border px-2 py-1 ${
                i === gasIndex ? 'border-sky-400 bg-sky-900/40 text-sky-200' : 'border-slate-600 hover:bg-slate-800'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">γ {gamma.toFixed(3)}</span>
          <input
            type="range"
            min={1.1}
            max={1.667}
            step={0.001}
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="w-32"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">wall speed {speed} m/s</span>
          <input
            type="range"
            min={200}
            max={1200}
            step={20}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-32"
          />
        </label>
        <button
          type="button"
          onClick={() => setEucken((v) => !v)}
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        >
          {eucken ? 'Eucken on' : 'Eucken off'}
        </button>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        >
          {running ? 'pause' : 'run'}
        </button>
      </div>
    </div>
  )
}
