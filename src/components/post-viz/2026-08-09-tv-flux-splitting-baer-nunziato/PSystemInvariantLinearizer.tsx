'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The whole linearized Riemann solver of section 5.1 is one approximation:
// replace the generalized Riemann invariant of the P-system
//
//     du/dp = 2 / ( rho (u - A) ),      A = sqrt(u^2 + 4 a^2),   rho = const
//
// by its TANGENT at the foot of the characteristic, i.e. freeze
// C_L = rho_L (u_L - A_L) and integrate trivially:
//
//     u - u_L = (2 / C_L)(p - p_L)      ->   p*_L = p_L + C_L (u* - u_L)/2
//
// Same on the right with C_R = rho_R (u_R + A_R). Two straight lines, one
// intersection, done -- no iteration, no eigenvector evaluation. That is where
// the factor-8 speedup over the HLLC solver for the full BN system comes from.
//
// This panel draws the two exact integral curves (RK4 on the ODE above) next to
// the two tangents, so you can watch the linearization error open up as the
// pressure ratio grows. At p_L/p_R = 1.1 the star state is off by ~2%; at 3 it
// is already ~12%, and at 40 it is ~67%. The surprise of the paper is that a
// first-order scheme built on such a loose star state still beats a Rusanov
// flux -- the P-flux only has to be consistent and dissipative, not accurate.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const GX = 62
const GY = 34
const GW = 452
const GH = 322

const GAM = 1.4
const C_L_COL = '#fbbf24'
const C_R_COL = '#38bdf8'
const C_EX = '#e2e8f0'
const BG = '#08111f'

function bigA(u: number, p: number, rho: number): number {
  return Math.sqrt(u * u + (4 * GAM * Math.max(p, 1e-9)) / rho)
}

// du/dp along a P-system nonlinear characteristic. sgn = -1 for the left wave
// (u - A), +1 for the right wave (u + A). rho stays constant across it.
function dudp(u: number, p: number, rho: number, sgn: number): number {
  const den = rho * (u + sgn * bigA(u, p, rho))
  return 2 / (Math.abs(den) < 1e-9 ? (den < 0 ? -1e-9 : 1e-9) : den)
}

// RK4 march of the exact invariant from (u0, p0) to pressure pEnd
function integrate(u0: number, p0: number, rho: number, sgn: number, pEnd: number, steps = 220): number {
  const h = (pEnd - p0) / steps
  let u = u0
  let p = p0
  for (let i = 0; i < steps; i++) {
    const k1 = dudp(u, p, rho, sgn)
    const k2 = dudp(u + (h * k1) / 2, p + h / 2, rho, sgn)
    const k3 = dudp(u + (h * k2) / 2, p + h / 2, rho, sgn)
    const k4 = dudp(u + h * k3, p + h, rho, sgn)
    u += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6
    p += h
  }
  return u
}

type State = { uL: number; pL: number; rL: number; uR: number; pR: number; rR: number }

function linearStar(s: State) {
  const CL = s.rL * (s.uL - bigA(s.uL, s.pL, s.rL)) // < 0
  const CR = s.rR * (s.uR + bigA(s.uR, s.pR, s.rR)) // > 0
  const us = (2 * (s.pR - s.pL) + CL * s.uL - CR * s.uR) / (CL - CR)
  const ps = s.pL + 0.5 * CL * (us - s.uL)
  return { us, ps, CL, CR }
}

// exact star: bisect on p for uL_curve(p) == uR_curve(p)
function exactStar(s: State, pLo: number, pHi: number) {
  const gap = (p: number) => integrate(s.uL, s.pL, s.rL, -1, p) - integrate(s.uR, s.pR, s.rR, +1, p)
  let lo = pLo
  let hi = pHi
  let flo = gap(lo)
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    const fm = gap(mid)
    if (flo * fm <= 0) hi = mid
    else {
      lo = mid
      flo = fm
    }
  }
  const ps = 0.5 * (lo + hi)
  return { us: integrate(s.uL, s.pL, s.rL, -1, ps), ps }
}

export function PSystemInvariantLinearizer() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [pL, setPL] = useState(3.0)
  const [uL, setUL] = useState(0.5)
  const [rL, setRL] = useState(1.0)
  const [pR, setPR] = useState(1.0)
  const [uR, setUR] = useState(0.0)
  const [rR, setRR] = useState(0.6)
  const [sweep, setSweep] = useState(true)

  const cfg = useRef({ pL, uL, rL, pR, uR, rR, sweep })
  cfg.current = { pL, uL, rL, pR, uR, rR, sweep }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    let raf = 0
    let phase = 0
    let last = 0

    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      const c = cfg.current
      if (c.sweep) phase = (phase + dt * 0.28) % 1

      const st: State = { uL: c.uL, pL: c.pL, rL: c.rL, uR: c.uR, pR: c.pR, rR: c.rR }
      const lin = linearStar(st)
      const pMin = 0.06 * Math.min(st.pL, st.pR)
      const pMax = 2.4 * Math.max(st.pL, st.pR)
      const ex = exactStar(st, pMin, pMax)

      // sample both exact curves across the window
      const NS = 90
      const curveL: [number, number][] = []
      const curveR: [number, number][] = []
      for (let i = 0; i <= NS; i++) {
        const p = pMin + ((pMax - pMin) * i) / NS
        curveL.push([p, integrate(st.uL, st.pL, st.rL, -1, p, 90)])
        curveR.push([p, integrate(st.uR, st.pR, st.rR, +1, p, 90)])
      }

      const us: number[] = [...curveL.map((d) => d[1]), ...curveR.map((d) => d[1]), lin.us, ex.us]
      let uLo = Math.min(...us)
      let uHi = Math.max(...us)
      const pad = 0.12 * (uHi - uLo || 1)
      uLo -= pad
      uHi += pad

      const px = (p: number) => GX + ((p - pMin) / (pMax - pMin)) * GW
      const py = (uu: number) => GY + GH - ((uu - uLo) / (uHi - uLo)) * GH

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      // grid + axes
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const gx = GX + (GW * i) / 5
        const gy = GY + (GH * i) / 5
        ctx.beginPath()
        ctx.moveTo(gx, GY)
        ctx.lineTo(gx, GY + GH)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(GX, gy)
        ctx.lineTo(GX + GW, gy)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(GX, GY, GW, GH)
      for (let i = 0; i <= 5; i++) {
        text((pMin + ((pMax - pMin) * i) / 5).toFixed(1), GX + (GW * i) / 5 - 10, GY + GH + 16, '#64748b', '10px ui-monospace, monospace')
        text((uHi - ((uHi - uLo) * i) / 5).toFixed(2), 18, GY + (GH * i) / 5 + 4, '#64748b', '10px ui-monospace, monospace')
      }
      text('p', GX + GW / 2, GY + GH + 32, '#94a3b8')
      text('u', 22, GY - 10, '#94a3b8')

      const poly = (pts: [number, number][], col: string, wdt: number, dash: number[] = []) => {
        ctx.strokeStyle = col
        ctx.lineWidth = wdt
        ctx.setLineDash(dash)
        ctx.beginPath()
        pts.forEach(([p, uu], i) => (i ? ctx.lineTo(px(p), py(uu)) : ctx.moveTo(px(p), py(uu))))
        ctx.stroke()
        ctx.setLineDash([])
      }

      // exact integral curves (solid, pale) and the tangents actually used (dashed, coloured)
      poly(curveL, 'rgba(226,232,240,0.55)', 2)
      poly(curveR, 'rgba(226,232,240,0.55)', 2)
      poly(
        [
          [pMin, st.uL + (2 / lin.CL) * (pMin - st.pL)],
          [pMax, st.uL + (2 / lin.CL) * (pMax - st.pL)],
        ],
        C_L_COL,
        1.8,
        [6, 4]
      )
      poly(
        [
          [pMin, st.uR + (2 / lin.CR) * (pMin - st.pR)],
          [pMax, st.uR + (2 / lin.CR) * (pMax - st.pR)],
        ],
        C_R_COL,
        1.8,
        [6, 4]
      )

      // the two feet of the characteristics
      const dot = (p: number, uu: number, col: string, r = 4.5) => {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(px(p), py(uu), r, 0, Math.PI * 2)
        ctx.fill()
      }
      dot(st.pL, st.uL, C_L_COL)
      dot(st.pR, st.uR, C_R_COL)
      text('L', px(st.pL) + 8, py(st.uL) - 6, C_L_COL)
      text('R', px(st.pR) + 8, py(st.uR) - 6, C_R_COL)

      // sweeping marker: walk from p_L toward p*, showing the gap open up
      const pSweep = st.pL + (ex.ps - st.pL) * phase
      const uExAt = integrate(st.uL, st.pL, st.rL, -1, pSweep, 90)
      const uLinAt = st.uL + (2 / lin.CL) * (pSweep - st.pL)
      ctx.strokeStyle = '#f87171'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(px(pSweep), py(uExAt))
      ctx.lineTo(px(pSweep), py(uLinAt))
      ctx.stroke()
      dot(pSweep, uExAt, 'rgba(226,232,240,0.9)', 3.4)
      dot(pSweep, uLinAt, C_L_COL, 3.4)

      // star states
      ctx.strokeStyle = 'rgba(226,232,240,0.35)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(px(ex.ps), GY)
      ctx.lineTo(px(ex.ps), GY + GH)
      ctx.stroke()
      ctx.setLineDash([])
      dot(ex.ps, ex.us, C_EX, 5.5)
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px(lin.ps), py(lin.us), 6.5, 0, Math.PI * 2)
      ctx.stroke()

      // ---- right-hand readout ----
      const rx = GX + GW + 28
      const errP = (100 * Math.abs(lin.ps - ex.ps)) / Math.abs(ex.ps)
      const errU = Math.abs(lin.us - ex.us)
      const errCol = errP < 3 ? '#34d399' : errP < 15 ? '#fbbf24' : '#f87171'

      text('P-system star state', rx, GY + 6, '#e2e8f0', '12px ui-sans-serif, system-ui')
      text('exact invariant (RK4)', rx, GY + 30, 'rgba(226,232,240,0.8)')
      text(`p* = ${ex.ps.toFixed(4)}`, rx + 10, GY + 48, C_EX)
      text(`u* = ${ex.us.toFixed(4)}`, rx + 10, GY + 64, C_EX)

      text('linearized (eqs 15,19)', rx, GY + 92, '#f472b6')
      text(`p* = ${lin.ps.toFixed(4)}`, rx + 10, GY + 110, '#f472b6')
      text(`u* = ${lin.us.toFixed(4)}`, rx + 10, GY + 126, '#f472b6')

      text('error', rx, GY + 154, '#94a3b8')
      text(`Δp*/p* = ${errP.toFixed(2)} %`, rx + 10, GY + 172, errCol)
      text(`Δu*    = ${errU.toFixed(4)}`, rx + 10, GY + 188, errCol)

      text('frozen coefficients', rx, GY + 218, '#94a3b8')
      text(`C_L = ${lin.CL.toFixed(3)}`, rx + 10, GY + 236, C_L_COL)
      text(`C_R = ${lin.CR.toFixed(3)}`, rx + 10, GY + 252, C_R_COL)
      text(`p_L/p_R = ${(st.pL / st.pR).toFixed(2)}`, rx + 10, GY + 274, '#cbd5e1')

      text('— exact curve   -- tangent used', rx, GY + 306, '#64748b', '10px ui-monospace, monospace')
      text('red bar = live gap', rx, GY + 322, '#f87171', '10px ui-monospace, monospace')

      text(
        'Sliders move the feet L and R. Watch the pink circle drift off the white dot as p_L/p_R grows.',
        GX,
        H - 12,
        '#64748b'
      )
      text(`p_L/p_R = ${(st.pL / st.pR).toFixed(1)}`, GX + GW - 92, H - 12, '#94a3b8')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
  const monoL: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }
  const monoR: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#38bdf8', minWidth: 44 }
  const btn: CSSProperties = {
    padding: '4px 12px',
    borderRadius: 6,
    border: `1px solid ${sweep ? '#38bdf8' : 'rgba(148,163,184,0.35)'}`,
    background: sweep ? 'rgba(56,189,248,0.16)' : 'transparent',
    color: sweep ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
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
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>p_L</span>
          <input type="range" min={0.5} max={40} step={0.25} value={pL} onChange={(e) => setPL(parseFloat(e.target.value))} />
          <span style={monoL}>{pL.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>u_L</span>
          <input type="range" min={-2} max={2} step={0.05} value={uL} onChange={(e) => setUL(parseFloat(e.target.value))} />
          <span style={monoL}>{uL.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>ρ_L</span>
          <input type="range" min={0.2} max={4} step={0.05} value={rL} onChange={(e) => setRL(parseFloat(e.target.value))} />
          <span style={monoL}>{rL.toFixed(2)}</span>
        </label>
      </div>
      <div style={row}>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>p_R</span>
          <input type="range" min={0.2} max={10} step={0.1} value={pR} onChange={(e) => setPR(parseFloat(e.target.value))} />
          <span style={monoR}>{pR.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>u_R</span>
          <input type="range" min={-2} max={2} step={0.05} value={uR} onChange={(e) => setUR(parseFloat(e.target.value))} />
          <span style={monoR}>{uR.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>ρ_R</span>
          <input type="range" min={0.2} max={4} step={0.05} value={rR} onChange={(e) => setRR(parseFloat(e.target.value))} />
          <span style={monoR}>{rR.toFixed(2)}</span>
        </label>
        <button onClick={() => setSweep((s) => !s)} style={btn}>
          {sweep ? 'pause sweep' : 'run sweep'}
        </button>
      </div>
      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Slide p_L down to ~1.1 and the two star states nearly coincide (~2%). At the default ratio of 3 the
        gap is already ~12%; push p_L to 40 and it passes 65% — the tangent never reaches where the curve went.
      </div>
    </div>
  )
}
