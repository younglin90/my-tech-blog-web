'use client'

import { useMemo, useState } from 'react'

// Re = ρ U L / μ = U L / ν
// 기본값: 물 25°C 흐름 (대표적 시나리오)
export function ReynoldsCalculator() {
  const [rho, setRho] = useState(1000)         // kg/m³ (물)
  const [U, setU] = useState(1)                // m/s
  const [L, setL] = useState(0.05)             // m
  const [mu, setMu] = useState(0.001)          // Pa·s (물 25°C)

  const Re = useMemo(() => (rho * U * L) / mu, [rho, U, L, mu])

  const regime =
    Re < 1 ? { label: 'Stokes (creeping)', color: '#94a3b8' } :
    Re < 2300 ? { label: 'Laminar', color: '#34d399' } :
    Re < 4000 ? { label: 'Transitional', color: '#fbbf24' } :
    { label: 'Turbulent', color: '#f87171' }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ρ — density (kg/m³)" value={rho} onChange={setRho} step={1} />
        <Field label="U — velocity (m/s)" value={U} onChange={setU} step={0.1} />
        <Field label="L — characteristic length (m)" value={L} onChange={setL} step={0.001} />
        <Field label="μ — dynamic viscosity (Pa·s)" value={mu} onChange={setMu} step={0.0001} />
      </div>
      <div className="mt-5 flex items-baseline justify-between rounded-lg p-4" style={{ background: 'var(--bg)', border: `2px solid ${regime.color}` }}>
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Re</div>
          <div className="mono mt-1 tabular-nums" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>
            {Re < 0.01 ? Re.toExponential(2) : Re < 10000 ? Re.toFixed(2) : Re.toExponential(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>regime</div>
          <div className="mt-1 text-base font-semibold" style={{ color: regime.color }}>{regime.label}</div>
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Pipe flow conventional thresholds: Re &lt; 2300 laminar, 2300–4000 transitional, &gt; 4000 turbulent.
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
