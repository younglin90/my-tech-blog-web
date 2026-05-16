'use client'

import { useEffect, useRef, useState } from 'react'

type Scaling = 'convective' | 'acoustic' | 'mixed'

const SCHEMES: { id: Scaling; label: string; color: string }[] = [
  { id: 'convective', label: 'Convective  A₁₁∼M⁻², A₂₂∼M⁰', color: '#ef4444' },
  { id: 'acoustic', label: 'Acoustic  A₁₁∼M⁻¹, A₂₂∼M⁻¹', color: '#22d3ee' },
  { id: 'mixed', label: 'Mixed  A₁₁∼M⁻¹, A₂₂∼M⁰', color: '#a3e635' },
]

function diffCoeff(scheme: Scaling, M: number) {
  // Eqs. (15) (17) (21) in Hope-Collins (2022). Per-step amplitude decay rate
  // for an acoustic perturbation propagated through one period (k=2π/L, c=1).
  // Below are the qualitative damping factors that emerge from the von Neumann
  // analysis when one tracks the O(M) pressure mode through one period.
  const base = 0.04 // dimensionless damping for the well-scaled (acoustic) case
  if (scheme === 'convective') return base / (M * M) // catastrophic at low M
  if (scheme === 'acoustic') return base
  return base * 1.05 // mixed: slightly more diffusion on pressure than acoustic
}

const N = 192

export function LowMachAcousticDamping1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tRef = useRef(0)
  const playingRef = useRef(true)
  const [logMach, setLogMach] = useState(-2) // M = 10^logMach
  const [playing, setPlaying] = useState(true)
  const [period, setPeriod] = useState(1)

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const M = Math.pow(10, logMach)

    // Pre-compute per-period decay factor for each scheme
    const decay: Record<Scaling, number> = {
      convective: Math.exp(-Math.min(8, diffCoeff('convective', M))),
      acoustic: Math.exp(-diffCoeff('acoustic', M)),
      mixed: Math.exp(-diffCoeff('mixed', M)),
    }

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = '#0b1426'
      ctx.fillRect(0, 0, W, H)

      // Axis baseline
      ctx.strokeStyle = '#1e2e4a'
      ctx.lineWidth = 1
      ctx.beginPath()
      const midY = H / 2
      ctx.moveTo(0, midY)
      ctx.lineTo(W, midY)
      ctx.stroke()

      const t = tRef.current
      const cycles = t // 1 cycle per logical second

      for (const s of SCHEMES) {
        const decayPow = Math.pow(decay[s.id], cycles)
        const amp = Math.max(decayPow, 0)
        ctx.strokeStyle = s.color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= N; i++) {
          const x = i / N
          const phase = 2 * Math.PI * (x - t)
          const y = Math.sin(phase) * amp
          const px = (i / N) * W
          const py = midY - y * (H * 0.35)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // Mach label
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`M = ${M.toExponential(2)}   t/T = ${t.toFixed(2)}`, 10, 16)
    }

    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (playingRef.current) {
        tRef.current += dt / Math.max(0.2, period)
        if (tRef.current > 8) tRef.current = 0
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [logMach, period])

  const M = Math.pow(10, logMach)

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '24px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong style={{ color: 'var(--text)' }}>1D acoustic wave under three diffusion scalings</strong>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <canvas ref={canvasRef} width={720} height={260} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginTop: 10, fontSize: 13 }}>
        {SCHEMES.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 3, background: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          log₁₀ M = {logMach.toFixed(2)}  (M = {M.toExponential(1)})
          <input
            type="range"
            min={-4}
            max={-0.3}
            step={0.05}
            value={logMach}
            onChange={(e) => setLogMach(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Period speed = {period.toFixed(2)} s
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.05}
            value={period}
            onChange={(e) => setPeriod(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
        Drag M toward 10⁻³ and the red (convective) curve collapses within half a period — that is the
        accuracy problem of Volpe (1993). The cyan (acoustic) and yellow (mixed) curves keep their
        amplitude almost intact, as predicted by the asymptotic scaling table.
      </p>
    </div>
  )
}
