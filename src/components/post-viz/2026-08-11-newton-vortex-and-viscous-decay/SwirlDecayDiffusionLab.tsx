'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Who actually kills the vortex?
//
// Marching the swirl equation
//
//   dv/dt = nu ( v_rr + v_r/r - v/r^2 )
//
// from a Lamb-Oseen initial condition, with two choices at the outer edge:
//
//   OPEN  ghost extrapolated as 1/r  -> no torque crosses r = R
//   WALL  v = 0 at r = R             -> the wall drains angular momentum
//
// With OPEN the circulation measured at r = 0.9 sits at 1.000 essentially
// forever; only the core spreads. Flip to WALL and the same vortex bleeds out
// on a timescale R^2 / (nu j11^2). Viscosity redistributes; the wall removes.
// ---------------------------------------------------------------------------

const W = 726
const H = 446

const N = 140 // radial cells on [0, R]
const R = 1
const DR = R / N
const GAMMA = 1

const DX = 24 // disk panel
const DY = 52
const DS = 300

const PX = DX + DS + 66 // profile plot
const PY = 66
const PW = 296
const PH = 268

const FIELD = 132 // vorticity raster resolution
const NTRACER = 26

export function SwirlDecayDiffusionLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [nu, setNu] = useState(2.0)
  const [core, setCore] = useState(0.08)
  const [wall, setWall] = useState(false)
  const [rate, setRate] = useState(1.0)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [read, setRead] = useState({ t: 0, rc: 0, vp: 0, circ: 1 })

  const cfg = useRef({ nu, core, wall, rate, running, resetKey })
  cfg.current = { nu, core, wall, rate, running, resetKey }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const off = document.createElement('canvas')
    off.width = FIELD
    off.height = FIELD
    const octx = off.getContext('2d')
    if (!octx) return
    const img = octx.createImageData(FIELD, FIELD)

    const r = new Float64Array(N)
    for (let j = 0; j < N; j++) r[j] = (j + 0.5) * DR

    let v = new Float64Array(N)
    let v0 = new Float64Array(N)
    const work = new Float64Array(N)
    const ang = new Float64Array(NTRACER)
    const trad = new Float64Array(NTRACER)
    let t = 0
    let frame = 0
    let lastReset = -1
    let lastCore = -1

    const seed = (rc: number) => {
      // Lamb-Oseen with the requested core radius: rc = 2.2418 sqrt(nu t0)
      const s = (rc / 2.2418) ** 2 // = nu * t0
      for (let j = 0; j < N; j++) v[j] = (GAMMA / (2 * Math.PI * r[j])) * (1 - Math.exp(-(r[j] * r[j]) / (4 * s)))
      v0 = Float64Array.from(v)
      for (let k = 0; k < NTRACER; k++) {
        trad[k] = 0.12 + 0.82 * (k / (NTRACER - 1))
        ang[k] = 0
      }
      t = 0
    }

    const step = (dt: number, nuv: number, hasWall: boolean) => {
      const gIn = -v[0]
      const gOut = hasWall ? -v[N - 1] : (v[N - 1] * r[N - 1]) / (r[N - 1] + DR)
      for (let j = 0; j < N; j++) {
        const wm = j === 0 ? gIn : v[j - 1]
        const wp = j === N - 1 ? gOut : v[j + 1]
        const vrr = (wp - 2 * v[j] + wm) / (DR * DR)
        const vr = (wp - wm) / (2 * DR)
        work[j] = v[j] + dt * nuv * (vrr + vr / r[j] - v[j] / (r[j] * r[j]))
      }
      v.set(work)
    }

    const sample = (rr: number, arr: Float64Array) => {
      const x = rr / DR - 0.5
      if (x <= 0) return arr[0] * (rr / r[0])
      if (x >= N - 1) return arr[N - 1]
      const i = Math.floor(x)
      return arr[i] + (arr[i + 1] - arr[i]) * (x - i)
    }

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      const { nu: nuSlider, core: rc, wall: hasWall, rate: sp, running: run, resetKey: rk } = cfg.current
      const nuv = nuSlider * 1e-3
      if (rk !== lastReset || rc !== lastCore) {
        lastReset = rk
        lastCore = rc
        seed(rc)
      }

      if (run) {
        const dtMax = 0.2 * DR * DR / nuv
        const want = 0.02 * sp // physical seconds advanced per frame
        const steps = Math.max(1, Math.min(600, Math.round(want / dtMax)))
        const dt = want / steps
        for (let s = 0; s < steps; s++) step(dt, nuv, hasWall)
        t += want
        // the tracers spin on their own clock: at true rate the core would
        // alias and the rim would look frozen. Only the ratio matters here.
        for (let k = 0; k < NTRACER; k++) ang[k] += (sample(trad[k], v) / trad[k]) * 0.025
      }

      ctx.fillStyle = '#080f1b'
      ctx.fillRect(0, 0, W, H)

      // ---- left: vorticity disk -----------------------------------------
      // omega = (1/r) d(rv)/dr, all of one sign, so a sequential ramp is right
      let wmax = 0
      const om = new Float64Array(N)
      for (let j = 0; j < N; j++) {
        const a = j === 0 ? 0 : r[j - 1] * v[j - 1]
        const b = j === N - 1 ? r[N - 1] * v[N - 1] : r[j + 1] * v[j + 1]
        const h = j === 0 || j === N - 1 ? DR : 2 * DR
        om[j] = (b - a) / h / r[j]
        if (om[j] > wmax) wmax = om[j]
      }
      const scale = wmax > 0 ? 1 / wmax : 1
      const d = img.data
      for (let py = 0; py < FIELD; py++)
        for (let px = 0; px < FIELD; px++) {
          const xx = (2 * (px + 0.5)) / FIELD - 1
          const yy = (2 * (py + 0.5)) / FIELD - 1
          const rr = Math.hypot(xx, yy)
          const p = 4 * (py * FIELD + px)
          if (rr > 1) {
            d[p] = 8
            d[p + 1] = 15
            d[p + 2] = 27
            d[p + 3] = 255
            continue
          }
          const q = Math.pow(Math.max(0, sample(rr, om) * scale), 0.45)
          d[p] = 11 + 244 * q
          d[p + 1] = 20 + 171 * q
          d[p + 2] = 38 + 40 * q
          d[p + 3] = 255
        }
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.save()
      ctx.beginPath()
      ctx.arc(DX + DS / 2, DY + DS / 2, DS / 2, 0, 2 * Math.PI)
      ctx.clip()
      ctx.drawImage(off, DX, DY, DS, DS)
      ctx.restore()

      // tracers: material rings, so the differential rotation stays visible
      const cx = DX + DS / 2
      const cy = DY + DS / 2
      for (let k = 0; k < NTRACER; k++) {
        const rad = (trad[k] * DS) / 2
        ctx.fillStyle = 'rgba(226,232,240,0.7)'
        ctx.beginPath()
        ctx.arc(cx + rad * Math.cos(ang[k]), cy - rad * Math.sin(ang[k]), 2, 0, 2 * Math.PI)
        ctx.fill()
      }

      ctx.strokeStyle = hasWall ? '#f87171' : 'rgba(148,163,184,0.4)'
      ctx.lineWidth = hasWall ? 3 : 1
      ctx.beginPath()
      ctx.arc(cx, cy, DS / 2, 0, 2 * Math.PI)
      ctx.stroke()

      // core radius marker
      let ip = 0
      for (let j = 1; j < N; j++) if (v[j] > v[ip]) ip = j
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(cx, cy, (r[ip] * DS) / 2, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])

      text('vorticity, one sign, brighter = stronger', DX, DY - 26, '#e2e8f0', 'bold 13px ui-monospace, monospace')
      text('blue dashed = core radius   white dots = material tracers', DX, DY - 10, '#64748b')
      text(
        hasWall ? 'outer edge: WALL, v = 0 at r = R' : 'outer edge: OPEN, 1/r extension',
        DX,
        DY + DS + 20,
        hasWall ? '#f87171' : '#34d399'
      )

      // ---- right: v(r) profile ------------------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(PX, PY, PW, PH)
      text('TANGENTIAL VELOCITY  v(r)', PX, PY - 26, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text('grey = t of release   amber = now   dashed = Gamma/2pi r', PX, PY - 10, '#64748b')

      const vtop = Math.max(0.6, sample(rc * 0.6, v0) * 1.15)
      const sx = (rr: number) => PX + PW * rr
      const sy = (vv: number) => PY + PH - PH * Math.min(1, vv / vtop)

      for (let g = 1; g < 4; g++) {
        ctx.strokeStyle = 'rgba(148,163,184,0.10)'
        ctx.beginPath()
        ctx.moveTo(PX, PY + (PH * g) / 4)
        ctx.lineTo(PX + PW, PY + (PH * g) / 4)
        ctx.stroke()
      }

      const curve = (arr: Float64Array | ((rr: number) => number), col: string, wd: number, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = wd
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let j = 0; j < N; j++) {
          const vv = typeof arr === 'function' ? arr(r[j]) : arr[j]
          const y = sy(vv)
          if (j === 0) ctx.moveTo(sx(r[j]), y)
          else ctx.lineTo(sx(r[j]), y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      curve((rr) => GAMMA / (2 * Math.PI * rr), 'rgba(148,163,184,0.5)', 1.5, [5, 4])
      curve(v0, 'rgba(148,163,184,0.75)', 1.5, [])
      curve(v, '#fbbf24', 2.5, [])

      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(sx(r[ip]), PY)
      ctx.lineTo(sx(r[ip]), PY + PH)
      ctx.stroke()
      ctx.setLineDash([])

      text('r/R  0', PX + 2, PY + PH + 14, '#64748b')
      text('1', PX + PW - 8, PY + PH + 14, '#64748b')
      text(`v  ${vtop.toFixed(1)}`, PX - 22, PY + 10, '#64748b')

      // ---- readouts -------------------------------------------------------
      const circ = (2 * Math.PI * 0.9 * sample(0.9, v)) / GAMMA
      const BY = PY + PH + 40
      text(`t = ${t.toFixed(2)} s`, PX, BY, '#94a3b8')
      text(`r_core ${r[ip].toFixed(3)}`, PX + 104, BY, '#38bdf8')
      text(`v_peak ${v[ip].toFixed(3)}`, PX + 200, BY, '#fbbf24')
      text('circulation at r = 0.9, as a fraction of the released value', PX, BY + 22, '#94a3b8')
      ctx.fillStyle = 'rgba(148,163,184,0.20)'
      ctx.fillRect(PX, BY + 30, PW, 14)
      ctx.fillStyle = circ > 0.9 ? '#34d399' : circ > 0.5 ? '#fbbf24' : '#f87171'
      ctx.fillRect(PX, BY + 30, Math.max(2, PW * Math.max(0, Math.min(1, circ))), 14)
      text(circ.toFixed(3), PX + 6, BY + 41, '#08111f', 'bold 11px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) setRead({ t, rc: r[ip], vp: v[ip], circ })
      raf = requestAnimationFrame(draw)
    }

    let raf = requestAnimationFrame(draw)
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
          <span style={name}>nu x1e-3</span>
          <input type="range" min={0.5} max={8} step={0.1} value={nu} onChange={(e) => setNu(parseFloat(e.target.value))} />
          <span style={mono}>{nu.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={name}>core at release</span>
          <input type="range" min={0.03} max={0.2} step={0.005} value={core} onChange={(e) => setCore(parseFloat(e.target.value))} />
          <span style={mono}>{core.toFixed(3)}</span>
        </label>
        <label style={label}>
          <span style={name}>time rate</span>
          <input type="range" min={0.2} max={8} step={0.1} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} />
          <span style={mono}>{rate.toFixed(1)}x</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setWall(!wall)} style={btn(wall, '#f87171')}>
          {wall ? 'outer wall ON' : 'outer wall OFF'}
        </button>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setResetKey((v) => v + 1)} style={btn(false, '#fbbf24')}>
          release again
        </button>
        <span style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
          t {read.t.toFixed(2)} &nbsp;·&nbsp; r_core {read.rc.toFixed(3)} &nbsp;·&nbsp; v_peak {read.vp.toFixed(3)}{' '}
          &nbsp;·&nbsp; circulation {read.circ.toFixed(3)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Leave the wall off and run it: the core swells, the peak drops, and the amber curve outside the core stays welded to
        the dashed 1/r line &mdash; the circulation bar never leaves 1.000. Now switch the wall on and watch the same bar
        fall. Raising nu speeds both up by the same factor, which is the point: viscosity sets the clock, the boundary
        decides whether there is anything to run down.
      </div>
    </div>
  )
}
