'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const H = 300
const TOL = 1e-8

type Sim = { N: number; dy: number; dt: number; u: Float64Array; steps: number; res: number; hist: number[]; tauHist: number[]; done: boolean }

function makeSim(N: number): Sim {
  const dy = 1 / N
  return { N, dy, dt: 0.4 * dy * dy, u: new Float64Array(N), steps: 0, res: 1, hist: [], tauHist: [], done: false }
}

function step(s: Sim, P: number) {
  const { N, dy, dt, u } = s
  const ue = new Float64Array(N + 2)
  ue[0] = -u[0]
  ue[N + 1] = 2 - u[N - 1]
  for (let j = 0; j < N; j++) ue[j + 1] = u[j]
  let dmax = 0
  for (let j = 0; j < N; j++) {
    const lap = (ue[j + 2] - 2 * ue[j + 1] + ue[j]) / (dy * dy)
    const du = dt * (2 * P + lap)
    u[j] += du
    if (Math.abs(du) > dmax) dmax = Math.abs(du)
  }
  s.steps++
  s.res = dmax / dt
  if (s.res < TOL) s.done = true
}

function stats(s: Sim, P: number) {
  const { N, dy, u } = s
  const tau = (9 * u[0] - u[1]) / (3 * dy)
  let Q = 0
  let back = 0
  let err = 0
  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) * dy
    Q += u[j] * dy
    if (u[j] < 0) back += dy
    err = Math.max(err, Math.abs(u[j] - (y + P * y * (1 - y))))
  }
  return { tau, Q, back, err }
}

export function CouettePoiseuilleStartupRace() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [P, setP] = useState(-3)
  const [N, setN] = useState(40)
  const [speed, setSpeed] = useState(40)
  const [playing, setPlaying] = useState(false)
  const [tick, setTick] = useState(0)
  const sim = useRef<Sim>(makeSim(40))
  const cfg = useRef({ P, speed, playing })
  cfg.current = { P, speed, playing }

  const reset = (n = N) => {
    sim.current = makeSim(n)
    setPlaying(false)
    setTick((t) => t + 1)
  }

  useEffect(() => { reset(N) }, [N, P]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (k: number) => {
    const s = sim.current
    for (let i = 0; i < k && !s.done; i++) {
      step(s, cfg.current.P)
      if (s.steps % 20 === 0 || s.done) {
        s.hist.push(s.res)
        s.tauHist.push(stats(s, cfg.current.P).tau)
      }
    }
  }

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const draw = () => {
      const s = sim.current
      const Pv = cfg.current.P
      if (cfg.current.playing && !s.done) advance(cfg.current.speed)
      if (s.done && cfg.current.playing) setPlaying(false)
      frame++
      if (frame % 12 === 0) setTick((t) => t + 1)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '12px sans-serif'
      // left: profile
      const L = 40, R = 300, T = 24, B = H - 34
      let umin = Math.min(-0.5, Pv < -1 ? (1 + Pv) * (1 + Pv) / (4 * Pv) : 0)
      const umax = Math.max(1.2, 1 + (Pv > 1 ? (1 + Pv) * (1 + Pv) / (4 * Pv) : 0) + 0.2)
      umin -= 0.1
      const ux = (u: number) => L + ((u - umin) / (umax - umin)) * (R - L)
      const yy = (y: number) => B - y * (B - T)
      ctx.strokeStyle = '#475569'
      ctx.beginPath(); ctx.moveTo(ux(0), T); ctx.lineTo(ux(0), B); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('u/U', R - 24, B + 16); ctx.fillText('y/h', ux(0) + 4, T + 4)
      ctx.fillText(umin.toFixed(1), L, B + 16)
      ctx.strokeStyle = '#a3e635'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) { const y = i / 60; const X = ux(y + Pv * y * (1 - y)); if (i === 0) ctx.moveTo(X, yy(y)); else ctx.lineTo(X, yy(y)) }
      ctx.stroke(); ctx.setLineDash([])
      for (let j = 0; j < s.N; j++) {
        const y = (j + 0.5) * s.dy
        ctx.fillStyle = s.u[j] < 0 ? '#ef4444' : '#38bdf8'
        ctx.beginPath(); ctx.arc(ux(s.u[j]), yy(y), s.N > 50 ? 2 : 3, 0, Math.PI * 2); ctx.fill()
      }
      ctx.lineWidth = 1
      ctx.fillStyle = '#a3e635'; ctx.fillText('--- exact', L + 4, T - 8)
      ctx.fillStyle = '#38bdf8'; ctx.fillText('● FVM cells (red: u<0)', L + 70, T - 8)

      // right: residual + tau history
      const L2 = 350, R2 = W - 16
      ctx.strokeStyle = '#475569'
      ctx.beginPath(); ctx.moveTo(L2, T); ctx.lineTo(L2, B); ctx.lineTo(R2, B); ctx.stroke()
      const nh = Math.max(s.hist.length, 450)
      const lx = (i: number) => L2 + (i / nh) * (R2 - L2)
      const ly = (r: number) => { const l = Math.log10(Math.max(r, 1e-10)); return T + ((2 - l) / 12) * (B - T) }
      ctx.strokeStyle = '#f472b6'; ctx.beginPath()
      s.hist.forEach((r, i) => { if (i === 0) ctx.moveTo(lx(i), ly(r)); else ctx.lineTo(lx(i), ly(r)) })
      ctx.stroke()
      ctx.strokeStyle = '#facc15'; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(L2, ly(TOL)); ctx.lineTo(R2, ly(TOL)); ctx.stroke(); ctx.setLineDash([])
      const tmin = Math.min(-0.5, 1 + Pv - 0.5), tmax = Math.max(1.5, 1 + Pv + 0.5)
      const ty = (t: number) => B - ((t - tmin) / (tmax - tmin)) * (B - T)
      ctx.strokeStyle = '#38bdf8'; ctx.beginPath()
      s.tauHist.forEach((t, i) => { if (i === 0) ctx.moveTo(lx(i), ty(t)); else ctx.lineTo(lx(i), ty(t)) })
      ctx.stroke()
      ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(L2, ty(0)); ctx.lineTo(R2, ty(0)); ctx.stroke()
      ctx.fillStyle = '#f472b6'; ctx.fillText('log10 residual (1e2 → 1e-10)', L2 + 4, T - 8)
      ctx.fillStyle = '#38bdf8'; ctx.fillText('τ_bottom(t)', L2 + 190, T - 8)
      ctx.fillStyle = '#facc15'; ctx.fillText('tol 1e-8', R2 - 52, ly(TOL) - 4)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('steps →', R2 - 50, B + 16)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const s = sim.current
  const st = stats(s, P)
  void tick

  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>P: <b>{P.toFixed(2)}</b>
          <input type="range" min={-5} max={3} step={0.25} value={P} onChange={(e) => setP(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Cells N: <b>{N}</b>
          <input type="range" min={10} max={80} step={2} value={N} onChange={(e) => setN(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Steps / frame: <b>{speed}</b>
          <input type="range" min={1} max={200} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => setPlaying((v) => !v)} disabled={s.done}>{playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => { advance(cfg.current.speed); setTick((t) => t + 1) }} disabled={s.done}>Step</button>
        <button onClick={() => reset()}>Reset</button>
        <span style={{ fontSize: 13, color: s.done ? '#a3e635' : '#94a3b8', alignSelf: 'center' }}>{s.done ? 'steady (residual < 1e-8)' : playing ? 'marching…' : 'paused'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 6, marginTop: 8, fontSize: 13, fontFamily: 'monospace' }}>
        <div>steps: {s.steps}</div>
        <div>t_ss: {(s.steps * s.dt).toFixed(3)}</div>
        <div>tau_bot: {st.tau.toFixed(4)} (exact {(1 + P).toFixed(2)})</div>
        <div>Q: {st.Q.toFixed(4)}</div>
        <div style={{ color: st.back > 0 ? '#fca5a5' : undefined }}>backflow: {st.back.toFixed(3)}</div>
        <div>max_err: {st.err.toExponential(2)}</div>
      </div>
    </div>
  )
}
