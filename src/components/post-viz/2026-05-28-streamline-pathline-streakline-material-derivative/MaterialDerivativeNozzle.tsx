'use client'

import { useEffect, useRef, useState } from 'react'

// Steady converging channel. The field never changes in time (du/dt = 0 everywhere),
// yet a parcel speeds up as it rides into the throat. That extra push is the convective
// term u*(du/dx), so the material derivative Du/Dt = du/dt + u*du/dx is non-zero.
export function MaterialDerivativeNozzle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cr, setCr] = useState(0.4) // outlet/inlet half-height ratio
  const [running, setRunning] = useState(true)

  const paramsRef = useRef({ cr, running })
  useEffect(() => {
    paramsRef.current = { cr, running }
  }, [cr, running])

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

    const padL = 16
    const padR = 16
    const Lx = 1 // domain length
    const Uin = 1
    const h0 = 1 // inlet half-height (normalized)
    const chTop = 30
    const chBot = 150
    const chMid = (chTop + chBot) / 2
    const chHalf = (chBot - chTop) / 2
    const plotW = W - padL - padR
    const px = (x: number) => padL + (x / Lx) * plotW

    const halfHeight = (x: number, ratio: number) => h0 - (h0 - h0 * ratio) * (x / Lx)
    const speed = (x: number, ratio: number) => (Uin * h0) / halfHeight(x, ratio)
    const dudx = (x: number, ratio: number) => {
      const h = halfHeight(x, ratio)
      const hp = -(h0 - h0 * ratio) / Lx
      return -Uin * h0 * hp / (h * h)
    }

    let parcelX = 0
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000)
      last = now
      const { cr: ratio, running: run } = paramsRef.current

      if (run) {
        parcelX += speed(parcelX, ratio) * dt * 0.25
        if (parcelX > Lx) parcelX = 0
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1422'
      ctx.fillRect(0, 0, W, H)

      // channel walls
      ctx.strokeStyle = 'rgba(148,163,184,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x <= Lx; x += 0.02) {
        const y = chMid - halfHeight(x, ratio) * chHalf
        if (x === 0) ctx.moveTo(px(x), y)
        else ctx.lineTo(px(x), y)
      }
      ctx.stroke()
      ctx.beginPath()
      for (let x = 0; x <= Lx; x += 0.02) {
        const y = chMid + halfHeight(x, ratio) * chHalf
        if (x === 0) ctx.moveTo(px(x), y)
        else ctx.lineTo(px(x), y)
      }
      ctx.stroke()

      // velocity arrows on a fixed grid (steady -> never moves)
      ctx.strokeStyle = 'rgba(56,189,248,0.45)'
      ctx.lineWidth = 1.5
      for (let i = 1; i <= 9; i++) {
        const x = (i / 10) * Lx
        const u = speed(x, ratio)
        const ax = px(x)
        const ay = chMid
        const len = Math.min(46, u * 12)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + len, ay)
        ctx.lineTo(ax + len - 4, ay - 3)
        ctx.moveTo(ax + len, ay)
        ctx.lineTo(ax + len - 4, ay + 3)
        ctx.stroke()
      }

      // the parcel
      const u = speed(parcelX, ratio)
      const conv = u * dudx(parcelX, ratio) // convective acceleration
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(px(parcelX), chMid, 6, 0, Math.PI * 2)
      ctx.fill()

      // acceleration bar chart (bottom)
      const barY = H - 14
      const barH = 56
      const scale = barH / 6
      const drawBar = (cx: number, val: number, label: string, color: string) => {
        const h = Math.max(2, Math.abs(val) * scale)
        ctx.fillStyle = color
        ctx.fillRect(cx - 22, barY - h, 44, h)
        ctx.fillStyle = 'rgba(226,232,240,0.9)'
        ctx.font = '11px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(label, cx, barY + 12)
        ctx.fillText(val.toFixed(2), cx, barY - h - 4)
        ctx.textAlign = 'left'
      }
      drawBar(W * 0.33, 0, '∂u/∂t', '#64748b')
      drawBar(W * 0.5, conv, 'u·∂u/∂x', '#22d3ee')
      drawBar(W * 0.67, conv, 'Du/Dt', '#fbbf24')

      ctx.fillStyle = 'rgba(226,232,240,0.92)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`steady field — u(parcel) = ${u.toFixed(2)}`, padL + 4, 16)

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 14,
      background: 'var(--surface)',
      margin: '16px 0'
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 230, display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>contraction (outlet/inlet) = {cr.toFixed(2)}</span>
          <input type="range" min={0.25} max={1} step={0.01} value={cr}
                 onChange={e => setCr(parseFloat(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <button
            onClick={() => setRunning(r => !r)}
            style={{
              padding: '4px 12px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: running ? 'var(--accent)' : 'transparent',
              color: running ? '#0b1422' : 'var(--text)',
              cursor: 'pointer',
              fontSize: 12
            }}>
            {running ? 'pause' : 'play'}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Nothing in this field depends on time, so ∂u/∂t = 0 at every fixed point. Yet the pink parcel
        still accelerates into the throat — all of it from the convective term u·∂u/∂x.
      </p>
    </div>
  )
}
