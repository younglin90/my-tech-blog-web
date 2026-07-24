'use client'

import { useEffect, useRef, useState } from 'react'

// 1D interface-sharpening lab (Nguyen et al. 2021, IJMF 103542).
//
// A material interface lives in the volume fraction field alpha(x) in [0,1].
// A standard transport scheme smears that jump by numerical diffusion, so the
// interface grows fatter every step. The interface-sharpening technique (IST)
// runs, as a post-processing step, the Shukla-Pantano-Freund regularization
//
//   d(alpha)/d(tau) = eps * lap(alpha)  -  div( a * alpha(1-alpha) * n_hat ),
//
// with n_hat = grad(alpha)/|grad(alpha)|. Its steady state is a tanh profile
// whose thickness scales like eps/a -- a *constant* thickness, set by the user.
// This demo lets you smear the interface (numerical diffusion) and switch the
// sharpening on: watch the thickness stop growing and lock to the target.

const N = 201
const dx = 1 / (N - 1)

function makeInterface(width: number) {
  // smeared step centered at x = 0.5, half-thickness ~ width
  const a = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = i * dx
    a[i] = 0.5 * (1 + Math.tanh((x - 0.5) / Math.max(1e-4, width)))
  }
  return a
}

// count of cells inside the interface band 0.05 < alpha < 0.95
function measureThickness(a: Float64Array) {
  let c = 0
  for (let i = 0; i < N; i++) if (a[i] > 0.05 && a[i] < 0.95) c++
  return c
}

export function InterfaceSharpeningLab1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const alphaRef = useRef<Float64Array>(makeInterface(0.012))
  const thickRef = useRef(0)

  const [compA, setCompA] = useState(1.0) // compression strength a
  const [epsR, setEpsR] = useState(0.004) // regularization eps -> target thickness
  const [smear, setSmear] = useState(true) // continuous numerical diffusion on
  const [sharpen, setSharpen] = useState(false) // IST post-processing on
  const [running, setRunning] = useState(true)

  const compRef = useRef(compA)
  const epsRef = useRef(epsR)
  const smearRef = useRef(smear)
  const sharpRef = useRef(sharpen)
  const runRef = useRef(running)
  compRef.current = compA
  epsRef.current = epsR
  smearRef.current = smear
  sharpRef.current = sharpen
  runRef.current = running

  // tanh equilibrium alpha' = (a/eps) alpha(1-alpha): half-width where alpha
  // reaches 0.95 (i.e. inside the 0.05..0.95 band) is (eps/a)*atanh(0.9).
  const targetHalf = (epsR / compA) * Math.atanh(0.9) // in x units
  const targetBand = Math.round((2 * targetHalf) / dx)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    const smearStep = (a: Float64Array) => {
      // one explicit diffusion sweep = the transport scheme fattening the jump
      const D = 0.16
      const b = a.slice()
      for (let i = 1; i < N - 1; i++) a[i] = b[i] + D * (b[i + 1] - 2 * b[i] + b[i - 1])
    }

    const sharpenStep = (a: Float64Array) => {
      // one explicit sub-iteration of the flux-form regularization equation.
      // face flux J = a*alpha_f(1-alpha_f)*sign(dAlpha) - eps*dAlpha/dx
      const eps = epsRef.current
      const acoef = compRef.current
      const dtau = 0.9 * Math.min((dx * dx) / (2 * eps + 1e-9), dx / (acoef + 1e-9))
      const J = new Float64Array(N - 1)
      for (let i = 0; i < N - 1; i++) {
        const af = 0.5 * (a[i] + a[i + 1])
        const dA = a[i + 1] - a[i]
        const s = dA > 0 ? 1 : dA < 0 ? -1 : 0
        const comp = acoef * af * (1 - af) * s // anti-diffusion (compressive)
        const diff = eps * (dA / dx) // regularizing diffusion
        J[i] = comp - diff
      }
      const b = a.slice()
      for (let i = 1; i < N - 1; i++) b[i] = a[i] - (dtau / dx) * (J[i] - J[i - 1])
      for (let i = 1; i < N - 1; i++) a[i] = Math.min(1, Math.max(0, b[i]))
    }

    const render = () => {
      const a = alphaRef.current
      if (runRef.current) {
        if (smearRef.current) smearStep(a)
        if (sharpRef.current) for (let k = 0; k < 14; k++) sharpenStep(a)
      }
      thickRef.current = measureThickness(a)

      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0b1524')
      bg.addColorStop(1, '#080f1c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const padL = 40
      const padR = 12
      const padT = 14
      const padB = 26
      const plotW = W - padL - padR
      const plotH = H - padT - padB
      const X = (i: number) => padL + (i / (N - 1)) * plotW
      const Y = (v: number) => padT + (1 - v) * plotH

      // target thickness band around the interface (x=0.5)
      const th = Math.min(0.5, targetHalf)
      ctx.fillStyle = 'rgba(251,191,36,0.10)'
      ctx.fillRect(padL + (0.5 - th) * plotW, padT, 2 * th * plotW, plotH)

      // grid baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.10)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, Y(0.5))
      ctx.lineTo(padL + plotW, Y(0.5))
      ctx.stroke()

      // filled fluid regions: fluid-1 (alpha) amber, fluid-2 (1-alpha) teal
      ctx.beginPath()
      ctx.moveTo(X(0), Y(0))
      for (let i = 0; i < N; i++) ctx.lineTo(X(i), Y(a[i]))
      ctx.lineTo(X(N - 1), Y(0))
      ctx.closePath()
      ctx.fillStyle = 'rgba(251,191,36,0.18)'
      ctx.fill()

      // alpha curve
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const px = X(i)
        const py = Y(a[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2.4
      ctx.stroke()

      // highlight the interface band (0.05..0.95) in a hot color
      ctx.fillStyle = '#38e1c8'
      for (let i = 0; i < N; i++) {
        if (a[i] > 0.05 && a[i] < 0.95) {
          ctx.beginPath()
          ctx.arc(X(i), Y(a[i]), 1.7, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      // axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'right'
      ctx.fillText('α=1', padL - 5, Y(1) + 3)
      ctx.fillText('0', padL - 5, Y(0) + 3)
      ctx.textAlign = 'center'
      ctx.fillText('x', padL + plotW / 2, H - 8)
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(251,191,36,0.85)'
      ctx.fillText('fluid 1', padL + 6, padT + 12)
      ctx.fillStyle = 'rgba(56,225,200,0.85)'
      ctx.fillText('fluid 2', padL + plotW - 44, padT + 12)

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetHalf])

  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={shell}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={240}
          style={{ width: 360, height: 240, borderRadius: 8, flexShrink: 0, maxWidth: '100%' }}
        />
        <div style={{ flex: 1, minWidth: 230, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            <input type="range" min={0.3} max={2.5} step={0.05} value={compA}
              onChange={(e) => setCompA(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <label style={lab}>
            regularization ε: {epsR.toFixed(4)}
            <input type="range" min={0.001} max={0.012} step={0.0005} value={epsR}
              onChange={(e) => setEpsR(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <div style={readout}>
            <div>measured band: <b style={{ color: '#38e1c8' }}>{thickRef.current} cells</b></div>
            <div>target ≈ ε/a: <b style={{ color: '#fbbf24' }}>{targetBand} cells</b></div>
            <div style={{ opacity: 0.7, fontSize: 11 }}>steady tanh thickness scales like ε/a</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setRunning((r) => !r)} style={btn(false, '#8aa')}>
              {running ? '⏸ pause' : '▶ play'}
            </button>
            <button
              onClick={() => { alphaRef.current = makeInterface(0.012) }}
              style={btn(false, '#8aa')}
            >
              ↺ reset
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
