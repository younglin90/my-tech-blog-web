'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const H = 420
const N = 200
const DX = 1 / N
type Mode = 'BE' | 'CN' | 'BLEND'
const MODES: Mode[] = ['BE', 'CN', 'BLEND']
const COL: Record<Mode, string> = { BE: '#f87171', CN: '#60a5fa', BLEND: '#4ade80' }
type Shape = 'gauss' | 'square'

function initial(shape: Shape) {
  const u = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    u[i] = shape === 'gauss' ? Math.exp(-(((x - 0.5) / 0.08) ** 2)) : Math.abs(x - 0.5) < 0.15 ? 1 : 0
  }
  return u
}

// same as face_theta in the Python code
function faceTheta(u: Float64Array, mode: Mode) {
  const tp = new Float64Array(N)
  if (mode !== 'BLEND') { tp.fill(mode === 'BE' ? 1 : 0.5); return tp }
  const th = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const dm = u[i] - u[(i - 1 + N) % N]
    const dp = u[(i + 1) % N] - u[i]
    const r = dm / (Math.abs(dp) < 1e-12 ? 1e-12 : dp)
    const phi = Math.min(1, Math.max(0, Math.min(1, r)))
    th[i] = 1 - 0.5 * phi
  }
  for (let i = 0; i < N; i++) tp[i] = Math.max(th[i], th[(i + 1) % N])
  return tp
}

// cyclic tridiagonal solve (Sherman-Morrison + Thomas)
function cyclic(a: Float64Array, b: Float64Array, c: Float64Array, d: Float64Array) {
  const n = b.length
  const alpha = c[n - 1], beta = a[0]
  const gamma = -b[0]
  const bb = Float64Array.from(b)
  bb[0] = b[0] - gamma
  bb[n - 1] = b[n - 1] - (alpha * beta) / gamma
  const thomas = (r: Float64Array) => {
    const cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n)
    cp[0] = c[0] / bb[0]; dp[0] = r[0] / bb[0]
    for (let i = 1; i < n; i++) {
      const m = bb[i] - a[i] * cp[i - 1]
      cp[i] = c[i] / m
      dp[i] = (r[i] - a[i] * dp[i - 1]) / m
    }
    x[n - 1] = dp[n - 1]
    for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
    return x
  }
  const y = thomas(d)
  const uu = new Float64Array(n); uu[0] = gamma; uu[n - 1] = alpha
  const z = thomas(uu)
  const fac = (y[0] + (beta * y[n - 1]) / gamma) / (1 + z[0] + (beta * z[n - 1]) / gamma)
  for (let i = 0; i < n; i++) y[i] -= fac * z[i]
  return y
}

// same as theta_step in the Python code
function thetaStep(u: Float64Array, nu: number, mode: Mode) {
  const tp = faceTheta(u, mode)
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N)
  const f = new Float64Array(N)
  for (let i = 0; i < N; i++) f[i] = 0.5 * (u[i] + u[(i + 1) % N])
  for (let i = 0; i < N; i++) {
    const tm = tp[(i - 1 + N) % N]
    b[i] = 1 + 0.5 * nu * (tp[i] - tm)
    c[i] = 0.5 * nu * tp[i]
    a[i] = -0.5 * nu * tm
    d[i] = u[i] - nu * ((1 - tp[i]) * f[i] - (1 - tm) * f[(i - 1 + N) % N])
  }
  return cyclic(a, b, c, d)
}

type Sim = { u: Float64Array; hist: number[] }
const stat = (u: Float64Array) => { let mx = -1e9, mn = 1e9, m = 0; for (const v of u) { mx = Math.max(mx, v); mn = Math.min(mn, v); m += v * DX } return { mx, mn, m } }

export function ThetaBlendPulseRace() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [nu, setNu] = useState(0.5)
  const [shape, setShape] = useState<Shape>('gauss')
  const [speed, setSpeed] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ k: 0, st: MODES.map(() => ({ mx: 1, mn: 0, m: 0.3 })) })
  const sims = useRef<Sim[]>([])
  const kRef = useRef(0)
  const u0 = useRef<Float64Array>(initial('gauss'))
  const steps = Math.round(N / nu)

  function reset() {
    u0.current = initial(shape)
    sims.current = MODES.map(() => ({ u: Float64Array.from(u0.current), hist: [] }))
    kRef.current = 0
  }
  if (sims.current.length === 0) reset()
  useEffect(reset, [nu, shape]) // eslint-disable-line react-hooks/exhaustive-deps

  function stepOnce() {
    if (kRef.current >= steps) return
    sims.current.forEach((s, j) => {
      s.u = thetaStep(s.u, nu, MODES[j])
      const { mx, mn } = stat(s.u)
      s.hist.push(shape === 'gauss' ? mx : mx - mn)
    })
    kRef.current++
  }
  function sync() { setRead({ k: kRef.current, st: sims.current.map((s) => stat(s.u)) }) }

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
  }, [playing, speed, nu, shape]) // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H)
    ctx.font = '12px monospace'
    const gx = 60, gy = 20, gw = 560, gh = 200
    const yMin = -0.45, yMax = 1.45
    const py = (v: number) => gy + gh - ((v - yMin) / (yMax - yMin)) * gh
    ctx.strokeStyle = '#475569'; ctx.strokeRect(gx, gy, gw, gh)
    for (const v of [0, 1]) { ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(gx, py(v)); ctx.lineTo(gx + gw, py(v)); ctx.stroke(); ctx.fillStyle = '#64748b'; ctx.fillText(String(v), gx - 18, py(v) + 4) }
    // exact solution (shifted by t = k*nu*dx)
    const shift = Math.round(kRef.current * nu) % N
    ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([5, 5]); ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const src = (i - shift + N * 4) % N
      const v = u0.current[src]
      const X = gx + (i + 0.5) * DX * gw
      i ? ctx.lineTo(X, py(v)) : ctx.moveTo(X, py(v))
    }
    ctx.stroke(); ctx.setLineDash([])
    sims.current.forEach((s, j) => {
      ctx.strokeStyle = COL[MODES[j]]; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < N; i++) { const X = gx + (i + 0.5) * DX * gw; i ? ctx.lineTo(X, py(s.u[i])) : ctx.moveTo(X, py(s.u[i])) }
      ctx.stroke(); ctx.lineWidth = 1
    })
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('u(x)   dashed: exact', gx + 4, gy + 14)
    ctx.fillText('x: 0 -> 1 (periodic)', gx + gw - 150, gy + gh + 14)
    // history
    const hx = 60, hy = 265, hw = 560, hh = 130
    ctx.strokeStyle = '#475569'; ctx.strokeRect(hx, hy, hw, hh)
    const lo = shape === 'gauss' ? 0.3 : 0.6, hi = shape === 'gauss' ? 1.05 : 1.8
    const hy_ = (v: number) => hy + hh - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * hh
    const ref = 1
    ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(hx, hy_(ref)); ctx.lineTo(hx + hw, hy_(ref)); ctx.stroke()
    ctx.fillStyle = '#64748b'; ctx.fillText(lo.toFixed(1), hx - 30, hy + hh); ctx.fillText(hi.toFixed(2), hx - 36, hy + 10); ctx.fillText('1', hx - 18, hy_(1) + 4)
    sims.current.forEach((s, j) => {
      ctx.strokeStyle = COL[MODES[j]]; ctx.lineWidth = 2; ctx.beginPath()
      s.hist.forEach((v, i) => { const X = hx + ((i + 1) / steps) * hw; i ? ctx.lineTo(X, hy_(v)) : ctx.moveTo(X, hy_(v)) })
      ctx.stroke(); ctx.lineWidth = 1
    })
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(shape === 'gauss' ? 'peak max(u)  (exact = 1)' : 'range max(u)-min(u)  (exact = 1)', hx, hy - 6)
    ctx.fillText(`step: 0 -> ${steps} (one lap)`, hx + hw - 170, hy + hh + 16)
    MODES.forEach((m, i) => { ctx.fillStyle = COL[m]; ctx.fillText(m, hx + 300 + i * 70, hy - 6) })
  }

  const btn = { padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }
  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>CFL nu: <b>{nu.toFixed(2)}</b>
          <input type="range" min={0.25} max={4} step={0.25} value={nu} onChange={(e) => setNu(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Steps / frame: <b>{speed}</b>
          <input type="range" min={1} max={20} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <div>Pulse:{' '}
          {(['gauss', 'square'] as Shape[]).map((s) => (
            <button key={s} style={{ ...btn, marginRight: 6, background: shape === s ? '#334155' : '#1e293b' }} onClick={() => setShape(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { stepOnce(); draw(); sync() }}>Step</button>
        <button style={btn} onClick={() => { reset(); draw(); sync() }}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        step {read.k} / {steps} | N = {N}<br />
        {MODES.map((m, i) => (
          <span key={m} style={{ color: COL[m], marginRight: 14, display: 'inline-block' }}>
            {m}: max {read.st[i].mx.toFixed(4)} min {read.st[i].mn.toFixed(4)} mass {read.st[i].m.toFixed(6)}
          </span>
        ))}
      </div>
    </div>
  )
}
