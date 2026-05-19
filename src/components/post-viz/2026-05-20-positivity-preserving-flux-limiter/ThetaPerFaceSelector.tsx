'use client'

import { useEffect, useRef, useState } from 'react'

const GAMMA = 1.4
const DX = 0.01
const DT = 0.0015
const RHO_FLOOR = 1e-3

function fluxLF(rL: number, uL: number, rR: number, uR: number, alpha: number) {
  return 0.5 * (rL * uL + rR * uR) - 0.5 * alpha * (rR - rL)
}

function fluxCentral(rL: number, uL: number, rR: number, uR: number) {
  return 0.5 * (rL * uL + rR * uR)
}

function computeRhoNext(theta_left: number, theta_right: number, rho_i: number, params: {
  rL: number, uL: number, pL: number,
  rR: number, uR: number, pR: number,
  rRR: number, uRR: number, pRR: number,
}) {
  const aL = Math.sqrt(GAMMA * params.pL / params.rL)
  const aR = Math.sqrt(GAMMA * params.pR / params.rR)
  const aRR = Math.sqrt(GAMMA * params.pRR / params.rRR)

  const alphaL = Math.max(Math.abs(params.uL) + aL, Math.abs(params.uR) + aR)
  const alphaR = Math.max(Math.abs(params.uR) + aR, Math.abs(params.uRR) + aRR)

  const FLF_L = fluxLF(params.rL, params.uL, params.rR, params.uR, alphaL)
  const FLF_R = fluxLF(params.rR, params.uR, params.rRR, params.uRR, alphaR)
  const FC_L = fluxCentral(params.rL, params.uL, params.rR, params.uR)
  const FC_R = fluxCentral(params.rR, params.uR, params.rRR, params.uRR)

  const F_left = FLF_L + theta_left * (FC_L - FLF_L)
  const F_right = FLF_R + theta_right * (FC_R - FLF_R)

  return rho_i - (DT / DX) * (F_right - F_left)
}

export function ThetaPerFaceSelector() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logRhoR, setLogRhoR] = useState(-2)
  const [uShock, setUShock] = useState(4.0)

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
    const padB = 38
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const rR = Math.pow(10, logRhoR)
    const params = {
      rL: 1.0, uL: 0.0, pL: 1.0,
      rR: rR, uR: uShock, pR: 0.1,
      rRR: rR, uRR: uShock, pRR: 0.1,
    }

    const samples = 121
    const rhoNexts: number[] = []
    let thetaMax = 1.0
    for (let s = 0; s < samples; s++) {
      const theta = s / (samples - 1)
      const rn = computeRhoNext(0, theta, rR, params)
      rhoNexts.push(rn)
      if (rn < RHO_FLOOR && thetaMax === 1.0) {
        const tPrev = (s - 1) / (samples - 1)
        const rPrev = rhoNexts[s - 1]
        const t = tPrev + ((RHO_FLOOR - rPrev) / (rn - rPrev)) * (theta - tPrev)
        thetaMax = Math.max(0, Math.min(1, t))
      }
    }

    const rNextMin = Math.min(...rhoNexts, 0)
    const rNextMax = Math.max(...rhoNexts, rR * 1.05)
    const yMin = Math.min(rNextMin, -rR * 0.2)
    const yMax = Math.max(rNextMax, rR * 1.1)
    const range = yMax - yMin

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

    const toX = (theta: number) => padL + theta * plotW
    const toY = (v: number) => padT + plotH - ((v - yMin) / range) * plotH

    ctx.fillStyle = 'rgba(248, 113, 113, 0.15)'
    const yFloor = toY(RHO_FLOOR)
    const yBottom = padT + plotH
    ctx.fillRect(padL, yFloor, plotW, yBottom - yFloor)

    ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)'
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(padL, yFloor)
    ctx.lineTo(padL + plotW, yFloor)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    const yZero = toY(0)
    ctx.moveTo(padL, yZero)
    ctx.lineTo(padL + plotW, yZero)
    ctx.stroke()

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let s = 0; s < samples; s++) {
      const theta = s / (samples - 1)
      const x = toX(theta)
      const y = toY(rhoNexts[s])
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()

    if (thetaMax < 1.0 && thetaMax > 0) {
      const xMax = toX(thetaMax)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(xMax, padT)
      ctx.lineTo(xMax, padT + plotH)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.arc(xMax, toY(RHO_FLOOR), 4, 0, 2 * Math.PI)
      ctx.fill()

      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#facc15'
      ctx.fillText(`θmax ≈ ${thetaMax.toFixed(3)}`, xMax + 6, padT + 14)
    } else if (thetaMax >= 1.0) {
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('θmax = 1.0 — fully central is safe here', padL + plotW - 6, padT + 14)
    }

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (i / 4) * range
      const y = toY(v)
      ctx.fillText(v.toExponential(1), padL - 6, y)
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW
      ctx.fillText((i / 5).toFixed(1), x, padT + plotH + 4)
    }
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)'
    ctx.fillText('θ (anti-diffusion weight on right face)', padL + plotW / 2, padT + plotH + 20)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('ρ at the rarefaction-side cell after one step', 0, 0)
    ctx.restore()
  }, [logRhoR, uShock])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        Per-face θ search · single rarefaction face · curve ρ<sub>i</sub><sup>n+1</sup>(θ) at fixed left face
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 280, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            log₁₀(ρ<sub>R</sub>) = {logRhoR.toFixed(2)} &nbsp;(ρ<sub>R</sub> = {Math.pow(10, logRhoR).toExponential(2)})
          </span>
          <input
            type="range"
            min={-4}
            max={-0.5}
            step={0.05}
            value={logRhoR}
            onChange={(e) => setLogRhoR(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            outflow velocity u<sub>R</sub> = {uShock.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={uShock}
            onChange={(e) => setUShock(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        The cyan curve is ρ<sup>n+1</sup> after one Euler step as a function of how much central-flux we mix into the right face.
        The red zone is where ρ has crossed the floor 10⁻³. The yellow dot is the largest θ that still lands above the floor — that is the θ the per-face limiter picks.
        Drop ρ<sub>R</sub> below 10⁻³ or push u<sub>R</sub> past 6 and θ collapses toward zero: the limiter falls back to first-order Lax–Friedrichs.
      </p>
    </div>
  )
}
