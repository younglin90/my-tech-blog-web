'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Principia Book II, Section IX, in one dial.
//
// Take a circular flow v(r) = C r^-n and ask two questions about it.
//
//   shear stress    tau_rtheta = mu r d(v/r)/dr  ~ -(n+1) r^(-n-1)
//   viscous force   nu (v_rr + v_r/r - v/r^2)    ~  (n^2-1) r^(-n-2)
//
// The stress vanishes only at n = -1 (rigid rotation). The net force vanishes
// at n = -1 AND at n = +1 -- the free vortex, which is the steady state Newton
// derived for a cylinder spinning in an unbounded viscous fluid.
//
// Kepler's third law needs T ~ r^3/2, i.e. n = 1/2. At n = 1/2 neither the
// stress nor the force is zero, so Descartes' planetary vortex is not a steady
// state of any viscous fluid. Drag the slider to n = 0.5 and read the bars.
// ---------------------------------------------------------------------------

const W = 726
const H = 468

const DX = 26 // disk panel origin
const DY = 54
const DS = 300 // disk panel size
const CX = DX + DS / 2
const CY = DY + DS / 2

const PX = DX + DS + 62 // plot panel origin
const PY = 70
const PW = 300
const PH = 176

const RINGS = [0.24, 0.4, 0.56, 0.72, 0.88] // sampled radii, in units of R
const DOTS = 9 // markers per ring, laid out on one straight spoke at t = 0

const PRESETS = [
  { label: 'rigid  n=-1', n: -1 },
  { label: 'Kepler  n=0.5', n: 0.5 },
  { label: 'Newton  n=1', n: 1 },
]

export function VortexExponentKeplerDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(1)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [read, setRead] = useState({ turns: 0, stress: 0, force: 0 })

  const cfg = useRef({ n, running, resetKey })
  cfg.current = { n, running, resetKey }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0
    let frame = 0
    let lastReset = cfg.current.resetKey

    // v(r) = C r^-n, normalised so that v(r=0.56) is the same for every n.
    // Without this the disk either freezes or blurs when the slider moves.
    const speed = (r: number, e: number) => Math.pow(r / 0.56, -e)

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      const { n: e, running: run, resetKey: rk } = cfg.current
      if (rk !== lastReset) {
        lastReset = rk
        t = 0
      }
      if (run) t += 0.016

      ctx.fillStyle = '#080f1b'
      ctx.fillRect(0, 0, W, H)

      // ---- left: the spoke winding up -----------------------------------
      const R = DS / 2 - 12
      ctx.strokeStyle = 'rgba(148,163,184,0.16)'
      ctx.lineWidth = 1
      for (const rr of RINGS) {
        ctx.beginPath()
        ctx.arc(CX, CY, rr * R, 0, 2 * Math.PI)
        ctx.stroke()
      }

      // the spoke itself: same material points, advected by omega(r) = v/r
      ctx.strokeStyle = 'rgba(56,189,248,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k <= 160; k++) {
        const rr = 0.18 + (0.94 - 0.18) * (k / 160)
        const th = (speed(rr, e) / rr) * t
        const x = CX + rr * R * Math.cos(th)
        const y = CY - rr * R * Math.sin(th)
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // markers, one per ring, so the differential rotation is countable
      for (let i = 0; i < RINGS.length; i++) {
        const rr = RINGS[i]
        const om = speed(rr, e) / rr
        for (let d = 0; d < DOTS; d++) {
          const th = om * t + (2 * Math.PI * d) / DOTS
          const x = CX + rr * R * Math.cos(th)
          const y = CY - rr * R * Math.sin(th)
          ctx.fillStyle = d === 0 ? '#fbbf24' : 'rgba(226,232,240,0.55)'
          ctx.beginPath()
          ctx.arc(x, y, d === 0 ? 3.6 : 2.2, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      ctx.fillStyle = '#f87171'
      ctx.beginPath()
      ctx.arc(CX, CY, 3, 0, 2 * Math.PI)
      ctx.fill()

      text('material spoke, released straight at t = 0', DX, DY - 26, '#e2e8f0', 'bold 13px ui-monospace, monospace')
      text('amber dots = one marker per ring   rings at r/R = 0.24 ... 0.88', DX, DY - 10, '#64748b')

      // how many turns the innermost ring gained on the outermost one
      const turns =
        (Math.abs(speed(RINGS[0], e) / RINGS[0] - speed(RINGS[4], e) / RINGS[4]) * t) / (2 * Math.PI)
      text(`inner-outer lap difference   ${turns.toFixed(2)} turns`, DX, DY + DS + 20, '#38bdf8')

      // ---- right top: log-log period vs radius --------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(PX, PY, PW, PH)
      text('ORBITAL PERIOD  T(r)  (log-log)', PX, PY - 26, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text('T ~ r^(n+1);  Kepler measured 3/2', PX, PY - 10, '#64748b')

      // log10 r from -0.7 (r=0.2) to 0 (r=1); log10 T mapped to +-1.6 decades
      const lx = (lr: number) => PX + PW * ((lr + 0.7) / 0.7)
      const ly = (lt: number) => PY + PH / 2 - (PH / 2) * (lt / 1.2)

      for (let g = 0; g <= 7; g++) {
        const x = PX + (PW * g) / 7
        ctx.strokeStyle = 'rgba(148,163,184,0.10)'
        ctx.beginPath()
        ctx.moveTo(x, PY)
        ctx.lineTo(x, PY + PH)
        ctx.stroke()
      }

      const drawLaw = (ex: number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.setLineDash(dash)
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let k = 0; k <= 60; k++) {
          const lr = -0.7 + (0.7 * k) / 60
          const lt = (ex + 1) * lr // T = 2 pi r / v ~ r^(n+1), anchored at r = 1
          const y = ly(lt)
          if (k === 0) ctx.moveTo(lx(lr), y)
          else ctx.lineTo(lx(lr), y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      drawLaw(0.5, '#34d399', [5, 4]) // Kepler
      drawLaw(e, '#fbbf24', [])

      text('r/R  0.2', PX + 2, PY + PH + 14, '#64748b')
      text('1.0', PX + PW - 22, PY + PH + 14, '#64748b')
      text('Kepler  slope 3/2', PX + PW - 128, PY + 16, '#34d399')
      text(`current  slope ${(e + 1).toFixed(2)}`, PX + PW - 128, PY + 32, '#fbbf24')

      // ---- right bottom: the two viscous diagnostics --------------------
      const stress = Math.abs(-(e + 1)) // |tau| / (mu C r^(-n-1))
      const force = Math.abs(e * e - 1) // |nu lap v| / (nu C r^(-n-2))
      const BY = PY + PH + 52
      const BW = 210

      text('AT THIS EXPONENT', PX, BY - 12, '#94a3b8', 'bold 11px ui-monospace, monospace')

      const bar = (lbl: string, val: string, frac: number, y: number, zero: boolean) => {
        text(lbl, PX, y, '#94a3b8')
        ctx.fillStyle = 'rgba(148,163,184,0.20)'
        ctx.fillRect(PX, y + 6, BW, 12)
        ctx.fillStyle = zero ? '#34d399' : '#f87171'
        ctx.fillRect(PX, y + 6, Math.max(2, BW * Math.min(1, frac)), 12)
        text(val, PX + BW + 8, y + 16, zero ? '#34d399' : '#f87171', 'bold 11px ui-monospace, monospace')
      }

      bar('|shear stress|   ~ |n+1|', stress.toFixed(2), stress / 2.5, BY, stress < 0.02)
      bar('|viscous force|  ~ |n^2-1|', force.toFixed(2), force / 2.5, BY + 40, force < 0.02)

      let verdict = 'not a steady state: viscosity keeps changing this profile'
      let vcol = '#f87171'
      if (Math.abs(e - 1) < 0.02) {
        verdict = 'free vortex: stressed everywhere, yet zero net force'
        vcol = '#34d399'
      } else if (Math.abs(e + 1) < 0.02) {
        verdict = 'rigid rotation: no shear at all, the fluid turns as a solid'
        vcol = '#34d399'
      } else if (Math.abs(e - 0.5) < 0.03) {
        verdict = "Kepler's exponent -- and both diagnostics are nonzero"
        vcol = '#fbbf24'
      }
      text(verdict, PX, BY + 96, vcol)

      frame++
      if (frame % 12 === 0) setRead({ turns, stress, force })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
          <span style={name}>exponent n in v ~ r^-n</span>
          <input type="range" min={-1} max={1.5} step={0.05} value={n} onChange={(ev) => setN(parseFloat(ev.target.value))} />
          <span style={mono}>{n.toFixed(2)}</span>
        </label>
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => setN(p.n)} style={btn(Math.abs(n - p.n) < 0.03, '#38bdf8')}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={row}>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setResetKey((v) => v + 1)} style={btn(false, '#fbbf24')}>
          straighten spoke
        </button>
        <span style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
          lap difference {read.turns.toFixed(2)} &nbsp;·&nbsp; |tau| {read.stress.toFixed(2)} &nbsp;·&nbsp; |force|{' '}
          {read.force.toFixed(2)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Slide to n = -1: the spoke stays straight and both bars go green &mdash; rigid rotation. Slide to n = 1: the spoke
        winds up hard, the stress bar is red, but the force bar is green. That is the free vortex. Now stop at n = 0.5, the
        only exponent that reproduces Kepler&rsquo;s 3/2 slope on the plot &mdash; both bars are red there, so no viscous
        fluid can hold that profile without something driving it.
      </div>
    </div>
  )
}
