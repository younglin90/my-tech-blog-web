'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function relaxationColor(alpha: number) {
  if (alpha < 0.25) return '#22d3ee'
  if (alpha < 0.7) return '#34d399'
  if (alpha < 0.9) return '#fbbf24'
  return '#fb7185'
}

function relaxationLabel(alpha: number) {
  if (alpha < 0.25) return 'very damped'
  if (alpha < 0.7) return 'balanced'
  if (alpha < 0.9) return 'aggressive'
  return 'high risk'
}

export function UnderRelaxationPlannerCalculator() {
  const [alpha, setAlpha] = useState(0.5)
  const [rawCorrection, setRawCorrection] = useState(1)
  const [iterations, setIterations] = useState(12)
  const [initialResidual, setInitialResidual] = useState(1)

  const result = useMemo(() => {
    const a = clamp(alpha, 0.001, 1)
    const appliedCorrection = a * rawCorrection
    const withheldCorrection = (1 - a) * rawCorrection
    const residualAfterN = initialResidual * (1 - a) ** Math.max(iterations, 0)
    const iterationsTo95 = a < 1 ? Math.log(0.05) / Math.log(1 - a) : 1
    const overshootRisk = clamp((a - 0.7) / 0.3, 0, 1)
    return { a, appliedCorrection, withheldCorrection, residualAfterN, iterationsTo95, overshootRisk, label: relaxationLabel(a), color: relaxationColor(a) }
  }, [alpha, initialResidual, iterations, rawCorrection])

  const points = Array.from({ length: 24 }, (_, i) => {
    const x = 92 + i * 20
    const value = initialResidual * (1 - result.a) ** i
    const y = 292 - clamp(Math.log10(value + 1e-8) + 8, 0, 8) * 26
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="relaxation alpha" value={alpha} onChange={setAlpha} step={0.05} min={0.001} max={1} />
        <NumberField label="raw correction" value={rawCorrection} onChange={setRawCorrection} step={0.1} />
        <NumberField label="iterations" value={iterations} onChange={setIterations} step={1} min={0} />
        <NumberField label="initial residual" value={initialResidual} onChange={setInitialResidual} step={0.1} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Under-relaxation planner">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Under-relaxation response</text>

          <g transform="translate(88 88)">
            <rect x="0" y="0" width="210" height="48" rx="12" fill="rgba(148,163,184,0.14)" />
            <rect x="0" y="0" width={210 * result.a} height="48" rx="12" fill={result.color} opacity="0.78" />
            <text x="12" y="30" fill="#08111f" fontSize="13" fontWeight="700">applied correction</text>
            <text x="0" y="68" fill="var(--text-muted)" fontSize="12">alpha damps each nonlinear correction before update</text>
          </g>

          <g transform="translate(380 74)">
            <circle cx="78" cy="78" r="58" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="13" />
            <path
              d={`M78 20 A58 58 0 ${result.overshootRisk > 0.5 ? 1 : 0} 1 ${78 + Math.sin(result.overshootRisk * Math.PI * 2) * 58} ${78 - Math.cos(result.overshootRisk * Math.PI * 2) * 58}`}
              fill="none"
              stroke={result.color}
              strokeWidth="13"
              strokeLinecap="round"
            />
            <text x="42" y="84" fill={result.color} fontSize="14" fontWeight="700">{`${Math.round(result.overshootRisk * 100)}% risk`}</text>
          </g>

          <g>
            {[1, 1e-2, 1e-4, 1e-6].map((tick) => {
              const y = 292 - clamp(Math.log10(tick + 1e-8) + 8, 0, 8) * 26
              return (
                <g key={tick}>
                  <line x1="92" x2="552" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="5 5" />
                  <text x="64" y={y + 4} fill="var(--text-muted)" fontSize="10">{tick.toExponential(0)}</text>
                </g>
              )
            })}
            <path d={points} fill="none" stroke={result.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={92 + Math.min(Math.max(iterations, 0), 23) * 20} cy={292 - clamp(Math.log10(result.residualAfterN + 1e-8) + 8, 0, 8) * 26} r="9" fill={result.color} />
            <text x="250" y="334" fill="var(--text-muted)" fontSize="12">idealized residual damping per nonlinear iteration</text>
          </g>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="applied correction" value={formatNumber(result.appliedCorrection)} color={result.color} />
        <MetricCard label="withheld correction" value={formatNumber(result.withheldCorrection)} color="#22d3ee" />
        <MetricCard label="residual after N" value={formatNumber(result.residualAfterN)} color="#34d399" />
        <MetricCard label="iterations to 95% damping" value={formatNumber(result.iterationsTo95)} color="#fbbf24" />
        <MetricCard label="overshoot risk" value={`${formatNumber(result.overshootRisk * 100, 1)}%`} color={result.color} />
        <MetricCard label="setting" value={result.label} color={result.color} />
        <MetricCard label="alpha" value={formatNumber(result.a)} color="#a78bfa" />
        <MetricCard label="raw correction" value={formatNumber(rawCorrection)} color="#22d3ee" />
      </div>
      <Note>This is an intuition tool for nonlinear fixed-point damping. Real stability also depends on mesh quality, discretization, boundary conditions, and coupling strategy.</Note>
    </CalculatorPanel>
  )
}
