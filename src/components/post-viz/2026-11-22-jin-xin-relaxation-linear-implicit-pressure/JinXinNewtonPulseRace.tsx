'use client'

import { useEffect, useRef, useState } from 'react'

// Port of the post's Python: 1D isentropic Euler, p = rho^1.4, periodic, M0 = 0.05.
// Three runs share the same physical time:
//  explicit Rusanov (dt from u+c), implicit with nonlinear p(rho^{n+1}) solved by Newton,
//  Jin-Xin relaxed implicit (w_t + a^2 m_x = 0) -> one constant-coefficient cyclic tridiagonal solve.

const W = 680
const H = 380
const N = 200
const G = 1.4
const DX = 1 / N
const U0 = 0.05 * Math.sqrt(G)
const T = 0.25 / U0
const RUNS = [
  { key: 'exp', label: 'explicit Rusanov', color: 'rgb(140,140,140)' },
  { key: 'nwt', label: 'implicit Newton', color: 'rgb(60,110,220)' },
  { key: 'rlx', label: 'Jin-Xin relaxed', color: 'rgb(230,120,30)' },
] as const

type Run = { r: Float64Array; m: Float64Array; dead: number; amp: number; hist: number[] }
type Sim = {
  runs: Run[]
  k: number
  nst: number
  dt: number
  tE: number
  dtE: number
  stepsE: number
  solvesN: number
  solvesR: number
  cmax: number
  mass0: number
  l2: number
  stepOnce: boolean
}

const pres = (r: number) => Math.pow(r, G)
const R = (i: number) => (i + 1) % N
const L = (i: number) => (i - 1 + N) % N

function thomas(lo: Float64Array, d: Float64Array, up: Float64Array, rhs: Float64Array) {
  const n = rhs.length
  const cp = new Float64Array(n)
  const dp = new Float64Array(n)
  cp[0] = up[0] / d[0]
  dp[0] = rhs[0] / d[0]
  for (let i = 1; i < n; i++) {
    const m = d[i] - lo[i] * cp[i - 1]
    cp[i] = up[i] / m
    dp[i] = (rhs[i] - lo[i] * dp[i - 1]) / m
  }
  const y = new Float64Array(n)
  y[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) y[i] = dp[i] - cp[i] * y[i + 1]
  return y
}

// periodic tridiagonal: Thomas + Sherman-Morrison
function cyclicSolve(lo: Float64Array, di: Float64Array, up: Float64Array, b: Float64Array) {
  const n = b.length
  const g = -di[0]
  const d = Float64Array.from(di)
  d[0] -= g
  d[n - 1] -= (lo[0] * up[n - 1]) / g
  const uv = new Float64Array(n)
  uv[0] = g
  uv[n - 1] = up[n - 1]
  const y = thomas(lo, d, up, b)
  const q = thomas(lo, d, up, uv)
  const f = (y[0] + (lo[0] * y[n - 1]) / g) / (1 + q[0] + (lo[0] * q[n - 1]) / g)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) out[i] = y[i] - f * q[i]
  return out
}

function advectM(r: Float64Array, m: Float64Array, dt: number) {
  const u = new Float64Array(N)
  for (let i = 0; i < N; i++) u[i] = m[i] / r[i]
  const F = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const s = Math.max(Math.abs(u[i]), Math.abs(u[R(i)]))
    F[i] = 0.5 * (m[i] * u[i] + m[R(i)] * u[R(i)]) - 0.5 * s * (m[R(i)] - m[i])
  }
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) out[i] = m[i] - (dt / DX) * (F[i] - F[L(i)])
  return out
}

function finish(r: Float64Array, ms: Float64Array, w: Float64Array, dt: number, run: Run) {
  const mf = new Float64Array(N)
  for (let i = 0; i < N; i++) mf[i] = 0.5 * (ms[i] + ms[R(i)]) - (dt / DX) * (w[R(i)] - w[i])
  for (let i = 0; i < N; i++) {
    run.r[i] = r[i] - (dt / DX) * (mf[i] - mf[L(i)])
    run.m[i] = 0.5 * (mf[i] + mf[L(i)])
  }
}

function relaxedStep(run: Run, dt: number, a: number) {
  const ms = advectM(run.r, run.m, dt)
  const k = ((a * dt) / DX) ** 2
  const rhs = new Float64Array(N)
  const mf0 = new Float64Array(N)
  for (let i = 0; i < N; i++) mf0[i] = 0.5 * (ms[i] + ms[R(i)])
  for (let i = 0; i < N; i++) rhs[i] = pres(run.r[i]) - ((a * a * dt) / DX) * (mf0[i] - mf0[L(i)])
  const w = cyclicSolve(new Float64Array(N).fill(-k), new Float64Array(N).fill(1 + 2 * k), new Float64Array(N).fill(-k), rhs)
  finish(Float64Array.from(run.r), ms, w, dt, run)
}

function newtonStep(run: Run, dt: number) {
  const ms = advectM(run.r, run.m, dt)
  const b = new Float64Array(N)
  const mf0 = new Float64Array(N)
  for (let i = 0; i < N; i++) mf0[i] = 0.5 * (ms[i] + ms[R(i)])
  for (let i = 0; i < N; i++) b[i] = run.r[i] - (dt / DX) * (mf0[i] - mf0[L(i)])
  const k = (dt / DX) ** 2
  const rn = Float64Array.from(run.r)
  let it = 0
  for (;;) {
    const p = new Float64Array(N)
    for (let i = 0; i < N; i++) p[i] = pres(rn[i])
    const res = new Float64Array(N)
    let mx = 0
    for (let i = 0; i < N; i++) {
      res[i] = rn[i] - k * (p[R(i)] - 2 * p[i] + p[L(i)]) - b[i]
      mx = Math.max(mx, Math.abs(res[i]))
    }
    if (!(mx >= 1e-10)) {
      if (!Number.isFinite(mx)) return -1
      break
    }
    const dp = new Float64Array(N)
    for (let i = 0; i < N; i++) dp[i] = G * Math.pow(rn[i], G - 1)
    const lo = new Float64Array(N)
    const di = new Float64Array(N)
    const up = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      lo[i] = -k * dp[L(i)]
      up[i] = -k * dp[R(i)]
      di[i] = 1 + 2 * k * dp[i]
    }
    const d = cyclicSolve(lo, di, up, res)
    for (let i = 0; i < N; i++) rn[i] -= d[i]
    it++
    if (it > 50) return -1
  }
  const w = new Float64Array(N)
  for (let i = 0; i < N; i++) w[i] = pres(rn[i])
  finish(Float64Array.from(run.r), ms, w, dt, run)
  run.r = rn // Newton solution itself (as in the Python)
  return it
}

function explicitStep(run: Run, dt: number) {
  const { r, m } = run
  const u = new Float64Array(N)
  const sp = new Float64Array(N)
  const f0 = new Float64Array(N)
  const f1 = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    u[i] = m[i] / r[i]
    sp[i] = Math.abs(u[i]) + Math.sqrt(G * Math.pow(r[i], G - 1))
    f0[i] = m[i]
    f1[i] = m[i] * u[i] + pres(r[i])
  }
  const h0 = new Float64Array(N)
  const h1 = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const s = Math.max(sp[i], sp[R(i)])
    h0[i] = 0.5 * (f0[i] + f0[R(i)]) - 0.5 * s * (r[R(i)] - r[i])
    h1[i] = 0.5 * (f1[i] + f1[R(i)]) - 0.5 * s * (m[R(i)] - m[i])
  }
  const nr = new Float64Array(N)
  const nm = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    nr[i] = r[i] - (dt / DX) * (h0[i] - h0[L(i)])
    nm[i] = m[i] - (dt / DX) * (h1[i] - h1[L(i)])
  }
  run.r = nr
  run.m = nm
}

function ampOf(r: Float64Array) {
  let mx = -Infinity
  let s = 0
  for (let i = 0; i < N; i++) {
    mx = Math.max(mx, r[i])
    s += r[i]
  }
  return mx - s / N
}

function init(cfl: number, a0: number): Sim {
  const mk = (): Run => {
    const r = new Float64Array(N)
    const m = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) * DX
      r[i] = 1 + a0 * Math.exp(-(((x - 0.5) / 0.05) ** 2))
      m[i] = r[i] * U0
    }
    return { r, m, dead: 0, amp: ampOf(r), hist: [ampOf(r)] }
  }
  const runs = [mk(), mk(), mk()]
  let rmax = 0
  let mass0 = 0
  for (let i = 0; i < N; i++) {
    rmax = Math.max(rmax, runs[0].r[i])
    mass0 += runs[0].r[i] * DX
  }
  const cmax = Math.sqrt(G * Math.pow(rmax, G - 1))
  const nst = Math.ceil(T / ((cfl * DX) / U0))
  const nE = Math.ceil(T / ((0.9 * DX) / (U0 + cmax)))
  return { runs, k: 0, nst, dt: T / nst, tE: 0, dtE: T / nE, stepsE: 0, solvesN: 0, solvesR: 0, cmax, mass0, l2: 0, stepOnce: false }
}

export function JinXinNewtonPulseRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aRatio, setARatio] = useState(1)
  const [cfl, setCfl] = useState(0.9)
  const [a0, setA0] = useState(0.2)
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [info, setInfo] = useState({ k: 0, nst: 56, stepsE: 0, solvesN: 0, solvesR: 0, amps: [0.2, 0.2, 0.2], dead: [0, 0, 0], l2: 0 })
  const sim = useRef<Sim>(init(0.9, 0.2))

  useEffect(() => {
    sim.current = init(cfl, a0)
    setPlaying(false)
  }, [cfl, a0, aRatio, resetKey])

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

    const advance = () => {
      const S = sim.current
      if (S.k >= S.nst) return
      const tNew = (S.k + 1) * S.dt
      const [E, Nw, Rx] = S.runs
      if (!E.dead) {
        while (S.tE < tNew - 1e-12) {
          explicitStep(E, S.dtE)
          S.tE += S.dtE
          S.stepsE++
        }
        if (!Number.isFinite(E.r[0])) E.dead = S.k + 1
      }
      if (!Nw.dead) {
        const it = newtonStep(Nw, S.dt)
        if (it < 0) Nw.dead = S.k + 1
        else S.solvesN += it
      }
      if (!Rx.dead) {
        relaxedStep(Rx, S.dt, aRatio * S.cmax)
        S.solvesR++
        let bad = false
        for (let i = 0; i < N; i++) if (!Number.isFinite(Rx.r[i]) || Rx.r[i] <= 0) bad = true
        if (bad) Rx.dead = S.k + 1
      }
      for (const run of S.runs) {
        if (!run.dead) run.amp = ampOf(run.r)
        run.hist.push(run.dead ? NaN : run.amp)
      }
      if (!Nw.dead && !Rx.dead) {
        let s = 0
        for (let i = 0; i < N; i++) s += (Nw.r[i] - Rx.r[i]) ** 2
        S.l2 = Math.sqrt(s / N)
      }
      S.k++
    }

    const draw = () => {
      const S = sim.current
      frame++
      if (playing && frame % 3 === 0) advance()
      if (S.stepOnce) {
        advance()
        S.stepOnce = false
      }
      ctx.clearRect(0, 0, W, H)
      const l = 56
      const r = W - 12
      // panel 1: density profiles
      const t1 = 8
      const h1 = 180
      ctx.strokeStyle = grid
      ctx.strokeRect(l, t1, r - l, h1)
      const lo = 1 - 0.1 * a0
      const hi = 1 + 1.1 * a0
      const py = (v: number) => t1 + h1 - ((v - lo) / (hi - lo)) * h1
      ctx.fillStyle = fg
      ctx.font = '10px monospace'
      for (const v of [1, 1 + a0 / 2, 1 + a0]) {
        ctx.fillText(v.toFixed(3), 6, py(v) + 3)
        ctx.strokeStyle = grid
        ctx.beginPath()
        ctx.moveTo(l, py(v))
        ctx.lineTo(r, py(v))
        ctx.stroke()
      }
      ctx.fillText('0', l - 3, t1 + h1 + 12)
      ctx.fillText('x = 1', r - 30, t1 + h1 + 12)
      S.runs.forEach((run, j) => {
        if (run.dead) return
        ctx.strokeStyle = RUNS[j].color
        ctx.lineWidth = j === 2 ? 2.5 : 1.5
        ctx.setLineDash(j === 2 ? [6, 3] : [])
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const X = l + ((i + 0.5) / N) * (r - l)
          const Y = Math.max(t1, Math.min(t1 + h1, py(run.r[i])))
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.lineWidth = 1
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText(`density rho(x),  t = ${(S.k * S.dt).toFixed(3)} / ${T.toFixed(3)}  (flow moves L/4)`, l + 6, t1 + 14)

      // panel 2: amplitude history (log)
      const t2 = t1 + h1 + 30
      const h2 = H - t2 - 22
      ctx.strokeStyle = grid
      ctx.strokeRect(l, t2, r - l, h2)
      const ly = (v: number) => t2 + h2 - ((Math.log10(Math.max(v, 1e-10)) + 10) / 10) * h2
      ctx.fillStyle = fg
      ctx.font = '10px monospace'
      for (let e = -10; e <= 0; e += 2) {
        ctx.fillText(`1e${e}`, 14, ly(10 ** e) + 3)
      }
      ctx.fillText('t = 0', l, t2 + h2 + 12)
      ctx.fillText(`t = ${T.toFixed(2)}`, r - 50, t2 + h2 + 12)
      S.runs.forEach((run, j) => {
        ctx.strokeStyle = RUNS[j].color
        ctx.lineWidth = j === 2 ? 2.5 : 1.5
        ctx.setLineDash(j === 2 ? [6, 3] : [])
        ctx.beginPath()
        let started = false
        run.hist.forEach((v, n) => {
          if (!Number.isFinite(v)) return
          const X = l + (n / S.nst) * (r - l)
          const Y = ly(v)
          if (!started) {
            ctx.moveTo(X, Y)
            started = true
          } else ctx.lineTo(X, Y)
        })
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.lineWidth = 1
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText('pulse amplitude max(rho) - mean(rho), log scale', l + 6, t2 + 14)

      if (frame % 12 === 0 || S.k >= S.nst) {
        setInfo({
          k: S.k,
          nst: S.nst,
          stepsE: S.stepsE,
          solvesN: S.solvesN,
          solvesR: S.solvesR,
          amps: S.runs.map((x) => x.amp),
          dead: S.runs.map((x) => x.dead),
          l2: S.l2,
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, aRatio, a0])

  const logA = Math.log10(aRatio)
  const acoustic = (cfl * (U0 + sim.current.cmax)) / U0
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-40">a / c_max: {aRatio.toPrecision(2)}</span>
          <input type="range" min={-0.5} max={1} step={0.01} value={logA} onChange={(e) => setARatio(+(10 ** +e.target.value).toPrecision(2))} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">material CFL: {cfl.toFixed(2)}</span>
          <input type="range" min={0.2} max={1} step={0.05} value={cfl} onChange={(e) => setCfl(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">pulse A0: {a0.toFixed(2)}</span>
          <input type="range" min={0.02} max={0.4} step={0.02} value={a0} onChange={(e) => setA0(+e.target.value)} className="flex-1" />
        </label>
        <span className="font-mono text-xs">acoustic Courant of implicit dt ≈ {acoustic.toFixed(1)}</span>
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
        <span className="font-mono">
          implicit step {info.k} / {info.nst} · explicit steps {info.stepsE}
        </span>
      </div>
      <table className="mt-3 w-full text-left font-mono text-xs">
        <thead>
          <tr>
            <th>scheme</th>
            <th>linear solves</th>
            <th>amplitude</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          {RUNS.map((rn, j) => (
            <tr key={rn.key} style={{ color: rn.color }}>
              <td>{rn.label}</td>
              <td>{j === 0 ? '-' : j === 1 ? info.solvesN : info.solvesR}</td>
              <td>{info.dead[j] ? '-' : info.amps[j].toExponential(2)}</td>
              <td>{info.dead[j] ? `blow-up @ step ${info.dead[j]}` : 'ok'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 font-mono text-xs">L2(relaxed − Newton) = {info.l2.toExponential(2)}</p>
    </div>
  )
}

export default JinXinNewtonPulseRace
