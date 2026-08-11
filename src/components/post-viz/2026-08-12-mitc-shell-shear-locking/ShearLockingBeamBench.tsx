'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Shear locking on a cantilever, and what a tying point does about it.
//
// Two-node linear Timoshenko elements, dofs (w, phi) per node.
//   bending  B_b = [0, -1/h, 0, 1/h]                  (phi')
//   shear    B_s = [-1/h, -N1, 1/h, -N2]              (w' - phi)
//
// FULL: B_s integrated with 2-point Gauss -- exact, and exactly wrong. The
//       linear pair cannot make w' - phi vanish, so the element carries a
//       spurious shear energy that grows like (L/t)^2 and freezes the beam.
// TIED: B_s sampled once at xi = 0 and held constant over the element. That is
//       the 1-D ancestor of MITC: the strain is read at a tying point and
//       re-interpolated, not differentiated from the displacement field.
//
// The load oscillates so the two beams can be watched side by side; the shapes
// are normalised by the exact Timoshenko tip deflection, so "flat" means
// "locked", not "small load".
// ---------------------------------------------------------------------------

const W = 726
const H = 476

const BX = 58 // beam panel
const BY = 44
const BW = 612
const BH = 190

const GY = BY + BH + 62 // gauge panel top

const E_MOD = 1
const NU = 0.3
const KS = 5 / 6

type Sol = { w: number[]; tip: number; ub: number; us: number }

function solveSpd(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    const tmp = M[c]
    M[c] = M[p]
    M[p] = tmp
    const piv = M[c][c] || 1e-300
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv
      if (f === 0) continue
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]
    x[r] = s / (M[r][r] || 1e-300)
  }
  return x
}

const GP = [-1 / Math.sqrt(3), 1 / Math.sqrt(3)]

function beamSolution(slender: number, nel: number, tied: boolean): Sol {
  const L = 1
  const t = L / slender
  const EI = (E_MOD * t * t * t) / 12
  const GA = KS * (E_MOD / (2 * (1 + NU))) * t
  const h = L / nel
  const nd = 2 * (nel + 1)

  const K: number[][] = Array.from({ length: nd }, () => new Array(nd).fill(0))
  const Bb = [0, -1 / h, 0, 1 / h]
  const shearRules: { B: number[]; wgt: number }[] = tied
    ? [{ B: [-1 / h, -0.5, 1 / h, -0.5], wgt: h }]
    : GP.map((xi) => ({ B: [-1 / h, -0.5 * (1 - xi), 1 / h, -0.5 * (1 + xi)], wgt: h / 2 }))

  for (let e = 0; e < nel; e++) {
    const id = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3]
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        let v = EI * h * Bb[i] * Bb[j]
        for (const r of shearRules) v += GA * r.wgt * r.B[i] * r.B[j]
        K[id[i]][id[j]] += v
      }
  }

  // clamp w0 = phi0 = 0, unit transverse load at the tip
  const free = nd - 2
  const Kr = Array.from({ length: free }, (_, i) => Array.from({ length: free }, (_, j) => K[i + 2][j + 2]))
  const fr = new Array(free).fill(0)
  fr[free - 2] = 1
  const ur = solveSpd(Kr, fr)
  const u = [0, 0, ...ur]

  let ub = 0
  let us = 0
  for (let e = 0; e < nel; e++) {
    const ue = [u[2 * e], u[2 * e + 1], u[2 * e + 2], u[2 * e + 3]]
    const kap = Bb.reduce((s, v, i) => s + v * ue[i], 0)
    ub += 0.5 * EI * h * kap * kap
    for (const r of shearRules) {
      const g = r.B.reduce((s, v, i) => s + v * ue[i], 0)
      us += 0.5 * GA * r.wgt * g * g
    }
  }

  const w: number[] = []
  for (let i = 0; i <= nel; i++) w.push(u[2 * i])
  return { w, tip: u[nd - 2], ub, us }
}

function exactTip(slender: number) {
  const L = 1
  const t = L / slender
  const EI = (E_MOD * t * t * t) / 12
  const GA = KS * (E_MOD / (2 * (1 + NU))) * t
  return (L * L * L) / (3 * EI) + L / GA
}

function exactCurve(slender: number, x: number) {
  const L = 1
  const t = L / slender
  const EI = (E_MOD * t * t * t) / 12
  const GA = KS * (E_MOD / (2 * (1 + NU))) * t
  return ((L * x * x) / 2 - (x * x * x) / 6) / EI + x / GA
}

export function ShearLockingBeamBench() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [expo, setExpo] = useState(2) // slenderness L/t = 10^expo
  const [nel, setNel] = useState(4)
  const [running, setRunning] = useState(true)

  const slender = Math.round(Math.pow(10, expo))

  const data = useMemo(() => {
    const ex = exactTip(slender)
    const full = beamSolution(slender, nel, false)
    const tied = beamSolution(slender, nel, true)
    const ref100 = Array.from({ length: 101 }, (_, i) => exactCurve(slender, i / 100) / ex)
    return {
      ex,
      full,
      tied,
      ref100,
      rFull: full.tip / ex,
      rTied: tied.tip / ex,
      fFull: full.us / (full.us + full.ub),
      fTied: tied.us / (tied.us + tied.ub),
    }
  }, [slender, nel])

  const cfg = useRef({ data, nel, running, slender })
  cfg.current = { data, nel, running, slender }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let phase = 0
    let last = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const { data: d, nel: ne, running: run, slender: sl } = cfg.current
      if (run) phase += dt * 1.1
      const amp = 0.5 - 0.5 * Math.cos(phase) // load ramp 0 -> 1 -> 0

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- beam panel -----------------------------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      ctx.strokeRect(BX - 30, BY - 22, BW + 52, BH + 44)

      const px = (x: number) => BX + x * BW
      const py = (wn: number) => BY + 26 + wn * (BH - 46)

      // clamped wall
      ctx.fillStyle = 'rgba(148,163,184,0.35)'
      ctx.fillRect(BX - 12, py(0) - 34, 10, 68)
      for (let i = 0; i < 7; i++) {
        ctx.beginPath()
        ctx.moveTo(BX - 12, py(0) - 34 + i * 11)
        ctx.lineTo(BX - 24, py(0) - 24 + i * 11)
        ctx.strokeStyle = 'rgba(148,163,184,0.45)'
        ctx.stroke()
      }

      // undeformed axis
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(148,163,184,0.30)'
      ctx.beginPath()
      ctx.moveTo(px(0), py(0))
      ctx.lineTo(px(1), py(0))
      ctx.stroke()
      ctx.setLineDash([])

      // exact Timoshenko shape
      ctx.strokeStyle = 'rgba(148,163,184,0.85)'
      ctx.setLineDash([6, 5])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      d.ref100.forEach((v, i) => {
        const X = px(i / 100)
        const Y = py(v * amp)
        i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      const drawBeam = (sol: Sol, col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2.5
        ctx.beginPath()
        sol.w.forEach((wv, i) => {
          const X = px(i / ne)
          const Y = py((wv / d.ex) * amp)
          i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
        })
        ctx.stroke()
        ctx.fillStyle = col
        sol.w.forEach((wv, i) => {
          ctx.beginPath()
          ctx.arc(px(i / ne), py((wv / d.ex) * amp), 3, 0, 6.2832)
          ctx.fill()
        })
      }

      drawBeam(d.full, '#f87171')
      drawBeam(d.tied, '#38bdf8')

      // load arrow at the tip
      const tipY = py((d.tied.w[ne] / d.ex) * amp)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(px(1) + 16, tipY - 34 * amp - 6)
      ctx.lineTo(px(1) + 16, tipY - 4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px(1) + 16, tipY - 1)
      ctx.lineTo(px(1) + 11, tipY - 10)
      ctx.lineTo(px(1) + 21, tipY - 10)
      ctx.closePath()
      ctx.fillStyle = '#fbbf24'
      ctx.fill()

      text('CANTILEVER  L/t = ' + sl + '   elements = ' + ne, BX - 30, BY - 30, '#94a3b8', 'bold 11px ui-monospace, monospace')
      text('load P', px(1) + 6, tipY - 40 * amp - 12, '#fbbf24')
      text('exact Timoshenko', BX + 6, BY + BH + 6, '#94a3b8')
      text('full integration', BX + 148, BY + BH + 6, '#f87171')
      text('tied at xi = 0  (MITC)', BX + 268, BY + BH + 6, '#38bdf8')
      text('deflection is normalised by the exact tip value', BX + 420, BY + BH + 6, '#64748b')

      // ---- gauges ---------------------------------------------------------
      const barW = 250
      const gauge = (lbl: string, val: number, y: number, col: string) => {
        text(lbl, BX - 30, y, '#94a3b8')
        ctx.fillStyle = 'rgba(148,163,184,0.18)'
        ctx.fillRect(BX - 30, y + 7, barW, 13)
        ctx.fillStyle = col
        ctx.fillRect(BX - 30, y + 7, Math.max(1.5, barW * Math.min(1, val)), 13)
        ctx.strokeStyle = 'rgba(148,163,184,0.55)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(BX - 30 + barW, y + 5)
        ctx.lineTo(BX - 30 + barW, y + 22)
        ctx.stroke()
        text(val < 1e-3 ? val.toExponential(1) : val.toFixed(4), BX - 30 + barW + 10, y + 18, col, 'bold 12px ui-monospace, monospace')
      }

      text('TIP DEFLECTION  w_fem / w_exact', BX - 30, GY - 14, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      gauge('full integration', d.rFull, GY + 2, '#f87171')
      gauge('tied at xi = 0', d.rTied, GY + 44, '#38bdf8')

      const EX = BX + 330
      text('WHERE THE ENERGY WENT', EX, GY - 14, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      const stack = (lbl: string, frac: number, y: number) => {
        text(lbl, EX, y, '#94a3b8')
        const bw = 210
        ctx.fillStyle = '#34d399'
        ctx.fillRect(EX, y + 7, bw * (1 - frac), 13)
        ctx.fillStyle = '#f87171'
        ctx.fillRect(EX + bw * (1 - frac), y + 7, bw * frac, 13)
        text((frac * 100).toFixed(2) + '% shear', EX + bw + 10, y + 18, frac > 0.5 ? '#f87171' : '#34d399', 'bold 12px ui-monospace, monospace')
      }
      stack('full integration', d.fFull, GY + 2)
      stack('tied at xi = 0', d.fTied, GY + 44)
      text('green = bending    red = transverse shear', EX, GY + 82, '#64748b')

      const verdict =
        d.rFull < 0.05
          ? 'locked: the full-integration beam is more than 20x too stiff'
          : d.rFull < 0.9
            ? 'stiffening: the spurious shear term is taking over'
            : 'thick enough that locking is still hidden'
      text(verdict, BX - 30, GY + 100, d.rFull < 0.05 ? '#f87171' : d.rFull < 0.9 ? '#fbbf24' : '#34d399')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }
  const btn = (active: boolean, col: string): CSSProperties => ({
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
          <span style={name}>slenderness L/t</span>
          <input type="range" min={0.7} max={3} step={0.02} value={expo} onChange={(e) => setExpo(parseFloat(e.target.value))} />
          <span style={mono}>{slender}</span>
        </label>
        <label style={label}>
          <span style={name}>elements</span>
          <input type="range" min={1} max={16} step={1} value={nel} onChange={(e) => setNel(parseInt(e.target.value, 10))} />
          <span style={mono}>{nel}</span>
        </label>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setExpo(0.7)} style={btn(Math.abs(expo - 0.7) < 0.02, '#34d399')}>
          thick  L/t=5
        </button>
        <button onClick={() => setExpo(2)} style={btn(Math.abs(expo - 2) < 0.02, '#f87171')}>
          shell  L/t=100
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Push the slenderness slider right. The blue beam keeps the same shape all the way to L/t = 1000; the red one flattens
        against the dashed exact curve and its energy bar turns almost entirely red &mdash; that red is transverse shear energy
        that a thin beam is not supposed to have. Adding elements buys the red beam a little back, but the gap reopens as soon
        as you make it thinner again.
      </div>
    </div>
  )
}
