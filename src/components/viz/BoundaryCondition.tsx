'use client'

import { useState } from 'react'

interface Props {
  type?: 'inlet' | 'outlet' | 'wall' | 'symmetry'
  interactive?: boolean
}

const BC_CONFIG = {
  inlet: {
    label: '입구 (Inlet)',
    color: '#3b82f6',
    description: '유속/유량 또는 전압력을 지정합니다.',
    velocity: '고정값 (Fixed Value)',
    pressure: '영구배 (Zero Gradient)',
    example: `inlet\n{\n    type        fixedValue;\n    value       uniform (1 0 0);\n}`,
    arrows: 'in',
  },
  outlet: {
    label: '출구 (Outlet)',
    color: '#10b981',
    description: '압력을 지정하고 속도는 자연 경계 조건을 사용합니다.',
    velocity: '영구배 (Zero Gradient)',
    pressure: '고정값 (Fixed Value, 0 Pa)',
    example: `outlet\n{\n    type        zeroGradient;\n}`,
    arrows: 'out',
  },
  wall: {
    label: '벽면 (Wall)',
    color: '#ef4444',
    description: '점착 조건: 유체가 벽면과 같은 속도. 정지 벽이면 No-Slip.',
    velocity: 'No-Slip (u=0)',
    pressure: '영구배 (Zero Gradient)',
    example: `wall\n{\n    type        noSlip;\n}`,
    arrows: 'none',
  },
  symmetry: {
    label: '대칭면 (Symmetry)',
    color: '#f59e0b',
    description: '대칭축에서 법선 방향 속도=0, 접선 방향 속도 영구배.',
    velocity: '대칭 (Symmetry)',
    pressure: '대칭 (Symmetry)',
    example: `symmetry\n{\n    type        symmetryPlane;\n}`,
    arrows: 'tangent',
  },
}

export function BoundaryCondition({ type = 'inlet', interactive = true }: Props) {
  const [selected, setSelected] = useState<keyof typeof BC_CONFIG>(type)
  const cfg = BC_CONFIG[selected]

  const W = 400
  const H = 200

  return (
    <div className="my-6 rounded-lg border border-zinc-700 bg-slate-900 overflow-hidden">
      <div className="px-4 py-2 bg-slate-800 text-sm text-zinc-300 font-mono">
        경계 조건 인터랙티브 설명
      </div>

      {interactive && (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {(Object.keys(BC_CONFIG) as Array<keyof typeof BC_CONFIG>).map((k) => (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className="px-3 py-1 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: selected === k ? BC_CONFIG[k].color : '#1e293b',
                color: selected === k ? 'white' : '#94a3b8',
                border: `1px solid ${BC_CONFIG[k].color}`,
              }}
            >
              {BC_CONFIG[k].label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Visual */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-slate-800 rounded">
          {/* Flow domain */}
          <rect x="60" y="40" width="280" height="120" fill="#0f172a" stroke="#334155" strokeWidth="2" />

          {/* Boundary highlight */}
          <rect x="60" y="40" width="280" height="120"
            fill="none"
            stroke={cfg.color}
            strokeWidth="3"
            strokeDasharray={selected === 'symmetry' ? '6,3' : 'none'}
            opacity="0.5" />

          {/* Flow arrows */}
          {cfg.arrows === 'in' && [0.3, 0.5, 0.7].map((t) => (
            <g key={t} transform={`translate(60, ${40 + t * 120})`}>
              <line x1="-30" y1="0" x2="0" y2="0" stroke={cfg.color} strokeWidth="2"
                markerEnd={`url(#arrow-${selected})`} />
            </g>
          ))}
          {cfg.arrows === 'out' && [0.3, 0.5, 0.7].map((t) => (
            <g key={t} transform={`translate(340, ${40 + t * 120})`}>
              <line x1="0" y1="0" x2="30" y2="0" stroke={cfg.color} strokeWidth="2" />
              <polygon points="30,0 22,-4 22,4" fill={cfg.color} />
            </g>
          ))}
          {cfg.arrows === 'tangent' && [0.3, 0.5, 0.7].map((t) => (
            <g key={t} transform={`translate(${60 + t * 280}, 40)`}>
              <line x1="0" y1="-10" x2="0" y2="-25" stroke={cfg.color} strokeWidth="1.5"
                strokeDasharray="3,2" />
            </g>
          ))}

          <defs>
            <marker id={`arrow-${selected}`} markerWidth="6" markerHeight="6"
              refX="6" refY="3" orient="auto">
              <polygon points="0,0 6,3 0,6" fill={cfg.color} />
            </marker>
          </defs>

          {/* Labels */}
          <text x="200" y="100" textAnchor="middle" fill="#475569" fontSize="12" fontFamily="monospace">
            계산 도메인
          </text>
          <text x="200" y="175" textAnchor="middle" fill={cfg.color} fontSize="11" fontFamily="monospace">
            {cfg.label}
          </text>
        </svg>

        {/* Info */}
        <div className="space-y-3 text-sm">
          <p className="text-zinc-300">{cfg.description}</p>
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="text-zinc-500 w-16 shrink-0">속도 U:</span>
              <span className="text-zinc-200 font-mono text-xs">{cfg.velocity}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-zinc-500 w-16 shrink-0">압력 p:</span>
              <span className="text-zinc-200 font-mono text-xs">{cfg.pressure}</span>
            </div>
          </div>
          <pre className="text-xs bg-slate-800 rounded p-2 text-green-400 overflow-x-auto">
            {cfg.example}
          </pre>
        </div>
      </div>
    </div>
  )
}
