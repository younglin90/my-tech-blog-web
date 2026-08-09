'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Tagging is not the hard part. Tagging *early enough* is.
//
// A normalized second difference (Lohner) fires on the shear layer, the tagged
// cells are grown by n_buf cells, and every block holding one tagged cell is
// refined. That much is a one-liner. The catch: the mesh is rebuilt only every
// `regrid` frames, and the layer keeps moving in between. Cells where the
// sensor fires but the mesh never followed are drawn in red -- those are the
// cells being solved at the wrong resolution right now.
//
// n_buf = 0 with a long regrid interval leaks red every cycle. Widen the buffer
// and the red disappears, but the leaf-cell count climbs. That trade is the
// whole knob.
// ---------------------------------------------------------------------------

const W = 726
const H = 462

const BASE = 8 // blocks per side on level 0
const BLOCK = 4 // cells per block side
const TOP = 3 // deepest level the tree may reach
const NEFF = BASE * BLOCK * (1 << TOP) // 256 cells per side at the finest level
const NLEV = TOP + 1

const PX = 18 // field panel origin
const PY = 46
const PS = 396 // field panel size

const EPS_L = 0.02
const LEVEL_COL = ['#64748b', '#38bdf8', '#a78bfa', '#fbbf24']

type Grid = { n: number; f: Float32Array; s: Float32Array }

function makeLevels(): Grid[] {
  const out: Grid[] = []
  for (let l = 0; l < NLEV; l++) {
    const n = (BASE * BLOCK) << l
    out.push({ n, f: new Float32Array(n * n), s: new Float32Array(n * n) })
  }
  return out
}

// normalized second difference; periodic in x, zero-gradient in y
function sensor(g: Grid) {
  const { n, f, s } = g
  for (let i = 0; i < n; i++) {
    const ip = (i + 1) % n
    const im = (i + n - 1) % n
    for (let j = 0; j < n; j++) {
      const jp = Math.min(j + 1, n - 1)
      const jm = Math.max(j - 1, 0)
      const c = f[i * n + j]
      let e2 = 0
      for (let d = 0; d < 2; d++) {
        const p = d === 0 ? f[ip * n + j] : f[i * n + jp]
        const m = d === 0 ? f[im * n + j] : f[i * n + jm]
        const num = Math.abs(p - 2 * c + m)
        const den = Math.abs(p - c) + Math.abs(c - m) + EPS_L * (Math.abs(p) + 2 * Math.abs(c) + Math.abs(m))
        const r = num / Math.max(den, 1e-30)
        e2 += r * r
      }
      s[i * n + j] = Math.sqrt(e2)
    }
  }
}

export function LohnerTagBufferQuadtree() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [thresh, setThresh] = useState(0.35)
  const [nbuf, setNbuf] = useState(2)
  const [maxLev, setMaxLev] = useState(3)
  const [regrid, setRegrid] = useState(14)
  const [running, setRunning] = useState(true)
  const [regridNow, setRegridNow] = useState(0)
  const [stat, setStat] = useState({ leaf: 0, uni: 1, escaped: 0, age: 0, per: [0, 0, 0, 0] })

  const cfg = useRef({ thresh, nbuf, maxLev, regrid, running, regridNow })
  cfg.current = { thresh, nbuf, maxLev, regrid, running, regridNow }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const lev = makeLevels()
    const off = document.createElement('canvas')
    off.width = NEFF
    off.height = NEFF
    const octx = off.getContext('2d')
    if (!octx) return
    const img = octx.createImageData(NEFF, NEFF)

    // per level: is this block alive (its parent was refined) / was it refined
    const live: Uint8Array[] = []
    const refined: Uint8Array[] = []
    for (let l = 0; l < NLEV; l++) {
      const nb = (BASE << l) * (BASE << l)
      live.push(new Uint8Array(nb))
      refined.push(new Uint8Array(nb))
    }
    const leafLevel = new Uint8Array(NEFF * NEFF) // finest cell -> level of the leaf covering it
    const tag = new Uint8Array(NEFF * NEFF)
    const tag2 = new Uint8Array(NEFF * NEFF)

    const warp = new Float32Array(NEFF)
    let t = 0
    let age = 1e9
    let lastNow = 0
    let frame = 0

    const fillField = () => {
      const fine = lev[TOP]
      for (let i = 0; i < NEFF; i++) {
        const x = (i + 0.5) / NEFF
        warp[i] = 0.06 * Math.sin(2 * Math.PI * x + t) + 0.025 * Math.sin(4 * Math.PI * x - 2 * t)
      }
      for (let i = 0; i < NEFF; i++) {
        const w = 0.5 + warp[i]
        for (let j = 0; j < NEFF; j++) {
          fine.f[i * NEFF + j] = Math.tanh(((j + 0.5) / NEFF - w) / 0.012)
        }
      }
      for (let l = TOP - 1; l >= 0; l--) {
        const c = lev[l]
        const f = lev[l + 1]
        for (let i = 0; i < c.n; i++)
          for (let j = 0; j < c.n; j++) {
            const a = 2 * i * f.n + 2 * j
            c.f[i * c.n + j] = 0.25 * (f.f[a] + f.f[a + 1] + f.f[a + f.n] + f.f[a + f.n + 1])
          }
      }
    }

    const doRegrid = () => {
      const { thresh: th, nbuf: nb, maxLev: ml } = cfg.current
      for (let l = 0; l < NLEV; l++) {
        live[l].fill(l === 0 ? 1 : 0)
        refined[l].fill(0)
      }
      for (let l = 0; l < ml; l++) {
        const g = lev[l]
        sensor(g)
        const n = g.n
        for (let k = 0; k < n * n; k++) tag[k] = g.s[k] > th ? 1 : 0
        for (let b = 0; b < nb; b++) {
          for (let i = 0; i < n; i++) {
            const ip = (i + 1) % n
            const im = (i + n - 1) % n
            for (let j = 0; j < n; j++) {
              const jp = Math.min(j + 1, n - 1)
              const jm = Math.max(j - 1, 0)
              tag2[i * n + j] =
                tag[i * n + j] | tag[ip * n + j] | tag[im * n + j] | tag[i * n + jp] | tag[i * n + jm]
            }
          }
          tag.set(tag2.subarray(0, n * n))
        }
        const nbx = BASE << l
        for (let bi = 0; bi < nbx; bi++)
          for (let bj = 0; bj < nbx; bj++) {
            const bid = bi * nbx + bj
            if (!live[l][bid]) continue
            let hit = 0
            for (let i = bi * BLOCK; i < (bi + 1) * BLOCK && !hit; i++)
              for (let j = bj * BLOCK; j < (bj + 1) * BLOCK; j++)
                if (tag[i * n + j]) {
                  hit = 1
                  break
                }
            if (!hit) continue
            refined[l][bid] = 1
            const c = 2 * nbx
            for (let a = 0; a < 2; a++) for (let b2 = 0; b2 < 2; b2++) live[l + 1][(2 * bi + a) * c + 2 * bj + b2] = 1
          }
      }
      // stamp the leaf level of every finest cell
      for (let l = 0; l <= ml; l++) {
        const nbx = BASE << l
        const span = NEFF / (nbx * BLOCK) // finest cells per cell of this level
        for (let bi = 0; bi < nbx; bi++)
          for (let bj = 0; bj < nbx; bj++) {
            const bid = bi * nbx + bj
            if (!live[l][bid] || (l < ml && refined[l][bid])) continue
            const i0 = bi * BLOCK * span
            const j0 = bj * BLOCK * span
            const w = BLOCK * span
            for (let i = i0; i < i0 + w; i++) for (let j = j0; j < j0 + w; j++) leafLevel[i * NEFF + j] = l
          }
      }
      age = 0
    }

    const paintField = () => {
      const fine = lev[TOP]
      const d = img.data
      for (let j = 0; j < NEFF; j++)
        for (let i = 0; i < NEFF; i++) {
          const v = (fine.f[i * NEFF + j] + 1) * 0.5
          const p = 4 * (j * NEFF + i)
          d[p] = 14 + 232 * v
          d[p + 1] = 42 + 143 * v
          d[p + 2] = 72 - 14 * v
          d[p + 3] = 255
        }
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.save()
      ctx.translate(PX, PY + PS)
      ctx.scale(1, -1)
      ctx.drawImage(off, 0, 0, PS, PS)
      ctx.restore()
    }

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = () => {
      const { maxLev: ml, thresh: th, running: run, regrid: gap, regridNow: now } = cfg.current
      if (now !== lastNow) {
        lastNow = now
        age = 1e9
      }
      if (run) t += 0.012
      fillField()
      if (age >= gap) doRegrid()
      age++

      ctx.fillStyle = '#080f1b'
      ctx.fillRect(0, 0, W, H)
      paintField()

      // leaf blocks, coloured by level
      const per = [0, 0, 0, 0]
      ctx.lineWidth = 1
      for (let l = 0; l <= ml; l++) {
        const nbx = BASE << l
        const bs = PS / nbx
        ctx.strokeStyle = LEVEL_COL[l]
        ctx.globalAlpha = l === 0 ? 0.35 : 0.75
        ctx.beginPath()
        for (let bi = 0; bi < nbx; bi++)
          for (let bj = 0; bj < nbx; bj++) {
            const bid = bi * nbx + bj
            if (!live[l][bid] || (l < ml && refined[l][bid])) continue
            per[l] += BLOCK * BLOCK
            ctx.rect(PX + bi * bs, PY + PS - (bj + 1) * bs, bs, bs)
          }
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // cells the sensor wants refined *now* but that sit on a coarse leaf
      sensor(lev[TOP])
      const sfine = lev[TOP].s
      let escaped = 0
      const cs = PS / NEFF
      ctx.fillStyle = 'rgba(248,113,113,0.85)'
      ctx.beginPath()
      for (let i = 0; i < NEFF; i++)
        for (let j = 0; j < NEFF; j++) {
          if (sfine[i * NEFF + j] <= th) continue
          if (leafLevel[i * NEFF + j] >= ml) continue
          escaped++
          ctx.rect(PX + i * cs, PY + PS - (j + 1) * cs, Math.max(cs, 1.6), Math.max(cs, 1.6))
        }
      ctx.fill()

      const leaf = per.reduce((a, b) => a + b, 0)
      const uni = ((BASE * BLOCK) << ml) ** 2

      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(PX, PY, PS, PS)
      text('Kelvin-Helmholtz shear layer, tagged live', PX, PY - 26, '#e2e8f0', 'bold 13px ui-monospace, monospace')
      text('boxes = leaf blocks   red = sensor fires, mesh has not followed', PX, PY - 10, '#64748b')

      // ---- right column -------------------------------------------------
      const RX = PX + PS + 26
      text('LEAF CELLS', RX, PY + 4, '#94a3b8', 'bold 11px ui-monospace, monospace')
      text(`${leaf}`, RX, PY + 30, '#fbbf24', 'bold 24px ui-monospace, monospace')
      text(`uniform  ${uni}`, RX, PY + 50, '#64748b')
      const frac = leaf / uni
      text(`${(100 * frac).toFixed(1)} % of uniform`, RX, PY + 68, '#34d399', 'bold 12px ui-monospace, monospace')
      text(`speedup  x${(1 / frac).toFixed(1)}`, RX, PY + 86, '#34d399')

      const BW = 250
      let by = PY + 116
      text('cells per level', RX, by, '#94a3b8')
      by += 10
      for (let l = 0; l <= ml; l++) {
        const w = leaf > 0 ? (BW * per[l]) / leaf : 0
        ctx.fillStyle = LEVEL_COL[l]
        ctx.fillRect(RX, by + 6, Math.max(w, 1), 12)
        text(`L${l}`, RX + BW + 6, by + 16, LEVEL_COL[l])
        text(`${per[l]}`, RX + 4, by + 16, per[l] > 0 && w > 46 ? '#0b1220' : '#94a3b8', 'bold 10px ui-monospace, monospace')
        by += 20
      }

      by += 16
      text('UNDER-RESOLVED CELLS', RX, by, '#94a3b8', 'bold 11px ui-monospace, monospace')
      text(`${escaped}`, RX, by + 28, escaped > 0 ? '#f87171' : '#34d399', 'bold 24px ui-monospace, monospace')
      text(
        escaped > 0 ? 'the layer outran the patch' : 'the buffer is holding',
        RX, by + 46,
        escaped > 0 ? '#f87171' : '#34d399'
      )

      by += 74
      text(`steps since regrid   ${Math.min(age, 999)}`, RX, by, '#64748b')
      text(`regrid interval      ${gap}`, RX, by + 16, '#64748b')
      ctx.fillStyle = 'rgba(148,163,184,0.25)'
      ctx.fillRect(RX, by + 26, BW, 5)
      ctx.fillStyle = age >= gap ? '#f87171' : '#38bdf8'
      ctx.fillRect(RX, by + 26, (BW * Math.min(age, gap)) / gap, 5)

      if (frame++ % 12 === 0) setStat({ leaf, uni, escaped, age: Math.min(age, 999), per })
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }
  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }
  const btn = (active: boolean, col: string): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>threshold</span>
          <input type="range" min={0.1} max={0.9} step={0.01} value={thresh} onChange={(e) => setThresh(parseFloat(e.target.value))} />
          <span style={mono}>{thresh.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>n_buf</span>
          <input type="range" min={0} max={4} step={1} value={nbuf} onChange={(e) => setNbuf(parseInt(e.target.value))} />
          <span style={mono}>{nbuf}</span>
        </label>
        <label style={label}>
          <span style={name}>max level</span>
          <input type="range" min={1} max={3} step={1} value={maxLev} onChange={(e) => setMaxLev(parseInt(e.target.value))} />
          <span style={mono}>{maxLev}</span>
        </label>
        <label style={label}>
          <span style={name}>regrid every</span>
          <input type="range" min={1} max={40} step={1} value={regrid} onChange={(e) => setRegrid(parseInt(e.target.value))} />
          <span style={mono}>{regrid}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setRegridNow((v) => v + 1)} style={btn(false, '#fbbf24')}>
          regrid now
        </button>
        <span style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
          leaf {stat.leaf} / {stat.uni} &nbsp;·&nbsp; under-resolved {stat.escaped}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        set n_buf to 0 and drag &ldquo;regrid every&rdquo; up to 30: red cells appear along the layer every cycle and clear
        the instant the mesh is rebuilt &mdash; that is the feature running out of its own patch. Push n_buf back to 2 and
        the red stops, but watch the leaf-cell count climb. Raising the threshold thins the patch the other way.
      </div>
    </div>
  )
}
