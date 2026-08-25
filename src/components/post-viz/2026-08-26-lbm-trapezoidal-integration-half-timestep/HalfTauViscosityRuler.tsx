'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A live D1Q3 lattice that diffuses momentum, i.e. exactly the shear-wave decay
// used in the post.  The initial profile is j = sin(k y) on 64 periodic nodes;
// the amplitude should fall as exp(-nu k^2 t).
//
// The lattice never gets told what nu is.  Two candidate rulers are drawn on
// top of the measured decay:
//
//     nu = cs^2 (tau - 1/2)     <- what the trapezoidal discretisation leaves
//     nu = cs^2 tau             <- what the continuous BGK equation suggests
//
// Push tau towards 0.5 and the second ruler misses by an unbounded factor.
// ---------------------------------------------------------------------------

const W = 740
const H = 430

const TX0 = 56
const TX1 = 716
const TY0 = 30
const TY1 = 186

const BX0 = 56
const BX1 = 716
const BY0 = 228
const BY1 = 400

const N = 64
const CS2 = 1 / 3
const K = (2 * Math.PI) / N
const WT = [1 / 6, 2 / 3, 1 / 6]
const EV = [-1, 0, 1]
const NPLOT = 900 // steps kept on the decay chart

const COL_MEAS = '#38bdf8'
const COL_SHIFT = '#4ade80'
const COL_NAIVE = '#fb923c'

export function HalfTauViscosityRuler() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tau, setTau] = useState(0.6)
  const [spf, setSpf] = useState(4)
  const [running, setRunning] = useState(true)
  const [seed, setSeed] = useState(0)
  const [stat, setStat] = useState({ step: 0, amp: 1, nu: 0 })

  const live = useRef({ tau, spf, running })
  live.current = { tau, spf, running }
  const setStatRef = useRef(setStat)
  setStatRef.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    // g[i][y], sum_i g = j (momentum density);  g_i^eq = w_i j
    const g = [new Float64Array(N), new Float64Array(N), new Float64Array(N)]
    const j = new Float64Array(N)
    const tmp = [new Float64Array(N), new Float64Array(N), new Float64Array(N)]
    for (let y = 0; y < N; y++) {
      j[y] = Math.sin(K * y)
      for (let i = 0; i < 3; i++) g[i][y] = WT[i] * j[y]
    }
    let step = 0
    const hist: number[] = [1]
    let raf = 0
    let frame = 0

    const amplitude = () => {
      let s = 0
      for (let y = 0; y < N; y++) s += j[y] * Math.sin(K * y)
      return (2 * s) / N
    }

    const advance = (t: number) => {
      for (let y = 0; y < N; y++) {
        let m = 0
        for (let i = 0; i < 3; i++) m += g[i][y]
        j[y] = m
        for (let i = 0; i < 3; i++) g[i][y] -= (g[i][y] - WT[i] * m) / t
      }
      for (let i = 0; i < 3; i++) {
        const e = EV[i]
        for (let y = 0; y < N; y++) tmp[i][(y + e + N) % N] = g[i][y]
      }
      for (let i = 0; i < 3; i++) g[i].set(tmp[i])
      step++
    }

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const S = live.current
      if (S.running && step < NPLOT) {
        for (let s = 0; s < S.spf; s++) {
          advance(S.tau)
          hist.push(amplitude())
        }
      }

      const nuShift = CS2 * (S.tau - 0.5)
      const nuNaive = CS2 * S.tau
      const amp = hist[hist.length - 1]
      const nuMeas = step > 20 ? -Math.log(Math.max(1e-12, amp)) / (step * K * K) : 0

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // =====================================================================
      // TOP: the live momentum profile with the two predicted envelopes
      // =====================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(TX0, TY0, TX1 - TX0, TY1 - TY0)
      const tx = (y: number) => TX0 + (y / (N - 1)) * (TX1 - TX0)
      const ty = (v: number) => (TY0 + TY1) / 2 - v * ((TY1 - TY0) / 2 - 12)
      ctx.strokeStyle = 'rgba(226,232,240,0.2)'
      ctx.beginPath()
      ctx.moveTo(TX0, ty(0))
      ctx.lineTo(TX1, ty(0))
      ctx.stroke()
      text('momentum  j (y)', TX0 + 8, TY0 + 15, '#64748b', '10px ui-monospace, monospace')
      text('+1', TX0 - 26, ty(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('-1', TX0 - 26, ty(-1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('y = 0', TX0 + 2, TY1 + 15, '#64748b', '10px ui-monospace, monospace')
      text('63', TX1 - 16, TY1 + 15, '#64748b', '10px ui-monospace, monospace')

      const envShift = Math.exp(-nuShift * K * K * step)
      const envNaive = Math.exp(-nuNaive * K * K * step)
      const envelope = (a: number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.setLineDash(dash)
        ctx.lineWidth = 1.2
        for (const sgn of [1, -1]) {
          ctx.beginPath()
          ctx.moveTo(TX0, ty(sgn * a))
          ctx.lineTo(TX1, ty(sgn * a))
          ctx.stroke()
        }
        ctx.setLineDash([])
      }
      envelope(envShift, 'rgba(74,222,128,0.75)', [5, 4])
      envelope(envNaive, 'rgba(251,146,60,0.75)', [2, 4])

      ctx.strokeStyle = COL_MEAS
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let y = 0; y < N; y++) {
        const x = tx(y)
        const yy = ty(j[y])
        y === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
      }
      ctx.stroke()
      for (let y = 0; y < N; y += 4) {
        ctx.fillStyle = COL_MEAS
        ctx.beginPath()
        ctx.arc(tx(y), ty(j[y]), 2, 0, 2 * Math.PI)
        ctx.fill()
      }

      text(`step ${step}`, TX1 - 90, TY0 + 15, '#e2e8f0', '11px ui-monospace, monospace')

      // =====================================================================
      // BOTTOM: amplitude against step, semi-log
      // =====================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0)
      const bx = (s: number) => BX0 + (s / NPLOT) * (BX1 - BX0)
      const by = (a: number) => BY0 + 12 + (-Math.log10(Math.max(1e-4, a)) / 4) * (BY1 - BY0 - 24)
      ctx.strokeStyle = 'rgba(226,232,240,0.12)'
      for (let d = 1; d <= 3; d++) {
        ctx.beginPath()
        ctx.moveTo(BX0, by(Math.pow(10, -d)))
        ctx.lineTo(BX1, by(Math.pow(10, -d)))
        ctx.stroke()
        text(`1e-${d}`, BX0 - 34, by(Math.pow(10, -d)) + 4, '#64748b', '10px ui-monospace, monospace')
      }
      text('1', BX0 - 16, by(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('amplitude (log)   vs   step', BX0 + 8, BY0 + 14, '#64748b', '10px ui-monospace, monospace')
      text(`${NPLOT}`, BX1 - 30, BY1 - 6, '#64748b', '10px ui-monospace, monospace')

      const rule = (nu: number, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 1.6
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let s = 0; s <= NPLOT; s += 8) {
          const a = Math.exp(-nu * K * K * s)
          const x = bx(s)
          const y = by(a)
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
      rule(nuNaive, COL_NAIVE, [2, 4])
      rule(nuShift, COL_SHIFT, [5, 4])

      ctx.strokeStyle = COL_MEAS
      ctx.lineWidth = 2.4
      ctx.beginPath()
      for (let s = 0; s < hist.length; s += 2) {
        const x = bx(s)
        const y = by(Math.abs(hist[s]))
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      const legend: [string, string][] = [
        [COL_MEAS, 'lattice (measured)'],
        [COL_SHIFT, 'cs^2 (tau - 1/2)'],
        [COL_NAIVE, 'cs^2 tau'],
      ]
      legend.forEach(([c, s], i) => {
        ctx.fillStyle = c
        ctx.fillRect(BX1 - 190, BY0 + 22 + i * 15, 16, 3)
        text(s, BX1 - 168, BY0 + 26 + i * 15, '#94a3b8', '10px ui-monospace, monospace')
      })

      frame++
      if (frame % 10 === 0) setStatRef.current({ step, amp: Math.abs(amp), nu: nuMeas })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [tau, seed])

  const nuShift = CS2 * (tau - 0.5)
  const nuNaive = CS2 * tau

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 56 }
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
        <button style={btn(false)} onClick={() => setSeed((p) => p + 1)}>
          ↺ restart
        </button>
        <label style={label}>
          <span style={nameS}>tau</span>
          <input type="range" min={0.51} max={2} step={0.01} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} />
          <span style={mono}>{tau.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>steps/frame</span>
          <input type="range" min={1} max={12} step={1} value={spf} onChange={(e) => setSpf(parseInt(e.target.value, 10))} />
          <span style={mono}>{spf}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        The lattice is never told a viscosity — only tau. Watch which dashed ruler the blue curve lands on: measured{' '}
        {stat.nu.toFixed(5)} against cs²(tau−½) = {nuShift.toFixed(5)} and cs²tau = {nuNaive.toFixed(5)} (a factor of{' '}
        {(nuNaive / Math.max(1e-9, nuShift)).toFixed(2)} apart). Drag <em>tau</em> down towards 0.51 and the orange ruler
        runs away while the green one keeps holding; at step {stat.step} the amplitude is {stat.amp.toFixed(4)}.
      </div>
    </div>
  )
}
