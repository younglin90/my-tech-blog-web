'use client'

import { useEffect, useRef, useState } from 'react'

type KernelKind = 'hat2' | 'roma3' | 'peskin4' | 'peskin6'

const KERNELS: Record<KernelKind, { label: string; support: number; fn: (r: number) => number }> = {
  hat2: {
    label: '2-point hat',
    support: 1,
    fn: (r) => {
      const a = Math.abs(r)
      return a < 1 ? 1 - a : 0
    },
  },
  roma3: {
    label: '3-point Roma',
    support: 1.5,
    fn: (r) => {
      const a = Math.abs(r)
      if (a <= 0.5) return (1 + Math.sqrt(1 - 3 * a * a)) / 3
      if (a <= 1.5) {
        const t = 1 - 3 * (1 - a) * (1 - a)
        return (5 - 3 * a - Math.sqrt(Math.max(t, 0))) / 6
      }
      return 0
    },
  },
  peskin4: {
    label: '4-point Peskin',
    support: 2,
    fn: (r) => {
      const a = Math.abs(r)
      if (a < 1) return (3 - 2 * a + Math.sqrt(1 + 4 * a - 4 * a * a)) / 8
      if (a < 2) {
        const t = -7 + 12 * a - 4 * a * a
        return (5 - 2 * a - Math.sqrt(Math.max(t, 0))) / 8
      }
      return 0
    },
  },
  peskin6: {
    label: '6-point Peskin',
    support: 3,
    fn: (r) => {
      const a = Math.abs(r)
      if (a >= 3) return 0
      const x = a < 1.5 ? 1.5 - a : a < 2.5 ? 2.5 - a : 3 - a
      const base = Math.exp(-1.5 * (a / 3) * (a / 3))
      const support = 1 - (a / 3) * (a / 3) * (a / 3)
      return Math.max(0, base * support * x * 0.45)
    },
  },
}

export function IBMDeltaKernel1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [kernel, setKernel] = useState<KernelKind>('peskin4')
  const [markerX, setMarkerX] = useState(10.3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const margin = { l: 36, r: 16, t: 18, b: 28 }
    const plotW = W - margin.l - margin.r
    const plotH = H - margin.t - margin.b
    const N = 21
    const dx = plotW / (N - 1)
    const xToPix = (i: number) => margin.l + i * dx
    const k = KERNELS[kernel]

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#1f2c44'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const x = xToPix(i)
      ctx.moveTo(x, margin.t)
      ctx.lineTo(x, margin.t + plotH)
    }
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(margin.l, margin.t + plotH)
    ctx.lineTo(margin.l + plotW, margin.t + plotH)
    ctx.strokeStyle = '#3a4a66'
    ctx.stroke()

    const samples = 400
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let s = 0; s <= samples; s++) {
      const xg = (s / samples) * (N - 1)
      const w = k.fn(xg - markerX)
      const px = margin.l + (xg / (N - 1)) * plotW
      const py = margin.t + plotH - w * plotH * 0.95
      if (s === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    let total = 0
    for (let i = 0; i < N; i++) {
      const w = k.fn(i - markerX)
      total += w
      if (w <= 1e-6) continue
      const px = xToPix(i)
      const barH = w * plotH * 0.95
      ctx.fillStyle = 'rgba(34, 211, 238, 0.55)'
      ctx.fillRect(px - 5, margin.t + plotH - barH, 10, barH)
      ctx.fillStyle = '#cfe9f5'
      ctx.font = '10px ui-sans-serif'
      ctx.textAlign = 'center'
      if (w > 0.05) ctx.fillText(w.toFixed(2), px, margin.t + plotH - barH - 4)
    }

    const mpx = margin.l + (markerX / (N - 1)) * plotW
    ctx.beginPath()
    ctx.arc(mpx, margin.t + plotH, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
    ctx.strokeStyle = '#fde68a'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#cfe9f5'
    ctx.font = '11px ui-sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Σ w_i = ${total.toFixed(4)}`, margin.l + 4, margin.t + 12)
    ctx.textAlign = 'right'
    ctx.fillText(`support = ${k.support} h`, W - margin.r - 4, margin.t + 12)

    ctx.fillStyle = '#7a8aa3'
    ctx.font = '10px ui-sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Eulerian grid index i  (h = 1)', margin.l + plotW / 2, H - 8)
  }, [kernel, markerX])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 220, flex: 1 }}>
          <span>Marker position x_L = {markerX.toFixed(2)} h</span>
          <input
            type="range"
            min={2}
            max={18}
            step={0.01}
            value={markerX}
            onChange={(e) => setMarkerX(parseFloat(e.target.value))}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(Object.keys(KERNELS) as KernelKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKernel(k)}
              style={{
                fontSize: '0.72rem',
                padding: '0.3rem 0.55rem',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: kernel === k ? 'var(--accent)' : 'transparent',
                color: kernel === k ? '#0b1424' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {KERNELS[k].label}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} width={620} height={260} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
        Each bar is the weight δ<sub>h</sub>(x<sub>i</sub> − x<sub>L</sub>) the Lagrangian marker hands to grid node i. The sum stays close to 1 by design — that is the zeroth moment condition.
      </p>
    </div>
  )
}
