'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// Pope's model spectrum (Pope 2000, eq. 6.246-6.248)
//   E(k) = C * eps^(2/3) * k^(-5/3) * f_L(k L) * f_eta(k eta)
//   f_L(x) = (x / sqrt(x^2 + c_L))^(5/3 + p_0)
//   f_eta(x) = exp(-beta * ((x^4 + c_eta^4)^(1/4) - c_eta))
const C_K = 1.5
const c_L = 6.78
const p_0 = 2
const beta = 5.2
const c_eta = 0.40

function modelSpectrum(k: number, eps: number, L: number, eta: number) {
  const kL = k * L
  const kEta = k * eta
  const fL = Math.pow(kL / Math.sqrt(kL * kL + c_L), 5 / 3 + p_0)
  const fEta = Math.exp(-beta * (Math.pow(Math.pow(kEta, 4) + Math.pow(c_eta, 4), 0.25) - c_eta))
  return C_K * Math.pow(eps, 2 / 3) * Math.pow(k, -5 / 3) * fL * fEta
}

export function KolmogorovEnergySpectrum() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logRe, setLogRe] = useState(5) // Re = 10^logRe
  const [showSlope, setShowSlope] = useState(true)

  const data = useMemo(() => {
    const Re = Math.pow(10, logRe)
    const L = 1
    const uPrime = 1
    const eps = Math.pow(uPrime, 3) / L
    const nu = (uPrime * L) / Re
    const eta = Math.pow(Math.pow(nu, 3) / eps, 0.25)
    const lambda = Math.sqrt(15) * Math.pow(Re, -0.5) * L

    const kMin = 1e-2
    const kMax = 1e6
    const N = 360
    const logK0 = Math.log10(kMin)
    const logK1 = Math.log10(kMax)
    const points: Array<{ k: number; E: number }> = []
    for (let i = 0; i < N; i++) {
      const lk = logK0 + (i / (N - 1)) * (logK1 - logK0)
      const k = Math.pow(10, lk)
      const E = modelSpectrum(k, eps, L, eta)
      points.push({ k, E })
    }
    return { Re, L, eta, lambda, eps, points, logK0, logK1 }
  }, [logRe])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const padL = 50
    const padR = 18
    const padT = 22
    const padB = 38
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const logE0 = -14
    const logE1 = 2
    const xToPx = (lk: number) =>
      padL + ((lk - data.logK0) / (data.logK1 - data.logK0)) * plotW
    const yToPx = (lE: number) =>
      padT + (1 - (lE - logE0) / (logE1 - logE0)) * plotH

    // grid
    ctx.strokeStyle = 'rgba(120,140,170,0.16)'
    ctx.lineWidth = 1
    for (let lk = -2; lk <= 6; lk++) {
      ctx.beginPath()
      ctx.moveTo(xToPx(lk), padT)
      ctx.lineTo(xToPx(lk), padT + plotH)
      ctx.stroke()
    }
    for (let lE = -14; lE <= 2; lE += 2) {
      ctx.beginPath()
      ctx.moveTo(padL, yToPx(lE))
      ctx.lineTo(padL + plotW, yToPx(lE))
      ctx.stroke()
    }

    // labels
    ctx.fillStyle = 'rgba(180,200,225,0.75)'
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    for (let lk = -2; lk <= 6; lk += 2) {
      ctx.fillText(`10^${lk}`, xToPx(lk), padT + plotH + 14)
    }
    ctx.textAlign = 'right'
    for (let lE = -14; lE <= 2; lE += 4) {
      ctx.fillText(`10^${lE}`, padL - 4, yToPx(lE) + 3)
    }
    ctx.textAlign = 'center'
    ctx.fillText('wavenumber  k', padL + plotW / 2, H - 6)
    ctx.save()
    ctx.translate(12, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('E(k)', 0, 0)
    ctx.restore()

    // -5/3 reference slope through (k=1, E suitable)
    if (showSlope) {
      ctx.strokeStyle = 'rgba(248,180,80,0.6)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.6
      const lkA = 0
      const lkB = Math.min(5, Math.log10(1 / data.eta) - 0.5)
      // anchor at k=1: E ≈ C eps^(2/3)
      const anchorLogE = Math.log10(C_K * Math.pow(data.eps, 2 / 3))
      const lE_A = anchorLogE - (5 / 3) * (lkA - 0)
      const lE_B = anchorLogE - (5 / 3) * (lkB - 0)
      ctx.beginPath()
      ctx.moveTo(xToPx(lkA), yToPx(lE_A))
      ctx.lineTo(xToPx(lkB), yToPx(lE_B))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(248,180,80,0.9)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('slope = -5/3', xToPx((lkA + lkB) / 2) + 6, yToPx((lE_A + lE_B) / 2) - 6)
    }

    // mark integral scale L (k=1/L) and Kolmogorov eta (k=1/eta)
    const kL_loc = 1 / data.L
    const kEta_loc = 1 / data.eta
    ctx.strokeStyle = 'rgba(34,211,238,0.45)'
    ctx.setLineDash([2, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xToPx(Math.log10(kL_loc)), padT)
    ctx.lineTo(xToPx(Math.log10(kL_loc)), padT + plotH)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(xToPx(Math.log10(kEta_loc)), padT)
    ctx.lineTo(xToPx(Math.log10(kEta_loc)), padT + plotH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(34,211,238,0.95)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('1/L', xToPx(Math.log10(kL_loc)), padT - 6)
    ctx.fillText('1/η', xToPx(Math.log10(kEta_loc)), padT - 6)

    // main spectrum curve
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.3
    ctx.beginPath()
    let started = false
    for (const p of data.points) {
      const lk = Math.log10(p.k)
      const E = p.E
      if (!isFinite(E) || E <= 0) {
        started = false
        continue
      }
      const lE = Math.log10(E)
      if (lE < logE0 - 1) {
        started = false
        continue
      }
      const x = xToPx(lk)
      const y = yToPx(Math.max(logE0, Math.min(logE1, lE)))
      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }, [data, showSlope])

  return (
    <div
      style={{
        margin: '1.5rem 0',
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
        Model energy spectrum E(k) on log-log axes (Pope 2000 form).
      </div>
      <canvas
        ref={canvasRef}
        width={620}
        height={360}
        style={{ width: '100%', maxWidth: 620, display: 'block' }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0.5rem',
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <label>
          Reynolds number:{' '}
          <strong>Re = 10^{logRe.toFixed(1)} ≈ {data.Re.toExponential(1)}</strong>
          <input
            type="range"
            min={3}
            max={8}
            step={0.1}
            value={logRe}
            onChange={(e) => setLogRe(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          <input
            type="checkbox"
            checked={showSlope}
            onChange={(e) => setShowSlope(e.target.checked)}
          />{' '}
          show -5/3 reference line
        </label>
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        L/η = {(data.L / data.eta).toExponential(2)} &nbsp;·&nbsp; η ={' '}
        {data.eta.toExponential(2)} &nbsp;·&nbsp; λ (Taylor) ={' '}
        {data.lambda.toExponential(2)}
      </div>
    </div>
  )
}
