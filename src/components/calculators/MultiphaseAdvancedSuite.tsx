'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const G = 9.80665

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pipeFriction(re: number) {
  if (re < 2300) return 64 / Math.max(re, 1e-12)
  return 0.3164 / Math.pow(Math.max(re, 1e-12), 0.25)
}

export function TwoPhasePressureDropCalculator() {
  const [quality, setQuality] = useState(0.2)
  const [massFlux, setMassFlux] = useState(250)
  const [diameter, setDiameter] = useState(0.025)
  const [length, setLength] = useState(5)
  const [rhoL, setRhoL] = useState(950)
  const [rhoG, setRhoG] = useState(8)
  const [muL, setMuL] = useState(0.00045)
  const [muG, setMuG] = useState(1.4e-5)
  const [cLm, setCLm] = useState(20)

  const result = useMemo(() => {
    const x = clamp(quality, 1e-6, 0.999999)
    const gL = massFlux * (1 - x)
    const gG = massFlux * x
    const reL = gL * diameter / Math.max(muL, 1e-12)
    const reG = gG * diameter / Math.max(muG, 1e-12)
    const fL = pipeFriction(reL)
    const fG = pipeFriction(reG)
    const dpdzL = (2 * fL * gL * gL) / Math.max(rhoL * diameter, 1e-12)
    const dpdzG = (2 * fG * gG * gG) / Math.max(rhoG * diameter, 1e-12)
    const xLm = Math.sqrt(dpdzL / Math.max(dpdzG, 1e-12))
    const phiL2 = 1 + cLm / Math.max(xLm, 1e-12) + 1 / Math.max(xLm * xLm, 1e-12)
    const dpdzTwoPhase = phiL2 * dpdzL
    return {
      reL,
      reG,
      xLm,
      phiL2,
      dpdzL,
      dpdzG,
      dpdzTwoPhase,
      dpTotal: dpdzTwoPhase * length,
      liquidShare: clamp(1 - x, 0, 1),
      gasShare: clamp(x, 0, 1),
    }
  }, [cLm, diameter, length, massFlux, muG, muL, quality, rhoG, rhoL])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="quality x" value={quality} onChange={setQuality} step={0.01} min={0.0001} max={0.9999} />
        <NumberField label="mass flux G (kg/m2/s)" value={massFlux} onChange={setMassFlux} step={10} min={0} />
        <NumberField label="pipe D (m)" value={diameter} onChange={setDiameter} step={0.001} min={1e-6} />
        <NumberField label="pipe L (m)" value={length} onChange={setLength} step={0.1} min={0} />
        <NumberField label="rho_l (kg/m3)" value={rhoL} onChange={setRhoL} step={10} min={1e-6} />
        <NumberField label="rho_g (kg/m3)" value={rhoG} onChange={setRhoG} step={0.5} min={1e-9} />
        <NumberField label="mu_l (Pa s)" value={muL} onChange={setMuL} step={0.00005} min={1e-12} />
        <NumberField label="mu_g (Pa s)" value={muG} onChange={setMuG} step={1e-6} min={1e-12} />
        <NumberField label="LM C" value={cLm} onChange={setCLm} step={1} min={0} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 620 210" className="h-auto w-full" role="img" aria-label="Two-phase pressure drop pipe">
          <defs>
            <linearGradient id="twoPhasePipe" x1="0" x2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.62" />
              <stop offset={`${result.liquidShare * 100}%`} stopColor="#38bdf8" stopOpacity="0.62" />
              <stop offset={`${result.liquidShare * 100}%`} stopColor="#f8fafc" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.88" />
            </linearGradient>
          </defs>
          <rect x="38" y="42" width="544" height="126" rx="18" fill="#08111f" />
          <rect x="74" y="82" width="472" height="48" rx="24" fill="url(#twoPhasePipe)" stroke="#e5e7eb" strokeOpacity="0.42" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <circle key={i} cx={112 + i * 62} cy={96 + (i % 3) * 10} r={5 + (i % 2) * 3} fill="#e0f2fe" opacity="0.75" />
          ))}
          <path d="M90 154 C170 132 230 172 318 150 S486 138 538 156" fill="none" stroke="#22d3ee" strokeWidth="3" strokeOpacity="0.75" />
          <text x="70" y="70" fill="var(--text)" fontSize="15" fontWeight="700">Lockhart-Martinelli multiplier</text>
          <text x="402" y="70" fill="#fbbf24" fontSize="12">liquid film plus gas core</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="X_LM" value={formatNumber(result.xLm, 4)} color="#22d3ee" />
        <MetricCard label="phi_l^2" value={formatNumber(result.phiL2, 3)} color="#34d399" />
        <MetricCard label="dp/dz 2phi (Pa/m)" value={formatNumber(result.dpdzTwoPhase, 2)} color="#fbbf24" />
        <MetricCard label="Delta p total (Pa)" value={formatNumber(result.dpTotal, 2)} color="#fb7185" />
        <MetricCard label="Re_l / Re_g" value={`${formatNumber(result.reL, 2)} / ${formatNumber(result.reG, 2)}`} color="#a78bfa" />
      </div>
      <Note>Fast screening model only. Use detailed flow-pattern correlations before final sizing or safety decisions.</Note>
    </CalculatorPanel>
  )
}

export function VoidFractionSlipCalculator() {
  const [quality, setQuality] = useState(0.15)
  const [rhoL, setRhoL] = useState(998)
  const [rhoG, setRhoG] = useState(1.2)
  const [slipRatio, setSlipRatio] = useState(1.5)

  const result = useMemo(() => {
    const x = clamp(quality, 1e-6, 0.999999)
    const alpha = 1 / (1 + ((1 - x) / x) * (rhoG / Math.max(rhoL, 1e-12)) * Math.max(slipRatio, 1e-12))
    const rhoMix = alpha * rhoG + (1 - alpha) * rhoL
    const homogeneousAlpha = 1 / (1 + ((1 - x) / x) * (rhoG / Math.max(rhoL, 1e-12)))
    return { alpha, rhoMix, homogeneousAlpha, drift: alpha - homogeneousAlpha }
  }, [quality, rhoG, rhoL, slipRatio])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="quality x" value={quality} onChange={setQuality} step={0.01} min={0.0001} max={0.9999} />
        <NumberField label="rho_l (kg/m3)" value={rhoL} onChange={setRhoL} step={10} min={1e-6} />
        <NumberField label="rho_g (kg/m3)" value={rhoG} onChange={setRhoG} step={0.1} min={1e-9} />
        <NumberField label="slip S = u_g/u_l" value={slipRatio} onChange={setSlipRatio} step={0.1} min={0.05} />
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="mb-2 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>liquid holdup</span>
          <span>gas void</span>
        </div>
        <div className="relative h-16 overflow-hidden rounded-full bg-sky-400/40">
          <div className="absolute bottom-0 right-0 top-0 bg-slate-100/90 transition-[width] duration-300" style={{ width: `${result.alpha * 100}%` }} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="absolute h-2 w-2 rounded-full bg-cyan-200/90" style={{ left: `${18 + i * 12}%`, top: `${18 + (i % 2) * 18}px` }} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="void fraction alpha" value={formatNumber(result.alpha, 4)} color="#22d3ee" />
        <MetricCard label="mixture density (kg/m3)" value={formatNumber(result.rhoMix, 3)} color="#34d399" />
        <MetricCard label="homogeneous alpha" value={formatNumber(result.homogeneousAlpha, 4)} color="#fbbf24" />
        <MetricCard label="slip correction" value={formatNumber(result.drift, 4)} color="#fb7185" />
      </div>
      <Note>Even tiny gas quality can occupy most of the pipe volume when gas density is low.</Note>
    </CalculatorPanel>
  )
}

export function BubbleRiseRegimeCalculator() {
  const [diameter, setDiameter] = useState(0.003)
  const [rhoL, setRhoL] = useState(998)
  const [rhoG, setRhoG] = useState(1.2)
  const [muL, setMuL] = useState(0.001)
  const [sigma, setSigma] = useState(0.072)

  const result = useMemo(() => {
    const deltaRho = Math.max(rhoL - rhoG, 1e-12)
    const eo = deltaRho * G * diameter * diameter / Math.max(sigma, 1e-12)
    const mo = G * Math.pow(muL, 4) * deltaRho / Math.max(rhoL * rhoL * Math.pow(sigma, 3), 1e-30)
    const uStokes = deltaRho * G * diameter * diameter / Math.max(18 * muL, 1e-12)
    const uInertial = Math.sqrt((2 * deltaRho * G * diameter) / Math.max(3 * rhoL, 1e-12))
    const terminal = 1 / Math.sqrt(1 / Math.max(uStokes * uStokes, 1e-24) + 1 / Math.max(uInertial * uInertial, 1e-24))
    const reB = rhoL * terminal * diameter / Math.max(muL, 1e-12)
    const shape = eo < 1 ? 'spherical' : eo < 40 ? 'ellipsoidal' : 'cap / wobbling'
    return { eo, mo, terminal, reB, shape }
  }, [diameter, muL, rhoG, rhoL, sigma])

  const stretch = clamp(result.eo / 10, 0, 1)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="bubble d (m)" value={diameter} onChange={setDiameter} step={0.0005} min={1e-6} />
        <NumberField label="rho_l (kg/m3)" value={rhoL} onChange={setRhoL} step={10} min={1e-6} />
        <NumberField label="rho_g (kg/m3)" value={rhoG} onChange={setRhoG} step={0.1} min={0} />
        <NumberField label="mu_l (Pa s)" value={muL} onChange={setMuL} step={0.0001} min={1e-12} />
        <NumberField label="sigma (N/m)" value={sigma} onChange={setSigma} step={0.005} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 540 240" className="h-auto w-full" role="img" aria-label="Bubble rise regime sketch">
          <rect x="44" y="28" width="452" height="184" rx="18" fill="#08111f" />
          <line x1="270" x2="270" y1="180" y2="70" stroke="#22d3ee" strokeDasharray="5 5" strokeWidth="2" />
          <ellipse cx="270" cy="136" rx={38 + 34 * stretch} ry={44 - 18 * stretch} fill="#e0f2fe" opacity="0.86" stroke="#38bdf8" strokeWidth="3" />
          <path d="M270 178 C252 160 252 142 270 124 C288 106 288 88 270 70" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeOpacity="0.75" />
          <text x="70" y="58" fill="var(--text)" fontSize="15" fontWeight="700">bubble shape from Eotvos number</text>
          <text x="342" y="184" fill="#fbbf24" fontSize="12">rise path</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Eotvos Eo" value={formatNumber(result.eo, 4)} color="#22d3ee" />
        <MetricCard label="Morton Mo" value={formatNumber(result.mo, 4)} color="#34d399" />
        <MetricCard label="terminal U (m/s)" value={formatNumber(result.terminal, 4)} color="#fbbf24" />
        <MetricCard label="bubble Re" value={formatNumber(result.reB, 3)} color="#fb7185" />
        <MetricCard label="shape" value={result.shape} color="#a78bfa" />
      </div>
      <Note>Use as a regime preview for Euler-Euler or VOF setup. Deformable contaminated bubbles need more specific correlations.</Note>
    </CalculatorPanel>
  )
}

export function HydraulicJumpVisualizerCalculator() {
  const [depth1, setDepth1] = useState(0.25)
  const [velocity1, setVelocity1] = useState(4.5)
  const [channelWidth, setChannelWidth] = useState(1.2)
  const [gravity, setGravity] = useState(G)

  const result = useMemo(() => {
    const fr1 = velocity1 / Math.sqrt(Math.max(gravity * depth1, 1e-12))
    const depthRatio = 0.5 * (Math.sqrt(1 + 8 * fr1 * fr1) - 1)
    const depth2 = depth1 * depthRatio
    const velocity2 = velocity1 * depth1 / Math.max(depth2, 1e-12)
    const q = velocity1 * depth1 * channelWidth
    const energyLoss = Math.pow(depth2 - depth1, 3) / Math.max(4 * depth1 * depth2, 1e-12)
    const state = fr1 < 1 ? 'no jump: subcritical inlet' : fr1 < 1.7 ? 'undular jump' : fr1 < 4.5 ? 'oscillating jump' : 'strong jump'
    return { fr1, depthRatio, depth2, velocity2, q, energyLoss, state }
  }, [channelWidth, depth1, gravity, velocity1])

  const y1 = clamp(depth1 / Math.max(result.depth2, depth1, 1e-12), 0.12, 1)
  const y2 = clamp(result.depth2 / Math.max(result.depth2, depth1, 1e-12), 0.12, 1)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="upstream depth y1 (m)" value={depth1} onChange={setDepth1} step={0.05} min={1e-6} />
        <NumberField label="upstream U1 (m/s)" value={velocity1} onChange={setVelocity1} step={0.1} min={0} />
        <NumberField label="channel width (m)" value={channelWidth} onChange={setChannelWidth} step={0.1} min={1e-6} />
        <NumberField label="g (m/s2)" value={gravity} onChange={setGravity} step={0.01} min={1e-6} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 620 250" className="h-auto w-full" role="img" aria-label="Hydraulic jump sequent depth sketch">
          <rect x="38" y="34" width="544" height="178" rx="18" fill="#08111f" />
          <path d={`M70 ${190 - y1 * 118} L250 ${190 - y1 * 118} C286 ${190 - y1 * 118} 286 ${190 - y2 * 118} 330 ${190 - y2 * 118} L550 ${190 - y2 * 118} L550 190 L70 190 Z`} fill="#38bdf8" opacity="0.55" />
          <path d={`M70 ${190 - y1 * 118} L250 ${190 - y1 * 118} C286 ${190 - y1 * 118} 286 ${190 - y2 * 118} 330 ${190 - y2 * 118} L550 ${190 - y2 * 118}`} fill="none" stroke="#e0f2fe" strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M258 ${166 - i * 12} C278 ${148 - i * 6} 300 ${184 - i * 10} 320 ${156 - i * 8}`} fill="none" stroke="#fbbf24" strokeWidth="2" opacity={0.85 - i * 0.12} />
          ))}
          <text x="74" y="62" fill="var(--text)" fontSize="15" fontWeight="700">supercritical to subcritical jump</text>
          <text x="108" y="214" fill="var(--text-muted)" fontSize="12">y1</text>
          <text x="486" y="214" fill="var(--text-muted)" fontSize="12">y2</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Fr1" value={formatNumber(result.fr1, 3)} color="#22d3ee" />
        <MetricCard label="y2 / y1" value={formatNumber(result.depthRatio, 3)} color="#34d399" />
        <MetricCard label="y2 (m)" value={formatNumber(result.depth2, 3)} color="#fbbf24" />
        <MetricCard label="energy loss (m)" value={formatNumber(result.energyLoss, 4)} color="#fb7185" />
        <MetricCard label="class" value={result.state} color="#a78bfa" />
      </div>
      <Note>Hydraulic jumps are shallow-water shock analogs. This rectangular-channel estimate is useful for free-surface CFD initialization.</Note>
    </CalculatorPanel>
  )
}
