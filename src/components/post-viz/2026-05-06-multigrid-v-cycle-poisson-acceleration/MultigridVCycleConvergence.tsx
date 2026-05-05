'use client'

import { useEffect, useRef, useState } from 'react'

const N_FINE = 64
const H_FINE = 1.0 / N_FINE
const MAX_HISTORY = 60

function makeNoise(seed: number): Float64Array {
  const u = new Float64Array(N_FINE + 1)
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
  for (let i = 1; i < N_FINE; i++) {
    u[i] = (rand() - 0.5) * 2.0
  }
  return u
}

function jacobiRelax(u: Float64Array, f: Float64Array, h: number, iters: number) {
  const n = u.length - 1
  const next = new Float64Array(n + 1)
  for (let it = 0; it < iters; it++) {
    for (let i = 1; i < n; i++) {
      next[i] = 0.5 * (u[i - 1] + u[i + 1] + h * h * f[i])
    }
    for (let i = 1; i < n; i++) u[i] = next[i]
  }
}

function residual(u: Float64Array, f: Float64Array, h: number): Float64Array {
  const n = u.length - 1
  const r = new Float64Array(n + 1)
  const inv = 1.0 / (h * h)
  for (let i = 1; i < n; i++) {
    r[i] = f[i] - (-u[i - 1] + 2 * u[i] - u[i + 1]) * inv
  }
  return r
}

function residualNorm(u: Float64Array, f: Float64Array, h: number): number {
  const n = u.length - 1
  let s = 0
  const inv = 1.0 / (h * h)
  for (let i = 1; i < n; i++) {
    const r = f[i] - (-u[i - 1] + 2 * u[i] - u[i + 1]) * inv
    s += r * r
  }
  return Math.sqrt(s / (n - 1))
}

function restrictFW(rH: Float64Array): Float64Array {
  const n = rH.length - 1
  const n2 = n / 2
  const r2 = new Float64Array(n2 + 1)
  for (let i = 1; i < n2; i++) {
    r2[i] = 0.25 * rH[2 * i - 1] + 0.5 * rH[2 * i] + 0.25 * rH[2 * i + 1]
  }
  return r2
}

function prolongLinear(e2H: Float64Array): Float64Array {
  const n2 = e2H.length - 1
  const n = n2 * 2
  const eH = new Float64Array(n + 1)
  for (let i = 1; i < n2; i++) eH[2 * i] = e2H[i]
  for (let i = 0; i < n2; i++) eH[2 * i + 1] = 0.5 * (e2H[i] + e2H[i + 1])
  return eH
}

function vCycle(u: Float64Array, f: Float64Array, h: number, nPre: number, nPost: number) {
  const n = u.length - 1
  if (n <= 4) {
    jacobiRelax(u, f, h, 50)
    return
  }
  jacobiRelax(u, f, h, nPre)
  const r = residual(u, f, h)
  const r2 = restrictFW(r)
  const e2 = new Float64Array(r2.length)
  vCycle(e2, r2, 2 * h, nPre, nPost)
  const e = prolongLinear(e2)
  for (let i = 0; i < u.length; i++) u[i] += e[i]
  jacobiRelax(u, f, h, nPost)
}

interface SimState {
  uJ: Float64Array
  uV: Float64Array
  f: Float64Array
  iter: number
  histJ: number[]
  histV: number[]
}

function freshState(seed: number): SimState {
  const f = new Float64Array(N_FINE + 1)
  const uJ = makeNoise(seed)
  const uV = new Float64Array(uJ)
  return {
    uJ,
    uV,
    f,
    iter: 0,
    histJ: [residualNorm(uJ, f, H_FINE)],
    histV: [residualNorm(uV, f, H_FINE)],
  }
}

export function MultigridVCycleConvergence() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [nPre, setNPre] = useState(2)
  const [nPost, setNPost] = useState(2)
  const [running, setRunning] = useState(false)
  const [seed, setSeed] = useState(7)
  const stateRef = useRef<SimState>(freshState(7))

  const reset = () => {
    stateRef.current = freshState(seed)
    drawScene(canvasRef.current, stateRef.current)
  }

  const stepOnce = () => {
    const s = stateRef.current
    jacobiRelax(s.uJ, s.f, H_FINE, nPre + nPost)
    vCycle(s.uV, s.f, H_FINE, nPre, nPost)
    s.iter += 1
    s.histJ.push(residualNorm(s.uJ, s.f, H_FINE))
    s.histV.push(residualNorm(s.uV, s.f, H_FINE))
    if (s.histJ.length > MAX_HISTORY) {
      s.histJ.shift()
      s.histV.shift()
    }
  }

  useEffect(() => {
    stateRef.current = freshState(seed)
  }, [seed])

  useEffect(() => {
    let raf = 0
    let frame = 0
    const loop = () => {
      frame += 1
      if (running && frame % 6 === 0) stepOnce()
      drawScene(canvasRef.current, stateRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, nPre, nPost])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={760} height={420} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, background: '#0b1220' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 200px' }}>
          <span style={{ marginBottom: 4 }}>Pre-smooth iterations: <strong>{nPre}</strong></span>
          <input type="range" min={1} max={5} step={1} value={nPre} onChange={(e) => setNPre(parseInt(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 200px' }}>
          <span style={{ marginBottom: 4 }}>Post-smooth iterations: <strong>{nPost}</strong></span>
          <input type="range" min={1} max={5} step={1} value={nPost} onChange={(e) => setNPost(parseInt(e.target.value))} />
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn}>{running ? 'Pause' : 'Run'}</button>
        <button onClick={stepOnce} style={btn} disabled={running}>Step</button>
        <button onClick={() => { setSeed((s) => s + 1) }} style={btn}>New noise</button>
        <button onClick={reset} style={btn}>Reset</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
        Both solvers attack the same homogeneous Poisson problem with random initial guess. Jacobi (orange) does {nPre + nPost} sweeps per step; V-cycle (cyan) does {nPre} pre + {nPost} post sweeps per level on a 6-level hierarchy.
      </p>
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

function drawScene(c: HTMLCanvasElement | null, s: SimState) {
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const W = c.width
  const H = c.height
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, W, H)

  const padX = 20
  const splitY = 220

  // upper panel: error profile
  ctx.strokeStyle = 'rgba(148,163,184,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padX, splitY * 0.5)
  ctx.lineTo(W - padX, splitY * 0.5)
  ctx.stroke()
  for (let k = 0; k <= 8; k++) {
    const x = padX + (k / 8) * (W - 2 * padX)
    ctx.beginPath()
    ctx.moveTo(x, 20)
    ctx.lineTo(x, splitY - 20)
    ctx.stroke()
  }

  const yProf = (v: number) => {
    const clamped = Math.max(-1.4, Math.min(1.4, v))
    return splitY * 0.5 - clamped * (splitY * 0.5 - 30)
  }

  // Jacobi (orange)
  ctx.strokeStyle = '#fb923c'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= N_FINE; i++) {
    const x = padX + (i / N_FINE) * (W - 2 * padX)
    const y = yProf(s.uJ[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // V-cycle (cyan)
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let i = 0; i <= N_FINE; i++) {
    const x = padX + (i / N_FINE) * (W - 2 * padX)
    const y = yProf(s.uV[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // labels (top panel)
  ctx.font = '13px ui-sans-serif, system-ui'
  ctx.fillStyle = '#fb923c'
  ctx.fillText('Jacobi smoother (orange)', padX, 18)
  ctx.fillStyle = '#22d3ee'
  ctx.fillText('Two-grid V-cycle (cyan)', padX + 220, 18)
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('current u(x) — exact = 0', W - padX - 200, 18)

  // separator
  ctx.strokeStyle = 'rgba(148,163,184,0.3)'
  ctx.beginPath()
  ctx.moveTo(0, splitY)
  ctx.lineTo(W, splitY)
  ctx.stroke()

  // lower panel: residual log decay
  const baseY = splitY + 40
  const maxY = H - 30
  const histLen = Math.max(s.histJ.length, 1)

  // log axis: from log10(1e-8) to log10(max(initial residuals))
  const initial = Math.max(s.histJ[0] ?? 1, s.histV[0] ?? 1, 1e-8)
  const logMax = Math.log10(initial * 1.2)
  const logMin = -8
  const yLog = (v: number) => {
    const lv = Math.log10(Math.max(v, 1e-12))
    const t = (lv - logMin) / (logMax - logMin)
    return maxY - t * (maxY - baseY)
  }

  // grid lines (orders of magnitude)
  ctx.strokeStyle = 'rgba(148,163,184,0.18)'
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px ui-sans-serif, system-ui'
  for (let p = Math.ceil(logMin); p <= Math.floor(logMax); p++) {
    const y = yLog(Math.pow(10, p))
    ctx.beginPath()
    ctx.moveTo(padX, y)
    ctx.lineTo(W - padX, y)
    ctx.stroke()
    ctx.fillText(`1e${p}`, 4, y + 4)
  }

  // x-axis: iterations
  const xIter = (k: number) => padX + (k / Math.max(MAX_HISTORY - 1, 1)) * (W - 2 * padX)

  // Jacobi history (orange)
  ctx.strokeStyle = '#fb923c'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let k = 0; k < histLen; k++) {
    const x = xIter(k)
    const y = yLog(s.histJ[k])
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // V-cycle history (cyan)
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let k = 0; k < histLen; k++) {
    const x = xIter(k)
    const y = yLog(s.histV[k])
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // labels (bottom panel)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText(`step ${s.iter} | ||r||_J = ${s.histJ[s.histJ.length - 1].toExponential(2)}  ||r||_V = ${s.histV[s.histV.length - 1].toExponential(2)}`, padX, splitY + 22)
  ctx.fillText('residual ||r||_2 (log) vs iterations →', W - padX - 240, H - 8)
}
