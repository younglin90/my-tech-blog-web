'use client'

import { useMemo, useState } from 'react'

// 난류 강도 I = u' / U_mean
// 난류 운동에너지 k = (3/2)(I·U)²
// 난류 길이 스케일 ℓ = C_μ^(3/4) · k^(3/2) / ε (k-ε), 또는 0.07·D (내부유동)
// 난류 소산율 ε = C_μ^(3/4) · k^(3/2) / ℓ
const C_MU = 0.09

export function TurbulenceIntensityCalculator() {
  const [I, setI]     = useState(5)        // % (난류 강도)
  const [U, setU]     = useState(10)       // m/s (평균 유속)
  const [D, setD]     = useState(0.05)     // m (특성 길이, 예: 파이프 직경)
  const [mode, setMode] = useState<'pipe' | 'channel' | 'freestream'>('pipe')

  const { k, epsilon, ell, omega } = useMemo(() => {
    const Ifrac = I / 100
    const uPrime = Ifrac * U                          // rms 속도
    const k = 1.5 * uPrime * uPrime                  // 난류 운동에너지
    const ell = mode === 'pipe' ? 0.07 * D
              : mode === 'channel' ? 0.1 * D
              : 0.4 * D                               // 자유류 (대형 와류)
    const epsilon = Math.pow(C_MU, 0.75) * Math.pow(k, 1.5) / ell
    const omega = Math.sqrt(k) / (Math.pow(C_MU, 0.25) * ell)
    return { k, epsilon, ell, omega }
  }, [I, U, D, mode])

  const fmt = (v: number, dec = 4) => {
    if (v < 1e-6 || v > 1e5) return v.toExponential(2)
    return v.toFixed(dec)
  }

  const MODES = [
    { value: 'pipe' as const,       label: 'Pipe / duct (ℓ=0.07D)' },
    { value: 'channel' as const,    label: 'Channel (ℓ=0.10D)' },
    { value: 'freestream' as const, label: 'Free stream (ℓ=0.40D)' },
  ]

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className="rounded-md px-3 py-1 text-xs transition-colors"
            style={{
              background: mode === m.value ? 'var(--accent)' : 'var(--bg)',
              color: mode === m.value ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="I — turbulence intensity (%)" value={I} onChange={setI} step={0.5} min={0.01} max={100} />
        <Field label="U — mean velocity (m/s)" value={U} onChange={setU} step={0.1} min={0.001} />
        <Field label="D — length scale (m)" value={D} onChange={setD} step={0.01} min={1e-4} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Result label="k  (m²/s²)" value={fmt(k)} color="#22d3ee" />
        <Result label="ε  (m²/s³)" value={fmt(epsilon)} color="#a78bfa" />
        <Result label="ω  (1/s)" value={fmt(omega, 2)} color="#34d399" />
        <Result label="ℓ  (m)" value={fmt(ell, 4)} color="#fbbf24" />
      </div>

      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Use k, ε, ω as inlet BCs for k-ε / k-ω SST in OpenFOAM / Fluent. I ≈ 1–5% for internal, 0.05–1% for external flows.
      </p>
    </div>
  )
}

function Field({ label, value, onChange, step, min, max }: {
  label: string; value: number; onChange: (n: number) => void; step: number; min?: number; max?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number" value={value} step={step} min={min} max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}

function Result({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono mt-1 tabular-nums font-bold" style={{ fontSize: 17, color }}>{value}</div>
    </div>
  )
}
