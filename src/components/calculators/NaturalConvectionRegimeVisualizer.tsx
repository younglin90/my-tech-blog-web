'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const G = 9.80665

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function yForRa(ra: number) {
  const log = Math.log10(Math.max(ra, 1))
  return 300 - clamp((log - 1) / 11, 0, 1) * 230
}

function regimeFromRa(ra: number) {
  if (ra < 1708) return 'conduction dominated'
  if (ra < 1e4) return 'onset of convection'
  if (ra < 1e9) return 'laminar natural convection'
  return 'turbulent natural convection'
}

function regimeColor(ra: number) {
  if (ra < 1708) return '#a78bfa'
  if (ra < 1e4) return '#22d3ee'
  if (ra < 1e9) return '#34d399'
  return '#fb7185'
}

export function NaturalConvectionRegimeVisualizerCalculator() {
  const [deltaT, setDeltaT] = useState(25)
  const [length, setLength] = useState(0.5)
  const [beta, setBeta] = useState(0.0033)
  const [nu, setNu] = useState(1.6e-5)
  const [alpha, setAlpha] = useState(2.2e-5)
  const [k, setK] = useState(0.026)

  const result = useMemo(() => {
    const gr = (G * beta * Math.abs(deltaT) * length ** 3) / Math.max(nu * nu, 1e-24)
    const pr = nu / Math.max(alpha, 1e-24)
    const ra = gr * pr
    const nuChurchillChu = (0.825 + (0.387 * ra ** (1 / 6)) / (1 + (0.492 / Math.max(pr, 1e-12)) ** (9 / 16)) ** (8 / 27)) ** 2
    const h = (nuChurchillChu * k) / Math.max(length, 1e-12)
    const plumeHeight = clamp((Math.log10(Math.max(ra, 1)) - 3) / 7, 0.12, 1)
    return {
      gr,
      pr,
      ra,
      nu: nuChurchillChu,
      h,
      regime: regimeFromRa(ra),
      color: regimeColor(ra),
      plumeHeight,
    }
  }, [alpha, beta, deltaT, k, length, nu])

  const plumes = Array.from({ length: 5 }, (_, i) => {
    const x = 210 + i * 58
    const height = 70 + result.plumeHeight * (84 + i * 12)
    return { x, height, phase: i * 0.4 }
  })

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="Delta T (K)" value={deltaT} onChange={setDeltaT} step={1} min={0} />
        <NumberField label="vertical length L (m)" value={length} onChange={setLength} step={0.05} min={1e-6} />
        <NumberField label="beta (1/K)" value={beta} onChange={setBeta} step={0.0001} min={0} />
        <NumberField label="nu (m^2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-12} />
        <NumberField label="alpha (m^2/s)" value={alpha} onChange={setAlpha} step={1e-6} min={1e-12} />
        <NumberField label="k (W/m/K)" value={k} onChange={setK} step={0.001} min={1e-9} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Natural convection regime visualizer">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <rect x="126" y="94" width="44" height="190" rx="10" fill="#fb7185" opacity="0.42" stroke="#fecaca" strokeOpacity="0.7" />
          <path d="M170 96 C210 84, 246 112, 292 90 S374 82, 420 118 S504 152, 552 116" fill="none" stroke="rgba(251,113,133,0.22)" strokeWidth="36" strokeLinecap="round" />

          {plumes.map((plume, i) => (
            <path
              key={i}
              d={`M${plume.x} 282 C${plume.x - 36} ${258 - plume.height * 0.25}, ${plume.x + 28} ${230 - plume.height * 0.55}, ${plume.x} ${282 - plume.height}`}
              fill="none"
              stroke={result.color}
              strokeWidth={8 - i * 0.7}
              strokeLinecap="round"
              strokeOpacity={0.32 + result.plumeHeight * 0.42}
            >
              <animate attributeName="stroke-opacity" values="0.2;0.72;0.2" dur={`${2.4 + plume.phase}s`} repeatCount="indefinite" />
            </path>
          ))}

          <line x1="84" x2="580" y1={yForRa(1708)} y2={yForRa(1708)} stroke="#22d3ee" strokeOpacity="0.58" strokeDasharray="6 5" />
          <line x1="84" x2="580" y1={yForRa(1e9)} y2={yForRa(1e9)} stroke="#fb7185" strokeOpacity="0.62" strokeDasharray="6 5" />
          <line x1="84" x2="580" y1={yForRa(result.ra)} y2={yForRa(result.ra)} stroke={result.color} strokeWidth="4" />
          <circle cx="552" cy={yForRa(result.ra)} r="10" fill={result.color} />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Natural convection regime</text>
          <text x="92" y={yForRa(1708) - 8} fill="#67e8f9" fontSize="12">Ra critical ~1708</text>
          <text x="92" y={yForRa(1e9) - 8} fill="#fecaca" fontSize="12">vertical plate transition ~1e9</text>
          <text x="188" y="310" fill={result.color} fontSize="14" fontWeight="700">{result.regime}</text>
          <text x="96" y="330" fill="var(--text-muted)" fontSize="12">hot wall drives buoyant plumes; height grows with Rayleigh number</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Rayleigh Ra" value={formatNumber(result.ra)} color={result.color} />
        <MetricCard label="Grashof Gr" value={formatNumber(result.gr)} color="#22d3ee" />
        <MetricCard label="Prandtl Pr" value={formatNumber(result.pr)} color="#34d399" />
        <MetricCard label="Churchill-Chu Nu" value={formatNumber(result.nu)} color="#fbbf24" />
        <MetricCard label="h (W/m^2/K)" value={formatNumber(result.h)} color="#fb7185" />
        <MetricCard label="regime" value={result.regime} color={result.color} />
        <MetricCard label="L^3 sensitivity" value={formatNumber(length ** 3)} color="#a78bfa" />
        <MetricCard label="buoyancy term" value={formatNumber(G * beta * Math.abs(deltaT))} color="#22d3ee" />
      </div>
      <Note>Rayleigh thresholds depend on geometry and boundary conditions. Use this as a setup triage before choosing natural-convection correlations or CFD turbulence models.</Note>
    </CalculatorPanel>
  )
}
