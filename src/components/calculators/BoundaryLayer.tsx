'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, type Locale } from '@/lib/i18n'

const REGIME: Record<Locale, { lead: string; turbulent: string; laminar: string }> = {
  ko: { lead: '평판 천이는 Re_x ≈ 5×10⁵ 근처입니다. 이 위치는', turbulent: '난류 영역', laminar: '층류 영역' },
  en: { lead: 'Flat-plate transition sits near Re_x ≈ 5×10⁵. This station is', turbulent: 'turbulent', laminar: 'laminar' },
  ja: { lead: '平板の遷移は Re_x ≈ 5×10⁵ 付近です。この位置は', turbulent: '乱流側', laminar: '層流側' },
  zh: { lead: '平板转捩大约在 Re_x ≈ 5×10⁵。此处处于', turbulent: '湍流区', laminar: '层流区' },
  es: { lead: 'La transición en placa plana está cerca de Re_x ≈ 5×10⁵. Esta estación es', turbulent: 'turbulenta', laminar: 'laminar' },
}

// 평판 BL 두께
//   δ_lam ≈ 5 x / sqrt(Re_x)
//   δ_turb ≈ 0.37 x / Re_x^(1/5)
export function BoundaryLayerCalculator() {
  const [U, setU] = useState(10)            // m/s
  const [x, setX] = useState(1)             // m
  const [nu, setNu] = useState(1.5e-5)      // m²/s (공기)

  const { locale } = localePathPrefix(usePathname() ?? '/')
  const copy = REGIME[locale]
  const Rex = useMemo(() => (U * x) / nu, [U, x, nu])
  const dLam = useMemo(() => (5 * x) / Math.sqrt(Rex), [x, Rex])
  const dTurb = useMemo(() => (0.37 * x) / Math.pow(Rex, 0.2), [x, Rex])
  const transition = Rex > 5e5

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="U∞ (m/s)" value={U} onChange={setU} step={0.1} />
        <Field label="x — distance (m)" value={x} onChange={setX} step={0.01} />
        <Field label="ν — kinematic visc. (m²/s)" value={nu} onChange={setNu} step={1e-6} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Re_x" value={Rex < 100000 ? Rex.toFixed(0) : Rex.toExponential(2)} />
        <Stat label="δ laminar (mm)" value={(dLam * 1000).toFixed(2)} color="#34d399" />
        <Stat label="δ turbulent (mm)" value={(dTurb * 1000).toFixed(2)} color="#f87171" />
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {copy.lead} <strong style={{ color: transition ? '#f87171' : '#34d399' }}>{transition ? copy.turbulent : copy.laminar}</strong>.
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

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: `1px solid ${color ?? 'var(--border)'}` }}>
      <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono mt-1 tabular-nums" style={{ fontSize: 18, color: color ?? 'var(--text)', fontWeight: 600 }}>{value}</div>
    </div>
  )
}
