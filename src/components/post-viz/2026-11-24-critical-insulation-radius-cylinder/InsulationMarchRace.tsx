'use client'

import { useEffect, useRef, useState } from 'react'

// Port of the post's Python insulation_march(): explicit finite-volume march of the
// insulation layer (N = 20 cells, cold start at 25 °C, wire held at 100 °C, Robin BC to air),
// dt = 0.45 * min(rho_c V / sum G), stop when |q'_in - q'_out| < 1e-4 q'_out.
// Two insulation radii march side by side.

const W = 680
const H = 330
const RI = 0.005
const TI = 100
const TINF = 25
const RHOC = 4.0e4
const N = 20
const TOL = 1e-4
const COLORS = ['rgb(210,70,60)', 'rgb(50,120,210)']

type Run = {
  ro: number
  rc: number[]
  V: number[]
  G: number[]
  G0: number
  Gout: number
  dt: number
  T: number[]
  n: number
  qin: number
  qout: number
  done: boolean
  hist: [number, number, number][]
  exact: number
}

function exactQ(ro: number, k: number, h: number) {
  return (TI - TINF) / (Math.log(ro / RI) / (2 * Math.PI * k) + 1 / (2 * Math.PI * ro * h))
}

function makeRun(ro: number, k: number, h: number): Run {
  const dr = (ro - RI) / N
  const rf = Array.from({ length: N + 1 }, (_, j) => RI + j * dr)
  const V = Array.from({ length: N }, (_, j) => Math.PI * (rf[j + 1] ** 2 - rf[j] ** 2))
  const G = Array.from({ length: N - 1 }, (_, j) => (2 * Math.PI * rf[j + 1] * k) / dr)
  const G0 = (2 * Math.PI * RI * k) / (dr / 2)
  const Gout = 1 / (dr / 2 / (2 * Math.PI * ro * k) + 1 / (2 * Math.PI * ro * h))
  const Gs = new Array(N).fill(0)
  G.forEach((g, j) => {
    Gs[j] += g
    Gs[j + 1] += g
  })
  Gs[0] += G0
  Gs[N - 1] += Gout
  let dt = Infinity
  for (let j = 0; j < N; j++) dt = Math.min(dt, (RHOC * V[j]) / Gs[j])
  dt *= 0.45
  return {
    ro,
    rc: rf.slice(0, N).map((r, j) => 0.5 * (r + rf[j + 1])),
    V,
    G,
    G0,
    Gout,
    dt,
    T: new Array(N).fill(TINF),
    n: 0,
    qin: 0,
    qout: 0,
    done: false,
    hist: [],
    exact: exactQ(ro, k, h),
  }
}

function step(r: Run) {
  if (r.done) return
  const dQ = new Array(N).fill(0)
  for (let j = 0; j < N - 1; j++) {
    const f = r.G[j] * (r.T[j] - r.T[j + 1])
    dQ[j] -= f
    dQ[j + 1] += f
  }
  r.qin = r.G0 * (TI - r.T[0])
  r.qout = r.Gout * (r.T[N - 1] - TINF)
  dQ[0] += r.qin
  dQ[N - 1] -= r.qout
  for (let j = 0; j < N; j++) r.T[j] += (r.dt * dQ[j]) / (RHOC * r.V[j])
  r.n++
  if (r.n % 25 === 0 || r.n === 1) r.hist.push([Math.log10(r.n * r.dt), r.qin, r.qout])
  if (Math.abs(r.qin - r.qout) < TOL * r.qout) {
    r.done = true
    r.hist.push([Math.log10(r.n * r.dt), r.qin, r.qout])
  }
}

export function InsulationMarchRace() {
  const [roA, setRoA] = useState(11)
  const [roB, setRoB] = useState(50)
  const [k, setK] = useState(0.055)
  const [h, setH] = useState(5)
  const [spf, setSpf] = useState(80)
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [rows, setRows] = useState<Run[]>([])
  const ref = useRef<HTMLCanvasElement>(null)
  const sim = useRef({ runs: [] as Run[], playing: false, spf: 80, stepOnce: false })
  sim.current.playing = playing
  sim.current.spf = spf

  useEffect(() => {
    sim.current.runs = [makeRun(roA / 1000, k, h), makeRun(roB / 1000, k, h)]
    setRows(sim.current.runs.map((r) => ({ ...r })))
  }, [roA, roB, k, h, resetKey])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const loop = () => {
      const s = sim.current
      const runs = s.runs
      if (s.playing || s.stepOnce) {
        const nStep = s.stepOnce && !s.playing ? 1 : s.spf
        for (const r of runs) for (let i = 0; i < nStep; i++) step(r)
        s.stepOnce = false
      }
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px sans-serif'
      // ---- left: T(r) ----
      const ax0 = 45
      const ax1 = 320
      const ay0 = H - 35
      const ay1 = 25
      const rmax = Math.max(...runs.map((r) => r.ro), 0.006)
      const X = (r: number) => ax0 + ((r - RI) / (rmax - RI)) * (ax1 - ax0)
      const Y = (T: number) => ay0 - ((T - TINF) / (TI - TINF)) * (ay0 - ay1)
      ctx.strokeStyle = 'rgb(150,150,150)'
      ctx.beginPath()
      ctx.moveTo(ax0, ay1)
      ctx.lineTo(ax0, ay0)
      ctx.lineTo(ax1, ay0)
      ctx.stroke()
      ctx.fillStyle = 'rgb(130,130,130)'
      ctx.fillText('T [°C]', ax0 - 40, ay1 - 8)
      ctx.fillText('100', ax0 - 28, ay1 + 4)
      ctx.fillText('25', ax0 - 22, ay0 + 4)
      ctx.fillText(`r [mm]  5 … ${(rmax * 1000).toFixed(0)}`, ax1 - 110, ay0 + 26)
      runs.forEach((r, c) => {
        ctx.strokeStyle = COLORS[c]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(X(RI), Y(TI))
        r.rc.forEach((rr, j) => ctx.lineTo(X(rr), Y(r.T[j])))
        ctx.stroke()
        ctx.fillStyle = COLORS[c]
        ctx.beginPath()
        ctx.arc(X(r.ro), Y(r.T[N - 1]), 3.5, 0, Math.PI * 2)
        ctx.fill()
      })
      // ---- right: q'(t) on log time ----
      const bx0 = 385
      const bx1 = W - 15
      const by0 = H - 35
      const by1 = 25
      const lt0 = -3
      const lt1 = 4
      const qmax = 30
      const XT = (lt: number) => bx0 + ((Math.max(lt0, Math.min(lt1, lt)) - lt0) / (lt1 - lt0)) * (bx1 - bx0)
      const YQ = (q: number) => by0 - (Math.max(0, Math.min(qmax, q)) / qmax) * (by0 - by1)
      ctx.strokeStyle = 'rgb(150,150,150)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(bx0, by1)
      ctx.lineTo(bx0, by0)
      ctx.lineTo(bx1, by0)
      ctx.stroke()
      ctx.fillStyle = 'rgb(130,130,130)'
      ctx.fillText("q' [W/m]  (solid: in at wire, thin: out to air, dashed: exact)", bx0 - 30, by1 - 8)
      for (let lt = lt0; lt <= lt1; lt++) ctx.fillText(`1e${lt}`, XT(lt) - 10, by0 + 14)
      ctx.fillText('t [s]', bx1 - 25, by0 + 26)
      for (const q of [10, 20, 30]) ctx.fillText(String(q), bx0 - 18, YQ(q) + 4)
      runs.forEach((r, c) => {
        ctx.strokeStyle = COLORS[c]
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(bx0, YQ(r.exact))
        ctx.lineTo(bx1, YQ(r.exact))
        ctx.stroke()
        ctx.setLineDash([])
        for (const [idx, lw] of [
          [1, 2],
          [2, 1],
        ] as const) {
          ctx.lineWidth = lw
          ctx.beginPath()
          r.hist.forEach((p, i) => (i === 0 ? ctx.moveTo(XT(p[0]), YQ(p[idx])) : ctx.lineTo(XT(p[0]), YQ(p[idx]))))
          ctx.stroke()
        }
      })
      frame++
      if (frame % 12 === 0) setRows(runs.map((r) => ({ ...r })))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const slider = (label: string, v: number, set: (x: number) => void, min: number, max: number, st: number) => (
    <label className="flex items-center gap-2">
      <span className="w-36">{label}</span>
      <input type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(+e.target.value)} className="flex-1" />
    </label>
  )

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={ref} width={W} height={H} className="w-full" style={{ maxWidth: W }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {slider(`case A r_o: ${roA} mm`, roA, setRoA, 6, 60, 1)}
        {slider(`case B r_o: ${roB} mm`, roB, setRoB, 6, 60, 1)}
        {slider(`k: ${k.toFixed(3)} W/mK`, k, setK, 0.02, 0.2, 0.005)}
        {slider(`h: ${h} W/m²K`, h, setH, 2, 50, 1)}
        {slider(`steps / frame: ${spf}`, spf, setSpf, 1, 500, 1)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (sim.current.stepOnce = true)}>
          Step
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setResetKey((v) => v + 1)}>
          Reset
        </button>
        <span className="text-xs">r_cr = k/h = {((k / h) * 1000).toFixed(1)} mm · bare wire q&apos; = {exactQ(RI + 1e-12, k, h).toFixed(2)} W/m</span>
      </div>
      <table className="mt-3 w-full text-left font-mono text-xs">
        <thead>
          <tr>
            <th>case</th>
            <th>r_o</th>
            <th>steps</th>
            <th>t [s]</th>
            <th>q&apos;_num</th>
            <th>q&apos;_exact</th>
            <th>err %</th>
            <th>T_s °C</th>
            <th>state</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, c) => (
            <tr key={c} style={{ color: COLORS[c] }}>
              <td>{c === 0 ? 'A' : 'B'}</td>
              <td>{(r.ro * 1000).toFixed(0)} mm</td>
              <td>{r.n}</td>
              <td>{(r.n * r.dt).toFixed(1)}</td>
              <td>{r.qout.toFixed(2)}</td>
              <td>{r.exact.toFixed(2)}</td>
              <td>{r.n ? ((100 * (r.qout - r.exact)) / r.exact).toFixed(3) : '—'}</td>
              <td>{r.T[N - 1].toFixed(1)}</td>
              <td>{r.done ? 'steady' : 'marching'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
