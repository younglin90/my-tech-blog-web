'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A droplet in a gas stream is not a sphere. The TAB oscillator gives it a
// distortion y (0 = sphere, 1 = breakup) driven by the gas dynamic pressure:
//
//   y'' = (C_F/C_b) rho_g u^2 / (rho_l r^2)
//         - (C_k sigma / rho_l r^3) y
//         - (C_d mu_l / rho_l r^2) y'
//
// and the drag coefficient rides on it:  C_D = C_D,sph (1 + 2.632 y).
// The steady state is y_ss = We_r / 12, but the oscillator overshoots it by
// nearly 2x before damping bites -- that overshoot is what the bar shows.
// ---------------------------------------------------------------------------

const W = 760
const H = 420

const CF = 1 / 3
const CK = 8
const CDT = 5
const CB = 0.5

const RHO_L = 620 // n-heptane [kg/m^3]
const SIG = 0.0145 // surface tension [N/m]
const MU_L = 3.0e-4 // liquid viscosity [Pa s]
const MU_G = 3.3e-5 // gas viscosity [Pa s]

const COL_DROP = '#38bdf8'
const COL_SPH = '#64748b'
const COL_BAR = '#fbbf24'
const COL_BREAK = '#f87171'
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.28)'

const DROP_CX = 190
const DROP_CY = 190
const TR_X = 40
const TR_Y = 300
const TR_W = 300
const TR_H = 96

const BAR_X = 400
const BAR_R = 736

function cdSphere(re: number) {
  if (re < 1e-8) return 0
  return re < 1000 ? (24 / re) * (1 + Math.pow(re, 2 / 3) / 6) : 0.424
}

type S = { u: number; dUm: number; rhoG: number; damp: boolean; run: boolean }

export function DistortionDragOscillator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [u, setU] = useState(25)
  const [dUm, setDUm] = useState(40)
  const [rhoG, setRhoG] = useState(4.98)
  const [damp, setDamp] = useState(true)
  const [run, setRun] = useState(true)
  const [read, setRead] = useState({ y: 0, yss: 0, mult: 1, we: 0, re: 0, cd: 0, broke: false })

  const st = useRef<S>({ u, dUm, rhoG, damp, run })
  st.current = { u, dUm, rhoG, damp, run }

  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let y = 0
    let ydot = 0
    let broke = false
    const trace: number[] = []
    let lastKey = ''

    // physical sub-stepping: the TAB period is tens of microseconds, so one
    // animation frame advances the oscillator by SUB steps of DT_PHYS.
    const DT_PHYS = 4e-8
    const SUB = 90

    const draw = () => {
      const s = st.current
      const d = s.dUm * 1e-6
      const r = 0.5 * d
      const key = `${s.dUm}|${s.rhoG}`
      if (key !== lastKey) {
        // geometry changed -> restart the oscillator so the trace stays honest
        lastKey = key
        y = 0
        ydot = 0
        broke = false
        trace.length = 0
      }

      if (s.run && !broke) {
        for (let k = 0; k < SUB; k++) {
          const forcing = (CF / CB) * (s.rhoG * s.u * s.u) / (RHO_L * r * r)
          const spring = (CK * SIG) / (RHO_L * r * r * r)
          const drag = s.damp ? (CDT * MU_L) / (RHO_L * r * r) : 0
          ydot += (forcing - spring * y - drag * ydot) * DT_PHYS
          y += ydot * DT_PHYS
          if (y < 0) {
            y = 0
            ydot = 0
          }
          if (y >= 1) {
            y = 1
            ydot = 0
            broke = true
            break
          }
        }
        trace.push(y)
        if (trace.length > TR_W) trace.shift()
      }

      const weR = (s.rhoG * s.u * s.u * r) / SIG
      const yss = Math.min(1, weR / 12)
      const re = (s.rhoG * s.u * d) / MU_G
      const cd0 = cdSphere(re)
      const mult = 1 + 2.632 * y

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- droplet -------------------------------------------------------
      const R0 = 62
      // TAB: y is the equator displacement scaled by C_b r; keep area fixed
      const a = R0 * (1 + 0.62 * y)
      const b = (R0 * R0) / a
      ctx.strokeStyle = COL_SPH
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(DROP_CX, DROP_CY, R0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.ellipse(DROP_CX, DROP_CY, b, a, 0, 0, Math.PI * 2)
      ctx.fillStyle = broke ? 'rgba(248,113,113,0.22)' : 'rgba(56,189,248,0.20)'
      ctx.fill()
      ctx.strokeStyle = broke ? COL_BREAK : COL_DROP
      ctx.lineWidth = 2
      ctx.stroke()

      // gas stream from the left, squeezed around the drop
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 1
      for (let i = -3; i <= 3; i++) {
        const yy = DROP_CY + i * 26
        ctx.beginPath()
        ctx.moveTo(20, yy)
        ctx.lineTo(DROP_CX - b - 12, yy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(DROP_CX - b - 12, yy)
        ctx.lineTo(DROP_CX - b - 20, yy - 3)
        ctx.moveTo(DROP_CX - b - 12, yy)
        ctx.lineTo(DROP_CX - b - 20, yy + 3)
        ctx.stroke()
      }
      // frontal-area bracket: the number the drag law actually multiplies
      ctx.strokeStyle = COL_BAR
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(DROP_CX + a + 22, DROP_CY - a)
      ctx.lineTo(DROP_CX + a + 22, DROP_CY + a)
      ctx.moveTo(DROP_CX + a + 17, DROP_CY - a)
      ctx.lineTo(DROP_CX + a + 27, DROP_CY - a)
      ctx.moveTo(DROP_CX + a + 17, DROP_CY + a)
      ctx.lineTo(DROP_CX + a + 27, DROP_CY + a)
      ctx.stroke()
      ctx.fillStyle = COL_BAR
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('frontal', DROP_CX + a + 33, DROP_CY - 4)
      ctx.fillText('width', DROP_CX + a + 33, DROP_CY + 10)

      ctx.fillStyle = COL_SPH
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('dashed = undistorted sphere', 20, 34)
      ctx.fillStyle = broke ? COL_BREAK : COL_DROP
      ctx.fillText(broke ? 'y = 1 reached: TAB calls this breakup' : 'solid = TAB shape, equal area', 20, 50)

      // ---- y(t) trace ----------------------------------------------------
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(TR_X, TR_Y, TR_W, TR_H)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('y(t)  distortion', TR_X, TR_Y - 8)
      ctx.fillText('1.0', TR_X - 26, TR_Y + 4)
      ctx.fillText('0', TR_X - 12, TR_Y + TR_H)

      // steady-state line
      const ySs = TR_Y + TR_H - yss * TR_H
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(148,163,184,0.6)'
      ctx.beginPath()
      ctx.moveTo(TR_X, ySs)
      ctx.lineTo(TR_X + TR_W, ySs)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COL_TXT
      ctx.fillText(`y_ss = We_r/12 = ${yss.toFixed(3)}`, TR_X + 4, ySs - 5)

      ctx.beginPath()
      for (let i = 0; i < trace.length; i++) {
        const px = TR_X + i
        const py = TR_Y + TR_H - Math.min(1, trace[i]) * TR_H
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = broke ? COL_BREAK : COL_DROP
      ctx.lineWidth = 1.6
      ctx.stroke()

      // ---- right panel ---------------------------------------------------
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('drag coefficient right now', BAR_X, 34)

      const rows: Array<[string, number, string]> = [
        ['C_D,sph', cd0, COL_SPH],
        ['C_D,TAB', cd0 * mult, broke ? COL_BREAK : COL_BAR],
      ]
      const cdMax = Math.max(0.4, cd0 * 3.7)
      let by = 56
      for (const [name, val, col] of rows) {
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(name, BAR_X, by + 10)
        const bw = ((BAR_R - BAR_X - 130) * val) / cdMax
        ctx.fillStyle = col === COL_SPH ? 'rgba(100,116,139,0.35)' : 'rgba(251,191,36,0.30)'
        ctx.fillRect(BAR_X + 62, by, Math.max(1, bw), 14)
        ctx.strokeStyle = col
        ctx.lineWidth = 1
        ctx.strokeRect(BAR_X + 62.5, by + 0.5, Math.max(1, bw) - 1, 13)
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(val.toFixed(3), BAR_X + 70 + Math.max(1, bw), by + 11)
        by += 26
      }

      ctx.fillStyle = broke ? COL_BREAK : COL_BAR
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillText(`x ${mult.toFixed(2)}   (1 + 2.632 y)`, BAR_X + 62, by + 12)

      by += 44
      const info: Array<[string, string]> = [
        ['Re', re.toFixed(0)],
        ['We_r = rho_g u^2 r / sigma', weR.toFixed(2)],
        ['y  (now)', y.toFixed(3)],
        ['y_ss (steady)', yss.toFixed(3)],
        ['overshoot y/y_ss', yss > 1e-6 ? (y / yss).toFixed(2) : '--'],
        ['damping ratio', (((CDT * MU_L) / (RHO_L * r * r)) / (2 * Math.sqrt((CK * SIG) / (RHO_L * r * r * r)))).toFixed(4)],
      ]
      for (const [k, v] of info) {
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(k, BAR_X, by)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(v, BAR_R, by)
        ctx.textAlign = 'left'
        by += 20
      }

      ctx.fillStyle = '#64748b'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('n-heptane in 700 K air:  rho_l 620, sigma 0.0145 N/m', BAR_X, H - 16)

      return { y, yss, mult, weR, re, cd: cd0 * mult, broke }
    }

    let raf = 0
    let frame = 0
    const loop = () => {
      frame++
      const r = draw()
      if (frame % 10 === 0) {
        setReadRef.current({ y: r.y, yss: r.yss, mult: r.mult, we: r.weR, re: r.re, cd: r.cd, broke: r.broke })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(run)} onClick={() => setRun((v) => !v)}>{run ? 'running' : 'paused'}</button>
        <button style={btn(damp)} onClick={() => setDamp((v) => !v)}>liquid damping {damp ? 'on' : 'off'}</button>
        <label style={label}>
          <span style={nameS}>relative speed</span>
          <input type="range" min={5} max={45} step={1} value={u} onChange={(e) => setU(parseInt(e.target.value, 10))} />
          <span style={mono}>{u} m/s</span>
        </label>
        <label style={label}>
          <span style={nameS}>diameter</span>
          <input type="range" min={10} max={120} step={2} value={dUm} onChange={(e) => setDUm(parseInt(e.target.value, 10))} />
          <span style={mono}>{dUm} um</span>
        </label>
        <label style={label}>
          <span style={nameS}>gas density</span>
          <input type="range" min={1} max={20} step={0.2} value={rhoG} onChange={(e) => setRhoG(parseFloat(e.target.value))} />
          <span style={mono}>{rhoG.toFixed(1)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: COL_DROP }}>y {read.y.toFixed(3)}</span>
        <span style={{ color: COL_TXT }}>y_ss {read.yss.toFixed(3)}</span>
        <span style={{ color: read.broke ? COL_BREAK : COL_BAR }}>C_D x{read.mult.toFixed(2)}</span>
        <span style={{ color: COL_TXT }}>We_r {read.we.toFixed(2)}</span>
        <span style={{ color: COL_TXT }}>Re {read.re.toFixed(0)}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Raise the speed and watch the drop flatten into a disc while the amber bar climbs past the grey sphere value. The
        oscillation overshoots the dashed steady line by almost 2x, so the peak drag is roughly twice what an equilibrium
        estimate would give. Turn liquid damping off and the ring never settles. Push far enough and y hits 1 &mdash; TAB stops
        and calls it breakup.
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 54 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
