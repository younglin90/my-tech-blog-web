'use client'

import { useMemo, useState } from 'react'

// Pr = μ Cp / k = ν / α
// 표준 유체 프리셋
const PRESETS: { label: string; mu: number; Cp: number; k: number }[] = [
  { label: 'Air 20°C',   mu: 1.82e-5, Cp: 1005,  k: 0.0257  },
  { label: 'Water 20°C', mu: 1.00e-3, Cp: 4182,  k: 0.598   },
  { label: 'Water 80°C', mu: 3.55e-4, Cp: 4196,  k: 0.670   },
  { label: 'Oil (SAE30)',mu: 0.29,    Cp: 1900,  k: 0.145   },
  { label: 'Liquid Na',  mu: 3.64e-4, Cp: 1260,  k: 70.0    },
]

export function PrandtlCalculator() {
  const [mu, setMu] = useState(1.82e-5)   // Pa·s
  const [Cp, setCp] = useState(1005)      // J/(kg·K)
  const [k, setK]   = useState(0.0257)   // W/(m·K)

  const Pr = useMemo(() => (mu * Cp) / k, [mu, Cp, k])

  const regime =
    Pr < 0.01  ? { label: 'Liquid metals — heat dominated', color: '#f59e0b' } :
    Pr < 0.1   ? { label: 'Liquid metals', color: '#fbbf24' } :
    Pr < 0.5   ? { label: 'Gases (low Pr)', color: '#34d399' } :
    Pr < 5     ? { label: 'Air-like gases', color: '#22d3ee' } :
    Pr < 50    ? { label: 'Water-like liquids', color: '#818cf8' } :
    Pr < 1000  ? { label: 'Oils', color: '#f472b6' } :
    { label: 'Highly viscous fluid', color: '#f87171' }

  function applyPreset(p: typeof PRESETS[number]) {
    setMu(p.mu); setCp(p.Cp); setK(p.k)
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="rounded-md px-3 py-1 text-xs transition-colors"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="μ — dynamic viscosity (Pa·s)" value={mu} onChange={setMu} step={1e-5} />
        <Field label="Cₚ — specific heat (J/kg·K)" value={Cp} onChange={setCp} step={10} />
        <Field label="k — thermal conductivity (W/m·K)" value={k} onChange={setK} step={0.001} />
      </div>

      <div className="mt-5 flex items-baseline justify-between rounded-lg p-4" style={{ background: 'var(--bg)', border: `2px solid ${regime.color}` }}>
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Pr = μCₚ / k</div>
          <div className="mono mt-1 tabular-nums font-bold" style={{ fontSize: 32, color: 'var(--text)' }}>
            {Pr < 0.001 ? Pr.toExponential(3) : Pr < 10000 ? Pr.toFixed(3) : Pr.toExponential(3)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>fluid type</div>
          <div className="mt-1 text-sm font-semibold" style={{ color: regime.color }}>{regime.label}</div>
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Pr ≪ 1: thermal diffusivity dominates (liquid metals). Pr ≈ 1: air. Pr ≫ 1: viscosity dominates (oils).
      </p>
    </div>
  )
}

function Field({ label, value, onChange, step }: { label: string; value: number; onChange: (n: number) => void; step: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}
