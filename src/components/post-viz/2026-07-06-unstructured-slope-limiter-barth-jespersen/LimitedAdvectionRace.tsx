'use client'

import { useEffect, useRef, useState } from 'react'

// 1D linear advection of a composite profile (square + Gaussian) on a periodic grid.
// Three linear-reconstruction MUSCL schemes race:
//   - Unlimited (Fromm, central slope) -> dispersive overshoots near the jump
//   - Barth-Jespersen -> monotone, sharp
//   - Venkatakrishnan -> monotone, slightly smoother
const NX = 200
const A = 1.0 // advection speed
const CFL = 0.4
const DX = 1 / NX
const DT = (CFL * DX) / A

function initProfile(): Float64Array {
  const u = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    const x = (i + 0.5) / NX
    let v = 0
    if (x > 0.1 && x < 0.3) v = 1 // square wave
    v += Math.exp(-Math.pow((x - 0.65) / 0.06, 2)) // gaussian bump
    u[i] = v
  }
  return u
}

const wrap = (i: number) => (i + NX) % NX

type Mode = 'none' | 'bj' | 'venk'

// limited central slope for cell i
function slope(u: Float64Array, i: number, mode: Mode, K: number): number {
  const um = u[wrap(i - 1)]
  const up = u[wrap(i + 1)]
  const s = (up - um) / 2 // central slope (Fromm)
  if (mode === 'none') return s
  const umax = Math.max(u[i], um, up)
  const umin = Math.min(u[i], um, up)
  const dPlus = umax - u[i]
  const dMinus = umin - u[i]
  const eps2 = Math.pow(K * 1, 3)
  let phi = 1
  for (const du of [0.5 * s, -0.5 * s]) {
    let f: number
    if (mode === 'bj') {
      if (du > 1e-12) f = Math.min(1, dPlus / du)
      else if (du < -1e-12) f = Math.min(1, dMinus / du)
      else f = 1
    } else {
      if (Math.abs(du) < 1e-12) f = 1
      else {
        const d = du > 0 ? dPlus : dMinus
        f = (1 / du) * ((d * d + eps2) * du + 2 * du * du * d) / (d * d + 2 * du * du + d * du + eps2)
      }
    }
    phi = Math.min(phi, f)
  }
  return Math.max(0, Math.min(1, phi)) * s
}

// one SSP-RK2 step (upwind flux, a>0)
function rhs(u: Float64Array, mode: Mode, K: number): Float64Array {
  const uL = new Float64Array(NX) // left state at face i+1/2
  for (let i = 0; i < NX; i++) uL[i] = u[i] + 0.5 * slope(u, i, mode, K)
  const du = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    const fR = A * uL[i] // flux at i+1/2
    const fL = A * uL[wrap(i - 1)] // flux at i-1/2
    du[i] = -(fR - fL) / DX
  }
  return du
}

function step(u: Float64Array, mode: Mode, K: number): Float64Array {
  const k1 = rhs(u, mode, K)
  const u1 = new Float64Array(NX)
  for (let i = 0; i < NX; i++) u1[i] = u[i] + DT * k1[i]
  const k2 = rhs(u1, mode, K)
  const un = new Float64Array(NX)
  for (let i = 0; i < NX; i++) un[i] = 0.5 * (u[i] + u1[i] + DT * k2[i])
  return un
}

export function LimitedAdvectionRace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const fields = useRef<{ none: Float64Array; bj: Float64Array; venk: Float64Array }>({
    none: initProfile(),
    bj: initProfile(),
    venk: initProfile(),
  })
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(3)
  const [tick, setTick] = useState(0)
  const speedRef = useRef(speed)
  speedRef.current = speed

  const reset = () => {
    fields.current = { none: initProfile(), bj: initProfile(), venk: initProfile() }
    setTick(0)
    draw()
  }

  function draw() {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const W = cv.width
    const H = cv.height
    ctx.clearRect(0, 0, W, H)
    const px = (i: number) => (i / (NX - 1)) * W
    const py = (v: number) => H - 24 - ((v + 0.3) / 1.9) * (H - 44)

    // zero baseline
    ctx.strokeStyle = 'rgba(122,144,168,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, py(0))
    ctx.lineTo(W, py(0))
    ctx.stroke()

    const series: [Float64Array, string, number][] = [
      [fields.current.none, '#f87171', 1.4],
      [fields.current.venk, '#fbbf24', 1.8],
      [fields.current.bj, '#22d3ee', 2],
    ]
    for (const [u, color, lw] of series) {
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.beginPath()
      for (let i = 0; i < NX; i++) {
        const X = px(i)
        const Y = py(u[i])
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()
    }
  }

  useEffect(() => {
    let mounted = true
    const loop = () => {
      if (!mounted) return
      if (running) {
        const n = speedRef.current
        for (let s = 0; s < n; s++) {
          fields.current.none = step(fields.current.none, 'none', 0.3)
          fields.current.bj = step(fields.current.bj, 'bj', 0.3)
          fields.current.venk = step(fields.current.venk, 'venk', 0.3)
        }
        setTick((t) => t + n)
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const legend = (color: string, label: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text, #cdd9e5)' }}>
      <span style={{ width: 16, height: 3, background: color, display: 'inline-block', borderRadius: 2 }} />
      {label}
    </span>
  )

  return (
    <div
      style={{
        border: '1px solid var(--border, #2a3a4f)',
        borderRadius: 12,
        padding: 16,
        margin: '20px 0',
        background: 'var(--surface, #0d1826)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        {legend('#f87171', 'Unlimited (Fromm)')}
        {legend('#22d3ee', 'Barth–Jespersen')}
        {legend('#fbbf24', 'Venkatakrishnan')}
      </div>
      <canvas ref={canvasRef} width={560} height={240} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '6px 14px',
            borderRadius: 7,
            border: '1px solid var(--border, #2a3a4f)',
            background: 'var(--accent, #22d3ee)',
            color: '#08111f',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '6px 14px',
            borderRadius: 7,
            border: '1px solid var(--border, #2a3a4f)',
            background: 'transparent',
            color: 'var(--text, #cdd9e5)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <label style={{ fontSize: 13, color: 'var(--text, #cdd9e5)' }}>
          steps/frame: {speed}
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <span style={{ fontSize: 12, color: 'var(--text-muted, #7a90a8)' }}>t = {(tick * DT).toFixed(2)}</span>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted, #7a90a8)', margin: '10px 0 0' }}>
        Watch the trailing edge of the square wave: the unlimited scheme grows ripples below zero, while both limiters
        stay monotone.
      </p>
    </div>
  )
}
