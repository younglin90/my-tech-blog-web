'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function colorForRatio(ratio: number) {
  if (ratio < 0.75) return '#34d399'
  if (ratio < 1) return '#fbbf24'
  return '#fb7185'
}

export function TimeStepBudgetVisualizerCalculator() {
  const [dt, setDt] = useState(1e-4)
  const [dx, setDx] = useState(0.005)
  const [u, setU] = useState(45)
  const [soundSpeed, setSoundSpeed] = useState(340)
  const [nu, setNu] = useState(1.5e-5)
  const [cflMax, setCflMax] = useState(0.8)
  const [acousticMax, setAcousticMax] = useState(0.6)
  const [foMax, setFoMax] = useState(0.25)

  const result = useMemo(() => {
    const safeDx = Math.max(dx, 1e-12)
    const safeU = Math.max(Math.abs(u), 1e-12)
    const safeA = Math.max(Math.abs(soundSpeed) + Math.abs(u), 1e-12)
    const safeNu = Math.max(nu, 1e-18)
    const advectiveDt = cflMax * safeDx / safeU
    const acousticDt = acousticMax * safeDx / safeA
    const diffusionDt = foMax * safeDx * safeDx / safeNu
    const limitingDt = Math.min(advectiveDt, acousticDt, diffusionDt)
    const advectiveCfl = safeU * dt / safeDx
    const acousticCfl = safeA * dt / safeDx
    const fourier = safeNu * dt / (safeDx * safeDx)
    const ratio = dt / Math.max(limitingDt, 1e-18)
    const limiter = limitingDt === acousticDt ? 'acoustic CFL' : limitingDt === advectiveDt ? 'advective CFL' : 'diffusion Fo'
    return {
      advectiveDt,
      acousticDt,
      diffusionDt,
      limitingDt,
      advectiveCfl,
      acousticCfl,
      fourier,
      ratio,
      limiter,
      color: colorForRatio(ratio),
      stable: ratio <= 1,
    }
  }, [acousticMax, cflMax, dt, dx, foMax, nu, soundSpeed, u])

  const maxDt = Math.max(result.advectiveDt, result.acousticDt, result.diffusionDt, dt, 1e-12)
  const bars = [
    { label: 'advective', value: result.advectiveDt, color: '#22d3ee' },
    { label: 'acoustic', value: result.acousticDt, color: '#fbbf24' },
    { label: 'diffusion', value: result.diffusionDt, color: '#34d399' },
    { label: 'current', value: dt, color: result.color },
  ]

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="dt current (s)" value={dt} onChange={setDt} step={1e-5} min={0} />
        <NumberField label="dx min (m)" value={dx} onChange={setDx} step={0.001} min={1e-12} />
        <NumberField label="|U|max (m/s)" value={u} onChange={setU} step={1} min={0} />
        <NumberField label="sound speed a (m/s)" value={soundSpeed} onChange={setSoundSpeed} step={5} min={0} />
        <NumberField label="nu or alpha (m^2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-18} />
        <NumberField label="CFL max" value={cflMax} onChange={setCflMax} step={0.05} min={0.01} />
        <NumberField label="acoustic CFL max" value={acousticMax} onChange={setAcousticMax} step={0.05} min={0.01} />
        <NumberField label="Fo max" value={foMax} onChange={setFoMax} step={0.02} min={0.001} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Time-step budget visualizer">
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Time-step budget</text>
          <line x1="118" x2="560" y1="286" y2="286" stroke="rgba(226,232,240,0.2)" />

          {bars.map((bar, i) => {
            const h = clamp(bar.value / maxDt, 0.03, 1) * 196
            const x = 132 + i * 105
            return (
              <g key={bar.label}>
                <rect x={x} y={286 - h} width="58" height={h} rx="12" fill={bar.color} opacity="0.75" />
                <text x={x - 4} y="310" fill="var(--text-muted)" fontSize="12">{bar.label}</text>
                <text x={x - 10} y={276 - h} fill={bar.color} fontSize="11">{formatNumber(bar.value)}</text>
              </g>
            )
          })}

          <line
            x1="112"
            x2="566"
            y1={286 - clamp(result.limitingDt / maxDt, 0.03, 1) * 196}
            y2={286 - clamp(result.limitingDt / maxDt, 0.03, 1) * 196}
            stroke="#fb7185"
            strokeDasharray="6 5"
            strokeWidth="3"
          />
          <text x="386" y={270 - clamp(result.limitingDt / maxDt, 0.03, 1) * 196} fill="#fecaca" fontSize="12">limiting dt</text>
          <circle cx="518" cy={286 - clamp(dt / maxDt, 0.03, 1) * 196} r="11" fill={result.color} />
          <circle cx="518" cy={286 - clamp(dt / maxDt, 0.03, 1) * 196} r="22" fill="none" stroke={result.color} strokeOpacity="0.35">
            <animate attributeName="r" values="14;28;14" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.08;0.5" dur="2.1s" repeatCount="indefinite" />
          </circle>
          <text x="86" y="86" fill={result.color} fontSize="14" fontWeight="700">{result.stable ? 'current dt is inside budget' : 'current dt exceeds budget'}</text>
          <text x="86" y="108" fill="var(--text-muted)" fontSize="12">{`limiter: ${result.limiter}`}</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="limiting dt (s)" value={formatNumber(result.limitingDt)} color={result.color} />
        <MetricCard label="current / limit" value={`${formatNumber(result.ratio * 100, 1)}%`} color={result.color} />
        <MetricCard label="limiting physics" value={result.limiter} color={result.color} />
        <MetricCard label="advective dt (s)" value={formatNumber(result.advectiveDt)} color="#22d3ee" />
        <MetricCard label="acoustic dt (s)" value={formatNumber(result.acousticDt)} color="#fbbf24" />
        <MetricCard label="diffusion dt (s)" value={formatNumber(result.diffusionDt)} color="#34d399" />
        <MetricCard label="current CFL" value={formatNumber(result.advectiveCfl)} color="#22d3ee" />
        <MetricCard label="current Fo" value={formatNumber(result.fourier)} color="#34d399" />
      </div>
      <Note>For compressible explicit solvers, acoustic speed often dominates. For viscous DNS/LES near walls, the diffusion limit can become the smallest budget.</Note>
    </CalculatorPanel>
  )
}
