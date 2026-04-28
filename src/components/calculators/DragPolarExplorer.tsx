'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function xForCl(cl: number) {
  return 80 + clamp((cl + 0.4) / 2.2, 0, 1) * 500
}

function yForCd(cd: number) {
  return 300 - clamp((cd - 0.0) / 0.18, 0, 1) * 230
}

export function DragPolarExplorerCalculator() {
  const [cd0, setCd0] = useState(0.025)
  const [aspectRatio, setAspectRatio] = useState(8)
  const [oswald, setOswald] = useState(0.82)
  const [cl, setCl] = useState(0.7)
  const [rho, setRho] = useState(1.225)
  const [speed, setSpeed] = useState(45)
  const [area, setArea] = useState(1.4)

  const result = useMemo(() => {
    const k = 1 / (Math.PI * Math.max(aspectRatio, 1e-9) * Math.max(oswald, 1e-9))
    const cdi = k * cl * cl
    const cd = cd0 + cdi
    const q = 0.5 * rho * speed * speed
    const lift = cl * q * area
    const drag = cd * q * area
    const ld = drag > 1e-12 ? lift / drag : Number.NaN
    const bestCl = Math.sqrt(Math.max(cd0 / Math.max(k, 1e-12), 0))
    const bestCd = cd0 + k * bestCl * bestCl
    const bestLd = bestCd > 1e-12 ? bestCl / bestCd : Number.NaN
    const path = Array.from({ length: 80 }, (_, i) => {
      const sampleCl = -0.4 + (2.2 * i) / 79
      const sampleCd = cd0 + k * sampleCl * sampleCl
      return `${i === 0 ? 'M' : 'L'}${xForCl(sampleCl).toFixed(1)} ${yForCd(sampleCd).toFixed(1)}`
    }).join(' ')
    return { k, cdi, cd, q, lift, drag, ld, bestCl, bestCd, bestLd, path }
  }, [area, aspectRatio, cd0, cl, oswald, rho, speed])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="C_D0" value={cd0} onChange={setCd0} step={0.005} min={0} />
        <NumberField label="aspect ratio AR" value={aspectRatio} onChange={setAspectRatio} step={0.5} min={0.1} />
        <NumberField label="Oswald e" value={oswald} onChange={setOswald} step={0.02} min={0.1} max={1} />
        <NumberField label="C_L" value={cl} onChange={setCl} step={0.05} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-6} />
        <NumberField label="U (m/s)" value={speed} onChange={setSpeed} step={1} min={0} />
        <NumberField label="reference area (m^2)" value={area} onChange={setArea} step={0.1} min={1e-9} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Drag polar explorer">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          {[0, 0.04, 0.08, 0.12, 0.16].map((tick) => (
            <g key={tick}>
              <line x1="80" x2="580" y1={yForCd(tick)} y2={yForCd(tick)} stroke="rgba(148,163,184,0.17)" strokeDasharray="5 5" />
              <text x="32" y={yForCd(tick) + 4} fill="var(--text-muted)" fontSize="11">{tick.toFixed(2)}</text>
            </g>
          ))}
          {[-0.4, 0, 0.5, 1.0, 1.5, 1.8].map((tick) => (
            <g key={tick}>
              <line x1={xForCl(tick)} x2={xForCl(tick)} y1="70" y2="300" stroke="rgba(148,163,184,0.13)" />
              <text x={xForCl(tick) - 10} y="326" fill="var(--text-muted)" fontSize="11">{tick.toFixed(1)}</text>
            </g>
          ))}

          <path d={result.path} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
          <line x1={xForCl(result.bestCl)} x2={xForCl(result.bestCl)} y1={yForCd(result.bestCd)} y2="300" stroke="#34d399" strokeOpacity="0.5" strokeDasharray="4 4" />
          <circle cx={xForCl(result.bestCl)} cy={yForCd(result.bestCd)} r="8" fill="#34d399" />
          <circle cx={xForCl(cl)} cy={yForCd(result.cd)} r="10" fill="#fbbf24" />
          <circle cx={xForCl(cl)} cy={yForCd(result.cd)} r="18" fill="none" stroke="#fbbf24" strokeOpacity="0.35">
            <animate attributeName="r" values="12;25;12" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2.2s" repeatCount="indefinite" />
          </circle>

          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Parabolic drag polar</text>
          <text x={xForCl(result.bestCl) - 36} y={yForCd(result.bestCd) - 14} fill="#bbf7d0" fontSize="12">best L/D</text>
          <text x={xForCl(cl) + 14} y={yForCd(result.cd) + 4} fill="#fde68a" fontSize="12">current</text>
          <text x="306" y="350" fill="var(--text-muted)" fontSize="12">lift coefficient C_L</text>
          <text x="10" y="196" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 10 196)">drag coefficient C_D</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="C_D total" value={formatNumber(result.cd, 5)} color="#22d3ee" />
        <MetricCard label="induced C_Di" value={formatNumber(result.cdi, 5)} color="#fbbf24" />
        <MetricCard label="L/D" value={formatNumber(result.ld)} color="#34d399" />
        <MetricCard label="best L/D near C_L" value={formatNumber(result.bestCl)} color="#fb7185" />
        <MetricCard label="dynamic pressure (Pa)" value={formatNumber(result.q)} color="#a78bfa" />
        <MetricCard label="lift (N)" value={formatNumber(result.lift)} color="#34d399" />
        <MetricCard label="drag (N)" value={formatNumber(result.drag)} color="#f87171" />
        <MetricCard label="polar k" value={formatNumber(result.k, 5)} color="#22d3ee" />
      </div>
      <Note>Use this as a preliminary aerodynamic balance check. Matching Reynolds and Mach is still required before reusing measured drag coefficients.</Note>
    </CalculatorPanel>
  )
}
