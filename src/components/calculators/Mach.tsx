'use client'

import { useMemo, useState } from 'react'

// M = U / a, a = sqrt(γ R T)
// 기본값: 공기 25°C
export function MachCalculator() {
  const [U, setU] = useState(340)             // m/s
  const [T, setT] = useState(298)             // K
  const [gamma, setGamma] = useState(1.4)
  const [R, setR] = useState(287)             // J/(kg·K) for air

  const a = useMemo(() => Math.sqrt(gamma * R * T), [gamma, R, T])
  const M = useMemo(() => U / a, [U, a])

  const regime =
    M < 0.3 ? { label: 'Incompressible', color: '#34d399' } :
    M < 0.8 ? { label: 'Subsonic', color: '#22d3ee' } :
    M < 1.2 ? { label: 'Transonic', color: '#fbbf24' } :
    M < 5 ? { label: 'Supersonic', color: '#f97316' } :
    { label: 'Hypersonic', color: '#f87171' }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="U — velocity (m/s)" value={U} onChange={setU} step={1} />
        <Field label="T — temperature (K)" value={T} onChange={setT} step={1} />
        <Field label="γ — specific heat ratio" value={gamma} onChange={setGamma} step={0.01} />
        <Field label="R — gas constant (J/kg·K)" value={R} onChange={setR} step={1} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>a — sound speed</div>
          <div className="mono mt-1 tabular-nums" style={{ fontSize: 22, color: 'var(--text)' }}>{a.toFixed(1)} m/s</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: `2px solid ${regime.color}` }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>M</div>
          <div className="mono mt-1 tabular-nums" style={{ fontSize: 22, color: regime.color, fontWeight: 700 }}>{M.toFixed(3)} · {regime.label}</div>
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        M &lt; 0.3 incompressible, 0.3–0.8 subsonic, 0.8–1.2 transonic, 1.2–5 supersonic, &gt; 5 hypersonic.
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
