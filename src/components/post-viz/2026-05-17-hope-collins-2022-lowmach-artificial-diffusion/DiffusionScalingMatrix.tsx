'use client'

import { useState } from 'react'

type Scaling = 'convective' | 'acoustic' | 'mixed'

// Exponent n means coefficient scales as O(M^n)
const MATRICES: Record<Scaling, [[number, number], [number, number]]> = {
  convective: [
    [-2, 0],
    [-2, 0],
  ],
  acoustic: [
    [-1, 0],
    [-2, -1],
  ],
  mixed: [
    [-1, 0],
    [-2, 0],
  ],
}

const COLORS: Record<Scaling, string> = {
  convective: '#ef4444',
  acoustic: '#22d3ee',
  mixed: '#a3e635',
}

const LABELS: Record<Scaling, string> = {
  convective: 'Convective (Aᶜ)',
  acoustic: 'Acoustic (Aᵃ)',
  mixed: 'Mixed (Aᵐ)',
}

function formatCoeff(M: number, n: number): string {
  const v = Math.pow(M, n)
  if (v >= 1e6) return v.toExponential(1)
  if (v >= 100) return v.toFixed(0)
  if (v >= 1) return v.toFixed(2)
  return v.toFixed(3)
}

export function DiffusionScalingMatrix() {
  const [logMach, setLogMach] = useState(-2)
  const M = Math.pow(10, logMach)

  const cellStyle = (val: number): React.CSSProperties => {
    const mag = Math.log10(Math.max(val, 1e-9))
    const norm = Math.max(0, Math.min(1, (mag + 2) / 6))
    const hue = 200 - norm * 200 // blue→red
    return {
      background: `hsla(${hue}, 70%, 45%, ${0.25 + 0.55 * norm})`,
      color: '#f1f5f9',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '8px 10px',
      fontFamily: 'ui-monospace, monospace',
      fontSize: 13,
      textAlign: 'center' as const,
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '24px 0',
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <strong style={{ color: 'var(--text)' }}>How each scaling explodes as M → 0</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {(Object.keys(MATRICES) as Scaling[]).map((s) => {
          const m = MATRICES[s]
          return (
            <div key={s} style={{ border: `1px solid ${COLORS[s]}55`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: COLORS[s], marginBottom: 6, fontWeight: 600 }}>{LABELS[s]}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div style={cellStyle(Math.pow(M, m[0][0]))}>
                  M<sup>{m[0][0]}</sup>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{formatCoeff(M, m[0][0])}</div>
                </div>
                <div style={cellStyle(Math.pow(M, m[0][1]))}>
                  M<sup>{m[0][1]}</sup>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{formatCoeff(M, m[0][1])}</div>
                </div>
                <div style={cellStyle(Math.pow(M, m[1][0]))}>
                  M<sup>{m[1][0]}</sup>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{formatCoeff(M, m[1][0])}</div>
                </div>
                <div style={cellStyle(Math.pow(M, m[1][1]))}>
                  M<sup>{m[1][1]}</sup>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{formatCoeff(M, m[1][1])}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <label style={{ display: 'block', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        log₁₀ M = {logMach.toFixed(2)}   (M = {M.toExponential(2)})
        <input
          type="range"
          min={-4}
          max={0}
          step={0.05}
          value={logMach}
          onChange={(e) => setLogMach(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </label>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
        The (1,1) and (2,1) cells of the convective matrix grow as 10⁴ when M = 10⁻². That is the
        catastrophe Hope–Collins traces to a parabolic limit equation for acoustic pressure.
      </p>
    </div>
  )
}
