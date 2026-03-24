'use client'

import { useState } from 'react'

interface Props {
  scheme?: 'upwind' | 'central' | 'quick'
  order?: number
}

const SCHEME_INFO = {
  upwind: {
    name: '업윈드 차분 (Upwind)',
    order: 1,
    stencil: [-1, 0],
    formula: '$\\phi_e = \\phi_P$ (if $u_e > 0$)',
    pros: ['무조건 안정적', '어떤 격자에서도 수렴'],
    cons: ['1차 정확도', '수치 확산(numerical diffusion) 발생'],
    color: '#f59e0b',
  },
  central: {
    name: '중앙 차분 (Central Differencing)',
    order: 2,
    stencil: [-1, 0, 1],
    formula: '$\\phi_e = (\\phi_P + \\phi_E) / 2$',
    pros: ['2차 정확도', '수치 확산 없음'],
    cons: ['고 Pe에서 비물리적 진동 가능', '안정성 조건 있음'],
    color: '#3b82f6',
  },
  quick: {
    name: 'QUICK',
    order: 3,
    stencil: [-2, -1, 0, 1],
    formula: '$\\phi_e = \\frac{6}{8}\\phi_P + \\frac{3}{8}\\phi_E - \\frac{1}{8}\\phi_W$',
    pros: ['3차 정확도', '구조 격자에서 우수'],
    cons: ['비구조 격자에 적용 어려움', '과압 현상 가능'],
    color: '#10b981',
  },
}

export function NumericalScheme({ scheme = 'upwind', order = 1 }: Props) {
  const [selected, setSelected] = useState<'upwind' | 'central' | 'quick'>(scheme)
  const info = SCHEME_INFO[selected]
  const cells = [-3, -2, -1, 0, 1, 2, 3]

  return (
    <div className="my-6 rounded-lg border border-zinc-700 bg-slate-900 overflow-hidden">
      <div className="px-4 py-2 bg-slate-800 text-sm text-zinc-300 font-mono">
        수치 차분 스킴 비교
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {(Object.keys(SCHEME_INFO) as Array<keyof typeof SCHEME_INFO>).map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selected === s ? 'text-white' : 'bg-slate-700 text-zinc-400 hover:bg-slate-600'
            }`}
            style={selected === s ? { backgroundColor: SCHEME_INFO[s].color } : {}}
          >
            {SCHEME_INFO[s].name.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 mt-4">
        <h3 className="text-zinc-200 font-semibold mb-3">{info.name}</h3>

        {/* Stencil visualization */}
        <div className="flex items-center justify-center gap-1 mb-4 py-3 bg-slate-800 rounded">
          {cells.map((c) => {
            const isActive = info.stencil.includes(c)
            const label = c === 0 ? 'P' : c === 1 ? 'E' : c === -1 ? 'W' : c === 2 ? 'EE' : c === -2 ? 'WW' : String(c)
            return (
              <div key={c} className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-mono font-bold transition-all"
                  style={{
                    borderColor: isActive ? info.color : '#334155',
                    backgroundColor: isActive ? `${info.color}33` : 'transparent',
                    color: isActive ? info.color : '#64748b',
                  }}
                >
                  {label}
                </div>
                {isActive && (
                  <div className="w-0.5 h-3 mt-0.5" style={{ backgroundColor: info.color }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="text-sm text-zinc-300 mb-3">
          <span className="text-zinc-500">보간 공식: </span>
          <code className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded">{info.formula}</code>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-green-400 font-semibold mb-1">장점</p>
            <ul className="text-xs text-zinc-400 space-y-1">
              {info.pros.map((p, i) => <li key={i}>✓ {p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs text-red-400 font-semibold mb-1">단점</p>
            <ul className="text-xs text-zinc-400 space-y-1">
              {info.cons.map((c, i) => <li key={i}>✗ {c}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          정확도: <span className="font-mono" style={{ color: info.color }}>{info.order}차</span>
        </div>
      </div>
    </div>
  )
}
