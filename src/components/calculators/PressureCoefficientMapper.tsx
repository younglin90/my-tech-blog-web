'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

type Surface = 'upper' | 'lower'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pressureColor(cp: number) {
  if (cp < -1) return '#22d3ee'
  if (cp < -0.1) return '#34d399'
  if (cp < 0.5) return '#fbbf24'
  return '#fb7185'
}

function airfoilY(x: number, surface: Surface) {
  const t = 0.12
  const xc = clamp(x, 0.001, 0.999)
  const yt = 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1015 * xc ** 4)
  return surface === 'upper' ? -yt : yt
}

function airfoilPath(surface: Surface) {
  const points = Array.from({ length: 90 }, (_, i) => {
    const x = i / 89
    const px = 80 + x * 500
    const py = 180 + airfoilY(x, surface) * 620
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`
  })
  return points.join(' ')
}

export function PressureCoefficientMapperCalculator() {
  const [pLocal, setPLocal] = useState(99200)
  const [pInf, setPInf] = useState(101325)
  const [rho, setRho] = useState(1.225)
  const [speed, setSpeed] = useState(55)
  const [xOverC, setXOverC] = useState(0.28)
  const [surface, setSurface] = useState<Surface>('upper')

  const result = useMemo(() => {
    const q = 0.5 * rho * speed * speed
    const cp = (pLocal - pInf) / Math.max(q, 1e-12)
    const velocityRatio = Math.sqrt(Math.max(1 - cp, 0))
    const x = 80 + clamp(xOverC, 0, 1) * 500
    const y = 180 + airfoilY(xOverC, surface) * 620
    const label = cp < -0.1 ? 'suction' : cp > 0.5 ? 'pressure loading' : 'near freestream'
    return { q, cp, velocityRatio, x, y, label }
  }, [pInf, pLocal, rho, speed, surface, xOverC])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="p_local (Pa)" value={pLocal} onChange={setPLocal} step={100} />
        <NumberField label="p_infinity (Pa)" value={pInf} onChange={setPInf} step={100} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-9} />
        <NumberField label="U_infinity (m/s)" value={speed} onChange={setSpeed} step={1} min={0} />
        <NumberField label="x / c" value={xOverC} onChange={setXOverC} step={0.02} min={0} max={1} />
        <SelectField
          label="surface"
          value={surface}
          onChange={(value) => setSurface(value as Surface)}
          options={[
            { value: 'upper', label: 'upper surface' },
            { value: 'lower', label: 'lower surface' },
          ]}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Pressure coefficient mapper">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <path d={`${airfoilPath('upper')} ${airfoilPath('lower').replace('M', 'L')} Z`} fill="rgba(148,163,184,0.18)" stroke="rgba(226,232,240,0.42)" strokeWidth="2" />
          <path d={airfoilPath('upper')} fill="none" stroke="#22d3ee" strokeWidth="3" strokeOpacity={surface === 'upper' ? 1 : 0.28} />
          <path d={airfoilPath('lower')} fill="none" stroke="#fbbf24" strokeWidth="3" strokeOpacity={surface === 'lower' ? 1 : 0.28} />
          <line x1="80" x2="580" y1="180" y2="180" stroke="rgba(226,232,240,0.16)" strokeDasharray="6 6" />

          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line x1={80 + tick * 500} x2={80 + tick * 500} y1="80" y2="280" stroke="rgba(148,163,184,0.12)" />
              <text x={74 + tick * 500} y="306" fill="var(--text-muted)" fontSize="11">{tick.toFixed(2)}</text>
            </g>
          ))}

          <line x1={result.x} x2={result.x} y1="80" y2="280" stroke="rgba(248,250,252,0.36)" strokeDasharray="4 4" />
          <circle cx={result.x} cy={result.y} r="12" fill={pressureColor(result.cp)} />
          <circle cx={result.x} cy={result.y} r="22" fill="none" stroke={pressureColor(result.cp)} strokeOpacity="0.38">
            <animate attributeName="r" values="14;28;14" dur="2.3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2.3s" repeatCount="indefinite" />
          </circle>
          <path
            d={result.cp < 0 ? `M${result.x} ${result.y - 18} L${result.x} ${result.y - 58}` : `M${result.x} ${result.y + 18} L${result.x} ${result.y + 58}`}
            stroke={pressureColor(result.cp)}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Surface pressure coefficient</text>
          <text x={result.x + 18} y={result.y - 16} fill={pressureColor(result.cp)} fontSize="12">{result.label}</text>
          <text x="292" y="336" fill="var(--text-muted)" fontSize="12">chord location x/c</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="C_p" value={formatNumber(result.cp, 5)} color={pressureColor(result.cp)} />
        <MetricCard label="q_infinity (Pa)" value={formatNumber(result.q)} color="#22d3ee" />
        <MetricCard label="V_local / U_inf" value={formatNumber(result.velocityRatio)} color="#34d399" />
        <MetricCard label="interpretation" value={result.label} color="#fbbf24" />
      </div>
      <Note>For incompressible inviscid intuition, negative Cp implies locally faster flow. Compressible or separated regions need solver-field interpretation.</Note>
    </CalculatorPanel>
  )
}
