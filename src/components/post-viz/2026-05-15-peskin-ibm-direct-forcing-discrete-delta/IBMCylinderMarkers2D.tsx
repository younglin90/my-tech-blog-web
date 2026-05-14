'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type KernelKind = 'hat2' | 'peskin4'

function peskin4(r: number) {
  const a = Math.abs(r)
  if (a < 1) return (3 - 2 * a + Math.sqrt(1 + 4 * a - 4 * a * a)) / 8
  if (a < 2) {
    const t = -7 + 12 * a - 4 * a * a
    return (5 - 2 * a - Math.sqrt(Math.max(t, 0))) / 8
  }
  return 0
}

function hat2(r: number) {
  const a = Math.abs(r)
  return a < 1 ? 1 - a : 0
}

function deltaH(kind: KernelKind, r: number) {
  return kind === 'peskin4' ? peskin4(r) : hat2(r)
}

export function IBMCylinderMarkers2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [nMarkers, setNMarkers] = useState(24)
  const [kernel, setKernel] = useState<KernelKind>('peskin4')
  const [showWeights, setShowWeights] = useState(true)
  const N = 32

  const markers = useMemo(() => {
    const cx = N / 2
    const cy = N / 2
    const R = N * 0.25
    return Array.from({ length: nMarkers }, (_, k) => {
      const theta = (2 * Math.PI * k) / nMarkers
      return { x: cx + R * Math.cos(theta), y: cy + R * Math.sin(theta) }
    })
  }, [nMarkers])

  const grid = useMemo(() => {
    const w = new Float32Array(N * N)
    for (const m of markers) {
      const i0 = Math.floor(m.x)
      const j0 = Math.floor(m.y)
      const sup = kernel === 'peskin4' ? 2 : 1
      for (let dj = -sup; dj <= sup + 1; dj++) {
        for (let di = -sup; di <= sup + 1; di++) {
          const ii = i0 + di
          const jj = j0 + dj
          if (ii < 0 || ii >= N || jj < 0 || jj >= N) continue
          const wx = deltaH(kernel, ii - m.x)
          const wy = deltaH(kernel, jj - m.y)
          w[jj * N + ii] += wx * wy
        }
      }
    }
    return w
  }, [markers, kernel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const cell = Math.min(W, H) / N

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, W, H)

    let maxW = 0
    for (let i = 0; i < grid.length; i++) if (grid[i] > maxW) maxW = grid[i]
    if (maxW < 1e-9) maxW = 1

    if (showWeights) {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const w = grid[j * N + i] / maxW
          if (w < 0.01) continue
          const r = Math.round(34 + 200 * w)
          const g = Math.round(211 - 100 * (1 - w))
          const b = Math.round(238 - 60 * (1 - w))
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + 0.7 * w})`
          ctx.fillRect(i * cell, j * cell, cell, cell)
        }
      }
    }

    ctx.strokeStyle = '#1f2c44'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= N; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cell, 0)
      ctx.lineTo(i * cell, H)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cell)
      ctx.lineTo(W, i * cell)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc((N / 2) * cell, (N / 2) * cell, N * 0.25 * cell, 0, Math.PI * 2)
    ctx.stroke()

    for (const m of markers) {
      ctx.beginPath()
      ctx.arc(m.x * cell, m.y * cell, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.strokeStyle = '#fde68a'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    ctx.fillStyle = '#cfe9f5'
    ctx.font = '11px ui-sans-serif'
    ctx.textAlign = 'left'
    let nonzero = 0
    for (let i = 0; i < grid.length; i++) if (grid[i] > 1e-6) nonzero++
    ctx.fillText(`${nMarkers} markers · ${nonzero} grid cells touched`, 8, 16)
  }, [grid, markers, showWeights, nMarkers])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 180, flex: 1 }}>
          <span>Markers around the circle: {nMarkers}</span>
          <input type="range" min={6} max={64} step={1} value={nMarkers} onChange={(e) => setNMarkers(parseInt(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setKernel('hat2')}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', borderRadius: 4, border: '1px solid var(--border)', background: kernel === 'hat2' ? 'var(--accent)' : 'transparent', color: kernel === 'hat2' ? '#0b1424' : 'var(--text)', cursor: 'pointer' }}
          >
            2-point hat
          </button>
          <button
            onClick={() => setKernel('peskin4')}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', borderRadius: 4, border: '1px solid var(--border)', background: kernel === 'peskin4' ? 'var(--accent)' : 'transparent', color: kernel === 'peskin4' ? '#0b1424' : 'var(--text)', cursor: 'pointer' }}
          >
            4-point Peskin
          </button>
          <button
            onClick={() => setShowWeights((s) => !s)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
          >
            {showWeights ? 'Hide spread' : 'Show spread'}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} width={400} height={400} style={{ width: '100%', maxWidth: 480, height: 'auto', borderRadius: 6, display: 'block', margin: '0 auto' }} />
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
        Orange dots are Lagrangian markers traced along the circle. The cyan halo is the total spreading weight Σ<sub>l</sub> δ<sub>h</sub>(x − X<sub>l</sub>) on each Eulerian cell. Increase markers until the band is uniform — that is the rule of thumb &Delta;s &lt; h.
      </p>
    </div>
  )
}
