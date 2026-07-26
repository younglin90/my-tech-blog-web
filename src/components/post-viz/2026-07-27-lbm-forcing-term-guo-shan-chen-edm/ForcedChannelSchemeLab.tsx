'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Force-driven Poiseuille channel. D2Q9 / BGK, halfway bounce-back on BOTH walls,
// periodic in x, constant body force F = (fx, 0).
//
// The lab's real subject is not "which source term is best" — every source shape
// below behaves identically here. It is the BOOKKEEPING OF THE HALF FORCE, which
// is two independent switches that only work when they agree:
//
//   switch 1  half-force shift : u = (j + F/2)/rho used inside f_eq   ([shift] = 1/0)
//   switch 2  source gain      : (1 - 1/(2 tau)) multiplying F_i      (gain)
//
//   momentum delivered per step = [shift] * F/(2 tau) + gain * F
//
// which equals F only when gain = 1 - [shift]/(2 tau). Flip exactly one switch
// and the entire parabola rescales by 1 + 1/(2 tau) or 1 - 1/(2 tau).
// ---------------------------------------------------------------------------

const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]
const CS2 = 1 / 3

const NX = 40
const NY = 25
const NN = NX * NY
const STEPS_PER_FRAME = 48

// directions that stream in from outside the domain and must be refilled
const BOT_MISSING = [2, 5, 6]
const TOP_MISSING = [4, 7, 8]

type Scheme = 'plain' | 'guo' | 'edm' | 'shanchen'
const SCHEMES: Scheme[] = ['plain', 'guo', 'edm', 'shanchen']

const SCHEME_LABEL: Record<Scheme, string> = {
  plain: 'plain',
  guo: 'Guo',
  edm: 'EDM',
  shanchen: 'Shan-Chen',
}

const SCHEME_FORM: Record<Scheme, string> = {
  plain: 'F_i = w_i (c_i . F)/cs^2',
  guo: 'F_i = w_i [(c_i-u)/cs^2 + (c_i.u)c_i/cs^4] . F',
  edm: 'F_i = feq(rho, u + F/rho) - feq(rho, u)',
  shanchen: 'no F_i — collide about u_eq = j/rho + tau F/rho',
}

function rampColor(t: number) {
  const s = t < 0 ? 0 : t > 1 ? 1 : t
  if (s < 0.5) {
    const a = s * 2
    return `rgb(${Math.round(20 + a * 14)},${Math.round(48 + a * 163)},${Math.round(158 + a * 80)})`
  }
  const a = (s - 0.5) * 2
  return `rgb(${Math.round(34 + a * 217)},${Math.round(211 - a * 20)},${Math.round(238 - a * 202)})`
}

export function ForcedChannelSchemeLab() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [scheme, setScheme] = useState<Scheme>('guo')
  const [tau, setTau] = useState(1.0)
  const [fx, setFx] = useState(8e-6)
  const [halfShift, setHalfShift] = useState(true)
  const [prefactor, setPrefactor] = useState(true)
  const [running, setRunning] = useState(true)
  const [resetTick, setResetTick] = useState(0)

  // mirror control state into refs so the loop never restarts on a slider drag
  const schemeRef = useRef(scheme)
  const tauRef = useRef(tau)
  const fxRef = useRef(fx)
  const shiftRef = useRef(halfShift)
  const preRef = useRef(prefactor)
  const runRef = useRef(running)
  schemeRef.current = scheme
  tauRef.current = tau
  fxRef.current = fx
  shiftRef.current = halfShift
  preRef.current = prefactor
  runRef.current = running

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const f = new Float64Array(9 * NN)
    const fpost = new Float64Array(9 * NN)
    const idx = (x: number, y: number) => x + y * NX

    for (let k = 0; k < 9 * NN; k++) f[k] = W[Math.floor(k / NN)]

    let prevUmax = 0
    let drift = 1

    // ---- one LBM step -----------------------------------------------------
    const step = () => {
      const sc = schemeRef.current
      const t = tauRef.current
      const force = fxRef.current
      const shift = sc === 'shanchen' ? 1 : shiftRef.current ? 1 : 0
      const gain = sc === 'shanchen' ? 1 : preRef.current ? 1 - 1 / (2 * t) : 1
      const omega = 1 / t

      for (let y = 0; y < NY; y++) {
        for (let x = 0; x < NX; x++) {
          const p = idx(x, y)
          let rho = 0
          let jx = 0
          let jy = 0
          for (let i = 0; i < 9; i++) {
            const fi = f[i * NN + p]
            rho += fi
            jx += fi * EX[i]
            jy += fi * EY[i]
          }

          // velocity that goes into f_eq
          const cy = jy / rho
          const cx =
            sc === 'shanchen'
              ? jx / rho + t * force / rho
              : (jx + shift * force / 2) / rho
          const usq = cx * cx + cy * cy

          // EDM needs the once-shifted equilibrium as well
          const dx = cx + force / rho
          const dsq = dx * dx + cy * cy

          for (let i = 0; i < 9; i++) {
            const eu = EX[i] * cx + EY[i] * cy
            const eq = W[i] * rho * (1 + eu / CS2 + (eu * eu) / (2 * CS2 * CS2) - usq / (2 * CS2))
            let src = 0
            if (sc === 'plain') {
              src = gain * W[i] * (EX[i] * force) / CS2
            } else if (sc === 'guo') {
              src = gain * W[i] * (((EX[i] - cx) / CS2 + (eu * EX[i]) / (CS2 * CS2)) * force)
            } else if (sc === 'edm') {
              const eu2 = EX[i] * dx + EY[i] * cy
              const eq2 = W[i] * rho * (1 + eu2 / CS2 + (eu2 * eu2) / (2 * CS2 * CS2) - dsq / (2 * CS2))
              src = gain * (eq2 - eq)
            }
            const k = i * NN + p
            fpost[k] = f[k] + (eq - f[k]) * omega + src
          }
        }
      }

      // streaming (pull), periodic in x; y-neighbours off the grid left for the wall rule
      for (let y = 0; y < NY; y++) {
        for (let x = 0; x < NX; x++) {
          const p = idx(x, y)
          for (let i = 0; i < 9; i++) {
            const sx = (x - EX[i] + NX) % NX
            const sy = y - EY[i]
            if (sy < 0 || sy > NY - 1) continue
            f[i * NN + p] = fpost[i * NN + idx(sx, sy)]
          }
        }
      }

      // halfway bounce-back, both walls stationary
      for (let x = 0; x < NX; x++) {
        const pb = idx(x, 0)
        const pt = idx(x, NY - 1)
        for (let m = 0; m < 3; m++) {
          const ib = BOT_MISSING[m]
          f[ib * NN + pb] = fpost[OPP[ib] * NN + pb]
          const it = TOP_MISSING[m]
          f[it * NN + pt] = fpost[OPP[it] * NN + pt]
        }
      }
    }

    // ---- drawing ----------------------------------------------------------
    const FX0 = 46
    const FY0 = 46
    const FW = 246
    const FH = 176
    const PX0 = 372
    const PY0 = 46
    const PW = 196
    const PH = 176

    const label = (s: string, x: number, y: number, col: string, font = '10px ui-monospace, monospace') => {
      ctx.font = font
      ctx.fillStyle = col
      ctx.fillText(s, x, y)
    }

    const draw = (phase: number) => {
      const sc = schemeRef.current
      const t = tauRef.current
      const force = fxRef.current
      const locked = sc === 'shanchen'
      const shift = locked ? 1 : shiftRef.current ? 1 : 0
      const preOn = locked ? true : preRef.current
      const nu = CS2 * (t - 0.5)
      const H = NY
      const predicted = locked ? 1 : shift / (2 * t) + (preOn ? 1 - 1 / (2 * t) : 1)

      ctx.fillStyle = 'rgba(8,17,31,0.98)'
      ctx.fillRect(0, 0, c.width, c.height)

      // ---- measure the mid-channel profile (always the physical velocity)
      const mx = NX >> 1
      const meas = new Float64Array(NY)
      const exact = new Float64Array(NY)
      let uMeas = 0
      let uExact = 0
      let maxAbsErr = 0
      for (let y = 0; y < NY; y++) {
        const p = idx(mx, y)
        let rho = 0
        let jx = 0
        for (let i = 0; i < 9; i++) {
          const fi = f[i * NN + p]
          rho += fi
          jx += fi * EX[i]
        }
        const yy = y + 0.5
        meas[y] = (jx + force / 2) / rho
        exact[y] = (force / (2 * nu)) * yy * (H - yy)
        if (meas[y] > uMeas) uMeas = meas[y]
        if (exact[y] > uExact) uExact = exact[y]
      }
      for (let y = 0; y < NY; y++) {
        const e = Math.abs(meas[y] - exact[y])
        if (e > maxAbsErr) maxAbsErr = e
      }
      const relErr = (maxAbsErr / uExact) * 100
      const ratio = uMeas / uExact

      // steady-state detector
      const change = prevUmax > 0 ? Math.abs(uMeas - prevUmax) / Math.max(uMeas, 1e-14) : 1
      drift = drift * 0.7 + change * 0.3
      prevUmax = uMeas
      const steady = drift < 1e-4

      // ---- header
      label(`force-driven channel  ${NX}x${NY}  D2Q9/BGK  halfway bounce-back both walls`, 14, 16, '#cbd5e1', '11px ui-monospace, monospace')
      label(`${SCHEME_LABEL[sc]}:  ${SCHEME_FORM[sc]}`, 14, 30, '#22d3ee')

      // ---- left: u_x field
      const cw = FW / NX
      const ch = FH / NY
      for (let y = 0; y < NY; y++) {
        for (let x = 0; x < NX; x++) {
          const p = idx(x, y)
          let rho = 0
          let jx = 0
          for (let i = 0; i < 9; i++) {
            const fi = f[i * NN + p]
            rho += fi
            jx += fi * EX[i]
          }
          const u = (jx + force / 2) / rho
          ctx.fillStyle = rampColor(u / uExact)
          ctx.fillRect(FX0 + x * cw, FY0 + (NY - 1 - y) * ch, Math.ceil(cw), Math.ceil(ch))
        }
      }
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(FX0, FY0 - 1)
      ctx.lineTo(FX0 + FW, FY0 - 1)
      ctx.moveTo(FX0, FY0 + FH + 1)
      ctx.lineTo(FX0 + FW, FY0 + FH + 1)
      ctx.stroke()
      label('wall (no-slip, halfway bounce-back)', FX0, FY0 - 6, '#94a3b8')
      label('wall', FX0, FY0 + FH + 13, '#94a3b8')
      label(`F = (fx, 0) ->`, FX0 + FW - 78, FY0 + FH / 2 + 3, '#08111f')

      // colour bar
      const CBY = FY0 + FH + 22
      for (let i = 0; i < FW; i++) {
        ctx.fillStyle = rampColor(i / FW)
        ctx.fillRect(FX0 + i, CBY, 1, 8)
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(FX0, CBY, FW, 8)
      label('u_x = 0', FX0, CBY + 19, '#94a3b8')
      label(`u_x = u_max analytic = ${uExact.toExponential(2)}`, FX0 + FW - 148, CBY + 19, '#fbbf24')

      // ---- right: profile plot
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX0, PY0, PW, PH)
      const uScale = Math.max(uExact, uMeas) * 1.12
      const px = (u: number) => PX0 + (u / uScale) * PW
      const py = (y: number) => PY0 + (NY - 1 - y) * ch + ch / 2

      // analytic u_max marker
      ctx.strokeStyle = 'rgba(251,191,36,0.28)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(px(uExact), PY0)
      ctx.lineTo(px(uExact), PY0 + PH)
      ctx.stroke()
      ctx.setLineDash([])

      // analytic parabola (dashed amber)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      for (let y = 0; y < NY; y++) {
        const X = px(exact[y])
        const Y = py(y)
        if (y === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // measured (solid cyan)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let y = 0; y < NY; y++) {
        const X = px(meas[y])
        const Y = py(y)
        if (y === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // profile axes
      label('y [lattice]', PX0 - 34, PY0 - 6, '#94a3b8')
      label(String(NY), PX0 - 16, PY0 + 8, '#94a3b8')
      label(String((NY >> 1)), PX0 - 16, PY0 + PH / 2 + 3, '#94a3b8')
      label('0', PX0 - 10, PY0 + PH, '#94a3b8')
      label('0', PX0 - 2, PY0 + PH + 13, '#94a3b8')
      label(`${uScale.toExponential(1)}`, PX0 + PW - 44, PY0 + PH + 13, '#94a3b8')
      label('u_x [lattice units]', PX0 + PW / 2 - 48, PY0 + PH + 25, '#cbd5e1')
      label('measured', PX0, CBY + 19, '#22d3ee')
      label('analytic', PX0 + 62, CBY + 19, '#fbbf24')
      label(steady ? 'steady' : 'converging...', PX0 + PW - 66, PY0 + 12, steady ? '#4ade80' : '#fbbf24')

      // ---- readouts
      const R0 = 288
      const LH = 15
      const shiftTxt = locked ? 'self-consistent' : shift ? 'ON   u = (j + F/2)/rho' : 'OFF  u = j/rho'
      const preTxt = locked ? 'self-consistent' : preOn ? `ON   gain = 1 - 1/2tau = ${(1 - 1 / (2 * t)).toFixed(3)}` : 'OFF  gain = 1'
      label(`half-force shift   ${shiftTxt}`, 14, R0, locked ? '#94a3b8' : shift ? '#4ade80' : '#f87171')
      label(`(1-1/2tau) gain    ${preTxt}`, 14, R0 + LH, locked ? '#94a3b8' : preOn ? '#4ade80' : '#f87171')
      label(`tau = ${t.toFixed(2)}   nu = ${nu.toFixed(4)}   fx = ${force.toExponential(2)}`, 14, R0 + 2 * LH, '#cbd5e1')
      label(`u_max analytic = ${uExact.toExponential(3)}    u_max measured = ${uMeas.toExponential(3)}`, 14, R0 + 3 * LH, '#cbd5e1')

      const agree = Math.abs(ratio - predicted) / predicted
      const ok = agree < 0.03
      label('measured / exact amplitude', 330, R0, '#94a3b8')
      label(ratio.toFixed(3), 330, R0 + LH, ok ? '#4ade80' : '#f87171', 'bold 15px ui-monospace, monospace')
      const predName = locked || shift === (preOn ? 1 : 0) ? '1' : shift ? '1 + 1/2tau' : '1 - 1/2tau'
      label(`predicted ${predName} = ${predicted.toFixed(3)}`, 392, R0 + LH, '#fbbf24')
      label(`max |u - u_exact| / u_max = ${relErr.toFixed(2)} %`, 330, R0 + 2 * LH, relErr < 3 ? '#4ade80' : '#f87171')
      label('residual few % at large tau is bounce-back slip, not the forcing', 330, R0 + 3 * LH, '#94a3b8')

      // ---- hint (gently pulsing so the eye lands on it)
      const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(phase * 0.0018))
      ctx.globalAlpha = glow
      label('turn one switch off — the parabola rescales by 1 +- 1/(2 tau)', 14, R0 + 4 * LH + 6, '#22d3ee', '11px ui-monospace, monospace')
      ctx.globalAlpha = 1
    }

    let raf = 0
    const loop = (ts: number) => {
      if (runRef.current) {
        for (let s = 0; s < STEPS_PER_FRAME; s++) step()
      }
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTick])

  const locked = scheme === 'shanchen'
  const btn = (active: boolean, dim = false): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: dim ? 'not-allowed' : 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#22d3ee' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    opacity: dim ? 0.4 : 1,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={640}
        height={370}
        style={{ width: '100%', maxWidth: 640, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '0.7rem' }}>
        {SCHEMES.map((s) => (
          <button key={s} onClick={() => setScheme(s)} style={btn(scheme === s)}>
            {SCHEME_LABEL[s]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setHalfShift((v) => !v)}
          disabled={locked}
          style={btn(!locked && halfShift, locked)}
          title="use u = (j + F/2)/rho inside the equilibrium"
        >
          {halfShift ? '[x]' : '[ ]'} u = (j + F/2)/ρ
        </button>
        <button
          onClick={() => setPrefactor((v) => !v)}
          disabled={locked}
          style={btn(!locked && prefactor, locked)}
          title="multiply the source term by (1 - 1/2tau)"
        >
          {prefactor ? '[x]' : '[ ]'} (1 − 1/2τ) prefactor
        </button>
        {locked && (
          <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>
            Shan–Chen is self-consistent — both switches are baked in
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center', marginTop: '0.6rem', fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          τ
          <input type="range" min={0.6} max={2} step={0.05} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }}>{tau.toFixed(2)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          fx
          <input type="range" min={2e-6} max={1.2e-5} step={1e-7} value={fx} onChange={(e) => setFx(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 62 }}>{fx.toExponential(2)}</span>
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn(false)}>
          {running ? 'pause' : 'run'}
        </button>
        <button onClick={() => setResetTick((v) => v + 1)} style={btn(false)}>
          reset
        </button>
      </div>
    </div>
  )
}
