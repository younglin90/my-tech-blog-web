'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

const C_MU = 0.09

type InletMode = 'pipe' | 'channel' | 'freestream'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function modeFactor(mode: InletMode) {
  if (mode === 'pipe') return 0.07
  if (mode === 'channel') return 0.1
  return 0.4
}

function modeLabel(mode: InletMode) {
  if (mode === 'pipe') return 'pipe / duct'
  if (mode === 'channel') return 'channel'
  return 'freestream'
}

export function TurbulenceInletVisualizerCalculator() {
  const [intensity, setIntensity] = useState(5)
  const [speed, setSpeed] = useState(12)
  const [length, setLength] = useState(0.08)
  const [mode, setMode] = useState<InletMode>('pipe')

  const result = useMemo(() => {
    const i = intensity / 100
    const uPrime = i * speed
    const k = 1.5 * uPrime * uPrime
    const ell = modeFactor(mode) * length
    const epsilon = Math.pow(C_MU, 0.75) * Math.pow(Math.max(k, 0), 1.5) / Math.max(ell, 1e-12)
    const omega = Math.sqrt(Math.max(k, 0)) / (Math.pow(C_MU, 0.25) * Math.max(ell, 1e-12))
    const turnoverTime = ell / Math.max(uPrime, 1e-12)
    const eddyRatio = ell / Math.max(length, 1e-12)
    const visualRadius = clamp(eddyRatio * 260, 10, 74)
    const fluctuation = clamp(intensity / 20, 0.08, 1.25)
    return { i, uPrime, k, ell, epsilon, omega, turnoverTime, eddyRatio, visualRadius, fluctuation }
  }, [intensity, length, mode, speed])

  const eddies = [
    { cx: 190, cy: 147, phase: 0.0 },
    { cx: 280, cy: 214, phase: 0.35 },
    { cx: 392, cy: 142, phase: 0.7 },
    { cx: 482, cy: 218, phase: 1.05 },
  ]

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="I (%)" value={intensity} onChange={setIntensity} step={0.5} min={0.01} max={100} />
        <NumberField label="U mean (m/s)" value={speed} onChange={setSpeed} step={0.5} min={0.001} />
        <NumberField label="D or length scale (m)" value={length} onChange={setLength} step={0.01} min={1e-6} />
        <SelectField
          label="inlet type"
          value={mode}
          onChange={(value) => setMode(value as InletMode)}
          options={[
            { value: 'pipe', label: 'pipe / duct, l=0.07D' },
            { value: 'channel', label: 'channel, l=0.10D' },
            { value: 'freestream', label: 'freestream, l=0.40D' },
          ]}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Turbulence inlet visualizer">
          <defs>
            <linearGradient id="inletFlowGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <rect x="108" y="100" width="440" height="160" rx="18" fill="url(#inletFlowGradient)" stroke="rgba(226,232,240,0.28)" />
          <line x1="108" x2="548" y1="180" y2="180" stroke="rgba(226,232,240,0.16)" strokeDasharray="8 7" />
          {[130, 220, 310, 400, 490].map((x) => (
            <g key={x}>
              <path d={`M${x} 180 C${x + 28} ${180 - result.fluctuation * 34}, ${x + 58} ${180 + result.fluctuation * 34}, ${x + 86} 180`} fill="none" stroke="#67e8f9" strokeWidth="3" strokeOpacity="0.72" />
              <polygon points={`${x + 86},180 ${x + 74},174 ${x + 76},187`} fill="#67e8f9" opacity="0.72" />
            </g>
          ))}

          {eddies.map((eddy, index) => (
            <g key={index}>
              <circle cx={eddy.cx} cy={eddy.cy} r={result.visualRadius * (0.7 + 0.18 * index)} fill="none" stroke={index % 2 ? '#fbbf24' : '#34d399'} strokeWidth="3" strokeOpacity="0.52" strokeDasharray="8 7">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${eddy.cx} ${eddy.cy}`} to={`360 ${eddy.cx} ${eddy.cy}`} dur={`${6 + index}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={eddy.cx} cy={eddy.cy} r="4" fill={index % 2 ? '#fbbf24' : '#34d399'} />
            </g>
          ))}

          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Turbulence inlet scale</text>
          <text x="116" y="88" fill="var(--text-muted)" fontSize="12">{`${modeLabel(mode)}: l = ${modeFactor(mode).toFixed(2)}D`}</text>
          <text x="430" y="88" fill="#bbf7d0" fontSize="12">{`u' = ${formatNumber(result.uPrime)} m/s`}</text>
          <text x="112" y="292" fill="var(--text-muted)" fontSize="12">larger circles mean larger imposed turbulence length scale</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="k (m^2/s^2)" value={formatNumber(result.k)} color="#22d3ee" />
        <MetricCard label="epsilon (m^2/s^3)" value={formatNumber(result.epsilon)} color="#a78bfa" />
        <MetricCard label="omega (1/s)" value={formatNumber(result.omega)} color="#34d399" />
        <MetricCard label="length scale l (m)" value={formatNumber(result.ell)} color="#fbbf24" />
        <MetricCard label="u prime (m/s)" value={formatNumber(result.uPrime)} color="#fb7185" />
        <MetricCard label="eddy turnover (s)" value={formatNumber(result.turnoverTime)} color="#22d3ee" />
        <MetricCard label="l / D" value={formatNumber(result.eddyRatio)} color="#34d399" />
        <MetricCard label="inlet mode" value={modeLabel(mode)} color="#fbbf24" />
      </div>
      <Note>Use this to sanity-check k-epsilon or k-omega inlet boundary conditions before copying values into a solver dictionary.</Note>
    </CalculatorPanel>
  )
}
