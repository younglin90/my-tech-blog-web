'use client'

import { useMemo, useState } from 'react'
import { rayleighFromMach } from '@/lib/compressible'

export function RayleighCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [M, setM] = useState(0.5)
  const s = useMemo(() => rayleighFromMach(M, gamma), [M, gamma])

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="γ (ratio of specific heats)" value={gamma} step={0.01} onChange={setGamma} />
        <Field label="Mach number M" value={M} step={0.01} onChange={setM} />
      </div>

      {!s && (
        <p className="mt-4 text-sm" style={{ color: 'var(--error)' }}>
          Invalid input.
        </p>
      )}

      {s && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Row k="M" v={fmt(s.M)} />
          <Row k="T0/T0*" v={fmt(s.T0_T0Star)} />
          <Row k="T/T*" v={fmt(s.T_TStar)} />
          <Row k="P/P*" v={fmt(s.P_PStar)} />
          <Row k="P0/P0*" v={fmt(s.P0_P0Star)} />
          <Row k="U/U*" v={fmt(s.U_UStar)} />
          <Row k="(s* - s)/R" v={fmt(s.sStarMinusS_over_R)} />
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</span>
      <span className="mono tabular-nums text-sm" style={{ color: 'var(--text)' }}>{v}</span>
    </div>
  )
}

function Field({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
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

function fmt(x: number): string {
  if (!Number.isFinite(x)) return '—'
  if (Math.abs(x) >= 1e4 || Math.abs(x) < 1e-4) return x.toExponential(4)
  return x.toFixed(6)
}
