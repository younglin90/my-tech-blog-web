'use client'

import { useState } from 'react'

// D2Q9 moment names (Lallemand-Luo ordering)
const MOMENTS = [
  { key: 'rho', label: 'ρ', desc: 'density (conserved)', conserved: true },
  { key: 'e', label: 'e', desc: 'energy', conserved: false, ctrl: 'e' },
  { key: 'eps', label: 'ε', desc: 'energy square', conserved: false, ctrl: 'eps' },
  { key: 'jx', label: 'jx', desc: 'x-momentum (conserved)', conserved: true },
  { key: 'qx', label: 'qx', desc: 'x energy flux', conserved: false, ctrl: 'q' },
  { key: 'jy', label: 'jy', desc: 'y-momentum (conserved)', conserved: true },
  { key: 'qy', label: 'qy', desc: 'y energy flux', conserved: false, ctrl: 'q' },
  { key: 'pxx', label: 'pxx', desc: 'normal stress → viscosity', conserved: false, ctrl: 'nu' },
  { key: 'pxy', label: 'pxy', desc: 'shear stress → viscosity', conserved: false, ctrl: 'nu' },
]

export function MRTMomentRelaxationLab() {
  const [sE, setSE] = useState(1.64)
  const [sEps, setSEps] = useState(1.54)
  const [sQ, setSQ] = useState(1.7)
  const [sNu, setSNu] = useState(1.2)

  const cs2 = 1 / 3
  const nu = cs2 * (1 / sNu - 0.5)

  const rateFor = (m: (typeof MOMENTS)[number]) => {
    if (m.conserved) return 0
    if (m.ctrl === 'e') return sE
    if (m.ctrl === 'eps') return sEps
    if (m.ctrl === 'q') return sQ
    return sNu
  }

  const W = 560
  const H = 240
  const padL = 40
  const padB = 40
  const barW = (W - padL - 20) / MOMENTS.length

  const stable = sNu > 0 && sNu < 2 && sE < 2 && sEps < 2 && sQ < 2

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
        D2Q9 moment-space relaxation rates · S = diag(s₀…s₈)
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* s = 2 reference (stability ceiling) */}
        {[0.5, 1, 1.5, 2].map((g) => {
          const y = H - padB - (g / 2) * (H - padB - 20)
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={W - 20} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="var(--text-faint)">
                {g.toFixed(1)}
              </text>
            </g>
          )
        })}
        {/* bars */}
        {MOMENTS.map((m, i) => {
          const s = rateFor(m)
          const x = padL + i * barW + 4
          const h = (s / 2) * (H - padB - 20)
          const y = H - padB - h
          const color = m.conserved ? 'var(--text-faint)' : s > 1.9 ? '#f97316' : '#22d3ee'
          return (
            <g key={m.key}>
              <rect x={x} y={y} width={barW - 8} height={h} fill={color} rx={2} opacity={0.85} />
              <text
                x={x + (barW - 8) / 2}
                y={H - padB + 14}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-muted)"
              >
                {m.label}
              </text>
              {!m.conserved && (
                <text
                  x={x + (barW - 8) / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--text-muted)"
                >
                  {s.toFixed(2)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginTop: 12 }}>
        <Slider label={`sₑ (bulk) = ${sE.toFixed(2)}`} value={sE} set={setSE} />
        <Slider label={`s_ε = ${sEps.toFixed(2)}`} value={sEps} set={setSEps} />
        <Slider label={`s_q (ghost) = ${sQ.toFixed(2)}`} value={sQ} set={setSQ} />
        <Slider label={`s_ν (shear) = ${sNu.toFixed(2)}`} value={sNu} set={setSNu} />
      </div>

      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
        <span style={{ color: 'var(--text-muted)' }}>shear viscosity </span>
        <code>ν = cs²(1/s_ν − 1/2) = </code>
        <strong style={{ color: 'var(--accent)' }}>{nu.toFixed(4)}</strong>{' '}
        <span style={{ color: 'var(--text-muted)' }}>(lattice units)</span>
        <div style={{ marginTop: 4, color: stable ? '#22c55e' : '#f97316' }}>
          {stable
            ? '✓ all rates in (0, 2) — linearly stable region'
            : '⚠ a rate left (0, 2) — the scheme will amplify modes'}
        </div>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  set,
}: {
  label: string
  value: number
  set: (v: number) => void
}) {
  return (
    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
      <div style={{ marginBottom: 2 }}>{label}</div>
      <input
        type="range"
        min={0.1}
        max={1.99}
        step={0.01}
        value={value}
        onChange={(e) => set(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  )
}
