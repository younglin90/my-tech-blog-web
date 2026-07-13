'use client'

import { useEffect, useRef, useState } from 'react'

// Kelvin-Helmholtz roll-up of a perturbed vortex sheet between two shearing
// streams. We track N markers along the sheet and move them with the
// desingularized periodic Biot-Savart kernel (Krasny 1986):
//
//   u = -(G/2) * sinh(2 pi dy) / (cosh(2 pi dy) - cos(2 pi dx) + delta^2)
//   v =  (G/2) * sin(2 pi dx)  / (cosh(2 pi dy) - cos(2 pi dx) + delta^2)
//
// summed over every marker (domain periodic in x with period 1). A sinusoidal
// bump grows, then wraps the sheet into the cat's-eye billows you see in
// wave-cloud photographs. The smoothing length delta keeps the sheet from
// forming a singularity so the simulation stays finite.

const N = 72
const DELTA = 0.07

export function KelvinHelmholtzRollup() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const xRef = useRef<Float64Array>(new Float64Array(N))
  const yRef = useRef<Float64Array>(new Float64Array(N))
  const s0Ref = useRef<Float64Array>(new Float64Array(N)) // birth order, for coloring

  const [billows, setBillows] = useState(2) // wavelengths across the box
  const [shear, setShear] = useState(1.0) // relative slip speed (scales circulation)
  const [amp, setAmp] = useState(0.03) // initial bump amplitude
  const [running, setRunning] = useState(true)

  const billowsRef = useRef(billows)
  const shearRef = useRef(shear)
  billowsRef.current = billows
  shearRef.current = shear

  const seed = () => {
    const x = xRef.current
    const y = yRef.current
    const s0 = s0Ref.current
    for (let j = 0; j < N; j++) {
      const xj = (j + 0.5) / N
      x[j] = xj
      y[j] = amp * Math.sin(2 * Math.PI * billowsRef.current * xj)
      s0[j] = xj
    }
  }

  // reseed when amplitude or billow count changes
  useEffect(() => {
    seed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amp, billows])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    const vel = (x: Float64Array, y: Float64Array, out: Float64Array) => {
      const G = shearRef.current / N
      const TWOPI = 2 * Math.PI
      for (let j = 0; j < N; j++) {
        let u = 0
        let v = 0
        const xj = x[j]
        const yj = y[j]
        for (let k = 0; k < N; k++) {
          const dx = xj - x[k]
          const dy = yj - y[k]
          const den = Math.cosh(TWOPI * dy) - Math.cos(TWOPI * dx) + DELTA * DELTA
          u += -G * Math.sinh(TWOPI * dy) / (2 * den)
          v += G * Math.sin(TWOPI * dx) / (2 * den)
        }
        out[2 * j] = u
        out[2 * j + 1] = v
      }
    }

    const tmp = new Float64Array(2 * N)
    const xm = new Float64Array(N)
    const ym = new Float64Array(N)
    const dt = 0.004

    const advance = () => {
      const x = xRef.current
      const y = yRef.current
      // RK2 (midpoint)
      vel(x, y, tmp)
      for (let j = 0; j < N; j++) {
        xm[j] = x[j] + 0.5 * dt * tmp[2 * j]
        ym[j] = y[j] + 0.5 * dt * tmp[2 * j + 1]
      }
      vel(xm, ym, tmp)
      for (let j = 0; j < N; j++) {
        let nx = x[j] + dt * tmp[2 * j]
        nx = nx - Math.floor(nx) // wrap into [0,1)
        x[j] = nx
        y[j] = y[j] + dt * tmp[2 * j + 1]
      }
    }

    const draw = () => {
      const x = xRef.current
      const y = yRef.current
      const s0 = s0Ref.current
      // background: upper stream drifting right (warm), lower stream left (cool)
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#3a1030')
      g.addColorStop(0.5, '#241826')
      g.addColorStop(1, '#0e1c30')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      const yScale = H * 0.9
      const y0 = H / 2
      const toPx = (xx: number, yy: number, ox: number) => [
        (xx + ox) * (W / 2),
        y0 - yy * yScale,
      ]

      // draw the sheet twice side by side so the periodicity reads clearly
      for (let tile = 0; tile < 2; tile++) {
        const ox = tile
        for (let j = 0; j < N; j++) {
          const k = (j + 1) % N
          const dxWrap = Math.abs(x[k] - x[j])
          if (dxWrap > 0.5) continue // skip the seam
          const [ax, ay] = toPx(x[j], y[j], ox)
          const [bx, by] = toPx(x[k], y[k], ox)
          const c = s0[j]
          ctx.strokeStyle = `hsl(${20 + c * 190}, 85%, 62%)`
          ctx.lineWidth = 2.4
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.stroke()
        }
        // markers
        for (let j = 0; j < N; j++) {
          const [ax, ay] = toPx(x[j], y[j], ox)
          ctx.fillStyle = `hsl(${20 + s0[j] * 190}, 85%, 70%)`
          ctx.beginPath()
          ctx.arc(ax, ay, 1.6, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }

    const loop = () => {
      if (running) {
        for (let s = 0; s < 3; s++) advance()
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'system-ui, sans-serif' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        style={{
          width: '100%',
          maxWidth: 640,
          height: 'auto',
          borderRadius: 10,
          display: 'block',
          background: '#0e1c30',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', fontSize: 13, color: '#c9d3e0', alignItems: 'center' }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={btn}
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => { seed(); }} style={btn}>↺ Reset</button>
        <label style={lab}>
          Billows: {billows}
          <input type="range" min={1} max={4} step={1} value={billows} onChange={(e) => setBillows(+e.target.value)} />
        </label>
        <label style={lab}>
          Shear ΔU: {shear.toFixed(1)}
          <input type="range" min={0.3} max={2.0} step={0.1} value={shear} onChange={(e) => setShear(+e.target.value)} />
        </label>
        <label style={lab}>
          Bump: {amp.toFixed(2)}
          <input type="range" min={0.01} max={0.08} step={0.01} value={amp} onChange={(e) => setAmp(+e.target.value)} />
        </label>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  background: '#2b3a52',
  color: '#e6ecf4',
  border: '1px solid #3d5170',
  borderRadius: 7,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: 13,
}

const lab: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}
