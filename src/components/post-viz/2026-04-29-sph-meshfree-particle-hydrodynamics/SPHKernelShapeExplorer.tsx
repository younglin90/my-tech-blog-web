'use client'

import { useEffect, useRef, useState } from 'react'

type KernelKind = 'gaussian' | 'cubic-spline' | 'poly6' | 'spiky'

const evalKernel = (kind: KernelKind, r: number, h: number): number => {
  if (kind === 'gaussian') {
    return (1 / (h * Math.sqrt(Math.PI))) * Math.exp(-(r * r) / (h * h))
  }
  if (kind === 'cubic-spline') {
    const q = r / h
    const c = 10 / (7 * Math.PI * h * h)
    if (q < 1) return c * (1 - 1.5 * q * q + 0.75 * q * q * q)
    if (q < 2) return c * 0.25 * Math.pow(2 - q, 3)
    return 0
  }
  if (kind === 'poly6') {
    if (r >= h) return 0
    const c = 315 / (64 * Math.PI * Math.pow(h, 9))
    const d = h * h - r * r
    return c * d * d * d
  }
  if (kind === 'spiky') {
    if (r >= h) return 0
    const c = 15 / (Math.PI * Math.pow(h, 6))
    const d = h - r
    return c * d * d * d
  }
  return 0
}

export function SPHKernelShapeExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [kind, setKind] = useState<KernelKind>('cubic-spline')
  const [h, setH] = useState(1.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const Hpx = canvas.height
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, W, Hpx)

    const margin = 40
    const plotW = W - 2 * margin
    const plotH = Hpx - 2 * margin

    let maxVal = 0
    const samples = 240
    const rs: number[] = []
    const ws: number[] = []
    const rMax = 2.5 * h
    for (let i = 0; i <= samples; i++) {
      const r = (i / samples) * rMax
      const w = evalKernel(kind, r, h)
      rs.push(r)
      ws.push(w)
      if (w > maxVal) maxVal = w
    }
    if (maxVal === 0) maxVal = 1

    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin, margin)
    ctx.lineTo(margin, margin + plotH)
    ctx.lineTo(margin + plotW, margin + plotH)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)'
    ctx.setLineDash([4, 4])
    const xH = margin + (h / rMax) * plotW
    ctx.beginPath()
    ctx.moveTo(xH, margin)
    ctx.lineTo(xH, margin + plotH)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#7a90a8'
    ctx.font = '11px sans-serif'
    ctx.fillText('r = h', xH + 4, margin + 12)
    ctx.fillText('r', margin + plotW - 8, margin + plotH + 16)
    ctx.fillText('W(r, h)', margin - 30, margin - 8)

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < rs.length; i++) {
      const x = margin + (rs[i] / rMax) * plotW
      const y = margin + plotH - (ws[i] / maxVal) * plotH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px monospace'
    ctx.fillText(`peak W = ${maxVal.toFixed(3)}`, margin + 8, margin + 16)
  }, [kind, h])

  const kinds: KernelKind[] = ['gaussian', 'cubic-spline', 'poly6', 'spiky']

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <canvas
          ref={canvasRef}
          width={420}
          height={260}
          className="rounded border border-[var(--border)] bg-black"
        />
        <div className="flex w-full flex-col gap-2 text-sm md:max-w-xs">
          <span className="font-semibold">kernel</span>
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`min-h-11 rounded border px-2 py-1 text-xs ${
                  kind === k
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15'
                    : 'border-[var(--border)] hover:bg-[var(--accent)]/10'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <label className="mt-2 flex flex-col gap-1">
            <span>
              h = <code className="text-[var(--accent)]">{h.toFixed(2)}</code>
            </span>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.05}
              value={h}
              onChange={(e) => setH(parseFloat(e.target.value))}
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            Cubic spline has compact support on r &lt; 2h. Poly6 / spiky vanish
            at r = h. Gaussian is non-compact (truncated at 2.5h here).
          </p>
        </div>
      </div>
    </div>
  )
}
