'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Rankine vortex: a solid-body core of radius a glued to a free-vortex outside.
//
//   r <  a :  u = OMEGA r          omega_z = 2 OMEGA   (rotational)
//   r >= a :  u = OMEGA a^2 / r    omega_z = 0         (irrotational)
//
// Total pressure p0 = p + rho u^2 / 2 is FLAT outside and DIPS inside, exactly
// as Crocco predicts: d(p0)/dr = rho * u * omega_z.
//
// The little square is a material element advected by the exact field.  Inside
// the core it rotates without deforming (zero strain -> zero dissipation);
// outside it shears (nonzero strain) even though p0 never moves there.
// ---------------------------------------------------------------------------

const W = 760
const H = 404

const CX = 196
const CY = 202
const PX_PER_M = 140
const R_MAX = 1.2

const PL = 404 // plot box
const PR = 738
const PT = 64
const PB = 344

const RHO = 1.2
const MU = 1.8e-5

const COL_P = '#38bdf8'
const COL_Q = '#fb923c'
const COL_P0 = '#4ade80'
const COL_AX = 'rgba(148,163,184,0.35)'
const COL_TXT = '#94a3b8'

function velocity(r: number, omega: number, a: number) {
  return r < a ? omega * r : (omega * a * a) / r
}

function spin(r: number, omega: number, a: number) {
  return r < a ? 2 * omega : 0
}

// gauge pressure relative to p at infinity
function pressure(r: number, omega: number, a: number) {
  if (r >= a) return -0.5 * RHO * Math.pow((omega * a * a) / r, 2)
  return -RHO * omega * omega * a * a + 0.5 * RHO * omega * omega * r * r
}

function head(r: number, omega: number, a: number) {
  return pressure(r, omega, a) + 0.5 * RHO * Math.pow(velocity(r, omega, a), 2)
}

function dissipation(r: number, omega: number, a: number) {
  const s = r < a ? 0 : (-omega * a * a) / (r * r)
  return MU * s * s
}

function ramp(t: number) {
  // t = 0 -> deepest deficit (blue), t = 1 -> undisturbed (pale)
  const c = Math.max(0, Math.min(1, t))
  const r = Math.round(37 + (226 - 37) * c)
  const g = Math.round(99 + (232 - 99) * c)
  const b = Math.round(235 + (240 - 235) * c)
  return `rgb(${r},${g},${b})`
}

type Marker = { r: number; th: number }

function makeElement(rp: number): Marker[] {
  const half = 0.055
  const out: Marker[] = []
  for (const dx of [-half, half]) {
    for (const dy of [half, -half]) {
      const x = rp + dx
      const y = dy
      out.push({ r: Math.max(0.012, Math.hypot(x, y)), th: Math.atan2(y, x) })
    }
  }
  // reorder to a drawable quad
  return [out[0], out[2], out[3], out[1]]
}

export function RankineCoreHeadProbe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [coreA, setCoreA] = useState(0.5)
  const [omega, setOmega] = useState(60)
  const [probe, setProbe] = useState(0.25)
  const [field, setField] = useState<'p0' | 'p'>('p0')
  const [running, setRunning] = useState(true)
  const [read, setRead] = useState({ u: 0, p: 0, q: 0, p0: 0, phi: 0, lhs: 0, rhs: 0 })

  const live = useRef({ coreA, omega, probe, field, running })
  live.current = { coreA, omega, probe, field, running }
  const resetReq = useRef(0)
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const seeds: Marker[] = []
    for (let i = 0; i < 150; i++) {
      seeds.push({ r: 0.04 + Math.sqrt(Math.random()) * (R_MAX - 0.04), th: Math.random() * Math.PI * 2 })
    }
    let elem = makeElement(live.current.probe)
    let elemAge = 0
    let lastProbe = live.current.probe
    let frame = 0
    let raf = 0

    const draw = () => {
      const { coreA: a, omega: om, probe: rp, field: fd, running: run } = live.current
      const dt = run ? 0.006 : 0

      if (Math.abs(rp - lastProbe) > 1e-6 || resetReq.current > 0) {
        elem = makeElement(rp)
        elemAge = 0
        lastProbe = rp
        resetReq.current = 0
      }

      for (const s of seeds) s.th += (velocity(s.r, om, a) / s.r) * dt
      for (const m of elem) m.th += (velocity(m.r, om, a) / m.r) * dt
      elemAge += dt
      if (elemAge > 3.2) {
        elem = makeElement(rp)
        elemAge = 0
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      // ---- field: concentric rings -------------------------------------
      const deficit = RHO * om * om * a * a
      const pMin = -deficit
      const rings = 90
      for (let i = rings; i >= 1; i--) {
        const r = (i / rings) * R_MAX
        const val = fd === 'p0' ? head(r, om, a) : pressure(r, om, a)
        const t = pMin < -1e-9 ? 1 - val / pMin : 1
        ctx.fillStyle = ramp(t)
        ctx.beginPath()
        ctx.arc(CX, CY, r * PX_PER_M, 0, Math.PI * 2)
        ctx.fill()
      }

      // core edge
      ctx.strokeStyle = '#f8fafc'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(CX, CY, a * PX_PER_M, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // probe circle
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(CX, CY, rp * PX_PER_M, 0, Math.PI * 2)
      ctx.stroke()

      // tracers
      ctx.fillStyle = 'rgba(15,23,42,0.55)'
      for (const s of seeds) {
        ctx.beginPath()
        ctx.arc(CX + s.r * PX_PER_M * Math.cos(s.th), CY + s.r * PX_PER_M * Math.sin(s.th), 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      // material element
      ctx.strokeStyle = rp < a ? '#dc2626' : '#7c3aed'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      elem.forEach((m, i) => {
        const x = CX + m.r * PX_PER_M * Math.cos(m.th)
        const y = CY + m.r * PX_PER_M * Math.sin(m.th)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(fd === 'p0' ? 'total pressure  p0 = p + rho u^2 / 2' : 'static pressure  p', 16, 22)
      ctx.fillText('dashed = core edge  r = a', 16, 38)
      ctx.fillStyle = rp < a ? '#f87171' : '#c4b5fd'
      ctx.fillText(rp < a ? 'element: rigid rotation, no shear' : 'element: sheared by the free vortex', 16, H - 14)

      // ---- radial profile plot -----------------------------------------
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(PL - 8, PT - 26, PR - PL + 20, PB - PT + 60)

      let lo = 0
      let hi = 0
      for (let i = 0; i <= 120; i++) {
        const r = (i / 120) * R_MAX
        lo = Math.min(lo, pressure(r, om, a), head(r, om, a))
        hi = Math.max(hi, 0.5 * RHO * Math.pow(velocity(r, om, a), 2))
      }
      if (hi - lo < 1) hi = lo + 1
      const px = (r: number) => PL + (r / R_MAX) * (PR - PL)
      const py = (v: number) => PB - ((v - lo) / (hi - lo)) * (PB - PT)

      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PL, PT)
      ctx.lineTo(PL, PB)
      ctx.lineTo(PR, PB)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(PL, py(0))
      ctx.lineTo(PR, py(0))
      ctx.stroke()

      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(248,250,252,0.5)'
      ctx.beginPath()
      ctx.moveTo(px(a), PT)
      ctx.lineTo(px(a), PB)
      ctx.stroke()
      ctx.setLineDash([])

      const curves: Array<[string, (r: number) => number]> = [
        [COL_P, (r) => pressure(r, om, a)],
        [COL_Q, (r) => 0.5 * RHO * Math.pow(velocity(r, om, a), 2)],
        [COL_P0, (r) => head(r, om, a)],
      ]
      for (const [col, fn] of curves) {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 240; i++) {
          const r = (i / 240) * R_MAX
          const x = px(r)
          const y = py(fn(r))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(px(rp), PT)
      ctx.lineTo(px(rp), PB)
      ctx.stroke()
      ctx.fillStyle = COL_P0
      ctx.beginPath()
      ctx.arc(px(rp), py(head(rp, om, a)), 3.6, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = COL_TXT
      ctx.fillText('radius r [m]', PR - 74, PB + 18)
      ctx.fillText('[Pa, gauge]', PL - 2, PT - 32)
      ctx.fillText('0', PL - 12, py(0) + 4)
      ctx.fillText('a', px(a) - 3, PT - 6)
      ctx.fillStyle = COL_P
      ctx.fillText('p', PL + 8, PT - 12)
      ctx.fillStyle = COL_Q
      ctx.fillText('rho u^2 / 2', PL + 28, PT - 12)
      ctx.fillStyle = COL_P0
      ctx.fillText('p0', PL + 116, PT - 12)

      if (frame % 12 === 0) {
        const h = 1e-6
        setReadRef.current({
          u: velocity(rp, om, a),
          p: pressure(rp, om, a),
          q: 0.5 * RHO * Math.pow(velocity(rp, om, a), 2),
          p0: head(rp, om, a),
          phi: dissipation(rp, om, a),
          lhs: (head(rp + h, om, a) - head(rp - h, om, a)) / (2 * h),
          rhs: RHO * velocity(rp, om, a) * spin(rp, om, a),
        })
      }
      frame += 1
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
        <button style={btn(field === 'p')} onClick={() => setField((p) => (p === 'p0' ? 'p' : 'p0'))}>
          field: {field === 'p0' ? 'p0' : 'p'}
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            resetReq.current += 1
          }}
        >
          ↺ reset element
        </button>
        <label style={label}>
          <span style={nameS}>core a</span>
          <input type="range" min={0.2} max={0.8} step={0.05} value={coreA} onChange={(e) => setCoreA(parseFloat(e.target.value))} />
          <span style={mono}>{coreA.toFixed(2)} m</span>
        </label>
        <label style={label}>
          <span style={nameS}>OMEGA</span>
          <input type="range" min={20} max={100} step={5} value={omega} onChange={(e) => setOmega(parseFloat(e.target.value))} />
          <span style={mono}>{omega} 1/s</span>
        </label>
        <label style={label}>
          <span style={nameS}>probe r</span>
          <input type="range" min={0.05} max={1.15} step={0.05} value={probe} onChange={(e) => setProbe(parseFloat(e.target.value))} />
          <span style={mono}>{probe.toFixed(2)} m</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span>u = {read.u.toFixed(2)} m/s</span>
        <span>p = {read.p.toFixed(1)} Pa</span>
        <span>p0 = {read.p0.toFixed(1)} Pa</span>
        <span>d(p0)/dr = {read.lhs.toFixed(1)}</span>
        <span>rho u omega = {read.rhs.toFixed(1)}</span>
        <span style={{ color: read.phi > 1e-9 ? COL_Q : COL_P0 }}>phi = {read.phi.toFixed(4)} W/m^3</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag <em>probe r</em> across the dashed core edge. Inside the core the two right-hand numbers stay equal and nonzero, so p0
        climbs with r while the red element rotates without changing shape. Outside, both go to zero — p0 is perfectly flat — yet
        the purple element keeps shearing, which is where a viscous fluid would actually lose energy.
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 54 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
