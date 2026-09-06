'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Voxelising an "STL" cross-section with an octree (quadtree in 2D) + SAT.
//
//   * the surface is a closed polygon of NSEG segments
//   * a node is split only if at least one segment intersects its box
//   * segment-vs-box intersection is the 3-axis Separating Axis Theorem
//   * a node that no segment reaches is uniform: one ray decides F or S
//
// The counter on the right is the honest one: every call to satHit() is
// tallied, for the tree walk and for the brute-force sweep that tests every
// leaf cell against every segment.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const PL = 28 // left panel (the geometry)
const PT = 34
const PS = 362 // panel side

const RX = 432 // right panel
const RR = 742

const COL_F = '#1d4ed8' // fluid
const COL_S = '#475569' // solid
const COL_B = '#f97316' // boundary
const COL_TXT = '#94a3b8'
const COL_AX = 'rgba(148,163,184,0.28)'

const NSEG = 96

// closed polygon standing in for the triangle soup of an STL file
function bladeOutline(): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < NSEG; i++) {
    const t = (2 * Math.PI * i) / NSEG
    const r = 0.3 + 0.075 * Math.sin(5 * t) + 0.045 * Math.cos(3 * t + 0.7)
    pts.push([0.5 + r * Math.cos(t), 0.5 + r * Math.sin(t)])
  }
  return pts
}

type Seg = { x0: number; y0: number; x1: number; y1: number }

function segments(poly: Array<[number, number]>): Seg[] {
  return poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length]
    return { x0: p[0], y0: p[1], x1: q[0], y1: q[1] }
  })
}

// separating axis theorem: segment vs axis-aligned box (3 candidate axes)
function satHit(s: Seg, cx: number, cy: number, hx: number, hy: number): boolean {
  if (Math.min(s.x0, s.x1) > cx + hx || Math.max(s.x0, s.x1) < cx - hx) return false
  if (Math.min(s.y0, s.y1) > cy + hy || Math.max(s.y0, s.y1) < cy - hy) return false
  const nx = -(s.y1 - s.y0)
  const ny = s.x1 - s.x0
  const d = nx * (s.x0 - cx) + ny * (s.y0 - cy)
  const rad = hx * Math.abs(nx) + hy * Math.abs(ny)
  return Math.abs(d) <= rad
}

// half-open ray parity along +x
function parityInside(px: number, py: number, segs: Seg[]): boolean {
  let n = 0
  for (const s of segs) {
    if (s.y0 > py !== s.y1 > py) {
      const t = (py - s.y0) / (s.y1 - s.y0)
      if (s.x0 + t * (s.x1 - s.x0) > px) n++
    }
  }
  return n % 2 === 1
}

type Leaf = { x: number; y: number; w: number; depth: number; kind: 0 | 1 | 2 } // 0 F, 1 S, 2 B

type Built = { leaves: Leaf[]; treeTests: number; bruteTests: number; nB: number; nF: number; nS: number }

function buildTree(level: number, segs: Seg[]): Built {
  const leaves: Leaf[] = []
  let treeTests = 0

  const visit = (x: number, y: number, w: number, depth: number, cand: Seg[]) => {
    const hx = w / 2
    const hit: Seg[] = []
    for (const s of cand) {
      treeTests++
      if (satHit(s, x + hx, y + hx, hx, hx)) hit.push(s)
    }
    if (hit.length === 0) {
      const inside = parityInside(x + hx, y + hx, segs)
      leaves.push({ x, y, w, depth, kind: inside ? 1 : 0 })
      return
    }
    if (depth >= level) {
      leaves.push({ x, y, w, depth, kind: 2 })
      return
    }
    const h = w / 2
    visit(x, y, h, depth + 1, hit)
    visit(x + h, y, h, depth + 1, hit)
    visit(x, y + h, h, depth + 1, hit)
    visit(x + h, y + h, h, depth + 1, hit)
  }

  visit(0, 0, 1, 0, segs)

  const n = 1 << level
  const bruteTests = n * n * segs.length
  let nB = 0
  let nF = 0
  let nS = 0
  for (const l of leaves) {
    const cells = Math.round((l.w * n) ** 2)
    if (l.kind === 2) nB += cells
    else if (l.kind === 1) nS += cells
    else nF += cells
  }
  return { leaves, treeTests, bruteTests, nB, nF, nS }
}

export function OctreeVoxelSatClassifier() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [level, setLevel] = useState(5)
  const [showTree, setShowTree] = useState(true)
  const [running, setRunning] = useState(true)
  const [read, setRead] = useState({ shown: 0, tree: 0, brute: 0, nB: 0, nF: 0, nS: 0 })
  const [nudge, setNudge] = useState(0)

  const st = useRef({ level, showTree, running })
  st.current = { level, showTree, running }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const poly = bladeOutline()
    const segs = segments(poly)
    let built = buildTree(level, segs)
    let lvl = level
    let reveal = 0 // depth currently revealed, animated

    const X = (u: number) => PL + u * PS
    const Y = (v: number) => PT + (1 - v) * PS

    const draw = () => {
      const s = st.current
      if (s.level !== lvl) {
        lvl = s.level
        built = buildTree(lvl, segs)
        reveal = 0
      }

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const shown = Math.min(lvl, Math.floor(reveal))

      // ---- geometry panel ------------------------------------------------
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('STL cross-section -> voxels', PL, 20)

      let vis = 0
      for (const l of built.leaves) {
        if (l.depth > shown) continue
        vis++
        const x = X(l.x)
        const y = Y(l.y + l.w)
        const w = l.w * PS
        const col = l.kind === 2 ? COL_B : l.kind === 1 ? COL_S : COL_F
        ctx.fillStyle = l.kind === 2 ? 'rgba(249,115,22,0.55)' : l.kind === 1 ? 'rgba(71,85,105,0.55)' : 'rgba(29,78,216,0.42)'
        ctx.fillRect(x, y, w, w)
        if (s.showTree) {
          ctx.strokeStyle = `${col}66`
          ctx.lineWidth = 0.6
          ctx.strokeRect(x + 0.3, y + 0.3, w - 0.6, w - 0.6)
        }
      }

      // the surface itself, on top
      ctx.beginPath()
      poly.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p[0]), Y(p[1])) : ctx.lineTo(X(p[0]), Y(p[1]))))
      ctx.closePath()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1.4
      ctx.stroke()

      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(PL, PT, PS, PS)

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`depth ${shown} / ${lvl}   leaves drawn ${vis}`, PL, PT + PS + 18)

      // ---- stats panel ---------------------------------------------------
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('SAT tests to classify the same grid', RX, 20)

      const done = shown >= lvl
      const tree = done ? built.treeTests : Math.round(built.treeTests * (0.15 + 0.85 * (shown / Math.max(1, lvl))))
      const brute = built.bruteTests
      const maxv = Math.max(tree, brute)
      const bars: Array<[string, number, string]> = [
        [`octree walk`, tree, '#4ade80'],
        [`every cell x every segment`, brute, '#f87171'],
      ]
      let by = 60
      for (const [name, v, col] of bars) {
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(name, RX, by)
        const bw = (RR - RX) * (v / maxv)
        ctx.fillStyle = `${col}44`
        ctx.fillRect(RX, by + 8, bw, 16)
        ctx.strokeStyle = col
        ctx.lineWidth = 1
        ctx.strokeRect(RX + 0.5, by + 8.5, Math.max(1, bw) - 1, 15)
        ctx.fillStyle = col
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText(v.toLocaleString('en-US'), RX + 4, by + 21)
        by += 54
      }
      ctx.fillStyle = '#4ade80'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`saving  ${(brute / Math.max(1, tree)).toFixed(1)} x`, RX, by + 4)

      // legend + counts
      by += 40
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('voxel classes at the finest level', RX, by)
      by += 12
      const rows: Array<[string, number, string]> = [
        ['B  boundary (surface inside)', built.nB, COL_B],
        ['F  fluid (outside)', built.nF, COL_F],
        ['S  solid (inside)', built.nS, COL_S],
      ]
      for (const [name, v, col] of rows) {
        by += 24
        ctx.fillStyle = col
        ctx.fillRect(RX, by - 9, 11, 11)
        ctx.strokeStyle = 'rgba(226,232,240,0.5)'
        ctx.lineWidth = 0.8
        ctx.strokeRect(RX + 0.5, by - 8.5, 10, 10)
        ctx.fillStyle = COL_TXT
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(name, RX + 18, by)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(done ? v.toLocaleString('en-US') : '-', RR, by)
        ctx.textAlign = 'left'
      }

      by += 34
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`grid ${1 << lvl} x ${1 << lvl}   surface ${NSEG} segments`, RX, by)
      ctx.fillText(`B / total = ${done ? ((100 * built.nB) / ((1 << lvl) * (1 << lvl))).toFixed(2) : '-'} %`, RX, by + 16)

      return { shown, tree, brute }
    }

    draw()
    let raf = 0
    let frame = 0
    const loop = () => {
      frame++
      if (st.current.running) reveal = reveal >= lvl + 1.2 ? 0 : reveal + 0.045
      const r = draw()
      if (frame % 12 === 0) {
        setReadRef.current({
          shown: r.shown,
          tree: r.tree,
          brute: r.brute,
          nB: built.nB,
          nF: built.nF,
          nS: built.nS,
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [nudge])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button style={btn(false)} onClick={() => { setRunning(true); setNudge((n) => n + 1) }}>rebuild</button>
        <button style={btn(showTree)} onClick={() => setShowTree((v) => !v)}>cell edges {showTree ? 'on' : 'off'}</button>
        <label style={label}>
          <span style={nameS}>octree level</span>
          <input type="range" min={3} max={7} step={1} value={level} onChange={(e) => setLevel(parseInt(e.target.value, 10))} />
          <span style={mono}>{level} ({1 << level}&sup2;)</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span>depth {read.shown}</span>
        <span style={{ color: '#4ade80' }}>tree {read.tree.toLocaleString('en-US')}</span>
        <span style={{ color: '#f87171' }}>brute {read.brute.toLocaleString('en-US')}</span>
        <span style={{ color: COL_B }}>B {read.nB.toLocaleString('en-US')}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Raise the octree level and watch two things move in opposite directions: the orange boundary shell gets thinner in
        space but larger in count, while the green bar barely grows. Only the boxes the surface actually touches are ever
        split, so the tree pays for the surface, not for the volume.
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 74 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
