'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Covariant vs contravariant components of ONE vector, on a basis you can bend.
//
//   J        = [g1 | g2]           columns are the covariant base vectors
//   g_ij     = J^T J               metric tensor
//   g^i      = rows of J^-1        contravariant base vectors, g^i . g_j = d^i_j
//
// For a vector v (Cartesian components):
//   contravariant  v^i = (J^-1 v)_i   -> v = v^i g_i   (parallelogram rule)
//   covariant      v_i = (J^T  v)_i   -> v_i = v . g_i (perpendicular drop)
//
// Both describe the same arrow. The metric is what converts one into the other:
//   v_i = g_ij v^j,   and   |v|^2 = g_ij v^i v^j = v_i v^i = v . v
//
// Set skew = 0 and stretch = 1 and the two sets of numbers collapse onto each
// other. That collapse is exactly why the mistake in the post stays hidden on
// a rectangular grid.
// ---------------------------------------------------------------------------

const W = 726
const H = 430

const GX = 236 // geometry panel origin (pixels)
const GY = 232
const U = 92 // pixels per unit length

function invert2(m: number[][]) {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
  return [
    [m[1][1] / det, -m[0][1] / det],
    [-m[1][0] / det, m[0][0] / det],
  ]
}

export function MetricTensorBasisDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [skew, setSkew] = useState(30)
  const [stretch, setStretch] = useState(1.4)
  const [showDual, setShowDual] = useState(true)
  const [running, setRunning] = useState(true)
  const [probe, setProbe] = useState(35)

  const cfg = useRef({ skew, stretch, showDual, running, probe })
  cfg.current = { skew, stretch, showDual, running, probe }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let spin = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }
    const px = (x: number) => GX + x * U
    const py = (y: number) => GY - y * U

    const arrow = (x: number, y: number, col: string, width: number, dash: number[] = [], head = 9) => {
      ctx.strokeStyle = col
      ctx.lineWidth = width
      ctx.setLineDash(dash)
      ctx.beginPath()
      ctx.moveTo(px(0), py(0))
      ctx.lineTo(px(x), py(y))
      ctx.stroke()
      ctx.setLineDash([])
      const a = Math.atan2(-y, x)
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(px(x), py(y))
      ctx.lineTo(px(x) - head * Math.cos(a - 0.4), py(y) - head * Math.sin(a - 0.4))
      ctx.lineTo(px(x) - head * Math.cos(a + 0.4), py(y) - head * Math.sin(a + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const c = cfg.current
      if (c.running) spin += dt * 0.55

      const a = (c.skew * Math.PI) / 180
      const g1 = [1, 0]
      const g2 = [c.stretch * Math.sin(a), c.stretch * Math.cos(a)]
      const J = [
        [g1[0], g2[0]],
        [g1[1], g2[1]],
      ]
      const Ji = invert2(J)
      const gij = [
        [g1[0] * g1[0] + g1[1] * g1[1], g1[0] * g2[0] + g1[1] * g2[1]],
        [g2[0] * g1[0] + g2[1] * g1[1], g2[0] * g2[0] + g2[1] * g2[1]],
      ]
      const gup = invert2(gij)

      const th = (c.probe * Math.PI) / 180 + (c.running ? spin : 0)
      const L = 1.15
      const v = [L * Math.cos(th), L * Math.sin(th)]

      const vUp = [Ji[0][0] * v[0] + Ji[0][1] * v[1], Ji[1][0] * v[0] + Ji[1][1] * v[1]] // v^i
      const vLo = [g1[0] * v[0] + g1[1] * v[1], g2[0] * v[0] + g2[1] * v[1]] // v_i

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- skewed coordinate mesh ----------------------------------------
      ctx.strokeStyle = 'rgba(148,163,184,0.13)'
      ctx.lineWidth = 1
      for (let k = -4; k <= 4; k++) {
        ctx.beginPath()
        ctx.moveTo(px(-3 * g1[0] + k * g2[0]), py(-3 * g1[1] + k * g2[1]))
        ctx.lineTo(px(3 * g1[0] + k * g2[0]), py(3 * g1[1] + k * g2[1]))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(px(-3 * g2[0] + k * g1[0]), py(-3 * g2[1] + k * g1[1]))
        ctx.lineTo(px(3 * g2[0] + k * g1[0]), py(3 * g2[1] + k * g1[1]))
        ctx.stroke()
      }

      // ---- parallelogram: contravariant components ------------------------
      ctx.strokeStyle = 'rgba(56,189,248,0.75)'
      ctx.lineWidth = 1.4
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(px(vUp[0] * g1[0]), py(vUp[0] * g1[1]))
      ctx.lineTo(px(v[0]), py(v[1]))
      ctx.moveTo(px(vUp[1] * g2[0]), py(vUp[1] * g2[1]))
      ctx.lineTo(px(v[0]), py(v[1]))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(56,189,248,0.13)'
      ctx.beginPath()
      ctx.moveTo(px(0), py(0))
      ctx.lineTo(px(vUp[0] * g1[0]), py(vUp[0] * g1[1]))
      ctx.lineTo(px(v[0]), py(v[1]))
      ctx.lineTo(px(vUp[1] * g2[0]), py(vUp[1] * g2[1]))
      ctx.closePath()
      ctx.fill()

      // ---- perpendicular drops: covariant components ----------------------
      const drop = (gv: number[], col: string) => {
        const n2 = gv[0] * gv[0] + gv[1] * gv[1]
        const t = (v[0] * gv[0] + v[1] * gv[1]) / n2
        ctx.strokeStyle = col
        ctx.lineWidth = 1.4
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(px(v[0]), py(v[1]))
        ctx.lineTo(px(t * gv[0]), py(t * gv[1]))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(px(t * gv[0]), py(t * gv[1]), 3.6, 0, 6.2832)
        ctx.fill()
      }
      drop(g1, '#fbbf24')
      drop(g2, '#fbbf24')

      // ---- bases -----------------------------------------------------------
      arrow(g1[0], g1[1], '#34d399', 3)
      arrow(g2[0], g2[1], '#34d399', 3)
      text('g_1', px(g1[0]) + 8, py(g1[1]) + 16, '#34d399', 'bold 12px ui-monospace, monospace')
      text('g_2', px(g2[0]) + 8, py(g2[1]) - 6, '#34d399', 'bold 12px ui-monospace, monospace')

      if (c.showDual) {
        arrow(Ji[0][0], Ji[0][1], '#c084fc', 2, [6, 4], 8)
        arrow(Ji[1][0], Ji[1][1], '#c084fc', 2, [6, 4], 8)
        text('g^1', px(Ji[0][0]) + 8, py(Ji[0][1]) + 14, '#c084fc', 'bold 12px ui-monospace, monospace')
        text('g^2', px(Ji[1][0]) - 30, py(Ji[1][1]) - 6, '#c084fc', 'bold 12px ui-monospace, monospace')
      }

      arrow(v[0], v[1], '#e2e8f0', 3.2, [], 11)
      text('v', px(v[0]) + 10, py(v[1]) - 8, '#e2e8f0', 'bold 13px ui-monospace, monospace')

      ctx.fillStyle = '#64748b'
      ctx.beginPath()
      ctx.arc(px(0), py(0), 3, 0, 6.2832)
      ctx.fill()

      // ---- readout panel ---------------------------------------------------
      const RX = 468
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      ctx.strokeRect(RX - 16, 26, 242, H - 56)

      const mat = (title: string, m: number[][], y: number, col: string) => {
        text(title, RX, y, '#cbd5e1', 'bold 11px ui-monospace, monospace')
        for (let i = 0; i < 2; i++) {
          const row = m[i].map((x) => (x >= 0 ? ' ' : '') + x.toFixed(3)).join('  ')
          text(row, RX + 4, y + 18 + i * 16, col, '12px ui-monospace, monospace')
        }
      }
      mat('METRIC  g_ij = J^T J', gij, 48, '#34d399')
      mat('INVERSE  g^ij', gup, 108, '#c084fc')

      text('COMPONENTS OF v', RX, 178, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      const comp = (lbl: string, val: number[], y: number, col: string) => {
        text(lbl, RX + 4, y, '#94a3b8')
        text(`${val[0] >= 0 ? ' ' : ''}${val[0].toFixed(3)}   ${val[1] >= 0 ? ' ' : ''}${val[1].toFixed(3)}`, RX + 78, y, col, 'bold 12px ui-monospace, monospace')
      }
      comp('v^i  (parallel)', vUp, 200, '#38bdf8')
      comp('v_i  (perp.)', vLo, 220, '#fbbf24')

      const gap = Math.max(Math.abs(vUp[0] - vLo[0]), Math.abs(vUp[1] - vLo[1]))
      text('max | v^i - v_i |', RX + 4, 248, '#94a3b8')
      text(gap.toFixed(4), RX + 108, 248, gap < 1e-3 ? '#34d399' : '#f87171', 'bold 13px ui-monospace, monospace')

      // length three ways
      const lenA = gij[0][0] * vUp[0] * vUp[0] + 2 * gij[0][1] * vUp[0] * vUp[1] + gij[1][1] * vUp[1] * vUp[1]
      const lenB = vLo[0] * vUp[0] + vLo[1] * vUp[1]
      const lenC = v[0] * v[0] + v[1] * v[1]
      text('LENGTH^2, THREE WAYS', RX, 288, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      text(`g_ij v^i v^j   = ${lenA.toFixed(4)}`, RX + 4, 310, '#34d399')
      text(`v_i v^i        = ${lenB.toFixed(4)}`, RX + 4, 328, '#fbbf24')
      text(`v . v          = ${lenC.toFixed(4)}`, RX + 4, 346, '#e2e8f0')

      const naive = vUp[0] * vUp[0] + vUp[1] * vUp[1]
      text(`v^i v^i (no metric) = ${naive.toFixed(4)}`, RX + 4, 372, Math.abs(naive - lenC) < 1e-3 ? '#34d399' : '#f87171')
      text('the metric is not optional', RX + 4, 390, '#64748b', '10px ui-monospace, monospace')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }
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
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>skew of g_2 [deg]</span>
          <input type="range" min={-60} max={60} step={1} value={skew} onChange={(e) => setSkew(parseInt(e.target.value, 10))} />
          <span style={mono}>{skew}</span>
        </label>
        <label style={label}>
          <span style={name}>| g_2 |</span>
          <input type="range" min={0.5} max={2} step={0.05} value={stretch} onChange={(e) => setStretch(parseFloat(e.target.value))} />
          <span style={mono}>{stretch.toFixed(2)}</span>
        </label>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={name}>v angle [deg]</span>
          <input type="range" min={0} max={359} step={1} value={probe} onChange={(e) => setProbe(parseInt(e.target.value, 10))} />
          <span style={mono}>{probe}</span>
        </label>
        <button onClick={() => setShowDual(!showDual)} style={btn(showDual, '#c084fc')}>
          dual basis {showDual ? 'on' : 'off'}
        </button>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause spin' : 'play spin'}
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        The white arrow is one physical vector. Blue dashes slide it along the green base vectors (contravariant v<sup>i</sup>);
        yellow dashes drop it perpendicular onto them (covariant v<sub>i</sub>). Push the skew slider to 0 and |g<sub>2</sub>| to
        1.00: the two rows of numbers merge and <em>max | v^i - v_i |</em> turns green. Anywhere else they differ, and only the
        metric row keeps the length right.
      </div>
    </div>
  )
}
