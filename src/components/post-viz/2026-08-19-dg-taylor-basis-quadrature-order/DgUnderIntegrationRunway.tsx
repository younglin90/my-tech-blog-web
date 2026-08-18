'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A live DG-P2 solver for u_t + u_x = 0 on a periodic ring, u0 = exp(sin x).
//
// Every cell carries three Legendre modes, so the solution is a piecewise
// parabola that is allowed to jump at every face — the jumps you see are the
// "discontinuous" in discontinuous Galerkin, and an upwind flux is what glues
// them together.
//
// The only knob that matters is the number of Gauss points used for the volume
// integral. The integrand there has degree 2p-1 = 3, so a 2-point rule is
// already exact and a 3-point rule changes nothing. A 1-point rule is exact
// only to degree 1: it feeds the scheme a wrong volume term every step, and
// the ring blows up instead of merely losing an order.
// ---------------------------------------------------------------------------

const W = 726
const H = 400

const PX = 46
const PW = 500
const PY = 56
const PH = 268
const RX = PX + PW + 24
const K = 3

const GQ: Record<number, { x: number[]; w: number[] }> = {
  1: { x: [0], w: [2] },
  2: { x: [-0.5773502691896257, 0.5773502691896257], w: [1, 1] },
  3: { x: [-0.7745966692414834, 0, 0.7745966692414834], w: [5 / 9, 8 / 9, 5 / 9] },
}
const G6 = {
  x: [
    -0.9324695142031521, -0.6612093864662645, -0.2386191860831969, 0.2386191860831969, 0.6612093864662645,
    0.9324695142031521,
  ],
  w: [0.1713244923791704, 0.3607615730481386, 0.4679139345726910, 0.4679139345726910, 0.3607615730481386, 0.1713244923791704],
}

const phi = (i: number, s: number) => (i === 0 ? 1 : i === 1 ? s : 1.5 * s * s - 0.5)
const dphi = (i: number, s: number) => (i === 0 ? 0 : i === 1 ? 1 : 3 * s)
const u0 = (x: number) => Math.exp(Math.sin(x))

function residual(U: number[][], h: number, nq: number) {
  const n = U.length
  const q = GQ[nq]
  const uR = new Array(n)
  for (let j = 0; j < n; j++) {
    let s = 0
    for (let i = 0; i < K; i++) s += U[j][i] * phi(i, 1)
    uR[j] = s
  }
  const out: number[][] = []
  for (let j = 0; j < n; j++) {
    const fR = uR[j] // a = 1 > 0: the face flux is the left trace
    const fL = uR[(j - 1 + n) % n]
    const row = new Array(K)
    for (let i = 0; i < K; i++) {
      let vol = 0
      for (let k = 0; k < q.x.length; k++) {
        let uh = 0
        for (let m = 0; m < K; m++) uh += U[j][m] * phi(m, q.x[k])
        vol += q.w[k] * dphi(i, q.x[k]) * uh
      }
      row[i] = ((vol - (phi(i, 1) * fR - phi(i, -1) * fL)) * (2 * i + 1)) / h
    }
    out.push(row)
  }
  return out
}

export function DgUnderIntegrationRunway() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [nq, setNq] = useState(2)
  const [nc, setNc] = useState(16)
  const [rate, setRate] = useState(0.5)
  const [running, setRunning] = useState(true)
  const [info, setInfo] = useState({ t: 0, err: 0, jump: 0, dead: false })

  const cfg = useRef({ nq, nc, rate, running })
  cfg.current = { nq, nc, rate, running }
  const key = `${nq}|${nc}`
  const want = useRef(key)
  want.current = key

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let frame = 0
    let stamp = ''
    let U: number[][] = []
    let h = 1
    let tSim = 0
    let dead = false

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const init = () => {
      const n = cfg.current.nc
      h = (2 * Math.PI) / n
      U = []
      for (let j = 0; j < n; j++) {
        const xc = h * (j + 0.5)
        const row = new Array(K)
        for (let i = 0; i < K; i++) {
          let s = 0
          for (let k = 0; k < 6; k++) s += G6.w[k] * phi(i, G6.x[k]) * u0(xc + (h / 2) * G6.x[k])
          row[i] = (((2 * i + 1) / 2) * s)
        }
        U.push(row)
      }
      tSim = 0
      dead = false
      stamp = want.current
    }

    const advance = (dtWall: number) => {
      const { nq: n } = cfg.current
      const dt = 0.12 * h // CFL on the P2 stencil
      let left = dtWall
      while (left > 1e-9 && !dead) {
        const s = Math.min(dt, left)
        const R0 = residual(U, h, n)
        const U1 = U.map((r, j) => r.map((v, i) => v + s * R0[j][i]))
        const R1 = residual(U1, h, n)
        const U2 = U.map((r, j) => r.map((v, i) => 0.75 * v + 0.25 * (U1[j][i] + s * R1[j][i])))
        const R2 = residual(U2, h, n)
        U = U.map((r, j) => r.map((v, i) => (v + 2 * (U2[j][i] + s * R2[j][i])) / 3))
        tSim += s
        left -= s
        if (!Number.isFinite(U[0][0]) || Math.abs(U[0][0]) > 40) dead = true
      }
    }

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw)
      const dtWall = last ? Math.min((ts - last) / 1000, 0.05) : 0
      last = ts
      frame++
      if (stamp !== want.current) init()
      const { running: run, rate: rt, nq: n, nc: cells } = cfg.current
      if (run && !dead) advance(dtWall * rt)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(15,23,42,0.8)'
      ctx.fillRect(PX, PY, PW, PH)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(PX, PY, PW, PH)

      const lo = -0.4
      const hi = 3.2
      const xOf = (x: number) => PX + (x / (2 * Math.PI)) * PW
      const yOf = (v: number) => PY + PH - ((v - lo) / (hi - lo)) * PH

      text('DG-P2 ON A PERIODIC RING   u_t + u_x = 0', PX, 22, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text('white dashes = exact solution  exp(sin(x - t))', PX, 40, '#64748b')

      // cell borders
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let j = 0; j <= cells; j++) {
        ctx.beginPath()
        ctx.moveTo(xOf(j * h), PY)
        ctx.lineTo(xOf(j * h), PY + PH)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.beginPath()
      ctx.moveTo(PX, yOf(0))
      ctx.lineTo(PX + PW, yOf(0))
      ctx.stroke()

      // exact
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = 'rgba(226,232,240,0.75)'
      ctx.beginPath()
      for (let k = 0; k <= 240; k++) {
        const x = ((2 * Math.PI) * k) / 240
        const y = yOf(u0(x - tSim))
        if (k === 0) ctx.moveTo(xOf(x), y)
        else ctx.lineTo(xOf(x), y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // piecewise parabolas, one polyline per cell so the face jumps stay visible
      let jump = 0
      let err2 = 0
      const clamp = (v: number) => Math.max(lo, Math.min(hi, v))
      for (let j = 0; j < cells; j++) {
        ctx.strokeStyle = dead ? '#f87171' : '#fbbf24'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let k = 0; k <= 8; k++) {
          const s = -1 + (2 * k) / 8
          let uh = 0
          for (let i = 0; i < K; i++) uh += U[j][i] * phi(i, s)
          const x = h * (j + 0.5) + (h / 2) * s
          if (k === 0) ctx.moveTo(xOf(x), yOf(clamp(uh)))
          else ctx.lineTo(xOf(x), yOf(clamp(uh)))
        }
        ctx.stroke()
        ctx.lineWidth = 1

        let right = 0
        let nextLeft = 0
        for (let i = 0; i < K; i++) {
          right += U[j][i] * phi(i, 1)
          nextLeft += U[(j + 1) % cells][i] * phi(i, -1)
        }
        jump += Math.abs(right - nextLeft)
        const xc = h * (j + 0.5)
        for (let k = 0; k < 6; k++) {
          let uh = 0
          for (let i = 0; i < K; i++) uh += U[j][i] * phi(i, G6.x[k])
          const e = uh - u0(xc + (h / 2) * G6.x[k] - tSim)
          err2 += G6.w[k] * e * e * (h / 2)
        }
      }
      jump /= cells
      const err = Math.sqrt(Math.max(err2, 0))

      for (let t = 0; t <= 4; t++) {
        const x = ((2 * Math.PI) * t) / 4
        text((x / Math.PI).toFixed(1) + 'pi', xOf(x) - 12, PY + PH + 18, '#64748b')
      }
      text('x', PX + PW + 6, PY + PH + 4, '#64748b')

      // readouts
      text('QUADRATURE', RX, PY - 12, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      const row = (lbl: string, v: string, y: number, col: string) => {
        text(lbl, RX, y, '#94a3b8')
        text(v, RX + 76, y, col, 'bold 12px ui-monospace, monospace')
      }
      row('points n', String(n), PY + 10, '#e2e8f0')
      row('exact to', `deg ${2 * n - 1}`, PY + 30, '#e2e8f0')
      row('needs', 'deg 3', PY + 50, '#e2e8f0')

      const ok = 2 * n - 1 >= 3
      ctx.fillStyle = ok ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'
      ctx.fillRect(RX, PY + 68, 132, 28)
      ctx.strokeStyle = ok ? '#34d399' : '#f87171'
      ctx.strokeRect(RX, PY + 68, 132, 28)
      text(ok ? 'CONSISTENT' : 'UNDER-INTEGRATED', RX + 8, PY + 87, ok ? '#34d399' : '#f87171', 'bold 11px ui-monospace, monospace')

      row('t', tSim.toFixed(2), PY + 124, '#e2e8f0')
      row('L2 error', dead ? 'diverged' : err.toExponential(2), PY + 144, dead || err > 0.1 ? '#f87171' : '#34d399')
      row('face jump', dead ? '--' : jump.toExponential(2), PY + 164, '#94a3b8')
      row('cells N', String(cells), PY + 184, '#e2e8f0')

      if (dead) {
        text('SOLUTION BLEW UP', RX, PY + 222, '#f87171', 'bold 12px ui-monospace, monospace')
        text('press restart', RX, PY + 240, '#94a3b8')
      } else {
        text('yellow = u_h, one', RX, PY + 222, '#64748b')
        text('parabola per cell', RX, PY + 238, '#64748b')
      }

      if (frame % 12 === 0) setInfo({ t: tSim, err, jump, dead })
    }

    init()
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
          <span style={name}>Gauss points n</span>
          <input type="range" min={1} max={3} step={1} value={nq} onChange={(e) => setNq(parseInt(e.target.value, 10))} />
          <span style={mono}>{nq}</span>
        </label>
        <label style={label}>
          <span style={name}>cells N</span>
          <input type="range" min={8} max={40} step={4} value={nc} onChange={(e) => setNc(parseInt(e.target.value, 10))} />
          <span style={mono}>{nc}</span>
        </label>
        <label style={label}>
          <span style={name}>play rate</span>
          <input type="range" min={0.1} max={1.2} step={0.05} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} />
          <span style={mono}>{rate.toFixed(2)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setRunning(!running)} style={btn(running)}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={() => setNc(nc === 16 ? 20 : 16)} style={btn(false)}>
          restart
        </button>
        <span style={{ ...mono, color: '#94a3b8', minWidth: 0 }}>
          t = {info.t.toFixed(2)} · L2 {info.dead ? 'diverged' : info.err.toExponential(2)}
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Watch the face jumps first: they are tiny while the rule is consistent, and they are what the upwind flux has to reconcile.
        Now drag <em>Gauss points</em> from 3 to 2 — nothing moves, the L2 readout does not budge. Drag to 1 and the parabolas tear
        apart within a fraction of a revolution. Adding cells only makes it happen sooner.
      </div>
    </div>
  )
}
