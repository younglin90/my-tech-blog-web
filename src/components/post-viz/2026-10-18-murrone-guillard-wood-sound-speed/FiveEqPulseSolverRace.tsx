'use client'

import { useEffect, useRef, useState } from 'react'

// Same scheme as the Python code in the post: Rusanov flux on (a1r1, a2r2, ru, E),
// central differences + same-size artificial diffusion on alpha, zero-gradient ghosts.
const W = 760
const H = 440
const G = [1.4, 4.4]
const PI = [0, 6.0e8]
const P0 = 1.0e5
const RHO = [1.2, 1000]
const AMP = 1e-3
const TRAVEL = 0.3

function woodSpeed(a: number) {
  const rho = a * RHO[0] + (1 - a) * RHO[1]
  return 1 / Math.sqrt(rho * (a / (G[0] * (P0 + PI[0])) + (1 - a) / (G[1] * (P0 + PI[1]))))
}
function isobaricSpeed(a: number) {
  const rho = a * RHO[0] + (1 - a) * RHO[1]
  const xi = a / (G[0] - 1) + (1 - a) / (G[1] - 1)
  const gpi = (a * G[0] * PI[0]) / (G[0] - 1) + ((1 - a) * G[1] * PI[1]) / (G[1] - 1)
  const gam = 1 + 1 / xi
  return Math.sqrt((gam * (P0 + gpi / xi / gam)) / rho)
}
const mixPressure = (a1: number, rhoe: number) =>
  (rhoe - (a1 * G[0] * PI[0]) / (G[0] - 1) - ((1 - a1) * G[1] * PI[1]) / (G[1] - 1)) /
  (a1 / (G[0] - 1) + (1 - a1) / (G[1] - 1))
function kapilaK(a1: number, p: number) {
  const k1 = G[0] * (p + PI[0]), k2 = G[1] * (p + PI[1])
  return (a1 * (1 - a1) * (k2 - k1)) / (a1 * k2 + (1 - a1) * k1)
}

type Run = {
  n: number; useK: boolean; c: number; s: number; dt: number; steps: number; k: number; tEnd: number
  a1: Float64Array; m1: Float64Array; m2: Float64Array; mom: Float64Array; E: Float64Array; pr: Float64Array
  hist: [number, number][]
}

function makeRun(n: number, aBg: number, useK: boolean): Run {
  const dx = 1 / n
  const c = useK ? woodSpeed(aBg) : isobaricSpeed(aBg)
  const s = 1.05 * c
  const tEnd = TRAVEL / c
  const steps = Math.ceil(tEnd / ((0.4 * dx) / s))
  const r: Run = {
    n, useK, c, s, dt: tEnd / steps, steps, k: 0, tEnd,
    a1: new Float64Array(n).fill(aBg), m1: new Float64Array(n).fill(aBg * RHO[0]),
    m2: new Float64Array(n).fill((1 - aBg) * RHO[1]), mom: new Float64Array(n),
    E: new Float64Array(n), pr: new Float64Array(n), hist: [],
  }
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * dx
    const p = P0 * (1 + AMP * Math.exp(-(((x - 0.5) / 0.03) ** 2)))
    r.E[i] = (aBg * (p + G[0] * PI[0])) / (G[0] - 1) + ((1 - aBg) * (p + G[1] * PI[1])) / (G[1] - 1)
    r.pr[i] = p
  }
  return r
}

function stepRun(r: Run) {
  const { n, dt, s } = r
  const dx = 1 / n
  const g = (q: Float64Array, i: number) => q[Math.min(Math.max(i, 0), n - 1)]
  const u = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    u[i] = r.mom[i] / (r.m1[i] + r.m2[i])
    r.pr[i] = mixPressure(r.a1[i], r.E[i] - 0.5 * r.mom[i] * u[i])
  }
  const U = [r.m1, r.m2, r.mom, r.E]
  const F = U.map(() => new Float64Array(n))
  for (let i = 0; i < n; i++) {
    F[0][i] = r.m1[i] * u[i]; F[1][i] = r.m2[i] * u[i]
    F[2][i] = r.mom[i] * u[i] + r.pr[i]; F[3][i] = (r.E[i] + r.pr[i]) * u[i]
  }
  const nu = U.map((q, v) => {
    const f = F[v]
    const fl = new Float64Array(n + 1)
    for (let i = 0; i <= n; i++) fl[i] = 0.5 * (g(f, i - 1) + g(f, i)) - 0.5 * s * (g(q, i) - g(q, i - 1))
    const out = new Float64Array(n)
    for (let i = 0; i < n; i++) out[i] = q[i] - (dt / dx) * (fl[i + 1] - fl[i])
    return out
  })
  const na = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const K = r.useK ? kapilaK(r.a1[i], r.pr[i]) : 0
    const dudx = (g(u, i + 1) - g(u, i - 1)) / (2 * dx)
    const dadx = (g(r.a1, i + 1) - g(r.a1, i - 1)) / (2 * dx)
    const lap = g(r.a1, i + 1) - 2 * r.a1[i] + g(r.a1, i - 1)
    na[i] = r.a1[i] + dt * (-u[i] * dadx + K * dudx + (s * lap) / (2 * dx))
  }
  ;[r.m1, r.m2, r.mom, r.E] = nu
  r.a1 = na
  r.k++
  for (let i = 0; i < n; i++) r.pr[i] = mixPressure(r.a1[i], r.E[i] - (0.5 * r.mom[i] ** 2) / (r.m1[i] + r.m2[i]))
}

// right-going peak, searched ahead of the centre so the two pulses don't mix early
function measure(r: Run) {
  const t = r.k * r.dt
  const tau = t / r.tEnd
  const xMin = 0.5 + 0.5 * TRAVEL * tau
  let best = -1, ib = -1
  for (let i = 0; i < r.n; i++) {
    const x = (i + 0.5) / r.n
    if (x > Math.max(xMin, 0.52) && r.pr[i] > best) { best = r.pr[i]; ib = i }
  }
  const xp = (ib + 0.5) / r.n
  return { tau, xp, speed: t > 0 ? (xp - 0.5) / t : 0 }
}

const COL = { K: '#1f6fd1', F: '#e07b1a' }

export function FiveEqPulseSolverRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(400)
  const [alpha, setAlpha] = useState(0.5)
  const [spf, setSpf] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [reset, setReset] = useState(0)
  const [out, setOut] = useState({ kK: 0, kF: 0, sK: 0, sF: 0, tauK: 0, tauF: 0 })
  const runs = useRef<{ K: Run; F: Run } | null>(null)
  const live = useRef({ spf, playing, step: 0 })
  live.current.spf = spf
  live.current.playing = playing

  useEffect(() => {
    runs.current = { K: makeRun(n, alpha, true), F: makeRun(n, alpha, false) }
  }, [n, alpha, reset])

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    let raf = 0, frame = 0
    const plot = { x0: 60, x1: 740, y0: 24, y1: 220 }
    const hp = { x0: 60, x1: 740, y0: 270, y1: 400 }
    const draw = () => {
      const R = runs.current
      if (R) {
        const L = live.current
        let todo = L.playing ? L.spf : 0
        if (L.step > 0) { todo += L.step; L.step = 0 }
        for (const r of [R.K, R.F]) {
          for (let j = 0; j < todo && r.k < r.steps; j++) {
            stepRun(r)
            const m = measure(r)
            if (m.tau > 0.25) r.hist.push([m.tau, m.speed / r.c])
          }
        }
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
        ctx.font = '11px sans-serif'
        // profile panel
        ctx.strokeStyle = '#999'; ctx.strokeRect(plot.x0, plot.y0, plot.x1 - plot.x0, plot.y1 - plot.y0)
        const X = (x: number) => plot.x0 + x * (plot.x1 - plot.x0)
        const Y = (q: number) => plot.y1 - ((q + 0.1) / 1.2) * (plot.y1 - plot.y0)
        ctx.fillStyle = '#555'; ctx.textAlign = 'center'
        for (let x = 0; x <= 1.001; x += 0.1) ctx.fillText(x.toFixed(1), X(x), plot.y1 + 14)
        ctx.fillText('x [m]', (plot.x0 + plot.x1) / 2, plot.y1 + 28)
        ctx.textAlign = 'right'
        for (const q of [0, 0.5, 1]) ctx.fillText(q.toFixed(1), plot.x0 - 6, Y(q) + 4)
        ctx.save(); ctx.translate(16, (plot.y0 + plot.y1) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'
        ctx.fillText("p' / p'_0", 0, 0); ctx.restore()
        for (const [r, col] of [[R.K, COL.K], [R.F, COL.F]] as [Run, string][]) {
          const tau = (r.k * r.dt) / r.tEnd
          ctx.setLineDash([4, 4]); ctx.strokeStyle = col
          ctx.beginPath(); ctx.moveTo(X(0.5 + TRAVEL * tau), plot.y0); ctx.lineTo(X(0.5 + TRAVEL * tau), plot.y1); ctx.stroke()
          ctx.setLineDash([])
          ctx.beginPath()
          for (let i = 0; i < r.n; i++) {
            const q = (r.pr[i] - P0) / (P0 * AMP)
            const px = X((i + 0.5) / r.n), py = Y(q)
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
          }
          ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1
        }
        ctx.textAlign = 'left'
        ctx.fillStyle = COL.K; ctx.fillText('with K∇·u — dashed: Wood-speed front', plot.x0 + 8, plot.y0 + 14)
        ctx.fillStyle = COL.F; ctx.fillText('K = 0 — dashed: isobaric-speed front', plot.x0 + 8, plot.y0 + 28)
        ctx.fillStyle = '#555'; ctx.textAlign = 'right'
        ctx.fillText('both drawn at the same fraction τ of their own run (front reaches 0.8 m at τ = 1)', plot.x1 - 6, plot.y0 + 14)
        // history panel: measured / theory
        ctx.strokeStyle = '#999'; ctx.strokeRect(hp.x0, hp.y0, hp.x1 - hp.x0, hp.y1 - hp.y0)
        const HX = (t: number) => hp.x0 + ((t - 0.25) / 0.75) * (hp.x1 - hp.x0)
        const HY = (v: number) => hp.y1 - ((v - 0.9) / 0.15) * (hp.y1 - hp.y0)
        ctx.fillStyle = '#555'; ctx.textAlign = 'right'
        for (const v of [0.9, 0.95, 1.0, 1.05]) {
          ctx.fillText(v.toFixed(2), hp.x0 - 6, HY(v) + 4)
          ctx.strokeStyle = v === 1 ? '#bbb' : '#eee'
          ctx.beginPath(); ctx.moveTo(hp.x0, HY(v)); ctx.lineTo(hp.x1, HY(v)); ctx.stroke()
        }
        ctx.textAlign = 'center'
        for (const t of [0.25, 0.5, 0.75, 1]) ctx.fillText(t.toFixed(2), HX(t), hp.y1 + 14)
        ctx.fillText('τ = t / t_end', (hp.x0 + hp.x1) / 2, hp.y1 + 28)
        ctx.save(); ctx.translate(16, (hp.y0 + hp.y1) / 2); ctx.rotate(-Math.PI / 2)
        ctx.fillText('measured / theory', 0, 0); ctx.restore()
        for (const [r, col] of [[R.K, COL.K], [R.F, COL.F]] as [Run, string][]) {
          ctx.beginPath()
          r.hist.forEach(([t, v], i) => {
            const y = HY(Math.min(1.05, Math.max(0.9, v)))
            if (i === 0) ctx.moveTo(HX(t), y); else ctx.lineTo(HX(t), y)
          })
          ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1
        }
        if (++frame % 10 === 0 || todo > 0) {
          const mK = measure(R.K), mF = measure(R.F)
          if (frame % 10 === 0) setOut({ kK: R.K.k, kF: R.F.k, sK: mK.speed, sF: mF.speed, tauK: mK.tau, tauF: mF.tau })
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const cK = woodSpeed(alpha), cF = isobaricSpeed(alpha)
  const done = runs.current ? runs.current.K.k >= runs.current.K.steps && runs.current.F.k >= runs.current.F.steps : false
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-3 dark:border-gray-700">
      <canvas ref={ref} width={W} height={H} className="h-auto w-full rounded bg-white" />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <label className="flex flex-col">
          <span>cells N = {n}</span>
          <input type="range" min={50} max={400} step={50} value={n} onChange={(e) => setN(+e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span>air fraction α = {alpha.toFixed(2)}</span>
          <input type="range" min={0.01} max={0.99} step={0.01} value={alpha} onChange={(e) => setAlpha(+e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span>steps per frame = {spf}</span>
          <input type="range" min={1} max={10} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="rounded border px-3 py-1" onClick={() => { live.current.step += 1 }}>Step</button>
        <button className="rounded border px-3 py-1" onClick={() => { setReset((r) => r + 1); setPlaying(false) }}>Reset</button>
        <button className="rounded border px-3 py-1" onClick={() => { setN(400); setAlpha(0.5); setReset((r) => r + 1) }}>Post defaults (N = 400, α = 0.5)</button>
      </div>
      <table className="mt-3 w-full font-mono text-xs">
        <thead><tr className="text-left"><th>model</th><th>theory c</th><th>measured</th><th>ratio</th><th>step</th></tr></thead>
        <tbody>
          <tr style={{ color: COL.K }}>
            <td>with K</td><td>{cK.toFixed(2)}</td><td>{out.tauK > 0.25 ? out.sK.toFixed(2) : '—'}</td>
            <td>{out.tauK > 0.25 ? (out.sK / cK).toFixed(3) : '—'}</td><td>{out.kK} / {runs.current?.K.steps ?? 0}</td>
          </tr>
          <tr style={{ color: COL.F }}>
            <td>K = 0</td><td>{cF.toFixed(2)}</td><td>{out.tauF > 0.25 ? out.sF.toFixed(2) : '—'}</td>
            <td>{out.tauF > 0.25 ? (out.sF / cF).toFixed(3) : '—'}</td><td>{out.kF} / {runs.current?.F.steps ?? 0}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-xs text-gray-500">{done ? `done — speed ratio K=0 / K = ${(out.sF / out.sK).toFixed(1)}×` : 'measured speed = (peak position − 0.5 m) / t, shown after τ > 0.25'}</p>
    </div>
  )
}
