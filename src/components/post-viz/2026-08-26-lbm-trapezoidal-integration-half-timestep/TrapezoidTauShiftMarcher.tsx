'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One scalar stand-in for the lattice Boltzmann equation along a characteristic
//
//     df/dt = -(f - feq(t)) / lambda + F ,   feq(t) = exp(-t),  f(0) = 0
//
// Integrating the right-hand side with the trapezoidal rule is second order but
// implicit.  The change of variables
//
//     fbar = f + (dt / 2 lambda) (f - feq) - (dt / 2) F
//
// makes it explicit again, at the price of a shifted relaxation time
// tau = lambda/dt + 1/2 and a forcing prefactor (1 - 1/(2 tau)).  The marcher
// below shows that the transformed explicit scheme is not an approximation of
// the trapezoidal one: it reproduces it to machine precision.
// ---------------------------------------------------------------------------

const W = 740
const H = 452

const PX0 = 56
const PX1 = 442
const PY0 = 34
const PY1 = 268

const ZX0 = 500
const ZX1 = 716
const ZY0 = 34
const ZY1 = 268

const LX0 = 56
const LX1 = 442
const LY0 = 314
const LY1 = 432

const T_END = 1.2
const FRC = 0.5

const DTS = [0.3, 0.24, 0.2, 0.15, 0.12, 0.1, 0.075, 0.06, 0.05, 0.04, 0.03, 0.024, 0.02, 0.015, 0.012, 0.01]

const COL_EXACT = '#e2e8f0'
const COL_EULER = '#fb923c'
const COL_TRAP = '#38bdf8'
const COL_XFRM = '#4ade80'

const feq = (t: number) => Math.exp(-t)

function exactF(t: number, lam: number): number {
  const a = 1 / lam
  return (a / (a - 1)) * (Math.exp(-t) - Math.exp(-a * t)) + FRC * lam * (1 - Math.exp(-a * t))
}

// forward Euler on the original equation: right-hand side sampled at the left end only
function marchEuler(dt: number, lam: number): Float64Array {
  const n = Math.round(T_END / dt)
  const out = new Float64Array(n + 1)
  let f = 0
  for (let k = 0; k < n; k++) {
    const t = k * dt
    f += (-dt / lam) * (f - feq(t)) + dt * FRC
    out[k + 1] = f
  }
  return out
}

// trapezoidal rule: both endpoints, hence implicit — solved directly (linear in f)
function marchTrapezoid(dt: number, lam: number): Float64Array {
  const n = Math.round(T_END / dt)
  const out = new Float64Array(n + 1)
  const c = dt / (2 * lam)
  let f = 0
  for (let k = 0; k < n; k++) {
    const t = k * dt
    f = (f - c * (f - feq(t)) + c * feq(t + dt) + dt * FRC) / (1 + c)
    out[k + 1] = f
  }
  return out
}

// the same scheme after the change of variables — fully explicit, tau-shifted
function marchTransformed(dt: number, lam: number): Float64Array {
  const n = Math.round(T_END / dt)
  const tau = lam / dt + 0.5
  const c = dt / (2 * lam)
  const out = new Float64Array(n + 1)
  let fbar = 0 + c * (0 - feq(0)) - 0.5 * dt * FRC
  for (let k = 0; k < n; k++) {
    const t = k * dt
    fbar += -(fbar - feq(t)) / tau + dt * FRC * (1 - 0.5 / tau)
    out[k + 1] = (fbar + 0.5 * dt * FRC + c * feq(t + dt)) / (1 + c)
  }
  return out
}

type Rung = { dt: number; eE: number; eT: number }

function errorLadder(lam: number): Rung[] {
  const ref = exactF(T_END, lam)
  return DTS.map((dt) => {
    const e = marchEuler(dt, lam)
    const t = marchTrapezoid(dt, lam)
    return {
      dt,
      eE: Math.max(1e-9, Math.abs(e[e.length - 1] - ref)),
      eT: Math.max(1e-9, Math.abs(t[t.length - 1] - ref)),
    }
  })
}

export function TrapezoidTauShiftMarcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dtIdx, setDtIdx] = useState(3)
  const [lam, setLam] = useState(0.3)
  const [running, setRunning] = useState(true)
  const [showEuler, setShowEuler] = useState(true)
  const [stat, setStat] = useState({ eE: 0, eT: 0, gap: 0 })

  const dt = DTS[dtIdx]
  const tau = lam / dt + 0.5

  const tracks = useMemo(() => {
    const euler = marchEuler(dt, lam)
    const trap = marchTrapezoid(dt, lam)
    const xfrm = marchTransformed(dt, lam)
    let gap = 0
    for (let k = 0; k < trap.length; k++) gap = Math.max(gap, Math.abs(trap[k] - xfrm[k]))
    return { euler, trap, xfrm, gap }
  }, [dt, lam])

  const ladder = useMemo(() => errorLadder(lam), [lam])

  const live = useRef({ tracks, ladder, dt, lam, tau, running, showEuler })
  live.current = { tracks, ladder, dt, lam, tau, running, showEuler }
  const setStatRef = useRef(setStat)
  setStatRef.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let cursor = 0 // fractional step index, advances at a fixed wall-clock rate
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const px = (t: number) => PX0 + (t / T_END) * (PX1 - PX0)
    const py = (v: number) => PY1 - (v / 0.62) * (PY1 - PY0)

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const wall = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const S = live.current
      const nStep = S.tracks.trap.length - 1
      if (S.running) cursor = (cursor + wall * (nStep / 5)) % (nStep + 0.999)
      const kNow = Math.min(nStep - 1, Math.floor(cursor))

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // =====================================================================
      // LEFT: the three marches against the closed-form solution
      // =====================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0)
      ctx.strokeStyle = 'rgba(226,232,240,0.12)'
      for (let v = 0.1; v < 0.62; v += 0.1) {
        ctx.beginPath()
        ctx.moveTo(PX0, py(v))
        ctx.lineTo(PX1, py(v))
        ctx.stroke()
      }
      text('f (t)', PX0 + 6, PY0 + 15, '#64748b', '10px ui-monospace, monospace')
      text('t', PX1 - 12, PY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text('0.6', PX0 - 28, py(0.6) + 4, '#64748b', '10px ui-monospace, monospace')
      text('0', PX0 - 14, py(0) + 4, '#64748b', '10px ui-monospace, monospace')
      text('0', px(0) - 3, PY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text('1.2', px(T_END) - 12, PY1 + 16, '#64748b', '10px ui-monospace, monospace')

      // closed-form reference
      ctx.strokeStyle = 'rgba(226,232,240,0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i <= 300; i++) {
        const t = (i / 300) * T_END
        const x = px(t)
        const y = py(exactF(t, S.lam))
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      const polyline = (arr: Float64Array, col: string, upto: number, wid: number) => {
        ctx.strokeStyle = col
        ctx.lineWidth = wid
        ctx.beginPath()
        for (let k = 0; k <= upto; k++) {
          const x = px(k * S.dt)
          const y = py(arr[k])
          k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        for (let k = 0; k <= upto; k++) {
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(px(k * S.dt), py(arr[k]), 2.1, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      const upto = Math.min(nStep, Math.floor(cursor))
      if (S.showEuler) polyline(S.tracks.euler, COL_EULER, upto, 1.4)
      polyline(S.tracks.trap, COL_TRAP, upto, 2)

      // transformed march: hollow rings sitting exactly on the trapezoidal dots
      ctx.strokeStyle = COL_XFRM
      ctx.lineWidth = 1.4
      for (let k = 0; k <= upto; k++) {
        ctx.beginPath()
        ctx.arc(px(k * S.dt), py(S.tracks.xfrm[k]), 4.6, 0, 2 * Math.PI)
        ctx.stroke()
      }

      // legend
      const leg: [string, string][] = [
        [COL_EXACT, 'closed form'],
        [COL_TRAP, 'trapezoid (implicit)'],
        [COL_XFRM, 'after change of variables (explicit)'],
      ]
      if (S.showEuler) leg.splice(1, 0, [COL_EULER, 'forward Euler'])
      leg.forEach(([c, s], i) => {
        ctx.fillStyle = c
        ctx.fillRect(PX0 + 8, PY0 + 26 + i * 15, 16, 3)
        text(s, PX0 + 30, PY0 + 30 + i * 15, '#94a3b8', '10px ui-monospace, monospace')
      })

      // =====================================================================
      // RIGHT: one step under the microscope — what area is being estimated
      // =====================================================================
      const tA = kNow * S.dt
      const tB = tA + S.dt
      const rhs = (t: number) => -(exactF(t, S.lam) - feq(t)) / S.lam + FRC
      const pad = S.dt * 0.35
      const zx = (t: number) => ZX0 + ((t - tA + pad) / (S.dt + 2 * pad)) * (ZX1 - ZX0)
      let rMin = 1e9
      let rMax = -1e9
      for (let i = 0; i <= 60; i++) {
        const r = rhs(tA - pad + (i / 60) * (S.dt + 2 * pad))
        rMin = Math.min(rMin, r)
        rMax = Math.max(rMax, r)
      }
      const span = Math.max(0.05, rMax - rMin)
      const zy = (r: number) => ZY1 - 20 - ((r - rMin + 0.15 * span) / (1.5 * span)) * (ZY1 - ZY0 - 40)

      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(ZX0, ZY0, ZX1 - ZX0, ZY1 - ZY0)
      text('right-hand side over one step', ZX0 + 8, ZY0 + 15, '#64748b', '10px ui-monospace, monospace')

      const rA = rhs(tA)
      const rB = rhs(tB)
      const base = zy(rMin - 0.15 * span)

      // Euler: the left value held across the whole step
      if (S.showEuler) {
        ctx.fillStyle = 'rgba(251,146,60,0.20)'
        ctx.fillRect(zx(tA), zy(rA), zx(tB) - zx(tA), base - zy(rA))
        ctx.strokeStyle = COL_EULER
        ctx.lineWidth = 1.2
        ctx.strokeRect(zx(tA), zy(rA), zx(tB) - zx(tA), base - zy(rA))
      }
      // trapezoid: both endpoints
      ctx.fillStyle = 'rgba(56,189,248,0.22)'
      ctx.beginPath()
      ctx.moveTo(zx(tA), base)
      ctx.lineTo(zx(tA), zy(rA))
      ctx.lineTo(zx(tB), zy(rB))
      ctx.lineTo(zx(tB), base)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = COL_TRAP
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(zx(tA), zy(rA))
      ctx.lineTo(zx(tB), zy(rB))
      ctx.stroke()

      // true curve
      ctx.strokeStyle = 'rgba(226,232,240,0.75)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const t = tA - pad + (i / 60) * (S.dt + 2 * pad)
        const x = zx(t)
        const y = zy(rhs(t))
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.fillStyle = COL_TRAP
      ctx.beginPath()
      ctx.arc(zx(tA), zy(rA), 3.4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(zx(tB), zy(rB), 3.4, 0, 2 * Math.PI)
      ctx.fill()
      text('t_n', zx(tA) - 8, base + 14, '#94a3b8', '10px ui-monospace, monospace')
      text('t_n+dt', zx(tB) - 22, base + 14, '#94a3b8', '10px ui-monospace, monospace')

      const areaTrue = exactF(tB, S.lam) - exactF(tA, S.lam)
      const areaEul = S.dt * rA
      const areaTrap = 0.5 * S.dt * (rA + rB)
      text(`exact area   ${areaTrue.toFixed(5)}`, ZX0 + 8, ZY1 - 40, '#e2e8f0', '10px ui-monospace, monospace')
      text(`trapezoid    ${areaTrap.toFixed(5)}`, ZX0 + 8, ZY1 - 26, COL_TRAP, '10px ui-monospace, monospace')
      if (S.showEuler) text(`Euler        ${areaEul.toFixed(5)}`, ZX0 + 8, ZY1 - 12, COL_EULER, '10px ui-monospace, monospace')

      // =====================================================================
      // BOTTOM: endpoint error against dt, log-log
      // =====================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(LX0, LY0, LX1 - LX0, LY1 - LY0)
      const lx = (d: number) => LX0 + ((Math.log10(d) - Math.log10(0.01)) / (Math.log10(0.3) - Math.log10(0.01))) * (LX1 - LX0)
      const ly = (e: number) => LY0 + 10 + ((Math.log10(e) + 0.8) / (-6.5 + 0.8)) * (LY1 - LY0 - 22)

      const rungs = S.ladder
      const ladderLine = (key: 'eE' | 'eT', col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 1.8
        ctx.beginPath()
        rungs.forEach((r, i) => {
          const x = lx(r.dt)
          const y = ly(r[key])
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
      if (S.showEuler) ladderLine('eE', COL_EULER)
      ladderLine('eT', COL_TRAP)

      const here = rungs.reduce((a, b) => (Math.abs(b.dt - S.dt) < Math.abs(a.dt - S.dt) ? b : a))
      ctx.strokeStyle = 'rgba(226,232,240,0.35)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(lx(here.dt), LY0)
      ctx.lineTo(lx(here.dt), LY1)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COL_TRAP
      ctx.beginPath()
      ctx.arc(lx(here.dt), ly(here.eT), 4, 0, 2 * Math.PI)
      ctx.fill()
      if (S.showEuler) {
        ctx.fillStyle = COL_EULER
        ctx.beginPath()
        ctx.arc(lx(here.dt), ly(here.eE), 4, 0, 2 * Math.PI)
        ctx.fill()
      }
      text('endpoint error vs dt  (log-log)', LX0 + 8, LY0 + 14, '#64748b', '10px ui-monospace, monospace')
      text('dt = 0.01', LX0 + 4, LY1 - 5, '#64748b', '10px ui-monospace, monospace')
      text('0.3', LX1 - 26, LY1 - 5, '#64748b', '10px ui-monospace, monospace')
      text('slope 1', LX1 - 122, ly(rungs[rungs.length - 1].eE) - 6, COL_EULER, '10px ui-monospace, monospace')
      text('slope 2', LX1 - 122, ly(rungs[rungs.length - 1].eT) - 6, COL_TRAP, '10px ui-monospace, monospace')

      // =====================================================================
      // BOTTOM RIGHT: the shifted constants
      // =====================================================================
      text('tau = lambda/dt + 1/2', ZX0, LY0 + 16, '#94a3b8', '11px ui-monospace, monospace')
      text(`    = ${S.tau.toFixed(4)}`, ZX0, LY0 + 32, '#fbbf24', '13px ui-monospace, monospace')
      text('forcing prefactor 1 - 1/(2 tau)', ZX0, LY0 + 56, '#94a3b8', '11px ui-monospace, monospace')
      text(`    = ${(1 - 0.5 / S.tau).toFixed(4)}`, ZX0, LY0 + 72, '#fbbf24', '13px ui-monospace, monospace')
      text(`max |trapezoid - transformed| = ${S.tracks.gap.toExponential(1)}`, ZX0, LY0 + 98, COL_XFRM, '10px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) {
        const ref = exactF(T_END, S.lam)
        setStatRef.current({
          eE: Math.abs(S.tracks.euler[nStep] - ref),
          eT: Math.abs(S.tracks.trap[nStep] - ref),
          gap: S.tracks.gap,
        })
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
          {running ? '❙❙ pause' : '▶ march'}
        </button>
        <button style={btn(showEuler)} onClick={() => setShowEuler((p) => !p)}>
          forward Euler
        </button>
        <label style={label}>
          <span style={nameS}>dt</span>
          <input type="range" min={0} max={DTS.length - 1} step={1} value={dtIdx} onChange={(e) => setDtIdx(parseInt(e.target.value, 10))} />
          <span style={mono}>{dt.toFixed(3)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>lambda</span>
          <input type="range" min={0.1} max={0.9} step={0.01} value={lam} onChange={(e) => setLam(parseFloat(e.target.value))} />
          <span style={mono}>{lam.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag <em>dt</em> to the right and watch the bottom panel: the orange line drops one decade per decade, the blue
        one drops two. Euler error {stat.eE.toExponential(2)}, trapezoid {stat.eT.toExponential(2)}. The green rings are
        the explicit scheme obtained after the change of variables — they never leave the blue dots (largest gap{' '}
        {stat.gap.toExponential(1)}), while <em>lambda</em> and <em>dt</em> together move tau off 1.
      </div>
    </div>
  )
}
