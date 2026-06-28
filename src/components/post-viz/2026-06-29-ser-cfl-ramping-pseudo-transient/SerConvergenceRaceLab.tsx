'use client'

import { useEffect, useRef, useState } from 'react'

// Steady viscous Burgers on [0,1]: u u_x = nu u_xx, BC u(0)=1, u(1)=-1.
// Pseudo-transient continuation (backward Euler): (I/dt + J) du = -R.
// Tridiagonal Jacobian solved with the Thomas algorithm.

const N = 80
const DX = 1 / (N + 1)
const MAX_ITER = 600
const TOL = 1e-9

function initialField(): number[] {
  const u = new Array<number>(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 1) * DX
    u[i] = 1 - 2 * x // linear guess from BC 1 -> -1
  }
  return u
}

function bc(u: number[], i: number): number {
  if (i < 0) return 1
  if (i >= N) return -1
  return u[i]
}

// residual vector and its L2 norm
function residual(u: number[], nu: number): number[] {
  const r = new Array<number>(N)
  for (let i = 0; i < N; i++) {
    const um = bc(u, i - 1)
    const uc = u[i]
    const up = bc(u, i + 1)
    const conv = uc * (up - um) / (2 * DX)
    const diff = nu * (up - 2 * uc + um) / (DX * DX)
    r[i] = conv - diff
  }
  return r
}

function l2(r: number[]): number {
  let s = 0
  for (let i = 0; i < N; i++) s += r[i] * r[i]
  return Math.sqrt(s / N)
}

// one implicit pseudo-transient update; returns new field
function ptcStep(u: number[], nu: number, dt: number): number[] {
  const a = new Array<number>(N) // sub
  const b = new Array<number>(N) // diag
  const c = new Array<number>(N) // super
  const d = new Array<number>(N) // rhs = -R
  const r = residual(u, nu)
  for (let i = 0; i < N; i++) {
    const uc = u[i]
    const um = bc(u, i - 1)
    const up = bc(u, i + 1)
    a[i] = -uc / (2 * DX) - nu / (DX * DX)
    b[i] = (up - um) / (2 * DX) + 2 * nu / (DX * DX) + 1 / dt
    c[i] = uc / (2 * DX) - nu / (DX * DX)
    d[i] = -r[i]
  }
  // Thomas algorithm
  for (let i = 1; i < N; i++) {
    const m = a[i] / b[i - 1]
    b[i] -= m * c[i - 1]
    d[i] -= m * d[i - 1]
  }
  const du = new Array<number>(N)
  du[N - 1] = d[N - 1] / b[N - 1]
  for (let i = N - 2; i >= 0; i--) du[i] = (d[i] - c[i] * du[i + 1]) / b[i]
  const next = new Array<number>(N)
  for (let i = 0; i < N; i++) next[i] = u[i] + du[i]
  return next
}

function dtFromCfl(u: number[], nu: number, cfl: number): number {
  let umax = 1e-6
  for (let i = 0; i < N; i++) umax = Math.max(umax, Math.abs(u[i]))
  return cfl * DX / (umax + 2 * nu / DX)
}

// run a solve; ser=true uses CFL = min(cfl0*(R0/Rn)^p, cflMax)
function solve(
  nu: number,
  ser: boolean,
  cfl0: number,
  p: number,
  cflMax: number,
): { hist: number[]; iters: number; diverged: boolean } {
  let u = initialField()
  const r0 = l2(residual(u, nu))
  const hist: number[] = [r0]
  let diverged = false
  let iters = MAX_ITER
  for (let n = 1; n <= MAX_ITER; n++) {
    const rn = hist[hist.length - 1]
    let cfl = cfl0
    if (ser) cfl = Math.min(cfl0 * Math.pow(r0 / rn, p), cflMax)
    const dt = dtFromCfl(u, nu, cfl)
    u = ptcStep(u, nu, dt)
    const rnew = l2(residual(u, nu))
    if (!isFinite(rnew) || rnew > 1e6) {
      hist.push(rnew)
      diverged = true
      iters = n
      break
    }
    hist.push(rnew)
    if (rnew / r0 < TOL) {
      iters = n
      break
    }
  }
  return { hist, iters, diverged }
}

export function SerConvergenceRaceLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nu, setNu] = useState(0.02)
  const [fixedCfl, setFixedCfl] = useState(3)
  const [cfl0, setCfl0] = useState(1)
  const [p, setP] = useState(1)
  const [cflMax, setCflMax] = useState(1e5)
  const [progress, setProgress] = useState(1) // animated reveal 0..1
  const rafRef = useRef<number>(0)

  const fixedRun = solve(nu, false, fixedCfl, 1, fixedCfl)
  const serRun = solve(nu, true, cfl0, p, cflMax)

  // animate the curve reveal whenever inputs change
  useEffect(() => {
    setProgress(0)
    let start = 0
    const dur = 900
    const tick = (t: number) => {
      if (!start) start = t
      const k = Math.min(1, (t - start) / dur)
      setProgress(k)
      if (k < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [nu, fixedCfl, cfl0, p, cflMax])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = 560
    const H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const padL = 52
    const padR = 16
    const padT = 16
    const padB = 36
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const maxIter = Math.max(fixedRun.hist.length, serRun.hist.length, 10)
    const logMin = -10 // 1e-10
    const logMax = 1 // 1e1
    const xOf = (it: number) => padL + (it / maxIter) * plotW
    const yOf = (val: number) => {
      const lg = Math.max(logMin, Math.min(logMax, Math.log10(Math.max(val, 1e-12))))
      return padT + (1 - (lg - logMin) / (logMax - logMin)) * plotH
    }

    // grid + axis labels (decades)
    ctx.strokeStyle = 'rgba(120,140,160,0.18)'
    ctx.fillStyle = 'rgba(150,170,190,0.85)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.lineWidth = 1
    for (let e = logMin; e <= logMax; e += 2) {
      const y = padT + (1 - (e - logMin) / (logMax - logMin)) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
      ctx.fillText(`1e${e}`, 6, y + 4)
    }
    ctx.fillText('iterations →', padL, H - 8)

    const drawCurve = (hist: number[], color: string) => {
      const upto = Math.max(2, Math.floor(hist.length * progress))
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < upto; i++) {
        const x = xOf(i)
        const y = yOf(hist[i] / hist[0])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    drawCurve(fixedRun.hist, '#f59e0b') // amber: fixed CFL
    drawCurve(serRun.hist, '#22d3ee') // cyan: SER

    // tolerance line
    ctx.strokeStyle = 'rgba(34,211,238,0.25)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    const ytol = yOf(TOL)
    ctx.moveTo(padL, ytol)
    ctx.lineTo(W - padR, ytol)
    ctx.stroke()
    ctx.setLineDash([])
  }, [nu, fixedCfl, cfl0, p, cflMax, progress, fixedRun, serRun])

  const fixedLabel = fixedRun.diverged
    ? 'diverged'
    : fixedRun.iters >= MAX_ITER
    ? `> ${MAX_ITER} (stalled)`
    : `${fixedRun.iters} iters`
  const serLabel = serRun.diverged
    ? 'diverged'
    : serRun.iters >= MAX_ITER
    ? `> ${MAX_ITER} (stalled)`
    : `${serRun.iters} iters`

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
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ color: '#f59e0b', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
          ● fixed CFL = {fixedCfl}: {fixedLabel}
        </span>
        <span style={{ color: '#22d3ee', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
          ● SER (CFL₀={cfl0}, p={p}): {serLabel}
        </span>
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
          viscosity ν = {nu.toFixed(3)}
          <input type="range" min={0.005} max={0.08} step={0.005} value={nu}
            onChange={(e) => setNu(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          fixed CFL = {fixedCfl}
          <input type="range" min={0.5} max={20} step={0.5} value={fixedCfl}
            onChange={(e) => setFixedCfl(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          SER start CFL₀ = {cfl0}
          <input type="range" min={0.2} max={5} step={0.2} value={cfl0}
            onChange={(e) => setCfl0(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          SER exponent p = {p.toFixed(1)}
          <input type="range" min={0.3} max={2} step={0.1} value={p}
            onChange={(e) => setP(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>
          SER cap CFLₘₐₓ = {cflMax >= 1e5 ? '∞' : cflMax}
          <input type="range" min={10} max={100000} step={10} value={cflMax}
            onChange={(e) => setCflMax(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
        Residual L2 norm (normalized by initial), log scale. Dashed line = convergence tolerance 1e-9.
      </p>
    </div>
  )
}
