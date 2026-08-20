'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A flat vapor/liquid interface at rest. Two ways to write the non-ideal
// forcing recover the SAME continuum force (Gibbs-Duhem: dp = rho d mu), but
// on the lattice they differ by exactly the discrete Gibbs-Duhem defect:
//
//   G_p - G_mu = -( D[p(rho)] - rho D[mu(rho)] )
//
// That defect is the extra, spurious force the pressure form carries at the
// interface. It is concentrated where the density turns over and collapses
// toward zero as the interface is spread over more cells (dx -> 0).
// ---------------------------------------------------------------------------

const W = 726
const H = 420

const A = 9 / 8
const B = 1 / 3
const R = 1
const T = 0.9

const PLOT_X0 = 66
const PLOT_X1 = 690
const RHO_Y0 = 42
const RHO_Y1 = 188
const F_Y0 = 226
const F_Y1 = 384

const pEos = (r: number) => (r * R * T) / (1 - B * r) - A * r * r
const muEos = (r: number) => R * T * (Math.log(r / (1 - B * r)) + (B * r) / (1 - B * r)) - 2 * A * r

// coexistence densities for T = 0.9 via Newton on equal p and equal mu
function coexist(): [number, number] {
  let a = 0.4
  let b = 1.7
  for (let it = 0; it < 60; it++) {
    const f0 = pEos(a) - pEos(b)
    const f1 = muEos(a) - muEos(b)
    const h = 1e-7
    const dpa = (pEos(a + h) - pEos(a)) / h
    const dpb = -(pEos(b + h) - pEos(b)) / h
    const dma = (muEos(a + h) - muEos(a)) / h
    const dmb = -(muEos(b + h) - muEos(b)) / h
    const det = dpa * dmb - dpb * dma
    a -= (dmb * f0 - dpb * f1) / det
    b -= (-dma * f0 + dpa * f1) / det
  }
  return [a, b]
}

// Density interface of adjustable width; the excess force G_p - G_mu on it.
function profile(cells: number) {
  const [rv, rl] = coexist()
  const N = 160
  const domain = 40
  const dx = domain / N
  const width = cells * dx // interface half-width in physical units
  const xs: number[] = []
  const rho: number[] = []
  for (let i = 0; i < N; i++) {
    const z = (i - N / 2) * dx
    xs.push(i / (N - 1))
    rho.push(0.5 * (rl + rv) - 0.5 * (rl - rv) * Math.tanh(z / width))
  }
  const d1 = (f: (i: number) => number, i: number) => {
    const ip = Math.min(N - 1, i + 1)
    const im = Math.max(0, i - 1)
    return (f(ip) - f(im)) / (2 * dx)
  }
  const excess: number[] = [] // G_p - G_mu = -(D[p] - rho D[mu])
  let maxExcess = 0
  for (let i = 0; i < N; i++) {
    const e = -(d1((k) => pEos(rho[k]), i) - rho[i] * d1((k) => muEos(rho[k]), i))
    excess.push(e)
    if (i > 3 && i < N - 3) maxExcess = Math.max(maxExcess, Math.abs(e))
  }
  return { xs, rho, excess, rv, rl, maxExcess, cellsPerIface: cells }
}

export function ForcingFormGhostInterface() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [cells, setCells] = useState(2.5)
  const [playing, setPlaying] = useState(true)

  const data = useMemo(() => profile(cells), [cells])
  const live = useRef({ data, cells, playing })
  live.current = { data, cells, playing }
  const setCellsRef = useRef(setCells)
  setCellsRef.current = setCells

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let dir = 1
    let acc = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }
    const xOf = (t: number) => PLOT_X0 + t * (PLOT_X1 - PLOT_X0)

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const L = live.current

      if (L.playing) {
        acc += dt
        if (acc > 0.05) {
          acc = 0
          let nc = L.cells + dir * 0.06
          if (nc > 7) {
            nc = 7
            dir = -1
          } else if (nc < 1.5) {
            nc = 1.5
            dir = 1
          }
          setCellsRef.current(parseFloat(nc.toFixed(2)))
        }
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      const d = L.data

      // ===== top panel: density interface =====
      text('DENSITY  rho(x)', PLOT_X0, 26, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(PLOT_X0, RHO_Y0, PLOT_X1 - PLOT_X0, RHO_Y1 - RHO_Y0)
      const ryOf = (r: number) => RHO_Y1 - ((r - 0.2) / (1.9 - 0.2)) * (RHO_Y1 - RHO_Y0)
      text(`liquid ${d.rl.toFixed(2)}`, PLOT_X1 - 96, ryOf(d.rl) + 13, '#f472b6', '10px ui-monospace, monospace')
      text(`vapor ${d.rv.toFixed(2)}`, PLOT_X0 + 6, ryOf(d.rv) - 6, '#60a5fa', '10px ui-monospace, monospace')

      // interface band (10%..90%)
      const lo = d.rv + 0.1 * (d.rl - d.rv)
      const hi = d.rv + 0.9 * (d.rl - d.rv)
      let iA = -1
      let iB = -1
      for (let i = 0; i < d.rho.length; i++) {
        if (iA < 0 && d.rho[i] > lo) iA = i
        if (d.rho[i] > hi) iB = i
      }
      if (iA >= 0 && iB >= 0) {
        const xa = xOf(d.xs[iB])
        const xb = xOf(d.xs[iA])
        ctx.fillStyle = 'rgba(248,113,113,0.10)'
        ctx.fillRect(xa, RHO_Y0, xb - xa, F_Y1 - RHO_Y0)
        text('interface', (xa + xb) / 2 - 26, RHO_Y0 + 14, '#94a3b8', '10px ui-monospace, monospace')
      }

      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 2
      ctx.beginPath()
      d.rho.forEach((r, i) => {
        const x = xOf(d.xs[i])
        const y = ryOf(r)
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      })
      ctx.stroke()
      ctx.lineWidth = 1

      // ===== bottom panel: excess (spurious) force from the pressure form =====
      text('EXTRA FORCE FROM USING p DIRECTLY   G_p - G_mu', PLOT_X0, F_Y0 - 14, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(PLOT_X0, F_Y0, PLOT_X1 - PLOT_X0, F_Y1 - F_Y0)
      const fSpan = 0.05
      const fyOf = (v: number) => (F_Y0 + F_Y1) / 2 - Math.max(-1, Math.min(1, v / fSpan)) * ((F_Y1 - F_Y0) / 2 - 6)
      const zeroY = fyOf(0)
      ctx.strokeStyle = '#34d399'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(PLOT_X0, zeroY)
      ctx.lineTo(PLOT_X1, zeroY)
      ctx.stroke()
      ctx.setLineDash([])
      text('free-energy form = 0', PLOT_X1 - 150, zeroY - 6, '#34d399', '10px ui-monospace, monospace')
      text(`+${fSpan}`, PLOT_X0 - 34, F_Y0 + 12, '#64748b', '10px ui-monospace, monospace')
      text(`-${fSpan}`, PLOT_X0 - 34, F_Y1 - 4, '#64748b', '10px ui-monospace, monospace')

      // filled excess-force curve (pressure form)
      ctx.fillStyle = 'rgba(248,113,113,0.18)'
      ctx.beginPath()
      ctx.moveTo(xOf(d.xs[0]), zeroY)
      d.excess.forEach((v, i) => ctx.lineTo(xOf(d.xs[i]), fyOf(v)))
      ctx.lineTo(xOf(d.xs[d.xs.length - 1]), zeroY)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#f87171'
      ctx.lineWidth = 2
      ctx.beginPath()
      d.excess.forEach((v, i) => {
        const x = xOf(d.xs[i])
        const y = fyOf(v)
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      })
      ctx.stroke()
      ctx.lineWidth = 1

      // ===== readout =====
      const PX = 486
      text('cells / interface', PX, F_Y0 - 66, '#94a3b8', '11px ui-monospace, monospace')
      text(d.cellsPerIface.toFixed(1), PX + 150, F_Y0 - 66, '#fbbf24', 'bold 11px ui-monospace, monospace')
      text('max |G_p - G_mu|', PX, F_Y0 - 46, '#94a3b8', '11px ui-monospace, monospace')
      text(d.maxExcess.toExponential(2), PX + 150, F_Y0 - 46, '#f87171', 'bold 11px ui-monospace, monospace')
      const verdict = d.maxExcess < 2e-3 ? 'resolved: negligible' : 'coarse: spurious flow'
      text(verdict, PX, F_Y0 - 26, d.maxExcess < 2e-3 ? '#34d399' : '#f87171', 'bold 11px ui-monospace, monospace')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 40 }
  const btn: CSSProperties = {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: playing ? 'rgba(56,189,248,0.15)' : 'transparent',
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
        <button style={btn} onClick={() => setPlaying((p) => !p)}>
          {playing ? '❙❙ pause' : '▶ sweep dx'}
        </button>
        <label style={label}>
          <span style={nameS}>resolution (cells / interface)</span>
          <input
            type="range"
            min={1.5}
            max={7}
            step={0.1}
            value={cells}
            onChange={(e) => {
              setPlaying(false)
              setCells(parseFloat(e.target.value))
            }}
          />
          <span style={mono}>{cells.toFixed(1)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        The red hump is the force the pressure form adds over the free-energy form — the discrete Gibbs–Duhem defect. It lives
        exactly on the interface and pushes a fluid that should be at rest. Drag <em>resolution</em> up: the hump collapses onto
        the green zero line. It was never physics, only the price of writing <em>p</em> on too few cells.
      </div>
    </div>
  )
}
