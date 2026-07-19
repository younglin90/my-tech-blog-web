'use client'

import { useState } from 'react'

// Schematic of a bottom-wall fluid node in D2Q9.
// After streaming, three incoming populations (pointing up, into the fluid) are unknown.
// Bounce-back fills them from the opposite outgoing populations.
// Toggle shows WHERE the solid wall effectively sits: on the node (full-way) or half a
// lattice spacing below it (half-way).

type Scheme = 'halfway' | 'fullway'

const DIRS = [
  { dx: 0, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 1, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: -1 },
  { dx: 1, dy: -1 },
]
// unknown incoming at a bottom wall = directions pointing up (dy = +1): 2,5,6
const UNKNOWN = [2, 5, 6]

export function BounceBackStencil() {
  const [scheme, setScheme] = useState<Scheme>('halfway')

  const cx = 200
  const cy = 130
  const L = 70 // arrow length for straight, scaled for diagonals

  const wallY = scheme === 'fullway' ? cy : cy + 40 // full-way: on node; half-way: half spacing below
  const spacing = 80

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <svg viewBox="0 0 400 240" style={{ width: '100%', maxWidth: 400, background: 'rgba(8,17,31,0.96)', borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}>
        {/* solid wall */}
        <line x1={20} y1={wallY} x2={380} y2={wallY} stroke="#64748b" strokeWidth={3} />
        <g opacity={0.5}>
          {Array.from({ length: 18 }).map((_, k) => (
            <line key={k} x1={20 + k * 20} y1={wallY} x2={20 + k * 20 + 8} y2={wallY + 10} stroke="#64748b" strokeWidth={1.5} />
          ))}
        </g>

        {/* the boundary fluid node */}
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" />
        {/* neighbouring fluid nodes for context */}
        <circle cx={cx - spacing} cy={cy} r={3.5} fill="#334155" />
        <circle cx={cx + spacing} cy={cy} r={3.5} fill="#334155" />
        <circle cx={cx - spacing} cy={cy - spacing} r={3.5} fill="#334155" />
        <circle cx={cx} cy={cy - spacing} r={3.5} fill="#334155" />
        <circle cx={cx + spacing} cy={cy - spacing} r={3.5} fill="#334155" />

        {/* arrows */}
        {DIRS.map((d, i) => {
          if (i === 0) return null
          const len = d.dx !== 0 && d.dy !== 0 ? L * 0.7 : L * 0.55
          // svg y is downward; lattice dy up = -y
          const ex = cx + d.dx * len
          const ey = cy - d.dy * len
          const unknown = UNKNOWN.includes(i)
          const color = unknown ? '#22d3ee' : 'rgba(148,163,184,0.55)'
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth={unknown ? 2.5 : 1.5} markerEnd={`url(#${unknown ? 'ah-c' : 'ah-g'})`} />
            </g>
          )
        })}

        <defs>
          <marker id="ah-c" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
          </marker>
          <marker id="ah-g" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(148,163,184,0.55)" />
          </marker>
        </defs>

        <text x={cx + 10} y={cy + 4} fontSize={11} fill="#fca5a5" fontFamily="ui-monospace, monospace">boundary node</text>
        <text x={24} y={wallY - 8} fontSize={11} fill="#94a3b8" fontFamily="ui-monospace, monospace">
          {scheme === 'fullway' ? 'wall ON the node' : 'wall ½ spacing below the node'}
        </text>
        <text x={264} y={cy - 60} fontSize={11} fill="#22d3ee" fontFamily="ui-monospace, monospace">unknown f₂,f₅,f₆</text>
      </svg>
      <div style={{ display: 'flex', gap: 4, marginTop: '0.7rem', fontSize: 12 }}>
        {(['halfway', 'fullway'] as Scheme[]).map((s) => (
          <button
            key={s}
            onClick={() => setScheme(s)}
            style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid rgba(148,163,184,0.35)',
              background: scheme === s ? '#22d3ee' : 'transparent',
              color: scheme === s ? '#08111f' : '#cbd5e1',
              fontWeight: scheme === s ? 700 : 400,
            }}
          >
            {s === 'halfway' ? 'half-way (2nd order)' : 'full-way (1st order)'}
          </button>
        ))}
      </div>
    </div>
  )
}
