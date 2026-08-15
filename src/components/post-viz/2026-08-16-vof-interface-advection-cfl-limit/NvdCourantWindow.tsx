'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Compressive VOF schemes buy their sharp interface from the downwind cell, and
// the Convection Boundedness Criterion prices that purchase in Courant numbers:
//
//   phi~_D  <=  phi~_f  <=  min(1, phi~_D / C)
//
// At C = 0.05 the ceiling is 20*phi~_D, so the whole box above the diagonal is
// available and HYPER-C can sit at phi~_f = 1 (pure downwind, one-cell jump).
// At C = 0.8 the ceiling is 1.25*phi~_D -- a sliver above the diagonal, which is
// upwind. Same scheme, same mesh: the compression is gone because the time step
// spent it. Drag C and watch the window collapse onto the diagonal while the
// slab on the right smears out.
// ---------------------------------------------------------------------------

const W = 748
const H = 430

const NC = 80 // cells in the 1-D test
const EPSD = 1e-6

// NVD box
const BX0 = 44
const BX1 = 344
const BY0 = 46
const BY1 = 346

// profile panel
const PX0 = 400
const PX1 = 728
const PY0 = 46
const PY1 = 250
const TY0 = 288
const TY1 = 386

type Scheme = 'hc' | 'uq' | 'cicsam'

function faceTilde(td: number, c: number, scheme: Scheme, gamma: number) {
  if (td < 0 || td > 1) return td
  const hc = Math.min(1, td / Math.max(c, 1e-3))
  const uq = Math.min((8 * c * td + (1 - c) * (6 * td + 3)) / 8, hc, 1)
  if (scheme === 'hc') return hc
  if (scheme === 'uq') return uq
  return gamma * hc + (1 - gamma) * uq
}

export function NvdCourantWindow() {
  const [c, setC] = useState(0.05)
  const [scheme, setScheme] = useState<Scheme>('hc')
  const [gamma, setGamma] = useState(0.6)
  const [running, setRunning] = useState(true)
  const [thick, setThick] = useState(0)
  const [span, setSpan] = useState(0)

  const cfg = useRef({ c, scheme, gamma, running })
  cfg.current = { c, scheme, gamma, running }

  const fld = useRef<Float64Array | null>(null)
  const ref = useRef<HTMLCanvasElement>(null)

  const reset = () => {
    const f = new Float64Array(NC)
    for (let i = 0; i < NC; i++) f[i] = i >= 14 && i < 34 ? 1 : 0
    fld.current = f
  }
  if (!fld.current) reset()

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let last = 0
    let carry = 0
    const hist: number[] = []

    const text = (s: string, x: number, y: number, col: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    // one explicit sweep; returns the (phi~_D, phi~_f) samples it used
    const step = (f: Float64Array, k: Scheme, cc: number, g: number) => {
      const flux = new Float64Array(NC)
      const pts: number[] = []
      for (let i = 0; i < NC; i++) {
        const pU = f[(i - 1 + NC) % NC]
        const pD = f[i]
        const pA = f[(i + 1) % NC]
        const den = pA - pU
        let pf = pD
        if (Math.abs(den) > EPSD) {
          const td = (pD - pU) / den
          const tf = faceTilde(td, cc, k, g)
          pf = pU + tf * den
          if (td > 0.001 && td < 0.999) pts.push(td, tf)
        }
        flux[i] = cc * pf
      }
      const out = new Float64Array(NC)
      for (let i = 0; i < NC; i++) out[i] = Math.min(1, Math.max(0, f[i] - (flux[i] - flux[(i - 1 + NC) % NC])))
      return { out, pts }
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const s = cfg.current
      let f = fld.current as Float64Array

      // advance at a fixed number of *sweeps* per second so slow C is not punished
      let pts: number[] = []
      if (s.running) {
        carry += dt * 26
        let n = Math.min(6, Math.floor(carry))
        carry -= n
        while (n-- > 0) {
          const r = step(f, s.scheme, s.c, s.gamma)
          f = r.out
          pts = r.pts
        }
        fld.current = f
      }
      if (!pts.length) pts = step(f, s.scheme, s.c, s.gamma).pts

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ================== NVD diagram ==================
      const nx = (t: number) => BX0 + (BX1 - BX0) * Math.max(0, Math.min(1, t))
      const ny = (t: number) => BY1 - (BY1 - BY0) * Math.max(0, Math.min(1, t))

      ctx.fillStyle = 'rgba(148,163,184,0.05)'
      ctx.fillRect(BX0, BY0, BX1 - BX0, BY1 - BY0)

      // the CBC window: diagonal (upwind floor) up to min(1, td/C) (ceiling)
      ctx.beginPath()
      ctx.moveTo(nx(0), ny(0))
      for (let i = 0; i <= 100; i++) {
        const td = i / 100
        ctx.lineTo(nx(td), ny(Math.min(1, td / Math.max(s.c, 1e-3))))
      }
      for (let i = 100; i >= 0; i--) {
        const td = i / 100
        ctx.lineTo(nx(td), ny(td))
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(251,191,36,0.16)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(251,191,36,0.55)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // upwind diagonal
      ctx.strokeStyle = 'rgba(148,163,184,0.55)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(nx(0), ny(0))
      ctx.lineTo(nx(1), ny(1))
      ctx.stroke()
      ctx.setLineDash([])

      // the active scheme's face value curve
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const td = i / 200
        const tf = faceTilde(td, s.c, s.scheme, s.gamma)
        const x = nx(td)
        const y = ny(tf)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // live face states
      for (let i = 0; i < pts.length; i += 2) {
        ctx.fillStyle = '#f472b6'
        ctx.beginPath()
        ctx.arc(nx(pts[i]), ny(pts[i + 1]), 3.4, 0, 6.283)
        ctx.fill()
      }

      // axes
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 1
      ctx.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0)
      text('0', BX0 - 4, BY1 + 16, '#64748b')
      text('1', BX1 - 4, BY1 + 16, '#64748b')
      text('1', BX0 - 16, BY0 + 4, '#64748b')
      text('phi~_D   (donor, normalised)', BX0, BY1 + 32, '#94a3b8')
      ctx.save()
      ctx.translate(BX0 - 26, BY1)
      ctx.rotate(-Math.PI / 2)
      text('phi~_f   (face value)', 0, 0, '#94a3b8')
      ctx.restore()
      text('CBC window', BX0 + 8, BY0 + 18, '#fbbf24')
      text('ceiling = min(1, phi~_D / C)', BX0 + 8, BY0 + 34, 'rgba(251,191,36,0.85)')
      text('upwind (diagonal)', BX1 - 116, BY1 - 10, '#94a3b8')
      text('face states, this sweep', BX0 + 8, BY1 - 12, '#f472b6')

      // ================== 1-D slab ==================
      const sx = (i: number) => PX0 + ((PX1 - PX0) * i) / NC
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.beginPath()
      ctx.moveTo(PX0, PY1)
      ctx.lineTo(PX1, PY1)
      ctx.stroke()

      let nDiff = 0
      let lo = NC
      let hi = -1
      for (let i = 0; i < NC; i++) {
        const v = f[i]
        if (v > 0.02 && v < 0.98) nDiff++
        if (v > 0.5) {
          lo = Math.min(lo, i)
          hi = Math.max(hi, i)
        }
        const h = (PY1 - PY0) * v
        ctx.fillStyle = v > 0.98 ? 'rgba(56,189,248,0.85)' : v < 0.02 ? 'rgba(148,163,184,0.18)' : 'rgba(244,114,182,0.75)'
        ctx.fillRect(sx(i) + 0.5, PY1 - h, (PX1 - PX0) / NC - 1, Math.max(h, 1.5))
      }
      text('colour function on 80 cells', PX0, PY0 - 12, '#94a3b8')
      text('sharp  |  transition  |  empty', PX0, PY1 + 18, '#64748b')

      // ================== thickness history ==================
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.beginPath()
      ctx.moveTo(PX0, TY1)
      ctx.lineTo(PX1, TY1)
      ctx.stroke()
      hist.push(nDiff)
      if (hist.length > 240) hist.shift()
      const hmax = Math.max(6, ...hist)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k < hist.length; k++) {
        const x = PX0 + ((PX1 - PX0) * k) / 240
        const y = TY1 - ((TY1 - TY0) * hist[k]) / hmax
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      text('transition cells, last 240 frames', PX0, TY0 - 12, '#94a3b8')
      text(`${hmax}`, PX0 - 18, TY0 + 6, '#64748b')
      text('0', PX0 - 12, TY1 + 4, '#64748b')

      // readouts
      text(
        `transition cells = ${nDiff}`,
        BX0,
        H - 12,
        nDiff <= 3 ? '#34d399' : nDiff <= 6 ? '#fbbf24' : '#fb7185',
        'bold 12px ui-monospace, monospace',
      )
      text(`ceiling at phi~_D = 0.5  ->  ${Math.min(1, 0.5 / Math.max(s.c, 1e-3)).toFixed(2)}`, BX0 + 190, H - 12, '#a78bfa', 'bold 12px ui-monospace, monospace')

      if (++frame % 12 === 0) {
        setThick(nDiff)
        setSpan(hi >= lo ? hi - lo + 1 : 0)
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }
  const btn = (on: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: on ? '#fbbf24' : 'transparent',
    color: on ? '#08111f' : '#cbd5e1',
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
          <span style={name}>Courant C</span>
          <input type="range" min={0.02} max={0.95} step={0.01} value={c} onChange={(e) => setC(parseFloat(e.target.value))} />
          <span style={mono}>{c.toFixed(2)}</span>
        </label>
        <button style={btn(scheme === 'hc')} onClick={() => setScheme('hc')}>HYPER-C</button>
        <button style={btn(scheme === 'uq')} onClick={() => setScheme('uq')}>ULTIMATE-QUICKEST</button>
        <button style={btn(scheme === 'cicsam')} onClick={() => setScheme('cicsam')}>CICSAM blend</button>
      </div>

      <div style={row}>
        <label style={{ ...label, opacity: scheme === 'cicsam' ? 1 : 0.35 }}>
          <span style={name}>blend gamma_f</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={gamma}
            disabled={scheme !== 'cicsam'}
            onChange={(e) => setGamma(parseFloat(e.target.value))}
          />
          <span style={mono}>{gamma.toFixed(2)}</span>
        </label>
        <button style={btn(!running)} onClick={() => setRunning(!running)}>{running ? 'freeze' : 'advect'}</button>
        <button
          style={btn(false)}
          onClick={() => {
            const f = new Float64Array(NC)
            for (let i = 0; i < NC; i++) f[i] = i >= 14 && i < 34 ? 1 : 0
            fld.current = f
          }}
        >
          reset slab
        </button>
        <span style={{ ...label, color: '#94a3b8' }}>
          <span style={name}>transition cells</span>
          <span style={mono}>{thick}</span>
          <span style={name}>slab width</span>
          <span style={mono}>{span}</span>
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Start at C = 0.05: the amber window fills almost the whole box, the blue HYPER-C curve pins itself to phi~_f = 1, and the
        slab keeps a two-cell edge forever. Drag C toward 0.9 and the ceiling min(1, phi~_D/C) folds down onto the dashed upwind
        diagonal &mdash; the window is a sliver, the pink face states have nowhere to sit, and the slab bleeds out over a dozen cells.
      </div>
    </div>
  )
}
