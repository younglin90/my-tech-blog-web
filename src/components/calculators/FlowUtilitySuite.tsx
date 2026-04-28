'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

const PSI_TO_PA = 6894.757293168
const GPM_TO_M3S = 0.0000630901964

export function SutherlandAirCalculator() {
  const [temperature, setTemperature] = useState(300)
  const [pressure, setPressure] = useState(101325)
  const [gamma, setGamma] = useState(1.4)
  const [gasConstant, setGasConstant] = useState(287.05)
  const [muRef, setMuRef] = useState(1.716e-5)
  const [tRef, setTRef] = useState(273.15)
  const [sutherland, setSutherland] = useState(110.4)

  const result = useMemo(() => {
    const t = Math.max(temperature, 1e-9)
    const mu = muRef * Math.pow(t / tRef, 1.5) * ((tRef + sutherland) / (t + sutherland))
    const rho = pressure / (gasConstant * t)
    const nu = mu / rho
    const soundSpeed = Math.sqrt(gamma * gasConstant * t)
    return { mu, rho, nu, soundSpeed }
  }, [gasConstant, gamma, muRef, pressure, sutherland, tRef, temperature])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="T (K)" value={temperature} onChange={setTemperature} step={1} min={1} />
        <NumberField label="p (Pa)" value={pressure} onChange={setPressure} step={1000} min={1} />
        <NumberField label="gamma" value={gamma} onChange={setGamma} step={0.01} min={1.01} />
        <NumberField label="R (J/kg/K)" value={gasConstant} onChange={setGasConstant} step={1} min={1} />
        <NumberField label="mu_ref (Pa s)" value={muRef} onChange={setMuRef} step={1e-7} min={1e-12} />
        <NumberField label="T_ref (K)" value={tRef} onChange={setTRef} step={1} min={1} />
        <NumberField label="Sutherland S (K)" value={sutherland} onChange={setSutherland} step={1} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="mu (Pa s)" value={formatNumber(result.mu)} color="#22d3ee" />
        <MetricCard label="rho (kg/m^3)" value={formatNumber(result.rho)} color="#34d399" />
        <MetricCard label="nu (m^2/s)" value={formatNumber(result.nu)} color="#fbbf24" />
        <MetricCard label="a (m/s)" value={formatNumber(result.soundSpeed)} color="#f87171" />
      </div>
      <Note>Air defaults use Sutherland's law plus ideal-gas density. Change R and gamma for another gas.</Note>
    </CalculatorPanel>
  )
}

export function OrificeFlowCalculator() {
  const [cd, setCd] = useState(0.62)
  const [diameter, setDiameter] = useState(0.03)
  const [rho, setRho] = useState(998)
  const [deltaP, setDeltaP] = useState(50000)

  const result = useMemo(() => {
    const area = Math.PI * diameter * diameter / 4
    const jetVelocity = Math.sqrt((2 * Math.max(deltaP, 0)) / Math.max(rho, 1e-12))
    const q = cd * area * jetVelocity
    return { area, jetVelocity, q, mdot: rho * q }
  }, [cd, deltaP, diameter, rho])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="C_d" value={cd} onChange={setCd} step={0.01} min={0} />
        <NumberField label="orifice diameter (m)" value={diameter} onChange={setDiameter} step={0.001} min={1e-9} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-9} />
        <NumberField label="Delta p (Pa)" value={deltaP} onChange={setDeltaP} step={1000} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="area (m^2)" value={formatNumber(result.area)} color="#22d3ee" />
        <MetricCard label="ideal jet U (m/s)" value={formatNumber(result.jetVelocity)} color="#34d399" />
        <MetricCard label="Q (m^3/s)" value={formatNumber(result.q)} color="#fbbf24" />
        <MetricCard label="m_dot (kg/s)" value={formatNumber(result.mdot)} color="#f87171" />
      </div>
      <Note>Use for quick incompressible orifice estimates. Compressible choked gas flow needs the choked mass-flow tool.</Note>
    </CalculatorPanel>
  )
}

export function ValveCvKvCalculator() {
  const [cv, setCv] = useState(12)
  const [specificGravity, setSpecificGravity] = useState(1)
  const [deltaPsi, setDeltaPsi] = useState(10)

  const result = useMemo(() => {
    const qGpm = cv * Math.sqrt(Math.max(deltaPsi, 0) / Math.max(specificGravity, 1e-12))
    const qM3s = qGpm * GPM_TO_M3S
    const kv = 0.865 * cv
    const deltaPa = deltaPsi * PSI_TO_PA
    return { qGpm, qM3s, kv, deltaPa }
  }, [cv, deltaPsi, specificGravity])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="C_v" value={cv} onChange={setCv} step={0.1} min={0} />
        <NumberField label="specific gravity" value={specificGravity} onChange={setSpecificGravity} step={0.01} min={1e-9} />
        <NumberField label="Delta p (psi)" value={deltaPsi} onChange={setDeltaPsi} step={1} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Q (gpm)" value={formatNumber(result.qGpm)} color="#22d3ee" />
        <MetricCard label="Q (m^3/s)" value={formatNumber(result.qM3s)} color="#34d399" />
        <MetricCard label="K_v" value={formatNumber(result.kv)} color="#fbbf24" />
        <MetricCard label="Delta p (Pa)" value={formatNumber(result.deltaPa)} color="#f87171" />
      </div>
      <Note>Liquid sizing relation: Q_gpm = C_v sqrt(Delta p / SG). Cavitation and flashing need separate checks.</Note>
    </CalculatorPanel>
  )
}

export function HydraulicDiameterCalculator() {
  const [area, setArea] = useState(0.02)
  const [wettedPerimeter, setWettedPerimeter] = useState(0.6)
  const [rho, setRho] = useState(998)
  const [mu, setMu] = useState(0.001)
  const [velocity, setVelocity] = useState(1.5)

  const result = useMemo(() => {
    const dh = 4 * area / Math.max(wettedPerimeter, 1e-12)
    const re = rho * velocity * dh / Math.max(mu, 1e-12)
    return { dh, re }
  }, [area, mu, rho, velocity, wettedPerimeter])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="flow area A (m^2)" value={area} onChange={setArea} step={0.001} min={0} />
        <NumberField label="wetted perimeter P (m)" value={wettedPerimeter} onChange={setWettedPerimeter} step={0.01} min={1e-12} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={1} min={1e-9} />
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={0.0001} min={1e-12} />
        <NumberField label="bulk velocity U (m/s)" value={velocity} onChange={setVelocity} step={0.1} min={0} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="D_h (m)" value={formatNumber(result.dh)} color="#22d3ee" />
        <MetricCard label="Re_Dh" value={formatNumber(result.re)} color="#34d399" />
      </div>
      <Note>D_h = 4A/P lets non-circular ducts use pipe-style Reynolds and pressure-loss estimates.</Note>
    </CalculatorPanel>
  )
}

export function DynamicPressureCalculator() {
  const [rho, setRho] = useState(1.225)
  const [velocity, setVelocity] = useState(50)
  const [area, setArea] = useState(1)
  const [coefficient, setCoefficient] = useState(1)

  const result = useMemo(() => {
    const q = 0.5 * rho * velocity * velocity
    return { q, force: q * area * coefficient }
  }, [area, coefficient, rho, velocity])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-9} />
        <NumberField label="U (m/s)" value={velocity} onChange={setVelocity} step={1} min={0} />
        <NumberField label="reference area A (m^2)" value={area} onChange={setArea} step={0.1} min={0} />
        <NumberField label="coefficient C" value={coefficient} onChange={setCoefficient} step={0.1} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="dynamic pressure q (Pa)" value={formatNumber(result.q)} color="#22d3ee" />
        <MetricCard label="force = q A C (N)" value={formatNumber(result.force)} color="#f87171" />
      </div>
      <Note>Useful for wind load, drag estimates, and sanity-checking force coefficients from CFD output.</Note>
    </CalculatorPanel>
  )
}

export function GciCalculator() {
  const [h1, setH1] = useState(0.01)
  const [h2, setH2] = useState(0.02)
  const [h3, setH3] = useState(0.04)
  const [phi1, setPhi1] = useState(1.02)
  const [phi2, setPhi2] = useState(1.08)
  const [phi3, setPhi3] = useState(1.22)
  const [safety, setSafety] = useState(1.25)

  const result = useMemo(() => {
    const r21 = h2 / Math.max(h1, 1e-12)
    const r32 = h3 / Math.max(h2, 1e-12)
    const e21 = phi2 - phi1
    const e32 = phi3 - phi2
    const p = Math.log(Math.abs(e32 / Math.max(Math.abs(e21), 1e-12))) / Math.log(Math.max(r21, 1.000001))
    const pSafe = Math.abs(p) > 1e-9 ? Math.abs(p) : Number.NaN
    const extrapolated = phi1 + (phi1 - phi2) / (Math.pow(r21, pSafe) - 1)
    const gci21 = safety * Math.abs((phi1 - phi2) / Math.max(Math.abs(phi1), 1e-12)) / (Math.pow(r21, pSafe) - 1) * 100
    const asymptotic = gci21 / Math.max(Math.pow(r21, pSafe) * safety * Math.abs((phi2 - phi3) / Math.max(Math.abs(phi2), 1e-12)) / (Math.pow(r32, pSafe) - 1) * 100, 1e-12)
    return { r21, r32, p: pSafe, extrapolated, gci21, asymptotic }
  }, [h1, h2, h3, phi1, phi2, phi3, safety])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="h1 fine" value={h1} onChange={setH1} step={0.001} min={1e-12} />
        <NumberField label="h2 medium" value={h2} onChange={setH2} step={0.001} min={1e-12} />
        <NumberField label="h3 coarse" value={h3} onChange={setH3} step={0.001} min={1e-12} />
        <NumberField label="safety Fs" value={safety} onChange={setSafety} step={0.05} min={1} />
        <NumberField label="phi1 fine" value={phi1} onChange={setPhi1} step={0.01} />
        <NumberField label="phi2 medium" value={phi2} onChange={setPhi2} step={0.01} />
        <NumberField label="phi3 coarse" value={phi3} onChange={setPhi3} step={0.01} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="observed p" value={formatNumber(result.p)} color="#22d3ee" />
        <MetricCard label="extrapolated phi" value={formatNumber(result.extrapolated)} color="#34d399" />
        <MetricCard label="GCI_21 (%)" value={formatNumber(result.gci21)} color="#fbbf24" />
        <MetricCard label="asymptotic ratio" value={formatNumber(result.asymptotic)} color="#f87171" />
      </div>
      <Note>Assumes monotonic three-grid convergence. Treat non-monotonic values as a warning, not a certification.</Note>
    </CalculatorPanel>
  )
}

const CONVERSIONS = {
  pressure: {
    label: 'Pressure',
    base: 'Pa',
    units: {
      Pa: 1,
      kPa: 1000,
      bar: 100000,
      atm: 101325,
      psi: PSI_TO_PA,
    },
  },
  velocity: {
    label: 'Velocity',
    base: 'm/s',
    units: {
      'm/s': 1,
      'ft/s': 0.3048,
      kmh: 1 / 3.6,
      mph: 0.44704,
      knot: 0.514444,
    },
  },
  flow: {
    label: 'Volume flow',
    base: 'm^3/s',
    units: {
      'm^3/s': 1,
      'L/s': 0.001,
      gpm: GPM_TO_M3S,
      cfm: 0.00047194745,
    },
  },
  viscosity: {
    label: 'Dynamic viscosity',
    base: 'Pa s',
    units: {
      'Pa s': 1,
      cP: 0.001,
      poise: 0.1,
      'lb/ft/s': 1.4881639,
    },
  },
} as const

type ConversionKind = keyof typeof CONVERSIONS

export function CfdUnitConverterCalculator() {
  const [kind, setKind] = useState<ConversionKind>('pressure')
  const [value, setValue] = useState(101325)
  const [fromUnit, setFromUnit] = useState('Pa')

  const spec = CONVERSIONS[kind]
  const units = Object.keys(spec.units)
  const result = useMemo(() => {
    const base = value * (spec.units as Record<string, number>)[fromUnit]
    return units.map((unit) => ({
      unit,
      value: base / (spec.units as Record<string, number>)[unit],
    }))
  }, [fromUnit, spec.units, units, value])

  function handleKind(next: string) {
    const nextKind = next as ConversionKind
    setKind(nextKind)
    setFromUnit(Object.keys(CONVERSIONS[nextKind].units)[0])
  }

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="quantity"
          value={kind}
          onChange={handleKind}
          options={Object.entries(CONVERSIONS).map(([key, item]) => ({ value: key, label: item.label }))}
        />
        <NumberField label="value" value={value} onChange={setValue} step={1} />
        <SelectField
          label="from unit"
          value={fromUnit}
          onChange={setFromUnit}
          options={units.map((unit) => ({ value: unit, label: unit }))}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {result.map((item, index) => (
          <MetricCard
            key={item.unit}
            label={item.unit}
            value={formatNumber(item.value)}
            color={index % 2 === 0 ? '#22d3ee' : '#fbbf24'}
          />
        ))}
      </div>
      <Note>Fast CFD unit conversions for pressure, velocity, flow rate, and dynamic viscosity.</Note>
    </CalculatorPanel>
  )
}
