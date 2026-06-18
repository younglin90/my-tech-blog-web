'use client'

import { useEffect, useRef, useState } from 'react'

// Minimal 1D Euler solver (ideal gas, gamma=1.4) advanced with the AUSM+ flux.
// First-order in space/time so it stays cheap enough to run live at 60fps.
const GAMMA = 1.4
const NX = 200
const DX = 1 / NX

type Field = 'density' | 'pressure' | 'velocity'

function machPlus(M: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (M + Math.abs(M))
  return 0.25 * (M + 1) * (M + 1) + 0.125 * (M * M - 1) * (M * M - 1)
}
function machMinus(M: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (M - Math.abs(M))
  return -0.25 * (M - 1) * (M - 1) - 0.125 * (M * M - 1) * (M * M - 1)
}
function presPlus(M: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (1 + Math.sign(M))
  return 0.25 * (M + 1) * (M + 1) * (2 - M) + 0.1875 * M * (M * M - 1) * (M * M - 1)
}
function presMinus(M: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (1 - Math.sign(M))
  return 0.25 * (M - 1) * (M - 1) * (2 + M) - 0.1875 * M * (M * M - 1) * (M * M - 1)
}

// Conserved state arrays: rho, rho*u, E.
interface State {
  rho: Float64Array
  mom: Float64Array
  ene: Float64Array
}

function sodInit(): State {
  const rho = new Float64Array(NX)
  const mom = new Float64Array(NX)
  const ene = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    const x = (i + 0.5) * DX
    const r = x < 0.5 ? 1.0 : 0.125
    const p = x < 0.5 ? 1.0 : 0.1
    rho[i] = r
    mom[i] = 0
    ene[i] = p / (GAMMA - 1)
  }
  return { rho, mom, ene }
}

// AUSM+ interface flux between left state L and right state R (primitive-derived).
function ausmFlux(
  rL: number, uL: number, pL: number,
  rR: number, uR: number, pR: number,
): [number, number, number] {
  const aL = Math.sqrt(GAMMA * pL / rL)
  const aR = Math.sqrt(GAMMA * pR / rR)
  const aHalf = 0.5 * (aL + aR)
  const ML = uL / aHalf
  const MR = uR / aHalf
  const mHalf = machPlus(ML) + machMinus(MR)
  const pHalf = presPlus(ML) * pL + presMinus(MR) * pR
  // total enthalpy H = (E + p)/rho
  const EL = pL / (GAMMA - 1) + 0.5 * rL * uL * uL
  const ER = pR / (GAMMA - 1) + 0.5 * rR * uR * uR
  const HL = (EL + pL) / rL
  const HR = (ER + pR) / rR
  const mdot = aHalf * mHalf * (mHalf > 0 ? rL : rR)
  const psi = mHalf > 0 ? [1, uL, HL] : [1, uR, HR]
  return [mdot * psi[0], mdot * psi[1] + pHalf, mdot * psi[2]]
}

function step(s: State, cfl: number): number {
  const { rho, mom, ene } = s
  // max wave speed
  let smax = 1e-6
  const u = new Float64Array(NX)
  const p = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    u[i] = mom[i] / rho[i]
    p[i] = (GAMMA - 1) * (ene[i] - 0.5 * rho[i] * u[i] * u[i])
    if (p[i] < 1e-8) p[i] = 1e-8
    const a = Math.sqrt(GAMMA * p[i] / rho[i])
    smax = Math.max(smax, Math.abs(u[i]) + a)
  }
  const dt = (cfl * DX) / smax
  // fluxes at NX-1 interior faces
  const fr = new Float64Array(NX + 1)
  const fm = new Float64Array(NX + 1)
  const fe = new Float64Array(NX + 1)
  for (let f = 1; f < NX; f++) {
    const L = f - 1
    const R = f
    const F = ausmFlux(rho[L], u[L], p[L], rho[R], u[R], p[R])
    fr[f] = F[0]; fm[f] = F[1]; fe[f] = F[2]
  }
  // transmissive boundaries: zero-gradient flux at ends
  fr[0] = fr[1]; fm[0] = fm[1]; fe[0] = fe[1]
  fr[NX] = fr[NX - 1]; fm[NX] = fm[NX - 1]; fe[NX] = fe[NX - 1]
  const ratio = dt / DX
  for (let i = 0; i < NX; i++) {
    rho[i] -= ratio * (fr[i + 1] - fr[i])
    mom[i] -= ratio * (fm[i + 1] - fm[i])
    ene[i] -= ratio * (fe[i + 1] - fe[i])
  }
  return dt
}

export function AusmEulerShockTube() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<State>(sodInit())
  const timeRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const [running, setRunning] = useState(true)
  const [cfl, setCfl] = useState(0.6)
  const [field, setField] = useState<Field>('density')
  const cflRef = useRef(cfl)
  const fieldRef = useRef(field)
  cflRef.current = cfl
  fieldRef.current = field

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const padL = 42
    const padR = 14
    const padT = 14
    const padB = 26
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const draw = () => {
      const s = stateRef.current
      const fld = fieldRef.current
      const vals = new Float64Array(NX)
      for (let i = 0; i < NX; i++) {
        const u = s.mom[i] / s.rho[i]
        const p = (GAMMA - 1) * (s.ene[i] - 0.5 * s.rho[i] * u * u)
        vals[i] = fld === 'density' ? s.rho[i] : fld === 'pressure' ? p : u
      }
      const yMin = fld === 'velocity' ? -0.1 : 0
      const yMax = fld === 'velocity' ? 1.0 : 1.1
      const X = (i: number) => padL + (i / NX) * plotW
      const Y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH

      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(120,144,168,0.18)'
      ctx.lineWidth = 1
      for (let k = 0; k <= 4; k++) {
        const yy = padT + (k / 4) * plotH
        ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(padL + plotW, yy); ctx.stroke()
      }

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < NX; i++) {
        const px = X(i + 0.5)
        const py = Y(vals[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      ctx.fillStyle = 'rgba(122,144,168,0.95)'
      ctx.font = '11px sans-serif'
      ctx.fillText(fld, padL + 6, padT + 12)
      ctx.fillText('x', padL + plotW - 8, padT + plotH + 16)
      ctx.fillStyle = 'rgba(226,232,240,0.9)'
      ctx.font = '12px sans-serif'
      ctx.fillText(`t = ${timeRef.current.toFixed(3)}`, padL + plotW - 70, padT + 14)
    }

    const loop = () => {
      const s = stateRef.current
      // a few sub-steps per frame, stop the Sod problem near t = 0.2
      for (let k = 0; k < 3; k++) {
        if (timeRef.current >= 0.2) break
        const dt = step(s, cflRef.current)
        timeRef.current += dt
      }
      draw()
      if (timeRef.current >= 0.2) {
        setRunning(false)
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    if (running) {
      rafRef.current = requestAnimationFrame(loop)
    } else {
      draw()
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [running])

  const reset = () => {
    stateRef.current = sodInit()
    timeRef.current = 0
    setRunning(true)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={620} height={280} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--accent)', color: '#06121f', fontWeight: 600 }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={reset}
          style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text)' }}
        >
          Reset
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['density', 'pressure', 'velocity'] as Field[]).map((k) => (
            <button
              key={k}
              onClick={() => setField(k)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: field === k ? 'var(--accent)' : 'transparent',
                color: field === k ? '#06121f' : 'var(--text)',
                fontWeight: field === k ? 600 : 400,
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 78 }}>CFL = {cfl.toFixed(2)}</span>
          <input type="range" min={0.1} max={0.95} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 2px 0' }}>
        Sod shock tube solved live with AUSM+. Watch three structures appear from one diaphragm: a rarefaction fan
        moving left, a contact discontinuity in the middle (sharp in density, flat in pressure), and a shock on the right.
        Push CFL toward 0.95 to see the first-order scheme stay stable but smear the contact further.
      </p>
    </div>
  )
}
