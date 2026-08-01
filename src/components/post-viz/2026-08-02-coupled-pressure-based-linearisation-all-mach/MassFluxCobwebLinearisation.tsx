'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The whole convergence question of a coupled pressure-based solver, boiled
// down to one nonlinear scalar equation and its fixed-point iteration.
//
// One cell, isothermal ideal gas, mass flux through a face:
//
//   rho(p) = p / a_T^2                 density from the equation of state
//   theta(p) = u0 - dhat (p - p0)      advecting velocity (momentum-weighted)
//   m(p) = rho(p) theta(p) = mdot*     the discrete continuity equation
//
// Non-dimensionalised with P = p/p0 and m/(rho0 u0):
//
//   m(P) = P [ 1 - D (P - 1) ],   D = dhat p0 / u0 = Co / M
//
// with M = u0/a_T the Mach number and Co = a_T dt / dx the acoustic Courant
// number. The two linearisations of rho*theta give two different iteration
// maps for the SAME equation:
//
//   fixed-coefficient   rho^(n) theta^(n+1) = mdot*
//                       -> P^(n+1) = 1 + (1 - 1/P^(n)) / D
//                       -> g'(1) = 1/D = M/Co
//
//   Newton              rho^(n) theta^(n+1) + rho^(n+1) theta^(n)
//                        - rho^(n) theta^(n) = mdot*
//                       -> exactly Newton's method on m(P) - 1 = 0
//
// So the fixed-coefficient iteration is a contraction only while M < Co. Push
// the Mach number past the acoustic Courant number and the physical root P = 1
// turns into a repeller, no matter how good the initial guess is.
//
// m(P) = 1 is a quadratic with TWO roots, P = 1 and P = 1/D = M/Co. What the
// cobweb shows past M = Co is therefore not always a blow-up: usually the
// iterate is dragged across to the other branch and settles there, on a
// pressure that solves the discretised equation but is not the state the time
// step started from. Only for large M/Co does it leave the physical branch
// altogether. Newton keeps the extra term and converges quadratically in
// either regime.
// ---------------------------------------------------------------------------

const W = 690
const H = 452

const AX = 44 // cobweb panel
const AY = 34
const AS = 274 // square side

const BX = 396 // residual panel
const BY = 34
const BW = 272
const BH = 274

const NMAX = 40
const ETA = 1e-10 // solution tolerance, as in the paper

type Mode = 'fixed' | 'newton'

type Outcome = 'physical' | 'other-branch' | 'diverged' | 'stalled'

type Traj = {
  p: number[]
  res: number[]
  outcome: Outcome
  hi: number
  gp: number // |g'| at the physical root
  nConv: number // iterations to reach ETA, -1 if never
}

function buildTraj(D: number, mode: Mode, pInit: number): Traj {
  const m = (P: number) => P * (1 - D * (P - 1))
  const step = (P: number) => {
    if (mode === 'fixed') return 1 + (1 - 1 / P) / D
    const F = m(P) - 1
    const dF = 1 + D - 2 * D * P
    if (Math.abs(dF) < 1e-14) return NaN
    return P - F / dF
  }

  const p: number[] = [pInit]
  const res: number[] = [Math.abs(m(pInit) - 1)]
  let outcome: Outcome = 'stalled'
  let nConv = -1

  for (let n = 0; n < NMAX; n++) {
    const prev = p[p.length - 1]
    if (res[res.length - 1] < ETA) {
      nConv = n
      break
    }
    const next = step(prev)
    if (!Number.isFinite(next) || next <= 0.02 || next > 8) {
      p.push(Math.max(0.02, Math.min(8, Number.isFinite(next) ? next : 8)))
      res.push(1e3)
      outcome = 'diverged'
      break
    }
    p.push(next)
    res.push(Math.abs(m(next) - 1))
  }
  if (nConv >= 0) {
    // m(P) = 1 has two roots: the physical P = 1 and the other branch P = 1/D
    outcome = Math.abs(p[p.length - 1] - 1) < 1e-4 ? 'physical' : 'other-branch'
  }

  const hi = Math.max(2.05, Math.min(6, 1.12 * Math.max(...p, 1 / D)))
  return { p, res, outcome, hi, gp: mode === 'fixed' ? 1 / D : 0, nConv }
}

const PRESETS: { name: string; M: number; Co: number }[] = [
  { name: 'acoustic wave', M: 0.003, Co: 0.1 },
  { name: 'Sod shock tube', M: 0.9, Co: 0.4 },
  { name: 'forward step  M=3', M: 3.0, Co: 0.9 },
]

export function MassFluxCobwebLinearisation() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [logM, setLogM] = useState(Math.log10(0.9))
  const [logCo, setLogCo] = useState(Math.log10(0.4))
  const [mode, setMode] = useState<Mode>('fixed')
  const [pInit, setPInit] = useState(1.18)
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)

  const M = Math.pow(10, logM)
  const Co = Math.pow(10, logCo)
  const D = Co / M

  // `tick` only exists so that the restart button rebuilds the trajectory
  // object, which resets the reveal animation.
  const traj = useMemo(() => buildTraj(D, mode, pInit), [D, mode, pInit, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useRef(0)
  const s = useRef({ traj, running, mode, D })
  s.current = { traj, running, mode, D }

  useEffect(() => {
    shown.current = 0
  }, [traj])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let last = -1

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = (ts: number) => {
      const dt = last < 0 ? 0 : Math.min((ts - last) / 1000, 0.05)
      last = ts
      const st = s.current
      const nSeg = st.traj.p.length - 1
      if (st.running && shown.current < nSeg) shown.current = Math.min(nSeg, shown.current + dt * 2.0)

      const lo = 0.02
      const hi = st.traj.hi
      const mFn = (P: number) => P * (1 - st.D * (P - 1))
      const gFn = (P: number) => {
        if (st.mode === 'fixed') return 1 + (1 - 1 / P) / st.D
        const dF = 1 + st.D - 2 * st.D * P
        if (Math.abs(dF) < 1e-12) return NaN
        return P - (mFn(P) - 1) / dF
      }

      const cx = (P: number) => AX + ((P - lo) / (hi - lo)) * AS
      const cy = (P: number) => AY + AS - ((P - lo) / (hi - lo)) * AS

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ================= cobweb panel =================
      ctx.fillStyle = 'rgba(148,163,184,0.05)'
      ctx.fillRect(AX, AY, AS, AS)
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.strokeRect(AX, AY, AS, AS)

      // gridlines at integer P
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let k = 1; k <= Math.floor(hi); k++) {
        ctx.beginPath()
        ctx.moveTo(cx(k), AY)
        ctx.lineTo(cx(k), AY + AS)
        ctx.moveTo(AX, cy(k))
        ctx.lineTo(AX + AS, cy(k))
        ctx.stroke()
      }

      // diagonal P^(n+1) = P^(n)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(cx(lo), cy(lo))
      ctx.lineTo(cx(hi), cy(hi))
      ctx.stroke()
      ctx.setLineDash([])

      // the iteration map g(P)
      const col = st.mode === 'fixed' ? '#fbbf24' : '#22d3ee'
      ctx.strokeStyle = col
      ctx.lineWidth = 2
      ctx.beginPath()
      let pen = false
      for (let i = 0; i <= 400; i++) {
        const P = lo + ((hi - lo) * i) / 400
        const G = gFn(P)
        if (!Number.isFinite(G) || G < lo - 1 || G > hi + 1) {
          pen = false
          continue
        }
        if (!pen) {
          ctx.moveTo(cx(P), cy(G))
          pen = true
        } else ctx.lineTo(cx(P), cy(G))
      }
      ctx.stroke()

      // the other branch of the quadratic, P = 1/D = M/Co
      const pOther = 1 / st.D
      if (pOther > lo && pOther < hi && Math.abs(pOther - 1) > 0.03) {
        ctx.fillStyle = 'rgba(248,113,113,0.9)'
        ctx.beginPath()
        ctx.arc(cx(pOther), cy(pOther), 4, 0, Math.PI * 2)
        ctx.fill()
        const lbl = `other branch  P = M/Co = ${pOther.toFixed(2)}`
        const lw = lbl.length * 6.1
        const lx0 = cx(pOther) + 8 + lw > AX + AS ? cx(pOther) - 8 - lw : cx(pOther) + 8
        text(lbl, lx0, cy(pOther) + 14, '#f87171')
      }

      // physical root P = 1
      ctx.fillStyle = '#34d399'
      ctx.beginPath()
      ctx.arc(cx(1), cy(1), 4.5, 0, Math.PI * 2)
      ctx.fill()
      text('physical root  P = 1', cx(1) + 8, cy(1) - 7, '#34d399')

      // cobweb staircase, revealed one segment at a time
      const done = Math.floor(shown.current)
      const frac = shown.current - done
      const bad = st.traj.outcome !== 'physical'
      const trace =
        st.traj.outcome === 'physical' ? [52, 211, 153] : st.traj.outcome === 'diverged' ? [248, 113, 113] : [251, 191, 36]
      ctx.lineWidth = 1.6
      for (let n = 0; n < Math.min(done + 1, st.traj.p.length - 1); n++) {
        const P = st.traj.p[n]
        const G = st.traj.p[n + 1]
        const t = n < done ? 1 : frac
        const a = 0.25 + 0.75 * ((n + 1) / st.traj.p.length)
        ctx.strokeStyle = `rgba(${trace[0]},${trace[1]},${trace[2]},${a})`
        ctx.beginPath()
        ctx.moveTo(cx(P), cy(P))
        ctx.lineTo(cx(P), cy(P + (G - P) * Math.min(1, t * 2))) // vertical to the curve
        ctx.stroke()
        if (t > 0.5) {
          const u = Math.min(1, (t - 0.5) * 2)
          ctx.beginPath()
          ctx.moveTo(cx(P), cy(G))
          ctx.lineTo(cx(P + (G - P) * u), cy(G)) // horizontal back to the diagonal
          ctx.stroke()
        }
      }

      // current iterate marker
      const idx = Math.min(st.traj.p.length - 1, Math.round(shown.current))
      const Pc = st.traj.p[idx]
      ctx.fillStyle = bad && idx === st.traj.p.length - 1 ? '#f87171' : '#f8fafc'
      ctx.beginPath()
      ctx.arc(cx(Pc), cy(Pc), 4, 0, Math.PI * 2)
      ctx.fill()
      text(`P⁽${idx}⁾ = ${Pc.toFixed(4)}`, AX + 6, AY + 16, '#f8fafc')

      text('P⁽ⁿ⁾  = p / p₀', AX + AS / 2 - 34, AY + AS + 16, '#64748b')
      ctx.save()
      ctx.translate(17, AY + AS / 2 + 32)
      ctx.rotate(-Math.PI / 2)
      text('P⁽ⁿ⁺¹⁾', 0, 0, '#64748b')
      ctx.restore()
      text(
        st.mode === 'fixed' ? 'fixed-coefficient map' : 'Newton map',
        AX + 6,
        AY - 10,
        col,
        'bold 12px ui-monospace, monospace'
      )

      // ================= residual panel =================
      ctx.fillStyle = 'rgba(148,163,184,0.05)'
      ctx.fillRect(BX, BY, BW, BH)
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(BX, BY, BW, BH)

      const LOGLO = -13
      const LOGHI = 1
      const rx = (n: number) => BX + (n / (NMAX - 1)) * BW
      const ry = (L: number) => BY + BH - ((L - LOGLO) / (LOGHI - LOGLO)) * BH

      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let L = LOGHI; L >= LOGLO; L -= 3) {
        ctx.beginPath()
        ctx.moveTo(BX, ry(L))
        ctx.lineTo(BX + BW, ry(L))
        ctx.stroke()
        text(`1e${L}`, BX - 34, ry(L) + 4, '#64748b', '10px ui-monospace, monospace')
      }

      // tolerance line
      ctx.strokeStyle = 'rgba(52,211,153,0.55)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(BX, ry(Math.log10(ETA)))
      ctx.lineTo(BX + BW, ry(Math.log10(ETA)))
      ctx.stroke()
      ctx.setLineDash([])
      text('η = 1e-10', BX + BW - 66, ry(Math.log10(ETA)) - 5, '#34d399', '10px ui-monospace, monospace')

      ctx.strokeStyle = `rgb(${trace[0]},${trace[1]},${trace[2]})`
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let n = 0; n <= Math.min(done, st.traj.res.length - 1); n++) {
        const L = Math.max(LOGLO, Math.min(LOGHI, Math.log10(Math.max(st.traj.res[n], 1e-16))))
        if (n === 0) ctx.moveTo(rx(n), ry(L))
        else ctx.lineTo(rx(n), ry(L))
      }
      ctx.stroke()
      for (let n = 0; n <= Math.min(done, st.traj.res.length - 1); n++) {
        const L = Math.max(LOGLO, Math.min(LOGHI, Math.log10(Math.max(st.traj.res[n], 1e-16))))
        ctx.fillStyle = `rgb(${trace[0]},${trace[1]},${trace[2]})`
        ctx.beginPath()
        ctx.arc(rx(n), ry(L), 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      text('‖r‖  (mass-flux residual)', BX + 4, BY - 10, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text('nonlinear iteration  n', BX + BW / 2 - 52, BY + BH + 16, '#64748b')

      // ================= readouts =================
      const rY = 356
      const LH = 16
      text(
        `M = ${M < 0.01 ? M.toExponential(1) : M.toFixed(3)}     Co = a_T Δt/Δx = ${Co.toFixed(3)}     D = Co/M = ${D.toFixed(3)}`,
        AX,
        rY,
        '#e2e8f0'
      )
      if (st.mode === 'fixed') {
        text(
          `|g'(1)| = 1/D = M/Co = ${(1 / D).toFixed(3)}   →   ${1 / D < 1 ? 'contraction, the root attracts' : 'expansion, the root repels'}`,
          AX,
          rY + LH,
          1 / D < 1 ? '#34d399' : '#f87171'
        )
      } else {
        text(`|g'(1)| = 0  →  quadratic convergence, independent of M and Co`, AX, rY + LH, '#34d399')
      }
      const verdict: Record<Outcome, [string, string]> = {
        physical: [`converged on the physical root — ‖r‖ < η in ${st.traj.nConv + 1} iterations`, '#34d399'],
        'other-branch': [
          `dragged onto the other branch — settled on P = ${st.traj.p[st.traj.p.length - 1].toFixed(3)}, not the physical root, after ${st.traj.nConv + 1} iterations`,
          '#fbbf24',
        ],
        diverged: ['diverged — the iterate left the physical branch entirely', '#f87171'],
        stalled: [`${NMAX} iterations, still above η — stalled`, '#fbbf24'],
      }
      text(verdict[st.traj.outcome][0], AX, rY + 2 * LH, verdict[st.traj.outcome][1], 'bold 12px ui-monospace, monospace')
      text(
        'drag M past Co and the amber staircase walks off the green root — the cyan Newton map never does',
        AX,
        rY + 3 * LH,
        '#64748b'
      )
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [M, Co, D])

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

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div style={row}>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>linearisation</span>
        <button onClick={() => setMode('fixed')} style={btn(mode === 'fixed')}>
          fixed-coefficient
        </button>
        <button onClick={() => setMode('newton')} style={btn(mode === 'newton')}>
          Newton
        </button>
        <button onClick={() => setRunning((v) => !v)} style={btn(running)}>
          {running ? '❚❚ pause' : '▶ run'}
        </button>
        <button onClick={() => setTick((v) => v + 1)} style={btn(false)}>
          ↺ restart
        </button>
      </div>

      <div style={row}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Mach M
          <input
            type="range"
            min={-3}
            max={0.6}
            step={0.01}
            value={logM}
            onChange={(e) => setLogM(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 66 }}>
            {M < 0.01 ? M.toExponential(1) : M.toFixed(3)}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Courant Co
          <input
            type="range"
            min={-1.3}
            max={0.7}
            step={0.01}
            value={logCo}
            onChange={(e) => setLogCo(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }}>
            {Co.toFixed(3)}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          initial guess P⁽⁰⁾
          <input
            type="range"
            min={0.7}
            max={1.5}
            step={0.005}
            value={pInit}
            onChange={(e) => setPInit(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }}>
            {pInit.toFixed(3)}
          </span>
        </label>
      </div>

      <div style={row}>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>paper test-cases</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setLogM(Math.log10(p.M))
              setLogCo(Math.log10(p.Co))
            }}
            style={btn(Math.abs(M - p.M) < 1e-6 && Math.abs(Co - p.Co) < 1e-6)}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
