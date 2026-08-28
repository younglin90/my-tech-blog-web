'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// 1D linear acoustics, backward Euler, periodic, N = 32 cells.
//
//   [ I   A ] [p]   [bp]        A = rho c^2 dt D      (pressure  <- velocity)
//   [ B   I ] [v] = [bv]        B = (dt/rho) D        (velocity  <- pressure)
//
// The preconditioner is applied as a stationary iteration on the error:
//
//   block Gauss-Seidel : lower triangle only  -> A is dropped
//                        error operator  [[0, -A], [0, BA]] ,  rho = CFL_a^2
//   point-block SOR    : diagonal block is I (central difference has no
//                        diagonal) -> rho = sqrt((1-w)^2 + w^2 CFL_a^2)
//   Schur complement   : S = I - A B solved exactly -> error operator is 0
//
// The residual curve on the right is the actual iteration, not a formula.
// ---------------------------------------------------------------------------

const W = 760
const H = 440

const N = 32
const DX = 1 / N
const OMEGA = 0.4

const GX = 430
const GY = 40
const GW = 292
const GH = 268
const LOG_HI = 6
const LOG_LO = -10

const COL_P = '#38bdf8'
const COL_V = '#fbbf24'
const COL_BAD = '#f87171'
const COL_OK = '#4ade80'
const COL_DIM = '#64748b'

type Mode = 'gs' | 'sor' | 'schur'

const MODES: Array<[Mode, string]> = [
  ['gs', 'block Gauss-Seidel'],
  ['sor', 'point-block SOR (w=0.4)'],
  ['schur', 'Schur complement'],
]

function deriv(v: number[]) {
  const o = new Array<number>(N)
  for (let i = 0; i < N; i++) o[i] = (v[(i + 1) % N] - v[(i + N - 1) % N]) / (2 * DX)
  return o
}

function norm(a: number[], b: number[]) {
  let s = 0
  for (let i = 0; i < N; i++) s += a[i] * a[i] + b[i] * b[i]
  return Math.sqrt(s)
}

// spectral radius of the error operator, in closed form (drawn as the gain label)
function loopGain(mode: Mode, cfl: number) {
  if (mode === 'schur') return 0
  if (mode === 'gs') return cfl * cfl
  return Math.sqrt((1 - OMEGA) * (1 - OMEGA) + OMEGA * OMEGA * cfl * cfl)
}

const ly = (r: number) => {
  const l = Math.log10(Math.max(r, 1e-16))
  return GY + GH - ((Math.min(Math.max(l, LOG_LO), LOG_HI) - LOG_LO) / (LOG_HI - LOG_LO)) * GH
}

export function BlockCouplingLoopGainScope() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cfl, setCfl] = useState(1.0)
  const [mode, setMode] = useState<Mode>('gs')
  const [running, setRunning] = useState(true)
  const resetRef = useRef(0)
  const [stat, setStat] = useState({ it: 0, res: 1, gain: 1 })

  const live = useRef({ cfl, mode, running })
  live.current = { cfl, mode, running }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let lastKey = ''
    let lastReset = -1

    let ep: number[] = []
    let ev: number[] = []
    let e0 = 1
    let hist: number[] = []
    let phase = 0

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const reset = () => {
      ep = new Array<number>(N)
      ev = new Array<number>(N)
      for (let i = 0; i < N; i++) {
        ep[i] = Math.sin(1.7 * i * i + 0.9 * i + 1)
        ev[i] = Math.sin(0.6 * i * i + 2.1 * i)
      }
      e0 = norm(ep, ev)
      hist = [1]
    }

    const step = (m: Mode, c: number) => {
      const dt = (c * DX) / 1 // sound speed fixed at 1, dt carries the CFL
      const A = (u: number[]) => deriv(u).map((w) => dt * w) // rho = c = 1
      const B = (p: number[]) => deriv(p).map((w) => dt * w)
      if (m === 'schur') {
        ep = ep.map(() => 0)
        ev = ev.map(() => 0)
        return
      }
      if (m === 'gs') {
        const Aev = A(ev)
        const nv = B(Aev)
        ep = Aev.map((x) => -x)
        ev = nv
        return
      }
      const jp = A(ev)
      const jv = B(ep)
      const np = ep.map((x, i) => (1 - OMEGA) * x - OMEGA * jp[i])
      const nv = ev.map((x, i) => (1 - OMEGA) * x - OMEGA * jv[i])
      ep = np
      ev = nv
    }

    const arrow = (x1: number, y1: number, x2: number, y2: number, col: string, dashed: boolean) => {
      ctx.strokeStyle = col
      ctx.lineWidth = 2
      ctx.setLineDash(dashed ? [5, 5] : [])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
      const a = Math.atan2(y2 - y1, x2 - x1)
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4))
      ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { cfl: c, mode: m, running: run } = live.current
      const key = `${c}|${m}`
      if (key !== lastKey || lastReset !== resetRef.current) {
        lastKey = key
        lastReset = resetRef.current
        reset()
      }

      if (run && hist.length < 41) {
        if (frame % 4 === 0) {
          step(m, c)
          hist.push(Math.max(norm(ep, ev) / e0, 1e-16))
        }
        phase += 0.03
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- left: the two-block loop ----------------
      text('Jacobian blocks and the pressure-velocity loop', 34, 26, '#e2e8f0', '12px system-ui, sans-serif')

      const bx = 120
      const pyTop = 78
      const pyBot = 218
      const bw = 130
      const bh = 54

      const boxes: Array<[string, number, string]> = [
        ['pressure  P', pyTop, COL_P],
        ['velocity  v', pyBot, COL_V],
      ]
      boxes.forEach(([lab, y, col]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 1.5
        ctx.strokeRect(bx, y, bw, bh)
        ctx.fillStyle = 'rgba(148,163,184,0.06)'
        ctx.fillRect(bx, y, bw, bh)
        text(lab, bx + 16, y + 32, col, '13px ui-monospace, monospace')
      })

      const dropped = m === 'gs'
      // B : P -> v  (always kept: it is in the lower triangle)
      arrow(bx + 34, pyTop + bh, bx + 34, pyBot, COL_OK, false)
      text('B = (dt/rho) d/dx', bx - 82, pyTop + bh + 44, COL_OK)
      text('kept', bx - 82, pyTop + bh + 60, COL_OK)

      // A : v -> P
      arrow(bx + bw - 34, pyBot, bx + bw - 34, pyTop + bh, dropped ? COL_BAD : COL_P, dropped)
      text('A = rho c^2 dt d/dx', bx + bw - 16, pyTop + bh + 44, dropped ? COL_BAD : COL_P)
      text(dropped ? 'DROPPED by the lower triangle' : m === 'sor' ? 'kept, but only pointwise' : 'eliminated exactly by S', bx + bw - 16, pyTop + bh + 60, dropped ? COL_BAD : COL_P)

      if (dropped) {
        ctx.strokeStyle = COL_BAD
        ctx.lineWidth = 2
        const cxs = bx + bw - 34
        const cys = (pyTop + bh + pyBot) / 2
        ctx.beginPath()
        ctx.moveTo(cxs - 11, cys - 11)
        ctx.lineTo(cxs + 11, cys + 11)
        ctx.moveTo(cxs + 11, cys - 11)
        ctx.lineTo(cxs - 11, cys + 11)
        ctx.stroke()
      }

      // circulating error blob: its radius is the live error norm
      const g = loopGain(m, c)
      const cur = hist[hist.length - 1] ?? 1
      const rad = 4 + 9 * Math.min(1, Math.log10(Math.max(cur, 1e-10)) / 6 + 1)
      const ph = phase % 2
      let dotX: number
      let dotY: number
      if (ph < 1) {
        dotX = bx + 34
        dotY = pyTop + bh + ph * (pyBot - pyTop - bh)
      } else {
        dotX = bx + bw - 34
        dotY = pyBot - (ph - 1) * (pyBot - pyTop - bh)
      }
      if (m !== 'schur') {
        ctx.fillStyle = ph < 1 ? COL_OK : dropped ? COL_BAD : COL_P
        ctx.beginPath()
        ctx.arc(dotX, dotY, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      text(`acoustic CFL   c dt / dx = ${c.toFixed(2)}`, 34, 316, '#cbd5e1', '12px ui-monospace, monospace')
      text(
        m === 'schur' ? 'loop gain per lap = 0  (S = I - A B)' : `loop gain per lap = ${g < 1e4 ? g.toFixed(3) : g.toExponential(2)}`,
        34,
        338,
        g >= 1 ? COL_BAD : COL_OK,
        '12px ui-monospace, monospace',
      )
      text(
        m === 'gs' ? 'gain = CFL_a^2   -> passes 1 at CFL_a = 1' : m === 'sor' ? 'gain = sqrt(0.36 + 0.16 CFL_a^2)  -> passes 1 at CFL_a = 2' : 'the loop is closed, not approximated',
        34,
        358,
        COL_DIM,
      )
      text(
        g >= 1 ? 'error grows every sweep : preconditioner fails' : 'error shrinks every sweep : preconditioner holds',
        34,
        384,
        g >= 1 ? COL_BAD : COL_OK,
        '12px system-ui, sans-serif',
      )

      // ---------------- right: residual history ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(GX, GY, GW, GH)
      for (let l = LOG_LO; l <= LOG_HI; l += 4) {
        const y = ly(Math.pow(10, l))
        ctx.setLineDash([2, 4])
        ctx.strokeStyle = 'rgba(148,163,184,0.18)'
        ctx.beginPath()
        ctx.moveTo(GX, y)
        ctx.lineTo(GX + GW, y)
        ctx.stroke()
        ctx.setLineDash([])
        text(`1e${l}`, GX - 30, y + 4, COL_DIM, '10px ui-monospace, monospace')
      }
      const y1 = ly(1)
      ctx.strokeStyle = 'rgba(248,113,113,0.55)'
      ctx.beginPath()
      ctx.moveTo(GX, y1)
      ctx.lineTo(GX + GW, y1)
      ctx.stroke()
      text('||e|| / ||e0||', GX, GY - 12, '#94a3b8')
      text('sweep', GX + GW - 40, GY + GH + 18, '#94a3b8')

      ctx.strokeStyle = g >= 1 ? COL_BAD : COL_OK
      ctx.lineWidth = 2
      ctx.beginPath()
      hist.forEach((v, i) => {
        const x = GX + (i / 40) * GW
        const y = ly(v)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      const lastX = GX + ((hist.length - 1) / 40) * GW
      ctx.fillStyle = g >= 1 ? COL_BAD : COL_OK
      ctx.beginPath()
      ctx.arc(lastX, ly(cur), 4, 0, Math.PI * 2)
      ctx.fill()

      text(`sweep ${hist.length - 1}`, GX, GY + GH + 34, '#cbd5e1')
      text(`||e||/||e0|| = ${cur < 1e-4 || cur > 1e4 ? cur.toExponential(2) : cur.toFixed(4)}`, GX + 90, GY + GH + 34, g >= 1 ? COL_BAD : COL_OK)

      frame++
      if (frame % 12 === 0) push.current({ it: hist.length - 1, res: cur, gain: g })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }
  const btn = (on: boolean): CSSProperties => ({
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ sweep'}
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            resetRef.current += 1
          }}
        >
          ↺ restart
        </button>
        <label style={label}>
          <span style={nameS}>CFL_a</span>
          <input type="range" min={0.1} max={4} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
          <span style={mono}>{cfl.toFixed(2)}</span>
        </label>
      </div>
      <div style={rowS}>
        {MODES.map(([k, lab]) => (
          <button
            key={k}
            style={btn(mode === k)}
            onClick={() => {
              setMode(k)
              resetRef.current += 1
            }}
          >
            {lab}
          </button>
        ))}
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag <em>CFL_a</em> with <em>block Gauss-Seidel</em> selected: the dropped arrow is the whole story — past CFL_a
        = 1 the loop gain {stat.gain < 1e4 ? stat.gain.toFixed(2) : stat.gain.toExponential(1)} exceeds one and the
        residual curve turns upward. <em>SOR</em> keeps the arrow but only pointwise, so it survives to CFL_a = 2.
        <em> Schur complement</em> closes the loop and the residual drops to roundoff in a single sweep, at every CFL_a
        on the slider.
      </div>
    </div>
  )
}

export default BlockCouplingLoopGainScope
