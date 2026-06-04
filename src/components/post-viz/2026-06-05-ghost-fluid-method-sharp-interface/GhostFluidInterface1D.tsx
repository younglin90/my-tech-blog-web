'use client'

import { useEffect, useRef, useState } from 'react'

// Visualizes how Ghost Fluid Method populates ghost cells across a material
// interface: pressure & normal velocity are continuous (copied), while density
// (entropy) jumps and is filled by constant extrapolation of each real fluid.

export function GhostFluidInterface1D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [xi, setXi] = useState(0.5) // interface position in [0,1]
  const [rhoL, setRhoL] = useState(1.0) // left material density
  const [rhoR, setRhoR] = useState(0.18) // right material density
  const [showGhost, setShowGhost] = useState(true)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    let raf = 0

    const draw = () => {
      tRef.current += 0.02
      const t = tRef.current
      ctx.clearRect(0, 0, W, H)

      // panels: density (top), pressure (mid), velocity (bottom)
      const pad = 38
      const panelH = (H - pad * 2) / 3
      const rho = (x: number) => (x < xi ? rhoL : rhoR)
      // continuous pressure: smooth bump, equal across interface
      const pres = (x: number) => 0.6 + 0.25 * Math.sin(Math.PI * x)
      // continuous normal velocity with a gentle live wobble
      const vel = (x: number) => 0.5 + 0.18 * Math.sin(2 * Math.PI * x - t)

      const panels: [string, (x: number) => number, number, number, string][] = [
        ['density  rho', rho, 0, Math.max(rhoL, rhoR) * 1.2, '#22d3ee'],
        ['pressure  p (continuous)', pres, 0, 1.0, '#f59e0b'],
        ['normal velocity  u (continuous)', vel, 0, 1.0, '#a78bfa'],
      ]

      const xiPx = pad + xi * (W - 2 * pad)

      panels.forEach(([label, fn, lo, hi, color], idx) => {
        const top = pad + idx * panelH
        const bot = top + panelH - 14
        // axis
        ctx.strokeStyle = 'rgba(120,144,168,0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pad, bot)
        ctx.lineTo(W - pad, bot)
        ctx.stroke()

        const toY = (v: number) => bot - ((v - lo) / (hi - lo)) * (panelH - 22)
        const toX = (x: number) => pad + x * (W - 2 * pad)

        // interface marker
        ctx.strokeStyle = 'rgba(248,113,113,0.7)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(xiPx, top)
        ctx.lineTo(xiPx, bot)
        ctx.stroke()
        ctx.setLineDash([])

        // ghost extension: each real fluid extrapolated across the interface
        if (showGhost && idx === 0) {
          // left fluid ghost (dashed) extends to the right at constant rhoL
          ctx.strokeStyle = 'rgba(34,211,238,0.45)'
          ctx.setLineDash([6, 5])
          ctx.beginPath()
          ctx.moveTo(xiPx, toY(rhoL))
          ctx.lineTo(W - pad, toY(rhoL))
          ctx.stroke()
          // right fluid ghost extends to the left at constant rhoR
          ctx.strokeStyle = 'rgba(244,114,182,0.5)'
          ctx.beginPath()
          ctx.moveTo(pad, toY(rhoR))
          ctx.lineTo(xiPx, toY(rhoR))
          ctx.stroke()
          ctx.setLineDash([])
        }

        // real field (solid)
        ctx.strokeStyle = color
        ctx.lineWidth = 2.4
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= 160; i++) {
          const x = i / 160
          // density is drawn as two flat segments to show the jump
          const px = toX(x)
          const py = toY(fn(x))
          if (idx === 0 && i > 0 && (x - 1 / 160 < xi) !== (x < xi)) {
            ctx.stroke()
            ctx.beginPath()
            started = false
          }
          if (!started) {
            ctx.moveTo(px, py)
            started = true
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.stroke()

        ctx.fillStyle = '#7a90a8'
        ctx.font = '12px system-ui, sans-serif'
        ctx.fillText(label, pad + 2, top + 12)
      })

      // interface label
      ctx.fillStyle = '#f87171'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('interface', xiPx - 22, H - 4)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [xi, rhoL, rhoR, showGhost])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, margin: '1.4rem 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={680} height={300} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 150px' }}>
          interface position: {xi.toFixed(2)}
          <input type="range" min={0.25} max={0.75} step={0.01} value={xi} onChange={(e) => setXi(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 150px' }}>
          left rho: {rhoL.toFixed(2)}
          <input type="range" min={0.3} max={1.5} step={0.01} value={rhoL} onChange={(e) => setRhoL(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 150px' }}>
          right rho: {rhoR.toFixed(2)}
          <input type="range" min={0.05} max={1.5} step={0.01} value={rhoR} onChange={(e) => setRhoR(+e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 130px' }}>
          <input type="checkbox" checked={showGhost} onChange={(e) => setShowGhost(e.target.checked)} />
          show ghost extension
        </label>
      </div>
    </div>
  )
}
