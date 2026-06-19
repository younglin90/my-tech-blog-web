'use client'

import { useEffect, useRef, useState } from 'react'

// Why the Kapila volume-fraction source needs a semi-implicit update.
//
// The stiff source drives the volume fraction toward an equilibrium:
//     dα/dt = -λ (α - α_eq),   λ large (stiff).
// Explicit Euler:      α_{n+1} = α_n - λΔt (α_n - α_eq)
//   -> overshoots [0,1] and oscillates once λΔt > 1, diverges past λΔt = 2.
// Crank-Nicolson (semi-implicit), as used in the GRP scheme:
//     α_{n+1} = [α_n (1 - λΔt/2) + λΔt α_eq] / (1 + λΔt/2)
//   -> stays inside [0,1] and converges monotonically for any Δt.

const W = 640
const H = 340
const STEPS = 24

export function KapilaVolumeFractionBound() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const progRef = useRef<number>(0)

  const [lamDt, setLamDt] = useState(1.6) // λΔt  (stiffness x time step)
  const [a0, setA0] = useState(0.85) // initial volume fraction
  const [aEq, setAEq] = useState(0.1) // equilibrium volume fraction

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Precompute both trajectories.
    const expl: number[] = [a0]
    const cn: number[] = [a0]
    for (let n = 0; n < STEPS; n++) {
      const ae = expl[n]
      expl.push(ae - lamDt * (ae - aEq))
      const ac = cn[n]
      cn.push((ac * (1 - lamDt / 2) + lamDt * aEq) / (1 + lamDt / 2))
    }

    const padL = 48
    const padR = 150
    const padT = 24
    const padB = 40
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    // y range padded so overshoots are visible
    const yMin = -0.6
    const yMax = 1.6
    const Xp = (i: number) => padL + (i / STEPS) * plotW
    const Yp = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH

    const draw = () => {
      progRef.current += 0.4
      if (progRef.current > STEPS + 8) progRef.current = 0
      const shown = Math.min(STEPS, Math.floor(progRef.current))

      ctx.clearRect(0, 0, W, H)
      const isDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      const fg = isDark ? '#cbd5e1' : '#334155'
      const grid = isDark ? '#1e293b' : '#e2e8f0'
      const cyan = '#22d3ee'
      const red = '#ef4444'

      // shaded valid band [0,1]
      ctx.fillStyle = isDark ? 'rgba(34,211,238,0.07)' : 'rgba(14,116,144,0.07)'
      ctx.fillRect(padL, Yp(1), plotW, Yp(0) - Yp(1))

      // gridlines at 0 and 1
      ctx.strokeStyle = grid
      ctx.lineWidth = 1
      ;[0, 1].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(padL, Yp(v))
        ctx.lineTo(W - padR, Yp(v))
        ctx.stroke()
      })
      // equilibrium line
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8'
      ctx.beginPath()
      ctx.moveTo(padL, Yp(aEq))
      ctx.lineTo(W - padR, Yp(aEq))
      ctx.stroke()
      ctx.setLineDash([])

      // plot a polyline
      const plot = (arr: number[], color: string, markOut: boolean) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= shown; i++) {
          const x = Xp(i)
          const y = Yp(arr[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        for (let i = 0; i <= shown; i++) {
          const out = arr[i] < 0 || arr[i] > 1
          ctx.fillStyle = markOut && out ? red : color
          ctx.beginPath()
          ctx.arc(Xp(i), Yp(arr[i]), markOut && out ? 4 : 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      plot(expl, red, true)
      plot(cn, cyan, false)

      // axis labels
      ctx.fillStyle = fg
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText('α = 1', padL - 38, Yp(1) + 4)
      ctx.fillText('α = 0', padL - 38, Yp(0) + 4)
      ctx.fillText('step n', W - padR - 44, Yp(0) + 26)

      // legend / readout
      const px = W - padR + 14
      let py = padT + 10
      ctx.font = '13px ui-sans-serif, system-ui'
      ctx.fillStyle = red
      ctx.fillText('explicit Euler', px, py)
      py += 22
      ctx.fillStyle = cyan
      ctx.fillText('Crank-Nicolson', px, py)
      py += 28
      ctx.fillStyle = fg
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(`λΔt = ${lamDt.toFixed(2)}`, px, py)
      py += 20
      const explBroken = expl.some((v) => v < 0 || v > 1)
      ctx.fillStyle = explBroken ? red : fg
      ctx.fillText(explBroken ? 'explicit: out of [0,1]' : 'explicit: bounded', px, py)
      py += 18
      ctx.fillStyle = cyan
      ctx.fillText('CN: always bounded', px, py)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [lamDt, a0, aEq])

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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
          <span>stiffness λΔt: {lamDt.toFixed(2)}</span>
          <input type="range" min={0.2} max={3} step={0.05} value={lamDt} onChange={(e) => setLamDt(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>α₀ (initial): {a0.toFixed(2)}</span>
          <input type="range" min={0.02} max={0.98} step={0.02} value={a0} onChange={(e) => setA0(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
          <span>α_eq (target): {aEq.toFixed(2)}</span>
          <input type="range" min={0.02} max={0.98} step={0.02} value={aEq} onChange={(e) => setAEq(parseFloat(e.target.value))} />
        </label>
      </div>
    </div>
  )
}
