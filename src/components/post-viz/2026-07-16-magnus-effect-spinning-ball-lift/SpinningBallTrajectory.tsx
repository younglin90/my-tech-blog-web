'use client'

import { useEffect, useRef, useState } from 'react'

// Top-down flight of a spinning ball. The velocity vector v feels three forces:
// drag opposite to motion, and a Magnus force perpendicular to v whose sign
// follows the spin. In 2D top view the perpendicular of v = (vx, vy) is
// (-vy, vx), so the lateral acceleration is
//
//   a_magnus = Cm * spin * |v| * (-vy, vx) / |v|      (turns the path sideways)
//   a_drag   = -Cd * |v| * (vx, vy)
//
// A straight dashed line marks where a non-spinning ball (same launch, same
// drag) would go. Sweep the spin from left to right and watch the arc flip and
// the sideways miss distance grow.

function integrate(U0: number, spin: number, Cm: number, Cd: number) {
  const path: [number, number][] = []
  let x = 0
  let y = 0
  let vx = U0
  let vy = 0
  const dt = 0.012
  for (let i = 0; i < 900; i++) {
    const sp = Math.hypot(vx, vy) || 1e-6
    const axM = Cm * spin * (-vy)
    const ayM = Cm * spin * vx
    const axD = -Cd * sp * vx
    const ayD = -Cd * sp * vy
    vx += (axM + axD) * dt
    vy += (ayM + ayD) * dt
    x += vx * dt
    y += vy * dt
    path.push([x, y])
    if (x > 30) break
  }
  return path
}

export function SpinningBallTrajectory() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const [spin, setSpin] = useState(1.4) // + curves one way, - the other
  const [speed, setSpeed] = useState(14)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    const Cm = 0.16
    const Cd = 0.006
    const curved = integrate(speed, spin, Cm, Cd)
    const straight = integrate(speed, 0, Cm, Cd)

    // fit to canvas
    let xMax = 1
    let yAbs = 1
    for (const [x, y] of curved.concat(straight)) {
      if (x > xMax) xMax = x
      if (Math.abs(y) > yAbs) yAbs = Math.abs(y)
    }
    yAbs = Math.max(yAbs, xMax * 0.28)
    const padX = 40
    const padY = 24
    const sx = (W - 2 * padX) / xMax
    const sy = (H - 2 * padY) / (2 * yAbs)
    const toPix = (x: number, y: number): [number, number] => [padX + x * sx, H / 2 - y * sy]

    let frame = 0
    const draw = () => {
      ctx.fillStyle = '#111722'
      ctx.fillRect(0, 0, W, H)

      // center line (launch axis)
      ctx.strokeStyle = '#2a3546'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padX, H / 2)
      ctx.lineTo(W - padX, H / 2)
      ctx.stroke()

      // straight reference (no spin)
      ctx.strokeStyle = '#5b6b86'
      ctx.setLineDash([6, 5])
      ctx.lineWidth = 1.6
      ctx.beginPath()
      straight.forEach(([x, y], i) => {
        const [px, py] = toPix(x, y)
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // curved path grows in
      const nShow = Math.min(curved.length, Math.floor(frame * 6))
      ctx.strokeStyle = '#3fb6ff'
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let i = 0; i < nShow; i++) {
        const [px, py] = toPix(curved[i][0], curved[i][1])
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()

      // moving ball
      if (nShow > 0) {
        const [bx, by] = toPix(curved[nShow - 1][0], curved[nShow - 1][1])
        ctx.beginPath()
        ctx.arc(bx, by, 5, 0, 2 * Math.PI)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      }

      // miss distance annotation at the end
      const end = curved[curved.length - 1]
      const endStraight = straight[straight.length - 1]
      const [ex, ey] = toPix(end[0], end[1])
      const [, esy] = toPix(endStraight[0], endStraight[1])
      ctx.strokeStyle = '#ff5d73'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex, esy)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#ff8a98'
      ctx.font = '12px sans-serif'
      ctx.fillText(`sideways miss = ${Math.abs(end[1]).toFixed(1)} m`, 12, 20)
      ctx.fillStyle = '#8aa0c0'
      ctx.fillText('dashed = no spin', 12, H - 12)

      frame++
      if (nShow >= curved.length) frame = 0 // loop the reveal
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spin, speed])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={340}
        style={{ width: '100%', borderRadius: 10, background: '#111722', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.4rem', marginTop: '0.7rem' }}>
        <label style={{ fontSize: 13, color: '#c7d2e0' }}>
          Spin&nbsp;&nbsp;curve&nbsp;left&nbsp;
          <input
            type="range"
            min={-2.5}
            max={2.5}
            step={0.05}
            value={spin}
            onChange={(e) => setSpin(parseFloat(e.target.value))}
          />
          &nbsp;right&nbsp;<code>{spin.toFixed(2)}</code>
        </label>
        <label style={{ fontSize: 13, color: '#c7d2e0' }}>
          Launch speed&nbsp;
          <input
            type="range"
            min={6}
            max={26}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          &nbsp;<code>{speed.toFixed(1)} m/s</code>
        </label>
      </div>
    </div>
  )
}
