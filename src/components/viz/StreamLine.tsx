'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  particles?: number
  speed?: number
  obstacle?: 'none' | 'cylinder' | 'airfoil'
}

interface Particle {
  x: number
  y: number
  life: number
  maxLife: number
}

export function StreamLine({ particles = 50, speed = 1.0, obstacle = 'none' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [obs, setObs] = useState<'none' | 'cylinder' | 'airfoil'>(obstacle)
  const [spd, setSpd] = useState(speed)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const CX = W * 0.4
    const CY = H * 0.5
    const R = 40  // obstacle radius

    function isInsideObstacle(x: number, y: number): boolean {
      if (obs === 'none') return false
      if (obs === 'cylinder') {
        return Math.hypot(x - CX, y - CY) < R
      }
      if (obs === 'airfoil') {
        // Simplified NACA-like shape check
        const lx = x - (CX - R)
        const ly = y - CY
        if (lx < 0 || lx > R * 2.5) return false
        const t = lx / (R * 2.5)
        const thickness = R * 0.5 * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t * t * t - 0.1015 * t * t * t * t)
        return Math.abs(ly) < thickness
      }
      return false
    }

    function getVelocity(x: number, y: number): [number, number] {
      if (obs === 'cylinder') {
        const dx = x - CX
        const dy = y - CY
        const r2 = dx * dx + dy * dy
        const R2 = R * R
        if (r2 < R2) return [0, 0]
        const factor = R2 / r2
        const ux = 1 - factor * (dx * dx - dy * dy) / r2
        const uy = -factor * (2 * dx * dy) / r2
        return [ux, uy]
      }
      return [1, 0]
    }

    const ptcls: Particle[] = Array.from({ length: particles }, () => ({
      x: Math.random() * W * 0.2,
      y: Math.random() * H,
      life: Math.random() * 100,
      maxLife: 80 + Math.random() * 60,
    }))

    const loop = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'
      ctx.fillRect(0, 0, W, H)

      for (const p of ptcls) {
        if (p.life >= p.maxLife || p.x > W || p.x < 0 || p.y > H || p.y < 0) {
          p.x = Math.random() * W * 0.1
          p.y = Math.random() * H
          p.life = 0
          p.maxLife = 80 + Math.random() * 60
        }

        const [ux, uy] = getVelocity(p.x, p.y)
        const nx = p.x + ux * spd * 2
        const ny = p.y + uy * spd * 2

        if (!isInsideObstacle(nx, ny)) {
          const alpha = 1 - p.life / p.maxLife
          ctx.strokeStyle = `rgba(99, 179, 237, ${alpha * 0.8})`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(nx, ny)
          ctx.stroke()
          p.x = nx
          p.y = ny
        }
        p.life++
      }

      // Draw obstacle
      if (obs === 'cylinder') {
        ctx.fillStyle = '#475569'
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(CX, CY, R, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(loop)
    }

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)
    animRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(animRef.current)
  }, [obs, spd, particles])

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-zinc-700 bg-slate-900">
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-800 text-sm text-zinc-300">
        <span className="font-mono">유선 시각화</span>
        <label className="flex items-center gap-2">
          <span>장애물:</span>
          <select
            value={obs}
            onChange={(e) => setObs(e.target.value as typeof obs)}
            className="bg-slate-700 rounded px-2 py-0.5 text-xs"
          >
            <option value="none">없음</option>
            <option value="cylinder">원형 실린더</option>
            <option value="airfoil">에어포일</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>속도:</span>
          <input
            type="range" min={0.1} max={2.0} step={0.1}
            value={spd} onChange={(e) => setSpd(Number(e.target.value))}
            className="w-24"
          />
          <span className="font-mono w-6">{spd.toFixed(1)}</span>
        </label>
      </div>
      <canvas ref={canvasRef} width={600} height={300} className="w-full" />
    </div>
  )
}
