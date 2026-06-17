'use client'

import { useMemo, useRef, useState } from 'react'

// The area-Mach relation A/A* is a U-shaped curve: every area ratio above 1
// maps to TWO Mach numbers, one subsonic and one supersonic. Slide the area
// ratio and read off both roots plus their isentropic pressure ratios.

function arFromM(M: number, g: number): number {
  const t = 1 + ((g - 1) / 2) * M * M
  return (1 / M) * Math.pow((2 / (g + 1)) * t, (g + 1) / (2 * (g - 1)))
}

function pressRatio(M: number, g: number): number {
  return Math.pow(1 + ((g - 1) / 2) * M * M, -g / (g - 1))
}

function rootSub(AR: number, g: number): number {
  let lo = 1e-4
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (arFromM(mid, g) > AR) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

function rootSup(AR: number, g: number): number {
  let lo = 1
  let hi = 8
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (arFromM(mid, g) < AR) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

export function AreaMachDualSolution() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [arX10, setArX10] = useState(30) // area ratio * 10
  const g = 1.4
  const AR = arX10 / 10

  const { mSub, mSup, pSub, pSup } = useMemo(() => {
    const ms = rootSub(AR, g)
    const mp = rootSup(AR, g)
    return { mSub: ms, mSup: mp, pSub: pressRatio(ms, g), pSup: pressRatio(mp, g) }
  }, [AR])

  const W = 520
  const H = 320
  const padL = 48
  const padB = 40
  const padT = 16
  const padR = 16
  const mMax = 4
  const arMax = 8

  const xOf = (m: number) => padL + (m / mMax) * (W - padL - padR)
  const yOf = (ar: number) => H - padB - (Math.min(ar, arMax) / arMax) * (H - padT - padB)

  // build the A/A* curve
  const pts: string[] = []
  for (let i = 1; i <= 200; i++) {
    const m = (i / 200) * mMax
    const ar = arFromM(m, g)
    if (ar <= arMax) pts.push(`${xOf(m).toFixed(1)},${yOf(ar).toFixed(1)}`)
  }

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0b1626', borderRadius: 12 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, display: 'block', margin: '0 auto' }}
      >
        <rect x={0} y={0} width={W} height={H} fill="#08111f" rx={8} />
        {/* axes */}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#475569" strokeWidth={1} />
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#475569" strokeWidth={1} />
        {/* M=1 vertical */}
        <line
          x1={xOf(1)}
          y1={padT}
          x2={xOf(1)}
          y2={H - padB}
          stroke="rgba(148,163,184,0.4)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <text x={xOf(1) + 3} y={padT + 12} fill="#94a3b8" fontSize={11} fontFamily="monospace">
          M=1
        </text>
        {/* selected area ratio horizontal */}
        <line
          x1={padL}
          y1={yOf(AR)}
          x2={W - padR}
          y2={yOf(AR)}
          stroke="rgba(251,191,36,0.5)"
          strokeWidth={1}
          strokeDasharray="5 4"
        />
        {/* the curve */}
        <polyline points={pts.join(' ')} fill="none" stroke="#22d3ee" strokeWidth={2} />
        {/* subsonic root */}
        <circle cx={xOf(mSub)} cy={yOf(AR)} r={5} fill="#38bdf8" />
        <text x={xOf(mSub) - 4} y={yOf(AR) + 20} fill="#38bdf8" fontSize={11} fontFamily="monospace">
          M={mSub.toFixed(2)}
        </text>
        {/* supersonic root */}
        <circle cx={xOf(mSup)} cy={yOf(AR)} r={5} fill="#f87171" />
        <text x={xOf(mSup) - 4} y={yOf(AR) - 10} fill="#f87171" fontSize={11} fontFamily="monospace">
          M={mSup.toFixed(2)}
        </text>
        {/* axis labels */}
        <text x={(W + padL) / 2 - 20} y={H - 8} fill="#cbd5e1" fontSize={12} fontFamily="monospace">
          Mach number
        </text>
        <text
          x={14}
          y={(H - padB + padT) / 2}
          fill="#cbd5e1"
          fontSize={12}
          fontFamily="monospace"
          transform={`rotate(-90 14 ${(H - padB + padT) / 2})`}
        >
          A / A*
        </text>
      </svg>
      <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 13 }}>
        <label>
          area ratio A/A*: {AR.toFixed(1)}
          <input
            type="range"
            min={11}
            max={80}
            value={arX10}
            onChange={(e) => setArX10(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <div style={{ marginTop: 8 }}>
          subsonic: M={mSub.toFixed(3)}, p/p0={pSub.toFixed(3)} &nbsp;|&nbsp; supersonic: M=
          {mSup.toFixed(3)}, p/p0={pSup.toFixed(3)}
        </div>
      </div>
    </div>
  )
}
