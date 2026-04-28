'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

type FilterMode = 'geometric' | 'max'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function logPosition(value: number, min: number, max: number) {
  const logMin = Math.log10(min)
  const logMax = Math.log10(max)
  return clamp((Math.log10(Math.max(value, min)) - logMin) / Math.max(logMax - logMin, 1e-12), 0, 1)
}

function classifyResolution(deltaEta: number, sgsRatio: number, anisotropy: number) {
  if (deltaEta <= 4 && sgsRatio < 0.35 && anisotropy < 2) return 'DNS-like / very fine LES'
  if (deltaEta <= 20 && sgsRatio < 2 && anisotropy < 4) return 'wall-resolved LES candidate'
  if (deltaEta <= 80 && sgsRatio < 8) return 'coarse LES / ILES candidate'
  return 'RANS or grid refinement recommended'
}

function filterLabel(mode: FilterMode) {
  if (mode === 'max') return 'max(dx, dy, dz)'
  return '(dx dy dz)^(1/3)'
}

export function LesResolutionPlannerCalculator() {
  const [nu, setNu] = useState(1.5e-5)
  const [epsilon, setEpsilon] = useState(0.15)
  const [dx, setDx] = useState(0.002)
  const [dy, setDy] = useState(0.001)
  const [dz, setDz] = useState(0.002)
  const [strain, setStrain] = useState(120)
  const [cs, setCs] = useState(0.17)
  const [mode, setMode] = useState<FilterMode>('geometric')

  const result = useMemo(() => {
    const safeDx = Math.max(dx, 1e-12)
    const safeDy = Math.max(dy, 1e-12)
    const safeDz = Math.max(dz, 1e-12)
    const deltaGeom = Math.cbrt(safeDx * safeDy * safeDz)
    const deltaMax = Math.max(safeDx, safeDy, safeDz)
    const delta = mode === 'max' ? deltaMax : deltaGeom
    const eta = Math.pow(Math.max(nu, 1e-16) ** 3 / Math.max(epsilon, 1e-16), 0.25)
    const tauEta = Math.sqrt(Math.max(nu, 1e-16) / Math.max(epsilon, 1e-16))
    const uEta = Math.pow(Math.max(nu, 1e-16) * Math.max(epsilon, 1e-16), 0.25)
    const deltaEta = delta / Math.max(eta, 1e-16)
    const anisotropy = deltaMax / Math.max(Math.min(safeDx, safeDy, safeDz), 1e-12)
    const nuSgs = (cs * delta) ** 2 * Math.max(strain, 0)
    const sgsRatio = nuSgs / Math.max(nu, 1e-16)
    const resolvedFraction = clamp(1 - Math.log10(Math.max(deltaEta, 1)) / 2.2, 0.08, 0.96)
    const modeName = classifyResolution(deltaEta, sgsRatio, anisotropy)

    return {
      anisotropy,
      delta,
      deltaEta,
      deltaGeom,
      deltaMax,
      eta,
      modeName,
      nuSgs,
      resolvedFraction,
      sgsRatio,
      tauEta,
      uEta,
    }
  }, [cs, dx, dy, dz, epsilon, mode, nu, strain])

  const minScale = Math.min(result.eta, result.delta, result.deltaMax) / 3
  const maxScale = Math.max(result.eta, result.delta, result.deltaMax) * 18
  const etaX = 90 + logPosition(result.eta, minScale, maxScale) * 480
  const deltaX = 90 + logPosition(result.delta, minScale, maxScale) * 480
  const unresolvedWidth = clamp(420 * (1 - result.resolvedFraction), 28, 360)
  const anisotropyHeight = clamp((result.anisotropy - 1) * 34, 0, 118)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="nu (m^2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-16} />
        <NumberField label="epsilon (m^2/s^3)" value={epsilon} onChange={setEpsilon} step={0.01} min={1e-16} />
        <NumberField label="dx (m)" value={dx} onChange={setDx} step={0.0005} min={1e-12} />
        <NumberField label="dy (m)" value={dy} onChange={setDy} step={0.0005} min={1e-12} />
        <NumberField label="dz (m)" value={dz} onChange={setDz} step={0.0005} min={1e-12} />
        <NumberField label="|S| (1/s)" value={strain} onChange={setStrain} step={10} min={0} />
        <NumberField label="C_s" value={cs} onChange={setCs} step={0.01} min={0} max={1} />
        <SelectField
          label="filter width"
          value={mode}
          onChange={(value) => setMode(value as FilterMode)}
          options={[
            { value: 'geometric', label: 'geometric mean' },
            { value: 'max', label: 'max spacing' },
          ]}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 720 390" className="h-auto w-full" role="img" aria-label="LES filter width and subgrid scale planner">
          <defs>
            <linearGradient id="lesCascadeGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.42" />
              <stop offset="58%" stopColor="#22d3ee" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.28" />
            </linearGradient>
            <radialGradient id="lesEddyGlow">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="42" y="34" width="636" height="322" rx="22" fill="#08111f" />
          <text x="66" y="64" fill="var(--text)" fontSize="16" fontWeight="700">LES resolution map</text>
          <text x="66" y="86" fill="var(--text-muted)" fontSize="12">{`filter width: ${filterLabel(mode)}`}</text>

          <rect x="90" y="116" width="480" height="58" rx="16" fill="url(#lesCascadeGradient)" />
          <rect x={570 - unresolvedWidth} y="116" width={unresolvedWidth} height="58" rx="16" fill="#fb7185" opacity="0.28" />
          <line x1={etaX} x2={etaX} y1="105" y2="188" stroke="#34d399" strokeWidth="3" />
          <line x1={deltaX} x2={deltaX} y1="100" y2="194" stroke="#fbbf24" strokeWidth="3" />
          <circle cx={etaX} cy="203" r="7" fill="#34d399" />
          <circle cx={deltaX} cy="203" r="7" fill="#fbbf24" />
          <text x={clamp(etaX - 28, 92, 520)} y="226" fill="#bbf7d0" fontSize="12">eta</text>
          <text x={clamp(deltaX - 36, 92, 520)} y="244" fill="#fde68a" fontSize="12">Delta</text>
          <text x="96" y="151" fill="#e2e8f0" fontSize="12">resolved eddies</text>
          <text x="444" y="151" fill="#fecaca" fontSize="12">SGS model</text>

          {[0, 1, 2, 3, 4].map((index) => {
            const radius = 42 - index * 6
            const cx = 126 + index * 72
            const cy = 288 - (index % 2) * 16
            return (
              <g key={index}>
                <circle cx={cx} cy={cy} r={radius} fill="url(#lesEddyGlow)" opacity={0.38 - index * 0.045} />
                <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#67e8f9" strokeWidth="2.4" strokeOpacity="0.52" strokeDasharray="9 7">
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={`${8 - index * 0.65}s`} repeatCount="indefinite" />
                </circle>
              </g>
            )
          })}

          {[0, 1, 2].map((index) => {
            const x = 478 + index * 38
            const y = 280 + index * 12
            return (
              <g key={index}>
                <rect x={x} y={y - anisotropyHeight / 2} width={24 + result.sgsRatio * 1.6} height={24 + anisotropyHeight} rx="5" fill="#fb7185" opacity={0.16 + index * 0.06} stroke="#fb7185" strokeOpacity="0.34" />
                <line x1={x - 6} x2={x + 40} y1={y} y2={y + 16} stroke="#fda4af" strokeOpacity="0.32" />
              </g>
            )
          })}

          <text x="66" y="344" fill="var(--text-muted)" fontSize="12">Large structures stay on the grid. Motions smaller than Delta move into the SGS model.</text>
          <text x="418" y="344" fill="#fbbf24" fontSize="12">{`Delta/eta = ${formatNumber(result.deltaEta, 2)}, nu_t/nu = ${formatNumber(result.sgsRatio, 2)}`}</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Delta (m)" value={formatNumber(result.delta)} color="#fbbf24" />
        <MetricCard label="eta (m)" value={formatNumber(result.eta)} color="#34d399" />
        <MetricCard label="Delta / eta" value={formatNumber(result.deltaEta, 2)} color="#22d3ee" />
        <MetricCard label="nu_sgs / nu" value={formatNumber(result.sgsRatio, 2)} color="#fb7185" />
        <MetricCard label="nu_sgs (m^2/s)" value={formatNumber(result.nuSgs)} color="#a78bfa" />
        <MetricCard label="tau_eta (s)" value={formatNumber(result.tauEta)} color="#34d399" />
        <MetricCard label="u_eta (m/s)" value={formatNumber(result.uEta)} color="#22d3ee" />
        <MetricCard label="verdict" value={result.modeName} color="#fbbf24" />
      </div>

      <Note>
        The geometric filter uses Delta = (dx dy dz)^(1/3). The max-spacing option is more conservative for stretched cells.
        Treat this as a planning sanity check, not a replacement for spectra, resolved kinetic energy, or grid-convergence evidence.
      </Note>
    </CalculatorPanel>
  )
}
