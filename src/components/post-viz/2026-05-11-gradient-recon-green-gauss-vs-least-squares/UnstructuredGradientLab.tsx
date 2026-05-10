'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Vec2 = { x: number; y: number }
type Cell = { center: Vec2; verts: Vec2[]; p: number }

const CANVAS_W = 560
const CANVAS_H = 420
const RING_RADIUS = 1.2
const N_RING = 6
const COLOR_TRUE = '#22d3ee'
const COLOR_GG = '#fb923c'
const COLOR_LS = '#a78bfa'
const COLOR_CELL = 'rgba(148,163,184,0.18)'
const COLOR_EDGE = 'rgba(148,163,184,0.55)'
const COLOR_TARGET = 'rgba(34,211,238,0.18)'

function pField(x: number, y: number, k: number): number {
  return Math.sin(k * x) * Math.cos(k * y)
}

function gradTrue(x: number, y: number, k: number): Vec2 {
  return {
    x: k * Math.cos(k * x) * Math.cos(k * y),
    y: -k * Math.sin(k * x) * Math.sin(k * y),
  }
}

function buildMesh(skew: number): Cell[] {
  const cells: Cell[] = []
  const center: Vec2 = { x: 0, y: 0 }
  const centerVerts: Vec2[] = []
  const nVerts = N_RING
  for (let v = 0; v < nVerts; v++) {
    const ang = (v / nVerts) * Math.PI * 2 + Math.PI / nVerts
    centerVerts.push({ x: Math.cos(ang) * 0.55, y: Math.sin(ang) * 0.55 })
  }
  cells.push({ center, verts: centerVerts, p: 0 })

  for (let i = 0; i < N_RING; i++) {
    const baseAng = (i / N_RING) * Math.PI * 2
    const skewAng = baseAng + skew * Math.sin(2 * baseAng) * 0.6
    const r = RING_RADIUS * (1 + skew * Math.cos(3 * baseAng) * 0.4)
    const c: Vec2 = { x: Math.cos(skewAng) * r, y: Math.sin(skewAng) * r }
    const verts: Vec2[] = []
    for (let v = 0; v < 5; v++) {
      const a = (v / 5) * Math.PI * 2 + Math.PI / 5
      verts.push({ x: c.x + Math.cos(a) * 0.6, y: c.y + Math.sin(a) * 0.6 })
    }
    cells.push({ center: c, verts, p: 0 })
  }
  return cells
}

function shareFace(a: Cell, b: Cell): { mid: Vec2; normal: Vec2; length: number } {
  const d: Vec2 = { x: b.center.x - a.center.x, y: b.center.y - a.center.y }
  const dist = Math.hypot(d.x, d.y)
  const nx = d.x / dist
  const ny = d.y / dist
  const mid: Vec2 = {
    x: 0.5 * (a.center.x + b.center.x),
    y: 0.5 * (a.center.y + b.center.y),
  }
  return { mid, normal: { x: nx, y: ny }, length: 0.55 }
}

function greenGaussGradient(cells: Cell[]): Vec2 {
  const target = cells[0]
  let gx = 0
  let gy = 0
  let volume = 0
  for (let i = 1; i < cells.length; i++) {
    const face = shareFace(target, cells[i])
    const pFace = 0.5 * (target.p + cells[i].p)
    gx += pFace * face.normal.x * face.length
    gy += pFace * face.normal.y * face.length
    volume += 0.5 * face.length * Math.hypot(face.mid.x - target.center.x, face.mid.y - target.center.y)
  }
  if (volume < 1e-9) return { x: 0, y: 0 }
  return { x: gx / volume, y: gy / volume }
}

function leastSquaresGradient(cells: Cell[]): Vec2 {
  const target = cells[0]
  let a11 = 0
  let a12 = 0
  let a22 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 1; i < cells.length; i++) {
    const dx = cells[i].center.x - target.center.x
    const dy = cells[i].center.y - target.center.y
    const dp = cells[i].p - target.p
    const w = 1.0 / (dx * dx + dy * dy)
    a11 += w * dx * dx
    a12 += w * dx * dy
    a22 += w * dy * dy
    b1 += w * dx * dp
    b2 += w * dy * dp
  }
  const det = a11 * a22 - a12 * a12
  if (Math.abs(det) < 1e-12) return { x: 0, y: 0 }
  return {
    x: (a22 * b1 - a12 * b2) / det,
    y: (-a12 * b1 + a11 * b2) / det,
  }
}

function worldToCanvas(v: Vec2): Vec2 {
  const scale = 110
  return {
    x: CANVAS_W / 2 + v.x * scale,
    y: CANVAS_H / 2 - v.y * scale,
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, from: Vec2, vec: Vec2, color: string, lw = 2.5) {
  const head = 9
  const a = worldToCanvas(from)
  const tipWorld: Vec2 = { x: from.x + vec.x * 0.25, y: from.y + vec.y * 0.25 }
  const b = worldToCanvas(tipWorld)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  const ang = Math.atan2(b.y - a.y, b.x - a.x)
  ctx.beginPath()
  ctx.moveTo(b.x, b.y)
  ctx.lineTo(b.x - head * Math.cos(ang - Math.PI / 6), b.y - head * Math.sin(ang - Math.PI / 6))
  ctx.lineTo(b.x - head * Math.cos(ang + Math.PI / 6), b.y - head * Math.sin(ang + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

export function UnstructuredGradientLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [skew, setSkew] = useState(0.0)
  const [k, setK] = useState(1.2)

  const result = useMemo(() => {
    const cells = buildMesh(skew)
    for (const c of cells) c.p = pField(c.center.x, c.center.y, k)
    const gTrue = gradTrue(0, 0, k)
    const gGG = greenGaussGradient(cells)
    const gLS = leastSquaresGradient(cells)
    const errGG = Math.hypot(gGG.x - gTrue.x, gGG.y - gTrue.y) / (Math.hypot(gTrue.x, gTrue.y) + 1e-9)
    const errLS = Math.hypot(gLS.x - gTrue.x, gLS.y - gTrue.y) / (Math.hypot(gTrue.x, gTrue.y) + 1e-9)
    return { cells, gTrue, gGG, gLS, errGG, errLS }
  }, [skew, k])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = CANVAS_W * dpr
    cv.height = CANVAS_H * dpr
    cv.style.width = CANVAS_W + 'px'
    cv.style.height = CANVAS_H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const { cells, gTrue, gGG, gLS } = result

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      ctx.beginPath()
      const v0 = worldToCanvas(cell.verts[0])
      ctx.moveTo(v0.x, v0.y)
      for (let v = 1; v < cell.verts.length; v++) {
        const p = worldToCanvas(cell.verts[v])
        ctx.lineTo(p.x, p.y)
      }
      ctx.closePath()
      ctx.fillStyle = i === 0 ? COLOR_TARGET : COLOR_CELL
      ctx.fill()
      ctx.strokeStyle = COLOR_EDGE
      ctx.lineWidth = 1
      ctx.stroke()

      const cc = worldToCanvas(cell.center)
      const intensity = (cell.p + 1) / 2
      ctx.fillStyle = `rgba(34,211,238,${0.25 + intensity * 0.55})`
      ctx.beginPath()
      ctx.arc(cc.x, cc.y, 3.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(226,232,240,0.78)'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText(cell.p.toFixed(2), cc.x + 6, cc.y - 6)
    }

    drawArrow(ctx, { x: 0, y: 0 }, gTrue, COLOR_TRUE, 3)
    drawArrow(ctx, { x: 0, y: 0 }, gGG, COLOR_GG, 2.5)
    drawArrow(ctx, { x: 0, y: 0 }, gLS, COLOR_LS, 2.5)

    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillStyle = COLOR_TRUE
    ctx.fillText('true ∇p', 14, 22)
    ctx.fillStyle = COLOR_GG
    ctx.fillText('Green–Gauss', 14, 40)
    ctx.fillStyle = COLOR_LS
    ctx.fillText('Least-Squares', 14, 58)
  }, [result])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.4em 0',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <label style={{ fontSize: 13 }}>
          mesh skew: {skew.toFixed(2)}
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.01}
            value={skew}
            onChange={(e) => setSkew(parseFloat(e.target.value))}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          wavenumber k: {k.toFixed(2)}
          <input
            type="range"
            min={0.4}
            max={3.0}
            step={0.05}
            value={k}
            onChange={(e) => setK(parseFloat(e.target.value))}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, fontFamily: 'var(--font-mono, ui-monospace)' }}>
        <div style={{ color: COLOR_GG }}>relative error (Green–Gauss): {(result.errGG * 100).toFixed(1)}%</div>
        <div style={{ color: COLOR_LS }}>relative error (Least-Squares): {(result.errLS * 100).toFixed(1)}%</div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
        Field: p(x, y) = sin(k·x) · cos(k·y). Drag skew → 0 for a near-regular ring; → 0.9 for a strongly distorted polygon mesh.
      </p>
    </div>
  )
}
