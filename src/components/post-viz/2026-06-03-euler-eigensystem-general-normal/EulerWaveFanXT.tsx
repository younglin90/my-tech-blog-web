'use client'

import { useEffect, useRef, useState } from 'react'

// Visualizes the three wave families of the Euler eigensystem in the (x, t) plane.
// Three rays radiate from the origin with slopes 1/lambda_i:
//   - left acoustic (vn - a) : blue
//   - entropy / contact (vn) : grey
//   - right acoustic (vn + a) : red
// User drags Mach number M = vn / a; the fan opens, tilts, or transonic crosses x = 0.

const W = 640
const H = 320
const PAD_L = 40
const PAD_R = 12
const PAD_T = 18
const PAD_B = 30

function plotX(x: number, xmin: number, xmax: number) {
  return PAD_L + ((x - xmin) / (xmax - xmin)) * (W - PAD_L - PAD_R)
}
function plotY(t: number, tmax: number) {
  return H - PAD_B - (t / tmax) * (H - PAD_T - PAD_B)
}

export function EulerWaveFanXT() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mach, setMach] = useState(0.0)
  const [showFan, setShowFan] = useState(true)
  const [pulseT, setPulseT] = useState(0)
  const [running, setRunning] = useState(true)
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()

    const draw = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (runningRef.current) {
        setPulseT((p) => (p + dt * 0.4) % 1)
      }
      const a = 1
      const vn = mach * a
      const xmax = 1.8
      const xmin = -1.8
      const tmax = 1.0

      ctx.fillStyle = '#0b1322'
      ctx.fillRect(0, 0, W, H)

      // axes
      ctx.strokeStyle = '#37495f'
      ctx.lineWidth = 1
      ctx.beginPath()
      const x0 = plotX(0, xmin, xmax)
      ctx.moveTo(PAD_L, H - PAD_B)
      ctx.lineTo(W - PAD_R, H - PAD_B)
      ctx.moveTo(x0, H - PAD_B)
      ctx.lineTo(x0, PAD_T)
      ctx.stroke()

      ctx.fillStyle = '#7a90a8'
      ctx.font = '12px JetBrains Mono, monospace'
      ctx.fillText('x', W - PAD_R - 8, H - PAD_B + 18)
      ctx.fillText('t', x0 + 6, PAD_T + 10)

      // grid ticks at x = -1, 0, 1
      ctx.strokeStyle = '#1b2839'
      ctx.beginPath()
      for (const xv of [-1, 1]) {
        const px = plotX(xv, xmin, xmax)
        ctx.moveTo(px, PAD_T)
        ctx.lineTo(px, H - PAD_B)
      }
      ctx.stroke()

      // three wave rays from origin with slopes lambda_i (dx/dt)
      const lambdas = [vn - a, vn, vn + a]
      const colors = ['#60a5fa', '#94a3b8', '#f87171']
      const labels = [`vn - a = ${(vn - a).toFixed(2)}`, `vn   = ${vn.toFixed(2)}`, `vn + a = ${(vn + a).toFixed(2)}`]

      // optional shaded fan between extreme rays
      if (showFan) {
        ctx.fillStyle = 'rgba(34,211,238,0.06)'
        ctx.beginPath()
        ctx.moveTo(plotX(0, xmin, xmax), H - PAD_B)
        // top-left along (vn - a) ray
        const xL = vn - a > 0 ? Math.min(xmax, (vn - a) * tmax) : Math.max(xmin, (vn - a) * tmax)
        const xR = vn + a > 0 ? Math.min(xmax, (vn + a) * tmax) : Math.max(xmin, (vn + a) * tmax)
        ctx.lineTo(plotX(xL, xmin, xmax), plotY(tmax, tmax))
        ctx.lineTo(plotX(xR, xmin, xmax), plotY(tmax, tmax))
        ctx.closePath()
        ctx.fill()
      }

      ctx.lineWidth = 2.5
      lambdas.forEach((lam, i) => {
        ctx.strokeStyle = colors[i]
        ctx.beginPath()
        ctx.moveTo(plotX(0, xmin, xmax), H - PAD_B)
        const xTop = Math.max(xmin, Math.min(xmax, lam * tmax))
        ctx.lineTo(plotX(xTop, xmin, xmax), plotY(tmax, tmax))
        ctx.stroke()
      })

      // legend
      ctx.font = '12px JetBrains Mono, monospace'
      labels.forEach((lab, i) => {
        ctx.fillStyle = colors[i]
        ctx.fillRect(W - 200, PAD_T + 4 + i * 18, 12, 12)
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(lab, W - 184, PAD_T + 14 + i * 18)
      })

      // a pulse marker traveling at each lambda to make speed visible
      const tNow = pulseT * tmax
      lambdas.forEach((lam, i) => {
        const x = lam * tNow
        if (x >= xmin && x <= xmax) {
          ctx.fillStyle = colors[i]
          ctx.beginPath()
          ctx.arc(plotX(x, xmin, xmax), plotY(tNow, tmax), 4.5, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // status text
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px JetBrains Mono, monospace'
      const flowDesc = Math.abs(vn) < a ? 'subsonic — fan straddles x = 0' : vn > 0 ? 'supersonic right — all rays bend right' : 'supersonic left'
      ctx.fillText(flowDesc, PAD_L, PAD_T + 12)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [mach, showFan])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', borderRadius: 12, background: 'var(--surface, #0f172a)', border: '1px solid var(--border, #1e293b)' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: 640, display: 'block', borderRadius: 8 }} />
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          M = vn / a
          <input type='range' min={-1.6} max={1.6} step={0.02} value={mach} onChange={(e) => setMach(parseFloat(e.target.value))} style={{ width: 180 }} />
          <span style={{ width: 48, textAlign: 'right' }}>{mach.toFixed(2)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type='checkbox' checked={showFan} onChange={(e) => setShowFan(e.target.checked)} /> show fan
        </label>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border, #334155)', background: 'transparent', color: 'var(--text, #cbd5e1)', cursor: 'pointer' }}>
          {running ? 'pause' : 'play'} markers
        </button>
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
        Three rays from the origin: blue (vn - a) carries the left acoustic wave, grey (vn) carries entropy and tangential momentum (the contact), red (vn + a) carries the right acoustic wave. Cross |M| = 1 and one acoustic ray flips sides — the contact follows the flow.
      </p>
    </div>
  )
}
