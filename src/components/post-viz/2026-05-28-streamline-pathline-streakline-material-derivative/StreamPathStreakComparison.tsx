'use client'

import { useEffect, useRef, useState } from 'react'

// Unsteady flow field used throughout the post:
//   u = U                       (constant streamwise speed)
//   v = V0 * cos(omega*t - k*x) (transverse wave traveling downstream, k = omega/U)
// For this field the three curves through the origin are analytically distinct:
//   streamline (snapshot)  -> sine in x
//   pathline   (one parcel)-> straight line
//   streakline (dye trace) -> traveling wave
export function StreamPathStreakComparison() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [V0, setV0] = useState(0.55)
  const [omega, setOmega] = useState(2.2)
  const [running, setRunning] = useState(true)

  const paramsRef = useRef({ V0, omega, running })
  useEffect(() => {
    paramsRef.current = { V0, omega, running }
  }, [V0, omega, running])

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

    const U = 1
    const xMax = 10
    const yMax = 2.2
    const padL = 40
    const padR = 14
    const padT = 14
    const padB = 26
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const sx = (x: number) => padL + (x / xMax) * plotW
    const sy = (y: number) => padT + plotH / 2 - (y / yMax) * (plotH / 2)

    // dye parcels emitted from the origin for the streakline + a tracked parcel for the pathline
    type Parcel = { x: number; y: number; born: number }
    let dye: Parcel[] = []
    let pathTrail: { x: number; y: number }[] = []
    let tracked: Parcel | null = null

    let raf = 0
    let t = 0
    let last = performance.now()
    let emitAcc = 0

    const frame = (now: number) => {
      const realDt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { V0: A, omega: w, running: run } = paramsRef.current
      const k = w / U
      const dt = run ? realDt : 0
      t += dt

      const vAt = (x: number, tt: number) => A * Math.cos(w * tt - k * x)

      // advect dye parcels (forward Euler) -> envelope is the streakline
      if (run) {
        emitAcc += dt
        const emitEvery = 0.02
        while (emitAcc > emitEvery) {
          emitAcc -= emitEvery
          dye.push({ x: 0, y: 0, born: t })
        }
        for (const p of dye) {
          p.x += U * dt
          p.y += vAt(p.x, t) * dt
        }
        dye = dye.filter((p) => p.x <= xMax)

        // tracked parcel -> its trail is the pathline
        if (!tracked) {
          tracked = { x: 0, y: 0, born: t }
          pathTrail = [{ x: 0, y: 0 }]
        }
        tracked.x += U * dt
        tracked.y += vAt(tracked.x, t) * dt
        pathTrail.push({ x: tracked.x, y: tracked.y })
        if (tracked.x > xMax) {
          tracked = { x: 0, y: 0, born: t }
          pathTrail = [{ x: 0, y: 0 }]
        }
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1422'
      ctx.fillRect(0, 0, W, H)

      // axes
      ctx.strokeStyle = 'rgba(148,163,184,0.30)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, sy(0))
      ctx.lineTo(W - padR, sy(0))
      ctx.moveTo(padL, padT)
      ctx.lineTo(padL, H - padB)
      ctx.stroke()
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('x  (downstream)', W - 120, sy(0) + 16)

      // nozzle marker at origin
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(sx(0) - 4, sy(0) - 4, 8, 8)

      // STREAMLINE through origin at instant t (analytic snapshot, amber)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let x = 0; x <= xMax; x += 0.04) {
        // dy/dx = v/u = (A/U) cos(w t - k x) -> y(x) = (A/w)[sin(w t) - sin(w t - k x)]
        const y = (A / w) * (Math.sin(w * t) - Math.sin(w * t - k * x))
        if (x === 0) ctx.moveTo(sx(x), sy(y))
        else ctx.lineTo(sx(x), sy(y))
      }
      ctx.stroke()

      // STREAKLINE = current dye parcels (cyan dots + line)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      const ordered = [...dye].sort((a, b) => a.x - b.x)
      ordered.forEach((p, i) => {
        if (i === 0) ctx.moveTo(sx(p.x), sy(p.y))
        else ctx.lineTo(sx(p.x), sy(p.y))
      })
      ctx.stroke()
      ctx.fillStyle = 'rgba(34,211,238,0.9)'
      for (const p of ordered) {
        ctx.beginPath()
        ctx.arc(sx(p.x), sy(p.y), 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // PATHLINE = trail of the tracked parcel (magenta)
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      pathTrail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(sx(p.x), sy(p.y))
        else ctx.lineTo(sx(p.x), sy(p.y))
      })
      ctx.stroke()
      if (tracked) {
        ctx.fillStyle = '#f472b6'
        ctx.beginPath()
        ctx.arc(sx(tracked.x), sy(tracked.y), 3.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // legend
      const leg = [
        ['streamline (snapshot)', '#fbbf24'],
        ['pathline (one parcel)', '#f472b6'],
        ['streakline (dye)', '#22d3ee'],
      ] as const
      ctx.font = '12px ui-monospace, monospace'
      leg.forEach((l, i) => {
        const yy = padT + 6 + i * 16
        ctx.fillStyle = l[1]
        ctx.fillRect(padL + 6, yy, 12, 4)
        ctx.fillStyle = 'rgba(226,232,240,0.92)'
        ctx.fillText(l[0], padL + 24, yy + 5)
      })

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
      <canvas ref={canvasRef} style={{ width: '100%', height: 320, display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>transverse amplitude V₀ = {V0.toFixed(2)}</span>
          <input type="range" min={0} max={0.9} step={0.01} value={V0}
                 onChange={e => setV0(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>frequency ω = {omega.toFixed(1)}</span>
          <input type="range" min={0.4} max={4} step={0.1} value={omega}
                 onChange={e => setOmega(parseFloat(e.target.value))} />
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
        Field: u = U, v = V₀·cos(ωt − kx) with k = ω/U. Drag V₀ to 0 and the three curves collapse onto
        the axis — they only ever agree when the flow is steady.
      </p>
    </div>
  )
}
