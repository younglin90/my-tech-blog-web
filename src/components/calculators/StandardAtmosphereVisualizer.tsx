'use client'

import { useMemo, useState } from 'react'
import { CalculatorPanel, MetricCard, Note, NumberField, formatNumber } from '@/components/calculators/ui'

const G0 = 9.80665
const R = 287.05287
const GAMMA = 1.4
const T0 = 288.15
const P0 = 101325
const LAPSE = -0.0065
const MU0 = 1.716e-5
const SUTHERLAND = 110.4

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function atmosphere(altitudeM: number) {
  const h = clamp(altitudeM, 0, 32000)
  if (h <= 11000) {
    const t = T0 + LAPSE * h
    const p = P0 * Math.pow(t / T0, -G0 / (LAPSE * R))
    return { t, p }
  }
  const t11 = T0 + LAPSE * 11000
  const p11 = P0 * Math.pow(t11 / T0, -G0 / (LAPSE * R))
  const t = t11
  const p = p11 * Math.exp((-G0 * (h - 11000)) / (R * t))
  return { t, p }
}

function markerY(altitudeM: number) {
  return 300 - clamp(altitudeM / 32000, 0, 1) * 230
}

export function StandardAtmosphereVisualizerCalculator() {
  const [altitudeKm, setAltitudeKm] = useState(3)
  const [speed, setSpeed] = useState(80)
  const [length, setLength] = useState(1)

  const result = useMemo(() => {
    const altitudeM = altitudeKm * 1000
    const { t, p } = atmosphere(altitudeM)
    const rho = p / (R * t)
    const a = Math.sqrt(GAMMA * R * t)
    const mach = speed / Math.max(a, 1e-12)
    const mu = MU0 * Math.pow(t / 273.15, 1.5) * ((273.15 + SUTHERLAND) / (t + SUTHERLAND))
    const nu = mu / Math.max(rho, 1e-12)
    const re = (rho * speed * length) / Math.max(mu, 1e-12)
    const q = 0.5 * rho * speed * speed
    return { altitudeM, t, p, rho, a, mach, mu, nu, re, q }
  }, [altitudeKm, length, speed])

  return (
    <CalculatorPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="altitude (km)" value={altitudeKm} onChange={setAltitudeKm} step={0.5} min={0} max={32} />
        <NumberField label="U (m/s)" value={speed} onChange={setSpeed} step={5} min={0} />
        <NumberField label="reference length (m)" value={length} onChange={setLength} step={0.1} min={1e-6} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 660 360" className="h-auto w-full" role="img" aria-label="Standard atmosphere visualizer">
          <defs>
            <linearGradient id="atmosphereColumn" x1="0" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#34d399" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <rect x="58" y="50" width="550" height="270" rx="18" fill="#08111f" />
          <rect x="110" y="70" width="190" height="230" rx="16" fill="url(#atmosphereColumn)" stroke="rgba(226,232,240,0.24)" />
          <rect x="110" y={markerY(11000)} width="190" height="2" fill="#fbbf24" opacity="0.85" />
          <text x="312" y={markerY(11000) + 4} fill="#fde68a" fontSize="12">tropopause 11 km</text>

          {[0, 8, 16, 24, 32].map((km) => (
            <g key={km}>
              <line x1="100" x2="308" y1={markerY(km * 1000)} y2={markerY(km * 1000)} stroke="rgba(226,232,240,0.18)" strokeDasharray="4 4" />
              <text x="64" y={markerY(km * 1000) + 4} fill="var(--text-muted)" fontSize="11">{`${km} km`}</text>
            </g>
          ))}

          <line x1="105" x2="305" y1={markerY(result.altitudeM)} y2={markerY(result.altitudeM)} stroke="#22d3ee" strokeWidth="3" />
          <circle cx="205" cy={markerY(result.altitudeM)} r="12" fill="#22d3ee" />
          <circle cx="205" cy={markerY(result.altitudeM)} r="22" fill="none" stroke="#22d3ee" strokeOpacity="0.36">
            <animate attributeName="r" values="14;29;14" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2.4s" repeatCount="indefinite" />
          </circle>

          <path d="M380 250 C420 210, 430 160, 470 126 S548 94, 584 72" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
          <path d="M380 268 C428 244, 462 222, 502 190 S558 138, 584 92" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.85" />
          <text x="76" y="40" fill="var(--text)" fontSize="15" fontWeight="700">Standard atmosphere setup</text>
          <text x="384" y="70" fill="#bbf7d0" fontSize="12">density falls with altitude</text>
          <text x="384" y="92" fill="#fde68a" fontSize="12">same U gives higher Mach</text>
          <text x="146" y="332" fill="var(--text-muted)" fontSize="12">altitude marker</text>
        </svg>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="T (K)" value={formatNumber(result.t)} color="#fbbf24" />
        <MetricCard label="p (Pa)" value={formatNumber(result.p)} color="#22d3ee" />
        <MetricCard label="rho (kg/m^3)" value={formatNumber(result.rho)} color="#34d399" />
        <MetricCard label="speed of sound (m/s)" value={formatNumber(result.a)} color="#a78bfa" />
        <MetricCard label="Mach" value={formatNumber(result.mach)} color="#fb7185" />
        <MetricCard label="Re_L" value={formatNumber(result.re)} color="#34d399" />
        <MetricCard label="q (Pa)" value={formatNumber(result.q)} color="#22d3ee" />
        <MetricCard label="nu (m^2/s)" value={formatNumber(result.nu)} color="#fbbf24" />
      </div>
      <Note>This simplified ISA model covers the troposphere and lower stratosphere up to 32 km. Use site weather data for final validation cases.</Note>
    </CalculatorPanel>
  )
}
