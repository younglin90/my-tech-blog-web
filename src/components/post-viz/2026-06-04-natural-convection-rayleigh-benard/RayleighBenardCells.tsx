'use client'

import { useEffect, useRef, useState } from 'react'

// Kinematic Rayleigh-Benard model.
// Heated from below (T=1, bottom), cooled from top (T=0).
// Below the critical Rayleigh number (Ra_c = 1708) the fluid stays put:
// pure conduction, a linear vertical temperature gradient, no motion.
// Above Ra_c counter-rotating convection rolls switch on. Their vigor
// grows like sqrt((Ra - Ra_c)/Ra_c).
//
// Stream function (domain X in [0,1] width, Y in [0,1] height, Y=0 = hot floor):
//   psi = vigor * sin(n*pi*X) * sin(pi*Y)
//   u =  d(psi)/dY,  v = -d(psi)/dX
// Particles are advected by (u, v) to reveal the circulation.

const RA_C = 1708
const N_HALF_ROLLS = 8 // 4 counter-rotating roll pairs across the width
const N_PARTICLES = 240

// 4-stop temperature colormap: cold blue -> cyan -> amber -> red hot.
function tempColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t))
  const stops: [number, [number, number, number]][] = [
    [0.0, [38, 70, 170]],
    [0.34, [40, 165, 200]],
    [0.66, [240, 185, 70]],
    [1.0, [205, 45, 40]],
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i]
    const [b, cb] = stops[i + 1]
    if (x <= b) {
      const s = (x - a) / (b - a)
      return [
        Math.round(ca[0] + (cb[0] - ca[0]) * s),
        Math.round(ca[1] + (cb[1] - ca[1]) * s),
        Math.round(ca[2] + (cb[2] - ca[2]) * s),
      ]
    }
  }
  return stops[stops.length - 1][1]
}

export function RayleighBenardCells() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logRa, setLogRa] = useState(4) // Ra = 10^logRa
  const particlesRef = useRef<{ x: number; y: number }[]>([])
  const rafRef = useRef<number>(0)

  // seed particles once
  if (particlesRef.current.length === 0) {
    const ps: { x: number; y: number }[] = []
    for (let i = 0; i < N_PARTICLES; i++) {
      ps.push({ x: Math.random(), y: Math.random() })
    }
    particlesRef.current = ps
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cols = 64
    const rows = 38
    const cw = W / cols
    const ch = H / rows

    const Ra = Math.pow(10, logRa)
    const supercrit = Math.max(0, (Ra - RA_C) / RA_C)
    const vigor = Math.min(1, Math.sqrt(supercrit) / 12)

    const n = N_HALF_ROLLS

    // velocity from stream function at (X,Y) in [0,1]^2
    const vel = (X: number, Y: number) => {
      const u = vigor * Math.sin(n * Math.PI * X) * Math.PI * Math.cos(Math.PI * Y)
      const v = -vigor * n * Math.PI * Math.cos(n * Math.PI * X) * Math.sin(Math.PI * Y)
      return [u, v]
    }

    const drawTemperature = () => {
      for (let j = 0; j < rows; j++) {
        // Y = 0 at bottom (hot). pixel rows go top->bottom.
        const Y = 1 - (j + 0.5) / rows
        for (let i = 0; i < cols; i++) {
          const X = (i + 0.5) / cols
          const base = 1 - Y // conduction: hot floor
          // convection sharpens boundary layers & stirs the core
          const pert = vigor * 0.4 * Math.sin(n * Math.PI * X) * Math.sin(Math.PI * Y)
          const T = base + pert
          const [r, g, b] = tempColor(T)
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(i * cw, j * ch, cw + 1, ch + 1)
        }
      }
    }

    const step = () => {
      drawTemperature()

      // advect + draw particles
      const dt = 0.0016
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      const ps = particlesRef.current
      for (let k = 0; k < ps.length; k++) {
        const p = ps[k]
        const [u, v] = vel(p.x, p.y)
        p.x += u * dt
        p.y += v * dt
        if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1 || (vigor === 0 && Math.random() < 0.002)) {
          p.x = Math.random()
          p.y = Math.random()
        }
        const px = p.x * W
        const py = (1 - p.y) * H
        ctx.beginPath()
        ctx.arc(px, py, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      // hot / cold plate labels
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, H - 14, W, 14)
      ctx.fillRect(0, 0, W, 14)
      ctx.fillStyle = '#fde68a'
      ctx.font = '11px monospace'
      ctx.fillText('hot wall  T = 1', 8, H - 4)
      ctx.fillStyle = '#bae6fd'
      ctx.fillText('cold wall  T = 0', 8, 11)

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [logRa])

  const Ra = Math.pow(10, logRa)
  const state =
    Ra < RA_C
      ? 'conduction only — fluid at rest'
      : Ra < 5e4
      ? 'steady convection rolls (Benard cells)'
      : 'vigorous, unsteady convection'

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <div style={{ marginTop: '0.9rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <span style={{ minWidth: 150, fontFamily: 'monospace' }}>Ra = {Ra.toExponential(1)}</span>
          <input
            type="range"
            min={2}
            max={6}
            step={0.05}
            value={logRa}
            onChange={(e) => setLogRa(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
        <p style={{ margin: '0.6rem 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          critical Ra<sub>c</sub> = 1708 &nbsp;·&nbsp; state: <strong>{state}</strong>
        </p>
      </div>
    </div>
  )
}
