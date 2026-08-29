'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Damped capillary wave: what the mesh sets, and what the time step sets.
//
//   A'' + 2 nu k^2 A' + w^2 A = 0 ,  w^2 = sigma k^3 / (rho_A + rho_B)
//
// The discrete solver does not see w. It sees a curvature that carries an
// error of order dx^q, so it marches with
//
//   w_num = w sqrt(1 + C (dx/lambda)^q)
//
// q = 2   -> refining the mesh buys the usual second-order return
// q = 0.5 -> the phase error is set by the curvature alone and the time step
//            column stops mattering: 0.5 and 8 land on the same curve.
// ---------------------------------------------------------------------------

const W = 760
const H = 440

const LAMBDA = 2 * Math.PI
const K = 1.0
const A0 = LAMBDA / 100
const LA = 300 // Laplace number, rho lambda sigma / mu^2
const NU = Math.sqrt(LAMBDA / LA) // rho = sigma = 1
const GAMMA = NU * K * K
const W0 = 1.0
const WD = Math.sqrt(W0 * W0 - GAMMA * GAMMA)
const C_KAPPA = 0.6
const T_END = 25 // in units of w0 t

const SX = 40
const SY = 62
const SW = 680
const SH = 118

const PX = 56
const PY = 232
const PW = 664
const PH = 140

const COL_NUM = '#38bdf8'
const COL_TH = '#cbd5e1'
const COL_ERR = '#fb923c'
const COL_DIM = '#64748b'
const COL_LIQ = 'rgba(56,189,248,0.10)'

const RES = [25, 50, 100, 200]
const STEPS = [0.5, 2, 8]

const analytic = (t: number) => A0 * Math.exp(-GAMMA * t) * (Math.cos(WD * t) + (GAMMA / WD) * Math.sin(WD * t))

type Sim = {
  key: string
  a: number
  v: number
  t: number
  dt: number
  acc: number
  trace: Array<[number, number, number]> // t, A/A0, |A-Ath|/A0
}

const freshSim = (n: number, sigmaFac: number, q: number): Sim => {
  const dx = LAMBDA / n
  const dtSigma = Math.sqrt(Math.pow(dx, 3) / (2 * Math.PI))
  return { key: `${n}|${sigmaFac}|${q}`, a: A0, v: 0, t: 0, dt: sigmaFac * dtSigma, acc: 0, trace: [[0, 1, 0]] }
}

export function CapillaryWaveAmplitudeTracer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [res, setRes] = useState(2) // index into RES
  const [dtIdx, setDtIdx] = useState(1) // index into STEPS
  const [lowOrder, setLowOrder] = useState(true)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ t: 0, amp: 1, l2: 0, nsteps: 0 })

  const live = useRef({ res, dtIdx, lowOrder, running })
  live.current = { res, dtIdx, lowOrder, running }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let sim = freshSim(RES[live.current.res], STEPS[live.current.dtIdx], live.current.lowOrder ? 0.5 : 2)
    let nsteps = 0

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { res: r, dtIdx: d, lowOrder: lo, running: run } = live.current
      const n = RES[r]
      const sFac = STEPS[d]
      const q = lo ? 0.5 : 2
      const dx = LAMBDA / n
      const wNum = W0 * Math.sqrt(1 + C_KAPPA * Math.pow(dx / LAMBDA, q))

      const key = `${n}|${sFac}|${q}`
      if (key !== sim.key) {
        sim = freshSim(n, sFac, q)
        nsteps = 0
      }

      // ------- march the discrete wave forward by ~0.16 of w0 t per frame -----
      if (run && sim.t < T_END) {
        const target = Math.min(sim.t + 0.16, T_END)
        let guard = 0
        while (sim.t < target && guard++ < 3000) {
          const h = 0.5 * sim.dt
          const rhsA = sim.a + h * sim.v
          const rhsV = sim.v + h * (-wNum * wNum * sim.a - 2 * GAMMA * sim.v)
          const det = 1 + 2 * GAMMA * h + h * h * wNum * wNum
          const aNew = ((1 + 2 * GAMMA * h) * rhsA + h * rhsV) / det
          const vNew = (-h * wNum * wNum * rhsA + rhsV) / det
          sim.a = aNew
          sim.v = vNew
          sim.t += sim.dt
          nsteps++
          const e = sim.a - analytic(sim.t)
          sim.acc += e * e * sim.dt
        }
        sim.trace.push([sim.t, sim.a / A0, Math.abs(sim.a - analytic(sim.t)) / A0])
        if (sim.trace.length > 1400) sim.trace.shift()
      }

      const l2 = sim.t > 0 ? Math.sqrt(sim.acc / sim.t) / A0 : 0

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      text('capillary wave, density ratio 1000 : solver (blue) vs Prosperetti (grey)', 34, 26, '#e2e8f0', '12px system-ui, sans-serif')
      text(
        `lambda/dx = ${n}   dt/dt_sigma = ${sFac}   curvature error ~ dx^${q}   |   dt = ${sim.dt.toExponential(2)}`,
        34,
        46,
        '#94a3b8',
      )

      // ---------------- interface stage ----------------
      ctx.fillStyle = COL_LIQ
      ctx.fillRect(SX, SY + SH / 2, SW, SH / 2)
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.lineWidth = 1
      ctx.strokeRect(SX, SY, SW, SH)
      for (let i = 1; i < n; i++) {
        if (n > 60 && i % Math.round(n / 50) !== 0) continue
        const x = SX + (i / n) * SW
        ctx.strokeStyle = 'rgba(148,163,184,0.10)'
        ctx.beginPath()
        ctx.moveTo(x, SY)
        ctx.lineTo(x, SY + SH)
        ctx.stroke()
      }
      text('fluid A (heavy)', SX + 6, SY + SH - 8, COL_DIM, '10px ui-monospace, monospace')
      text('fluid B (light)', SX + 6, SY + 14, COL_DIM, '10px ui-monospace, monospace')

      const mid = SY + SH / 2
      const gain = (SH / 2 - 8) / A0
      const wave = (amp: number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i <= 160; i++) {
          const x = SX + (i / 160) * SW
          const y = mid - amp * gain * Math.sin((2 * Math.PI * i) / 160)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      wave(analytic(sim.t), 'rgba(203,213,225,0.55)', [5, 4])
      wave(sim.a, COL_NUM, [])
      text(`w0 t = ${sim.t.toFixed(1)}`, SX + SW - 84, SY - 8, COL_DIM, '11px ui-monospace, monospace')
      text('interface, amplitude scaled to fill the box (A0 = lambda/100)', SX, SY - 8, COL_DIM, '10px ui-monospace, monospace')

      // ---------------- amplitude trace ----------------
      const tx = (t: number) => PX + (t / T_END) * PW
      const ty = (a: number) => PY + PH / 2 - (a * PH) / 2.4

      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.beginPath()
      ctx.moveTo(PX, ty(0))
      ctx.lineTo(PX + PW, ty(0))
      ctx.stroke()
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.strokeRect(PX, PY, PW, PH)
      for (const a of [-1, 1]) text(a.toFixed(0), PX - 22, ty(a) + 4, COL_DIM, '10px ui-monospace, monospace')
      text('0', PX - 22, ty(0) + 4, COL_DIM, '10px ui-monospace, monospace')
      text('A / A0', PX - 46, PY - 8, COL_TH, '11px ui-monospace, monospace')
      for (let t = 0; t <= T_END; t += 5) text(`${t}`, tx(t) - 4, PY + PH + 16, COL_DIM, '10px ui-monospace, monospace')
      text('w0 t', PX + PW - 20, PY + PH + 32, COL_DIM, '10px ui-monospace, monospace')

      ctx.strokeStyle = 'rgba(203,213,225,0.45)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      for (let i = 0; i <= 400; i++) {
        const t = (i / 400) * Math.max(sim.t, 0.001)
        const x = tx(t)
        const y = ty(analytic(t) / A0)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = COL_NUM
      ctx.lineWidth = 2
      ctx.beginPath()
      sim.trace.forEach(([t, a], i) => {
        const x = tx(t)
        const y = ty(a)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // error curve, magnified
      ctx.strokeStyle = COL_ERR
      ctx.lineWidth = 1.5
      ctx.beginPath()
      sim.trace.forEach(([t, , e], i) => {
        const x = tx(t)
        const y = PY + PH - Math.min(e * 4, 1) * (PH - 6)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      text('|A - A_th| / A0  (x4)', PX + PW - 132, PY + PH - 6, COL_ERR, '10px ui-monospace, monospace')

      // ---------------- readouts ----------------
      text(`steps taken : ${nsteps}`, 34, H - 34, COL_DIM, '12px ui-monospace, monospace')
      text(`L2 so far : ${l2.toExponential(2)}`, 210, H - 34, COL_ERR, '12px ui-monospace, monospace')
      text(
        q === 0.5
          ? 'phase error is owned by the curvature - the dt slider barely moves L2'
          : 'curvature converges, so both the mesh and dt still buy accuracy',
        400,
        H - 34,
        q === 0.5 ? '#f87171' : '#4ade80',
        '12px system-ui, sans-serif',
      )

      frame++
      if (frame % 12 === 0) push.current({ t: sim.t, amp: sim.a / A0, l2, nsteps })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }
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
          <span style={nameS}>lambda/dx</span>
          <input type="range" min={0} max={3} step={1} value={res} onChange={(e) => setRes(parseInt(e.target.value, 10))} />
          <span style={mono}>{RES[res]}</span>
        </label>
        <label style={label}>
          <span style={nameS}>dt/dt_sigma</span>
          <input type="range" min={0} max={2} step={1} value={dtIdx} onChange={(e) => setDtIdx(parseInt(e.target.value, 10))} />
          <span style={mono}>{STEPS[dtIdx]}</span>
        </label>
        <button style={btn(lowOrder)} onClick={() => setLowOrder((p) => !p)}>
          curvature dx^{lowOrder ? '0.5' : '2'}
        </button>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        With <em>curvature dx^2</em> on, refine the mesh and L2 drops by about four each time — the textbook return.
        Switch to <em>curvature dx^0.5</em> and sweep <em>dt/dt_sigma</em> from 0.5 to 8: the blue curve hardly moves and
        L2 stays near {stat.l2 > 0 ? stat.l2.toExponential(1) : '5e-2'}. The time step stopped being the thing that
        limits the answer.
      </div>
    </div>
  )
}

export default CapillaryWaveAmplitudeTracer
