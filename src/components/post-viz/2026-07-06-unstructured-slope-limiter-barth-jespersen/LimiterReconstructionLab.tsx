'use client'

import { useMemo, useState } from 'react'

// Cell-averaged scalar profile with a sharp jump + a small bump.
// A gradient reconstruction (central slope) tends to overshoot near the jump,
// creating new extrema. Barth-Jespersen and Venkatakrishnan limiters clamp it.
const U = [0.15, 0.15, 0.18, 0.85, 0.9, 0.86, 0.5, 0.52, 0.5]
const N = U.length

type Mode = 'none' | 'bj' | 'venk'

// central-difference cell slope (per unit cell width)
function centralSlope(i: number): number {
  const l = U[Math.max(0, i - 1)]
  const r = U[Math.min(N - 1, i + 1)]
  return (r - l) / 2
}

function neighborBounds(i: number): [number, number] {
  const l = U[Math.max(0, i - 1)]
  const r = U[Math.min(N - 1, i + 1)]
  return [Math.min(U[i], l, r), Math.max(U[i], l, r)]
}

// per-face Barth-Jespersen factor
function bjFace(du: number, dPlus: number, dMinus: number): number {
  if (du > 1e-12) return Math.min(1, dPlus / du)
  if (du < -1e-12) return Math.min(1, dMinus / du)
  return 1
}

// per-face Venkatakrishnan smooth factor (eps^2 ~ (K*h)^3, h=1 here)
function venkFace(du: number, dExtreme: number, eps2: number): number {
  if (Math.abs(du) < 1e-12) return 1
  const a = dExtreme
  const b = du
  return (1 / b) * ((a * a + eps2) * b + 2 * b * b * a) / (a * a + 2 * b * b + a * b + eps2)
}

function limiterPhi(i: number, mode: Mode, gain: number, K: number): number {
  if (mode === 'none') return 1
  const s = centralSlope(i) * gain
  const [umin, umax] = neighborBounds(i)
  const dPlus = umax - U[i]
  const dMinus = umin - U[i]
  const eps2 = Math.pow(K, 3)
  // two faces of a 1D cell: x_i +/- 0.5
  const faces = [0.5 * s, -0.5 * s]
  let phi = 1
  for (const du of faces) {
    let f: number
    if (mode === 'bj') f = bjFace(du, dPlus, dMinus)
    else f = venkFace(du, du > 0 ? dPlus : dMinus, eps2)
    phi = Math.min(phi, f)
  }
  return Math.max(0, Math.min(1, phi))
}

export function LimiterReconstructionLab() {
  const [mode, setMode] = useState<Mode>('bj')
  const [gain, setGain] = useState(1.4)
  const [K, setK] = useState(0.3)

  const W = 560
  const H = 300
  const padL = 40
  const padR = 16
  const padT = 16
  const padB = 34
  const x = (i: number) => padL + (i / (N - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - -0.05) / 1.1) * (H - padT - padB)

  const cells = useMemo(() => {
    return U.map((ui, i) => {
      const s = centralSlope(i) * gain
      const phi = limiterPhi(i, mode, gain, K)
      const half = 0.5 * (1 / (N - 1)) // half-cell in index units
      const [umin, umax] = neighborBounds(i)
      const uLraw = ui - 0.5 * s
      const uRraw = ui + 0.5 * s
      const uL = ui - 0.5 * phi * s
      const uR = ui + 0.5 * phi * s
      const overshoot = uLraw > umax + 1e-9 || uLraw < umin - 1e-9 || uRraw > umax + 1e-9 || uRraw < umin - 1e-9
      return { i, ui, phi, half, uL, uR, uLraw, uRraw, overshoot }
    })
  }, [mode, gain, K])

  const btn = (m: Mode, label: string) => (
    <button
      onClick={() => setMode(m)}
      style={{
        padding: '5px 11px',
        borderRadius: 7,
        border: '1px solid var(--border, #2a3a4f)',
        background: mode === m ? 'var(--accent, #22d3ee)' : 'transparent',
        color: mode === m ? '#08111f' : 'var(--text, #cdd9e5)',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      style={{
        border: '1px solid var(--border, #2a3a4f)',
        borderRadius: 12,
        padding: 16,
        margin: '20px 0',
        background: 'var(--surface, #0d1826)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        {btn('none', 'Unlimited (Φ=1)')}
        {btn('bj', 'Barth–Jespersen')}
        {btn('venk', 'Venkatakrishnan')}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* neighbor min/max band per cell */}
        {cells.map((c) => {
          const [umin, umax] = neighborBounds(c.i)
          const cx = x(c.i)
          const hw = (c.half) * (W - padL - padR)
          return (
            <rect
              key={`band-${c.i}`}
              x={cx - hw}
              y={y(umax)}
              width={2 * hw}
              height={Math.max(0, y(umin) - y(umax))}
              fill="var(--accent, #22d3ee)"
              opacity={0.07}
            />
          )
        })}
        {/* cell-average dots */}
        {cells.map((c) => (
          <circle key={`dot-${c.i}`} cx={x(c.i)} cy={y(c.ui)} r={3} fill="var(--text-muted, #7a90a8)" />
        ))}
        {/* limited reconstruction segments */}
        {cells.map((c) => {
          const cx = x(c.i)
          const hw = c.half * (W - padL - padR)
          return (
            <line
              key={`seg-${c.i}`}
              x1={cx - hw}
              y1={y(c.uL)}
              x2={cx + hw}
              y2={y(c.uR)}
              stroke={c.overshoot && mode === 'none' ? '#f87171' : 'var(--accent, #22d3ee)'}
              strokeWidth={3}
            />
          )
        })}
        {/* Phi labels */}
        {cells.map((c) => (
          <text
            key={`phi-${c.i}`}
            x={x(c.i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={10}
            fill={c.phi < 0.99 ? 'var(--accent, #22d3ee)' : 'var(--text-muted, #7a90a8)'}
          >
            {c.phi.toFixed(2)}
          </text>
        ))}
        <text x={padL} y={H - 20} fontSize={10} fill="var(--text-muted, #7a90a8)">
          Φ per cell →
        </text>
      </svg>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
        <label style={{ fontSize: 13, color: 'var(--text, #cdd9e5)' }}>
          gradient gain: {gain.toFixed(2)}
          <br />
          <input type="range" min={0.2} max={2.2} step={0.05} value={gain} onChange={(e) => setGain(+e.target.value)} />
        </label>
        <label style={{ fontSize: 13, color: 'var(--text, #cdd9e5)', opacity: mode === 'venk' ? 1 : 0.4 }}>
          Venkatakrishnan K: {K.toFixed(2)}
          <br />
          <input
            type="range"
            min={0.02}
            max={1.2}
            step={0.02}
            value={K}
            onChange={(e) => setK(+e.target.value)}
            disabled={mode !== 'venk'}
          />
        </label>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted, #7a90a8)', margin: '10px 0 0' }}>
        Shaded band = allowed [min, max] from neighbors. Red segment = reconstruction escapes the band (new extremum).
        Φ=1 keeps full slope; Φ→0 flattens the cell to first order.
      </p>
    </div>
  )
}
