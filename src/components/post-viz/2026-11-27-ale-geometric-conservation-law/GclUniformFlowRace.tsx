'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const H = 380
const PERIOD = 0.25
const T_END = 2.0
const V = 1.0
type Mode = 'w(t_n)' | 'w(t_n+1/2)' | 'GCL'
const MODES: Mode[] = ['w(t_n)', 'w(t_n+1/2)', 'GCL']
const COL: Record<Mode, string> = { 'w(t_n)': '#f87171', 'w(t_n+1/2)': '#fbbf24', GCL: '#4ade80' }
const DTS = [5e-4, 1e-3, 2e-3, 4e-3]
const NS = [32, 64, 128]

const pos = (xi: number, t: number, a: number) => xi + a * Math.sin(2 * Math.PI * xi) * Math.sin((2 * Math.PI * t) / PERIOD)
const spd = (xi: number, t: number, a: number) => a * Math.sin(2 * Math.PI * xi) * Math.cos((2 * Math.PI * t) / PERIOD) * ((2 * Math.PI) / PERIOD)

type Sim = { mode: Mode; x: Float64Array; rho: Float64Array; err: number; hist: number[] }

function makeSim(mode: Mode, n: number, a: number): Sim {
  const x = new Float64Array(n + 1)
  for (let j = 0; j <= n; j++) x[j] = pos(j / n, 0, a)
  return { mode, x, rho: new Float64Array(n).fill(1), err: 0, hist: [] }
}

// same update as ale_uniform_test in the Python code
function advance(s: Sim, n: number, k: number, dt: number, a: number) {
  const t0 = k * dt, t1 = (k + 1) * dt
  const xn = new Float64Array(n + 1)
  const f = new Float64Array(n + 1)
  for (let j = 0; j <= n; j++) xn[j] = pos(j / n, t1, a)
  for (let j = 0; j < n; j++) {
    const xi = j / n
    const w = s.mode === 'w(t_n)' ? spd(xi, t0, a) : s.mode === 'w(t_n+1/2)' ? spd(xi, t0 + dt / 2, a) : (xn[j] - s.x[j]) / dt
    const rel = V - w
    f[j] = rel * (rel > 0 ? s.rho[(j - 1 + n) % n] : s.rho[j])
  }
  f[n] = f[0]
  let e = 0
  for (let i = 0; i < n; i++) {
    const m = s.rho[i] * (s.x[i + 1] - s.x[i]) - dt * (f[i + 1] - f[i])
    s.rho[i] = m / (xn[i + 1] - xn[i])
    e = Math.max(e, Math.abs(s.rho[i] - 1))
  }
  s.x = xn
  s.err = e
}

export function GclUniformFlowRace() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [dtIdx, setDtIdx] = useState(3)
  const [amp, setAmp] = useState(0.05)
  const [nIdx, setNIdx] = useState(1)
  const [speed, setSpeed] = useState(10)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ t: 0, errs: [0, 0, 0], mass: 1 })
  const dt = DTS[dtIdx], n = NS[nIdx]
  const sims = useRef<Sim[]>([])
  const kRef = useRef(0)
  const steps = Math.round(T_END / dt)

  function reset() {
    sims.current = MODES.map((m) => makeSim(m, n, amp))
    kRef.current = 0
  }
  if (sims.current.length === 0) reset()
  useEffect(reset, [dtIdx, amp, nIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  function stepOnce() {
    if (kRef.current >= steps) return
    for (const s of sims.current) {
      advance(s, n, kRef.current, dt, amp)
      if (kRef.current % Math.max(1, Math.round(steps / 400)) === 0) s.hist.push(s.err)
    }
    kRef.current++
  }

  function sync() {
    const s0 = sims.current[0]
    let mass = 0
    for (let i = 0; i < n; i++) mass += s0.rho[i] * (s0.x[i + 1] - s0.x[i])
    setRead({ t: kRef.current * dt, errs: sims.current.map((s) => s.err), mass })
  }

  useEffect(() => {
    let raf = 0, frame = 0
    const loop = () => {
      if (playing) for (let i = 0; i < speed; i++) stepOnce()
      draw()
      if (++frame % 12 === 0) sync()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, dtIdx, amp, nIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H)
    ctx.font = '12px monospace'
    // rho profiles (deviation, symmetric log-ish via fixed scale)
    const gx = 60, gy = 20, gw = 560, gh = 150
    const maxDev = Math.max(1e-4, ...sims.current.map((s) => s.err)) * 1.2
    ctx.strokeStyle = '#475569'; ctx.strokeRect(gx, gy, gw, gh)
    ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke()
    for (const s of sims.current) {
      ctx.strokeStyle = COL[s.mode]; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const xc = 0.5 * (s.x[i] + s.x[i + 1])
        const X = gx + xc * gw, Y = gy + gh / 2 - ((s.rho[i] - 1) / maxDev) * (gh / 2)
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
      }
      ctx.stroke(); ctx.lineWidth = 1
    }
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('rho - 1', gx - 56, gy + 12)
    ctx.fillText(`+${maxDev.toExponential(1)}`, gx + 4, gy + 12)
    ctx.fillText(`-${maxDev.toExponential(1)}`, gx + 4, gy + gh - 4)
    // moving mesh
    const s0 = sims.current[2]
    ctx.strokeStyle = '#64748b'
    ctx.beginPath()
    for (let j = 0; j <= n; j += n > 64 ? 2 : 1) { const X = gx + s0.x[j] * gw; ctx.moveTo(X, gy + gh + 6); ctx.lineTo(X, gy + gh + 20) }
    ctx.stroke()
    ctx.fillText('x  (moving mesh nodes below)', gx + gw - 210, gy + gh + 34)
    // error history, log scale
    const hx = 60, hy = 225, hw = 560, hh = 130
    ctx.strokeStyle = '#475569'; ctx.strokeRect(hx, hy, hw, hh)
    const lmin = -16, lmax = -1
    const py = (e: number) => hy + hh - ((Math.log10(Math.max(e, 1e-16)) - lmin) / (lmax - lmin)) * hh
    for (let p = -15; p <= -2; p += 3) { ctx.fillStyle = '#64748b'; ctx.fillText(`1e${p}`, hx - 44, py(10 ** p) + 4) }
    for (const s of sims.current) {
      ctx.strokeStyle = COL[s.mode]; ctx.lineWidth = 2; ctx.beginPath()
      s.hist.forEach((e, i) => { const X = hx + (i / 400) * hw; i ? ctx.lineTo(X, py(e)) : ctx.moveTo(X, py(e)) })
      ctx.stroke(); ctx.lineWidth = 1
    }
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('max|rho-1|', hx, hy - 6)
    ctx.fillText(`t: 0 -> ${T_END}`, hx + hw - 80, hy + hh + 16)
    MODES.forEach((m, i) => { ctx.fillStyle = COL[m]; ctx.fillText(m, hx + 120 + i * 120, hy - 6) })
  }

  const btn = { padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }
  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>dt: <b>{dt.toExponential(0)}</b>
          <input type="range" min={0} max={DTS.length - 1} step={1} value={dtIdx} onChange={(e) => setDtIdx(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>amp: <b>{amp.toFixed(3)}</b>
          <input type="range" min={0.01} max={0.1} step={0.005} value={amp} onChange={(e) => setAmp(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Cells N: <b>{n}</b>
          <input type="range" min={0} max={NS.length - 1} step={1} value={nIdx} onChange={(e) => setNIdx(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Steps / frame: <b>{speed}</b>
          <input type="range" min={1} max={40} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { stepOnce(); draw(); sync() }}>Step</button>
        <button style={btn} onClick={() => { reset(); draw(); sync() }}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        t = {read.t.toFixed(3)} / {T_END} (step {Math.round(read.t / dt)} of {steps}) | total mass [w(t_n)] = {read.mass.toFixed(12)}<br />
        {MODES.map((m, i) => (
          <span key={m} style={{ color: COL[m], marginRight: 16 }}>{m}: {read.errs[i].toExponential(2)}</span>
        ))}
      </div>
    </div>
  )
}
