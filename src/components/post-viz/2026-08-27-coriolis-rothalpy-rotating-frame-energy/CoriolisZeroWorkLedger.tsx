'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The same impeller channel, but this time only the bookkeeping.
//
// Left: the force triangle riding on the particle.  The Coriolis vector is
// always drawn perpendicular to the relative velocity — that is not a drawing
// convention, it is what -2 (omega x w) means.  Its dot product with w is the
// instantaneous power, shown live; it never leaves zero.
//
// Right: three work accounts integrated along the trajectory.
//
//   Coriolis      -> 0            (a force that turns but never pays)
//   centrifugal   -> U2^2/2 - U1^2/2
//   blade torque  -> U2 c_th2 - U1 c_th1   (the whole head, in the lab frame)
//
// Drag omega and watch two bars grow while the first stays pinned at zero.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const VX = 22
const VY = 26
const VS = 340
const VCX = VX + VS / 2
const VCY = VY + VS / 2 + 20

const BX0 = 412
const BX1 = 740
const BY0 = 70

const R1 = 0.05
const R2 = 0.15
const B1 = 0.02
const B2 = 0.008
const MDOT = 30
const RHO = 1000
const DT = 0.00025

const COL_W = '#38bdf8'
const COL_COR = '#fb923c'
const COL_CEN = '#4ade80'
const COL_BLD = '#c084fc'

function state(r: number, betaDeg: number, omega: number) {
  const b = B1 + ((B2 - B1) * (r - R1)) / (R2 - R1)
  const wr = MDOT / (RHO * 2 * Math.PI * r * b)
  const wt = -wr * Math.tan((betaDeg * Math.PI) / 180)
  const u = omega * r
  return { wr, wt, u, ct: u + wt }
}

// Tangential force the pressure side must supply: relative acceleration in
// cylindrical coordinates (curvature term included) minus Coriolis.
function bladeTangential(r: number, betaDeg: number, omega: number) {
  const h = 1e-6
  const a = state(r - h, betaDeg, omega)
  const c = state(r + h, betaDeg, omega)
  const s = state(r, betaDeg, omega)
  const dwt = (c.wt - a.wt) / (2 * h)
  const accT = s.wr * dwt + (s.wr * s.wt) / r
  return accT + 2 * omega * s.wr
}

export function CoriolisZeroWorkLedger() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [omega, setOmega] = useState(300)
  const [beta, setBeta] = useState(0)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ r: R1, cor: 0, cen: 0, bld: 0, pcor: 0 })

  const live = useRef({ omega, beta, running })
  live.current = { omega, beta, running }
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
    let wCor = 0
    let wCen = 0
    let wBld = 0
    let lastKey = ''

    const text = (s: string, x: number, y: number, c: string, f = '10px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const arrow = (x0: number, y0: number, dx: number, dy: number, col: string, lab: string) => {
      const len = Math.hypot(dx, dy)
      if (len < 1) return
      ctx.strokeStyle = col
      ctx.fillStyle = col
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x0 + dx, y0 + dy)
      ctx.stroke()
      const ux = dx / len
      const uy = dy / len
      ctx.beginPath()
      ctx.moveTo(x0 + dx, y0 + dy)
      ctx.lineTo(x0 + dx - 9 * ux + 5 * uy, y0 + dy - 9 * uy - 5 * ux)
      ctx.lineTo(x0 + dx - 9 * ux - 5 * uy, y0 + dy - 9 * uy + 5 * ux)
      ctx.closePath()
      ctx.fill()
      text(lab, x0 + dx + 6 * ux + 4, y0 + dy + 6 * uy + 4, col, '11px ui-monospace, monospace')
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { omega: om, beta: be, running: run } = live.current
      const key = `${om}|${be}`
      if (key !== lastKey) {
        lastKey = key
        r = R1
        wCor = 0
        wCen = 0
        wBld = 0
      }

      const s = state(r, be, om)
      // Local (r, theta) components of the three accelerations.
      const corR = 2 * om * s.wt
      const corT = -2 * om * s.wr
      const cenR = om * om * r
      const bldT = bladeTangential(r, be, om)
      const pCor = corR * s.wr + corT * s.wt // identically zero
      const pCen = cenR * s.wr
      const pBld = om * r * bldT

      if (run && r < R2) {
        const dt = DT
        wCor += pCor * dt
        wCen += pCen * dt
        wBld += pBld * dt
        r += s.wr * dt
        if (r >= R2) r = R2
      }
      if (run && r >= R2) {
        // hold the finished ledger for a beat, then restart
        frame++
        if (frame % 240 === 0) {
          r = R1
          wCor = 0
          wCen = 0
          wBld = 0
        }
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- vector panel ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(VX, VY, VS, VS - 30)
      text('forces riding on the particle  (r outward ->, theta up)', VX + 10, VY + 16, '#e2e8f0', '11px ui-monospace, monospace')

      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(VX + 12, VCY)
      ctx.lineTo(VX + VS - 12, VCY)
      ctx.moveTo(VCX, VY + 36)
      ctx.lineTo(VCX, VY + VS - 42)
      ctx.stroke()
      ctx.setLineDash([])

      const vScale = 6.5 // m/s -> px
      const fScale = 0.016 // m/s^2 -> px
      arrow(VCX, VCY, s.wr * vScale, -s.wt * vScale, COL_W, 'w')
      arrow(VCX, VCY, corR * fScale, -corT * fScale, COL_COR, '-2wxw')
      arrow(VCX, VCY, cenR * fScale, 0, COL_CEN, 'centrif.')
      arrow(VCX, VCY, 0, -bldT * fScale, COL_BLD, 'blade')

      // right-angle marker between w and the Coriolis vector
      const aw = Math.atan2(-s.wt, s.wr)
      const ac = Math.atan2(-corT, corR)
      ctx.strokeStyle = 'rgba(226,232,240,0.55)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(VCX, VCY, 30, Math.min(aw, ac), Math.max(aw, ac))
      ctx.stroke()
      text('90 deg', VCX + 34 * Math.cos((aw + ac) / 2), VCY + 34 * Math.sin((aw + ac) / 2), '#cbd5e1')

      text(`|w| = ${Math.hypot(s.wr, s.wt).toFixed(2)} m/s`, VX + 12, VY + VS - 46, '#94a3b8')
      text(`|Coriolis| = ${(2 * om * Math.hypot(s.wr, s.wt)).toFixed(0)} m/s^2  (${((2 * om * Math.hypot(s.wr, s.wt)) / 9.81).toFixed(0)} g)`, VX + 12, VY + VS - 32, '#94a3b8')
      text(`Coriolis power = ${pCor.toExponential(1)} W/kg`, VX + 12, VY + VS - 18, COL_COR)

      // ---------------- ledger panel ----------------
      text(`work accounts along the channel      r = ${(r * 1000).toFixed(0)} mm`, BX0, 34, '#e2e8f0', '11px ui-monospace, monospace')
      const target = Math.max(1, Math.abs(wBld), 0.5 * (om * R2) ** 2 - 0.5 * (om * R1) ** 2)
      const rows: Array<[string, number, string]> = [
        ['Coriolis', wCor, COL_COR],
        ['centrifugal', wCen, COL_CEN],
        ['blade (lab frame)', wBld, COL_BLD],
      ]
      rows.forEach(([lab, v, col], j) => {
        const y = BY0 + j * 74
        text(lab, BX0, y - 8, '#cbd5e1', '11px ui-monospace, monospace')
        ctx.strokeStyle = 'rgba(148,163,184,0.3)'
        ctx.strokeRect(BX0, y, BX1 - BX0, 26)
        ctx.fillStyle = col
        ctx.fillRect(BX0 + 1, y + 1, Math.max(0, Math.min(1, v / target)) * (BX1 - BX0 - 2), 24)
        text(`${v.toFixed(2)} J/kg`, BX0, y + 44, col, '12px ui-monospace, monospace')
      })

      const inn = state(R1, be, om)
      const outS = state(R2, be, om)
      const euler = outS.u * outS.ct - inn.u * inn.ct
      text(`U2*c_th2 - U1*c_th1 = ${euler.toFixed(2)} J/kg`, BX0, BY0 + 3 * 74 + 4, '#e2e8f0', '11px ui-monospace, monospace')
      text(`U2^2/2 - U1^2/2     = ${(0.5 * outS.u ** 2 - 0.5 * inn.u ** 2).toFixed(2)} J/kg`, BX0, BY0 + 3 * 74 + 22, '#94a3b8', '11px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) push.current({ r, cor: wCor, cen: wCen, bld: wBld, pcor: pCor })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const inn = state(R1, beta, omega)
  const outS = state(R2, beta, omega)
  const euler = outS.u * outS.ct - inn.u * inn.ct

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
        The orange Coriolis arrow is the longest one on screen — up to{' '}
        {((2 * omega * Math.hypot(inn.wr, inn.wt)) / 9.81).toFixed(0)} g — and its account still reads{' '}
        {stat.cor.toExponential(1)} J/kg. Meanwhile the blade account fills to {stat.bld.toFixed(0)} of{' '}
        {euler.toFixed(0)} J/kg. Drag <em>backsweep</em> and only the purple bar moves: the perpendicular force never
        pays, it only decides where the blade has to push.
      </div>
    </div>
  )
}
