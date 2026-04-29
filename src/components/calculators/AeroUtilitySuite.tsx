'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const G = 9.80665
const GAMMA_AIR = 1.4
const R_AIR = 287.05

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function xScale(value: number, min: number, max: number, left = 54, width = 492) {
  return left + clamp((value - min) / (max - min), 0, 1) * width
}

function yScale(value: number, min: number, max: number, top = 42, height = 210) {
  return top + (1 - clamp((value - min) / (max - min), 0, 1)) * height
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180
}

function liftSlopeFinite(aspectRatio: number, oswald: number) {
  const ar = Math.max(aspectRatio, 1e-6)
  const e = Math.max(oswald, 1e-6)
  return (2 * Math.PI) / (1 + 2 / (ar * e))
}

export function ThinAirfoilLiftCurveCalculator() {
  const [alphaDeg, setAlphaDeg] = useState(5)
  const [aspectRatio, setAspectRatio] = useState(8)
  const [oswald, setOswald] = useState(0.85)
  const [cd0, setCd0] = useState(0.025)
  const [stallDeg, setStallDeg] = useState(14)

  const result = useMemo(() => {
    const slope = liftSlopeFinite(aspectRatio, oswald)
    const alpha = degToRad(alphaDeg)
    const clLinear = slope * alpha
    const stallRatio = Math.abs(alphaDeg) / Math.max(Math.abs(stallDeg), 1e-6)
    const stallLoss = stallRatio <= 1 ? 1 : Math.max(0.25, 1 - 0.38 * (stallRatio - 1))
    const cl = clLinear * stallLoss
    const cdi = (cl * cl) / (Math.PI * Math.max(aspectRatio, 1e-6) * Math.max(oswald, 1e-6))
    const cd = cd0 + cdi
    return {
      slopePerDeg: slope * Math.PI / 180,
      cl,
      cdi,
      cd,
      liftToDrag: cd > 0 ? cl / cd : Number.NaN,
      stallMargin: Math.max(0, Math.abs(stallDeg) - Math.abs(alphaDeg)),
    }
  }, [alphaDeg, aspectRatio, cd0, oswald, stallDeg])

  const curve = useMemo(() => {
    const points: string[] = []
    const slope = liftSlopeFinite(aspectRatio, oswald)
    for (let i = 0; i <= 80; i++) {
      const a = -18 + (36 * i) / 80
      const stallRatio = Math.abs(a) / Math.max(Math.abs(stallDeg), 1e-6)
      const loss = stallRatio <= 1 ? 1 : Math.max(0.25, 1 - 0.38 * (stallRatio - 1))
      const cl = slope * degToRad(a) * loss
      points.push(`${i === 0 ? 'M' : 'L'}${xScale(a, -18, 18).toFixed(1)} ${yScale(cl, -1.8, 1.8).toFixed(1)}`)
    }
    return points.join(' ')
  }, [aspectRatio, oswald, stallDeg])

  const pointX = xScale(alphaDeg, -18, 18)
  const pointY = yScale(result.cl, -1.8, 1.8)
  const stallX = xScale(stallDeg, -18, 18)
  const negStallX = xScale(-stallDeg, -18, 18)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="alpha (deg)" value={alphaDeg} onChange={setAlphaDeg} step={0.5} />
        <NumberField label="aspect ratio" value={aspectRatio} onChange={setAspectRatio} step={0.5} min={0.1} />
        <NumberField label="Oswald e" value={oswald} onChange={setOswald} step={0.01} min={0.05} max={1.2} />
        <NumberField label="C_D0" value={cd0} onChange={setCd0} step={0.002} min={0} />
        <NumberField label="stall angle (deg)" value={stallDeg} onChange={setStallDeg} step={0.5} min={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 600 310" className="h-auto w-full" role="img" aria-label="Thin airfoil lift curve">
          <rect x="54" y="42" width="492" height="210" rx="14" fill="#08111f" />
          <rect x="54" y="42" width={negStallX - 54} height="210" fill="#fb7185" opacity="0.1" />
          <rect x={stallX} y="42" width={546 - stallX} height="210" fill="#fb7185" opacity="0.1" />
          {[ -10, 0, 10 ].map((tick) => (
            <g key={tick}>
              <line x1={xScale(tick, -18, 18)} x2={xScale(tick, -18, 18)} y1="42" y2="252" stroke="rgba(148,163,184,0.18)" />
              <text x={xScale(tick, -18, 18) - 10} y="276" fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          {[ -1, 0, 1 ].map((tick) => (
            <g key={tick}>
              <line x1="54" x2="546" y1={yScale(tick, -1.8, 1.8)} y2={yScale(tick, -1.8, 1.8)} stroke="rgba(148,163,184,0.18)" />
              <text x="25" y={yScale(tick, -1.8, 1.8) + 4} fill="var(--text-muted)" fontSize="11">{tick}</text>
            </g>
          ))}
          <path d={curve} fill="none" stroke="#22d3ee" strokeWidth="3" />
          <line x1={pointX} x2={pointX} y1="42" y2="252" stroke="#f8fafc" strokeDasharray="4 4" strokeOpacity="0.5" />
          <circle cx={pointX} cy={pointY} r="9" fill="#fbbf24" />
          <text x="68" y="68" fill="var(--text)" fontSize="15" fontWeight="700">finite-wing lift curve</text>
          <text x="394" y="68" fill="#fecaca" fontSize="12">red zone: post-stall model</text>
          <text x="282" y="300" fill="var(--text-muted)" fontSize="12">angle of attack alpha (deg)</text>
          <text x="10" y="164" fill="var(--text-muted)" fontSize="12" transform="rotate(-90 10 164)">C_L</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="dCL/dalpha per deg" value={formatNumber(result.slopePerDeg, 4)} color="#22d3ee" />
        <MetricCard label="C_L" value={formatNumber(result.cl, 4)} color="#34d399" />
        <MetricCard label="C_Di" value={formatNumber(result.cdi, 4)} color="#fbbf24" />
        <MetricCard label="C_D" value={formatNumber(result.cd, 4)} color="#fb7185" />
        <MetricCard label="L/D" value={formatNumber(result.liftToDrag, 3)} color="#a78bfa" />
      </div>
      <Note>Use this as a first-pass inviscid lift and induced-drag check. It is not a stall-resolved airfoil polar.</Note>
    </CalculatorPanel>
  )
}

export function StallSpeedEstimatorCalculator() {
  const [weight, setWeight] = useState(9000)
  const [rho, setRho] = useState(1.225)
  const [area, setArea] = useState(16)
  const [clMax, setClMax] = useState(1.5)
  const [loadFactor, setLoadFactor] = useState(1)

  const result = useMemo(() => {
    const vs = Math.sqrt((2 * weight * loadFactor) / Math.max(rho * area * clMax, 1e-12))
    return {
      vs,
      approach: 1.3 * vs,
      qStall: 0.5 * rho * vs * vs,
      bankAngle: loadFactor >= 1 ? Math.acos(clamp(1 / loadFactor, 0, 1)) * 180 / Math.PI : 0,
    }
  }, [area, clMax, loadFactor, rho, weight])

  const safeX = clamp((result.approach / 120) * 100, 0, 100)
  const stallX = clamp((result.vs / 120) * 100, 0, 100)

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="weight or lift required (N)" value={weight} onChange={setWeight} step={100} min={1} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-6} />
        <NumberField label="wing/ref area (m^2)" value={area} onChange={setArea} step={0.5} min={1e-6} />
        <NumberField label="C_Lmax" value={clMax} onChange={setClMax} step={0.05} min={0.05} />
        <NumberField label="load factor n" value={loadFactor} onChange={setLoadFactor} step={0.1} min={0.1} />
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="mb-3 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>speed tape</span>
          <span>stall x 1.3 approach marker</span>
        </div>
        <div className="relative h-12 overflow-hidden rounded-full" style={{ background: 'linear-gradient(90deg, rgba(251,113,133,0.34), rgba(251,191,36,0.3), rgba(34,211,238,0.32))' }}>
          <div className="absolute bottom-0 top-0 w-0.5 bg-rose-300" style={{ left: `${stallX}%` }} />
          <div className="absolute bottom-0 top-0 w-1 bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.75)]" style={{ left: `${safeX}%` }} />
          <div className="absolute left-3 top-3 text-xs font-semibold text-rose-100">stall</div>
          <div className="absolute right-3 top-3 text-xs font-semibold text-cyan-100">margin</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="stall speed (m/s)" value={formatNumber(result.vs, 3)} color="#fb7185" />
        <MetricCard label="1.3 Vs (m/s)" value={formatNumber(result.approach, 3)} color="#22d3ee" />
        <MetricCard label="q at stall (Pa)" value={formatNumber(result.qStall, 3)} color="#fbbf24" />
        <MetricCard label="equiv bank angle" value={`${formatNumber(result.bankAngle, 2)} deg`} color="#a78bfa" />
      </div>
      <Note>For hydrofoils, wings, UAVs, and wind-tunnel models, keep the reference area and C_Lmax convention consistent.</Note>
    </CalculatorPanel>
  )
}

export function FlatPlateSkinFrictionCalculator() {
  const [velocity, setVelocity] = useState(35)
  const [length, setLength] = useState(1.2)
  const [width, setWidth] = useState(0.4)
  const [rho, setRho] = useState(1.225)
  const [nu, setNu] = useState(1.5e-5)

  const result = useMemo(() => {
    const re = velocity * length / Math.max(nu, 1e-12)
    const cfLaminar = 1.328 / Math.sqrt(Math.max(re, 1e-12))
    const cfTurbulent = 0.074 / Math.pow(Math.max(re, 1e-12), 0.2)
    const cfMixed = re <= 5e5 ? cfLaminar : Math.max(0, 0.074 / Math.pow(re, 0.2) - 1742 / re)
    const area = length * width
    const q = 0.5 * rho * velocity * velocity
    const xTransition = 5e5 * nu / Math.max(velocity, 1e-12)
    return {
      re,
      cfLaminar,
      cfTurbulent,
      cfMixed,
      drag: cfMixed * q * area,
      xTransition,
      transitionFraction: clamp(xTransition / Math.max(length, 1e-12), 0, 1),
    }
  }, [length, nu, rho, velocity, width])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-5">
        <NumberField label="U_inf (m/s)" value={velocity} onChange={setVelocity} step={1} min={0} />
        <NumberField label="plate length (m)" value={length} onChange={setLength} step={0.1} min={1e-6} />
        <NumberField label="plate width (m)" value={width} onChange={setWidth} step={0.05} min={1e-6} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-6} />
        <NumberField label="nu (m^2/s)" value={nu} onChange={setNu} step={1e-6} min={1e-12} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 600 220" className="h-auto w-full" role="img" aria-label="Flat plate boundary layer and transition">
          <defs>
            <linearGradient id="skinFrictionWake" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.42" />
            </linearGradient>
          </defs>
          <rect x="38" y="34" width="524" height="150" rx="16" fill="#08111f" />
          <line x1="72" y1="150" x2="530" y2="150" stroke="#e5e7eb" strokeWidth="4" />
          <path d="M72 150 C160 142, 250 120, 530 72 L530 150 Z" fill="url(#skinFrictionWake)" />
          <line x1={72 + result.transitionFraction * 458} x2={72 + result.transitionFraction * 458} y1="60" y2="166" stroke="#fbbf24" strokeDasharray="4 4" />
          <text x="86" y="74" fill="#67e8f9" fontSize="12" fontWeight="700">laminar growth</text>
          <text x="348" y="74" fill="#fecaca" fontSize="12" fontWeight="700">turbulent/mixed drag</text>
          <text x={74 + result.transitionFraction * 458} y="48" fill="#fbbf24" fontSize="12">Re_x = 5e5</text>
          <g transform="translate(76 118)">
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${i * 26} 0 C${i * 26 + 12} -9 ${i * 26 + 22} -9 ${i * 26 + 34} 0`} fill="none" stroke="#22d3ee" strokeWidth="2" opacity={0.8 - i * 0.1} />
            ))}
          </g>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Re_L" value={formatNumber(result.re, 3)} color="#22d3ee" />
        <MetricCard label="C_f laminar" value={formatNumber(result.cfLaminar, 5)} color="#34d399" />
        <MetricCard label="C_f turbulent" value={formatNumber(result.cfTurbulent, 5)} color="#fbbf24" />
        <MetricCard label="C_f mixed" value={formatNumber(result.cfMixed, 5)} color="#fb7185" />
        <MetricCard label="skin-friction drag (N)" value={formatNumber(result.drag, 4)} color="#a78bfa" />
      </div>
      <Note>Mixed turbulent estimate uses the common smooth flat-plate correction with transition near Re_x = 5e5.</Note>
    </CalculatorPanel>
  )
}

export function WindTunnelSimilarityCalculator() {
  const [prototypeSpeed, setPrototypeSpeed] = useState(60)
  const [prototypeLength, setPrototypeLength] = useState(4)
  const [modelScale, setModelScale] = useState(10)
  const [tunnelSpeed, setTunnelSpeed] = useState(80)
  const [rho, setRho] = useState(1.225)
  const [mu, setMu] = useState(1.8e-5)
  const [temperature, setTemperature] = useState(288.15)

  const result = useMemo(() => {
    const modelLength = prototypeLength / Math.max(modelScale, 1e-12)
    const speedOfSound = Math.sqrt(GAMMA_AIR * R_AIR * Math.max(temperature, 1e-9))
    const rePrototype = rho * prototypeSpeed * prototypeLength / Math.max(mu, 1e-12)
    const reModel = rho * tunnelSpeed * modelLength / Math.max(mu, 1e-12)
    const machPrototype = prototypeSpeed / speedOfSound
    const machModel = tunnelSpeed / speedOfSound
    const reMatchSpeed = prototypeSpeed * modelScale
    return {
      modelLength,
      rePrototype,
      reModel,
      reRatio: reModel / Math.max(rePrototype, 1e-12),
      machPrototype,
      machModel,
      machRatio: machModel / Math.max(machPrototype, 1e-12),
      reMatchSpeed,
    }
  }, [modelScale, mu, prototypeLength, prototypeSpeed, rho, temperature, tunnelSpeed])

  const reBar = clamp(result.reRatio, 0, 2) * 50
  const machBar = clamp(result.machRatio, 0, 2) * 50

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="prototype U (m/s)" value={prototypeSpeed} onChange={setPrototypeSpeed} step={1} min={0} />
        <NumberField label="prototype L (m)" value={prototypeLength} onChange={setPrototypeLength} step={0.1} min={1e-6} />
        <NumberField label="scale P/M" value={modelScale} onChange={setModelScale} step={1} min={1} />
        <NumberField label="tunnel U (m/s)" value={tunnelSpeed} onChange={setTunnelSpeed} step={1} min={0} />
        <NumberField label="rho (kg/m^3)" value={rho} onChange={setRho} step={0.01} min={1e-9} />
        <NumberField label="mu (Pa s)" value={mu} onChange={setMu} step={1e-6} min={1e-12} />
        <NumberField label="T (K)" value={temperature} onChange={setTemperature} step={1} min={1} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <SimilarityBar label="Re match" value={result.reRatio} percent={reBar} color="#22d3ee" />
        <SimilarityBar label="Mach match" value={result.machRatio} percent={machBar} color="#fbbf24" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="model length (m)" value={formatNumber(result.modelLength, 4)} color="#22d3ee" />
        <MetricCard label="Re model / prototype" value={formatNumber(result.reRatio, 4)} color="#34d399" />
        <MetricCard label="Mach model / prototype" value={formatNumber(result.machRatio, 4)} color="#fbbf24" />
        <MetricCard label="U for Re match (m/s)" value={formatNumber(result.reMatchSpeed, 3)} color="#fb7185" />
        <MetricCard label="Mach model" value={formatNumber(result.machModel, 4)} color="#a78bfa" />
      </div>
      <Note>Small models match Mach easily but usually miss Reynolds unless pressure, density, or tunnel speed is increased.</Note>
    </CalculatorPanel>
  )
}

function SimilarityBar({
  label,
  value,
  percent,
  color,
}: {
  label: string
  value: number
  percent: number
  color: string
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</span>
        <span className="mono" style={{ color }}>{formatNumber(value, 3)}x</span>
      </div>
      <div className="relative h-10 overflow-hidden rounded-full" style={{ background: 'rgba(148,163,184,0.14)' }}>
        <div className="absolute bottom-0 top-0 w-px bg-slate-200/70" style={{ left: '50%' }} />
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.45))`,
            boxShadow: `0 0 18px ${color}`,
          }}
        />
      </div>
    </div>
  )
}
