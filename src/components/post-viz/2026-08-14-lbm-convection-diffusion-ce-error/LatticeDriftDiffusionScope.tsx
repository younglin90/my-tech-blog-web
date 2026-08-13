'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A live D1Q3 lattice Boltzmann solve of  d_t phi + d_x(u phi) = D d_xx phi,
// run against the exact Gaussian it is supposed to reproduce.
//
//   g_i^eq = w_i phi (1 + c_i u / cs^2)        cs^2 = 1/3
//   D      = cs^2 (tau - 1/2) dt
//
// Chapman-Enskog leaves one extra flux behind, (tau - 1/2) dt d_t(phi u).
// For a uniform u that flux is -(tau - 1/2) dt u^2 d_x phi -- pure negative
// diffusion -- so the packet spreads at D (1 - u^2/cs^2) instead of D.
//
// The source term S_i = w_i (1 - 1/(2 tau)) c_i d_t(phi u) / cs^2 removes it.
// Toggle it and watch sigma^2(t) snap back onto the dashed exact line.
// ---------------------------------------------------------------------------

const W = 744
const H = 452

const L = 300 // lattice sites
const CS2 = 1 / 3
const CV = [0, 1, -1]
const WT = [2 / 3, 1 / 6, 1 / 6]

const SIG0 = 8
const SPF = 8 // lattice steps per animation frame

const PX0 = 20
const PX1 = 724
const AY0 = 34
const AY1 = 208
const BY0 = 258
const BY1 = 414

type Sim = {
  g: [Float64Array, Float64Array, Float64Array]
  phi: Float64Array
  prev: Float64Array
  n: number
  hist: { n: number; v: number }[]
  key: string
  slope: number
}

function fresh(): Sim {
  const phi = new Float64Array(L)
  const g: [Float64Array, Float64Array, Float64Array] = [new Float64Array(L), new Float64Array(L), new Float64Array(L)]
  for (let x = 0; x < L; x++) {
    let d = x - L / 4
    if (d > L / 2) d -= L
    if (d < -L / 2) d += L
    phi[x] = Math.exp(-(d * d) / (2 * SIG0 * SIG0))
  }
  return { g, phi, prev: phi.slice(), n: 0, hist: [], key: '', slope: 0 }
}

function seed(s: Sim, u: number) {
  for (let i = 0; i < 3; i++)
    for (let x = 0; x < L; x++) s.g[i][x] = WT[i] * s.phi[x] * (1 + (CV[i] * u) / CS2)
  s.prev.set(s.phi)
  s.n = 0
  s.hist = []
  s.slope = 0
}

// centroid and variance on a periodic line: circular mean, then minimal image
function spread(phi: Float64Array): { c: number; v: number } {
  let cr = 0
  let si = 0
  let m0 = 0
  for (let x = 0; x < L; x++) {
    const a = (2 * Math.PI * x) / L
    cr += phi[x] * Math.cos(a)
    si += phi[x] * Math.sin(a)
    m0 += phi[x]
  }
  const c = (((Math.atan2(si, cr) * L) / (2 * Math.PI)) % L + L) % L
  let s1 = 0
  let s2 = 0
  for (let x = 0; x < L; x++) {
    let d = x - c
    if (d > L / 2) d -= L
    if (d < -L / 2) d += L
    s1 += phi[x] * d
    s2 += phi[x] * d * d
  }
  const mu = s1 / m0
  return { c: c + mu, v: s2 / m0 - mu * mu }
}

function advance(s: Sim, tau: number, u: number, corrected: boolean) {
  const [g0, g1, g2] = s.g
  const half = corrected ? 1 - 1 / (2 * tau) : 0
  for (let x = 0; x < L; x++) {
    const p = g0[x] + g1[x] + g2[x]
    s.phi[x] = p
    const dtPhiU = half * u * (p - s.prev[x])
    const e0 = WT[0] * p
    const e1 = WT[1] * p * (1 + u / CS2)
    const e2 = WT[2] * p * (1 - u / CS2)
    const sc = (WT[1] * dtPhiU) / CS2 // = w_1 c_1 d_t(phi u)/cs^2, and -this for c_2
    g0[x] += (e0 - g0[x]) / tau
    g1[x] += (e1 - g1[x]) / tau + sc
    g2[x] += (e2 - g2[x]) / tau - sc
  }
  s.prev.set(s.phi)
  // streaming: c = +1 moves right, c = -1 moves left (periodic)
  const t1 = g1[L - 1]
  for (let x = L - 1; x > 0; x--) g1[x] = g1[x - 1]
  g1[0] = t1
  const t2 = g2[0]
  for (let x = 0; x < L - 1; x++) g2[x] = g2[x + 1]
  g2[L - 1] = t2
  s.n++
}

export function LatticeDriftDiffusionScope() {
  const [u, setU] = useState(0.3)
  const [tau, setTau] = useState(1.0)
  const [corrected, setCorrected] = useState(false)
  const [tick, setTick] = useState(0)

  const cfg = useRef({ u, tau, corrected })
  cfg.current = { u, tau, corrected }
  const sim = useRef<Sim | null>(null)
  const out = useRef({ ratio: 1, theory: 1, n: 0, vs: 0, ve: 0 })
  const ref = useRef<HTMLCanvasElement>(null)
  const restart = useRef(0)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const text = (t: string, x: number, y: number, col: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = f
      ctx.fillText(t, x, y)
    }

    const draw = () => {
      const c = cfg.current
      const D = CS2 * (c.tau - 0.5)
      const key = `${c.u}|${c.tau}|${c.corrected}|${restart.current}`
      if (!sim.current || sim.current.key !== key) {
        const s = fresh()
        seed(s, c.u)
        s.key = key
        sim.current = s
      }
      const s = sim.current

      for (let k = 0; k < SPF; k++) advance(s, c.tau, c.u, c.corrected)

      const meas = spread(s.phi)
      if (s.n % 40 < SPF) s.hist.push({ n: s.n, v: meas.v })
      // least squares slope of sigma^2 against step count -> 2 D_eff
      if (s.hist.length > 3) {
        let sn = 0
        let sv = 0
        let snn = 0
        let snv = 0
        for (const h of s.hist) {
          sn += h.n
          sv += h.v
          snn += h.n * h.n
          snv += h.n * h.v
        }
        const m = s.hist.length
        s.slope = (m * snv - sn * sv) / (m * snn - sn * sn)
      }

      const vExact = SIG0 * SIG0 + 2 * D * s.n
      const vMax = SIG0 * SIG0 + 2 * D * 2600
      out.current = { ratio: s.slope / 2 / D, theory: 1 - (c.u * c.u) / CS2, n: s.n, vs: meas.v, ve: vExact }

      // ---- background ----------------------------------------------------
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ================= panel A : the packet =============================
      const sx = (x: number) => PX0 + ((PX1 - PX0) * x) / L
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PX0, AY1)
      ctx.lineTo(PX1, AY1)
      ctx.stroke()

      const cExact = ((L / 4 + c.u * s.n) % L + L) % L
      const sigE = Math.sqrt(vExact)
      const peak = SIG0 / sigE
      const hs = (AY1 - AY0) / 1.06 // phi = 1 at the very top of the panel

      // exact profile (dashed)
      ctx.strokeStyle = 'rgba(226,232,240,0.75)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let x = 0; x < L; x++) {
        let d = x - cExact
        if (d > L / 2) d -= L
        if (d < -L / 2) d += L
        const v = peak * Math.exp(-(d * d) / (2 * vExact))
        const y = AY1 - v * hs
        if (x === 0) ctx.moveTo(sx(x), y)
        else ctx.lineTo(sx(x), y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // simulated profile
      const col = c.corrected ? '#34d399' : '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(sx(0), AY1)
      for (let x = 0; x < L; x++) ctx.lineTo(sx(x), AY1 - s.phi[x] * hs)
      ctx.lineTo(sx(L - 1), AY1)
      ctx.closePath()
      ctx.fillStyle = c.corrected ? 'rgba(52,211,153,0.20)' : 'rgba(251,191,36,0.20)'
      ctx.fill()
      ctx.strokeStyle = col
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < L; x++) {
        const y = AY1 - s.phi[x] * hs
        if (x === 0) ctx.moveTo(sx(x), y)
        else ctx.lineTo(sx(x), y)
      }
      ctx.stroke()

      text('phi(x)  — solid: D1Q3 LBM   dashed: exact Gaussian', PX0, AY0 - 12, '#94a3b8')
      text(`step ${s.n}`, PX1 - 62, AY0 - 12, '#64748b')
      text('x  (periodic, 300 sites)', PX1 - 132, AY1 + 15, '#64748b')

      // peak markers make the "too tall, too narrow" failure legible
      const pkSim = Math.max(...Array.from(s.phi))
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(PX0, AY1 - peak * hs)
      ctx.lineTo(PX1, AY1 - peak * hs)
      ctx.stroke()
      ctx.setLineDash([])
      text(`peak  sim ${pkSim.toFixed(3)}   exact ${peak.toFixed(3)}`, PX0 + 6, AY0 + 14, col)

      // ================= panel B : sigma^2 growth ==========================
      const bx = (n: number) => PX0 + ((PX1 - PX0) * Math.min(n, 2600)) / 2600
      const by = (v: number) => BY1 - ((BY1 - BY0) * v) / vMax
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.beginPath()
      ctx.moveTo(PX0, BY1)
      ctx.lineTo(PX1, BY1)
      ctx.moveTo(PX0, BY0)
      ctx.lineTo(PX0, BY1)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(226,232,240,0.75)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(bx(0), by(SIG0 * SIG0))
      ctx.lineTo(bx(2600), by(SIG0 * SIG0 + 2 * D * 2600))
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = col
      ctx.lineWidth = 2
      ctx.beginPath()
      s.hist.forEach((h, i) => (i ? ctx.lineTo(bx(h.n), by(h.v)) : ctx.moveTo(bx(h.n), by(h.v))))
      ctx.stroke()

      text('sigma^2 vs step   — dashed slope = 2D (target)', PX0, BY0 - 12, '#94a3b8')
      text('0', PX0 - 4, BY1 + 15, '#64748b')
      text('2600 steps', PX1 - 68, BY1 + 15, '#64748b')
      text(`sigma^2 = ${vExact.toFixed(0)}`, PX1 - 92, BY0 + 4, '#64748b')

      const r = out.current.ratio
      const good = Math.abs(r - 1) < 0.02
      text(
        `measured D_eff / D = ${s.hist.length > 3 ? r.toFixed(3) : '...'}`,
        PX0 + 8,
        BY0 + 18,
        good ? '#34d399' : '#fb7185',
        'bold 13px ui-monospace, monospace',
      )
      text(`1 - u^2/cs^2 = ${out.current.theory.toFixed(3)}`, PX0 + 8, BY0 + 36, '#a78bfa')

      if (s.n > 2600) {
        seed(s, c.u)
      }

      if (++frame % 10 === 0) setTick((t) => t + 1)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const D = CS2 * (tau - 0.5)
  const o = out.current

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }
  const btn = (active: boolean, cl: string): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? cl : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>u [lu/ts]</span>
          <input type="range" min={0.02} max={0.4} step={0.01} value={u} onChange={(e) => setU(parseFloat(e.target.value))} />
          <span style={mono}>{u.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>tau</span>
          <input type="range" min={0.6} max={1.8} step={0.05} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} />
          <span style={mono}>{tau.toFixed(2)}</span>
        </label>
        <span style={{ ...label, color: '#94a3b8' }}>
          <span style={name}>D = cs&sup2;(tau&minus;&frac12;) =</span>
          <span style={mono}>{D.toFixed(4)}</span>
        </span>
      </div>

      <div style={row}>
        <button onClick={() => setCorrected(!corrected)} style={btn(corrected, '#34d399')}>
          {corrected ? 'source term ON' : 'source term OFF'}
        </button>
        <button
          onClick={() => {
            restart.current++
            setTick((t) => t + 1)
          }}
          style={btn(false, '#38bdf8')}
        >
          restart packet
        </button>
        <span data-tick={tick} style={{ ...mono, color: '#cbd5e1', minWidth: 300 }}>
          sigma&sup2; sim {o.vs.toFixed(0)} / exact {o.ve.toFixed(0)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Push u to 0.30 with the source term off: the amber packet climbs above the dashed exact curve and its sigma&sup2; line
        falls below the dashed target &mdash; it is diffusing at 0.73 D, exactly 1 &minus; u&sup2;/cs&sup2;. Now drag tau. The
        deficit ratio does not move, because the missing flux scales with D itself. Switch the source term on and the two curves
        merge at every u.
      </div>
    </div>
  )
}
