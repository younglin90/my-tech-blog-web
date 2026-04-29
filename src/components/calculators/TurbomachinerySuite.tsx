'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const GAMMA_AIR = 1.4
const R_AIR = 287.05

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function xScale(value: number, min: number, max: number, left = 56, width = 496) {
  return left + clamp((value - min) / Math.max(max - min, 1e-12), 0, 1) * width
}

function yScale(value: number, min: number, max: number, top = 42, height = 188) {
  return top + (1 - clamp((value - min) / Math.max(max - min, 1e-12), 0, 1)) * height
}

export function PumpAffinityLawsCalculator() {
  const [flow1, setFlow1] = useState(0.08)
  const [head1, setHead1] = useState(35)
  const [power1, setPower1] = useState(4200)
  const [rpm1, setRpm1] = useState(1800)
  const [rpm2, setRpm2] = useState(2400)
  const [diameter1, setDiameter1] = useState(0.22)
  const [diameter2, setDiameter2] = useState(0.22)

  const result = useMemo(() => {
    const nRatio = rpm2 / Math.max(rpm1, 1e-12)
    const dRatio = diameter2 / Math.max(diameter1, 1e-12)
    const flow2 = flow1 * nRatio * Math.pow(dRatio, 3)
    const head2 = head1 * nRatio * nRatio * dRatio * dRatio
    const power2 = power1 * Math.pow(nRatio, 3) * Math.pow(dRatio, 5)
    return { nRatio, dRatio, flow2, head2, power2 }
  }, [diameter1, diameter2, flow1, head1, power1, rpm1, rpm2])

  const maxBar = Math.max(flow1, result.flow2, head1 / 100, result.head2 / 100, power1 / 10000, result.power2 / 10000, 1e-9)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="Q1 (m3/s)" value={flow1} onChange={setFlow1} step={0.005} min={0} />
        <NumberField label="H1 (m)" value={head1} onChange={setHead1} step={1} min={0} />
        <NumberField label="P1 (W)" value={power1} onChange={setPower1} step={100} min={0} />
        <NumberField label="rpm1" value={rpm1} onChange={setRpm1} step={50} min={1} />
        <NumberField label="rpm2" value={rpm2} onChange={setRpm2} step={50} min={0} />
        <NumberField label="D1 (m)" value={diameter1} onChange={setDiameter1} step={0.01} min={1e-9} />
        <NumberField label="D2 (m)" value={diameter2} onChange={setDiameter2} step={0.01} min={1e-9} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <AffinityBar label="flow" before={flow1} after={result.flow2} scale={maxBar} color="#22d3ee" />
        <AffinityBar label="head / 100" before={head1 / 100} after={result.head2 / 100} scale={maxBar} color="#fbbf24" />
        <AffinityBar label="power / 10000" before={power1 / 10000} after={result.power2 / 10000} scale={maxBar} color="#fb7185" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="N2/N1" value={formatNumber(result.nRatio, 4)} color="#22d3ee" />
        <MetricCard label="D2/D1" value={formatNumber(result.dRatio, 4)} color="#34d399" />
        <MetricCard label="Q2 (m3/s)" value={formatNumber(result.flow2, 4)} color="#fbbf24" />
        <MetricCard label="H2 (m)" value={formatNumber(result.head2, 3)} color="#fb7185" />
        <MetricCard label="P2 (W)" value={formatNumber(result.power2, 2)} color="#a78bfa" />
      </div>
      <Note>Affinity laws are first-pass similarity scalings. Cavitation, Reynolds effects, and off-design separation can break them.</Note>
    </CalculatorPanel>
  )
}

export function FanSystemCurveMatcherCalculator() {
  const [shutoffPressure, setShutoffPressure] = useState(900)
  const [freeFlow, setFreeFlow] = useState(1.8)
  const [systemK, setSystemK] = useState(240)
  const [rpmRatio, setRpmRatio] = useState(1)

  const result = useMemo(() => {
    const dp0 = shutoffPressure * rpmRatio * rpmRatio
    const qmax = freeFlow * rpmRatio
    const denom = systemK + dp0 / Math.max(qmax * qmax, 1e-12)
    const q = Math.sqrt(dp0 / Math.max(denom, 1e-12))
    const dp = systemK * q * q
    const fanDp = dp0 * (1 - (q / Math.max(qmax, 1e-12)) ** 2)
    return { dp0, qmax, q, dp, fanDp, airPower: q * dp }
  }, [freeFlow, rpmRatio, shutoffPressure, systemK])

  const fanCurve = useMemo(() => {
    const points: string[] = []
    for (let i = 0; i <= 80; i++) {
      const q = (result.qmax * 1.05 * i) / 80
      const dp = Math.max(0, result.dp0 * (1 - (q / Math.max(result.qmax, 1e-12)) ** 2))
      points.push(`${i === 0 ? 'M' : 'L'}${xScale(q, 0, result.qmax * 1.05).toFixed(1)} ${yScale(dp, 0, result.dp0).toFixed(1)}`)
    }
    return points.join(' ')
  }, [result.dp0, result.qmax])

  const systemCurve = useMemo(() => {
    const points: string[] = []
    for (let i = 0; i <= 80; i++) {
      const q = (result.qmax * 1.05 * i) / 80
      const dp = systemK * q * q
      points.push(`${i === 0 ? 'M' : 'L'}${xScale(q, 0, result.qmax * 1.05).toFixed(1)} ${yScale(dp, 0, result.dp0).toFixed(1)}`)
    }
    return points.join(' ')
  }, [result.dp0, result.qmax, systemK])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="fan shutoff dp (Pa)" value={shutoffPressure} onChange={setShutoffPressure} step={50} min={0} />
        <NumberField label="free flow Qmax (m3/s)" value={freeFlow} onChange={setFreeFlow} step={0.1} min={1e-9} />
        <NumberField label="system K (Pa/(m3/s)^2)" value={systemK} onChange={setSystemK} step={10} min={0} />
        <NumberField label="rpm ratio" value={rpmRatio} onChange={setRpmRatio} step={0.05} min={0.05} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 300" className="h-auto w-full" role="img" aria-label="Fan and system curve match">
          <rect x="56" y="42" width="496" height="188" rx="16" fill="#08111f" />
          <path d={fanCurve} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <path d={systemCurve} fill="none" stroke="#fb7185" strokeWidth="3" />
          <circle cx={xScale(result.q, 0, result.qmax * 1.05)} cy={yScale(result.dp, 0, result.dp0)} r="8" fill="#fbbf24" />
          <text x="76" y="68" fill="var(--text)" fontSize="15" fontWeight="700">fan curve and system curve</text>
          <text x="392" y="68" fill="#22d3ee" fontSize="12">fan</text>
          <text x="438" y="68" fill="#fb7185" fontSize="12">system</text>
          <text x="270" y="284" fill="var(--text-muted)" fontSize="12">Q</text>
          <text x="14" y="150" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 14 150)">Delta p</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="operating Q (m3/s)" value={formatNumber(result.q, 4)} color="#22d3ee" />
        <MetricCard label="operating dp (Pa)" value={formatNumber(result.dp, 3)} color="#34d399" />
        <MetricCard label="fan dp at Q (Pa)" value={formatNumber(result.fanDp, 3)} color="#fbbf24" />
        <MetricCard label="air power (W)" value={formatNumber(result.airPower, 3)} color="#fb7185" />
        <MetricCard label="scaled Qmax" value={formatNumber(result.qmax, 4)} color="#a78bfa" />
      </div>
      <Note>Use for HVAC/duct CFD boundary estimates. Real fan curves should replace the parabolic surrogate when available.</Note>
    </CalculatorPanel>
  )
}

export function CompressorCorrectedFlowCalculator() {
  const [massFlow, setMassFlow] = useState(12)
  const [totalTemp, setTotalTemp] = useState(310)
  const [totalPressure, setTotalPressure] = useState(105000)
  const [rpm, setRpm] = useState(24000)
  const [pressureRatio, setPressureRatio] = useState(1.8)

  const result = useMemo(() => {
    const theta = totalTemp / 288.15
    const delta = totalPressure / 101325
    const correctedMassFlow = massFlow * Math.sqrt(theta) / Math.max(delta, 1e-12)
    const correctedSpeed = rpm / Math.sqrt(Math.max(theta, 1e-12))
    const specificWork = 1004.5 * totalTemp * (Math.pow(pressureRatio, (GAMMA_AIR - 1) / GAMMA_AIR) - 1)
    return { theta, delta, correctedMassFlow, correctedSpeed, specificWork }
  }, [massFlow, pressureRatio, rpm, totalPressure, totalTemp])

  const cx = xScale(result.correctedMassFlow, 0, 30)
  const cy = yScale(pressureRatio, 1, 3.2)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="mdot (kg/s)" value={massFlow} onChange={setMassFlow} step={0.5} min={0} />
        <NumberField label="Tt (K)" value={totalTemp} onChange={setTotalTemp} step={5} min={1} />
        <NumberField label="Pt (Pa)" value={totalPressure} onChange={setTotalPressure} step={1000} min={1} />
        <NumberField label="rpm" value={rpm} onChange={setRpm} step={500} min={0} />
        <NumberField label="pressure ratio" value={pressureRatio} onChange={setPressureRatio} step={0.05} min={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 300" className="h-auto w-full" role="img" aria-label="Compressor corrected flow map point">
          <rect x="56" y="42" width="496" height="188" rx="16" fill="#08111f" />
          {[1.2, 1.6, 2.0, 2.4, 2.8].map((pr, i) => (
            <path key={pr} d={`M${xScale(3 + i * 1.5, 0, 30)} ${yScale(pr, 1, 3.2)} C${xScale(12 + i, 0, 30)} ${yScale(pr + 0.35, 1, 3.2)} ${xScale(22 + i, 0, 30)} ${yScale(pr + 0.18, 1, 3.2)} ${xScale(28, 0, 30)} ${yScale(pr - 0.15, 1, 3.2)}`} fill="none" stroke="#22d3ee" strokeOpacity={0.25 + i * 0.12} strokeWidth="2" />
          ))}
          <circle cx={cx} cy={cy} r="9" fill="#fbbf24" />
          <text x="76" y="68" fill="var(--text)" fontSize="15" fontWeight="700">corrected map coordinate</text>
          <text x="238" y="284" fill="var(--text-muted)" fontSize="12">corrected mass flow</text>
          <text x="14" y="152" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 14 152)">pressure ratio</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="theta" value={formatNumber(result.theta, 4)} color="#22d3ee" />
        <MetricCard label="delta" value={formatNumber(result.delta, 4)} color="#34d399" />
        <MetricCard label="corrected mdot" value={formatNumber(result.correctedMassFlow, 4)} color="#fbbf24" />
        <MetricCard label="corrected rpm" value={formatNumber(result.correctedSpeed, 2)} color="#fb7185" />
        <MetricCard label="ideal work (J/kg)" value={formatNumber(result.specificWork, 2)} color="#a78bfa" />
      </div>
      <Note>Corrected variables let compressor CFD and test points collapse onto a common map across inlet conditions.</Note>
    </CalculatorPanel>
  )
}

export function BladeTipMachReynoldsCalculator() {
  const [rpm, setRpm] = useState(12000)
  const [radius, setRadius] = useState(0.18)
  const [chord, setChord] = useState(0.035)
  const [axialVelocity, setAxialVelocity] = useState(80)
  const [temperature, setTemperature] = useState(288.15)
  const [rho, setRho] = useState(1.225)
  const [mu, setMu] = useState(1.8e-5)

  const result = useMemo(() => {
    const omega = (2 * Math.PI * rpm) / 60
    const tipSpeed = omega * radius
    const relativeSpeed = Math.hypot(tipSpeed, axialVelocity)
    const soundSpeed = Math.sqrt(GAMMA_AIR * R_AIR * Math.max(temperature, 1e-9))
    const mach = relativeSpeed / soundSpeed
    const reynolds = rho * relativeSpeed * chord / Math.max(mu, 1e-12)
    return { omega, tipSpeed, relativeSpeed, soundSpeed, mach, reynolds }
  }, [axialVelocity, chord, mu, radius, rho, rpm, temperature])

  const sweep = clamp(result.mach / 1.2, 0, 1)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="rpm" value={rpm} onChange={setRpm} step={500} min={0} />
        <NumberField label="tip radius (m)" value={radius} onChange={setRadius} step={0.01} min={0} />
        <NumberField label="chord (m)" value={chord} onChange={setChord} step={0.005} min={1e-9} />
        <NumberField label="axial U (m/s)" value={axialVelocity} onChange={setAxialVelocity} step={5} min={0} />
        <NumberField label="T (K)" value={temperature} onChange={setTemperature} step={5} min={1} />
        <NumberField label="rho (kg/m3)" value={rho} onChange={setRho} step={0.05} min={1e-9} />
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 560 260" className="h-auto w-full" role="img" aria-label="Blade tip Mach and Reynolds disk">
          <rect x="44" y="30" width="472" height="184" rx="18" fill="#08111f" />
          <circle cx="280" cy="122" r="70" fill="none" stroke="#334155" strokeWidth="18" />
          <path d={`M280 122 L${280 + 70 * Math.cos(-Math.PI / 5)} ${122 + 70 * Math.sin(-Math.PI / 5)} A70 70 0 ${sweep > 0.5 ? 1 : 0} 1 ${280 + 70 * Math.cos(-Math.PI / 5 + sweep * 1.7 * Math.PI)} ${122 + 70 * Math.sin(-Math.PI / 5 + sweep * 1.7 * Math.PI)}`} fill="none" stroke="#22d3ee" strokeWidth="18" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M280 122 L${280 + 92 * Math.cos(i * Math.PI / 2 + 0.4)} ${122 + 92 * Math.sin(i * Math.PI / 2 + 0.4)}`} stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
          ))}
          <text x="72" y="58" fill="var(--text)" fontSize="15" fontWeight="700">tip relative Mach gauge</text>
          <text x="246" y="128" fill="#f8fafc" fontSize="18" fontWeight="700">M {formatNumber(result.mach, 2)}</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="tip speed (m/s)" value={formatNumber(result.tipSpeed, 3)} color="#22d3ee" />
        <MetricCard label="relative speed (m/s)" value={formatNumber(result.relativeSpeed, 3)} color="#34d399" />
        <MetricCard label="Mach rel" value={formatNumber(result.mach, 4)} color="#fbbf24" />
        <MetricCard label="Re chord" value={formatNumber(result.reynolds, 3)} color="#fb7185" />
        <MetricCard label="omega (rad/s)" value={formatNumber(result.omega, 3)} color="#a78bfa" />
      </div>
      <Note>Tip Mach and chord Reynolds number are quick checks before setting rotating-frame compressibility and near-wall mesh targets.</Note>
    </CalculatorPanel>
  )
}

function AffinityBar({ label, before, after, scale, color }: { label: string; before: number; after: number; scale: number; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="mb-3 text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="space-y-2">
        <BarRow label="before" value={before} scale={scale} color="rgba(148,163,184,0.55)" />
        <BarRow label="after" value={after} scale={scale} color={color} />
      </div>
    </div>
  )
}

function BarRow({ label, value, scale, color }: { label: string; value: number; scale: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span className="mono">{formatNumber(value, 3)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full" style={{ background: 'rgba(148,163,184,0.14)' }}>
        <div className="h-full rounded-full" style={{ width: `${clamp(value / Math.max(scale, 1e-12), 0, 1) * 100}%`, background: color }} />
      </div>
    </div>
  )
}
