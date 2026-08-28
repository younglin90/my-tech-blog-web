'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Why lowering the Mach number is the same thing as raising the time step.
//
// The implicit time step is sized by the material scale:  dt = CFL_u dx / |u|.
// The sound speed is  c = |u| / M , so the acoustic CFL that the linear solver
// actually sees is
//
//        CFL_a = c dt / dx = CFL_u / M
//
// Top track: over ONE time step the fluid particle walks CFL_u cells while the
// acoustic front laps the whole domain CFL_a / N times.
// Bottom bars: the loop gain each preconditioner is left with, on a log axis
// against the stability line at 1.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const NCELL = 40
const OMEGA = 0.4

const TX = 44
const TY = 74
const TW = 672
const TH = 46

const BX = 210
const BY = 250
const BW = 470
const ROWH = 44

const COL_U = '#38bdf8'
const COL_C = '#fb923c'
const COL_BAD = '#f87171'
const COL_OK = '#4ade80'
const COL_DIM = '#64748b'

const METHODS: Array<[string, (cfl: number) => number]> = [
  ['block Gauss-Seidel', (c) => c * c],
  ['point-block SOR w=0.4', (c) => Math.sqrt((1 - OMEGA) * (1 - OMEGA) + OMEGA * OMEGA * c * c)],
  ['vP-vT Schur complement', () => 0],
]

const LOG_MIN = -2
const LOG_MAX = 12
const bar = (g: number) => {
  const l = Math.log10(Math.max(g, 1e-3))
  return (Math.min(Math.max(l, LOG_MIN), LOG_MAX) - LOG_MIN) / (LOG_MAX - LOG_MIN)
}

export function AcousticStrideMachTrack() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logM, setLogM] = useState(-2)
  const [cflU, setCflU] = useState(0.5)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ laps: 0, cflA: 50 })

  const live = useRef({ logM, cflU, running })
  live.current = { logM, cflU, running }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let tau = 0 // fraction of one time step elapsed, 0 -> 1
    const trail: number[] = []

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { logM: lm, cflU: cu, running: run } = live.current
      const mach = Math.pow(10, lm)
      const cflA = cu / mach

      if (run) {
        tau += 0.006
        if (tau > 1) tau -= 1
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      text('one implicit time step, seen by the two wave families', 34, 28, '#e2e8f0', '12px system-ui, sans-serif')
      text(`dt = CFL_u dx / |u|   ->   the solver is handed CFL_a = CFL_u / M = ${cflA.toExponential(2)}`, 34, 48, '#94a3b8')

      // ---------------- periodic cell track ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(TX, TY, TW, TH)
      for (let i = 1; i < NCELL; i++) {
        const x = TX + (i / NCELL) * TW
        ctx.strokeStyle = 'rgba(148,163,184,0.15)'
        ctx.beginPath()
        ctx.moveTo(x, TY)
        ctx.lineTo(x, TY + TH)
        ctx.stroke()
      }
      text(`${NCELL} cells, periodic`, TX, TY - 8, COL_DIM, '10px ui-monospace, monospace')

      // material particle: walks CFL_u cells per step
      const uPos = ((tau * cu) / NCELL) % 1
      const ux = TX + uPos * TW
      ctx.fillStyle = COL_U
      ctx.beginPath()
      ctx.arc(ux, TY + TH / 2, 7, 0, Math.PI * 2)
      ctx.fill()
      text(`fluid particle : ${(tau * cu).toFixed(2)} cells`, TX, TY + TH + 22, COL_U)

      // acoustic front: laps the domain CFL_a / NCELL times per step
      const laps = (tau * cflA) / NCELL
      const cPos = laps % 1
      const cx = TX + cPos * TW
      trail.push(cx)
      if (trail.length > 26) trail.shift()
      trail.forEach((x, i) => {
        ctx.strokeStyle = `rgba(251,146,60,${(0.05 + (0.5 * i) / trail.length).toFixed(3)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, TY + 3)
        ctx.lineTo(x, TY + TH - 3)
        ctx.stroke()
      })
      ctx.strokeStyle = COL_C
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx, TY)
      ctx.lineTo(cx, TY + TH)
      ctx.stroke()
      text(
        `acoustic front : ${(tau * cflA).toExponential(2)} cells  (${laps.toFixed(1)} laps of the domain)`,
        TX + 280,
        TY + TH + 22,
        COL_C,
      )

      // step progress bar
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(TX, TY + TH + 34, TW, 8)
      ctx.fillStyle = 'rgba(148,163,184,0.5)'
      ctx.fillRect(TX, TY + TH + 34, tau * TW, 8)
      text('t / dt', TX + TW + 6, TY + TH + 42, COL_DIM, '10px ui-monospace, monospace')

      // ---------------- loop-gain bars ----------------
      text('loop gain left in the preconditioner', 34, BY - 26, '#e2e8f0', '12px system-ui, sans-serif')

      const oneX = BX + bar(1) * BW
      ctx.strokeStyle = 'rgba(248,113,113,0.7)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(oneX, BY - 12)
      ctx.lineTo(oneX, BY + 3 * ROWH + 6)
      ctx.stroke()
      ctx.setLineDash([])
      text('gain = 1', oneX - 22, BY - 18, COL_BAD, '10px ui-monospace, monospace')

      METHODS.forEach(([lab, fn], j) => {
        const g = fn(cflA)
        const y = BY + j * ROWH
        const ok = g < 1
        text(lab, 34, y + 20, '#cbd5e1')
        ctx.fillStyle = ok ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.55)'
        const wpx = g <= 0 ? 4 : bar(g) * BW
        ctx.fillRect(BX, y + 8, Math.max(wpx, 4), 16)
        ctx.strokeStyle = ok ? COL_OK : COL_BAD
        ctx.lineWidth = 1
        ctx.strokeRect(BX, y + 8, Math.max(wpx, 4), 16)
        const txt = g === 0 ? '0  (loop eliminated)' : g < 1e4 ? g.toFixed(3) : g.toExponential(2)
        text(txt, BX + Math.max(wpx, 4) + 8, y + 21, ok ? COL_OK : COL_BAD)
        text(ok ? 'converges' : 'diverges', BX + BW + 6, y + 21, ok ? COL_OK : COL_BAD, '10px ui-monospace, monospace')
      })

      for (let l = LOG_MIN; l <= LOG_MAX; l += 2) {
        const x = BX + bar(Math.pow(10, l)) * BW
        text(`1e${l}`, x - 8, BY + 3 * ROWH + 20, COL_DIM, '9px ui-monospace, monospace')
      }

      text(`Mach = ${mach.toExponential(0)}`, 34, H - 30, COL_DIM, '12px ui-monospace, monospace')
      text(`CFL_u = ${cu.toFixed(2)}`, 190, H - 30, COL_U, '12px ui-monospace, monospace')
      text(`CFL_a = ${cflA.toExponential(2)}`, 320, H - 30, COL_C, '12px ui-monospace, monospace')
      text(
        cflA > 2 ? 'only the Schur complement is left standing' : 'all three still converge at this stiffness',
        480,
        H - 30,
        cflA > 2 ? COL_BAD : COL_OK,
        '12px system-ui, sans-serif',
      )

      frame++
      if (frame % 12 === 0) push.current({ laps, cflA })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 60 }
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
          {running ? '❙❙ pause' : '▶ run the step'}
        </button>
        <label style={label}>
          <span style={nameS}>Mach</span>
          <input type="range" min={-6} max={-1} step={1} value={logM} onChange={(e) => setLogM(parseFloat(e.target.value))} />
          <span style={mono}>1e{logM}</span>
        </label>
        <label style={label}>
          <span style={nameS}>CFL_u</span>
          <input type="range" min={0.1} max={4} step={0.1} value={cflU} onChange={(e) => setCflU(parseFloat(e.target.value))} />
          <span style={mono}>{cflU.toFixed(1)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Pull <em>Mach</em> down one notch at a time and watch the orange front: at 1e-2 it laps the domain about once
        per step, at 1e-6 it laps it {(stat.cflA / NCELL).toExponential(1)} times while the blue particle still crawls{' '}
        {cflU.toFixed(1)} cells. Nothing about the physics changed — only the number the linear solver is handed. The
        bars below are the same sweep as the article&apos;s Mach table: Gauss-Seidel crosses the red line first, SOR
        next, and the Schur bar never leaves zero.
      </div>
    </div>
  )
}

export default AcousticStrideMachTrack
