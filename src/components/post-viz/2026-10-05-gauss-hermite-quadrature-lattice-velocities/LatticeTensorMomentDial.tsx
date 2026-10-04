'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

function he(n: number, v: number): number {
  let a = 1
  let b = v
  if (n === 0) return a
  for (let k = 1; k < n; k++) {
    const next = v * b - k * a
    a = b
    b = next
  }
  return b
}

function factorial(n: number): number {
  let f = 1
  for (let k = 2; k <= n; k++) f *= k
  return f
}

function gaussHermite1D(Q: number): { nodes: number[]; weights: number[] } {
  const nodes: number[] = []
  const step = 2e-3
  let x0 = -8
  let f0 = he(Q, x0)
  while (x0 < 8) {
    const x1 = x0 + step
    const f1 = he(Q, x1)
    if (f0 === 0 || f0 * f1 < 0) {
      let a = x0
      let b = x1
      for (let i = 0; i < 60; i++) {
        const m = 0.5 * (a + b)
        if (he(Q, a) * he(Q, m) <= 0) b = m
        else a = m
      }
      nodes.push(0.5 * (a + b))
    }
    x0 = x1
    f0 = f1
  }
  return { nodes, weights: nodes.map((v) => factorial(Q) / (Q * Q * he(Q - 1, v) ** 2)) }
}

type Node2D = { cx: number; cy: number; w: number }

/** 1D rule -> 2D product rule. thermal units: c_s = 1 */
function tensorLattice(Q: number): Node2D[] {
  const { nodes, weights } = gaussHermite1D(Q)
  const out: Node2D[] = []
  for (let i = 0; i < nodes.length; i++)
    for (let j = 0; j < nodes.length; j++)
      out.push({ cx: nodes[i], cy: nodes[j], w: weights[i] * weights[j] })
  return out
}

/** truncated Hermite equilibrium for u = (ux, 0), c_s = 1 */
function feqHermite(lat: Node2D[], ux: number, order: number): number[] {
  return lat.map(({ cx, w }) => {
    let s = 1 + cx * ux
    if (order >= 2) s += 0.5 * ux * ux * (cx * cx - 1)
    if (order >= 3) s += (ux ** 3 * (cx ** 3 - 3 * cx)) / 6
    return w * s
  })
}

const W = 760
const H = 400

export function LatticeTensorMomentDial() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [Q, setQ] = useState(3)
  const [order, setOrder] = useState(2)
  const [ux, setUx] = useState(0.2)
  const [drift, setDrift] = useState(true)
  const frame = useRef(0)
  const dots = useRef<{ i: number; t: number }[]>([])
  const [readout, setReadout] = useState({ m3: 0, m3e: 0, m4: 0, m4e: 0 })

  const lat = useMemo(() => tensorLattice(Q), [Q])
  const feq = useMemo(() => feqHermite(lat, ux, order), [lat, ux, order])

  const moments = useMemo(() => {
    let m3 = 0
    let m4 = 0
    for (let i = 0; i < lat.length; i++) {
      m3 += feq[i] * lat[i].cx ** 3
      m4 += feq[i] * lat[i].cx ** 4
    }
    return { m3, m3e: 3 * ux + ux ** 3, m4, m4e: 3 + 6 * ux ** 2 + ux ** 4 }
  }, [lat, feq, ux])

  useEffect(() => {
    dots.current = []
    for (let i = 0; i < lat.length; i++)
      for (let k = 0; k < 3; k++) dots.current.push({ i, t: Math.random() })
  }, [lat])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      frame.current++
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      // ---- left: the lattice ----
      const cxp = 200
      const cyp = H / 2 + 6
      const span = Q === 3 ? 1.95 : 3.1
      const scale = 128 / span
      const wMax = Math.max(...lat.map((n) => n.w))
      const fMax = Math.max(...feq)

      ctx.strokeStyle = '#21262d'
      ctx.lineWidth = 1
      for (let g = -3; g <= 3; g++) {
        ctx.beginPath()
        ctx.moveTo(cxp - 140, cyp + g * 46)
        ctx.lineTo(cxp + 140, cyp + g * 46)
        ctx.moveTo(cxp + g * 46, cyp - 140)
        ctx.lineTo(cxp + g * 46, cyp + 140)
        ctx.stroke()
      }

      // drifting tracers along each discrete velocity
      if (drift) {
        for (const d of dots.current) {
          d.t += 0.012
          if (d.t > 1) d.t -= 1
          const n = lat[d.i]
          const f = feq[d.i] / fMax
          if (f < 0.02) continue
          const x = cxp + n.cx * scale * d.t
          const y = cyp - n.cy * scale * d.t
          ctx.fillStyle = `rgba(88,166,255,${0.1 + 0.55 * f * (1 - d.t)})`
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      for (let i = 0; i < lat.length; i++) {
        const n = lat[i]
        const x = cxp + n.cx * scale
        const y = cyp - n.cy * scale
        const f = feq[i]
        const r = 3 + 22 * Math.sqrt(Math.max(f, 0) / fMax)
        const excess = f / (n.w) - 1 // local departure from rest equilibrium
        const hue = excess >= 0 ? '239,118,62' : '88,166,255'
        ctx.fillStyle = `rgba(${hue},${0.25 + 0.6 * Math.min(1, Math.abs(excess) * 2.2)})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#30363d'
        ctx.lineWidth = 1
        ctx.stroke()
        if (Q === 3) {
          ctx.fillStyle = '#c9d1d9'
          ctx.font = '9px ui-monospace, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${Math.round(n.w * 36)}/36`, x, y - r - 4)
        }
      }
      // mean-velocity arrow
      const aw = ux * scale * 3
      ctx.strokeStyle = '#d29922'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cxp, cyp + 158)
      ctx.lineTo(cxp + aw, cyp + 158)
      ctx.lineTo(cxp + aw - 6, cyp + 154)
      ctx.moveTo(cxp + aw, cyp + 158)
      ctx.lineTo(cxp + aw - 6, cyp + 162)
      ctx.stroke()
      ctx.fillStyle = '#d29922'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`u = ${ux.toFixed(2)}`, cxp + aw + 8, cyp + 162)

      ctx.fillStyle = '#c9d1d9'
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`D2Q${lat.length}  from Q=${Q} per axis`, 24, 22)
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('disk area ~ f_i^eq   orange: above rest weight', 24, 38)
      void wMax

      // ---- right: moment bars ----
      const bx = 410
      const bw = 300
      const rows: { label: string; got: number; want: number }[] = [
        { label: 'Pi_xxx  = sum f c_x^3', got: moments.m3, want: moments.m3e },
        { label: 'Pi_xxxx = sum f c_x^4', got: moments.m4, want: moments.m4e },
      ]
      rows.forEach((r, k) => {
        const y = 86 + k * 128
        ctx.fillStyle = '#c9d1d9'
        ctx.font = '12px ui-monospace, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(r.label, bx, y - 22)
        const ref = Math.max(Math.abs(r.want), 1e-12)
        const full = bw
        const gotW = Math.max(0, (Math.abs(r.got) / ref) * full)
        ctx.fillStyle = '#21262d'
        ctx.fillRect(bx, y, full, 20)
        ctx.fillStyle = '#3fb950'
        ctx.fillRect(bx, y, full, 20)
        ctx.fillStyle = '#58a6ff'
        ctx.fillRect(bx, y + 26, Math.min(gotW, full * 1.2), 20)
        const rel = (r.got - r.want) / ref
        ctx.fillStyle = '#8b949e'
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText(`continuum ${r.want.toFixed(6)}`, bx, y + 14 - 0)
        ctx.fillStyle = '#e6edf3'
        ctx.fillText(`lattice   ${r.got.toFixed(6)}`, bx, y + 40)
        ctx.fillStyle = Math.abs(rel) > 1e-9 ? '#f85149' : '#3fb950'
        ctx.font = 'bold 12px ui-monospace, monospace'
        ctx.fillText(`gap ${(rel * 100).toFixed(3)} %`, bx, y + 64)
      })
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText(`Hermite truncation N = ${order}`, bx, H - 24)
      ctx.fillText(`quadrature degree 2Q-1 = ${2 * Q - 1}`, bx, H - 10)

      if (frame.current % 12 === 0) setReadout(moments)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [lat, feq, moments, Q, ux, order, drift])

  return (
    <div style={{ margin: '1.6rem 0', fontFamily: 'ui-monospace, monospace' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 8, border: '1px solid #30363d', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.7rem', alignItems: 'center', fontSize: 13 }}>
        <label>
          Q per axis = <b>{Q}</b>{' '}
          <input type="range" min={3} max={5} step={2} value={Q} onChange={(e) => setQ(Number(e.target.value))} />
        </label>
        <label>
          Hermite order N = <b>{order}</b>{' '}
          <input type="range" min={1} max={3} step={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </label>
        <label>
          u = <b>{ux.toFixed(2)}</b>{' '}
          <input type="range" min={0} max={0.35} step={0.01} value={ux} onChange={(e) => setUx(Number(e.target.value))} />
        </label>
        <button
          onClick={() => setDrift((d) => !d)}
          style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid #30363d', background: '#21262d', color: '#c9d1d9', cursor: 'pointer' }}
        >
          {drift ? 'freeze tracers' : 'stream tracers'}
        </button>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: 13, color: '#8b949e' }}>
        Pi_xxx gap <b style={{ color: Math.abs(readout.m3 - readout.m3e) > 1e-9 ? '#f85149' : '#3fb950' }}>
          {(readout.m3 - readout.m3e).toExponential(2)}
        </b>
        {'  ·  '}Pi_xxxx gap{' '}
        <b style={{ color: Math.abs(readout.m4 - readout.m4e) > 1e-9 ? '#f85149' : '#3fb950' }}>
          {(readout.m4 - readout.m4e).toExponential(2)}
        </b>
      </div>
    </div>
  )
}
