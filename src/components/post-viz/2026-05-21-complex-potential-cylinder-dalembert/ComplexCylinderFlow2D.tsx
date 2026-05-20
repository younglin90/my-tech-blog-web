'use client'

import { useEffect, useRef, useState } from 'react'

type View = 'stream' | 'equipotential' | 'both'

export function ComplexCylinderFlow2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [U, setU] = useState(1.0)
  const [m, setM] = useState(1.0)
  const [Gamma, setGamma] = useState(0.0)
  const [view, setView] = useState<View>('both')

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

    const R = U > 1e-6 ? Math.sqrt(m / U) : 0

    const psi = (x: number, y: number) => {
      const r2 = x * x + y * y
      if (r2 < 1e-8) return 0
      const r = Math.sqrt(r2)
      const sinT = y / r
      const lnr = Math.log(r)
      return U * (r - (R * R) / r) * sinT + (Gamma / (2 * Math.PI)) * lnr
    }

    const phi = (x: number, y: number) => {
      const r2 = x * x + y * y
      if (r2 < 1e-8) return 0
      const r = Math.sqrt(r2)
      const cosT = x / r
      const theta = Math.atan2(y, x)
      return U * (r + (R * R) / r) * cosT + (Gamma / (2 * Math.PI)) * theta
    }

    const Nx = 220
    const Ny = 150
    const dx = (xMax - xMin) / Nx
    const dy = (yMax - yMin) / Ny
    const gridPsi: number[][] = []
    const gridPhi: number[][] = []
    for (let i = 0; i <= Nx; i++) {
      gridPsi.push([])
      gridPhi.push([])
      const x = xMin + i * dx
      for (let j = 0; j <= Ny; j++) {
        const y = yMin + j * dy
        const r2 = x * x + y * y
        if (R > 0 && r2 < R * R) {
          gridPsi[i].push(NaN)
          gridPhi[i].push(NaN)
        } else {
          gridPsi[i].push(psi(x, y))
          gridPhi[i].push(phi(x, y))
        }
      }
    }

    const drawContour = (
      grid: number[][],
      level: number,
      color: string,
      width: number
    ) => {
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

    const showStream = view === 'stream' || view === 'both'
    const showEqui = view === 'equipotential' || view === 'both'

    if (showEqui) {
      for (let k = -10; k <= 10; k++) {
        if (k === 0) continue
        drawContour(gridPhi, k * 0.5, 'rgba(244, 114, 182, 0.45)', 1)
      }
    }
    if (showStream) {
      for (let k = -12; k <= 12; k++) {
        drawContour(gridPsi, k * 0.25, k === 0 ? '#22d3ee' : 'rgba(34, 211, 238, 0.85)', k === 0 ? 1.8 : 1)
      }
    }

    if (R > 0) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.92)'
      ctx.beginPath()
      ctx.arc(sx(0), sy(0), Math.abs(sx(R) - sx(0)), 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0e7490'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText(`R = sqrt(m/U) = ${R.toFixed(3)}`, 12, 20)
    ctx.fillText(`stream ψ`, 12, 38)
    ctx.fillStyle = 'rgba(244, 114, 182, 0.8)'
    ctx.fillText(`equipotential φ`, 80, 38)
  }, [U, m, Gamma, view])

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 14,
      background: 'var(--surface)',
      margin: '16px 0'
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 360, display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Uniform flow U = {U.toFixed(2)}</span>
          <input type="range" min={0.0} max={2.0} step={0.05} value={U}
                 onChange={e => setU(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Doublet strength m = {m.toFixed(2)}</span>
          <input type="range" min={0.0} max={2.0} step={0.05} value={m}
                 onChange={e => setM(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Circulation Γ = {Gamma.toFixed(2)}</span>
          <input type="range" min={-6.0} max={6.0} step={0.1} value={Gamma}
                 onChange={e => setGamma(parseFloat(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {(['stream', 'equipotential', 'both'] as View[]).map(v => (
            <button key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#0b1422' : 'var(--text)',
                cursor: 'pointer',
                fontSize: 12
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        W(z) = Uz + m/z + iΓ/(2π)·ln(z). When Γ=0 the picture is symmetric — d&apos;Alembert&apos;s zero drag. Slide Γ to break the symmetry and lift appears (Kutta–Joukowski).
      </p>
    </div>
  )
}
