'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
const N = 32 // lattice nodes per side, periodic
const U0 = 0.05 // initial Taylor-Green amplitude, lattice units
const MAX_STEP = 600
const K = (2 * Math.PI) / N

const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]

const idx = (i: number, x: number, y: number) => (i * N + x) * N + y

type Lattice = {
  f: Float64Array
  g: Float64Array
  ux: Float64Array
  uy: Float64Array
  amp: number[]
  step: number
}

function seedTaylorGreen(): Lattice {
  const f = new Float64Array(9 * N * N)
  const ux = new Float64Array(N * N)
  const uy = new Float64Array(N * N)
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      const u = -U0 * Math.cos(K * x) * Math.sin(K * y)
      const v = U0 * Math.sin(K * x) * Math.cos(K * y)
      ux[x * N + y] = u
      uy[x * N + y] = v
      const u2 = u * u + v * v
      for (let i = 0; i < 9; i++) {
        const cu = CX[i] * u + CY[i] * v
        f[idx(i, x, y)] = W[i] * (1 + cu / CS2 + (cu * cu) / (2 * CS2 * CS2) - u2 / (2 * CS2))
      }
    }
  }
  const amp0 = Math.sqrt(U0 * U0 / 2) // rms of the analytic field
  return { f, g: new Float64Array(9 * N * N), ux, uy, amp: [amp0], step: 0 }
}

/** One BGK collide + stream on the periodic lattice. Nothing is linearised. */
function advance(L: Lattice, tau: number) {
  const { f, g, ux, uy } = L
  let sum = 0
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      let rho = 0
      let mx = 0
      let my = 0
      for (let i = 0; i < 9; i++) {
        const fi = f[idx(i, x, y)]
        rho += fi
        mx += CX[i] * fi
        my += CY[i] * fi
      }
      const u = mx / rho
      const v = my / rho
      ux[x * N + y] = u
      uy[x * N + y] = v
      sum += u * u + v * v
      const u2 = u * u + v * v
      for (let i = 0; i < 9; i++) {
        const cu = CX[i] * u + CY[i] * v
        const feq =
          W[i] * rho * (1 + cu / CS2 + (cu * cu) / (2 * CS2 * CS2) - u2 / (2 * CS2))
        const post = f[idx(i, x, y)] - (f[idx(i, x, y)] - feq) / tau
        const xt = (x + CX[i] + N) % N
        const yt = (y + CY[i] + N) % N
        g[idx(i, xt, yt)] = post
      }
    }
  }
  f.set(g)
  L.step++
  L.amp.push(Math.sqrt(sum / (N * N)))
}

/** Least-squares slope of log(amp) over the last `win` samples -> nu. */
function fittedViscosity(amp: number[], win: number): number | null {
  const n = amp.length
  if (n < win + 20) return null
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (let j = n - win; j < n; j++) {
    const t = j
    const a = Math.log(amp[j])
    sx += t
    sy += a
    sxx += t * t
    sxy += t * a
  }
  const slope = (win * sxy - sx * sy) / (win * sxx - sx * sx)
  return -slope / (2 * K * K)
}

export function HalfStepViscosityDial() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latRef = useRef<Lattice>(seedTaylorGreen())
  const tauRef = useRef(0.6)
  const runRef = useRef(true)
  const [tau, setTau] = useState(0.6)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ step: 0, nu: 0 as number | null, ratio: 1 })

  const reset = () => {
    latRef.current = seedTaylorGreen()
    setReadout({ step: 0, nu: null, ratio: 1 })
  }

  useEffect(() => {
    tauRef.current = tau
    latRef.current = seedTaylorGreen()
  }, [tau])
  useEffect(() => {
    runRef.current = running
  }, [running])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const draw = () => {
      const L = latRef.current
      const t = tauRef.current
      const nuHalf = CS2 * (t - 0.5)
      const nuNaive = CS2 * t

      if (runRef.current && L.step < MAX_STEP) {
        advance(L, t)
        advance(L, t)
      }

      ctx.fillStyle = '#0d1420'
      ctx.fillRect(0, 0, cv.width, cv.height)

      // ---- left: vorticity of the live lattice ----
      const px = 300 / N
      let wmax = 1e-9
      const wz = new Float64Array(N * N)
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const xp = (x + 1) % N
          const xm = (x - 1 + N) % N
          const yp = (y + 1) % N
          const ym = (y - 1 + N) % N
          const w =
            (L.uy[xp * N + y] - L.uy[xm * N + y]) / 2 - (L.ux[x * N + yp] - L.ux[x * N + ym]) / 2
          wz[x * N + y] = w
          if (Math.abs(w) > wmax) wmax = Math.abs(w)
        }
      }
      const wRef = 2 * K * U0 // vorticity amplitude at t = 0, fixed colour scale
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const s = Math.max(-1, Math.min(1, wz[x * N + y] / wRef))
          const m = Math.abs(s)
          const r = s > 0 ? 40 + 200 * m : 40 + 20 * m
          const b = s < 0 ? 60 + 190 * m : 60 + 20 * m
          ctx.fillStyle = `rgb(${r | 0}, ${(46 + 60 * m) | 0}, ${b | 0})`
          ctx.fillRect(24 + x * px, 40 + (N - 1 - y) * px, px + 0.6, px + 0.6)
        }
      }
      ctx.strokeStyle = '#26313f'
      ctx.strokeRect(24, 40, 300, 300)
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('vorticity, 32x32 D2Q9 Taylor-Green (red +, blue -)', 24, 30)
      ctx.fillStyle = '#8b98a9'
      ctx.fillText(`step ${L.step}   peak |w| = ${wmax.toExponential(2)}`, 24, 356)

      // ---- right: log amplitude decay vs the two predictions ----
      const px0 = 400
      const py0 = 40
      const pw = 450
      const ph = 300
      const yTop = 0
      const yBot = -2.0 // log10(amp / amp0)
      const sx = (s: number) => px0 + (s / MAX_STEP) * pw
      const sy = (v: number) => py0 + ((yTop - v) / (yTop - yBot)) * ph

      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      for (let d = 0; d >= -2; d -= 0.5) {
        ctx.moveTo(px0, sy(d))
        ctx.lineTo(px0 + pw, sy(d))
      }
      for (let s = 0; s <= MAX_STEP; s += 150) {
        ctx.moveTo(sx(s), py0)
        ctx.lineTo(sx(s), py0 + ph)
      }
      ctx.stroke()
      ctx.strokeStyle = '#26313f'
      ctx.strokeRect(px0, py0, pw, ph)
      ctx.fillStyle = '#8b98a9'
      for (let d = 0; d >= -2; d -= 0.5) ctx.fillText(`1e${d.toFixed(1)}`, px0 - 40, sy(d) + 4)
      for (let s = 0; s <= MAX_STEP; s += 150) ctx.fillText(`${s}`, sx(s) - 10, py0 + ph + 16)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('amplitude / amplitude(0)      steps', px0, 30)

      const amp0 = L.amp[0]
      const line = (nu: number, colour: string, dash: number[]) => {
        ctx.setLineDash(dash)
        ctx.strokeStyle = colour
        ctx.lineWidth = 1.6
        ctx.beginPath()
        for (let s = 0; s <= MAX_STEP; s += 4) {
          const v = (-2 * nu * K * K * s) / Math.LN10
          if (v < yBot) break
          if (s === 0) ctx.moveTo(sx(s), sy(v))
          else ctx.lineTo(sx(s), sy(v))
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      line(nuNaive, '#fb923c', [5, 4])
      line(nuHalf, '#4ade80', [5, 4])

      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      for (let j = 0; j < L.amp.length; j++) {
        const v = Math.log10(L.amp[j] / amp0)
        if (v < yBot) break
        if (j === 0) ctx.moveTo(sx(j), sy(v))
        else ctx.lineTo(sx(j), sy(v))
      }
      ctx.stroke()
      ctx.lineWidth = 1

      const legend: [string, string][] = [
        ['measured lattice', '#38bdf8'],
        ['exp(-2 cs2 (tau-1/2) k^2 t)', '#4ade80'],
        ['exp(-2 cs2 tau k^2 t)', '#fb923c'],
      ]
      legend.forEach(([label, colour], j) => {
        ctx.fillStyle = colour
        ctx.fillRect(px0 + 12, py0 + 12 + j * 18, 18, 3)
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(label, px0 + 38, py0 + 18 + j * 18)
      })

      frame++
      if (frame % 12 === 0) {
        const nu = fittedViscosity(L.amp, 120)
        setReadout({ step: L.step, nu, ratio: nuNaive / Math.max(nuHalf, 1e-12) })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nuHalf = CS2 * (tau - 0.5)
  const nuNaive = CS2 * tau

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={380}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        <label>
          tau = {tau.toFixed(3)}{' '}
          <input
            type="range"
            min={0.51}
            max={2}
            step={0.005}
            value={tau}
            onChange={(e) => setTau(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={running} onChange={(e) => setRunning(e.target.checked)} />{' '}
          run
        </label>
        <button onClick={reset}>reset vortex</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        The blue curve is the vortex actually living on the lattice at the left. Green is{' '}
        cs2(tau-1/2) = {nuHalf.toExponential(3)}, orange is cs2*tau = {nuNaive.toExponential(3)} —{' '}
        {readout.ratio.toFixed(1)}x apart. Fitted from the blue curve: nu ={' '}
        {readout.nu === null ? 'collecting...' : readout.nu.toExponential(3)}. Push tau toward 0.51
        and the orange line stops resembling anything on screen.
      </p>
    </div>
  )
}
