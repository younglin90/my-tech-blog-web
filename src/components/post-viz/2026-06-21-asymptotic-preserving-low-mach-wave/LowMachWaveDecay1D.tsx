'use client'

import { useEffect, useRef, useState } from 'react'

// Dellacherie's low-Mach demonstration on the linear wave-equation system.
//
//   ∂t ϱ + (a/ε) ∂x u = 0
//   ∂t u + (a/ε) ∂x ϱ = 0
//
// This is the acoustic system with sound speed c = a/ε. As ε → 0 the acoustic
// scale c blows up. An explicit upwind (Rusanov) scheme decouples into two
// scalar advections at speeds ±c; each grid mode is damped by the upwind
// amplification factor
//
//   |g|² = (1 - ν(1-cosθ))² + ν² sin²θ,    ν = c Δt/Δx,   θ = kΔx.
//
// Over a FIXED physical time T the number of acoustic steps is M = T/Δt =
// T c /(ν Δx), so the accumulated log-decay ≈ -½ T c (1-ν) k² Δx ∝ c ∝ 1/ε.
// The wave is wiped out the moment ε is small. The AP / implicit-central
// scheme treats the acoustic operator implicitly, carries no upwind viscosity,
// and conserves the mode amplitude uniformly in ε.

const W = 660
const H = 360
const A_REF = 1 // linearisation sound speed a
const K = 2 * Math.PI // single Fourier mode on [0,1]
const T_PHYS = 1 // fixed physical end time

export function LowMachWaveDecay1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const tfRef = useRef<number>(0)

  const [mach, setMach] = useState(0.05) // ε = reference Mach number
  const [nu, setNu] = useState(0.5) // acoustic CFL ν
  const [N, setN] = useState(64) // grid cells

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const c = A_REF / mach // acoustic speed
    const dx = 1 / N
    const theta = K * dx
    const dt = (nu * dx) / c
    const M = T_PHYS / dt // total acoustic steps over [0,T]
    // upwind amplification magnitude for one scalar characteristic
    const re = 1 - nu * (1 - Math.cos(theta))
    const im = nu * Math.sin(theta)
    const lng = 0.5 * Math.log(re * re + im * im) // ln|g| (<= 0)

    const padL = 52
    const padR = 230
    const padT = 22
    const padB = 40
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const Xp = (tf: number) => padL + tf * plotW
    const Yp = (v: number) => padT + (1 - v) * plotH // amplitude in [0,1]

    const draw = () => {
      tfRef.current += 0.004
      if (tfRef.current > 1.18) tfRef.current = 0
      const tf = Math.min(1, tfRef.current)

      ctx.clearRect(0, 0, W, H)
      const isDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      const fg = isDark ? '#cbd5e1' : '#334155'
      const grid = isDark ? '#1e293b' : '#e2e8f0'
      const cyan = '#22d3ee'
      const red = '#ef4444'

      // axes box
      ctx.strokeStyle = grid
      ctx.lineWidth = 1
      ;[0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(padL, Yp(v))
        ctx.lineTo(padL + plotW, Yp(v))
        ctx.stroke()
      })
      ctx.beginPath()
      ctx.moveTo(padL, Yp(0))
      ctx.lineTo(padL + plotW, Yp(0))
      ctx.stroke()

      // explicit decay envelope amp(tf) = exp(M*tf * ln|g|)
      const ampAt = (f: number) => Math.exp(M * f * lng)

      // implicit (AP) curve — flat at 1
      ctx.strokeStyle = cyan
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(Xp(0), Yp(1))
      ctx.lineTo(Xp(tf), Yp(1))
      ctx.stroke()

      // explicit curve — sampled
      ctx.strokeStyle = red
      ctx.lineWidth = 2.5
      ctx.beginPath()
      const SAMP = 160
      for (let i = 0; i <= SAMP; i++) {
        const f = (i / SAMP) * tf
        const x = Xp(f)
        const y = Yp(ampAt(f))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // moving heads
      ctx.fillStyle = cyan
      ctx.beginPath()
      ctx.arc(Xp(tf), Yp(1), 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = red
      ctx.beginPath()
      ctx.arc(Xp(tf), Yp(ampAt(tf)), 4, 0, Math.PI * 2)
      ctx.fill()

      // axis labels
      ctx.fillStyle = fg
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText('1.0', padL - 34, Yp(1) + 4)
      ctx.fillText('0.0', padL - 34, Yp(0) + 4)
      ctx.fillText('mode amplitude', padL - 44, padT - 6)
      ctx.fillText('physical time  t / T', padL + plotW / 2 - 50, Yp(0) + 28)

      // --- spatial wave inset on the right ---
      const ix0 = padL + plotW + 34
      const iy0 = padT + 18
      const iw = 150
      const ih = 70
      const ampE = ampAt(tf)
      ctx.strokeStyle = grid
      ctx.beginPath()
      ctx.moveTo(ix0, iy0 + ih / 2)
      ctx.lineTo(ix0 + iw, iy0 + ih / 2)
      ctx.stroke()
      const wave = (amp: number, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 80; i++) {
          const xx = i / 80
          const yy = amp * Math.sin(K * xx)
          const px = ix0 + xx * iw
          const py = iy0 + ih / 2 - yy * (ih / 2) * 0.92
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      wave(1, cyan)
      wave(ampE, red)
      ctx.fillStyle = fg
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('ϱ(x) envelope', ix0, iy0 - 6)

      // readout panel
      const px = padL + plotW + 34
      let py = iy0 + ih + 32
      ctx.font = '13px ui-sans-serif, system-ui'
      ctx.fillStyle = cyan
      ctx.fillText('AP / implicit', px, py)
      py += 20
      ctx.fillStyle = red
      ctx.fillText('explicit upwind', px, py)
      py += 26
      ctx.fillStyle = fg
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(`ε (Mach) = ${mach.toFixed(3)}`, px, py)
      py += 18
      ctx.fillText(`c = a/ε = ${c.toFixed(0)}`, px, py)
      py += 18
      ctx.fillText(`acoustic steps M ≈ ${M < 1e5 ? Math.round(M) : M.toExponential(1)}`, px, py)
      py += 22
      const retained = ampAt(1)
      ctx.fillStyle = retained < 0.05 ? red : fg
      ctx.fillText(
        `explicit retains: ${(retained * 100).toFixed(retained < 0.01 ? 3 : 1)}%`,
        px,
        py,
      )
      py += 18
      ctx.fillStyle = cyan
      ctx.fillText('AP retains: 100%', px, py)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [mach, nu, N])

  return (
    <div
      style={{
        border: '1px solid var(--border, #334155)',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: 'var(--surface, rgba(148,163,184,0.05))',
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 190 }}>
          <span>Mach ε: {mach.toFixed(3)}</span>
          <input
            type="range"
            min={0.005}
            max={0.4}
            step={0.005}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>acoustic CFL ν: {nu.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={nu}
            onChange={(e) => setNu(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>grid cells N: {N}</span>
          <input
            type="range"
            min={32}
            max={128}
            step={16}
            value={N}
            onChange={(e) => setN(parseInt(e.target.value))}
          />
        </label>
      </div>
    </div>
  )
}
