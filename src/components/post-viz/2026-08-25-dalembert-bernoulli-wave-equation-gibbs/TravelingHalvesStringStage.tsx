'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// d'Alembert (1747): every solution of u_tt = c^2 u_xx on a fixed-end string is
//
//     u(x,t) = 1/2 [ F(x - ct) + F(x + ct) ]
//
// where F is the odd, 2L-periodic extension of the initial displacement f(x).
// Nothing is expanded, nothing is fitted: the initial shape is cut in half and
// the two halves are carried in opposite directions.  The walls are not extra
// boundary conditions here — they are what the odd extension already encodes,
// so the reflected half comes back upside down for free.
// ---------------------------------------------------------------------------

const W = 726
const H = 430

const PX0 = 58
const PX1 = 700
const PY0 = 34
const PY1 = 300

const NX = 801 // sample points of the stored initial profile
const L = 1
const C = 1

type Shape = 'jump' | 'kink' | 'smooth'

const SHAPES: { key: Shape; label: string; note: string }[] = [
  { key: 'jump', label: 'jump', note: 'discontinuous (hammer band)' },
  { key: 'kink', label: 'kink', note: 'continuous, slope jumps (plucked)' },
  { key: 'smooth', label: 'smooth', note: 'infinitely differentiable' },
]

function initialProfile(shape: Shape): Float64Array {
  const f = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    const x = (i / (NX - 1)) * L
    if (shape === 'jump') f[i] = x >= 0.35 && x <= 0.55 ? 1 : 0
    else if (shape === 'kink') f[i] = x < 0.45 ? x / 0.45 : (L - x) / (L - 0.45)
    else f[i] = Math.exp(-((x - 0.45) ** 2) / (2 * 0.055 ** 2))
  }
  return f
}

// F(s): odd extension about x = 0 and x = L, period 2L, sampled from f
function oddExtend(f: Float64Array, s: number): number {
  let xs = s % (2 * L)
  if (xs < 0) xs += 2 * L
  let sign = 1
  if (xs > L) {
    sign = -1
    xs = 2 * L - xs
  }
  const g = (xs / L) * (NX - 1)
  const i = Math.min(NX - 2, Math.floor(g))
  const w = g - i
  return sign * (f[i] * (1 - w) + f[i + 1] * w)
}

export function TravelingHalvesStringStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shape, setShape] = useState<Shape>('jump')
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(0.35)
  const [showHalves, setShowHalves] = useState(true)
  const [clock, setClock] = useState(0)

  const profile = useMemo(() => initialProfile(shape), [shape])

  const live = useRef({ profile, running, speed, showHalves })
  live.current = { profile, running, speed, showHalves }
  const setClockRef = useRef(setClock)
  setClockRef.current = setClock

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let t = 0
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const px = (x: number) => PX0 + (x / L) * (PX1 - PX0)
    const py = (v: number) => (PY0 + PY1) / 2 - v * ((PY1 - PY0) / 2 - 18)

    const curve = (fn: (x: number) => number, col: string, width: number, dash: number[]) => {
      ctx.strokeStyle = col
      ctx.lineWidth = width
      ctx.setLineDash(dash)
      ctx.beginPath()
      for (let i = 0; i <= 400; i++) {
        const x = (i / 400) * L
        const p = px(x)
        const q = py(fn(x))
        if (i === 0) ctx.moveTo(p, q)
        else ctx.lineTo(p, q)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.lineWidth = 1
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const S = live.current
      if (S.running) t = (t + dt * S.speed) % (2 * L / C)

      frame++
      if (frame % 12 === 0) setClockRef.current(t)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // frame + axes
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0)
      ctx.strokeStyle = 'rgba(226,232,240,0.22)'
      ctx.beginPath()
      ctx.moveTo(PX0, py(0))
      ctx.lineTo(PX1, py(0))
      ctx.stroke()
      text('u (x, t)', PX0 + 6, PY0 + 15, '#64748b', '10px ui-monospace, monospace')
      text('x  (0 → L)', PX1 - 72, PY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text('+1', PX0 - 26, py(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('0', PX0 - 20, py(0) + 4, '#64748b', '10px ui-monospace, monospace')
      text('-1', PX0 - 26, py(-1) + 4, '#64748b', '10px ui-monospace, monospace')

      // fixed ends (walls)
      ctx.fillStyle = 'rgba(148,163,184,0.55)'
      ctx.fillRect(PX0 - 4, PY0 + 8, 4, PY1 - PY0 - 16)
      ctx.fillRect(PX1, PY0 + 8, 4, PY1 - PY0 - 16)
      text('fixed', PX0 - 4, PY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text('fixed', PX1 - 22, PY1 + 16, '#64748b', '10px ui-monospace, monospace')

      const f = S.profile
      const right = (x: number) => 0.5 * oddExtend(f, x - C * t)
      const left = (x: number) => 0.5 * oddExtend(f, x + C * t)

      if (S.showHalves) {
        curve(right, '#38bdf8', 1.6, [5, 4])
        curve(left, '#fbbf24', 1.6, [5, 4])
      }
      curve((x) => right(x) + left(x), '#f8fafc', 2.4, [])

      // markers riding on each half: peak of the initial support, transported
      const peak = 0.45
      const markR = ((peak + C * t) % (2 * L) + 2 * L) % (2 * L)
      const markL = ((peak - C * t) % (2 * L) + 2 * L) % (2 * L)
      const foldX = (v: number) => (v > L ? 2 * L - v : v)
      if (S.showHalves) {
        ctx.fillStyle = '#38bdf8'
        ctx.beginPath()
        ctx.arc(px(foldX(markR)), PY1 - 10, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(px(foldX(markL)), PY1 - 10, 4, 0, 2 * Math.PI)
        ctx.fill()
      }

      // legend
      let lx = PX0
      const ly = PY0 - 12
      const chip = (col: string, lbl: string, dashed: boolean) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.setLineDash(dashed ? [5, 4] : [])
        ctx.beginPath()
        ctx.moveTo(lx, ly - 4)
        ctx.lineTo(lx + 22, ly - 4)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
        text(lbl, lx + 28, ly, '#94a3b8', '10px ui-monospace, monospace')
        lx += 32 + lbl.length * 5.8
      }
      chip('#38bdf8', '½F(x−ct)  right-going', true)
      chip('#fbbf24', '½F(x+ct)  left-going', true)
      chip('#f8fafc', 'sum = the string', false)

      // readout strip
      const put = (lbl: string, v: string, col: string, x: number, y: number) => {
        text(lbl, x, y, '#94a3b8')
        text(v, x + 108, y, col, 'bold 11px ui-monospace, monospace')
      }
      const ry = PY1 + 46
      put('t · c / L', t.toFixed(3), '#e2e8f0', PX0, ry)
      put('shape', shape, '#e2e8f0', PX0 + 218, ry)
      const returned = t < 0.02 || Math.abs(t - 2) < 0.02
      ctx.fillStyle = returned ? 'rgba(52,211,153,0.18)' : 'rgba(56,189,248,0.14)'
      ctx.fillRect(PX0 + 452, ry - 15, 214, 24)
      text(
        returned ? 'period 2L/c — shape restored' : 'halves in transit',
        PX0 + 462,
        ry + 2,
        returned ? '#34d399' : '#38bdf8',
        'bold 11px ui-monospace, monospace',
      )
      put('reflection', 'odd extension flips sign at each wall', '#64748b', PX0, ry + 24)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [shape])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 54 }
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
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        {SHAPES.map((s) => (
          <button key={s.key} style={btn(shape === s.key)} onClick={() => setShape(s.key)} title={s.note}>
            {s.label}
          </button>
        ))}
        <button style={btn(showHalves)} onClick={() => setShowHalves((p) => !p)}>
          {showHalves ? 'halves: on' : 'halves: off'}
        </button>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={0.05} max={1} step={0.01} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Turn <em>halves</em> off and you see only the string. Turn it on and the same picture is two rigid copies at half height
        sliding in opposite directions — no frequencies anywhere. Switch to <em>jump</em>: the corners stay razor sharp forever,
        because transport never smooths anything. The clock reads t·c/L = {clock.toFixed(2)}; at 2 the shape is exactly back.
      </div>
    </div>
  )
}
