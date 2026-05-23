'use client'

import { useEffect, useRef, useState } from 'react'

export function DMPRelaxedNADDetector() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [qm1, setQm1] = useState(1.0)
  const [qi, setQi] = useState(1.0)
  const [qp1, setQp1] = useState(0.1)
  const [qCand, setQCand] = useState(0.55)
  const [delta0Log, setDelta0Log] = useState(-4)
  const [epsLog, setEpsLog] = useState(-3) // ε = 10^-3 default range slider

  const delta0 = Math.pow(10, delta0Log)
  const eps = Math.pow(10, epsLog)

  const qmin = Math.min(qm1, qi, qp1)
  const qmax = Math.max(qm1, qi, qp1)
  const span = qmax - qmin
  const delta = Math.max(delta0, eps * span)
  const lo = qmin - delta
  const hi = qmax + delta

  const troubled = qCand < lo || qCand > hi

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

    const padL = 60
    const padR = 24
    const padT = 28
    const padB = 36

    // y-axis: q values from -0.2 to 2.0
    const yMin = -0.2
    const yMax = 2.0
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const toY = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH

    // grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let k = 0; k <= 4; k++) {
      const v = yMin + (k / 4) * (yMax - yMin)
      const y = toY(v)
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
    }
    ctx.stroke()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.font = '11px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let k = 0; k <= 4; k++) {
      const v = yMin + (k / 4) * (yMax - yMin)
      ctx.fillText(v.toFixed(2), padL - 6, toY(v))
    }

    // admissible band (relaxed)
    ctx.fillStyle = 'rgba(34, 211, 238, 0.12)'
    ctx.fillRect(padL, toY(hi), plotW, toY(lo) - toY(hi))

    // strict DMP band
    ctx.fillStyle = 'rgba(34, 211, 238, 0.22)'
    ctx.fillRect(padL, toY(qmax), plotW, toY(qmin) - toY(qmax))

    // band edges
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)'
    ctx.setLineDash([5, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, toY(lo))
    ctx.lineTo(padL + plotW, toY(lo))
    ctx.moveTo(padL, toY(hi))
    ctx.lineTo(padL + plotW, toY(hi))
    ctx.stroke()
    ctx.setLineDash([])

    // neighbour markers — three cells at x = 0.25, 0.5, 0.75
    const xs = [0.2, 0.5, 0.8]
    const labels = ['q_{i-1}', 'q_i', 'q_{i+1}']
    const values = [qm1, qi, qp1]
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
    ctx.font = '12px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let k = 0; k < 3; k++) {
      const cx = padL + xs[k] * plotW
      const cy = toY(values[k])
      ctx.beginPath()
      ctx.fillStyle = '#94a3b8'
      ctx.arc(cx, cy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(203, 213, 225, 0.92)'
      ctx.fillText(`${labels[k]}=${values[k].toFixed(2)}`, cx, padT + plotH + 6)
    }

    // candidate marker — at x = 0.5 dashed cross
    const cxC = padL + 0.5 * plotW
    const cyC = toY(qCand)
    ctx.beginPath()
    ctx.fillStyle = troubled ? '#f87171' : '#facc15'
    ctx.arc(cxC, cyC, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = troubled ? '#f87171' : '#facc15'
    ctx.lineWidth = 1.4
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(padL, cyC)
    ctx.lineTo(padL + plotW, cyC)
    ctx.stroke()
    ctx.setLineDash([])

    // title above
    ctx.fillStyle = 'rgba(226, 232, 240, 0.92)'
    ctx.font = '12px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const verdict = troubled
      ? `q* = ${qCand.toFixed(3)} outside [${lo.toFixed(3)}, ${hi.toFixed(3)}] — TROUBLED`
      : `q* = ${qCand.toFixed(3)} inside [${lo.toFixed(3)}, ${hi.toFixed(3)}] — OK`
    ctx.fillText(verdict, padL, 4)
  }, [qm1, qi, qp1, qCand, lo, hi, delta, troubled])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm text-[var(--text-muted)] mb-2">
        Relaxed DMP — admissible band around three neighbour values
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 320, display: 'block' }} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">q_(i-1) = {qm1.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={qm1}
            onChange={(e) => setQm1(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">q_i = {qi.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={qi}
            onChange={(e) => setQi(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">q_(i+1) = {qp1.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={qp1}
            onChange={(e) => setQp1(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-3">
          <span className="text-[var(--text-muted)]">candidate q* = {qCand.toFixed(2)}</span>
          <input
            type="range"
            min={-0.3}
            max={2.2}
            step={0.01}
            value={qCand}
            onChange={(e) => setQCand(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">delta_0 = 1e{delta0Log}</span>
          <input
            type="range"
            min={-6}
            max={-1}
            step={1}
            value={delta0Log}
            onChange={(e) => setDelta0Log(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">epsilon = 1e{epsLog}</span>
          <input
            type="range"
            min={-5}
            max={-2}
            step={1}
            value={epsLog}
            onChange={(e) => setEpsLog(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Dark band = strict DMP interval [min, max] of three neighbours. Lighter band = relaxed by
        delta = max(delta_0, epsilon · (max − min)). Drag q* to feel where the candidate is flagged
        TROUBLED. Push delta_0 down to 1e-6 and even a small local peak triggers; push it up to 1e-2
        and a real shock can sneak past.
      </p>
    </div>
  )
}
