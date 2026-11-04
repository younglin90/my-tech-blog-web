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
  const ranged = min != null && max != null && Number.isFinite(min) && Number.isFinite(max) && max > min
  const log = ranged && min > 0 && max / min >= 100
  const slider = ranged
    ? log
      ? (Math.log(Math.min(max, Math.max(min, value))) - Math.log(min)) / (Math.log(max) - Math.log(min))
      : (Math.min(max, Math.max(min, value)) - min) / (max - min)
    : 0

  const fromSlider = (position: number) => {
    if (!ranged) return value
    const next = log
      ? Math.exp(Math.log(min) + position * (Math.log(max) - Math.log(min)))
      : min + position * (max - min)
    const snapped = step > 0 ? Math.round(next / step) * step : next
    return Math.min(max, Math.max(min, snapped))
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="mono rounded-md px-2.5 py-2 text-sm tabular-nums focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
      />
      {ranged && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={Number.isFinite(slider) ? slider : 0}
          aria-label={label}
          onChange={(e) => onChange(fromSlider(parseFloat(e.target.value)))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{ accentColor: 'var(--accent)' }}
        />
      )}
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
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md px-2.5 py-2 text-sm focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
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
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}` }}>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono mt-1 tabular-nums" style={{ fontSize: 18, fontWeight: 650, color: 'var(--text)', letterSpacing: '-0.02em' }}>{value}</div>
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
