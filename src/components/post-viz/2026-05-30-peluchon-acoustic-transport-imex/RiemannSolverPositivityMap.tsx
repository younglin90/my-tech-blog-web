'use client'

import { useEffect, useRef, useState } from 'react'

export function RiemannSolverPositivityMap() {
  const [aMinus, setAMinus] = useState(1.6)
  const [aPlus, setAPlus] = useState(1.6)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, W, H)

    const padL = 60
    const padR = 24
    const padT = 26
    const padB = 56
    const x0 = padL
    const y0 = H - padB
    const xW = W - padL - padR
    const yH = H - padT - padB

    // Left/right states fixed: rho_L=1, p_L=1; rho_R=0.125, p_R=0.1 (Sod-like)
    const rhoL = 1
    const rhoR = 0.125
    const pL = 1
    const pR = 0.1
    const cL = Math.sqrt(1.4 * pL / rhoL)
    const cR = Math.sqrt(1.4 * pR / rhoR)
    const uL = 0
    const uR = 0

    // Sweep Δu in x-axis, Δp in y-axis. Map of intermediate-state positivity.
    const nx = 80
    const ny = 80
    const du0 = -2
    const du1 = 2
    const dp0 = -1.5
    const dp1 = 1.5
    const aM = aMinus * Math.max(rhoL * cL, rhoR * cR)
    const aP = aPlus * Math.max(rhoL * cL, rhoR * cR)

    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        const du = du0 + (du1 - du0) * (ix / (nx - 1))
        const dp = dp0 + (dp1 - dp0) * (iy / (ny - 1))
        // Intermediate states (Galpha solver):
        // phi_- = (Δp - aP Δu) / (aM(aM+aP) ish)
        const phiM = (dp - aP * du) / (aM * aP + aM * aM)
        const phiP = (dp + aM * du) / (aM * aP + aP * aP)
        // rho_l*, rho_r* via specific volume (theta = 1/rho)
        // L*-state: theta_l* = theta_l + phi_- → rho_l* = 1/(1/rhoL + phi_-)
        const thetaLStar = 1 / rhoL + phiM
        const thetaRStar = 1 / rhoR + phiP
        // Pressure intermediate states (approx via stiffened-gas-free linearization):
        // p_l* = pL - aM*aP*phi_-, p_r* = pR - aM*aP*phi_+
        const pLStar = pL - aM * aP * phiM
        const pRStar = pR - aM * aP * phiP

        const positive = thetaLStar > 0 && thetaRStar > 0 && pLStar > 0 && pRStar > 0

        const px = x0 + (ix / (nx - 1)) * xW
        const py = y0 - (iy / (ny - 1)) * yH
        const cellW = xW / nx + 1
        const cellH = yH / ny + 1
        ctx.fillStyle = positive ? 'rgba(34, 211, 238, 0.45)' : 'rgba(220, 38, 38, 0.55)'
        ctx.fillRect(px, py - cellH, cellW, cellH)
      }
    }

    // Axes
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + xW, y0)
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0, y0 - yH)
    ctx.stroke()

    // Ticks
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '11px Geist, sans-serif'
    ctx.textAlign = 'center'
    for (let k = 0; k <= 4; k++) {
      const du = du0 + (du1 - du0) * (k / 4)
      const px = x0 + (k / 4) * xW
      ctx.fillText(du.toFixed(1), px, y0 + 14)
    }
    ctx.textAlign = 'right'
    for (let k = 0; k <= 4; k++) {
      const dp = dp0 + (dp1 - dp0) * (k / 4)
      const py = y0 - (k / 4) * yH
      ctx.fillText(dp.toFixed(1), x0 - 6, py + 4)
    }

    ctx.textAlign = 'center'
    ctx.fillText('Δu = u_R − u_L', x0 + xW / 2, H - 18)
    ctx.save()
    ctx.translate(14, y0 - yH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Δp = p_R − p_L', 0, 0)
    ctx.restore()

    // Title
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px Geist, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Positivity region (cyan = ρ*, p* > 0)', padL, padT - 8)
  }, [aMinus, aPlus])

  return (
    <div
      style={{
        border: '1px solid var(--border, #334155)',
        borderRadius: 12,
        padding: '14px',
        background: 'var(--surface, #0f1a2c)',
        margin: '1.6rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={560}
        height={360}
        style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block', borderRadius: 8 }}
      />
      <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 130 }}>slope ā₋ / (ρc)_max</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={aMinus}
            onChange={(e) => setAMinus(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 40, textAlign: 'right' }}>{aMinus.toFixed(2)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 130 }}>slope ā₊ / (ρc)_max</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={aPlus}
            onChange={(e) => setAPlus(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 40, textAlign: 'right' }}>{aPlus.toFixed(2)}</span>
        </label>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
          Sod-like reference: ρ_L=1, p_L=1, ρ_R=0.125, p_R=0.1. Increase ā₋, ā₊ until the entire (Δu, Δp) square turns cyan
          — that&apos;s Peluchon&apos;s positivity-preserving slope choice.
        </p>
      </div>
    </div>
  )
}
