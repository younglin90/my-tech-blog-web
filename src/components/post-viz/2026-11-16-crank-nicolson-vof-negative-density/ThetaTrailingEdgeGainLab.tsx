'use client'

import { useEffect, useRef, useState } from 'react'

// Concept viz: a water slug (alpha = 1) advected by the theta-scheme with
// first-order upwind. The first water cell behind the air is multiplied by
// G = (1 - (1-theta) Co) / (1 + theta Co) each step. G < 0 means alpha < 0,
// and rho = rho_a + alpha (rho_w - rho_a) turns negative almost immediately.

const W = 680
const H = 380
const N = 40
const RHO_W = 998
const RHO_A = 1.2

function initAlpha() {
  const a = new Float64Array(N)
  for (let i = 0; i < N; i++) a[i] = i >= 8 && i < 20 ? 1 : 0
  return a
}

// one theta-upwind step on a periodic grid (lower bidiagonal cyclic solve)
function thetaStep(a: Float64Array, co: number, th: number) {
  const r = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    r[i] = a[i] - (1 - th) * co * (a[i] - a[im])
  }
  const d = 1 + th * co
  const k = (th * co) / d
  const b = new Float64Array(N)
  let prev = 0
  for (let i = 0; i < N; i++) {
    b[i] = r[i] / d + k * prev
    prev = b[i]
  }
  const last = b[N - 1] / (1 - Math.pow(k, N))
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) out[i] = b[i] + Math.pow(k, i + 1) * last
  return out
}

const gain = (co: number, th: number) => (1 - (1 - th) * co) / (1 + th * co)

export function ThetaTrailingEdgeGainLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(0.5)
  const [co, setCo] = useState(4)
  const [playing, setPlaying] = useState(true)
  const [info, setInfo] = useState({ steps: 0, amin: 0, rmin: RHO_A })
  const sim = useRef({ a: initAlpha(), steps: 0, amin: 0, theta: 0.5, co: 4, playing: true, stepOnce: false })

  const reset = () => {
    const s = sim.current
    s.a = initAlpha()
    s.steps = 0
    s.amin = 0
  }

  useEffect(() => {
    sim.current.theta = theta
    sim.current.co = co
    reset()
  }, [theta, co])
  useEffect(() => {
    sim.current.playing = playing
  }, [playing])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    let raf = 0
    let frame = 0
    const loop = () => {
      const s = sim.current
      const doStep = (s.playing && frame % 18 === 0) || s.stepOnce
      if (doStep) {
        s.stepOnce = false
        s.a = thetaStep(s.a, s.co, s.theta)
        s.steps++
        for (let i = 0; i < N; i++) s.amin = Math.min(s.amin, s.a[i])
        if (s.steps > 400) {
          s.a = initAlpha()
          s.steps = 0
        }
      }
      frame++
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px system-ui, sans-serif'

      // profile panel
      const px = 50, py = 18, pw = 610, ph = 170
      const amin = -0.8, amax = 1.8
      const Y = (v: number) => py + ph - ((v - amin) / (amax - amin)) * ph
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(px, py, pw, ph)
      ctx.setLineDash([3, 3])
      ;[0, 1].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(px, Y(v))
        ctx.lineTo(px + pw, Y(v))
        ctx.stroke()
      })
      ctx.setLineDash([])
      const bw = pw / N
      for (let i = 0; i < N; i++) {
        const v = Math.max(amin, Math.min(amax, s.a[i]))
        const rho = RHO_A + s.a[i] * (RHO_W - RHO_A)
        ctx.fillStyle = rho < 0 ? 'rgba(230,60,60,0.9)' : s.a[i] > 1 + 1e-9 ? 'rgba(251,160,36,0.9)' : 'rgba(56,132,255,0.75)'
        const y0 = Y(0), y1 = Y(v)
        ctx.fillRect(px + i * bw + 1, Math.min(y0, y1), bw - 2, Math.abs(y1 - y0))
      }
      ctx.fillStyle = 'rgba(128,128,128,0.95)'
      ctx.fillText('1', px - 12, Y(1) + 4)
      ctx.fillText('0', px - 12, Y(0) + 4)
      ctx.fillText('alpha per cell  (u → , periodic)', px + 4, py + 12)
      ctx.fillStyle = 'rgba(56,132,255,1)'
      ctx.fillText('■ 0 ≤ alpha ≤ 1', px + 260, py + 12)
      ctx.fillStyle = 'rgba(230,60,60,1)'
      ctx.fillText('■ rho < 0', px + 370, py + 12)
      ctx.fillStyle = 'rgba(251,160,36,1)'
      ctx.fillText('■ alpha > 1', px + 450, py + 12)

      // gain panel
      const gx = 50, gy = 220, gw = 610, gh = 130
      const coMax = 10
      const GX = (c: number) => gx + (c / coMax) * gw
      const GY = (g: number) => gy + gh - ((g + 1) / 2) * gh
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(gx, gy, gw, gh)
      ctx.fillStyle = 'rgba(230,60,60,0.08)'
      ctx.fillRect(gx, GY(0), gw, GY(-1) - GY(0))
      ctx.beginPath()
      ctx.moveTo(gx, GY(0))
      ctx.lineTo(gx + gw, GY(0))
      ctx.stroke()
      // reference theta curves
      ;[0.5, 0.75, 1].forEach((t) => {
        ctx.strokeStyle = 'rgba(128,128,128,0.35)'
        ctx.beginPath()
        for (let j = 0; j <= 200; j++) {
          const c = (j / 200) * coMax
          j === 0 ? ctx.moveTo(GX(c), GY(gain(c, t))) : ctx.lineTo(GX(c), GY(gain(c, t)))
        }
        ctx.stroke()
      })
      ctx.strokeStyle = 'rgba(251,191,36,1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let j = 0; j <= 200; j++) {
        const c = (j / 200) * coMax
        j === 0 ? ctx.moveTo(GX(c), GY(gain(c, s.theta))) : ctx.lineTo(GX(c), GY(gain(c, s.theta)))
      }
      ctx.stroke()
      ctx.lineWidth = 1
      const g = gain(s.co, s.theta)
      ctx.fillStyle = g < 0 ? 'rgba(230,60,60,1)' : 'rgba(56,132,255,1)'
      ctx.beginPath()
      ctx.arc(GX(s.co), GY(g), 5, 0, 2 * Math.PI)
      ctx.fill()
      if (s.theta < 1) {
        const cstar = 1 / (1 - s.theta)
        if (cstar <= coMax) {
          ctx.setLineDash([4, 3])
          ctx.strokeStyle = 'rgba(230,60,60,0.8)'
          ctx.beginPath()
          ctx.moveTo(GX(cstar), gy)
          ctx.lineTo(GX(cstar), gy + gh)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(230,60,60,1)'
          ctx.fillText(`Co* = 1/(1−θ) = ${cstar.toFixed(2)}`, GX(cstar) + 4, gy + 24)
        }
      }
      ctx.fillStyle = 'rgba(128,128,128,0.95)'
      ctx.fillText('trailing-edge gain G = (1 − (1−θ)Co) / (1 + θCo)', gx + 4, gy + 12)
      ctx.fillText('+1', gx - 18, GY(1) + 4)
      ctx.fillText('0', gx - 12, GY(0) + 4)
      ctx.fillText('−1', gx - 18, GY(-1) + 4)
      for (let c = 0; c <= coMax; c += 2) ctx.fillText(String(c), GX(c) - 3, gy + gh + 14)
      ctx.fillText('Courant number Co', gx + gw - 100, gy + gh + 14)
      ctx.fillText('grey: θ = 0.5, 0.75, 1', gx + gw - 130, gy + gh - 6)

      if (frame % 12 === 0) {
        setInfo({ steps: s.steps, amin: s.amin, rmin: RHO_A + s.amin * (RHO_W - RHO_A) })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const g = gain(co, theta)
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-36">θ (0.5 = CN, 1 = EI): {theta.toFixed(2)}</span>
          <input type="range" min={0.5} max={1} step={0.01} value={theta} onChange={(e) => setTheta(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-36">Courant Co: {co.toFixed(2)}</span>
          <input type="range" min={0.25} max={10} step={0.25} value={co} onChange={(e) => setCo(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (sim.current.stepOnce = true)}>
          Step
        </button>
        <button className="rounded border px-3 py-1" onClick={reset}>
          Reset
        </button>
        <span className="ml-2 font-mono text-xs">
          step {info.steps} · G = {g.toFixed(3)} · min alpha so far = {info.amin.toFixed(4)} ·{' '}
          <span style={{ color: info.rmin < 0 ? 'rgb(230,60,60)' : undefined }}>min rho = {info.rmin.toFixed(1)} kg/m³</span>
        </span>
      </div>
    </div>
  )
}
