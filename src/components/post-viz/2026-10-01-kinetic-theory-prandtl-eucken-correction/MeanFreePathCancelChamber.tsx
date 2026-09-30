'use client'

import { useEffect, useRef, useState } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; carried: number }

const W = 680
const H = 330
const BOX = { left: 46, right: 330, top: 26, bottom: 288 }
const MID = (BOX.top + BOX.bottom) / 2
const LAM0 = 270
const SPEED = 2.6
const WINDOW = 100

const tField = (y: number) => (BOX.bottom - y) / (BOX.bottom - BOX.top)

const heatColor = (t: number) => {
  const c = Math.max(0, Math.min(1, t))
  const r = Math.round(60 + 185 * c)
  const g = Math.round(110 + 40 * (1 - Math.abs(c - 0.5) * 2))
  const b = Math.round(235 - 190 * c)
  return `rgb(${r},${g},${b})`
}

export function MeanFreePathCancelChamber() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const partsRef = useRef<Particle[]>([])
  const accRef = useRef({ steps: 0, crossings: 0, flux: 0 })
  const smoothRef = useRef({ rate: 0, khat: 0 })
  const [density, setDensity] = useState(4)
  const [running, setRunning] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [readout, setReadout] = useState({ rate: 0, lam: LAM0 / 4, khat: 0, n: 0 })

  const lamPx = LAM0 / density
  const count = Math.round(18 * density)

  useEffect(() => {
    const seeded: Particle[] = []
    for (let i = 0; i < count; i += 1) {
      const y = BOX.top + Math.random() * (BOX.bottom - BOX.top)
      const a = Math.random() * Math.PI * 2
      seeded.push({
        x: BOX.left + Math.random() * (BOX.right - BOX.left),
        y,
        vx: Math.cos(a) * SPEED,
        vy: Math.sin(a) * SPEED,
        carried: tField(y),
      })
    }
    partsRef.current = seeded
    accRef.current = { steps: 0, crossings: 0, flux: 0 }
    smoothRef.current = { rate: 0, khat: 0 }
  }, [count])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0

    const step = () => {
      const parts = partsRef.current
      const pColl = Math.min(1, SPEED / lamPx)
      for (const p of parts) {
        const before = p.y
        p.x += p.vx
        p.y += p.vy
        if (p.x < BOX.left) { p.x = BOX.left; p.vx = -p.vx }
        if (p.x > BOX.right) { p.x = BOX.right; p.vx = -p.vx }
        if (p.y < BOX.top) { p.y = BOX.top; p.vy = -p.vy; p.carried = tField(BOX.top) }
        if (p.y > BOX.bottom) { p.y = BOX.bottom; p.vy = -p.vy; p.carried = tField(BOX.bottom) }
        if ((before - MID) * (p.y - MID) < 0) {
          accRef.current.crossings += 1
          accRef.current.flux += p.y > before ? p.carried : -p.carried
        }
        if (Math.random() < pColl) {
          const a = Math.random() * Math.PI * 2
          p.vx = Math.cos(a) * SPEED
          p.vy = Math.sin(a) * SPEED
          p.carried = tField(p.y)
        }
      }
      accRef.current.steps += 1
      if (accRef.current.steps >= WINDOW) {
        const s = smoothRef.current
        s.rate = s.rate === 0 ? accRef.current.crossings : 0.82 * s.rate + 0.18 * accRef.current.crossings
        s.khat = s.khat === 0 ? accRef.current.flux : 0.82 * s.khat + 0.18 * accRef.current.flux
        accRef.current = { steps: 0, crossings: 0, flux: 0 }
      }
    }

    const bar = (x: number, y: number, value: number, full: number, label: string, unit: string, color: string) => {
      const bw = 250
      ctx.fillStyle = 'rgba(148,163,184,0.18)'
      ctx.fillRect(x, y, bw, 16)
      ctx.fillStyle = color
      ctx.fillRect(x, y, Math.max(1, Math.min(1, value / full) * bw), 16)
      ctx.strokeStyle = 'rgba(100,116,139,0.55)'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, bw, 16)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(label, x, y - 5)
      ctx.textAlign = 'right'
      ctx.fillText(unit, x + bw, y - 5)
      for (let t = 0; t <= 4; t += 1) {
        const tx = x + (bw * t) / 4
        ctx.strokeStyle = 'rgba(148,163,184,0.45)'
        ctx.beginPath()
        ctx.moveTo(tx, y + 16)
        ctx.lineTo(tx, y + 21)
        ctx.stroke()
        ctx.fillStyle = 'rgba(203,213,225,0.75)'
        ctx.font = '9px ui-sans-serif, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(((full * t) / 4).toFixed(full >= 100 ? 0 : 1), tx, y + 31)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const grad = ctx.createLinearGradient(0, BOX.top, 0, BOX.bottom)
      grad.addColorStop(0, 'rgba(239,68,68,0.20)')
      grad.addColorStop(1, 'rgba(59,130,246,0.20)')
      ctx.fillStyle = grad
      ctx.fillRect(BOX.left, BOX.top, BOX.right - BOX.left, BOX.bottom - BOX.top)
      ctx.strokeStyle = 'rgba(148,163,184,0.6)'
      ctx.lineWidth = 1
      ctx.strokeRect(BOX.left, BOX.top, BOX.right - BOX.left, BOX.bottom - BOX.top)

      ctx.setLineDash([5, 4])
      ctx.strokeStyle = 'rgba(250,204,21,0.85)'
      ctx.beginPath()
      ctx.moveTo(BOX.left, MID)
      ctx.lineTo(BOX.right, MID)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('hot wall  T = 1', BOX.left + 4, BOX.top - 8)
      ctx.fillText('cold wall  T = 0', BOX.left + 4, BOX.bottom + 16)
      ctx.fillStyle = 'rgba(250,204,21,0.95)'
      ctx.fillText('tally plane', BOX.right - 74, MID - 6)

      ctx.save()
      ctx.translate(18, (BOX.top + BOX.bottom) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = 'rgba(203,213,225,0.8)'
      ctx.textAlign = 'center'
      ctx.fillText('y  (wall gap H = 262 px)', 0, 0)
      ctx.restore()

      if (showPath) {
        ctx.strokeStyle = 'rgba(34,197,94,0.9)'
        ctx.lineWidth = 2
        const y0 = MID + 46
        ctx.beginPath()
        ctx.moveTo(BOX.left + 14, y0)
        ctx.lineTo(BOX.left + 14 + Math.min(lamPx, BOX.right - BOX.left - 28), y0)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(BOX.left + 14, y0, 3, 0, Math.PI * 2)
        ctx.arc(BOX.left + 14 + Math.min(lamPx, BOX.right - BOX.left - 28), y0, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34,197,94,0.9)'
        ctx.fill()
        ctx.fillStyle = 'rgba(134,239,172,0.95)'
        ctx.font = '10px ui-sans-serif, system-ui'
        ctx.fillText(`mean free path  λ = ${lamPx.toFixed(0)} px`, BOX.left + 14, y0 - 7)
      }

      for (const p of partsRef.current) {
        ctx.fillStyle = heatColor(p.carried)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      const s = smoothRef.current
      bar(370, 66, partsRef.current.length, 150, 'particle count  n', '150', 'rgba(56,189,248,0.85)')
      bar(370, 128, s.rate, 120, `plane crossings per ${WINDOW} steps  ∝ n c̄/4`, '120', 'rgba(56,189,248,0.85)')
      bar(370, 190, lamPx, LAM0, 'mean free path  λ  ∝ 1/n', `${LAM0}`, 'rgba(34,197,94,0.85)')
      bar(370, 252, s.khat, 8, 'measured heat flux  k̂  ∝ n·λ', '8', 'rgba(250,204,21,0.9)')

      ctx.fillStyle = '#f8fafc'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('two factors fight, one bar stays put', 370, 30)
      ctx.fillStyle = 'rgba(203,213,225,0.8)'
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.fillText('dot color = temperature carried from its last collision', 370, 46)
    }

    const loop = () => {
      if (running) {
        step()
        step()
      }
      draw()
      frame += 1
      if (frame % 12 === 0) {
        setReadout({
          rate: smoothRef.current.rate,
          lam: lamPx,
          khat: smoothRef.current.khat,
          n: partsRef.current.length,
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [lamPx, running, showPath])

  return (
    <div className="my-6 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded" style={{ maxWidth: '100%' }} />
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">number density n × {density}</span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-44"
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
          onClick={() => setShowPath((v) => !v)}
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        >
          {showPath ? 'hide λ ruler' : 'show λ ruler'}
        </button>
        <span className="font-mono">
          n={readout.n} · λ={readout.lam.toFixed(0)}px · crossings={readout.rate.toFixed(0)} · k̂={readout.khat.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
