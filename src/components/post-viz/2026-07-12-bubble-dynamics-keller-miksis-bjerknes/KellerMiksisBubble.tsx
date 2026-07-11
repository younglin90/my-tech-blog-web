'use client'

import { useEffect, useRef, useState } from 'react'

// Physical constants (SI, water at ~20 C)
const P0 = 1.0e5 // ambient pressure [Pa]
const RHO = 998 // liquid density [kg/m^3]
const SIGMA = 0.0725 // surface tension [N/m]
const MU = 1.0e-3 // liquid dynamic viscosity [Pa s]
const C = 1481 // sound speed in water [m/s]
const KAPPA = 1.4 // polytropic exponent of the gas

type Mode = 'km' | 'rp'

// Right-hand side of the radial-dynamics ODE.
// state: R [m], V = dR/dt [m/s]. Returns acceleration d2R/dt2 [m/s^2].
function accel(R: number, V: number, t: number, pA: number, f: number, RE: number, mode: Mode) {
  const pG0 = P0 + (2 * SIGMA) / RE
  const pG = pG0 * Math.pow(RE / R, 3 * KAPPA)
  const pL = pG - (2 * SIGMA) / R - (4 * MU * V) / R
  const w = 2 * Math.PI * f
  const pInf = P0 - pA * Math.sin(w * t)

  if (mode === 'rp') {
    // Rayleigh-Plesset (incompressible liquid, c -> infinity)
    return ((pL - pInf) / RHO - 1.5 * V * V) / R
  }

  // Keller-Miksis (first-order liquid compressibility)
  // d/dt(pL - pInf), with the R-ddot part moved to the left-hand side.
  const dpGdt = (-3 * KAPPA * pG * V) / R
  const dPidt =
    dpGdt + (2 * SIGMA * V) / (R * R) + (4 * MU * V * V) / (R * R) + pA * w * Math.cos(w * t)
  const num =
    -1.5 * (1 - V / (3 * C)) * V * V +
    ((1 + V / C) * (pL - pInf)) / RHO +
    (R * dPidt) / (RHO * C)
  const den = (1 - V / C) * R + (4 * MU) / (RHO * C)
  return num / den
}

function step(
  s: { R: number; V: number },
  t: number,
  dt: number,
  pA: number,
  f: number,
  RE: number,
  mode: Mode,
) {
  const a1 = accel(s.R, s.V, t, pA, f, RE, mode)
  const R2 = s.R + 0.5 * dt * s.V
  const V2 = s.V + 0.5 * dt * a1
  const a2 = accel(R2, V2, t + 0.5 * dt, pA, f, RE, mode)
  const R3 = s.R + 0.5 * dt * V2
  const V3 = s.V + 0.5 * dt * a2
  const a3 = accel(R3, V3, t + 0.5 * dt, pA, f, RE, mode)
  const R4 = s.R + dt * V3
  const V4 = s.V + dt * a3
  const a4 = accel(R4, V4, t + dt, pA, f, RE, mode)
  let R = s.R + (dt / 6) * (s.V + 2 * V2 + 2 * V3 + V4)
  const V = s.V + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4)
  // Clamp deep collapse to keep the integrator stable in the demo.
  if (R < 0.12 * RE) R = 0.12 * RE
  return { R, V }
}

export function KellerMiksisBubble() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pA, setPA] = useState(1.2) // driving amplitude [atm]
  const [fkHz, setFkHz] = useState(60) // driving frequency [kHz]
  const [reUm, setReUm] = useState(5) // equilibrium radius [um]
  const [mode, setMode] = useState<Mode>('km')
  const [running, setRunning] = useState(true)

  const stateRef = useRef({ R: reUm * 1e-6, V: 0, t: 0 })
  const traceRef = useRef<number[]>([])
  const rmaxRef = useRef(1.5)

  // Reset when parameters change.
  useEffect(() => {
    stateRef.current = { R: reUm * 1e-6, V: 0, t: 0 }
    traceRef.current = []
    rmaxRef.current = 1.5
  }, [pA, fkHz, reUm, mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const RE = reUm * 1e-6
    const f = fkHz * 1e3
    const pApa = pA * 1e5
    const dt = 0.5e-9 // 0.5 ns
    const advancePerFrame = 40e-9 // simulate 40 ns per frame
    const stepsPerFrame = Math.round(advancePerFrame / dt)
    const window = 220 // trace samples kept

    const render = () => {
      const w = canvas.width
      const h = canvas.height
      if (running) {
        for (let i = 0; i < stepsPerFrame; i++) {
          const s = stateRef.current
          const ns = step(s, s.t, dt, pApa, f, RE, mode)
          stateRef.current = { R: ns.R, V: ns.V, t: s.t + dt }
        }
        const ratio = stateRef.current.R / RE
        traceRef.current.push(ratio)
        if (traceRef.current.length > window) traceRef.current.shift()
        rmaxRef.current = Math.max(rmaxRef.current, ratio * 1.1)
      }

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1020'
      ctx.fillRect(0, 0, w, h)

      // Left: pulsing bubble
      const cx = w * 0.24
      const cy = h * 0.5
      const ratio = stateRef.current.R / RE
      const pxPerRatio = Math.min(w * 0.16, (h * 0.42) / rmaxRef.current)
      const rpix = Math.max(2, ratio * pxPerRatio)
      // equilibrium reference circle
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(cx, cy, pxPerRatio, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
      // bubble, tinted by compression state
      const compressed = ratio < 1
      const grd = ctx.createRadialGradient(cx, cy - rpix * 0.3, rpix * 0.1, cx, cy, rpix)
      if (compressed) {
        grd.addColorStop(0, '#fca5a5')
        grd.addColorStop(1, '#b91c1c')
      } else {
        grd.addColorStop(0, '#a5f3fc')
        grd.addColorStop(1, '#0891b2')
      }
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(cx, cy, rpix, 0, 2 * Math.PI)
      ctx.fill()

      // gas pressure readout (relative to ambient)
      const pG = (P0 + (2 * SIGMA) / RE) * Math.pow(1 / ratio, 3 * KAPPA)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`R/R_E = ${ratio.toFixed(2)}`, cx - 44, h - 26)
      ctx.fillText(`p_gas = ${(pG / P0).toFixed(0)} atm`, cx - 44, h - 10)

      // Right: R/R_E trace
      const gx0 = w * 0.46
      const gx1 = w * 0.97
      const gy0 = h * 0.1
      const gy1 = h * 0.9
      const rmax = rmaxRef.current
      // axes
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(gx0, gy0)
      ctx.lineTo(gx0, gy1)
      ctx.lineTo(gx1, gy1)
      ctx.stroke()
      // R/R_E = 1 baseline
      const y1 = gy1 - ((1 / rmax) * (gy1 - gy0))
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(gx0, y1)
      ctx.lineTo(gx1, y1)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(148,163,184,0.8)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('R/R_E = 1', gx0 + 4, y1 - 4)
      ctx.fillText(`${rmax.toFixed(1)}`, gx0 - 22, gy0 + 8)

      // trace
      const tr = traceRef.current
      ctx.strokeStyle = mode === 'km' ? '#38bdf8' : '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < tr.length; i++) {
        const x = gx0 + ((i / (window - 1)) * (gx1 - gx0))
        const y = gy1 - ((tr[i] / rmax) * (gy1 - gy0))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(mode === 'km' ? 'Keller-Miksis' : 'Rayleigh-Plesset', gx0 + 6, gy0 + 4)

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [pA, fkHz, reUm, mode, running])

  return (
    <div
      style={{
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 16,
        background: '#0f172a',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 14,
          color: '#cbd5e1',
          fontSize: 13,
        }}
      >
        <label>
          Driving amplitude p_A: {pA.toFixed(2)} atm
          <input
            type="range"
            min={0.2}
            max={1.4}
            step={0.05}
            value={pA}
            onChange={(e) => setPA(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Frequency f: {fkHz} kHz
          <input
            type="range"
            min={20}
            max={200}
            step={5}
            value={fkHz}
            onChange={(e) => setFkHz(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Equilibrium radius R_E: {reUm} um
          <input
            type="range"
            min={2}
            max={15}
            step={1}
            value={reUm}
            onChange={(e) => setReUm(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            onClick={() => setMode(mode === 'km' ? 'rp' : 'km')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {mode === 'km' ? 'Keller-Miksis' : 'Rayleigh-Plesset'}
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {running ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  )
}
