'use client'

import { useEffect, useRef, useState } from 'react'

// A one-dimensional wave packet on the water surface:
//
//   eta(x,t) = envelope(x - c_g * t) * cos( k*x - omega*t )
//
// The Gaussian envelope travels at the GROUP speed c_g. The individual crests
// inside it travel at the PHASE speed c = omega/k. For deep-water gravity waves
// c_g = c/2, so crests run twice as fast as the lump they live in: each crest is
// born at the trailing edge, sprints forward through the packet, and dies at the
// leading edge. One crest is tagged with a dot so you can watch it overtake the
// envelope. The ratio slider sets c_g / c — pull it to 1 and phase and group lock
// together (a non-dispersive wave); pull it toward 0 and the crests race.

export function RipplePacketCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ratio, setRatio] = useState(0.5) // c_g / c  (0.5 = deep-water gravity waves)
  const [wavelength, setWavelength] = useState(46) // px per wave
  const [running, setRunning] = useState(true)
  const stateRef = useRef({ ratio: 0.5, wavelength: 46, running: true, t: 0 })

  useEffect(() => {
    stateRef.current.ratio = ratio
    stateRef.current.wavelength = wavelength
    stateRef.current.running = running
  }, [ratio, wavelength, running])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const mid = H * 0.52
    const amp = H * 0.24
    let raf = 0
    let last = 0

    const draw = (now: number) => {
      const st = stateRef.current
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      if (st.running) st.t += dt

      const k = (2 * Math.PI) / st.wavelength
      const cPhase = 90 // px/s, phase speed of the carrier
      const omega = cPhase * k
      const cg = st.ratio * cPhase
      const t = st.t

      // envelope centre wraps across the canvas
      const span = W + 260
      const centre = ((cg * t) % span) - 130
      const sigma = 78 // envelope width in px

      ctx.clearRect(0, 0, W, H)

      // still-water band
      ctx.fillStyle = 'rgba(90,160,220,0.08)'
      ctx.fillRect(0, mid - amp - 6, W, 2 * amp + 12)
      ctx.strokeStyle = 'rgba(120,150,190,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, mid)
      ctx.lineTo(W, mid)
      ctx.stroke()

      const envAt = (x: number) => Math.exp(-((x - centre) * (x - centre)) / (2 * sigma * sigma))

      // envelope outline (group)
      ctx.strokeStyle = 'rgba(255,143,176,0.55)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      for (let x = 0; x <= W; x += 3) {
        const e = envAt(x)
        ctx.lineTo(x, mid - amp * e)
      }
      ctx.stroke()
      ctx.beginPath()
      for (let x = 0; x <= W; x += 3) {
        const e = envAt(x)
        ctx.lineTo(x, mid + amp * e)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // the carrier wave modulated by the envelope
      ctx.strokeStyle = '#5ec8ff'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let x = 0; x <= W; x += 1.5) {
        const y = mid - amp * envAt(x) * Math.cos(k * x - omega * t)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // tag one crest: a crest sits where k*x - omega*t = 2*pi*n.
      // pick n so the crest stays near the packet, then mark it with a dot.
      const nCentre = Math.round((k * centre - omega * t) / (2 * Math.PI))
      const xCrest = (2 * Math.PI * nCentre + omega * t) / k
      if (xCrest >= 0 && xCrest <= W) {
        const y = mid - amp * envAt(xCrest)
        ctx.fillStyle = '#ffd24a'
        ctx.beginPath()
        ctx.arc(xCrest, y, 5.5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.strokeStyle = '#0d1424'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // labels
      ctx.fillStyle = 'rgba(255,143,176,0.9)'
      ctx.font = '12px system-ui, sans-serif'
      const cx = Math.max(10, Math.min(W - 130, centre))
      ctx.fillText('envelope → group speed', cx - 60, mid + amp + 26)
      ctx.fillStyle = '#ffd24a'
      ctx.fillText('one crest → phase speed', 12, 20)

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
      <canvas ref={canvasRef} width={620} height={240} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label style={{ flex: '1 1 220px' }}>
          group / phase ratio c_g/c = {ratio.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={ratio}
            onChange={(e) => setRatio(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ flex: '1 1 220px' }}>
          carrier wavelength = {wavelength} px
          <input
            type="range"
            min={22}
            max={80}
            step={1}
            value={wavelength}
            onChange={(e) => setWavelength(parseInt(e.target.value))}
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
        At c_g/c = 0.5 (deep-water gravity waves) the yellow crest clearly outruns the pink envelope and fades at the
        front. Set the ratio to 1 and the crest freezes inside the lump — nothing disperses.
      </p>
    </div>
  )
}
