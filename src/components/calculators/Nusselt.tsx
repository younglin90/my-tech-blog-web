'use client'

import { useMemo, useState } from 'react'

// h = Nu · k / L
// 평판 층류: Pohlhausen 평균 Nu. 평판 난류: 앞전에서 난류로 가정한 평균 Nu.
// 관 난류: Dittus–Boelter 가열 (n = 0.4).
type Correlation = 'flat-laminar' | 'flat-turbulent' | 'pipe-turbulent'

export function NusseltCalculator() {
  const [Re, setRe] = useState(20000)
  const [Pr, setPr] = useState(0.71)      // air
  const [k, setK] = useState(0.026)       // W/m·K (air 20°C)
  const [L, setL] = useState(0.1)         // m
  const [mode, setMode] = useState<Correlation>('pipe-turbulent')

  const { Nu, h, regime, valid } = useMemo(() => {
    let Nu = 0, regime = '', valid = true
    if (mode === 'flat-laminar') {
      if (Re > 5e5) { valid = false; regime = 'Re > 5×10⁵ — use turbulent' }
      else { Nu = 0.664 * Math.pow(Re, 0.5) * Math.pow(Pr, 1/3); regime = 'Flat plate laminar (Pohlhausen)' }
    } else if (mode === 'flat-turbulent') {
      if (Re < 5e5) { valid = false; regime = 'Re < 5×10⁵ — use laminar' }
      else { Nu = 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1/3); regime = 'Flat plate turbulent average (turbulent from the leading edge)' }
    } else {
      if (Re < 10000 || Pr < 0.6 || Pr > 160) { valid = false; regime = 'Outside Dittus-Boelter range (Re>10⁴, 0.6<Pr<160)' }
      else { Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4); regime = 'Pipe turbulent (Dittus-Boelter, heating)' }
    }
    const h = Nu * k / L
    return { Nu, h, regime, valid }
  }, [Re, Pr, k, L, mode])

  const MODES: { value: Correlation; label: string }[] = [
    { value: 'flat-laminar', label: 'Flat plate — laminar' },
    { value: 'flat-turbulent', label: 'Flat plate — turbulent' },
    { value: 'pipe-turbulent', label: 'Pipe — turbulent' },
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
              color: mode === m.value ? 'var(--on-accent)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Re — Reynolds number" value={Re} onChange={setRe} step={100} min={1} />
        <Field label="Pr — Prandtl number" value={Pr} onChange={setPr} step={0.01} min={0.01} />
        <Field label="k — thermal conductivity (W/m·K)" value={k} onChange={setK} step={0.001} min={1e-4} />
        <Field label="L — length scale (m)" value={L} onChange={setL} step={0.01} min={1e-4} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg p-4" style={{ background: 'var(--bg)', border: `2px solid ${valid ? '#22d3ee' : '#f87171'}` }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Nu</div>
          <div className="mono mt-1 tabular-nums font-bold" style={{ fontSize: 28, color: valid ? 'var(--text)' : '#f87171' }}>
            {valid ? Nu.toFixed(1) : '—'}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>h  (W/m²·K)</div>
          <div className="mono mt-1 tabular-nums font-bold" style={{ fontSize: 28, color: 'var(--accent)' }}>
            {valid ? h.toFixed(2) : '—'}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs" style={{ color: valid ? 'var(--text-muted)' : '#f87171' }}>
        {regime}
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
