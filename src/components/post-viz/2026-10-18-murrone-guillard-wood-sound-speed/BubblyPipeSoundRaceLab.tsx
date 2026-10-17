'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 470
const G = [1.4, 4.4]
const PI = [0, 6.0e8]
const P0 = 1.0e5
const RHO = [1.2, 1000]
const L = 10 // tube length [m]

// slider t in [0,1] -> air fraction on a logit scale (1e-4 ... 1-1e-4)
const alphaOf = (t: number) => 1 / (1 + Math.pow(10, -(8 * t - 4)))
const tOf = (a: number) => (Math.log10(a / (1 - a)) + 4) / 8

function woodSpeed(a: number) {
  const rho = a * RHO[0] + (1 - a) * RHO[1]
  const comp = a / (G[0] * (P0 + PI[0])) + (1 - a) / (G[1] * (P0 + PI[1]))
  return 1 / Math.sqrt(rho * comp)
}
function isobaricSpeed(a: number) {
  const rho = a * RHO[0] + (1 - a) * RHO[1]
  const xi = a / (G[0] - 1) + (1 - a) / (G[1] - 1)
  const gpi = (a * G[0] * PI[0]) / (G[0] - 1) + ((1 - a) * G[1] * PI[1]) / (G[1] - 1)
  const gam = 1 + 1 / xi
  return Math.sqrt((gam * (P0 + gpi / xi / gam)) / rho)
}
function kapilaK(a: number) {
  const k1 = G[0] * (P0 + PI[0]), k2 = G[1] * (P0 + PI[1])
  return (a * (1 - a) * (k2 - k1)) / (a * k2 + (1 - a) * k1)
}

// fixed pseudo-random bubble positions
const BUBBLES = Array.from({ length: 400 }, (_, i) => {
  const r = Math.sin(i * 12.9898) * 43758.5453
  const q = Math.sin(i * 78.233) * 12543.123
  return [r - Math.floor(r), q - Math.floor(q)]
})

const PLOT = { x0: 70, x1: 730, y0: 30, y1: 220 }
const yOf = (c: number) => PLOT.y1 - ((Math.log10(c) - 1) / (Math.log10(2000) - 1)) * (PLOT.y1 - PLOT.y0)
const xOf = (t: number) => PLOT.x0 + t * (PLOT.x1 - PLOT.x0)

export function BubblyPipeSoundRaceLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [t, setT] = useState(0.5)
  const [slow, setSlow] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [showFrozen, setShowFrozen] = useState(true)
  const [shot, setShot] = useState(0)
  const [readout, setReadout] = useState({ time: 0, lapsK: 0, lapsF: 0 })
  const live = useRef({ t, slow, playing, showFrozen })
  live.current = { t, slow, playing, showFrozen }

  const a = alphaOf(t)
  const cW = woodSpeed(a)
  const cF = isobaricSpeed(a)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let simT = 0 // physical time [s]
    let last = performance.now()

    const tube = (y: number, c: number, label: string, col: string, a1: number, time: number) => {
      const x0 = 70, x1 = 730, h = 46
      const front = (c * time) % L
      ctx.fillStyle = 'rgba(56,120,200,0.10)'
      ctx.fillRect(x0, y, x1 - x0, h)
      // pressure pulse as a glow (right-going, wraps around)
      for (let px = 0; px <= x1 - x0; px += 2) {
        const xm = (px / (x1 - x0)) * L
        let d = Math.abs(xm - front)
        d = Math.min(d, L - d)
        const amp = Math.exp(-((d / 0.35) ** 2))
        if (amp > 0.02) {
          ctx.fillStyle = `rgba(${col},${0.85 * amp})`
          ctx.fillRect(x0 + px, y, 2, h)
        }
      }
      const nb = Math.round(Math.min(400, 400 * Math.pow(a1, 0.35)))
      for (let i = 0; i < nb; i++) {
        const bx = BUBBLES[i][0] * L
        let d = Math.abs(bx - front)
        d = Math.min(d, L - d)
        const squeeze = 1 - 0.45 * Math.exp(-((d / 0.35) ** 2))
        ctx.beginPath()
        ctx.arc(x0 + BUBBLES[i][0] * (x1 - x0), y + 5 + BUBBLES[i][1] * (h - 10), 2.6 * squeeze, 0, 2 * Math.PI)
        ctx.strokeStyle = 'rgba(30,60,110,0.55)'
        ctx.stroke()
      }
      ctx.strokeStyle = '#888'
      ctx.strokeRect(x0, y, x1 - x0, h)
      ctx.fillStyle = '#333'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${label}: c = ${c.toFixed(1)} m/s`, x0, y - 6)
      return Math.floor((c * time) / L)
    }

    const draw = () => {
      const { t: tt, slow: sl, playing: pl, showFrozen: sf } = live.current
      const now = performance.now()
      const dtw = Math.min(0.05, (now - last) / 1000)
      last = now
      if (pl) simT += dtw / sl
      const a1 = alphaOf(tt)
      const cw = woodSpeed(a1), cf = isobaricSpeed(a1)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, W, H)
      // axes
      ctx.strokeStyle = '#bbb'
      ctx.lineWidth = 1
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#555'
      ctx.textAlign = 'right'
      for (const c of [10, 30, 100, 300, 1000]) {
        const y = yOf(c)
        ctx.beginPath(); ctx.moveTo(PLOT.x0, y); ctx.lineTo(PLOT.x1, y); ctx.strokeStyle = '#eee'; ctx.stroke()
        ctx.fillText(String(c), PLOT.x0 - 6, y + 4)
      }
      ctx.textAlign = 'center'
      for (const av of [1e-4, 1e-3, 0.01, 0.1, 0.5, 0.9, 0.99, 0.999, 0.9999]) {
        const x = xOf(tOf(av))
        ctx.beginPath(); ctx.moveTo(x, PLOT.y0); ctx.lineTo(x, PLOT.y1); ctx.strokeStyle = '#f2f2f2'; ctx.stroke()
        ctx.fillText(String(av), x, PLOT.y1 + 14)
      }
      ctx.fillText('air volume fraction α (logit scale)', (PLOT.x0 + PLOT.x1) / 2, PLOT.y1 + 30)
      ctx.save(); ctx.translate(18, (PLOT.y0 + PLOT.y1) / 2); ctx.rotate(-Math.PI / 2)
      ctx.fillText('sound speed c [m/s] (log)', 0, 0); ctx.restore()
      ctx.strokeStyle = '#999'
      ctx.strokeRect(PLOT.x0, PLOT.y0, PLOT.x1 - PLOT.x0, PLOT.y1 - PLOT.y0)
      // reference lines: pure water, pure air
      ctx.setLineDash([4, 4])
      for (const [c, lab] of [[1624.9, 'pure water'], [341.6, 'pure air']] as [number, string][]) {
        ctx.beginPath(); ctx.moveTo(PLOT.x0, yOf(c)); ctx.lineTo(PLOT.x1, yOf(c)); ctx.strokeStyle = '#aaa'; ctx.stroke()
        ctx.textAlign = 'left'; ctx.fillStyle = '#888'; ctx.fillText(lab, PLOT.x0 + 4, yOf(c) - 3)
      }
      ctx.setLineDash([])
      const curve = (f: (x: number) => number, col: string) => {
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const s = i / 200, x = xOf(s), y = yOf(f(alphaOf(s)))
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke(); ctx.lineWidth = 1
      }
      curve(woodSpeed, '#1f6fd1')
      if (sf) curve(isobaricSpeed, '#e07b1a')
      const mx = xOf(tt)
      ctx.beginPath(); ctx.moveTo(mx, PLOT.y0); ctx.lineTo(mx, PLOT.y1); ctx.strokeStyle = '#d33'; ctx.stroke()
      for (const [c, col] of (sf ? [[cw, '#1f6fd1'], [cf, '#e07b1a']] : [[cw, '#1f6fd1']]) as [number, string][]) {
        ctx.beginPath(); ctx.arc(mx, yOf(c), 5, 0, 2 * Math.PI); ctx.fillStyle = col; ctx.fill()
      }
      ctx.textAlign = 'right'; ctx.font = '12px sans-serif'
      ctx.fillStyle = '#1f6fd1'; ctx.fillText('5-eq. with K∇·u (Wood)', PLOT.x1 - 6, PLOT.y0 + 16)
      if (sf) { ctx.fillStyle = '#e07b1a'; ctx.fillText('K = 0 (α only advected)', PLOT.x1 - 6, PLOT.y0 + 32) }

      const lk = tube(290, cw, 'Tube A — with K', '31,111,209', a1, simT)
      const lf = sf ? tube(385, cf, 'Tube B — K = 0', '224,123,26', a1, simT) : 0
      ctx.fillStyle = '#555'; ctx.textAlign = 'left'; ctx.font = '11px sans-serif'
      ctx.fillText(`tube length ${L} m, pulse travels left → right and wraps`, 70, H - 6)

      if (++frame % 12 === 0) setReadout({ time: simT, lapsK: lk, lapsF: lf })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [shot])

  const ratio = cF / cW
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-3 dark:border-gray-700">
      <canvas ref={ref} width={W} height={H} className="h-auto w-full rounded bg-white" />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex flex-col">
          <span>air volume fraction α = {a < 0.01 || a > 0.99 ? a.toExponential(2) : a.toFixed(3)}</span>
          <input type="range" min={0} max={1} step={0.005} value={t} onChange={(e) => setT(+e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span>slow motion ×{slow}</span>
          <input type="range" min={2} max={200} step={1} value={slow} onChange={(e) => setSlow(+e.target.value)} />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="rounded border px-3 py-1" onClick={() => setShot((s) => s + 1)}>Fire new pulse</button>
        <button className="rounded border px-3 py-1" onClick={() => setShowFrozen((s) => !s)}>{showFrozen ? 'Hide K = 0 model' : 'Show K = 0 model'}</button>
        <button className="rounded border px-3 py-1" onClick={() => setT(0.5)}>α = 0.5</button>
        <button className="rounded border px-3 py-1" onClick={() => setT(tOf(0.01))}>α = 1%</button>
      </div>
      <div className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-2">
        <span>K = {kapilaK(a).toFixed(4)} (≈ α when water is stiff)</span>
        <span>physical time {(readout.time * 1000).toFixed(1)} ms</span>
        <span style={{ color: '#1f6fd1' }}>Tube A laps: {readout.lapsK}</span>
        {showFrozen && <span style={{ color: '#e07b1a' }}>Tube B laps: {readout.lapsF} (×{ratio.toFixed(1)} faster)</span>}
      </div>
    </div>
  )
}
