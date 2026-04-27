'use client'

import { useMemo, useState } from 'react'
import { normalShockFromM1 } from '@/lib/compressible'

export function NormalShockCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [M1, setM1] = useState(2)
  const s = useMemo(() => normalShockFromM1(M1, gamma), [M1, gamma])

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="γ (ratio of specific heats)" value={gamma} step={0.01} onChange={setGamma} />
        <Field label="Upstream Mach M1 (>1)" value={M1} step={0.01} onChange={setM1} />
      </div>

      {!s && (
        <p className="mt-4 text-sm" style={{ color: 'var(--error)' }}>
          Normal shock requires M1 &gt; 1.
        </p>
      )}

      {s && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Row k="M1" v={fmt(s.M1)} />
          <Row k="M2" v={fmt(s.M2)} />
          <Row k="p2/p1" v={fmt(s.p2_p1)} />
          <Row k="ρ2/ρ1" v={fmt(s.rho2_rho1)} />
          <Row k="T2/T1" v={fmt(s.T2_T1)} />
          <Row k="p02/p01" v={fmt(s.p02_p01)} />
          <Row k="p1/p02" v={fmt(s.p1_p02)} />
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
