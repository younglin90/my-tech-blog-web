'use client'
import { useEffect, useRef, useState } from 'react'

// 1D linear acoustic FDTD on a staggered grid (Ballout et al. 2025, eq. 5).
//   dp/dt = -rho c^2 (du/dx)   ,   du/dt = -(1/rho)(dp/dx)
// A right-going Gaussian pulse hits a diffuse interface (tanh) separating
// two media. Part of it transmits, part reflects, exactly as the analytic
// impedance theory predicts: R = (z2-z1)/(z1+z2), T = 2 z2/(z1+z2).

const N = 420 // grid points
const L = 4.0 // domain length [m]
const DX = L / N
const X0 = -0.55 // pulse launch position (paper section 4.1)
const PULSE_W = 0.12 // pulse half-width [m]

function impedance(rho: number, c: number) {
  return rho * c
}

// tanh concentration profile centered at x = 0 (paper eq. 32)
function concentration(x: number, eps: number) {
  return 1.0 - 0.5 * (1 + Math.tanh((2 * x) / eps))
}

export function AcousticImpedanceTube1D() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [csRatio, setCsRatio] = useState(1.8) // c2 / c1
  const [rhoRatio, setRhoRatio] = useState(2.5) // rho2 / rho1
  const [eps, setEps] = useState(0.06) // interface width
  const [running, setRunning] = useState(true)

  // live readout (analytic coefficients) shown next to the canvas
  const z1 = impedance(1.0, 1.0)
  const z2 = impedance(rhoRatio, csRatio)
  const R = (z2 - z1) / (z1 + z2)
  const T = (2 * z2) / (z1 + z2)

  // simulation state kept in refs so it survives re-renders
  const state = useRef({ p: new Float32Array(N), u: new Float32Array(N), t: 0 })

  // reset whenever the medium parameters change
  useEffect(() => {
    const p = new Float32Array(N)
    const u = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + (i + 0.5) * DX
      const g = Math.exp(-((x - X0) * (x - X0)) / (PULSE_W * PULSE_W))
      p[i] = g
      // right-going characteristic in medium 1: u = p / (rho1 c1) = p
      u[i] = g
    }
    state.current = { p, u, t: 0 }
  }, [csRatio, rhoRatio, eps])

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = 600
    const H = 280
    cvs.width = W * dpr
    cvs.height = H * dpr
    cvs.style.width = W + 'px'
    cvs.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    // precompute per-cell density & sound speed from the tanh interface
    const rho = new Float32Array(N)
    const cs = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + (i + 0.5) * DX
      const c = concentration(x, eps) // 1 in medium 1, 0 in medium 2
      rho[i] = 1.0 * c + rhoRatio * (1 - c)
      cs[i] = 1.0 * c + csRatio * (1 - c)
    }
    const cmax = Math.max(1.0, csRatio)
    const dt = (0.4 * DX) / cmax // CFL-limited time step
    const SUB = 6 // substeps per frame

    let raf = 0
    const step = () => {
      const s = state.current
      const { p, u } = s
      for (let n = 0; n < SUB; n++) {
        // update velocity at interior half nodes
        for (let i = 0; i < N - 1; i++) {
          const rhoFace = 0.5 * (rho[i] + rho[i + 1])
          u[i] += (-dt / (rhoFace * DX)) * (p[i + 1] - p[i])
        }
        // update pressure
        for (let i = 1; i < N; i++) {
          const K = rho[i] * cs[i] * cs[i] // bulk modulus rho c^2
          p[i] += (-dt * K) / DX * (u[i] - u[i - 1])
        }
        s.t += dt
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H)
      const mid = N / 2
      // medium backgrounds
      ctx.fillStyle = 'rgba(34,211,238,0.06)'
      ctx.fillRect(0, 0, (mid / N) * W, H)
      ctx.fillStyle = 'rgba(14,116,144,0.16)'
      ctx.fillRect((mid / N) * W, 0, W - (mid / N) * W, H)
      // interface line
      ctx.strokeStyle = 'rgba(226,232,240,0.45)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo((mid / N) * W, 0)
      ctx.lineTo((mid / N) * W, H)
      ctx.stroke()
      ctx.setLineDash([])
      // zero axis
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.beginPath()
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()
      // pressure field
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * W
        const y = H / 2 - p[i] * (H * 0.36)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // labels
      ctx.fillStyle = 'rgba(148,163,184,0.9)'
      ctx.font = '12px sans-serif'
      ctx.fillText('medium 1 (z1)', 10, 18)
      ctx.fillText('medium 2 (z2)', W - 100, 18)

      if (running) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [csRatio, rhoRatio, eps, running])

  const fire = () => {
    const p = new Float32Array(N)
    const u = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + (i + 0.5) * DX
      const g = Math.exp(-((x - X0) * (x - X0)) / (PULSE_W * PULSE_W))
      p[i] = g
      u[i] = g
    }
    state.current = { p, u, t: 0 }
    setRunning(true)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, margin: '1.5rem 0', background: 'var(--surface)' }}>
      <canvas ref={ref} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
        <label style={{ fontSize: 13 }}>
          sound speed ratio c2/c1: <strong>{csRatio.toFixed(2)}</strong>
          <input type="range" min={0.3} max={4} step={0.05} value={csRatio} onChange={(e) => setCsRatio(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ fontSize: 13 }}>
          density ratio ρ2/ρ1: <strong>{rhoRatio.toFixed(2)}</strong>
          <input type="range" min={0.3} max={6} step={0.05} value={rhoRatio} onChange={(e) => setRhoRatio(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ fontSize: 13 }}>
          interface width ε: <strong>{eps.toFixed(3)}</strong>
          <input type="range" min={0.01} max={0.3} step={0.01} value={eps} onChange={(e) => setEps(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap', fontSize: 13 }}>
        <button onClick={fire} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>
          ▶ fire pulse
        </button>
        <span>z1 = <strong>{z1.toFixed(2)}</strong></span>
        <span>z2 = <strong>{z2.toFixed(2)}</strong></span>
        <span style={{ color: 'var(--accent)' }}>R = <strong>{R.toFixed(3)}</strong></span>
        <span style={{ color: 'var(--accent)' }}>T = <strong>{T.toFixed(3)}</strong></span>
      </div>
    </div>
  )
}
