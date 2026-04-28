'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const G = 9.80665

export function OhnesorgeCalculator() {
  const [mu, setMu] = useState(0.001)
  const [rho, setRho] = useState(998)
  const [sigma, setSigma] = useState(0.072)
  const [length, setLength] = useState(0.001)

  const result = useMemo(() => {
    const denom = Math.sqrt(Math.max(rho * sigma * length, 1e-30))
    const oh = mu / denom
    const laplace = 1 / (oh * oh)
    return { oh, laplace }
  }, [length, mu, rho, sigma])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={0.0001} min={0} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-9} />
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.001} min={1e-12} />
        <NumberField label="L or d (m)" value={length} onChange={setLength} step={0.0001} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Oh" value={formatNumber(result.oh)} color="#22d3ee" />
        <MetricCard label="La = 1/Oh^2" value={formatNumber(result.laplace)} color="#34d399" />
      </div>
      <Note>Ohnesorge separates viscous damping from inertial-capillary breakup in droplets, jets, and atomization.</Note>
    </CalculatorPanel>
  )
}

export function CapillaryLengthCalculator() {
  const [sigma, setSigma] = useState(0.072)
  const [rho1, setRho1] = useState(998)
  const [rho2, setRho2] = useState(1.2)

  const result = useMemo(() => {
    const deltaRho = Math.abs(rho1 - rho2)
    const length = Math.sqrt(sigma / Math.max(deltaRho * G, 1e-30))
    return { deltaRho, length }
  }, [rho1, rho2, sigma])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.001} min={1e-12} />
        <NumberField label="rho_1 (kg/m^3)" value={rho1} onChange={setRho1} step={1} min={0} />
        <NumberField label="rho_2 (kg/m^3)" value={rho2} onChange={setRho2} step={1} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Delta rho (kg/m^3)" value={formatNumber(result.deltaRho)} color="#22d3ee" />
        <MetricCard label="capillary length (m)" value={formatNumber(result.length)} color="#fbbf24" />
      </div>
      <Note>Below this scale surface tension dominates gravity; above it hydrostatic shape effects grow quickly.</Note>
    </CalculatorPanel>
  )
}

function dragCoefficient(re: number): number {
  if (re <= 0) return Number.POSITIVE_INFINITY
  if (re < 1000) return (24 / re) * (1 + 0.15 * Math.pow(re, 0.687))
  return 0.44
}

export function ParticleSettlingCalculator() {
  const [rhoP, setRhoP] = useState(2500)
  const [rhoF, setRhoF] = useState(998)
  const [mu, setMu] = useState(0.001)
  const [diameter, setDiameter] = useState(0.0005)

  const result = useMemo(() => {
    const delta = Math.max(rhoP - rhoF, 0)
    const stokes = (delta * G * diameter * diameter) / (18 * Math.max(mu, 1e-12))
    let u = Math.max(stokes, 1e-12)
    for (let i = 0; i < 30; i++) {
      const re = rhoF * u * diameter / Math.max(mu, 1e-12)
      const cd = dragCoefficient(re)
      u = Math.sqrt((4 * delta * G * diameter) / (3 * Math.max(rhoF * cd, 1e-12)))
    }
    const re = rhoF * u * diameter / Math.max(mu, 1e-12)
    return { stokes, u, re, cd: dragCoefficient(re) }
  }, [diameter, mu, rhoF, rhoP])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="rho_p (kg/m^3)" value={rhoP} onChange={setRhoP} step={10} min={0} />
        <NumberField label="rho_f (kg/m^3)" value={rhoF} onChange={setRhoF} step={1} min={0} />
        <NumberField label="mu_f (Pa s)" value={mu} onChange={setMu} step={0.0001} min={1e-12} />
        <NumberField label="particle diameter d (m)" value={diameter} onChange={setDiameter} step={0.0001} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Stokes U_t (m/s)" value={formatNumber(result.stokes)} color="#22d3ee" />
        <MetricCard label="corrected U_t (m/s)" value={formatNumber(result.u)} color="#34d399" />
        <MetricCard label="Re_p" value={formatNumber(result.re)} color="#fbbf24" />
        <MetricCard label="C_d" value={formatNumber(result.cd)} color="#f87171" />
      </div>
      <Note>Corrected velocity iterates a Schiller-Naumann style drag curve for a single isolated sphere.</Note>
    </CalculatorPanel>
  )
}

export function ManningOpenChannelCalculator() {
  const [area, setArea] = useState(2)
  const [wettedPerimeter, setWettedPerimeter] = useState(3.2)
  const [slope, setSlope] = useState(0.001)
  const [roughness, setRoughness] = useState(0.03)
  const [topWidth, setTopWidth] = useState(2.5)

  const result = useMemo(() => {
    const radius = area / Math.max(wettedPerimeter, 1e-12)
    const q = (1 / Math.max(roughness, 1e-12)) * area * Math.pow(radius, 2 / 3) * Math.sqrt(Math.max(slope, 0))
    const velocity = q / Math.max(area, 1e-12)
    const hydraulicDepth = area / Math.max(topWidth, 1e-12)
    const froude = velocity / Math.sqrt(G * hydraulicDepth)
    return { radius, q, velocity, hydraulicDepth, froude }
  }, [area, roughness, slope, topWidth, wettedPerimeter])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="area A (m^2)" value={area} onChange={setArea} step={0.1} min={0} />
        <NumberField label="wetted perimeter P (m)" value={wettedPerimeter} onChange={setWettedPerimeter} step={0.1} min={1e-12} />
        <NumberField label="bed slope S" value={slope} onChange={setSlope} step={0.0001} min={0} />
        <NumberField label="Manning n" value={roughness} onChange={setRoughness} step={0.001} min={1e-12} />
        <NumberField label="top width B (m)" value={topWidth} onChange={setTopWidth} step={0.1} min={1e-12} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="R_h (m)" value={formatNumber(result.radius)} color="#22d3ee" />
        <MetricCard label="Q (m^3/s)" value={formatNumber(result.q)} color="#34d399" />
        <MetricCard label="U (m/s)" value={formatNumber(result.velocity)} color="#fbbf24" />
        <MetricCard label="Fr" value={formatNumber(result.froude)} color={result.froude < 1 ? '#34d399' : '#f87171'} />
      </div>
      <Note>Manning is a quick uniform-flow estimate for rivers, channels, and shallow-water CFD boundary checks.</Note>
    </CalculatorPanel>
  )
}

export function DropletBreakupCalculator() {
  const [rho, setRho] = useState(1.2)
  const [velocity, setVelocity] = useState(35)
  const [diameter, setDiameter] = useState(0.002)
  const [sigma, setSigma] = useState(0.072)
  const [mu, setMu] = useState(0.001)

  const result = useMemo(() => {
    const we = rho * velocity * velocity * diameter / Math.max(sigma, 1e-12)
    const oh = mu / Math.sqrt(Math.max(rho * sigma * diameter, 1e-30))
    const regime = we < 12
      ? 'stable / vibrational'
      : we < 50
        ? 'bag breakup likely'
        : we < 100
          ? 'multimode breakup'
          : 'shear / catastrophic'
    return { we, oh, regime }
  }, [diameter, mu, rho, sigma, velocity])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="continuous rho (kg/m^3)" value={rho} onChange={setRho} step={0.1} min={1e-9} />
        <NumberField label="relative U (m/s)" value={velocity} onChange={setVelocity} step={1} min={0} />
        <NumberField label="droplet d (m)" value={diameter} onChange={setDiameter} step={0.0001} min={1e-12} />
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.001} min={1e-12} />
        <NumberField label="droplet mu (Pa s)" value={mu} onChange={setMu} step={0.0001} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="We" value={formatNumber(result.we)} color="#22d3ee" />
        <MetricCard label="Oh" value={formatNumber(result.oh)} color="#fbbf24" />
        <MetricCard label="regime" value={result.regime} color={result.we < 12 ? '#34d399' : '#f87171'} />
      </div>
      <Note>Breakup thresholds are approximate air-blast heuristics. Use them as a CFD setup sanity check, not a model closure.</Note>
    </CalculatorPanel>
  )
}
