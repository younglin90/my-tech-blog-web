'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const N = 100
const MAXIT = 30000
const KAPPAS = [0.1, 0.25, 0.5, 1, 2, 4, 8]

// reduced van der Waals: rho_c = T_c = p_c = 1
const p0 = (r: number, T: number) => (8 * T * r) / (3 - r) - 3 * r * r
const mu0 = (r: number, T: number) => ((8 * T) / 3) * (Math.log(r / (3 - r)) + r / (3 - r)) - 6 * r
const psi = (r: number, T: number) => r * mu0(r, T) - p0(r, T)

function maxwell(T: number) {
  let rg = 1 - 2 * Math.sqrt(1 - T), rl = 1 + 2 * Math.sqrt(1 - T)
  const h = 1e-7
  for (let k = 0; k < 50; k++) {
    const f1 = mu0(rl, T) - mu0(rg, T), f2 = p0(rl, T) - p0(rg, T)
    const a = (mu0(rl + h, T) - mu0(rl, T)) / h, b = -(mu0(rg + h, T) - mu0(rg, T)) / h
    const c = (p0(rl + h, T) - p0(rl, T)) / h, d = -(p0(rg + h, T) - p0(rg, T)) / h
    const det = a * d - b * c
    rl -= (d * f1 - b * f2) / det
    rg -= (-c * f1 + a * f2) / det
  }
  return [rg, rl]
}

type Run = {
  T: number; kappa: number; rg: number; rl: number; mub: number; pb: number; sExact: number
  r: Float64Array; res: Float64Array; it: number; last: number; hist: number[]; done: boolean
}

// same setup as korteweg_profile(): dz = 1, tanh start, zero-gradient ends
function initRun(T: number, kappa: number): Run {
  const [rg, rl] = maxwell(T)
  const mub = mu0(rl, T), pb = p0(rl, T)
  const r = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const z = i + 0.5 - N / 2
    r[i] = 0.5 * (rl + rg) + 0.5 * (rl - rg) * Math.tanh((z * Math.sqrt(1 - T)) / Math.sqrt(kappa))
  }
  let sExact = 0
  const m = 4000
  for (let k = 0; k < m; k++) {
    const rr = rg + ((k + 0.5) * (rl - rg)) / m
    const Wv = Math.max(psi(rr, T) - mub * rr + pb, 0)
    sExact += (Math.sqrt(2 * kappa * Wv) * (rl - rg)) / m
  }
  return { T, kappa, rg, rl, mub, pb, sExact, r, res: new Float64Array(N), it: 0, last: 1, hist: [], done: false }
}

const at = (r: Float64Array, i: number) => r[Math.min(N - 1, Math.max(0, i))]

// one gradient-flow iteration: rho -= dt (mu0 - kappa rho'' - mu_b)
function iterate(R: Run) {
  const dt = 0.2 * Math.min(1 / R.kappa, 1)
  let m = 0
  for (let i = 0; i < N; i++) {
    R.res[i] = mu0(R.r[i], R.T) - R.kappa * (at(R.r, i - 1) - 2 * R.r[i] + at(R.r, i + 1)) - R.mub
    m = Math.max(m, Math.abs(R.res[i]))
  }
  for (let i = 0; i < N; i++) R.r[i] -= dt * R.res[i]
  R.it++
  R.last = m
  if (R.it % 20 === 0 || m < 1e-7) R.hist.push(Math.log10(Math.max(m, 1e-12)))
  if (m < 1e-7 || R.it >= MAXIT) R.done = true
}

function stress(R: Run) {
  const pN = new Float64Array(N), pT = new Float64Array(N)
  let sigma = 0, gmax = 0, spread = 0
  for (let i = 0; i < N; i++) {
    const a = at(R.r, i - 1), b = at(R.r, i + 1)
    const d1 = (b - a) / 2, lap = a - 2 * R.r[i] + b
    const iso = p0(R.r[i], R.T) - R.kappa * R.r[i] * lap
    pN[i] = iso + 0.5 * R.kappa * d1 * d1
    pT[i] = iso - 0.5 * R.kappa * d1 * d1
    sigma += pN[i] - pT[i]
    gmax = Math.max(gmax, Math.abs(d1))
    spread = Math.max(spread, Math.abs(pN[i] - R.pb))
  }
  return { pN, pT, sigma, width: (R.rl - R.rg) / gmax, spread }
}

type Dot = { w: number; ratio: number; T: number; kappa: number }

export function KortewegLatticeRelaxRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [T, setT] = useState(0.85)
  const [ki, setKi] = useState(2)
  const [spf, setSpf] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const dots = useRef<Dot[]>([])
  const adv = useRef<(k: number) => void>(() => {})
  const [read, setRead] = useState({ it: 0, res: 1, sig: 0, ex: 0, w: 0, spread: 0, done: false })
  const kappa = KAPPAS[ki]

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const R = initRun(T, kappa)
    let raf = 0, frame = 0, logged = false
    const finish = () => {
      if (!R.done || logged) return
      logged = true
      const s = stress(R)
      dots.current = dots.current.filter((d) => !(d.T === R.T && d.kappa === R.kappa))
      dots.current.push({ w: s.width, ratio: s.sigma / R.sExact, T: R.T, kappa: R.kappa })
    }
    adv.current = (k: number) => { for (let j = 0; j < k && !R.done; j++) iterate(R); finish() }
    const draw = () => {
      frame++
      if (playing) adv.current(spf)
      const s = stress(R)
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-sans-serif, system-ui'
      const x0 = 50, x1 = 400
      const X = (i: number) => x0 + ((i + 0.5) / N) * (x1 - x0)
      // profile on the lattice
      const yA0 = 30, yA1 = 170
      const YA = (r: number) => yA1 - (r / 2.2) * (yA1 - yA0)
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x0, yA1); ctx.lineTo(x1, yA1); ctx.stroke()
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.beginPath()
      for (let i = 0; i < N; i++) { const x = X(i), y = YA(R.r[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke()
      ctx.fillStyle = '#38bdf8'
      for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(X(i), YA(R.r[i]), 2, 0, 2 * Math.PI); ctx.fill() }
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('ρ on the lattice (dz = 1, one dot = one node)', x0, yA0 - 10)
      // pN, pT
      const yB0 = 215, yB1 = 395, yMid = yB0 + 40
      let dmin = -1e-4
      for (let i = 0; i < N; i++) dmin = Math.min(dmin, s.pT[i] - R.pb)
      const sc = -dmin * 1.2
      const YB = (d: number) => yMid - (d / sc) * (yB1 - yMid)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x1, yMid); ctx.stroke()
      const line = (arr: Float64Array, col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        for (let i = 0; i < N; i++) { const y = Math.max(yB0 - 30, Math.min(yB1, YB(arr[i] - R.pb))); i ? ctx.lineTo(X(i), y) : ctx.moveTo(X(i), y) }
        ctx.stroke()
      }
      line(s.pT, '#f97316'); line(s.pN, '#22c55e')
      ctx.fillStyle = '#22c55e'; ctx.fillText('p_N − p_b', x0, yB0 - 12)
      ctx.fillStyle = '#f97316'; ctx.fillText('p_T − p_b', x0 + 80, yB0 - 12)
      ctx.fillStyle = '#94a3b8'; ctx.fillText(`max|p_N − p_b| = ${s.spread.toExponential(2)}`, x0 + 170, yB0 - 12)
      // residual history
      const xr0 = 450, xr1 = 730, yr0 = 30, yr1 = 170
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.strokeRect(xr0, yr0, xr1 - xr0, yr1 - yr0)
      const YR = (lg: number) => yr0 + ((0 - lg) / 9) * (yr1 - yr0)
      ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.setLineDash([4, 4]); ctx.beginPath()
      ctx.moveTo(xr0, YR(-7)); ctx.lineTo(xr1, YR(-7)); ctx.stroke(); ctx.setLineDash([])
      const hn = Math.max(R.hist.length, 50)
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5; ctx.beginPath()
      R.hist.forEach((v, k) => { const x = xr0 + (k / hn) * (xr1 - xr0), y = Math.min(yr1, Math.max(yr0, YR(v))); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y) })
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('log10 max|μ0 − κρ″ − μ_b|  vs iteration', xr0, yr0 - 10)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('0', xr0 - 14, yr0 + 4); ctx.fillText('−9', xr0 - 20, yr1 + 4)
      ctx.fillStyle = '#ef4444'; ctx.fillText('tol 1e-7', xr1 - 52, YR(-7) - 4)
      // ratio vs width scatter (one dot per finished run)
      const xs0 = 450, xs1 = 730, ys0 = 215, ys1 = 395
      const XS = (w: number) => xs0 + (Math.min(w, 16) / 16) * (xs1 - xs0)
      const YS = (q: number) => ys1 - ((q - 0.5) / 0.55) * (ys1 - ys0)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(xs0, ys0, xs1 - xs0, ys1 - ys0)
      ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.setLineDash([4, 4]); ctx.beginPath()
      ctx.moveTo(xs0, YS(1)); ctx.lineTo(xs1, YS(1)); ctx.stroke(); ctx.setLineDash([])
      for (const d of dots.current) {
        const hot = d.T === R.T && d.kappa === R.kappa
        ctx.fillStyle = `hsl(${Math.round(260 - (d.T - 0.75) * 800)},80%,62%)`
        ctx.beginPath(); ctx.arc(XS(d.w), YS(Math.max(0.5, d.ratio)), hot ? 6 : 4, 0, 2 * Math.PI); ctx.fill()
      }
      if (!R.done) {
        ctx.strokeStyle = '#facc15'; ctx.beginPath(); ctx.arc(XS(s.width), YS(Math.max(0.5, s.sigma / R.sExact)), 6, 0, 2 * Math.PI); ctx.stroke()
      }
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('σ_stress / σ_exact  vs  interface width (cells)', xs0, ys0 - 10)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('1.0', xs0 - 24, YS(1) + 4); ctx.fillText('0.5', xs0 - 24, ys1 + 4)
      ctx.fillText('0', xs0 - 3, ys1 + 16); ctx.fillText('8', (xs0 + xs1) / 2 - 3, ys1 + 16); ctx.fillText('16', xs1 - 8, ys1 + 16)
      ctx.fillText('dot color: T/T_c (blue→red = 0.75→0.98)', xs0 + 6, ys0 + 16)
      if (frame % 12 === 0) setRead({ it: R.it, res: R.last, sig: s.sigma, ex: R.sExact, w: s.width, spread: s.spread, done: R.done })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [T, kappa, spf, playing, nonce])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>T/T_c = {T.toFixed(2)} <input type="range" min={0.75} max={0.98} step={0.01} value={T} onChange={(e) => setT(+e.target.value)} /></label>
        <label>κ = {kappa} <input type="range" min={0} max={KAPPAS.length - 1} step={1} value={ki} onChange={(e) => setKi(+e.target.value)} /></label>
        <label>iters/frame {spf} <input type="range" min={1} max={400} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(50) }}>Step ×50</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
        <button style={btn(false)} onClick={() => { dots.current = []; setNonce((v) => v + 1) }}>Clear dots</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        iter {read.it} · residual {read.res.toExponential(2)}{read.done ? (read.res < 1e-7 ? ' · converged' : ' · hit 30000 cap') : ''} · width {read.w.toFixed(2)} cells ·
        σ_stress {read.sig.toFixed(5)} · σ_exact {read.ex.toFixed(5)} · ratio {(read.sig / Math.max(read.ex, 1e-12)).toFixed(4)} · max|p_N−p_b| {read.spread.toExponential(2)}
      </div>
    </div>
  )
}
