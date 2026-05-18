'use client'

import { useEffect, useRef, useState } from 'react'

const G = 1.0

export function BrinkmanChannelProfile() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logDa, setLogDa] = useState(-2)

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

    const padL = 64
    const padR = 24
    const padT = 18
    const padB = 38
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const Da = Math.pow(10, logDa)
    const sqrtDa = Math.sqrt(Da)
    const N = 200

    const ys: number[] = []
    const us: number[] = []
    for (let i = 0; i <= N; i++) {
      const y = i / N
      const arg1 = (y - 0.5) / sqrtDa
      const arg2 = 0.5 / sqrtDa
      let frac: number
      if (arg2 > 25) {
        frac = Math.exp(arg1 - arg2) + Math.exp(-arg1 - arg2)
      } else {
        frac = Math.cosh(arg1) / Math.cosh(arg2)
      }
      const u = G * Da * (1 - frac)
      ys.push(y)
      us.push(u)
    }

    const uPoiseuille = G / 8
    const uMid = us[Math.floor(N / 2)]
    const uMax = Math.max(uMid, uPoiseuille * 1.05, 0.005)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
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

    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 5; i++) {
      const y = padT + plotH - (i / 5) * plotH
      const v = (i / 5)
      ctx.fillText(v.toFixed(1), padL - 6, y)
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW
      const v = (i / 5) * uMax
      ctx.fillText(v.toExponential(1), x, padT + plotH + 6)
    }

    ctx.fillStyle = 'rgba(203, 213, 225, 0.9)'
    ctx.textAlign = 'center'
    ctx.fillText('U  (non-dim velocity)', padL + plotW / 2, padT + plotH + 22)
    ctx.save()
    ctx.translate(16, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Y  (across channel)', 0, 0)
    ctx.restore()

    const toX = (u: number) => padL + (u / uMax) * plotW
    const toY = (y: number) => padT + plotH - y * plotH

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const y = i / N
      const u = (G / 2) * y * (1 - y)
      const x = toX(u)
      const yp = toY(y)
      if (i === 0) ctx.moveTo(x, yp)
      else ctx.lineTo(x, yp)
    }
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const x = toX(us[i])
      const y = toY(ys[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    if (sqrtDa < 0.5) {
      const yEdge = sqrtDa
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(padL, toY(yEdge))
      ctx.lineTo(padL + plotW, toY(yEdge))
      ctx.moveTo(padL, toY(1 - yEdge))
      ctx.lineTo(padL + plotW, toY(1 - yEdge))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f87171'
      ctx.textAlign = 'left'
      ctx.fillText(`Brinkman δ ≈ √Da = ${sqrtDa.toFixed(3)}`, padL + 8, toY(yEdge) - 6)
    }

    ctx.fillStyle = '#22d3ee'
    ctx.textAlign = 'right'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('Brinkman profile', padL + plotW - 8, padT + 16)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.fillText('Poiseuille (Da → ∞)', padL + plotW - 8, padT + 32)
  }, [logDa])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        1D channel · Brinkman steady profile U(Y) for U″ − U/Da + 1 = 0, U(0)=U(1)=0
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 320, display: 'block' }} />
      <div className="mt-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            log₁₀(Da) = {logDa.toFixed(2)} &nbsp; (Da = K/L² = {Math.pow(10, logDa).toExponential(2)})
          </span>
          <input
            type="range"
            min={-4}
            max={2}
            step={0.05}
            value={logDa}
            onChange={(e) => setLogDa(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Drop Da below ~10⁻³: the profile flattens into a Darcy plug. Increase Da past 1: it relaxes back to Poiseuille (dashed gray). The red dashed lines mark the Brinkman boundary-layer thickness δ ≈ √Da.
      </p>
    </div>
  )
}
