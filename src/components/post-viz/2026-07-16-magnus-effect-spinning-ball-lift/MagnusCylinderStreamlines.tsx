'use client'

import { useEffect, useRef, useState } from 'react'

// Potential-flow field around a spinning cylinder: uniform stream + doublet
// (the cylinder) + point vortex (the circulation from spin). For radius a,
// freestream U in +x, and circulation Gamma (counterclockwise positive):
//
//   u =  U (1 - a^2 (x^2 - y^2)/r^4)  -  Gamma y /(2 pi r^2)
//   v = -U (2 a^2 x y / r^4)          +  Gamma x /(2 pi r^2)
//
// Kutta-Joukowski gives the side force per unit span L = -rho U Gamma, so a
// clockwise circulation (Gamma < 0) pushes the cylinder in +y. We tie Gamma to
// the spin ratio S = a*omega/U through the viscous estimate Gamma = 2 pi a^2 omega.
// Drag the sliders and watch the streamlines crowd on one side while the
// stagnation points slide around the surface.

function velocity(x: number, y: number, U: number, gamma: number, a: number) {
  let r2 = x * x + y * y
  const a2 = a * a
  if (r2 < a2) r2 = a2 // clamp inside the body to avoid the singularity
  const r4 = r2 * r2
  const u = U * (1 - (a2 * (x * x - y * y)) / r4) - (gamma * y) / (2 * Math.PI * r2)
  const v = -U * ((2 * a2 * x * y) / r4) + (gamma * x) / (2 * Math.PI * r2)
  return [u, v]
}

function speedColor(sp: number, smax: number) {
  const t = Math.max(0, Math.min(1, sp / smax))
  // slow = deep blue, fast = warm yellow
  const r = Math.round(40 + t * 215)
  const g = Math.round(90 + t * 150)
  const b = Math.round(200 - t * 150)
  return `rgba(${r},${g},${b},0.9)`
}

export function MagnusCylinderStreamlines() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const [spin, setSpin] = useState(0.8) // -1 (topspin) .. +1 (backspin)
  const [speed, setSpeed] = useState(1) // freestream U

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    const a = 1 // physical radius
    const scale = 52 // px per unit length
    const cx = W * 0.4
    const cy = H / 2

    const Smax = 2.2
    const S = -spin * Smax // backspin (spin>0) => clockwise => Gamma<0 => lift +y
    const gamma = 2 * Math.PI * a * a * (S * speed) // Gamma = 2 pi a^2 omega, omega = S*U/a

    const toPix = (x: number, y: number) => [cx + x * scale, cy - y * scale]
    const toPhys = (px: number, py: number) => [(px - cx) / scale, (cy - py) / scale]

    // seed particles
    const N = 260
    type P = { x: number; y: number }
    const parts: P[] = []
    const xMinP = toPhys(0, 0)[0]
    const xMaxP = toPhys(W, 0)[0]
    const yTopP = toPhys(0, 0)[1]
    const yBotP = toPhys(0, H)[1]
    const respawn = (p: P) => {
      p.x = xMinP - 0.1
      p.y = yBotP + Math.random() * (yTopP - yBotP)
    }
    for (let i = 0; i < N; i++) {
      const p = { x: 0, y: 0 }
      p.x = xMinP + Math.random() * (xMaxP - xMinP)
      p.y = yBotP + Math.random() * (yTopP - yBotP)
      parts.push(p)
    }

    const dt = 0.05
    const smax = speed * (1.6 + Math.abs(S) * 0.9)

    const draw = () => {
      // faint trails for a streaky look
      ctx.fillStyle = 'rgba(17,23,34,0.28)'
      ctx.fillRect(0, 0, W, H)

      for (const p of parts) {
        const [u1, v1] = velocity(p.x, p.y, speed, gamma, a)
        // midpoint step for smoother lines
        const xm = p.x + u1 * dt * 0.5
        const ym = p.y + v1 * dt * 0.5
        const [u2, v2] = velocity(xm, ym, speed, gamma, a)
        p.x += u2 * dt
        p.y += v2 * dt
        const sp = Math.hypot(u2, v2)
        const [px, py] = toPix(p.x, p.y)
        const r = Math.hypot(p.x, p.y)
        if (p.x > xMaxP + 0.1 || p.y > yTopP + 0.2 || p.y < yBotP - 0.2 || r < a * 0.98) {
          respawn(p)
          continue
        }
        ctx.fillStyle = speedColor(sp, smax)
        ctx.fillRect(px - 1, py - 1, 2.4, 2.4)
      }

      // cylinder body
      ctx.beginPath()
      ctx.arc(cx, cy, a * scale, 0, 2 * Math.PI)
      ctx.fillStyle = '#1c2636'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#5b6b86'
      ctx.stroke()

      // rotation indicator (arc + arrow) — clockwise for backspin
      const spinDir = spin >= 0 ? -1 : 1 // canvas y-down: clockwise = negative sweep
      const t = (performance.now() / 500) % (2 * Math.PI)
      ctx.strokeStyle = '#e6b422'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(cx, cy, a * scale * 0.55, t, t + spinDir * 2.2, spinDir < 0)
      ctx.stroke()

      // Magnus force arrow
      const Fy = spin // sign of lift in +y
      if (Math.abs(Fy) > 0.02) {
        const len = 26 + Math.abs(Fy) * 46 * (0.5 + speed / 2)
        const dir = Fy > 0 ? -1 : 1 // +y lift => arrow up (canvas up = -y)
        ctx.strokeStyle = '#ff5d73'
        ctx.fillStyle = '#ff5d73'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx, cy + dir * len)
        ctx.stroke()
        ctx.beginPath()
        const ay = cy + dir * len
        ctx.moveTo(cx, ay + dir * -0)
        ctx.lineTo(cx - 6, ay - dir * -8)
        ctx.lineTo(cx + 6, ay - dir * -8)
        ctx.closePath()
        ctx.fill()
        ctx.font = '12px sans-serif'
        ctx.fillText('Magnus force', cx + 10, ay + dir * 4)
      }

      // freestream label
      ctx.fillStyle = '#8aa0c0'
      ctx.font = '12px sans-serif'
      ctx.fillText(`U = ${speed.toFixed(1)},  spin ratio S = ${Math.abs(S).toFixed(2)}`, 12, H - 12)

      rafRef.current = requestAnimationFrame(draw)
    }

    ctx.fillStyle = '#111722'
    ctx.fillRect(0, 0, W, H)
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spin, speed])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={380}
        style={{ width: '100%', borderRadius: 10, background: '#111722', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.4rem', marginTop: '0.7rem' }}>
        <label style={{ fontSize: 13, color: '#c7d2e0' }}>
          Spin&nbsp;&nbsp;topspin&nbsp;
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={spin}
            onChange={(e) => setSpin(parseFloat(e.target.value))}
          />
          &nbsp;backspin&nbsp;<code>{spin.toFixed(2)}</code>
        </label>
        <label style={{ fontSize: 13, color: '#c7d2e0' }}>
          Flow speed U&nbsp;
          <input
            type="range"
            min={0.4}
            max={2}
            step={0.05}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          &nbsp;<code>{speed.toFixed(2)}</code>
        </label>
      </div>
    </div>
  )
}
