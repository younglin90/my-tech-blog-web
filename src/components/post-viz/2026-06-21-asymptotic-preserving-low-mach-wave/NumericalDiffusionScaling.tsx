'use client'

import { useState } from 'react'

// How the effective numerical diffusion of each scheme scales with the Mach
// number ε on a fixed grid. The explicit upwind (Rusanov) scheme carries a
// viscosity proportional to the acoustic speed,
//
//   D_explicit = ½ c Δx (1 - ν) = ½ (a/ε) Δx (1 - ν)  ∝  1/ε,
//
// so on a log-log plot it is a straight line of slope -1: every decade you
// lower the Mach number, the spurious diffusion grows by a decade. The AP /
// implicit-central scheme treats the acoustic operator implicitly and adds no
// acoustic upwind term, so its effective diffusion stays O(1) — a flat line.
// Drag ε to see the gap open up.

const W = 640
const H = 360
const A_REF = 1
const DX = 1 / 64
const NU = 0.5

// log10 ranges
const EPS_MIN = 1e-3
const EPS_MAX = 1
const D_MIN = 1e-2
const D_MAX = 1e3

export function NumericalDiffusionScaling() {
  const [logEps, setLogEps] = useState(-1.3) // log10(ε)

  const eps = Math.pow(10, logEps)
  const dExplicit = 0.5 * (A_REF / eps) * DX * (1 - NU)
  const dAP = 0.5 * A_REF * DX // ε-independent reference level

  const padL = 64
  const padR = 24
  const padT = 24
  const padB = 52
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const lx = (e: number) =>
    padL + ((Math.log10(e) - Math.log10(EPS_MIN)) / (Math.log10(EPS_MAX) - Math.log10(EPS_MIN))) * plotW
  const ly = (d: number) =>
    padT + (1 - (Math.log10(d) - Math.log10(D_MIN)) / (Math.log10(D_MAX) - Math.log10(D_MIN))) * plotH

  // explicit line endpoints
  const exFn = (e: number) => 0.5 * (A_REF / e) * DX * (1 - NU)
  const apFn = () => dAP

  const epsTicks = [1e-3, 1e-2, 1e-1, 1]
  const dTicks = [1e-2, 1e-1, 1, 10, 100, 1000]

  const fmt = (v: number) => {
    if (v >= 100 || v < 0.01) return v.toExponential(1)
    if (v >= 1) return v.toFixed(1)
    return v.toFixed(3)
  }

  return (
    <div
      style={{
        border: '1px solid var(--border, #334155)',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: 'var(--surface, rgba(148,163,184,0.05))',
      }}
    >
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* grid + ticks */}
        {dTicks.map((d) => (
          <g key={`d${d}`}>
            <line x1={padL} y1={ly(d)} x2={padL + plotW} y2={ly(d)} stroke="var(--border, #334155)" strokeWidth={0.7} opacity={0.5} />
            <text x={padL - 8} y={ly(d) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted, #7a90a8)">
              {d >= 1 ? d : d.toString()}
            </text>
          </g>
        ))}
        {epsTicks.map((e) => (
          <g key={`e${e}`}>
            <line x1={lx(e)} y1={padT} x2={lx(e)} y2={padT + plotH} stroke="var(--border, #334155)" strokeWidth={0.7} opacity={0.5} />
            <text x={lx(e)} y={padT + plotH + 18} textAnchor="middle" fontSize={11} fill="var(--text-muted, #7a90a8)">
              {e}
            </text>
          </g>
        ))}
        <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--text, #cbd5e1)">
          Mach number ε  (log scale)
        </text>
        <text x={16} y={padT + plotH / 2} textAnchor="middle" fontSize={12} fill="var(--text, #cbd5e1)" transform={`rotate(-90 16 ${padT + plotH / 2})`}>
          effective diffusion  (log)
        </text>

        {/* explicit line (slope -1) */}
        <line x1={lx(EPS_MIN)} y1={ly(exFn(EPS_MIN))} x2={lx(EPS_MAX)} y2={ly(exFn(EPS_MAX))} stroke="#ef4444" strokeWidth={2.5} />
        {/* AP flat line */}
        <line x1={lx(EPS_MIN)} y1={ly(apFn())} x2={lx(EPS_MAX)} y2={ly(apFn())} stroke="#22d3ee" strokeWidth={2.5} />

        {/* current-ε vertical guide + markers */}
        <line x1={lx(eps)} y1={padT} x2={lx(eps)} y2={padT + plotH} stroke="var(--text-muted, #7a90a8)" strokeWidth={1} strokeDasharray="4 4" />
        <circle cx={lx(eps)} cy={ly(dExplicit)} r={5} fill="#ef4444" />
        <circle cx={lx(eps)} cy={ly(dAP)} r={5} fill="#22d3ee" />

        {/* legend */}
        <text x={lx(EPS_MIN) + 8} y={ly(exFn(EPS_MIN)) - 8} fontSize={12} fill="#ef4444">explicit upwind  ∝ 1/ε</text>
        <text x={lx(EPS_MAX) - 8} y={ly(apFn()) - 10} textAnchor="end" fontSize={12} fill="#22d3ee">AP / implicit  (flat)</text>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 240, flex: 1 }}>
          <span>Mach ε = {eps < 0.01 ? eps.toExponential(1) : eps.toFixed(3)}</span>
          <input
            type="range"
            min={-3}
            max={0}
            step={0.02}
            value={logEps}
            onChange={(e) => setLogEps(parseFloat(e.target.value))}
          />
        </label>
        <div style={{ fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ color: '#ef4444' }}>D_explicit ≈ {fmt(dExplicit)}</div>
          <div style={{ color: '#22d3ee' }}>D_AP ≈ {fmt(dAP)}</div>
          <div style={{ color: 'var(--text-muted, #7a90a8)' }}>ratio ≈ {fmt(dExplicit / dAP)}×</div>
        </div>
      </div>
    </div>
  )
}
