'use client'

import { useEffect, useRef, useState } from 'react'

// 2D passive-scalar advection in a solid-body rotation (divergence-free)
// velocity field. Compares first-order upwind donor-cell against the
// Bell-Colella-Glaz unsplit second-order predictor with corner coupling.

type Scheme = 'upwind1' | 'bcg'

const N = 48
const DX = 1 / N
const OMEGA = 2 * Math.PI // one revolution per unit time
const UMAX = OMEGA * 0.5 * Math.SQRT2

const idx = (i: number, j: number) => ((j + N) % N) * N + ((i + N) % N)

// Face velocities of a rigid rotation about the domain center (0.5, 0.5).
function uface(i: number, j: number): number {
  // x-face between cell (i-1,j) and (i,j): located at x=i*dx, y=(j+0.5)*dx
  const y = (j + 0.5) * DX
  return -OMEGA * (y - 0.5)
}
function vface(i: number, j: number): number {
  // y-face between (i,j-1) and (i,j): x=(i+0.5)*dx, y=j*dx
  const x = (i + 0.5) * DX
  return OMEGA * (x - 0.5)
}

function minmod(a: number, b: number): number {
  if (a * b <= 0) return 0
  return Math.abs(a) < Math.abs(b) ? a : b
}

function initBlob(): Float32Array {
  const s = new Float32Array(N * N)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) * DX
      const y = (j + 0.5) * DX
      const r = Math.hypot(x - 0.5, y - 0.78)
      s[idx(i, j)] = r < 0.13 ? 1.0 : 0.0
    }
  }
  return s
}

// First-order donor-cell upwind step.
function stepUpwind(s: Float32Array, dt: number): Float32Array {
  const out = new Float32Array(N * N)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const uR = uface(i + 1, j)
      const uL = uface(i, j)
      const vT = vface(i, j + 1)
      const vB = vface(i, j)
      const fR = uR > 0 ? uR * s[idx(i, j)] : uR * s[idx(i + 1, j)]
      const fL = uL > 0 ? uL * s[idx(i - 1, j)] : uL * s[idx(i, j)]
      const fT = vT > 0 ? vT * s[idx(i, j)] : vT * s[idx(i, j + 1)]
      const fB = vB > 0 ? vB * s[idx(i, j - 1)] : vB * s[idx(i, j)]
      out[idx(i, j)] = s[idx(i, j)] - (dt / DX) * (fR - fL) - (dt / DX) * (fT - fB)
    }
  }
  return out
}

// Bell-Colella-Glaz unsplit predictor with transverse (corner) coupling.
function stepBcg(s: Float32Array, dt: number): Float32Array {
  const slx = new Float32Array(N * N)
  const sly = new Float32Array(N * N)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      slx[idx(i, j)] = minmod(s[idx(i, j)] - s[idx(i - 1, j)], s[idx(i + 1, j)] - s[idx(i, j)])
      sly[idx(i, j)] = minmod(s[idx(i, j)] - s[idx(i, j - 1)], s[idx(i, j + 1)] - s[idx(i, j)])
    }
  }

  // 1D-upwind predicted normal edge states (no transverse term yet).
  const hatX = new Float32Array(N * N) // at x-face i (between i-1 and i)
  const hatY = new Float32Array(N * N) // at y-face j (between j-1 and j)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const uf = uface(i, j)
      const sLx = s[idx(i - 1, j)] + 0.5 * (1 - (dt / DX) * uf) * slx[idx(i - 1, j)]
      const sRx = s[idx(i, j)] - 0.5 * (1 + (dt / DX) * uf) * slx[idx(i, j)]
      hatX[idx(i, j)] = uf > 0 ? sLx : uf < 0 ? sRx : 0.5 * (sLx + sRx)

      const vf = vface(i, j)
      const sBy = s[idx(i, j - 1)] + 0.5 * (1 - (dt / DX) * vf) * sly[idx(i, j - 1)]
      const sTy = s[idx(i, j)] - 0.5 * (1 + (dt / DX) * vf) * sly[idx(i, j)]
      hatY[idx(i, j)] = vf > 0 ? sBy : vf < 0 ? sTy : 0.5 * (sBy + sTy)
    }
  }

  // Transverse-corrected fluxes.
  const Fx = new Float32Array(N * N)
  const Fy = new Float32Array(N * N)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      // x-face i: left cell (i-1), right cell (i)
      const uf = uface(i, j)
      const transL = (vface(i - 1, j + 1) * hatY[idx(i - 1, j + 1)] - vface(i - 1, j) * hatY[idx(i - 1, j)]) / DX
      const transR = (vface(i, j + 1) * hatY[idx(i, j + 1)] - vface(i, j) * hatY[idx(i, j)]) / DX
      const sLx = s[idx(i - 1, j)] + 0.5 * (1 - (dt / DX) * uf) * slx[idx(i - 1, j)] - 0.5 * dt * transL
      const sRx = s[idx(i, j)] - 0.5 * (1 + (dt / DX) * uf) * slx[idx(i, j)] - 0.5 * dt * transR
      const sX = uf > 0 ? sLx : uf < 0 ? sRx : 0.5 * (sLx + sRx)
      Fx[idx(i, j)] = uf * sX

      // y-face j: bottom cell (i,j-1), top cell (i,j)
      const vf = vface(i, j)
      const transB = (uface(i + 1, j - 1) * hatX[idx(i + 1, j - 1)] - uface(i, j - 1) * hatX[idx(i, j - 1)]) / DX
      const transT = (uface(i + 1, j) * hatX[idx(i + 1, j)] - uface(i, j) * hatX[idx(i, j)]) / DX
      const sBy = s[idx(i, j - 1)] + 0.5 * (1 - (dt / DX) * vf) * sly[idx(i, j - 1)] - 0.5 * dt * transB
      const sTy = s[idx(i, j)] - 0.5 * (1 + (dt / DX) * vf) * sly[idx(i, j)] - 0.5 * dt * transT
      const sY = vf > 0 ? sBy : vf < 0 ? sTy : 0.5 * (sBy + sTy)
      Fy[idx(i, j)] = vf * sY
    }
  }

  const out = new Float32Array(N * N)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      out[idx(i, j)] = s[idx(i, j)] - (dt / DX) * (Fx[idx(i + 1, j)] - Fx[idx(i, j)]) - (dt / DX) * (Fy[idx(i, j + 1)] - Fy[idx(i, j)])
    }
  }
  return out
}

// viridis-ish ramp
function color(v: number): string {
  const t = Math.max(0, Math.min(1, v))
  const r = Math.round(68 + t * (253 - 68))
  const g = Math.round(1 + t * (231 - 1))
  const b = Math.round(84 + t * (37 - 84))
  return `rgb(${r},${g},${b})`
}

export function SolidBodyScalarAdvection2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [scheme, setScheme] = useState<Scheme>('bcg')
  const [cfl, setCfl] = useState(0.6)
  const [running, setRunning] = useState(true)
  const fieldRef = useRef<Float32Array>(initBlob())
  const timeRef = useRef(0)
  const schemeRef = useRef<Scheme>(scheme)
  const cflRef = useRef(cfl)
  const runRef = useRef(running)

  useEffect(() => { schemeRef.current = scheme }, [scheme])
  useEffect(() => { cflRef.current = cfl }, [cfl])
  useEffect(() => { runRef.current = running }, [running])

  const reset = () => {
    fieldRef.current = initBlob()
    timeRef.current = 0
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      const s = fieldRef.current
      const px = canvas.width / N
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          ctx.fillStyle = color(s[idx(i, j)])
          ctx.fillRect(i * px, (N - 1 - j) * px, px + 1, px + 1)
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '12px sans-serif'
      ctx.fillText(`t = ${timeRef.current.toFixed(2)} rev`, 8, 16)
    }

    const tick = () => {
      if (runRef.current) {
        const dt = (cflRef.current * DX) / UMAX
        const sub = 2
        for (let k = 0; k < sub; k++) {
          fieldRef.current = schemeRef.current === 'bcg' ? stepBcg(fieldRef.current, dt) : stepUpwind(fieldRef.current, dt)
          timeRef.current += dt
        }
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={384} height={384} style={{ width: '100%', maxWidth: 384, height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 12, fontSize: 13, justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['upwind1', 'bcg'] as Scheme[]).map((k) => (
            <button
              key={k}
              onClick={() => { setScheme(k); reset() }}
              style={{
                padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
                background: scheme === k ? 'var(--accent)' : 'transparent',
                color: scheme === k ? '#06121f' : 'var(--text)', fontWeight: scheme === k ? 600 : 400,
              }}
            >
              {k === 'upwind1' ? '1st-order upwind' : 'BCG unsplit'}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 70 }}>CFL = {cfl.toFixed(2)}</span>
          <input type="range" min={0.1} max={0.9} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
        </label>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text)' }}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={reset} style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text)' }}>
          Reset
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 2px 0' }}>
        A scalar disk rotates rigidly about the center. Switch to <code>1st-order upwind</code> and watch the disk melt into a ring within one revolution; <code>BCG unsplit</code> keeps its edge far longer.
      </p>
    </div>
  )
}
