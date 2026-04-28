'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function yForResidual(value: number) {
  const log = Math.log10(Math.max(value, 1e-12))
  return 300 - clamp((log + 12) / 12, 0, 1) * 230
}

function xForIteration(iteration: number, maxIteration: number) {
  return 80 + clamp(iteration / Math.max(maxIteration, 1), 0, 1) * 500
}

export function ResidualConvergenceAnalyzerCalculator() {
  const [initialResidual, setInitialResidual] = useState(1)
  const [currentResidual, setCurrentResidual] = useState(2e-4)
  const [iterations, setIterations] = useState(350)
  const [targetResidual, setTargetResidual] = useState(1e-5)

  const result = useMemo(() => {
    const safeInitial = Math.max(initialResidual, 1e-12)
    const safeCurrent = Math.max(currentResidual, 1e-12)
    const safeTarget = Math.max(targetResidual, 1e-12)
    const safeIterations = Math.max(iterations, 1)
    const ordersDropped = Math.log10(safeInitial / safeCurrent)
    const slope = ordersDropped / safeIterations
    const remainingOrders = Math.max(0, Math.log10(safeCurrent / safeTarget))
    const etaIterations = slope > 0 ? Math.ceil(remainingOrders / slope) : Number.POSITIVE_INFINITY
    const projectedTotal = Number.isFinite(etaIterations) ? safeIterations + etaIterations : Number.POSITIVE_INFINITY
    const status = safeCurrent <= safeTarget ? 'target reached' : slope > 0 ? 'converging' : 'stalled or diverging'
    const maxIteration = Math.max(projectedTotal, safeIterations, 10)
    const currentX = xForIteration(safeIterations, maxIteration)
    const targetX = Number.isFinite(projectedTotal) ? xForIteration(projectedTotal, maxIteration) : 580
    return {
      safeInitial,
      safeCurrent,
      safeTarget,
      safeIterations,
      ordersDropped,
      slope,
      remainingOrders,
      etaIterations,
      projectedTotal,
      status,
      maxIteration,
      currentX,
      targetX,
    }
  }, [currentResidual, initialResidual, iterations, targetResidual])

  const startY = yForResidual(result.safeInitial)
  const currentY = yForResidual(result.safeCurrent)
  const targetY = yForResidual(result.safeTarget)
  const projectedPath = `M80 ${startY.toFixed(1)} L${result.currentX.toFixed(1)} ${currentY.toFixed(1)} L${result.targetX.toFixed(1)} ${targetY.toFixed(1)}`

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="initial residual" value={initialResidual} onChange={setInitialResidual} step={0.1} min={1e-12} />
        <NumberField label="current residual" value={currentResidual} onChange={setCurrentResidual} step={0.0001} min={1e-12} />
        <NumberField label="iterations so far" value={iterations} onChange={setIterations} step={10} min={1} />
        <NumberField label="target residual" value={targetResidual} onChange={setTargetResidual} step={0.00001} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Residual convergence plot">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          {[1, 1e-2, 1e-4, 1e-6, 1e-8, 1e-10, 1e-12].map((tick) => (
            <g key={tick}>
              <line x1="80" x2="580" y1={yForResidual(tick)} y2={yForResidual(tick)} stroke="rgba(148,163,184,0.18)" strokeDasharray="5 5" />
              <text x="22" y={yForResidual(tick) + 4} fill="var(--text-muted)" fontSize="11">{tick.toExponential(0)}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={80 + t * 500} x2={80 + t * 500} y1="70" y2="300" stroke="rgba(148,163,184,0.13)" />
              <text x={70 + t * 500} y="328" fill="var(--text-muted)" fontSize="11">{Math.round(t * result.maxIteration)}</text>
            </g>
          ))}

          <rect x="80" y={targetY - 9} width="500" height="18" fill="#22d3ee" opacity="0.1" />
          <line x1="80" x2="580" y1={targetY} y2={targetY} stroke="#22d3ee" strokeOpacity="0.75" strokeDasharray="7 5" />
          <path d={projectedPath} fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M80 ${startY.toFixed(1)} L${result.currentX.toFixed(1)} ${currentY.toFixed(1)}`} fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />

          <circle cx="80" cy={startY} r="7" fill="#94a3b8" />
          <circle cx={result.currentX} cy={currentY} r="10" fill="#34d399" />
          <circle cx={result.targetX} cy={targetY} r="9" fill="#22d3ee" />
          <circle cx={result.currentX} cy={currentY} r="18" fill="none" stroke="#34d399" strokeOpacity="0.35">
            <animate attributeName="r" values="12;24;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.08;0.5" dur="2s" repeatCount="indefinite" />
          </circle>

          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Residual drop forecast</text>
          <text x="462" y={targetY - 14} fill="#67e8f9" fontSize="12">target residual</text>
          <text x={result.currentX - 34} y={currentY - 20} fill="#bbf7d0" fontSize="12">current</text>
          <text x="292" y="350" fill="var(--text-muted)" fontSize="12">iteration</text>
          <text x="10" y="202" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 10 202)">residual</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="orders dropped" value={formatNumber(result.ordersDropped)} color="#34d399" />
        <MetricCard label="orders / iter" value={formatNumber(result.slope, 6)} color="#fbbf24" />
        <MetricCard label="ETA iterations" value={Number.isFinite(result.etaIterations) ? formatNumber(result.etaIterations, 0) : '—'} color="#22d3ee" />
        <MetricCard label="status" value={result.status} color={result.status === 'converging' ? '#34d399' : '#fb7185'} />
      </div>
      <Note>Residuals are not the only convergence criterion. Pair this trend check with force, mass-balance, and probe-history monitors.</Note>
    </CalculatorPanel>
  )
}
