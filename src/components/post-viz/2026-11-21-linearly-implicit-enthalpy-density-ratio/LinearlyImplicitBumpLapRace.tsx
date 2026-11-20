'use client'

import { useEffect, useRef, useState } from 'react'

// Reproduces the post's Python: periodic density bump at uniform u0 = Mach, p = 1/g.
// Three runs share the same physical time:
//  explicit Rusanov (dt from |u|+c), semi-implicit with h = (rho h)^n / rho^{n+1} (eq. 18),
//  semi-implicit with h = (rho h)^n / rho^n. Linear pressure system (17) solved directly.

const W = 680
const H = 400
const N = 100
const G = 1.4
const DX = 1 / N
const RUNS = [
  { key: 'exp', label: 'explicit Rusanov', color: 'rgb(140,140,140)' },
  { key: 'new', label: 'semi-implicit, h/rho^{n+1}', color: 'rgb(30,160,90)' },
  { key: 'old', label: 'semi-implicit, h/rho^n', color: 'rgb(225,70,60)' },
] as const

type State = { rho: Float64Array; q: Float64Array; E: Float64Array; t: number; steps: number; du: number; dead: number; hist: number[] }

function init(mach: number): State {
  const rho = new Float64Array(N)
  const q = new Float64Array(N)
  const E = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    rho[i] = 1 + 0.2 * Math.exp(-(((x - 0.5) / 0.05) ** 2))
    q[i] = rho[i] * mach
    E[i] = 1 / G / (G - 1) + 0.5 * rho[i] * mach * mach
  }
  return { rho, q, E, t: 0, steps: 0, du: 0, dead: 0, hist: [] }
}

const R = (i: number) => (i + 1) % N
const Lf = (i: number) => (i - 1 + N) % N

function convect(U: Float64Array, F: Float64Array, a: Float64Array, dt: number) {
  const f = new Float64Array(N)
  for (let i = 0; i < N; i++) f[i] = 0.5 * (F[i] + F[R(i)]) - 0.5 * a[i] * (U[R(i)] - U[i])
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) out[i] = U[i] - (dt / DX) * (f[i] - f[Lf(i)])
  return out
}

function explicitStep(s: State, dt: number) {
  const u = new Float64Array(N)
  const p = new Float64Array(N)
  const sp = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    u[i] = s.q[i] / s.rho[i]
    p[i] = (G - 1) * (s.E[i] - 0.5 * s.rho[i] * u[i] * u[i])
    sp[i] = Math.abs(u[i]) + Math.sqrt(Math.max(G * p[i] / s.rho[i], 0))
  }
  const a = new Float64Array(N)
  for (let i = 0; i < N; i++) a[i] = Math.max(sp[i], sp[R(i)])
  const Fm = new Float64Array(N)
  const Fq = new Float64Array(N)
  const Fe = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    Fm[i] = s.q[i]
    Fq[i] = s.q[i] * u[i] + p[i]
    Fe[i] = (s.E[i] + p[i]) * u[i]
  }
  s.rho = convect(s.rho, Fm, a, dt)
  s.q = convect(s.q, Fq, a, dt)
  s.E = convect(s.E, Fe, a, dt)
}

// dense Gaussian elimination (diagonally dominant, no pivoting needed)
function solve(A: Float64Array, b: Float64Array) {
  for (let k = 0; k < N; k++) {
    const akk = A[k * N + k]
    for (let i = k + 1; i < N; i++) {
      const m = A[i * N + k] / akk
      if (m === 0) continue
      for (let j = k; j < N; j++) A[i * N + j] -= m * A[k * N + j]
      b[i] -= m * b[k]
    }
  }
  const x = new Float64Array(N)
  for (let i = N - 1; i >= 0; i--) {
    let sum = b[i]
    for (let j = i + 1; j < N; j++) sum -= A[i * N + j] * x[j]
    x[i] = sum / A[i * N + i]
  }
  return x
}

function semiStep(s: State, dt: number, useNew: boolean) {
  const u = new Float64Array(N)
  const p = new Float64Array(N)
  const k = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    u[i] = s.q[i] / s.rho[i]
    k[i] = 0.5 * s.rho[i] * u[i] * u[i]
    p[i] = (G - 1) * (s.E[i] - k[i])
  }
  const a = new Float64Array(N)
  for (let i = 0; i < N; i++) a[i] = Math.max(Math.abs(u[i]), Math.abs(u[R(i)]))
  const Fq = new Float64Array(N)
  const Fk = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    Fq[i] = s.q[i] * u[i]
    Fk[i] = k[i] * u[i]
  }
  const rs = convect(s.rho, s.q, a, dt)
  const qs = convect(s.q, Fq, a, dt)
  const ks = convect(k, Fk, a, dt)
  const h = new Float64Array(N)
  const Es = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    Es[i] = s.E[i] - (k[i] - ks[i])
    h[i] = (G * p[i]) / ((G - 1) * (useNew ? rs[i] : s.rho[i]))
  }
  const hf = new Float64Array(N)
  const qf = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    hf[i] = 0.5 * (h[i] + h[R(i)])
    qf[i] = 0.5 * (qs[i] + qs[R(i)])
  }
  const c2 = (dt * dt) / (DX * DX)
  const A = new Float64Array(N * N)
  const b = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const ip = R(i)
    const im = Lf(i)
    A[i * N + i] += 1 / (G - 1) + c2 * (hf[i] + hf[im])
    A[i * N + ip] += (-u[i] * dt) / (4 * DX) - c2 * hf[i]
    A[i * N + im] += (u[i] * dt) / (4 * DX) - c2 * hf[im]
    b[i] = Es[i] - 0.5 * u[i] * qs[i] - (dt / DX) * (hf[i] * qf[i] - hf[im] * qf[im])
  }
  const pn = solve(A, b)
  const qn = new Float64Array(N)
  const qfn = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    qn[i] = qs[i] - (dt * (pn[R(i)] - pn[Lf(i)])) / (2 * DX)
    qfn[i] = qf[i] - (dt * (pn[R(i)] - pn[i])) / DX
  }
  const En = new Float64Array(N)
  for (let i = 0; i < N; i++) En[i] = Es[i] - (dt / DX) * (hf[i] * qfn[i] - hf[Lf(i)] * qfn[Lf(i)])
  s.rho = rs
  s.q = qn
  s.E = En
}

function measure(s: State, mach: number) {
  let d = 0
  for (let i = 0; i < N; i++) {
    const v = Math.abs(s.q[i] / s.rho[i] - mach) / mach
    if (!Number.isFinite(v)) return Infinity
    d = Math.max(d, v)
  }
  return d
}

export function LinearlyImplicitBumpLapRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logM, setLogM] = useState(-2) // Mach = 10^logM
  const [cfl, setCfl] = useState(0.9)
  const [speed, setSpeed] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [tick, setTick] = useState(0)
  const mach = Math.pow(10, logM)
  const sim = useRef<{ runs: State[]; stepOnce: boolean; frame: number }>({ runs: [], stepOnce: false, frame: 0 })
  const [info, setInfo] = useState<{ t: number; rows: { steps: number; du: number; peak: number; dead: number }[] }>({ t: 0, rows: [] })

  const reset = () => {
    sim.current.runs = [init(mach), init(mach), init(mach)]
    sim.current.frame = 0
    setTick((v) => v + 1)
  }

  useEffect(reset, [logM, cfl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const dark = document.documentElement.classList.contains('dark')
    const fg = dark ? 'rgba(230,230,230,0.9)' : 'rgba(30,30,30,0.9)'
    const grid = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
    const T = 1 / mach
    const dtSemi = T / Math.ceil(T / ((cfl * DX) / mach))
    const dtExp = T / Math.ceil(T / ((0.9 * DX) / (mach + 1)))
    const rho0 = init(mach).rho
    let raf = 0

    const advance = () => {
      const [ex, sn, so] = sim.current.runs
      if (!sn || sn.t >= T - 1e-12) return
      for (const [s, useNew] of [
        [sn, true],
        [so, false],
      ] as [State, boolean][]) {
        if (s.dead) {
          s.t += dtSemi
          continue
        }
        semiStep(s, dtSemi, useNew)
        s.t += dtSemi
        s.steps++
        const d = measure(s, mach)
        s.du = Math.max(s.du, d)
        if (!(d < 1)) s.dead = s.steps
        s.hist.push(Math.log10(Math.max(d, 1e-7)))
      }
      while (ex.t < sn.t - 1e-12) {
        explicitStep(ex, dtExp)
        ex.t += dtExp
        ex.steps++
      }
      const d = measure(ex, mach)
      ex.du = Math.max(ex.du, d)
      ex.hist.push(Math.log10(Math.max(d, 1e-7)))
    }

    const draw = () => {
      const S = sim.current
      if (playing) for (let k = 0; k < speed; k++) advance()
      if (S.stepOnce) {
        advance()
        S.stepOnce = false
      }
      ctx.clearRect(0, 0, W, H)
      // panel 1: density
      const l = 50
      const r = W - 12
      const t1 = 8
      const h1 = 190
      ctx.strokeStyle = grid
      ctx.strokeRect(l, t1, r - l, h1)
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText(`density after t/T = ${(S.runs[1]?.t / T || 0).toFixed(3)} lap (black dashed = exact)`, l + 6, t1 + 14)
      ctx.font = '10px monospace'
      ctx.fillText('1.25', 8, t1 + 10)
      ctx.fillText('0.95', 8, t1 + h1)
      const yr = (v: number) => t1 + h1 - ((Math.max(0.95, Math.min(1.25, v)) - 0.95) / 0.3) * h1
      const xr = (i: number) => l + ((i + 0.5) / N) * (r - l)
      const shift = S.runs[1] ? (mach * S.runs[1].t) % 1 : 0
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = fg
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const xs = (((i + 0.5) * DX - shift) % 1 + 1) % 1
        const j = Math.min(N - 1, Math.floor(xs * N))
        const Y = yr(rho0[j])
        if (i === 0) ctx.moveTo(xr(i), Y)
        else ctx.lineTo(xr(i), Y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      S.runs.forEach((s, k) => {
        if (s.dead) return
        ctx.strokeStyle = RUNS[k].color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const Y = yr(s.rho[i])
          if (i === 0) ctx.moveTo(xr(i), Y)
          else ctx.lineTo(xr(i), Y)
        }
        ctx.stroke()
      })
      // panel 2: max |u-u0|/u0 history (log)
      const t2 = 220
      const h2 = 160
      ctx.strokeStyle = grid
      ctx.strokeRect(l, t2, r - l, h2)
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText('log10 max|u − u0|/u0  vs semi-implicit step', l + 6, t2 + 14)
      ctx.font = '10px monospace'
      ctx.fillText('1e0', 14, t2 + 10)
      ctx.fillText('1e-7', 10, t2 + h2)
      const nT = Math.ceil(T / dtSemi)
      S.runs.forEach((s, k) => {
        ctx.strokeStyle = RUNS[k].color
        ctx.lineWidth = 1.8
        ctx.beginPath()
        s.hist.forEach((v, n) => {
          const X = l + ((n + 1) / nT) * (r - l)
          const Y = t2 + h2 - ((Math.min(0, v) + 7) / 7) * h2
          if (n === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        })
        ctx.stroke()
      })
      ctx.fillStyle = fg
      ctx.fillText(`step 0 … ${nT}`, r - 90, t2 + h2 + 12)
      S.frame++
      if (S.frame % 10 === 0 || !playing) {
        setInfo({
          t: S.runs[1]?.t / T || 0,
          rows: S.runs.map((s) => {
            let mx = -Infinity
            for (let i = 0; i < N; i++) mx = Math.max(mx, s.rho[i])
            return { steps: s.steps, du: s.du, peak: (mx - 1) / 0.2, dead: s.dead }
          }),
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, mach, cfl, tick])

  const acoustic = (cfl * (1 + mach)) / mach

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-44">Mach u0/c: {mach.toPrecision(2)}</span>
          <input type="range" min={-2.3} max={-0.3} step={0.05} value={logM} onChange={(e) => setLogM(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44">material CFL (semi): {cfl.toFixed(2)}</span>
          <input type="range" min={0.1} max={1} step={0.05} value={cfl} onChange={(e) => setCfl(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44">semi steps / frame: {speed}</span>
          <input type="range" min={1} max={6} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="flex-1" />
        </label>
        <span className="font-mono text-xs">acoustic Courant of semi-implicit dt ≈ {acoustic.toFixed(1)}</span>
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
        <span className="font-mono">t/T = {info.t.toFixed(3)}</span>
      </div>
      <table className="mt-3 w-full text-left font-mono text-xs">
        <thead>
          <tr>
            <th>scheme</th>
            <th>steps</th>
            <th>max du/u0</th>
            <th>bump peak</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          {RUNS.map((rn, k) => {
            const row = info.rows[k]
            return (
              <tr key={rn.key} style={{ color: rn.color }}>
                <td>{rn.label}</td>
                <td>{row ? row.steps : '-'}</td>
                <td>{row && !row.dead ? row.du.toExponential(1) : '-'}</td>
                <td>{row && !row.dead ? row.peak.toFixed(3) : '-'}</td>
                <td>{row ? (row.dead ? `blow-up @ ${row.dead}` : 'ok') : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default LinearlyImplicitBumpLapRace
