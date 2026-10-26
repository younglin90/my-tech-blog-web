'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, SelectField, formatNumber } from '@/components/calculators/ui'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sorSpectralRadius(omega: number, jacobi: number, omegaOpt: number): number {
  if (omega >= omegaOpt - 1e-9) return Math.abs(omega - 1)
  const disc = omega * omega * jacobi * jacobi - 4 * (omega - 1)
  if (disc < 0) return Math.abs(omega - 1)
  const root = (omega * jacobi + Math.sqrt(disc)) / 2
  return root * root
}

type Limiter = 'minmod' | 'vanleer' | 'superbee' | 'mc'
type Scheme = 'upwind1' | 'central2' | 'quick'

function limiterValue(type: Limiter, r: number) {
  const positive = Math.max(0, r)
  if (type === 'minmod') return Math.max(0, Math.min(1, r))
  if (type === 'vanleer') return (positive + Math.abs(positive)) / (1 + Math.abs(positive))
  if (type === 'superbee') return Math.max(0, Math.max(Math.min(2 * r, 1), Math.min(r, 2)))
  return Math.max(0, Math.min(Math.min((1 + r) / 2, 2), 2 * r))
}

function sx(value: number, min: number, max: number, left = 58, width = 492) {
  return left + clamp((value - min) / Math.max(max - min, 1e-12), 0, 1) * width
}

function sy(value: number, min: number, max: number, top = 46, height = 190) {
  return top + (1 - clamp((value - min) / Math.max(max - min, 1e-12), 0, 1)) * height
}

export function TvdLimiterVisualizerCalculator() {
  const [limiter, setLimiter] = useState<Limiter>('vanleer')
  const [r, setR] = useState(0.8)

  const result = useMemo(() => {
    const phi = limiterValue(limiter, r)
    const antidiffusion = phi / 2
    const risk = phi > 2 || phi < 0 ? 'unbounded' : r < 0 ? 'clipped' : phi > 1.5 ? 'sharp' : 'diffusive-safe'
    return { phi, antidiffusion, risk }
  }, [limiter, r])

  const curves = useMemo(() => {
    const types: Limiter[] = ['minmod', 'vanleer', 'superbee', 'mc']
    return types.map((type) => {
      const points: string[] = []
      for (let i = 0; i <= 90; i++) {
        const rv = (3 * i) / 90
        points.push(`${i === 0 ? 'M' : 'L'}${sx(rv, 0, 3).toFixed(1)} ${sy(limiterValue(type, rv), 0, 2.2).toFixed(1)}`)
      }
      return { type, path: points.join(' ') }
    })
  }, [])

  const colors: Record<Limiter, string> = {
    minmod: '#22d3ee',
    vanleer: '#34d399',
    superbee: '#fb7185',
    mc: '#fbbf24',
  }

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="limiter"
          value={limiter}
          onChange={(value) => setLimiter(value as Limiter)}
          options={[
            { value: 'vanleer', label: 'van Leer' },
            { value: 'minmod', label: 'minmod' },
            { value: 'superbee', label: 'Superbee' },
            { value: 'mc', label: 'MC' },
          ]}
        />
        <NumberField label="slope ratio r" value={r} onChange={setR} step={0.05} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 305" className="h-auto w-full" role="img" aria-label="TVD limiter curves">
          <rect x="58" y="46" width="492" height="190" rx="16" fill="#08111f" />
          {[0, 1, 2, 3].map((tick) => (
            <g key={tick}>
              <line x1={sx(tick, 0, 3)} x2={sx(tick, 0, 3)} y1="46" y2="236" stroke="rgba(148,163,184,0.18)" />
              <text x={sx(tick, 0, 3) - 4} y="260" fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          {[0, 1, 2].map((tick) => (
            <g key={tick}>
              <line x1="58" x2="550" y1={sy(tick, 0, 2.2)} y2={sy(tick, 0, 2.2)} stroke="rgba(148,163,184,0.18)" />
              <text x="32" y={sy(tick, 0, 2.2) + 4} fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          {curves.map((curve) => (
            <path key={curve.type} d={curve.path} fill="none" stroke={colors[curve.type]} strokeWidth={curve.type === limiter ? 3.5 : 1.8} strokeOpacity={curve.type === limiter ? 1 : 0.38} />
          ))}
          <circle cx={sx(clamp(r, 0, 3), 0, 3)} cy={sy(result.phi, 0, 2.2)} r="8" fill="#f8fafc" />
          <text x="76" y="72" fill="var(--text)" fontSize="15" fontWeight="700">flux limiter family</text>
          <text x="276" y="292" fill="var(--text-muted)" fontSize="12">r</text>
          <text x="14" y="158" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 14 158)">phi(r)</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="phi(r)" value={formatNumber(result.phi, 4)} color="#22d3ee" />
        <MetricCard label="anti-diffusion weight" value={formatNumber(result.antidiffusion, 4)} color="#fbbf24" />
        <MetricCard label="behavior" value={result.risk} color="#fb7185" />
      </div>
      <Note>Limiter curves explain why minmod is robust but diffusive, while Superbee is sharper near discontinuities.</Note>
    </CalculatorPanel>
  )
}

export function RiemannWaveSpeedEstimatorCalculator() {
  const [rhoL, setRhoL] = useState(1)
  const [uL, setUL] = useState(0)
  const [pL, setPL] = useState(100000)
  const [rhoR, setRhoR] = useState(0.125)
  const [uR, setUR] = useState(0)
  const [pR, setPR] = useState(10000)
  const [gamma, setGamma] = useState(1.4)
  const [dx, setDx] = useState(0.01)
  const [cfl, setCfl] = useState(0.5)

  const result = useMemo(() => {
    const aL = Math.sqrt(gamma * Math.max(pL, 1e-12) / Math.max(rhoL, 1e-12))
    const aR = Math.sqrt(gamma * Math.max(pR, 1e-12) / Math.max(rhoR, 1e-12))
    const sL = Math.min(uL - aL, uR - aR)
    const sR = Math.max(uL + aL, uR + aR)
    const spectralRadius = Math.max(Math.abs(sL), Math.abs(sR))
    const dt = cfl * dx / Math.max(spectralRadius, 1e-12)
    const roeU = (Math.sqrt(rhoL) * uL + Math.sqrt(rhoR) * uR) / Math.max(Math.sqrt(rhoL) + Math.sqrt(rhoR), 1e-12)
    return { aL, aR, sL, sR, spectralRadius, dt, roeU }
  }, [cfl, dx, gamma, pL, pR, rhoL, rhoR, uL, uR])

  const center = 304
  const scale = 170 / Math.max(Math.abs(result.sL), Math.abs(result.sR), 1e-12)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="rho_L" value={rhoL} onChange={setRhoL} step={0.05} min={1e-9} />
        <NumberField label="u_L (m/s)" value={uL} onChange={setUL} step={1} />
        <NumberField label="p_L (Pa)" value={pL} onChange={setPL} step={1000} min={1e-9} />
        <NumberField label="rho_R" value={rhoR} onChange={setRhoR} step={0.05} min={1e-9} />
        <NumberField label="u_R (m/s)" value={uR} onChange={setUR} step={1} />
        <NumberField label="p_R (Pa)" value={pR} onChange={setPR} step={1000} min={1e-9} />
        <NumberField label="gamma" value={gamma} onChange={setGamma} step={0.01} min={1.01} />
        <NumberField label="dx (m)" value={dx} onChange={setDx} step={0.001} min={1e-12} />
        <NumberField label="CFL target" value={cfl} onChange={setCfl} step={0.05} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 270" className="h-auto w-full" role="img" aria-label="Riemann wave fan">
          <rect x="58" y="36" width="492" height="190" rx="16" fill="#08111f" />
          <line x1={center} x2={center} y1="210" y2="54" stroke="#94a3b8" strokeOpacity="0.35" />
          <path d={`M${center} 210 L${center + result.sL * scale} 58`} stroke="#22d3ee" strokeWidth="3" fill="none" />
          <path d={`M${center} 210 L${center + result.roeU * scale} 58`} stroke="#fbbf24" strokeWidth="3" fill="none" strokeDasharray="6 5" />
          <path d={`M${center} 210 L${center + result.sR * scale} 58`} stroke="#fb7185" strokeWidth="3" fill="none" />
          <text x="78" y="64" fill="var(--text)" fontSize="15" fontWeight="700">HLLE/Rusanov wave-speed envelope</text>
          <text x="84" y="244" fill="#22d3ee" fontSize="12">S_L</text>
          <text x="290" y="244" fill="#fbbf24" fontSize="12">contact approx</text>
          <text x="500" y="244" fill="#fb7185" fontSize="12">S_R</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="a_L / a_R" value={`${formatNumber(result.aL, 2)} / ${formatNumber(result.aR, 2)}`} color="#22d3ee" />
        <MetricCard label="S_L (m/s)" value={formatNumber(result.sL, 3)} color="#34d399" />
        <MetricCard label="S_R (m/s)" value={formatNumber(result.sR, 3)} color="#fbbf24" />
        <MetricCard label="spectral radius" value={formatNumber(result.spectralRadius, 3)} color="#fb7185" />
        <MetricCard label="dt max (s)" value={formatNumber(result.dt, 6)} color="#a78bfa" />
      </div>
      <Note>These bounds are useful for first-pass explicit time-step limits and Rusanov/HLLE flux dissipation estimates.</Note>
    </CalculatorPanel>
  )
}

export function SorRelaxationPlannerCalculator() {
  const [gridN, setGridN] = useState(64)
  const [omega, setOmega] = useState(1.7)
  const [toleranceDrop, setToleranceDrop] = useState(6)

  const result = useMemo(() => {
    const n = Math.max(4, Math.round(gridN))
    const rhoJacobi = Math.cos(Math.PI / n)
    const omegaOpt = 2 / (1 + Math.sqrt(1 - rhoJacobi * rhoJacobi))
    const spectral = sorSpectralRadius(omega, rhoJacobi, omegaOpt)
    const clippedSpectral = clamp(spectral, 1e-9, 0.999999)
    const iterations = Math.log(10 ** -toleranceDrop) / Math.log(clippedSpectral)
    return { n, rhoJacobi, omegaOpt, spectral: clippedSpectral, iterations }
  }, [gridN, omega, toleranceDrop])

  const curve = useMemo(() => {
    const points: string[] = []
    const rhoJacobi = Math.cos(Math.PI / Math.max(4, Math.round(gridN)))
    for (let i = 0; i <= 80; i++) {
      const w = 0.5 + (1.49 * i) / 80
      const omegaOpt = 2 / (1 + Math.sqrt(1 - rhoJacobi * rhoJacobi))
      const spectral = clamp(sorSpectralRadius(w, rhoJacobi, omegaOpt), 1e-9, 0.999999)
      points.push(`${i === 0 ? 'M' : 'L'}${sx(w, 0.5, 1.99).toFixed(1)} ${sy(spectral, 0, 1).toFixed(1)}`)
    }
    return points.join(' ')
  }, [gridN])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="grid N per side" value={gridN} onChange={setGridN} step={4} min={4} />
        <NumberField label="SOR omega" value={omega} onChange={setOmega} step={0.05} min={0.1} max={1.99} />
        <NumberField label="target drop orders" value={toleranceDrop} onChange={setToleranceDrop} step={1} min={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 305" className="h-auto w-full" role="img" aria-label="SOR spectral radius planner">
          <rect x="58" y="46" width="492" height="190" rx="16" fill="#08111f" />
          <path d={curve} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <line x1={sx(result.omegaOpt, 0.5, 1.99)} x2={sx(result.omegaOpt, 0.5, 1.99)} y1="46" y2="236" stroke="#fbbf24" strokeDasharray="5 5" />
          <circle cx={sx(omega, 0.5, 1.99)} cy={sy(result.spectral, 0, 1)} r="8" fill="#fb7185" />
          <text x="76" y="72" fill="var(--text)" fontSize="15" fontWeight="700">estimated SOR convergence factor</text>
          <text x="270" y="292" fill="var(--text-muted)" fontSize="12">omega</text>
          <text x="14" y="158" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 14 158)">rho</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="rounded N" value={String(result.n)} color="#22d3ee" />
        <MetricCard label="omega optimum approx" value={formatNumber(result.omegaOpt, 4)} color="#34d399" />
        <MetricCard label="spectral radius" value={formatNumber(result.spectral, 5)} color="#fbbf24" />
        <MetricCard label="iterations estimate" value={formatNumber(result.iterations, 1)} color="#fb7185" />
      </div>
      <Note>Use as an intuition tool for elliptic pressure/Poisson smoothers. Multigrid changes the effective spectrum.</Note>
    </CalculatorPanel>
  )
}

function modifiedWavenumber(scheme: Scheme, kh: number) {
  if (scheme === 'central2') {
    return { real: Math.sin(kh), imag: 0 }
  }
  if (scheme === 'quick') {
    // QUICK face flux, u > 0. Dispersion is Im(σ); damping is Re(σ) of Δx ∂x.
    const real = (5 / 4) * Math.sin(kh) - (1 / 8) * Math.sin(2 * kh)
    const imag = 3 / 8 - 0.5 * Math.cos(kh) + (1 / 8) * Math.cos(2 * kh)
    return { real, imag: Math.max(0, imag) }
  }
  return { real: Math.sin(kh), imag: 1 - Math.cos(kh) }
}

export function ModifiedWavenumberAnalyzerCalculator() {
  const [scheme, setScheme] = useState<Scheme>('upwind1')
  const [kh, setKh] = useState(1.2)

  const result = useMemo(() => {
    const mod = modifiedWavenumber(scheme, kh)
    const phaseRatio = mod.real / Math.max(kh, 1e-12)
    return { ...mod, phaseRatio, damping: mod.imag }
  }, [kh, scheme])

  const curve = useMemo(() => {
    const phase: string[] = []
    const diss: string[] = []
    for (let i = 0; i <= 90; i++) {
      const x = (Math.PI * i) / 90
      const mod = modifiedWavenumber(scheme, x)
      phase.push(`${i === 0 ? 'M' : 'L'}${sx(x, 0, Math.PI).toFixed(1)} ${sy(mod.real, 0, Math.PI).toFixed(1)}`)
      diss.push(`${i === 0 ? 'M' : 'L'}${sx(x, 0, Math.PI).toFixed(1)} ${sy(mod.imag, 0, 2).toFixed(1)}`)
    }
    return { phase: phase.join(' '), diss: diss.join(' ') }
  }, [scheme])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="scheme"
          value={scheme}
          onChange={(value) => setScheme(value as Scheme)}
          options={[
            { value: 'upwind1', label: '1st upwind' },
            { value: 'central2', label: '2nd central' },
            { value: 'quick', label: 'QUICK' },
          ]}
        />
        <NumberField label="k h" value={kh} onChange={setKh} step={0.05} min={0} max={Math.PI} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 610 305" className="h-auto w-full" role="img" aria-label="Modified wavenumber curve">
          <rect x="58" y="46" width="492" height="190" rx="16" fill="#08111f" />
          <path d={curve.phase} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <path d={curve.diss} fill="none" stroke="#fb7185" strokeWidth="2.5" strokeDasharray="6 5" />
          <path d={`M${sx(0, 0, Math.PI)} ${sy(0, 0, Math.PI)} L${sx(Math.PI, 0, Math.PI)} ${sy(Math.PI, 0, Math.PI)}`} fill="none" stroke="#94a3b8" strokeOpacity="0.35" />
          <circle cx={sx(kh, 0, Math.PI)} cy={sy(result.real, 0, Math.PI)} r="8" fill="#fbbf24" />
          <text x="76" y="72" fill="var(--text)" fontSize="15" fontWeight="700">dispersion and numerical damping</text>
          <text x="382" y="72" fill="#fb7185" fontSize="12">dashed: dissipation</text>
          <text x="270" y="292" fill="var(--text-muted)" fontSize="12">k h</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="modified real" value={formatNumber(result.real, 5)} color="#22d3ee" />
        <MetricCard label="phase ratio" value={formatNumber(result.phaseRatio, 5)} color="#34d399" />
        <MetricCard label="damping imag" value={formatNumber(result.damping, 5)} color="#fb7185" />
        <MetricCard label="points/wave" value={formatNumber((2 * Math.PI) / Math.max(kh, 1e-12), 2)} color="#fbbf24" />
      </div>
      <Note>Modified-wavenumber plots show why under-resolved waves travel at the wrong speed or get damped by upwind bias.</Note>
    </CalculatorPanel>
  )
}
