'use client'

import { useEffect, useRef, useState } from 'react'

const N = 128
const DX = 1 / N
const U0 = 0.1
const C0 = 1
const RHO0 = 1
const GAMMA = 1.4
const P0 = (C0 * C0 * RHO0) / GAMMA
const CFL = 0.5
const DT = (CFL * DX) / U0
const TRANSIT = 1 / (U0 + C0)
const W = 720
const H = 300
const PAD_L = 48
const PAD_R = 14
const PAD_T = 16
const PAD_B = 30
const Y_LO = -0.65
const Y_HI = 1.65

/** periodic tridiagonal solve with constant bands (Sherman-Morrison + Thomas) */
function cyclicThomas(a: number, b: number, c: number, d: Float64Array) {
  const g = -b
  const bb = new Float64Array(N).fill(b)
  bb[0] -= g
  bb[N - 1] -= (a * c) / g
  const tri = (rhs: Float64Array) => {
    const cp = new Float64Array(N)
    const dp = new Float64Array(N)
    cp[0] = c / bb[0]
    dp[0] = rhs[0] / bb[0]
    for (let i = 1; i < N; i++) {
      const m = bb[i] - a * cp[i - 1]
      cp[i] = c / m
      dp[i] = (rhs[i] - a * dp[i - 1]) / m
    }
    const x = new Float64Array(N)
    x[N - 1] = dp[N - 1]
    for (let i = N - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
    return x
  }
  const v = new Float64Array(N)
  v[0] = g
  v[N - 1] = c
  const y = tri(d)
  const z = tri(v)
  const fac = (y[0] + (a * y[N - 1]) / g) / (1 + z[0] + (a * z[N - 1]) / g)
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) out[i] = y[i] - fac * z[i]
  return out
}

const div = (u: Float64Array) => {
  const o = new Float64Array(N)
  for (let i = 0; i < N; i++) o[i] = (u[i] - u[(i - 1 + N) % N]) / DX
  return o
}
const grad = (p: Float64Array) => {
  const o = new Float64Array(N)
  for (let j = 0; j < N; j++) o[j] = (p[(j + 1) % N] - p[j]) / DX
  return o
}
const back = (f: Float64Array) => {
  const o = new Float64Array(N)
  for (let i = 0; i < N; i++) o[i] = (f[i] - f[(i - 1 + N) % N]) / DX
  return o
}

/** one semi-implicit step: material transport explicit, acoustics with weight theta */
function siStep(u: Float64Array, p: Float64Array, theta: number) {
  const upP = back(p)
  const upU = back(u)
  const gp = grad(p)
  const ps = new Float64Array(N)
  const ue = new Float64Array(N)
  for (let i = 0; i < N; i++) ps[i] = p[i] - DT * U0 * upP[i]
  for (let j = 0; j < N; j++)
    ue[j] = u[j] - DT * U0 * upU[j] - ((DT * (1 - theta)) / RHO0) * gp[j]
  const dUe = div(ue)
  const dU = div(u)
  const k = (C0 * C0 * (theta * DT) ** 2) / (DX * DX)
  const rhs = new Float64Array(N)
  for (let i = 0; i < N; i++)
    rhs[i] = ps[i] - DT * GAMMA * P0 * (theta * dUe[i] + (1 - theta) * dU[i])
  const pn = cyclicThomas(-k, 1 + 2 * k, -k, rhs)
  const gpn = grad(pn)
  const un = new Float64Array(N)
  for (let j = 0; j < N; j++) un[j] = ue[j] - ((DT * theta) / RHO0) * gpn[j]
  return { u: un, p: pn }
}

/** Eq.(104) shock detector: flags cells compressing faster than k1 * c */
function flattener(u: Float64Array, k1: number) {
  const d = div(u)
  const chi = new Float64Array(N)
  for (let i = 0; i < N; i++)
    chi[i] = Math.min(1, Math.max(0, -(d[i] + k1 * C0) / (k1 * C0)))
  return chi
}

function exactPulse(t: number) {
  const e = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const s = (((((i + 0.5) * DX - (U0 + C0) * t) % 1) + 1) % 1)
    e[i] = s >= 0.3 && s < 0.6 ? 1 : 0
  }
  return e
}

export function ThetaOvershootPersistence() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(0.55)
  const [useFlat, setUseFlat] = useState(false)
  const [logK1, setLogK1] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [stat, setStat] = useState({ tr: 0, over: 0, under: 0, l1: 0, flagged: 0, dead: false })
  const resetRef = useRef(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const k1 = 10 ** logK1
    let p = exactPulse(0)
    let u = new Float64Array(N)
    for (let j = 0; j < N; j++) {
      const s = ((((j + 1) * DX) % 1) + 1) % 1
      u[j] = (s >= 0.3 && s < 0.6 ? 1 : 0) / (RHO0 * C0)
    }
    let t = 0
    let dead = false
    let flagged = 0
    let frame = 0
    let raf = 0

    const loop = () => {
      if (resetRef.current) {
        resetRef.current = false
        p = exactPulse(0)
        u = new Float64Array(N)
        for (let j = 0; j < N; j++) {
          const s = ((((j + 1) * DX) % 1) + 1) % 1
          u[j] = s >= 0.3 && s < 0.6 ? 1 : 0
        }
        t = 0
        dead = false
      }
      if (playing && !dead && frame % 3 === 0) {
        const hi = siStep(u, p, theta)
        if (useFlat) {
          const chi = flattener(u, k1)
          const lo = siStep(u, p, 1)
          flagged = 0
          for (let i = 0; i < N; i++) if (chi[i] > 0) flagged++
          const pn = new Float64Array(N)
          const un = new Float64Array(N)
          for (let i = 0; i < N; i++) pn[i] = chi[i] * lo.p[i] + (1 - chi[i]) * hi.p[i]
          for (let j = 0; j < N; j++) {
            const cf = Math.max(chi[j], chi[(j + 1) % N])
            un[j] = cf * lo.u[j] + (1 - cf) * hi.u[j]
          }
          p = pn
          u = un
        } else {
          p = hi.p
          u = hi.u
          flagged = 0
        }
        t += DT
        for (let i = 0; i < N; i++)
          if (!Number.isFinite(p[i]) || Math.abs(p[i]) > 25) dead = true
      }

      const x0 = PAD_L
      const x1 = W - PAD_R
      const y0 = PAD_T
      const y1 = H - PAD_B
      const tx = (x: number) => x0 + x * (x1 - x0)
      const ty = (v: number) => y1 - ((v - Y_LO) / (Y_HI - Y_LO)) * (y1 - y0)

      ctx.fillStyle = '#010409'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0)

      // bands that a monotone scheme may never leave
      ctx.fillStyle = 'rgba(248,81,73,0.10)'
      ctx.fillRect(x0, ty(Y_HI), x1 - x0, ty(1) - ty(Y_HI))
      ctx.fillRect(x0, ty(0), x1 - x0, ty(Y_LO) - ty(0))
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      for (const v of [0, 1]) {
        ctx.beginPath()
        ctx.moveTo(x0, ty(v))
        ctx.lineTo(x1, ty(v))
        ctx.stroke()
      }

      const ex = exactPulse(t)
      ctx.strokeStyle = '#8b949e'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const X = tx((i + 0.5) * DX)
        if (i === 0) ctx.moveTo(X, ty(ex[i]))
        else ctx.lineTo(X, ty(ex[i]))
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = dead ? '#f85149' : '#58a6ff'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const X = tx((i + 0.5) * DX)
        const Y = ty(Math.max(Y_LO, Math.min(Y_HI, p[i])))
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      if (useFlat) {
        const chi = flattener(u, k1)
        ctx.fillStyle = '#d29922'
        for (let i = 0; i < N; i++)
          if (chi[i] > 0) ctx.fillRect(tx((i + 0.5) * DX) - 1, y1 - 5, 2, 5)
      }

      ctx.strokeStyle = '#30363d'
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('p = 1', 8, ty(1) + 4)
      ctx.fillText('p = 0', 8, ty(0) + 4)
      ctx.fillText('x  (128 cells, periodic)', x0, H - 8)
      ctx.fillStyle = '#8b949e'
      ctx.fillText('dashed: exact pulse', x1 - 140, H - 8)
      if (dead) {
        ctx.fillStyle = '#f85149'
        ctx.font = 'bold 15px ui-monospace, monospace'
        ctx.fillText('blow-up  —  theta below 0.55 is not stable here', x0 + 16, y0 + 26)
      }

      if (frame % 12 === 0) {
        let over = -9
        let under = -9
        let l1 = 0
        for (let i = 0; i < N; i++) {
          over = Math.max(over, p[i] - 1)
          under = Math.max(under, -p[i])
          l1 += Math.abs(p[i] - ex[i])
        }
        setStat({
          tr: t / TRANSIT,
          over,
          under,
          l1: l1 / N,
          flagged,
          dead,
        })
      }
      frame++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [theta, useFlat, logK1, playing])

  const btn = (on: boolean) => ({
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: on ? '#1f6feb' : '#161b22',
    color: '#c9d1d9',
    fontSize: 12,
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0d1117', borderRadius: 10 }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', borderRadius: 6 }}
      />
      <div
        style={{
          display: 'flex',
          gap: '1.1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginTop: '0.8rem',
          fontSize: 12,
          color: '#c9d1d9',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label>
          theta {theta.toFixed(2)}
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            value={theta}
            onChange={(e) => {
              setTheta(Number(e.target.value))
              resetRef.current = true
            }}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <button
          onClick={() => {
            setUseFlat(!useFlat)
            resetRef.current = true
          }}
          style={btn(useFlat)}
        >
          flattener blend
        </button>
        <label style={{ opacity: useFlat ? 1 : 0.4 }}>
          k1 = 1e{logK1}
          <input
            type="range"
            min={-3}
            max={2}
            step={1}
            value={logK1}
            onChange={(e) => {
              setLogK1(Number(e.target.value))
              resetRef.current = true
            }}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <button onClick={() => setPlaying(!playing)} style={btn(playing)}>
          {playing ? 'pause' : 'play'}
        </button>
        <button
          onClick={() => {
            resetRef.current = true
          }}
          style={btn(false)}
        >
          reset
        </button>
      </div>
      <div
        style={{
          marginTop: '0.7rem',
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          color: '#8b949e',
        }}
      >
        transits <b style={{ color: '#c9d1d9' }}>{stat.tr.toFixed(2)}</b> &nbsp; overshoot
        <b style={{ color: stat.over > 0.02 ? '#f85149' : '#3fb950' }}>
          {' '}
          {stat.dead ? 'diverged' : stat.over.toFixed(4)}
        </b>{' '}
        &nbsp; undershoot
        <b style={{ color: '#c9d1d9' }}> {stat.dead ? '-' : stat.under.toFixed(4)}</b> &nbsp; L1
        <b style={{ color: '#c9d1d9' }}> {stat.dead ? '-' : stat.l1.toFixed(4)}</b> &nbsp; flagged
        <b style={{ color: '#d29922' }}> {stat.flagged}</b> / {N}
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        The acoustic CFL here is 5, so the implicit solve is doing all the work. Leave theta at 0.55
        and watch the overshoot readout while the pulse laps the domain: it settles near 0.18 and
        stays there — bounded, but never shrinking. Push theta to 1.00 and the wiggles vanish while
        the pulse melts. Turning on the flattener with k1 = 1e-3 lights up the yellow ticks along
        almost the whole axis, which is the scheme quietly dropping to first order everywhere.
      </p>
    </div>
  )
}
