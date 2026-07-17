'use client'

import { useEffect, useRef, useState } from 'react'

// 1D advection of an isolated material interface at uniform velocity and
// uniform pressure. Only the EOS parameter gamma jumps across the interface
// (air -> the gas you pick). This is the four-equation-model interface
// equilibrium test: a scheme that respects the shared-pressure assumption must
// keep P flat as the interface slides by.
//
// State per cell: rho, mom = rho*u, E = P*Gamma + 0.5*rho*u^2, with the mixture
// stiffness Gamma = 1/(gamma - 1). We march first-order upwind (u0 > 0,
// periodic) and recover P_i = (E_i - 0.5*mom_i^2/rho_i) / Gamma_i.
//
//   NAIVE      : advect rho*Gamma conservatively, then Gamma = (rho*Gamma)/rho
//   CONSISTENT : advect Gamma itself by non-conservative upwind
//                Gamma_i -= nu*(Gamma_i - Gamma_{i-1})   (Abgrall 1996)
//
// The conservative rho/mom/E update makes E_i^{n+1} = P0*[Gamma_i - nu*dGamma]
// + 0.5*u0^2*rho_i^{n+1}. Only the CONSISTENT Gamma matches that bracket, so it
// alone gives P = P0 to machine precision. The NAIVE Gamma does not, so a
// pressure spike is born at the interface and grows every step.

const N = 200
const P0 = 1.0
const U0 = 1.0

type Scheme = 'naive' | 'consistent'

export function FourEqInterfaceOscillation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)

  const rho = useRef<Float64Array>(new Float64Array(N))
  const mom = useRef<Float64Array>(new Float64Array(N))
  const E = useRef<Float64Array>(new Float64Array(N))
  const Gam = useRef<Float64Array>(new Float64Array(N)) // 1/(gamma-1)
  const stepRef = useRef(0)
  const peakRef = useRef(0)

  const [scheme, setScheme] = useState<Scheme>('naive')
  const [gammaR, setGammaR] = useState(1.66) // right gas: helium 1.66, SF6 1.093 ...
  const [cfl, setCfl] = useState(0.6)
  const [running, setRunning] = useState(true)

  const schemeRef = useRef(scheme)
  const gammaRRef = useRef(gammaR)
  const cflRef = useRef(cfl)
  schemeRef.current = scheme
  gammaRRef.current = gammaR
  cflRef.current = cfl

  const seed = () => {
    const gL = 1.4 // air
    const gR = gammaRRef.current
    for (let i = 0; i < N; i++) {
      const x = i / N
      // interface as a smooth ramp over a few cells (diffuse zone)
      const t = Math.max(0, Math.min(1, (x - 0.28) / 0.06))
      const g = gL + (gR - gL) * t
      const r = 1.0 + (0.2 - 1.0) * t // density also jumps; pressure must not
      rho.current[i] = r
      mom.current[i] = r * U0
      Gam.current[i] = 1 / (g - 1)
      E.current[i] = P0 * Gam.current[i] + 0.5 * r * U0 * U0
    }
    stepRef.current = 0
    peakRef.current = 0
  }

  const advect = () => {
    const nu = cflRef.current
    const r = rho.current, m = mom.current, e = E.current, G = Gam.current
    const rn = new Float64Array(N)
    const mn = new Float64Array(N)
    const en = new Float64Array(N)
    const Gn = new Float64Array(N)
    // conservative upwind (u0 > 0) for rho, mom, E; +P terms cancel (uniform P)
    for (let i = 0; i < N; i++) {
      const im = (i - 1 + N) % N
      rn[i] = r[i] - nu * (r[i] - r[im])
      mn[i] = m[i] - nu * (m[i] - m[im])
      en[i] = e[i] - nu * (e[i] - e[im])
    }
    if (schemeRef.current === 'naive') {
      // conservative rho*Gamma, then divide back out
      const rg = new Float64Array(N)
      for (let i = 0; i < N; i++) rg[i] = r[i] * G[i]
      for (let i = 0; i < N; i++) {
        const im = (i - 1 + N) % N
        const rgn = rg[i] - nu * (rg[i] - rg[im])
        Gn[i] = rgn / rn[i]
      }
    } else {
      // non-conservative upwind on Gamma directly
      for (let i = 0; i < N; i++) {
        const im = (i - 1 + N) % N
        Gn[i] = G[i] - nu * (G[i] - G[im])
      }
    }
    rho.current = rn
    mom.current = mn
    E.current = en
    Gam.current = Gn
    stepRef.current++
  }

  const draw = () => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const W = cv.width, H = cv.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b0e14'
    ctx.fillRect(0, 0, W, H)

    const padL = 46, padR = 12, padT = 16, padB = 26
    const gw = W - padL - padR
    const gh = H - padT - padB

    // pressure window around P0
    const pMin = 0.7, pMax = 1.3
    const yOf = (p: number) => padT + gh * (1 - (p - pMin) / (pMax - pMin))
    const xOf = (i: number) => padL + (gw * i) / (N - 1)

    // P0 reference line
    ctx.strokeStyle = '#3a4152'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(padL, yOf(P0))
    ctx.lineTo(padL + gw, yOf(P0))
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#8a93a6'
    ctx.font = '11px monospace'
    ctx.fillText('P = 1.0 (equilibrium)', padL + 6, yOf(P0) - 5)
    ctx.fillText('1.3', 8, yOf(1.3) + 4)
    ctx.fillText('0.7', 8, yOf(0.7) + 4)

    // interface (Gamma gradient) shaded band
    const G = Gam.current
    let gmin = Infinity, gmax = -Infinity
    for (let i = 0; i < N; i++) { gmin = Math.min(gmin, G[i]); gmax = Math.max(gmax, G[i]) }
    ctx.fillStyle = 'rgba(120,130,160,0.10)'
    for (let i = 0; i < N; i++) {
      const f = gmax > gmin ? (G[i] - gmin) / (gmax - gmin) : 0
      if (f > 0.02 && f < 0.98) {
        ctx.fillRect(xOf(i), padT, gw / (N - 1) + 1, gh)
      }
    }

    // pressure curve
    const r = rho.current, m = mom.current, e = E.current
    let peak = 0
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const p = (e[i] - 0.5 * (m[i] * m[i]) / r[i]) / G[i]
      peak = Math.max(peak, Math.abs(p - P0))
      const yy = Math.max(padT, Math.min(padT + gh, yOf(p)))
      if (i === 0) ctx.moveTo(xOf(i), yy)
      else ctx.lineTo(xOf(i), yy)
    }
    peakRef.current = Math.max(peakRef.current, peak)
    ctx.strokeStyle = schemeRef.current === 'naive' ? '#ff6b6b' : '#4dd4a0'
    ctx.lineWidth = 2
    ctx.stroke()

    // readout
    ctx.fillStyle = '#c9d1e0'
    ctx.font = '12px monospace'
    ctx.fillText(`step ${stepRef.current}`, padL + 6, padT + 14)
    const dev = peak < 1e-6 ? peak.toExponential(1) : peak.toFixed(4)
    ctx.fillStyle = schemeRef.current === 'naive' ? '#ff6b6b' : '#4dd4a0'
    ctx.fillText(`max |P - P0| = ${dev}`, padL + 6, padT + 30)
  }

  useEffect(() => {
    seed()
    let acc = 0
    let last = 0
    const loop = (ts: number) => {
      if (!last) last = ts
      const dt = ts - last
      last = ts
      if (running) {
        acc += dt
        while (acc > 33) { // ~30 advection steps/sec
          advect()
          acc -= 33
          if (stepRef.current > 900) seed()
        }
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const reseed = () => seed()

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#11151d', borderRadius: 10, border: '1px solid #222a38' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={340}
        style={{ width: '100%', height: 'auto', borderRadius: 6, display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.85rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => { setScheme('naive'); seed() }}
            style={btn(scheme === 'naive', '#ff6b6b')}
          >Naive conservative</button>
          <button
            onClick={() => { setScheme('consistent'); seed() }}
            style={btn(scheme === 'consistent', '#4dd4a0')}
          >IEC-consistent</button>
        </div>
        <button onClick={() => setRunning(r => !r)} style={btn(false, '#6ea8fe')}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={reseed} style={btn(false, '#6ea8fe')}>Reset</button>
        <label style={lbl}>
          right gas &gamma; = {gammaR.toFixed(2)}
          <input type="range" min={1.05} max={1.66} step={0.01} value={gammaR}
            onChange={e => { setGammaR(parseFloat(e.target.value)); seed() }} style={{ width: 120 }} />
        </label>
        <label style={lbl}>
          CFL = {cfl.toFixed(2)}
          <input type="range" min={0.1} max={0.9} step={0.05} value={cfl}
            onChange={e => setCfl(parseFloat(e.target.value))} style={{ width: 100 }} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#7f899c', marginTop: '0.6rem', marginBottom: 0, lineHeight: 1.5 }}>
        Uniform velocity, uniform pressure, only &gamma; jumps across the shaded interface.
        The naive scheme grows a pressure spike at the interface; the consistent one keeps P flat to machine precision.
      </p>
    </div>
  )
}

function btn(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '5px 11px',
    fontSize: 12,
    borderRadius: 6,
    cursor: 'pointer',
    border: `1px solid ${active ? color : '#2c3547'}`,
    background: active ? color : '#171c26',
    color: active ? '#0b0e14' : '#c9d1e0',
    fontWeight: active ? 700 : 400,
  }
}

const lbl: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: 11,
  color: '#8a93a6',
  gap: 2,
}
