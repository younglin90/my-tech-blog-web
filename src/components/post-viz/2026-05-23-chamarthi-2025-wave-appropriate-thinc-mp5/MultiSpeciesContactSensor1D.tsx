'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const N = 120
const GAMMA1 = 1.4
const GAMMA2 = 1.667
const PSI_C = 0.35
const XI = 1e-2
const EPS_BASE = (0.9 * PSI_C) / (1 - 0.9 * PSI_C) * XI

type Profile = {
  x: number[]
  rho: number[]
  p: number[]
  s: number[]
  psi: number[]
}

function buildProfile(rhoL: number, rhoR: number, pL: number, pR: number, xInterface: number): Profile {
  const x = new Array<number>(N)
  const rho = new Array<number>(N)
  const p = new Array<number>(N)
  const s = new Array<number>(N)
  const psi = new Array<number>(N)

  for (let i = 0; i < N; i++) {
    x[i] = (i + 0.5) / N
  }
  for (let i = 0; i < N; i++) {
    if (x[i] < xInterface) {
      rho[i] = rhoL
      p[i] = pL
    } else {
      rho[i] = rhoR
      p[i] = pR
    }
  }
  for (let i = 0; i < N; i++) {
    const gamma = x[i] < xInterface ? GAMMA1 : GAMMA2
    s[i] = p[i] / Math.pow(Math.max(rho[i], 1e-10), gamma)
  }
  for (let i = 0; i < N; i++) {
    if (i < 2 || i > N - 3) {
      psi[i] = 1.0
      continue
    }
    const sm2 = s[i - 2], sm1 = s[i - 1], si = s[i], sp1 = s[i + 1], sp2 = s[i + 2]
    const a = (13 / 12) * Math.abs(sm2 - 2 * sm1 + si) + 0.25 * Math.abs(sm2 - 4 * sm1 + 3 * si)
    const b = (13 / 12) * Math.abs(si - 2 * sp1 + sp2) + 0.25 * Math.abs(3 * si - 4 * sp1 + sp2)
    const num = 2 * a * b + EPS_BASE
    const den = a * a + b * b + EPS_BASE
    psi[i] = num / den
  }
  return { x, rho, p, s, psi }
}

export function MultiSpeciesContactSensor1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rhoL, setRhoL] = useState(10.0)
  const [rhoR, setRhoR] = useState(0.125)
  const [pL, setPL] = useState(1.0)
  const [pR, setPR] = useState(1.0)
  const [xInterface, setXInterface] = useState(0.5)

  const profile = useMemo(
    () => buildProfile(rhoL, rhoR, pL, pR, xInterface),
    [rhoL, rhoR, pL, pR, xInterface]
  )

  const triggerCount = useMemo(() => profile.psi.filter((v) => v < PSI_C).length, [profile.psi])

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

    const padL = 52
    const padR = 18
    const padT = 18
    const padB = 32
    const gap = 24
    const halfH = (H - padT - padB - gap) / 2
    const plotW = W - padL - padR

    const rhoMax = Math.max(...profile.rho) * 1.05
    const psiMin = Math.min(...profile.psi, 0)
    const psiMax = 1.05

    const toX = (xv: number) => padL + xv * plotW

    const drawAxes = (top: number, yMin: number, yMax: number, label: string, yTicks: number[]) => {
      const range = yMax - yMin
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= 5; i++) {
        const x = padL + (i / 5) * plotW
        ctx.moveTo(x, top)
        ctx.lineTo(x, top + halfH)
      }
      for (const v of yTicks) {
        const y = top + halfH - ((v - yMin) / range) * halfH
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + plotW, y)
      }
      ctx.stroke()

      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (const v of yTicks) {
        const y = top + halfH - ((v - yMin) / range) * halfH
        ctx.fillText(v.toFixed(2), padL - 6, y)
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

    // shade where sensor triggers in both panels
    const top1 = padT
    const top2 = padT + halfH + gap
    ctx.fillStyle = 'rgba(239, 68, 68, 0.10)'
    for (let i = 0; i < N; i++) {
      if (profile.psi[i] < PSI_C) {
        const x0 = toX(i / N)
        const x1 = toX((i + 1) / N)
        ctx.fillRect(x0, top1, x1 - x0, halfH)
        ctx.fillRect(x0, top2, x1 - x0, halfH)
      }
    }

    // panel 1: rho
    drawAxes(top1, 0, rhoMax, 'ρ (mixture density)', [0, rhoMax * 0.5, rhoMax])
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const x = toX(profile.x[i])
      const y = top1 + halfH - (profile.rho[i] / rhoMax) * halfH
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // panel 2: psi sensor
    drawAxes(top2, psiMin, psiMax, 'ψᵢ contact sensor', [0, 0.35, 0.7, 1.0])

    // threshold line
    const yThr = top2 + halfH - ((PSI_C - psiMin) / (psiMax - psiMin)) * halfH
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)'
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(padL, yThr)
    ctx.lineTo(padL + plotW, yThr)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(248, 113, 113, 0.95)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`ψ_c = ${PSI_C}`, padL + 6, yThr - 4)

    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const x = toX(profile.x[i])
      const y = top2 + halfH - ((profile.psi[i] - psiMin) / (psiMax - psiMin)) * halfH
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // x-axis label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('x', padL + plotW / 2, top2 + halfH + 16)
  }, [profile])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        Two-gas shock tube · contact-discontinuity sensor ψᵢ on s = p/ρ<sup>γ</sup>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 360, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            ρ<sub>L</sub> (gas 1, γ=1.4) = {rhoL.toFixed(2)}
          </span>
          <input
            type="range"
            min={1}
            max={50}
            step={0.5}
            value={rhoL}
            onChange={(e) => setRhoL(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            ρ<sub>R</sub> (gas 2, γ=1.667) = {rhoR.toFixed(3)}
          </span>
          <input
            type="range"
            min={0.05}
            max={5}
            step={0.05}
            value={rhoR}
            onChange={(e) => setRhoR(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">p<sub>L</sub> = {pL.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={pL}
            onChange={(e) => setPL(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">p<sub>R</sub> = {pR.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={pR}
            onChange={(e) => setPR(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-[var(--text-muted)]">interface position x = {xInterface.toFixed(2)}</span>
          <input
            type="range"
            min={0.2}
            max={0.8}
            step={0.01}
            value={xInterface}
            onChange={(e) => setXInterface(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        The cyan curve is ρ(x) at t = 0; the yellow curve is ψᵢ on s = p/ρ<sup>γ</sup>. Red shading marks cells where ψᵢ falls
        below 0.35 — those are the ones that switch from MP5 to THINC reconstruction.
        Currently {triggerCount} of {N} cells trigger THINC. Match p<sub>L</sub> to p<sub>R</sub> and the sensor still fires
        at the interface, because the jump in s comes from the change of γ even when pressure is balanced.
      </p>
    </div>
  )
}
