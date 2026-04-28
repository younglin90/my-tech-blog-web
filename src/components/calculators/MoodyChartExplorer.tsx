'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function frictionFactor(re: number, epsOverD: number): number {
  if (!Number.isFinite(re) || re <= 0) return Number.NaN
  if (re < 2300) return 64 / re

  let f = 0.25 / Math.log10(epsOverD / 3.7 + 5.74 / Math.pow(re, 0.9)) ** 2
  for (let i = 0; i < 16; i++) {
    const inv = -2 * Math.log10(epsOverD / 3.7 + 2.51 / (re * Math.sqrt(f)))
    f = 1 / (inv * inv)
  }
  return f
}

function xForRe(re: number) {
  return 70 + clamp((Math.log10(re) - 3) / 5, 0, 1) * 520
}

function yForF(f: number) {
  return 300 - clamp((Math.log10(f) - Math.log10(0.008)) / (Math.log10(0.1) - Math.log10(0.008)), 0, 1) * 230
}

function curvePath(epsOverD: number) {
  const points: string[] = []
  for (let i = 0; i <= 90; i++) {
    const logRe = 3 + (5 * i) / 90
    const re = 10 ** logRe
    const f = frictionFactor(re, epsOverD)
    points.push(`${i === 0 ? 'M' : 'L'}${xForRe(re).toFixed(1)} ${yForF(f).toFixed(1)}`)
  }
  return points.join(' ')
}

export function MoodyChartExplorerCalculator() {
  const [re, setRe] = useState(1e5)
  const [epsOverD, setEpsOverD] = useState(0.0001)

  const result = useMemo(() => {
    const f = frictionFactor(re, epsOverD)
    const regime = re < 2300 ? 'laminar' : re < 4000 ? 'transition' : 'turbulent'
    const x = xForRe(re)
    const y = yForF(f)
    const headLossPerD = Number.isFinite(f) ? f / 2 : Number.NaN
    return { f, regime, x, y, headLossPerD }
  }, [epsOverD, re])

  const roughnessCurves = [
    { eps: 0, label: 'smooth', color: '#22d3ee' },
    { eps: 0.00001, label: '1e-5', color: '#34d399' },
    { eps: 0.0001, label: '1e-4', color: '#fbbf24' },
    { eps: 0.001, label: '1e-3', color: '#fb7185' },
    { eps: 0.01, label: '1e-2', color: '#a78bfa' },
  ]

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Re" value={re} onChange={setRe} step={1000} min={1} />
        <NumberField label="epsilon / D" value={epsOverD} onChange={setEpsOverD} step={0.00001} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Interactive Moody chart">
          <rect x="70" y="70" width="520" height="230" rx="14" fill="#08111f" />
          <rect x={xForRe(1e3)} y="70" width={xForRe(2300) - xForRe(1e3)} height="230" fill="#34d399" opacity="0.08" />
          <rect x={xForRe(2300)} y="70" width={xForRe(4000) - xForRe(2300)} height="230" fill="#fbbf24" opacity="0.1" />
          <rect x={xForRe(4000)} y="70" width={xForRe(1e8) - xForRe(4000)} height="230" fill="#ef4444" opacity="0.08" />

          {[1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map((tick) => (
            <g key={tick}>
              <line x1={xForRe(tick)} x2={xForRe(tick)} y1="70" y2="300" stroke="rgba(148,163,184,0.17)" />
              <text x={xForRe(tick) - 12} y="326" fill="var(--text-muted)" fontSize="11">{`1e${Math.log10(tick)}`}</text>
            </g>
          ))}
          {[0.01, 0.02, 0.04, 0.08].map((tick) => (
            <g key={tick}>
              <line x1="70" x2="590" y1={yForF(tick)} y2={yForF(tick)} stroke="rgba(148,163,184,0.17)" />
              <text x="24" y={yForF(tick) + 4} fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}

          <path d={`M${xForRe(1e3)} ${yForF(64 / 1e3)} L${xForRe(2300)} ${yForF(64 / 2300)}`} fill="none" stroke="#67e8f9" strokeWidth="2.5" />
          {roughnessCurves.map((curve) => (
            <path key={curve.label} d={curvePath(curve.eps)} fill="none" stroke={curve.color} strokeWidth="2" strokeOpacity="0.82" />
          ))}

          <line x1={result.x} x2={result.x} y1="70" y2="300" stroke="#f8fafc" strokeOpacity="0.45" strokeDasharray="4 4" />
          <line x1="70" x2="590" y1={result.y} y2={result.y} stroke="#f8fafc" strokeOpacity="0.45" strokeDasharray="4 4" />
          <circle cx={result.x} cy={result.y} r="9" fill="#22d3ee" />
          <circle cx={result.x} cy={result.y} r="17" fill="none" stroke="#22d3ee" strokeOpacity="0.35">
            <animate attributeName="r" values="12;24;12" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.08;0.5" dur="2.4s" repeatCount="indefinite" />
          </circle>

          <text x="72" y="50" fill="var(--text)" fontSize="15" fontWeight="700">Darcy friction factor map</text>
          <text x="404" y="50" fill="var(--text-muted)" fontSize="12">curves: relative roughness epsilon / D</text>
          <text x="92" y="94" fill="#6ee7b7" fontSize="12" fontWeight="700">laminar</text>
          <text x={xForRe(2600)} y="94" fill="#fde68a" fontSize="12" fontWeight="700">transition</text>
          <text x={xForRe(1.5e4)} y="94" fill="#fecaca" fontSize="12" fontWeight="700">turbulent</text>
          <text x="306" y="350" fill="var(--text-muted)" fontSize="12">Reynolds number</text>
          <text x="8" y="188" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 8 188)">Darcy f</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Darcy f" value={formatNumber(result.f, 5)} color="#22d3ee" />
        <MetricCard label="regime" value={result.regime} color={result.regime === 'turbulent' ? '#fb7185' : '#34d399'} />
        <MetricCard label="head loss per D / q" value={formatNumber(result.headLossPerD, 5)} color="#fbbf24" />
      </div>
      <Note>The marker shows where your pipe case sits. Move Re and roughness to see why smooth turbulent flow and rough turbulent flow diverge.</Note>
    </CalculatorPanel>
  )
}
