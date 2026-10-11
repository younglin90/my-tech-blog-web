'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Amplification factor per wavenumber for u_t + c u_x = nu u_xx on a periodic grid
// explicit Euler (all terms) vs semi-implicit Gear (BDF2, convection extrapolated)
type C = [number, number]
const NX = 64
const C_ADV = 1
const H = (2 * Math.PI) / NX

function gearRoot(a: number, d: number, dt: number) {
  // (3 + 2 dt d) G^2 + (4 i a dt - 4) G + (1 - 2 i a dt) = 0
  const A2: C = [3 + 2 * dt * d, 0]
  const B: C = [-4, 4 * a * dt]
  const Cc: C = [1, -2 * a * dt]
  const disc: C = [B[0] * B[0] - B[1] * B[1] - 4 * (A2[0] * Cc[0]), 2 * B[0] * B[1] - 4 * A2[0] * Cc[1]]
  const r = Math.sqrt(Math.hypot(disc[0], disc[1]))
  const th = Math.atan2(disc[1], disc[0]) / 2
  const sq: C = [r * Math.cos(th), r * Math.sin(th)]
  const g1 = Math.hypot(-B[0] + sq[0], -B[1] + sq[1]) / (2 * A2[0])
  const g2 = Math.hypot(-B[0] - sq[0], -B[1] - sq[1]) / (2 * A2[0])
  return Math.max(g1, g2)
}

function symbols(k: number, nu: number) {
  // central differences: convection -> i a, diffusion -> d
  const a = (C_ADV * Math.sin(k * H)) / H
  const d = (nu * 4 * Math.sin((k * H) / 2) ** 2) / (H * H)
  return { a, d }
}

function amp(k: number, nu: number, dt: number, scheme: 'explicit' | 'gear') {
  const { a, d } = symbols(k, nu)
  if (scheme === 'explicit') return Math.hypot(1 - dt * d, -dt * a)
  return gearRoot(a, d, dt)
}

export function ViscousStiffnessDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logDt, setLogDt] = useState(-2.2)
  const [nu, setNu] = useState(0.2)
  const [scheme, setScheme] = useState<'explicit' | 'gear'>('explicit')
  const [tick, setTick] = useState(0)
  const [readout, setReadout] = useState({ n: 0, umax: 1, gmax: 1, limit: 0 })
  const dt = 10 ** logDt
  const reset = useCallback(() => setTick((v) => v + 1), [])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    const W = cv.width
    const Hc = cv.height
    const ks = Array.from({ length: NX / 2 }, (_, i) => i + 1)
    const gs = ks.map((k) => amp(k, nu, dt, scheme))
    const gmax = Math.max(...gs)
    const limit = (H * H) / (2 * nu)
    // initial field: smooth bump + tiny grid-scale noise
    let u = Array.from({ length: NX }, (_, i) => Math.exp(-(((i * H - Math.PI) / 0.6) ** 2)) + 1e-3 * (i % 2 ? 1 : -1))
    let up = u.slice()
    let n = 0
    let raf = 0
    let frame = 0
    const rhsConv = (f: number[]) => f.map((_, i) => -C_ADV * (f[(i + 1) % NX] - f[(i - 1 + NX) % NX]) / (2 * H))
    const lap = (f: number[]) => f.map((v, i) => (f[(i + 1) % NX] - 2 * v + f[(i - 1 + NX) % NX]) / (H * H))
    const solveHelm = (rhs: number[], a0: number) => {
      // (a0 - dt nu D2) x = rhs, periodic: exact solve by naive DFT (NX = 64)
      const re = new Array(NX).fill(0)
      const im = new Array(NX).fill(0)
      for (let k = 0; k < NX; k++) {
        for (let j = 0; j < NX; j++) {
          re[k] += rhs[j] * Math.cos((2 * Math.PI * k * j) / NX)
          im[k] -= rhs[j] * Math.sin((2 * Math.PI * k * j) / NX)
        }
        const den = a0 + (dt * nu * 4 * Math.sin((Math.PI * k) / NX) ** 2) / (H * H)
        re[k] /= den
        im[k] /= den
      }
      return rhs.map((_, j) => {
        let v = 0
        for (let k = 0; k < NX; k++) v += re[k] * Math.cos((2 * Math.PI * k * j) / NX) - im[k] * Math.sin((2 * Math.PI * k * j) / NX)
        return v / NX
      })
    }
    const advance = () => {
      if (scheme === 'explicit') {
        const cv1 = rhsConv(u)
        const l = lap(u)
        up = u
        u = u.map((v, i) => v + dt * (cv1[i] + nu * l[i]))
      } else {
        const cn = rhsConv(u)
        if (n === 0) {
          const nu1 = solveHelm(u.map((v, i) => v + dt * cn[i]), 1)
          up = u
          u = nu1
        } else {
          const cp = rhsConv(up)
          const rhs = u.map((v, i) => 2 * v - 0.5 * up[i] + dt * (2 * cn[i] - cp[i]))
          const nu1 = solveHelm(rhs, 1.5)
          up = u
          u = nu1
        }
      }
      n++
    }
    const draw = () => {
      if (n < 400) advance()
      const umax = Math.max(...u.map(Math.abs))
      g.fillStyle = '#0f172a'
      g.fillRect(0, 0, W, Hc)
      g.font = '11px ui-monospace, monospace'
      // left: field
      const x0 = 40
      const x1 = 380
      const y0 = 30
      const y1 = Hc - 40
      const ym = (v: number) => y1 - ((Math.max(-0.5, Math.min(1.5, v)) + 0.5) / 2) * (y1 - y0)
      g.strokeStyle = 'rgba(148,163,184,0.4)'
      g.strokeRect(x0, y0, x1 - x0, y1 - y0)
      g.beginPath()
      g.moveTo(x0, ym(0))
      g.lineTo(x1, ym(0))
      g.stroke()
      const blown = !isFinite(umax) || umax > 1.5
      g.strokeStyle = blown ? '#f87171' : '#34d399'
      g.lineWidth = 1.8
      g.beginPath()
      u.forEach((v, i) => {
        const px = x0 + (i / (NX - 1)) * (x1 - x0)
        if (i === 0) g.moveTo(px, ym(v))
        else g.lineTo(px, ym(v))
      })
      g.stroke()
      g.lineWidth = 1
      g.fillStyle = '#94a3b8'
      g.fillText('u(x), periodic, 64 cells', x0, y0 - 10)
      g.fillText('x', (x0 + x1) / 2, Hc - 16)
      g.fillText('1', x0 - 14, ym(1) + 4)
      g.fillText('0', x0 - 14, ym(0) + 4)
      // right: |G(k)|
      const bx0 = 430
      const bx1 = W - 20
      const gy = (v: number) => y1 - (Math.min(v, 1.6) / 1.6) * (y1 - y0)
      g.strokeStyle = 'rgba(148,163,184,0.4)'
      g.strokeRect(bx0, y0, bx1 - bx0, y1 - y0)
      const bw = (bx1 - bx0) / ks.length
      gs.forEach((v, i) => {
        g.fillStyle = v > 1 + 1e-9 ? '#f87171' : '#34d399'
        g.fillRect(bx0 + i * bw + 1, gy(v), bw - 2, y1 - gy(v))
      })
      g.strokeStyle = '#e2e8f0'
      g.setLineDash([4, 3])
      g.beginPath()
      g.moveTo(bx0, gy(1))
      g.lineTo(bx1, gy(1))
      g.stroke()
      g.setLineDash([])
      g.fillStyle = '#94a3b8'
      g.fillText('|G(k)| per step (red > 1 grows)', bx0, y0 - 10)
      g.fillText('k = 1', bx0, Hc - 16)
      g.fillText(`k = ${NX / 2}`, bx1 - 40, Hc - 16)
      g.fillText('1.0', bx0 - 26, gy(1) + 4)
      if (frame % 12 === 0) setReadout({ n, umax, gmax, limit })
      frame++
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [dt, nu, scheme, tick])

  const lab: React.CSSProperties = { fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 190 }
  const btn: React.CSSProperties = { padding: '4px 12px', fontSize: 12 }
  const over = dt > readout.limit
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={760} height={300} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <label style={lab}>
          dt = {dt.toExponential(2)}
          <input type="range" min={-3.5} max={-0.8} step={0.02} value={logDt}
            onChange={(e) => setLogDt(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={lab}>
          nu = {nu.toFixed(2)}
          <input type="range" min={0.01} max={1} step={0.01} value={nu}
            onChange={(e) => setNu(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <button onClick={() => setScheme((s) => (s === 'explicit' ? 'gear' : 'explicit'))} style={btn}>
          scheme: {scheme === 'explicit' ? 'fully explicit (Euler)' : 'semi-implicit Gear'}
        </button>
        <button onClick={reset} style={btn}>reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        step {readout.n} | max|u| = {isFinite(readout.umax) ? readout.umax.toExponential(2) : 'inf'} |{' '}
        <span style={{ color: readout.gmax > 1 + 1e-9 ? '#f87171' : '#34d399' }}>max |G| = {readout.gmax.toFixed(4)}</span> |{' '}
        <span style={{ color: over ? '#f59e0b' : '#94a3b8' }}>
          diffusive limit h^2/(2 nu) = {readout.limit.toExponential(2)} {over ? '(dt above it)' : ''}
        </span>
      </div>
    </div>
  )
}
