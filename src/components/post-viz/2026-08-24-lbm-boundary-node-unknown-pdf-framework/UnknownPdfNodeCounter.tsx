'use client'

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'

// ---------------------------------------------------------------------------
// After streaming, a D2Q9 node keeps only the populations f_k whose upstream
// neighbour (x - e_k) is a fluid node.  Every link that reaches back into a
// solid — or off the lattice — arrives empty.  The count is therefore a pure
// geometry question: it equals the number of solid cells in the node's own
// 8-neighbourhood.
//
//   flat wall      3 unknowns   concave corner 5 unknowns
//   convex corner  1 unknown    (2D moments available: rho, u_x, u_y  ->  3)
//
// Click any lattice node to see its own link inventory and its closure budget.
// ---------------------------------------------------------------------------

const W = 726
const H = 452

const NX = 16
const NY = 11
const CELL = 32
const GX = 16
const GY = 58

const PX0 = 566

const E: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
]

type Geom = 'step' | 'plate' | 'block'

function buildMask(geom: Geom, h: number): boolean[][] {
  const m: boolean[][] = Array.from({ length: NX }, () => Array(NY).fill(false))
  for (let i = 0; i < NX; i++) {
    m[i][0] = true
    m[i][NY - 1] = true
  }
  if (geom === 'step') {
    for (let i = 0; i < 6; i++) for (let j = 1; j <= h; j++) m[i][j] = true
  } else if (geom === 'plate') {
    for (let j = 1; j <= h + 1; j++) m[8][j] = true
  } else {
    for (let i = 6; i <= 9; i++) for (let j = 4; j <= 4 + Math.max(0, h - 2); j++) m[i][j] = true
  }
  return m
}

function unknownDirs(m: boolean[][], i: number, j: number): number[] {
  const out: number[] = []
  for (let k = 1; k <= 8; k++) {
    const si = i - E[k][0]
    const sj = j - E[k][1]
    if (si < 0 || si >= NX || sj < 0 || sj >= NY || m[si][sj]) out.push(k)
  }
  return out
}

function nodeClass(unk: number[]): string {
  const axial = unk.filter((k) => k <= 4).length
  if (unk.length === 0) return 'interior'
  if (axial === 0) return 'convex corner'
  if (axial === 1) return 'flat wall'
  if (axial === 2) return 'concave corner'
  return 'slot / thin gap'
}

export function UnknownPdfNodeCounter() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [geom, setGeom] = useState<Geom>('step')
  const [h, setH] = useState(3)
  const [sel, setSel] = useState<[number, number]>([6, 1])
  const [running, setRunning] = useState(true)
  const [info, setInfo] = useState({ cls: 'concave corner', n: 5 })

  const live = useRef({ geom, h, sel, running })
  live.current = { geom, h, sel, running }
  const setInfoRef = useRef(setInfo)
  setInfoRef.current = setInfo

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let t = 0
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }
    const px = (i: number) => GX + i * CELL + CELL / 2
    const py = (j: number) => GY + (NY - 1 - j) * CELL + CELL / 2

    const arrow = (x0: number, y0: number, x1: number, y1: number, col: string, wdt: number) => {
      const a = Math.atan2(y1 - y0, x1 - x0)
      ctx.strokeStyle = col
      ctx.lineWidth = wdt
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4))
      ctx.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4))
      ctx.closePath()
      ctx.fill()
      ctx.lineWidth = 1
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const L = live.current
      if (L.running) t = (t + dt * 0.65) % 1

      const m = buildMask(L.geom, L.h)
      const [si, sj] = L.sel
      const unk = m[si][sj] ? [] : unknownDirs(m, si, sj)
      const cls = m[si][sj] ? 'solid' : nodeClass(unk)

      frame++
      if (frame % 12 === 0) setInfoRef.current({ cls, n: unk.length })

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      text('D2Q9 LINK INVENTORY — click any node', GX, 26, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text('solid = slate, fluid = navy, amber dot = node loses at least one f_k', GX, 44, '#64748b', '10px ui-monospace, monospace')

      // ---- lattice -------------------------------------------------------
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
          const x = GX + i * CELL
          const y = GY + (NY - 1 - j) * CELL
          ctx.fillStyle = m[i][j] ? '#334155' : '#101d33'
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
          if (!m[i][j]) {
            const nu = unknownDirs(m, i, j).length
            if (nu > 0) {
              ctx.fillStyle = 'rgba(251,191,36,0.55)'
              ctx.beginPath()
              ctx.arc(x + CELL / 2, y + CELL / 2, 2.5, 0, 2 * Math.PI)
              ctx.fill()
            }
          }
        }
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.strokeRect(GX, GY, NX * CELL, NY * CELL)
      text('i →', GX + NX * CELL - 26, GY + NY * CELL + 16, '#64748b', '10px ui-monospace, monospace')
      text('j ↑', GX - 4, GY - 6, '#64748b', '10px ui-monospace, monospace')

      // ---- links into the selected node ----------------------------------
      const cxs = px(si)
      const cys = py(sj)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.strokeRect(GX + si * CELL + 1, GY + (NY - 1 - sj) * CELL + 1, CELL - 2, CELL - 2)
      ctx.lineWidth = 1

      if (!m[si][sj]) {
        for (let k = 1; k <= 8; k++) {
          const ui = si - E[k][0]
          const uj = sj - E[k][1]
          const missing = unk.includes(k)
          const ux = px(ui)
          const uy = py(uj)
          const dx = cxs - ux
          const dy = cys - uy
          const len = Math.hypot(dx, dy)
          const sx = ux + (dx / len) * 9
          const sy = uy + (dy / len) * 9
          const ex = cxs - (dx / len) * 11
          const ey = cys - (dy / len) * 11
          if (missing) {
            ctx.setLineDash([4, 3])
            arrow(sx, sy, ex, ey, 'rgba(248,113,113,0.9)', 2)
            ctx.setLineDash([])
            ctx.fillStyle = '#f87171'
            ctx.beginPath()
            ctx.arc(sx, sy, 3.5, 0, 2 * Math.PI)
            ctx.fill()
          } else {
            arrow(sx, sy, ex, ey, 'rgba(52,211,153,0.75)', 1.6)
            const q = t
            ctx.fillStyle = '#a7f3d0'
            ctx.beginPath()
            ctx.arc(sx + (ex - sx) * q, sy + (ey - sy) * q, 3, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(cxs, cys, 4, 0, 2 * Math.PI)
        ctx.fill()
      }

      // ---- readout panel --------------------------------------------------
      ctx.fillStyle = 'rgba(148,163,184,0.07)'
      ctx.fillRect(PX0, GY, W - PX0 - 16, NY * CELL)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(PX0, GY, W - PX0 - 16, NY * CELL)

      let y = GY + 22
      text(`node (${si}, ${sj})`, PX0 + 12, y, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      y += 20
      const clsCol = cls === 'concave corner' ? '#f87171' : cls === 'convex corner' ? '#38bdf8' : '#fbbf24'
      text(cls, PX0 + 12, y, clsCol, 'bold 11px ui-monospace, monospace')
      y += 26

      if (m[si][sj]) {
        text('solid node —', PX0 + 12, y, '#94a3b8', '10px ui-monospace, monospace')
        text('no populations here', PX0 + 12, y + 14, '#94a3b8', '10px ui-monospace, monospace')
      } else {
        text('unknown f_k', PX0 + 12, y, '#94a3b8')
        text(String(unk.length), PX0 + 118, y, '#f87171', 'bold 13px ui-monospace, monospace')
        y += 18
        text('k = ' + (unk.join(',') || '—'), PX0 + 12, y, '#f87171', '10px ui-monospace, monospace')
        y += 24
        text('+ rho', PX0 + 12, y, '#94a3b8')
        text('1', PX0 + 118, y, '#e2e8f0', 'bold 12px ui-monospace, monospace')
        y += 20
        text('moments avail.', PX0 + 12, y, '#94a3b8')
        text('3', PX0 + 118, y, '#34d399', 'bold 12px ui-monospace, monospace')
        y += 26

        // unknowns vs equations bar
        const total = unk.length + 1
        const bw = 128
        const unit = bw / 7
        ctx.fillStyle = 'rgba(248,113,113,0.75)'
        ctx.fillRect(PX0 + 12, y, Math.min(total, 7) * unit, 13)
        ctx.fillStyle = 'rgba(52,211,153,0.75)'
        ctx.fillRect(PX0 + 12, y + 17, 3 * unit, 13)
        text('unknowns ' + total, PX0 + 12, y + 11, '#0b1220', 'bold 10px ui-monospace, monospace')
        text('equations 3', PX0 + 12, y + 28, '#0b1220', 'bold 10px ui-monospace, monospace')
        y += 50

        const gap = total - 3
        const verdict =
          gap > 0 ? `${gap} extra closure${gap > 1 ? 's' : ''} needed` : gap < 0 ? `${-gap} equation over-supplied` : 'exactly determined'
        const vc = gap > 0 ? '#f87171' : gap < 0 ? '#38bdf8' : '#34d399'
        ctx.fillStyle = gap > 0 ? 'rgba(248,113,113,0.16)' : gap < 0 ? 'rgba(56,189,248,0.16)' : 'rgba(52,211,153,0.16)'
        ctx.fillRect(PX0 + 8, y - 12, W - PX0 - 32, 30)
        text(verdict, PX0 + 14, y + 6, vc, 'bold 10px ui-monospace, monospace')
      }

      // legend
      const ly = GY + NY * CELL + 22
      ctx.fillStyle = '#34d399'
      ctx.fillRect(GX, ly - 8, 10, 10)
      text('arrives filled (upstream is fluid)', GX + 16, ly + 1, '#94a3b8', '10px ui-monospace, monospace')
      ctx.fillStyle = '#f87171'
      ctx.fillRect(GX + 226, ly - 8, 10, 10)
      text('arrives empty — unknown, must be closed', GX + 242, ly + 1, '#94a3b8', '10px ui-monospace, monospace')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onClick = (ev: MouseEvent<HTMLCanvasElement>) => {
    const cv = ref.current
    if (!cv) return
    const r = cv.getBoundingClientRect()
    const x = ((ev.clientX - r.left) / r.width) * W
    const y = ((ev.clientY - r.top) / r.height) * H
    const i = Math.floor((x - GX) / CELL)
    const jj = Math.floor((y - GY) / CELL)
    const j = NY - 1 - jj
    if (i < 0 || i >= NX || j < 0 || j >= NY) return
    setSel([i, j])
  }

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 30 }
  const btn = (on: boolean): CSSProperties => ({
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onClick={onClick}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
      <div style={rowS}>
        {(['step', 'plate', 'block'] as Geom[]).map((g) => (
          <button key={g} style={btn(geom === g)} onClick={() => setGeom(g)}>
            {g}
          </button>
        ))}
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ stream'}
        </button>
        <label style={label}>
          <span style={nameS}>size</span>
          <input type="range" min={1} max={5} step={1} value={h} onChange={(e) => setH(parseInt(e.target.value, 10))} />
          <span style={mono}>{h}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Click nodes along the bottom wall: 3 red arrows every time. Click the inside corner where the step meets the floor —
        it jumps to 5, and the closure bar goes 3 short. The single node on top of the step corner is the opposite case: 1
        unknown, and the 3 moment equations are one too many. Current pick: <em>{info.cls}</em>, {info.n} unknown.
      </div>
    </div>
  )
}
