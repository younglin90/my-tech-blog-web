'use client'

import { useEffect, useRef, useState } from 'react'

// Interactive Rayleigh-Benard cell demo.
// Below the critical Rayleigh number the fluid conducts heat with a still,
// linear temperature profile. Above it, the critical eigenmode grows and
// counter-rotating convection rolls carry warm fluid up and cold fluid down.
// The roll velocity field uses the linear-stability streamfunction
//   psi(x, z) = A * sin(k x) * sin(pi z / H),  A ~ sqrt(Ra/Ra_c - 1)
// which is physically faithful near onset and cheap to advect tracers through.

const RA_C = 1708

type Tracer = { x: number; z: number }

export function RayleighBenardCells() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logRa, setLogRa] = useState(3.0) // log10(Ra), start at Ra = 1000 (conduction)
  const rafRef = useRef<number>(0)
  const tracersRef = useRef<Tracer[]>([])
  const raRef = useRef<number>(1000)

  const Ra = Math.round(Math.pow(10, logRa))
  raRef.current = Ra

  // (re)seed tracers once
  useEffect(() => {
    const arr: Tracer[] = []
    for (let i = 0; i < 260; i++) {
      arr.push({ x: Math.random(), z: Math.random() })
    }
    tracersRef.current = arr
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cols = 64
    const rows = 32
    const nRolls = 4 // number of counter-rotating rolls across the width
    const k = nRolls * Math.PI // sin(k x) with x in [0,1]

    // viridis-ish cold->hot ramp
    const colormap = (t: number) => {
      const c = Math.max(0, Math.min(1, t))
      const r = Math.round(30 + c * c * 225)
      const g = Math.round(40 + c * 150)
      const b = Math.round(120 + (1 - c) * 110)
      return `rgb(${r},${g},${b})`
    }

    const step = () => {
      const ra = raRef.current
      // supercritical pitchfork amplitude, clamped for display
      const amp = ra > RA_C ? Math.min(1.6, Math.sqrt(ra / RA_C - 1)) : 0
      const speed = amp * 0.9

      // --- temperature field ---
      const cw = W / cols
      const ch = H / rows
      for (let j = 0; j < rows; j++) {
        const z = 1 - j / (rows - 1) // z=1 top (cold), z=0 bottom (hot)
        for (let i = 0; i < cols; i++) {
          const x = i / (cols - 1)
          // base conductive profile (hot bottom) + convective perturbation
          const base = 1 - z
          const pert = amp * 0.45 * Math.cos(k * x) * Math.sin(Math.PI * z)
          ctx.fillStyle = colormap(base + pert)
          ctx.fillRect(i * cw, j * ch, cw + 1, ch + 1)
        }
      }

      // --- advect tracers with the roll velocity field ---
      // u =  d(psi)/dz = A (pi/1) sin(k x) cos(pi z)
      // w = -d(psi)/dx = -A k cos(k x) sin(pi z)
      const dt = 0.9
      const tracers = tracersRef.current
      ctx.fillStyle = 'rgba(250,250,250,0.75)'
      for (let p = 0; p < tracers.length; p++) {
        const t = tracers[p]
        const u = speed * Math.sin(k * t.x) * Math.cos(Math.PI * t.z)
        const w = -speed * (k / Math.PI) * Math.cos(k * t.x) * Math.sin(Math.PI * t.z)
        t.x += (u * dt) / 120
        t.z += (w * dt) / 120
        // reflect at walls
        if (t.x < 0) t.x += 1
        if (t.x > 1) t.x -= 1
        if (t.z < 0.001) t.z = 0.001
        if (t.z > 0.999) t.z = 0.999
        const px = t.x * W
        const py = (1 - t.z) * H
        ctx.fillRect(px, py, 1.8, 1.8)
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const convecting = Ra > RA_C

  return (
    <div
      style={{
        border: '1px solid var(--border, #24425a)',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: 'var(--surface, #0d1a2b)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={520}
        height={260}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <div style={{ marginTop: 12, fontSize: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 92, fontFamily: 'monospace' }}>Ra = {Ra.toLocaleString()}</span>
          <input
            type="range"
            min={2.8}
            max={4.7}
            step={0.01}
            value={logRa}
            onChange={(e) => setLogRa(parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 160 }}
          />
        </label>
        <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ opacity: 0.7 }}>
            Ra<sub>c</sub> = 1708
          </span>
          <span
            style={{
              fontWeight: 600,
              color: convecting ? 'var(--accent, #22d3ee)' : 'var(--text-muted, #7a90a8)',
            }}
          >
            {convecting ? '대류 (rolls) — convection' : '전도 (still) — conduction'}
          </span>
        </div>
      </div>
    </div>
  )
}
