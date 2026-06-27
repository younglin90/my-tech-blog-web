'use client'

import { useMemo, useState } from 'react'

// Why explicit surface tension is trapped below Delta_t_sigma, in one chart.
// We plot the amplification factor |G| of one capillary mode vs dt/dt_sigma.
// - Explicit (symplectic Euler) of the oscillator stays |G|=1 until omega*dt=2,
//   then blows up.  Since omega*dt_sigma = pi/sqrt(2) ~= 2.221, the blow-up lands
//   at dt/dt_sigma ~= 2/2.221 ~= 0.90.
// - Implicit (backward Euler) keeps |G|<1 for every time step.
// Sliders for mesh resolution and surface tension report the actual Delta_t_sigma
// = sqrt((rhoA+rhoB) dx^3 / (2 pi sigma)), showing its brutal dx^{3/2} scaling.

const OMEGA_TS = Math.PI / Math.SQRT2 // omega * dt_sigma for the resolved mode

function gExplicit(ratio: number) {
  const a = OMEGA_TS * ratio // = omega*dt
  if (a <= 2) return 1
  const T = a * a - 2
  return (T + Math.sqrt(T * T - 4)) / 2 // spectral radius of the symplectic map
}
function gImplicit(ratio: number) {
  const a = OMEGA_TS * ratio
  return 1 / Math.sqrt(1 + a * a) // backward Euler is contractive for all dt
}

export function CapillaryStepConstraint() {
  const [ratio, setRatio] = useState(0.9)
  const [cells, setCells] = useState(128) // mesh resolution L/dx
  const [sigma, setSigma] = useState(0.07) // surface tension coefficient

  const dtSigma = useMemo(() => {
    const rhoHat = 1000 + 1.2 // water + air densities
    const dx = 1 / cells // domain length L = 1
    return Math.sqrt((rhoHat * dx ** 3) / (2 * Math.PI * sigma))
  }, [cells, sigma])

  // chart geometry
  const W = 360
  const H = 200
  const padL = 38
  const padB = 26
  const xMax = 3
  const x2px = (r: number) => padL + (r / xMax) * (W - padL - 8)
  const gMax = 4
  const g2px = (g: number) => H - padB - (Math.min(g, gMax) / gMax) * (H - padB - 12)

  const curve = (fn: (r: number) => number) => {
    let d = ''
    for (let i = 0; i <= 120; i++) {
      const r = (i / 120) * xMax
      const px = x2px(r)
      const py = g2px(fn(r))
      d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1)
    }
    return d
  }

  const gE = gExplicit(ratio)
  const gI = gImplicit(ratio)

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--bg)',
        margin: '1.5rem 0',
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}>
        {/* |G| = 1 line (stability boundary) */}
        <line x1={padL} y1={g2px(1)} x2={W - 8} y2={g2px(1)} stroke="var(--border)" strokeDasharray="4 3" />
        <text x={padL + 2} y={g2px(1) - 4} fontSize="9" fill="var(--text-muted)">|G| = 1</text>
        {/* axes */}
        <line x1={padL} y1={12} x2={padL} y2={H - padB} stroke="var(--border)" />
        <line x1={padL} y1={H - padB} x2={W - 8} y2={H - padB} stroke="var(--border)" />
        {/* dt/dt_sigma = 1 marker */}
        <line x1={x2px(1)} y1={12} x2={x2px(1)} y2={H - padB} stroke="var(--text-faint)" strokeDasharray="2 3" />
        <text x={x2px(1)} y={H - padB + 12} fontSize="9" fill="var(--text-muted)" textAnchor="middle">1</text>
        <text x={x2px(2)} y={H - padB + 12} fontSize="9" fill="var(--text-muted)" textAnchor="middle">2</text>
        <text x={x2px(3) - 6} y={H - padB + 12} fontSize="9" fill="var(--text-muted)" textAnchor="middle">3</text>
        <text x={W / 2} y={H - 2} fontSize="10" fill="var(--text-muted)" textAnchor="middle">Δt / Δt_σ</text>
        {/* curves */}
        <path d={curve(gExplicit)} fill="none" stroke="#f97316" strokeWidth="2" />
        <path d={curve(gImplicit)} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {/* selected ratio marker */}
        <line x1={x2px(ratio)} y1={12} x2={x2px(ratio)} y2={H - padB} stroke="var(--text)" strokeWidth="1" opacity="0.5" />
        <circle cx={x2px(ratio)} cy={g2px(gE)} r="3.5" fill="#f97316" />
        <circle cx={x2px(ratio)} cy={g2px(gI)} r="3.5" fill="var(--accent)" />
        <text x={padL - 6} y={g2px(0) } fontSize="9" fill="var(--text-muted)" textAnchor="end">0</text>
        <text x={padL - 6} y={g2px(4) + 8} fontSize="9" fill="var(--text-muted)" textAnchor="end">4</text>
      </svg>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '10px 0', fontSize: 13 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Δt / Δt_σ = {ratio.toFixed(2)}
          <input type="range" min={0.2} max={3} step={0.05} value={ratio} onChange={(e) => setRatio(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          mesh L/Δx = {cells}
          <input type="range" min={32} max={512} step={32} value={cells} onChange={(e) => setCells(parseInt(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          σ = {sigma.toFixed(2)}
          <input type="range" min={0.01} max={0.5} step={0.01} value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} />
        </label>
      </div>
      <div style={{ fontSize: 13, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ color: '#f97316' }}>explicit |G| = <b>{gE.toFixed(3)}</b></span>
        <span style={{ color: 'var(--accent)' }}>implicit |G| = <b>{gI.toFixed(3)}</b></span>
        <span style={{ color: 'var(--text-muted)' }}>
          Δt_σ ≈ <b>{dtSigma.toExponential(2)}</b> (water/air, L=1)
        </span>
      </div>
    </div>
  )
}
