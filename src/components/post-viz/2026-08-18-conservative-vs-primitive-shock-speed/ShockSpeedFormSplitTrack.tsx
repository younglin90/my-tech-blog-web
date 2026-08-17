'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One Riemann problem for the Burgers equation, marched twice on the same grid.
//
//   TOP     conservative     u_t + (u^2/2)_x = 0      Godunov flux at faces
//   BOTTOM  primitive        u_t + u u_x     = 0      upwind difference
//
// Both discretisations are consistent and stable. They agree everywhere the
// solution is smooth. The moment the initial jump becomes a shock they part:
// only the flux-differenced one puts the discontinuity at x = x0 + s t with
// s = (uL + uR)/2, the Rankine-Hugoniot speed drawn as the white dashed line.
//
// The bar under each track is the running integral of u over the domain. The
// conservative track tracks the exact flux balance; the primitive one does not.
// ---------------------------------------------------------------------------

const W = 726
const H = 430

const PX = 44 // plot left
const PW = 520 // plot width
const RX = PX + PW + 22 // readout column
const X0 = 0.25 // initial jump position
const CFL = 0.4

type Track = { u: number[]; label: string; color: string }

function godunovFlux(a: number, b: number) {
  if (a > b) return a + b >= 0 ? 0.5 * a * a : 0.5 * b * b
  if (a >= 0) return 0.5 * a * a
  return b <= 0 ? 0.5 * b * b : 0
}

function stepConservative(u: number[], dx: number, dt: number) {
  const n = u.length
  const f = new Array(n + 1)
  f[0] = 0.5 * u[0] * u[0]
  f[n] = 0.5 * u[n - 1] * u[n - 1]
  for (let i = 0; i < n - 1; i++) f[i + 1] = godunovFlux(u[i], u[i + 1])
  const out = new Array(n)
  for (let i = 0; i < n; i++) out[i] = u[i] - (dt / dx) * (f[i + 1] - f[i])
  return out
}

function stepPrimitive(u: number[], dx: number, dt: number) {
  const n = u.length
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    const im = i === 0 ? 0 : i - 1
    const ip = i === n - 1 ? n - 1 : i + 1
    const g = u[i] >= 0 ? (u[i] - u[im]) / dx : (u[ip] - u[i]) / dx
    out[i] = u[i] - dt * u[i] * g
  }
  return out
}

function locate(u: number[], dx: number, level: number) {
  for (let i = 1; i < u.length; i++) {
    if (u[i] < level && u[i - 1] >= level) {
      return (i - 0.5) * dx + (dx * (u[i - 1] - level)) / (u[i - 1] - u[i])
    }
  }
  return NaN
}

export function ShockSpeedFormSplitTrack() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [uL, setUL] = useState(1)
  const [uR, setUR] = useState(0.4)
  const [nx, setNx] = useState(120)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(0.35)
  const [readout, setReadout] = useState({ t: 0, sc: 0, sp: 0, ic: 0, ip: 0 })

  const cfg = useRef({ uL, uR, nx, running, speed })
  cfg.current = { uL, uR, nx, running, speed }
  const resetKey = `${uL}|${uR}|${nx}`
  const reset = useRef(resetKey)
  reset.current = resetKey

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let frame = 0
    let key = ''
    let tSim = 0
    let dx = 1 / cfg.current.nx
    let tracks: Track[] = []
    let i0 = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const init = () => {
      const { uL: a, uR: b, nx: n } = cfg.current
      dx = 1 / n
      const seed = new Array(n)
      for (let i = 0; i < n; i++) seed[i] = (i + 0.5) * dx < X0 ? a : b
      tracks = [
        { u: seed.slice(), label: 'conservative  (u^2/2)_x', color: '#34d399' },
        { u: seed.slice(), label: 'primitive  u u_x', color: '#f472b6' },
      ]
      i0 = seed.reduce((s, v) => s + v, 0) * dx
      tSim = 0
      key = reset.current
    }

    const advance = (dt: number) => {
      const umax = Math.max(...tracks[0].u.map(Math.abs), 1e-6)
      const dtMax = (CFL * dx) / umax
      let left = dt
      while (left > 1e-9) {
        const h = Math.min(dtMax, left)
        tracks[0].u = stepConservative(tracks[0].u, dx, h)
        tracks[1].u = stepPrimitive(tracks[1].u, dx, h)
        tSim += h
        left -= h
      }
    }

    const drawTrack = (tr: Track, top: number, height: number) => {
      const { uL: a, uR: b } = cfg.current
      const lo = Math.min(a, b) - 0.15
      const hi = Math.max(a, b) + 0.15
      const yOf = (v: number) => top + height - ((v - lo) / (hi - lo)) * height

      ctx.fillStyle = 'rgba(15,23,42,0.75)'
      ctx.fillRect(PX, top, PW, height)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(PX, top, PW, height)

      // exact Rankine-Hugoniot front
      const s = 0.5 * (a + b)
      const xe = X0 + s * tSim
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.moveTo(PX + xe * PW, top)
      ctx.lineTo(PX + xe * PW, top + height)
      ctx.stroke()
      ctx.setLineDash([])

      // profile
      ctx.beginPath()
      ctx.moveTo(PX, top + height)
      for (let i = 0; i < tr.u.length; i++) {
        const x = PX + (i + 0.5) * dx * PW
        ctx.lineTo(x, yOf(tr.u[i]))
      }
      ctx.lineTo(PX + PW, top + height)
      ctx.closePath()
      ctx.fillStyle = tr.color + '33'
      ctx.fill()
      ctx.strokeStyle = tr.color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < tr.u.length; i++) {
        const x = PX + (i + 0.5) * dx * PW
        const y = yOf(tr.u[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // measured front
      const xm = locate(tr.u, dx, 0.5 * (a + b))
      if (!Number.isNaN(xm)) {
        ctx.strokeStyle = tr.color
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(PX + xm * PW, top)
        ctx.lineTo(PX + xm * PW, top + height)
        ctx.stroke()
        ctx.setLineDash([])
        const lag = xm - xe
        ctx.fillStyle = Math.abs(lag) < 2 * dx ? 'rgba(52,211,153,0.20)' : 'rgba(248,113,113,0.20)'
        ctx.fillRect(PX + Math.min(xm, xe) * PW, top, Math.abs(lag) * PW, height)
      }

      text(tr.label, PX + 6, top + 15, tr.color, 'bold 12px ui-monospace, monospace')
      text(`u = ${a.toFixed(2)}`, PX + 6, yOf(a) - 6, '#64748b')
      text(`u = ${b.toFixed(2)}`, PX + PW - 62, yOf(b) - 6, '#64748b')
      return xm
    }

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw)
      const dtWall = last ? Math.min((ts - last) / 1000, 0.05) : 0
      last = ts
      frame++

      if (key !== reset.current) init()
      const { uL: a, uR: b, running: run, speed: sp } = cfg.current
      const sExact = 0.5 * (a + b)
      if (run) {
        advance(dtWall * sp)
        if (X0 + sExact * tSim > 0.92) init()
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      text('BURGERS RIEMANN PROBLEM — SAME GRID, TWO WRITINGS OF THE SAME PDE', PX, 20, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text('white dashes = exact shock  x = 0.25 + s t', PX, 36, '#64748b')

      const xc = drawTrack(tracks[0], 48, 150)
      const xp = drawTrack(tracks[1], 226, 150)

      // axis
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.beginPath()
      ctx.moveTo(PX, 392)
      ctx.lineTo(PX + PW, 392)
      ctx.stroke()
      for (let k = 0; k <= 4; k++) {
        const x = PX + (k / 4) * PW
        ctx.beginPath()
        ctx.moveTo(x, 392)
        ctx.lineTo(x, 397)
        ctx.stroke()
        text((k / 4).toFixed(2), x - 12, 410, '#64748b')
      }
      text('x', PX + PW + 4, 396, '#64748b')

      // readouts
      const sc = tSim > 1e-6 ? (xc - X0) / tSim : NaN
      const spd = tSim > 1e-6 ? (xp - X0) / tSim : NaN
      const ic = tracks[0].u.reduce((s, v) => s + v, 0) * dx - i0
      const ipv = tracks[1].u.reduce((s, v) => s + v, 0) * dx - i0
      const iEx = (0.5 * a * a - 0.5 * b * b) * tSim

      text('t', RX, 62, '#94a3b8')
      text(tSim.toFixed(3), RX + 30, 62, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text('s  exact', RX, 84, '#94a3b8')
      text(sExact.toFixed(3), RX + 62, 84, '#e2e8f0', 'bold 12px ui-monospace, monospace')

      text('MEASURED FRONT SPEED', RX, 116, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      const row2 = (lbl: string, v: number, y: number, col: string) => {
        text(lbl, RX, y, '#94a3b8')
        const ok = Math.abs(v - sExact) < 0.02
        text(Number.isNaN(v) ? '  --  ' : v.toFixed(3), RX + 62, y, ok ? col : '#f87171', 'bold 12px ui-monospace, monospace')
      }
      row2('consv', sc, 136, '#34d399')
      row2('prim', spd, 154, '#f472b6')

      text('NET INFLUX OF u', RX, 190, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      text('exact', RX, 210, '#94a3b8')
      text(iEx.toFixed(4), RX + 62, 210, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text('consv', RX, 228, '#94a3b8')
      text(ic.toFixed(4), RX + 62, 228, Math.abs(ic - iEx) < 1e-3 ? '#34d399' : '#f87171', 'bold 12px ui-monospace, monospace')
      text('prim', RX, 246, '#94a3b8')
      text(ipv.toFixed(4), RX + 62, 246, Math.abs(ipv - iEx) < 1e-3 ? '#34d399' : '#f87171', 'bold 12px ui-monospace, monospace')

      text(`grid  N = ${cfg.current.nx}`, RX, 288, '#64748b')
      text(`dx = ${dx.toFixed(4)}`, RX, 304, '#64748b')
      text('shaded band =', RX, 336, '#64748b')
      text('front error', RX, 352, '#64748b')

      if (frame % 12 === 0) {
        setReadout({ t: tSim, sc, sp: spd, ic, ip: ipv })
      }
    }

    init()
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }
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
          <span style={name}>u_L</span>
          <input type="range" min={0.4} max={1.5} step={0.05} value={uL} onChange={(e) => setUL(parseFloat(e.target.value))} />
          <span style={mono}>{uL.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>u_R</span>
          <input type="range" min={0} max={0.9} step={0.05} value={uR} onChange={(e) => setUR(parseFloat(e.target.value))} />
          <span style={mono}>{uR.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>grid N</span>
          <input type="range" min={40} max={320} step={20} value={nx} onChange={(e) => setNx(parseInt(e.target.value, 10))} />
          <span style={mono}>{nx}</span>
        </label>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={name}>play rate</span>
          <input type="range" min={0.1} max={1} step={0.05} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(2)}</span>
        </label>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setNx(nx === 120 ? 121 : 120)} style={btn(false, '#38bdf8')}>
          restart
        </button>
        <span style={{ ...mono, color: '#94a3b8', minWidth: 0 }}>
          t = {readout.t.toFixed(2)} · consv {Number.isNaN(readout.sc) ? '--' : readout.sc.toFixed(3)} · prim{' '}
          {Number.isNaN(readout.sp) ? '--' : readout.sp.toFixed(3)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Both tracks solve the same initial jump on the same grid. Set u<sub>R</sub> to 0.00 and the pink front stops dead while the
        green one keeps pace with the white dashed line. Push <em>grid N</em> to 320: the green error shrinks, the pink one does not
        — refinement never buys back a speed the scheme was never told to conserve.
      </div>
    </div>
  )
}
