'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A rectangular barge section, heeled, with the buoyancy centre computed from
// the actual submerged polygon -- not from a small-angle formula.
//
//   earth frame of a body point (x, y):   X = x cos(phi) + y sin(phi)
//                                         Y = y cos(phi) - x sin(phi)
//   submerged region = { Y <= h },  h chosen so the cut area equals B*T
//   righting arm      GZ = X_B - X_G = xb cos(phi) + (yb - KG) sin(phi)
//
// The metacentre M drawn on the centreline is the *true* one for the current
// heel: the intersection of the buoyancy vertical with the ship centreline,
// KM(phi) = X_B / sin(phi). It agrees with KB + B^2/12T only near phi = 0,
// which is exactly the point of the panel.
//
// Roll is integrated with the real GZ, so a negative GM does not merely print
// a warning -- the barge falls over to its angle of loll.
// ---------------------------------------------------------------------------

const W = 744
const H = 470

const HX = 236 // hull panel centre x
const HY = 214 // waterline y (screen)
const PX0 = 18
const PX1 = 452

const CX0 = 486 // GZ curve panel
const CX1 = 726
const CY0 = 44
const CY1 = 236

const G_ACC = 9.81

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

function waterline(poly: Pt[], phi: number, area0: number): number {
  let lo = -80
  let hi = 80
  for (let k = 0; k < 54; k++) {
    const mid = 0.5 * (lo + hi)
    const a = areaCentroid(clipBelow(poly, phi, mid))[0]
    if (a < area0) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

function hullOf(beam: number, depth: number): Pt[] {
  return [
    [-beam / 2, 0],
    [beam / 2, 0],
    [beam / 2, depth],
    [-beam / 2, depth],
  ]
}

type Section = { h: number; sub: Pt[]; xb: number; yb: number; gz: number }

function section(beam: number, depth: number, draft: number, kg: number, phi: number): Section {
  const hull = hullOf(beam, depth)
  const h = waterline(hull, phi, beam * draft)
  const sub = clipBelow(hull, phi, h)
  const [, xb, yb] = areaCentroid(sub)
  return { h, sub, xb, yb, gz: xb * Math.cos(phi) + (yb - kg) * Math.sin(phi) }
}

export function BargeHeelMetacenterBench() {
  const [beam, setBeam] = useState(16)
  const [draft, setDraft] = useState(4)
  const [kg, setKg] = useState(6.6)
  const [rolling, setRolling] = useState(true)
  const [heelDeg, setHeelDeg] = useState(15)
  const [tick, setTick] = useState(0)

  const depth = 8

  const curve = useMemo(() => {
    const pts: { d: number; gz: number }[] = []
    for (let d = 0; d <= 70; d += 2) pts.push({ d, gz: section(beam, depth, draft, kg, (d * Math.PI) / 180).gz })
    return pts
  }, [beam, draft, kg])

  const kb = draft / 2
  const bm = (beam * beam) / (12 * draft)
  const gm = kb + bm - kg
  const gzMax = curve.reduce((m, p) => Math.max(m, p.gz), 0)

  const st = useRef({ phi: (15 * Math.PI) / 180, rate: 0 })
  const cfg = useRef({ beam, draft, kg, rolling, heelDeg, curve, gm, kb, bm, gzMax })
  cfg.current = { beam, draft, kg, rolling, heelDeg, curve, gm, kb, bm, gzMax }

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
      const sc = Math.min(300 / c.beam, 150 / depth)

      // ---- roll dynamics or manual hold ----------------------------------
      if (c.rolling) {
        const kr = 0.42 * c.beam // roll radius of gyration
        for (let s = 0; s < 3; s++) {
          const h = dt / 3
          const gz = section(c.beam, depth, c.draft, c.kg, st.current.phi).gz
          const acc = (-G_ACC / (kr * kr)) * gz - 0.55 * st.current.rate
          st.current.rate += acc * h
          st.current.phi += st.current.rate * h
        }
        if (st.current.phi > 1.4) {
          st.current.phi = 1.4
          st.current.rate = 0
        }
        if (st.current.phi < -1.4) {
          st.current.phi = -1.4
          st.current.rate = 0
        }
      } else {
        st.current.phi = (c.heelDeg * Math.PI) / 180
        st.current.rate = 0
      }

      const phi = st.current.phi
      const sec = section(c.beam, depth, c.draft, c.kg, phi)
      const cos = Math.cos(phi)
      const sin = Math.sin(phi)
      const toX = (x: number, y: number) => HX + sc * (x * cos + y * sin)
      const toY = (x: number, y: number) => HY - sc * (y * cos - x * sin - sec.h)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- water ----------------------------------------------------------
      ctx.fillStyle = 'rgba(56,189,248,0.13)'
      ctx.fillRect(PX0, HY, PX1 - PX0, 132)
      ctx.strokeStyle = 'rgba(56,189,248,0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(PX0, HY)
      ctx.lineTo(PX1, HY)
      ctx.stroke()

      // ---- submerged part --------------------------------------------------
      ctx.beginPath()
      sec.sub.forEach((p, i) => (i ? ctx.lineTo(toX(p[0], p[1]), toY(p[0], p[1])) : ctx.moveTo(toX(p[0], p[1]), toY(p[0], p[1]))))
      ctx.closePath()
      ctx.fillStyle = 'rgba(56,189,248,0.34)'
      ctx.fill()

      // ---- hull outline ----------------------------------------------------
      const hull = hullOf(c.beam, depth)
      ctx.beginPath()
      hull.forEach((p, i) => (i ? ctx.lineTo(toX(p[0], p[1]), toY(p[0], p[1])) : ctx.moveTo(toX(p[0], p[1]), toY(p[0], p[1]))))
      ctx.closePath()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.stroke()

      // centreline
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(toX(0, 0), toY(0, 0))
      ctx.lineTo(toX(0, depth), toY(0, depth))
      ctx.stroke()
      ctx.setLineDash([])

      // ---- G, B, M ---------------------------------------------------------
      const gX = toX(0, c.kg)
      const gY = toY(0, c.kg)
      const bX = toX(sec.xb, sec.yb)
      const bY = toY(sec.xb, sec.yb)

      // buoyancy vertical and weight vertical
      ctx.strokeStyle = 'rgba(52,211,153,0.55)'
      ctx.beginPath()
      ctx.moveTo(bX, bY - 150)
      ctx.lineTo(bX, bY + 40)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(251,191,36,0.55)'
      ctx.beginPath()
      ctx.moveTo(gX, gY - 90)
      ctx.lineTo(gX, gY + 90)
      ctx.stroke()

      // metacentre: intersection of the buoyancy vertical with the centreline
      const kmPhi = Math.abs(sin) > 1e-4 ? (sec.xb * cos + sec.yb * sin) / sin : c.kb + c.bm
      if (kmPhi > 0 && kmPhi < 4 * depth) {
        const mX = toX(0, kmPhi)
        const mY = toY(0, kmPhi)
        ctx.fillStyle = '#a78bfa'
        ctx.beginPath()
        ctx.arc(mX, mY, 5, 0, 6.2832)
        ctx.fill()
        text('M', mX + 8, mY + 4, '#a78bfa', 'bold 12px ui-monospace, monospace')
      }

      const dot = (x: number, y: number, col: string, lbl: string) => {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 6.2832)
        ctx.fill()
        text(lbl, x + 8, y + 4, col, 'bold 12px ui-monospace, monospace')
      }
      dot(gX, gY, '#fbbf24', 'G')
      dot(bX, bY, '#34d399', 'B')

      // GZ bracket
      const armY = Math.max(gY, bY) + 26
      ctx.strokeStyle = sec.gz >= 0 ? '#34d399' : '#f87171'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gX, armY)
      ctx.lineTo(bX, armY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(bX, armY)
      ctx.lineTo(bX - Math.sign(bX - gX) * 8, armY - 4)
      ctx.lineTo(bX - Math.sign(bX - gX) * 8, armY + 4)
      ctx.closePath()
      ctx.fill()
      text('GZ = ' + sec.gz.toFixed(3) + ' m', (gX + bX) / 2 - 34, armY + 18, sec.gz >= 0 ? '#34d399' : '#f87171')

      text(
        'HEEL  phi = ' + ((phi * 180) / Math.PI).toFixed(1) + ' deg     B = ' + c.beam.toFixed(1) + ' m   T = ' + c.draft.toFixed(1) + ' m   KG = ' + c.kg.toFixed(1) + ' m',
        PX0,
        26,
        '#cbd5e1',
        'bold 11px ui-monospace, monospace',
      )
      text('G weight   B buoyancy   M metacentre', PX0, H - 82, '#64748b')

      // ---- GZ curve panel --------------------------------------------------
      const gzTop = Math.max(0.35, c.gzMax * 1.25)
      const gzBot = -gzTop * 0.6
      const cxOf = (d: number) => CX0 + ((CX1 - CX0) * d) / 70
      const cyOf = (v: number) => CY1 - ((CY1 - CY0) * (v - gzBot)) / (gzTop - gzBot)

      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(CX0, CY0, CX1 - CX0, CY1 - CY0)
      ctx.beginPath()
      ctx.moveTo(CX0, cyOf(0))
      ctx.lineTo(CX1, cyOf(0))
      ctx.stroke()

      // small-angle line GM*sin(phi)
      ctx.strokeStyle = 'rgba(167,139,250,0.8)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      for (let d = 0; d <= 70; d += 2) {
        const v = c.gm * Math.sin((d * Math.PI) / 180)
        const yy = Math.max(CY0, Math.min(CY1, cyOf(v)))
        if (d === 0) ctx.moveTo(cxOf(d), yy)
        else ctx.lineTo(cxOf(d), yy)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 2
      ctx.beginPath()
      c.curve.forEach((p, i) => {
        const yy = Math.max(CY0, Math.min(CY1, cyOf(p.gz)))
        if (i === 0) ctx.moveTo(cxOf(p.d), yy)
        else ctx.lineTo(cxOf(p.d), yy)
      })
      ctx.stroke()

      const dNow = Math.min(70, Math.abs((phi * 180) / Math.PI))
      const gzMark = phi < 0 ? -sec.gz : sec.gz
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(cxOf(dNow), Math.max(CY0, Math.min(CY1, cyOf(gzMark))), 4, 0, 6.2832)
      ctx.fill()

      text('RIGHTING ARM GZ  [m]  vs heel [deg]', CX0, CY0 - 14, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      text('0', CX0 - 4, CY1 + 14, '#64748b')
      text('70', CX1 - 12, CY1 + 14, '#64748b')
      text('solid: exact polygon', CX0 + 4, CY1 + 30, '#34d399')
      text('dashed: GM sin(phi)', CX0 + 4, CY1 + 46, '#a78bfa')

      // ---- gauges ----------------------------------------------------------
      const GY0 = H - 62
      const bar = (lbl: string, val: number, span: number, x: number, y: number, col: string) => {
        text(lbl, x, y, '#94a3b8')
        const bw = 120
        ctx.fillStyle = 'rgba(148,163,184,0.18)'
        ctx.fillRect(x, y + 7, bw, 12)
        const frac = Math.max(-1, Math.min(1, val / span))
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
      text('KB = ' + c.kb.toFixed(3) + ' m     BM = B^2/12T = ' + c.bm.toFixed(3) + ' m     KM = ' + (c.kb + c.bm).toFixed(3) + ' m', PX0, GY0 - 10, '#94a3b8')
      bar('GM = KM - KG', c.gm, 3, PX0, GY0 + 4, c.gm > 0 ? '#34d399' : '#f87171')
      bar('KM(phi) - KG', kmPhi - c.kg, 3, PX0 + 232, GY0 + 4, kmPhi - c.kg > 0 ? '#38bdf8' : '#f87171')

      const verdict =
        c.gm > 0.15
          ? 'GM > 0: the barge returns upright'
          : c.gm > 0
            ? 'GM barely positive: a long, lazy roll -- and no margin left'
            : 'GM < 0: upright is unstable, it settles at an angle of loll'
      text(verdict, CX0, GY0 + 22, c.gm > 0.15 ? '#34d399' : c.gm > 0 ? '#fbbf24' : '#f87171')

      if (++frame % 12 === 0) setTick((t) => t + 1)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const phiNow = ((st.current.phi * 180) / Math.PI).toFixed(1)
  const release = (deg: number) => {
    st.current.phi = (deg * Math.PI) / 180
    st.current.rate = 0
    setRolling(true)
    setTick((t) => t + 1)
  }

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }
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
          <span style={name}>beam B [m]</span>
          <input type="range" min={10} max={22} step={0.5} value={beam} onChange={(e) => setBeam(parseFloat(e.target.value))} />
          <span style={mono}>{beam.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={name}>draft T [m]</span>
          <input type="range" min={2.5} max={6} step={0.1} value={draft} onChange={(e) => setDraft(parseFloat(e.target.value))} />
          <span style={mono}>{draft.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={name}>KG [m]</span>
          <input type="range" min={3} max={8.5} step={0.1} value={kg} onChange={(e) => setKg(parseFloat(e.target.value))} />
          <span style={mono}>{kg.toFixed(1)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => release(15)} style={btn(false, '#38bdf8')}>
          release at 15 deg
        </button>
        <button onClick={() => release(40)} style={btn(false, '#38bdf8')}>
          release at 40 deg
        </button>
        <button onClick={() => setRolling(!rolling)} style={btn(!rolling, '#fbbf24')}>
          {rolling ? 'hold heel' : 'let it roll'}
        </button>
        {!rolling && (
          <label style={label}>
            <span style={name}>heel [deg]</span>
            <input type="range" min={-60} max={60} step={1} value={heelDeg} onChange={(e) => setHeelDeg(parseInt(e.target.value, 10))} />
            <span style={mono}>{heelDeg}</span>
          </label>
        )}
        <span data-tick={tick} style={{ ...mono, color: '#94a3b8', minWidth: 120 }}>
          phi = {phiNow} deg
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Raise KG past 7.33 m and the barge no longer comes back &mdash; it rolls out to an angle of loll and stays there. Hold the
        heel and drag it past 27 deg: the deck edge goes under, the waterplane stops widening, and the green GZ curve peels away
        from the dashed straight line GM&nbsp;sin&nbsp;phi. That gap is why a single number cannot certify a hull.
      </div>
    </div>
  )
}
