'use client'

import { useEffect, useRef, useState } from 'react'

const N = 160
const L = 1
const dx = L / N

function initState() {
  const p = new Float64Array(N + 2)
  const u = new Float64Array(N + 2)
  for (let i = 0; i < N + 2; i++) {
    const x = (i - 0.5) * dx
    const d = (x - 0.5) / 0.05
    p[i] = 0.4 * Math.exp(-(d * d))
    u[i] = 0
  }
  return { p, u }
}

function applyBC(arr: Float64Array) {
  arr[0] = arr[N]
  arr[N + 1] = arr[1]
}

export function GPEAcousticPulseProbe1D() {
  const [cs, setCs] = useState(5)
  const [nu, setNu] = useState(0.01)
  const [running, setRunning] = useState(true)
  const [tSim, setTSim] = useState(0)
  const [diverged, setDiverged] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ p: Float64Array; u: Float64Array } | null>(null)

  useEffect(() => {
    stateRef.current = initState()
    setTSim(0)
    setDiverged(false)
  }, [cs, nu])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const state = stateRef.current
      if (state && running && !diverged) {
        const { p, u } = state
        const dtAcs = 0.4 * dx / cs
        const subSteps = 4
        for (let sub = 0; sub < subSteps; sub++) {
          applyBC(p)
          applyBC(u)
          const newP = new Float64Array(N + 2)
          const newU = new Float64Array(N + 2)
          for (let i = 1; i <= N; i++) {
            // Rusanov flux for linear acoustics + GPE diffusion on pressure
            const lam = cs
            const fpP = 0.5 * cs * cs * (u[i] + u[i + 1]) - 0.5 * lam * (p[i + 1] - p[i])
            const fmP = 0.5 * cs * cs * (u[i - 1] + u[i]) - 0.5 * lam * (p[i] - p[i - 1])
            const fpU = 0.5 * (p[i] + p[i + 1]) - 0.5 * lam * (u[i + 1] - u[i])
            const fmU = 0.5 * (p[i - 1] + p[i]) - 0.5 * lam * (u[i] - u[i - 1])
            const diff = nu * (p[i + 1] - 2 * p[i] + p[i - 1]) / (dx * dx)
            newP[i] = p[i] - (dtAcs / dx) * (fpP - fmP) + dtAcs * diff
            newU[i] = u[i] - (dtAcs / dx) * (fpU - fmU)
          }
          for (let i = 1; i <= N; i++) {
            p[i] = newP[i]
            u[i] = newU[i]
          }
        }
        let bad = false
        for (let i = 0; i < N + 2; i++) {
          if (!Number.isFinite(p[i]) || Math.abs(p[i]) > 5 || Math.abs(u[i]) > 5) {
            bad = true
            break
          }
        }
        if (bad) setDiverged(true)
        setTSim((t) => t + subSteps * dtAcs)
      }

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const W = canvas.width
          const H = canvas.height
          ctx.fillStyle = '#08111f'
          ctx.fillRect(0, 0, W, H)

          // grid lines
          ctx.strokeStyle = '#1e293b'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, H / 2)
          ctx.lineTo(W, H / 2)
          ctx.stroke()

          if (state) {
            const yScaleP = H * 0.35
            const yScaleU = H * 0.35 * 5
            // pressure (cyan)
            ctx.strokeStyle = '#22d3ee'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let i = 1; i <= N; i++) {
              const x = ((i - 0.5) / N) * W
              const y = H / 2 - state.p[i] * yScaleP
              if (i === 1) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.stroke()

            // velocity (orange)
            ctx.strokeStyle = '#fb923c'
            ctx.beginPath()
            for (let i = 1; i <= N; i++) {
              const x = ((i - 0.5) / N) * W
              const y = H / 2 - state.u[i] * yScaleU
              if (i === 1) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.stroke()
          }

          ctx.fillStyle = '#94a3b8'
          ctx.font = '12px sans-serif'
          ctx.fillText('p (pressure)', 8, 16)
          ctx.fillStyle = '#22d3ee'
          ctx.fillRect(86, 8, 14, 10)
          ctx.fillStyle = '#94a3b8'
          ctx.fillText('u (×5)', 110, 16)
          ctx.fillStyle = '#fb923c'
          ctx.fillRect(150, 8, 14, 10)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, diverged, cs, nu])

  const dtMax = (0.4 * dx / cs)

  return (
    <div style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={640} height={260} style={{ width: '100%', display: 'block', borderRadius: 4 }} />
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <label>artificial sound speed c<sub>s</sub>: {cs.toFixed(1)}</label>
        <input type="range" min={1} max={20} step={0.5} value={cs} onChange={(e) => setCs(+e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ fontSize: 13 }}>
        <label>pressure diffusion ν: {nu.toFixed(3)}</label>
        <input type="range" min={0} max={0.05} step={0.001} value={nu} onChange={(e) => setNu(+e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Acoustic Δt = 0.4·Δx/c<sub>s</sub> ≈ {dtMax.toFixed(5)} | sim t = {tSim.toFixed(3)}
        {diverged && <span style={{ color: '#ef4444' }}> · DIVERGED</span>}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => {
            stateRef.current = initState()
            setTSim(0)
            setDiverged(false)
          }}
          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
