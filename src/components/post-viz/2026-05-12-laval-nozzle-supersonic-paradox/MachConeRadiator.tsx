'use client'

import { useEffect, useRef, useState } from 'react'

type Pulse = { x0: number; y0: number; tEmit: number }

export function MachConeRadiator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mach, setMach] = useState(0.6)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const a = 60
    const u = mach * a

    const pulses: Pulse[] = []
    let tStart = performance.now()
    let lastEmit = -Infinity
    let raf = 0

    const cssBg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#08111f'
    const cssAcc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee'
    const cssTxt = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#e2e8f0'

    const draw = (now: number) => {
      const t = (now - tStart) / 1000
      const xSrc = 60 + u * t

      if (xSrc > W - 40) {
        tStart = performance.now()
        pulses.length = 0
        lastEmit = -Infinity
      }

      if (running && t - lastEmit > 0.18) {
        pulses.push({ x0: xSrc, y0: H / 2, tEmit: t })
        lastEmit = t
      }
      while (pulses.length > 80) pulses.shift()

      ctx.fillStyle = cssBg
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = cssTxt + '20'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()

      ctx.strokeStyle = cssAcc
      ctx.lineWidth = 1.2
      for (const p of pulses) {
        const r = a * (t - p.tEmit)
        if (r < 1) continue
        ctx.globalAlpha = Math.max(0, 1 - r / 320)
        ctx.beginPath()
        ctx.arc(p.x0, p.y0, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (mach > 1.001 && pulses.length > 4) {
        const sinMu = 1 / mach
        const mu = Math.asin(Math.min(1, sinMu))
        ctx.strokeStyle = '#f97316'
        ctx.lineWidth = 1.5
        const len = 360
        ctx.beginPath()
        ctx.moveTo(xSrc, H / 2)
        ctx.lineTo(xSrc - Math.cos(mu) * len, H / 2 - Math.sin(mu) * len)
        ctx.moveTo(xSrc, H / 2)
        ctx.lineTo(xSrc - Math.cos(mu) * len, H / 2 + Math.sin(mu) * len)
        ctx.stroke()
      }

      ctx.fillStyle = '#f43f5e'
      ctx.beginPath()
      ctx.arc(xSrc, H / 2, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = cssTxt
      ctx.font = '12px monospace'
      ctx.fillText(`Ma = ${mach.toFixed(2)}`, 12, 20)
      ctx.fillText(
        mach < 1 ? 'Subsonic — fronts spread everywhere'
        : mach < 1.001 ? 'Sonic — flat Mach wave forms'
        : `Supersonic — Mach cone half-angle μ = ${(Math.asin(1 / mach) * 180 / Math.PI).toFixed(1)}°`,
        12, H - 12,
      )

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [mach, running])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontFamily: 'monospace' }}>
          Mach: {mach.toFixed(2)}
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.05}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
            style={{ marginLeft: 10, verticalAlign: 'middle', width: 200 }}
          />
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: '4px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <span style={{ fontSize: 11, opacity: 0.7 }}>0.5 / 1.0 / 2.0 are key regimes</span>
      </div>
      <canvas ref={canvasRef} width={680} height={300} style={{ width: '100%', height: 'auto', borderRadius: 6, display: 'block' }} />
    </div>
  )
}
