'use client'

import { useEffect, useRef, useState } from 'react'

// Eddy cascade visualization: large eddies break into smaller ones,
// turnover time scales as tau_l ~ l^(2/3) (eps fixed).
// Energy flux eps = u_l^3 / l is constant down the cascade.

type Eddy = {
  x: number
  y: number
  vx: number
  vy: number
  level: number // 0 = large, 1 = medium, 2 = small, 3 = dissipated
  birth: number
  phase: number
  spin: number // angular velocity sign
}

const LEVEL_SIZES = [56, 22, 8.5, 3] // radii at each cascade level

function spawnEddy(level: number, t: number, rng: () => number): Eddy {
  return {
    x: 60 + rng() * 540,
    y: 40 + rng() * 200,
    vx: (rng() - 0.5) * 0.4,
    vy: (rng() - 0.5) * 0.4,
    level,
    birth: t,
    phase: rng() * Math.PI * 2,
    spin: rng() < 0.5 ? -1 : 1,
  }
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function EddyCascadeBreakup() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1.0)
  const runningRef = useRef(running)
  const speedRef = useRef(speed)

  useEffect(() => {
    runningRef.current = running
  }, [running])
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rng = mulberry32(42)
    let eddies: Eddy[] = []
    let t = 0
    // turnover times: tau_l ~ l^(2/3), so larger eddies live longer.
    // Use lifetime proportional to (size)^(2/3) with arbitrary unit.
    const lifetime = LEVEL_SIZES.map((s) => Math.pow(s / LEVEL_SIZES[0], 2 / 3) * 4.5)

    for (let i = 0; i < 3; i++) eddies.push(spawnEddy(0, 0, rng))

    let raf = 0
    let lastTs = 0

    const draw = (ts: number) => {
      const dt = lastTs === 0 ? 16 : ts - lastTs
      lastTs = ts
      const effectiveDt = (runningRef.current ? dt : 0) * 0.001 * speedRef.current
      t += effectiveDt

      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = 'rgba(8, 17, 31, 0.18)'
      ctx.fillRect(0, 0, W, H)

      const newborn: Eddy[] = []
      eddies = eddies.filter((e) => {
        const age = t - e.birth
        const life = lifetime[e.level]
        if (age > life) {
          if (e.level < LEVEL_SIZES.length - 1) {
            const nChildren = e.level === 0 ? 4 : 3
            for (let c = 0; c < nChildren; c++) {
              const r = LEVEL_SIZES[e.level] * 0.6
              const ang = (c / nChildren) * Math.PI * 2 + rng() * 0.5
              newborn.push({
                x: e.x + Math.cos(ang) * r * 0.6,
                y: e.y + Math.sin(ang) * r * 0.6,
                vx: e.vx + Math.cos(ang) * 0.4,
                vy: e.vy + Math.sin(ang) * 0.4,
                level: e.level + 1,
                birth: t,
                phase: rng() * Math.PI * 2,
                spin: rng() < 0.5 ? -1 : 1,
              })
            }
          }
          return false
        }
        e.x += e.vx * effectiveDt * 30
        e.y += e.vy * effectiveDt * 30
        if (e.x < 30 || e.x > W - 30) e.vx *= -1
        if (e.y < 30 || e.y > H - 30) e.vy *= -1
        return true
      })
      eddies.push(...newborn)

      // Replenish large eddies from above
      const nLarge = eddies.filter((e) => e.level === 0).length
      while (nLarge + (newborn.filter((e) => e.level === 0).length) < 3) {
        eddies.push(spawnEddy(0, t, rng))
        break
      }

      // draw
      const colors = ['rgba(34,211,238,0.45)', 'rgba(248,180,80,0.55)', 'rgba(244,114,182,0.6)', 'rgba(160,160,160,0.35)']
      for (const e of eddies) {
        const r = LEVEL_SIZES[e.level]
        const omega = e.spin * Math.pow(LEVEL_SIZES[0] / r, 2 / 3) * 1.2
        const ang = e.phase + omega * t
        // Body
        ctx.strokeStyle = colors[e.level]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
        ctx.stroke()
        // Indicator
        ctx.beginPath()
        ctx.moveTo(e.x, e.y)
        ctx.lineTo(e.x + Math.cos(ang) * r, e.y + Math.sin(ang) * r)
        ctx.stroke()
      }

      // legend
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      const labels = ['L  (integral)', 'l  (inertial)', 'l  (near η)', 'η  (dissipative)']
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i]
        ctx.fillText(`● ${labels[i]}`, 14, 20 + i * 16)
      }
      ctx.fillStyle = 'rgba(180,200,225,0.7)'
      ctx.textAlign = 'right'
      ctx.fillText(`t = ${t.toFixed(1)}`, W - 12, 20)
      ctx.fillText('ε = const (energy flux down the cascade)', W - 12, 36)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        margin: '1.5rem 0',
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
        Each eddy lives a turnover time τ ∝ ℓ^(2/3), then splits into smaller
        ones. The smallest eddies (gray) dissipate as heat.
      </div>
      <canvas
        ref={canvasRef}
        width={620}
        height={280}
        style={{ width: '100%', maxWidth: 620, display: 'block', background: '#08111f' }}
      />
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginTop: 12,
          fontSize: 13,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '0.35rem 0.8rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {running ? 'pause' : 'play'}
        </button>
        <label style={{ flex: 1, minWidth: 200 }}>
          time speed: <strong>{speed.toFixed(1)}×</strong>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
    </div>
  )
}
