'use client'

import { useEffect, useRef, useState } from 'react'

const KAPPA = 0.41
const Y_PLUS_MIN = 0.1
const Y_PLUS_MAX = 1000

function uPlusModel(yPlus: number, B: number, useBuffer: boolean): number {
  if (yPlus <= 5) return yPlus
  if (yPlus >= 30) return (1 / KAPPA) * Math.log(yPlus) + B
  if (!useBuffer) {
    return yPlus < 11.6 ? yPlus : (1 / KAPPA) * Math.log(yPlus) + B
  }
  const t = (yPlus - 5) / 25
  const linear = yPlus
  const log = (1 / KAPPA) * Math.log(yPlus) + B
  return linear * (1 - t) + log * t
}

export function LawOfTheWallProfile() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [B, setB] = useState(5.0)
  const [useBuffer, setUseBuffer] = useState(true)
  const [showZones, setShowZones] = useState(true)

  useEffect(() => {
    draw(canvasRef.current, B, useBuffer, showZones)
  }, [B, useBuffer, showZones])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={760}
        height={360}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 240px' }}>
          <span style={{ marginBottom: 4 }}>
            Log-law constant B: <strong>{B.toFixed(2)}</strong>
          </span>
          <input type="range" min={3.5} max={6.5} step={0.05} value={B} onChange={(e) => setB(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={useBuffer} onChange={(e) => setUseBuffer(e.target.checked)} /> smooth buffer blend
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} /> shade zones
        </label>
      </div>
    </div>
  )
}

function draw(c: HTMLCanvasElement | null, B: number, useBuffer: boolean, showZones: boolean) {
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const W = c.width
  const H = c.height
  const padL = 60
  const padR = 24
  const padT = 24
  const padB = 50
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, W, H)

  const xLog = (yp: number) => padL + ((Math.log10(yp) - Math.log10(Y_PLUS_MIN)) / (Math.log10(Y_PLUS_MAX) - Math.log10(Y_PLUS_MIN))) * plotW
  const yPx = (u: number) => padT + plotH - (u / 28) * plotH

  if (showZones) {
    const x5 = xLog(5)
    const x30 = xLog(30)
    ctx.fillStyle = 'rgba(34,211,238,0.08)'
    ctx.fillRect(padL, padT, x5 - padL, plotH)
    ctx.fillStyle = 'rgba(251,191,36,0.08)'
    ctx.fillRect(x5, padT, x30 - x5, plotH)
    ctx.fillStyle = 'rgba(239,68,68,0.06)'
    ctx.fillRect(x30, padT, padL + plotW - x30, plotH)
  }

  ctx.strokeStyle = 'rgba(148,163,184,0.18)'
  ctx.lineWidth = 1
  for (const decade of [1, 10, 100, 1000]) {
    for (let m = 1; m < 10; m++) {
      const v = decade * m
      if (v >= Y_PLUS_MIN && v <= Y_PLUS_MAX) {
        const x = xLog(v)
        ctx.beginPath()
        ctx.moveTo(x, padT)
        ctx.lineTo(x, padT + plotH)
        ctx.stroke()
      }
    }
  }
  for (let u = 0; u <= 25; u += 5) {
    const y = yPx(u)
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(padL + plotW, y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(148,163,184,0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(padL, padT)
  ctx.lineTo(padL, padT + plotH)
  ctx.lineTo(padL + plotW, padT + plotH)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px ui-sans-serif, system-ui'
  for (const v of [0.1, 1, 10, 100, 1000]) {
    const x = xLog(v)
    ctx.fillText(v.toString(), x - 8, padT + plotH + 16)
  }
  for (let u = 0; u <= 25; u += 5) {
    ctx.fillText(u.toString(), padL - 28, yPx(u) + 4)
  }
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '13px ui-sans-serif, system-ui'
  ctx.fillText('y⁺  (log scale)', padL + plotW / 2 - 40, padT + plotH + 38)
  ctx.save()
  ctx.translate(18, padT + plotH / 2 + 20)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('u⁺ = u / u_τ', 0, 0)
  ctx.restore()

  ctx.strokeStyle = 'rgba(148,163,184,0.6)'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  for (let i = 0; i <= 200; i++) {
    const yp = Y_PLUS_MIN * Math.pow(Y_PLUS_MAX / Y_PLUS_MIN, i / 200)
    const x = xLog(yp)
    const y = yPx(Math.min(28, yp))
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.beginPath()
  for (let i = 0; i <= 200; i++) {
    const yp = Y_PLUS_MIN * Math.pow(Y_PLUS_MAX / Y_PLUS_MIN, i / 200)
    if (yp < 1) continue
    const x = xLog(yp)
    const y = yPx(Math.min(28, (1 / KAPPA) * Math.log(yp) + B))
    if (yp === 1 || ctx.lineDashOffset === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let i = 0; i <= 400; i++) {
    const yp = Y_PLUS_MIN * Math.pow(Y_PLUS_MAX / Y_PLUS_MIN, i / 400)
    const u = uPlusModel(yp, B, useBuffer)
    const x = xLog(yp)
    const y = yPx(Math.min(28, u))
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.fillStyle = '#22d3ee'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText('u⁺ profile', xLog(200), yPx(uPlusModel(200, B, useBuffer)) - 10)
  ctx.fillStyle = 'rgba(148,163,184,0.9)'
  ctx.fillText('linear  u⁺ = y⁺', xLog(2.5), yPx(2.5) - 6)
  ctx.fillText('log  u⁺ = (1/κ) ln y⁺ + B', xLog(120), yPx(15) + 18)

  if (showZones) {
    ctx.fillStyle = '#22d3ee'
    ctx.font = 'bold 11px ui-sans-serif, system-ui'
    ctx.fillText('viscous', xLog(0.5), padT + 16)
    ctx.fillText('sublayer', xLog(0.5), padT + 30)
    ctx.fillStyle = '#fbbf24'
    ctx.fillText('buffer', xLog(11), padT + 16)
    ctx.fillStyle = '#ef4444'
    ctx.fillText('log-law / inertial', xLog(120), padT + 16)
  }
}
