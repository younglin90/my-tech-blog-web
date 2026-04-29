'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

const R_UNIVERSAL = 8.314462618

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function logX(value: number, min: number, max: number) {
  const v = Math.log10(Math.max(value, 1e-12))
  return 58 + clamp((v - Math.log10(min)) / (Math.log10(max) - Math.log10(min)), 0, 1) * 492
}

function logY(value: number, min: number, max: number) {
  const v = Math.log10(Math.max(value, 1e-12))
  return 250 - clamp((v - Math.log10(min)) / (Math.log10(max) - Math.log10(min)), 0, 1) * 198
}

const FUELS = {
  methane: { label: 'Methane CH4', afr: 17.16, lhv: 50e6 },
  hydrogen: { label: 'Hydrogen H2', afr: 34.3, lhv: 120e6 },
  propane: { label: 'Propane C3H8', afr: 15.67, lhv: 46.4e6 },
  dodecane: { label: 'Dodecane C12H26', afr: 14.9, lhv: 44e6 },
} as const

type FuelKey = keyof typeof FUELS

export function DamkohlerKarlovitzMapCalculator() {
  const [uPrime, setUPrime] = useState(2)
  const [integralScale, setIntegralScale] = useState(0.015)
  const [flameSpeed, setFlameSpeed] = useState(0.4)
  const [flameThickness, setFlameThickness] = useState(0.0006)
  const [nu, setNu] = useState(1.6e-5)

  const result = useMemo(() => {
    const tauT = integralScale / Math.max(uPrime, 1e-12)
    const tauC = flameThickness / Math.max(flameSpeed, 1e-12)
    const da = tauT / Math.max(tauC, 1e-12)
    const epsilon = Math.pow(uPrime, 3) / Math.max(integralScale, 1e-12)
    const tauEta = Math.sqrt(Math.max(nu, 1e-12) / Math.max(epsilon, 1e-24))
    const ka = tauC / Math.max(tauEta, 1e-12)
    const uRatio = uPrime / Math.max(flameSpeed, 1e-12)
    const lRatio = integralScale / Math.max(flameThickness, 1e-12)
    const regime = ka < 1 && da > 1 ? 'corrugated flamelet' : ka < 100 ? 'thin reaction zones' : 'distributed reaction'
    return { tauT, tauC, da, ka, uRatio, lRatio, regime }
  }, [flameSpeed, flameThickness, integralScale, nu, uPrime])

  const px = logX(result.lRatio, 1, 10000)
  const py = logY(result.uRatio, 0.1, 1000)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="u_prime (m/s)" value={uPrime} onChange={setUPrime} step={0.1} min={0} />
        <NumberField label="integral scale l (m)" value={integralScale} onChange={setIntegralScale} step={0.001} min={1e-9} />
        <NumberField label="laminar S_L (m/s)" value={flameSpeed} onChange={setFlameSpeed} step={0.05} min={1e-9} />
        <NumberField label="flame thickness delta_L (m)" value={flameThickness} onChange={setFlameThickness} step={0.0001} min={1e-9} />
        <NumberField label="nu (m2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 320" className="h-auto w-full" role="img" aria-label="Premixed combustion regime map">
          <rect x="58" y="52" width="492" height="198" rx="16" fill="#08111f" />
          <rect x="58" y="52" width="164" height="198" fill="#22d3ee" opacity="0.08" />
          <rect x="222" y="52" width="164" height="198" fill="#fbbf24" opacity="0.1" />
          <rect x="386" y="52" width="164" height="198" fill="#fb7185" opacity="0.1" />
          {[1, 10, 100, 1000, 10000].map((tick) => (
            <g key={tick}>
              <line x1={logX(tick, 1, 10000)} x2={logX(tick, 1, 10000)} y1="52" y2="250" stroke="rgba(148,163,184,0.18)" />
              <text x={logX(tick, 1, 10000) - 10} y="276" fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          {[0.1, 1, 10, 100, 1000].map((tick) => (
            <g key={tick}>
              <line x1="58" x2="550" y1={logY(tick, 0.1, 1000)} y2={logY(tick, 0.1, 1000)} stroke="rgba(148,163,184,0.18)" />
              <text x="24" y={logY(tick, 0.1, 1000) + 4} fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          <circle cx={px} cy={py} r="9" fill="#fbbf24" />
          <circle cx={px} cy={py} r="18" fill="none" stroke="#fbbf24" strokeOpacity="0.35">
            <animate attributeName="r" values="10;24;10" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <text x="76" y="78" fill="#67e8f9" fontSize="12" fontWeight="700">flamelet</text>
          <text x="244" y="78" fill="#fde68a" fontSize="12" fontWeight="700">thin reaction</text>
          <text x="410" y="78" fill="#fecaca" fontSize="12" fontWeight="700">distributed</text>
          <text x="238" y="306" fill="var(--text-muted)" fontSize="12">l / delta_L</text>
          <text x="10" y="176" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 10 176)">u_prime / S_L</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Damkohler Da" value={formatNumber(result.da, 4)} color="#22d3ee" />
        <MetricCard label="Karlovitz Ka" value={formatNumber(result.ka, 4)} color="#34d399" />
        <MetricCard label="tau_t (s)" value={formatNumber(result.tauT, 5)} color="#fbbf24" />
        <MetricCard label="tau_c (s)" value={formatNumber(result.tauC, 5)} color="#fb7185" />
        <MetricCard label="regime" value={result.regime} color="#a78bfa" />
      </div>
      <Note>This is a regime map for premixed turbulent reacting-flow setup. Detailed chemistry and differential diffusion still require solver-level modeling.</Note>
    </CalculatorPanel>
  )
}

export function EquivalenceRatioMixerCalculator() {
  const [fuel, setFuel] = useState<FuelKey>('methane')
  const [fuelMassFlow, setFuelMassFlow] = useState(0.01)
  const [airMassFlow, setAirMassFlow] = useState(0.18)

  const result = useMemo(() => {
    const data = FUELS[fuel]
    const afrActual = airMassFlow / Math.max(fuelMassFlow, 1e-12)
    const phi = data.afr / Math.max(afrActual, 1e-12)
    const lambda = 1 / Math.max(phi, 1e-12)
    const heatRelease = fuelMassFlow * data.lhv
    const oxygenMargin = airMassFlow - data.afr * fuelMassFlow
    return { afrActual, phi, lambda, heatRelease, oxygenMargin, data }
  }, [airMassFlow, fuel, fuelMassFlow])

  const phiPct = clamp(result.phi / 2, 0, 1) * 100

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="fuel"
          value={fuel}
          onChange={(value) => setFuel(value as FuelKey)}
          options={Object.entries(FUELS).map(([value, data]) => ({ value, label: data.label }))}
        />
        <NumberField label="fuel mdot (kg/s)" value={fuelMassFlow} onChange={setFuelMassFlow} step={0.001} min={0} />
        <NumberField label="air mdot (kg/s)" value={airMassFlow} onChange={setAirMassFlow} step={0.01} min={0} />
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="mb-2 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>lean</span>
          <span>stoichiometric phi=1</span>
          <span>rich</span>
        </div>
        <div className="relative h-12 overflow-hidden rounded-full" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.32), rgba(34,197,94,0.34), rgba(251,113,133,0.36))' }}>
          <div className="absolute bottom-0 top-0 w-px bg-slate-100/80" style={{ left: '50%' }} />
          <div className="absolute bottom-0 top-0 w-1 bg-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.72)]" style={{ left: `${phiPct}%` }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="actual AFR" value={formatNumber(result.afrActual, 3)} color="#22d3ee" />
        <MetricCard label="phi" value={formatNumber(result.phi, 4)} color="#34d399" />
        <MetricCard label="lambda" value={formatNumber(result.lambda, 4)} color="#fbbf24" />
        <MetricCard label="heat release (W)" value={formatNumber(result.heatRelease, 2)} color="#fb7185" />
        <MetricCard label="air margin (kg/s)" value={formatNumber(result.oxygenMargin, 4)} color="#a78bfa" />
      </div>
      <Note>Use the same fuel basis as the chemistry mechanism. This is a mass-flow mixer check, not an equilibrium solver.</Note>
    </CalculatorPanel>
  )
}

export function ArrheniusSensitivityCalculator() {
  const [preExp, setPreExp] = useState(1e8)
  const [activationEnergy, setActivationEnergy] = useState(80000)
  const [temperature, setTemperature] = useState(1200)
  const [tempSpan, setTempSpan] = useState(250)

  const result = useMemo(() => {
    const rate = preExp * Math.exp(-activationEnergy / (R_UNIVERSAL * Math.max(temperature, 1e-9)))
    const ratePlus = preExp * Math.exp(-activationEnergy / (R_UNIVERSAL * Math.max(temperature + 10, 1e-9)))
    const q10 = ratePlus / Math.max(rate, 1e-300)
    const sensitivity = activationEnergy / (R_UNIVERSAL * temperature * temperature)
    return { rate, q10, sensitivity }
  }, [activationEnergy, preExp, temperature])

  const curve = useMemo(() => {
    const points: string[] = []
    const tMin = Math.max(1, temperature - tempSpan)
    const tMax = temperature + tempSpan
    let minLog = Infinity
    let maxLog = -Infinity
    const samples = Array.from({ length: 80 }, (_, i) => {
      const t = tMin + ((tMax - tMin) * i) / 79
      const logRate = Math.log10(Math.max(preExp * Math.exp(-activationEnergy / (R_UNIVERSAL * t)), 1e-300))
      minLog = Math.min(minLog, logRate)
      maxLog = Math.max(maxLog, logRate)
      return { t, logRate }
    })
    for (const [i, sample] of samples.entries()) {
      const x = 58 + ((sample.t - tMin) / (tMax - tMin)) * 492
      const y = 248 - clamp((sample.logRate - minLog) / Math.max(maxLog - minLog, 1e-12), 0, 1) * 190
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return points.join(' ')
  }, [activationEnergy, preExp, tempSpan, temperature])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="A" value={preExp} onChange={setPreExp} step={1e7} min={0} />
        <NumberField label="E_a (J/mol)" value={activationEnergy} onChange={setActivationEnergy} step={5000} min={0} />
        <NumberField label="T (K)" value={temperature} onChange={setTemperature} step={10} min={1} />
        <NumberField label="plot span (K)" value={tempSpan} onChange={setTempSpan} step={25} min={10} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 310" className="h-auto w-full" role="img" aria-label="Arrhenius reaction rate curve">
          <rect x="58" y="50" width="492" height="198" rx="16" fill="#08111f" />
          <path d={curve} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <text x="76" y="78" fill="var(--text)" fontSize="15" fontWeight="700">Arrhenius rate sensitivity</text>
          <text x="258" y="292" fill="var(--text-muted)" fontSize="12">temperature</text>
          <text x="12" y="175" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 12 175)">log10(k)</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="rate k" value={formatNumber(result.rate, 4)} color="#22d3ee" />
        <MetricCard label="k(T+10K)/k(T)" value={formatNumber(result.q10, 4)} color="#fbbf24" />
        <MetricCard label="d ln k / dT" value={formatNumber(result.sensitivity, 6)} color="#fb7185" />
      </div>
      <Note>Useful for checking whether reacting-flow time steps and source-term linearization will be stiff at the chosen temperature.</Note>
    </CalculatorPanel>
  )
}

export function HeatReleaseTemperatureRiseCalculator() {
  const [fuel, setFuel] = useState<FuelKey>('methane')
  const [fuelMassFlow, setFuelMassFlow] = useState(0.01)
  const [airMassFlow, setAirMassFlow] = useState(0.2)
  const [cpMix, setCpMix] = useState(1150)
  const [efficiency, setEfficiency] = useState(0.92)

  const result = useMemo(() => {
    const data = FUELS[fuel]
    const heatRelease = fuelMassFlow * data.lhv * clamp(efficiency, 0, 1)
    const totalMass = fuelMassFlow + airMassFlow
    const deltaT = heatRelease / Math.max(totalMass * cpMix, 1e-12)
    const phi = data.afr / Math.max(airMassFlow / Math.max(fuelMassFlow, 1e-12), 1e-12)
    const powerDensity = heatRelease / Math.max(totalMass, 1e-12)
    return { heatRelease, deltaT, phi, totalMass, powerDensity }
  }, [airMassFlow, cpMix, efficiency, fuel, fuelMassFlow])

  const flameHeight = clamp(result.deltaT / 2500, 0.08, 1)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <SelectField
          label="fuel"
          value={fuel}
          onChange={(value) => setFuel(value as FuelKey)}
          options={Object.entries(FUELS).map(([value, data]) => ({ value, label: data.label }))}
        />
        <NumberField label="fuel mdot (kg/s)" value={fuelMassFlow} onChange={setFuelMassFlow} step={0.001} min={0} />
        <NumberField label="air mdot (kg/s)" value={airMassFlow} onChange={setAirMassFlow} step={0.01} min={0} />
        <NumberField label="cp_mix (J/kg/K)" value={cpMix} onChange={setCpMix} step={50} min={1e-6} />
        <NumberField label="efficiency" value={efficiency} onChange={setEfficiency} step={0.01} min={0} max={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 560 230" className="h-auto w-full" role="img" aria-label="Combustor heat release plume">
          <rect x="44" y="30" width="472" height="160" rx="18" fill="#08111f" />
          <rect x="82" y="128" width="394" height="26" rx="13" fill="#475569" />
          <path d={`M280 142 C${232 - 20 * flameHeight} ${120 - 70 * flameHeight} ${248} ${100 - 88 * flameHeight} 280 ${54 - 20 * flameHeight} C312 ${100 - 88 * flameHeight} ${328 + 20 * flameHeight} ${120 - 70 * flameHeight} 280 142 Z`} fill="#fb7185" opacity="0.58" />
          <path d={`M280 142 C250 ${122 - 50 * flameHeight} 266 ${102 - 64 * flameHeight} 280 ${78 - 15 * flameHeight} C294 ${102 - 64 * flameHeight} 310 ${122 - 50 * flameHeight} 280 142 Z`} fill="#fbbf24" opacity="0.78" />
          <text x="74" y="58" fill="var(--text)" fontSize="15" fontWeight="700">heat release to temperature rise</text>
          <text x="360" y="176" fill="var(--text-muted)" fontSize="12">reactor inlet</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Qdot (W)" value={formatNumber(result.heatRelease, 2)} color="#fb7185" />
        <MetricCard label="Delta T_ad approx (K)" value={formatNumber(result.deltaT, 2)} color="#fbbf24" />
        <MetricCard label="phi" value={formatNumber(result.phi, 4)} color="#34d399" />
        <MetricCard label="total mdot (kg/s)" value={formatNumber(result.totalMass, 4)} color="#22d3ee" />
        <MetricCard label="specific energy (J/kg)" value={formatNumber(result.powerDensity, 2)} color="#a78bfa" />
      </div>
      <Note>This is a constant-cp screening estimate. Real adiabatic flame temperature needs equilibrium chemistry and dissociation.</Note>
    </CalculatorPanel>
  )
}
