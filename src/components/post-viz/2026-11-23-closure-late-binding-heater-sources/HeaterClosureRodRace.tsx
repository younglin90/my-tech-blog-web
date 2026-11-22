'use client'

import { useEffect, useRef, useState } from 'react'

// Port of the post's Python: 1D rod, k = alpha = 1, T = 0 at both walls (ghost cells),
// N = 100 cells, FTCS with dt = 0.4 dx^2, heaters of width 0.1.
// Two runs march side by side:
//   late-binding: every closure reads the loop variables after the loop -> n copies of the LAST heater
//   curried:      make_heater(c, q) froze each heater's own (c, q)
// Stop rule identical to the Python: max|dT|/dt < 1e-7 * max(s).

const W = 680
const H = 400
const N = 100
const DX = 1 / N
const DT = 0.4 * DX * DX
const WIDTH = 0.1
const TOL = 1e-7
const XS = Array.from({ length: N }, (_, i) => (i + 0.5) * DX)
const RUNS = [
  { label: 'late-binding lambda', color: 'rgb(220,70,60)' },
  { label: 'curried make_heater', color: 'rgb(40,150,90)' },
] as const

type Run = { s: Float64Array; T: Float64Array; Tp: Float64Array; n: number; done: boolean; hist: number[] }

function heaterList(n: number, desc: boolean) {
  const hs = Array.from({ length: n }, (_, k) => ({ c: (k + 1) / (n + 1), q: 10 * (k + 1) }))
  return desc ? hs.reverse() : hs
}

function sourceOf(list: { c: number; q: number }[]) {
  const s = new Float64Array(N)
  for (const h of list) for (let i = 0; i < N; i++) if (Math.abs(XS[i] - h.c) < WIDTH / 2) s[i] += h.q
  return s
}

function makeRun(s: Float64Array): Run {
  return { s, T: new Float64Array(N), Tp: new Float64Array(N + 2), n: 0, done: false, hist: [] }
}

function stepRun(r: Run, smax: number) {
  if (r.done) return
  const { T, Tp, s } = r
  Tp[0] = -T[0]
  Tp[N + 1] = -T[N - 1]
  for (let i = 0; i < N; i++) Tp[i + 1] = T[i]
  let m = 0
  for (let i = 0; i < N; i++) {
    const d = DT * ((Tp[i + 2] - 2 * Tp[i + 1] + Tp[i]) / (DX * DX) + s[i])
    T[i] += d
    const a = Math.abs(d)
    if (a > m) m = a
  }
  r.n++
  if (m / DT < TOL * smax) r.done = true
}

function stats(r: Run) {
  let p = 0
  let tmax = -1
  let im = 0
  for (let i = 0; i < N; i++) {
    p += r.s[i] * DX
    if (r.T[i] > tmax) {
      tmax = r.T[i]
      im = i
    }
  }
  const wall = r.T[0] / (DX / 2) + r.T[N - 1] / (DX / 2)
  return { p, wall, tmax, xm: XS[im], n: r.n, done: r.done }
}

export function HeaterClosureRodRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nh, setNh] = useState(4)
  const [desc, setDesc] = useState(false)
  const [spf, setSpf] = useState(400)
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [info, setInfo] = useState(() => [stats(makeRun(new Float64Array(N))), stats(makeRun(new Float64Array(N)))])
  const sim = useRef<{ runs: Run[]; stepOnce: boolean }>({ runs: [], stepOnce: false })

  useEffect(() => {
    const list = heaterList(nh, desc)
    const last = list[list.length - 1]
    const late = sourceOf(list.map(() => last))
    const good = sourceOf(list)
    sim.current = { runs: [makeRun(late), makeRun(good)], stepOnce: false }
    setInfo(sim.current.runs.map(stats))
    setPlaying(false)
  }, [nh, desc, resetKey])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const dark = document.documentElement.classList.contains('dark')
    const fg = dark ? 'rgba(230,230,230,0.9)' : 'rgba(30,30,30,0.9)'
    const grid = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
    let raf = 0
    let frame = 0

    const advance = (k: number) => {
      for (const r of sim.current.runs) {
        let smax = 0
        for (let i = 0; i < N; i++) if (r.s[i] > smax) smax = r.s[i]
        for (let j = 0; j < k; j++) {
          if (r.done) break
          stepRun(r, smax)
          if (r.n % 500 === 0) r.hist.push(stats(r).tmax)
        }
      }
    }

    const draw = () => {
      const S = sim.current
      frame++
      if (playing) advance(spf)
      if (S.stepOnce) {
        advance(500)
        S.stepOnce = false
      }
      ctx.clearRect(0, 0, W, H)
      ctx.font = '10px monospace'
      const l = 50
      const r = W - 12
      // ---- panel 1: T(x) and source s(x) ----
      const t1 = 10
      const h1 = 220
      const allMax = Math.max(1, ...S.runs.map((R) => stats(R).tmax))
      const tTop = Math.ceil(allMax * 1.15 * 2) / 2
      const py = (v: number) => t1 + h1 - (v / tTop) * h1
      const px = (x: number) => l + x * (r - l)
      ctx.strokeStyle = grid
      ctx.strokeRect(l, t1, r - l, h1)
      ctx.fillStyle = fg
      for (let v = 0; v <= tTop + 1e-9; v += tTop / 4) {
        ctx.fillText(v.toFixed(2), 8, py(v) + 3)
        ctx.strokeStyle = grid
        ctx.beginPath()
        ctx.moveTo(l, py(v))
        ctx.lineTo(r, py(v))
        ctx.stroke()
      }
      ctx.fillText('T', 8, t1 + 10)
      ctx.fillText('x = 0', l - 2, t1 + h1 + 12)
      ctx.fillText('x = 1', r - 30, t1 + h1 + 12)
      // source bars (bottom strip, scaled)
      const sTop = Math.max(...S.runs.map((R) => Math.max(...R.s)), 1)
      S.runs.forEach((R, j) => {
        ctx.fillStyle = j === 0 ? 'rgba(220,70,60,0.25)' : 'rgba(40,150,90,0.25)'
        for (let i = 0; i < N; i++) {
          if (R.s[i] <= 0) continue
          const hh = (R.s[i] / sTop) * 60
          ctx.fillRect(px(i * DX) + (j ? DX * (r - l) * 0.5 : 0), t1 + h1 - hh, DX * (r - l) * 0.5, hh)
        }
      })
      ctx.fillStyle = fg
      ctx.fillText(`source s(x) bars, max ${sTop.toFixed(0)}`, l + 4, t1 + h1 - 64)
      S.runs.forEach((R, j) => {
        ctx.strokeStyle = RUNS[j].color
        ctx.lineWidth = 2
        ctx.setLineDash(j === 1 ? [6, 3] : [])
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const X = px(XS[i])
          const Y = py(R.T[i])
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
        const st = stats(R)
        ctx.fillStyle = RUNS[j].color
        ctx.beginPath()
        ctx.arc(px(st.xm), py(st.tmax), 3.5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillText(`${RUNS[j].label}  Tmax ${st.tmax.toFixed(4)}`, r - 230, t1 + 14 + j * 14)
      })
      ctx.lineWidth = 1
      // ---- panel 2: Tmax history vs steps ----
      const t2 = 262
      const h2 = 118
      ctx.strokeStyle = grid
      ctx.strokeRect(l, t2, r - l, h2)
      const nMax = 45000
      const qx = (k: number) => l + Math.min(1, k / nMax) * (r - l)
      const qy = (v: number) => t2 + h2 - (v / tTop) * h2
      ctx.fillStyle = fg
      ctx.fillText('Tmax vs step', l + 4, t2 + 12)
      ctx.fillText('0', l - 3, t2 + h2 + 12)
      ctx.fillText(`${nMax}`, r - 34, t2 + h2 + 12)
      ctx.fillText(tTop.toFixed(1), 8, t2 + 8)
      S.runs.forEach((R, j) => {
        ctx.strokeStyle = RUNS[j].color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        R.hist.forEach((v, k) => {
          const X = qx((k + 1) * 500)
          const Y = qy(v)
          if (k === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        })
        ctx.stroke()
        if (R.done) {
          ctx.setLineDash([2, 3])
          ctx.beginPath()
          ctx.moveTo(qx(R.n), t2)
          ctx.lineTo(qx(R.n), t2 + h2)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = RUNS[j].color
          ctx.fillText(`steady @ ${R.n}`, qx(R.n) + 3, t2 + 26 + j * 12)
        }
      })
      ctx.lineWidth = 1
      if (frame % 12 === 0) setInfo(S.runs.map(stats))
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, spf, nh, desc, resetKey])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-40">heaters: {nh}</span>
          <input type="range" min={2} max={6} step={1} value={nh} onChange={(e) => setNh(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">steps / frame: {spf}</span>
          <input type="range" min={50} max={1500} step={50} value={spf} onChange={(e) => setSpf(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={desc} onChange={(e) => setDesc(e.target.checked)} />
          <span>loop order reversed (strongest heater first)</span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (sim.current.stepOnce = true)}>
          Step (+500)
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setResetKey((v) => v + 1)}>
          Reset
        </button>
      </div>
      <table className="mt-3 w-full text-left font-mono text-xs">
        <thead>
          <tr>
            <th>run</th>
            <th>power in</th>
            <th>wall flux out</th>
            <th>Tmax</th>
            <th>x at Tmax</th>
            <th>steps</th>
          </tr>
        </thead>
        <tbody>
          {info.map((s, j) => (
            <tr key={j} style={{ color: RUNS[j].color }}>
              <td>{RUNS[j].label}</td>
              <td>{s.p.toFixed(3)}</td>
              <td>{s.wall.toFixed(3)}</td>
              <td>{s.tmax.toFixed(4)}</td>
              <td>{s.xm.toFixed(3)}</td>
              <td>
                {s.n}
                {s.done ? ' ✓' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
