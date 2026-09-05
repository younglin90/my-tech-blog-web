'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The three-point stencil of the non-conservative term, with one dial.
//
//   H(alpha)_j = 0.5*uI*(a_{j+1} - a_{j-1}) - 0.5*theta*|uI|*(a_{j+1} - 2a_j + a_{j-1})
//
//   theta = 0  -> central difference of  uI * d(alpha)/dx
//   theta = 1  -> the Rusanov flux difference, i.e. the paper's H_u
//
//   alpha*rho is always marched with the Rusanov flux (that part is never in
//   question).  Only alpha uses H.  Then rho = (alpha*rho)/alpha is recovered
//   and compared against the uniform value it started from.  Only theta = 1
//   keeps it flat -- that is the discrete statement of Abgrall's criterion.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const N = 90
const RHO0 = 850 // kg/m^3

const SX = 40 // stencil panel
const PX = 330 // profile panel
const PR = 740
const PT = 108
const PB = 372

const COL_OK = '#4ade80'
const COL_BAD = '#f87171'
const COL_A = '#38bdf8'
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.28)'

function alphaProfile(): number[] {
  const a = new Array<number>(N)
  for (let j = 0; j < N; j++) {
    if (j < 30) a[j] = 0.98
    else if (j < 33) a[j] = 0.98 - 0.32 * (j - 29)
    else a[j] = 0.02
  }
  return a
}

export function HuStencilWeightDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [theta, setTheta] = useState(1)
  const [dir, setDir] = useState(1)
  const [running, setRunning] = useState(true)
  const [lam, setLam] = useState(0.4)
  const [read, setRead] = useState({ step: 0, err: 0 })
  const [nudge, setNudge] = useState(0)

  const st = useRef({ theta, dir, running, lam })
  st.current = { theta, dir, running, lam }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  // stencil coefficients, shown live next to the dial
  const u = dir
  const wp = 0.5 * u - 0.5 * theta * Math.abs(u)
  const w0 = theta * Math.abs(u)
  const wm = -0.5 * u - 0.5 * theta * Math.abs(u)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let a: number[] = []
    let ar: number[] = []
    let step = 0

    const reset = () => {
      a = alphaProfile()
      ar = a.map((v) => RHO0 * v)
      step = 0
    }

    const rus = (q: number[], j: number, vel: number) => {
      const ql = q[((j % N) + N) % N]
      const qr = q[(((j + 1) % N) + N) % N]
      return 0.5 * (qr + ql) * vel - 0.5 * Math.abs(vel) * (qr - ql)
    }

    const advance = () => {
      const s = st.current
      const vel = s.dir
      const arn = new Array<number>(N)
      const an = new Array<number>(N)
      for (let j = 0; j < N; j++) {
        arn[j] = ar[j] - s.lam * (rus(ar, j, vel) - rus(ar, j - 1, vel))
        const ap = a[(j + 1) % N]
        const am = a[(j - 1 + N) % N]
        const h = 0.5 * vel * (ap - am) - 0.5 * s.theta * Math.abs(vel) * (ap - 2 * a[j] + am)
        an[j] = a[j] - s.lam * h
      }
      ar = arn
      a = an
      step++
    }

    const recovered = (j: number) => {
      const d = a[j]
      if (Math.abs(d) < 1e-6) return RHO0
      const v = ar[j] / d
      return Number.isFinite(v) ? v : RHO0
    }

    const draw = () => {
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const s = st.current
      const vel = s.dir
      const cp = 0.5 * vel - 0.5 * s.theta * Math.abs(vel)
      const c0 = s.theta * Math.abs(vel)
      const cm = -0.5 * vel - 0.5 * s.theta * Math.abs(vel)

      // ---- stencil panel -------------------------------------------------
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('stencil of  H(alpha)_j', SX, 40)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('theta = 1 is the Rusanov flux difference', SX, 58)

      const cy = 150
      const cs = [cm, c0, cp]
      const names = ['j-1', 'j', 'j+1']
      for (let i = 0; i < 3; i++) {
        const cx = SX + 40 + i * 85
        const mag = Math.min(1, Math.abs(cs[i]))
        const col = cs[i] === 0 ? 'rgba(148,163,184,0.25)' : cs[i] > 0 ? COL_OK : COL_BAD
        ctx.beginPath()
        ctx.arc(cx, cy, 16 + 16 * mag, 0, Math.PI * 2)
        ctx.fillStyle = cs[i] === 0 ? 'rgba(148,163,184,0.10)' : `${col}33`
        ctx.fill()
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '11px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(names[i], cx, cy + 52)
        ctx.fillText(cs[i].toFixed(2), cx, cy + 68)
      }
      ctx.textAlign = 'left'
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('grey = the cell drops out of the stencil', SX, cy + 100)
      ctx.fillText(cp === 0 ? 'downwind cell unused -> upwind' : 'both neighbours used -> centred', SX, cy + 118)
      ctx.fillText(`u_I = ${vel > 0 ? '+1' : '-1'}   theta = ${s.theta.toFixed(2)}`, SX, cy + 136)

      ctx.strokeStyle = COL_AX
      ctx.beginPath()
      ctx.moveTo(PX - 26, 30)
      ctx.lineTo(PX - 26, H - 30)
      ctx.stroke()

      // ---- profile panel -------------------------------------------------
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('recovered  rho = (alpha rho) / alpha', PX, 40)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('it started uniform at 850 kg/m^3 and must stay there', PX, 58)

      const mid = (PT + PB) / 2
      const half = (PB - PT) / 2 - 8
      const scale = 400 // kg/m^3 shown at the panel edge

      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(PX, PT, PR - PX, PB - PT)
      ctx.setLineDash([4, 5])
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.beginPath(); ctx.moveTo(PX, mid); ctx.lineTo(PR, mid); ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.fillText('1250', PX - 6, PT + 10)
      ctx.fillText('850', PX - 6, mid + 4)
      ctx.fillText('450', PX - 6, PB - 2)
      ctx.textAlign = 'left'

      // alpha profile as a faint shading
      for (let j = 0; j < N; j++) {
        const w = (PR - PX) / N + 0.8
        const x = PX + ((j + 0.5) / N) * (PR - PX)
        const av = Math.max(0, Math.min(1, a[j]))
        ctx.fillStyle = `rgba(56,189,248,${0.05 + 0.18 * av})`
        ctx.fillRect(x - w / 2, PT + 1, w, PB - PT - 2)
      }

      let err = 0
      ctx.beginPath()
      for (let j = 0; j < N; j++) {
        const r = recovered(j)
        err = Math.max(err, Math.abs(r - RHO0))
        const f = Math.max(-1, Math.min(1, (r - RHO0) / scale))
        const x = PX + ((j + 0.5) / N) * (PR - PX)
        const y = mid - f * half
        if (j === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = err < 1e-6 ? COL_OK : COL_BAD
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = COL_A
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('blue shading = alpha', PX + 6, PB + 18)
      ctx.textAlign = 'right'
      ctx.fillStyle = err < 1e-6 ? COL_OK : COL_BAD
      ctx.fillText(err < 1e-6 ? 'uniform preserved' : 'uniform destroyed', PR, PB + 18)
      ctx.textAlign = 'left'
      return err
    }

    reset()
    draw()

    let raf = 0
    let frame = 0
    let sub = 0
    let lastErr = 0
    const loop = () => {
      frame++
      if (st.current.running) {
        sub++
        if (sub >= 4) { advance(); sub = 0 }
      }
      lastErr = draw()
      if (frame % 12 === 0) setReadRef.current({ step, err: lastErr })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [dir, nudge])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button style={btn(false)} onClick={() => { setRunning(false); setNudge((n) => n + 1) }}>reset</button>
        <button style={btn(dir < 0)} onClick={() => setDir((d) => -d)}>u_I = {dir > 0 ? '+1' : '-1'}</button>
        <label style={label}>
          <span style={nameS}>theta</span>
          <input type="range" min={0} max={1} step={0.01} value={theta} onChange={(e) => setTheta(parseFloat(e.target.value))} />
          <span style={mono}>{theta.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>CFL</span>
          <input type="range" min={0.1} max={0.8} step={0.05} value={lam} onChange={(e) => setLam(parseFloat(e.target.value))} />
          <span style={mono}>{lam.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span>step {read.step}</span>
        <span>weights [{wm.toFixed(2)}, {w0.toFixed(2)}, {wp.toFixed(2)}]</span>
        <span style={{ color: read.err < 1e-6 ? COL_OK : COL_BAD }}>max|rho - 850| {read.err < 1e-6 ? read.err.toExponential(1) : read.err.toFixed(1)} kg/m^3</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Slide theta down from 1 and watch the downwind weight come back to life: the moment the third cell rejoins the stencil,
        the recovered density leaves 850 and never returns. Flip u_I and theta = 1 still holds, because the flux difference
        follows the sign of the interface velocity while the centred stencil does not.
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
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
