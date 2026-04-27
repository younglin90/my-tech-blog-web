'use client'

import { useMemo, useState } from 'react'
import { maxObliqueThetaDeg, obliqueShockFromBeta, obliqueShockFromTheta } from '@/lib/compressible'

export function ObliqueShockCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [M1, setM1] = useState(2.5)
  const [mode, setMode] = useState<'theta' | 'beta'>('theta')
  const [value, setValue] = useState(12)
  const [branch, setBranch] = useState<'weak' | 'strong'>('weak')

  const thetaMax = useMemo(() => (M1 > 1 ? maxObliqueThetaDeg(M1, gamma) : 0), [M1, gamma])
  const s = useMemo(() => {
    if (mode === 'theta') return obliqueShockFromTheta(M1, value, gamma, branch)
    return obliqueShockFromBeta(M1, value, gamma)
  }, [M1, value, gamma, mode, branch])

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="γ (ratio of specific heats)" value={gamma} step={0.01} onChange={setGamma} />
        <Field label="Upstream Mach M1 (>1)" value={M1} step={0.01} onChange={setM1} />
        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Input mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'theta' | 'beta')}
            className="rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="theta">Turn angle θ (deg)</option>
            <option value="beta">Wave angle β (deg)</option>
          </select>
        </label>
        <Field
          label={mode === 'theta' ? 'θ (deg)' : 'β (deg)'}
          value={value}
          step={0.01}
          onChange={setValue}
        />
        {mode === 'theta' ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Solution branch</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as 'weak' | 'strong')}
              className="rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="weak">weak shock</option>
              <option value="strong">strong shock</option>
            </select>
          </label>
        ) : <div />}
      </div>

      <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
        θmax for current M1, γ: {fmt(thetaMax)} deg
      </p>

      {!s && (
        <p className="mt-4 text-sm" style={{ color: 'var(--error)' }}>
          No attached-shock solution for this input (try smaller θ or use β input).
        </p>
      )}

      {s && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Row k="M2" v={fmt(s.M2)} />
          <Row k="θ (deg)" v={fmt(s.thetaDeg)} />
          <Row k="β (deg)" v={fmt(s.betaDeg)} />
          <Row k="M1n" v={fmt(s.M1n)} />
          <Row k="M2n" v={fmt(s.M2n)} />
          <Row k="p2/p1" v={fmt(s.p2_p1)} />
          <Row k="ρ2/ρ1" v={fmt(s.rho2_rho1)} />
          <Row k="T2/T1" v={fmt(s.T2_T1)} />
          <Row k="p02/p01" v={fmt(s.p02_p01)} />
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
