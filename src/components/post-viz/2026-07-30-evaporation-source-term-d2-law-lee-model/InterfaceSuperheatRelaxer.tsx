'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The Lee model's relaxation coefficient r, and what picking it wrong costs.
//
// A heated wall on the left, saturated liquid to the right. Energy diffuses in
// and the Lee source converts local superheat into vapor:
//
//   m''' = r * alpha_l * rho_l * (T - T_sat)/T_sat        (T > T_sat, boiling)
//   m''' = -r * alpha_v * rho_v * (T_sat - T)/T_sat       (T < T_sat, condensing)
//
//   rho cp dT/dt = d/dx( k dT/dx ) - m''' * L
//   d(alpha_l)/dt = -m''' / rho_l
//
// r is NOT physics. It is a numerical relaxation rate whose job is to pin the
// interface cell to T_sat so that the evaporation rate becomes HEAT-limited,
// i.e. so the Stefan condition emerges on its own. Three outcomes:
//
//   r too small   superheated liquid survives, m''' too low, front barely moves
//   r about right T sits on T_sat, the wall heat flux sets the front speed
//   r too large   explicit source is stiff: S = r*(rho_l L)/(T_sat rho cp)*dt
//                 exceeds 2 and the interface cell rings
//
// The point of the slider is that the middle window is narrow and neither
// neighbor is a small error - one under-predicts boiling, the other diverges.
// ---------------------------------------------------------------------------

const N = 48
const LX = 1.5e-3 // m, column length
const DX = LX / N
const DT = 1e-5 // s, explicit solver step
const SUBSTEPS = 1200 // per animation frame

const T_SAT = 373.15
const L_VAP = 2.26e6
const RHO_L = 958
const RHO_V = 0.6
const CP_L = 4220
const CP_V = 2080
const K_L = 0.6
const K_V = 0.025

// stiffness of the explicit Lee source at alpha_l = 1
const STIFF_PER_R = (RHO_L * L_VAP) / (T_SAT * RHO_L * CP_L) // = L/(T_sat cp_l)

const TRACE = 260

const FX0 = 16
const FY0 = 74
const FW = 420
const FH = 66

const PX0 = 62
const PY0 = 168
const PW = 374
const PH = 138

const QX0 = 470
const QY0 = 168
const QW = 168
const QH = 138

export function InterfaceSuperheatRelaxer() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [logR, setLogR] = useState(3.3)
  const [dTw, setDTw] = useState(10)
  const [running, setRunning] = useState(true)
  const [showAlpha, setShowAlpha] = useState(true)

  const logRRef = useRef(logR)
  const dTwRef = useRef(dTw)
  const runRef = useRef(running)
  const alphaRef = useRef(showAlpha)
  logRRef.current = logR
  dTwRef.current = dTw
  runRef.current = running
  alphaRef.current = showAlpha

  const resetRef = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const T = new Float64Array(N)
    const al = new Float64Array(N)
    const mdot = new Float64Array(N)
    const Tn = new Float64Array(N)
    const trace = new Float64Array(TRACE)
    let traceN = 0
    let simT = 0
    let lastReset = resetRef.current

    const init = () => {
      for (let i = 0; i < N; i++) {
        T[i] = T_SAT
        al[i] = 1
      }
      trace.fill(0)
      traceN = 0
      simT = 0
    }
    init()

    const step = (rv: number, dTwv: number) => {
      const Twall = T_SAT + dTwv

      for (let i = 0; i < N; i++) {
        const a = al[i]
        // Lee source, both directions
        if (T[i] > T_SAT) mdot[i] = rv * a * RHO_L * (T[i] - T_SAT) / T_SAT
        else mdot[i] = -rv * (1 - a) * RHO_V * (T_SAT - T[i]) / T_SAT
      }

      for (let i = 0; i < N; i++) {
        const a = al[i]
        const rho = a * RHO_L + (1 - a) * RHO_V
        const cp = a * CP_L + (1 - a) * CP_V
        const kc = a * K_L + (1 - a) * K_V

        // harmonic-mean face conductivities against the neighbors
        const aW = i === 0 ? 1 : al[i - 1]
        const aE = i === N - 1 ? a : al[i + 1]
        const kW = aW * K_L + (1 - aW) * K_V
        const kE = aE * K_L + (1 - aE) * K_V
        const kfW = (2 * kc * kW) / (kc + kW)
        const kfE = (2 * kc * kE) / (kc + kE)

        const TW = i === 0 ? Twall : T[i - 1]
        const TE = i === N - 1 ? T[i] : T[i + 1] // adiabatic right end
        // the wall face is half a cell away
        const condW = i === 0 ? (2 * kfW * (TW - T[i])) / (DX * DX) : (kfW * (TW - T[i])) / (DX * DX)
        const condE = (kfE * (TE - T[i])) / (DX * DX)

        Tn[i] = T[i] + (DT * (condW + condE - mdot[i] * L_VAP)) / (rho * cp)
      }

      for (let i = 0; i < N; i++) {
        T[i] = Math.min(3000, Math.max(120, Number.isFinite(Tn[i]) ? Tn[i] : T_SAT))
        al[i] = Math.min(1, Math.max(0, al[i] - (DT * mdot[i]) / RHO_L))
      }
      simT += DT
    }

    const text = (s: string, x: number, y: number, col: string, font = '10px ui-monospace, monospace') => {
      ctx.font = font
      ctx.fillStyle = col
      ctx.fillText(s, x, y)
    }

    const draw = (ts: number) => {
      const rv = Math.pow(10, logRRef.current)
      const dTwv = dTwRef.current

      if (resetRef.current !== lastReset) {
        lastReset = resetRef.current
        init()
      }
      if (runRef.current) for (let s = 0; s < SUBSTEPS; s++) step(rv, dTwv)

      // diagnostics
      let maxSup = 0
      let minSub = 0
      let front = 0
      let vapFrac = 0
      for (let i = 0; i < N; i++) {
        if (al[i] > 0.02) maxSup = Math.max(maxSup, T[i] - T_SAT)
        minSub = Math.min(minSub, T[i] - T_SAT)
        vapFrac += 1 - al[i]
        if (al[i] < 0.5) front = i + 1
      }
      vapFrac /= N
      const stiff = rv * STIFF_PER_R * DT

      if (runRef.current) {
        if (traceN < TRACE) trace[traceN++] = maxSup
        else {
          for (let i = 1; i < TRACE; i++) trace[i - 1] = trace[i]
          trace[TRACE - 1] = maxSup
        }
      }

      const regime =
        stiff > 1.6
          ? { name: 'unstable — stiff source, interface cell rings', col: '#f87171' }
          : maxSup > 0.25 * dTwv
            ? { name: 'under-relaxed — superheated liquid survives', col: '#fbbf24' }
            : { name: 'near equilibrium — T pinned to T_sat', col: '#4ade80' }

      // ------------------------------------------------------------ background
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, c.width, c.height)

      text('Lee model:  m‴ = r · α_l · ρ_l · (T − T_sat)/T_sat', 14, 20, '#e2e8f0', '11px ui-monospace, monospace')
      text('r is a numerical relaxation rate, not a property — its job is to pin the interface cell to T_sat', 14, 36, '#94a3b8')
      text(`heated wall  T_wall = T_sat + ${dTwv.toFixed(0)} K  →`, 16, 62, '#fbbf24')
      text('adiabatic →|', FX0 + FW - 58, 62, '#94a3b8')

      // ------------------------------------------------------------ column strip
      const cw = FW / N
      for (let i = 0; i < N; i++) {
        const sup = Math.max(-1, Math.min(1, (T[i] - T_SAT) / Math.max(1, dTwv)))
        // blue (subcooled) -> slate (saturated) -> amber (superheated)
        let col: string
        if (sup >= 0) {
          const r0 = Math.round(100 + 151 * sup)
          const g0 = Math.round(116 + 75 * sup)
          const b0 = Math.round(139 - 103 * sup)
          col = `rgb(${r0},${g0},${b0})`
        } else {
          const s = -sup
          col = `rgb(${Math.round(100 - 63 * s)},${Math.round(116 - 15 * s)},${Math.round(139 + 96 * s)})`
        }
        ctx.fillStyle = col
        ctx.fillRect(FX0 + i * cw, FY0, cw + 0.6, FH)

        // vapor as void: erase with the background, leave a thin liquid band
        const vf = 1 - al[i]
        if (vf > 0.01) {
          ctx.fillStyle = `rgba(8,17,31,${(0.82 * vf).toFixed(3)})`
          ctx.fillRect(FX0 + i * cw, FY0, cw + 0.6, FH)
          ctx.fillStyle = `rgba(251,191,36,${(0.22 * vf).toFixed(3)})`
          ctx.fillRect(FX0 + i * cw, FY0, cw + 0.6, FH)
        }
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(FX0, FY0, FW, FH)

      // interface marker
      if (front > 0) {
        const xf = FX0 + front * cw
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(xf, FY0 - 5)
        ctx.lineTo(xf, FY0 + FH + 5)
        ctx.stroke()
        text('interface', Math.min(xf + 4, FX0 + FW - 52), FY0 + FH + 16, '#22d3ee')
      }
      text('vapor (dark)', FX0 + 4, FY0 - 5, '#fbbf24')
      text('liquid (warm = superheated)', FX0 + FW - 152, FY0 - 5, '#93c5fd')

      // ------------------------------------------------------------ T profile
      const tSpan = Math.max(2, dTwv * 1.25)
      const gx = (i: number) => PX0 + (i / (N - 1)) * PW
      const gy = (dT: number) => PY0 + PH / 2 - (dT / tSpan) * (PH / 2)

      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(PX0, PY0, PW, PH)

      // T_sat datum
      ctx.strokeStyle = 'rgba(74,222,128,0.75)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.moveTo(PX0, gy(0))
      ctx.lineTo(PX0 + PW, gy(0))
      ctx.stroke()
      ctx.setLineDash([])
      text('T_sat', PX0 + 3, gy(0) - 4, '#4ade80')

      // the surviving-superheat region, shaded
      ctx.beginPath()
      ctx.moveTo(gx(0), gy(0))
      for (let i = 0; i < N; i++) ctx.lineTo(gx(i), gy(Math.max(0, T[i] - T_SAT)))
      ctx.lineTo(gx(N - 1), gy(0))
      ctx.closePath()
      ctx.fillStyle = 'rgba(251,191,36,0.16)'
      ctx.fill()

      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const X = gx(i)
        const Y = gy(Math.max(-tSpan, Math.min(tSpan, T[i] - T_SAT)))
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.strokeStyle = regime.col
      ctx.lineWidth = 2
      ctx.stroke()

      if (alphaRef.current) {
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const X = gx(i)
          const Y = PY0 + PH - al[i] * PH
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.strokeStyle = 'rgba(34,211,238,0.7)'
        ctx.lineWidth = 1.4
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
        text('α_l  0→1', PX0 + PW - 54, PY0 + PH - 6, '#22d3ee')
      }

      text('T − T_sat [K]', PX0 - 46, PY0 - 6, '#cbd5e1')
      text(`+${tSpan.toFixed(0)}`, PX0 - 24, PY0 + 8, '#94a3b8')
      text(`−${tSpan.toFixed(0)}`, PX0 - 24, PY0 + PH - 2, '#94a3b8')
      text('wall', PX0 - 2, PY0 + PH + 14, '#94a3b8')
      text('1.5 mm', PX0 + PW - 34, PY0 + PH + 14, '#94a3b8')

      // ------------------------------------------------------------ superheat trace
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(QX0, QY0, QW, QH)
      let tmax = 0.6
      for (let i = 0; i < traceN; i++) tmax = Math.max(tmax, trace[i])
      ctx.beginPath()
      for (let i = 0; i < traceN; i++) {
        const X = QX0 + (i / (TRACE - 1)) * QW
        const Y = QY0 + QH - (trace[i] / tmax) * (QH - 8)
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.strokeStyle = regime.col
      ctx.lineWidth = 1.6
      ctx.stroke()
      text('max liquid superheat, history', QX0, QY0 - 6, '#cbd5e1')
      text(`${tmax.toFixed(2)} K`, QX0 + QW - 44, QY0 + 10, '#94a3b8')
      text('0', QX0 + 3, QY0 + QH - 3, '#94a3b8')
      text('a flat line means r is doing its job', QX0, QY0 + QH + 14, '#94a3b8')

      // ------------------------------------------------------------ readouts
      const R0 = 330
      const LH = 15
      text(`r = ${rv.toExponential(2)} s⁻¹`, 14, R0, '#fbbf24')
      text(`S = r·L/(T_sat·c_p)·Δt = ${stiff.toFixed(2)}   (explicit limit 2)`, 150, R0, stiff > 1.6 ? '#f87171' : '#e2e8f0')
      text(`t = ${simT.toFixed(2)} s`, 470, R0, '#94a3b8')
      text(`max superheat = ${maxSup.toFixed(2)} K  of ${dTwv.toFixed(0)} K applied`, 14, R0 + LH, '#e2e8f0')
      text(`min subcool = ${minSub.toFixed(2)} K`, 300, R0 + LH, minSub < -0.5 ? '#f87171' : '#94a3b8')
      text(`vapor volume fraction = ${(vapFrac * 100).toFixed(1)} %`, 450, R0 + LH, '#22d3ee')

      ctx.font = 'bold 11px ui-monospace, monospace'
      const bw = ctx.measureText(regime.name).width + 18
      ctx.fillStyle = regime.col
      ctx.globalAlpha = 0.16
      ctx.fillRect(14, R0 + 2 * LH - 1, bw, 18)
      ctx.globalAlpha = 1
      ctx.strokeStyle = regime.col
      ctx.lineWidth = 1
      ctx.strokeRect(14, R0 + 2 * LH - 1, bw, 18)
      text(regime.name, 23, R0 + 2 * LH + 12, regime.col, 'bold 11px ui-monospace, monospace')

      const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.0018))
      ctx.globalAlpha = glow
      text('sweep r across the slider — green covers only about two of the five decades', 24 + bw, R0 + 2 * LH + 12, '#22d3ee', '11px ui-monospace, monospace')
      ctx.globalAlpha = 1
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#fbbf24' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={660}
        height={390}
        style={{ width: '100%', maxWidth: 660, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center', marginTop: '0.7rem', fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          log₁₀ r
          <input type="range" min={1} max={6} step={0.05} value={logR} onChange={(e) => setLogR(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 64 }}>
            {Math.pow(10, logR).toExponential(1)}
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ΔT_wall
          <input type="range" min={2} max={30} step={1} value={dTw} onChange={(e) => setDTw(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }}>{dTw.toFixed(0)} K</span>
        </label>
        <button onClick={() => setRunning((v) => !v)} style={btn(running)}>
          {running ? '❚❚ pause' : '▶ run'}
        </button>
        <button
          onClick={() => {
            resetRef.current += 1
          }}
          style={btn(false)}
        >
          ↺ reset column
        </button>
        <button onClick={() => setShowAlpha((v) => !v)} style={btn(showAlpha)}>
          {showAlpha ? '[x]' : '[ ]'} α_l profile
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace', lineHeight: 1.55 }}>
        What to watch: the amber shaded area is superheat the model failed to convert into vapor. Drag r down to 10² and
        the area swells while the interface stalls — the wall keeps pouring in heat and nothing boils. Push past 10⁵ and S
        crosses 2: the profile starts ringing and the history trace turns into a sawtooth. Green sits in between — roughly
        10³ to 10⁵ here — and that window moves whenever you change Δt or the mesh.
      </p>
    </div>
  )
}
