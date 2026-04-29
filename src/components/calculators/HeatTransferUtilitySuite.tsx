'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const SIGMA = 5.670374419e-8

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function frictionFactorSmoothPipe(re: number) {
  if (re < 2300) return 64 / Math.max(re, 1e-12)
  return 1 / Math.pow(0.79 * Math.log(Math.max(re, 1.000001)) - 1.64, 2)
}

function pipeNusseltGnielinski(re: number, pr: number) {
  const f = frictionFactorSmoothPipe(re)
  const numerator = (f / 8) * (re - 1000) * pr
  const denominator = 1 + 12.7 * Math.sqrt(f / 8) * (Math.pow(pr, 2 / 3) - 1)
  return Math.max(0, numerator / Math.max(denominator, 1e-12))
}

function yScale(value: number, min: number, max: number, top = 36, height = 160) {
  return top + (1 - clamp((value - min) / Math.max(max - min, 1e-12), 0, 1)) * height
}

export function PipeHeatTransferDesignerCalculator() {
  const [re, setRe] = useState(60000)
  const [pr, setPr] = useState(4.2)
  const [k, setK] = useState(0.62)
  const [diameter, setDiameter] = useState(0.025)
  const [length, setLength] = useState(3)
  const [deltaT, setDeltaT] = useState(25)

  const result = useMemo(() => {
    const nuDb = 0.023 * Math.pow(Math.max(re, 1e-12), 0.8) * Math.pow(Math.max(pr, 1e-12), 0.4)
    const nuGn = pipeNusseltGnielinski(re, pr)
    const h = nuGn * k / Math.max(diameter, 1e-12)
    const area = Math.PI * diameter * length
    const heatRate = h * area * deltaT
    const validity = re >= 3000 && pr >= 0.5 && pr <= 2000 ? 'turbulent correlation range' : 'outside preferred range'
    return { nuDb, nuGn, h, area, heatRate, validity }
  }, [deltaT, diameter, k, length, pr, re])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="Re_D" value={re} onChange={setRe} step={1000} min={1} />
        <NumberField label="Pr" value={pr} onChange={setPr} step={0.1} min={0.01} />
        <NumberField label="fluid k (W/m/K)" value={k} onChange={setK} step={0.01} min={1e-6} />
        <NumberField label="pipe D (m)" value={diameter} onChange={setDiameter} step={0.001} min={1e-6} />
        <NumberField label="heated length (m)" value={length} onChange={setLength} step={0.1} min={0} />
        <NumberField label="wall-bulk DeltaT (K)" value={deltaT} onChange={setDeltaT} step={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 620 210" className="h-auto w-full" role="img" aria-label="Pipe convection heat-transfer sketch">
          <defs>
            <linearGradient id="pipeHeat" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="52%" stopColor="#fbbf24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <rect x="38" y="42" width="544" height="126" rx="18" fill="#08111f" />
          <rect x="74" y="82" width="472" height="48" rx="24" fill="url(#pipeHeat)" stroke="#e5e7eb" strokeOpacity="0.45" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${96 + i * 74} 107 C${126 + i * 74} ${86 + (i % 2) * 42} ${150 + i * 74} ${128 - (i % 2) * 40} ${182 + i * 74} 107`} fill="none" stroke="#f8fafc" strokeOpacity="0.45" strokeWidth="2" />
          ))}
          <text x="70" y="70" fill="var(--text)" fontSize="15" fontWeight="700">heated internal flow</text>
          <text x="382" y="70" fill="#fbbf24" fontSize="12">Nu to h to Q</text>
          <text x="86" y="154" fill="var(--text-muted)" fontSize="12">bulk flow</text>
          <text x="438" y="154" fill="var(--text-muted)" fontSize="12">wall heat flux</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Nu Dittus-Boelter" value={formatNumber(result.nuDb, 2)} color="#22d3ee" />
        <MetricCard label="Nu Gnielinski" value={formatNumber(result.nuGn, 2)} color="#34d399" />
        <MetricCard label="h (W/m2/K)" value={formatNumber(result.h, 2)} color="#fbbf24" />
        <MetricCard label="area (m2)" value={formatNumber(result.area, 3)} color="#a78bfa" />
        <MetricCard label="Q (W)" value={formatNumber(result.heatRate, 2)} color="#fb7185" />
      </div>
      <Note>{result.validity}. Use as a fast CFD wall heat-flux sanity check before committing to a conjugate heat-transfer mesh.</Note>
    </CalculatorPanel>
  )
}

export function FlatPlateConvectionMapCalculator() {
  const [velocity, setVelocity] = useState(12)
  const [length, setLength] = useState(0.8)
  const [width, setWidth] = useState(0.4)
  const [nu, setNu] = useState(1.5e-5)
  const [pr, setPr] = useState(0.71)
  const [k, setK] = useState(0.026)
  const [deltaT, setDeltaT] = useState(20)

  const result = useMemo(() => {
    const re = velocity * length / Math.max(nu, 1e-12)
    const nuLam = 0.664 * Math.sqrt(Math.max(re, 1e-12)) * Math.pow(Math.max(pr, 1e-12), 1 / 3)
    const nuTurb = 0.037 * Math.pow(Math.max(re, 1e-12), 0.8) * Math.pow(Math.max(pr, 1e-12), 1 / 3)
    const mixed = re < 5e5 ? nuLam : Math.max(0, (0.037 * Math.pow(re, 0.8) - 871) * Math.pow(pr, 1 / 3))
    const h = mixed * k / Math.max(length, 1e-12)
    const q = h * length * width * deltaT
    return { re, nuLam, nuTurb, mixed, h, q, transitionFraction: clamp((5e5 * nu / Math.max(velocity, 1e-12)) / Math.max(length, 1e-12), 0, 1) }
  }, [deltaT, k, length, nu, pr, velocity, width])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="U_inf (m/s)" value={velocity} onChange={setVelocity} step={0.5} min={0} />
        <NumberField label="plate L (m)" value={length} onChange={setLength} step={0.05} min={1e-6} />
        <NumberField label="plate width (m)" value={width} onChange={setWidth} step={0.05} min={1e-6} />
        <NumberField label="nu (m2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-12} />
        <NumberField label="Pr" value={pr} onChange={setPr} step={0.01} min={0.01} />
        <NumberField label="k (W/m/K)" value={k} onChange={setK} step={0.001} min={1e-6} />
        <NumberField label="wall-air DeltaT (K)" value={deltaT} onChange={setDeltaT} step={1} />
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="relative h-20 overflow-hidden rounded-xl" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.22), rgba(251,191,36,0.22), rgba(251,113,133,0.24))' }}>
          <div className="absolute inset-x-8 bottom-5 h-2 rounded-full bg-slate-100/80" />
          <div className="absolute bottom-2 top-2 w-px bg-amber-200" style={{ left: `${8 + result.transitionFraction * 84}%` }} />
          <div className="absolute left-4 top-3 text-xs font-semibold text-cyan-100">thermal BL</div>
          <div className="absolute right-4 top-3 text-xs font-semibold text-rose-100">mixed convection estimate</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Re_L" value={formatNumber(result.re, 3)} color="#22d3ee" />
        <MetricCard label="Nu laminar" value={formatNumber(result.nuLam, 2)} color="#34d399" />
        <MetricCard label="Nu turbulent" value={formatNumber(result.nuTurb, 2)} color="#fbbf24" />
        <MetricCard label="h mixed (W/m2/K)" value={formatNumber(result.h, 2)} color="#a78bfa" />
        <MetricCard label="Q (W)" value={formatNumber(result.q, 2)} color="#fb7185" />
      </div>
      <Note>Average flat-plate correlations are useful when setting wall heat-flux expectations for external-flow CFD.</Note>
    </CalculatorPanel>
  )
}

export function FinEfficiencyCalculator() {
  const [h, setH] = useState(35)
  const [k, setK] = useState(205)
  const [perimeter, setPerimeter] = useState(0.08)
  const [area, setArea] = useState(0.0004)
  const [length, setLength] = useState(0.08)
  const [theta, setTheta] = useState(60)

  const result = useMemo(() => {
    const m = Math.sqrt((h * perimeter) / Math.max(k * area, 1e-12))
    const ml = m * length
    const efficiency = Math.tanh(ml) / Math.max(ml, 1e-12)
    const effectiveness = Math.sqrt(k * perimeter / Math.max(h * area, 1e-12)) * Math.tanh(ml)
    const heatRate = Math.sqrt(h * perimeter * k * area) * theta * Math.tanh(ml)
    return { m, ml, efficiency, effectiveness, heatRate }
  }, [area, h, k, length, perimeter, theta])

  const points = useMemo(() => {
    const values: string[] = []
    for (let i = 0; i <= 60; i++) {
      const x = i / 60
      const tempRatio = Math.cosh(result.m * length * (1 - x)) / Math.max(Math.cosh(result.m * length), 1e-12)
      values.push(`${i === 0 ? 'M' : 'L'}${48 + x * 500} ${yScale(tempRatio, 0, 1).toFixed(1)}`)
    }
    return values.join(' ')
  }, [length, result.m])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="h (W/m2/K)" value={h} onChange={setH} step={1} min={1e-6} />
        <NumberField label="fin k (W/m/K)" value={k} onChange={setK} step={1} min={1e-6} />
        <NumberField label="perimeter P (m)" value={perimeter} onChange={setPerimeter} step={0.005} min={1e-9} />
        <NumberField label="cross area A_c (m2)" value={area} onChange={setArea} step={0.0001} min={1e-12} />
        <NumberField label="fin length (m)" value={length} onChange={setLength} step={0.01} min={0} />
        <NumberField label="base DeltaT (K)" value={theta} onChange={setTheta} step={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 600 235" className="h-auto w-full" role="img" aria-label="Fin temperature decay curve">
          <rect x="38" y="28" width="524" height="180" rx="16" fill="#08111f" />
          {[0, 0.5, 1].map((tick) => (
            <g key={tick}>
              <line x1="48" x2="548" y1={yScale(tick, 0, 1)} y2={yScale(tick, 0, 1)} stroke="rgba(148,163,184,0.16)" />
              <text x="18" y={yScale(tick, 0, 1) + 4} fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          <path d={points} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <rect x="48" y="184" width="500" height="8" rx="4" fill="#fbbf24" opacity="0.45" />
          <text x="64" y="56" fill="var(--text)" fontSize="15" fontWeight="700">temperature ratio along fin</text>
          <text x="270" y="225" fill="var(--text-muted)" fontSize="12">x / L</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="m L" value={formatNumber(result.ml, 3)} color="#22d3ee" />
        <MetricCard label="fin efficiency" value={formatNumber(result.efficiency, 4)} color="#34d399" />
        <MetricCard label="effectiveness" value={formatNumber(result.effectiveness, 3)} color="#fbbf24" />
        <MetricCard label="Q_fin (W)" value={formatNumber(result.heatRate, 3)} color="#fb7185" />
        <MetricCard label="m (1/m)" value={formatNumber(result.m, 3)} color="#a78bfa" />
      </div>
      <Note>Use for quick conjugate heat-transfer sanity checks where thin fins or heat-sink ribs appear in the geometry.</Note>
    </CalculatorPanel>
  )
}

export function RadiationHeatBalanceCalculator() {
  const [emissivity, setEmissivity] = useState(0.85)
  const [surfaceTemp, setSurfaceTemp] = useState(360)
  const [surroundingTemp, setSurroundingTemp] = useState(295)
  const [area, setArea] = useState(1.2)
  const [hConv, setHConv] = useState(8)

  const result = useMemo(() => {
    const qRad = emissivity * SIGMA * area * (Math.pow(surfaceTemp, 4) - Math.pow(surroundingTemp, 4))
    const qConv = hConv * area * (surfaceTemp - surroundingTemp)
    const total = qRad + qConv
    const radFraction = Math.abs(total) > 1e-12 ? qRad / total : Number.NaN
    return { qRad, qConv, total, radFraction }
  }, [area, emissivity, hConv, surfaceTemp, surroundingTemp])

  const maxQ = Math.max(Math.abs(result.qRad), Math.abs(result.qConv), 1e-9)
  const radPct = clamp(Math.abs(result.qRad) / maxQ, 0, 1) * 100
  const convPct = clamp(Math.abs(result.qConv) / maxQ, 0, 1) * 100

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="emissivity" value={emissivity} onChange={setEmissivity} step={0.01} min={0} max={1} />
        <NumberField label="surface T (K)" value={surfaceTemp} onChange={setSurfaceTemp} step={1} min={1} />
        <NumberField label="surrounding T (K)" value={surroundingTemp} onChange={setSurroundingTemp} step={1} min={1} />
        <NumberField label="area (m2)" value={area} onChange={setArea} step={0.1} min={0} />
        <NumberField label="h conv (W/m2/K)" value={hConv} onChange={setHConv} step={1} min={0} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <HeatBar label="radiation" percent={radPct} value={result.qRad} color="#fb7185" />
        <HeatBar label="convection" percent={convPct} value={result.qConv} color="#22d3ee" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Q_rad (W)" value={formatNumber(result.qRad, 3)} color="#fb7185" />
        <MetricCard label="Q_conv (W)" value={formatNumber(result.qConv, 3)} color="#22d3ee" />
        <MetricCard label="Q_total (W)" value={formatNumber(result.total, 3)} color="#fbbf24" />
        <MetricCard label="radiation share" value={`${formatNumber(result.radFraction * 100, 2)}%`} color="#a78bfa" />
      </div>
      <Note>Radiation becomes nonlinear fast. This helps decide whether a CFD thermal boundary can ignore surface-to-ambient radiation.</Note>
    </CalculatorPanel>
  )
}

export function LumpedCoolingTransientCalculator() {
  const [rho, setRho] = useState(2700)
  const [cp, setCp] = useState(900)
  const [volume, setVolume] = useState(0.002)
  const [area, setArea] = useState(0.18)
  const [h, setH] = useState(25)
  const [initialTemp, setInitialTemp] = useState(360)
  const [ambientTemp, setAmbientTemp] = useState(295)
  const [time, setTime] = useState(300)

  const result = useMemo(() => {
    const capacitance = rho * cp * volume
    const tau = capacitance / Math.max(h * area, 1e-12)
    const temp = ambientTemp + (initialTemp - ambientTemp) * Math.exp(-time / Math.max(tau, 1e-12))
    const heatRate = h * area * (temp - ambientTemp)
    const characteristicLength = volume / Math.max(area, 1e-12)
    return { capacitance, tau, temp, heatRate, characteristicLength }
  }, [ambientTemp, area, cp, h, initialTemp, rho, time, volume])

  const curve = useMemo(() => {
    const points: string[] = []
    const tMax = Math.max(time, result.tau * 4, 1)
    const tMin = 0
    const minT = Math.min(ambientTemp, initialTemp)
    const maxT = Math.max(ambientTemp, initialTemp)
    for (let i = 0; i <= 80; i++) {
      const t = tMax * i / 80
      const temp = ambientTemp + (initialTemp - ambientTemp) * Math.exp(-t / Math.max(result.tau, 1e-12))
      const x = 48 + ((t - tMin) / (tMax - tMin)) * 500
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yScale(temp, minT, maxT).toFixed(1)}`)
    }
    return points.join(' ')
  }, [ambientTemp, initialTemp, result.tau, time])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="rho (kg/m3)" value={rho} onChange={setRho} step={50} min={1e-6} />
        <NumberField label="cp (J/kg/K)" value={cp} onChange={setCp} step={10} min={1e-6} />
        <NumberField label="volume (m3)" value={volume} onChange={setVolume} step={0.0001} min={1e-12} />
        <NumberField label="surface area (m2)" value={area} onChange={setArea} step={0.01} min={1e-12} />
        <NumberField label="h (W/m2/K)" value={h} onChange={setH} step={1} min={1e-6} />
        <NumberField label="initial T (K)" value={initialTemp} onChange={setInitialTemp} step={1} min={1} />
        <NumberField label="ambient T (K)" value={ambientTemp} onChange={setAmbientTemp} step={1} min={1} />
        <NumberField label="time (s)" value={time} onChange={setTime} step={10} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 600 235" className="h-auto w-full" role="img" aria-label="Lumped capacitance cooling curve">
          <rect x="38" y="28" width="524" height="180" rx="16" fill="#08111f" />
          <path d={curve} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <line x1="48" x2="548" y1="196" y2="196" stroke="#94a3b8" strokeOpacity="0.28" />
          <text x="64" y="56" fill="var(--text)" fontSize="15" fontWeight="700">lumped transient response</text>
          <text x="248" y="225" fill="var(--text-muted)" fontSize="12">time</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="tau (s)" value={formatNumber(result.tau, 3)} color="#22d3ee" />
        <MetricCard label="T(t) (K)" value={formatNumber(result.temp, 3)} color="#34d399" />
        <MetricCard label="Q(t) (W)" value={formatNumber(result.heatRate, 3)} color="#fbbf24" />
        <MetricCard label="rho cp V (J/K)" value={formatNumber(result.capacitance, 3)} color="#fb7185" />
        <MetricCard label="L_c = V/A (m)" value={formatNumber(result.characteristicLength, 5)} color="#a78bfa" />
      </div>
      <Note>Check Biot separately. Lumped cooling is reliable when internal conduction is fast relative to surface convection.</Note>
    </CalculatorPanel>
  )
}

function HeatBar({ label, percent, value, color }: { label: string; percent: number; value: number; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</span>
        <span className="mono" style={{ color }}>{formatNumber(value, 2)} W</span>
      </div>
      <div className="h-10 overflow-hidden rounded-full" style={{ background: 'rgba(148,163,184,0.14)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.5))`,
            boxShadow: `0 0 18px ${color}`,
          }}
        />
      </div>
    </div>
  )
}
