'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One coarse time step of a two-level lattice-Boltzmann AMR cycle.
//
//   explosion   : the coarse cell hands its populations to m^d fine cells
//   m sub-steps : the fine level collides and streams m times
//   coalescence : 2^d fine cells are averaged back into the coarse cell
//
// The clock makes the cost visible: refining by m multiplies the work of a
// patch by m^d cells times m sub-steps = m^(d+1).
// ---------------------------------------------------------------------------

const W = 760
const H = 404

const GX = 56 // cell diagram origin
const GY = 86
const GS = 208 // coarse cell side in px

const TX0 = 336
const TX1 = 724
const TY_C = 118
const TY_F = 214

const COL_C = '#38bdf8'
const COL_F = '#fb923c'
const COL_EX = '#4ade80'
const COL_CO = '#c084fc'
const COL_AX = 'rgba(148,163,184,0.35)'

type Phase = { kind: 'explosion' | 'substep' | 'coalescence'; index: number }

function buildPhases(m: number): Phase[] {
  const out: Phase[] = [{ kind: 'explosion', index: 0 }]
  for (let k = 1; k <= m; k++) out.push({ kind: 'substep', index: k })
  out.push({ kind: 'coalescence', index: 0 })
  return out
}

export function ExplosionCoalescenceClock() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [m, setM] = useState(2)
  const [dim, setDim] = useState(2)
  const [dwell, setDwell] = useState(42)
  const [running, setRunning] = useState(true)
  const [info, setInfo] = useState({ phase: 'explosion', sub: 0, cycle: 0 })

  const live = useRef({ running, dwell })
  live.current = { running, dwell }
  const stepReq = useRef(0)
  const setInfoRef = useRef(setInfo)
  setInfoRef.current = setInfo

  const cells = Math.pow(m, dim)
  const work = Math.pow(m, dim + 1)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const phases = buildPhases(m)
    let pi = 0
    let tick = 0
    let cycle = 0
    let raf = 0

    const fineVal = (i: number, j: number, t: number) => 0.5 + 0.42 * Math.sin((2 * Math.PI * (i + j)) / (2 * m) + t)

    const arrow = (x0: number, y0: number, x1: number, y1: number, col: string) => {
      ctx.strokeStyle = col
      ctx.fillStyle = col
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      const a = Math.atan2(y1 - y0, x1 - x0)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 - 7 * Math.cos(a - 0.4), y1 - 7 * Math.sin(a - 0.4))
      ctx.lineTo(x1 - 7 * Math.cos(a + 0.4), y1 - 7 * Math.sin(a + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    const draw = () => {
      const ph = phases[pi]
      const frac = tick / Math.max(1, live.current.dwell)
      const t = (cycle * phases.length + pi + frac) * 0.6

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'

      // ---- cell diagram ----------------------------------------------------
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText('one coarse cell, ' + m + '^' + dim + ' = ' + cells + ' fine cells inside', GX, GY - 22)

      const s = GS / m
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
          const v = ph.kind === 'explosion' ? 0.5 : fineVal(i, j, t)
          const grow = ph.kind === 'explosion' ? Math.min(1, frac * 1.3) : 1
          const cx = GX + (i + 0.5) * s
          const cy = GY + (j + 0.5) * s
          const half = (s * 0.46) * grow
          ctx.fillStyle = 'rgba(251,146,60,' + (0.18 + 0.55 * v) + ')'
          ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
          ctx.strokeStyle = 'rgba(251,146,60,0.5)'
          ctx.lineWidth = 1
          ctx.strokeRect(cx - half, cy - half, half * 2, half * 2)
        }
      }
      ctx.strokeStyle = COL_C
      ctx.lineWidth = 2
      ctx.strokeRect(GX, GY, GS, GS)

      if (ph.kind === 'explosion') {
        const cx = GX + GS / 2
        const cy = GY + GS / 2
        for (let i = 0; i < m; i++)
          for (let j = 0; j < m; j++) {
            const tx = GX + (i + 0.5) * s
            const ty = GY + (j + 0.5) * s
            arrow(cx, cy, cx + (tx - cx) * frac, cy + (ty - cy) * frac, COL_EX)
          }
        ctx.fillStyle = COL_EX
        ctx.fillText('explosion: one population set copied out, then rescaled', GX, GY + GS + 26)
      } else if (ph.kind === 'coalescence') {
        const cx = GX + GS / 2
        const cy = GY + GS / 2
        for (let i = 0; i < m; i++)
          for (let j = 0; j < m; j++) {
            const sx = GX + (i + 0.5) * s
            const sy = GY + (j + 0.5) * s
            arrow(sx, sy, sx + (cx - sx) * frac, sy + (cy - sy) * frac, COL_CO)
          }
        ctx.fillStyle = COL_CO
        ctx.fillText('coalescence: average over 2^' + dim + ' = ' + Math.pow(2, dim) + ' fine cells', GX, GY + GS + 26)
      } else {
        ctx.fillStyle = COL_F
        ctx.fillText('fine sub-step ' + ph.index + ' of ' + m + ' (collide and stream)', GX, GY + GS + 26)
      }

      // ---- timelines -------------------------------------------------------
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(TX0, TY_C)
      ctx.lineTo(TX1, TY_C)
      ctx.moveTo(TX0, TY_F)
      ctx.lineTo(TX1, TY_F)
      ctx.stroke()

      ctx.fillStyle = COL_C
      ctx.fillText('coarse level   dt_c', TX0, TY_C - 22)
      ctx.fillStyle = COL_F
      ctx.fillText('fine level   dt_f = dt_c / ' + m, TX0, TY_F - 22)

      const done = (pi + frac) / phases.length
      for (const [ty, n, col] of [
        [TY_C, 1, COL_C],
        [TY_F, m, COL_F],
      ] as [number, number, string][]) {
        for (let k = 0; k <= n; k++) {
          const x = TX0 + ((TX1 - TX0) * k) / n
          ctx.strokeStyle = col
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x, ty - 10)
          ctx.lineTo(x, ty + 10)
          ctx.stroke()
        }
        ctx.fillStyle = col
        const hx = TX0 + (TX1 - TX0) * done
        ctx.beginPath()
        ctx.arc(hx, ty, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // gate markers
      ctx.strokeStyle = COL_EX
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(TX0, TY_C - 16)
      ctx.lineTo(TX0, TY_F + 16)
      ctx.stroke()
      ctx.strokeStyle = COL_CO
      ctx.beginPath()
      ctx.moveTo(TX1, TY_C - 16)
      ctx.lineTo(TX1, TY_F + 16)
      ctx.stroke()
      ctx.setLineDash([])

      // ---- ledger ----------------------------------------------------------
      const ly = TY_F + 70
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText('cost of this patch, per coarse step', TX0, ly - 16)
      const rows: [string, string][] = [
        ['fine cells', m + '^' + dim + ' = ' + cells],
        ['sub-steps', String(m)],
        ['work factor', 'm^(d+1) = ' + work],
        ['transfers', String(2)],
      ]
      rows.forEach(([k, v], i) => {
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(k, TX0, ly + 8 + i * 20)
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(v, TX0 + 130, ly + 8 + i * 20)
      })
    }

    const loop = () => {
      const advance = live.current.running || stepReq.current > 0
      if (advance) {
        tick++
        if (tick >= live.current.dwell) {
          tick = 0
          pi++
          if (pi >= phases.length) {
            pi = 0
            cycle++
          }
          if (stepReq.current > 0) stepReq.current--
          setInfoRef.current({ phase: phases[pi].kind, sub: phases[pi].index, cycle })
        }
      }
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [m, dim, cells, work])

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
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            setRunning(false)
            stepReq.current += 1
          }}
        >
          ▶| next phase
        </button>
        <button style={btn(dim === 3)} onClick={() => setDim((p) => (p === 2 ? 3 : 2))}>
          d = {dim}
        </button>
        <label style={label}>
          <span style={nameS}>m</span>
          <input type="range" min={2} max={4} step={1} value={m} onChange={(e) => setM(parseInt(e.target.value, 10))} />
          <span style={mono}>{m}</span>
        </label>
        <label style={label}>
          <span style={nameS}>dwell</span>
          <input type="range" min={10} max={90} step={2} value={dwell} onChange={(e) => setDwell(parseInt(e.target.value, 10))} />
          <span style={mono}>{dwell}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Use <em>next phase</em> to walk the cycle one gate at a time: explosion, {m} fine sub-steps, coalescence. The two dashed
        lines are the only moments populations cross levels — everything between them is ordinary collide-and-stream. Raise{' '}
        <em>m</em> or switch to <em>d = 3</em> and the work factor climbs as m^(d+1) = {work}; currently at cycle {info.cycle},
        phase {info.phase}
        {info.phase === 'substep' ? ' ' + info.sub : ''}.
      </div>
    </div>
  )
}
