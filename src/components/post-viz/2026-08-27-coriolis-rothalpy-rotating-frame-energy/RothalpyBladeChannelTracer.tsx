'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One fluid particle marching down a centrifugal impeller channel.
//
// Left panel: the impeller seen from above.  The "frame" switch decides whether
// the camera co-rotates with the blades (relative frame: the blade is a fixed
// log spiral and the particle slides along it) or stays in the lab (absolute
// frame: the blade sweeps past and the particle traces a much wider spiral).
// Same particle, same physics — only the camera changes.
//
// Right panel: the four energies that make up the two candidate "constants",
// plotted against radius.
//
//     I  = p/rho + w^2/2 - U^2/2     rothalpy      -> stays flat
//     h0 = p/rho + c^2/2             total enthalpy -> climbs by U*c_theta
//
// Push omega up and h0 tilts harder while I refuses to move.
// ---------------------------------------------------------------------------

const W = 760
const H = 470

const PX = 20
const PY = 24
const PS = 330 // impeller panel is PS x PS
const CX = PX + PS / 2
const CY = PY + PS / 2

const GX0 = 408
const GX1 = 742
const GY0 = 30
const GY1 = 330

const R1 = 0.05
const R2 = 0.15
const B1 = 0.02
const B2 = 0.008
const MDOT = 30
const RHO = 1000
const NBLADE = 6
const DT = 0.0003 // seconds of impeller time per animation frame

const COL_I = '#4ade80'
const COL_H0 = '#fb923c'
const COL_P = '#38bdf8'
const COL_W = '#c084fc'
const COL_U = '#f472b6'

// Continuity fixes the relative velocity; omega then fixes the blade speed.
function fullState(r: number, betaDeg: number, omega: number) {
  const b = B1 + ((B2 - B1) * (r - R1)) / (R2 - R1)
  const wr = MDOT / (RHO * 2 * Math.PI * r * b)
  const wt = -wr * Math.tan((betaDeg * Math.PI) / 180)
  const u = omega * r
  return { wr, wt, u, ct: u + wt }
}

function energies(r: number, betaDeg: number, omega: number, iRef: number) {
  const s = fullState(r, betaDeg, omega)
  const w2 = s.wr * s.wr + s.wt * s.wt
  const u2 = s.u * s.u
  const p = iRef - 0.5 * w2 + 0.5 * u2
  const c2 = s.wr * s.wr + s.ct * s.ct
  return { ...s, w2, u2, p, h0: p + 0.5 * c2, roth: p + 0.5 * w2 - 0.5 * u2 }
}

function rothalpyRef(betaDeg: number, omega: number) {
  const s = fullState(R1, betaDeg, omega)
  return 0.5 * (s.wr * s.wr + s.wt * s.wt) - 0.5 * s.u * s.u
}

// Relative streamline of a constant-backsweep blade: dtheta/dr = -tan(beta)/r.
function bladeAngle(r: number, betaDeg: number) {
  return -Math.tan((betaDeg * Math.PI) / 180) * Math.log(r / R1)
}

export function RothalpyBladeChannelTracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [omega, setOmega] = useState(300)
  const [beta, setBeta] = useState(0)
  const [absFrame, setAbsFrame] = useState(false)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ r: R1, i: 0, h0: 0, turns: 0 })

  const live = useRef({ omega, beta, absFrame, running })
  live.current = { omega, beta, absFrame, running }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let r = R1
    let phi = 0 // blade rotation since release
    const trail: Array<[number, number]> = []

    const px = (rr: number, th: number) => [CX + (rr / R2) * (PS / 2 - 22) * Math.cos(th), CY + (rr / R2) * (PS / 2 - 22) * Math.sin(th)]

    const text = (s: string, x: number, y: number, c: string, f = '10px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { omega: om, beta: be, absFrame: af, running: run } = live.current

      if (run) {
        const s = fullState(r, be, om)
        r += s.wr * DT
        phi += om * DT
        if (r >= R2) {
          r = R1
          phi = 0
          trail.length = 0
        }
      }
      const thRel = bladeAngle(r, be)
      const spin = af ? phi : 0
      trail.push([r, thRel + spin])
      if (trail.length > 900) trail.shift()

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- impeller panel ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(PX, PY, PS, PS)

      const rimIn = (R1 / R2) * (PS / 2 - 22)
      const rimOut = PS / 2 - 22
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.setLineDash([4, 4])
      ;[rimIn, rimOut].forEach((rad) => {
        ctx.beginPath()
        ctx.arc(CX, CY, rad, 0, 2 * Math.PI)
        ctx.stroke()
      })
      ctx.setLineDash([])

      for (let k = 0; k < NBLADE; k++) {
        const off = (k * 2 * Math.PI) / NBLADE + spin
        ctx.strokeStyle = k === 0 ? 'rgba(226,232,240,0.9)' : 'rgba(148,163,184,0.45)'
        ctx.lineWidth = k === 0 ? 2.4 : 1.6
        ctx.beginPath()
        for (let j = 0; j <= 40; j++) {
          const rr = R1 + ((R2 - R1) * j) / 40
          const [x, y] = px(rr, bladeAngle(rr, be) + off)
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(251,146,60,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      trail.forEach(([rr, th], j) => {
        const [x, y] = px(rr, th)
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()

      const [pxx, pyy] = px(r, thRel + spin)
      ctx.fillStyle = '#fb923c'
      ctx.beginPath()
      ctx.arc(pxx, pyy, 5, 0, 2 * Math.PI)
      ctx.fill()

      // rotation arrow at the hub
      ctx.strokeStyle = 'rgba(96,165,250,0.8)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(CX, CY, 16, -0.4, 2.4)
      ctx.stroke()
      text('omega', CX + 20, CY - 12, '#60a5fa')

      text(af ? 'absolute frame (lab)' : 'relative frame (co-rotating)', PX + 10, PY + 16, '#e2e8f0', '11px ui-monospace, monospace')
      text(`r = ${(r * 1000).toFixed(0)} mm`, PX + 10, PY + PS - 26, '#94a3b8')
      text(`blade turns = ${(phi / (2 * Math.PI)).toFixed(2)}`, PX + 10, PY + PS - 12, '#94a3b8')

      // ---------------- energy panel ----------------
      const iRef = rothalpyRef(be, om)
      const samples: Array<ReturnType<typeof energies>> = []
      for (let j = 0; j <= 120; j++) samples.push(energies(R1 + ((R2 - R1) * j) / 120, be, om, iRef))

      let lo = 0
      let hi = 0
      samples.forEach((s) => {
        ;[s.p, 0.5 * s.w2, 0.5 * s.u2, s.h0, s.roth].forEach((v) => {
          lo = Math.min(lo, v)
          hi = Math.max(hi, v)
        })
      })
      const pad = 0.08 * (hi - lo || 1)
      lo -= pad
      hi += pad

      const gx = (rr: number) => GX0 + ((rr - R1) / (R2 - R1)) * (GX1 - GX0)
      const gy = (v: number) => GY1 - ((v - lo) / (hi - lo)) * (GY1 - GY0)

      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(GX0, GY0, GX1 - GX0, GY1 - GY0)
      ctx.strokeStyle = 'rgba(226,232,240,0.12)'
      for (let v = Math.ceil(lo / 500) * 500; v < hi; v += 500) {
        ctx.beginPath()
        ctx.moveTo(GX0, gy(v))
        ctx.lineTo(GX1, gy(v))
        ctx.stroke()
        text(`${v}`, GX0 - 34, gy(v) + 3, '#64748b')
      }
      text('J/kg', GX0 - 34, GY0 - 6, '#64748b')
      text('r  [50 mm -> 150 mm]', GX1 - 128, GY1 + 14, '#64748b')

      const curve = (pick: (s: ReturnType<typeof energies>) => number, col: string, wdt: number, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = wdt
        ctx.setLineDash(dash)
        ctx.beginPath()
        samples.forEach((s, j) => {
          const x = gx(R1 + ((R2 - R1) * j) / 120)
          const y = gy(pick(s))
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.setLineDash([])
      }
      curve((s) => s.p, COL_P, 1.6, [3, 3])
      curve((s) => 0.5 * s.w2, COL_W, 1.6, [3, 3])
      curve((s) => 0.5 * s.u2, COL_U, 1.6, [3, 3])
      curve((s) => s.h0, COL_H0, 2.6, [])
      curve((s) => s.roth, COL_I, 2.6, [])

      const now = energies(r, be, om, iRef)
      ctx.strokeStyle = 'rgba(226,232,240,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(gx(r), GY0)
      ctx.lineTo(gx(r), GY1)
      ctx.stroke()
      ;[
        [now.h0, COL_H0],
        [now.roth, COL_I],
      ].forEach(([v, c]) => {
        ctx.fillStyle = c as string
        ctx.beginPath()
        ctx.arc(gx(r), gy(v as number), 4, 0, 2 * Math.PI)
        ctx.fill()
      })

      const legend: Array<[string, string]> = [
        [COL_I, 'I = p/rho + w^2/2 - U^2/2'],
        [COL_H0, 'h0 = p/rho + c^2/2'],
        [COL_P, 'p/rho'],
        [COL_W, 'w^2/2'],
        [COL_U, 'U^2/2'],
      ]
      legend.forEach(([c, s], j) => {
        ctx.fillStyle = c
        ctx.fillRect(GX0 + 10, GY1 + 30 + j * 16, 16, 3)
        text(s, GX0 + 32, GY1 + 34 + j * 16, '#94a3b8')
      })

      frame++
      if (frame % 12 === 0) push.current({ r, i: now.roth, h0: now.h0, turns: phi / (2 * Math.PI) })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const iRef = rothalpyRef(beta, omega)
  const inn = energies(R1, beta, omega, iRef)
  const out = energies(R2, beta, omega, iRef)
  const dh0 = out.h0 - inn.h0

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 56 }
  const btn = (on: boolean): CSSProperties => ({
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        <button style={btn(absFrame)} onClick={() => setAbsFrame((p) => !p)}>
          frame: {absFrame ? 'absolute' : 'relative'}
        </button>
        <label style={label}>
          <span style={nameS}>omega [rad/s]</span>
          <input type="range" min={100} max={500} step={10} value={omega} onChange={(e) => setOmega(parseInt(e.target.value, 10))} />
          <span style={mono}>{omega}</span>
        </label>
        <label style={label}>
          <span style={nameS}>backsweep [deg]</span>
          <input type="range" min={0} max={45} step={1} value={beta} onChange={(e) => setBeta(parseInt(e.target.value, 10))} />
          <span style={mono}>{beta}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Flip the frame switch: the orange trail changes shape completely, yet the green rothalpy line never tilts. At the
        current radius {(stat.r * 1000).toFixed(0)} mm, I = {stat.i.toFixed(1)} J/kg against h0 = {stat.h0.toFixed(1)} J/kg.
        Across the whole channel h0 climbs by {dh0.toFixed(1)} J/kg — exactly U2·c_theta2 − U1·c_theta1 ={' '}
        {(out.u * out.ct - inn.u * inn.ct).toFixed(1)}. Raise omega and only the orange line responds.
      </div>
    </div>
  )
}
