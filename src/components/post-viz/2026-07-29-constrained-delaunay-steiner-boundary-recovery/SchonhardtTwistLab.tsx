'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Schoenhardt's polyhedron, decided by predicate instead of asserted.
//
// Take a triangular prism and rotate the top face by theta. Each rectangular
// side face is no longer planar, so it MUST be split by a diagonal. There are
// two choices per face, and the choice is decided by one sign:
//
//   orient3d(a, b, c, d) = ((b-a) x (c-a)) . (d-a)
//
// with (a,b,c) the outward-oriented triangle. d on the inner side  -> convex
// edge; d on the outer side -> REFLEX edge. Pick all three reflex diagonals
// and the solid becomes Schoenhardt's polyhedron (1928): a closed, simple,
// non-convex polyhedron that admits NO tetrahedrization using only its own
// six vertices.
//
// Nothing here is hard-coded. Every frame the component
//   1. rebuilds the 8 boundary triangles from theta and the split mode,
//   2. calls orient3d on each face diagonal to label it convex / reflex,
//   3. enumerates all C(6,4) = 15 candidate tetrahedra and keeps only those
//      whose 6 edges AND centroid lie inside the solid (ray-cast parity),
//   4. optionally cones one Steiner point at the centroid and re-tests.
//
// The valid-tet counter is therefore a measurement, not a claim. Sweep theta
// with the reflex split and watch it drop to zero.
// ---------------------------------------------------------------------------

type V3 = [number, number, number]

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

// signed volume x6 — positive when d sits on the OUTER side of CCW face (a,b,c)
const orient3d = (a: V3, b: V3, c: V3, d: V3) => dot(cross(sub(b, a), sub(c, a)), sub(d, a))

const RAD = 1.0
const HGT = 1.5
const SEG = 6 // C(6,4) enumeration base

type Tri = [number, number, number]

type Solid = {
  V: V3[]
  tris: Tri[]
  diag: { edge: [number, number]; reflex: boolean; det: number }[]
  other: { edge: [number, number]; inside: boolean }[]
  centroid: V3
}

// Moeller-Trumbore, used only for parity counting
function rayHits(o: V3, dir: V3, a: V3, b: V3, c: V3) {
  const e1 = sub(b, a)
  const e2 = sub(c, a)
  const p = cross(dir, e2)
  const det = dot(e1, p)
  if (Math.abs(det) < 1e-12) return false
  const inv = 1 / det
  const t0 = sub(o, a)
  const u = dot(t0, p) * inv
  if (u < 0 || u > 1) return false
  const q = cross(t0, e1)
  const v = dot(dir, q) * inv
  if (v < 0 || u + v > 1) return false
  return dot(e2, q) * inv > 1e-9
}

const PROBE: V3 = [0.5773, 0.3313, 0.7431] // generic direction, dodges edge hits

function inside(p: V3, S: Solid) {
  let n = 0
  for (const t of S.tris) if (rayHits(p, PROBE, S.V[t[0]], S.V[t[1]], S.V[t[2]])) n++
  return n % 2 === 1
}

// nudge a boundary sample toward the centroid so on-surface points read "in"
function insideNudged(p: V3, S: Solid) {
  const q: V3 = [
    p[0] + 0.03 * (S.centroid[0] - p[0]),
    p[1] + 0.03 * (S.centroid[1] - p[1]),
    p[2] + 0.03 * (S.centroid[2] - p[2]),
  ]
  return inside(q, S)
}

function buildSolid(thetaDeg: number, reflexMode: boolean): Solid {
  const th = (thetaDeg * Math.PI) / 180
  const V: V3[] = []
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 3
    V.push([RAD * Math.cos(a), RAD * Math.sin(a), -HGT / 2]) // B0 B1 B2 -> 0 1 2
  }
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 3 + th
    V.push([RAD * Math.cos(a), RAD * Math.sin(a), HGT / 2]) // T0 T1 T2 -> 3 4 5
  }

  const centroid: V3 = [0, 0, 0]
  for (const v of V) {
    centroid[0] += v[0] / 6
    centroid[1] += v[1] / 6
    centroid[2] += v[2] / 6
  }

  const tris: Tri[] = [
    [0, 2, 1], // bottom, outward -z
    [3, 4, 5], // top, outward +z
  ]
  const diag: Solid['diag'] = []
  const other: Solid['other'] = []

  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    const Bi = i
    const Bj = j
    const Ti = 3 + i
    const Tj = 3 + j
    // split A cuts Bi--Tj, split B cuts Bj--Ti
    const detA = orient3d(V[Bi], V[Bj], V[Tj], V[Ti]) // >0 : Ti outside -> A reflex
    const useA = reflexMode ? detA > 0 : detA <= 0
    if (useA) {
      tris.push([Bi, Bj, Tj], [Bi, Tj, Ti])
      diag.push({ edge: [Bi, Tj], reflex: detA > 0, det: detA })
      other.push({ edge: [Bj, Ti], inside: false })
    } else {
      const detB = orient3d(V[Bj], V[Tj], V[Ti], V[Bi])
      tris.push([Bi, Bj, Ti], [Bj, Tj, Ti])
      diag.push({ edge: [Bj, Ti], reflex: detB > 0, det: detB })
      other.push({ edge: [Bi, Tj], inside: false })
    }
  }

  const S: Solid = { V, tris, diag, other, centroid }
  for (const o of S.other) {
    const a = V[o.edge[0]]
    const b = V[o.edge[1]]
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
    o.inside = insideNudged(m, S)
  }
  return S
}

const TET_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
]

function countValidTets(S: Solid) {
  let ok = 0
  let total = 0
  for (let a = 0; a < SEG; a++)
    for (let b = a + 1; b < SEG; b++)
      for (let c = b + 1; c < SEG; c++)
        for (let d = c + 1; d < SEG; d++) {
          total++
          const q = [a, b, c, d]
          const vol = Math.abs(orient3d(S.V[a], S.V[b], S.V[c], S.V[d])) / 6
          if (vol < 1e-4) continue
          const cen: V3 = [0, 0, 0]
          for (const k of q) {
            cen[0] += S.V[k][0] / 4
            cen[1] += S.V[k][1] / 4
            cen[2] += S.V[k][2] / 4
          }
          if (!inside(cen, S)) continue
          let good = true
          for (const [e0, e1] of TET_EDGES) {
            const p = S.V[q[e0]]
            const r = S.V[q[e1]]
            const m: V3 = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2, (p[2] + r[2]) / 2]
            if (!insideNudged(m, S)) {
              good = false
              break
            }
          }
          if (good) ok++
        }
  return { ok, total }
}

// cone every boundary triangle to the centroid; valid when all 8 keep sign
function coneTets(S: Solid) {
  let ok = 0
  for (const t of S.tris) {
    const v = orient3d(S.V[t[0]], S.V[t[1]], S.V[t[2]], S.centroid)
    if (v < -1e-6) ok++ // centroid on the inner side of every outward face
  }
  return ok
}

export function SchonhardtTwistLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(18)
  const [reflexMode, setReflexMode] = useState(true)
  const [steiner, setSteiner] = useState(false)
  const [spin, setSpin] = useState(true)

  const thetaR = useRef(theta)
  const modeR = useRef(reflexMode)
  const steinerR = useRef(steiner)
  const spinR = useRef(spin)
  thetaR.current = theta
  modeR.current = reflexMode
  steinerR.current = steiner
  spinR.current = spin

  const yawR = useRef(0.6)
  const pitchR = useRef(0.42)
  const dragR = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const W = cvs.width
    const H = cvs.height
    const CX = 208
    const CY = 200
    const SC = 96

    let cache = { key: '', S: buildSolid(18, true), tets: { ok: 0, total: 15 }, cone: 0 }

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const proj = (v: V3) => {
      const cy = Math.cos(yawR.current)
      const sy = Math.sin(yawR.current)
      const cp = Math.cos(pitchR.current)
      const sp = Math.sin(pitchR.current)
      const x1 = v[0] * cy - v[1] * sy
      const y1 = v[0] * sy + v[1] * cy
      const y2 = y1 * cp - v[2] * sp
      const z2 = y1 * sp + v[2] * cp
      return { sx: CX + SC * x1, sy: CY - SC * z2, d: y2 }
    }

    const draw = (ts: number) => {
      if (spinR.current && !dragR.current) yawR.current += 0.0035

      const key = `${thetaR.current}|${modeR.current}`
      if (key !== cache.key) {
        const S = buildSolid(thetaR.current, modeR.current)
        cache = { key, S, tets: countValidTets(S), cone: coneTets(S) }
      }
      const S = cache.S

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- faces, painter sorted
      const faces = S.tris.map((t, i) => {
        const p = t.map((k) => proj(S.V[k]))
        return { i, t, p, depth: (p[0].d + p[1].d + p[2].d) / 3 }
      })
      faces.sort((a, b) => b.depth - a.depth)

      for (const f of faces) {
        const [p0, p1, p2] = f.p
        const areaSigned = (p1.sx - p0.sx) * (p2.sy - p0.sy) - (p2.sx - p0.sx) * (p1.sy - p0.sy)
        const front = areaSigned < 0
        ctx.beginPath()
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
        ctx.lineTo(p2.sx, p2.sy)
        ctx.closePath()
        ctx.fillStyle = front ? 'rgba(34,211,238,0.16)' : 'rgba(148,163,184,0.07)'
        ctx.fill()
        ctx.strokeStyle = front ? 'rgba(226,232,240,0.55)' : 'rgba(148,163,184,0.22)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // ---- Steiner cone
      if (steinerR.current) {
        const c = proj(S.centroid)
        ctx.strokeStyle = 'rgba(74,222,128,0.35)'
        ctx.lineWidth = 1
        for (let k = 0; k < 6; k++) {
          const p = proj(S.V[k])
          ctx.beginPath()
          ctx.moveTo(c.sx, c.sy)
          ctx.lineTo(p.sx, p.sy)
          ctx.stroke()
        }
        ctx.fillStyle = '#4ade80'
        ctx.beginPath()
        ctx.arc(c.sx, c.sy, 5, 0, Math.PI * 2)
        ctx.fill()
        text('Steiner', c.sx + 8, c.sy - 6, '#4ade80')
      }

      // ---- chosen diagonals (thick) and rejected ones (dashed)
      for (const d of S.diag) {
        const a = proj(S.V[d.edge[0]])
        const b = proj(S.V[d.edge[1]])
        ctx.strokeStyle = d.reflex ? '#f87171' : '#4ade80'
        ctx.lineWidth = 2.6
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }
      const pulse = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(ts * 0.003))
      for (const o of S.other) {
        const a = proj(S.V[o.edge[0]])
        const b = proj(S.V[o.edge[1]])
        ctx.save()
        ctx.globalAlpha = o.inside ? 0.75 : pulse
        ctx.strokeStyle = o.inside ? '#4ade80' : '#fbbf24'
        ctx.lineWidth = 1.6
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
        ctx.restore()
      }

      // ---- vertices
      const NAMES = ['B0', 'B1', 'B2', 'T0', 'T1', 'T2']
      for (let k = 0; k < 6; k++) {
        const p = proj(S.V[k])
        ctx.fillStyle = k < 3 ? '#cbd5e1' : '#22d3ee'
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, 3.4, 0, Math.PI * 2)
        ctx.fill()
        text(NAMES[k], p.sx + 6, p.sy - 5, k < 3 ? '#94a3b8' : '#22d3ee', '10px ui-monospace, monospace')
      }

      // ---- readout
      const X = 400
      text(`twist  theta = ${thetaR.current.toFixed(0)}°`, X, 30, '#e2e8f0', '12px ui-monospace, monospace')
      text(`face split : ${modeR.current ? 'REFLEX  (Schoenhardt)' : 'convex'}`, X, 48, modeR.current ? '#f87171' : '#4ade80')

      text('orient3d on each side face', X, 76, '#94a3b8')
      for (let i = 0; i < 3; i++) {
        const d = S.diag[i]
        const nm = `${NAMES[d.edge[0]]}-${NAMES[d.edge[1]]}`
        const deg = Math.abs(d.det) < 1e-9 ? 'ZERO  degenerate' : d.reflex ? 'reflex  (> 0)' : 'convex  (< 0)'
        text(`  ${nm.padEnd(7)} ${d.det.toFixed(3).padStart(7)}  ${deg}`, X, 94 + i * 15, Math.abs(d.det) < 1e-9 ? '#fbbf24' : d.reflex ? '#f87171' : '#4ade80')
      }

      const nOut = S.other.filter((o) => !o.inside).length
      text(`rejected diagonals outside solid : ${nOut}/3`, X, 158, nOut > 0 ? '#fbbf24' : '#4ade80')

      text('tetrahedra from the 6 given vertices', X, 190, '#94a3b8')
      const ok = cache.tets.ok
      text(`  valid / candidates   ${ok} / ${cache.tets.total}`, X, 208, ok === 0 ? '#f87171' : '#4ade80', '12px ui-monospace, monospace')

      const barW = 220
      ctx.fillStyle = 'rgba(148,163,184,0.18)'
      ctx.fillRect(X, 218, barW, 8)
      ctx.fillStyle = ok === 0 ? '#f87171' : '#4ade80'
      ctx.fillRect(X, 218, (barW * ok) / cache.tets.total, 8)

      if (ok === 0) {
        ctx.globalAlpha = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(ts * 0.004))
        text('no tetrahedrization exists', X, 246, '#f87171', '12px ui-monospace, monospace')
        ctx.globalAlpha = 1
        text('every candidate tet needs an edge', X, 262, '#94a3b8')
        text('that leaves the solid', X, 276, '#94a3b8')
      } else {
        text('the solid decomposes as it stands', X, 246, '#4ade80')
      }

      if (steinerR.current) {
        const c = cache.cone
        text(`+1 Steiner point at the centroid`, X, 304, '#4ade80', '12px ui-monospace, monospace')
        text(`  cone tets valid : ${c}/8`, X, 320, c === 8 ? '#4ade80' : '#fbbf24')
        text(c === 8 ? '  one extra vertex fixes it' : '  centroid is not visible from all faces', X, 334, '#94a3b8')
      } else {
        text('turn on the Steiner point to repair it', X, 304, '#94a3b8')
      }

      text('solid = green diagonals convex,  red = reflex', 14, H - 30, '#94a3b8', '10px ui-monospace, monospace')
      text('dashed = the diagonal NOT chosen — amber means it exits the solid', 14, H - 16, '#94a3b8', '10px ui-monospace, monospace')
      text('drag to rotate', 14, 24, '#64748b', '10px ui-monospace, monospace')
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const down = (e: PointerEvent) => {
      dragR.current = { x: e.clientX, y: e.clientY }
      cvs.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      const d = dragR.current
      if (!d) return
      yawR.current += (e.clientX - d.x) * 0.008
      pitchR.current = Math.max(-1.35, Math.min(1.35, pitchR.current + (e.clientY - d.y) * 0.006))
      dragR.current = { x: e.clientX, y: e.clientY }
    }
    const up = () => {
      dragR.current = null
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

  const btn = (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#22d3ee' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
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
          cursor: 'grab',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.7rem', alignItems: 'center' }}>
        <button onClick={() => setReflexMode(false)} style={btn(!reflexMode)}>
          convex split
        </button>
        <button onClick={() => setReflexMode(true)} style={btn(reflexMode)}>
          reflex split
        </button>
        <button onClick={() => setSteiner((s) => !s)} style={btn(steiner)}>
          Steiner point
        </button>
        <button onClick={() => setSpin((s) => !s)} style={btn(spin)}>
          auto-rotate
        </button>
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
        <span style={{ minWidth: 128 }}>twist θ = {theta.toFixed(0)}°</span>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={theta}
          onChange={(e) => setTheta(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#22d3ee' }}
        />
      </label>
    </div>
  )
}

export default SchonhardtTwistLab
