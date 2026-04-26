'use client'

import { useEffect, useRef, useState } from 'react'

type Feature = { x: number; y: number; sigma: number }

type LeafCell = {
  x: number
  y: number
  size: number
  level: number
  value: number
  gradient: number
}

const CANVAS_PX = 420

function fieldAt(x: number, y: number, features: Feature[]): number {
  let v = 0
  for (const f of features) {
    const dx = x - f.x
    const dy = y - f.y
    v += Math.exp(-(dx * dx + dy * dy) / (2 * f.sigma * f.sigma))
  }
  return v
}

function localGradient(x: number, y: number, h: number, features: Feature[]): number {
  const fx = (fieldAt(x + h, y, features) - fieldAt(x - h, y, features)) / (2 * h)
  const fy = (fieldAt(x, y + h, features) - fieldAt(x, y - h, features)) / (2 * h)
  return Math.sqrt(fx * fx + fy * fy)
}

function buildQuadtree(
  cx: number,
  cy: number,
  size: number,
  level: number,
  maxLevel: number,
  threshold: number,
  features: Feature[],
  leaves: LeafCell[],
): void {
  const grad = localGradient(cx, cy, size * 0.25, features) * size
  if (level >= maxLevel || grad < threshold) {
    const value = fieldAt(cx, cy, features)
    leaves.push({ x: cx, y: cy, size, level, value, gradient: grad })
    return
  }
  const half = size * 0.5
  const q = size * 0.25
  buildQuadtree(cx - q, cy - q, half, level + 1, maxLevel, threshold, features, leaves)
  buildQuadtree(cx + q, cy - q, half, level + 1, maxLevel, threshold, features, leaves)
  buildQuadtree(cx - q, cy + q, half, level + 1, maxLevel, threshold, features, leaves)
  buildQuadtree(cx + q, cy + q, half, level + 1, maxLevel, threshold, features, leaves)
}

function viridis(t: number): string {
  const c = Math.max(0, Math.min(1, t))
  const r = Math.round(68 + (253 - 68) * c)
  const g = Math.round(1 + (231 - 1) * c)
  const b = Math.round(84 + (37 - 84) * (c < 0.5 ? c * 2 : 2 - c * 2))
  return `rgb(${r}, ${g}, ${b})`
}

export function AMRQuadtreeRefinement() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [threshold, setThreshold] = useState(0.18)
  const [maxLevel, setMaxLevel] = useState(5)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [animating, setAnimating] = useState(true)
  const [features, setFeatures] = useState<Feature[]>([
    { x: 0.35, y: 0.5, sigma: 0.07 },
  ])
  const phaseRef = useRef(0)
  const draggingRef = useRef<number | null>(null)

  const baseDomain = 1.0

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (animating) {
        phaseRef.current += 0.012
        setFeatures((prev) => {
          if (prev.length === 0) return prev
          const ph = phaseRef.current
          const next = [...prev]
          next[0] = {
            ...next[0],
            x: 0.5 + 0.28 * Math.cos(ph),
            y: 0.5 + 0.22 * Math.sin(ph * 1.3),
          }
          return next
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animating])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const leaves: LeafCell[] = []
    buildQuadtree(0.5, 0.5, baseDomain, 0, maxLevel, threshold, features, leaves)

    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX)
    const sx = CANVAS_PX
    const sy = CANVAS_PX

    let maxV = 0
    for (const c of leaves) if (c.value > maxV) maxV = c.value
    if (maxV < 1e-6) maxV = 1

    for (const c of leaves) {
      const px = (c.x - c.size / 2) * sx
      const py = (c.y - c.size / 2) * sy
      const w = c.size * sx
      const h = c.size * sy
      if (showHeatmap) {
        ctx.fillStyle = viridis(c.value / maxV)
        ctx.fillRect(px, py, w, h)
      } else {
        ctx.fillStyle = '#0b1626'
        ctx.fillRect(px, py, w, h)
      }
      ctx.strokeStyle = showHeatmap ? 'rgba(255,255,255,0.35)' : '#22d3ee'
      ctx.lineWidth = 0.6
      ctx.strokeRect(px, py, w, h)
    }

    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    for (let i = 0; i < features.length; i++) {
      const f = features[i]
      ctx.beginPath()
      ctx.arc(f.x * sx, f.y * sy, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    const totalLeaves = leaves.length
    let maxLv = 0
    for (const c of leaves) if (c.level > maxLv) maxLv = c.level
    const uniformCount = Math.pow(4, maxLv)

    ctx.fillStyle = 'rgba(8, 17, 31, 0.85)'
    ctx.fillRect(8, 8, 195, 56)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '12px ui-monospace, Menlo, monospace'
    ctx.fillText(`leaf cells: ${totalLeaves}`, 14, 24)
    ctx.fillText(`max level: ${maxLv}`, 14, 40)
    ctx.fillText(`vs uniform ${uniformCount}: ${((100 * totalLeaves) / uniformCount).toFixed(1)}%`, 14, 56)
  }, [threshold, maxLevel, features, showHeatmap])

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>, kind: 'down' | 'move' | 'up') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (kind === 'down') {
      let nearest = -1
      let bestD = 0.05
      for (let i = 0; i < features.length; i++) {
        const f = features[i]
        const d = Math.hypot(f.x - x, f.y - y)
        if (d < bestD) {
          bestD = d
          nearest = i
        }
      }
      if (nearest >= 0) {
        draggingRef.current = nearest
        setAnimating(false)
      }
    } else if (kind === 'move' && draggingRef.current !== null) {
      const idx = draggingRef.current
      setFeatures((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)) }
        return next
      })
    } else if (kind === 'up') {
      draggingRef.current = null
    }
  }

  const addFeature = () => {
    setFeatures((prev) => [
      ...prev,
      { x: 0.5 + (Math.random() - 0.5) * 0.4, y: 0.5 + (Math.random() - 0.5) * 0.4, sigma: 0.05 + Math.random() * 0.04 },
    ])
  }

  const reset = () => {
    setFeatures([{ x: 0.35, y: 0.5, sigma: 0.07 }])
    setThreshold(0.18)
    setMaxLevel(5)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }}>
          gradient threshold: {threshold.toFixed(3)}
          <input
            type="range"
            min={0.02}
            max={0.6}
            step={0.005}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }}>
          max level: {maxLevel}
          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={maxLevel}
            onChange={(e) => setMaxLevel(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setAnimating((v) => !v)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
          {animating ? 'pause motion' : 'animate'}
        </button>
        <button onClick={() => setShowHeatmap((v) => !v)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
          {showHeatmap ? 'lines only' : 'show field'}
        </button>
        <button onClick={addFeature} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
          add feature
        </button>
        <button onClick={reset} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
          reset
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        onPointerDown={(e) => handlePointer(e, 'down')}
        onPointerMove={(e) => handlePointer(e, 'move')}
        onPointerUp={(e) => handlePointer(e, 'up')}
        onPointerLeave={(e) => handlePointer(e, 'up')}
        style={{ width: '100%', maxWidth: CANVAS_PX, aspectRatio: '1 / 1', borderRadius: 6, background: '#0b1626', cursor: 'grab', touchAction: 'none' }}
      />
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        drag the white dot to move the feature. higher threshold = coarser grid. cell count vs uniform refinement is the AMR savings.
      </div>
    </div>
  )
}
