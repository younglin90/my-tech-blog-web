'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const N = 200
const DX = 1 / N
const RHO = 1.2
const K = 0.4e5
const A = Math.sqrt(K / RHO)
const XC = Array.from({ length: N }, (_, i) => (i + 0.5) * DX)
const TRAVEL = 0.42

function initP() {
  return XC.map((x) => 100 * Math.exp(-(((x - 0.5) / 0.04) ** 2)))
}

function ddx(f: number[]) {
  return f.map((_, i) => (f[Math.min(i + 1, N - 1)] - f[Math.max(i - 1, 0)]) / (2 * DX))
}

function thomas(rhs: number[], beta: number) {
  const cp = new Array(N).fill(0)
  const dp = new Array(N).fill(0)
  cp[0] = -beta / (1 + beta)
  dp[0] = rhs[0] / (1 + beta)
  for (let i = 1; i < N; i++) {
    const b = i === N - 1 ? 1 + beta : 1 + 2 * beta
    const m = b + beta * cp[i - 1]
    cp[i] = -beta / m
    dp[i] = (rhs[i] + beta * dp[i - 1]) / m
  }
  const x = new Array(N).fill(0)
  x[N - 1] = dp[N - 1]
  for (let i = N - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
  return x
}

function step(p: number[], u: number[], dt: number, implicit: boolean) {
  if (implicit) {
    const ux = ddx(u)
    const pn = thomas(p.map((v, i) => v - dt * K * ux[i]), (dt * dt * K) / RHO / (DX * DX))
    const px = ddx(pn)
    return { p: pn, u: u.map((v, i) => v - (dt / RHO) * px[i]) }
  }
  const P = [p[0], ...p, p[N - 1]]
  const U = [u[0], ...u, u[N - 1]]
  const pn = p.map((_, i) => 0.5 * (P[i] + P[i + 2]) - (dt * K * (U[i + 2] - U[i])) / (2 * DX))
  const un = u.map((_, i) => 0.5 * (U[i] + U[i + 2]) - ((dt / RHO) * (P[i + 2] - P[i])) / (2 * DX))
  return { p: pn, u: un }
}

export function ImplicitPressurePulseLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef({ p: initP(), u: new Array(N).fill(0), t: 0, n: 0 })
  const [courant, setCourant] = useState(0.9)
  const [implicit, setImplicit] = useState(false)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ n: 0, t: 0, peak: 100, blown: false })

  const reset = useCallback(() => {
    state.current = { p: initP(), u: new Array(N).fill(0), t: 0, n: 0 }
    setReadout({ n: 0, t: 0, peak: 100, blown: false })
  }, [])

  useEffect(reset, [courant, implicit, reset])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const W = cv.width
    const H = cv.height
    const x0 = 50
    const pw = W - 70
    const y0 = 20
    const ph = H - 60
    const ymin = -60
    const ymax = 120
    const sx = (x: number) => x0 + x * pw
    const sy = (v: number) => y0 + ph * (1 - (Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin))
    const dt = (courant * DX) / A
    const tEnd = TRAVEL / A
    let raf = 0
    let frame = 0
    let acc = 0

    const draw = () => {
      const s = state.current
      const blown = s.p.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e6)
      if (running && !blown && s.t < tEnd) {
        // advance at a fixed physical rate so all Courant numbers reach tEnd together
        acc += tEnd / 240
        while (acc >= dt && s.t < tEnd) {
          const r = step(s.p, s.u, dt, implicit)
          s.p = r.p
          s.u = r.u
          s.t += dt
          s.n += 1
          acc -= dt
        }
      }
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.strokeRect(x0, y0, pw, ph)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '11px ui-monospace, monospace'
      for (const v of [-50, 0, 50, 100]) {
        ctx.fillText(String(v), 14, sy(v) + 4)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.beginPath()
        ctx.moveTo(x0, sy(v))
        ctx.lineTo(x0 + pw, sy(v))
        ctx.stroke()
      }
      ctx.fillText('p\' [Pa]', 6, 14)
      ctx.fillText('x [m]  0', x0, H - 22)
      ctx.fillText('1', x0 + pw - 6, H - 22)
      // exact: two half pulses moving at +-A
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = 'rgba(200,200,200,0.7)'
      ctx.beginPath()
      XC.forEach((x, i) => {
        const g = (z: number) => 50 * Math.exp(-(((z - 0.5) / 0.04) ** 2))
        const v = g(x - A * s.t) + g(x + A * s.t)
        if (i === 0) ctx.moveTo(sx(x), sy(v))
        else ctx.lineTo(sx(x), sy(v))
      })
      ctx.stroke()
      ctx.setLineDash([])
      // numerical
      ctx.strokeStyle = blown ? '#f87171' : implicit ? '#34d399' : '#60a5fa'
      ctx.lineWidth = 2
      ctx.beginPath()
      s.p.forEach((v, i) => {
        if (i === 0) ctx.moveTo(sx(XC[i]), sy(v))
        else ctx.lineTo(sx(XC[i]), sy(v))
      })
      ctx.stroke()
      ctx.lineWidth = 1
      if (blown) {
        ctx.fillStyle = '#f87171'
        ctx.font = 'bold 16px ui-monospace, monospace'
        ctx.fillText('UNSTABLE: |p\'| > 1e6 Pa', x0 + pw / 2 - 110, y0 + 30)
      }
      frame += 1
      if (frame % 12 === 0) {
        const peak = Math.max(...s.p.slice(N / 2).map(Math.abs))
        setReadout({ n: s.n, t: s.t, peak, blown })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [courant, implicit, running])

  const lab: React.CSSProperties = { fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 170 }
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={canvasRef} width={760} height={300} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <label style={lab}>
          Courant (A dt/dx) = {courant.toFixed(1)}
          <input type="range" min={0.3} max={20} step={0.1} value={courant}
            onChange={(e) => setCourant(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <button onClick={() => setImplicit((v) => !v)} style={{ padding: '4px 12px', fontSize: 12 }}>
          scheme: {implicit ? 'implicit (backward Euler)' : 'explicit (Lax-Friedrichs)'}
        </button>
        <button onClick={() => setRunning((v) => !v)} style={{ padding: '4px 12px', fontSize: 12 }}>
          {running ? 'pause' : 'run'}
        </button>
        <button onClick={reset} style={{ padding: '4px 12px', fontSize: 12 }}>reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        A = {A.toFixed(1)} m/s &nbsp;|&nbsp; steps = {readout.n} &nbsp;|&nbsp; t = {(readout.t * 1e3).toFixed(3)} ms &nbsp;|&nbsp;
        <span style={{ color: readout.blown ? '#f87171' : '#e5e7eb' }}>
          right peak = {readout.blown ? 'diverged' : readout.peak.toFixed(2) + ' Pa'}
        </span>{' '}
        (exact 50 Pa, gray dashed)
      </div>
    </div>
  )
}
