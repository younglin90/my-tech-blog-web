'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// 1D linear acoustic equations on a periodic staggered grid:
//   d_t rho = -d_x u
//   d_t u   = -(1/M^2) d_x rho
// rho lives at cell centers, u at cell edges (i+1/2).
// Two solvers run in lock-step: explicit forward Euler vs IMEX with
// implicit pressure (Cordier-Degond-Kumbaro style). The IMEX update
// reduces to a circulant Helmholtz system on u, solved here in spectral
// space (DFT, N=64).

const N = 64

function dft(x: Float64Array, sign: number): { re: Float64Array; im: Float64Array } {
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let k = 0; k < N; k++) {
    let r = 0
    let i = 0
    for (let n = 0; n < N; n++) {
      const phi = (sign * 2 * Math.PI * k * n) / N
      r += x[n] * Math.cos(phi)
      i += x[n] * Math.sin(phi)
    }
    re[k] = r
    im[k] = i
  }
  return { re, im }
}

function solveHelmholtzPeriodic(rhs: Float64Array, alpha: number): Float64Array {
  // Solve  -alpha u_{i-1} + (1+2 alpha) u_i - alpha u_{i+1} = rhs_i
  // Eigenvalues of the circulant operator: 1 + 2 alpha (1 - cos(2 pi k / N))
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let k = 0; k < N; k++) {
    let r = 0
    let i = 0
    for (let n = 0; n < N; n++) {
      const phi = (-2 * Math.PI * k * n) / N
      r += rhs[n] * Math.cos(phi)
      i += rhs[n] * Math.sin(phi)
    }
    const lam = 1 + 2 * alpha * (1 - Math.cos((2 * Math.PI * k) / N))
    re[k] = r / lam
    im[k] = i / lam
  }
  const out = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    let r = 0
    for (let k = 0; k < N; k++) {
      const phi = (2 * Math.PI * k * n) / N
      r += re[k] * Math.cos(phi) - im[k] * Math.sin(phi)
    }
    out[n] = r / N
  }
  return out
}

function gaussianPulseAt(x: number): number {
  const dx = x - 0.5
  return 0.1 * Math.exp(-120 * dx * dx)
}

type Scheme = {
  rho: Float64Array
  u: Float64Array
  blew: boolean
}

function fresh(): Scheme {
  const rho = new Float64Array(N)
  const u = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    rho[i] = gaussianPulseAt(x)
  }
  return { rho, u, blew: false }
}

export function APIMEXAcousticPulse1D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [M, setM] = useState(0.2)
  const [dtRel, setDtRel] = useState(2.0) // dt = dtRel * M * dx (so dtRel = CFL_acoustic)
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)

  const stateRef = useRef<{ ex: Scheme; im: Scheme; t: number }>({
    ex: fresh(),
    im: fresh(),
    t: 0,
  })

  // Reset on parameter change
  useEffect(() => {
    stateRef.current = { ex: fresh(), im: fresh(), t: 0 }
  }, [M, dtRel, tick])

  const reset = () => setTick((k) => k + 1)

  useEffect(() => {
    let id = 0
    let last = performance.now()
    const dx = 1 / N

    const loop = (now: number) => {
      id = requestAnimationFrame(loop)
      const elapsed = Math.min(now - last, 50)
      last = now
      if (!running) return

      const dt = dtRel * M * dx
      const cfl_ac = (1 / M) * (dt / dx) // = dtRel
      const stepsThisFrame = Math.max(1, Math.floor((elapsed / 16.7) * 2))
      const s = stateRef.current

      for (let step = 0; step < stepsThisFrame; step++) {
        // Explicit forward Euler on staggered grid
        if (!s.ex.blew) {
          const drho = new Float64Array(N)
          const du = new Float64Array(N)
          for (let i = 0; i < N; i++) {
            const im1 = (i - 1 + N) % N
            const ip1 = (i + 1) % N
            // rho_i^{n+1} = rho_i^n - dt/dx * (u_{i+1/2} - u_{i-1/2})
            drho[i] = -(s.ex.u[i] - s.ex.u[im1]) / dx
            // u_{i+1/2}^{n+1} = u^n - dt/(M^2 dx) * (rho_{i+1} - rho_i)
            du[i] = -(s.ex.rho[ip1] - s.ex.rho[i]) / (M * M * dx)
          }
          for (let i = 0; i < N; i++) {
            s.ex.rho[i] += dt * drho[i]
            s.ex.u[i] += dt * du[i]
            if (!isFinite(s.ex.rho[i]) || Math.abs(s.ex.rho[i]) > 5 || Math.abs(s.ex.u[i]) > 50) {
              s.ex.blew = true
              break
            }
          }
        }

        // IMEX: implicit pressure -> circulant Helmholtz on u^{n+1}
        const alpha = (dt * dt) / (M * M * dx * dx)
        const rhs = new Float64Array(N)
        for (let i = 0; i < N; i++) {
          const ip1 = (i + 1) % N
          rhs[i] = s.im.u[i] - (dt / (M * M * dx)) * (s.im.rho[ip1] - s.im.rho[i])
        }
        const uNew = solveHelmholtzPeriodic(rhs, alpha)
        for (let i = 0; i < N; i++) {
          const im1 = (i - 1 + N) % N
          s.im.rho[i] = s.im.rho[i] - (dt / dx) * (uNew[i] - uNew[im1])
        }
        s.im.u = uNew
        s.t += dt
      }

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const drawTrace = (
        rho: Float64Array,
        y0: number,
        h: number,
        color: string,
        label: string,
        blew: boolean,
        sublabel: string,
      ) => {
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, y0 + h / 2)
        ctx.lineTo(W, y0 + h / 2)
        ctx.stroke()
        const yScale = h * 1.8
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const xv = ((i + 0.5) / N) * W
          const yv = y0 + h / 2 - rho[i] * yScale
          if (i === 0) ctx.moveTo(xv, yv)
          else ctx.lineTo(xv, yv)
        }
        ctx.stroke()
        if (blew) {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.18)'
          ctx.fillRect(0, y0, W, h)
          ctx.fillStyle = '#fca5a5'
          ctx.font = 'bold 14px ui-monospace, monospace'
          ctx.textAlign = 'center'
          ctx.fillText('blew up — explicit needs CFL_ac < 1', W / 2, y0 + h / 2 + 4)
          ctx.textAlign = 'left'
        }
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText(label, 8, y0 + 16)
        ctx.fillStyle = '#64748b'
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(sublabel, 8, y0 + 30)
      }

      drawTrace(
        s.ex.rho,
        0,
        H / 2,
        '#f87171',
        'explicit forward Euler',
        s.ex.blew,
        'pressure & transport both explicit',
      )
      drawTrace(
        s.im.rho,
        H / 2,
        H / 2,
        '#22d3ee',
        'AP-IMEX (implicit pressure)',
        false,
        'pressure gradient implicit, transport explicit',
      )

      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px ui-monospace, monospace'
      const stats = `M = ${M.toFixed(2)}    c = 1/M = ${(1 / M).toFixed(2)}    dt = ${dt.toFixed(4)}    dx = ${dx.toFixed(4)}    CFL_ac = c·dt/dx = ${cfl_ac.toFixed(2)}    t = ${s.t.toFixed(2)}`
      ctx.fillText(stats, 8, H - 10)
    }

    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [M, dtRel, running])

  const cflLabel = useMemo(() => {
    const cfl = dtRel
    if (cfl > 1) return `CFL_ac = ${cfl.toFixed(2)} (explicit unstable)`
    return `CFL_ac = ${cfl.toFixed(2)} (explicit stable)`
  }, [dtRel])

  return (
    <div className="my-6 rounded-lg border border-[var(--border,#1e293b)] bg-[#0b1220] p-3 text-sm text-slate-200">
      <canvas
        ref={canvasRef}
        width={720}
        height={360}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
      />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs text-slate-400">
            Mach number M = {M.toFixed(2)} (c = {(1 / M).toFixed(2)})
          </span>
          <input
            type="range"
            min={0.05}
            max={1.0}
            step={0.01}
            value={M}
            onChange={(e) => setM(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs text-slate-400">{cflLabel}</span>
          <input
            type="range"
            min={0.1}
            max={5.0}
            step={0.05}
            value={dtRel}
            onChange={(e) => setDtRel(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded border border-slate-600 px-3 py-1 font-mono text-xs hover:bg-slate-800"
        >
          {running ? 'pause' : 'play'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-slate-600 px-3 py-1 font-mono text-xs hover:bg-slate-800"
        >
          reset pulse
        </button>
        <span className="ml-auto self-center font-mono text-[10px] text-slate-500">
          drag M low → c grows → explicit dt-cap shrinks; IMEX keeps marching
        </span>
      </div>
    </div>
  )
}
