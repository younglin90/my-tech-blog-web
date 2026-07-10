'use client'

import { useState } from 'react'

// Characteristic speeds of 1D Euler in units of the sound speed c = 1:
//   u - c ,  u ,  u + c        with  u = M
// The acoustic band spans [u-c, u+c] and always has width 2c, independent of M.
// The convective speed u shrinks with M, so the ratio (u+c)/u -> infinity as
// M -> 0. A direct (unsplit) Godunov step is throttled by u+c; the physics of
// interest often lives on the u wave. Acoustic-convective splitting integrates
// the two families separately, so the slow convective step is no longer held
// hostage by the fast acoustic one.

const W = 560
const H = 300
const PAD_L = 46
const PAD_R = 16
const PAD_T = 18
const PAD_B = 40
const M_MAX = 1

export function WaveSpeedSplitChart() {
  const [mach, setMach] = useState(0.2)

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const yMin = -1.2
  const yMax = 2.2

  const sx = (m: number) => PAD_L + (m / M_MAX) * plotW
  const sy = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH

  const line = (f: (m: number) => number) => {
    const pts: string[] = []
    for (let i = 0; i <= 60; i++) {
      const m = (i / 60) * M_MAX
      pts.push(`${sx(m).toFixed(1)},${sy(f(m)).toFixed(1)}`)
    }
    return pts.join(' ')
  }

  const u = mach
  const ratio = mach > 0 ? (mach + 1) / mach : Infinity

  return (
    <div
      style={{
        border: '1px solid #24425a',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: '#0d1a2b',
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* acoustic band fill between u-c and u+c */}
        <polygon
          points={`${line((m) => m + 1)} ${line((m) => m - 1).split(' ').reverse().join(' ')}`}
          fill="rgba(251,191,36,0.10)"
        />

        {/* zero line */}
        <line x1={PAD_L} y1={sy(0)} x2={W - PAD_R} y2={sy(0)} stroke="rgba(148,163,184,0.28)" strokeDasharray="3 3" />

        {/* axes */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="rgba(148,163,184,0.4)" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="rgba(148,163,184,0.4)" />

        {/* y ticks */}
        {[-1, 0, 1, 2].map((v) => (
          <g key={v}>
            <text x={PAD_L - 8} y={sy(v) + 4} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {/* x ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((m) => (
          <text key={m} x={sx(m)} y={H - PAD_B + 16} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
            {m}
          </text>
        ))}
        <text x={(PAD_L + W - PAD_R) / 2} y={H - 6} fill="#94a3b8" fontSize="12" fontFamily="monospace" textAnchor="middle">
          Mach  M = u / c
        </text>

        {/* three characteristic speed lines */}
        <polyline points={line((m) => m + 1)} fill="none" stroke="#fbbf24" strokeWidth="2" />
        <polyline points={line((m) => m - 1)} fill="none" stroke="#fbbf24" strokeWidth="2" />
        <polyline points={line((m) => m)} fill="none" stroke="#2dd3bf" strokeWidth="2" />

        {/* labels */}
        <text x={W - PAD_R - 2} y={sy(M_MAX + 1) - 4} fill="#fbbf24" fontSize="11" fontFamily="monospace" textAnchor="end">u+c</text>
        <text x={W - PAD_R - 2} y={sy(M_MAX) - 4} fill="#2dd3bf" fontSize="11" fontFamily="monospace" textAnchor="end">u</text>
        <text x={W - PAD_R - 2} y={sy(M_MAX - 1) - 4} fill="#fbbf24" fontSize="11" fontFamily="monospace" textAnchor="end">u−c</text>

        {/* marker at chosen Mach */}
        <line x1={sx(mach)} y1={PAD_T} x2={sx(mach)} y2={H - PAD_B} stroke="rgba(226,232,240,0.35)" strokeWidth="1" />
        {[u + 1, u, u - 1].map((v, i) => (
          <circle key={i} cx={sx(mach)} cy={sy(v)} r={3.4} fill={i === 1 ? '#2dd3bf' : '#fbbf24'} />
        ))}
      </svg>

      <div style={{ marginTop: 12, fontSize: 14, color: '#e2e8f0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 150, fontFamily: 'monospace' }}>M = {mach.toFixed(3)}</span>
          <input
            type="range"
            min={0.02}
            max={1}
            step={0.005}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 160, accentColor: '#fbbf24' }}
          />
        </label>
        <div style={{ marginTop: 10, fontFamily: 'monospace', color: '#fbbf24', fontWeight: 600 }}>
          (u+c)/u = {ratio === Infinity ? '∞' : `${ratio.toFixed(1)}×`}  ← 직접법 시간전진이 견디는 속도비
        </div>
        <div style={{ marginTop: 4, opacity: 0.6, fontSize: 12 }}>
          음향 밴드(amber) 폭은 M과 무관하게 항상 2c. 대류 속도 u(teal)만 0으로 줄어든다. 이 격차가 저마하 강성의 정체.
        </div>
      </div>
    </div>
  )
}
