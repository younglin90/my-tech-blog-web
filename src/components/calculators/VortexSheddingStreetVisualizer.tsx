'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function VortexSheddingStreetVisualizerCalculator() {
  const [strouhal, setStrouhal] = useState(0.2)
  const [speed, setSpeed] = useState(15)
  const [diameter, setDiameter] = useState(0.08)
  const [rho, setRho] = useState(1.225)
  const [mu, setMu] = useState(1.8e-5)

  const result = useMemo(() => {
    const frequency = strouhal * speed / Math.max(diameter, 1e-12)
    const period = 1 / Math.max(frequency, 1e-12)
    const wavelength = speed / Math.max(frequency, 1e-12)
    const re = (rho * speed * diameter) / Math.max(mu, 1e-12)
    const wakeClass = re < 47 ? 'steady wake' : re < 180 ? 'laminar shedding' : re < 2e5 ? 'Karman street' : 'turbulent wake'
    const spacingPx = clamp((wavelength / Math.max(diameter, 1e-12)) * 12, 34, 92)
    const wobble = clamp(strouhal / 0.25, 0.25, 1.4)
    return { frequency, period, wavelength, re, wakeClass, spacingPx, wobble }
  }, [diameter, mu, rho, speed, strouhal])

  const vortices = Array.from({ length: 11 }, (_, i) => {
    const x = 210 + i * result.spacingPx
    const top = i % 2 === 0
    return {
      x,
      y: top ? 142 : 218,
      color: top ? '#22d3ee' : '#fb7185',
      direction: top ? -1 : 1,
      label: top ? 'CCW' : 'CW',
    }
  })

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="St" value={strouhal} onChange={setStrouhal} step={0.01} min={0.001} />
        <NumberField label="U (m/s)" value={speed} onChange={setSpeed} step={0.5} min={0} />
        <NumberField label="D (m)" value={diameter} onChange={setDiameter} step={0.01} min={1e-9} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-9} />
        <NumberField label="mu (Pa*s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Vortex shedding street visualizer">
          <defs>
            <linearGradient id="wakeFade" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <path d="M88 180 C160 150, 210 150, 280 180 S430 220, 580 180" fill="none" stroke="url(#wakeFade)" strokeWidth="78" strokeLinecap="round" />
          <line x1="88" x2="586" y1="180" y2="180" stroke="rgba(226,232,240,0.16)" strokeDasharray="8 7" />
          <circle cx="150" cy="180" r="38" fill="rgba(148,163,184,0.28)" stroke="rgba(226,232,240,0.5)" strokeWidth="3" />
          <path d="M62 180 L110 180" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
          <polygon points="110,180 96,172 96,188" fill="#67e8f9" />

          {vortices.map((vortex, i) => (
            <g key={i} opacity={vortex.x < 590 ? 1 : 0.25}>
              <circle cx={vortex.x} cy={vortex.y} r={18 + result.wobble * 4} fill="none" stroke={vortex.color} strokeWidth="3" strokeDasharray="9 6">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${vortex.x} ${vortex.y}`} to={`${vortex.direction * 360} ${vortex.x} ${vortex.y}`} dur={`${Math.max(result.period * 3, 1.6)}s`} repeatCount="indefinite" />
              </circle>
              <text x={vortex.x - 13} y={vortex.y + 5} fill={vortex.color} fontSize="11" fontWeight="700">{vortex.label}</text>
            </g>
          ))}

          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Vortex shedding street</text>
          <text x="214" y="104" fill="#67e8f9" fontSize="12">{`lambda ≈ ${formatNumber(result.wavelength)} m`}</text>
          <text x="404" y="286" fill="#fecaca" fontSize="12">{result.wakeClass}</text>
          <text x="96" y="306" fill="var(--text-muted)" fontSize="12">alternating vortices are spaced by U/f = D/St</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="shedding frequency (Hz)" value={formatNumber(result.frequency)} color="#22d3ee" />
        <MetricCard label="period (s)" value={formatNumber(result.period)} color="#fbbf24" />
        <MetricCard label="vortex spacing (m)" value={formatNumber(result.wavelength)} color="#34d399" />
        <MetricCard label="Re_D" value={formatNumber(result.re)} color="#fb7185" />
        <MetricCard label="wake class" value={result.wakeClass} color="#22d3ee" />
        <MetricCard label="St" value={formatNumber(strouhal)} color="#a78bfa" />
        <MetricCard label="D / lambda" value={formatNumber(diameter / Math.max(result.wavelength, 1e-12))} color="#34d399" />
        <MetricCard label="U / f" value={formatNumber(speed / Math.max(result.frequency, 1e-12))} color="#fbbf24" />
      </div>
      <Note>Cylinder wakes often sit near St = 0.2 over a broad subcritical Reynolds range, but real Strouhal varies with geometry and regime.</Note>
    </CalculatorPanel>
  )
}
