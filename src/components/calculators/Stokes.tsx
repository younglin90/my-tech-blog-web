'use client'

import { useMemo, useState } from 'react'

// Stokes number: St = τ_p / τ_f
// 입자 이완시간: τ_p = ρ_p d_p² / (18 μ)  (Stokes drag)
// 유동 시간 스케일: τ_f = L / U
// St ≪ 1: 입자가 유동을 잘 추종 (tracer)
// St ≈ 1: 관성 집중 최대 (cluster)
// St ≫ 1: 입자가 유동을 무시 (ballistic)
export function StokesCalculator() {
  const [rhoP, setRhoP] = useState(1000)   // kg/m³ (water droplet in air)
  const [dP, setDP]     = useState(50e-6)  // m     (50 μm particle)
  const [mu, setMu]     = useState(1.82e-5)// Pa·s  (air 20°C)
  const [L, setL]       = useState(0.1)    // m     (characteristic flow length)
  const [U, setU]       = useState(10)     // m/s   (characteristic velocity)

  const { tauP, tauF, St, Re_p } = useMemo(() => {
    const tauP = (rhoP * dP * dP) / (18 * mu)  // particle relaxation time
    const tauF = L / U                           // flow time scale
    const St = tauP / tauF
    // particle Reynolds number for Stokes validity check
    const rhoF = 1.2   // air density
    const Re_p = rhoF * U * dP / mu
    return { tauP, tauF, St, Re_p }
  }, [rhoP, dP, mu, L, U])

  const regime =
    St < 0.1   ? { label: 'Tracer — follows flow perfectly', color: '#34d399', tip: 'St ≪ 1: passive scalar behavior' } :
    St < 0.5   ? { label: 'Weak inertia — nearly tracers', color: '#22d3ee', tip: 'Slight drift from streamlines' } :
    St < 2     ? { label: 'Max clustering — inertial focus', color: '#f59e0b', tip: 'Particles cluster at St ≈ 1' } :
    St < 10    ? { label: 'Strong inertia — partial decoupling', color: '#f87171', tip: 'Particles significantly lag flow' } :
    { label: 'Ballistic — ignores flow', color: '#e879f9', tip: 'Particle trajectory ≈ straight line' }

  const stokesValid = Re_p < 1

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ρ_p — particle density (kg/m³)" value={rhoP} onChange={setRhoP} step={10} min={1} />
        <Field label="d_p — particle diameter (m)" value={dP} onChange={setDP} step={1e-6} min={1e-9} />
        <Field label="μ — fluid dynamic viscosity (Pa·s)" value={mu} onChange={setMu} step={1e-6} min={1e-9} />
        <Field label="L — flow length scale (m)" value={L} onChange={setL} step={0.01} min={1e-6} />
        <Field label="U — flow velocity (m/s)" value={U} onChange={setU} step={0.1} min={1e-4} />
      </div>

      <div className="mt-5 flex items-baseline justify-between rounded-lg p-4" style={{ background: 'var(--bg)', border: `2px solid ${regime.color}` }}>
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>St = τ_p / τ_f</div>
          <div className="mono mt-1 tabular-nums font-bold" style={{ fontSize: 32, color: 'var(--text)' }}>
            {St < 0.001 ? St.toExponential(2) : St < 1000 ? St.toFixed(4) : St.toExponential(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>regime</div>
          <div className="mt-1 text-sm font-semibold" style={{ color: regime.color }}>{regime.label}</div>
          <div className="mt-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>{regime.tip}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>τ_p (particle time)</div>
          <div className="mono font-semibold" style={{ fontSize: 14, color: 'var(--text)' }}>
            {tauP < 1e-4 ? tauP.toExponential(2) : tauP.toFixed(4)} s
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>τ_f (flow time)</div>
          <div className="mono font-semibold" style={{ fontSize: 14, color: 'var(--text)' }}>
            {tauF.toFixed(4)} s
          </div>
        </div>
      </div>

      {!stokesValid && (
        <p className="mt-3 rounded-md px-3 py-2 text-xs" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          Re_p = {Re_p.toFixed(1)} &gt; 1 — Stokes drag assumption invalid. Use Schiller-Naumann or Haider-Levenspiel correction.
        </p>
      )}
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Stokes law valid for Re_p ≪ 1. τ_p = ρ_p d_p² / (18μ).
      </p>
    </div>
  )
}

function Field({ label, value, onChange, step, min }: { label: string; value: number; onChange: (n: number) => void; step: number; min?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number" value={value} step={step} min={min}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}
