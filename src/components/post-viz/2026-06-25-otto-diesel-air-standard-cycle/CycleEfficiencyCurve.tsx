'use client'

import { useEffect, useRef, useState } from 'react'

const K = 1.4

function ottoEff(r: number) {
  return 1 - 1 / Math.pow(r, K - 1)
}

function dieselEff(r: number, rc: number) {
  return 1 - (1 / Math.pow(r, K - 1)) * (Math.pow(rc, K) - 1) / (K * (rc - 1))
}

// η vs compression ratio: shows diminishing returns and where the knock
// limit cuts the gasoline (Otto) engine off well before the Diesel range.
export function CycleEfficiencyCurve() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rc, setRc] = useState(2)
  const [pick, setPick] = useState(9)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const W = 520
    const H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const pad = { l: 50, r: 16, t: 18, b: 40 }
    const plotW = W - pad.l - pad.r
    const plotH = H - pad.t - pad.b
    const rMin = 4
    const rMax = 24
    const etaMax = 0.72

    const sx = (r: number) => pad.l + ((r - rMin) / (rMax - rMin)) * plotW
    const sy = (e: number) => pad.t + plotH - (e / etaMax) * plotH

    ctx.clearRect(0, 0, W, H)

    // gasoline knock-limit band (compression ratio above ~12 -> autoignition)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.10)'
    ctx.fillRect(sx(12), pad.t, sx(rMax) - sx(12), plotH)
    ctx.fillStyle = '#ef4444'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.fillText('knock / autoignition zone', sx(12) + 6, pad.t + 14)

    // axes + gridlines
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad.l, pad.t)
    ctx.lineTo(pad.l, pad.t + plotH)
    ctx.lineTo(pad.l + plotW, pad.t + plotH)
    ctx.stroke()
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-sans-serif, system-ui'
    for (let e = 0.2; e <= 0.7; e += 0.2) {
      ctx.fillText((e * 100).toFixed(0) + '%', 8, sy(e) + 4)
      ctx.strokeStyle = 'rgba(100,116,139,0.25)'
      ctx.beginPath()
      ctx.moveTo(pad.l, sy(e))
      ctx.lineTo(pad.l + plotW, sy(e))
      ctx.stroke()
    }
    for (let r = 4; r <= 24; r += 4) {
      ctx.fillText(String(r), sx(r) - 5, pad.t + plotH + 22)
    }
    ctx.fillText('compression ratio r', pad.l + plotW - 130, pad.t + plotH + 36)

    // Otto curve
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let r = rMin; r <= rMax; r += 0.2) {
      const x = sx(r)
      const y = sy(ottoEff(r))
      r === rMin ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Diesel curve at chosen cut-off ratio
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let r = rMin; r <= rMax; r += 0.2) {
      const x = sx(r)
      const y = sy(dieselEff(r, rc))
      r === rMin ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()

    // legend
    ctx.fillStyle = '#22d3ee'
    ctx.fillText('— Otto', pad.l + 10, pad.t + plotH - 28)
    ctx.fillStyle = '#f59e0b'
    ctx.fillText('— Diesel (rc = ' + rc.toFixed(1) + ')', pad.l + 10, pad.t + plotH - 12)

    // marker at picked r
    const eo = ottoEff(pick)
    const ed = dieselEff(pick, rc)
    ;[
      [eo, '#22d3ee'],
      [ed, '#f59e0b'],
    ].forEach(([e, c]) => {
      ctx.beginPath()
      ctx.arc(sx(pick), sy(e as number), 5, 0, Math.PI * 2)
      ctx.fillStyle = c as string
      ctx.fill()
    })
    ctx.strokeStyle = 'rgba(203,213,225,0.5)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(sx(pick), pad.t)
    ctx.lineTo(sx(pick), pad.t + plotH)
    ctx.stroke()
    ctx.setLineDash([])
  }, [rc, pick])

  return (
    <div
      style={{
        border: '1px solid var(--border, #334155)',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: 'var(--surface, rgba(255,255,255,0.02))',
      }}
    >
      <canvas ref={canvasRef} />
      <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>
          Diesel cut-off ratio rc = {rc.toFixed(1)}
          <input
            type="range"
            min={1.2}
            max={3}
            step={0.1}
            value={rc}
            onChange={(e) => setRc(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ display: 'block' }}>
          Marker at r = {pick.toFixed(1)} → Otto {(ottoEff(pick) * 100).toFixed(1)}% ·
          Diesel {(dieselEff(pick, rc) * 100).toFixed(1)}%
          <input
            type="range"
            min={4}
            max={24}
            step={0.5}
            value={pick}
            onChange={(e) => setPick(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
    </div>
  )
}
