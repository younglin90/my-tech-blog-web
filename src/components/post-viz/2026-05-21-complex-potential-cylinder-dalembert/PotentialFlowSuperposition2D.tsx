'use client'

import { useEffect, useRef, useState } from 'react'

type ElemKind = 'uniform' | 'source' | 'sink' | 'vortex' | 'doublet'

type Element = {
  kind: ElemKind
  x: number
  y: number
  strength: number
}

const PRESETS: { name: string; elems: Element[] }[] = [
  {
    name: 'Cylinder = U + doublet',
    elems: [
      { kind: 'uniform', x: 0, y: 0, strength: 1.0 },
      { kind: 'doublet', x: 0, y: 0, strength: 1.0 },
    ],
  },
  {
    name: 'Rankine half-body',
    elems: [
      { kind: 'uniform', x: 0, y: 0, strength: 1.0 },
      { kind: 'source', x: -1.0, y: 0, strength: 2.0 },
    ],
  },
  {
    name: 'Rankine oval',
    elems: [
      { kind: 'uniform', x: 0, y: 0, strength: 1.0 },
      { kind: 'source', x: -1.0, y: 0, strength: 2.0 },
      { kind: 'sink', x: 1.0, y: 0, strength: 2.0 },
    ],
  },
  {
    name: 'Lifting cylinder',
    elems: [
      { kind: 'uniform', x: 0, y: 0, strength: 1.0 },
      { kind: 'doublet', x: 0, y: 0, strength: 1.0 },
      { kind: 'vortex', x: 0, y: 0, strength: -3.0 },
    ],
  },
  {
    name: 'Vortex pair',
    elems: [
      { kind: 'vortex', x: -0.6, y: 0, strength: 2.0 },
      { kind: 'vortex', x: 0.6, y: 0, strength: -2.0 },
    ],
  },
]

export function PotentialFlowSuperposition2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [presetIdx, setPresetIdx] = useState(0)
  const [elems, setElems] = useState<Element[]>(PRESETS[0].elems)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1422'
    ctx.fillRect(0, 0, W, H)

    const xMin = -3.0
    const xMax = 3.0
    const yMin = -2.0
    const yMax = 2.0
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H

    const psiAt = (x: number, y: number) => {
      let s = 0
      for (const e of elems) {
        const dx = x - e.x
        const dy = y - e.y
        const r2 = dx * dx + dy * dy
        if (r2 < 1e-6) return NaN
        const r = Math.sqrt(r2)
        const theta = Math.atan2(dy, dx)
        if (e.kind === 'uniform') s += e.strength * y
        else if (e.kind === 'source') s += (e.strength / (2 * Math.PI)) * theta
        else if (e.kind === 'sink') s -= (e.strength / (2 * Math.PI)) * theta
        else if (e.kind === 'vortex') s -= (e.strength / (2 * Math.PI)) * Math.log(r)
        else if (e.kind === 'doublet') s -= (e.strength * dy) / r2
      }
      return s
    }

    const Nx = 220
    const Ny = 150
    const dx = (xMax - xMin) / Nx
    const dy = (yMax - yMin) / Ny
    const grid: number[][] = []
    for (let i = 0; i <= Nx; i++) {
      grid.push([])
      const x = xMin + i * dx
      for (let j = 0; j <= Ny; j++) {
        const y = yMin + j * dy
        grid[i].push(psiAt(x, y))
      }
    }

    const drawContour = (level: number, color: string, width: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      for (let i = 0; i < Nx; i++) {
        const x0 = xMin + i * dx
        const x1 = xMin + (i + 1) * dx
        for (let j = 0; j < Ny; j++) {
          const y0 = yMin + j * dy
          const y1 = yMin + (j + 1) * dy
          const v00 = grid[i][j]
          const v10 = grid[i + 1][j]
          const v01 = grid[i][j + 1]
          const v11 = grid[i + 1][j + 1]
          if (!isFinite(v00) || !isFinite(v10) || !isFinite(v01) || !isFinite(v11)) continue
          const pts: [number, number][] = []
          const seg = (vA: number, vB: number, xA: number, yA: number, xB: number, yB: number) => {
            if ((vA - level) * (vB - level) < 0) {
              const t = (level - vA) / (vB - vA)
              pts.push([xA + t * (xB - xA), yA + t * (yB - yA)])
            }
          }
          seg(v00, v10, x0, y0, x1, y0)
          seg(v10, v11, x1, y0, x1, y1)
          seg(v11, v01, x1, y1, x0, y1)
          seg(v01, v00, x0, y1, x0, y0)
          if (pts.length >= 2) {
            ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]))
            ctx.lineTo(sx(pts[1][0]), sy(pts[1][1]))
          }
        }
      }
      ctx.stroke()
    }

    for (let k = -16; k <= 16; k++) {
      const level = k * 0.18
      drawContour(level, k === 0 ? '#22d3ee' : 'rgba(34, 211, 238, 0.7)', k === 0 ? 1.8 : 1)
    }

    const colors: Record<ElemKind, string> = {
      uniform: '#f59e0b',
      source: '#34d399',
      sink: '#f472b6',
      vortex: '#a78bfa',
      doublet: '#fbbf24',
    }
    for (const e of elems) {
      if (e.kind === 'uniform') continue
      ctx.fillStyle = colors[e.kind]
      ctx.beginPath()
      ctx.arc(sx(e.x), sy(e.y), 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(e.kind, sx(e.x) + 8, sy(e.y) - 8)
    }
  }, [elems])

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 14,
      background: 'var(--surface)',
      margin: '16px 0'
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 360, display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => { setPresetIdx(i); setElems(p.elems) }}
            style={{
              padding: '5px 11px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: presetIdx === i ? 'var(--accent)' : 'transparent',
              color: presetIdx === i ? '#0b1422' : 'var(--text)',
              cursor: 'pointer',
              fontSize: 12,
            }}>
            {p.name}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Each preset is a sum of elementary flows. The same machinery — superposition of ψ — builds half-bodies, ovals, and lifting cylinders.
      </p>
    </div>
  )
}
