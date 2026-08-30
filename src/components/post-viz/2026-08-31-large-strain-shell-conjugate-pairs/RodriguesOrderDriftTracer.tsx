'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The shell director d is carried around by repeated incremental rotations.
// Each increment uses the Rodrigues map with the series cut at a chosen order:
//
//   R = I + a W + b W^2 ,   W = skew(w) ,   th = |w|
//     1st order   a = 1          b = 0
//     2nd order   a = 1          b = 1/2
//     closed      a = sin th/th  b = (1 - cos th)/th^2
//
// Only the closed form is orthogonal.  The truncated ones stretch the director
// a little on every step, and the error piles up: the 1st-order arrow spirals
// off the unit circle while the closed-form arrow rides it exactly.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

// dial
const DX = 200
const DY = 210
const RAD = 150

// drift plot
const PX0 = 410
const PY0 = 46
const PW = 318
const PH = 300
const PMAX_STEPS = 120

const COL_1 = '#f87171'
const COL_2 = '#fbbf24'
const COL_EX = '#4ade80'
const COL_UNIT = 'rgba(148,163,184,0.45)'

type Vec2 = [number, number] // director in the x-z plane: [x, z]

/** one incremental rotation of angle th in the x-z plane, series cut at `order` */
function stepDirector(d: Vec2, th: number, order: 0 | 1 | 2): Vec2 {
  // in-plane, W acts as the 90-deg rotation generator, W^2 = -I
  let a: number
  let b: number
  if (order === 1) {
    a = 1
    b = 0
  } else if (order === 2) {
    a = 1
    b = 0.5
  } else {
    a = Math.sin(th) / th
    b = (1 - Math.cos(th)) / (th * th)
  }
  const s = th * a // coefficient of W  (W = th * generator)
  const c = 1 - b * th * th // coefficient of I from I + b W^2
  return [c * d[0] + s * d[1], -s * d[0] + c * d[1]]
}

const TRACKS: Array<{ order: 0 | 1 | 2; col: string; name: string }> = [
  { order: 1, col: COL_1, name: '1st order  I + W' },
  { order: 2, col: COL_2, name: '2nd order  I + W + W^2/2' },
  { order: 0, col: COL_EX, name: 'closed form' },
]

export function RodriguesOrderDriftTracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dth, setDth] = useState(0.1)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ n: 0, len1: 1, len2: 1, ang: 0 })

  const live = useRef({ dth, running })
  live.current = { dth, running }
  const push = useRef(setStat)
  push.current = setStat
  const resetRef = useRef(0)
  const stepRef = useRef(0)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let count = 0
    let dirs: Vec2[] = TRACKS.map(() => [0, 1])
    let hist: number[][] = TRACKS.map(() => [1])
    let lastDth = -1
    let lastReset = -1
    let lastStep = 0

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const reset = () => {
      count = 0
      dirs = TRACKS.map(() => [0, 1])
      hist = TRACKS.map(() => [1])
    }

    const advance = (th: number) => {
      count++
      dirs = dirs.map((d, i) => stepDirector(d, th, TRACKS[i].order))
      dirs.forEach((d, i) => {
        hist[i].push(Math.hypot(d[0], d[1]))
        if (hist[i].length > PMAX_STEPS + 1) hist[i].shift()
      })
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { dth: th, running: run } = live.current

      if (th !== lastDth || lastReset !== resetRef.current) {
        lastDth = th
        lastReset = resetRef.current
        reset()
      }
      if (stepRef.current !== lastStep) {
        lastStep = stepRef.current
        advance(th)
      }
      if (run && count < PMAX_STEPS && frame % 3 === 0) advance(th)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- dial ----------------
      text('shell director, one increment at a time', 40, 28, '#e2e8f0')

      ctx.strokeStyle = COL_UNIT
      ctx.setLineDash([3, 4])
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(DX, DY, RAD, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
      text('|d| = 1', DX + RAD * 0.72, DY - RAD * 0.72, '#64748b', '10px ui-monospace, monospace')

      ctx.strokeStyle = 'rgba(148,163,184,0.15)'
      ctx.beginPath()
      ctx.moveTo(DX - RAD - 20, DY)
      ctx.lineTo(DX + RAD + 20, DY)
      ctx.moveTo(DX, DY - RAD - 20)
      ctx.lineTo(DX, DY + RAD + 20)
      ctx.stroke()
      text('x', DX + RAD + 6, DY - 8, '#64748b', '10px ui-monospace, monospace')
      text('z', DX + 8, DY - RAD - 8, '#64748b', '10px ui-monospace, monospace')

      TRACKS.forEach((tk, i) => {
        const d = dirs[i]
        const ex = DX + d[0] * RAD
        const ey = DY - d[1] * RAD
        ctx.strokeStyle = tk.col
        ctx.lineWidth = i === 2 ? 2.6 : 2
        ctx.beginPath()
        ctx.moveTo(DX, DY)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        ctx.fillStyle = tk.col
        ctx.beginPath()
        ctx.arc(ex, ey, 4.4, 0, 2 * Math.PI)
        ctx.fill()
      })

      // ---------------- drift plot ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX0, PY0, PW, PH)
      text('|d| after each increment', PX0, PY0 - 12, '#e2e8f0')

      const vmax = Math.max(1.05, ...hist.map((h) => Math.max(...h)))
      const ypx = (v: number) => PY0 + PH - ((v - 0.98) / (vmax - 0.98)) * PH
      const xpx = (k: number) => PX0 + (k / PMAX_STEPS) * PW

      ctx.strokeStyle = COL_UNIT
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(PX0, ypx(1))
      ctx.lineTo(PX0 + PW, ypx(1))
      ctx.stroke()
      ctx.setLineDash([])
      text('1.000', PX0 - 38, ypx(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text(vmax.toFixed(3), PX0 - 38, ypx(vmax) + 10, '#64748b', '10px ui-monospace, monospace')
      text('increments', PX0 + PW - 68, PY0 + PH + 16, '#94a3b8', '10px ui-monospace, monospace')

      TRACKS.forEach((tk, i) => {
        ctx.strokeStyle = tk.col
        ctx.lineWidth = 2
        ctx.beginPath()
        hist[i].forEach((v, k) => {
          if (k === 0) ctx.moveTo(xpx(k), ypx(v))
          else ctx.lineTo(xpx(k), ypx(v))
        })
        ctx.stroke()
      })

      // ---------------- readout ----------------
      const total = count * th
      TRACKS.forEach((tk, i) => {
        const d = dirs[i]
        const n = Math.hypot(d[0], d[1])
        const y = DY + RAD + 44 + i * 18
        ctx.fillStyle = tk.col
        ctx.fillRect(40, y - 8, 10, 10)
        text(`${tk.name.padEnd(26, ' ')} |d| = ${n.toFixed(5)}  (${(100 * (n - 1)).toFixed(2)} %)`, 58, y, tk.col)
      })
      text(
        `increments = ${count}   d.theta = ${th.toFixed(3)} rad   total = ${((total * 180) / Math.PI).toFixed(1)} deg`,
        40,
        DY + RAD + 26,
        '#cbd5e1',
        '12px ui-monospace, monospace',
      )

      frame++
      if (frame % 12 === 0) {
        push.current({
          n: count,
          len1: Math.hypot(dirs[0][0], dirs[0][1]),
          len2: Math.hypot(dirs[1][0], dirs[1][1]),
          ang: (total * 180) / Math.PI,
        })
      }
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
          {running ? '❙❙ pause' : '▶ march'}
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            setRunning(false)
            stepRef.current += 1
          }}
        >
          +1 increment
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            resetRef.current += 1
          }}
        >
          ↺ back to d = e_z
        </button>
        <label style={label}>
          <span style={nameS}>d.theta</span>
          <input type="range" min={0.01} max={0.3} step={0.005} value={dth} onChange={(e) => setDth(parseFloat(e.target.value))} />
          <span style={mono}>{dth.toFixed(3)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Leave <em>d.theta</em> at 0.10 rad and let it march: after {stat.n} increments the red 1st-order director is{' '}
        {(100 * (stat.len1 - 1)).toFixed(1)} % too long and has climbed off the dashed unit circle, while the green
        closed-form arrow sits on it. Drag <em>d.theta</em> down — the drift shrinks in proportion, so halving the load
        step only halves the error. The yellow 2nd-order curve ({(100 * (stat.len2 - 1)).toFixed(2)} %) shows what one
        more term buys.
      </div>
    </div>
  )
}
