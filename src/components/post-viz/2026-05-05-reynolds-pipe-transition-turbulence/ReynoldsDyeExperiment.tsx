'use client'

import { useEffect, useRef, useState } from 'react'

const PIPE_RADIUS = 0.42
const N_EMIT_PER_FRAME = 4
const MAX_PARTICLES = 900
const DT = 0.016

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  alive: boolean
}

function emit(p: Particle) {
  p.x = 0.02
  p.y = 0.5 + (Math.random() - 0.5) * 0.012
  p.vx = 0
  p.vy = 0
  p.age = 0
  p.alive = true
}

function laminarVx(y: number, Umax: number) {
  const r = (y - 0.5) / PIPE_RADIUS
  if (Math.abs(r) >= 1) return 0
  return Umax * (1 - r * r)
}

function step(particles: Particle[], Re: number, t: number) {
  const Umax = 0.6
  const reCrit = 2300
  const turbStrength = Math.max(0, (Re - reCrit) / 4500)
  const intermittency = Re < reCrit ? 0 : Math.min(1, (Re - reCrit) / 1200)

  for (const p of particles) {
    if (!p.alive) continue

    const vxMean = laminarVx(p.y, Umax)
    let vyPerturb = 0
    let vxPerturb = 0

    if (intermittency > 0) {
      const k1 = 18 + (Re % 7) * 0.4
      const k2 = 31 + (Re % 11) * 0.3
      const wave =
        Math.sin(k1 * p.x - 6 * t + p.y * 9) +
        0.6 * Math.sin(k2 * p.x - 4 * t - p.y * 14)
      const burst = intermittency * (0.5 + 0.5 * Math.sin(2.1 * p.x * 6 - t * 3))
      vyPerturb = 0.18 * turbStrength * wave * burst
      vxPerturb = 0.08 * turbStrength * Math.sin(k2 * p.x + t * 2.7)

      vyPerturb += 0.04 * turbStrength * (Math.random() - 0.5)
      vxPerturb += 0.04 * turbStrength * (Math.random() - 0.5)
    }

    p.vx = vxMean + vxPerturb
    p.vy = vyPerturb

    p.x += p.vx * DT
    p.y += p.vy * DT
    p.age += DT

    const r = (p.y - 0.5) / PIPE_RADIUS
    if (Math.abs(r) > 0.98) {
      p.y = 0.5 + Math.sign(r) * PIPE_RADIUS * 0.96
      p.vy *= -0.3
    }

    if (p.x > 1.0 || p.age > 3.5) p.alive = false
  }
}

function pickFreeSlot(particles: Particle[]): Particle | null {
  for (const p of particles) if (!p.alive) return p
  return null
}

export function ReynoldsDyeExperiment() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [Re, setRe] = useState(1500)
  const [running, setRunning] = useState(true)
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0,
      y: 0.5,
      vx: 0,
      vy: 0,
      age: 0,
      alive: false,
    })),
  )
  const tRef = useRef(0)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (running) {
        for (let k = 0; k < N_EMIT_PER_FRAME; k++) {
          const p = pickFreeSlot(particlesRef.current)
          if (p) emit(p)
        }
        step(particlesRef.current, Re, tRef.current)
        tRef.current += DT
      }
      draw(canvasRef.current, particlesRef.current, Re, tRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, Re])

  const reset = () => {
    for (const p of particlesRef.current) p.alive = false
    tRef.current = 0
  }

  let regime: { label: string; color: string }
  if (Re < 2300) regime = { label: 'Laminar', color: '#22d3ee' }
  else if (Re < 4000) regime = { label: 'Transitional', color: '#fbbf24' }
  else regime = { label: 'Turbulent', color: '#ef4444' }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={760}
        height={300}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 260px' }}>
          <span style={{ marginBottom: 4 }}>
            Reynolds number Re = U·d/ν: <strong>{Re}</strong>
          </span>
          <input type="range" min={500} max={8000} step={50} value={Re} onChange={(e) => setRe(parseInt(e.target.value, 10))} />
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn}>
          {running ? 'Pause' : 'Play'}
        </button>
        <button onClick={reset} style={btn}>
          Reset
        </button>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: `${regime.color}26`,
            color: regime.color,
            fontWeight: 600,
          }}
        >
          {regime.label} (Re_crit ≈ 2300)
        </span>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  cursor: 'pointer',
}

function draw(c: HTMLCanvasElement | null, particles: Particle[], Re: number, t: number) {
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const W = c.width
  const H = c.height

  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, W, H)

  const pipeTop = (0.5 - PIPE_RADIUS) * H
  const pipeBot = (0.5 + PIPE_RADIUS) * H

  ctx.fillStyle = 'rgba(148,163,184,0.06)'
  ctx.fillRect(0, pipeTop, W, pipeBot - pipeTop)

  ctx.strokeStyle = 'rgba(148,163,184,0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, pipeTop)
  ctx.lineTo(W, pipeTop)
  ctx.moveTo(0, pipeBot)
  ctx.lineTo(W, pipeBot)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText('dye injector', 8, pipeTop - 8)
  ctx.fillStyle = '#22d3ee'
  ctx.fillRect(0, 0.5 * H - 3, 14, 6)

  for (const p of particles) {
    if (!p.alive) continue
    const x = p.x * W
    const y = p.y * H
    const fade = Math.max(0, 1 - p.age / 3.0)
    let color: string
    if (Re < 2300) color = `rgba(34,211,238,${0.85 * fade})`
    else if (Re < 4000) color = `rgba(251,191,36,${0.85 * fade})`
    else color = `rgba(239,68,68,${0.85 * fade})`
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 1.7, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(148,163,184,0.9)'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText(`t = ${t.toFixed(2)} s`, W - 100, 20)
  ctx.fillText(`Re = ${Re}`, W - 100, 38)
}
