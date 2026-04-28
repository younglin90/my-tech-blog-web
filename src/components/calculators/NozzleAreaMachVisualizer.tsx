'use client'

import { useMemo, useState } from 'react'
import { isentropicFromMach, isentropicMachFromAreaRatio } from '@/lib/compressible'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

type Branch = 'supersonic' | 'subsonic'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function nozzleHalfHeight(x: number, exitAreaRatio: number) {
  const center = 330
  const normalized = Math.abs((x - center) / 260)
  const areaRatio = 1 + (Math.max(exitAreaRatio, 1) - 1) * normalized ** 1.65
  return 28 * Math.sqrt(areaRatio)
}

function machColor(mach: number) {
  if (mach < 0.8) return '#22d3ee'
  if (mach < 1.2) return '#fbbf24'
  if (mach < 3) return '#fb7185'
  return '#a78bfa'
}

function machAtX(x: number, gamma: number, exitAreaRatio: number, branch: Branch) {
  const center = 330
  const normalized = Math.abs((x - center) / 260)
  const areaRatio = 1 + (Math.max(exitAreaRatio, 1) - 1) * normalized ** 1.65
  if (Math.abs(x - center) < 2) return 1
  const localBranch: Branch = x < center ? 'subsonic' : branch
  return isentropicMachFromAreaRatio(areaRatio, gamma, localBranch) ?? Number.NaN
}

export function NozzleAreaMachVisualizerCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [exitAreaRatio, setExitAreaRatio] = useState(2.4)
  const [branch, setBranch] = useState<Branch>('supersonic')

  const result = useMemo(() => {
    const areaRatio = Math.max(exitAreaRatio, 1)
    const exitMach = isentropicMachFromAreaRatio(areaRatio, gamma, branch)
    const state = exitMach ? isentropicFromMach(exitMach, gamma) : null
    const pressureDrop = state ? 1 - state.p_p0 : Number.NaN
    const samples = Array.from({ length: 37 }, (_, i) => {
      const x = 70 + (520 * i) / 36
      return { x, mach: machAtX(x, gamma, areaRatio, branch) }
    })
    return { areaRatio, exitMach, state, pressureDrop, samples }
  }, [branch, exitAreaRatio, gamma])

  const topPath = Array.from({ length: 55 }, (_, i) => {
    const x = 70 + (520 * i) / 54
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(180 - nozzleHalfHeight(x, result.areaRatio)).toFixed(1)}`
  }).join(' ')
  const bottomPath = Array.from({ length: 55 }, (_, i) => {
    const x = 590 - (520 * i) / 54
    return `L${x.toFixed(1)} ${(180 + nozzleHalfHeight(x, result.areaRatio)).toFixed(1)}`
  }).join(' ')

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="gamma" value={gamma} onChange={setGamma} step={0.01} min={1.01} />
        <NumberField label="A_exit / A_throat" value={exitAreaRatio} onChange={setExitAreaRatio} step={0.1} min={1} />
        <SelectField
          label="exit branch"
          value={branch}
          onChange={(value) => setBranch(value as Branch)}
          options={[
            { value: 'supersonic', label: 'supersonic branch' },
            { value: 'subsonic', label: 'subsonic branch' },
          ]}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Area-Mach nozzle visualization">
          <defs>
            <linearGradient id="nozzleWallGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.24" />
              <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.26" />
            </linearGradient>
          </defs>

          <rect x="50" y="50" width="560" height="260" rx="18" fill="#08111f" />
          <path d={`${topPath} ${bottomPath} Z`} fill="url(#nozzleWallGradient)" stroke="rgba(226,232,240,0.34)" strokeWidth="2" />
          <line x1="70" x2="590" y1="180" y2="180" stroke="rgba(226,232,240,0.18)" strokeDasharray="6 6" />
          <line x1="330" x2="330" y1="110" y2="250" stroke="#fbbf24" strokeOpacity="0.8" strokeDasharray="5 5" />

          {result.samples.map((sample, index) => {
            const mach = Number.isFinite(sample.mach) ? sample.mach : 0
            const radius = clamp(4 + mach * 2.8, 5, 15)
            const y = 180 + Math.sin(index * 0.8) * 9
            return (
              <g key={sample.x}>
                <circle cx={sample.x} cy={y} r={radius} fill={machColor(mach)} opacity={0.72} />
                {index % 6 === 0 && (
                  <text x={sample.x - 12} y={y - radius - 7} fill="var(--text-muted)" fontSize="10">
                    {Number.isFinite(mach) ? `M${mach.toFixed(1)}` : '—'}
                  </text>
                )}
              </g>
            )
          })}

          <path d="M82 180 C122 150, 158 150, 198 180" fill="none" stroke="#22d3ee" strokeWidth="2" strokeOpacity="0.8" />
          <path d="M462 180 C506 145, 544 145, 584 180" fill="none" stroke="#fb7185" strokeWidth="2" strokeOpacity="0.8" />
          <text x="76" y="83" fill="var(--text)" fontSize="15" fontWeight="700">Area-Mach nozzle map</text>
          <text x="292" y="103" fill="#fde68a" fontSize="12" fontWeight="700">throat M = 1</text>
          <text x="80" y="286" fill="#67e8f9" fontSize="12">subsonic contraction</text>
          <text x="438" y="286" fill="#fecaca" fontSize="12">{branch === 'supersonic' ? 'accelerating expansion' : 'subsonic diffuser branch'}</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="exit Mach" value={formatNumber(result.exitMach ?? Number.NaN)} color={machColor(result.exitMach ?? 0)} />
        <MetricCard label="p_exit / p0" value={formatNumber(result.state?.p_p0 ?? Number.NaN)} color="#22d3ee" />
        <MetricCard label="T_exit / T0" value={formatNumber(result.state?.T_T0 ?? Number.NaN)} color="#34d399" />
        <MetricCard label="static pressure drop" value={formatNumber(result.pressureDrop)} color="#fb7185" />
      </div>
      <Note>Use the supersonic branch for a choked converging-diverging nozzle without an internal shock. Switch branch to see the alternate area-Mach solution.</Note>
    </CalculatorPanel>
  )
}
