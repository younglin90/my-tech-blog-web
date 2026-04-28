'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

type SkinFrictionModel = 'laminar' | 'turbulent'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function yPlusPosition(yPlus: number) {
  const log = Math.log10(Math.max(yPlus, 0.1))
  return 300 - clamp((log + 1) / 4, 0, 1) * 230
}

function classifyYPlus(yPlus: number) {
  if (yPlus < 5) return 'viscous sublayer'
  if (yPlus < 30) return 'buffer layer'
  if (yPlus < 300) return 'log-law layer'
  return 'outer-layer / too coarse'
}

export function YPlusWallVisualizerCalculator() {
  const [rho, setRho] = useState(1.225)
  const [mu, setMu] = useState(1.8e-5)
  const [uInf, setUInf] = useState(30)
  const [length, setLength] = useState(1)
  const [targetYPlus, setTargetYPlus] = useState(1)
  const [model, setModel] = useState<SkinFrictionModel>('turbulent')

  const result = useMemo(() => {
    const reL = (rho * uInf * length) / Math.max(mu, 1e-12)
    const cf = model === 'laminar'
      ? 0.664 / Math.sqrt(Math.max(reL, 1e-12))
      : 0.026 / Math.pow(Math.max(reL, 1e-12), 1 / 7)
    const uTau = uInf * Math.sqrt(Math.max(cf, 0) / 2)
    const y = (targetYPlus * mu) / Math.max(rho * uTau, 1e-12)
    const yMarker = yPlusPosition(targetYPlus)
    return { reL, cf, uTau, y, yMm: y * 1000, yMarker, layer: classifyYPlus(targetYPlus) }
  }, [length, model, mu, rho, targetYPlus, uInf])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-6} />
        <NumberField label="mu (Pa*s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
        <NumberField label="U_inf (m/s)" value={uInf} onChange={setUInf} step={0.5} min={0} />
        <NumberField label="reference length L (m)" value={length} onChange={setLength} step={0.01} min={1e-6} />
        <NumberField label="target y+" value={targetYPlus} onChange={setTargetYPlus} step={0.5} min={0.1} />
        <SelectField
          label="skin-friction model"
          value={model}
          onChange={(value) => setModel(value as SkinFrictionModel)}
          options={[
            { value: 'turbulent', label: 'turbulent flat plate' },
            { value: 'laminar', label: 'laminar flat plate' },
          ]}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="y plus wall layer visualizer">
          <rect x="58" y="50" width="544" height="270" rx="18" fill="#08111f" />
          <rect x="110" y={yPlusPosition(5)} width="410" height={300 - yPlusPosition(5)} fill="#22d3ee" opacity="0.16" />
          <rect x="110" y={yPlusPosition(30)} width="410" height={yPlusPosition(5) - yPlusPosition(30)} fill="#fbbf24" opacity="0.16" />
          <rect x="110" y={yPlusPosition(300)} width="410" height={yPlusPosition(30) - yPlusPosition(300)} fill="#34d399" opacity="0.14" />
          <rect x="110" y="70" width="410" height={yPlusPosition(300) - 70} fill="#fb7185" opacity="0.12" />

          {[0.1, 1, 5, 30, 100, 300, 1000].map((tick) => (
            <g key={tick}>
              <line x1="110" x2="520" y1={yPlusPosition(tick)} y2={yPlusPosition(tick)} stroke="rgba(226,232,240,0.2)" strokeDasharray="5 5" />
              <text x="62" y={yPlusPosition(tick) + 4} fill="var(--text-muted)" fontSize="11">{`y+ ${tick}`}</text>
            </g>
          ))}

          <rect x="110" y="300" width="410" height="18" rx="4" fill="#94a3b8" opacity="0.38" />
          <path d="M126 318 C170 303, 210 303, 254 318 S342 333, 386 318 S474 303, 512 318" fill="none" stroke="#e2e8f0" strokeOpacity="0.35" strokeWidth="2" />
          <line x1="142" x2="498" y1={result.yMarker} y2={result.yMarker} stroke="#f8fafc" strokeOpacity="0.68" />
          <circle cx="320" cy={result.yMarker} r="10" fill="#22d3ee" />
          <circle cx="320" cy={result.yMarker} r="18" fill="none" stroke="#22d3ee" strokeOpacity="0.35">
            <animate attributeName="r" values="12;25;12" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2.1s" repeatCount="indefinite" />
          </circle>

          <text x="72" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Wall-unit placement</text>
          <text x="536" y={yPlusPosition(2)} fill="#67e8f9" fontSize="12">viscous</text>
          <text x="536" y={yPlusPosition(12)} fill="#fde68a" fontSize="12">buffer</text>
          <text x="536" y={yPlusPosition(90)} fill="#86efac" fontSize="12">log-law</text>
          <text x="536" y={yPlusPosition(520)} fill="#fecaca" fontSize="12">coarse</text>
          <text x="246" y="344" fill="var(--text-muted)" fontSize="12">first-cell center from target y+</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="first-cell y (mm)" value={formatNumber(result.yMm)} color="#22d3ee" />
        <MetricCard label="u_tau (m/s)" value={formatNumber(result.uTau)} color="#fbbf24" />
        <MetricCard label="Re_L" value={formatNumber(result.reL)} color="#34d399" />
        <MetricCard label="wall layer" value={result.layer} color="#fb7185" />
      </div>
      <Note>Target y+ near 1 supports wall-resolved meshes. Wall functions usually need the first cell center in the log-law band, not inside the buffer layer.</Note>
    </CalculatorPanel>
  )
}
