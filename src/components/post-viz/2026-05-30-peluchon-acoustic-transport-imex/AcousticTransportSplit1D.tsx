'use client'

import { useEffect, useRef, useState } from 'react'

type Scheme = 'explicit' | 'split'

const N = 140
const L = 1
const dx = L / N
const c = 1
const rho0 = 1

function initState(machBg: number) {
  const rho = new Float64Array(N + 2)
  const u = new Float64Array(N + 2)
  for (let i = 0; i < N + 2; i++) {
    const x = (i - 0.5) * dx
    const d = (x - 0.25) / 0.06
    rho[i] = rho0 + 0.25 * Math.exp(-(d * d))
    u[i] = machBg * c
  }
  return { rho, u }
}

function applyBC(rho: Float64Array, u: Float64Array) {
  rho[0] = rho[N]
  rho[N + 1] = rho[1]
  u[0] = u[N]
  u[N + 1] = u[1]
}

export function AcousticTransportSplit1D() {
  const [cflTotal, setCflTotal] = useState(1.4)
  const [machBg, setMachBg] = useState(0.1)
  const [scheme, setScheme] = useState<Scheme>('split')
  const [diverged, setDiverged] = useState(false)
  const [tSim, setTSim] = useState(0)
  const [running, setRunning] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ rho: Float64Array; u: Float64Array } | null>(null)

  useEffect(() => {
    stateRef.current = initState(machBg)
    setDiverged(false)
    setTSim(0)
  }, [cflTotal, machBg, scheme])

  useEffect(() => {
    let raf = 0

    const tick = () => {
      const state = stateRef.current
      if (state && running && !diverged) {
        const { rho, u } = state
        const uBg = machBg * c
        const totalSpeed = Math.abs(uBg) + c

        if (scheme === 'explicit') {
          const dt = (cflTotal * dx) / totalSpeed
          const lam = totalSpeed
          const newRho = new Float64Array(N + 2)
          const newU = new Float64Array(N + 2)
          for (let i = 1; i <= N; i++) {
            // Rusanov flux for linear acoustic+transport system
            const fpR = 0.5 * (rho0 * (u[i] + u[i + 1]) + uBg * (rho[i] + rho[i + 1])) - 0.5 * lam * (rho[i + 1] - rho[i])
            const fmR = 0.5 * (rho0 * (u[i - 1] + u[i]) + uBg * (rho[i - 1] + rho[i])) - 0.5 * lam * (rho[i] - rho[i - 1])
            const fpU = 0.5 * ((c * c / rho0) * (rho[i] + rho[i + 1]) + uBg * (u[i] + u[i + 1])) - 0.5 * lam * (u[i + 1] - u[i])
            const fmU = 0.5 * ((c * c / rho0) * (rho[i - 1] + rho[i]) + uBg * (u[i - 1] + u[i])) - 0.5 * lam * (u[i] - u[i - 1])
            newRho[i] = rho[i] - (dt / dx) * (fpR - fmR)
            newU[i] = u[i] - (dt / dx) * (fpU - fmU)
          }
          newRho[0] = newRho[N]
          newRho[N + 1] = newRho[1]
          newU[0] = newU[N]
          newU[N + 1] = newU[1]

          let bad = false
          for (let i = 0; i < N + 2; i++) {
            if (!Number.isFinite(newRho[i]) || Math.abs(newRho[i] - rho0) > 4) {
              bad = true
              break
            }
          }
          if (bad) {
            setDiverged(true)
          } else {
            rho.set(newRho)
            u.set(newU)
            setTSim((t) => t + dt)
          }
        } else {
          // Acoustic-transport splitting (mimics IMEX outer Δt = CFL·Δx/|u_bg|)
          const uForCFL = Math.max(Math.abs(uBg), 0.04 * c)
          const dtOuter = (cflTotal * dx) / uForCFL
          const nSub = Math.max(1, Math.ceil((c * dtOuter) / dx))
          const dtA = dtOuter / nSub

          // Acoustic sub-cycle: Rusanov on acoustic-only (F = (ρ0 u, c²/ρ0 ρ))
          for (let k = 0; k < nSub; k++) {
            const newRho = new Float64Array(N + 2)
            const newU = new Float64Array(N + 2)
            for (let i = 1; i <= N; i++) {
              const fpR = 0.5 * rho0 * (u[i] + u[i + 1]) - 0.5 * c * (rho[i + 1] - rho[i])
              const fmR = 0.5 * rho0 * (u[i - 1] + u[i]) - 0.5 * c * (rho[i] - rho[i - 1])
              const fpU = 0.5 * (c * c / rho0) * (rho[i] + rho[i + 1]) - 0.5 * c * (u[i + 1] - u[i])
              const fmU = 0.5 * (c * c / rho0) * (rho[i - 1] + rho[i]) - 0.5 * c * (u[i] - u[i - 1])
              newRho[i] = rho[i] - (dtA / dx) * (fpR - fmR)
              newU[i] = u[i] - (dtA / dx) * (fpU - fmU)
            }
            newRho[0] = newRho[N]
            newRho[N + 1] = newRho[1]
            newU[0] = newU[N]
            newU[N + 1] = newU[1]
            rho.set(newRho)
            u.set(newU)
          }

          // Transport step (explicit upwind at u_bg)
          if (uBg !== 0) {
            const cflTrans = (Math.abs(uBg) * dtOuter) / dx
            if (cflTrans < 1.01) {
              const newRho = new Float64Array(N + 2)
              const newU = new Float64Array(N + 2)
              const a = (uBg * dtOuter) / dx
              if (uBg >= 0) {
                for (let i = 1; i <= N; i++) {
                  newRho[i] = rho[i] - a * (rho[i] - rho[i - 1])
                  newU[i] = u[i] - a * (u[i] - u[i - 1])
                }
              } else {
                for (let i = 1; i <= N; i++) {
                  newRho[i] = rho[i] - a * (rho[i + 1] - rho[i])
                  newU[i] = u[i] - a * (u[i + 1] - u[i])
                }
              }
              newRho[0] = newRho[N]
              newRho[N + 1] = newRho[1]
              newU[0] = newU[N]
              newU[N + 1] = newU[1]
              rho.set(newRho)
              u.set(newU)
            }
          }

          applyBC(rho, u)
          setTSim((t) => t + dtOuter)
        }
      }

      const canvas = canvasRef.current
      if (canvas && state) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const W = canvas.width
        const H = canvas.height
        ctx.fillStyle = '#0b1220'
        ctx.fillRect(0, 0, W, H)

        // Horizontal reference grid
        ctx.strokeStyle = '#1e2f44'
        ctx.lineWidth = 1
        for (let k = 0; k <= 4; k++) {
          const y = (H * k) / 4
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(W, y)
          ctx.stroke()
        }

        // Baseline rho=1
        ctx.strokeStyle = '#475569'
        ctx.setLineDash([4, 4])
        const yBase = H * (1 - (rho0 - 0.7) / 0.8)
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        ctx.lineTo(W, yBase)
        ctx.stroke()
        ctx.setLineDash([])

        // Density curve
        const { rho } = state
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        for (let i = 1; i <= N; i++) {
          const x = ((i - 0.5) / N) * W
          const norm = (rho[i] - 0.7) / 0.8
          const y = H * (1 - Math.max(-0.1, Math.min(1.1, norm)))
          if (i === 1) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Label
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '12px Geist, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`t = ${tSim.toFixed(2)}`, 8, 16)
        ctx.fillText(`ρ(x)`, 8, H - 8)

        if (diverged) {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.55)'
          ctx.fillRect(0, 0, W, H)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 20px Geist, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('DIVERGED — explicit scheme unstable at CFL>1', W / 2, H / 2)
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [cflTotal, machBg, scheme, diverged, running, tSim])

  const cflGain = scheme === 'split' ? (1 + 1 / Math.max(machBg, 0.001)).toFixed(1) : '—'

  return (
    <div
      style={{
        border: '1px solid var(--border, #334155)',
        borderRadius: 12,
        padding: '14px 14px 18px',
        background: 'var(--surface, #0f1a2c)',
        margin: '1.6rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={620}
        height={240}
        style={{ width: '100%', maxWidth: 620, height: 'auto', display: 'block', borderRadius: 8 }}
      />
      <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 110 }}>Scheme</span>
          <button
            onClick={() => setScheme('explicit')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: scheme === 'explicit' ? '#22d3ee' : 'transparent',
              color: scheme === 'explicit' ? '#0b1220' : '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            Explicit unsplit
          </button>
          <button
            onClick={() => setScheme('split')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: scheme === 'split' ? '#22d3ee' : 'transparent',
              color: scheme === 'split' ? '#0b1220' : '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            IMEX acoustic-transport
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {running ? 'Pause' : 'Run'}
          </button>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 110 }}>CFL ({scheme === 'split' ? 'on |u|' : 'on |u|+c'})</span>
          <input
            type="range"
            min={0.2}
            max={6}
            step={0.05}
            value={cflTotal}
            onChange={(e) => setCflTotal(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 50, textAlign: 'right' }}>{cflTotal.toFixed(2)}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 110 }}>Mach number M</span>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.005}
            value={machBg}
            onChange={(e) => setMachBg(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 50, textAlign: 'right' }}>{machBg.toFixed(3)}</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          <span>IMEX time-step gain ≈ 1 + 1/M = {cflGain}×</span>
          <span>{diverged ? 'STATUS: diverged' : 'STATUS: stable'}</span>
        </div>
      </div>
    </div>
  )
}
