'use client'

import { useMemo, useState } from 'react'

// Phase speed and group speed of surface waves versus wavelength.
//
// Full deep-to-shallow dispersion relation (inviscid, small amplitude):
//
//   omega^2 = ( g*k + sigma*k^3 / rho ) * tanh(k*h)
//
// with k = 2*pi/lambda the wavenumber, g gravity, sigma surface tension,
// rho density, h still-water depth. The first term in the bracket is the
// gravity restoring force, the second the surface-tension restoring force.
//
//   phase speed  c   = omega / k
//   group speed  c_g = d(omega)/dk   (evaluated numerically here)
//
// Long waves feel mostly gravity and get slower as they shorten; very short
// waves feel mostly surface tension and get faster as they shorten. Between
// them sits a minimum phase speed. Drag the sliders and watch the two curves
// and that minimum move.

const G = 9.81
const RHO = 1000

function omega(k: number, sigma: number, h: number) {
  return Math.sqrt((G * k + (sigma * k * k * k) / RHO) * Math.tanh(k * h))
}

function phaseSpeed(lambda: number, sigma: number, h: number) {
  const k = (2 * Math.PI) / lambda
  return omega(k, sigma, h) / k
}

function groupSpeed(lambda: number, sigma: number, h: number) {
  const k = (2 * Math.PI) / lambda
  const dk = k * 1e-4
  return (omega(k + dk, sigma, h) - omega(k - dk, sigma, h)) / (2 * dk)
}

export function WaveDispersionExplorer() {
  const [sigma, setSigma] = useState(0.072) // N/m, clean water ~0.072
  const [h, setH] = useState(2.0) // m, still-water depth

  const W = 620
  const H = 360
  const padL = 58
  const padR = 18
  const padT = 20
  const padB = 46

  // log-spaced wavelengths from 1 mm to 10 m
  const lamMin = 0.001
  const lamMax = 10
  const N = 200

  const { phaseCurve, groupCurve, vMax, minPt, crossLam } = useMemo(() => {
    const phase: [number, number][] = []
    const group: [number, number][] = []
    let vmax = 0
    let minSpeed = Infinity
    let minLam = 0
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const lam = lamMin * Math.pow(lamMax / lamMin, t)
      const c = phaseSpeed(lam, sigma, h)
      const cg = groupSpeed(lam, sigma, h)
      phase.push([lam, c])
      group.push([lam, cg])
      vmax = Math.max(vmax, c, cg)
      if (c < minSpeed) {
        minSpeed = c
        minLam = lam
      }
    }
    // gravity/capillary crossover wavelength (deep water): lambda* = 2*pi*sqrt(sigma/(rho*g))
    const crossLam = 2 * Math.PI * Math.sqrt(sigma / (RHO * G))
    return {
      phaseCurve: phase,
      groupCurve: group,
      vMax: vmax * 1.08,
      minPt: [minLam, minSpeed] as [number, number],
      crossLam,
    }
  }, [sigma, h])

  const xOf = (lam: number) => {
    const t = Math.log(lam / lamMin) / Math.log(lamMax / lamMin)
    return padL + t * (W - padL - padR)
  }
  const yOf = (v: number) => H - padB - (v / vMax) * (H - padT - padB)

  const toPath = (pts: [number, number][]) =>
    pts.map(([lam, v], i) => `${i === 0 ? 'M' : 'L'}${xOf(lam).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')

  const xTicks = [0.001, 0.01, 0.1, 1, 10]
  const xLabel = (lam: number) => (lam < 0.01 ? `${lam * 1000}mm` : lam < 1 ? `${lam * 100}cm` : `${lam}m`)
  const yTicks = 4

  return (
    <div
      style={{
        border: '1px solid #2b3550',
        borderRadius: 12,
        padding: 16,
        background: 'linear-gradient(160deg,#0d1424,#131c30)',
        color: '#dce4f5',
        maxWidth: 660,
        margin: '1.5rem auto',
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Phase and group speed vs wavelength">
        {/* axes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#44506e" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#44506e" />

        {/* x grid + labels */}
        {xTicks.map((lam) => (
          <g key={lam}>
            <line x1={xOf(lam)} y1={padT} x2={xOf(lam)} y2={H - padB} stroke="#212b45" />
            <text x={xOf(lam)} y={H - padB + 16} fill="#8a93a0" fontSize="11" textAnchor="middle">
              {xLabel(lam)}
            </text>
          </g>
        ))}
        {/* y grid + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = (vMax / yTicks) * i
          return (
            <g key={i}>
              <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="#212b45" />
              <text x={padL - 8} y={yOf(v) + 4} fill="#8a93a0" fontSize="11" textAnchor="end">
                {v.toFixed(1)}
              </text>
            </g>
          )
        })}
        <text x={16} y={padT + 6} fill="#8a93a0" fontSize="11">
          m/s
        </text>
        <text x={(W + padL) / 2} y={H - 6} fill="#8a93a0" fontSize="11" textAnchor="middle">
          wavelength λ (log)
        </text>

        {/* crossover marker */}
        {crossLam > lamMin && crossLam < lamMax && (
          <g>
            <line x1={xOf(crossLam)} y1={padT} x2={xOf(crossLam)} y2={H - padB} stroke="#e0b13a" strokeDasharray="4 4" opacity={0.7} />
            <text x={xOf(crossLam) + 5} y={padT + 14} fill="#e0b13a" fontSize="10.5">
              gravity ↔ capillary
            </text>
          </g>
        )}

        {/* curves */}
        <path d={toPath(phaseCurve)} fill="none" stroke="#5ec8ff" strokeWidth={2.4} />
        <path d={toPath(groupCurve)} fill="none" stroke="#ff8fb0" strokeWidth={2.4} />

        {/* minimum phase speed marker */}
        <circle cx={xOf(minPt[0])} cy={yOf(minPt[1])} r={4.5} fill="#5ec8ff" stroke="#0d1424" strokeWidth={1.5} />
        <text x={xOf(minPt[0]) + 8} y={yOf(minPt[1]) - 6} fill="#5ec8ff" fontSize="10.5">
          c_min ≈ {minPt[1].toFixed(2)} m/s
        </text>

        {/* legend */}
        <g>
          <line x1={W - 165} y1={padT + 6} x2={W - 145} y2={padT + 6} stroke="#5ec8ff" strokeWidth={2.4} />
          <text x={W - 140} y={padT + 10} fill="#5ec8ff" fontSize="11.5">
            phase speed c
          </text>
          <line x1={W - 165} y1={padT + 24} x2={W - 145} y2={padT + 24} stroke="#ff8fb0" strokeWidth={2.4} />
          <text x={W - 140} y={padT + 28} fill="#ff8fb0" fontSize="11.5">
            group speed c_g
          </text>
        </g>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12, fontSize: 13 }}>
        <label style={{ flex: '1 1 240px' }}>
          surface tension σ = {(sigma * 1000).toFixed(0)} mN/m
          <input
            type="range"
            min={0}
            max={0.15}
            step={0.002}
            value={sigma}
            onChange={(e) => setSigma(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ flex: '1 1 240px' }}>
          depth h = {h < 1 ? `${(h * 100).toFixed(0)} cm` : `${h.toFixed(2)} m`}
          <input
            type="range"
            min={0.01}
            max={2}
            step={0.01}
            value={h}
            onChange={(e) => setH(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8a93a0', margin: '8px 2px 0' }}>
        Lower σ toward 0 and the capillary upturn on the left flattens — only gravity is left. Shrink h and the long-wave
        end levels off at the shallow-water speed √(gh), where waves stop dispersing.
      </p>
    </div>
  )
}
