'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Breaching the capillary time-step constraint buys steps, not speed.
//
//   dt = min(dt_CFL, S dt_sigma)             S = breach factor
//   wall clock  ~  (number of steps) x (nonlinear iterations per step)
//                ~  (1/S) x c(S) ,   c(S) = 1 + (S/8)^2.2
//
// c(S) is fitted to the article's two anchors: S 2 -> 5 gives 1.9x, and
// S 5 -> 10 gives essentially nothing back.
//
// The red wall is the upper capillary stability limit of Eq. (57),
//   dt* / dt_sigma = sqrt(16 pi)/2 [ a2 Oh + sqrt(a2^2 Oh^2 + 4 a1) ]
// with a1 = 1.5^2/(16 pi) so that dt* -> 1.5 dt_sigma as Oh -> 0.
// ---------------------------------------------------------------------------

const W = 760
const H = 450

const A1 = (1.5 * 1.5) / (16 * Math.PI)
const A2 = 0.423
const S_MAX = 14

const TRX = 200
const TRW = 470
const TRY = 78
const ROWH = 58

const CX = 200
const CY = 250
const CW = 470
const CH = 122

const COL_BASE = '#94a3b8'
const COL_FAST = '#38bdf8'
const COL_BAD = '#f87171'
const COL_OK = '#4ade80'
const COL_WARN = '#fbbf24'
const COL_DIM = '#64748b'

const stabLimit = (oh: number) => (Math.sqrt(16 * Math.PI) / 2) * (A2 * oh + Math.sqrt(A2 * A2 * oh * oh + 4 * A1))
const costPerStep = (s: number) => 1 + Math.pow(s / 8, 2.2)
const speedup = (s: number) => (s * costPerStep(1)) / costPerStep(s)

export function BreachFactorSpeedupWindow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [sigma, setSigma] = useState(5)
  const [cflCap, setCflCap] = useState(12)
  const [logOh, setLogOh] = useState(0)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ eff: 5, sp: 1, limit: 3.6 })

  const live = useRef({ sigma, cflCap, logOh, running })
  live.current = { sigma, cflCap, logOh, running }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let wall = 0
    let hold = 0

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { sigma: sIn, cflCap: cap, logOh: lo, running: run } = live.current
      const oh = Math.pow(10, lo)
      const limit = stabLimit(oh)
      const eff = Math.min(sIn, cap)
      const unstable = eff > limit
      const sp = speedup(eff)

      // ---- race ----
      const vBase = 1 / costPerStep(1) // physical time per unit wall clock, S = 1
      const vFast = eff / costPerStep(eff)
      const norm = 0.9 / Math.max(vBase, vFast)
      if (run) {
        if (hold > 0) {
          hold -= 1
          if (hold === 0) wall = 0
        } else {
          wall += 0.016
          const pa = Math.min(wall * vBase * norm, 1)
          const pb = unstable ? 0 : Math.min(wall * vFast * norm, 1)
          if (pa >= 1 && (pb >= 1 || unstable)) hold = 90
        }
      }
      const progA = Math.min(wall * vBase * norm, 1)
      const progB = unstable ? Math.min(wall * vFast * norm, 0.35) : Math.min(wall * vFast * norm, 1)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      text('same physical end time, two time steps', 34, 26, '#e2e8f0', '12px system-ui, sans-serif')
      text(`dt = min(dt_CFL, S dt_sigma)   ->   S_eff = ${eff.toFixed(1)}    Oh_dx = ${oh.toFixed(2)}`, 34, 46, '#94a3b8')

      const lane = (
        j: number,
        lab: string,
        s: number,
        prog: number,
        col: string,
        dead: boolean,
      ) => {
        const y = TRY + j * ROWH
        text(lab, 34, y + 20, '#cbd5e1')
        text(`${(1000 / s).toFixed(0)} steps  x  ${costPerStep(s).toFixed(2)} cost/step`, 34, y + 36, COL_DIM, '10px ui-monospace, monospace')
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'
        ctx.lineWidth = 1
        ctx.strokeRect(TRX, y + 6, TRW, 22)
        // time-step ticks
        const nTick = Math.max(Math.round(28 / s), 3)
        for (let i = 1; i < nTick; i++) {
          const x = TRX + (i / nTick) * TRW
          ctx.strokeStyle = 'rgba(148,163,184,0.14)'
          ctx.beginPath()
          ctx.moveTo(x, y + 6)
          ctx.lineTo(x, y + 28)
          ctx.stroke()
        }
        ctx.fillStyle = dead ? 'rgba(248,113,113,0.35)' : `${col}44`
        ctx.fillRect(TRX, y + 6, prog * TRW, 22)
        ctx.fillStyle = dead ? COL_BAD : col
        ctx.fillRect(TRX + prog * TRW - 3, y + 4, 4, 26)
        if (dead && prog > 0.3) {
          text('diverged - beyond dt*', TRX + prog * TRW + 10, y + 22, COL_BAD)
        } else if (prog >= 1) {
          text('done', TRX + TRW + 8, y + 22, COL_OK)
        }
      }

      lane(0, 'S = 1  (constraint respected)', 1, progA, COL_BASE, false)
      lane(1, `S = ${eff.toFixed(1)}  (implicit surface tension)`, eff, progB, COL_FAST, unstable)
      text('wall clock ->', TRX, TRY + 2 * ROWH + 4, COL_DIM, '10px ui-monospace, monospace')
      text(
        unstable ? 'unstable: no answer at any price' : `finishes ${sp.toFixed(2)}x sooner`,
        TRX + 110,
        TRY + 2 * ROWH + 4,
        unstable ? COL_BAD : COL_OK,
        '11px ui-monospace, monospace',
      )

      // ---- speedup curve ----
      const sx = (s: number) => CX + ((s - 1) / (S_MAX - 1)) * CW
      const spMaxV = 4.2
      const sy = (v: number) => CY + CH - (Math.min(v, spMaxV) / spMaxV) * CH

      text('speed-up vs S', 34, CY + 16, '#cbd5e1')
      text('peak, then the', 34, CY + 34, COL_DIM, '10px ui-monospace, monospace')
      text('nonlinear loop', 34, CY + 48, COL_DIM, '10px ui-monospace, monospace')
      text('eats it back', 34, CY + 62, COL_DIM, '10px ui-monospace, monospace')

      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.strokeRect(CX, CY, CW, CH)
      for (let v = 1; v <= 4; v++) {
        text(`${v}x`, CX - 26, sy(v) + 4, COL_DIM, '10px ui-monospace, monospace')
        ctx.strokeStyle = 'rgba(148,163,184,0.10)'
        ctx.beginPath()
        ctx.moveTo(CX, sy(v))
        ctx.lineTo(CX + CW, sy(v))
        ctx.stroke()
      }
      for (let s = 2; s <= S_MAX; s += 2) text(`${s}`, sx(s) - 4, CY + CH + 16, COL_DIM, '10px ui-monospace, monospace')
      text('S = dt / dt_sigma', CX + CW - 96, CY + CH + 32, COL_DIM, '10px ui-monospace, monospace')

      // unstable band
      if (limit < S_MAX) {
        ctx.fillStyle = 'rgba(248,113,113,0.12)'
        ctx.fillRect(sx(Math.max(limit, 1)), CY, CX + CW - sx(Math.max(limit, 1)), CH)
        ctx.strokeStyle = COL_BAD
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(sx(limit), CY)
        ctx.lineTo(sx(limit), CY + CH)
        ctx.stroke()
        ctx.setLineDash([])
        text(`dt* = ${limit.toFixed(1)} dt_sigma`, sx(limit) + 6, CY + 14, COL_BAD, '10px ui-monospace, monospace')
      }

      // CFL cap
      if (cap < S_MAX) {
        ctx.strokeStyle = COL_WARN
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(sx(cap), CY)
        ctx.lineTo(sx(cap), CY + CH)
        ctx.stroke()
        ctx.setLineDash([])
        text('dt_CFL cap', sx(cap) + 6, CY + CH - 8, COL_WARN, '10px ui-monospace, monospace')
      }

      ctx.strokeStyle = COL_FAST
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const s = 1 + (i / 200) * (S_MAX - 1)
        const x = sx(s)
        const y = sy(speedup(s))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // article's two anchors
      const anchor = (s: number, lab: string) => {
        ctx.fillStyle = COL_OK
        ctx.beginPath()
        ctx.arc(sx(s), sy(speedup(s)), 4, 0, Math.PI * 2)
        ctx.fill()
        text(lab, sx(s) - 10, sy(speedup(s)) - 10, COL_OK, '10px ui-monospace, monospace')
      }
      anchor(2, 'S=2')
      anchor(5, 'S=5')
      anchor(10, 'S=10')

      // current marker
      ctx.fillStyle = unstable ? COL_BAD : COL_WARN
      ctx.beginPath()
      ctx.arc(sx(eff), sy(sp), 6, 0, Math.PI * 2)
      ctx.fill()

      text(`S_eff = ${eff.toFixed(1)}`, 34, H - 30, COL_FAST, '12px ui-monospace, monospace')
      text(`speed-up = ${unstable ? '--' : sp.toFixed(2) + 'x'}`, 168, H - 30, unstable ? COL_BAD : COL_OK, '12px ui-monospace, monospace')
      text(
        unstable
          ? 'past dt*: raise Oh_dx (more viscous, or a shorter wave) to move the red wall right'
          : eff > 8
            ? 'stable, but the article calls this too coarse to resolve the oscillation'
            : 'inside the window: faster and still resolved',
        320,
        H - 30,
        unstable ? COL_BAD : eff > 8 ? COL_WARN : COL_OK,
        '12px system-ui, sans-serif',
      )

      frame++
      if (frame % 12 === 0) push.current({ eff, sp, limit })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }
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
          {running ? '❙❙ pause' : '▶ race'}
        </button>
        <label style={label}>
          <span style={nameS}>S = dt/dt_sigma</span>
          <input type="range" min={1} max={S_MAX} step={0.5} value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} />
          <span style={mono}>{sigma.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>dt_CFL cap</span>
          <input type="range" min={1} max={14} step={0.5} value={cflCap} onChange={(e) => setCflCap(parseFloat(e.target.value))} />
          <span style={mono}>{cflCap.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>Oh_dx</span>
          <input type="range" min={-2} max={1} step={0.1} value={logOh} onChange={(e) => setLogOh(parseFloat(e.target.value))} />
          <span style={mono}>{Math.pow(10, logOh).toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Push <em>S</em> from 1 to 5 and the blue lane finishes about twice as early. Keep going to 10 and the lane barely
        moves: fewer steps, but each one costs more Newton work. Then drag <em>Oh_dx</em> down towards 0.01 — the red
        wall slides left to 1.5 dt_sigma and the fast lane dies before it reaches a third of the run. Current window:
        dt* = {stat.limit.toFixed(1)} dt_sigma.
      </div>
    </div>
  )
}

export default BreachFactorSpeedupWindow
