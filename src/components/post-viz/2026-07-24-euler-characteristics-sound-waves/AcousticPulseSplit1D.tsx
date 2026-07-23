'use client'

import { useEffect, useRef, useState } from 'react'

// A point perturbation in a 1-D compressible gas splits into THREE signals that
// travel along the three characteristics of the Euler equations:
//
//   right-going sound   speed = u0 + c0     (C+)
//   entropy / contact   speed = u0          (C0, the fluid itself)
//   left-going  sound   speed = u0 - c0     (C-)
//
// c0 is fixed to 1 (non-dimensional sound speed) and the slider sets the
// background flow u0, i.e. the Mach number M = u0/c0. Watch the LEFT-going sound:
// while M < 1 it really moves upstream (left of the source); the moment M crosses
// 1 its speed u0 - c0 turns positive and the whole trio drifts downstream — the
// source can no longer send any signal upstream. That is the physical meaning of
// "supersonic".

export function AcousticPulseSplit1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mach, setMach] = useState(0.4) // u0 with c0 = 1  ->  Mach number
  const [running, setRunning] = useState(true)
  const stateRef = useRef({ mach: 0.4, running: true, t: 0 })

  useEffect(() => {
    stateRef.current.mach = mach
    stateRef.current.running = running
  }, [mach, running])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2 // emission point x0
    const midY = H * 0.42
    const bandH = H * 0.30
    const BASE = 62 // px per (unit speed) per second
    let raf = 0
    let last = 0

    const pulse = (ctx: CanvasRenderingContext2D, x: number, color: string) => {
      const grad = ctx.createRadialGradient(x, midY, 0, x, midY, 26)
      grad.addColorStop(0, color)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(x - 30, midY - bandH / 2, 60, bandH)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, midY - bandH / 2)
      ctx.lineTo(x, midY + bandH / 2)
      ctx.stroke()
    }

    const draw = (now: number) => {
      const st = stateRef.current
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      if (st.running) st.t += dt

      const u0 = st.mach
      const c0 = 1
      const vR = u0 + c0
      const vL = u0 - c0
      const t = st.t

      const xR = cx + vR * BASE * t
      const xE = cx + u0 * BASE * t
      const xL = cx + vL * BASE * t

      // reset the loop once the fastest (right-going) signal leaves the frame
      if (xR > W + 30 || t > 12) st.t = 0

      ctx.clearRect(0, 0, W, H)

      // gas strip
      ctx.fillStyle = 'rgba(120,150,190,0.07)'
      ctx.fillRect(0, midY - bandH / 2, W, bandH)

      // upstream (left of source) shading: reachable region between xL and cx
      const leftReach = Math.min(xL, cx)
      if (leftReach < cx) {
        ctx.fillStyle = 'rgba(88,209,255,0.10)'
        ctx.fillRect(leftReach, midY - bandH / 2, cx - leftReach, bandH)
      }

      // source line
      ctx.strokeStyle = 'rgba(200,210,230,0.5)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, midY - bandH / 2 - 8)
      ctx.lineTo(cx, midY + bandH / 2 + 8)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(200,210,230,0.7)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('source x₀', cx, midY + bandH / 2 + 22)

      // the three signals
      pulse(ctx, xL, 'rgba(88,209,255,0.85)') // left sound  C-
      pulse(ctx, xE, 'rgba(226,120,232,0.85)') // entropy    C0
      pulse(ctx, xR, 'rgba(255,178,84,0.9)') // right sound  C+

      // labels for each signal
      ctx.font = '11px system-ui, sans-serif'
      const tag = (x: number, top: string, sub: string, color: string) => {
        if (x < -20 || x > W + 20) return
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.fillText(top, x, midY - bandH / 2 - 10)
        ctx.fillStyle = 'rgba(180,190,210,0.85)'
        ctx.fillText(sub, x, midY - bandH / 2 - 24)
      }
      tag(xL, 'C−  u₀−c₀', vL.toFixed(2), 'rgba(88,209,255,0.95)')
      tag(xR, 'C+  u₀+c₀', vR.toFixed(2), 'rgba(255,178,84,0.95)')
      tag(xE, 'C₀  u₀', u0.toFixed(2), 'rgba(226,120,232,0.95)')

      // regime badge
      const sup = u0 > 1 + 1e-9
      ctx.textAlign = 'left'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillStyle = sup ? 'rgba(255,140,120,0.95)' : 'rgba(120,220,160,0.95)'
      ctx.fillText(
        `M = ${u0.toFixed(2)}  →  ${sup ? '超音速: no upstream signal' : 'subsonic: reaches upstream'}`,
        14,
        22,
      )

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        border: '1px solid #2b3550',
        borderRadius: 12,
        padding: 16,
        background: 'linear-gradient(160deg,#0d1424,#131c30)',
        color: '#dce4f5',
        maxWidth: 660,
        margin: '1.5rem auto',
      }}
    >
      <canvas ref={canvasRef} width={620} height={230} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label style={{ flex: '1 1 260px' }}>
          background flow u&#8320; (Mach, c&#8320;=1) = {mach.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2.2}
            step={0.02}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid #44506e',
            background: running ? '#1c2540' : '#243356',
            color: '#dce4f5',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8a93a0', margin: '8px 2px 0' }}>
        The blue tint marks the upstream region the left-going sound has reached. Push u&#8320; past 1 and the blue tint
        vanishes: the C&#8722; signal now has a positive speed, so every signal runs downstream and the source can no
        longer talk to what lies upstream.
      </p>
    </div>
  )
}
