'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 470
const GAM = 1.4
const T_END = 1
const GREY = 'rgba(127,127,127,0.85)'

type Mode = 'acoustic' | 'material'
type Lane = { name: string; scheme: 'explicit' | 'imex'; mode: Mode; color: string }
const LANES: Lane[] = [
  { name: 'A  explicit, acoustic CFL', scheme: 'explicit', mode: 'acoustic', color: '#38bdf8' },
  { name: 'B  explicit, material CFL', scheme: 'explicit', mode: 'material', color: '#ef4444' },
  { name: 'C  RS-IMEX,  material CFL', scheme: 'imex', mode: 'material', color: '#22c55e' },
]

type Sim = {
  rho: Float64Array; m: Float64Array; al: Float64Array; a0: Float64Array
  t: number; n: number; dead: boolean; deadT: number; hist: [number, number][]
}

function initSim(N: number, M: number): Sim {
  const dx = 1 / N
  const rho = new Float64Array(N), m = new Float64Array(N), al = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * dx
    al[i] = (0.8 * Math.atan(-2000 * (Math.abs(x - 0.5) - 0.2))) / Math.PI + 0.5
    rho[i] = 1 + 0.1 * M * M * Math.cos(2 * Math.PI * x)
    m[i] = rho[i]
  }
  return { rho, m, al, a0: al.slice(), t: 0, n: 0, dead: false, deadT: 0, hist: [[0, 0]] }
}

function l1(s: Sim) {
  let e = 0
  for (let i = 0; i < s.al.length; i++) e += Math.abs(s.al[i] - s.a0[i])
  return e / s.al.length
}

// one step of lane k; mirrors run() in the Python code
function stepSim(s: Sim, lane: Lane, M: number, nu: number) {
  const N = s.rho.length, dx = 1 / N
  const { rho, m, al } = s
  const u = new Float64Array(N)
  let speed = 0, umax = 0
  for (let i = 0; i < N; i++) {
    u[i] = m[i] / rho[i]
    const c = Math.sqrt(GAM * Math.pow(rho[i], GAM - 1))
    speed = Math.max(speed, lane.mode === 'acoustic' ? Math.abs(u[i]) + c / M : Math.abs(u[i]))
    umax = Math.max(umax, Math.abs(u[i]))
  }
  const dt = Math.min((nu * dx) / speed, T_END - s.t)
  const ip = (i: number) => (i + 1) % N, im = (i: number) => (i - 1 + N) % N
  let lam: number
  if (lane.scheme === 'explicit') {
    lam = 0
    for (let i = 0; i < N; i++) lam = Math.max(lam, Math.abs(u[i]) + Math.sqrt((GAM * Math.pow(rho[i], GAM)) / rho[i]) / M)
    const H0 = new Float64Array(N), H1 = new Float64Array(N)
    const f1 = (i: number) => m[i] * u[i] + Math.pow(rho[i], GAM) / (M * M)
    for (let i = 0; i < N; i++) {
      const j = ip(i)
      H0[i] = 0.5 * (m[i] + m[j]) - 0.5 * lam * (rho[j] - rho[i])
      H1[i] = 0.5 * (f1(i) + f1(j)) - 0.5 * lam * (m[j] - m[i])
    }
    for (let i = 0; i < N; i++) {
      rho[i] -= (dt / dx) * (H0[i] - H0[im(i)])
      m[i] -= (dt / dx) * (H1[i] - H1[im(i)])
    }
  } else {
    lam = umax
    const G = new Float64Array(N), Hf = new Float64Array(N), ms = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      const pbar = Math.pow(rho[i], GAM) - (1 + GAM * (rho[i] - 1))
      G[i] = m[i] * u[i] + pbar / (M * M)
    }
    for (let i = 0; i < N; i++) Hf[i] = 0.5 * (G[i] + G[ip(i)]) - 0.5 * lam * (m[ip(i)] - m[i])
    for (let i = 0; i < N; i++) ms[i] = m[i] - (dt / dx) * (Hf[i] - Hf[im(i)])
    const beta = (dt * dt * GAM) / (M * M) / (dx * dx)
    const mf = new Float64Array(N), rhs = new Float64Array(N)
    for (let i = 0; i < N; i++) mf[i] = 0.5 * (ms[i] + ms[ip(i)])
    for (let i = 0; i < N; i++) rhs[i] = rho[i] - (dt / dx) * (mf[i] - mf[im(i)])
    // circulant inverse of (1 + beta*(2 - shift+ - shift-)) : constant coefficients thanks to the reference state
    const cinv = new Float64Array(N)
    for (let j = 0; j < N; j++) {
      let acc = 0
      for (let k = 0; k < N; k++) {
        const th = (2 * Math.PI * k) / N
        acc += Math.cos(th * j) / (1 + beta * (2 - 2 * Math.cos(th)))
      }
      cinv[j] = acc / N
    }
    for (let i = 0; i < N; i++) {
      let acc = 0
      for (let j = 0; j < N; j++) acc += cinv[j] * rhs[(i - j + N) % N]
      rho[i] = acc
    }
    for (let i = 0; i < N; i++) m[i] = ms[i] - ((dt * GAM) / (M * M)) * ((rho[ip(i)] - rho[im(i)]) / (2 * dx))
  }
  // alpha: Rusanov form with the lane's dissipation speed lam (old u)
  const an = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const adv = (u[i] * (al[ip(i)] - al[im(i)])) / (2 * dx)
    const diss = 0.5 * lam * ((al[ip(i)] - 2 * al[i] + al[im(i)]) / dx)
    an[i] = al[i] - dt * (adv - diss)
  }
  al.set(an)
  s.t += dt
  s.n++
  for (let i = 0; i < N; i++) {
    if (!Number.isFinite(rho[i]) || Math.abs(rho[i] - 1) > 0.5) { s.dead = true; s.deadT = s.t; break }
  }
}

function metrics(s: Sim) {
  let w = 0, amax = 0, du = 0
  for (let i = 0; i < s.al.length; i++) {
    if (s.al[i] > 0.15 && s.al[i] < 0.85) w++
    amax = Math.max(amax, s.al[i])
    du = Math.max(du, Math.abs(s.m[i] / s.rho[i] - 1))
  }
  return { l1: l1(s), w, amax, du }
}

type Read = { t: number; n: number[]; l1: number[]; w: number[]; amax: number[]; du: number[]; dead: (number | null)[] }

export function BubbleImexCflRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logM, setLogM] = useState(-2)
  const [N, setN] = useState(100)
  const [nu, setNu] = useState(0.5)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const stepRef = useRef<() => void>(() => {})
  const M = Math.pow(10, logM)
  const empty: Read = { t: 0, n: [0, 0, 0], l1: [0, 0, 0], w: [0, 0, 0], amax: [0, 0, 0], du: [0, 0, 0], dead: [null, null, null] }
  const [read, setRead] = useState<Read>(empty)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const sims = LANES.map(() => initSim(N, M))
    let tTarget = 0
    const DT_FRAME = 1 / 200 // physical time per frame (one IMEX step at nu=0.5, N=100)

    const advanceTo = (tt: number) => {
      LANES.forEach((ln, k) => {
        const s = sims[k]
        let guard = 0
        while (!s.dead && s.t < Math.min(tt, T_END) - 1e-12 && guard++ < 4000) {
          stepSim(s, ln, M, nu)
          if (s.n % 20 === 0 || s.t >= T_END - 1e-12) s.hist.push([s.t, l1(s)])
        }
      })
    }
    stepRef.current = () => { tTarget = Math.min(T_END, tTarget + DT_FRAME); advanceTo(tTarget) }

    const pad = 54, pw = W - pad - 16
    const X = (x: number) => pad + x * pw
    const draw = () => {
      const c = ctx
      c.clearRect(0, 0, W, H)
      c.font = '12px ui-monospace, monospace'
      // panel 1: alpha profiles
      const y1 = 18, h1 = 230
      const Ya = (v: number) => y1 + h1 - ((Math.max(-0.05, Math.min(1.05, v)) + 0.05) / 1.1) * h1
      c.strokeStyle = GREY; c.lineWidth = 1; c.strokeRect(pad, y1, pw, h1)
      c.fillStyle = GREY
      for (const v of [0.1, 0.5, 0.9]) c.fillText(v.toFixed(1), 18, Ya(v) + 4)
      c.fillText('α1(x) at current t   (dashed = exact: back to initial at t = 1)', pad + 6, y1 + 14)
      c.fillText('x', pad + pw - 10, y1 + h1 + 14)
      c.setLineDash([5, 4]); c.strokeStyle = GREY; c.beginPath()
      for (let i = 0; i < N; i++) {
        // exact solution: initial profile shifted by u*t
        const x = (i + 0.5) / N
        const xs = (((x - Math.min(T_END, tTarget)) % 1) + 1) % 1
        const a = (0.8 * Math.atan(-2000 * (Math.abs(xs - 0.5) - 0.2))) / Math.PI + 0.5
        if (i === 0) c.moveTo(X(x), Ya(a)); else c.lineTo(X(x), Ya(a))
      }
      c.stroke(); c.setLineDash([])
      LANES.forEach((ln, k) => {
        const s = sims[k]
        if (s.dead) return
        c.strokeStyle = ln.color; c.lineWidth = 2; c.beginPath()
        for (let i = 0; i < N; i++) {
          const xx = X((i + 0.5) / N), yy = Ya(s.al[i])
          if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy)
        }
        c.stroke()
      })
      // panel 2: L1(alpha) history
      const y2 = 285, h2 = 150
      const Yl = (v: number) => y2 + h2 - (Math.min(0.45, v) / 0.45) * h2
      c.lineWidth = 1; c.strokeStyle = GREY; c.strokeRect(pad, y2, pw, h2)
      c.fillStyle = GREY
      for (const v of [0, 0.2, 0.4]) c.fillText(v.toFixed(1), 22, Yl(v) + 4)
      c.fillText('L1 error of α1 vs time t', pad + 6, y2 + 14)
      for (const v of [0, 0.5, 1]) c.fillText(v.toFixed(1), X(v) - 8, y2 + h2 + 14)
      LANES.forEach((ln, k) => {
        const s = sims[k]
        c.strokeStyle = ln.color; c.lineWidth = 1.8; c.beginPath()
        s.hist.forEach(([t, e], j) => { if (j === 0) c.moveTo(X(t), Yl(e)); else c.lineTo(X(t), Yl(e)) })
        c.stroke()
        if (s.dead) {
          c.fillStyle = ln.color
          c.fillText(`✕ B blew up at t = ${s.deadT.toFixed(3)} (step ${s.n})`, X(Math.max(0.02, s.deadT)), y2 + 34)
        }
      })
      c.fillStyle = GREY
      c.fillText(`M = ${M.toPrecision(2)}   N = ${N}   ν = ${nu.toFixed(2)}   t = ${Math.min(T_END, tTarget).toFixed(3)}`, pad, H - 8)
    }

    let raf = 0, frame = 0
    const loop = () => {
      if (playing && tTarget < T_END) stepRef.current()
      draw()
      if (++frame % 12 === 0 || tTarget >= T_END) {
        const ms = sims.map(metrics)
        setRead({
          t: tTarget, n: sims.map((s) => s.n), l1: ms.map((q) => q.l1), w: ms.map((q) => q.w),
          amax: ms.map((q) => q.amax), du: ms.map((q) => q.du), dead: sims.map((s) => (s.dead ? s.deadT : null)),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [M, N, nu, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(34,197,94,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Mach M = {M.toPrecision(2)}{' '}
          <input type="range" min={-2.5} max={0} step={0.05} value={logM} onChange={(e) => setLogM(+e.target.value)} />
        </label>
        <label>cells N = {N}{' '}
          <input type="range" min={40} max={100} step={10} value={N} onChange={(e) => setN(+e.target.value)} />
        </label>
        <label>CFL ν = {nu.toFixed(2)}{' '}
          <input type="range" min={0.1} max={0.9} step={0.05} value={nu} onChange={(e) => setNu(+e.target.value)} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, overflowX: 'auto' }}>
        <div>t = {read.t.toFixed(3)} / 1   (Step = advance physical time by 0.005)</div>
        {LANES.map((ln, k) => (
          <div key={ln.name} style={{ color: ln.color, whiteSpace: 'pre' }}>
            {ln.name}  steps {String(read.n[k]).padStart(6, ' ')}
            {read.dead[k] !== null
              ? `  blew up at t=${(read.dead[k] as number).toFixed(3)}`
              : `  L1(α)=${read.l1[k].toFixed(4)}  width=${read.w[k]}  max α=${read.amax[k].toFixed(3)}  max|u−1|=${read.du[k].toExponential(1)}`}
          </div>
        ))}
      </div>
    </div>
  )
}
