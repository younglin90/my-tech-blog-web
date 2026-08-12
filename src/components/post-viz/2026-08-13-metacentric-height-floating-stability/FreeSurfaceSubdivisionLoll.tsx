'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The same barge, now with liquid in a tank. Nothing is added to the weight
// when the ship heels -- the liquid only moves sideways -- and that is enough
// to sink GM.
//
// Every liquid parcel is clipped to a horizontal free surface at the current
// heel, so the centre of gravity here is measured, not assumed:
//   X_G = ( Ws * KG_s sin(phi) + rho_f * sum_k a_k * X_k ) / W
//   GZ_eff = X_B - X_G
// The classical estimate it is compared against is
//   dGM = rho_f * i / (rho * disp),   i = n * (b/n)^3 / 12 = b^3 / (12 n^2)
// which is why n bulkheads cut the loss by n^2, not by n.
// ---------------------------------------------------------------------------

const W_CV = 744
const H_CV = 470

const HX = 232
const HY = 208
const PX0 = 18
const PX1 = 448

const CX0 = 486
const CX1 = 726
const CY0 = 44
const CY1 = 226

const G_ACC = 9.81
const RHO_SW = 1025
const RHO_F = 1000

const BEAM = 16
const DEPTH = 8
const DRAFT = 4
const DISP = BEAM * DRAFT // submerged area per unit length [m^2]
const TANK_Y0 = 1.2
const TANK_H = 3.2

type Pt = [number, number]

function areaCentroid(poly: Pt[]): [number, number, number] {
  let a = 0
  let cx = 0
  let cy = 0
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[i]
    const [x1, y1] = poly[(i + 1) % n]
    const cr = x0 * y1 - x1 * y0
    a += cr
    cx += (x0 + x1) * cr
    cy += (y0 + y1) * cr
  }
  a *= 0.5
  if (Math.abs(a) < 1e-12) return [0, 0, 0]
  return [a, cx / (6 * a), cy / (6 * a)]
}

function clipBelow(poly: Pt[], phi: number, h: number): Pt[] {
  const c = Math.cos(phi)
  const s = Math.sin(phi)
  const f = (p: Pt) => p[1] * c - p[0] * s - h
  const out: Pt[] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % n]
    const fp = f(p)
    const fq = f(q)
    if (fp <= 0) out.push(p)
    if (fp < 0 !== fq < 0) {
      const t = fp / (fp - fq)
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
    }
  }
  return out
}

function fillTo(poly: Pt[], phi: number, area0: number): Pt[] {
  let lo = -80
  let hi = 80
  for (let k = 0; k < 48; k++) {
    const mid = 0.5 * (lo + hi)
    if (areaCentroid(clipBelow(poly, phi, mid))[0] < area0) lo = mid
    else hi = mid
  }
  return clipBelow(poly, phi, 0.5 * (lo + hi))
}

const HULL: Pt[] = [
  [-BEAM / 2, 0],
  [BEAM / 2, 0],
  [BEAM / 2, DEPTH],
  [-BEAM / 2, DEPTH],
]

type State = {
  sub: Pt[]
  xb: number
  yb: number
  liq: Pt[][]
  gz: number
  gzFrozen: number
  xg: number
  yg: number
}

function evaluate(b: number, n: number, fill: number, kgs: number, phi: number): State {
  const sub = fillTo(HULL, phi, DISP)
  const [, xb, yb] = areaCentroid(sub)
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)

  const w = b / n
  const aTank = w * fill
  const liq: Pt[][] = []
  let liqMoment = 0
  let liqMomentY = 0
  for (let k = 0; k < n; k++) {
    const x0 = -b / 2 + k * w
    const rect: Pt[] = [
      [x0, TANK_Y0],
      [x0 + w, TANK_Y0],
      [x0 + w, TANK_Y0 + TANK_H],
      [x0, TANK_Y0 + TANK_H],
    ]
    const p = fillTo(rect, phi, aTank)
    liq.push(p)
    const [, cx, cy] = areaCentroid(p)
    liqMoment += RHO_F * aTank * (cx * cos + cy * sin)
    liqMomentY += RHO_F * aTank * (cy * cos - cx * sin)
  }

  const wLiq = RHO_F * aTank * n
  const wTot = RHO_SW * DISP
  const wSolid = wTot - wLiq
  const xg = (wSolid * kgs * sin + liqMoment) / wTot
  const yg = (wSolid * kgs * cos + liqMomentY) / wTot

  const yl0 = TANK_Y0 + fill / 2
  const kg0 = (wSolid * kgs + wLiq * yl0) / wTot
  const xb1 = xb * cos + yb * sin
  return { sub, xb, yb, liq, gz: xb1 - xg, gzFrozen: xb1 - kg0 * sin, xg, yg }
}

export function FreeSurfaceSubdivisionLoll() {
  const [tankB, setTankB] = useState(12)
  const [nBulk, setNBulk] = useState(1)
  const [fill, setFill] = useState(2)
  const [kgs, setKgs] = useState(7.2)
  const [rolling, setRolling] = useState(true)
  const [tick, setTick] = useState(0)

  const derived = useMemo(() => {
    const wLiq = RHO_F * tankB * fill
    const wTot = RHO_SW * DISP
    const kg0 = ((wTot - wLiq) * kgs + wLiq * (TANK_Y0 + fill / 2)) / wTot
    const km = DRAFT / 2 + (BEAM * BEAM) / (12 * DRAFT)
    const iFree = (tankB * tankB * tankB) / (12 * nBulk * nBulk)
    const dGm = (RHO_F * iFree) / (RHO_SW * DISP)
    const curve: { d: number; gz: number }[] = []
    for (let d = 0; d <= 60; d += 2) curve.push({ d, gz: evaluate(tankB, nBulk, fill, kgs, (d * Math.PI) / 180).gz })
    return { kg0, km, gmFrozen: km - kg0, iFree, dGm, gmEff: km - kg0 - dGm, curve }
  }, [tankB, nBulk, fill, kgs])

  const st = useRef({ phi: (10 * Math.PI) / 180, rate: 0 })
  const cfg = useRef({ tankB, nBulk, fill, kgs, rolling, derived })
  cfg.current = { tankB, nBulk, fill, kgs, rolling, derived }

  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = 0
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.04, (now - last) / 1000) : 0
      last = now
      const c = cfg.current

      if (c.rolling) {
        const kr = 0.42 * BEAM
        for (let s = 0; s < 2; s++) {
          const h = dt / 2
          const gz = evaluate(c.tankB, c.nBulk, c.fill, c.kgs, st.current.phi).gz
          st.current.rate += ((-G_ACC / (kr * kr)) * gz - 0.55 * st.current.rate) * h
          st.current.phi += st.current.rate * h
        }
        if (Math.abs(st.current.phi) > 1.25) {
          st.current.phi = Math.sign(st.current.phi) * 1.25
          st.current.rate = 0
        }
      }

      const phi = st.current.phi
      const s = evaluate(c.tankB, c.nBulk, c.fill, c.kgs, phi)
      const cos = Math.cos(phi)
      const sin = Math.sin(phi)
      const sc = Math.min(300 / BEAM, 150 / DEPTH)
      const hw = (() => {
        // waterline height in earth frame, recovered from the submerged polygon
        let top = -1e9
        for (const p of s.sub) top = Math.max(top, p[1] * cos - p[0] * sin)
        return top
      })()
      const toX = (x: number, y: number) => HX + sc * (x * cos + y * sin)
      const toY = (x: number, y: number) => HY - sc * (y * cos - x * sin - hw)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W_CV, H_CV)

      ctx.fillStyle = 'rgba(56,189,248,0.13)'
      ctx.fillRect(PX0, HY, PX1 - PX0, 130)
      ctx.strokeStyle = 'rgba(56,189,248,0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(PX0, HY)
      ctx.lineTo(PX1, HY)
      ctx.stroke()

      const path = (poly: Pt[]) => {
        ctx.beginPath()
        poly.forEach((p, i) => (i ? ctx.lineTo(toX(p[0], p[1]), toY(p[0], p[1])) : ctx.moveTo(toX(p[0], p[1]), toY(p[0], p[1]))))
        ctx.closePath()
      }

      path(s.sub)
      ctx.fillStyle = 'rgba(56,189,248,0.32)'
      ctx.fill()

      path(HULL)
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.stroke()

      // tank walls
      const w = c.tankB / c.nBulk
      for (let k = 0; k < c.nBulk; k++) {
        const x0 = -c.tankB / 2 + k * w
        const rect: Pt[] = [
          [x0, TANK_Y0],
          [x0 + w, TANK_Y0],
          [x0 + w, TANK_Y0 + TANK_H],
          [x0, TANK_Y0 + TANK_H],
        ]
        path(rect)
        ctx.strokeStyle = 'rgba(251,191,36,0.75)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        if (s.liq[k].length > 2) {
          path(s.liq[k])
          ctx.fillStyle = 'rgba(251,191,36,0.42)'
          ctx.fill()
        }
      }

      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(toX(0, 0), toY(0, 0))
      ctx.lineTo(toX(0, DEPTH), toY(0, DEPTH))
      ctx.stroke()
      ctx.setLineDash([])

      // G (measured, includes the liquid) and B
      const gX = HX + sc * s.xg
      const gY = HY - sc * (s.yg - hw)
      const bX = toX(s.xb, s.yb)
      const bY = toY(s.xb, s.yb)

      ctx.strokeStyle = 'rgba(52,211,153,0.55)'
      ctx.beginPath()
      ctx.moveTo(bX, bY - 140)
      ctx.lineTo(bX, bY + 30)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(251,191,36,0.55)'
      ctx.beginPath()
      ctx.moveTo(gX, gY - 80)
      ctx.lineTo(gX, gY + 80)
      ctx.stroke()

      const dot = (x: number, y: number, col: string, lbl: string) => {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 6.2832)
        ctx.fill()
        text(lbl, x + 8, y + 4, col, 'bold 12px ui-monospace, monospace')
      }
      dot(gX, gY, '#fbbf24', 'G')
      dot(bX, bY, '#34d399', 'B')

      const armY = Math.max(gY, bY) + 24
      ctx.strokeStyle = s.gz >= 0 ? '#34d399' : '#f87171'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gX, armY)
      ctx.lineTo(bX, armY)
      ctx.stroke()
      text('GZ_eff = ' + s.gz.toFixed(3) + ' m', Math.min(gX, bX) - 10, armY + 18, s.gz >= 0 ? '#34d399' : '#f87171')

      text(
        'phi = ' + ((phi * 180) / Math.PI).toFixed(1) + ' deg    tank b = ' + c.tankB.toFixed(1) + ' m    bulkheads n = ' + c.nBulk + '    fill = ' + c.fill.toFixed(1) + ' m',
        PX0,
        26,
        '#cbd5e1',
        'bold 11px ui-monospace, monospace',
      )
      text('yellow = liquid, its surface stays horizontal whatever the hull does', PX0, H_CV - 92, '#64748b')

      // ---- curve panel -----------------------------------------------------
      const d = c.derived
      const top = Math.max(0.4, ...d.curve.map((p) => Math.abs(p.gz))) * 1.15
      const cxOf = (deg: number) => CX0 + ((CX1 - CX0) * deg) / 60
      const cyOf = (v: number) => (CY0 + CY1) / 2 - (((CY1 - CY0) / 2) * v) / top

      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(CX0, CY0, CX1 - CX0, CY1 - CY0)
      ctx.beginPath()
      ctx.moveTo(CX0, cyOf(0))
      ctx.lineTo(CX1, cyOf(0))
      ctx.stroke()

      ctx.strokeStyle = 'rgba(167,139,250,0.85)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      for (let deg = 0; deg <= 60; deg += 2) {
        const v = d.gmEff * Math.sin((deg * Math.PI) / 180)
        const yy = Math.max(CY0, Math.min(CY1, cyOf(v)))
        if (deg === 0) ctx.moveTo(cxOf(deg), yy)
        else ctx.lineTo(cxOf(deg), yy)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      d.curve.forEach((p, i) => {
        const yy = Math.max(CY0, Math.min(CY1, cyOf(p.gz)))
        if (i === 0) ctx.moveTo(cxOf(p.d), yy)
        else ctx.lineTo(cxOf(p.d), yy)
      })
      ctx.stroke()

      const degNow = Math.min(60, Math.abs((phi * 180) / Math.PI))
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(cxOf(degNow), Math.max(CY0, Math.min(CY1, cyOf(phi < 0 ? -s.gz : s.gz))), 4, 0, 6.2832)
      ctx.fill()

      text('GZ WITH THE LIQUID FREE TO MOVE [m]', CX0, CY0 - 14, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      text('0', CX0 - 4, CY1 + 14, '#64748b')
      text('60 deg', CX1 - 34, CY1 + 14, '#64748b')
      text('solid: measured   dashed: GM_eff sin(phi)', CX0 + 4, CY1 + 30, '#94a3b8')

      // ---- bars ------------------------------------------------------------
      const GY0 = H_CV - 74
      const bar = (lbl: string, val: number, x: number, y: number, col: string) => {
        text(lbl, x, y, '#94a3b8')
        const bw = 130
        ctx.fillStyle = 'rgba(148,163,184,0.18)'
        ctx.fillRect(x, y + 7, bw, 12)
        const frac = Math.max(-1, Math.min(1, val / 2.5))
        ctx.fillStyle = col
        if (frac >= 0) ctx.fillRect(x + bw / 2, y + 7, (bw / 2) * frac, 12)
        else ctx.fillRect(x + bw / 2 + (bw / 2) * frac, y + 7, (-bw / 2) * frac, 12)
        ctx.strokeStyle = 'rgba(148,163,184,0.6)'
        ctx.beginPath()
        ctx.moveTo(x + bw / 2, y + 5)
        ctx.lineTo(x + bw / 2, y + 21)
        ctx.stroke()
        text(val.toFixed(3) + ' m', x + bw + 8, y + 18, col, 'bold 12px ui-monospace, monospace')
      }
      text('i = b^3 / 12 n^2 = ' + d.iFree.toFixed(1) + ' m^4', PX0, GY0 - 8, '#94a3b8')
      bar('GM frozen', d.gmFrozen, PX0, GY0 + 2, '#38bdf8')
      bar('loss  dGM', d.dGm, PX0 + 196, GY0 + 2, '#f87171')
      bar('GM effective', d.gmEff, PX0 + 392, GY0 + 2, d.gmEff > 0 ? '#34d399' : '#f87171')

      const verdict =
        d.gmEff > 0.3
          ? 'subdivided enough: she rolls back to upright'
          : d.gmEff > 0
            ? 'positive but thin -- the roll period is long and the margin is gone'
            : 'GM_eff < 0: the liquid runs to the low side and holds her over'
      text(verdict, CX0, GY0 + 40, d.gmEff > 0.3 ? '#34d399' : d.gmEff > 0 ? '#fbbf24' : '#f87171')

      if (++frame % 12 === 0) setTick((t) => t + 1)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const release = (deg: number) => {
    st.current.phi = (deg * Math.PI) / 180
    st.current.rate = 0
    setRolling(true)
    setTick((t) => t + 1)
  }

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 42 }
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
        width={W_CV}
        height={H_CV}
        style={{ width: '100%', maxWidth: W_CV, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>tank width b [m]</span>
          <input type="range" min={4} max={14} step={0.5} value={tankB} onChange={(e) => setTankB(parseFloat(e.target.value))} />
          <span style={mono}>{tankB.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={name}>bulkheads n</span>
          <input type="range" min={1} max={5} step={1} value={nBulk} onChange={(e) => setNBulk(parseInt(e.target.value, 10))} />
          <span style={mono}>{nBulk}</span>
        </label>
        <label style={label}>
          <span style={name}>fill [m]</span>
          <input type="range" min={0.4} max={3} step={0.1} value={fill} onChange={(e) => setFill(parseFloat(e.target.value))} />
          <span style={mono}>{fill.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={name}>KG solid [m]</span>
          <input type="range" min={4} max={8} step={0.1} value={kgs} onChange={(e) => setKgs(parseFloat(e.target.value))} />
          <span style={mono}>{kgs.toFixed(1)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => release(10)} style={btn(false, '#38bdf8')}>
          release at 10 deg
        </button>
        <button onClick={() => setRolling(!rolling)} style={btn(!rolling, '#fbbf24')}>
          {rolling ? 'freeze' : 'let it roll'}
        </button>
        <span data-tick={tick} style={{ ...mono, color: '#94a3b8', minWidth: 150 }}>
          phi = {((st.current.phi * 180) / Math.PI).toFixed(1)} deg
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Start at n&nbsp;=&nbsp;1 and press release: the liquid slides to the low side and the barge never comes back. Now drag the
        bulkhead slider. The liquid volume never changes, the centre of gravity of the ship at rest never changes &mdash; only the
        width of each free surface does, and at n&nbsp;=&nbsp;2 the red loss bar has already dropped to a quarter.
      </div>
    </div>
  )
}
