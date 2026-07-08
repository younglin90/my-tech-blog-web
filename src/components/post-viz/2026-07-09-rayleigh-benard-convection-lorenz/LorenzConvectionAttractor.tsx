'use client'

import { useEffect, useRef, useState } from 'react'

// Lorenz-63 system as the low-order truncation of Rayleigh-Benard convection.
//   dx/dt = sigma (y - x)          x ~ roll circulation strength
//   dy/dt = x (rho - z) - y        y ~ horizontal temperature contrast
//   dz/dt = x y - beta z           z ~ vertical temperature distortion
// rho plays the role of the reduced Rayleigh number Ra/Ra_c.
//   rho < 1        -> origin stable        (conduction, no motion)
//   1 < rho < 24.74 -> off-origin fixed pt (steady convection roll)
//   rho > 24.74    -> chaotic butterfly    (turbulent convection)

const SIGMA = 10
const BETA = 8 / 3
const RHO_CHAOS = 24.74

type Vec3 = { x: number; y: number; z: number }

function rk4(s: Vec3, rho: number, dt: number): Vec3 {
  const f = (p: Vec3): Vec3 => ({
    x: SIGMA * (p.y - p.x),
    y: p.x * (rho - p.z) - p.y,
    z: p.x * p.y - BETA * p.z,
  })
  const add = (a: Vec3, b: Vec3, h: number): Vec3 => ({
    x: a.x + b.x * h,
    y: a.y + b.y * h,
    z: a.z + b.z * h,
  })
  const k1 = f(s)
  const k2 = f(add(s, k1, dt / 2))
  const k3 = f(add(s, k2, dt / 2))
  const k4 = f(add(s, k3, dt))
  return {
    x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: s.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  }
}

export function LorenzConvectionAttractor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rho, setRho] = useState(28)
  const rhoRef = useRef(28)
  const stateRef = useRef<Vec3>({ x: 0.6, y: 0.4, z: 0.2 })
  const trailRef = useRef<Array<{ x: number; z: number }>>([])
  const rafRef = useRef<number>(0)

  rhoRef.current = rho

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    // world -> screen (x in [-25,25], z in [0,55])
    const sx = (x: number) => W / 2 + (x / 25) * (W / 2 - 20)
    const sy = (z: number) => H - 14 - (z / 55) * (H - 28)

    const step = () => {
      const rho = rhoRef.current
      // several integration substeps per frame for a smooth curve
      const trail = trailRef.current
      for (let i = 0; i < 12; i++) {
        stateRef.current = rk4(stateRef.current, rho, 0.006)
        trail.push({ x: stateRef.current.x, z: stateRef.current.z })
      }
      while (trail.length > 2600) trail.shift()

      ctx.fillStyle = 'rgba(8,17,31,0.28)'
      ctx.fillRect(0, 0, W, H)

      // fixed points C+ / C- for rho > 1
      if (rho > 1) {
        const fp = Math.sqrt(BETA * (rho - 1))
        ctx.fillStyle = 'rgba(255,220,120,0.9)'
        for (const xf of [fp, -fp]) {
          ctx.beginPath()
          ctx.arc(sx(xf), sy(rho - 1), 3.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // trajectory
      ctx.lineWidth = 1.1
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1]
        const b = trail[i]
        const alpha = i / trail.length
        ctx.strokeStyle = `rgba(34,211,238,${0.15 + alpha * 0.7})`
        ctx.beginPath()
        ctx.moveTo(sx(a.x), sy(a.z))
        ctx.lineTo(sx(b.x), sy(b.z))
        ctx.stroke()
      }

      // moving head
      const head = trail[trail.length - 1]
      if (head) {
        ctx.fillStyle = '#f8fafc'
        ctx.beginPath()
        ctx.arc(sx(head.x), sy(head.z), 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const reset = () => {
    stateRef.current = { x: 0.6, y: 0.4, z: 0.2 }
    trailRef.current = []
  }

  let regime = ''
  if (rho < 1) regime = '전도 — 원점으로 수렴 (conduction)'
  else if (rho < RHO_CHAOS) regime = '정상 대류 — 고정점으로 수렴 (steady roll)'
  else regime = '카오스 — 나비 날개 (chaotic convection)'

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
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#08111f' }}
      />
      <div style={{ marginTop: 12, fontSize: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 92, fontFamily: 'monospace' }}>ρ (Ra/Ra_c) = {rho.toFixed(1)}</span>
          <input
            type="range"
            min={0.5}
            max={40}
            step={0.1}
            value={rho}
            onChange={(e) => {
              setRho(parseFloat(e.target.value))
              reset()
            }}
            style={{ flex: 1, minWidth: 160 }}
          />
          <button
            onClick={reset}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid var(--border, #24425a)',
              background: 'transparent',
              color: 'var(--text, #e2e8f0)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            reset
          </button>
        </label>
        <div style={{ marginTop: 8, opacity: 0.85, color: 'var(--accent, #22d3ee)', fontWeight: 600 }}>
          {regime}
        </div>
        <div style={{ marginTop: 4, opacity: 0.6, fontSize: 12 }}>
          가로축 x = 롤 순환 세기, 세로축 z = 수직 온도 왜곡. 노란 점 = 고정점 C±.
        </div>
      </div>
    </div>
  )
}
