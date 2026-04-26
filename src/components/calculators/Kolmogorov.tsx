'use client'

import { useMemo, useState } from 'react'

// Kolmogorov 미세척도: η = (ν³/ε)^(1/4)
// 시간척도: τ_η = (ν/ε)^(1/2)
// 속도척도: u_η = (νε)^(1/4)
export function KolmogorovCalculator() {
  const [nu, setNu] = useState(1.5e-5)     // m²/s (air 20°C)
  const [epsilon, setEpsilon] = useState(0.1)  // m²/s³ (turbulent dissipation rate)
  const [L, setL] = useState(1.0)          // m (integral length scale)
  const [U, setU] = useState(10)           // m/s (velocity scale)

  const eta = useMemo(() => Math.pow(Math.pow(nu, 3) / epsilon, 0.25), [nu, epsilon])
  const tau_eta = useMemo(() => Math.pow(nu / epsilon, 0.5), [nu, epsilon])
  const u_eta = useMemo(() => Math.pow(nu * epsilon, 0.25), [nu, epsilon])
  const Re_L = useMemo(() => U * L / nu, [U, L, nu])
  const Re_eta = useMemo(() => u_eta * eta / nu, [u_eta, eta, nu])

  const fmt = (v: number) => {
    if (v < 1e-6) return v.toExponential(2)
    if (v < 0.001) return v.toExponential(2)
    if (v < 1) return v.toFixed(4)
    return v.toFixed(3)
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ν — kinematic viscosity (m²/s)" value={nu} onChange={setNu} step={1e-6} min={1e-8} />
        <Field label="ε — dissipation rate (m²/s³)" value={epsilon} onChange={setEpsilon} step={0.01} min={1e-6} />
        <Field label="L — integral length scale (m)" value={L} onChange={setL} step={0.1} min={1e-4} />
        <Field label="U — velocity scale (m/s)" value={U} onChange={setU} step={0.1} min={1e-4} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Result label="η  (length)" value={fmt(eta)} unit="m" color="#22d3ee" />
        <Result label="τ_η  (time)" value={fmt(tau_eta)} unit="s" color="#a78bfa" />
        <Result label="u_η  (velocity)" value={fmt(u_eta)} unit="m/s" color="#34d399" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Result label="Re_L  (large-scale)" value={Re_L.toExponential(2)} unit="" color="var(--text)" small />
        <Result label="Re_η  (Kolmogorov Re)" value={Re_eta.toFixed(2)} unit="" color="var(--text)" small />
      </div>

      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        η ≈ (ν³/ε)^(1/4) · Re_η = u_ηη/ν ≈ 1 by definition. DNS needs Δx ≈ η.
      </p>
    </div>
  )
}

function Field({ label, value, onChange, step, min }: { label: string; value: number; onChange: (n: number) => void; step: number; min?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}

function Result({ label, value, unit, color, small }: { label: string; value: string; unit: string; color: string; small?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: `1px solid var(--border)` }}>
      <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className={`mono mt-1 tabular-nums font-bold`} style={{ fontSize: small ? 18 : 22, color }}>
        {value}{unit && <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </div>
  )
}
