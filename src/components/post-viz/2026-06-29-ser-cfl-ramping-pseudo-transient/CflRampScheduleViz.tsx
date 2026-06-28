'use client'

import { useEffect, useRef, useState } from 'react'

// Shows how SER ramps the CFL number across pseudo-transient iterations.
// Same steady viscous Burgers solver; here we record CFL_n and residual_n.

const N = 80
const DX = 1 / (N + 1)
const MAX_ITER = 400
const TOL = 1e-9

function bc(u: number[], i: number): number {
  if (i < 0) return 1
  if (i >= N) return -1
  return u[i]
}

function residual(u: number[], nu: number): number[] {
  const r = new Array<number>(N)
  for (let i = 0; i < N; i++) {
    const um = bc(u, i - 1)
    const uc = u[i]
    const up = bc(u, i + 1)
    r[i] = uc * (up - um) / (2 * DX) - nu * (up - 2 * uc + um) / (DX * DX)
  }
  return r
}

function l2(r: number[]): number {
  let s = 0
  for (let i = 0; i < N; i++) s += r[i] * r[i]
  return Math.sqrt(s / N)
}

function step(u: number[], nu: number, dt: number): number[] {
  const a = new Array<number>(N)
  const b = new Array<number>(N)
  const c = new Array<number>(N)
  const d = new Array<number>(N)
  const r = residual(u, nu)
  for (let i = 0; i < N; i++) {
    const uc = u[i]
    a[i] = -uc / (2 * DX) - nu / (DX * DX)
    b[i] = (bc(u, i + 1) - bc(u, i - 1)) / (2 * DX) + 2 * nu / (DX * DX) + 1 / dt
    c[i] = uc / (2 * DX) - nu / (DX * DX)
    d[i] = -r[i]
  }
  for (let i = 1; i < N; i++) {
    const m = a[i] / b[i - 1]
    b[i] -= m * c[i - 1]
    d[i] -= m * d[i - 1]
  }
  const du = new Array<number>(N)
  du[N - 1] = d[N - 1] / b[N - 1]
  for (let i = N - 2; i >= 0; i--) du[i] = (d[i] - c[i] * du[i + 1]) / b[i]
  return u.map((v, i) => v + du[i])
}

function runSer(nu: number, cfl0: number, p: number, cflMax: number) {
  let u = new Array<number>(N)
  for (let i = 0; i < N; i++) u[i] = 1 - 2 * (i + 1) * DX
  const r0 = l2(residual(u, nu))
  const cfls: number[] = []
  const res: number[] = []
  let rn = r0
  let iters = MAX_ITER
  for (let n = 0; n < MAX_ITER; n++) {
    const cfl = Math.min(cfl0 * Math.pow(r0 / rn, p), cflMax)
    cfls.push(cfl)
    let umax = 1e-6
    for (let i = 0; i < N; i++) umax = Math.max(umax, Math.abs(u[i]))
    const dt = cfl * DX / (umax + 2 * nu / DX)
    u = step(u, nu, dt)
    rn = l2(residual(u, nu))
    res.push(rn / r0)
    if (rn / r0 < TOL) {
      iters = n + 1
      break
    }
  }
  return { cfls, res, iters }
}

export function CflRampScheduleViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cfl0, setCfl0] = useState(1)
  const [p, setP] = useState(1)
  const [cflMax, setCflMax] = useState(2000)
  const nu = 0.02

  const run = runSer(nu, cfl0, p, cflMax)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = 560
    const H = 300
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const padL = 50
    const padR = 50
    const padT = 16
    const padB = 34
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const nIt = Math.max(run.cfls.length, 5)
    const xOf = (i: number) => padL + (i / nIt) * plotW

    // CFL on left axis (log), residual on right axis (log)
    const cflLogMin = -1 // 0.1
    const cflLogMax = Math.max(2, Math.ceil(Math.log10(Math.max(...run.cfls, 10))))
    const yCfl = (v: number) => {
      const lg = Math.max(cflLogMin, Math.min(cflLogMax, Math.log10(Math.max(v, 1e-3))))
      return padT + (1 - (lg - cflLogMin) / (cflLogMax - cflLogMin)) * plotH
    }
    const resLogMin = -10
    const resLogMax = 0
    const yRes = (v: number) => {
      const lg = Math.max(resLogMin, Math.min(resLogMax, Math.log10(Math.max(v, 1e-12))))
      return padT + (1 - (lg - resLogMin) / (resLogMax - resLogMin)) * plotH
    }

    ctx.strokeStyle = 'rgba(120,140,160,0.16)'
    ctx.lineWidth = 1
    for (let e = cflLogMin; e <= cflLogMax; e++) {
      const y = padT + (1 - (e - cflLogMin) / (cflLogMax - cflLogMin)) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillStyle = '#22d3ee'
    ctx.fillText('CFL', 6, padT + 10)
    ctx.fillStyle = '#f472b6'
    ctx.fillText('residual', W - padR + 4, padT + 10)
    ctx.fillStyle = 'rgba(150,170,190,0.85)'
    ctx.fillText('iterations →', padL, H - 8)

    // residual curve (pink, right axis)
    ctx.strokeStyle = '#f472b6'
    ctx.lineWidth = 2
    ctx.beginPath()
    run.res.forEach((v, i) => {
      const x = xOf(i)
      const y = yRes(v)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // CFL ramp (cyan, left axis)
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    run.cfls.forEach((v, i) => {
      const x = xOf(i)
      const y = yCfl(v)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // cap line
    if (cflMax < Math.pow(10, cflLogMax)) {
      ctx.strokeStyle = 'rgba(34,211,238,0.3)'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      const yc = yCfl(cflMax)
      ctx.moveTo(padL, yc)
      ctx.lineTo(W - padR, yc)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(34,211,238,0.7)'
      ctx.fillText(`cap ${cflMax}`, padL + 6, yc - 4)
    }
  }, [cfl0, p, cflMax, run])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          marginBottom: 8,
          color: 'var(--text-muted)',
        }}
      >
        converged in {run.iters >= MAX_ITER ? `> ${MAX_ITER}` : run.iters} iterations
      </div>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
          marginTop: 14,
          fontSize: 13,
        }}
      >
        <label>
          start CFL₀ = {cfl0}
          <input type="range" min={0.2} max={5} step={0.2} value={cfl0}
            onChange={(e) => setCfl0(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          exponent p = {p.toFixed(1)}
          <input type="range" min={0.3} max={2} step={0.1} value={p}
            onChange={(e) => setP(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          cap CFLₘₐₓ = {cflMax}
          <input type="range" min={20} max={20000} step={20} value={cflMax}
            onChange={(e) => setCflMax(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
        Cyan = CFL schedule (left log axis), pink = residual (right log axis). Both share the
        iteration axis.
      </p>
    </div>
  )
}
