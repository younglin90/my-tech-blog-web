'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  reynolds?: number
  animated?: boolean
  gridSize?: number
}

export function VelocityField({ reynolds = 100, animated = true, gridSize = 20 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [re, setRe] = useState(reynolds)
  const [time, setTime] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const dx = W / gridSize
    const dy = H / gridSize

    function drawField(t: number) {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = (i + 0.5) * dx
          const y = (j + 0.5) * dy
          // Normalized coords [-1, 1]
          const nx = (x / W) * 2 - 1
          const ny = (y / H) * 2 - 1

          // Simplified Poiseuille + perturbation based on Re
          const perturbation = re > 500 ? 0.3 * Math.sin(ny * 4 + t * 2) : 0
          const ux = (1 - ny * ny) + perturbation
          const uy = (re / 2000) * Math.sin(nx * Math.PI + t) * (1 - ny * ny)

          const mag = Math.sqrt(ux * ux + uy * uy)
          const len = Math.min(dx * 0.4, mag * 20)
          const angle = Math.atan2(uy, ux)

          // Color by magnitude
          const hue = 240 - mag * 180
          ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`
          ctx.lineWidth = 1.5

          const ex = x + Math.cos(angle) * len
          const ey = y + Math.sin(angle) * len

          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(ex, ey)
          // Arrowhead
          ctx.lineTo(ex - 5 * Math.cos(angle - 0.4), ey - 5 * Math.sin(angle - 0.4))
          ctx.moveTo(ex, ey)
          ctx.lineTo(ex - 5 * Math.cos(angle + 0.4), ey - 5 * Math.sin(angle + 0.4))
          ctx.stroke()
        }
      }
    }

    if (animated) {
      let t = 0
      const loop = () => {
        t += 0.03
        setTime(t)
        drawField(t)
        animRef.current = requestAnimationFrame(loop)
      }
      animRef.current = requestAnimationFrame(loop)
    } else {
      drawField(time)
    }

    return () => cancelAnimationFrame(animRef.current)
  }, [re, animated, gridSize])

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-zinc-700 bg-slate-900">
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-800 text-sm text-zinc-300">
        <span className="font-mono">속도장 시각화</span>
        <label className="flex items-center gap-2 ml-auto">
          <span>Re =</span>
          <input
            type="range"
            min={10}
            max={2000}
            value={re}
            onChange={(e) => setRe(Number(e.target.value))}
            className="w-32"
          />
          <span className="font-mono w-12 text-right">{re}</span>
        </label>
      </div>
      <canvas ref={canvasRef} width={600} height={300} className="w-full" />
    </div>
  )
}
