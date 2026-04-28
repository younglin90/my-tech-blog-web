'use client'

import { useMemo, useState } from 'react'
import { maxObliqueThetaDeg, obliqueShockFromBeta, obliqueShockFromTheta } from '@/lib/compressible'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function pointOnRay(originX: number, originY: number, angleDeg: number, length: number) {
  const a = toRad(angleDeg)
  return {
    x: originX + Math.cos(a) * length,
    y: originY - Math.sin(a) * length,
  }
}

function buildPath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
}

export function ShockPolarVisualizerCalculator() {
  const [gamma, setGamma] = useState(1.4)
  const [mach, setMach] = useState(2.5)
  const [theta, setTheta] = useState(12)

  const result = useMemo(() => {
    const safeMach = Math.max(mach, 1.0001)
    const safeGamma = Math.max(gamma, 1.01)
    const thetaMax = maxObliqueThetaDeg(safeMach, safeGamma)
    const selectedTheta = clamp(theta, 0, Math.max(thetaMax, 0))
    const weak = obliqueShockFromTheta(safeMach, selectedTheta, safeGamma, 'weak')
    const strong = obliqueShockFromTheta(safeMach, selectedTheta, safeGamma, 'strong')
    const betaMin = Math.asin(1 / safeMach) * 180 / Math.PI
    const samples = Array.from({ length: 180 }, (_, index) => {
      const beta = betaMin + 0.02 + ((89.8 - betaMin) * index) / 179
      const state = obliqueShockFromBeta(safeMach, beta, safeGamma)
      return state ? { beta, theta: state.thetaDeg, pRatio: state.p2_p1, m2: state.M2 } : null
    }).filter((sample): sample is { beta: number; theta: number; pRatio: number; m2: number } => Boolean(sample))
    const peak = samples.reduce((best, sample) => (sample.theta > best.theta ? sample : best), samples[0])
    return { betaMin, peak, samples, selectedTheta, strong, thetaMax, weak }
  }, [gamma, mach, theta])

  const xMin = 78
  const xMax = 610
  const yMin = 78
  const yMax = 276
  const thetaScaleMax = Math.max(result.thetaMax * 1.12, 4)
  const betaScaleMin = Math.max(result.betaMin, 0)
  const betaScaleMax = 90
  const xOfTheta = (thetaDeg: number) => xMin + (clamp(thetaDeg, 0, thetaScaleMax) / thetaScaleMax) * (xMax - xMin)
  const yOfBeta = (betaDeg: number) => yMax - ((clamp(betaDeg, betaScaleMin, betaScaleMax) - betaScaleMin) / Math.max(betaScaleMax - betaScaleMin, 1e-6)) * (yMax - yMin)
  const peakIndex = result.samples.findIndex((sample) => sample === result.peak)
  const weakCurve = result.samples.slice(0, Math.max(peakIndex + 1, 1)).map((sample) => ({ x: xOfTheta(sample.theta), y: yOfBeta(sample.beta) }))
  const strongCurve = result.samples.slice(Math.max(peakIndex, 0)).map((sample) => ({ x: xOfTheta(sample.theta), y: yOfBeta(sample.beta) }))
  const selectedX = xOfTheta(result.selectedTheta)
  const weakPoint = result.weak ? { x: xOfTheta(result.weak.thetaDeg), y: yOfBeta(result.weak.betaDeg) } : null
  const strongPoint = result.strong ? { x: xOfTheta(result.strong.thetaDeg), y: yOfBeta(result.strong.betaDeg) } : null
  const pivot = { x: 188, y: 330 }
  const wedgeTop = pointOnRay(pivot.x, pivot.y, result.selectedTheta, 118)
  const weakShock = result.weak ? pointOnRay(pivot.x, pivot.y, result.weak.betaDeg, 196) : null
  const strongShock = result.strong ? pointOnRay(pivot.x, pivot.y, result.strong.betaDeg, 156) : null

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="M1" value={mach} onChange={setMach} step={0.05} min={1.0001} />
        <NumberField label="gamma" value={gamma} onChange={setGamma} step={0.01} min={1.01} />
        <NumberField label="turn angle theta (deg)" value={theta} onChange={setTheta} step={0.25} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 720 420" className="h-auto w-full" role="img" aria-label="Oblique shock theta beta Mach polar">
          <defs>
            <linearGradient id="shockPolarDetached" x1="0" x2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.23" />
            </linearGradient>
          </defs>

          <rect x="42" y="34" width="636" height="344" rx="22" fill="#08111f" />
          <text x="66" y="62" fill="var(--text)" fontSize="16" fontWeight="700">Theta-beta-M shock map</text>
          <text x="66" y="84" fill="var(--text-muted)" fontSize="12">weak and strong attached-shock branches</text>

          <rect x={xOfTheta(result.thetaMax)} y={yMin} width={Math.max(xMax - xOfTheta(result.thetaMax), 0)} height={yMax - yMin} fill="url(#shockPolarDetached)" />
          <line x1={xMin} x2={xMax} y1={yMax} y2={yMax} stroke="rgba(226,232,240,0.38)" />
          <line x1={xMin} x2={xMin} y1={yMin} y2={yMax} stroke="rgba(226,232,240,0.38)" />

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const x = xMin + (xMax - xMin) * fraction
            const thetaTick = thetaScaleMax * fraction
            return (
              <g key={`x-${fraction}`}>
                <line x1={x} x2={x} y1={yMin} y2={yMax} stroke="rgba(226,232,240,0.08)" />
                <text x={x - 12} y={yMax + 19} fill="var(--text-muted)" fontSize="10">{thetaTick.toFixed(0)}</text>
              </g>
            )
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = yMax - (yMax - yMin) * fraction
            const betaTick = betaScaleMin + (betaScaleMax - betaScaleMin) * fraction
            return (
              <g key={`y-${fraction}`}>
                <line x1={xMin} x2={xMax} y1={y} y2={y} stroke="rgba(226,232,240,0.08)" />
                <text x="48" y={y + 4} fill="var(--text-muted)" fontSize="10">{betaTick.toFixed(0)}</text>
              </g>
            )
          })}

          <path d={buildPath(weakCurve)} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <path d={buildPath(strongCurve)} fill="none" stroke="#fbbf24" strokeWidth="3" />
          <line x1={selectedX} x2={selectedX} y1={yMin} y2={yMax} stroke="#e2e8f0" strokeDasharray="6 6" strokeOpacity="0.58" />
          <circle cx={xOfTheta(result.thetaMax)} cy={yOfBeta(result.peak?.beta ?? 90)} r="6" fill="#fb7185" />
          {weakPoint && <circle cx={weakPoint.x} cy={weakPoint.y} r="7" fill="#22d3ee" />}
          {strongPoint && <circle cx={strongPoint.x} cy={strongPoint.y} r="7" fill="#fbbf24" />}

          <text x={xMin + 8} y={yMin + 18} fill="var(--text-muted)" fontSize="11">beta (deg)</text>
          <text x={xMax - 78} y={yMax + 38} fill="var(--text-muted)" fontSize="11">theta (deg)</text>
          <text x={xOfTheta(result.thetaMax) + 8} y={yMin + 20} fill="#fecaca" fontSize="11">detached region</text>
          <text x={selectedX + 8} y={yMax - 12} fill="#e2e8f0" fontSize="11">{`theta=${formatNumber(result.selectedTheta, 1)} deg`}</text>

          <line x1="78" x2="350" y1="330" y2="330" stroke="#67e8f9" strokeWidth="2.4" strokeOpacity="0.75" />
          <polygon points="350,330 336,323 338,337" fill="#67e8f9" opacity="0.75" />
          <polygon points={`${pivot.x},${pivot.y} ${wedgeTop.x},${wedgeTop.y} ${pivot.x + 118},${pivot.y}`} fill="#64748b" opacity="0.34" stroke="#cbd5e1" strokeOpacity="0.38" />
          {weakShock && <line x1={pivot.x} x2={weakShock.x} y1={pivot.y} y2={weakShock.y} stroke="#22d3ee" strokeWidth="3" />}
          {strongShock && <line x1={pivot.x} x2={strongShock.x} y1={pivot.y} y2={strongShock.y} stroke="#fbbf24" strokeWidth="2.4" strokeDasharray="8 6" />}
          <text x="82" y="352" fill="#67e8f9" fontSize="11">supersonic inflow</text>
          <text x="252" y="360" fill="#cbd5e1" fontSize="11">compression corner</text>
          <text x="404" y="318" fill="#22d3ee" fontSize="11">weak</text>
          <text x="404" y="336" fill="#fbbf24" fontSize="11">strong</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="theta max (deg)" value={formatNumber(result.thetaMax, 2)} color="#fb7185" />
        <MetricCard label="Mach angle (deg)" value={formatNumber(result.betaMin, 2)} color="#34d399" />
        <MetricCard label="weak beta (deg)" value={formatNumber(result.weak?.betaDeg ?? Number.NaN, 2)} color="#22d3ee" />
        <MetricCard label="strong beta (deg)" value={formatNumber(result.strong?.betaDeg ?? Number.NaN, 2)} color="#fbbf24" />
        <MetricCard label="weak M2" value={formatNumber(result.weak?.M2 ?? Number.NaN, 3)} color="#22d3ee" />
        <MetricCard label="strong M2" value={formatNumber(result.strong?.M2 ?? Number.NaN, 3)} color="#fbbf24" />
        <MetricCard label="weak p2/p1" value={formatNumber(result.weak?.p2_p1 ?? Number.NaN, 3)} color="#a78bfa" />
        <MetricCard label="detachment margin" value={`${formatNumber(result.thetaMax - result.selectedTheta, 2)} deg`} color="#fb7185" />
      </div>

      <Note>
        The curve follows the theta-beta-M relation for attached oblique shocks. When the requested turn angle exceeds theta max,
        the attached solution disappears and a detached bow shock is expected.
      </Note>
    </CalculatorPanel>
  )
}
