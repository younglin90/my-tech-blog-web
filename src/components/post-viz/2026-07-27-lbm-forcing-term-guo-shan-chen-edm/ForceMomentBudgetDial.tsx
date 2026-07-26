'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Moment budget of the discrete source term S_i (no time integration).
//
// With the half-shifted equilibrium u = (j + F/2)/rho, the trapezoidal-corrected
// LBE recovers Navier-Stokes only if the source satisfies
//
//   M0 = sum_i S_i          = 0                            (mass)
//   M1 = sum_i c_i S_i      = (1 - 1/2tau) F               (momentum)
//   M2 = sum_i c_i c_i S_i  = (1 - 1/2tau) (uF + Fu)       (stress)
//
// and the F/(2 tau) that M1 is "missing" is handed back by the shifted
// equilibrium, so the momentum actually delivered per step is
//   dj = M1 + F/(2 tau) = F.
//
// Toggle the (1 - 1/2tau) gain off and every one of those lines breaks.
// ---------------------------------------------------------------------------

const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]
const CS2 = 1 / 3

const FMAG = 1e-3

type Scheme = 'plain' | 'guo' | 'edm' | 'shanchen'
const SCHEMES: Scheme[] = ['plain', 'guo', 'edm', 'shanchen']
const SCHEME_LABEL: Record<Scheme, string> = {
  plain: 'plain',
  guo: 'Guo',
  edm: 'EDM',
  shanchen: 'Shan-Chen',
}
const SCHEME_NOTE: Record<Scheme, string> = {
  plain: 'plain: M2 = 0 for any gain — the shape is wrong, not the size',
  guo: 'Guo: the only shape that hits M1 and M2 at every tau',
  edm: 'EDM: exact up to an O(|F|^2) leftover — visible when |u| -> 0',
  shanchen: 'Shan-Chen: gain baked in; its O(|F|^2) leftover grows with tau',
}

function feq(i: number, ux: number, uy: number) {
  const eu = EX[i] * ux + EY[i] * uy
  const usq = ux * ux + uy * uy
  return W[i] * (1 + eu / CS2 + (eu * eu) / (2 * CS2 * CS2) - usq / (2 * CS2))
}

type Budget = {
  S: number[]
  m0: number
  m1x: number
  m1y: number
  m2xx: number
  m2xy: number
  m2yy: number
  t1x: number
  t1y: number
  t2xx: number
  t2xy: number
  t2yy: number
  djx: number
  djy: number
  e0: number
  e1: number
  e2: number
  ej: number
}

// rho = 1 throughout; u is the PHYSICAL velocity (j = u - F/2)
function buildBudget(
  scheme: Scheme,
  tau: number,
  fxx: number,
  fyy: number,
  ux: number,
  uy: number,
  gain: number,
): Budget {
  const pref = 1 - 1 / (2 * tau)
  const S: number[] = new Array(9).fill(0)

  if (scheme === 'plain') {
    for (let i = 0; i < 9; i++) S[i] = gain * W[i] * (EX[i] * fxx + EY[i] * fyy) / CS2
  } else if (scheme === 'guo') {
    for (let i = 0; i < 9; i++) {
      const eu = EX[i] * ux + EY[i] * uy
      S[i] =
        gain *
        W[i] *
        (((EX[i] - ux) / CS2 + (eu * EX[i]) / (CS2 * CS2)) * fxx +
          ((EY[i] - uy) / CS2 + (eu * EY[i]) / (CS2 * CS2)) * fyy)
    }
  } else if (scheme === 'edm') {
    for (let i = 0; i < 9; i++) S[i] = gain * (feq(i, ux + fxx, uy + fyy) - feq(i, ux, uy))
  } else {
    // Shan-Chen has no explicit source: collide about u_eq = j/rho + tau F/rho.
    // Relative to an equilibrium built on the physical u that is an EFFECTIVE
    // source [feq(u + (tau - 1/2) F) - feq(u)] / tau.
    const sx = ux + (tau - 0.5) * fxx
    const sy = uy + (tau - 0.5) * fyy
    for (let i = 0; i < 9; i++) S[i] = (feq(i, sx, sy) - feq(i, ux, uy)) / tau
  }

  let m0 = 0
  let m1x = 0
  let m1y = 0
  let m2xx = 0
  let m2xy = 0
  let m2yy = 0
  for (let i = 0; i < 9; i++) {
    const s = S[i]
    m0 += s
    m1x += EX[i] * s
    m1y += EY[i] * s
    m2xx += EX[i] * EX[i] * s
    m2xy += EX[i] * EY[i] * s
    m2yy += EY[i] * EY[i] * s
  }

  const t1x = pref * fxx
  const t1y = pref * fyy
  const t2xx = pref * 2 * ux * fxx
  const t2xy = pref * (ux * fyy + uy * fxx)
  const t2yy = pref * 2 * uy * fyy

  const djx = m1x + fxx / (2 * tau)
  const djy = m1y + fyy / (2 * tau)

  const fm = Math.hypot(fxx, fyy)
  const um = Math.hypot(ux, uy)
  const e0 = Math.abs(m0) / fm
  const e1 = Math.hypot(m1x - t1x, m1y - t1y) / (pref * fm)
  const e2 =
    Math.sqrt((m2xx - t2xx) ** 2 + 2 * (m2xy - t2xy) ** 2 + (m2yy - t2yy) ** 2) / (fm * (um + fm))
  const ej = Math.hypot(djx - fxx, djy - fyy) / fm

  return { S, m0, m1x, m1y, m2xx, m2xy, m2yy, t1x, t1y, t2xx, t2xy, t2yy, djx, djy, e0, e1, e2, ej }
}

export function ForceMomentBudgetDial() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [scheme, setScheme] = useState<Scheme>('guo')
  const [tau, setTau] = useState(1.0)
  const [angle, setAngle] = useState(0)
  const [umag, setUmag] = useState(0.08)
  const [prefactor, setPrefactor] = useState(true)

  const schemeRef = useRef(scheme)
  const tauRef = useRef(tau)
  const angRef = useRef(angle)
  const umRef = useRef(umag)
  const preRef = useRef(prefactor)
  schemeRef.current = scheme
  tauRef.current = tau
  angRef.current = angle
  umRef.current = umag
  preRef.current = prefactor

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    // eased display values for the bars (gentle needle motion)
    const shown = new Float64Array(10)
    let first = true

    const CXB = 445
    const HALF = 178
    const ROWS = [54, 102, 142, 190, 238]

    const text = (s: string, x: number, y: number, col: string, font = '10px ui-monospace, monospace') => {
      ctx.font = font
      ctx.fillStyle = col
      ctx.fillText(s, x, y)
    }
    const textRight = (s: string, x: number, y: number, col: string) => {
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillStyle = col
      ctx.fillText(s, x - ctx.measureText(s).width, y)
    }

    const track = (y: number) => {
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(CXB - HALF, y, 2 * HALF, 16)
      ctx.beginPath()
      ctx.moveTo(CXB, y)
      ctx.lineTo(CXB, y + 16)
      ctx.stroke()
    }
    const bar = (y: number, v: number, h: number, col: string) => {
      const w = Math.max(-1, Math.min(1, v)) * HALF
      ctx.fillStyle = col
      if (w >= 0) ctx.fillRect(CXB, y, Math.max(w, 0.8), h)
      else ctx.fillRect(CXB + w, y, -w, h)
    }

    const draw = (ts: number) => {
      const sc = schemeRef.current
      const t = tauRef.current
      const th = (angRef.current * Math.PI) / 180
      const um = umRef.current
      const locked = sc === 'shanchen'
      const preOn = locked ? true : preRef.current
      const pref = 1 - 1 / (2 * t)
      const gain = locked ? 1 : preOn ? pref : 1

      const fxx = FMAG * Math.cos(th)
      const fyy = FMAG * Math.sin(th)
      const b = buildBudget(sc, t, fxx, fyy, um, 0, gain)

      ctx.fillStyle = 'rgba(8,17,31,0.98)'
      ctx.fillRect(0, 0, c.width, c.height)

      // ------------------------------------------------------------------ stencil
      text('D2Q9 source stencil  S_i', 14, 28, '#cbd5e1', '11px ui-monospace, monospace')
      const SCX = 130
      const SCY = 152
      const SP = 56
      let maxAbs = 1e-30
      for (let i = 0; i < 9; i++) maxAbs = Math.max(maxAbs, Math.abs(b.S[i]))

      // faint lattice links
      ctx.strokeStyle = 'rgba(148,163,184,0.16)'
      ctx.lineWidth = 1
      for (let i = 1; i < 9; i++) {
        ctx.beginPath()
        ctx.moveTo(SCX, SCY)
        ctx.lineTo(SCX + EX[i] * SP, SCY - EY[i] * SP)
        ctx.stroke()
      }

      const pulse = 1 + 0.05 * Math.sin(ts * 0.0025)
      for (let i = 0; i < 9; i++) {
        const x = SCX + EX[i] * SP
        const y = SCY - EY[i] * SP
        const r = (2.5 + 23 * Math.sqrt(Math.abs(b.S[i]) / maxAbs)) * pulse
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = b.S[i] >= 0 ? 'rgba(34,211,238,0.55)' : 'rgba(251,191,36,0.55)'
        ctx.fill()
        ctx.strokeStyle = b.S[i] >= 0 ? '#22d3ee' : '#fbbf24'
        ctx.lineWidth = 1.2
        ctx.stroke()
        // opposite-direction tick, so the reader sees the +/- pairing c_i <-> c_OPP[i]
        if (i > 0 && OPP[i] > i) {
          ctx.strokeStyle = 'rgba(203,213,225,0.18)'
          ctx.beginPath()
          ctx.moveTo(SCX + EX[i] * SP, SCY - EY[i] * SP)
          ctx.lineTo(SCX + EX[OPP[i]] * SP, SCY - EY[OPP[i]] * SP)
          ctx.stroke()
        }
      }

      // rotating dashed ring + force arrow
      ctx.save()
      ctx.translate(SCX, SCY)
      ctx.rotate((ts * 0.0004) % (Math.PI * 2))
      ctx.strokeStyle = 'rgba(203,213,225,0.18)'
      ctx.setLineDash([3, 6])
      ctx.beginPath()
      ctx.arc(0, 0, 30, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      const ax = SCX + Math.cos(th) * 52
      const ay = SCY - Math.sin(th) * 52
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(SCX, SCY)
      ctx.lineTo(ax, ay)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - 9 * Math.cos(th - 0.4), ay + 9 * Math.sin(th - 0.4))
      ctx.lineTo(ax - 9 * Math.cos(th + 0.4), ay + 9 * Math.sin(th + 0.4))
      ctx.closePath()
      ctx.fillStyle = '#e2e8f0'
      ctx.fill()

      // background velocity arrow (always +x)
      ctx.strokeStyle = 'rgba(74,222,128,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(SCX - 100, SCY + 92)
      ctx.lineTo(SCX - 100 + 40 * (um / 0.15 + 0.15), SCY + 92)
      ctx.stroke()
      text(`u = (${um.toFixed(3)}, 0)`, SCX - 100, SCY + 86, '#4ade80')

      text('radius ∝ |S_i|', 14, 268, '#94a3b8')
      text('cyan S_i > 0   amber S_i < 0', 14, 282, '#94a3b8')
      text(`white arrow = F,  θ = ${angRef.current.toFixed(0)}°`, 14, 296, '#cbd5e1')
      text(`|F| = ${FMAG.toExponential(1)},  ρ = 1`, 14, 310, '#cbd5e1')

      // ------------------------------------------------------------------ bars
      text(`moment budget of ${SCHEME_LABEL[sc]}${locked ? '  (effective S_i)' : ''}`, 262, 28, '#22d3ee', '11px ui-monospace, monospace')
      text(`gain = ${gain.toFixed(3)}${locked ? '  self-consistent' : preOn ? '  = 1 - 1/2τ' : '  (prefactor OFF)'}`, 262, 42, locked ? '#94a3b8' : preOn ? '#4ade80' : '#f87171')

      const rows: { label: string; meas: number; targ: number; scale: number; err: number; unit: string }[] = [
        { label: 'M0  Σ S_i            mass', meas: b.m0, targ: 0, scale: FMAG, err: b.e0, unit: '/|F|' },
        { label: 'M1x Σ c_x S_i    momentum x', meas: b.m1x, targ: b.t1x, scale: FMAG, err: b.e1, unit: '/|F|' },
        { label: 'M1y Σ c_y S_i    momentum y', meas: b.m1y, targ: b.t1y, scale: FMAG, err: b.e1, unit: '/|F|' },
        {
          label: 'M2xx Σ c_x c_x S_i   stress',
          meas: b.m2xx,
          targ: b.t2xx,
          scale: 2 * FMAG * (um + FMAG),
          err: b.e2,
          unit: '/(2|u||F|)',
        },
        { label: 'Δj = M1 + F/2τ   per step', meas: b.djx, targ: fxx, scale: 2 * FMAG, err: b.ej, unit: '/|F|' },
      ]

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        const y = ROWS[r]
        const vm = row.meas / row.scale
        const vt = row.targ / row.scale
        if (first) {
          shown[2 * r] = vm
          shown[2 * r + 1] = vt
        } else {
          shown[2 * r] += (vm - shown[2 * r]) * 0.18
          shown[2 * r + 1] += (vt - shown[2 * r + 1]) * 0.18
        }
        const ok = row.err < (r === 0 ? 1e-6 : 0.01)
        text(row.label, 262, y - 3, '#cbd5e1')
        textRight(`${ok ? '✓' : '✗'}`, 628, y - 3, ok ? '#4ade80' : '#f87171')
        textRight(`${(row.meas / row.scale).toFixed(3)} vs ${(row.targ / row.scale).toFixed(3)}  ${row.unit}`, 616, y - 3, ok ? '#4ade80' : '#f87171')
        track(y + 2)
        bar(y + 3, shown[2 * r], 7, '#22d3ee')
        bar(y + 11, shown[2 * r + 1], 6, '#fbbf24')
      }
      first = false

      text('cyan = measured', 262, ROWS[4] + 34, '#22d3ee')
      text('amber = target', 366, ROWS[4] + 34, '#fbbf24')
      text(`target M1 = (1-1/2τ)F = ${pref.toFixed(3)}·F,  target M2 = (1-1/2τ)(uF+Fu)`, 262, ROWS[4] + 48, '#94a3b8')

      // ------------------------------------------------------------------ notes
      text('M0 = mass,  M1 = momentum,  M2 = stress — (1 − 1/2τ) rides on BOTH M1 and M2', 14, 336, '#cbd5e1')
      text('the half-shifted equilibrium hands back F/(2τ), so Δj = M1 + F/(2τ) must equal F', 14, 350, '#cbd5e1')
      text(SCHEME_NOTE[sc], 14, 364, '#94a3b8')
      const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.0018))
      ctx.globalAlpha = glow
      text('M2 is where the schemes disagree — sweep τ', 14, 380, '#22d3ee', '11px ui-monospace, monospace')
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
        height={390}
        style={{ width: '100%', maxWidth: 640, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '0.7rem' }}>
        {SCHEMES.map((s) => (
          <button key={s} onClick={() => setScheme(s)} style={btn(scheme === s)}>
            {SCHEME_LABEL[s]}
          </button>
        ))}
        <button onClick={() => setPrefactor((v) => !v)} disabled={locked} style={btn(!locked && prefactor, locked)}>
          {prefactor ? '[x]' : '[ ]'} (1 − 1/2τ) prefactor
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center', marginTop: '0.6rem', fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          τ
          <input type="range" min={0.6} max={2} step={0.05} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }}>{tau.toFixed(2)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          F angle θ
          <input type="range" min={0} max={360} step={1} value={angle} onChange={(e) => setAngle(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 38 }}>{angle.toFixed(0)}°</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          |u|
          <input type="range" min={0} max={0.15} step={0.001} value={umag} onChange={(e) => setUmag(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }}>{umag.toFixed(3)}</span>
        </label>
      </div>
    </div>
  )
}
