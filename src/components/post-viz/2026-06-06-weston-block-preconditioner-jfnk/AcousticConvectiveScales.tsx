'use client'

import { useEffect, useRef, useState } from 'react'

// Why the all-speed Jacobian stiffens as M -> 0: the acoustic wave races at
// c = 1/M while the fluid it rides on creeps at u = 1. The ratio c/u = 1/M is
// the source of ill-conditioning. Here an acoustic pulse (cyan) laps the track
// while a convective tracer (orange) barely moves; the gap is the stiffness.
export function AcousticConvectiveScales() {
  const [logM, setLogM] = useState(-1.5)
  const [running, setRunning] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tRef = useRef(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (running) tRef.current += dt
      const M = Math.pow(10, logM)
      const c = 1 / M // acoustic speed (convective speed = 1)
      const t = tRef.current

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const W = canvas.width, H = canvas.height
          ctx.fillStyle = '#08111f'
          ctx.fillRect(0, 0, W, H)
          const padX = 30
          const trackW = W - 2 * padX
          const yA = H * 0.34
          const yC = H * 0.66
          const period = trackW // wrap length

          // tracks
          ctx.strokeStyle = '#1e293b'
          ctx.lineWidth = 1
          for (const y of [yA, yC]) {
            ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke()
          }

          // acoustic pulse position (fast, wraps)
          const speedScale = 18 // px per (unit speed * second), visual
          const xA = padX + (((c * t * speedScale) % period) + period) % period
          // convective tracer (slow)
          const xC = padX + (((1 * t * speedScale) % period) + period) % period

          ctx.fillStyle = '#22d3ee'
          ctx.beginPath(); ctx.arc(xA, yA, 8, 0, 2 * Math.PI); ctx.fill()
          ctx.fillStyle = '#fb923c'
          ctx.beginPath(); ctx.arc(xC, yC, 8, 0, 2 * Math.PI); ctx.fill()

          ctx.fillStyle = '#94a3b8'
          ctx.font = '12px sans-serif'
          ctx.fillText('acoustic wave   c = 1/M', padX, yA - 16)
          ctx.fillText('convective tracer   u = 1', padX, yC - 16)

          // stiffness bar
          const ratio = c // = 1/M
          ctx.fillStyle = '#64748b'
          ctx.fillText('scale ratio c/u = 1/M = ' + ratio.toFixed(0), padX, H - 12)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, logM])

  const M = Math.pow(10, logM)
  return (
    <div style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={640} height={210} style={{ width: '100%', display: 'block', borderRadius: 4 }} />
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <label>Mach number M = {M.toExponential(1)}</label>
        <input type="range" min={-3} max={-0.3} step={0.1} value={logM} onChange={(e) => setLogM(+e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        explicit acoustic CFL forces Δt ∝ M·Δx — the smaller M, the stiffer the coupled system.
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
          {running ? 'Pause' : 'Resume'}
        </button>
      </div>
    </div>
  )
}
