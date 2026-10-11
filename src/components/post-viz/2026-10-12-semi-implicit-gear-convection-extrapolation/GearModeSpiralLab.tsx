'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// One Fourier mode of convection-diffusion: dy/dt = -(d + i a) y
// convection (i a) explicit, viscosity (d) implicit
type C = [number, number]
const mul = (p: C, q: C): C => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]]
const add = (p: C, q: C): C => [p[0] + q[0], p[1] + q[1]]
const sc = (s: number, p: C): C => [s * p[0], s * p[1]]

const A = 6
const T = 2
const SCHEMES = ['euler', 'lagged', 'gear'] as const
type Scheme = (typeof SCHEMES)[number]
const COLORS: Record<Scheme, string> = { euler: '#f59e0b', lagged: '#f87171', gear: '#34d399' }
const LABELS: Record<Scheme, string> = {
  euler: 'BDF1 + N^n',
  lagged: 'BDF2 + N^n (lagged)',
  gear: 'BDF2 + 2N^n - N^(n-1) (Gear)',
}

function stepMode(s: Scheme, y: C, yp: C | null, dt: number, d: number): C {
  const ia: C = [0, -A]
  const conv = (z: C) => mul(ia, z) // -i a z
  if (s === 'euler' || yp === null) return sc(1 / (1 + dt * d), add(y, sc(dt, conv(y))))
  const ext = s === 'gear' ? add(sc(2, y), sc(-1, yp)) : y
  const rhs = add(add(sc(2, y), sc(-0.5, yp)), sc(dt, conv(ext)))
  return sc(1 / (1.5 + dt * d), rhs)
}

function exact(t: number, d: number): C {
  const r = Math.exp(-d * t)
  return [r * Math.cos(A * t), -r * Math.sin(A * t)]
}

function finalError(s: Scheme, m: number, d: number) {
  const dt = T / m
  let y: C = [1, 0]
  let yp: C | null = null
  for (let n = 0; n < m; n++) {
    const yn = stepMode(s, y, yp, dt, d)
    yp = y
    y = yn
  }
  const e = exact(T, d)
  return Math.hypot(y[0] - e[0], y[1] - e[1])
}

export function GearModeSpiralLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [steps, setSteps] = useState(48)
  const [visc, setVisc] = useState(0.6)
  const [show, setShow] = useState<Record<Scheme, boolean>>({ euler: true, lagged: true, gear: true })
  const [tick, setTick] = useState(0)
  const [readout, setReadout] = useState({ n: 0, t: 0, err: { euler: 0, lagged: 0, gear: 0 } })

  const replay = useCallback(() => setTick((v) => v + 1), [])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    const W = cv.width
    const H = cv.height
    const dt = T / steps
    const ys: Record<Scheme, C[]> = { euler: [[1, 0]], lagged: [[1, 0]], gear: [[1, 0]] }
    for (const s of SCHEMES) {
      let y: C = [1, 0]
      let yp: C | null = null
      for (let n = 0; n < steps; n++) {
        const yn = stepMode(s, y, yp, dt, visc)
        yp = y
        y = yn
        ys[s].push(y)
      }
    }
    const ms = [8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512]
    const curves: Record<Scheme, number[]> = { euler: [], lagged: [], gear: [] }
    for (const s of SCHEMES) curves[s] = ms.map((m) => finalError(s, m, visc))

    let raf = 0
    let frame = 0
    const total = 240
    const draw = () => {
      const prog = Math.min(1, frame / total)
      const nNow = Math.floor(prog * steps)
      g.fillStyle = '#0f172a'
      g.fillRect(0, 0, W, H)
      // left: complex plane
      const cx = 170
      const cy = H / 2
      const R = 125
      g.strokeStyle = 'rgba(148,163,184,0.25)'
      g.beginPath()
      g.moveTo(cx - R - 10, cy)
      g.lineTo(cx + R + 10, cy)
      g.moveTo(cx, cy - R - 10)
      g.lineTo(cx, cy + R + 10)
      g.stroke()
      g.beginPath()
      g.arc(cx, cy, R, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = '#94a3b8'
      g.font = '11px ui-monospace, monospace'
      g.fillText('Re y', cx + R - 18, cy - 6)
      g.fillText('Im y', cx + 4, cy - R + 2)
      // exact spiral
      g.strokeStyle = 'rgba(226,232,240,0.6)'
      g.setLineDash([4, 4])
      g.beginPath()
      const tNow = nNow * dt
      for (let k = 0; k <= 200; k++) {
        const e = exact((tNow * k) / 200, visc)
        const px = cx + R * e[0]
        const py = cy - R * e[1]
        if (k === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.stroke()
      g.setLineDash([])
      const eN = exact(tNow, visc)
      g.fillStyle = '#e2e8f0'
      g.beginPath()
      g.arc(cx + R * eN[0], cy - R * eN[1], 4, 0, Math.PI * 2)
      g.fill()
      for (const s of SCHEMES) {
        if (!show[s]) continue
        g.strokeStyle = COLORS[s]
        g.lineWidth = 1.6
        g.beginPath()
        for (let n = 0; n <= nNow; n++) {
          const px = cx + R * ys[s][n][0]
          const py = cy - R * ys[s][n][1]
          if (n === 0) g.moveTo(px, py)
          else g.lineTo(px, py)
        }
        g.stroke()
        g.fillStyle = COLORS[s]
        const p = ys[s][nNow]
        g.beginPath()
        g.arc(cx + R * p[0], cy - R * p[1], 4, 0, Math.PI * 2)
        g.fill()
      }
      g.lineWidth = 1
      // right: log-log error vs dt
      const x0 = 400
      const x1 = W - 20
      const y0 = 26
      const y1 = H - 40
      const lx = (dtv: number) => x0 + ((Math.log10(dtv) - Math.log10(T / 512)) / (Math.log10(T / 8) - Math.log10(T / 512))) * (x1 - x0)
      const ly = (e: number) => y0 + ((0 - Math.log10(Math.max(e, 1e-8))) / 8) * (y1 - y0)
      g.strokeStyle = 'rgba(148,163,184,0.4)'
      g.strokeRect(x0, y0, x1 - x0, y1 - y0)
      g.fillStyle = '#94a3b8'
      for (let p = 0; p >= -8; p -= 2) {
        g.fillText(`1e${p}`, x0 - 34, ly(10 ** p) + 4)
      }
      g.fillText('dt (log)', (x0 + x1) / 2 - 20, H - 14)
      g.fillText('error at t = 2 (log)', x0 + 6, y0 - 8)
      for (const s of SCHEMES) {
        if (!show[s]) continue
        g.strokeStyle = COLORS[s]
        g.beginPath()
        ms.forEach((m, i) => {
          const px = lx(T / m)
          const py = ly(curves[s][i])
          if (i === 0) g.moveTo(px, py)
          else g.lineTo(px, py)
        })
        g.stroke()
      }
      // slope guides
      g.strokeStyle = 'rgba(226,232,240,0.35)'
      g.setLineDash([3, 3])
      g.beginPath()
      g.moveTo(lx(T / 512), ly(2e-3))
      g.lineTo(lx(T / 32), ly(2e-3 * 16))
      g.moveTo(lx(T / 512), ly(2e-6))
      g.lineTo(lx(T / 32), ly(2e-6 * 256))
      g.stroke()
      g.setLineDash([])
      g.fillStyle = 'rgba(226,232,240,0.6)'
      g.fillText('slope 1', lx(T / 32) + 4, ly(2e-3 * 16))
      g.fillText('slope 2', lx(T / 32) + 4, ly(2e-6 * 256))
      const xm = lx(dt)
      g.strokeStyle = '#60a5fa'
      g.beginPath()
      g.moveTo(xm, y0)
      g.lineTo(xm, y1)
      g.stroke()
      g.fillStyle = '#60a5fa'
      g.fillText(`dt = ${dt.toFixed(4)}`, Math.min(xm + 4, x1 - 90), y1 - 6)

      if (frame % 12 === 0 || prog === 1) {
        const err = { euler: 0, lagged: 0, gear: 0 }
        for (const s of SCHEMES) err[s] = Math.hypot(ys[s][nNow][0] - eN[0], ys[s][nNow][1] - eN[1])
        setReadout({ n: nNow, t: tNow, err })
      }
      if (prog < 1) {
        frame++
        raf = requestAnimationFrame(draw)
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [steps, visc, show, tick])

  const lab: React.CSSProperties = { fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 190 }
  const btn: React.CSSProperties = { padding: '4px 10px', fontSize: 12 }
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={760} height={300} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <label style={lab}>
          steps to t=2: {steps} (dt = {(T / steps).toFixed(4)})
          <input type="range" min={8} max={256} step={4} value={steps}
            onChange={(e) => setSteps(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={lab}>
          viscous rate d = nu k^2 = {visc.toFixed(2)}
          <input type="range" min={0} max={5} step={0.05} value={visc}
            onChange={(e) => setVisc(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        {SCHEMES.map((s) => (
          <button key={s} onClick={() => setShow((v) => ({ ...v, [s]: !v[s] }))}
            style={{ ...btn, color: COLORS[s], opacity: show[s] ? 1 : 0.4 }}>
            {LABELS[s]}
          </button>
        ))}
        <button onClick={replay} style={btn}>replay</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        convection rate a = c k = {A} (explicit) | step {readout.n}/{steps} | t = {readout.t.toFixed(3)} | error:{' '}
        {SCHEMES.map((s) => (
          <span key={s} style={{ color: COLORS[s], marginRight: 10 }}>
            {s} {readout.err[s].toExponential(2)}
          </span>
        ))}
        (white dashed = exact)
      </div>
    </div>
  )
}
