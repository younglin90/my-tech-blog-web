'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function balanceColor(errorPercent: number) {
  if (Math.abs(errorPercent) < 0.5) return '#34d399'
  if (Math.abs(errorPercent) < 5) return '#fbbf24'
  return '#fb7185'
}

function balanceLabel(errorPercent: number) {
  if (Math.abs(errorPercent) < 0.5) return 'balanced'
  if (Math.abs(errorPercent) < 5) return 'check setup'
  return 'large continuity error'
}

export function MassFluxBalanceVisualizerCalculator() {
  const [rhoIn, setRhoIn] = useState(1.225)
  const [uIn, setUIn] = useState(25)
  const [aIn, setAIn] = useState(0.08)
  const [nIn, setNIn] = useState(1)
  const [rhoOut, setRhoOut] = useState(1.225)
  const [uOut, setUOut] = useState(20)
  const [aOut, setAOut] = useState(0.1)
  const [nOut, setNOut] = useState(1)
  const [massSource, setMassSource] = useState(0)

  const result = useMemo(() => {
    const mIn = rhoIn * uIn * aIn * nIn
    const mOut = rhoOut * uOut * aOut * nOut
    const expectedOut = mIn + massSource
    const imbalance = expectedOut - mOut
    const reference = Math.max(Math.abs(mIn), Math.abs(mOut), Math.abs(expectedOut), 1e-12)
    const errorPercent = (imbalance / reference) * 100
    const inletWidth = clamp(Math.abs(mIn) / reference, 0.05, 1) * 190
    const outletWidth = clamp(Math.abs(mOut) / reference, 0.05, 1) * 190
    return { mIn, mOut, expectedOut, imbalance, errorPercent, inletWidth, outletWidth, color: balanceColor(errorPercent), label: balanceLabel(errorPercent) }
  }, [aIn, aOut, massSource, nIn, nOut, rhoIn, rhoOut, uIn, uOut])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="rho inlet (kg/m^3)" value={rhoIn} onChange={setRhoIn} step={0.01} min={0} />
        <NumberField label="U inlet (m/s)" value={uIn} onChange={setUIn} step={0.5} />
        <NumberField label="A inlet (m^2)" value={aIn} onChange={setAIn} step={0.01} min={0} />
        <NumberField label="inlet patches" value={nIn} onChange={setNIn} step={1} min={0} />
        <NumberField label="rho outlet (kg/m^3)" value={rhoOut} onChange={setRhoOut} step={0.01} min={0} />
        <NumberField label="U outlet (m/s)" value={uOut} onChange={setUOut} step={0.5} />
        <NumberField label="A outlet (m^2)" value={aOut} onChange={setAOut} step={0.01} min={0} />
        <NumberField label="outlet patches" value={nOut} onChange={setNOut} step={1} min={0} />
        <NumberField label="mass source (kg/s)" value={massSource} onChange={setMassSource} step={0.1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Mass flux balance visualizer">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Continuity balance check</text>

          <rect x="232" y="104" width="196" height="152" rx="22" fill="rgba(148,163,184,0.12)" stroke="rgba(226,232,240,0.28)" strokeWidth="2" />
          <text x="276" y="184" fill="var(--text-muted)" fontSize="13">control volume</text>

          <path d={`M92 180 L${92 + result.inletWidth} 180`} stroke="#22d3ee" strokeWidth="18" strokeLinecap="round" />
          <polygon points={`${104 + result.inletWidth},180 ${82 + result.inletWidth},166 ${82 + result.inletWidth},194`} fill="#22d3ee" />
          <text x="92" y="150" fill="#67e8f9" fontSize="12">{`in: ${formatNumber(result.mIn)} kg/s`}</text>

          <path d={`M428 180 L${428 + result.outletWidth} 180`} stroke="#fbbf24" strokeWidth="18" strokeLinecap="round" />
          <polygon points={`${440 + result.outletWidth},180 ${418 + result.outletWidth},166 ${418 + result.outletWidth},194`} fill="#fbbf24" />
          <text x="448" y="150" fill="#fde68a" fontSize="12">{`out: ${formatNumber(result.mOut)} kg/s`}</text>

          <circle cx="330" cy="226" r={14 + clamp(Math.abs(massSource), 0, 10) * 1.8} fill="none" stroke={massSource >= 0 ? '#34d399' : '#fb7185'} strokeWidth="4" strokeOpacity="0.72" />
          <text x="286" y="286" fill={massSource >= 0 ? '#bbf7d0' : '#fecaca'} fontSize="12">{`source: ${formatNumber(massSource)} kg/s`}</text>

          <rect x="116" y="304" width="430" height="14" rx="7" fill="rgba(148,163,184,0.18)" />
          <rect x="331" y="304" width={clamp(Math.abs(result.errorPercent), 0, 30) / 30 * 215} height="14" rx="7" fill={result.color} transform={result.errorPercent < 0 ? 'scale(-1 1) translate(-662 0)' : undefined} />
          <line x1="331" x2="331" y1="296" y2="326" stroke="rgba(226,232,240,0.44)" />
          <text x="110" y="342" fill={result.color} fontSize="14" fontWeight="700">{result.label}</text>
          <text x="232" y="342" fill="var(--text-muted)" fontSize="12">positive means inlet plus sources exceed outlet</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="mass in (kg/s)" value={formatNumber(result.mIn)} color="#22d3ee" />
        <MetricCard label="mass out (kg/s)" value={formatNumber(result.mOut)} color="#fbbf24" />
        <MetricCard label="expected out (kg/s)" value={formatNumber(result.expectedOut)} color="#34d399" />
        <MetricCard label="imbalance (kg/s)" value={formatNumber(result.imbalance)} color={result.color} />
        <MetricCard label="continuity error" value={`${formatNumber(result.errorPercent, 2)}%`} color={result.color} />
        <MetricCard label="status" value={result.label} color={result.color} />
        <MetricCard label="inlet patches" value={formatNumber(nIn, 0)} color="#22d3ee" />
        <MetricCard label="outlet patches" value={formatNumber(nOut, 0)} color="#fbbf24" />
      </div>
      <Note>Use signed normal velocities from solver reports when available. For compressible or reacting cases, include density changes and mass sources explicitly.</Note>
    </CalculatorPanel>
  )
}
