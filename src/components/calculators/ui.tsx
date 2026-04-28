'use client'

import type { ReactNode } from 'react'

export function CalculatorPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step: number
  min?: number
  max?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

export function MetricCard({
  label,
  value,
  color = 'var(--text)',
}: {
  label: string
  value: string
  color?: string
}) {
  const numeric = Number.parseFloat(value.replace(/,/g, ''))
  const hasScale = Number.isFinite(numeric)
  const scale = hasScale
    ? Math.min(100, Math.max(8, ((Math.log10(Math.abs(numeric) + 1e-12) + 6) / 12) * 100))
    : 0

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono mt-1 tabular-nums font-bold" style={{ fontSize: 18, color }}>{value}</div>
      {hasScale && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ background: 'rgba(148,163,184,0.16)' }}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${scale}%`,
              background: `linear-gradient(90deg, ${color}, var(--accent))`,
              boxShadow: `0 0 14px ${color}`,
            }}
          />
        </div>
      )}
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

export function formatNumber(value: number, digits = 4) {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if ((abs !== 0 && abs < 1e-4) || abs >= 1e4) return value.toExponential(3)
  return value.toFixed(digits)
}
