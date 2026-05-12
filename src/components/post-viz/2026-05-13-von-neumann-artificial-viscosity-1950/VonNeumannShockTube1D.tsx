'use client'

import { useEffect, useRef, useState } from 'react'

const N = 200
const GAMMA = 1.4
const DX = 1.0 / N
const CFL = 0.45

type State = {
  rho: Float64Array
  mom: Float64Array
  E: Float64Array
}

function makeState(): State {
  const rho = new Float64Array(N)
  const mom = new Float64Array(N)
  const E = new Float64Array(N)
  const rhoL = 1.0
  const pL = 1.0
  const rhoR = 0.125
  const pR = 0.1
  for (let i = 0; i < N; i++) {
    if (i < N / 2) {
      rho[i] = rhoL
      mom[i] = 0
      E[i] = pL / (GAMMA - 1)
    } else {
      rho[i] = rhoR
      mom[i] = 0
      E[i] = pR / (GAMMA - 1)
    }
  }
  return { rho, mom, E }
}

function pressure(rho: number, mom: number, E: number): number {
  const u = mom / rho
  return (GAMMA - 1) * (E - 0.5 * rho * u * u)
}

function step(state: State, xi: number): number {
  const { rho, mom, E } = state
  const u = new Float64Array(N)
  const p = new Float64Array(N)
  const q = new Float64Array(N)
  let cmax = 1e-6
  for (let i = 0; i < N; i++) {
    u[i] = mom[i] / rho[i]
    p[i] = pressure(rho[i], mom[i], E[i])
    if (p[i] < 1e-9) p[i] = 1e-9
    const c = Math.sqrt((GAMMA * p[i]) / rho[i])
    cmax = Math.max(cmax, Math.abs(u[i]) + c)
  }
  for (let i = 1; i < N - 1; i++) {
    const du = u[i + 1] - u[i - 1]
    if (du < 0) {
      q[i] = 0.25 * xi * xi * du * du * rho[i]
    } else {
      q[i] = 0
    }
  }
  const dt = (CFL * DX) / cmax
  const rhoN = new Float64Array(N)
  const momN = new Float64Array(N)
  const EN = new Float64Array(N)
  for (let i = 1; i < N - 1; i++) {
    const uIp = 0.5 * (u[i] + u[i + 1])
    const uIm = 0.5 * (u[i - 1] + u[i])
    const fIp = uIp > 0 ? rho[i] * uIp : rho[i + 1] * uIp
    const fIm = uIm > 0 ? rho[i - 1] * uIm : rho[i] * uIm
    rhoN[i] = rho[i] - (dt / DX) * (fIp - fIm)
    const gIp = uIp > 0 ? mom[i] * uIp : mom[i + 1] * uIp
    const gIm = uIm > 0 ? mom[i - 1] * uIm : mom[i] * uIm
    momN[i] = mom[i] - (dt / DX) * (gIp - gIm)
    const hIp = uIp > 0 ? E[i] * uIp : E[i + 1] * uIp
    const hIm = uIm > 0 ? E[i - 1] * uIm : E[i] * uIm
    EN[i] = E[i] - (dt / DX) * (hIp - hIm)
  }
  rhoN[0] = rho[0]
  momN[0] = mom[0]
  EN[0] = E[0]
  rhoN[N - 1] = rho[N - 1]
  momN[N - 1] = mom[N - 1]
  EN[N - 1] = E[N - 1]
  for (let i = 1; i < N - 1; i++) {
    const Pe = p[i + 1] + q[i + 1]
    const Pw = p[i - 1] + q[i - 1]
    momN[i] -= (dt / (2 * DX)) * (Pe - Pw)
    const Pue = (p[i + 1] + q[i + 1]) * u[i + 1]
    const Puw = (p[i - 1] + q[i - 1]) * u[i - 1]
    EN[i] -= (dt / (2 * DX)) * (Pue - Puw)
  }
  for (let i = 0; i < N; i++) {
    rho[i] = Math.max(rhoN[i], 1e-6)
    mom[i] = momN[i]
    E[i] = Math.max(EN[i], 1e-6)
  }
  return dt
}

export function VonNeumannShockTube1D() {
  const [xi, setXi] = useState(0.0)
  const [running, setRunning] = useState(true)
  const [t, setT] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<State>(makeState())
  const xiRef = useRef(xi)
  const tRef = useRef(0)

  useEffect(() => {
    xiRef.current = xi
  }, [xi])

  const reset = () => {
    stateRef.current = makeState()
    tRef.current = 0
    setT(0)
  }

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dtFrame = Math.min((now - last) / 1000, 0.05)
      last = now
      const targetT = tRef.current + dtFrame * 0.25
      let simT = tRef.current
      let guard = 0
      while (simT < targetT && guard < 200) {
        simT += step(stateRef.current, xiRef.current)
        guard++
        if (simT > 0.25) break
      }
      tRef.current = simT
      setT(simT)
      draw()
      if (simT < 0.25) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, t === 0])

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width
    const H = c.height
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)
    const { rho, mom, E } = stateRef.current
    const drawCurve = (data: Float64Array, lo: number, hi: number, color: string) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * (W - 20) + 10
        const y = H - 20 - ((data[i] - lo) / (hi - lo)) * (H - 40)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    const p = new Float64Array(N)
    for (let i = 0; i < N; i++) p[i] = pressure(rho[i], mom[i], E[i])
    drawCurve(rho, 0.05, 1.1, '#22d3ee')
    drawCurve(p, 0.05, 1.1, '#f59e0b')
    ctx.fillStyle = '#22d3ee'
    ctx.font = '12px system-ui'
    ctx.fillText('ρ density', 12, 18)
    ctx.fillStyle = '#f59e0b'
    ctx.fillText('p pressure', 90, 18)
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`t = ${t.toFixed(3)}    ξ = ${xi.toFixed(2)}`, W - 180, 18)
  }

  useEffect(() => {
    draw()
  })

  return (
    <div style={{ background: '#0e1a2e', padding: 16, borderRadius: 8, margin: '24px 0' }}>
      <canvas ref={canvasRef} width={680} height={260} style={{ width: '100%', display: 'block' }} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap', color: '#cbd5e1', fontSize: 13 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px' }}>
          ξ artificial viscosity
          <input type="range" min={0} max={5} step={0.1} value={xi} onChange={(e) => setXi(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span style={{ width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{xi.toFixed(1)}</span>
        </label>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '6px 14px', background: '#22d3ee', color: '#08111f', border: 0, borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={reset} style={{ padding: '6px 14px', background: 'transparent', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }}>
          reset
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        Sod shock tube. ξ=0: post-shock oscillations. ξ≈2-3: shock smeared over a few cells, wiggles damped.
      </div>
    </div>
  )
}
