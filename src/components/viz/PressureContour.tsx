'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  levels?: number
  colormap?: 'viridis' | 'plasma' | 'coolwarm'
}

const COLORMAPS = {
  viridis: [
    [68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37],
  ],
  plasma: [
    [13, 8, 135], [126, 3, 168], [204, 71, 120], [248, 149, 64], [240, 249, 33],
  ],
  coolwarm: [
    [59, 76, 192], [103, 155, 221], [221, 221, 221], [245, 160, 105], [180, 4, 38],
  ],
}

function interpolateColor(t: number, map: number[][]): string {
  const n = map.length - 1
  const i = Math.floor(t * n)
  const f = t * n - i
  const c0 = map[Math.min(i, n)]
  const c1 = map[Math.min(i + 1, n)]
  const r = Math.round(c0[0] + f * (c1[0] - c0[0]))
  const g = Math.round(c0[1] + f * (c1[1] - c0[1]))
  const b = Math.round(c0[2] + f * (c1[2] - c0[2]))
  return `rgb(${r},${g},${b})`
}

export function PressureContour({ levels = 10, colormap = 'viridis' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cmap, setCmap] = useState<'viridis' | 'plasma' | 'coolwarm'>(colormap)
  const [lvl, setLvl] = useState(levels)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const map = COLORMAPS[cmap]

    // Compute pressure field: cylinder in channel (simplified potential flow)
    const CX = W * 0.4
    const CY = H * 0.5
    const R = 50

    const imageData = ctx.createImageData(W, H)
    let minP = Infinity, maxP = -Infinity
    const field: number[] = new Array(W * H)

    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const dx = i - CX
        const dy = j - CY
        const r2 = dx * dx + dy * dy
        const R2 = R * R
        // Simplified pressure: stagnation at front, low pressure at top/bottom
        const p = r2 > R2
          ? -(dx / W) + 0.5 * R2 * (dx * dx - dy * dy) / (r2 * r2)
          : 0
        field[j * W + i] = p
        if (r2 > R2) { minP = Math.min(minP, p); maxP = Math.max(maxP, p) }
      }
    }

    const range = maxP - minP || 1

    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const dx = i - CX
        const dy = j - CY
        const r2 = dx * dx + dy * dy
        const idx = (j * W + i) * 4
        if (r2 < R * R) {
          imageData.data[idx] = 71; imageData.data[idx+1] = 85; imageData.data[idx+2] = 105
          imageData.data[idx+3] = 255
          continue
        }
        const t = (field[j * W + i] - minP) / range
        const [r, g, b] = map[Math.round(t * (map.length - 1))]
        imageData.data[idx] = r; imageData.data[idx+1] = g; imageData.data[idx+2] = b
        imageData.data[idx+3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Draw contour lines
    ctx.globalAlpha = 0.4
    for (let l = 0; l < lvl; l++) {
      const threshold = minP + (l / lvl) * range
      const t = l / (lvl - 1)
      const color = interpolateColor(t, map)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      // Simple marching squares approximation (vertical strips)
      ctx.beginPath()
      for (let j = 1; j < H - 1; j++) {
        for (let i = 1; i < W - 1; i++) {
          const v = field[j * W + i]
          const vr = field[j * W + i + 1]
          if ((v - threshold) * (vr - threshold) < 0) {
            const dx = i - CX, dy = j - CY
            if (dx * dx + dy * dy > R * R) {
              ctx.moveTo(i, j); ctx.lineTo(i+1, j)
            }
          }
        }
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Cylinder outline
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke()

    // Colorbar
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = interpolateColor(i / 120, map)
      ctx.fillRect(W - 30, H - 20 - i, 15, 2)
    }
    ctx.fillStyle = '#cbd5e1'; ctx.font = '10px monospace'
    ctx.fillText('Hi', W - 28, H - 145)
    ctx.fillText('Lo', W - 28, H - 15)

  }, [cmap, lvl])

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-zinc-700 bg-slate-900">
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-800 text-sm text-zinc-300">
        <span className="font-mono">압력 등고선</span>
        <label className="flex items-center gap-2">
          <span>컬러맵:</span>
          <select value={cmap} onChange={(e) => setCmap(e.target.value as typeof cmap)}
            className="bg-slate-700 rounded px-2 py-0.5 text-xs">
            <option value="viridis">Viridis</option>
            <option value="plasma">Plasma</option>
            <option value="coolwarm">Coolwarm</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>등고선:</span>
          <input type="range" min={3} max={20} value={lvl}
            onChange={(e) => setLvl(Number(e.target.value))} className="w-20" />
          <span className="font-mono">{lvl}</span>
        </label>
      </div>
      <canvas ref={canvasRef} width={600} height={300} className="w-full" />
    </div>
  )
}
