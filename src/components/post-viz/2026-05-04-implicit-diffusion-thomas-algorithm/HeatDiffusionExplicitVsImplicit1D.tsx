'use client'

import { useEffect, useRef, useState } from 'react'

const N = 80
const D = 1.0
const DX = 1.0 / N

function gaussian(): Float64Array {
  const q = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    q[i] = Math.exp(-((x - 0.5) ** 2) / 0.005)
  }
  return q
}

function explicitStep(q: Float64Array, dt: number): boolean {
  const r = (D * dt) / (DX * DX)
  const next = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const left = i === 0 ? q[i] : q[i - 1]
    const right = i === N - 1 ? q[i] : q[i + 1]
    next[i] = q[i] + r * (right - 2 * q[i] + left)
  }
  let blew = false
  for (let i = 0; i < N; i++) {
    if (!isFinite(next[i]) || Math.abs(next[i]) > 1e6) blew = true
    q[i] = next[i]
  }
  return blew
}

function thomasImplicit(q: Float64Array, dt: number) {
  const r = (D * dt) / (DX * DX)
  const a = new Float64Array(N)
  const b = new Float64Array(N)
  const c = new Float64Array(N)
  const d = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    a[i] = -r
    b[i] = 1 + 2 * r
    c[i] = -r
    d[i] = q[i]
  }
  b[0] = 1 + r
  b[N - 1] = 1 + r
  const cp = new Float64Array(N)
  const dp = new Float64Array(N)
  cp[0] = c[0] / b[0]
  dp[0] = d[0] / b[0]
  for (let i = 1; i < N; i++) {
    const m = b[i] - a[i] * cp[i - 1]
    cp[i] = c[i] / m
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m
  }
  q[N - 1] = dp[N - 1]
  for (let i = N - 2; i >= 0; i--) {
    q[i] = dp[i] - cp[i] * q[i + 1]
  }
}

export function HeatDiffusionExplicitVsImplicit1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cfl, setCfl] = useState(0.45)
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)
  const stateRef = useRef<{ qe: Float64Array; qi: Float64Array; t: number; blew: boolean }>({
    qe: gaussian(),
    qi: gaussian(),
    t: 0,
    blew: false,
  })

  useEffect(() => {
    stateRef.current = { qe: gaussian(), qi: gaussian(), t: 0, blew: false }
    setTick((x) => x + 1)
  }, [tick === -1])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const s = stateRef.current
      const dt = cfl * (DX * DX) / D
      if (running) {
        if (!s.blew) {
          const blew = explicitStep(s.qe, dt)
          if (blew) s.blew = true
        }
        thomasImplicit(s.qi, dt)
        s.t += dt
      }
      draw(canvasRef.current, s, cfl)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, cfl])

  const reset = () => {
    stateRef.current = { qe: gaussian(), qi: gaussian(), t: 0, blew: false }
  }

  const stable = cfl <= 0.5

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={720} height={320} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, background: '#0b1220' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 220px' }}>
          <span style={{ marginBottom: 4 }}>CFL number r = D·dt / dx²: <strong>{cfl.toFixed(2)}</strong></span>
          <input type="range" min={0.05} max={5} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn}>{running ? 'Pause' : 'Play'}</button>
        <button onClick={reset} style={btn}>Reset</button>
        <span style={{ padding: '4px 10px', borderRadius: 6, background: stable ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: stable ? '#22c55e' : '#ef4444' }}>
          Explicit: {stable ? 'stable (r ≤ 0.5)' : 'UNSTABLE (r > 0.5)'}
        </span>
        <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          Implicit: unconditionally stable
        </span>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  cursor: 'pointer',
}

function draw(c: HTMLCanvasElement | null, s: { qe: Float64Array; qi: Float64Array; t: number; blew: boolean }, cfl: number) {
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const W = c.width
  const H = c.height
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, W, H)

  // grid
  ctx.strokeStyle = 'rgba(148,163,184,0.15)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * W
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let j = 0; j <= 4; j++) {
    const y = (j / 4) * H
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  const yAxis = (q: number) => H - 30 - q * (H - 60)

  // implicit (cyan)
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * W
    const y = yAxis(Math.max(-0.5, Math.min(1.5, s.qi[i])))
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // explicit (orange or red if blew)
  ctx.strokeStyle = s.blew ? '#ef4444' : '#fb923c'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * W
    const v = isFinite(s.qe[i]) ? s.qe[i] : 0
    const y = yAxis(Math.max(-0.5, Math.min(1.5, v)))
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // labels
  ctx.fillStyle = '#fb923c'
  ctx.font = '13px ui-sans-serif, system-ui'
  ctx.fillText('Explicit (forward Euler)', 14, 24)
  ctx.fillStyle = '#22d3ee'
  ctx.fillText('Implicit (backward Euler + Thomas)', 14, 44)
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(`t = ${s.t.toFixed(3)}   r = ${cfl.toFixed(2)}`, W - 180, 24)
  if (s.blew) {
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 14px ui-sans-serif, system-ui'
    ctx.fillText('explicit blew up — reset to recover', W - 280, 44)
  }
}
