'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const TOL = 1e-10
type Form = 'div' | 'lap'
const COL: Record<Form, string> = { div: '#22c55e', lap: '#f97316' }

type Sim = { u: Float64Array; n: number; steps: number; done: boolean; hist: number[] }

// same as the Python march(): explicit Euler, u_t = G + viscous term, walls u = 0
function makeGrid(N: number, r: number) {
  const dy = 1 / (N - 1)
  const k = Math.log(r)
  const muC = new Float64Array(N), muF = new Float64Array(N - 1)
  for (let i = 0; i < N; i++) muC[i] = Math.exp(-k * i * dy)
  for (let i = 0; i < N - 1; i++) muF[i] = Math.exp(-k * (i + 0.5) * dy)
  const dt = 0.4 * dy * dy / 1.0
  return { dy, muC, muF, dt, N }
}
function exactQ(r: number) {
  const m = 4001, ds = 1 / (m - 1), k = Math.log(r)
  let a = 0, b = 0
  for (let i = 0; i < m; i++) {
    const s = i * ds, w = Math.exp(k * s) * (i === 0 || i === m - 1 ? 0.5 : 1) * ds
    a += s * w; b += w
  }
  const C = a / b
  let u = 0, Q = 0, prev = C
  for (let i = 1; i < m; i++) {
    const s = i * ds, cur = (C - s) * Math.exp(k * s)
    const un = u + 0.5 * (prev + cur) * ds
    Q += 0.5 * (u + un) * ds
    u = un; prev = cur
  }
  return Q
}
const flowRate = (u: Float64Array, dy: number) => {
  let q = 0
  for (let i = 0; i < u.length - 1; i++) q += 0.5 * (u[i] + u[i + 1]) * dy
  return q
}

export function ChannelStressFormRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [r, setR] = useState(10)
  const [N, setN] = useState(41)
  const [speed, setSpeed] = useState(300)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ steps: 0, t: 0, qd: 0, ql: 0, qe: 0, bd: 0, bl: 0, dd: false, dl: false })
  const playRef = useRef(playing), speedRef = useRef(speed)
  playRef.current = playing; speedRef.current = speed
  const adv = useRef<(k: number) => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const g = makeGrid(N, r)
    const qe = exactQ(r)
    const sims: Record<Form, Sim> = {
      div: { u: new Float64Array(N), n: N, steps: 0, done: false, hist: [] },
      lap: { u: new Float64Array(N), n: N, steps: 0, done: false, hist: [] },
    }
    const tmp = new Float64Array(N)
    let raf = 0, frame = 0

    const step = (s: Sim, form: Form) => {
      const { u } = s, { dy, muC, muF, dt } = g
      let m = 0
      for (let i = 1; i < N - 1; i++) {
        let v: number
        if (form === 'div') v = (muF[i] * (u[i + 1] - u[i]) - muF[i - 1] * (u[i] - u[i - 1])) / (dy * dy)
        else v = muC[i] * (u[i + 1] - 2 * u[i] + u[i - 1]) / (dy * dy)
        tmp[i] = dt * (1 + v)
        m = Math.max(m, Math.abs(tmp[i]))
      }
      for (let i = 1; i < N - 1; i++) u[i] += tmp[i]
      s.steps++
      if (m / dt < TOL) s.done = true
      if (s.steps % 100 === 0) s.hist.push(flowRate(u, dy))
    }
    // control volume [dy/2, 1-dy/2]: pressure force minus wall-face shear
    const balance = (s: Sim) => {
      const { u } = s, { dy, muF } = g
      return 1 * (1 - dy) - (muF[0] * (u[1] - u[0]) / dy - muF[N - 2] * (u[N - 1] - u[N - 2]) / dy)
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const grey = 'rgba(140,140,140,0.95)'
      ctx.font = '12px ui-monospace, monospace'
      // profile panel
      const px = 50, py = 40, pw = 270, ph = 330
      const umax = 0.75
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
      const X = (u: number) => px + pw * u / umax, Y = (y: number) => py + ph * (1 - y)
      for (const f of ['div', 'lap'] as Form[]) {
        const s = sims[f]
        ctx.strokeStyle = COL[f]; ctx.lineWidth = 2; ctx.beginPath()
        for (let i = 0; i < N; i++) { const x = X(s.u[i]), y = Y(i * g.dy); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
        ctx.stroke()
        ctx.fillStyle = COL[f]
        for (let i = 0; i < N; i += Math.max(1, Math.floor(N / 20))) { ctx.beginPath(); ctx.arc(X(s.u[i]), Y(i * g.dy), 2, 0, 7); ctx.fill() }
      }
      ctx.fillStyle = grey
      ctx.fillText('u(y), 0 … 0.75', px + 4, py - 8)
      ctx.fillText('y=1 (μ=1/r)', px + pw - 90, py + 14)
      ctx.fillText('y=0 (μ=1)', px + pw - 74, py + ph - 6)
      // Q history panel
      const hx = 390, hy = 40, hw = 340, hh = 330
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(hx, hy, hw, hh)
      const qmax = Math.max(0.1, qe * 1.6)
      const len = Math.max(sims.div.hist.length, sims.lap.hist.length, 50)
      const HY = (q: number) => hy + hh * (1 - q / qmax)
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#e2e8f0'
      ctx.beginPath(); ctx.moveTo(hx, HY(qe)); ctx.lineTo(hx + hw, HY(qe)); ctx.stroke(); ctx.setLineDash([])
      for (const f of ['div', 'lap'] as Form[]) {
        const hs = sims[f].hist
        ctx.strokeStyle = COL[f]; ctx.lineWidth = 2; ctx.beginPath()
        hs.forEach((q, i) => { const x = hx + hw * i / len, y = HY(q); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) })
        ctx.stroke()
      }
      ctx.fillStyle = grey
      ctx.fillText(`flow rate Q vs step (0 … ${len * 100})`, hx + 4, hy - 8)
      ctx.fillText(`exact Q = ${qe.toFixed(5)}`, hx + 8, HY(qe) - 6)
      ctx.fillStyle = COL.div; ctx.fillText('∂y(μ ∂y u)  stress divergence', hx + 8, hy + hh - 30)
      ctx.fillStyle = COL.lap; ctx.fillText('μ ∂²u/∂y²   Laplacian form', hx + 8, hy + hh - 12)
    }

    const advance = (kk: number) => {
      for (let q = 0; q < kk; q++) {
        if (!sims.div.done) step(sims.div, 'div')
        if (!sims.lap.done) step(sims.lap, 'lap')
        if (sims.div.done && sims.lap.done) break
      }
      draw()
    }
    const pub = () => {
      const steps = Math.max(sims.div.steps, sims.lap.steps)
      setRead({
        steps, t: steps * g.dt, qd: flowRate(sims.div.u, g.dy), ql: flowRate(sims.lap.u, g.dy), qe,
        bd: balance(sims.div), bl: balance(sims.lap), dd: sims.div.done, dl: sims.lap.done,
      })
    }
    adv.current = (kk: number) => { advance(kk); pub() }
    advance(0); pub()
    const loop = () => {
      frame++
      if (playRef.current) advance(speedRef.current)
      if (frame % 12 === 0) pub()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [r, N, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const err = (q: number) => (100 * (q - read.qe) / read.qe)

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          r = μ_bot/μ_top = {r}{' '}
          <input type="range" min={1} max={30} step={1} value={r} onChange={(e) => setR(Number(e.target.value))} />
        </label>
        <label>
          N = {N}{' '}
          <input type="range" min={11} max={81} step={10} value={N} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label>
          steps/frame = {speed}{' '}
          <input type="range" min={10} max={2000} step={10} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(100) }}>Step ×100</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: 'rgba(140,140,140,0.95)' }}>step {read.steps} · t = {read.t.toFixed(3)} · Q_exact = {read.qe.toFixed(5)}</div>
        <div style={{ color: COL.div }}>div: Q = {read.qd.toFixed(5)} ({err(read.qd) >= 0 ? '+' : ''}{err(read.qd).toFixed(1)}%) · balance {read.bd.toExponential(1)}{read.dd ? ' ✓ steady' : ' …'}</div>
        <div style={{ color: COL.lap }}>lap: Q = {read.ql.toFixed(5)} ({err(read.ql) >= 0 ? '+' : ''}{err(read.ql).toFixed(1)}%) · balance {read.bl.toExponential(1)}{read.dl ? ' ✓ steady' : ' …'}</div>
      </div>
    </div>
  )
}
