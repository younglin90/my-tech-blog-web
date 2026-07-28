'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Segment recovery, in 2D, where you can watch it.
//
// The Delaunay triangulation of a point set knows nothing about the boundary
// you care about. Ask it to keep the segment A-B and it may simply refuse: no
// triangle has that edge, other edges cross it. The segment is MISSING.
//
// Si & Gaertner's repair works on one certificate:
//
//   diametral circle D of the segment, empty  ==>  segment is strongly
//   Delaunay  ==>  the segment is present.
//
// Read backwards: a missing segment ALWAYS has a vertex inside D. Those are
// the encroaching points. Among them the reference point r is the one giving
// the largest circumcircle through (v1, v2, r), and r fixes where to split:
//
//   R1 = |v1 - r|, R2 = |v2 - r|
//   both > |e|/2      ->  split at the midpoint
//   otherwise         ->  split where the SMALLER circle meets e
//
// Split, retriangulate, repeat. Each split point is a Steiner point: the
// geometry of the input never moves, only its combinatorics.
//
// Every label below is computed live from the dragged point positions — the
// triangulation is a real Bowyer-Watson run each time you move something.
// ---------------------------------------------------------------------------

type P2 = { x: number; y: number }

function inCircum(p: P2, a: P2, b: P2, c: P2) {
  const ax = a.x - p.x
  const ay = a.y - p.y
  const bx = b.x - p.x
  const by = b.y - p.y
  const cx = c.x - p.x
  const cy = c.y - p.y
  const d =
    (ax * ax + ay * ay) * (bx * cy - by * cx) -
    (bx * bx + by * by) * (ax * cy - ay * cx) +
    (cx * cx + cy * cy) * (ax * by - ay * bx)
  const orient = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
  return orient > 0 ? d > 0 : d < 0
}

function delaunay(P: P2[]): [number, number, number][] {
  const n = P.length
  if (n < 3) return []
  let minx = Infinity
  let miny = Infinity
  let maxx = -Infinity
  let maxy = -Infinity
  for (const p of P) {
    minx = Math.min(minx, p.x)
    miny = Math.min(miny, p.y)
    maxx = Math.max(maxx, p.x)
    maxy = Math.max(maxy, p.y)
  }
  const dm = Math.max(maxx - minx, maxy - miny) || 1
  const mx = (minx + maxx) / 2
  const my = (miny + maxy) / 2
  const W = P.concat([
    { x: mx - 20 * dm, y: my - dm },
    { x: mx, y: my + 20 * dm },
    { x: mx + 20 * dm, y: my - dm },
  ])
  let tris: [number, number, number][] = [[n, n + 1, n + 2]]

  for (let i = 0; i < n; i++) {
    const keep: [number, number, number][] = []
    const edges: [number, number][] = []
    for (const t of tris) {
      if (inCircum(W[i], W[t[0]], W[t[1]], W[t[2]])) {
        edges.push([t[0], t[1]], [t[1], t[2]], [t[2], t[0]])
      } else keep.push(t)
    }
    tris = keep
    for (let a = 0; a < edges.length; a++) {
      let shared = false
      for (let b = 0; b < edges.length; b++) {
        if (a === b) continue
        if (
          (edges[a][0] === edges[b][1] && edges[a][1] === edges[b][0]) ||
          (edges[a][0] === edges[b][0] && edges[a][1] === edges[b][1])
        ) {
          shared = true
          break
        }
      }
      if (!shared) tris.push([edges[a][0], edges[a][1], i])
    }
  }
  return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n)
}

const key2 = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`)

function segCross(a: P2, b: P2, c: P2, d: P2) {
  const s = (p: P2, q: P2, r: P2) => (q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y)
  const d1 = s(a, b, c)
  const d2 = s(a, b, d)
  const d3 = s(c, d, a)
  const d4 = s(c, d, b)
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9
}

function circumRadius(a: P2, b: P2, c: P2) {
  const ab = Math.hypot(b.x - a.x, b.y - a.y)
  const bc = Math.hypot(c.x - b.x, c.y - b.y)
  const ca = Math.hypot(a.x - c.x, a.y - c.y)
  const ar = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2
  if (ar < 1e-9) return Infinity
  return (ab * bc * ca) / (4 * ar)
}

// base layout: 0 and 1 are the constraint endpoints, 2 is the slider-driven intruder
const BASE: P2[] = [
  { x: 96, y: 208 },
  { x: 566, y: 208 },
  { x: 331, y: 150 },
  { x: 178, y: 92 },
  { x: 452, y: 84 },
  { x: 258, y: 306 },
  { x: 404, y: 314 },
  { x: 120, y: 318 },
  { x: 552, y: 322 },
  { x: 596, y: 122 },
]

type Analysis = {
  pts: P2[]
  tris: [number, number, number][]
  edges: Set<string>
  chain: number[]
  missing: number[]
  encroach: number[]
  refPt: number
  focus: number
  crossing: [number, number][]
}

function analyze(pts: P2[], chain: number[]): Analysis {
  const tris = delaunay(pts)
  const edges = new Set<string>()
  for (const t of tris) {
    edges.add(key2(t[0], t[1]))
    edges.add(key2(t[1], t[2]))
    edges.add(key2(t[2], t[0]))
  }
  const missing: number[] = []
  for (let s = 0; s < chain.length - 1; s++) {
    if (!edges.has(key2(chain[s], chain[s + 1]))) missing.push(s)
  }
  const focus = missing.length ? missing[0] : 0
  const v1 = pts[chain[focus]]
  const v2 = pts[chain[focus + 1]]
  const cx = (v1.x + v2.x) / 2
  const cy = (v1.y + v2.y) / 2
  const rr = Math.hypot(v2.x - v1.x, v2.y - v1.y) / 2

  const encroach: number[] = []
  for (let i = 0; i < pts.length; i++) {
    if (i === chain[focus] || i === chain[focus + 1]) continue
    if (Math.hypot(pts[i].x - cx, pts[i].y - cy) < rr - 1e-6) encroach.push(i)
  }
  let refPt = -1
  let best = -Infinity
  for (const i of encroach) {
    const r = circumRadius(v1, v2, pts[i])
    if (r !== Infinity && r > best) {
      best = r
      refPt = i
    }
  }

  const crossing: [number, number][] = []
  for (const k of edges) {
    const [a, b] = k.split('_').map(Number)
    for (let s = 0; s < chain.length - 1; s++) {
      const c = chain[s]
      const d = chain[s + 1]
      if (a === c || a === d || b === c || b === d) continue
      if (segCross(pts[a], pts[b], pts[c], pts[d])) {
        crossing.push([a, b])
        break
      }
    }
  }
  return { pts, tris, edges, chain, missing, encroach, refPt, focus, crossing }
}

// Si's category-1 split, written in 2D
function splitPoint(v1: P2, v2: P2, r: P2): P2 {
  const L = Math.hypot(v2.x - v1.x, v2.y - v1.y)
  const ux = (v2.x - v1.x) / L
  const uy = (v2.y - v1.y) / L
  const R1 = Math.hypot(r.x - v1.x, r.y - v1.y)
  const R2 = Math.hypot(r.x - v2.x, r.y - v2.y)
  if (R1 > L / 2 && R2 > L / 2) return { x: v1.x + ux * (L / 2), y: v1.y + uy * (L / 2) }
  if (R1 <= R2) {
    const t = Math.min(Math.max(R1, 0.12 * L), 0.88 * L)
    return { x: v1.x + ux * t, y: v1.y + uy * t }
  }
  const t = Math.min(Math.max(L - R2, 0.12 * L), 0.88 * L)
  return { x: v1.x + ux * t, y: v1.y + uy * t }
}

export function MissingSegmentSplitLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [depth, setDepth] = useState(58)
  const [nSteiner, setNSteiner] = useState(0)
  const [stat, setStat] = useState({ sub: 1, missing: 1, encroach: 0, strong: false })

  const ptsR = useRef<P2[]>(BASE.map((p) => ({ ...p })))
  const chainR = useRef<number[]>([0, 1])
  const bornR = useRef<Map<number, number>>(new Map())
  const dragR = useRef<number>(-1)
  const dirtyR = useRef(true)

  // slider drives the intruder's clearance above the constraint line
  useEffect(() => {
    const p = ptsR.current[2]
    const a = ptsR.current[0]
    const b = ptsR.current[1]
    const mx = (a.x + b.x) / 2
    p.x = mx - 8
    p.y = (a.y + b.y) / 2 - depth
    dirtyR.current = true
  }, [depth])

  const resetChain = () => {
    ptsR.current = ptsR.current.slice(0, BASE.length)
    chainR.current = [0, 1]
    bornR.current = new Map()
    setNSteiner(0)
    dirtyR.current = true
  }

  const splitOnce = () => {
    const a = analyze(ptsR.current, chainR.current)
    if (!a.missing.length) return false
    const s = a.missing[0]
    const i1 = chainR.current[s]
    const i2 = chainR.current[s + 1]
    const r = a.refPt >= 0 ? a.pts[a.refPt] : { x: (a.pts[i1].x + a.pts[i2].x) / 2, y: a.pts[i1].y - 1 }
    const q = splitPoint(a.pts[i1], a.pts[i2], r)
    ptsR.current.push(q)
    const idx = ptsR.current.length - 1
    bornR.current.set(idx, performance.now())
    chainR.current = [...chainR.current.slice(0, s + 1), idx, ...chainR.current.slice(s + 1)]
    setNSteiner((n) => n + 1)
    dirtyR.current = true
    return true
  }

  const recoverAll = () => {
    for (let k = 0; k < 14; k++) if (!splitOnce()) break
  }

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    const W = cvs.width
    const H = cvs.height

    let A = analyze(ptsR.current, chainR.current)

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (ts: number) => {
      if (dirtyR.current) {
        A = analyze(ptsR.current, chainR.current)
        dirtyR.current = false
        const st = {
          sub: A.chain.length - 1,
          missing: A.missing.length,
          encroach: A.encroach.length,
          strong: A.encroach.length === 0,
        }
        setStat((old) =>
          old.sub === st.sub && old.missing === st.missing && old.encroach === st.encroach ? old : st,
        )
      }
      const P = A.pts

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- Delaunay edges
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(148,163,184,0.30)'
      ctx.beginPath()
      for (const k of A.edges) {
        const [a, b] = k.split('_').map(Number)
        ctx.moveTo(P[a].x, P[a].y)
        ctx.lineTo(P[b].x, P[b].y)
      }
      ctx.stroke()

      // ---- edges that cut the constraint
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fbbf24'
      ctx.beginPath()
      for (const [a, b] of A.crossing) {
        ctx.moveTo(P[a].x, P[a].y)
        ctx.lineTo(P[b].x, P[b].y)
      }
      ctx.stroke()

      // ---- diametral circle of the focused sub-segment
      const f1 = P[A.chain[A.focus]]
      const f2 = P[A.chain[A.focus + 1]]
      const dcx = (f1.x + f2.x) / 2
      const dcy = (f1.y + f2.y) / 2
      const dr = Math.hypot(f2.x - f1.x, f2.y - f1.y) / 2
      ctx.save()
      ctx.setLineDash([5, 5])
      ctx.lineDashOffset = -(ts * 0.02) % 10
      ctx.strokeStyle = A.encroach.length ? 'rgba(248,113,113,0.75)' : 'rgba(74,222,128,0.75)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(dcx, dcy, dr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // ---- constraint chain
      for (let s = 0; s < A.chain.length - 1; s++) {
        const a = P[A.chain[s]]
        const b = P[A.chain[s + 1]]
        const gone = A.missing.includes(s)
        ctx.save()
        if (gone) {
          ctx.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.005))
          ctx.setLineDash([7, 5])
          ctx.strokeStyle = '#f87171'
        } else {
          ctx.strokeStyle = '#4ade80'
        }
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.restore()
      }

      // ---- points
      for (let i = 0; i < P.length; i++) {
        const isEnd = i === 0 || i === 1
        const isSteiner = i >= BASE.length
        const enc = A.encroach.includes(i)
        let rad = isEnd ? 5.5 : 4
        if (isSteiner) {
          const t0 = bornR.current.get(i) ?? 0
          const age = Math.min(1, (performance.now() - t0) / 420)
          rad = 3 + 4 * (1 - Math.pow(1 - age, 3))
        }
        ctx.beginPath()
        ctx.arc(P[i].x, P[i].y, rad, 0, Math.PI * 2)
        ctx.fillStyle = isSteiner ? '#22d3ee' : isEnd ? '#e2e8f0' : enc ? '#f87171' : '#94a3b8'
        ctx.fill()
        if (enc) {
          ctx.strokeStyle = 'rgba(248,113,113,0.55)'
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.arc(P[i].x, P[i].y, rad + 4, 0, Math.PI * 2)
          ctx.stroke()
        }
        if (i === A.refPt) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.arc(P[i].x, P[i].y, rad + 8, 0, Math.PI * 2)
          ctx.stroke()
          text('reference point r', P[i].x + 12, P[i].y - 10, '#fbbf24')
          // the two circles that decide where the split lands
          ctx.save()
          ctx.setLineDash([3, 4])
          ctx.strokeStyle = 'rgba(251,191,36,0.30)'
          ctx.lineWidth = 1
          for (const e of [f1, f2]) {
            ctx.beginPath()
            ctx.arc(e.x, e.y, Math.hypot(P[i].x - e.x, P[i].y - e.y), 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.restore()
        }
      }
      text('v1', P[0].x - 22, P[0].y + 4, '#e2e8f0')
      text('v2', P[1].x + 10, P[1].y + 4, '#e2e8f0')

      // ---- readout strip
      ctx.fillStyle = 'rgba(11,18,32,0.88)'
      ctx.fillRect(0, H - 52, W, 52)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.beginPath()
      ctx.moveTo(0, H - 52)
      ctx.lineTo(W, H - 52)
      ctx.stroke()

      const miss = A.missing.length
      text(`sub-segments ${A.chain.length - 1}`, 14, H - 33, '#cbd5e1')
      text(`missing ${miss}`, 150, H - 33, miss ? '#f87171' : '#4ade80')
      text(`encroaching ${A.encroach.length}`, 246, H - 33, A.encroach.length ? '#f87171' : '#4ade80')
      text(`Steiner ${A.pts.length - BASE.length}`, 386, H - 33, '#22d3ee')
      text(
        A.encroach.length === 0 ? 'diametral circle empty → strongly Delaunay' : 'diametral circle occupied → not strongly Delaunay',
        14,
        H - 15,
        A.encroach.length === 0 ? '#4ade80' : '#fbbf24',
      )
      text(miss ? 'red dashed = the segment the mesh refuses to keep' : 'the whole constraint is an edge of the triangulation', 386, H - 15, miss ? '#f87171' : '#4ade80')

      text('drag any point · amber edges cut the constraint', 14, 22, '#64748b', '10px ui-monospace, monospace')
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const local = (e: PointerEvent) => {
      const r = cvs.getBoundingClientRect()
      return { x: ((e.clientX - r.left) * cvs.width) / r.width, y: ((e.clientY - r.top) * cvs.height) / r.height }
    }
    const down = (e: PointerEvent) => {
      const m = local(e)
      let best = -1
      let bd = 15
      for (let i = 0; i < ptsR.current.length; i++) {
        const d = Math.hypot(ptsR.current[i].x - m.x, ptsR.current[i].y - m.y)
        if (d < bd) {
          bd = d
          best = i
        }
      }
      dragR.current = best
      if (best >= 0) cvs.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (dragR.current < 0) return
      const m = local(e)
      const p = ptsR.current[dragR.current]
      p.x = Math.max(30, Math.min(cvs.width - 30, m.x))
      p.y = Math.max(30, Math.min(cvs.height - 70, m.y))
      dirtyR.current = true
    }
    const up = () => {
      dragR.current = -1
    }
    cvs.addEventListener('pointerdown', down)
    cvs.addEventListener('pointermove', move)
    cvs.addEventListener('pointerup', up)
    cvs.addEventListener('pointercancel', up)

    return () => {
      cancelAnimationFrame(raf)
      cvs.removeEventListener('pointerdown', down)
      cvs.removeEventListener('pointermove', move)
      cvs.removeEventListener('pointerup', up)
      cvs.removeEventListener('pointercancel', up)
    }
  }, [])

  const btn = (active = false): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#22d3ee' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={660}
        height={400}
        style={{
          width: '100%',
          maxWidth: 660,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.7rem', alignItems: 'center' }}>
        <button onClick={splitOnce} style={btn()}>
          split once
        </button>
        <button onClick={recoverAll} style={btn(stat.missing > 0)}>
          recover segment
        </button>
        <button onClick={resetChain} style={btn()}>
          reset
        </button>
        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>
          Steiner points inserted: {nSteiner}
        </span>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: '0.6rem',
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          color: '#cbd5e1',
        }}
      >
        <span style={{ minWidth: 168 }}>intruder clearance = {depth}</span>
        <input
          type="range"
          min={14}
          max={150}
          step={1}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#22d3ee' }}
        />
      </label>
    </div>
  )
}

export default MissingSegmentSplitLab
