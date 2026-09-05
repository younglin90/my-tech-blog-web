'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Uniform pressure, uniform velocity, one contact discontinuity.
//
//   Nothing should happen.  The exact solution just translates the interface.
//
//   Both panels march the SAME conservative variables (rho, rho*u, rho*E) with
//   the SAME first-order upwind operator.  They differ only in how the
//   thermodynamic variable rides along:
//
//     A  conservative mass fraction  ->  (rho*Y) upwind, Y = (rho*Y)/rho,
//                                        Gamma = Y/(g1-1) + (1-Y)/(g2-1)
//     B  transported Gamma           ->  Gamma itself upwind
//
//   P = (rho*E - 0.5 rho u^2) / Gamma.  A breaks the pressure, B does not.
//   That is Abgrall's criterion in one screen.
// ---------------------------------------------------------------------------

const W = 760
const H = 452

const N = 120
const P0 = 1.0e5 // Pa
const U0 = 100.0 // m/s
const G1 = 1.4

const XL = 62
const XR = 740

const PT = 46 // pressure panel
const PB = 226
const YT = 286 // composition panel
const YB = 398

const SPAN = 0.4 // pressure axis: P0 * (1 +- SPAN)

const COL_A = '#f87171'
const COL_B = '#4ade80'
const COL_G2 = '#fbbf24'
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.28)'

type Field = number[]

function upwind(q: Field, lam: number): Field {
  const out = new Array<number>(N)
  for (let j = 0; j < N; j++) {
    const jm = (j - 1 + N) % N
    out[j] = q[j] - lam * (q[j] - q[jm])
  }
  return out
}

export function PressureNonDisturbanceLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [g2, setG2] = useState(1.667)
  const [ratio, setRatio] = useState(8)
  const [cfl, setCfl] = useState(0.5)
  const [running, setRunning] = useState(true)
  const [read, setRead] = useState({ step: 0, ea: 0, eb: 0 })
  const [nudge, setNudge] = useState(0)

  const st = useRef({ g2, ratio, cfl, running })
  st.current = { g2, ratio, cfl, running }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    // ---- state -----------------------------------------------------------
    let rhoA: Field = [], momA: Field = [], eneA: Field = [], ryA: Field = []
    let rhoB: Field = [], momB: Field = [], eneB: Field = [], gvB: Field = []
    let pA: Field = [], pB: Field = [], yA: Field = []
    let step = 0

    const gammaVar = (y: number) => y / (G1 - 1) + (1 - y) / (st.current.g2 - 1)

    const reset = () => {
      const r1 = st.current.ratio * 0.125
      const r2 = 0.125
      rhoA = []; momA = []; eneA = []; ryA = []; gvB = []
      for (let j = 0; j < N; j++) {
        const y = j >= 24 && j < 66 ? 1 : 0
        const r = y > 0.5 ? r1 : r2
        const gv = gammaVar(y)
        rhoA.push(r)
        momA.push(r * U0)
        eneA.push(P0 * gv + 0.5 * r * U0 * U0)
        ryA.push(r * y)
        gvB.push(gv)
      }
      rhoB = rhoA.slice(); momB = momA.slice(); eneB = eneA.slice()
      pA = new Array<number>(N).fill(P0)
      pB = new Array<number>(N).fill(P0)
      yA = rhoA.map((r, j) => ryA[j] / r)
      step = 0
    }

    const advance = () => {
      const lam = st.current.cfl
      rhoA = upwind(rhoA, lam); momA = upwind(momA, lam)
      eneA = upwind(eneA, lam); ryA = upwind(ryA, lam)
      rhoB = upwind(rhoB, lam); momB = upwind(momB, lam)
      eneB = upwind(eneB, lam); gvB = upwind(gvB, lam)
      for (let j = 0; j < N; j++) {
        yA[j] = ryA[j] / rhoA[j]
        pA[j] = (eneA[j] - 0.5 * (momA[j] * momA[j]) / rhoA[j]) / gammaVar(yA[j])
        pB[j] = (eneB[j] - 0.5 * (momB[j] * momB[j]) / rhoB[j]) / gvB[j]
      }
      step++
    }

    // ---- drawing ---------------------------------------------------------
    const px = (j: number) => XL + ((j + 0.5) / N) * (XR - XL)

    const line = (p: Field, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let j = 0; j < N; j++) {
        const f = Math.max(-1, Math.min(1, (p[j] - P0) / (P0 * SPAN)))
        const y = (PT + PB) / 2 - f * ((PB - PT) / 2 - 6)
        if (j === 0) ctx.moveTo(px(j), y)
        else ctx.lineTo(px(j), y)
      }
      ctx.stroke()
    }

    const draw = () => {
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const mid = (PT + PB) / 2

      // pressure axis
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(XL, PT); ctx.lineTo(XL, PB)
      ctx.moveTo(XL, PB); ctx.lineTo(XR, PB)
      ctx.stroke()

      ctx.setLineDash([4, 5])
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.beginPath(); ctx.moveTo(XL, mid); ctx.lineTo(XR, mid); ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.fillText('140 kPa', XL - 6, PT + 10)
      ctx.fillText('100 kPa', XL - 6, mid + 4)
      ctx.fillText(' 60 kPa', XL - 6, PB - 2)
      ctx.textAlign = 'left'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('pressure  P(x)   — exact solution stays flat at 100 kPa', XL, PT - 16)

      line(pA, COL_A)
      line(pB, COL_B)

      // composition panel
      const r1 = st.current.ratio * 0.125
      for (let j = 0; j < N; j++) {
        const y = Math.max(0, Math.min(1, yA[j]))
        const w = (XR - XL) / N + 0.8
        ctx.fillStyle = `rgba(56,189,248,${0.14 + 0.62 * y})`
        ctx.fillRect(px(j) - w / 2, YT, w, YB - YT)
      }
      ctx.strokeStyle = COL_G2
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let j = 0; j < N; j++) {
        const f = Math.max(0, Math.min(1, (rhoA[j] - 0.125) / Math.max(1e-9, r1 - 0.125)))
        const y = YB - 6 - f * (YB - YT - 12)
        if (j === 0) ctx.moveTo(px(j), y)
        else ctx.lineTo(px(j), y)
      }
      ctx.stroke()

      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(XL, YT, XR - XL, YB - YT)

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('composition  Y(x) shaded, density rho(x) in amber', XL, YT - 12)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('x / L  (periodic, flow to the right at 100 m/s)', XL, YB + 18)
      ctx.textAlign = 'right'
      ctx.fillText(`gamma_1 ${G1.toFixed(2)}  gamma_2 ${st.current.g2.toFixed(3)}`, XR, YB + 18)
      ctx.textAlign = 'left'

      // legend
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = COL_A
      ctx.fillText('A  conservative mass fraction + mixture rule', XL + 8, PT + 14)
      ctx.fillStyle = COL_B
      ctx.fillText('B  transported 1/(gamma-1)', XL + 8, PT + 30)
    }

    reset()
    draw()

    let raf = 0
    let frame = 0
    let sub = 0
    const loop = () => {
      frame++
      if (st.current.running) {
        sub++
        if (sub >= 3) { advance(); sub = 0 }
      }
      draw()
      if (frame % 12 === 0) {
        let ea = 0
        let eb = 0
        for (let j = 0; j < N; j++) {
          ea = Math.max(ea, Math.abs(pA[j] - P0))
          eb = Math.max(eb, Math.abs(pB[j] - P0))
        }
        setReadRef.current({ step, ea, eb })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [g2, ratio, cfl, nudge])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button style={btn(false)} onClick={() => { setRunning(false); setNudge((n) => n + 1) }}>reset</button>
        <label style={label}>
          <span style={nameS}>gamma_2</span>
          <input type="range" min={1.1} max={1.95} step={0.005} value={g2} onChange={(e) => setG2(parseFloat(e.target.value))} />
          <span style={mono}>{g2.toFixed(3)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>rho_1/rho_2</span>
          <input type="range" min={1} max={20} step={0.5} value={ratio} onChange={(e) => setRatio(parseFloat(e.target.value))} />
          <span style={mono}>{ratio.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>CFL</span>
          <input type="range" min={0.1} max={0.9} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
          <span style={mono}>{cfl.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span>step {read.step}</span>
        <span style={{ color: COL_A }}>A  max|P-P0| {(read.ea / 1000).toFixed(2)} kPa ({((read.ea / P0) * 100).toFixed(1)}%)</span>
        <span style={{ color: COL_B }}>B  max|P-P0| {read.eb.toExponential(1)} Pa</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag gamma_2 toward 1.400: the red curve flattens onto the green one, because with equal gamma the mixture rule is no
        longer nonlinear. Push it away, or raise the density ratio, and the red curve dips at the two interfaces while the
        green line never leaves 100 kPa. CFL changes how fast the damage accumulates, not whether it appears.
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
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 44 }

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
