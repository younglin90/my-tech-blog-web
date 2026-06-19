'use client'

import { useEffect, useRef, useState } from 'react'

// Interactive demonstration of the GRP half-step interface value.
//
// Scalar advection  u_t + a u_x = 0  on two cells sharing an interface at x = 0.
// Godunov uses piecewise-constant data: the interface value never changes in time.
// GRP uses piecewise-linear data and the Lax-Wendroff relation du/dt = -a du/dx,
// so the interface value evolves along the characteristic. The flux is evaluated
// at the half time level t^{n+1/2}, giving second-order accuracy in a single stage.

const W = 640
const H = 360

// Fixed cell averages (a contact-like jump across the interface).
const U_L = 0.72
const U_R = 0.30
// Cell centers at x = -0.5 and x = +0.5, cell width dx = 1, interface at x = 0.
const DX = 1

export function GrpHalfStepInterface1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const tRef = useRef<number>(0)

  const [a, setA] = useState(1.0) // advection speed
  const [slopeL, setSlopeL] = useState(0.5) // du/dx in left cell
  const [cfl, setCfl] = useState(0.8)
  const [useGrp, setUseGrp] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Map physical (x in [-1,1], u in [0,1]) to canvas pixels.
    const padL = 56
    const padR = 200
    const padT = 28
    const padB = 44
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const X = (x: number) => padL + ((x + 1) / 2) * plotW
    const Y = (u: number) => padT + (1 - u) * plotH

    const dt = Math.abs(a) > 1e-6 ? (cfl * DX) / Math.abs(a) : 0 // CFL-limited step
    const tHalf = dt / 2

    // Value sampled at the interface (x=0) at local time t, by tracing the
    // characteristic foot back to x = -a*t and reading the reconstruction.
    const sampleInterface = (t: number): number => {
      if (!useGrp) return a >= 0 ? U_L : U_R // piecewise constant -> upwind constant
      const xf = -a * t // foot of the characteristic
      if (xf <= 0) {
        // foot in left cell, slope slopeL, center at -0.5
        return U_L + slopeL * (xf - -0.5)
      }
      // foot in right cell: use a symmetric slope so the demo stays readable
      return U_R + slopeL * (xf - 0.5)
    }

    const draw = () => {
      // advance demo clock, looping 0 -> dt
      tRef.current += 0.016
      if (dt <= 0 || tRef.current > dt * 1.6) tRef.current = 0
      const t = Math.min(tRef.current, dt)

      ctx.clearRect(0, 0, W, H)
      const isDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      const fg = isDark ? '#cbd5e1' : '#334155'
      const grid = isDark ? '#1e293b' : '#e2e8f0'
      const cyan = '#22d3ee'
      const amber = '#f59e0b'

      // axes
      ctx.strokeStyle = grid
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, Y(0))
      ctx.lineTo(W - padR, Y(0))
      ctx.moveTo(padL, padT)
      ctx.lineTo(padL, Y(0))
      ctx.stroke()

      // interface line at x = 0
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = isDark ? '#475569' : '#94a3b8'
      ctx.beginPath()
      ctx.moveTo(X(0), padT)
      ctx.lineTo(X(0), Y(0))
      ctx.stroke()
      ctx.setLineDash([])

      // reconstruction in each cell
      ctx.lineWidth = 2.5
      ctx.strokeStyle = fg
      if (useGrp) {
        // left cell: linear, center (-0.5, U_L)
        ctx.beginPath()
        ctx.moveTo(X(-1), Y(U_L + slopeL * (-1 - -0.5)))
        ctx.lineTo(X(0), Y(U_L + slopeL * (0 - -0.5)))
        ctx.stroke()
        // right cell: linear, center (0.5, U_R)
        ctx.beginPath()
        ctx.moveTo(X(0), Y(U_R + slopeL * (0 - 0.5)))
        ctx.lineTo(X(1), Y(U_R + slopeL * (1 - 0.5)))
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(X(-1), Y(U_L))
        ctx.lineTo(X(0), Y(U_L))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(X(0), Y(U_R))
        ctx.lineTo(X(1), Y(U_R))
        ctx.stroke()
      }

      // characteristic foot marker on the x-axis
      const xf = -a * t
      const xfClamped = Math.max(-1, Math.min(1, xf))
      ctx.fillStyle = amber
      ctx.beginPath()
      ctx.arc(X(xfClamped), Y(0), 4, 0, Math.PI * 2)
      ctx.fill()

      // value sampled at the interface, lifted to the interface column
      const uNow = sampleInterface(t)
      const uStar = sampleInterface(0)
      const uHalf = sampleInterface(tHalf)

      // U* marker (t = 0)
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8'
      ctx.beginPath()
      ctx.arc(X(0), Y(uStar), 4, 0, Math.PI * 2)
      ctx.fill()

      // moving interface value
      ctx.fillStyle = cyan
      ctx.beginPath()
      ctx.arc(X(0), Y(uNow), 6, 0, Math.PI * 2)
      ctx.fill()

      // half-step value marker (the one used in the flux)
      ctx.strokeStyle = amber
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(X(0), Y(uHalf), 9, 0, Math.PI * 2)
      ctx.stroke()

      // labels
      ctx.fillStyle = fg
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText('u', padL - 14, padT + 6)
      ctx.fillText('x', W - padR + 6, Y(0) + 4)
      ctx.fillText('interface', X(0) - 26, padT - 10)
      ctx.fillText('cell i', X(-0.5) - 14, Y(0) + 22)
      ctx.fillText('cell i+1', X(0.5) - 18, Y(0) + 22)

      // side readout panel
      const px = W - padR + 18
      let py = padT + 8
      const line = (txt: string, color = fg) => {
        ctx.fillStyle = color
        ctx.fillText(txt, px, py)
        py += 22
      }
      ctx.font = '13px ui-sans-serif, system-ui'
      line(useGrp ? 'GRP (piecewise-linear)' : 'Godunov (constant)', cyan)
      line(`a = ${a.toFixed(2)}`)
      line(`Δt = ${dt.toFixed(3)}  (CFL ${cfl.toFixed(2)})`)
      py += 4
      line(`U*      = ${uStar.toFixed(3)}`, isDark ? '#94a3b8' : '#64748b')
      line(`Uⁿ⁺¹ᐟ² = ${uHalf.toFixed(3)}`, amber)
      line(`F = a·Uⁿ⁺¹ᐟ² = ${(a * uHalf).toFixed(3)}`, cyan)
      py += 4
      ctx.font = '11px ui-sans-serif, system-ui'
      const dudt = useGrp ? -a * slopeL : 0
      line(`∂u/∂t = -a·uₓ = ${dudt.toFixed(3)}`, fg)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [a, slopeL, cfl, useGrp])

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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>advection speed a: {a.toFixed(2)}</span>
          <input type="range" min={-2} max={2} step={0.05} value={a} onChange={(e) => setA(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>left slope uₓ: {slopeL.toFixed(2)}</span>
          <input type="range" min={-1} max={1} step={0.05} value={slopeL} onChange={(e) => setSlopeL(parseFloat(e.target.value))} disabled={!useGrp} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>CFL: {cfl.toFixed(2)}</span>
          <input type="range" min={0.1} max={1} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={useGrp} onChange={(e) => setUseGrp(e.target.checked)} />
          <span>GRP (off = Godunov)</span>
        </label>
      </div>
    </div>
  )
}
