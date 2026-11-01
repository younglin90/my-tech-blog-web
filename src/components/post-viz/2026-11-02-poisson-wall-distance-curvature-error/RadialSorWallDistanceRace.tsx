'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const CASES = ['flat', 'cyl', 'sph', 'pipe'] as const
type Case = typeof CASES[number]
const COL: Record<Case, string> = { flat: '#94a3b8', cyl: '#3b82f6', sph: '#ef4444', pipe: '#22c55e' }
const K: Record<Case, number> = { flat: 0, cyl: 1, sph: 2, pipe: 1 }
const YS = [0.1, 0.5, 1.0]
const TOL = 1e-9
const MAXIT = 200000

type Sim = {
  r: Float64Array; phi: Float64Array; d: Float64Array; n: number; h: number; k: number
  wall: number; omega: number; it: number; done: boolean; hist: number[]; dmax: number
}

// same setup as the Python poisson_phi(): wall phi=0 at one end, dphi/dr=0 at the other
function newSim(c: Case, R: number, n: number): Sim {
  const pipe = c === 'pipe'
  const r0 = pipe ? 0 : 1
  const r1 = pipe ? 1 : c === 'flat' ? 6 : R
  const h = (r1 - r0) / n
  const r = new Float64Array(n + 1)
  for (let i = 0; i <= n; i++) r[i] = r0 + i * h
  return {
    r, phi: new Float64Array(n + 1), d: new Float64Array(n + 1), n, h, k: K[c],
    wall: pipe ? n : 0, omega: 2 / (1 + Math.sin(Math.PI / (2 * n))), it: 0, done: false,
    hist: [], dmax: 1,
  }
}
// one SOR sweep, identical ordering to the Python loop
function sweep(s: Sim) {
  const { r, phi, n, h, k, wall, omega } = s
  let dmax = 0
  for (let i = 0; i <= n; i++) {
    if (i === wall) continue
    let nv: number
    if (i === 0 && r[0] === 0) nv = phi[1] + (h * h) / (2 * (1 + k))
    else if (i === 0 || i === n) nv = phi[i === 0 ? 1 : n - 1] + 0.5 * h * h
    else {
      const c = (k * h) / (2 * r[i])
      nv = 0.5 * ((1 - c) * phi[i - 1] + (1 + c) * phi[i + 1] + h * h)
    }
    const du = omega * (nv - phi[i])
    phi[i] += du
    if (Math.abs(du) > dmax) dmax = Math.abs(du)
  }
  s.it++
  const scale = Math.max(phi[0], phi[n]) + 1e-300
  s.dmax = dmax / scale
  if (dmax < TOL * scale) s.done = true
}
// Spalding: d = -|grad phi| + sqrt(|grad phi|^2 + 2 phi)
function spalding(s: Sim) {
  const { phi, n, h, d } = s
  for (let i = 0; i <= n; i++) {
    let g: number
    if (i === 0) g = (-3 * phi[0] + 4 * phi[1] - phi[2]) / (2 * h)
    else if (i === n) g = (3 * phi[n] - 4 * phi[n - 1] + phi[n - 2]) / (2 * h)
    else g = (phi[i + 1] - phi[i - 1]) / (2 * h)
    g = Math.abs(g)
    d[i] = -g + Math.sqrt(g * g + 2 * Math.max(phi[i], 0))
  }
}
function yOf(s: Sim, i: number) { return s.wall === 0 ? s.r[i] - s.r[0] : s.r[s.n] - s.r[i] }
function ratioAt(s: Sim, y: number) {
  for (let i = 0; i < s.n; i++) {
    const y0 = yOf(s, i), y1 = yOf(s, i + 1)
    const lo = Math.min(y0, y1), hi = Math.max(y0, y1)
    if (y >= lo && y <= hi) {
      const t = (y - y0) / (y1 - y0)
      return (s.d[i] + t * (s.d[i + 1] - s.d[i])) / y
    }
  }
  return NaN
}

type Read = Record<Case, { it: number; done: boolean; r: number[] }>

export function RadialSorWallDistanceRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [R, setR] = useState(20)
  const [N, setN] = useState(160)
  const [speed, setSpeed] = useState(200)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const empty = () => Object.fromEntries(CASES.map((c) => [c, { it: 0, done: false, r: [0, 0, 0] }])) as Read
  const [read, setRead] = useState<Read>(empty)
  const playRef = useRef(playing)
  const speedRef = useRef(speed)
  const adv = useRef<(k: number) => void>(() => {})
  useEffect(() => { playRef.current = playing }, [playing])
  useEffect(() => { speedRef.current = speed }, [speed])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const sims = Object.fromEntries(CASES.map((c) => [c, newSim(c, R, N)])) as Record<Case, Sim>
    let raf = 0, frame = 0
    const grey = 'rgba(127,127,127,0.9)'

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // left: d_PDE / y  vs  y
      const px = 50, py = 30, pw = 320, ph = 340, ymax = 1.5, rmax = 2.2, rmin = 0.6
      const X = (y: number) => px + (y / ymax) * pw
      const Y = (v: number) => py + ph - ((v - rmin) / (rmax - rmin)) * ph
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
      ctx.setLineDash([5, 4]); ctx.strokeStyle = grey
      ctx.beginPath(); ctx.moveTo(px, Y(1)); ctx.lineTo(px + pw, Y(1)); ctx.stroke()
      for (const y of YS) { ctx.beginPath(); ctx.moveTo(X(y), py); ctx.lineTo(X(y), py + ph); ctx.strokeStyle = 'rgba(127,127,127,0.25)'; ctx.stroke() }
      ctx.setLineDash([])
      for (const c of CASES) {
        const s = sims[c]
        ctx.strokeStyle = COL[c]; ctx.lineWidth = 2; ctx.beginPath()
        let first = true
        for (let i = 0; i <= s.n; i++) {
          const y = yOf(s, i)
          if (y < 0.02 || y > ymax) continue
          const v = Math.min(rmax, Math.max(rmin, s.d[i] / y))
          if (first) { ctx.moveTo(X(y), Y(v)); first = false } else ctx.lineTo(X(y), Y(v))
        }
        ctx.stroke(); ctx.lineWidth = 1
      }
      ctx.fillStyle = grey
      ctx.fillText('d_PDE / d_exact  vs  wall distance y/a', px, py - 10)
      ctx.fillText('0', X(0) - 3, py + ph + 16); ctx.fillText('0.5', X(0.5) - 10, py + ph + 16)
      ctx.fillText('1.0', X(1) - 10, py + ph + 16); ctx.fillText('1.5', X(1.5) - 22, py + ph + 16)
      for (const v of [0.8, 1, 1.5, 2]) ctx.fillText(v.toFixed(1), px - 30, Y(v) + 4)
      // right: convergence history
      const hx = 420, hy = 30, hw = 320, hh = 340
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(hx, hy, hw, hh)
      let itMax = 1000
      for (const c of CASES) itMax = Math.max(itMax, sims[c].it)
      const HX = (t: number) => hx + (t / itMax) * hw
      const HY = (lg: number) => hy + hh - ((lg + 11) / 11) * hh
      ctx.setLineDash([5, 4]); ctx.strokeStyle = grey
      ctx.beginPath(); ctx.moveTo(hx, HY(-9)); ctx.lineTo(hx + hw, HY(-9)); ctx.stroke(); ctx.setLineDash([])
      for (const c of CASES) {
        const hs = sims[c].hist, every = 20
        ctx.strokeStyle = COL[c]; ctx.lineWidth = 2; ctx.beginPath()
        hs.forEach((lg, q) => { const t = q * every; q === 0 ? ctx.moveTo(HX(t), HY(lg)) : ctx.lineTo(HX(t), HY(lg)) })
        ctx.stroke(); ctx.lineWidth = 1
      }
      ctx.fillStyle = grey
      ctx.fillText('log10(max update / max φ)  vs  SOR sweep', hx, hy - 10)
      ctx.fillText('tol 1e-9', hx + hw - 64, HY(-9) - 4)
      ctx.fillText('0', hx - 12, HY(0) + 4); ctx.fillText('-5', hx - 18, HY(-5) + 4); ctx.fillText('-10', hx - 24, HY(-10) + 4)
      ctx.fillText(`0 … ${itMax} sweeps`, hx + 4, hy + hh + 16)
      let ly = hy + 18
      const lab: Record<Case, string> = { flat: 'flat k=0', cyl: 'cylinder k=1', sph: 'sphere k=2', pipe: 'pipe inside' }
      for (const c of CASES) { ctx.fillStyle = COL[c]; ctx.fillText(lab[c], hx + hw - 110, ly); ly += 16 }
    }

    const advance = (kk: number) => {
      for (const c of CASES) {
        const s = sims[c]
        for (let q = 0; q < kk && !s.done && s.it < MAXIT; q++) {
          sweep(s)
          if (s.it % 20 === 0) s.hist.push(Math.log10(Math.max(s.dmax, 1e-11)))
        }
        spalding(s)
      }
      draw()
    }
    const pub = () => setRead(Object.fromEntries(CASES.map((c) => [c, { it: sims[c].it, done: sims[c].done, r: YS.map((y) => ratioAt(sims[c], y)) }])) as Read)
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
  }, [R, N, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(59,130,246,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const lab: Record<Case, string> = { flat: 'flat H=5', cyl: `cyl R=${R}`, sph: `sph R=${R}`, pipe: 'pipe inside' }

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          outer radius R/a = {R}{' '}
          <input type="range" min={2} max={30} step={1} value={R} onChange={(e) => setR(Number(e.target.value))} />
        </label>
        <label>
          N = {N}{' '}
          <input type="range" min={40} max={240} step={20} value={N} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label>
          sweeps/frame = {speed}{' '}
          <input type="range" min={1} max={600} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(20) }}>Step ×20</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: 'rgba(127,127,127,0.95)' }}>case · SOR sweeps · d_PDE/d_exact at y = 0.1 / 0.5 / 1.0</div>
        {CASES.map((c) => (
          <div key={c} style={{ color: COL[c] }}>
            {lab[c].padEnd(12, ' ')} · {String(read[c].it).padStart(6, ' ')}{read[c].done ? ' ✓' : ' …'} ·{' '}
            {read[c].r.map((v) => (Number.isFinite(v) ? v.toFixed(3) : '  —  ')).join(' / ')}
          </div>
        ))}
      </div>
    </div>
  )
}
