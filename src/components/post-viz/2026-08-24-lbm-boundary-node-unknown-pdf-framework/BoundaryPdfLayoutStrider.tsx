'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The boundary loop touches only the unknown populations, but *where* those
// live decides how much memory the loop drags in.  Three layouts, one sweep:
//
//   SoA     f[k][node]       -> one address block per direction; a single node
//                              scatters its unknowns across up to 8 blocks
//   AoS     f[node][k]       -> a node's 9 populations sit together, so each
//                              node costs ~2 lines no matter how many are unknown
//   packed  bc[m][k]         -> boundary nodes renumbered contiguously first
//
// Boxes on the right are 64-byte cache lines (8 doubles).  They light up as
// the sweep walks the boundary node list.
// ---------------------------------------------------------------------------

const W = 726
const H = 452

const NX = 12
const NY = 8
const N = NX * NY
const Q = 9
const PER_LINE = 8
const TOTAL_LINES = Math.ceil((N * Q) / PER_LINE)

const CELL = 26
const GX = 16
const GY = 64

const MX = 366
const MY = 64
const BOX = 16
const PITCH = 19
const COLS = 18

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

type Layout = 'soa' | 'aos' | 'packed'

function stepMask(h: number): boolean[][] {
  const m: boolean[][] = Array.from({ length: NX }, () => Array(NY).fill(false))
  for (let i = 0; i < NX; i++) {
    m[i][0] = true
    m[i][NY - 1] = true
  }
  for (let i = 0; i < 5; i++) for (let j = 1; j <= h; j++) m[i][j] = true
  return m
}

type BcNode = { i: number; j: number; lin: number; unk: number[] }

function bcList(m: boolean[][]): BcNode[] {
  const out: BcNode[] = []
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NY; j++) {
      if (m[i][j]) continue
      const unk: number[] = []
      for (let k = 1; k <= 8; k++) {
        const si = i - E[k][0]
        const sj = j - E[k][1]
        if (si < 0 || si >= NX || sj < 0 || sj >= NY || m[si][sj]) unk.push(k)
      }
      if (unk.length) out.push({ i, j, lin: i * NY + j, unk })
    }
  }
  return out
}

function lineOf(layout: Layout, node: BcNode, m: number, k: number): number {
  const addr = layout === 'soa' ? k * N + node.lin : layout === 'aos' ? node.lin * Q + k : m * Q + k
  return Math.floor(addr / PER_LINE)
}

export function BoundaryPdfLayoutStrider() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [layout, setLayout] = useState<Layout>('soa')
  const [h, setH] = useState(3)
  const [speed, setSpeed] = useState(9)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ swept: 0, nb: 0, lines: 0 })

  const live = useRef({ layout, h, speed, running })
  live.current = { layout, h, speed, running }
  const setStatRef = useRef(setStat)
  setStatRef.current = setStat

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let cursor = 0
    let hold = 0
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const L = live.current

      const mask = stepMask(L.h)
      const nodes = bcList(mask)
      const nb = nodes.length

      if (L.running) {
        if (hold > 0) {
          hold -= dt
          if (hold <= 0) cursor = 0
        } else {
          cursor += dt * L.speed
          if (cursor >= nb) {
            cursor = nb
            hold = 1.4
          }
        }
      }
      const swept = Math.min(nb, Math.floor(cursor))

      // lines touched so far, plus the ones this node is touching right now
      const touched = new Set<number>()
      for (let m = 0; m < swept; m++) for (const k of nodes[m].unk) touched.add(lineOf(L.layout, nodes[m], m, k))
      const fresh = new Set<number>()
      if (swept < nb) for (const k of nodes[swept].unk) fresh.add(lineOf(L.layout, nodes[swept], swept, k))

      frame++
      if (frame % 12 === 0) setStatRef.current({ swept, nb, lines: touched.size })

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      text('BOUNDARY SWEEP — WHICH CACHE LINES GET PULLED IN', GX, 26, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text(
        `${NX}x${NY} lattice, D2Q9, 8-byte populations  →  ${TOTAL_LINES} cache lines of 8 values`,
        GX,
        44,
        '#64748b',
        '10px ui-monospace, monospace',
      )

      // ---- lattice --------------------------------------------------------
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
          const x = GX + i * CELL
          const y = GY + (NY - 1 - j) * CELL
          ctx.fillStyle = mask[i][j] ? '#334155' : '#101d33'
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
        }
      }
      nodes.forEach((nd, m) => {
        const x = GX + nd.i * CELL
        const y = GY + (NY - 1 - nd.j) * CELL
        const done = m < swept
        const cur = m === swept
        ctx.fillStyle = cur ? '#a7f3d0' : done ? 'rgba(251,191,36,0.75)' : 'rgba(148,163,184,0.3)'
        ctx.beginPath()
        ctx.arc(x + CELL / 2, y + CELL / 2, cur ? 6 : 4, 0, 2 * Math.PI)
        ctx.fill()
        if (cur) {
          ctx.strokeStyle = '#34d399'
          ctx.lineWidth = 2
          ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2)
          ctx.lineWidth = 1
        }
      })
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.strokeRect(GX, GY, NX * CELL, NY * CELL)
      text('boundary node list, row-major scan order', GX, GY + NY * CELL + 18, '#64748b', '10px ui-monospace, monospace')

      // sweep progress bar
      const pw = NX * CELL
      ctx.fillStyle = 'rgba(148,163,184,0.18)'
      ctx.fillRect(GX, GY + NY * CELL + 30, pw, 8)
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(GX, GY + NY * CELL + 30, (pw * swept) / Math.max(1, nb), 8)
      text(`node ${swept} / ${nb}`, GX, GY + NY * CELL + 56, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      if (swept < nb) {
        const nd = nodes[swept]
        text(`(${nd.i},${nd.j})  unknown k = ${nd.unk.join(',')}`, GX, GY + NY * CELL + 74, '#a7f3d0', '10px ui-monospace, monospace')
      }

      // ---- cache-line map --------------------------------------------------
      const inRange = L.layout === 'packed' ? Math.ceil((nb * Q) / PER_LINE) : TOTAL_LINES
      for (let l = 0; l < TOTAL_LINES; l++) {
        const cx = MX + (l % COLS) * PITCH
        const cy = MY + Math.floor(l / COLS) * PITCH
        if (l >= inRange) ctx.fillStyle = 'rgba(148,163,184,0.06)'
        else if (fresh.has(l)) ctx.fillStyle = '#a7f3d0'
        else if (touched.has(l)) ctx.fillStyle = 'rgba(251,191,36,0.85)'
        else ctx.fillStyle = 'rgba(148,163,184,0.2)'
        ctx.fillRect(cx, cy, BOX, BOX)
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(MX - 4, MY - 4, COLS * PITCH + 5, Math.ceil(TOTAL_LINES / COLS) * PITCH + 5)
      text('memory, one box = one 64-byte line', MX, MY - 12, '#64748b', '10px ui-monospace, monospace')

      // ---- readout ---------------------------------------------------------
      let y = MY + Math.ceil(TOTAL_LINES / COLS) * PITCH + 32
      const names: Record<Layout, string> = {
        soa: 'SoA   f[k][node]',
        aos: 'AoS   f[node][k]',
        packed: 'AoS + packed bc[m][k]',
      }
      text(names[L.layout], MX, y, '#fbbf24', 'bold 12px ui-monospace, monospace')
      y += 24
      const put = (lbl: string, v: string, c: string) => {
        text(lbl, MX, y, '#94a3b8')
        text(v, MX + 190, y, c, 'bold 11px ui-monospace, monospace')
        y += 19
      }
      const unkSoFar = nodes.slice(0, swept).reduce((a, nd) => a + nd.unk.length, 0)
      put('unknown populations read', String(unkSoFar), '#e2e8f0')
      put('cache lines pulled in', String(touched.size), '#fbbf24')
      put('lines per boundary node', swept ? (touched.size / swept).toFixed(2) : '—', '#38bdf8')
      put('of the whole lattice', ((100 * touched.size) / TOTAL_LINES).toFixed(0) + ' %', '#e2e8f0')

      // legend
      const ly = H - 16
      ctx.fillStyle = '#a7f3d0'
      ctx.fillRect(MX, ly - 9, 10, 10)
      text('reading now', MX + 15, ly, '#94a3b8', '10px ui-monospace, monospace')
      ctx.fillStyle = 'rgba(251,191,36,0.85)'
      ctx.fillRect(MX + 100, ly - 9, 10, 10)
      text('already pulled in', MX + 115, ly, '#94a3b8', '10px ui-monospace, monospace')
      ctx.fillStyle = 'rgba(148,163,184,0.2)'
      ctx.fillRect(MX + 236, ly - 9, 10, 10)
      text('untouched', MX + 251, ly, '#94a3b8', '10px ui-monospace, monospace')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        {(['soa', 'aos', 'packed'] as Layout[]).map((l) => (
          <button key={l} style={btn(layout === l)} onClick={() => setLayout(l)}>
            {l}
          </button>
        ))}
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ sweep'}
        </button>
        <label style={label}>
          <span style={nameS}>step h</span>
          <input type="range" min={1} max={5} step={1} value={h} onChange={(e) => setH(parseInt(e.target.value, 10))} />
          <span style={mono}>{h}</span>
        </label>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={2} max={30} step={1} value={speed} onChange={(e) => setSpeed(parseInt(e.target.value, 10))} />
          <span style={mono}>{speed}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Let one sweep finish on <em>soa</em> and read the line count, then hit <em>aos</em> — the same {stat.nb} nodes and the
        same unknowns, but the boxes light up in short runs instead of eight scattered bands. <em>packed</em> collapses the
        whole map into its top-left corner: the loop never reads a line it does not need. Now: {stat.lines} lines for{' '}
        {stat.swept} nodes.
      </div>
    </div>
  )
}
