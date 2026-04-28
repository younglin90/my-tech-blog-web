'use client'

import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rho: number
  p: number
}

const PARTICLE_COUNT = 64
const REST_DENSITY = 1000
const MASS = 0.02
const GRAVITY = 9.8
const DT = 0.0006

function buildParticles(): Particle[] {
  const list: Particle[] = []
  const n = 8
  const spacing = 0.025
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      list.push({
        x: 0.07 + i * spacing + (Math.random() - 0.5) * 0.002,
        y: 0.55 + j * spacing,
        vx: 0,
        vy: 0,
        rho: REST_DENSITY,
        p: 0,
      })
    }
  }
  return list
}

export function SPHParticleDrop2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>(buildParticles())
  const [running, setRunning] = useState(true)
  const [h, setH] = useState(0.045)
  const [stiffness, setStiffness] = useState(3.0)
  const [viscosity, setViscosity] = useState(3.5)
  const [showField, setShowField] = useState(true)

  const reset = () => {
    particlesRef.current = buildParticles()
  }

  useEffect(() => {
    if (!running) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    const step = () => {
      const ps = particlesRef.current
      const h2 = h * h
      const poly6Coef = 315 / (64 * Math.PI * Math.pow(h, 9))
      const spikyCoef = -45 / (Math.PI * Math.pow(h, 6))
      const viscCoef = 45 / (Math.PI * Math.pow(h, 6))

      for (let i = 0; i < ps.length; i++) {
        let density = 0
        for (let j = 0; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x
          const dy = ps[i].y - ps[j].y
          const r2 = dx * dx + dy * dy
          if (r2 < h2) {
            const diff = h2 - r2
            density += MASS * poly6Coef * diff * diff * diff
          }
        }
        ps[i].rho = density
        ps[i].p = stiffness * (density - REST_DENSITY)
      }

      for (let i = 0; i < ps.length; i++) {
        let fpx = 0
        let fpy = 0
        let fvx = 0
        let fvy = 0
        for (let j = 0; j < ps.length; j++) {
          if (i === j) continue
          const dx = ps[i].x - ps[j].x
          const dy = ps[i].y - ps[j].y
          const r2 = dx * dx + dy * dy
          if (r2 < h2 && r2 > 1e-12) {
            const r = Math.sqrt(r2)
            const term = (ps[i].p + ps[j].p) / (2 * ps[j].rho)
            const grad = spikyCoef * (h - r) * (h - r)
            fpx += -MASS * term * grad * (dx / r)
            fpy += -MASS * term * grad * (dy / r)

            const lap = viscCoef * (h - r)
            fvx += viscosity * MASS * (ps[j].vx - ps[i].vx) / ps[j].rho * lap
            fvy += viscosity * MASS * (ps[j].vy - ps[i].vy) / ps[j].rho * lap
          }
        }
        const fgx = 0
        const fgy = -GRAVITY * ps[i].rho
        const ax = (fpx + fvx + fgx) / ps[i].rho
        const ay = (fpy + fvy + fgy) / ps[i].rho

        ps[i].vx += ax * DT
        ps[i].vy += ay * DT
        ps[i].x += ps[i].vx * DT
        ps[i].y += ps[i].vy * DT

        const damping = -0.4
        if (ps[i].x < 0.005) {
          ps[i].x = 0.005
          ps[i].vx *= damping
        }
        if (ps[i].x > 0.995) {
          ps[i].x = 0.995
          ps[i].vx *= damping
        }
        if (ps[i].y < 0.005) {
          ps[i].y = 0.005
          ps[i].vy *= damping
        }
        if (ps[i].y > 0.995) {
          ps[i].y = 0.995
          ps[i].vy *= damping
        }
      }
    }

    const draw = () => {
      ctx.fillStyle = '#0a1628'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = '#1e3a5f'
      ctx.lineWidth = 1
      ctx.strokeRect(2, 2, W - 4, H - 4)

      const ps = particlesRef.current

      if (showField) {
        const probe = ps[0]
        if (probe) {
          const px = probe.x * W
          const py = (1 - probe.y) * H
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)'
          ctx.beginPath()
          ctx.arc(px, py, h * W, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      for (const p of ps) {
        const ratio = Math.min(Math.max((p.rho - 600) / 1200, 0), 1)
        const hue = 200 - ratio * 160
        ctx.fillStyle = `hsl(${hue}, 75%, 60%)`
        ctx.beginPath()
        ctx.arc(p.x * W, (1 - p.y) * H, 4.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let raf = 0
    const loop = () => {
      for (let k = 0; k < 5; k++) step()
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, h, stiffness, viscosity, showField])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          className="rounded border border-[var(--border)] bg-black"
        />
        <div className="flex w-full flex-col gap-3 text-sm md:max-w-xs">
          <label className="flex flex-col gap-1">
            <span>
              smoothing length h ={' '}
              <code className="text-[var(--accent)]">{h.toFixed(3)}</code>
            </span>
            <input
              type="range"
              min={0.03}
              max={0.07}
              step={0.002}
              value={h}
              onChange={(e) => setH(parseFloat(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>
              stiffness K ={' '}
              <code className="text-[var(--accent)]">{stiffness.toFixed(1)}</code>
            </span>
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={stiffness}
              onChange={(e) => setStiffness(parseFloat(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>
              viscosity mu ={' '}
              <code className="text-[var(--accent)]">{viscosity.toFixed(1)}</code>
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={viscosity}
              onChange={(e) => setViscosity(parseFloat(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showField}
              onChange={(e) => setShowField(e.target.checked)}
            />
            <span>show kernel radius (first particle)</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--accent)]/10"
            >
              {running ? 'pause' : 'play'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--accent)]/10"
            >
              reset
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            64 particles, poly6 density + spiky pressure kernel. Color encodes
            local density (blue = sparse, orange = compressed).
          </p>
        </div>
      </div>
    </div>
  )
}
