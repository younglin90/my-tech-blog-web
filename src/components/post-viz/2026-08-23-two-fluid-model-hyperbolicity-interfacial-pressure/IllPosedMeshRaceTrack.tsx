'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Ill-posedness has a signature that instability does not: the growth rate of
// the shortest resolved mode is proportional to the wavenumber,
//
//     growth(N) = k * |Im λ|,      k = pi / dx = pi * N   (L = 1 m)
//
// so every mesh refinement makes the blow-up arrive sooner, not later. Four
// grids race here; the amplitude axis is log10. Raise sigma past 1 and the
// interfacial-pressure term makes Im λ vanish — every lane goes flat at once.
// ---------------------------------------------------------------------------

const W = 726
const H = 442

const PX0 = 72
const PX1 = 596
const PY0 = 44
const PY1 = 312

const RHO_G = 1.2
const RHO_L = 1000

const GRIDS = [
  { n: 50, col: '#38bdf8' },
  { n: 100, col: '#34d399' },
  { n: 200, col: '#fbbf24' },
  { n: 400, col: '#f87171' },
]

const T_WINDOW = 0.08 // seconds of physical time on the x axis
const LOG_MAX = 6 // 10^6 = "blown up"

function imagPart(a: number, sigma: number, ur: number) {
  if (sigma >= 1) return 0
  const al = 1 - a
  const den = al * RHO_G + a * RHO_L
  const scale = (Math.sqrt(a * al * RHO_G * RHO_L) * ur) / den
  return Math.sqrt(1 - sigma) * scale
}

export function IllPosedMeshRaceTrack() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [sigma, setSigma] = useState(0)
  const [ur, setUr] = useState(10)
  const [running, setRunning] = useState(true)
  const [tShown, setTShown] = useState(0)

  const live = useRef({ sigma, ur, running })
  live.current = { sigma, ur, running }
  const setTRef = useRef(setTShown)
  setTRef.current = setTShown

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let cursor = 0 // physical time of the sweeping cursor, in seconds
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const xOf = (t: number) => PX0 + (t / T_WINDOW) * (PX1 - PX0)
    const yOf = (lg: number) => PY1 - (lg / LOG_MAX) * (PY1 - PY0)

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const L = live.current

      if (L.running) {
        cursor += dt * (T_WINDOW / 6) // one sweep every 6 seconds
        if (cursor > T_WINDOW) cursor = 0
      }
      frame++
      if (frame % 12 === 0) setTRef.current(cursor)

      const im = imagPart(0.5, L.sigma, L.ur)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- frame + grid ----
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0)
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let d = 1; d < LOG_MAX; d++) {
        ctx.beginPath()
        ctx.moveTo(PX0, yOf(d))
        ctx.lineTo(PX1, yOf(d))
        ctx.stroke()
        text('1e' + d, PX0 - 34, yOf(d) + 4, '#64748b', '10px ui-monospace, monospace')
      }
      text('1e0', PX0 - 34, yOf(0) + 4, '#64748b', '10px ui-monospace, monospace')
      for (let i = 0; i <= 4; i++) {
        const t = (i / 4) * T_WINDOW
        ctx.beginPath()
        ctx.moveTo(xOf(t), PY0)
        ctx.lineTo(xOf(t), PY1)
        ctx.stroke()
        text((t * 1000).toFixed(0), xOf(t) - 8, PY1 + 16, '#64748b', '10px ui-monospace, monospace')
      }
      text('amplitude', PX0 - 60, PY0 - 8, '#94a3b8', '10px ui-monospace, monospace')
      text('physical time  (ms)', PX1 - 116, PY1 + 32, '#94a3b8', '10px ui-monospace, monospace')
      text('MESH REFINEMENT RACE', PX0, 28, '#cbd5e1', 'bold 12px ui-monospace, monospace')

      // ---- blow-up line ----
      ctx.strokeStyle = 'rgba(248,113,113,0.5)'
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(PX0, yOf(LOG_MAX))
      ctx.lineTo(PX1, yOf(LOG_MAX))
      ctx.stroke()
      ctx.setLineDash([])
      text('blow-up', PX0 + 6, yOf(LOG_MAX) + 14, '#f87171', '10px ui-monospace, monospace')

      // ---- one curve per grid ----
      const legend: { n: number; col: string; rate: number; tCross: number | null }[] = []
      for (const g of GRIDS) {
        const rate = Math.PI * g.n * im // 1/s
        const tCross = rate > 0 ? (LOG_MAX * Math.LN10) / rate : null
        legend.push({ n: g.n, col: g.col, rate, tCross })

        ctx.strokeStyle = g.col
        ctx.lineWidth = 2
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= 260; i++) {
          const t = (i / 260) * Math.min(cursor, T_WINDOW)
          const lg = (rate * t) / Math.LN10
          if (lg > LOG_MAX) break
          if (!started) {
            ctx.moveTo(xOf(t), yOf(lg))
            started = true
          } else ctx.lineTo(xOf(t), yOf(lg))
        }
        ctx.stroke()
        ctx.lineWidth = 1

        // head marker
        const lgNow = (rate * cursor) / Math.LN10
        if (lgNow <= LOG_MAX) {
          ctx.fillStyle = g.col
          ctx.beginPath()
          ctx.arc(xOf(cursor), yOf(lgNow), 4, 0, 2 * Math.PI)
          ctx.fill()
        } else if (tCross != null) {
          ctx.fillStyle = g.col
          ctx.beginPath()
          ctx.arc(xOf(tCross), yOf(LOG_MAX), 5, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      // ---- cursor ----
      ctx.strokeStyle = 'rgba(226,232,240,0.35)'
      ctx.beginPath()
      ctx.moveTo(xOf(cursor), PY0)
      ctx.lineTo(xOf(cursor), PY1)
      ctx.stroke()

      // ---- side legend ----
      const SX = 612
      text('GRID', SX, PY0 + 4, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      let ly = PY0 + 30
      for (const l of legend) {
        ctx.fillStyle = l.col
        ctx.fillRect(SX, ly - 8, 10, 10)
        text('N=' + l.n, SX + 16, ly + 1, '#e2e8f0', '11px ui-monospace, monospace')
        ly += 17
        text(l.rate > 0 ? l.rate.toFixed(0) + ' 1/s' : 'no growth', SX + 16, ly + 1, '#94a3b8', '10px ui-monospace, monospace')
        ly += 17
        text(l.tCross != null ? (l.tCross * 1000).toFixed(1) + ' ms' : '—', SX + 16, ly + 1, '#64748b', '10px ui-monospace, monospace')
        ly += 24
      }

      // ---- readout ----
      const ry = PY1 + 66
      const put = (lbl: string, v: string, c: string, x: number) => {
        text(lbl, x, ry, '#94a3b8')
        text(v, x + 122, ry, c, 'bold 11px ui-monospace, monospace')
      }
      const ill = im > 1e-12
      put('|Im λ|  (m/s)', im.toExponential(2), ill ? '#f87171' : '#34d399', PX0)
      put('N: 50 → 400', ill ? 'growth x8.0' : 'flat', ill ? '#f87171' : '#34d399', 300)
      ctx.fillStyle = ill ? 'rgba(248,113,113,0.18)' : 'rgba(52,211,153,0.18)'
      ctx.fillRect(SX - 66, ry - 15, 178, 24)
      text(ill ? 'refining makes it worse' : 'refining is safe', SX - 56, ry + 2, ill ? '#f87171' : '#34d399', 'bold 11px ui-monospace, monospace')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 62 }
  const btn: CSSProperties = {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: running ? 'rgba(56,189,248,0.15)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ race'}
        </button>
        <label style={label}>
          <span style={nameS}>sigma</span>
          <input type="range" min={0} max={1.5} step={0.02} value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} />
          <span style={mono}>{sigma.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>slip u_r</span>
          <input type="range" min={0} max={30} step={0.5} value={ur} onChange={(e) => setUr(parseFloat(e.target.value))} />
          <span style={mono}>{ur.toFixed(1)} m/s</span>
        </label>
        <span style={{ ...nameS, fontSize: 12 }}>t = {(tShown * 1000).toFixed(1)} ms</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Watch the order in which the lanes hit the blow-up line: the finest grid always gets there first, and doubling N halves
        the time. Drag <em>sigma</em> past 1 and every lane goes flat at the same instant — the cure is in the closure, not in
        the mesh.
      </div>
    </div>
  )
}
