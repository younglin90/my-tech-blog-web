'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type P = { x: number; y: number }

const W = 760
const H = 340
const SCALE = 110
const OX = 250
const OY = 250

const INIT: P[] = [
  { x: 0, y: 0 },
  { x: 1.3, y: -0.1 },
  { x: 1.5, y: 1.2 },
  { x: 0.1, y: 1.0 },
]

const toPx = (p: P) => ({ x: OX + p.x * SCALE, y: OY - p.y * SCALE })
const toW = (x: number, y: number): P => ({ x: (x - OX) / SCALE, y: (OY - y) / SCALE })
const cross = (a: P, b: P) => a.x * b.y - a.y * b.x
const sub = (a: P, b: P): P => ({ x: a.x - b.x, y: a.y - b.y })

function diagArea(q: P[]) {
  return 0.5 * cross(sub(q[2], q[0]), sub(q[3], q[1]))
}

function triAreas(q: P[]) {
  // ABC and ACD, split along diagonal AC
  const t1 = 0.5 * cross(sub(q[1], q[0]), sub(q[2], q[0]))
  const t2 = 0.5 * cross(sub(q[2], q[0]), sub(q[3], q[0]))
  return [t1, t2]
}

function segX(a: P, b: P, c: P, d: P) {
  const r = sub(b, a)
  const s = sub(d, c)
  const den = cross(r, s)
  if (Math.abs(den) < 1e-12) return false
  const t = cross(sub(c, a), s) / den
  const u = cross(sub(c, a), r) / den
  return t > 0 && t < 1 && u > 0 && u < 1
}

function classify(q: P[]) {
  if (segX(q[0], q[1], q[2], q[3]) || segX(q[1], q[2], q[3], q[0])) return 'twisted'
  const turns = [0, 1, 2, 3].map((k) => cross(sub(q[(k + 1) % 4], q[k]), sub(q[(k + 2) % 4], q[(k + 1) % 4])))
  if (turns.every((t) => t > 0)) return 'convex'
  return 'concave'
}

const STATE_COLOR: Record<string, string> = { convex: '#34d399', concave: '#f59e0b', twisted: '#f87171' }

export function QuadDiagonalCrossLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const pts = useRef<P[]>(INIT.map((p) => ({ ...p })))
  const drag = useRef<number>(-1)
  const [playing, setPlaying] = useState(false)
  const [showPar, setShowPar] = useState(true)
  const playRef = useRef(false)
  const parRef = useRef(true)
  const [read, setRead] = useState({ area: 0, t1: 0, t2: 0, kind: 'convex' })

  useEffect(() => {
    playRef.current = playing
  }, [playing])
  useEffect(() => {
    parRef.current = showPar
  }, [showPar])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    let raf = 0
    let frame = 0
    let phase = 0

    const draw = () => {
      frame++
      const q = pts.current
      if (playRef.current) {
        // sweep C left past D and back: convex -> concave -> twisted
        phase += 0.008
        q[2] = { x: 0.6 + 1.3 * Math.cos(phase), y: 1.2 + 0.15 * Math.sin(2 * phase) }
      }
      const area = diagArea(q)
      const [t1, t2] = triAreas(q)
      const kind = classify(q)

      g.fillStyle = '#0f172a'
      g.fillRect(0, 0, W, H)
      // grid
      g.strokeStyle = 'rgba(148,163,184,0.12)'
      g.lineWidth = 1
      for (let i = -3; i <= 4; i++) {
        const a = toPx({ x: i * 0.5, y: -1 })
        const b = toPx({ x: i * 0.5, y: 2.2 })
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke()
      }
      for (let j = -2; j <= 4; j++) {
        const a = toPx({ x: -2, y: j * 0.5 })
        const b = toPx({ x: 2.4, y: j * 0.5 })
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke()
      }

      // triangles ABC / ACD with signed colours
      const tri = (a: P, b: P, c: P, s: number) => {
        const [pa, pb, pc] = [a, b, c].map(toPx)
        g.fillStyle = s >= 0 ? 'rgba(56,189,248,0.22)' : 'rgba(248,113,113,0.30)'
        g.beginPath(); g.moveTo(pa.x, pa.y); g.lineTo(pb.x, pb.y); g.lineTo(pc.x, pc.y); g.closePath(); g.fill()
      }
      tri(q[0], q[1], q[2], t1)
      tri(q[0], q[2], q[3], t2)

      // parallelogram spanned by the two diagonals (area = 2 x quad)
      if (parRef.current) {
        const d1 = sub(q[2], q[0])
        const d2 = sub(q[3], q[1])
        const base: P = { x: 1.9, y: -0.6 }
        const c0 = base
        const c1 = { x: base.x + d1.x * 0.5, y: base.y + d1.y * 0.5 }
        const c2 = { x: c1.x + d2.x * 0.5, y: c1.y + d2.y * 0.5 }
        const c3 = { x: base.x + d2.x * 0.5, y: base.y + d2.y * 0.5 }
        const pp = [c0, c1, c2, c3].map(toPx)
        g.fillStyle = area >= 0 ? 'rgba(167,139,250,0.25)' : 'rgba(248,113,113,0.25)'
        g.strokeStyle = '#a78bfa'
        g.lineWidth = 1.5
        g.beginPath(); g.moveTo(pp[0].x, pp[0].y)
        for (let k = 1; k < 4; k++) g.lineTo(pp[k].x, pp[k].y)
        g.closePath(); g.fill(); g.stroke()
        g.fillStyle = '#c4b5fd'
        g.font = '12px ui-monospace, monospace'
        g.fillText('½AC × ½BD (scaled)', pp[0].x - 10, pp[0].y + 18)
      }

      // quad edges
      const pp = q.map(toPx)
      g.strokeStyle = STATE_COLOR[kind]
      g.lineWidth = 2.5
      g.beginPath(); g.moveTo(pp[0].x, pp[0].y)
      for (let k = 1; k < 4; k++) g.lineTo(pp[k].x, pp[k].y)
      g.closePath(); g.stroke()

      // diagonals
      g.setLineDash([6, 5])
      g.lineWidth = 1.5
      g.strokeStyle = '#38bdf8'
      g.beginPath(); g.moveTo(pp[0].x, pp[0].y); g.lineTo(pp[2].x, pp[2].y); g.stroke()
      g.strokeStyle = '#fbbf24'
      g.beginPath(); g.moveTo(pp[1].x, pp[1].y); g.lineTo(pp[3].x, pp[3].y); g.stroke()
      g.setLineDash([])

      // vertices
      ;['A', 'B', 'C', 'D'].forEach((n, k) => {
        g.fillStyle = drag.current === k ? '#ffffff' : '#e2e8f0'
        g.beginPath(); g.arc(pp[k].x, pp[k].y, 7, 0, Math.PI * 2); g.fill()
        g.fillStyle = '#0f172a'
        g.font = 'bold 10px ui-monospace, monospace'
        g.fillText(n, pp[k].x - 3.5, pp[k].y + 3.5)
      })

      // header readout on canvas
      g.font = '13px ui-monospace, monospace'
      g.fillStyle = '#94a3b8'
      g.fillText('drag A–D  |  blue: AC   amber: BD', 14, 22)
      g.fillStyle = STATE_COLOR[kind]
      g.fillText(`${kind.toUpperCase()}   ½(AC×BD) = ${area.toFixed(3)}`, 14, 42)

      if (frame % 12 === 0) setRead({ area, t1, t2, kind })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = ref.current
    if (!cv) return null
    const r = cv.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const m = pick(e)
    if (!m) return
    let best = -1
    let bd = 22 * 22
    pts.current.forEach((p, k) => {
      const s = toPx(p)
      const d = (s.x - m.x) ** 2 + (s.y - m.y) ** 2
      if (d < bd) { bd = d; best = k }
    })
    drag.current = best
    if (best >= 0) {
      setPlaying(false)
      ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current < 0) return
    const m = pick(e)
    if (!m) return
    const w = toW(Math.min(W - 8, Math.max(8, m.x)), Math.min(H - 8, Math.max(8, m.y)))
    pts.current[drag.current] = w
  }
  const onUp = () => { drag.current = -1 }

  const reset = useCallback(() => {
    pts.current = INIT.map((p) => ({ ...p }))
    setPlaying(false)
  }, [])

  const btn: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.45)',
    background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  }

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas
        ref={ref} width={W} height={H}
        style={{ width: '100%', height: 'auto', borderRadius: 8, touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? 'pause sweep' : 'sweep C (play)'}</button>
        <button style={btn} onClick={() => setShowPar((s) => !s)}>{showPar ? 'hide' : 'show'} diagonal parallelogram</button>
        <button style={btn} onClick={reset}>reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <span style={{ color: STATE_COLOR[read.kind] }}>state: {read.kind}</span> |{' '}
        area ABC = {read.t1.toFixed(3)} | area ACD = {read.t2.toFixed(3)} |{' '}
        sum = {(read.t1 + read.t2).toFixed(3)} | ½(AC×BD) = {read.area.toFixed(3)}
        <br />
        <span style={{ color: '#94a3b8' }}>
          The diagonal formula always equals the signed sum of the two triangles. Red fill = negative triangle; a
          twisted cell can report area ≈ 0 or &lt; 0.
        </span>
      </div>
    </div>
  )
}
