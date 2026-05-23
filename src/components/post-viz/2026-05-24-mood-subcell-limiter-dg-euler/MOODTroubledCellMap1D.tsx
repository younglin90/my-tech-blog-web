'use client'

import { useEffect, useRef, useState } from 'react'

const N = 200
const GAMMA = 1.4
const DX = 1.0 / N
const CFL = 0.35

type State = {
  U: Float64Array  // 3 * N flat
  beta: Uint8Array
  t: number
  step: number
  crashed: boolean
}

function makeInitial(pRatio: number): State {
  const U = new Float64Array(3 * N)
  const pL = pRatio
  const pR = 0.01
  const rhoL = 1.0
  const rhoR = 0.125
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    const rho = x < 0.5 ? rhoL : rhoR
    const p = x < 0.5 ? pL : pR
    const u = 0.0
    U[0 * N + i] = rho
    U[1 * N + i] = rho * u
    U[2 * N + i] = p / (GAMMA - 1) + 0.5 * rho * u * u
  }
  return { U, beta: new Uint8Array(N), t: 0, step: 0, crashed: false }
}

function prim(U: Float64Array, i: number): [number, number, number] {
  const rho = U[0 * N + i]
  const u = U[1 * N + i] / Math.max(rho, 1e-12)
  const E = U[2 * N + i]
  const p = (GAMMA - 1) * (E - 0.5 * rho * u * u)
  return [rho, u, p]
}

function physFlux(U: Float64Array, i: number, out: [number, number, number]): void {
  const [rho, u, p] = prim(U, i)
  out[0] = rho * u
  out[1] = rho * u * u + p
  out[2] = u * (U[2 * N + i] + p)
}

function lfFluxFace(
  uL0: number, uL1: number, uL2: number,
  uR0: number, uR1: number, uR2: number,
  out: [number, number, number],
): void {
  const rhoL = Math.max(uL0, 1e-12)
  const velL = uL1 / rhoL
  const pL = Math.max((GAMMA - 1) * (uL2 - 0.5 * rhoL * velL * velL), 1e-12)
  const cL = Math.sqrt(GAMMA * pL / rhoL)
  const rhoR = Math.max(uR0, 1e-12)
  const velR = uR1 / rhoR
  const pR = Math.max((GAMMA - 1) * (uR2 - 0.5 * rhoR * velR * velR), 1e-12)
  const cR = Math.sqrt(GAMMA * pR / rhoR)
  const a = Math.max(Math.abs(velL) + cL, Math.abs(velR) + cR)
  const FL0 = rhoL * velL
  const FL1 = rhoL * velL * velL + pL
  const FL2 = velL * (uL2 + pL)
  const FR0 = rhoR * velR
  const FR1 = rhoR * velR * velR + pR
  const FR2 = velR * (uR2 + pR)
  out[0] = 0.5 * (FL0 + FR0) - 0.5 * a * (uR0 - uL0)
  out[1] = 0.5 * (FL1 + FR1) - 0.5 * a * (uR1 - uL1)
  out[2] = 0.5 * (FL2 + FR2) - 0.5 * a * (uR2 - uL2)
}

function maxWaveSpeed(U: Float64Array): number {
  let amax = 0
  for (let i = 0; i < N; i++) {
    const [rho, u, p] = prim(U, i)
    if (rho <= 0 || p <= 0) continue
    const c = Math.sqrt(GAMMA * p / Math.max(rho, 1e-12))
    const a = Math.abs(u) + c
    if (a > amax) amax = a
  }
  return Math.max(amax, 1e-6)
}

function candidateMUSCL(U: Float64Array, dt: number): Float64Array {
  const out = new Float64Array(U)
  const slopes = new Float64Array(3 * N)
  for (let v = 0; v < 3; v++) {
    for (let i = 1; i < N - 1; i++) {
      slopes[v * N + i] = 0.5 * (U[v * N + i + 1] - U[v * N + i - 1])
    }
  }
  const F = new Float64Array(3 * (N + 1))
  const tmp: [number, number, number] = [0, 0, 0]
  for (let i = 1; i < N; i++) {
    // face between cell i-1 (right boundary) and cell i (left boundary)
    const L0 = U[0 * N + (i - 1)] + 0.5 * slopes[0 * N + (i - 1)]
    const L1 = U[1 * N + (i - 1)] + 0.5 * slopes[1 * N + (i - 1)]
    const L2 = U[2 * N + (i - 1)] + 0.5 * slopes[2 * N + (i - 1)]
    const R0 = U[0 * N + i] - 0.5 * slopes[0 * N + i]
    const R1 = U[1 * N + i] - 0.5 * slopes[1 * N + i]
    const R2 = U[2 * N + i] - 0.5 * slopes[2 * N + i]
    lfFluxFace(L0, L1, L2, R0, R1, R2, tmp)
    F[0 * (N + 1) + i] = tmp[0]
    F[1 * (N + 1) + i] = tmp[1]
    F[2 * (N + 1) + i] = tmp[2]
  }
  // boundary fluxes — transmissive
  const tmp2: [number, number, number] = [0, 0, 0]
  physFlux(U, 0, tmp2)
  F[0] = tmp2[0]; F[N + 1] = tmp2[1]; F[2 * (N + 1)] = tmp2[2]
  physFlux(U, N - 1, tmp2)
  F[N] = tmp2[0]; F[2 * (N + 1) - 1] = tmp2[1]; F[3 * (N + 1) - 1] = tmp2[2]
  const lam = dt / DX
  for (let i = 1; i < N - 1; i++) {
    out[0 * N + i] = U[0 * N + i] - lam * (F[0 * (N + 1) + i + 1] - F[0 * (N + 1) + i])
    out[1 * N + i] = U[1 * N + i] - lam * (F[1 * (N + 1) + i + 1] - F[1 * (N + 1) + i])
    out[2 * N + i] = U[2 * N + i] - lam * (F[2 * (N + 1) + i + 1] - F[2 * (N + 1) + i])
  }
  return out
}

function fallbackGodunov(U: Float64Array, dt: number): Float64Array {
  const out = new Float64Array(U)
  const F = new Float64Array(3 * (N + 1))
  const tmp: [number, number, number] = [0, 0, 0]
  for (let i = 1; i < N; i++) {
    lfFluxFace(
      U[0 * N + (i - 1)], U[1 * N + (i - 1)], U[2 * N + (i - 1)],
      U[0 * N + i], U[1 * N + i], U[2 * N + i],
      tmp,
    )
    F[0 * (N + 1) + i] = tmp[0]
    F[1 * (N + 1) + i] = tmp[1]
    F[2 * (N + 1) + i] = tmp[2]
  }
  const lam = dt / DX
  for (let i = 1; i < N - 1; i++) {
    out[0 * N + i] = U[0 * N + i] - lam * (F[0 * (N + 1) + i + 1] - F[0 * (N + 1) + i])
    out[1 * N + i] = U[1 * N + i] - lam * (F[1 * (N + 1) + i + 1] - F[1 * (N + 1) + i])
    out[2 * N + i] = U[2 * N + i] - lam * (F[2 * (N + 1) + i + 1] - F[2 * (N + 1) + i])
  }
  return out
}

function detectTroubled(
  Uold: Float64Array,
  Ucand: Float64Array,
  delta0: number,
  eps: number,
): Uint8Array {
  const beta = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    const [rho, , p] = prim(Ucand, i)
    if (!(rho > 0) || !(p > 0) || !isFinite(rho) || !isFinite(p)) {
      beta[i] = 1
    }
  }
  // NAD on rho and p with old neighbors
  const rhoOld = new Float64Array(N)
  const pOld = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const [r, , pp] = prim(Uold, i)
    rhoOld[i] = r
    pOld[i] = pp
  }
  const rhoCand = new Float64Array(N)
  const pCand = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const [r, , pp] = prim(Ucand, i)
    rhoCand[i] = r
    pCand[i] = pp
  }
  for (let i = 1; i < N - 1; i++) {
    if (beta[i]) continue
    const checks: [Float64Array, Float64Array][] = [
      [rhoOld, rhoCand],
      [pOld, pCand],
    ]
    for (const [qOld, qNew] of checks) {
      const qm = qOld[i - 1], qi = qOld[i], qp = qOld[i + 1]
      const qmin = Math.min(qm, qi, qp)
      const qmax = Math.max(qm, qi, qp)
      const d = Math.max(delta0, eps * (qmax - qmin))
      if (qNew[i] < qmin - d || qNew[i] > qmax + d) {
        beta[i] = 1
        break
      }
    }
  }
  return beta
}

function moodStep(s: State, delta0: number, eps: number): State {
  const amax = maxWaveSpeed(s.U)
  const dt = (CFL * DX) / amax
  const Ucand = candidateMUSCL(s.U, dt)
  const beta = detectTroubled(s.U, Ucand, delta0, eps)
  const Usafe = fallbackGodunov(s.U, dt)
  const Unew = new Float64Array(3 * N)
  for (let i = 0; i < N; i++) {
    const src = beta[i] ? Usafe : Ucand
    Unew[0 * N + i] = src[0 * N + i]
    Unew[1 * N + i] = src[1 * N + i]
    Unew[2 * N + i] = src[2 * N + i]
  }
  let crashed = false
  for (let i = 0; i < N; i++) {
    if (!isFinite(Unew[0 * N + i]) || !isFinite(Unew[2 * N + i])) {
      crashed = true
      break
    }
  }
  return { U: Unew, beta, t: s.t + dt, step: s.step + 1, crashed }
}

export function MOODTroubledCellMap1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pRatio, setPRatio] = useState(1000)
  const [delta0Log, setDelta0Log] = useState(-4) // 10^-4
  const [running, setRunning] = useState(true)
  const [showLimiterOff, setShowLimiterOff] = useState(false)
  const stateRef = useRef<State>(makeInitial(1000))
  const stateLOffRef = useRef<State>(makeInitial(1000))
  const rafRef = useRef<number | null>(null)
  const tendDisplayRef = useRef<{ tEnd: number; troubledTotal: number }>({
    tEnd: 0.012,
    troubledTotal: 0,
  })

  // reset whenever pRatio changes
  useEffect(() => {
    stateRef.current = makeInitial(pRatio)
    stateLOffRef.current = makeInitial(pRatio)
    tendDisplayRef.current = { tEnd: 0.012, troubledTotal: 0 }
  }, [pRatio])

  useEffect(() => {
    const delta0 = Math.pow(10, delta0Log)
    const eps = 5e-4
    const T_END = 0.012

    let mounted = true

    const tick = () => {
      if (!mounted) return
      const s = stateRef.current
      const sNoLim = stateLOffRef.current
      if (running && s.t < T_END && !s.crashed) {
        // step 2 substeps per frame for snappier feel
        let cur = s
        let curNoLim = sNoLim
        let troubled = tendDisplayRef.current.troubledTotal
        for (let k = 0; k < 2 && cur.t < T_END && !cur.crashed; k++) {
          cur = moodStep(cur, delta0, eps)
          for (let i = 0; i < N; i++) troubled += cur.beta[i]
          if (showLimiterOff && !curNoLim.crashed && curNoLim.t < T_END) {
            // candidate-only (no limiter)
            const amax = maxWaveSpeed(curNoLim.U)
            const dt = (CFL * DX) / amax
            const Ucand = candidateMUSCL(curNoLim.U, dt)
            let crashed = false
            for (let i = 0; i < N; i++) {
              if (!isFinite(Ucand[0 * N + i]) || !isFinite(Ucand[2 * N + i])) {
                crashed = true
                break
              }
              const [rho, , p] = prim(Ucand, i)
              if (rho <= 0 || p <= 0) {
                crashed = true
                break
              }
            }
            curNoLim = {
              U: Ucand,
              beta: new Uint8Array(N),
              t: curNoLim.t + dt,
              step: curNoLim.step + 1,
              crashed,
            }
          }
        }
        stateRef.current = cur
        stateLOffRef.current = curNoLim
        tendDisplayRef.current = { tEnd: cur.t, troubledTotal: troubled }
      }
      draw()
      rafRef.current = requestAnimationFrame(tick)
    }

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr
        canvas.height = H * dpr
        ctx.scale(dpr, dpr)
      }
      ctx.clearRect(0, 0, W, H)

      const padL = 56
      const padR = 16
      const padT = 18
      const padB = 28
      const gap = 22
      const halfH = (H - padT - padB - gap) / 2
      const plotW = W - padL - padR
      const s = stateRef.current
      const sNoLim = stateLOffRef.current

      // compute ρ and p arrays
      const rho = new Float64Array(N)
      const pres = new Float64Array(N)
      for (let i = 0; i < N; i++) {
        const [r, , pp] = prim(s.U, i)
        rho[i] = r
        pres[i] = pp
      }
      const rhoNoLim = new Float64Array(N)
      const pNoLim = new Float64Array(N)
      if (showLimiterOff) {
        for (let i = 0; i < N; i++) {
          const [r, , pp] = prim(sNoLim.U, i)
          rhoNoLim[i] = r
          pNoLim[i] = pp
        }
      }

      const rhoMax = 1.5
      const pMax = pRatio * 1.05

      const toX = (xv: number) => padL + xv * plotW

      // troubled-cell shading on both panels
      const top1 = padT
      const top2 = padT + halfH + gap
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)'
      for (let i = 0; i < N; i++) {
        if (s.beta[i]) {
          const x0 = toX(i / N)
          const x1 = toX((i + 1) / N)
          ctx.fillRect(x0, top1, x1 - x0, halfH)
          ctx.fillRect(x0, top2, x1 - x0, halfH)
        }
      }

      // axes
      const drawAxes = (top: number, ymax: number, label: string, ticks: number[]) => {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i <= 5; i++) {
          const x = padL + (i / 5) * plotW
          ctx.moveTo(x, top)
          ctx.lineTo(x, top + halfH)
        }
        for (const v of ticks) {
          const y = top + halfH - (v / ymax) * halfH
          ctx.moveTo(padL, y)
          ctx.lineTo(padL + plotW, y)
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
        ctx.font = '11px ui-monospace, monospace'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        for (const v of ticks) {
          const y = top + halfH - (v / ymax) * halfH
          ctx.fillText(v < 1 ? v.toFixed(2) : v.toFixed(0), padL - 6, y)
        }
        ctx.save()
        ctx.translate(14, top + halfH / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(203, 213, 225, 0.85)'
        ctx.fillText(label, 0, 0)
        ctx.restore()
      }

      drawAxes(top1, rhoMax, 'rho', [0, 0.5, 1.0, 1.5])
      drawAxes(top2, pMax, 'p', [0, pMax * 0.25, pMax * 0.5, pMax * 0.75, pMax])

      // limiter-off ghost curve
      if (showLimiterOff && !sNoLim.crashed) {
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.55)'
        ctx.setLineDash([4, 3])
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const x = toX((i + 0.5) / N)
          const y = top1 + halfH - (Math.min(rhoNoLim[i], rhoMax) / rhoMax) * halfH
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const x = toX((i + 0.5) / N)
          const y = top2 + halfH - (Math.min(Math.max(pNoLim[i], 0), pMax) / pMax) * halfH
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      // limited (MOOD) curves
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = toX((i + 0.5) / N)
        const y = top1 + halfH - (Math.min(rho[i], rhoMax) / rhoMax) * halfH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.strokeStyle = '#facc15'
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = toX((i + 0.5) / N)
        const y = top2 + halfH - (Math.min(Math.max(pres[i], 0), pMax) / pMax) * halfH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // x-axis label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('x', padL + plotW / 2, top2 + halfH + 14)

      // status
      const troubledNow = s.beta.reduce((a, b) => a + b, 0)
      ctx.fillStyle = 'rgba(226, 232, 240, 0.92)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const status = sNoLim.crashed && showLimiterOff
        ? 'unlimited candidate has crashed'
        : `t = ${s.t.toFixed(4)}   troubled now = ${troubledNow}/${N}`
      ctx.fillText(status, padL, 2)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      mounted = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [running, delta0Log, showLimiterOff, pRatio])

  const reset = () => {
    stateRef.current = makeInitial(pRatio)
    stateLOffRef.current = makeInitial(pRatio)
    tendDisplayRef.current = { tEnd: 0, troubledTotal: 0 }
    setRunning(true)
  }

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        1D Riemann problem · candidate (MUSCL) → MOOD detection → fallback (LF) in troubled cells
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 360, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            pressure ratio p_L / p_R = {pRatio.toFixed(0)} : 0.01
          </span>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={pRatio}
            onChange={(e) => setPRatio(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            relaxation delta_0 = 1e{delta0Log}
          </span>
          <input
            type="range"
            min={-6}
            max={-1}
            step={1}
            value={delta0Log}
            onChange={(e) => setDelta0Log(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--bg)]"
        >
          {running ? 'pause' : 'resume'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--bg)]"
        >
          reset
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLimiterOff}
            onChange={(e) => setShowLimiterOff(e.target.checked)}
          />
          <span>overlay unlimited candidate (red dashed)</span>
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Cyan = density, yellow = pressure under MOOD. Red bands mark cells that failed PAD or NAD this step
        and were recomputed with the Lax–Friedrichs fallback. Toggle the overlay to see the unlimited MUSCL
        candidate crash near the shock once the pressure ratio gets large.
      </p>
    </div>
  )
}
