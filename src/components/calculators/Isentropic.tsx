'use client'

import { useMemo, useState } from 'react'
import {
  isentropicFromMach,
  isentropicMachFromAreaRatio,
  isentropicMachFromPressureRatio,
  isentropicMachFromPrandtlMeyer,
  isentropicMachFromTempRatio,
} from '@/lib/compressible'

type InputMode = 'mach' | 'p_p0' | 't_t0' | 'a_astar' | 'nu'

export function IsentropicCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [mode, setMode] = useState<InputMode>('mach')
  const [inputValue, setInputValue] = useState(2)
  const [branch, setBranch] = useState<'supersonic' | 'subsonic'>('supersonic')

  const mach = useMemo(() => {
    switch (mode) {
      case 'mach':
        return inputValue > 0 ? inputValue : null
      case 'p_p0':
        return isentropicMachFromPressureRatio(inputValue, gamma)
      case 't_t0':
        return isentropicMachFromTempRatio(inputValue, gamma)
      case 'a_astar':
        return isentropicMachFromAreaRatio(inputValue, gamma, branch)
      case 'nu':
        return isentropicMachFromPrandtlMeyer(inputValue, gamma)
      default:
        return null
    }
  }, [mode, inputValue, gamma, branch])

  const s = useMemo(() => (mach ? isentropicFromMach(mach, gamma) : null), [mach, gamma])

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="γ (ratio of specific heats)" value={gamma} step={0.01} onChange={setGamma} />
        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Input mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as InputMode)}
            className="rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="mach">Mach number M</option>
            <option value="p_p0">p/p0</option>
            <option value="t_t0">T/T0</option>
            <option value="a_astar">A/A*</option>
            <option value="nu">Prandtl-Meyer angle ν (deg)</option>
          </select>
        </label>
        <Field
          label={
            mode === 'mach' ? 'M' :
            mode === 'p_p0' ? 'p/p0' :
            mode === 't_t0' ? 'T/T0' :
            mode === 'a_astar' ? 'A/A*' :
            'ν (deg)'
          }
          value={inputValue}
          step={0.01}
          onChange={setInputValue}
        />
        {mode === 'a_astar' ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Branch</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as 'supersonic' | 'subsonic')}
              className="rounded-md px-2.5 py-1.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="supersonic">supersonic</option>
              <option value="subsonic">subsonic</option>
            </select>
          </label>
        ) : <div />}
      </div>

      {!s && (
        <p className="mt-4 text-sm" style={{ color: 'var(--error)' }}>
          Invalid input range for selected relation.
        </p>
      )}

      {s && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Row k="M" v={fmt(s.M)} />
          <Row k="μ (Mach angle, deg)" v={s.muDeg === null ? 'N/A (M<1)' : fmt(s.muDeg)} />
          <Row k="ν (P-M angle, deg)" v={s.nuDeg === null ? 'N/A (M<1)' : fmt(s.nuDeg)} />
          <Row k="p/p0" v={fmt(s.p_p0)} />
          <Row k="ρ/ρ0" v={fmt(s.rho_rho0)} />
          <Row k="T/T0" v={fmt(s.T_T0)} />
          <Row k="p/p*" v={fmt(s.p_pStar)} />
          <Row k="ρ/ρ*" v={fmt(s.rho_rhoStar)} />
          <Row k="T/T*" v={fmt(s.T_TStar)} />
          <Row k="A/A*" v={fmt(s.A_AStar)} />
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
