'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function riskColor(risk: number) {
  if (risk < 0.35) return '#34d399'
  if (risk < 0.7) return '#fbbf24'
  return '#fb7185'
}

function riskLabel(sigma: number) {
  if (sigma < 1) return 'cavitation likely'
  if (sigma < 2) return 'watch inception margin'
  return 'comfortable margin'
}

export function CavitationRiskVisualizerCalculator() {
  const [pInf, setPInf] = useState(101325)
  const [pVapor, setPVapor] = useState(3169)
  const [rho, setRho] = useState(998)
  const [speed, setSpeed] = useState(15)
  const [localDrop, setLocalDrop] = useState(78000)

  const result = useMemo(() => {
    const q = 0.5 * rho * speed * speed
    const pLocal = pInf - localDrop
    const sigma = (pLocal - pVapor) / Math.max(q, 1e-12)
    const globalSigma = (pInf - pVapor) / Math.max(q, 1e-12)
    const margin = pLocal - pVapor
    const risk = clamp(1 - sigma / 2, 0, 1)
    const bubbleCount = Math.round(4 + risk * 18)
    return { q, pLocal, sigma, globalSigma, margin, risk, bubbleCount, color: riskColor(risk), label: riskLabel(sigma) }
  }, [localDrop, pInf, pVapor, rho, speed])

  const bubbles = Array.from({ length: result.bubbleCount }, (_, i) => {
    const t = i / Math.max(result.bubbleCount - 1, 1)
    return {
      cx: 132 + t * 410,
      cy: 180 + Math.sin(i * 1.9) * 42 + result.risk * Math.cos(i * 0.8) * 18,
      r: 4 + result.risk * 13 * (0.45 + ((i * 7) % 10) / 10),
      opacity: 0.16 + result.risk * 0.45,
    }
  })

  const vaporY = 282
  const localY = 282 - clamp((result.pLocal - pVapor) / Math.max(pInf - pVapor, 1), 0, 1) * 190
  const infY = 92

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="p_inf (Pa)" value={pInf} onChange={setPInf} step={1000} min={0} />
        <NumberField label="p_vapor (Pa)" value={pVapor} onChange={setPVapor} step={100} min={0} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-9} />
        <NumberField label="U (m/s)" value={speed} onChange={setSpeed} step={0.5} min={0} />
        <NumberField label="local pressure drop (Pa)" value={localDrop} onChange={setLocalDrop} step={1000} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Cavitation risk visualizer">
          <defs>
            <linearGradient id="cavitationWater" x1="0" x2="1">
              <stop offset="0%" stopColor="#0e7490" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <path d="M92 180 C162 118, 246 118, 314 180 S462 242, 568 180" fill="none" stroke="url(#cavitationWater)" strokeWidth="58" strokeLinecap="round" />
          <path d="M92 180 C162 118, 246 118, 314 180 S462 242, 568 180" fill="none" stroke="#67e8f9" strokeWidth="3" strokeOpacity="0.58" strokeDasharray="9 8" />

          {bubbles.map((bubble, i) => (
            <circle key={i} cx={bubble.cx} cy={bubble.cy} r={bubble.r} fill="none" stroke={result.color} strokeWidth="2" opacity={bubble.opacity}>
              <animate attributeName="cy" values={`${bubble.cy};${bubble.cy - 10};${bubble.cy}`} dur={`${2.4 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          <line x1="92" x2="568" y1={vaporY} y2={vaporY} stroke="#fb7185" strokeOpacity="0.8" strokeDasharray="6 5" />
          <line x1="92" x2="568" y1={localY} y2={localY} stroke={result.color} strokeWidth="4" />
          <line x1="92" x2="568" y1={infY} y2={infY} stroke="#34d399" strokeOpacity="0.8" strokeDasharray="6 5" />
          <text x="78" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Cavitation pressure margin</text>
          <text x="574" y={infY + 4} fill="#bbf7d0" fontSize="12">p_inf</text>
          <text x="574" y={localY + 4} fill={result.color} fontSize="12">p_local</text>
          <text x="574" y={vaporY + 4} fill="#fecaca" fontSize="12">p_vapor</text>
          <text x="96" y="306" fill={result.color} fontSize="14" fontWeight="700">{result.label}</text>
          <text x="96" y="326" fill="var(--text-muted)" fontSize="12">bubbles grow as local pressure approaches vapor pressure</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="local cavitation number" value={formatNumber(result.sigma)} color={result.color} />
        <MetricCard label="freestream sigma" value={formatNumber(result.globalSigma)} color="#22d3ee" />
        <MetricCard label="p_local (Pa)" value={formatNumber(result.pLocal)} color={result.color} />
        <MetricCard label="pressure margin (Pa)" value={formatNumber(result.margin)} color={result.color} />
        <MetricCard label="dynamic pressure (Pa)" value={formatNumber(result.q)} color="#34d399" />
        <MetricCard label="risk index" value={`${formatNumber(result.risk * 100, 1)}%`} color={result.color} />
        <MetricCard label="bubble markers" value={String(result.bubbleCount)} color="#fbbf24" />
        <MetricCard label="verdict" value={result.label} color={result.color} />
      </div>
      <Note>This is a screening view. Real cavitating flows require local pressure fields, nuclei assumptions, and an appropriate cavitation model.</Note>
    </CalculatorPanel>
  )
}
