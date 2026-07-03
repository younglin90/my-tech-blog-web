'use client'

import { useState } from 'react'

// Interactive picture of the sub-characteristic (Whitham) condition.
// The relaxation system carries two frozen characteristic speeds +a and -a.
// The equilibrium equation carries a single speed f'(u). Stability of the
// relaxation approximation requires the true speed to stay bracketed:
//   -a <= f'(u) <= a   for all u in the solution range.
// For Burgers, f'(u) = u.

const W = 560
const H = 300
const PAD = 40

export function SubcharacteristicSpeedChart() {
  const [a, setA] = useState(1.4)
  const [uMax, setUMax] = useState(1.0) // solution spans u in [-uMax, uMax]

  const umin = -1.8
  const umax = 1.8
  const smin = -2.6
  const smax = 2.6

  const xToPx = (u: number) => PAD + ((u - umin) / (umax - umin)) * (W - 2 * PAD)
  const yToPx = (s: number) => H - PAD - ((s - smin) / (smax - smin)) * (H - 2 * PAD)

  // true characteristic speed line f'(u) = u, sampled across the solution range
  const line = []
  for (let k = 0; k <= 40; k++) {
    const u = umin + (k / 40) * (umax - umin)
    line.push(`${xToPx(u).toFixed(1)},${yToPx(u).toFixed(1)}`)
  }

  const satisfied = a >= uMax - 1e-9
  const accent = satisfied ? '#22d3ee' : '#f87171'

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
        color: 'var(--text-muted)',
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* band where the solution's f'(u) lives: u in [-uMax, uMax] */}
        <rect
          x={xToPx(-uMax)}
          y={PAD}
          width={xToPx(uMax) - xToPx(-uMax)}
          height={H - 2 * PAD}
          fill="rgba(34,211,238,0.08)"
        />
        {/* axes */}
        <line x1={PAD} y1={yToPx(0)} x2={W - PAD} y2={yToPx(0)} stroke="rgba(122,144,168,0.4)" />
        <line x1={xToPx(0)} y1={PAD} x2={xToPx(0)} y2={H - PAD} stroke="rgba(122,144,168,0.4)" />

        {/* frozen relaxation speeds +a and -a */}
        <line x1={PAD} y1={yToPx(a)} x2={W - PAD} y2={yToPx(a)} stroke={accent} strokeWidth={2} strokeDasharray="6 4" />
        <line x1={PAD} y1={yToPx(-a)} x2={W - PAD} y2={yToPx(-a)} stroke={accent} strokeWidth={2} strokeDasharray="6 4" />

        {/* true speed f'(u) = u */}
        <polyline points={line.join(' ')} fill="none" stroke="#f59e0b" strokeWidth={2.4} />

        {/* markers at the range edges */}
        <circle cx={xToPx(uMax)} cy={yToPx(uMax)} r={4} fill="#f59e0b" />
        <circle cx={xToPx(-uMax)} cy={yToPx(-uMax)} r={4} fill="#f59e0b" />

        {/* labels */}
        <text x={W - PAD - 4} y={yToPx(a) - 6} fontSize={13} fill={accent} textAnchor="end">+a</text>
        <text x={W - PAD - 4} y={yToPx(-a) + 16} fontSize={13} fill={accent} textAnchor="end">−a</text>
        <text x={xToPx(umax) - 6} y={yToPx(umax) + 4} fontSize={13} fill="#f59e0b" textAnchor="end">f′(u)=u</text>
        <text x={xToPx(0) + 6} y={PAD + 4} fontSize={12} fill="var(--text-muted)">speed</text>
        <text x={W - PAD} y={yToPx(0) - 6} fontSize={12} fill="var(--text-muted)" textAnchor="end">u</text>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 10 }}>
        <label style={{ fontSize: 13 }}>
          relaxation speed a = <b style={{ color: accent }}>{a.toFixed(2)}</b>
          <input type="range" min={0.4} max={2.4} step={0.05} value={a}
            onChange={(e) => setA(parseFloat(e.target.value))} style={{ display: 'block', width: 200 }} />
        </label>
        <label style={{ fontSize: 13 }}>
          solution range max|u| = {uMax.toFixed(2)}
          <input type="range" min={0.4} max={2.0} step={0.05} value={uMax}
            onChange={(e) => setUMax(parseFloat(e.target.value))} style={{ display: 'block', width: 200 }} />
        </label>
      </div>

      <p style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.5, color: accent }}>
        {satisfied
          ? `The orange curve f′(u) stays inside the ±a band over the whole solution range → sub-characteristic condition holds.`
          : `f′(u) escapes the ±a band near |u| = ${uMax.toFixed(2)} → condition violated, relaxation becomes unstable.`}
      </p>
    </div>
  )
}
