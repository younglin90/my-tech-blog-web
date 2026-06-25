'use client'

import { useEffect, useRef, useState } from 'react'

// ---- D2Q9 lattice ----
const N = 40 // grid size (NxN, periodic)
const Q = 9
const cx = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const cy = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const w = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]

// Lallemand-Luo transformation matrix M (rows = moments, cols = velocities)
const M = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1], // rho
  [-4, -1, -1, -1, -1, 2, 2, 2, 2], // e
  [4, -2, -2, -2, -2, 1, 1, 1, 1], // eps
  [0, 1, 0, -1, 0, 1, -1, -1, 1], // jx
  [0, -2, 0, 2, 0, 1, -1, -1, 1], // qx
  [0, 0, 1, 0, -1, 1, 1, -1, -1], // jy
  [0, 0, -2, 0, 2, 1, 1, -1, -1], // qy
  [0, 1, -1, 1, -1, 0, 0, 0, 0], // pxx
  [0, 0, 0, 0, 0, 1, -1, 1, -1], // pxy
]
// squared row norms (M is orthogonal) -> Minv[i][a] = M[a][i] / norm2[a]
const norm2 = [9, 36, 36, 6, 12, 6, 12, 4, 4]

function idx(x: number, y: number) {
  return (y * N + x) * Q
}

function feq(i: number, rho: number, ux: number, uy: number) {
  const cu = cx[i] * ux + cy[i] * uy
  const u2 = ux * ux + uy * uy
  return w[i] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * u2)
}

export function MRTLatticeVortexCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [useMRT, setUseMRT] = useState(true)
  const [nu, setNu] = useState(0.006) // viscosity slider
  const [reset, setReset] = useState(0)
  const [info, setInfo] = useState({ step: 0, energy: 1, diverged: false })

  // mutable sim state held in refs so the RAF loop stays stable
  const fRef = useRef<Float64Array>(new Float64Array(N * N * Q))
  const ftmpRef = useRef<Float64Array>(new Float64Array(N * N * Q))
  const cfgRef = useRef({ nu, useMRT })
  cfgRef.current = { nu, useMRT }

  const U0 = 0.04
  const k = (2 * Math.PI) / N

  // (re)initialize Taylor-Green vortex
  useEffect(() => {
    const f = fRef.current
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const ux = -U0 * Math.cos(k * x) * Math.sin(k * y)
        const uy = U0 * Math.sin(k * x) * Math.cos(k * y)
        const rho = 1 - (3 * U0 * U0) / 4 * (Math.cos(2 * k * x) + Math.cos(2 * k * y))
        const b = idx(x, y)
        for (let i = 0; i < Q; i++) f[b + i] = feq(i, rho, ux, uy)
      }
    }
    setInfo({ step: 0, energy: 1, diverged: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let step = 0
    let e0 = -1
    let diverged = false

    const cell = 8
    canvas.width = N * cell
    canvas.height = N * cell

    function collideStream() {
      const f = fRef.current
      const ftmp = ftmpRef.current
      const { nu, useMRT } = cfgRef.current
      const sNu = 1 / (3 * nu + 0.5)
      const tau = 3 * nu + 0.5
      // fixed "magic" rates for the non-hydrodynamic moments
      const sE = 1.64
      const sEps = 1.54
      const sQ = 1.7
      const S = [0, sE, sEps, 0, sQ, 0, sQ, sNu, sNu]

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const b = idx(x, y)
          // macroscopic
          let rho = 0
          let jx = 0
          let jy = 0
          for (let i = 0; i < Q; i++) {
            const fi = f[b + i]
            rho += fi
            jx += cx[i] * fi
            jy += cy[i] * fi
          }
          const ux = jx / rho
          const uy = jy / rho

          if (useMRT) {
            // moments m = M f
            const m = new Array(Q).fill(0)
            for (let a = 0; a < Q; a++) {
              let s = 0
              for (let i = 0; i < Q; i++) s += M[a][i] * f[b + i]
              m[a] = s
            }
            // equilibrium moments
            const meq = [
              rho,
              -2 * rho + 3 * (jx * jx + jy * jy),
              rho - 3 * (jx * jx + jy * jy),
              jx,
              -jx,
              jy,
              -jy,
              jx * jx - jy * jy,
              jx * jy,
            ]
            // relax in moment space
            for (let a = 0; a < Q; a++) m[a] -= S[a] * (m[a] - meq[a])
            // back to velocity space: f_i = sum_a M[a][i] m[a] / norm2[a]
            for (let i = 0; i < Q; i++) {
              let s = 0
              for (let a = 0; a < Q; a++) s += (M[a][i] / norm2[a]) * m[a]
              f[b + i] = s
            }
          } else {
            // plain BGK
            for (let i = 0; i < Q; i++) {
              f[b + i] += -(1 / tau) * (f[b + i] - feq(i, rho, ux, uy))
            }
          }
        }
      }

      // streaming (periodic)
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const b = idx(x, y)
          for (let i = 0; i < Q; i++) {
            const xn = (x + cx[i] + N) % N
            const yn = (y + cy[i] + N) % N
            ftmp[idx(xn, yn) + i] = f[b + i]
          }
        }
      }
      fRef.current = ftmp
      ftmpRef.current = f
    }

    function vorticityColor(omega: number) {
      // diverging blue-white-red, omega scaled
      const s = Math.max(-1, Math.min(1, omega / (3 * U0 * k)))
      if (s >= 0) {
        const t = s
        return [255, Math.round(255 * (1 - t)), Math.round(255 * (1 - t))]
      }
      const t = -s
      return [Math.round(255 * (1 - t)), Math.round(255 * (1 - t)), 255]
    }

    function render() {
      const f = fRef.current
      const ux = new Float64Array(N * N)
      const uy = new Float64Array(N * N)
      let energy = 0
      diverged = false
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const b = idx(x, y)
          let rho = 0
          let mx = 0
          let my = 0
          for (let i = 0; i < Q; i++) {
            rho += f[b + i]
            mx += cx[i] * f[b + i]
            my += cy[i] * f[b + i]
          }
          const u = mx / rho
          const v = my / rho
          if (!isFinite(u) || !isFinite(v) || Math.abs(u) > 1) diverged = true
          ux[y * N + x] = u
          uy[y * N + x] = v
          energy += u * u + v * v
        }
      }
      if (e0 < 0) e0 = energy
      // draw vorticity
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const xp = (x + 1) % N
          const xm = (x - 1 + N) % N
          const yp = (y + 1) % N
          const ym = (y - 1 + N) % N
          const omega =
            (uy[y * N + xp] - uy[y * N + xm]) / 2 - (ux[yp * N + x] - ux[ym * N + x]) / 2
          const [r, g, bl] = vorticityColor(diverged ? 0 : omega)
          ctx.fillStyle = `rgb(${r},${g},${bl})`
          ctx.fillRect(x * cell, y * cell, cell, cell)
        }
      }
      return diverged ? 1 : energy / e0
    }

    function frame() {
      if (running && !diverged) {
        for (let s = 0; s < 4; s++) collideStream()
        step += 4
      }
      const ratio = render()
      setInfo({ step, energy: ratio, diverged })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, reset])

  const Re = (U0 * N) / nu
  const energyAnalytic = Math.exp(-4 * nu * k * k * info.step)

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: 320,
            height: 320,
            maxWidth: '100%',
            imageRendering: 'pixelated',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        />
        <div style={{ flex: '1 1 200px', minWidth: 200 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setRunning((r) => !r)} style={btn}>
              {running ? '⏸ pause' : '▶ play'}
            </button>
            <button onClick={() => setReset((r) => r + 1)} style={btn}>
              ↺ reset
            </button>
            <button onClick={() => setUseMRT((m) => !m)} style={{ ...btn, borderColor: 'var(--accent)' }}>
              {useMRT ? 'MRT' : 'BGK'}
            </button>
          </div>

          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <div>
              viscosity ν = {nu.toFixed(4)} &nbsp; (Re ≈ {Re.toFixed(0)})
            </div>
            <input
              type="range"
              min={0.0015}
              max={0.05}
              step={0.0005}
              value={nu}
              onChange={(e) => setNu(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          <div style={{ fontSize: 13, lineHeight: 1.7, marginTop: 12 }}>
            <div>
              mode: <strong style={{ color: 'var(--accent)' }}>{useMRT ? 'MRT' : 'BGK'}</strong>
            </div>
            <div>step: {info.step}</div>
            <div>
              KE / KE₀: <strong>{info.diverged ? '—' : info.energy.toFixed(3)}</strong>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              analytic e⁻⁴ᵛᵏ²ᵗ: {info.diverged ? '—' : energyAnalytic.toFixed(3)}
            </div>
            {info.diverged && (
              <div style={{ color: '#f97316', marginTop: 6 }}>
                ⚠ diverged — drop ν or switch to MRT, then reset
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
        Color = vorticity (red ↺ / blue ↻). Taylor–Green vortex on a {N}×{N} periodic lattice.
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  cursor: 'pointer',
}
