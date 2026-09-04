'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Free flight of the trailing sphere, drawn in the frame of the leading one.
//
// Three force models act on the pair, all reduced to force coefficients:
//   repulsion  the shared bow shock presses on the inboard faces; strong while
//              the gap is small, killed once the trailing body is in the wake
//   shielding  a body inside the wake loses most of its drag and drops back
//   surfing    a body straddling the leading shock gets a sustained outward
//              push; this is the term the "surf gain" slider controls
//
// Non-dimensionalised with tau_s = sqrt(rho_s/rho_inf) R/u_inf and
// v_s = u_inf sqrt(rho_inf/rho_s), the relative equation of motion is just
// dV'/dt' = (3/8) * (C_trail - C_lead), and dx'/dt' = V'.
//
// Numbers here are a toy, not the paper's CFD; the shapes of the curves are
// the point.  The Mach angle is drawn at 18 deg instead of the true 2.9 deg
// so the shock is visible at all.
// ---------------------------------------------------------------------------

const W = 760
const H = 452

const STANDOFF = 0.14 // bow-shock standoff, in sphere radii
const NOSE_K = 1.2
const TAN_MU = Math.tan((18 * Math.PI) / 180)
const A_REP = 0.21
const L_REP = 1.0
const W_SURF = 1.0
const CD0 = 0.92
const MASS_FAC = 0.375 // 3/8
const T_END = 8

const OX = 172 // leading sphere on screen
const OY = 214
const S = 27 // px per radius

const PX0 = 470 // V_T history chart
const PX1 = 742
const PY0 = 60
const PY1 = 236
const VT_MAX = 0.45

const QX0 = 470 // polar separation map
const QX1 = 742
const QY0 = 286
const QY1 = 420

const COL_BG = '#0b1220'
const COL_TXT = '#94a3b8'
const COL_SHOCK = '#f472b6'
const COL_VT = '#fbbf24'
const COL_NOSURF = '#38bdf8'
const COL_CONTACT = '#f87171'

function shockX(y: number) {
  return -(1 + STANDOFF) + Math.sqrt(NOSE_K * NOSE_K + (y / TAN_MU) * (y / TAN_MU)) - NOSE_K
}

type Snap = { t: number; x: number; y: number; vt: number; contact: boolean; surf: number }

function flyTrailing(theta0: number, gain: number, dt: number, tEnd: number): Snap[] {
  const t0 = (theta0 * Math.PI) / 180
  let x = -2 * Math.cos(t0)
  let y = -2 * Math.sin(t0)
  let vx = 0
  let vy = 0
  let t = 0
  const out: Snap[] = []
  while (t <= tEnd + 1e-9) {
    const d = Math.hypot(x, y) || 1e-9
    const ux = x / d
    const uy = y / d
    const sh = x > 0 ? Math.exp(-((y / 1.2) * (y / 1.2))) : 0
    const rep = A_REP * Math.exp(-Math.max(0, d - 2) / L_REP) * (1 - 0.9 * sh)
    const cd = CD0 * (1 - 0.85 * sh)
    const s = x - shockX(y)
    const surf = x > 0.5 ? gain * Math.exp(-((s / W_SURF) * (s / W_SURF))) : 0
    const sg = Math.abs(y) < 1e-9 ? 0 : Math.sign(y)
    vx += MASS_FAC * (2 * rep * ux + (cd - CD0)) * dt
    vy += MASS_FAC * (2 * rep * uy + surf * sg) * dt
    x += vx * dt
    y += vy * dt
    let contact = false
    const dd = Math.hypot(x, y) || 1e-9
    if (dd < 2) {
      // the spheres cannot interpenetrate: keep the tangential slide, drop the
      // inward normal velocity.  This is the "rolling" phase of the paper.
      const nx = x / dd
      const ny = y / dd
      x = 2 * nx
      y = 2 * ny
      const vr = vx * nx + vy * ny
      if (vr < 0) {
        vx -= vr * nx
        vy -= vr * ny
      }
      contact = true
    }
    out.push({ t, x, y, vt: Math.abs(vy) / 2, contact, surf })
    t += dt
  }
  return out
}

export function ShockSurfRideTracker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [theta0, setTheta0] = useState(150)
  const [gain, setGain] = useState(0.25)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [read, setRead] = useState({ t: 0, vt: 0, vt0: 0, d: 2, th: 150, contact: false })

  const st = useRef({ theta0, gain, running, speed })
  st.current = { theta0, gain, running, speed }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let idx = 0
    let key = ''
    let path: Snap[] = []
    let bare: Snap[] = []
    const DT = 0.004

    const ensure = () => {
      const s = st.current
      const k = `${s.theta0}|${s.gain.toFixed(2)}`
      if (k === key) return
      key = k
      path = flyTrailing(s.theta0, s.gain, DT, T_END)
      bare = flyTrailing(s.theta0, 0, DT, T_END)
      idx = 0
    }

    const draw = () => {
      ctx.fillStyle = COL_BG
      ctx.fillRect(0, 0, W, H)
      const cur = path[Math.min(idx, path.length - 1)]

      // ---- scene -----------------------------------------------------------
      ctx.strokeStyle = 'rgba(56,189,248,0.22)'
      ctx.lineWidth = 1
      for (let k = -4; k <= 4; k++) {
        const yy = OY + k * 30
        ctx.beginPath()
        ctx.moveTo(8, yy)
        ctx.lineTo(52, yy)
        ctx.stroke()
      }
      ctx.fillStyle = '#38bdf8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('M = 20', 8, OY - 14)

      // bow shock of the leading sphere
      ctx.strokeStyle = COL_SHOCK
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 120; i++) {
        const yw = -7 + (14 * i) / 120
        const xw = shockX(yw)
        const sx = OX + xw * S
        const sy = OY - yw * S
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.stroke()
      ctx.fillStyle = COL_SHOCK
      ctx.fillText('bow shock', OX + 78, OY - 128)

      // wake of the leading sphere
      ctx.fillStyle = 'rgba(148,163,184,0.10)'
      ctx.fillRect(OX, OY - 1.2 * S, 440 - OX, 2.4 * S)
      ctx.fillStyle = 'rgba(148,163,184,0.5)'
      ctx.fillText('wake — drag drops here', OX + 26, OY + 1.2 * S + 14)

      // leading sphere
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(OX, OY, S, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.fillStyle = 'rgba(203,213,225,0.12)'
      ctx.fill()
      ctx.fillStyle = COL_TXT
      ctx.fillText('leading', OX - 20, OY + 4)

      // trail of the trailing sphere
      ctx.strokeStyle = 'rgba(251,191,36,0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i <= idx; i += 6) {
        const p = path[i]
        const sx = OX + p.x * S
        const sy = OY - p.y * S
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.stroke()

      // the same release without any surfing force, for contrast
      ctx.strokeStyle = 'rgba(56,189,248,0.40)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      for (let i = 0; i <= idx; i += 6) {
        const p = bare[i]
        const sx = OX + p.x * S
        const sy = OY - p.y * S
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.stroke()
      ctx.setLineDash([])

      const tx = OX + cur.x * S
      const ty = OY - cur.y * S
      const hot = Math.max(0, Math.min(1, cur.surf / 0.6))
      ctx.strokeStyle = cur.contact ? COL_CONTACT : `rgb(${Math.round(148 + 100 * hot)},${Math.round(163 + 20 * hot)},${Math.round(184 - 140 * hot)})`
      ctx.lineWidth = cur.contact ? 3 : 2 + 3 * hot
      ctx.beginPath()
      ctx.arc(tx, ty, S, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.fillStyle = 'rgba(251,191,36,0.10)'
      ctx.fill()
      if (cur.surf > 0.02) {
        const dir = Math.sign(cur.y) || 1
        ctx.strokeStyle = COL_VT
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(tx, ty - dir * (18 + 60 * hot))
        ctx.stroke()
      }

      // ---- V'_T history ----------------------------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0)
      const vx = (t: number) => PX0 + (t / T_END) * (PX1 - PX0)
      const vy2 = (v: number) => PY1 - (v / VT_MAX) * (PY1 - PY0)
      const line = (arr: Snap[], col: string, dash: boolean) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.setLineDash(dash ? [4, 3] : [])
        ctx.beginPath()
        for (let i = 0; i <= idx; i += 4) {
          const p = arr[i]
          if (i === 0) ctx.moveTo(vx(p.t), vy2(p.vt))
          else ctx.lineTo(vx(p.t), vy2(p.vt))
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      line(bare, COL_NOSURF, true)
      line(path, COL_VT, false)
      ctx.fillStyle = COL_TXT
      ctx.fillText("V'_T  (lateral speed / v_s)", PX0, PY0 - 20)
      ctx.fillStyle = COL_VT
      ctx.fillText('with surfing', PX0 + 6, PY0 - 6)
      ctx.fillStyle = COL_NOSURF
      ctx.fillText('gain = 0', PX0 + 96, PY0 - 6)
      ctx.fillStyle = COL_TXT
      ctx.fillText("t' = 0", PX0, PY1 + 14)
      ctx.fillText("8", PX1 - 8, PY1 + 14)
      ctx.fillText('0.45', PX0 - 34, PY0 + 4)

      // ---- polar separation map -------------------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(QX0, QY0, QX1 - QX0, QY1 - QY0)
      const qx = (deg: number) => QX0 + ((deg - 90) / 90) * (QX1 - QX0)
      const qy = (gap: number) => QY1 - (Math.min(gap, 5) / 5) * (QY1 - QY0)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(QX0, qy(0))
      ctx.lineTo(QX1, qy(0))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = COL_VT
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= idx; i += 4) {
        const p = path[i]
        const d = Math.hypot(p.x, p.y)
        const deg = (Math.atan2(-p.y, -p.x) * 180) / Math.PI
        const dd = Math.abs(deg)
        if (i === 0) ctx.moveTo(qx(Math.min(180, Math.max(90, dd))), qy(d - 2))
        else ctx.lineTo(qx(Math.min(180, Math.max(90, dd))), qy(d - 2))
      }
      ctx.stroke()
      ctx.fillStyle = COL_TXT
      ctx.fillText('edge-to-edge gap / r  vs  alignment angle', QX0, QY0 - 8)
      ctx.fillText('90°', QX0, QY1 + 14)
      ctx.fillText('180°', QX1 - 24, QY1 + 14)
      ctx.fillStyle = COL_CONTACT
      ctx.fillText('gap = 0 : still touching', QX0 + 6, qy(0) - 6)
    }

    const step = () => {
      ensure()
      const s = st.current
      if (s.running) {
        idx += Math.round(6 * s.speed)
        if (idx >= path.length - 1) idx = 0
      }
      draw()
      if (frame % 10 === 0) {
        const p = path[Math.min(idx, path.length - 1)]
        const b = bare[Math.min(idx, bare.length - 1)]
        const d = Math.hypot(p.x, p.y)
        setReadRef.current({
          t: p.t,
          vt: p.vt,
          vt0: b.vt,
          d,
          th: Math.abs((Math.atan2(-p.y, -p.x) * 180) / Math.PI),
          contact: p.contact,
        })
      }
      frame++
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
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
        <button style={btn(gain === 0)} onClick={() => setGain(0)}>
          surfing off
        </button>
        <button style={btn(false)} onClick={() => { setTheta0(150); setGain(0.35) }}>
          surf case 150°
        </button>
        <button style={btn(false)} onClick={() => { setTheta0(180); setGain(0.35) }}>
          tandem 180°
        </button>
      </div>
      <div style={rowS}>
        <label style={label}>
          <span style={nameS}>release angle</span>
          <input type="range" min={90} max={180} step={1} value={theta0} onChange={(e) => setTheta0(parseInt(e.target.value, 10))} />
          <span style={mono}>{theta0}&deg;</span>
        </label>
        <label style={label}>
          <span style={nameS}>surf gain</span>
          <input type="range" min={0} max={0.6} step={0.01} value={gain} onChange={(e) => setGain(parseFloat(e.target.value))} />
          <span style={mono}>{gain.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={0.3} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(1)}x</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span>t&apos; {read.t.toFixed(2)}</span>
        <span style={{ color: COL_VT }}>V&apos;_T {read.vt.toFixed(3)}</span>
        <span style={{ color: COL_NOSURF }}>no surf {read.vt0.toFixed(3)}</span>
        <span>gap {(read.d - 2).toFixed(2)} r</span>
        <span>theta {read.th.toFixed(0)}&deg;</span>
        <span style={{ color: read.contact ? COL_CONTACT : '#4ade80' }}>{read.contact ? 'touching' : 'free'}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag the release angle from 90&deg; upward. Near 90&deg; the two curves sit on top of each other &mdash; the shared bow
        shock does all the work and surfing has nothing to add. Past about 135&deg; the amber curve lifts off the dashed one, and
        the sphere outline glows exactly while it is straddling the pink shock line. At 180&deg; nothing separates at all.
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
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 44 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(251,191,36,0.16)' : 'transparent',
    color: active ? '#fbbf24' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
