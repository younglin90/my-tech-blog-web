'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Two pipes carrying the same fully developed flow.
//
//   top    : the true bore, radius R
//   bottom : the bore the solver (or the ruler) actually used, R(1+e)
//
// Both are driven by the same dp/dx, so u(r) = G (Ra^2 - r^2) / (4 mu) with
// Ra the pipe's own radius.  Tracer particles are seeded with density
// proportional to area (r = Ra * sqrt(rand)), so the number of them crossing
// the outlet per second is proportional to Q = integral u dA.  Let it run and
// the counter ratio walks onto (1+e)^4 : a 1 % slip in the radius is a 4 %
// slip in the flow rate.
//
// The "wall pinned at cell centre" preset sets e = -1/(2N) — exactly the
// error a finite volume code makes when no-slip is imposed at the last cell
// centre instead of at the wall face.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const PX = 46 // pipe stage
const PW = 430
const TOP_CY = 118
const BOT_CY = 296
const R_PIX = 62 // pixels for the true radius

const BX = 516 // readout panel
const BW = 212

const COL_TRUE = '#38bdf8'
const COL_BAD = '#f87171'
const COL_GHOST = 'rgba(148,163,184,0.5)'
const COL_TXT = '#e2e8f0'
const COL_DIM = '#94a3b8'

const NPART = 260

type P = { x: number; r: number }

function seed(ra: number): P {
  const s = Math.random() < 0.5 ? -1 : 1
  return { x: Math.random(), r: s * ra * Math.sqrt(Math.random()) }
}

export function FourthPowerFlowTwinTube() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pinned, setPinned] = useState(false)
  const [ncell, setNcell] = useState(20)
  const [errPct, setErrPct] = useState(-2.5)
  const [grad, setGrad] = useState(1.0)
  const [stat, setStat] = useState({ e: -0.025, qr: 0.9037, nGood: 0, nBad: 0, meas: 1 })

  const live = useRef({ pinned, ncell, errPct, grad })
  live.current = { pinned, ncell, errPct, grad }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let good: P[] = Array.from({ length: NPART }, () => seed(1))
    let bad: P[] = Array.from({ length: NPART }, () => seed(1))
    let nGood = 0
    let nBad = 0
    let lastE = 0
    let frame = 0
    let raf = 0

    const text = (s: string, x: number, y: number, c = COL_TXT, f = '12px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      const L = live.current
      const e = L.pinned ? -1 / (2 * L.ncell) : L.errPct / 100
      const ra = 1 + e

      if (Math.abs(e - lastE) > 1e-9) {
        lastE = e
        nGood = 0
        nBad = 0
        bad = Array.from({ length: NPART }, () => seed(ra))
      }

      // ---------------- advance the tracers ----------------
      const dt = 0.010 * L.grad
      const step = (arr: P[], rad: number, count: () => void) => {
        for (let i = 0; i < arr.length; i++) {
          const p = arr[i]
          const u = Math.max(0, rad * rad - p.r * p.r) // ~ (Ra^2 - r^2)
          p.x += dt * u
          if (p.x > 1) {
            count()
            arr[i] = seed(rad)
            arr[i].x = 0
          }
        }
      }
      step(good, 1, () => {
        nGood++
      })
      step(bad, ra, () => {
        nBad++
      })

      // ---------------- background ----------------
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(148,163,184,0.06)'
      ctx.fillRect(BX - 14, 24, BW + 28, H - 48)

      const pipe = (cy: number, rad: number, col: string, title: string, sub: string) => {
        const rp = rad * R_PIX
        // true bore, as a dashed reference on both pipes
        ctx.strokeStyle = COL_GHOST
        ctx.setLineDash([5, 5])
        ctx.lineWidth = 1.2
        ctx.strokeRect(PX, cy - R_PIX, PW, 2 * R_PIX)
        ctx.setLineDash([])
        // the wall actually in force
        ctx.strokeStyle = col
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.moveTo(PX, cy - rp)
        ctx.lineTo(PX + PW, cy - rp)
        ctx.moveTo(PX, cy + rp)
        ctx.lineTo(PX + PW, cy + rp)
        ctx.stroke()
        // centreline
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(PX, cy)
        ctx.lineTo(PX + PW, cy)
        ctx.stroke()
        // parabolic profile at the outlet
        ctx.strokeStyle = col
        ctx.globalAlpha = 0.75
        ctx.lineWidth = 1.6
        ctx.beginPath()
        for (let k = 0; k <= 40; k++) {
          const rr = -rad + (2 * rad * k) / 40
          const u = (rad * rad - rr * rr) * 46
          const x = PX + PW - 4 - u
          const y = cy - rr * R_PIX
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
        text(title, PX, cy - R_PIX - 26, col)
        text(sub, PX, cy - R_PIX - 10, COL_DIM, '11px ui-monospace, monospace')
      }

      pipe(TOP_CY, 1, COL_TRUE, 'true bore   D', 'no-slip on the wall face')
      pipe(
        BOT_CY,
        ra,
        COL_BAD,
        `bore in force   D(1${e < 0 ? '' : '+'}${(e * 100).toFixed(2)}%)`,
        L.pinned ? `no-slip pinned at the last cell centre, N = ${L.ncell}` : 'diameter read off with an error',
      )

      const dots = (arr: P[], cy: number, col: string) => {
        ctx.fillStyle = col
        for (const p of arr) {
          ctx.beginPath()
          ctx.arc(PX + p.x * PW, cy - p.r * R_PIX, 1.8, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
      dots(good, TOP_CY, COL_TRUE)
      dots(bad, BOT_CY, COL_BAD)

      // ---------------- readout panel ----------------
      const qr = Math.pow(ra, 4)
      const meas = nGood > 0 ? nBad / nGood : 1

      text('Q  ~  D^4', BX, 48, COL_TXT, '13px ui-monospace, monospace')
      text(`dD/D  = ${(e * 100).toFixed(2)} %`, BX, 74, COL_DIM)
      text(`dQ/Q  = ${((qr - 1) * 100).toFixed(2)} %`, BX, 94, COL_BAD)
      text(`ratio = ${qr.toFixed(4)}`, BX, 114, COL_DIM)
      text(`amplification x${Math.abs(e) > 1e-6 ? ((qr - 1) / e).toFixed(2) : '4.00'}`, BX, 134, '#fbbf24')

      // bars
      const barY = 168
      const bar = (y: number, v: number, col: string, lab: string) => {
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'
        ctx.strokeRect(BX, y, BW, 18)
        ctx.fillStyle = col
        ctx.fillRect(BX + 1, y + 1, Math.max(0, Math.min(1, v)) * (BW - 2), 16)
        text(lab, BX, y - 4, COL_DIM, '10px ui-monospace, monospace')
      }
      bar(barY, 1, COL_TRUE, 'Q  true bore')
      bar(barY + 46, qr, COL_BAD, 'Q  bore in force')

      // running tracer count
      text('tracers past the outlet', BX, 262, COL_DIM, '11px ui-monospace, monospace')
      text(`true ${nGood}`, BX, 282, COL_TRUE)
      text(`bore ${nBad}`, BX, 300, COL_BAD)
      text(`counted ratio ${meas.toFixed(3)}`, BX, 322, '#fbbf24')
      text(`target  (1+e)^4 = ${qr.toFixed(3)}`, BX, 340, COL_DIM, '11px ui-monospace, monospace')

      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(BX, 352, BW, 12)
      const lo = Math.min(meas, qr)
      const hi = Math.max(meas, qr)
      const map = (v: number) => BX + Math.max(0, Math.min(1, (v - 0.5) / 1.0)) * BW
      ctx.fillStyle = 'rgba(251,191,36,0.35)'
      ctx.fillRect(map(lo), 353, Math.max(1, map(hi) - map(lo)), 10)
      ctx.strokeStyle = COL_BAD
      ctx.beginPath()
      ctx.moveTo(map(qr), 350)
      ctx.lineTo(map(qr), 366)
      ctx.stroke()

      text('the dashed box is the bore you think you have', PX, H - 24, '#64748b', '11px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) push.current({ e, qr, nGood, nBad, meas })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
        <button style={btn(!pinned)} onClick={() => setPinned(false)}>
          diameter error
        </button>
        <button style={btn(pinned)} onClick={() => setPinned(true)}>
          wall pinned at cell centre
        </button>
        {pinned ? (
          <label style={label}>
            <span style={nameS}>N cells</span>
            <input type="range" min={5} max={80} step={1} value={ncell} onChange={(ev) => setNcell(parseInt(ev.target.value, 10))} />
            <span style={mono}>{ncell}</span>
          </label>
        ) : (
          <label style={label}>
            <span style={nameS}>dD/D</span>
            <input type="range" min={-10} max={10} step={0.5} value={errPct} onChange={(ev) => setErrPct(parseFloat(ev.target.value))} />
            <span style={mono}>{errPct.toFixed(1)}%</span>
          </label>
        )}
        <label style={label}>
          <span style={nameS}>dp/dx</span>
          <input type="range" min={0.3} max={2} step={0.1} value={grad} onChange={(ev) => setGrad(parseFloat(ev.target.value))} />
          <span style={mono}>{grad.toFixed(1)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag <em>dD/D</em> to 1 % and watch the red bar: the wall moved by 1 %, the flow rate moved by{' '}
        {((Math.pow(1.01, 4) - 1) * 100).toFixed(2)} %. The tracer counters at the right are an independent measurement —
        they know nothing about the formula, and they still settle on {stat.qr.toFixed(3)} (currently{' '}
        {stat.meas.toFixed(3)} after {stat.nGood} particles). Switch to <em>wall pinned at cell centre</em> and lower N:
        a mesh of 10 cells loses 19 % of the flow with a perfectly correct viscous scheme.
      </div>
    </div>
  )
}
