'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const CS = 1 / Math.sqrt(3)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function statusColor(okMach: boolean, okTau: boolean) {
  if (okMach && okTau) return '#34d399'
  if (okMach || okTau) return '#fbbf24'
  return '#fb7185'
}

function statusLabel(okMach: boolean, okTau: boolean) {
  if (okMach && okTau) return 'comfortable BGK setup'
  if (!okTau) return 'tau near unstable range'
  return 'lattice Mach too high'
}

export function LbmBgkStabilityVisualizerCalculator() {
  const [uPhysical, setUPhysical] = useState(1)
  const [lengthPhysical, setLengthPhysical] = useState(0.1)
  const [nuPhysical, setNuPhysical] = useState(1e-6)
  const [cells, setCells] = useState(160)
  const [uLattice, setULattice] = useState(0.08)

  const result = useMemo(() => {
    const dx = lengthPhysical / Math.max(cells, 1)
    const dt = (uLattice * dx) / Math.max(uPhysical, 1e-12)
    const nuLattice = (nuPhysical * dt) / Math.max(dx * dx, 1e-24)
    const tau = 0.5 + nuLattice / (CS * CS)
    const omega = 1 / Math.max(tau, 1e-12)
    const latticeMach = uLattice / CS
    const re = (uPhysical * lengthPhysical) / Math.max(nuPhysical, 1e-24)
    const okMach = latticeMach < 0.1
    const okTau = tau > 0.52 && tau < 1.8
    const color = statusColor(okMach, okTau)
    return { dx, dt, nuLattice, tau, omega, latticeMach, re, okMach, okTau, color, label: statusLabel(okMach, okTau) }
  }, [cells, lengthPhysical, nuPhysical, uLattice, uPhysical])

  const tauX = 114 + clamp((result.tau - 0.5) / 1.7, 0, 1) * 430
  const machY = 278 - clamp(result.latticeMach / 0.3, 0, 1) * 170

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="U physical (m/s)" value={uPhysical} onChange={setUPhysical} step={0.1} min={0} />
        <NumberField label="L physical (m)" value={lengthPhysical} onChange={setLengthPhysical} step={0.01} min={1e-12} />
        <NumberField label="nu physical (m^2/s)" value={nuPhysical} onChange={setNuPhysical} step={1e-7} min={1e-18} />
        <NumberField label="cells across L" value={cells} onChange={setCells} step={8} min={1} />
        <NumberField label="U lattice" value={uLattice} onChange={setULattice} step={0.01} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="LBM BGK stability visualizer">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">LBM BGK stability map</text>

          <rect x="114" y="90" width="430" height="44" rx="12" fill="rgba(148,163,184,0.16)" />
          <rect x="120" y="90" width="12" height="44" fill="#fb7185" opacity="0.5" />
          <rect x="132" y="90" width="322" height="44" fill="#34d399" opacity="0.28" />
          <rect x="454" y="90" width="90" height="44" fill="#fbbf24" opacity="0.22" />
          <circle cx={tauX} cy="112" r="12" fill={result.color} />
          <text x="114" y="76" fill="var(--text-muted)" fontSize="12">tau range</text>
          <text x="114" y="154" fill="#fecaca" fontSize="11">0.5</text>
          <text x="198" y="154" fill="#bbf7d0" fontSize="11">stable comfort</text>
          <text x="480" y="154" fill="#fde68a" fontSize="11">diffusive</text>

          <rect x="114" y="184" width="430" height="104" rx="12" fill="rgba(148,163,184,0.12)" />
          <line x1="114" x2="544" y1={278 - (0.1 / 0.3) * 170} y2={278 - (0.1 / 0.3) * 170} stroke="#34d399" strokeDasharray="6 5" strokeWidth="3" />
          <line x1="114" x2="544" y1={machY} y2={machY} stroke={result.color} strokeWidth="4" />
          <circle cx="500" cy={machY} r="11" fill={result.color} />
          <text x="124" y={278 - (0.1 / 0.3) * 170 - 8} fill="#bbf7d0" fontSize="12">Ma_lattice 0.1 target</text>
          <text x="124" y="304" fill={result.color} fontSize="14" fontWeight="700">{result.label}</text>

          {Array.from({ length: 10 }, (_, i) => (
            <g key={i} transform={`translate(${142 + i * 33} 220)`}>
              <circle cx="0" cy="0" r="8" fill="none" stroke={i % 2 ? '#fbbf24' : '#22d3ee'} strokeOpacity="0.45" />
              <path d="M-10 0 L10 0 M0 -10 L0 10" stroke="rgba(226,232,240,0.22)" />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="tau" value={formatNumber(result.tau)} color={result.color} />
        <MetricCard label="omega" value={formatNumber(result.omega)} color="#22d3ee" />
        <MetricCard label="lattice Mach" value={formatNumber(result.latticeMach)} color={result.okMach ? '#34d399' : '#fb7185'} />
        <MetricCard label="nu lattice" value={formatNumber(result.nuLattice)} color="#fbbf24" />
        <MetricCard label="dx (m)" value={formatNumber(result.dx)} color="#22d3ee" />
        <MetricCard label="dt (s)" value={formatNumber(result.dt)} color="#34d399" />
        <MetricCard label="Re physical" value={formatNumber(result.re)} color="#a78bfa" />
        <MetricCard label="status" value={result.label} color={result.color} />
      </div>
      <Note>For weakly compressible LBM, keep lattice Mach small and tau safely above 0.5. Practical limits depend on collision model and boundary treatment.</Note>
    </CalculatorPanel>
  )
}
