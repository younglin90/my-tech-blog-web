'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const N = 200
const X_MIN = 0
const X_MAX = 1
const DX = (X_MAX - X_MIN) / N
const GAMMA = 1.4
const T_FINAL = 0.02
const N_STEPS = 220
const RHO_FLOOR = 1e-3

type Snapshot = {
  rho: Float64Array
  p: Float64Array
  u: Float64Array
  minRho: number
  blown: boolean
}

type Series = {
  snaps: Snapshot[]
  blowupStep: number
}

function primFromCons(rho: number, rhou: number, E: number) {
  const u = rhou / rho
  const k = 0.5 * rho * u * u
  const p = (GAMMA - 1) * (E - k)
  return { u, p }
}

function fluxFromCons(rho: number, rhou: number, E: number): [number, number, number] {
  const u = rhou / rho
  const k = 0.5 * rho * u * u
  const p = (GAMMA - 1) * (E - k)
  return [rhou, rhou * u + p, u * (E + p)]
}

function snapshot(rho: Float64Array, rhou: Float64Array, E: Float64Array): Snapshot {
  const pArr = new Float64Array(N)
  const uArr = new Float64Array(N)
  let minR = Infinity
  let blown = false
  for (let i = 0; i < N; i++) {
    const r = rho[i]
    if (!Number.isFinite(r)) blown = true
    if (r < minR) minR = r
    if (r <= 0) { uArr[i] = 0; pArr[i] = 0; continue }
    const { u, p } = primFromCons(r, rhou[i], E[i])
    uArr[i] = u
    pArr[i] = p
  }
  return { rho: new Float64Array(rho), p: pArr, u: uArr, minRho: minR, blown }
}

function simulate(limit: boolean): Series {
  const rho = new Float64Array(N)
  const rhou = new Float64Array(N)
  const E = new Float64Array(N)

  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    if (x < 0.45) {
      rho[i] = 1.0
      rhou[i] = 0.0
      E[i] = 100.0 / (GAMMA - 1)
    } else {
      rho[i] = 0.02
      rhou[i] = 0.0
      E[i] = 0.05 / (GAMMA - 1)
    }
  }

  const snaps: Snapshot[] = [snapshot(rho, rhou, E)]
  const dt = T_FINAL / N_STEPS
  let blowupStep = -1

  const rhoN = new Float64Array(N)
  const rhouN = new Float64Array(N)
  const EN = new Float64Array(N)
  const fluxR = new Float64Array(N + 1)
  const fluxM = new Float64Array(N + 1)
  const fluxE = new Float64Array(N + 1)

  for (let step = 0; step < N_STEPS; step++) {
    for (let f = 0; f <= N; f++) {
      const iL = f === 0 ? 0 : f - 1
      const iR = f === N ? N - 1 : f
      const rL = Math.max(rho[iL], 1e-12)
      const rR = Math.max(rho[iR], 1e-12)
      const { u: uL, p: pL } = primFromCons(rL, rhou[iL], E[iL])
      const { u: uR, p: pR } = primFromCons(rR, rhou[iR], E[iR])
      const aL = Math.sqrt(Math.max(GAMMA * pL / rL, 0))
      const aR = Math.sqrt(Math.max(GAMMA * pR / rR, 0))
      const alpha = Math.max(Math.abs(uL) + aL, Math.abs(uR) + aR)

      const FL = fluxFromCons(rL, rhou[iL], E[iL])
      const FR = fluxFromCons(rR, rhou[iR], E[iR])

      const fluxLF_r = 0.5 * (FL[0] + FR[0]) - 0.5 * alpha * (rR - rL)
      const fluxLF_m = 0.5 * (FL[1] + FR[1]) - 0.5 * alpha * (rhou[iR] - rhou[iL])
      const fluxLF_e = 0.5 * (FL[2] + FR[2]) - 0.5 * alpha * (E[iR] - E[iL])

      const fluxC_r = 0.5 * (FL[0] + FR[0])
      const fluxC_m = 0.5 * (FL[1] + FR[1])
      const fluxC_e = 0.5 * (FL[2] + FR[2])

      let theta = 1.0
      if (limit) {
        const rho_lf_next_iL = rho[iL] - (dt / DX) * (fluxLF_r - (f === 0 ? fluxLF_r : 0))
        const rho_lf_next_iR = rho[iR] - (dt / DX) * (0 - fluxLF_r)
        const flux_anti_r = fluxC_r - fluxLF_r
        const target = RHO_FLOOR
        if (flux_anti_r > 1e-14) {
          const margin = (rho_lf_next_iL - target)
          if (margin > 0) {
            const cap = margin / ((dt / DX) * flux_anti_r)
            theta = Math.min(theta, Math.max(0, cap))
          } else {
            theta = 0
          }
        } else if (flux_anti_r < -1e-14) {
          const margin = (rho_lf_next_iR - target)
          if (margin > 0) {
            const cap = margin / ((dt / DX) * (-flux_anti_r))
            theta = Math.min(theta, Math.max(0, cap))
          } else {
            theta = 0
          }
        }
        if (f === 0 || f === N) theta = 0
      }

      fluxR[f] = fluxLF_r + theta * (fluxC_r - fluxLF_r)
      fluxM[f] = fluxLF_m + theta * (fluxC_m - fluxLF_m)
      fluxE[f] = fluxLF_e + theta * (fluxC_e - fluxLF_e)
    }

    for (let i = 0; i < N; i++) {
      rhoN[i] = rho[i] - (dt / DX) * (fluxR[i + 1] - fluxR[i])
      rhouN[i] = rhou[i] - (dt / DX) * (fluxM[i + 1] - fluxM[i])
      EN[i] = E[i] - (dt / DX) * (fluxE[i + 1] - fluxE[i])
    }

    let anyBlown = false
    for (let i = 0; i < N; i++) {
      if (!Number.isFinite(rhoN[i]) || !Number.isFinite(EN[i])) { anyBlown = true; break }
    }
    if (anyBlown) {
      if (blowupStep < 0) blowupStep = step
      snaps.push(snapshot(rho, rhou, E))
      for (let s = step + 1; s < N_STEPS; s++) snaps.push(snapshot(rho, rhou, E))
      break
    }

    rho.set(rhoN)
    rhou.set(rhouN)
    E.set(EN)

    if (!limit) {
      let neg = false
      for (let i = 0; i < N; i++) {
        if (rho[i] <= 0) { neg = true; break }
      }
      if (neg && blowupStep < 0) blowupStep = step
    }

    if ((step + 1) % 1 === 0) snaps.push(snapshot(rho, rhou, E))
  }

  while (snaps.length < N_STEPS + 1) snaps.push(snaps[snaps.length - 1])
  return { snaps, blowupStep }
}

export function BlastDensityFloor1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tIdx, setTIdx] = useState(80)
  const [playing, setPlaying] = useState(false)
  const [showLimiter, setShowLimiter] = useState(true)

  const seriesLF = useMemo(() => simulate(true), [])
  const seriesHO = useMemo(() => simulate(false), [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    const start = performance.now()
    const baseIdx = tIdx
    const tick = () => {
      const dtMs = performance.now() - start
      const next = Math.min(N_STEPS, Math.floor(baseIdx + dtMs / 25))
      setTIdx(next)
      if (next >= N_STEPS) { setPlaying(false); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const padL = 56
    const padR = 16
    const padT = 22
    const padB = 36
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const idx = Math.min(tIdx, N_STEPS)
    const snapL = seriesLF.snaps[idx]
    const snapH = seriesHO.snaps[idx]

    const rhoMax = 1.2

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
    }
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
    }
    ctx.stroke()

    ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)'
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    const yZero = padT + plotH - (0 / rhoMax) * plotH
    ctx.moveTo(padL, yZero)
    ctx.lineTo(padL + plotW, yZero)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 4; i++) {
      const v = (i / 4) * rhoMax
      const y = padT + plotH - (v / rhoMax) * plotH
      ctx.fillText(v.toFixed(2), padL - 6, y)
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW
      ctx.fillText((i / 5).toFixed(1), x, padT + plotH + 4)
    }
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)'
    ctx.fillText('x', padL + plotW / 2, padT + plotH + 18)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('density  ρ', 0, 0)
    ctx.restore()

    const toX = (i: number) => padL + (i / (N - 1)) * plotW
    const toY = (rho: number) => padT + plotH - Math.max(-0.1, Math.min(rhoMax, rho)) / rhoMax * plotH

    if (showLimiter) {
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = toX(i)
        const y = toY(snapL.rho[i])
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    let started = false
    for (let i = 0; i < N; i++) {
      const r = snapH.rho[i]
      if (!Number.isFinite(r)) continue
      const x = toX(i)
      const y = toY(r)
      if (!started) { ctx.moveTo(x, y); started = true } else ctx.lineTo(x, y)
    }
    ctx.stroke()

    if (!Number.isFinite(snapH.minRho) || snapH.minRho < 0 || snapH.blown) {
      ctx.fillStyle = 'rgba(248, 113, 113, 0.18)'
      ctx.fillRect(padL, padT, plotW, plotH)
      ctx.fillStyle = '#f87171'
      ctx.textAlign = 'center'
      ctx.font = 'bold 13px ui-monospace, monospace'
      ctx.fillText('SOLVER BLEW UP — ρ ≤ 0 detected', padL + plotW / 2, padT + 18)
    }

    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#f87171'
    ctx.fillText('— no limiter (raw central)', padL + 10, padT + plotH - 28)
    if (showLimiter) {
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('— positivity limited (θ ≤ θmax)', padL + 10, padT + plotH - 14)
    }

    ctx.fillStyle = 'rgba(203, 213, 225, 0.9)'
    ctx.textAlign = 'right'
    const tNow = (idx / N_STEPS) * T_FINAL
    ctx.fillText(`t = ${tNow.toFixed(4)} | min ρ (raw) = ${Number.isFinite(snapH.minRho) ? snapH.minRho.toFixed(4) : 'NaN'}`, padL + plotW - 6, padT + 12)
  }, [tIdx, seriesLF, seriesHO, showLimiter])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        1D strong shock tube · ρ_L=1, p_L=100 / ρ_R=0.02, p_R=0.05 · central + θ·anti-diffusion · 200 cells
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 300, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            t-index = {tIdx} / {N_STEPS}
          </span>
          <input
            type="range"
            min={0}
            max={N_STEPS}
            step={1}
            value={tIdx}
            onChange={(e) => { setPlaying(false); setTIdx(parseInt(e.target.value)) }}
          />
        </label>
        <button
          type="button"
          onClick={() => { if (tIdx >= N_STEPS) setTIdx(0); setPlaying((p) => !p) }}
          className="rounded border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg)]"
        >
          {playing ? 'pause' : 'play'}
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLimiter}
            onChange={(e) => setShowLimiter(e.target.checked)}
          />
          <span>show limited</span>
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Red is the raw centered scheme — its rarefaction tail dives below zero around t ≈ 0.006 and the solver blows up.
        Cyan is the same scheme blended with Lax–Friedrichs by a per-face θ ≤ θ_max so that ρ stays above the floor 10⁻³.
        Drag the time slider to watch the two solutions separate.
      </p>
    </div>
  )
}
