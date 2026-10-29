'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 430
const N = 100
const T = 0.3
const DX = 1 / N
const TOL = 1e-6
const KMAX = 20000
const C_OFF = '#fbbf24'
const C_PRE = '#ef4444'
const GREY = 'rgba(127,127,127,0.85)'
const CFLS = [1, 2, 4, 8, 20]

function pulse(s: number) {
  const d = (((s - 0.5 + 0.5) % 1) + 1) % 1 - 0.5
  return Math.exp(-((d / 0.08) ** 2))
}
function exactP(x: number, M: number, t: number) {
  return 0.5 * (pulse(x - (M + 1) * t) + pulse(x - (M - 1) * t))
}

type Sim = {
  d: number; D: number[]; lam: number; dt: number; ns: number; dtau: number
  p: Float64Array; u: Float64Array; pn: Float64Array; un: Float64Array; pm: Float64Array; um: Float64Array
  rp: Float64Array; ru: Float64Array
  n: number; k: number; r0: number; its: number; res: number[]; cum: number[]; err: number; done: boolean
}

// D = Gamma^-1 |Gamma A|, same as precond_mats in the Python code
function precondMats(M: number, d: number) {
  const tr = d * M + M, det = d * M * M - d
  const s = Math.sqrt((tr / 2) ** 2 - det)
  const lp = tr / 2 + s, lm = tr / 2 - s
  const mp = lp - d * M, mm = lm - d * M
  const den = d * (mm - mp)
  const ap = Math.abs(lp), am = Math.abs(lm)
  // R = [[d, d], [mp, mm]], Rinv = [[mm, -d], [-mp, d]] / den
  const a00 = (d * ap * mm - d * am * mp) / den
  const a01 = (-d * d * ap + d * d * am) / den
  const a10 = (mp * ap * mm - mm * am * mp) / den
  const a11 = (-mp * d * ap + mm * d * am) / den
  return { D: [a00 / d, a01 / d, a10, a11], lam: Math.max(ap, am) }
}

function newSim(M: number, cfl: number, d: number): Sim {
  const { D, lam } = precondMats(M, d)
  const ns = Math.max(1, Math.round(T / ((cfl * DX) / (1 + M))))
  const p = new Float64Array(N), u = new Float64Array(N)
  for (let i = 0; i < N; i++) p[i] = pulse((i + 0.5) * DX)
  return {
    d, D, lam, dt: T / ns, ns, dtau: (0.9 * DX) / lam,
    p, u, pn: p.slice(), un: u.slice(), pm: p.slice(), um: u.slice(),
    rp: new Float64Array(N), ru: new Float64Array(N),
    n: 0, k: 0, r0: 0, its: 0, res: [], cum: [0], err: 0, done: false,
  }
}

// one inner pseudo-time iteration (or step completion), mirrors dual_time_run
function iterate(s: Sim, M: number) {
  if (s.done) return
  const { p, u, pn, un, pm, um, rp, ru, D, dt } = s
  const bd = s.n > 0
  let rn = 0
  for (let i = 0; i < N; i++) {
    const ip = (i + 1) % N, im = (i + N - 1) % N
    const fR0 = (M * (p[i] + p[ip]) + (u[i] + u[ip])) / 2 - (D[0] * (p[ip] - p[i]) + D[1] * (u[ip] - u[i])) / 2
    const fR1 = ((p[i] + p[ip]) + M * (u[i] + u[ip])) / 2 - (D[2] * (p[ip] - p[i]) + D[3] * (u[ip] - u[i])) / 2
    const fL0 = (M * (p[im] + p[i]) + (u[im] + u[i])) / 2 - (D[0] * (p[i] - p[im]) + D[1] * (u[i] - u[im])) / 2
    const fL1 = ((p[im] + p[i]) + M * (u[im] + u[i])) / 2 - (D[2] * (p[i] - p[im]) + D[3] * (u[i] - u[im])) / 2
    const tp = bd ? (3 * p[i] - 4 * pn[i] + pm[i]) / (2 * dt) : (p[i] - pn[i]) / dt
    const tu = bd ? (3 * u[i] - 4 * un[i] + um[i]) / (2 * dt) : (u[i] - un[i]) / dt
    rp[i] = tp + (fR0 - fL0) / DX
    ru[i] = tu + (fR1 - fL1) / DX
    rn = Math.max(rn, Math.abs(rp[i]), Math.abs(ru[i]))
  }
  if (s.k === 0) { s.r0 = rn; s.res = [] }
  s.res.push(Math.log10(Math.max(rn / s.r0, 1e-12)))
  if (rn < TOL * s.r0 || s.k >= KMAX) {
    // physical step finished: shift time levels
    s.its += s.k; s.n++; s.cum.push(s.its)
    pm.set(pn); um.set(un); pn.set(p); un.set(u); s.k = 0
    if (s.n >= s.ns) {
      s.done = true
      let e = 0
      for (let i = 0; i < N; i++) e = Math.max(e, Math.abs(p[i] - exactP((i + 0.5) * DX, M, T)))
      s.err = e
    }
    return
  }
  const a = bd ? 1.5 / dt : 1 / dt
  const cp = 1 / (1 / (s.d * s.dtau) + a), cu = 1 / (1 / s.dtau + a)
  for (let i = 0; i < N; i++) { p[i] -= rp[i] * cp; u[i] -= ru[i] * cu }
  s.k++
}

export function DualTimeInnerLoopRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [M, setM] = useState(0.05)
  const [cflIdx, setCflIdx] = useState(0)
  const [logd, setLogd] = useState(Math.log10(0.05 * 0.05))
  const [budget, setBudget] = useState(40)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ a: '', b: '' })
  const playRef = useRef(playing)
  const budgetRef = useRef(budget)
  const adv = useRef<(k: number) => void>(() => {})
  playRef.current = playing
  budgetRef.current = budget
  const cfl = CFLS[cflIdx]

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const sims = [newSim(M, cfl, 1), newSim(M, cfl, 10 ** logd)]
    const cols = [C_OFF, C_PRE]
    let raf = 0, frame = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // --- left: p(x) for each run vs exact at its own physical time ---
      const px = 30, pw = 360, ph = 160
      sims.forEach((s, j) => {
        const py = 28 + j * 200
        const t = s.n * s.dt
        ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
        const X = (x: number) => px + x * pw
        const Y = (v: number) => py + ph - ((v + 0.15) / 1.25) * ph
        ctx.setLineDash([5, 4]); ctx.strokeStyle = GREY; ctx.beginPath()
        for (let i = 0; i < N; i++) { const x = (i + 0.5) * DX; i === 0 ? ctx.moveTo(X(x), Y(exactP(x, M, t))) : ctx.lineTo(X(x), Y(exactP(x, M, t))) }
        ctx.stroke(); ctx.setLineDash([])
        ctx.strokeStyle = cols[j]; ctx.lineWidth = 2; ctx.beginPath()
        for (let i = 0; i < N; i++) { const x = (i + 0.5) * DX; i === 0 ? ctx.moveTo(X(x), Y(s.p[i])) : ctx.lineTo(X(x), Y(s.p[i])) }
        ctx.stroke(); ctx.lineWidth = 1
        ctx.fillStyle = cols[j]
        ctx.fillText(`${j === 0 ? 'no Γ (δ=1)' : `Γ δ=${s.d.toExponential(1)}`}  step ${s.n}/${s.ns}  t=${t.toFixed(3)}  inner k=${s.k}`, px, py - 8)
        ctx.fillStyle = GREY; ctx.fillText('p(x), dashed = exact', px + pw - 140, py + 14)
      })
      // --- right top: cumulative inner iterations vs physical step ---
      const hx = 430, hy = 28, hw = 310, hh = 160
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(hx, hy, hw, hh)
      const ymax = Math.max(50, ...sims.map((s) => s.its + s.k))
      const ns = sims[0].ns
      const HX = (n: number) => hx + (n / ns) * hw
      const HY = (v: number) => hy + hh - (v / ymax) * hh
      sims.forEach((s, j) => {
        ctx.strokeStyle = cols[j]; ctx.lineWidth = 2; ctx.beginPath()
        s.cum.forEach((v, n) => (n === 0 ? ctx.moveTo(HX(n), HY(v)) : ctx.lineTo(HX(n), HY(v))))
        if (!s.done) ctx.lineTo(HX(s.n + 0.5), HY(s.its + s.k))
        ctx.stroke(); ctx.lineWidth = 1
      })
      ctx.fillStyle = GREY
      ctx.fillText('total inner iterations vs physical step', hx, hy - 8)
      ctx.fillText(`${Math.round(ymax)}`, hx + 4, hy + 14); ctx.fillText(`step ${ns}`, hx + hw - 50, hy + hh + 14)
      // --- right bottom: residual history of the current inner loop ---
      const ry = 228
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(hx, ry, hw, hh)
      const kmax = Math.max(20, ...sims.map((s) => s.res.length))
      const RX = (k: number) => hx + (k / kmax) * hw
      const RY = (l: number) => ry + (-l / 6.5) * hh
      ctx.setLineDash([5, 4]); ctx.strokeStyle = GREY
      ctx.beginPath(); ctx.moveTo(hx, RY(-6)); ctx.lineTo(hx + hw, RY(-6)); ctx.stroke(); ctx.setLineDash([])
      sims.forEach((s, j) => {
        ctx.strokeStyle = cols[j]; ctx.lineWidth = 2; ctx.beginPath()
        s.res.forEach((l, k) => (k === 0 ? ctx.moveTo(RX(k), RY(l)) : ctx.lineTo(RX(k), RY(l))))
        ctx.stroke(); ctx.lineWidth = 1
      })
      ctx.fillStyle = GREY
      ctx.fillText('log10 |r|/|r0|, current inner loop', hx, ry - 8)
      ctx.fillText('0', hx - 12, ry + 10); ctx.fillText('tol −6', hx + hw - 50, RY(-6) - 4)
      ctx.fillText(`k = 0 … ${kmax}`, hx + 4, ry + hh + 14)
    }
    const fmt = (s: Sim) => s.done
      ? `done: ${(s.its / s.ns).toFixed(1)} it/step, max|p−p_exact| = ${s.err.toFixed(3)}`
      : `step ${s.n}/${s.ns}, ${s.n ? (s.its / s.n).toFixed(1) : '—'} it/step so far`
    const advance = (kk: number) => { for (let q = 0; q < kk; q++) for (const s of sims) iterate(s, M); draw() }
    const pub = () => setRead({ a: fmt(sims[0]), b: fmt(sims[1]) })
    adv.current = (kk: number) => { advance(kk); pub() }
    advance(0); pub()
    const loop = () => {
      frame++
      if (playRef.current && !(sims[0].done && sims[1].done)) advance(budgetRef.current)
      if (frame % 12 === 0) pub()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [M, cfl, logd, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          Mach M = {M.toFixed(3)}{' '}
          <input type="range" min={0.01} max={0.2} step={0.005} value={M} onChange={(e) => setM(Number(e.target.value))} />
        </label>
        <label>
          CFL_ac = {cfl}{' '}
          <input type="range" min={0} max={CFLS.length - 1} step={1} value={cflIdx} onChange={(e) => setCflIdx(Number(e.target.value))} />
        </label>
        <label>
          Γ δ = {(10 ** logd).toExponential(1)}{' '}
          <input type="range" min={-4} max={0} step={0.05} value={logd} onChange={(e) => setLogd(Number(e.target.value))} />
        </label>
        <label>
          iterations/frame = {budget}{' '}
          <input type="range" min={1} max={300} step={1} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(1) }}>Step (1 iteration)</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
        <button style={btn(false)} onClick={() => setLogd(Math.max(-4, Math.log10(M * M)))}>δ = M²</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: C_OFF }}>no Γ: {read.a}</div>
        <div style={{ color: C_PRE }}>Γ: {read.b}</div>
      </div>
    </div>
  )
}
