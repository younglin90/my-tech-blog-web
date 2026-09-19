'use client'

import { useEffect, useRef, useState } from 'react'

const W = 720
const H = 400
const N = 48 // cells per side, periodic
const PANEL = 300
const PAD_T = 30
const X0 = 46
const X1 = 386
const HH = 1 / N

type Fields = { bx: Float64Array; by: Float64Array }

const idx = (i: number, j: number) => ((i + N) % N) * N + ((j + N) % N)

function seedFields(): Fields {
  // phi = smoothed circular blob; b = grad(phi) so curl b = 0 exactly at t = 0
  const phi = new Float64Array(N * N)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = (i + 0.5) * HH
      const y = (j + 0.5) * HH
      const r = Math.hypot(x - 0.5, y - 0.5)
      phi[idx(i, j)] = 0.5 * (1 + Math.tanh((0.22 - r) / 0.05))
    }
  }
  const bx = new Float64Array(N * N)
  const by = new Float64Array(N * N)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      bx[idx(i, j)] = (phi[idx(i + 1, j)] - phi[idx(i, j)]) / HH
      by[idx(i, j)] = (phi[idx(i, j + 1)] - phi[idx(i, j)]) / HH
    }
  }
  return { bx, by }
}

function velocity(i: number, j: number, amp: number) {
  const x = (i + 0.5) * HH
  const y = (j + 0.5) * HH
  return [amp * Math.tanh((y - 0.5) / 0.12), 0.35 * amp * Math.sin(2 * Math.PI * x)]
}

// b <- b - dt * grad_h(psi): the added term is a discrete gradient, so its curl is zero
function stepCompatible(f: Fields, dt: number, amp: number) {
  const psi = new Float64Array(N * N)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const [vx, vy] = velocity(i, j, amp)
      const bxc = vx > 0 ? f.bx[idx(i - 1, j)] : f.bx[idx(i, j)]
      const byc = vy > 0 ? f.by[idx(i, j - 1)] : f.by[idx(i, j)]
      psi[idx(i, j)] = vx * bxc + vy * byc
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      f.bx[idx(i, j)] -= (dt * (psi[idx(i + 1, j)] - psi[idx(i, j)])) / HH
      f.by[idx(i, j)] -= (dt * (psi[idx(i, j + 1)] - psi[idx(i, j)])) / HH
    }
  }
}

// component-wise Rusanov: the dissipation term is not the gradient of any scalar
function stepCollocated(f: Fields, dt: number, amp: number, lam: number) {
  const psi = new Float64Array(N * N)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const [vx, vy] = velocity(i, j, amp)
      psi[idx(i, j)] = vx * f.bx[idx(i, j)] + vy * f.by[idx(i, j)]
    }
  }
  const fx = new Float64Array(N * N)
  const fy = new Float64Array(N * N)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      fx[idx(i, j)] =
        0.5 * (psi[idx(i, j)] + psi[idx(i + 1, j)]) -
        0.5 * lam * (f.bx[idx(i + 1, j)] - f.bx[idx(i, j)])
      fy[idx(i, j)] =
        0.5 * (psi[idx(i, j)] + psi[idx(i, j + 1)]) -
        0.5 * lam * (f.by[idx(i, j + 1)] - f.by[idx(i, j)])
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      f.bx[idx(i, j)] -= (dt * (fx[idx(i, j)] - fx[idx(i - 1, j)])) / HH
      f.by[idx(i, j)] -= (dt * (fy[idx(i, j)] - fy[idx(i, j - 1)])) / HH
    }
  }
}

function curlNode(f: Fields, i: number, j: number) {
  return (
    (f.by[idx(i + 1, j)] - f.by[idx(i, j)]) / HH - (f.bx[idx(i, j + 1)] - f.bx[idx(i, j)]) / HH
  )
}

function curlCentred(f: Fields, i: number, j: number) {
  return (
    (f.by[idx(i + 1, j)] - f.by[idx(i - 1, j)] - f.bx[idx(i, j + 1)] + f.bx[idx(i, j - 1)]) /
    (2 * HH)
  )
}

// log colour ramp: round-off (10^-13) is black, O(100) is white-hot
function ramp(v: number, out: Uint8ClampedArray, o: number) {
  const t = Math.min(1, Math.max(0, (Math.log10(v + 1e-16) + 13) / 15.5))
  const stops = [
    [10, 14, 20],
    [30, 60, 130],
    [40, 170, 120],
    [225, 190, 60],
    [248, 81, 73],
    [255, 240, 235],
  ]
  const s = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)))
  const u = t * (stops.length - 1) - s
  for (let c = 0; c < 3; c++) out[o + c] = stops[s][c] + u * (stops[s + 1][c] - stops[s][c])
  out[o + 3] = 255
}

export function InvolutionDriftTwinGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stag = useRef<Fields>(seedFields())
  const coll = useRef<Fields>(seedFields())
  const time = useRef(0)
  const [playing, setPlaying] = useState(true)
  const [amp, setAmp] = useState(1.0)
  const [lam, setLam] = useState(1.0)
  const [readout, setReadout] = useState({ t: 0, cs: 0, cc: 0, bs: 0, bc: 0 })
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    stag.current = seedFields()
    coll.current = seedFields()
    time.current = 0
  }, [resetKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const off = document.createElement('canvas')
    off.width = N
    off.height = N
    const octx = off.getContext('2d')
    if (!octx) return
    const img = octx.createImageData(N, N)

    let raf = 0
    let frame = 0

    const paint = () => {
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)
      const panels: [Fields, number, string, (f: Fields, i: number, j: number) => number][] = [
        [stag.current, X0, 'staggered / compatible operators', curlNode],
        [coll.current, X1, 'collocated / Rusanov flux', curlCentred],
      ]
      let maxS = 0
      let maxC = 0
      panels.forEach(([f, px, label, curl], k) => {
        let mx = 0
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            const c = Math.abs(curl(f, i, j))
            if (c > mx) mx = c
            ramp(c, img.data, ((N - 1 - j) * N + i) * 4)
          }
        }
        if (k === 0) maxS = mx
        else maxC = mx
        octx.putImageData(img, 0, 0)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(off, px, PAD_T, PANEL, PANEL)
        ctx.strokeStyle = '#30363d'
        ctx.lineWidth = 1
        ctx.strokeRect(px + 0.5, PAD_T + 0.5, PANEL, PANEL)
        ctx.fillStyle = k === 0 ? '#3fb950' : '#f85149'
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText(label, px, PAD_T - 10)
        ctx.fillStyle = '#c9d1d9'
        ctx.fillText(`max |curl b| = ${mx.toExponential(2)}`, px, PAD_T + PANEL + 18)
      })
      // axes + colour bar
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.save()
      ctx.translate(14, PAD_T + PANEL / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('y  [0, 1]  periodic', 0, 0)
      ctx.restore()
      ctx.textAlign = 'left'
      const by0 = H - 22
      for (let p = 0; p < 300; p++) {
        const v = 10 ** (-13 + (p / 300) * 15.5)
        const px4 = new Uint8ClampedArray(4)
        ramp(v, px4, 0)
        ctx.fillStyle = `rgb(${px4[0]},${px4[1]},${px4[2]})`
        ctx.fillRect(X0 + p, by0, 1, 10)
      }
      ctx.fillStyle = '#8b949e'
      ctx.fillText('|curl b|  1e-13', X0 - 42, by0 + 9)
      ctx.fillText('1e+2', X0 + 306, by0 + 9)
      if (frame % 12 === 0) {
        let bs = 0
        let bc = 0
        for (let i = 0; i < N * N; i++) {
          bs = Math.max(bs, Math.hypot(stag.current.bx[i], stag.current.by[i]))
          bc = Math.max(bc, Math.hypot(coll.current.bx[i], coll.current.by[i]))
        }
        setReadout({ t: time.current, cs: maxS, cc: maxC, bs, bc })
      }
    }

    const loop = () => {
      const dt = (0.4 * HH) / Math.max(0.05, 1.35 * amp)
      if (playing && time.current < 3.2) {
        stepCompatible(stag.current, dt, amp)
        stepCollocated(coll.current, dt, amp, lam * 1.35 * amp)
        time.current += dt
      }
      paint()
      frame++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, amp, lam])

  const btn = (on: boolean) => ({
    padding: '3px 10px',
    fontSize: 12,
    fontFamily: 'ui-monospace, monospace',
    color: on ? '#0d1117' : '#c9d1d9',
    background: on ? '#3fb950' : '#21262d',
    border: '1px solid #30363d',
    borderRadius: 4,
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.6rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', borderRadius: 6, background: '#0d1117' }}
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
          shear amplitude {amp.toFixed(2)}
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={amp}
            onChange={(e) => setAmp(Number(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <label>
          Rusanov dissipation {lam.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={lam}
            onChange={(e) => setLam(Number(e.target.value))}
            style={{ marginLeft: 8, verticalAlign: 'middle' }}
          />
        </label>
        <button onClick={() => setPlaying(!playing)} style={btn(playing)}>
          {playing ? 'pause' : 'play'}
        </button>
        <button onClick={() => setResetKey((k) => k + 1)} style={btn(false)}>
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
        t = <b style={{ color: '#c9d1d9' }}>{readout.t.toFixed(3)}</b> &nbsp; max|curl b|:
        <b style={{ color: '#3fb950' }}> {readout.cs.toExponential(2)}</b> vs
        <b style={{ color: '#f85149' }}> {readout.cc.toExponential(2)}</b> &nbsp; max|b|:
        <b style={{ color: '#3fb950' }}> {readout.bs.toFixed(2)}</b> vs
        <b style={{ color: '#f85149' }}> {readout.bc.toFixed(2)}</b>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Both panels start from the same interface field b = grad(phi) of one blob, and both are
        pushed by the same tanh shear layer. The left panel stays black at round-off level however
        hard the shear is driven; the right panel lights up within a fraction of a turnover. Raising
        the Rusanov dissipation slider makes the right panel worse, not better — it is the
        dissipation term itself that is not the gradient of any scalar.
      </p>
    </div>
  )
}
