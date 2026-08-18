'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The DG volume term on one cell:  I = \int_{-1}^{1} dphi_i/dxi * u_h(xi) dxi
//
// phi_i is Legendre mode i (degree i), u_h is the local solution (degree p),
// so the integrand has degree (i-1) + p, at most 2p-1. An n-point Gauss rule
// is exact to degree 2n-1. The whole "minimum quadrature order" rule for DG
// is that one inequality: 2n-1 >= 2p-1, i.e. n >= p.
//
// The sweep bar walks left to right. Green fill = the true area accumulated so
// far. The stacked blocks on the right = the Gauss rule's guess, one block per
// node, each as wide as its weight and as tall as the integrand there. When
// the rule is exact the two totals land on the same tick, whatever you drag.
// ---------------------------------------------------------------------------

const W = 726
const H = 402

const PX = 46
const PW = 430
const PY = 58
const PH = 250
const RX = PX + PW + 26

const GAUSS: Record<number, { x: number[]; w: number[] }> = {
  1: { x: [0], w: [2] },
  2: { x: [-0.5773502691896257, 0.5773502691896257], w: [1, 1] },
  3: { x: [-0.7745966692414834, 0, 0.7745966692414834], w: [5 / 9, 8 / 9, 5 / 9] },
  4: {
    x: [-0.8611363115940526, -0.3399810435848563, 0.3399810435848563, 0.8611363115940526],
    w: [0.3478548451374538, 0.6521451548625461, 0.6521451548625461, 0.3478548451374538],
  },
}

// 8-point Gauss: exact to degree 15, so it is the reference for anything here
const REF = {
  x: [
    -0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498,
    0.525532409916329, 0.7966664774136267, 0.9602898564975363,
  ],
  w: [
    0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620,
    0.3137066458778873, 0.2223810344533745, 0.1012285362903763,
  ],
}

/** Legendre P_n and its derivative by upward recurrence. */
function legendre(n: number, x: number) {
  let p0 = 1
  let p1 = x
  let d0 = 0
  let d1 = 1
  if (n === 0) return { p: p0, d: d0 }
  for (let k = 1; k < n; k++) {
    const p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1)
    const d2 = (2 * k + 1) * p1 + d0
    p0 = p1
    p1 = p2
    d0 = d1
    d1 = d2
  }
  return { p: p1, d: d1 }
}

export function GaussPointExactnessDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [p, setP] = useState(2)
  const [nq, setNq] = useState(2)
  const [mode, setMode] = useState(2)
  const [shape, setShape] = useState(0.6)
  const [running, setRunning] = useState(true)
  const [out, setOut] = useState({ exact: 0, quad: 0 })

  const cfg = useRef({ p, nq, mode, shape, running })
  cfg.current = { p, nq, mode, shape, running }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let sweep = -1
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    // integrand g(xi) = dphi_m/dxi * u_h(xi), with u_h a fixed-shape degree-p polynomial
    const integrand = (xi: number) => {
      const { p: deg, mode: m, shape: s } = cfg.current
      let u = 0
      for (let k = 0; k <= deg; k++) u += Math.cos(1.7 * k + 3.1 * s) * legendre(k, xi).p
      return legendre(Math.min(m, deg), xi).d * u
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      frame++
      const { nq: n, p: deg, mode: m, running: run } = cfg.current
      if (run) sweep += 0.012
      if (sweep > 1.35) sweep = -1

      const g = GAUSS[n]
      let quad = 0
      for (let k = 0; k < n; k++) quad += g.w[k] * integrand(g.x[k])
      let exact = 0
      for (let k = 0; k < 8; k++) exact += REF.w[k] * integrand(REF.x[k])

      let peak = 1e-6
      for (let k = 0; k <= 240; k++) peak = Math.max(peak, Math.abs(integrand(-1 + k / 120)))
      const xOf = (xi: number) => PX + ((xi + 1) / 2) * PW
      const yOf = (v: number) => PY + PH / 2 - (v / (peak * 1.15)) * (PH / 2)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(15,23,42,0.8)'
      ctx.fillRect(PX, PY, PW, PH)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(PX, PY, PW, PH)

      const degInt = Math.min(m, deg) - 1 + deg
      const exactRule = 2 * n - 1 >= degInt

      text('DG VOLUME INTEGRAND ON ONE CELL', PX, 22, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text(`g = dphi_${Math.min(m, deg)}/dxi  x  u_h   ->  degree ${degInt}`, PX, 40, '#64748b')

      // zero line + axis
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.beginPath()
      ctx.moveTo(PX, yOf(0))
      ctx.lineTo(PX + PW, yOf(0))
      ctx.stroke()
      for (const t of [-1, -0.5, 0, 0.5, 1]) {
        ctx.beginPath()
        ctx.moveTo(xOf(t), PY + PH)
        ctx.lineTo(xOf(t), PY + PH + 5)
        ctx.stroke()
        text(t.toFixed(1), xOf(t) - 9, PY + PH + 19, '#64748b')
      }
      text('xi', PX + PW + 6, PY + PH + 4, '#64748b')

      // true area, revealed by the sweep
      const cut = Math.min(1, Math.max(0, sweep))
      ctx.beginPath()
      ctx.moveTo(PX, yOf(0))
      for (let k = 0; k <= 200; k++) {
        const xi = -1 + 2 * (k / 200) * cut
        ctx.lineTo(xOf(xi), yOf(integrand(xi)))
      }
      ctx.lineTo(xOf(-1 + 2 * cut), yOf(0))
      ctx.closePath()
      ctx.fillStyle = 'rgba(52,211,153,0.22)'
      ctx.fill()

      // integrand curve
      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k <= 300; k++) {
        const xi = -1 + (2 * k) / 300
        const y = yOf(integrand(xi))
        if (k === 0) ctx.moveTo(xOf(xi), y)
        else ctx.lineTo(xOf(xi), y)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // quadrature blocks: width = weight, height = g at the node
      for (let k = 0; k < n; k++) {
        const lit = sweep >= (g.x[k] + 1) / 2
        const gv = integrand(g.x[k])
        const half = (g.w[k] / 2 / 2) * PW
        const cx = xOf(g.x[k])
        ctx.fillStyle = lit ? 'rgba(251,191,36,0.28)' : 'rgba(251,191,36,0.07)'
        ctx.fillRect(cx - half, Math.min(yOf(0), yOf(gv)), 2 * half, Math.abs(yOf(gv) - yOf(0)))
        ctx.strokeStyle = lit ? '#fbbf24' : 'rgba(251,191,36,0.3)'
        ctx.strokeRect(cx - half, Math.min(yOf(0), yOf(gv)), 2 * half, Math.abs(yOf(gv) - yOf(0)))
        ctx.fillStyle = lit ? '#fbbf24' : 'rgba(251,191,36,0.35)'
        ctx.beginPath()
        ctx.arc(cx, yOf(gv), 4, 0, 2 * Math.PI)
        ctx.fill()
        text(`w=${g.w[k].toFixed(3)}`, cx - 22, PY + PH - 8, lit ? '#fbbf24' : '#475569', '10px ui-monospace, monospace')
      }

      // sweep bar
      if (cut > 0 && cut < 1) {
        ctx.strokeStyle = 'rgba(226,232,240,0.7)'
        ctx.beginPath()
        ctx.moveTo(xOf(-1 + 2 * cut), PY)
        ctx.lineTo(xOf(-1 + 2 * cut), PY + PH)
        ctx.stroke()
      }

      // readout column
      text('QUADRATURE', RX, PY - 12, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      const row = (lbl: string, v: string, y: number, col: string) => {
        text(lbl, RX, y, '#94a3b8')
        text(v, RX + 74, y, col, 'bold 12px ui-monospace, monospace')
      }
      row('points n', String(n), PY + 10, '#e2e8f0')
      row('exact to', `deg ${2 * n - 1}`, PY + 30, '#e2e8f0')
      row('integrand', `deg ${degInt}`, PY + 50, '#e2e8f0')

      ctx.fillStyle = exactRule ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'
      ctx.fillRect(RX, PY + 68, 196, 30)
      ctx.strokeStyle = exactRule ? '#34d399' : '#f87171'
      ctx.strokeRect(RX, PY + 68, 196, 30)
      text(
        exactRule ? `EXACT   2n-1 >= ${degInt}` : `ALIASED  2n-1 < ${degInt}`,
        RX + 10,
        PY + 88,
        exactRule ? '#34d399' : '#f87171',
        'bold 12px ui-monospace, monospace',
      )

      row('true I', exact.toFixed(6), PY + 128, '#34d399')
      row('sum w g', quad.toFixed(6), PY + 148, '#fbbf24')
      const err = Math.abs(quad - exact)
      row('|error|', err < 1e-12 ? '< 1e-12' : err.toExponential(2), PY + 168, err < 1e-12 ? '#34d399' : '#f87171')

      // error bar
      const bar = Math.min(1, err / (Math.abs(exact) + 1e-9))
      ctx.fillStyle = 'rgba(148,163,184,0.15)'
      ctx.fillRect(RX, PY + 186, 196, 10)
      ctx.fillStyle = err < 1e-12 ? '#34d399' : '#f87171'
      ctx.fillRect(RX, PY + 186, Math.max(2, bar * 196), 10)
      text('relative error', RX, PY + 212, '#64748b')

      text(`DG order p = ${deg}`, RX, PY + 244, '#94a3b8')
      text(`min points = p = ${deg}`, RX, PY + 262, deg <= n ? '#34d399' : '#f87171')

      if (frame % 12 === 0) setOut({ exact, quad })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 40 }
  const btn = (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#38bdf8' : 'transparent',
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
          <span style={name}>DG order p</span>
          <input type="range" min={1} max={4} step={1} value={p} onChange={(e) => setP(parseInt(e.target.value, 10))} />
          <span style={mono}>{p}</span>
        </label>
        <label style={label}>
          <span style={name}>Gauss points n</span>
          <input type="range" min={1} max={4} step={1} value={nq} onChange={(e) => setNq(parseInt(e.target.value, 10))} />
          <span style={mono}>{nq}</span>
        </label>
        <label style={label}>
          <span style={name}>test mode i</span>
          <input type="range" min={1} max={4} step={1} value={mode} onChange={(e) => setMode(parseInt(e.target.value, 10))} />
          <span style={mono}>{Math.min(mode, p)}</span>
        </label>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={name}>u_h shape</span>
          <input type="range" min={0} max={2} step={0.02} value={shape} onChange={(e) => setShape(parseFloat(e.target.value))} />
          <span style={mono}>{shape.toFixed(2)}</span>
        </label>
        <button onClick={() => setRunning(!running)} style={btn(running)}>
          {running ? 'pause sweep' : 'play sweep'}
        </button>
        <span style={{ ...mono, color: '#94a3b8', minWidth: 0 }}>
          true {out.exact.toFixed(4)} · quad {out.quad.toFixed(4)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Set p = 2 and drag <em>Gauss points</em> from 3 down to 2: the badge stays green and the error bar stays empty, because the
        integrand only has degree 3. Drag to 1 and it turns red — no shape of u<sub>h</sub> will bring it back. The minimum is n = p,
        and it is a property of the integrand&rsquo;s degree, not of how fine the mesh is.
      </div>
    </div>
  )
}
