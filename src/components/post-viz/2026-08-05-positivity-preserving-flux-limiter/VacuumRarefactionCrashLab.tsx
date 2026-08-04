'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Double rarefaction: two halves of a tube pulled apart at +-u0. A near-vacuum
// opens in the middle, and that is where a high-order scheme loses the sign.
//
// Every face carries two fluxes:
//
//   F_low   first-order Lax-Friedrichs on cell averages
//           -> positive rho and p guaranteed for CFL <= 1/2
//   F_high  the same LF flux, but fed MUSCL-reconstructed face states
//           -> second order, and no sign guarantee at all
//
//   F = F_low + theta (F_high - F_low),   theta in [0, 1]
//
// theta = 1 everywhere is the plain second-order scheme. The limiter drops
// theta only on the faces that would push a cell below the floor, and each
// face may spend at most half the budget of the cell it drains - a cell
// squeezed from both sides still survives.
//
// Turn the limiter off and watch the run die within a couple of steps. Turn it
// back on and read the "faces clipped" number: it is a fraction of a percent.
// ---------------------------------------------------------------------------

const W = 700
const H = 500

const N = 200
const DX = 1 / N
const GAMMA = 1.4
const T_END = 0.15

const PX = 58
const PW = W - PX - 22

const RY = 40 // density panel
const RH = 130
const PY = 214 // pressure panel
const PH = 96
const TY = 352 // theta panel
const TH = 56

type State = {
  r: Float64Array
  m: Float64Array
  e: Float64Array
  theta: Float64Array
  t: number
  step: number
  clipped: number
  faces: number
  rhoMin: number
  pMin: number
  dead: boolean
  done: boolean
  idle: number
}

function pressureOf(r: number, m: number, e: number) {
  return (GAMMA - 1) * (e - (0.5 * m * m) / r)
}

function init(u0: number): State {
  const r = new Float64Array(N)
  const m = new Float64Array(N)
  const e = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    const u = x < 0.5 ? -u0 : u0
    r[i] = 1
    m[i] = u
    e[i] = 0.4 / (GAMMA - 1) + 0.5 * u * u
  }
  return {
    r,
    m,
    e,
    theta: new Float64Array(N + 1).fill(1),
    t: 0,
    step: 0,
    clipped: 0,
    faces: 0,
    rhoMin: 1,
    pMin: 0.4,
    dead: false,
    done: false,
    idle: 0,
  }
}

function minmod(a: number, b: number) {
  if (a * b <= 0) return 0
  return Math.abs(a) < Math.abs(b) ? a : b
}

// scratch buffers, reused every step so the loop allocates nothing
const fl = [new Float64Array(N + 1), new Float64Array(N + 1), new Float64Array(N + 1)]
const df = [new Float64Array(N + 1), new Float64Array(N + 1), new Float64Array(N + 1)]
const lfState = [new Float64Array(N), new Float64Array(N), new Float64Array(N)]
const slope = [new Float64Array(N + 2), new Float64Array(N + 2), new Float64Array(N + 2)]

function advance(s: State, cfl: number, useLimiter: boolean) {
  const { r, m, e, theta } = s

  let alpha = 0
  let rhoMin = Infinity
  let pMin = Infinity
  for (let i = 0; i < N; i++) {
    const p = pressureOf(r[i], m[i], e[i])
    if (r[i] < rhoMin) rhoMin = r[i]
    if (p < pMin) pMin = p
    if (r[i] <= 0 || p <= 0 || !Number.isFinite(p)) {
      s.rhoMin = rhoMin
      s.pMin = pMin
      s.dead = true
      return
    }
    const c = Math.sqrt((GAMMA * p) / r[i])
    const a = Math.abs(m[i] / r[i]) + c
    if (a > alpha) alpha = a
  }
  s.rhoMin = rhoMin
  s.pMin = pMin

  const dt = Math.min((cfl * DX) / alpha, T_END - s.t)
  const lam = dt / DX

  const g = (i: number) => (i < 0 ? 0 : i > N - 1 ? N - 1 : i)
  const U = [r, m, e]

  // slopes on the ghost-extended array; index 0 and N+1 stay 0 (ghost cells)
  for (let k = 0; k < 3; k++) {
    const q = U[k]
    for (let j = 1; j <= N; j++) {
      const i = j - 1
      slope[k][j] = minmod(q[i] - q[g(i - 1)], q[g(i + 1)] - q[i])
    }
  }

  const flux = (rL: number, mL: number, eL: number, rR: number, mR: number, eR: number, out: number[]) => {
    const uL = mL / rL
    const pL = pressureOf(rL, mL, eL)
    const uR = mR / rR
    const pR = pressureOf(rR, mR, eR)
    out[0] = 0.5 * (mL + mR - alpha * (rR - rL))
    out[1] = 0.5 * (mL * uL + pL + mR * uR + pR - alpha * (mR - mL))
    out[2] = 0.5 * ((eL + pL) * uL + (eR + pR) * uR - alpha * (eR - eL))
  }

  const lo: number[] = [0, 0, 0]
  const hi: number[] = [0, 0, 0]

  for (let f = 0; f <= N; f++) {
    const iL = g(f - 1)
    const iR = g(f)
    flux(r[iL], m[iL], e[iL], r[iR], m[iR], e[iR], lo)

    // MUSCL face states (ghost index j = i + 1)
    const jL = f
    const jR = f + 1
    const sL = [slope[0][jL], slope[1][jL], slope[2][jL]]
    const sR = [slope[0][jR], slope[1][jR], slope[2][jR]]
    const rl = r[iL] + 0.5 * sL[0]
    const ml = m[iL] + 0.5 * sL[1]
    const el = e[iL] + 0.5 * sL[2]
    const rr = r[iR] - 0.5 * sR[0]
    const mr = m[iR] - 0.5 * sR[1]
    const er = e[iR] - 0.5 * sR[2]

    if (rl > 0 && rr > 0) flux(rl, ml, el, rr, mr, er, hi)
    else {
      hi[0] = lo[0]
      hi[1] = lo[1]
      hi[2] = lo[2]
    }

    for (let k = 0; k < 3; k++) {
      fl[k][f] = lo[k]
      df[k][f] = hi[k] - lo[k]
    }
  }

  // the Lax-Friedrichs state: the safe end of every segment
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < N; i++) lfState[k][i] = U[k][i] - lam * (fl[k][i + 1] - fl[k][i])
  }

  const eps = 1e-10
  theta.fill(1)

  if (useLimiter) {
    // --- density: each face spends at most half the budget of the cell it drains
    for (let f = 1; f < N; f++) {
      const d = df[0][f]
      let cap = 1
      if (d > 0) cap = (0.5 * Math.max(lfState[0][f - 1] - eps, 0)) / (lam * d)
      else if (d < 0) cap = (0.5 * Math.max(lfState[0][f] - eps, 0)) / (lam * -d)
      theta[f] = Math.min(1, cap)
    }

    // --- pressure: p(theta) is concave along the segment, so bisect
    const pAt = (i: number, tl: number, tr: number) => {
      const rr = lfState[0][i] - lam * (tr * df[0][i + 1] - tl * df[0][i])
      const mm = lfState[1][i] - lam * (tr * df[1][i + 1] - tl * df[1][i])
      const ee = lfState[2][i] - lam * (tr * df[2][i + 1] - tl * df[2][i])
      if (rr <= 0) return -1
      return pressureOf(rr, mm, ee)
    }
    for (let sweep = 0; sweep < 8; sweep++) {
      let dirty = false
      for (let i = 0; i < N; i++) {
        const tl = theta[i]
        const tr = theta[i + 1]
        if (pAt(i, tl, tr) >= eps) continue
        dirty = true
        let a = 0
        let b = 1
        for (let k = 0; k < 30; k++) {
          const mid = 0.5 * (a + b)
          if (pAt(i, tl * mid, tr * mid) >= eps) a = mid
          else b = mid
        }
        theta[i] *= a
        theta[i + 1] *= a
      }
      if (!dirty) break
    }

    for (let f = 1; f < N; f++) if (theta[f] < 1 - 1e-12) s.clipped++
    s.faces += N - 1
  }

  for (let k = 0; k < 3; k++) {
    const q = U[k]
    for (let i = 0; i < N; i++) {
      const fL = fl[k][i] + theta[i] * df[k][i]
      const fR = fl[k][i + 1] + theta[i + 1] * df[k][i + 1]
      q[i] = q[i] - lam * (fR - fL)
    }
  }

  s.t += dt
  s.step++
  if (s.t >= T_END - 1e-12) s.done = true
}

export function VacuumRarefactionCrashLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [u0, setU0] = useState(4)
  const [cfl, setCfl] = useState(0.45)
  const [limiter, setLimiter] = useState(true)
  const [running, setRunning] = useState(true)

  const cfg = useRef({ u0, cfl, limiter, running })
  cfg.current = { u0, cfl, limiter, running }
  const st = useRef<State>(init(4))
  const reset = useRef(false)

  // any parameter change restarts the run, so the slider is the experiment
  useEffect(() => {
    reset.current = true
  }, [u0, cfl, limiter])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = () => {
      const c = cfg.current
      if (reset.current) {
        st.current = init(c.u0)
        reset.current = false
      }
      const s = st.current

      if (c.running && !s.dead && !s.done) {
        for (let k = 0; k < 2 && !s.dead && !s.done; k++) advance(s, c.cfl, c.limiter)
      }
      if (s.done || s.dead) {
        s.idle++
        if (s.idle > 150) {
          st.current = init(c.u0)
        }
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const xp = (i: number) => PX + ((i + 0.5) * DX) * PW

      // ---------------- density panel ----------------
      const rTop = 1.25
      const rBot = -0.35
      const ry = (v: number) => RY + RH - ((v - rBot) / (rTop - rBot)) * RH

      ctx.fillStyle = 'rgba(248,113,113,0.10)'
      ctx.fillRect(PX, ry(0), PW, RY + RH - ry(0))
      ctx.strokeStyle = 'rgba(148,163,184,0.26)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX, RY, PW, RH)
      ctx.strokeStyle = 'rgba(248,113,113,0.6)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(PX, ry(0))
      ctx.lineTo(PX + PW, ry(0))
      ctx.stroke()
      ctx.setLineDash([])
      text('rho = 0', PX + 6, ry(0) + 13, '#f87171', '10px ui-monospace, monospace')
      text('density  rho(x)', PX, RY - 10, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('1.0', PX - 30, ry(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('0.0', PX - 30, ry(0) + 4, '#64748b', '10px ui-monospace, monospace')

      ctx.strokeStyle = s.dead ? '#f87171' : '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const v = Math.max(rBot, Math.min(rTop, s.r[i]))
        const y = ry(Number.isFinite(v) ? v : rBot)
        if (i === 0) ctx.moveTo(xp(i), y)
        else ctx.lineTo(xp(i), y)
      }
      ctx.stroke()

      // ---------------- pressure panel ----------------
      const pTop = 0.5
      const pBot = -0.22
      const py = (v: number) => PY + PH - ((v - pBot) / (pTop - pBot)) * PH

      ctx.fillStyle = 'rgba(248,113,113,0.10)'
      ctx.fillRect(PX, py(0), PW, PY + PH - py(0))
      ctx.strokeStyle = 'rgba(148,163,184,0.26)'
      ctx.strokeRect(PX, PY, PW, PH)
      ctx.strokeStyle = 'rgba(248,113,113,0.6)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(PX, py(0))
      ctx.lineTo(PX + PW, py(0))
      ctx.stroke()
      ctx.setLineDash([])
      text('p = 0', PX + 6, py(0) + 13, '#f87171', '10px ui-monospace, monospace')
      text('pressure  p(x)', PX, PY - 10, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('0.4', PX - 30, py(0.4) + 4, '#64748b', '10px ui-monospace, monospace')

      ctx.strokeStyle = s.dead ? '#f87171' : '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        let v = pressureOf(s.r[i], s.m[i], s.e[i])
        if (!Number.isFinite(v)) v = pBot
        const y = py(Math.max(pBot, Math.min(pTop, v)))
        if (i === 0) ctx.moveTo(xp(i), y)
        else ctx.lineTo(xp(i), y)
      }
      ctx.stroke()

      // ---------------- theta panel ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.26)'
      ctx.strokeRect(PX, TY, PW, TH)
      text('theta on each face   (1 = full second order,  0 = fall back to LF)', PX, TY - 10, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('1', PX - 16, TY + 10, '#64748b', '10px ui-monospace, monospace')
      text('0', PX - 16, TY + TH, '#64748b', '10px ui-monospace, monospace')

      for (let f = 1; f < N; f++) {
        const th = cfg.current.limiter ? s.theta[f] : 1
        const x = PX + (f / N) * PW
        const h = th * TH
        ctx.fillStyle = th > 0.999 ? 'rgba(52,211,153,0.35)' : th > 0.3 ? '#fbbf24' : '#f87171'
        ctx.fillRect(x - 1.2, TY + TH - h, 2.4, h)
      }
      if (!cfg.current.limiter) {
        text('limiter off — theta pinned at 1 everywhere', PX + PW / 2 - 118, TY + TH / 2 + 4, '#f87171', 'bold 11px ui-monospace, monospace')
      }
      text('x', PX + PW / 2, TY + TH + 18, '#64748b', '10px ui-monospace, monospace')

      // ---------------- readouts ----------------
      const pct = s.faces > 0 ? (100 * s.clipped) / s.faces : 0
      const rows: [string, string, string][] = [
        ['t / t_end', `${s.t.toFixed(4)} / ${T_END.toFixed(2)}   (step ${s.step})`, '#cbd5e1'],
        ['min rho', s.rhoMin.toExponential(3), s.rhoMin <= 0 ? '#f87171' : '#38bdf8'],
        ['min p', s.pMin >= 0 ? s.pMin.toExponential(3) : s.pMin.toFixed(4), s.pMin <= 0 ? '#f87171' : '#fbbf24'],
        [
          'faces with theta < 1',
          cfg.current.limiter ? `${pct.toFixed(3)} %` : '-- limiter off',
          pct > 0 ? '#34d399' : '#64748b',
        ],
      ]
      rows.forEach(([lab, val, col], k) => {
        const y = TY + TH + 44 + k * 17
        text(lab, PX, y, '#94a3b8')
        text(val, PX + 168, y, col, 'bold 11px ui-monospace, monospace')
      })

      const verdict = s.dead
        ? `DEAD at step ${s.step} — the state left the admissible set, sqrt(gamma p / rho) is next`
        : s.done
          ? `survived to t = ${T_END} — near-vacuum resolved, replaying shortly`
          : 'running...'
      text(verdict, PX, TY + TH + 44 + 4 * 17 + 8, s.dead ? '#f87171' : s.done ? '#34d399' : '#94a3b8', 'bold 12px ui-monospace, monospace')
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean, col = '#fbbf24'): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.7rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }
  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 42 }

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
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>pull-apart u0</span>
          <input type="range" min={1} max={8} step={0.25} value={u0} onChange={(e) => setU0(parseFloat(e.target.value))} />
          <span style={mono}>{u0.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>CFL</span>
          <input type="range" min={0.1} max={0.5} step={0.01} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
          <span style={mono}>{cfl.toFixed(2)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setLimiter(true)} style={btn(limiter, '#34d399')}>
          limiter ON
        </button>
        <button onClick={() => setLimiter(false)} style={btn(!limiter, '#f87171')}>
          limiter OFF
        </button>
        <button onClick={() => { reset.current = true }} style={btn(false)}>
          ↺ restart
        </button>
        <button onClick={() => setRunning((v) => !v)} style={btn(running, '#38bdf8')}>
          {running ? '❚❚ pause' : '▶ run'}
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        push u0 past about 3.5 with the limiter off — the pressure curve dips through the red line within two steps
        while the density is still near 0.37. turn the limiter on and watch the bottom panel: only a handful of green
        bars ever drop, and the run finishes.
      </div>
    </div>
  )
}
