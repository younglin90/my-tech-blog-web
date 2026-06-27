'use client'

import { useEffect, useRef, useState } from 'react'

// A standing capillary wave reduces, for one resolved mode, to a damped
// harmonic oscillator:  eta'' + 2*gamma*eta' + omega^2*eta = 0,
// with omega^2 = sigma*k^3 / (rhoA + rhoB).  Explicit surface tension behaves
// like a symplectic-Euler integrator of this oscillator and goes unstable once
// omega*dt exceeds ~2 -- exactly the capillary time-step constraint. Treating
// surface tension implicitly (backward Euler) is unconditionally stable, so it
// "breaches" the constraint. Here both integrate the same mode side by side.
//
// Units: we fix Delta_t_sigma = 1, and for the highest resolved capillary wave
// omega * Delta_t_sigma = pi/sqrt(2) ~= 2.221, so the explicit limit dt/dt_sig
// ~= 2/2.221 ~= 0.90 emerges on its own.

const OMEGA = Math.PI / Math.SQRT2 // ~2.221, per resolved mode in 1/dt_sigma
const K = 2 * Math.PI // wave number used only for drawing the interface shape

function analytic(t: number, gamma: number) {
  const wd2 = OMEGA * OMEGA - gamma * gamma
  if (wd2 <= 0) return Math.exp(-gamma * t)
  const wd = Math.sqrt(wd2)
  return Math.exp(-gamma * t) * Math.cos(wd * t)
}

export function CapillaryWaveBreach() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [dtRatio, setDtRatio] = useState(0.6) // dt / dt_sigma
  const [oh, setOh] = useState(0.1) // mesh Ohnesorge number (sets damping)
  const [reset, setReset] = useState(0)

  // mutable sim state
  const st = useRef({
    t: 0,
    etaE: 1,
    vE: 0, // explicit (symplectic Euler)
    etaI: 1,
    vI: 0, // implicit (backward Euler)
    blown: false,
  })

  useEffect(() => {
    st.current = { t: 0, etaE: 1, vE: 0, etaI: 1, vI: 0, blown: false }
  }, [reset, dtRatio, oh])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const col = (n: string, f: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f

    const draw = () => {
      const dt = dtRatio // dt_sigma = 1
      const gamma = oh * OMEGA // damping scales with mesh Ohnesorge number
      const s = st.current

      if (running && !s.blown) {
        // advance a little slower than real-time so the eye can follow
        const sub = 1
        for (let i = 0; i < sub; i++) {
          // explicit: symplectic Euler (force from old position) -> omega*dt<2 limit
          s.vE = s.vE - dt * (OMEGA * OMEGA * s.etaE) - dt * 2 * gamma * s.vE
          s.etaE = s.etaE + dt * s.vE
          // implicit: backward Euler -> unconditionally stable
          const denom = 1 + dt * dt * OMEGA * OMEGA + 2 * gamma * dt
          s.vI = (s.vI - dt * OMEGA * OMEGA * s.etaI) / denom
          s.etaI = s.etaI + dt * s.vI
          s.t += dt
        }
        if (Math.abs(s.etaE) > 1e6 || !isFinite(s.etaE)) s.blown = true
      }

      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = col('--surface', '#0d1a2b')
      ctx.fillRect(0, 0, W, H)

      const midY = H * 0.5
      const amp = 46 // px per unit eta
      const clamp = (e: number) => Math.max(-2.6, Math.min(2.6, e))

      // dashed analytic envelope (initial amplitude reference)
      ctx.strokeStyle = col('--border', '#2a3a52')
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(0, midY)
      ctx.lineTo(W, midY)
      ctx.stroke()
      ctx.setLineDash([])

      const drawWave = (eta: number, color: string, w = 2.2) => {
        ctx.strokeStyle = color
        ctx.lineWidth = w
        ctx.beginPath()
        for (let px = 0; px <= W; px += 3) {
          const x = px / W
          const y = midY - clamp(eta) * amp * Math.sin(K * x)
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
      }

      // analytic reference wave (dashed)
      const ea = analytic(s.t, gamma)
      ctx.setLineDash([5, 5])
      drawWave(ea, col('--text-faint', '#5a7290'), 1.4)
      ctx.setLineDash([])

      drawWave(s.etaI, col('--accent', '#22d3ee')) // implicit = cyan
      drawWave(s.blown ? Math.sign(s.etaE) * 2.6 : s.etaE, '#f97316') // explicit = orange

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [running, dtRatio, oh])

  const explicitUnstable = dtRatio > 0.9

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--bg)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={680}
        height={260}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
      />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <button onClick={() => setRunning((r) => !r)} style={btn}>
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => setReset((r) => r + 1)} style={btn}>
          ↺ Reset
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Δt / Δt<sub>σ</sub> = {dtRatio.toFixed(2)}
          <input type="range" min={0.2} max={3} step={0.05} value={dtRatio} onChange={(e) => setDtRatio(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          mesh Oh = {oh.toFixed(2)}
          <input type="range" min={0} max={0.5} step={0.02} value={oh} onChange={(e) => setOh(parseFloat(e.target.value))} />
        </label>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ color: '#f97316' }}>
          explicit surface tension: <b>{explicitUnstable ? 'DIVERGES' : 'stable'}</b>
        </span>
        <span style={{ color: 'var(--accent)' }}>implicit: stable</span>
        <span style={{ color: 'var(--text-faint)' }}>—— analytic decay</span>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 13,
}
