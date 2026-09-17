'use client'

import { useEffect, useRef, useState } from 'react'

const N = 192
const DX = 1
const DT = 0.2
const HALF = 48
const SUBSTEPS = 6
const DRIFT = 0.03
const HIST = 260

function slabProfile(width: number): Float64Array {
  const phi = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const d = i - N / 2
    phi[i] = 0.5 * (1 + Math.tanh((2 * (HALF - Math.abs(d))) / width))
  }
  return phi
}

/** one explicit step of  dphi/dt + u dphi/dx = d/dx [ M ( dphi/dx - 4phi(1-phi)/W * n ) ] */
function advance(phi: Float64Array, M: number, W: number, sharp: boolean, drift: number) {
  const flux = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const ip = (i + 1) % N
    const g = (phi[ip] - phi[i]) / DX
    const pf = 0.5 * (phi[i] + phi[ip])
    const anti = sharp ? ((4 * pf * (1 - pf)) / W) * Math.sign(g) : 0
    flux[i] = M * (g - anti)
  }
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    const adv = (drift * (phi[i] - phi[im])) / DX
    out[i] = phi[i] - DT * adv + (DT * (flux[i] - flux[im])) / DX
  }
  return out
}

function measuredWidth(phi: Float64Array): number {
  let gmax = 0
  for (let i = 0; i < N; i++) {
    const g = Math.abs((phi[(i + 1) % N] - phi[(i - 1 + N) % N]) / (2 * DX))
    if (g > gmax) gmax = g
  }
  return gmax > 1e-9 ? 1 / gmax : 99
}

function mass(phi: Float64Array): number {
  let s = 0
  for (let i = 0; i < N; i++) s += phi[i]
  return s * DX
}

export function AntiDiffusionWidthLock() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mobility, setMobility] = useState(0.08)
  const [target, setTarget] = useState(4)
  const [sharp, setSharp] = useState(true)
  const [readW, setReadW] = useState(8)
  const [drift, setDrift] = useState(0)

  const mRef = useRef(mobility)
  const wRef = useRef(target)
  const sRef = useRef(sharp)
  const phiRef = useRef<Float64Array>(slabProfile(8))
  const histRef = useRef<number[]>([])
  const m0Ref = useRef(mass(phiRef.current))
  const smearRef = useRef(false)
  const resetRef = useRef(false)
  mRef.current = mobility
  wRef.current = target
  sRef.current = sharp

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const X0 = 46
    const X1 = 564
    const Y0 = 28
    const Y1 = 176
    const T0 = 214
    const T1 = 286
    const px = (i: number) => X0 + (i / (N - 1)) * (X1 - X0)
    const py = (v: number) => Y1 - v * (Y1 - Y0)
    const ty = (w: number) => T1 - (Math.min(w, 24) / 24) * (T1 - T0)

    let raf = 0
    let frame = 0

    const draw = () => {
      if (resetRef.current) {
        resetRef.current = false
        phiRef.current = slabProfile(8)
        histRef.current = []
        m0Ref.current = mass(phiRef.current)
      }
      if (smearRef.current) {
        smearRef.current = false
        for (let k = 0; k < 500; k++) {
          phiRef.current = advance(phiRef.current, 0.15, wRef.current, false, 0)
        }
      }
      for (let k = 0; k < SUBSTEPS; k++) {
        phiRef.current = advance(phiRef.current, mRef.current, wRef.current, sRef.current, DRIFT)
      }
      const phi = phiRef.current
      const w = measuredWidth(phi)
      histRef.current.push(w)
      if (histRef.current.length > HIST) histRef.current.shift()

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, cv.width, cv.height)

      // ---- phi(x) panel ----
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(X0, Y0)
      ctx.lineTo(X0, Y1)
      ctx.lineTo(X1, Y1)
      ctx.stroke()
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(X0, py(0.5))
      ctx.lineTo(X1, py(0.5))
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'right'
      ctx.fillText('1.0', X0 - 6, py(1) + 4)
      ctx.fillText('0.5', X0 - 6, py(0.5) + 4)
      ctx.fillText('0.0', X0 - 6, py(0) + 4)
      ctx.textAlign = 'left'
      ctx.fillText('phase field  phi(x)', X0 + 4, Y0 - 10)
      ctx.textAlign = 'right'
      ctx.fillText('x  (lattice nodes)', X1, Y1 + 16)

      // reference tanh of the target width, centred on the live left interface
      let edge = 0
      for (let i = 1; i < N / 2; i++) {
        if (phi[i - 1] < 0.5 && phi[i] >= 0.5) edge = i - 1 + (0.5 - phi[i - 1]) / (phi[i] - phi[i - 1])
      }
      ctx.strokeStyle = '#7ee787'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const v = 0.5 * (1 + Math.tanh((2 * (i - edge)) / wRef.current))
        const yy = py(Math.min(v, 1))
        if (i === 0) ctx.moveTo(px(i), yy)
        else ctx.lineTo(px(i), yy)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = sRef.current ? '#58a6ff' : '#f85149'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const yy = py(phi[i])
        if (i === 0) ctx.moveTo(px(i), yy)
        else ctx.lineTo(px(i), yy)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // ---- width history strip ----
      ctx.strokeStyle = '#30363d'
      ctx.beginPath()
      ctx.moveTo(X0, T0)
      ctx.lineTo(X0, T1)
      ctx.lineTo(X1, T1)
      ctx.stroke()
      ctx.fillStyle = '#8b949e'
      ctx.textAlign = 'left'
      ctx.fillText('measured width  1 / max|grad phi|   (history ->)', X0 + 4, T0 - 8)
      ctx.textAlign = 'right'
      ctx.fillText('24', X0 - 6, ty(24) + 4)
      ctx.fillText('0', X0 - 6, T1 + 4)

      ctx.strokeStyle = '#7ee787'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(X0, ty(wRef.current))
      ctx.lineTo(X1, ty(wRef.current))
      ctx.stroke()
      ctx.setLineDash([])

      const hist = histRef.current
      ctx.strokeStyle = '#d29922'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k < hist.length; k++) {
        const xx = X0 + (k / (HIST - 1)) * (X1 - X0)
        const yy = ty(hist[k])
        if (k === 0) ctx.moveTo(xx, yy)
        else ctx.lineTo(xx, yy)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      frame += 1
      if (frame % 10 === 0) {
        setReadW(w)
        setDrift(((mass(phi) - m0Ref.current) / m0Ref.current) * 100)
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean) => ({
    padding: '0.35rem 0.9rem',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: active ? '#238636' : '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={580}
        height={300}
        style={{ width: '100%', borderRadius: 8, background: '#0d1117', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200 }}>
          <span>
            mobility M : <b style={{ color: '#58a6ff' }}>{mobility.toFixed(2)}</b>
          </span>
          <input
            type="range"
            min={0.02}
            max={0.3}
            step={0.01}
            value={mobility}
            onChange={(e) => setMobility(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200 }}>
          <span>
            target width W : <b style={{ color: '#7ee787' }}>{target.toFixed(1)}</b>
          </span>
          <input
            type="range"
            min={2}
            max={9}
            step={0.5}
            value={target}
            onChange={(e) => setTarget(parseFloat(e.target.value))}
          />
        </label>
        <button onClick={() => setSharp((v) => !v)} style={btn(sharp)}>
          {sharp ? 'anti-diffusion ON' : 'anti-diffusion OFF'}
        </button>
        <button
          onClick={() => {
            smearRef.current = true
          }}
          style={btn(false)}
        >
          smear interface
        </button>
        <button
          onClick={() => {
            resetRef.current = true
          }}
          style={btn(false)}
        >
          reset
        </button>
        <span style={{ color: '#d29922' }}>
          W = <b>{readW.toFixed(2)}</b>
        </span>
        <span style={{ color: '#8b949e' }}>
          mass drift = <b>{drift.toFixed(4)}%</b>
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Press <i>smear interface</i> and watch the orange width trace. With anti-diffusion ON the
        profile is pulled back onto the dashed tanh of width W whatever the mobility M is; with it
        OFF the same M only decides how fast the interface keeps swelling. The mass readout stays at
        zero either way, because both terms are written as a divergence of a flux.
      </p>
    </div>
  )
}
