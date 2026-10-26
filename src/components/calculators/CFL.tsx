'use client'

import { useMemo, useState } from 'react'

// C = u Δt / Δx
export function CFLCalculator() {
  const [u, setU] = useState(1.0)        // m/s
  const [dt, setDt] = useState(0.001)    // s
  const [dx, setDx] = useState(0.01)     // m
  const [Cmax, setCmax] = useState(0.5)  // 일반적 explicit 한계

  const C = useMemo(() => (u * dt) / dx, [u, dt, dx])
  const dtMax = useMemo(() => (Cmax * dx) / u, [Cmax, dx, u])
  const safe = C <= Cmax

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="u — wave speed (m/s)" value={u} onChange={setU} step={0.1} />
        <Field label="Δt — time step (s)" value={dt} onChange={setDt} step={0.0001} />
        <Field label="Δx — grid spacing (m)" value={dx} onChange={setDx} step={0.001} />
        <Field label="C_max (1 upwind Euler, about 2 for RK4 advection)" value={Cmax} onChange={setCmax} step={0.05} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: `2px solid ${safe ? '#34d399' : '#f87171'}` }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>C (current)</div>
          <div className="mono mt-1 tabular-nums" style={{ fontSize: 22, color: safe ? '#34d399' : '#f87171', fontWeight: 700 }}>
            {C.toFixed(4)} {safe ? '✓ stable' : '✗ unstable'}
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Δt_max for current Δx</div>
          <div className="mono mt-1 tabular-nums" style={{ fontSize: 22, color: 'var(--text)' }}>
            {dtMax.toExponential(3)} s
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Explicit Euler 1-D advection: C_max = 1. Higher-order RK (e.g., RK4) typically allows C ≈ 1.4–2 for advection,
        but viscous & non-linear terms add tighter limits.
      </p>
    </div>
  )
}

function Field({ label, value, onChange, step }: { label: string; value: number; onChange: (n: number) => void; step: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number" value={value} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}
