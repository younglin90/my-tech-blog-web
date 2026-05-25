'use client'

import { useEffect, useRef, useState } from 'react'

export function JetInCrossflowTrajectory() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [r, setR] = useState(4)
  const [B, setB] = useState(0.33)
  const [speed, setSpeed] = useState(1.0)
  const [showGhosts, setShowGhosts] = useState(true)

  const paramsRef = useRef({ r, B, speed, showGhosts })
  useEffect(() => {
    paramsRef.current = { r, B, speed, showGhosts }
  }, [r, B, speed, showGhosts])

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

    const A = 1.6
    const d = 1
    const xMax = 24
    const zMax = 16
    const padL = 46
    const padB = 28
    const padT = 14
    const padR = 14
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const sx = (x: number) => padL + (x / xMax) * plotW
    const sz = (z: number) => H - padB - (Math.min(z, zMax) / zMax) * plotH

    const traj = (x: number, rr: number, bb: number) => {
      const rd = rr * d
      if (x <= 0 || rd <= 0) return 0
      return A * rd * Math.pow(x / rd, bb)
    }

    type P = { x: number; off: number; life: number }
    const N = 260
    const parts: P[] = []
    for (let i = 0; i < N; i++) {
      parts.push({ x: Math.random() * xMax, off: Math.random() - 0.5, life: Math.random() })
    }

    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { r: rr, B: bb, speed: sp, showGhosts: ghosts } = paramsRef.current

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1422'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, padT)
      ctx.lineTo(padL, H - padB)
      ctx.lineTo(W - padR, H - padB)
      ctx.stroke()

      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('x / d  (downstream)', W - 150, H - padB + 18)
      ctx.save()
      ctx.translate(15, padT + 92)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('z / d  (height)', 0, 0)
      ctx.restore()

      ctx.strokeStyle = 'rgba(56,189,248,0.16)'
      for (let yy = 1; yy <= 4; yy++) {
        const z = (zMax * yy) / 5
        ctx.beginPath()
        ctx.moveTo(sx(0.4), sz(z))
        ctx.lineTo(sx(2.2), sz(z))
        ctx.stroke()
      }

      if (ghosts) {
        ctx.strokeStyle = 'rgba(244,114,182,0.28)'
        ctx.lineWidth = 1
        for (const rg of [2, 6, 10]) {
          ctx.beginPath()
          for (let x = 0; x <= xMax; x += 0.2) {
            const z = traj(x, rg, bb)
            if (x === 0) ctx.moveTo(sx(x), sz(z))
            else ctx.lineTo(sx(x), sz(z))
          }
          ctx.stroke()
        }
      }

      for (const p of parts) {
        p.x += sp * 3.2 * dt * (0.6 + 0.8 * p.life)
        p.life += dt * 0.25
        if (p.x > xMax || p.life > 1.4) {
          p.x = Math.random() * 0.5
          p.off = Math.random() - 0.5
          p.life = 0
        }
        const z = traj(p.x, rr, bb)
        const spread = 0.25 + 0.5 * Math.sqrt(Math.max(0, p.x))
        const zz = z + p.off * spread
        const a = Math.max(0, 0.85 - p.life * 0.6)
        ctx.fillStyle = `rgba(226,232,240,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(sx(p.x), sz(zz), 1.7, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x <= xMax; x += 0.15) {
        const z = traj(x, rr, bb)
        if (x === 0) ctx.moveTo(sx(x), sz(z))
        else ctx.lineTo(sx(x), sz(z))
      }
      ctx.stroke()

      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(sx(0) - 5, H - padB - 4, 10, 8)

      ctx.fillStyle = 'rgba(226,232,240,0.92)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`z/(rd) = ${A} (x/(rd))^${bb.toFixed(2)}   r = v_j/u = ${rr.toFixed(1)}`, padL + 6, padT + 14)

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
      <canvas ref={canvasRef} style={{ width: '100%', height: 340, display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Velocity ratio r = {r.toFixed(1)}</span>
          <input type="range" min={1} max={10} step={0.5} value={r}
                 onChange={e => setR(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Power-law exponent B = {B.toFixed(2)}</span>
          <input type="range" min={0.25} max={0.4} step={0.01} value={B}
                 onChange={e => setB(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Crossflow speed = {speed.toFixed(1)}</span>
          <input type="range" min={0.2} max={2.0} step={0.1} value={speed}
                 onChange={e => setSpeed(parseFloat(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <button
            onClick={() => setShowGhosts(g => !g)}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: showGhosts ? 'var(--accent)' : 'transparent',
              color: showGhosts ? '#0b1422' : 'var(--text)',
              cursor: 'pointer',
              fontSize: 12
            }}>
            r = 2 / 6 / 10 ghosts
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        The natural length scale is r·d, not d alone. Raise r and the plume punches higher before the
        crossflow bends it; the three pink ghosts are the trajectories for r = 2, 6, 10.
      </p>
    </div>
  )
}
