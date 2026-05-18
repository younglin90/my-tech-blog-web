'use client'

import { useEffect, useRef, useState } from 'react'

const MU = 1e-3
const RHO = 1000.0
const U_MAX = 0.6

export function DarcyForchheimerPumpCurve() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logK, setLogK] = useState(-8)
  const [beta, setBeta] = useState(1500)

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
    const padR = 18
    const padT = 18
    const padB = 38
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const K = Math.pow(10, logK)
    const N = 120
    const us = Array.from({ length: N + 1 }, (_, i) => (i / N) * U_MAX)
    const darcyOnly = us.map((u) => (MU / K) * u)
    const fullCurve = us.map((u) => (MU / K) * u + beta * RHO * u * u)

    const dpMax = Math.max(...fullCurve, 1)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * plotH
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
    }
    for (let i = 0; i <= 6; i++) {
      const x = padL + (i / 6) * plotW
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
    }
    ctx.stroke()

    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 5; i++) {
      const y = padT + plotH - (i / 5) * plotH
      const v = (i / 5) * dpMax
      ctx.fillText(formatSci(v), padL - 6, y)
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 6; i++) {
      const x = padL + (i / 6) * plotW
      const u = (i / 6) * U_MAX
      ctx.fillText(u.toFixed(2), x, padT + plotH + 6)
    }

    ctx.fillStyle = 'rgba(203, 213, 225, 0.9)'
    ctx.textAlign = 'center'
    ctx.fillText('u  [m/s]', padL + plotW / 2, padT + plotH + 22)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('ΔP/L  [Pa/m]', 0, 0)
    ctx.restore()

    const toX = (u: number) => padL + (u / U_MAX) * plotW
    const toY = (dp: number) => padT + plotH - (dp / dpMax) * plotH

    ctx.strokeStyle = '#94a3b8'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    us.forEach((u, i) => {
      const x = toX(u)
      const y = toY(darcyOnly[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    us.forEach((u, i) => {
      const x = toX(u)
      const y = toY(fullCurve[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    const uCrit = beta > 0 ? MU / (K * beta * RHO) : Infinity
    if (uCrit > 0 && uCrit < U_MAX) {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(toX(uCrit), padT)
      ctx.lineTo(toX(uCrit), padT + plotH)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f87171'
      ctx.textAlign = 'left'
      ctx.fillText(`u* = ${uCrit.toFixed(3)} m/s`, toX(uCrit) + 4, padT + 6)
    }

    ctx.fillStyle = '#22d3ee'
    ctx.textAlign = 'left'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('Darcy + Forchheimer', padL + 10, padT + 22)
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('Darcy only', padL + 10, padT + 38)
  }, [logK, beta])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        Pump curve · ΔP/L vs Darcy velocity u
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 320, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            log₁₀(K) = {logK.toFixed(1)} &nbsp; (K = {Math.pow(10, logK).toExponential(1)} m²)
          </span>
          <input
            type="range"
            min={-12}
            max={-6}
            step={0.1}
            value={logK}
            onChange={(e) => setLogK(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            β = {beta.toFixed(0)} 1/m &nbsp; (Forchheimer coefficient)
          </span>
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Solid cyan: ΔP/L = (μ/K) u + βρ u². Dashed gray: Darcy-only (μ/K) u. Red dashed line: u* where the two terms balance.
      </p>
    </div>
  )
}

function formatSci(v: number): string {
  if (v === 0) return '0'
  const exp = Math.floor(Math.log10(Math.abs(v)))
  const mant = v / Math.pow(10, exp)
  return `${mant.toFixed(1)}e${exp}`
}
