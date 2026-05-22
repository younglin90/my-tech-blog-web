'use client'

import { useEffect, useRef, useState } from 'react'

const N = 120
const DX = 1 / N
const U = 1.0
const CFL = 0.4
const DT = (CFL * DX) / U
const STEPS_PER_FRAME = 1
const STEPS_PER_CYCLE = Math.floor(1.0 / (U * DT)) // pulse travels one domain

function initialPulse(): Float64Array {
  const q = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    q[i] = x >= 0.3 && x <= 0.55 ? 1.0 : 0.0
  }
  return q
}

function minmod(a: number, b: number): number {
  if (a * b <= 0) return 0
  return Math.sign(a) * Math.min(Math.abs(a), Math.abs(b))
}

function reconstructMuscl(q: Float64Array, i: number): number {
  const im1 = (i - 1 + N) % N
  const ip1 = (i + 1) % N
  const slope = minmod(q[ip1] - q[i], q[i] - q[im1])
  return q[i] + 0.5 * slope
}

function reconstructThinc(q: Float64Array, i: number, beta: number): number {
  const im1 = (i - 1 + N) % N
  const ip1 = (i + 1) % N
  const qm = q[im1], qi = q[i], qp = q[ip1]
  // monotonic check
  if ((qp - qi) * (qi - qm) <= 0) return qi
  const u_a = 0.5 * (qp + qm)
  const u_d = 0.5 * (qp - qm)
  if (Math.abs(u_d) < 1e-12) return qi
  const alpha = (qi - u_a) / u_d
  if (Math.abs(alpha) > 1) return qi
  const K1 = Math.tanh(beta / 2)
  const K2 = Math.tanh((alpha * beta) / 2)
  return u_a + (u_d * (K1 + K2 / K1)) / (1 + K2)
}

function stepMuscl(q: Float64Array): Float64Array {
  const qNew = new Float64Array(N)
  const flux = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    flux[i] = U * reconstructMuscl(q, i) // flux at i+1/2
  }
  for (let i = 0; i < N; i++) {
    const im1 = (i - 1 + N) % N
    qNew[i] = q[i] - (DT / DX) * (flux[i] - flux[im1])
  }
  return qNew
}

function stepThinc(q: Float64Array, beta: number): Float64Array {
  const qNew = new Float64Array(N)
  const flux = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    flux[i] = U * reconstructThinc(q, i, beta)
  }
  for (let i = 0; i < N; i++) {
    const im1 = (i - 1 + N) % N
    qNew[i] = q[i] - (DT / DX) * (flux[i] - flux[im1])
  }
  return qNew
}

function l1ErrorVsExact(q: Float64Array, shift: number): number {
  let err = 0
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    const xExact = ((x - shift) % 1 + 1) % 1
    const qExact = xExact >= 0.3 && xExact <= 0.55 ? 1.0 : 0.0
    err += Math.abs(q[i] - qExact)
  }
  return err / N
}

export function ThincSharpInterface1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [beta, setBeta] = useState(1.8)
  const [running, setRunning] = useState(true)
  const stateRef = useRef({
    qMuscl: initialPulse(),
    qThinc: initialPulse(),
    step: 0,
    beta: 1.8,
  })

  useEffect(() => {
    stateRef.current.beta = beta
  }, [beta])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let cancelled = false

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr
        canvas.height = H * dpr
        ctx.scale(dpr, dpr)
      }
      ctx.clearRect(0, 0, W, H)

      const padL = 52
      const padR = 18
      const padT = 18
      const padB = 36
      const plotW = W - padL - padR
      const plotH = H - padT - padB

      const yMin = -0.2
      const yMax = 1.3
      const yRange = yMax - yMin
      const toX = (xv: number) => padL + xv * plotW
      const toY = (v: number) => padT + plotH - ((v - yMin) / yRange) * plotH

      // grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= 5; i++) {
        const x = padL + (i / 5) * plotW
        ctx.moveTo(x, padT)
        ctx.lineTo(x, padT + plotH)
      }
      for (const v of [0, 0.5, 1.0]) {
        const y = toY(v)
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + plotW, y)
      }
      ctx.stroke()

      // exact (dashed gray)
      const shift = (stateRef.current.step * DT * U) % 1
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * DX
        const xExact = ((x - shift) % 1 + 1) % 1
        const qExact = xExact >= 0.3 && xExact <= 0.55 ? 1.0 : 0.0
        const X = toX(x)
        const Y = toY(qExact)
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // MUSCL+minmod (green)
      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * DX
        const X = toX(x)
        const Y = toY(stateRef.current.qMuscl[i])
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // THINC (cyan)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * DX
        const X = toX(x)
        const Y = toY(stateRef.current.qThinc[i])
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // axes labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (const v of [0, 0.5, 1.0]) {
        ctx.fillText(v.toFixed(1), padL - 6, toY(v))
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (let i = 0; i <= 5; i++) {
        ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 4)
      }
      ctx.fillStyle = 'rgba(203, 213, 225, 0.85)'
      ctx.fillText('x (periodic)', padL + plotW / 2, padT + plotH + 20)

      // legend
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const legendX = padL + 14
      const legendY = padT + 14
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
      ctx.fillRect(legendX, legendY - 1, 18, 2)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
      ctx.fillText('exact', legendX + 24, legendY)
      ctx.fillStyle = '#34d399'
      ctx.fillRect(legendX + 80, legendY - 1, 18, 2)
      ctx.fillStyle = '#34d399'
      ctx.fillText('MUSCL minmod', legendX + 104, legendY)
      ctx.fillStyle = '#22d3ee'
      ctx.fillRect(legendX + 230, legendY - 1, 18, 2)
      ctx.fillStyle = '#22d3ee'
      ctx.fillText('THINC β', legendX + 254, legendY)

      // step counter + L1 errors
      const muscErr = l1ErrorVsExact(stateRef.current.qMuscl, shift)
      const thincErr = l1ErrorVsExact(stateRef.current.qThinc, shift)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        `step ${stateRef.current.step}  L1_MUSCL ${muscErr.toFixed(4)}  L1_THINC ${thincErr.toFixed(4)}`,
        padL + plotW - 4,
        legendY
      )
    }

    const tick = () => {
      if (cancelled) return
      if (running) {
        for (let k = 0; k < STEPS_PER_FRAME; k++) {
          if (stateRef.current.step >= STEPS_PER_CYCLE * 2) {
            stateRef.current.qMuscl = initialPulse()
            stateRef.current.qThinc = initialPulse()
            stateRef.current.step = 0
          }
          stateRef.current.qMuscl = stepMuscl(stateRef.current.qMuscl)
          stateRef.current.qThinc = stepThinc(stateRef.current.qThinc, stateRef.current.beta)
          stateRef.current.step++
        }
      }
      draw()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [running])

  const handleReset = () => {
    stateRef.current.qMuscl = initialPulse()
    stateRef.current.qThinc = initialPulse()
    stateRef.current.step = 0
  }

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        Periodic advection · square pulse · 120 cells · CFL = 0.4 · forward Euler
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 280, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">
            THINC steepness β = {beta.toFixed(2)}
          </span>
          <input
            type="range"
            min={1.0}
            max={2.5}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg)]"
          >
            {running ? '⏸ pause' : '▶ play'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg)]"
          >
            ⟲ reset
          </button>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Same advection step, two reconstructions. The green MUSCL+minmod profile smears the contact within ~6 cells after each
        cycle. The cyan THINC profile stays within 2–3 cells because the sigmoid keeps the jump steep across the cell.
        Lowering β below 1.5 makes THINC almost as diffusive as MUSCL; pushing β past 2.2 invites overshoots at the leading edge.
      </p>
    </div>
  )
}
