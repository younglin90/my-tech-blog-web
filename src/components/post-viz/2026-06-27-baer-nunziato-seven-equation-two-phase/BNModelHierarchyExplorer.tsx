'use client'

import { useState } from 'react'

// Interactive map of the diffuse-interface model hierarchy that descends from
// the full Baer-Nunziato seven-equation model by imposing successive
// equilibria (instantaneous relaxation). Click a model to inspect what is
// assumed equal between the two phases, how many PDEs remain, and the trade.

type Model = {
  id: string
  n: number
  name: string
  equilibria: string[]
  unknowns: string
  pro: string
  con: string
}

const MODELS: Model[] = [
  {
    id: '7eq',
    n: 7,
    name: 'Baer–Nunziato (full)',
    equilibria: ['없음 — 압력·속도·온도 모두 독립'],
    unknowns: 'α, (ρ, u, p)₁, (ρ, u, p)₂',
    pro: '가장 일반적. 무조건 쌍곡형(hyperbolic). 상마다 독립 EOS.',
    con: '비보존 항 + 두 속도장. 계면 변수 PI·uI 모델링이 까다롭다.',
  },
  {
    id: '6eq',
    n: 6,
    name: '6-방정식 (속도 평형)',
    equilibria: ['속도: u₁ = u₂ = u'],
    unknowns: 'α, ρ₁, ρ₂, u, p₁, p₂',
    pro: '단일 속도장으로 단순. 압력 비평형은 유지 — 계면을 안정적으로 잡는다.',
    con: '압력 완화를 별도 소스로 처리해야 한다.',
  },
  {
    id: '5eq',
    n: 5,
    name: 'Kapila 5-방정식 (압력+속도 평형)',
    equilibria: ['속도: u₁ = u₂', '압력: p₁ = p₂ = p'],
    unknowns: 'α, ρ₁, ρ₂, u, p',
    pro: '계면 포착에 가장 널리 쓰임. 부피분율 수송식이 깔끔하다.',
    con: '혼합 음속이 비단조(Wood) — 부피분율 소스가 뻣뻣하다.',
  },
  {
    id: '4eq',
    n: 4,
    name: '4-방정식 (+ 온도 평형)',
    equilibria: ['속도 u', '압력 p', '온도: T₁ = T₂ = T'],
    unknowns: 'ρ₁, ρ₂, u, p (또는 ρ, Y, u, p)',
    pro: '가장 가볍다. 캐비테이션·상변화 같은 열역학 평형 흐름에 적합.',
    con: '계면이 음향적으로 과도하게 매끈해질 수 있다. 일반성 최소.',
  },
]

export function BNModelHierarchyExplorer() {
  const [sel, setSel] = useState('7eq')
  const model = MODELS.find((m) => m.id === sel)!

  return (
    <div
      style={{
        border: '1px solid var(--border, #1e293b)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface, #0d1626)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, flexWrap: 'wrap' }}>
        {MODELS.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', flex: '1 1 120px' }}>
            <button
              onClick={() => setSel(m.id)}
              style={{
                flex: 1,
                cursor: 'pointer',
                borderRadius: 10,
                border: sel === m.id ? '2px solid #22d3ee' : '1px solid var(--border, #334155)',
                background: sel === m.id ? 'rgba(34,211,238,0.12)' : 'transparent',
                color: sel === m.id ? '#e2e8f0' : '#94a3b8',
                padding: '10px 8px',
                textAlign: 'center',
                transition: 'all .15s',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: sel === m.id ? '#22d3ee' : '#cbd5e1' }}>
                {m.n}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.3 }}>방정식</div>
            </button>
            {i < MODELS.length - 1 && (
              <span style={{ color: '#475569', fontSize: 18, padding: '0 4px', userSelect: 'none' }}>→</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ margin: '0 0 6px', color: '#e2e8f0', fontSize: 16 }}>{model.name}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {model.equilibria.map((eq) => (
            <span
              key={eq}
              style={{
                fontSize: 12,
                padding: '3px 9px',
                borderRadius: 999,
                background: 'rgba(34,211,238,0.10)',
                border: '1px solid rgba(34,211,238,0.3)',
                color: '#7dd3fc',
              }}
            >
              {eq}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 8px' }}>
          <strong style={{ color: '#cbd5e1' }}>미지수:</strong> <code>{model.unknowns}</code>
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          <div
            style={{
              borderLeft: '3px solid #22d3ee',
              padding: '4px 10px',
              fontSize: 13,
              color: '#cbd5e1',
            }}
          >
            <strong style={{ color: '#22d3ee' }}>장점</strong>
            <br />
            {model.pro}
          </div>
          <div
            style={{
              borderLeft: '3px solid #f59e0b',
              padding: '4px 10px',
              fontSize: 13,
              color: '#cbd5e1',
            }}
          >
            <strong style={{ color: '#f59e0b' }}>대가</strong>
            <br />
            {model.con}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#7a90a8', marginTop: 12, marginBottom: 0 }}>
        평형을 하나씩 더 부과할수록 방정식은 줄지만 &mdash; 일반성도 함께 줄어든다.
      </p>
    </div>
  )
}
