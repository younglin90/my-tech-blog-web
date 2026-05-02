'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sx(value: number, min: number, max: number, left = 58, width = 492) {
  return left + clamp((value - min) / Math.max(max - min, 1e-12), 0, 1) * width
}

function sy(value: number, min: number, max: number, top = 44, height = 188) {
  return top + (1 - clamp((value - min) / Math.max(max - min, 1e-12), 0, 1)) * height
}

function log10Safe(value: number) {
  return Math.log10(Math.max(value, 1e-30))
}

export function ErgunPackedBedCalculator() {
  const [velocity, setVelocity] = useState(0.4)
  const [diameter, setDiameter] = useState(0.004)
  const [porosity, setPorosity] = useState(0.42)
  const [length, setLength] = useState(1)
  const [rho, setRho] = useState(998)
  const [mu, setMu] = useState(0.001)

  const result = useMemo(() => {
    const eps = clamp(porosity, 0.05, 0.95)
    const viscous = 150 * mu * Math.pow(1 - eps, 2) * velocity / (Math.pow(eps, 3) * diameter * diameter)
    const inertial = 1.75 * rho * (1 - eps) * velocity * velocity / (Math.pow(eps, 3) * diameter)
    const dp = (viscous + inertial) * length
    const rep = rho * velocity * diameter / Math.max(mu, 1e-12)
    return { eps, viscous, inertial, dpdz: viscous + inertial, dp, rep, inertialShare: inertial / Math.max(viscous + inertial, 1e-12) }
  }, [diameter, length, mu, porosity, rho, velocity])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="superficial U (m/s)" value={velocity} onChange={setVelocity} step={0.05} min={0} />
        <NumberField label="particle d_p (m)" value={diameter} onChange={setDiameter} step={0.0005} min={1e-9} />
        <NumberField label="porosity eps" value={porosity} onChange={setPorosity} step={0.01} min={0.05} max={0.95} />
        <NumberField label="bed length (m)" value={length} onChange={setLength} step={0.1} min={0} />
        <NumberField label="rho (kg/m3)" value={rho} onChange={setRho} step={10} min={1e-9} />
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={0.0001} min={1e-12} />
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="relative h-28 overflow-hidden rounded-xl" style={{ background: 'var(--on-accent)' }}>
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${5 + (i % 12) * 8}%`,
                top: `${15 + Math.floor(i / 12) * 28 + (i % 2) * 5}%`,
                width: `${10 + (1 - result.eps) * 18}px`,
                height: `${10 + (1 - result.eps) * 18}px`,
                background: i % 3 === 0 ? '#fbbf24' : '#22d3ee',
                opacity: 0.35 + (1 - result.eps) * 0.45,
              }}
            />
          ))}
          <div className="absolute bottom-3 left-4 right-4 h-2 rounded-full bg-slate-100/70" />
          <div className="absolute right-4 top-4 text-xs font-semibold text-rose-100">inertial share {formatNumber(result.inertialShare * 100, 1)}%</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Re_p" value={formatNumber(result.rep, 3)} color="#22d3ee" />
        <MetricCard label="viscous dp/dz" value={formatNumber(result.viscous, 2)} color="#34d399" />
        <MetricCard label="inertial dp/dz" value={formatNumber(result.inertial, 2)} color="#fbbf24" />
        <MetricCard label="total dp/dz" value={formatNumber(result.dpdz, 2)} color="#fb7185" />
        <MetricCard label="Delta p (Pa)" value={formatNumber(result.dp, 2)} color="#a78bfa" />
      </div>
      <Note>Ergun is a strong first estimate for porous-zone source terms in packed-bed CFD models.</Note>
    </CalculatorPanel>
  )
}

export function DarcyForchheimerPorousCalculator() {
  const [velocity, setVelocity] = useState(0.8)
  const [permeability, setPermeability] = useState(1e-9)
  const [forchheimer, setForchheimer] = useState(1200)
  const [length, setLength] = useState(0.4)
  const [rho, setRho] = useState(1.225)
  const [mu, setMu] = useState(1.8e-5)

  const result = useMemo(() => {
    const darcy = mu * velocity / Math.max(permeability, 1e-30)
    const inertial = forchheimer * rho * velocity * Math.abs(velocity)
    const dp = (darcy + inertial) * length
    const dominance = inertial > darcy ? 'Forchheimer dominated' : 'Darcy dominated'
    return { darcy, inertial, dpdz: darcy + inertial, dp, dominance }
  }, [forchheimer, length, mu, permeability, rho, velocity])

  const maxTerm = Math.max(Math.abs(result.darcy), Math.abs(result.inertial), 1e-12)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="U (m/s)" value={velocity} onChange={setVelocity} step={0.05} />
        <NumberField label="permeability K (m2)" value={permeability} onChange={setPermeability} step={1e-10} min={1e-30} />
        <NumberField label="Forchheimer C2 (1/m)" value={forchheimer} onChange={setForchheimer} step={100} min={0} />
        <NumberField label="zone length (m)" value={length} onChange={setLength} step={0.05} min={0} />
        <NumberField label="rho (kg/m3)" value={rho} onChange={setRho} step={0.05} min={1e-9} />
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <TermBar label="Darcy viscous term" value={result.darcy} scale={maxTerm} color="#22d3ee" />
        <TermBar label="Forchheimer inertial term" value={result.inertial} scale={maxTerm} color="#fb7185" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Darcy dp/dz" value={formatNumber(result.darcy, 2)} color="#22d3ee" />
        <MetricCard label="inertial dp/dz" value={formatNumber(result.inertial, 2)} color="#fbbf24" />
        <MetricCard label="Delta p (Pa)" value={formatNumber(result.dp, 2)} color="#fb7185" />
        <MetricCard label="dominance" value={result.dominance} color="#a78bfa" />
      </div>
      <Note>Matches the common CFD porous momentum sink form: S = -(mu/K)U - C2 rho |U|U.</Note>
    </CalculatorPanel>
  )
}

export function PowerLawFluidRheologyCalculator() {
  const [consistency, setConsistency] = useState(0.45)
  const [index, setIndex] = useState(0.65)
  const [shearRate, setShearRate] = useState(100)
  const [rho, setRho] = useState(1050)
  const [velocity, setVelocity] = useState(1)
  const [length, setLength] = useState(0.02)

  const result = useMemo(() => {
    const gammaDot = Math.max(shearRate, 1e-12)
    const tau = consistency * Math.pow(gammaDot, index)
    const apparentMu = tau / gammaDot
    const generalizedRe = rho * Math.pow(velocity, 2 - index) * Math.pow(length, index) / Math.max(consistency, 1e-30)
    const behavior = index < 0.95 ? 'shear-thinning' : index > 1.05 ? 'shear-thickening' : 'near Newtonian'
    return { tau, apparentMu, generalizedRe, behavior }
  }, [consistency, index, length, rho, shearRate, velocity])

  const curve = useMemo(() => {
    const points: string[] = []
    for (let i = 0; i <= 80; i++) {
      const gd = 1 + (1000 * i) / 80
      const muApp = consistency * Math.pow(gd, index - 1)
      const x = sx(log10Safe(gd), 0, 3)
      const y = sy(log10Safe(muApp), -4, 2)
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return points.join(' ')
  }, [consistency, index])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="K (Pa s^n)" value={consistency} onChange={setConsistency} step={0.05} min={1e-12} />
        <NumberField label="power index n" value={index} onChange={setIndex} step={0.05} min={0.05} />
        <NumberField label="shear rate (1/s)" value={shearRate} onChange={setShearRate} step={10} min={1e-12} />
        <NumberField label="rho (kg/m3)" value={rho} onChange={setRho} step={10} min={1e-9} />
        <NumberField label="U (m/s)" value={velocity} onChange={setVelocity} step={0.1} min={0} />
        <NumberField label="L (m)" value={length} onChange={setLength} step={0.005} min={1e-9} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 300" className="h-auto w-full" role="img" aria-label="Power-law apparent viscosity curve">
          <rect x="58" y="44" width="492" height="188" rx="16" fill="#08111f" />
          <path d={curve} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <text x="76" y="70" fill="var(--text)" fontSize="15" fontWeight="700">apparent viscosity vs shear rate</text>
          <text x="248" y="284" fill="var(--text-muted)" fontSize="12">log10 shear rate</text>
          <text x="14" y="154" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 14 154)">log10 mu_app</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="tau (Pa)" value={formatNumber(result.tau, 4)} color="#22d3ee" />
        <MetricCard label="mu_app (Pa s)" value={formatNumber(result.apparentMu, 5)} color="#34d399" />
        <MetricCard label="generalized Re" value={formatNumber(result.generalizedRe, 3)} color="#fbbf24" />
        <MetricCard label="behavior" value={result.behavior} color="#fb7185" />
      </div>
      <Note>Power-law fluids need local shear-rate-dependent viscosity; this tool gives a quick scale before solver setup.</Note>
    </CalculatorPanel>
  )
}

export function KozenyCarmanPermeabilityCalculator() {
  const [particleDiameter, setParticleDiameter] = useState(0.001)
  const [porosity, setPorosity] = useState(0.38)
  const [sphericity, setSphericity] = useState(0.85)
  const [velocity, setVelocity] = useState(0.01)
  const [mu, setMu] = useState(0.001)
  const [length, setLength] = useState(0.1)

  const result = useMemo(() => {
    const eps = clamp(porosity, 0.05, 0.95)
    const phi = clamp(sphericity, 0.05, 1)
    const permeability = (particleDiameter * particleDiameter * Math.pow(eps, 3) * phi * phi) / Math.max(180 * Math.pow(1 - eps, 2), 1e-30)
    const dpDarcy = mu * velocity * length / Math.max(permeability, 1e-30)
    return { eps, phi, permeability, dpDarcy }
  }, [length, mu, particleDiameter, porosity, sphericity, velocity])

  const pore = clamp(result.eps, 0.05, 0.95)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="particle d_p (m)" value={particleDiameter} onChange={setParticleDiameter} step={0.0001} min={1e-9} />
        <NumberField label="porosity eps" value={porosity} onChange={setPorosity} step={0.01} min={0.05} max={0.95} />
        <NumberField label="sphericity phi" value={sphericity} onChange={setSphericity} step={0.01} min={0.05} max={1} />
        <NumberField label="Darcy U (m/s)" value={velocity} onChange={setVelocity} step={0.001} />
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={0.0001} min={1e-12} />
        <NumberField label="length (m)" value={length} onChange={setLength} step={0.01} min={0} />
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 96 }, (_, i) => {
            const open = ((i * 37) % 100) < pore * 100
            return (
              <div
                key={i}
                className="h-4 rounded-sm"
                style={{ background: open ? 'rgba(34,211,238,0.5)' : 'rgba(251,191,36,0.75)' }}
              />
            )
          })}
        </div>
        <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>cyan cells approximate open pore volume</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="permeability K (m2)" value={formatNumber(result.permeability, 5)} color="#22d3ee" />
        <MetricCard label="Darcy dp (Pa)" value={formatNumber(result.dpDarcy, 3)} color="#fbbf24" />
        <MetricCard label="porosity used" value={formatNumber(result.eps, 3)} color="#34d399" />
        <MetricCard label="sphericity used" value={formatNumber(result.phi, 3)} color="#fb7185" />
      </div>
      <Note>Kozeny-Carman estimates permeability from particle geometry and porosity; calibrate against pressure-drop data when possible.</Note>
    </CalculatorPanel>
  )
}

function TermBar({ label, value, scale, color }: { label: string; value: number; scale: number; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="mb-2 flex justify-between gap-3 text-xs">
        <span className="uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</span>
        <span className="mono" style={{ color }}>{formatNumber(value, 2)}</span>
      </div>
      <div className="h-10 overflow-hidden rounded-full" style={{ background: 'rgba(148,163,184,0.14)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${clamp(Math.abs(value) / Math.max(scale, 1e-12), 0, 1) * 100}%`,
            background: color,
            boxShadow: `0 0 18px ${color}`,
          }}
        />
      </div>
    </div>
  )
}
