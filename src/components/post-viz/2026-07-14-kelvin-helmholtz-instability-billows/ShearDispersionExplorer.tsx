'use client'

import { useEffect, useRef, useState } from 'react'

// Growth-rate curve for a vortex sheet between two streams. For a perturbation
// exp(i k x - i omega t) on the interface between an upper fluid (rho_u, moving
// at +dU/2) and a lower fluid (rho_l, at -dU/2), inviscid theory gives
//
//   sigma(k) = k * sqrt( A - B/k - C k ),   with
//   A = rho_u rho_l dU^2 / (rho_u+rho_l)^2   (destabilizing shear)
//   B = g (rho_l - rho_u) / (rho_u+rho_l)     (gravity: kills long waves)
//   C = T / (rho_u+rho_l)                     (surface tension: kills short waves)
//
// sigma is the real growth rate; where the radicand is negative the mode is
// neutral (no growth). Drag the sliders to watch the unstable band open, shift,
// and slam shut.

function growthRate(k: number, dU: number, rhoU: number, rhoL: number, g: number, T: number) {
  const A = (rhoU * rhoL * dU * dU) / Math.pow(rhoU + rhoL, 2)
  const B = (g * (rhoL - rhoU)) / (rhoU + rhoL)
  const C = T / (rhoU + rhoL)
  const disc = A - B / k - C * k
  return disc > 0 ? k * Math.sqrt(disc) : 0
}

export function ShearDispersionExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dU, setDU] = useState(8)
  const [logRatio, setLogRatio] = useState(-2) // log10(rho_u/rho_l); -2 = air/water
  const [g, setG] = useState(9.81)
  const [T, setT] = useState(0.072)

  const rhoL = 1000
  const rhoU = rhoL * Math.pow(10, logRatio)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const padL = 46
    const padB = 30
    const padT = 14
    const kMin = 1
    const kMax = 800
    const NK = 400

    // sample sigma(k)
    const ks: number[] = []
    const sig: number[] = []
    let sMax = 0
    let kPeak = 0
    for (let i = 0; i < NK; i++) {
      const k = kMin + (kMax - kMin) * (i / (NK - 1))
      const s = growthRate(k, dU, rhoU, rhoL, g, T)
      ks.push(k)
      sig.push(s)
      if (s > sMax) { sMax = s; kPeak = k }
    }
    const yTop = sMax > 0 ? sMax * 1.15 : 1

    ctx.fillStyle = '#111722'
    ctx.fillRect(0, 0, W, H)

    const px = (k: number) => padL + (k - kMin) / (kMax - kMin) * (W - padL - 10)
    const py = (s: number) => H - padB - (s / yTop) * (H - padB - padT)

    // axes
    ctx.strokeStyle = '#33415a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, padT)
    ctx.lineTo(padL, H - padB)
    ctx.lineTo(W - 10, H - padB)
    ctx.stroke()
    ctx.fillStyle = '#8a97b8'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('wavenumber k  (1/m)', W / 2 - 44, H - 8)
    ctx.save()
    ctx.translate(12, H / 2 + 40)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('growth rate σ  (1/s)', 0, 0)
    ctx.restore()

    // unstable band shading
    ctx.fillStyle = 'rgba(255, 138, 76, 0.14)'
    for (let i = 0; i < NK - 1; i++) {
      if (sig[i] > 0) {
        ctx.fillRect(px(ks[i]), padT, Math.max(1, px(ks[i + 1]) - px(ks[i])), H - padB - padT)
      }
    }

    // curve
    ctx.strokeStyle = '#ff9a52'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    let started = false
    for (let i = 0; i < NK; i++) {
      const X = px(ks[i])
      const Y = py(sig[i])
      if (!started) { ctx.moveTo(X, Y); started = true } else ctx.lineTo(X, Y)
    }
    ctx.stroke()

    // peak marker
    if (sMax > 0) {
      ctx.strokeStyle = '#5ad1c9'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(px(kPeak), padT)
      ctx.lineTo(px(kPeak), H - padB)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [dU, logRatio, g, T, rhoU])

  const sMaxNow = (() => {
    let m = 0; let kp = 0
    for (let i = 0; i < 400; i++) {
      const k = 1 + 799 * (i / 399)
      const s = growthRate(k, dU, rhoU, rhoL, g, T)
      if (s > m) { m = s; kp = k }
    }
    return { m, kp }
  })()
  const lambda = sMaxNow.kp > 0 ? (2 * Math.PI / sMaxNow.kp) * 100 : 0

  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'system-ui, sans-serif' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 10, display: 'block' }}
      />
      <div style={{ marginTop: 8, fontSize: 13, color: sMaxNow.m > 0 ? '#ffb27a' : '#6fd08c' }}>
        {sMaxNow.m > 0
          ? `UNSTABLE — fastest growth at λ* ≈ ${lambda.toFixed(2)} cm (σ ≈ ${sMaxNow.m.toFixed(2)} /s)`
          : 'STABLE — every wavelength is damped; no waves grow.'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.6rem', fontSize: 13, color: '#c9d3e0' }}>
        <label style={lab}>
          Shear ΔU: {dU.toFixed(1)} m/s
          <input type="range" min={0} max={16} step={0.2} value={dU} onChange={(e) => setDU(+e.target.value)} />
        </label>
        <label style={lab}>
          ρ_upper/ρ_lower: {Math.pow(10, logRatio).toExponential(1)}
          <input type="range" min={-3} max={0} step={0.1} value={logRatio} onChange={(e) => setLogRatio(+e.target.value)} />
        </label>
        <label style={lab}>
          Gravity g: {g.toFixed(1)}
          <input type="range" min={0} max={15} step={0.5} value={g} onChange={(e) => setG(+e.target.value)} />
        </label>
        <label style={lab}>
          Surface tension T: {T.toFixed(3)}
          <input type="range" min={0} max={0.15} step={0.005} value={T} onChange={(e) => setT(+e.target.value)} />
        </label>
      </div>
    </div>
  )
}

const lab: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}
