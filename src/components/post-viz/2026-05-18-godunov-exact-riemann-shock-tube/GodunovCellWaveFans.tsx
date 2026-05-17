'use client'

import { useEffect, useRef, useState } from 'react'

export function GodunovCellWaveFans() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [dt, setDt] = useState(0.7)
  const [waveSpeed, setWaveSpeed] = useState(1.0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width
    const H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = 40
    const innerW = W - PAD * 2
    const innerH = H - PAD * 2 - 30
    const nCells = 6
    const dx = innerW / nCells
    const tMax = dx / 1.0
    const tShown = Math.min(dt, 0.999) * tMax

    ctx.strokeStyle = 'rgba(148,163,184,0.25)'
    ctx.lineWidth = 1
    for (let i = 0; i <= nCells; i++) {
      const x = PAD + i * dx
      ctx.beginPath()
      ctx.moveTo(x, PAD)
      ctx.lineTo(x, PAD + innerH)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(PAD, PAD + innerH)
    ctx.lineTo(PAD + innerW, PAD + innerH)
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace,monospace'
    ctx.fillText('x', PAD + innerW - 10, PAD + innerH + 14)
    ctx.fillText('t', PAD - 16, PAD + 10)
    ctx.fillText('cell i', PAD + dx * 1.4, PAD + innerH - 6)
    ctx.fillText('cell i+1', PAD + dx * 2.3, PAD + innerH - 6)
    ctx.fillText('interface i+1/2', PAD + dx * 2 - 50, PAD + innerH + 14)

    const xMax = (innerH / tMax) * waveSpeed
    let overlap = false

    for (let k = 0; k < nCells - 1; k++) {
      const xC = PAD + (k + 1) * dx
      const tPx = (tShown / tMax) * innerH
      const span = (tShown / tMax) * xMax
      const xLeftEnd = xC - span
      const xRightEnd = xC + span

      ctx.fillStyle = 'rgba(34,211,238,0.10)'
      ctx.beginPath()
      ctx.moveTo(xC, PAD + innerH)
      ctx.lineTo(xLeftEnd, PAD + innerH - tPx)
      ctx.lineTo(xRightEnd, PAD + innerH - tPx)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(xC, PAD + innerH)
      ctx.lineTo(xLeftEnd, PAD + innerH - tPx)
      ctx.moveTo(xC, PAD + innerH)
      ctx.lineTo(xRightEnd, PAD + innerH - tPx)
      ctx.stroke()

      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 1.0
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(xC, PAD + innerH)
      ctx.lineTo(xC + (tPx / innerH) * dx * 0.4, PAD + innerH - tPx)
      ctx.stroke()
      ctx.setLineDash([])

      if (k > 0) {
        const xCLeft = PAD + k * dx
        const xRightEndLeft = xCLeft + span
        if (xRightEndLeft > xLeftEnd) overlap = true
      }
    }

    const tPxLine = (tShown / tMax) * innerH
    ctx.strokeStyle = overlap ? '#ef4444' : 'rgba(250,250,250,0.45)'
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, PAD + innerH - tPxLine)
    ctx.lineTo(PAD + innerW, PAD + innerH - tPxLine)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = overlap ? '#ef4444' : '#22d3ee'
    ctx.font = '12px ui-sans-serif,system-ui'
    ctx.fillText(`Δt / Δt_CFL = ${dt.toFixed(2)}`, PAD, H - 16)
    ctx.fillStyle = overlap ? '#ef4444' : '#94a3b8'
    ctx.fillText(overlap ? 'fans overlap — time step rejected' : 'fans stay separated — step accepted', PAD + 160, H - 16)
  }, [dt, waveSpeed])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={720}
        height={360}
        style={{ width: '100%', maxWidth: 720, borderRadius: 8, border: '1px solid var(--border)' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 13, color: 'var(--text)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 200 }}>
          <span style={{ marginBottom: 4 }}>time step Δt / Δt_CFL = {dt.toFixed(2)}</span>
          <input type="range" min={0.05} max={1.6} step={0.01} value={dt} onChange={(e) => setDt(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 200 }}>
          <span style={{ marginBottom: 4 }}>max wave speed = {waveSpeed.toFixed(2)}</span>
          <input type="range" min={0.3} max={1.5} step={0.05} value={waveSpeed} onChange={(e) => setWaveSpeed(parseFloat(e.target.value))} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Each cell interface spawns a self-similar Riemann fan. Push the time step past 1 and the fans collide — Godunov requires Δt ≤ Δx / max|λ|.
      </p>
    </div>
  )
}
