'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// Newton's method on a small nonlinear system: z^3 = 1 written as two real equations.
//   F1 = u^3 - 3 u v^2 - 1
//   F2 = 3 u^2 v - v^3
// Root at (u, v) = (1, 0). The exact Jacobian (as AD would produce it) gives
// quadratic convergence; a perturbed / approximate Jacobian degrades to linear.
function residual(u: number, v: number) {
  const f1 = u * u * u - 3 * u * v * v - 1
  const f2 = 3 * u * u * v - v * v * v
  return [f1, f2] as const
}

function exactJacobian(u: number, v: number) {
  // dF1/du, dF1/dv ; dF2/du, dF2/dv
  return [
    [3 * u * u - 3 * v * v, -6 * u * v],
    [6 * u * v, 3 * u * u - 3 * v * v],
  ]
}

function solve2x2(J: number[][], b: number[]) {
  const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]
  if (Math.abs(det) < 1e-30) return [0, 0]
  return [
    (b[0] * J[1][1] - b[1] * J[0][1]) / det,
    (J[0][0] * b[1] - J[1][0] * b[0]) / det,
  ]
}

// Build the full Newton trajectory for a given Jacobian perturbation.
function runNewton(pert: number) {
  let u = 0.6
  let v = 0.7
  const hist: number[] = []
  for (let it = 0; it < 20; it++) {
    const [f1, f2] = residual(u, v)
    const res = Math.hypot(f1, f2)
    hist.push(Math.max(res, 1e-16))
    if (res < 1e-14) break
    const J = exactJacobian(u, v)
    // corrupt the Jacobian deterministically: parity-signed relative error
    const Jp = J.map((row, i) => row.map((e, j) => e * (1 + pert * (((i + j) % 2) === 0 ? 1 : -1))))
    const [du, dv] = solve2x2(Jp, [-f1, -f2])
    u += du
    v += dv
    if (!isFinite(u) || !isFinite(v) || Math.abs(u) > 1e6) {
      hist.push(1e6)
      break
    }
  }
  return hist
}

export function NewtonJacobianConvergenceLab() {
  const [pert, setPert] = useState(0)
  const [shown, setShown] = useState(1)
  const raf = useRef<number | null>(null)
  const frame = useRef(0)

  const hist = useMemo(() => runNewton(pert), [pert])

  // animate the reveal of iterations
  useEffect(() => {
    setShown(1)
    frame.current = 0
    const tick = () => {
      frame.current += 1
      if (frame.current % 12 === 0) {
        setShown((s) => Math.min(s + 1, hist.length))
      }
      if (raf.current !== null) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current)
        raf.current = null
      }
    }
  }, [hist])

  const W = 560
  const H = 300
  const padL = 50
  const padR = 20
  const padT = 20
  const padB = 40
  const iterMax = 18
  const logMin = -16
  const logMax = 1

  const sx = (i: number) => padL + (i / iterMax) * (W - padL - padR)
  const sy = (logR: number) =>
    padT + ((logMax - logR) / (logMax - logMin)) * (H - padT - padB)

  const visible = hist.slice(0, shown)
  const path = visible
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(Math.log10(r)).toFixed(1)}`)
    .join(' ')

  const converged = hist[hist.length - 1] < 1e-13
  const iters = converged ? hist.length - 1 : hist.length

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text, #cbd5e1)' }}>
          Jacobian 오차 = {(pert * 100).toFixed(0)}%
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={pert}
            onChange={(e) => setPert(parseFloat(e.target.value))}
            style={{ width: 170 }}
          />
        </label>
        <span
          style={{
            fontSize: 12.5,
            fontFamily: 'monospace',
            color: pert === 0 ? 'var(--accent, #22d3ee)' : '#f59e0b',
            fontWeight: 600,
          }}
        >
          {pert === 0 ? 'AD 정확 Jacobian → 2차 수렴' : '근사 Jacobian → 1차 수렴'}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 420, display: 'block' }}>
          {[0, 4, 8, 12, 16].map((i) => (
            <g key={i}>
              <line x1={sx(i)} y1={padT} x2={sx(i)} y2={H - padB} stroke="var(--border, #24384f)" strokeWidth={0.5} opacity={0.5} />
              <text x={sx(i)} y={H - padB + 16} textAnchor="middle" fontSize={10} fill="var(--text-muted, #7a90a8)">
                {i}
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

          <path d={path} fill="none" stroke={pert === 0 ? '#22d3ee' : '#f59e0b'} strokeWidth={2.5} />
          {visible.map((r, i) => (
            <circle key={i} cx={sx(i)} cy={sy(Math.log10(r))} r={3} fill={pert === 0 ? '#22d3ee' : '#f59e0b'} />
          ))}

          <text x={padL} y={13} fontSize={10} fill="var(--text-muted, #7a90a8)">
            잔차 ‖F‖ (세로, 로그) vs Newton 반복 (가로)
          </text>
        </svg>
      </div>

      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'monospace', color: 'var(--text, #cbd5e1)' }}>
        {converged
          ? `수렴: ${iters}회 반복으로 ‖F‖ < 1e-13 도달`
          : `20회 안에 목표 정밀도 미달 (근사 Jacobian이 수렴을 늦춤)`}
      </div>
    </div>
  )
}
