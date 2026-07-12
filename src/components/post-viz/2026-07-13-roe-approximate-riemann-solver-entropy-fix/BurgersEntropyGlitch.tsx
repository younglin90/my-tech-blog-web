'use client'

import { useEffect, useRef, useState } from 'react'

// The entropy glitch, made visible on the scalar Burgers equation u_t + (u^2/2)_x = 0.
// Murman-Roe flux:   F = 1/2(fL+fR) - 1/2 |a| (uR-uL),  a = (uL+uR)/2.
// For a transonic rarefaction (uL < 0 < uR) the Roe speed a passes through zero
// at the sonic point, |a| -> 0, and the scheme freezes an *unphysical* stationary
// expansion shock instead of opening a smooth fan.
// Harten's entropy fix replaces |a| by a smooth floor of width delta:
//   |a| -> (a^2 + delta^2) / (2 delta)   when |a| < delta.
// Slide delta up and the stuck shock relaxes into the exact rarefaction.

const N = 220
const XL = -1
const XR = 1
const UL = -0.5
const UR = 1.0
const TMAX = 1.4
const CFL = 0.5

function hartenFix(a: number, delta: number) {
  const aa = Math.abs(a)
  if (delta <= 0) return aa
  return aa < delta ? (a * a + delta * delta) / (2 * delta) : aa
}

const btnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 13,
  cursor: 'pointer',
}

export function BurgersEntropyGlitch() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [delta, setDelta] = useState(0.0)
  const [playing, setPlaying] = useState(true)
  const [resetToken, setResetToken] = useState(0)
  const deltaRef = useRef(delta)
  const playingRef = useRef(playing)
  deltaRef.current = delta
  playingRef.current = playing

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const dx = (XR - XL) / (N - 1)
    const x = Array.from({ length: N }, (_, i) => XL + i * dx)

    let u: number[] = x.map((xi) => (xi < 0 ? UL : UR))
    let t = 0
    let raf = 0

    const uToY = (val: number) => {
      const lo = UL - 0.35
      const hi = UR + 0.35
      return H - 24 - ((val - lo) / (hi - lo)) * (H - 44)
    }
    const xToPx = (xi: number) => 40 + ((xi - XL) / (XR - XL)) * (W - 56)

    const step = () => {
      const d = deltaRef.current
      const maxa = Math.max(...u.map(Math.abs), 1e-9)
      let dt = (CFL * dx) / maxa
      if (t + dt > TMAX) dt = TMAX - t
      const F = new Array(N + 1).fill(0)
      for (let i = 1; i < N; i++) {
        const uLc = u[i - 1]
        const uRc = u[i]
        const a = 0.5 * (uLc + uRc)
        F[i] = 0.25 * (uLc * uLc + uRc * uRc) - 0.5 * hartenFix(a, d) * (uRc - uLc)
      }
      F[0] = 0.5 * u[0] * u[0]
      F[N] = 0.5 * u[N - 1] * u[N - 1]
      const un = u.slice()
      for (let i = 1; i < N - 1; i++) un[i] = u[i] - (dt / dx) * (F[i + 1] - F[i])
      u = un
      t += dt
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#070f1c'
      ctx.fillRect(0, 0, W, H)

      // zero + sonic reference
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, uToY(0))
      ctx.lineTo(W - 16, uToY(0))
      ctx.stroke()
      ctx.fillStyle = '#64748b'
      ctx.font = '11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('u = 0 (sonic)', W - 18, uToY(0) - 4)

      // exact transonic rarefaction u = clamp(x/t, UL, UR)
      const te = Math.max(t, 1e-6)
      ctx.strokeStyle = '#fbbf24'
      ctx.setLineDash([6, 5])
      ctx.lineWidth = 1.6
      ctx.beginPath()
      x.forEach((xi, i) => {
        const ue = Math.min(Math.max(xi / te, UL), UR)
        const px = xToPx(xi)
        const py = uToY(ue)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // numerical Murman-Roe solution
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      u.forEach((ui, i) => {
        const px = xToPx(x[i])
        const py = uToY(ui)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()

      // legend
      ctx.textAlign = 'left'
      ctx.font = '12px monospace'
      ctx.fillStyle = '#38bdf8'
      ctx.fillText('Murman–Roe', 46, 18)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('exact rarefaction', 46, 34)
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'right'
      ctx.fillText('t = ' + t.toFixed(2), W - 18, 18)

      if (playingRef.current && t < TMAX) step()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [resetToken])

  return (
    <div style={{ maxWidth: 620, margin: '20px auto', color: '#e2e8f0' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#070f1c' }}
      />
      <div style={{ marginTop: 12, fontSize: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 190, fontFamily: 'monospace' }}>entropy-fix width δ = {delta.toFixed(3)}</span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.005}
            value={delta}
            onChange={(e) => setDelta(parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 160, accentColor: '#38bdf8' }}
          />
        </label>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setPlaying((p) => !p)} style={btnStyle}>{playing ? '⏸ pause' : '▶ play'}</button>
          <button onClick={() => setResetToken((k) => k + 1)} style={btnStyle}>↺ restart</button>
        </div>
        <div style={{ marginTop: 8, opacity: 0.65, fontSize: 12 }}>
          δ = 0 freezes a stationary expansion shock at the sonic point (the blue kink at x = 0).
          Raise δ and the numerical curve relaxes onto the amber exact rarefaction.
        </div>
      </div>
    </div>
  )
}
