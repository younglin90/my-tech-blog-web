'use client'

import { useMemo, useState } from 'react'

// Forward-mode automatic differentiation with dual numbers.
// A value carries its derivative alongside it: x -> (v, d).
// Overloaded arithmetic propagates the chain rule automatically.
type D = { v: number; d: number }

const mul = (a: D, b: D): D => ({ v: a.v * b.v, d: a.v * b.d + a.d * b.v })
const add = (a: D, b: D): D => ({ v: a.v + b.v, d: a.d + b.d })
const sinD = (a: D): D => ({ v: Math.sin(a.v), d: Math.cos(a.v) * a.d })
const expD = (a: D): D => ({ v: Math.exp(a.v), d: Math.exp(a.v) * a.d })

type FnDef = {
  key: string
  label: string
  plain: (x: number) => number
  dual: (x: number) => D
  analytic: (x: number) => number
}

const FUNCS: FnDef[] = [
  {
    key: 'a',
    label: 'sin(x²) + x²',
    plain: (x) => Math.sin(x * x) + x * x,
    dual: (x) => {
      const X: D = { v: x, d: 1 } // seed dx/dx = 1
      const sq = mul(X, X)
      return add(sinD(sq), sq)
    },
    analytic: (x) => Math.cos(x * x) * 2 * x + 2 * x,
  },
  {
    key: 'b',
    label: 'exp(sin x)',
    plain: (x) => Math.exp(Math.sin(x)),
    dual: (x) => {
      const X: D = { v: x, d: 1 }
      return expD(sinD(X))
    },
    analytic: (x) => Math.cos(x) * Math.exp(Math.sin(x)),
  },
]

// central finite difference
const fd = (f: (x: number) => number, x: number, h: number) =>
  (f(x + h) - f(x - h)) / (2 * h)

const EPS = 2.22e-16

export function DualNumberDerivativeLab() {
  const [fnKey, setFnKey] = useState('a')
  const [x, setX] = useState(1.3)

  const fn = FUNCS.find((f) => f.key === fnKey)!

  const data = useMemo(() => {
    const exact = fn.analytic(x)
    const adDeriv = fn.dual(x).d
    const adErr = Math.max(Math.abs(adDeriv - exact), EPS * Math.abs(exact) || EPS)

    // sweep step size h = 10^k
    const pts: { k: number; err: number }[] = []
    let bestK = -8
    let bestErr = Infinity
    for (let k = -1; k >= -15; k -= 0.2) {
      const h = Math.pow(10, k)
      const err = Math.max(Math.abs(fd(fn.plain, x, h) - exact), 1e-18)
      pts.push({ k, err })
      if (err < bestErr) {
        bestErr = err
        bestK = k
      }
    }
    return { exact, adDeriv, adErr, pts, bestK, bestErr }
  }, [fn, x])

  // SVG chart geometry
  const W = 560
  const H = 300
  const padL = 52
  const padR = 16
  const padT = 18
  const padB = 40
  const kMin = -15
  const kMax = -1
  const eMin = -18 // log10 error floor
  const eMax = 2

  const sx = (k: number) =>
    padL + ((k - kMin) / (kMax - kMin)) * (W - padL - padR)
  const sy = (logErr: number) =>
    padT + ((eMax - logErr) / (eMax - eMin)) * (H - padT - padB)

  const path = data.pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.k).toFixed(1)} ${sy(Math.log10(p.err)).toFixed(1)}`)
    .join(' ')

  const adLogErr = Math.log10(data.adErr)

  return (
    <div
      style={{
        border: '1px solid var(--border, #24384f)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface, #0d1a2b)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FUNCS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFnKey(f.key)}
              style={{
                padding: '5px 11px',
                borderRadius: 8,
                border: '1px solid var(--border, #24384f)',
                background: fnKey === f.key ? 'var(--accent, #22d3ee)' : 'transparent',
                color: fnKey === f.key ? '#08111f' : 'var(--text, #cbd5e1)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text, #cbd5e1)' }}>
          x = {x.toFixed(2)}
          <input
            type="range"
            min={0.2}
            max={2.6}
            step={0.02}
            value={x}
            onChange={(e) => setX(parseFloat(e.target.value))}
            style={{ width: 150 }}
          />
        </label>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 420, display: 'block' }}>
          {/* grid + axes */}
          {[-14, -12, -10, -8, -6, -4, -2].map((k) => (
            <g key={k}>
              <line x1={sx(k)} y1={padT} x2={sx(k)} y2={H - padB} stroke="var(--border, #24384f)" strokeWidth={0.5} opacity={0.5} />
              <text x={sx(k)} y={H - padB + 16} textAnchor="middle" fontSize={10} fill="var(--text-muted, #7a90a8)">
                1e{k}
              </text>
            </g>
          ))}
          {[0, -4, -8, -12, -16].map((e) => (
            <g key={e}>
              <line x1={padL} y1={sy(e)} x2={W - padR} y2={sy(e)} stroke="var(--border, #24384f)" strokeWidth={0.5} opacity={0.5} />
              <text x={padL - 6} y={sy(e) + 3} textAnchor="end" fontSize={10} fill="var(--text-muted, #7a90a8)">
                1e{e}
              </text>
            </g>
          ))}

          {/* AD reference line (flat, machine precision) */}
          <line x1={padL} y1={sy(adLogErr)} x2={W - padR} y2={sy(adLogErr)} stroke="#22d3ee" strokeWidth={2} strokeDasharray="6 4" />
          <text x={W - padR} y={sy(adLogErr) - 6} textAnchor="end" fontSize={11} fill="#22d3ee" fontWeight={600}>
            AD (dual number) — exact
          </text>

          {/* FD error curve */}
          <path d={path} fill="none" stroke="#f59e0b" strokeWidth={2} />
          <text x={sx(-3)} y={sy(Math.log10(data.pts[10]?.err ?? 1)) - 8} fontSize={11} fill="#f59e0b" fontWeight={600}>
            finite difference
          </text>

          {/* best FD marker */}
          <circle cx={sx(data.bestK)} cy={sy(Math.log10(data.bestErr))} r={4} fill="#f59e0b" stroke="#08111f" strokeWidth={1.5} />

          <text x={padL} y={12} fontSize={10} fill="var(--text-muted, #7a90a8)">
            |오차| (세로) vs 스텝 h (가로) — 로그-로그
          </text>
        </svg>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginTop: 12,
          fontFamily: 'monospace',
          fontSize: 12.5,
        }}
      >
        <Stat label="analytic f'(x)" value={data.exact.toPrecision(10)} />
        <Stat label="AD f'(x)" value={data.adDeriv.toPrecision(10)} accent />
        <Stat label="AD error" value={data.adErr.toExponential(1)} accent />
        <Stat label="best FD error" value={data.bestErr.toExponential(1)} />
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        border: '1px solid var(--border, #24384f)',
        borderRadius: 8,
        padding: '7px 10px',
        background: 'var(--bg, #08111f)',
      }}
    >
      <div style={{ fontSize: 10.5, color: 'var(--text-muted, #7a90a8)', marginBottom: 3 }}>{label}</div>
      <div style={{ color: accent ? 'var(--accent, #22d3ee)' : 'var(--text, #cbd5e1)', fontWeight: 600 }}>{value}</div>
    </div>
  )
}
