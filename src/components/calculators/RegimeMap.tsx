'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function logRePosition(re: number) {
  return clamp((Math.log10(Math.max(re, 1e-6)) + 2) / 10, 0, 1)
}

function machPosition(mach: number) {
  return clamp(mach / 5, 0, 1)
}

export function FlowRegimeMapCalculator() {
  const [re, setRe] = useState(1e5)
  const [mach, setMach] = useState(0.25)

  const result = useMemo(() => {
    const viscous = re < 1 ? 'creeping' : re < 2300 ? 'laminar' : re < 4000 ? 'transition' : 'turbulent'
    const compressible = mach < 0.3 ? 'incompressible' : mach < 0.8 ? 'subsonic compressible' : mach < 1.2 ? 'transonic' : mach < 5 ? 'supersonic' : 'hypersonic'
    const x = 70 + logRePosition(re) * 520
    const y = 300 - machPosition(mach) * 240
    return { viscous, compressible, x, y }
  }, [mach, re])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Re" value={re} onChange={setRe} step={1000} min={1e-6} />
        <NumberField label="Mach" value={mach} onChange={setMach} step={0.05} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Flow regime map">
          <defs>
            <linearGradient id="regimeLaminar" x1="0" x2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="regimeTurbulent" x1="0" x2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          <rect x="70" y="60" width="520" height="240" rx="14" fill="#08111f" />
          <rect x="70" y="60" width="312" height="240" rx="14" fill="url(#regimeLaminar)" />
          <rect x="382" y="60" width="208" height="240" rx="14" fill="url(#regimeTurbulent)" />
          <rect x="70" y="46" width="520" height="43" fill="#22d3ee" opacity="0.08" />
          <rect x="70" y="98" width="520" height="58" fill="#fbbf24" opacity="0.08" />
          <rect x="70" y="156" width="520" height="144" fill="#f87171" opacity="0.08" />

          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
            <g key={`x-${t}`}>
              <line x1={70 + t * 520} x2={70 + t * 520} y1="60" y2="300" stroke="rgba(148,163,184,0.18)" />
            </g>
          ))}
          {[0, 0.3, 0.8, 1.2, 5].map((m) => {
            const y = 300 - machPosition(m) * 240
            return <line key={`m-${m}`} x1="70" x2="590" y1={y} y2={y} stroke="rgba(226,232,240,0.2)" strokeDasharray="4 4" />
          })}

          <line x1={result.x} x2={result.x} y1="60" y2="300" stroke="#22d3ee" strokeOpacity="0.8" />
          <line x1="70" x2="590" y1={result.y} y2={result.y} stroke="#22d3ee" strokeOpacity="0.8" />
          <circle cx={result.x} cy={result.y} r="10" fill="#22d3ee" />
          <circle cx={result.x} cy={result.y} r="18" fill="none" stroke="#22d3ee" strokeOpacity="0.35">
            <animate attributeName="r" values="13;24;13" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2s" repeatCount="indefinite" />
          </circle>

          <text x="70" y="332" fill="var(--text-muted)" fontSize="12">Re = 10^-2</text>
          <text x="292" y="332" fill="var(--text-muted)" fontSize="12">10^3</text>
          <text x="552" y="332" fill="var(--text-muted)" fontSize="12">10^8</text>
          <text x="18" y="303" fill="var(--text-muted)" fontSize="12">M 0</text>
          <text x="18" y="161" fill="var(--text-muted)" fontSize="12">M 3</text>
          <text x="18" y="65" fill="var(--text-muted)" fontSize="12">M 5</text>

          <text x="90" y="86" fill="#67e8f9" fontSize="12" fontWeight="700">low Mach</text>
          <text x="90" y="137" fill="#fde68a" fontSize="12" fontWeight="700">transonic band</text>
          <text x="90" y="191" fill="#fecaca" fontSize="12" fontWeight="700">supersonic / shock-aware</text>
          <text x="420" y="282" fill="#fed7aa" fontSize="12" fontWeight="700">high Re turbulence</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="viscous regime" value={result.viscous} color="#22d3ee" />
        <MetricCard label="compressibility" value={result.compressible} color="#fbbf24" />
        <MetricCard label="position" value={`Re ${formatNumber(re)}, M ${formatNumber(mach)}`} color="#34d399" />
      </div>
      <Note>Use this map as a first-pass setup check: numerical schemes, turbulence models, and boundary conditions change by region.</Note>
    </CalculatorPanel>
  )
}
