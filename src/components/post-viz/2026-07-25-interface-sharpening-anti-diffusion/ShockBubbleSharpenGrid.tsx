'use client'

import { useEffect, useRef, useState } from 'react'

// 2D bubble interface under numerical diffusion vs interface sharpening.
//
// The paper's shock-bubble tests keep a *round* interface only a few cells
// thick throughout the run. Here a circular volume-fraction blob is smeared
// by numerical diffusion (a 5-point Laplacian, standing in for the transport
// scheme), while the IST regularization
//
//   d(alpha)/d(tau) = eps * lap(alpha) - div( a * alpha(1-alpha) * n_hat )
//
// with n_hat = grad(alpha)/|grad(alpha)| pushes the interface back to a thin,
// crisp ring. Toggle each effect and drag the compression up: watch the blurry
// halo snap back to a sharp circle without moving the interface location.

const NX = 96
const NY = 72
const R0 = 20

function makeBubble() {
  const a = new Float64Array(NX * NY)
  const cx = NX / 2
  const cy = NY / 2
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const r = Math.hypot(i - cx, j - cy)
      a[j * NX + i] = 0.5 * (1 - Math.tanh((r - R0) / 1.4))
    }
  }
  return a
}

function bandCount(a: Float64Array) {
  let c = 0
  for (let k = 0; k < a.length; k++) if (a[k] > 0.1 && a[k] < 0.9) c++
  return c
}

export function ShockBubbleSharpenGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const fieldRef = useRef<Float64Array>(makeBubble())
  const bandRef = useRef(0)

  const [compA, setCompA] = useState(1.2)
  const [smear, setSmear] = useState(true)
  const [sharpen, setSharpen] = useState(false)
  const [running, setRunning] = useState(true)

  const compRef = useRef(compA)
  const smearRef = useRef(smear)
  const sharpRef = useRef(sharpen)
  const runRef = useRef(running)
  compRef.current = compA
  smearRef.current = smear
  sharpRef.current = sharpen
  runRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cell = 5
    const W = NX * cell
    const H = NY * cell
    const idx = (i: number, j: number) => j * NX + i

    const smearStep = (a: Float64Array) => {
      const D = 0.14
      const b = a.slice()
      for (let j = 1; j < NY - 1; j++)
        for (let i = 1; i < NX - 1; i++) {
          const k = idx(i, j)
          const lap =
            b[idx(i + 1, j)] + b[idx(i - 1, j)] + b[idx(i, j + 1)] + b[idx(i, j - 1)] - 4 * b[k]
          a[k] = b[k] + D * lap
        }
    }

    const sharpenStep = (a: Float64Array) => {
      const eps = 0.6
      const acoef = compRef.current
      const dtau = 0.12
      const b = a.slice()
      for (let j = 1; j < NY - 1; j++)
        for (let i = 1; i < NX - 1; i++) {
          const k = idx(i, j)
          // compression vector C = a*alpha(1-alpha)*n_hat, evaluated at the
          // neighbours so we can take a central divergence of it.
          const cxp = comp(b[idx(i + 1, j)], acoef) * nAt(b, i + 1, j, 'x')
          const cxm = comp(b[idx(i - 1, j)], acoef) * nAt(b, i - 1, j, 'x')
          const cyp = comp(b[idx(i, j + 1)], acoef) * nAt(b, i, j + 1, 'y')
          const cym = comp(b[idx(i, j - 1)], acoef) * nAt(b, i, j - 1, 'y')
          const divC = 0.5 * (cxp - cxm) + 0.5 * (cyp - cym)
          const lap =
            b[idx(i + 1, j)] + b[idx(i - 1, j)] + b[idx(i, j + 1)] + b[idx(i, j - 1)] - 4 * b[k]
          const v = b[k] + dtau * (eps * lap - divC)
          a[k] = Math.min(1, Math.max(0, v))
        }
    }

    function comp(alpha: number, acoef: number) {
      return acoef * alpha * (1 - alpha)
    }
    function nAt(b: Float64Array, i: number, j: number, dir: 'x' | 'y') {
      if (i < 1 || i > NX - 2 || j < 1 || j > NY - 2) return 0
      const gx = 0.5 * (b[idx(i + 1, j)] - b[idx(i - 1, j)])
      const gy = 0.5 * (b[idx(i, j + 1)] - b[idx(i, j - 1)])
      const gmag = Math.hypot(gx, gy) + 1e-6
      return dir === 'x' ? gx / gmag : gy / gmag
    }

    const render = () => {
      const a = fieldRef.current
      if (runRef.current) {
        if (smearRef.current) smearStep(a)
        if (sharpRef.current) for (let s = 0; s < 3; s++) sharpenStep(a)
      }
      bandRef.current = bandCount(a)

      const img = ctx.createImageData(W, H)
      for (let j = 0; j < NY; j++)
        for (let i = 0; i < NX; i++) {
          const v = a[idx(i, j)]
          const band = v > 0.1 && v < 0.9
          // fluid1 amber, fluid2 deep blue, interface band bright teal
          let r: number, g: number, bl: number
          if (band) {
            r = 56; g = 225; bl = 200
          } else {
            r = Math.round(11 + v * (251 - 11))
            g = Math.round(21 + v * (191 - 21))
            bl = Math.round(36 + v * (36 - 36))
          }
          for (let dy = 0; dy < cell; dy++)
            for (let dx = 0; dx < cell; dx++) {
              const px = (j * cell + dy) * W + (i * cell + dx)
              const o = px * 4
              img.data[o] = r
              img.data[o + 1] = g
              img.data[o + 2] = bl
              img.data[o + 3] = 255
            }
        }
      ctx.putImageData(img, 0, 0)

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={shell}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <canvas
          ref={canvasRef}
          width={NX * 5}
          height={NY * 5}
          style={{ width: NX * 5, height: NY * 5, borderRadius: 8, flexShrink: 0, maxWidth: '100%', imageRendering: 'pixelated' }}
        />
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setSmear((s) => !s)} style={btn(smear, '#38e1c8')}>
              {smear ? '● numerical diffusion' : '○ numerical diffusion'}
            </button>
            <button onClick={() => setSharpen((s) => !s)} style={btn(sharpen, '#fbbf24')}>
              {sharpen ? '● sharpening (IST)' : '○ sharpening (IST)'}
            </button>
          </div>
          <label style={lab}>
            compression a: {compA.toFixed(2)}
            <input type="range" min={0.4} max={2.6} step={0.05} value={compA}
              onChange={(e) => setCompA(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <div style={readout}>
            <div>interface band: <b style={{ color: '#38e1c8' }}>{bandRef.current} cells</b></div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>
              teal ring = cells with 0.1 &lt; α &lt; 0.9. Fewer = sharper.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setRunning((r) => !r)} style={btn(false, '#8aa')}>
              {running ? '⏸ pause' : '▶ play'}
            </button>
            <button onClick={() => { fieldRef.current = makeBubble() }} style={btn(false, '#8aa')}>
              ↺ reset bubble
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const shell: React.CSSProperties = {
  border: '1px solid #1e2a3d',
  borderRadius: 12,
  padding: 16,
  background: '#0a1220',
  margin: '1.5rem 0',
  color: '#dbe4f0',
  fontFamily: 'system-ui, sans-serif',
}
const lab: React.CSSProperties = { fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }
const readout: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.7,
  background: '#0f1a2c',
  borderRadius: 6,
  padding: '8px 10px',
}
function btn(active: boolean, accent: string): React.CSSProperties {
  return {
    padding: '7px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? accent : '#26344a'}`,
    background: active ? 'rgba(251,191,36,0.08)' : '#101a2b',
    color: active ? accent : '#9fb0c6',
    cursor: 'pointer',
    fontSize: 12,
  }
}
