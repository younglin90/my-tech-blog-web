'use client'

import { useEffect, useRef, useState } from 'react'

// Reproduces the post's Python: periodic square wave of alpha advected with u=1,
// SSP-RK3, three fluxes side by side: 1st-order upwind, MUSCL-van Leer,
// van Leer + MMACM-Ex downwind sharpening flux J = H~ (u*alpha_{i+1} - F^).

const W = 680
const H = 360
const N = 200
const SCHEMES = [
  { key: 'upwind1', label: 'upwind 1st', color: 'rgba(140,140,140,1)' },
  { key: 'vanleer', label: 'MUSCL van Leer', color: 'rgba(56,132,255,1)' },
  { key: 'mmacm', label: 'van Leer + MMACM-Ex', color: 'rgba(255,110,40,1)' },
] as const

type Key = (typeof SCHEMES)[number]['key']

function init() {
  const a = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    a[i] = x > 0.35 && x < 0.65 ? 1 : 0
  }
  return a
}

function rhs(a: Float64Array, scheme: Key, p: number, out: Float64Array) {
  const F = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    const ip = (i + 1) % N
    if (scheme === 'upwind1') {
      F[i] = a[i]
      continue
    }
    const dm = a[i] - a[im]
    const dp = a[ip] - a[i]
    const r = Math.abs(dp) > 1e-14 ? dm / dp : 0
    const phi = (r + Math.abs(r)) / (1 + Math.abs(r))
    let f = a[i] + 0.5 * phi * dp
    if (scheme === 'mmacm') {
      const iface = a[i] > 1e-4 && a[i] < 1 - 1e-4 && dm * dp > 0
      if (iface) {
        const ar = Math.abs(r)
        const h = 1 - Math.pow((1 - ar) / (1 + ar), p)
        f = f + h * (a[ip] - f)
      }
    }
    F[i] = f
  }
  for (let i = 0; i < N; i++) out[i] = -(F[i] - F[(i - 1 + N) % N]) * N
}

function rk3(a: Float64Array, scheme: Key, p: number, dt: number) {
  const k = new Float64Array(N)
  const a1 = new Float64Array(N)
  const a2 = new Float64Array(N)
  rhs(a, scheme, p, k)
  for (let i = 0; i < N; i++) a1[i] = a[i] + dt * k[i]
  rhs(a1, scheme, p, k)
  for (let i = 0; i < N; i++) a2[i] = 0.75 * a[i] + 0.25 * (a1[i] + dt * k[i])
  rhs(a2, scheme, p, k)
  for (let i = 0; i < N; i++) a[i] = a[i] / 3 + (2 / 3) * (a2[i] + dt * k[i])
}

function measure(a: Float64Array, a0: Float64Array) {
  let cells = 0, lo = Infinity, hi = -Infinity, l1 = 0
  for (let i = 0; i < N; i++) {
    if (a[i] > 0.01 && a[i] < 0.99) cells++
    lo = Math.min(lo, a[i])
    hi = Math.max(hi, a[i])
    l1 += Math.abs(a[i] - a0[i])
  }
  return { cells: cells / 2, lo, hi, l1: l1 / N }
}

type Stats = { cells: number; lo: number; hi: number; l1: number }

export function MmacmExSquareWaveRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cfl, setCfl] = useState(0.4)
  const [p, setP] = useState(4)
  const [periods, setPeriods] = useState(5)
  const [speed, setSpeed] = useState(20)
  const [playing, setPlaying] = useState(false)
  const [info, setInfo] = useState<{ t: number; steps: number; stats: Stats[] }>({ t: 0, steps: 0, stats: [] })

  const sim = useRef({
    fields: SCHEMES.map(() => init()),
    a0: init(),
    t: 0,
    steps: 0,
    hist: SCHEMES.map(() => [] as number[]),
    cfl: 0.4,
    p: 4,
    periods: 5,
    speed: 20,
    playing: false,
    stepOnce: false,
  })

  const reset = () => {
    const s = sim.current
    s.fields = SCHEMES.map(() => init())
    s.t = 0
    s.steps = 0
    s.hist = SCHEMES.map(() => [])
  }

  useEffect(() => {
    const s = sim.current
    s.cfl = cfl
    s.p = p
    s.periods = periods
    s.speed = speed
    s.playing = playing
  }, [cfl, p, periods, speed, playing])

  useEffect(() => {
    reset()
  }, [cfl, p, periods])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.scale(dpr, dpr)
    let raf = 0
    let frame = 0

    const loop = () => {
      const s = sim.current
      const dt = s.cfl / N
      const total = Math.round(s.periods / dt)
      let n = s.playing ? s.speed : s.stepOnce ? 1 : 0
      s.stepOnce = false
      while (n-- > 0 && s.steps < total) {
        SCHEMES.forEach((sc, k) => rk3(s.fields[k], sc.key, s.p, dt))
        s.steps++
        s.t = s.steps * dt
        if (s.steps % 10 === 0 || s.steps === total) {
          SCHEMES.forEach((_, k) => s.hist[k].push(measure(s.fields[k], s.a0).hi - 1))
        }
      }
      if (s.steps >= total && s.playing) {
        s.playing = false
        setPlaying(false)
      }
      frame++
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px system-ui, sans-serif'

      // field panel
      const fx = 40, fy = 20, fw = 620, fh = 190
      const Y = (v: number) => fy + fh - ((v + 0.3) / 1.6) * fh
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(fx, fy, fw, fh)
      ctx.setLineDash([3, 3])
      ;[0, 1].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(fx, Y(v))
        ctx.lineTo(fx + fw, Y(v))
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(128,128,128,0.9)'
      ctx.fillText('1', fx - 12, Y(1) + 4)
      ctx.fillText('0', fx - 12, Y(0) + 4)
      ctx.fillText('alpha(x)', fx + 4, fy + 12)
      ctx.fillText('x', fx + fw - 10, fy + fh + 14)
      // exact (shifted square)
      ctx.strokeStyle = 'rgba(128,128,128,0.35)'
      ctx.lineWidth = 6
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        let x = ((i + 0.5) / N - s.t) % 1
        if (x < 0) x += 1
        const v = x > 0.35 && x < 0.65 ? 1 : 0
        const px = fx + ((i + 0.5) / N) * fw
        if (i === 0) ctx.moveTo(px, Y(v))
        else ctx.lineTo(px, Y(v))
      }
      ctx.stroke()
      ctx.lineWidth = 1.6
      SCHEMES.forEach((sc, k) => {
        const a = s.fields[k]
        ctx.strokeStyle = sc.color
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const px = fx + ((i + 0.5) / N) * fw
          if (i === 0) ctx.moveTo(px, Y(a[i]))
          else ctx.lineTo(px, Y(a[i]))
        }
        ctx.stroke()
      })
      ctx.lineWidth = 1

      // overshoot history
      const hx = 40, hy = 240, hw = 620, hh = 90
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(hx, hy, hw, hh)
      const maxH = 0.3
      const totalPts = Math.max(1, Math.ceil(total / 10))
      SCHEMES.forEach((sc, k) => {
        const h = s.hist[k]
        ctx.strokeStyle = sc.color
        ctx.beginPath()
        h.forEach((v, j) => {
          const px = hx + (j / totalPts) * hw
          const py = hy + hh - (Math.min(maxH, Math.max(0, v)) / maxH) * hh
          if (j === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.stroke()
      })
      ctx.fillStyle = 'rgba(128,128,128,0.9)'
      ctx.fillText('overshoot max(alpha) − 1  (0 … 0.3)', hx + 4, hy + 12)
      ctx.fillText(`time → ${s.periods} periods`, hx + hw - 100, hy + hh + 14)
      // legend
      SCHEMES.forEach((sc, k) => {
        ctx.fillStyle = sc.color
        ctx.fillRect(fx + 70 + k * 170, fy + 6, 14, 3)
        ctx.fillStyle = 'rgba(128,128,128,0.95)'
        ctx.fillText(sc.label, fx + 88 + k * 170, fy + 10)
      })

      if (frame % 12 === 0) {
        setInfo({ t: s.t, steps: s.steps, stats: SCHEMES.map((_, k) => measure(s.fields[k], s.a0)) })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const bound = 1 / (2 * p + 1)

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-40">CFL u·dt/dx: {cfl.toFixed(2)}</span>
          <input type="range" min={0.05} max={0.9} step={0.01} value={cfl} onChange={(e) => setCfl(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">exponent p: {p}</span>
          <input type="range" min={1} max={8} step={1} value={p} onChange={(e) => setP(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">periods: {periods}</span>
          <input type="range" min={1} max={10} step={1} value={periods} onChange={(e) => setPeriods(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">steps / frame: {speed}</span>
          <input type="range" min={1} max={80} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (sim.current.stepOnce = true)}>
          Step
        </button>
        <button
          className="rounded border px-3 py-1"
          onClick={() => {
            setPlaying(false)
            reset()
          }}
        >
          Reset
        </button>
        <span className="font-mono">
          t = {info.t.toFixed(3)} · step {info.steps} · bound 1/(2p+1) = {bound.toFixed(3)}{' '}
          <span style={{ color: cfl <= bound ? 'rgb(30,160,90)' : 'rgb(220,60,60)' }}>{cfl <= bound ? '(inside)' : '(outside)'}</span>
        </span>
      </div>
      <table className="mt-3 w-full text-left font-mono text-xs">
        <thead>
          <tr>
            <th>scheme</th>
            <th>cells/interface</th>
            <th>min</th>
            <th>max</th>
            <th>L1</th>
          </tr>
        </thead>
        <tbody>
          {SCHEMES.map((sc, k) => {
            const st = info.stats[k]
            return (
              <tr key={sc.key} style={{ color: sc.color }}>
                <td>{sc.label}</td>
                <td>{st ? st.cells.toFixed(1) : '-'}</td>
                <td>{st ? st.lo.toExponential(2) : '-'}</td>
                <td>{st ? st.hi.toFixed(5) : '-'}</td>
                <td>{st ? st.l1.toFixed(5) : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default MmacmExSquareWaveRace
