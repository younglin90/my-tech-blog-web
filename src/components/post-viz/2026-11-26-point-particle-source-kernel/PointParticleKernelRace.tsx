'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const HGT = 360
const CP = 0.002
const NS = [16, 24, 32, 48, 64]
type Kind = 'cell' | 'stencil27' | 'gauss'
const KINDS: Kind[] = ['cell', 'stencil27', 'gauss']
const COLORS: Record<Kind, string> = { cell: '#f87171', stencil27: '#fbbf24', gauss: '#38bdf8' }

type Sim = {
  kind: Kind; N: number; dx: number; dt: number
  T: Float64Array; tmp: Float64Array
  idx: Int32Array; w: Float64Array; s: number
  Tp: number; t: number; seen: number; seenMax: number; tHalf: number
  hist: number[]
}

function makeSim(kind: Kind, N: number, sigma: number): Sim {
  const dx = 1 / N
  const c = N >> 1
  const ids: number[] = []
  const ws: number[] = []
  const R = kind === 'gauss' ? Math.min(c - 1, Math.ceil((4 * sigma) / dx)) : kind === 'stencil27' ? 1 : 0
  for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) for (let k = -R; k <= R; k++) {
    const r2 = (i * i + j * j + k * k) * dx * dx
    const wt = kind === 'gauss' ? Math.exp(-r2 / (2 * sigma * sigma)) : 1
    ids.push(((c + i) * N + (c + j)) * N + (c + k))
    ws.push(wt)
  }
  const sum = ws.reduce((a, b) => a + b, 0)
  const w = new Float64Array(ws.map((v) => v / sum))
  let s = 0
  for (const v of w) s += v * v
  return {
    kind, N, dx, dt: (0.9 * dx * dx) / 6,
    T: new Float64Array(N * N * N), tmp: new Float64Array(N * N * N),
    idx: new Int32Array(ids), w, s: s / (dx * dx * dx),
    Tp: 1, t: 0, seen: 0, seenMax: 0, tHalf: 0, hist: [1],
  }
}

// one explicit diffusion step + point-implicit particle/gas exchange (same as the Python code)
function step(m: Sim, H: number) {
  const { N, T, tmp, dt, dx, idx, w } = m
  const NN = N * N
  const lam = dt / (dx * dx)
  for (let i = 0; i < N; i++) {
    const ip = ((i + 1) % N) * NN, im = ((i + N - 1) % N) * NN, i0 = i * NN
    for (let j = 0; j < N; j++) {
      const jp = ((j + 1) % N) * N, jm = ((j + N - 1) % N) * N, j0 = j * N
      for (let k = 0; k < N; k++) {
        const kp = (k + 1) % N, km = (k + N - 1) % N
        const o = i0 + j0 + k
        const v = T[o]
        tmp[o] = v + lam * (T[ip + j0 + k] + T[im + j0 + k] + T[i0 + jp + k] + T[i0 + jm + k] + T[i0 + j0 + kp] + T[i0 + j0 + km] - 6 * v)
      }
    }
  }
  m.T = tmp; m.tmp = T
  let seen = 0
  for (let q = 0; q < idx.length; q++) seen += w[q] * m.T[idx[q]]
  const Q = (H * (m.Tp - seen)) / (1 + H * dt * (1 / CP + m.s))
  const dep = (dt * Q) / (dx * dx * dx)
  for (let q = 0; q < idx.length; q++) m.T[idx[q]] += dep * w[q]
  const TpOld = m.Tp
  m.Tp -= (dt * Q) / CP
  m.t += dt
  m.seen = seen + dt * Q * m.s
  if (m.seen > m.seenMax) m.seenMax = m.seen
  if (!m.tHalf && m.Tp <= 0.5) m.tHalf = m.t - (dt * (0.5 - m.Tp)) / (TpOld - m.Tp)
}

function heat(x: number) {
  const v = Math.sqrt(Math.max(0, Math.min(1, x)))
  return `rgb(${Math.round(15 + 240 * Math.min(1, v * 1.5))},${Math.round(25 + 210 * Math.max(0, v - 0.4) / 0.6)},${Math.round(60 + 80 * (1 - v))})`
}

export function PointParticleKernelRace() {
  const [nIdx, setNIdx] = useState(3)
  const [H, setH] = useState(0.25)
  const [sigma, setSigma] = useState(0.06)
  const [speed, setSpeed] = useState(4)
  const [playing, setPlaying] = useState(false)
  const [, setTick] = useState(0)
  const N = NS[nIdx]
  const cvRef = useRef<HTMLCanvasElement>(null)
  const sims = useRef<Sim[]>(KINDS.map((k) => makeSim(k, N, sigma)))
  const cfg = useRef({ H, speed, playing })
  cfg.current = { H, speed, playing }

  const allDone = () => sims.current.every((m) => m.tHalf > 0)
  const advance = (n: number) => {
    for (let r = 0; r < n; r++) {
      if (allDone()) break
      for (const m of sims.current) { step(m, cfg.current.H); if (m.hist.length < 4000 && Math.round(m.t / m.dt) % 4 === 0) m.hist.push(m.Tp) }
    }
  }
  const reset = () => { sims.current = KINDS.map((k) => makeSim(k, N, sigma)); setPlaying(false); setTick((v) => v + 1) }
  useEffect(() => { reset() }, [N, H, sigma]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let raf = 0
    let frame = 0
    const loop = () => {
      if (cfg.current.playing) { advance(cfg.current.speed); if (allDone()) setPlaying(false) }
      draw()
      if (++frame % 12 === 0) setTick((v) => v + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, W, HGT)
    ctx.font = '12px monospace'
    // three centre-plane slices, zoomed to the middle half of the box
    const S = 140
    sims.current.forEach((m, si) => {
      const ox = 20 + si * 205, oy = 22
      const lo = m.N >> 2, span = m.N >> 1
      const c = m.N >> 1
      const px = S / span
      for (let i = 0; i < span; i++) for (let j = 0; j < span; j++) {
        ctx.fillStyle = heat(m.T[((lo + i) * m.N + (lo + j)) * m.N + c] / 0.8)
        ctx.fillRect(ox + i * px, oy + j * px, px + 0.5, px + 0.5)
      }
      ctx.strokeStyle = COLORS[m.kind]
      ctx.lineWidth = 2
      ctx.strokeRect(ox, oy, S, S)
      ctx.fillStyle = COLORS[m.kind]
      ctx.fillText(m.kind, ox, oy - 6)
      ctx.fillStyle = heat(m.Tp)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(ox + (c - lo + 0.5) * px, oy + (c - lo + 0.5) * px, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    })
    // particle temperature history
    const gx = 60, gy = 190, gw = 560, gh = 140
    const tMax = Math.max(0.03, ...sims.current.map((m) => (m.tHalf || m.t) * 1.1))
    ctx.strokeStyle = '#475569'
    ctx.strokeRect(gx, gy, gw, gh)
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('1', gx - 14, gy + 8); ctx.fillText('0', gx - 14, gy + gh)
    ctx.fillText('T_particle', gx - 56, gy + gh / 2)
    ctx.fillText(`t = ${tMax.toFixed(3)}`, gx + gw - 70, gy + gh + 14)
    ctx.fillText('0', gx, gy + gh + 14)
    ctx.strokeStyle = 'rgba(226,232,240,0.4)'
    ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke()
    ctx.beginPath()
    for (let p = 0; p <= 100; p++) { const t = (tMax * p) / 100; const y = gy + gh * (1 - Math.exp((-cfg.current.H * t) / CP)); if (p) ctx.lineTo(gx + (gw * p) / 100, y); else ctx.moveTo(gx, y) }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillText('isolated (gas held at 0)', gx + 8, gy + gh - 8)
    for (const m of sims.current) {
      ctx.strokeStyle = COLORS[m.kind]
      ctx.lineWidth = 2
      ctx.beginPath()
      m.hist.forEach((v, q) => { const x = gx + (gw * q * 4 * m.dt) / tMax, y = gy + gh * (1 - v); if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
      ctx.stroke()
      if (m.tHalf) { ctx.fillStyle = COLORS[m.kind]; ctx.beginPath(); ctx.arc(gx + (gw * m.tHalf) / tMax, gy + gh / 2, 4, 0, 2 * Math.PI); ctx.fill() }
    }
  }

  const tIso = (CP / H) * Math.LN2
  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={HGT} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>Grid N: <b>{N}</b>³
          <input type="range" min={0} max={NS.length - 1} step={1} value={nIdx} onChange={(e) => setNIdx(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Exchange H: <b>{H.toFixed(2)}</b>
          <input type="range" min={0.05} max={1} step={0.05} value={H} onChange={(e) => setH(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Gauss sigma: <b>{sigma.toFixed(2)}</b>
          <input type="range" min={0.02} max={0.12} step={0.01} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Steps / frame: <b>{speed}</b>
          <input type="range" min={1} max={20} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => setPlaying((v) => !v)} disabled={allDone()}>{playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => { advance(cfg.current.speed); setTick((v) => v + 1) }} disabled={allDone()}>Step</button>
        <button onClick={reset}>Reset</button>
        <span style={{ fontSize: 13, color: '#94a3b8', alignSelf: 'center' }}>steps: {Math.round(sims.current[0].t / sims.current[0].dt)} · t_half isolated = {tIso.toFixed(5)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 6, marginTop: 8, fontSize: 13, fontFamily: 'monospace' }}>
        {sims.current.map((m) => (
          <div key={m.kind} style={{ color: COLORS[m.kind] }}>
            <div>{m.kind}: Tp {m.Tp.toFixed(3)}</div>
            <div>t_half {m.tHalf ? m.tHalf.toFixed(5) : '…'}</div>
            <div>seen max {m.seenMax.toFixed(3)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
