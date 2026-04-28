'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function scoreFromMetric(value: number, warn: number, fail: number) {
  if (value <= warn) return 1
  if (value >= fail) return 0
  return 1 - (value - warn) / (fail - warn)
}

function qualityColor(score: number) {
  if (score > 0.75) return '#34d399'
  if (score > 0.45) return '#fbbf24'
  return '#fb7185'
}

function verdict(score: number) {
  if (score > 0.75) return 'solver-friendly'
  if (score > 0.45) return 'use caution'
  return 'high divergence risk'
}

export function MeshQualityVisualizerCalculator() {
  const [nonOrthogonality, setNonOrthogonality] = useState(48)
  const [skewness, setSkewness] = useState(0.28)
  const [aspectRatio, setAspectRatio] = useState(8)
  const [volumeRatio, setVolumeRatio] = useState(6)

  const result = useMemo(() => {
    const nonOrthoScore = scoreFromMetric(nonOrthogonality, 65, 85)
    const skewScore = scoreFromMetric(skewness, 0.35, 0.85)
    const aspectScore = scoreFromMetric(aspectRatio, 10, 30)
    const volumeScore = scoreFromMetric(volumeRatio, 10, 80)
    const minScore = Math.min(nonOrthoScore, skewScore, aspectScore, volumeScore)
    const combined = (nonOrthoScore + skewScore + aspectScore + volumeScore + minScore) / 5
    const recommendedCorrectors = nonOrthogonality < 75 ? 0 : nonOrthogonality < 82 ? 1 : nonOrthogonality < 85 ? 2 : 3
    return {
      nonOrthoScore,
      skewScore,
      aspectScore,
      volumeScore,
      combined,
      recommendedCorrectors,
      verdict: verdict(combined),
      color: qualityColor(combined),
    }
  }, [aspectRatio, nonOrthogonality, skewness, volumeRatio])

  const skewOffset = clamp(skewness, 0, 1.2) * 56
  const topStretch = clamp(aspectRatio / 10, 0.4, 3.2) * 42
  const tilt = clamp(nonOrthogonality / 90, 0, 1) * 78
  const volumeBulge = clamp(Math.log10(Math.max(volumeRatio, 1)), 0, 2) * 18
  const p1 = { x: 180 - topStretch / 2, y: 115 }
  const p2 = { x: 430 + topStretch / 2 + skewOffset, y: 115 + tilt * 0.22 }
  const p3 = { x: 470 + skewOffset * 0.45 + volumeBulge, y: 255 }
  const p4 = { x: 210 - tilt * 0.28, y: 255 - volumeBulge }
  const cellPath = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} Z`
  const center = {
    x: (p1.x + p2.x + p3.x + p4.x) / 4,
    y: (p1.y + p2.y + p3.y + p4.y) / 4,
  }
  const faceCenter = {
    x: (p2.x + p3.x) / 2,
    y: (p2.y + p3.y) / 2,
  }

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="max non-orthogonality (deg)" value={nonOrthogonality} onChange={setNonOrthogonality} step={1} min={0} max={90} />
        <NumberField label="max skewness" value={skewness} onChange={setSkewness} step={0.05} min={0} />
        <NumberField label="max aspect ratio" value={aspectRatio} onChange={setAspectRatio} step={1} min={1} />
        <NumberField label="max volume ratio" value={volumeRatio} onChange={setVolumeRatio} step={1} min={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Mesh quality visualizer">
          <defs>
            <linearGradient id="meshQualityFill" x1="0" x2="1">
              <stop offset="0%" stopColor={result.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <path d={cellPath} fill="url(#meshQualityFill)" stroke={result.color} strokeWidth="4" strokeLinejoin="round" />
          <path d={`M${center.x} ${center.y} L${faceCenter.x} ${faceCenter.y}`} stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${faceCenter.x} ${faceCenter.y} L${faceCenter.x + 64} ${faceCenter.y - 72}`} stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
          <circle cx={center.x} cy={center.y} r="8" fill="#fbbf24" />
          <circle cx={faceCenter.x} cy={faceCenter.y} r="8" fill="#22d3ee" />
          <circle cx={center.x} cy={center.y} r="18" fill="none" stroke={result.color} strokeOpacity="0.35">
            <animate attributeName="r" values="12;25;12" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2.2s" repeatCount="indefinite" />
          </circle>

          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Mesh quality risk map</text>
          <text x="424" y="88" fill="#67e8f9" fontSize="12">face normal direction</text>
          <text x="402" y="218" fill="#fde68a" fontSize="12">cell-center connector</text>
          <text x="84" y="304" fill={result.color} fontSize="14" fontWeight="700">{result.verdict}</text>
          <text x="84" y="326" fill="var(--text-muted)" fontSize="12">shape exaggerates bad metrics to make solver risk visible</text>

          <g transform="translate(470 250)">
            <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="10" />
            <path
              d={`M0 -48 A48 48 0 ${result.combined > 0.5 ? 1 : 0} 1 ${Math.sin(result.combined * Math.PI * 2) * 48} ${-Math.cos(result.combined * Math.PI * 2) * 48}`}
              fill="none"
              stroke={result.color}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <text x="-27" y="5" fill={result.color} fontSize="14" fontWeight="700">{`${Math.round(result.combined * 100)}%`}</text>
          </g>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="combined quality" value={`${formatNumber(result.combined * 100, 1)}%`} color={result.color} />
        <MetricCard label="verdict" value={result.verdict} color={result.color} />
        <MetricCard label="non-ortho score" value={`${formatNumber(result.nonOrthoScore * 100, 1)}%`} color="#22d3ee" />
        <MetricCard label="skewness score" value={`${formatNumber(result.skewScore * 100, 1)}%`} color="#fbbf24" />
        <MetricCard label="aspect score" value={`${formatNumber(result.aspectScore * 100, 1)}%`} color="#34d399" />
        <MetricCard label="volume score" value={`${formatNumber(result.volumeScore * 100, 1)}%`} color="#a78bfa" />
        <MetricCard label="non-ortho correctors" value={String(result.recommendedCorrectors)} color="#fb7185" />
        <MetricCard label="limiting metric" value={Math.min(result.nonOrthoScore, result.skewScore, result.aspectScore, result.volumeScore) === result.nonOrthoScore ? 'non-orthogonality' : Math.min(result.skewScore, result.aspectScore, result.volumeScore) === result.skewScore ? 'skewness' : result.aspectScore < result.volumeScore ? 'aspect ratio' : 'volume ratio'} color={result.color} />
      </div>
      <Note>Use this as a triage view for meshing logs. If the warning comes from only a few cells, locate them before changing numerics globally.</Note>
    </CalculatorPanel>
  )
}
