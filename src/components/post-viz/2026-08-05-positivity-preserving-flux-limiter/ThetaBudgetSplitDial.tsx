'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One face touches two cells. That is the whole difficulty.
//
// After the Lax-Friedrichs update every cell has a budget above the floor:
//
//   b_i = rho_i^LF - eps        (>= 0, guaranteed by CFL <= 1/2)
//
// Switching a face toward the high-order flux drains one of its two cells by
//
//   lam * theta_f * |dF_f|,     dF_f = F_high - F_low
//
// Sizing theta_f against the *whole* budget of that cell looks safe face by
// face, and is not: an interior cell is drained by its left face and its right
// face at the same time, so two individually legal faces add up to twice the
// budget. Give each face half and the sum can never exceed b_i.
//
// Flip the split switch below and watch cell 2 fall through the floor.
// ---------------------------------------------------------------------------

const W = 700
const H = 430

const NC = 5 // cells
const RHO_LF = [1.0, 0.55, 0.22, 0.6, 1.0] // the safe first-order state
const DF_BASE = [0, 0.9, -1.0, 1.1, -0.8, 0] // dF on faces 0..5; ends are boundaries

const CX = 84
const CW = W - CX - 150
const CELL = CW / NC

const TOP_Y = 62 // budget row
const TOP_H = 92
const TH_Y = 208 // theta gauges
const TH_H = 30
const BOT_Y = 288 // resulting density
const BOT_H = 92

export function ThetaBudgetSplitDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [lam, setLam] = useState(0.3)
  const [strength, setStrength] = useState(1)
  const [eps, setEps] = useState(0.02)
  const [split, setSplit] = useState(true)

  const cfg = useRef({ lam, strength, eps, split })
  cfg.current = { lam, strength, eps, split }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    let frame = 0

    const draw = () => {
      frame++
      const { lam: L, strength: S, eps: E, split: SP } = cfg.current
      const share = SP ? 0.5 : 1.0
      const dF = DF_BASE.map((v) => v * S)

      const budget = RHO_LF.map((r) => Math.max(r - E, 0))
      const theta = new Array(NC + 1).fill(1)
      for (let f = 1; f < NC; f++) {
        const d = dF[f]
        let cap = 1
        if (d > 0) cap = (share * budget[f - 1]) / (L * d) // drains the LEFT cell
        else if (d < 0) cap = (share * budget[f]) / (L * -d) // drains the RIGHT cell
        theta[f] = Math.min(1, cap)
      }

      const rhoNew = RHO_LF.map((r, i) => r - L * (theta[i + 1] * dF[i + 1] - theta[i] * dF[i]))
      const worst = Math.min(...rhoNew)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const pulse = 0.55 + 0.45 * Math.sin(frame / 22)

      // ================= budget row =================
      const top = 1.15
      const bot = -0.45
      const ty = (v: number) => TOP_Y + TOP_H - ((v - bot) / (top - bot)) * TOP_H

      text('after the Lax-Friedrichs step:  rho^LF  and the budget above the floor', CX, TOP_Y - 26, '#e2e8f0', 'bold 11px ui-monospace, monospace')

      for (let i = 0; i < NC; i++) {
        const x = CX + i * CELL
        ctx.fillStyle = 'rgba(56,189,248,0.18)'
        ctx.fillRect(x + 3, ty(RHO_LF[i]), CELL - 6, ty(0) - ty(RHO_LF[i]))
        ctx.fillStyle = 'rgba(52,211,153,0.30)'
        ctx.fillRect(x + 3, ty(RHO_LF[i]), CELL - 6, ty(E) - ty(RHO_LF[i]))
        ctx.strokeStyle = 'rgba(148,163,184,0.30)'
        ctx.strokeRect(x + 3, ty(top), CELL - 6, ty(bot) - ty(top))
        text(`cell ${i}`, x + CELL / 2 - 17, TOP_Y + TOP_H + 15, '#94a3b8', '10px ui-monospace, monospace')
        text(`b=${budget[i].toFixed(2)}`, x + CELL / 2 - 21, ty(RHO_LF[i]) - 6, '#34d399', '10px ui-monospace, monospace')
      }

      ctx.strokeStyle = '#34d399'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(CX, ty(E))
      ctx.lineTo(CX + CW, ty(E))
      ctx.stroke()
      ctx.setLineDash([])
      text('floor eps', CX + CW + 8, ty(E) + 4, '#34d399', '10px ui-monospace, monospace')

      // dF arrows: which cell does each face drain?
      for (let f = 1; f < NC; f++) {
        const x = CX + f * CELL
        const d = dF[f]
        if (d === 0) continue
        const victim = d > 0 ? f - 1 : f
        const dir = d > 0 ? -1 : 1
        const y = TOP_Y + TOP_H + 34
        ctx.strokeStyle = `rgba(251,191,36,${0.35 + 0.5 * pulse})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + dir * (CELL * 0.42), y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + dir * (CELL * 0.42), y)
        ctx.lineTo(x + dir * (CELL * 0.42 - 7), y - 4)
        ctx.lineTo(x + dir * (CELL * 0.42 - 7), y + 4)
        ctx.closePath()
        ctx.fillStyle = `rgba(251,191,36,${0.35 + 0.5 * pulse})`
        ctx.fill()
        text(`f${f}`, x - 6, y - 10, '#fbbf24', '10px ui-monospace, monospace')
        if (victim === 2) {
          ctx.strokeStyle = 'rgba(248,113,113,0.8)'
          ctx.lineWidth = 1
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.moveTo(x, TOP_Y)
          ctx.lineTo(x, y - 14)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
      text('cell 2 is drained from BOTH sides', CX + CW + 8, TOP_Y + TOP_H + 38, '#f87171', 'bold 10px ui-monospace, monospace')

      // ================= theta gauges =================
      text(`theta on each face   (each face may spend ${SP ? 'HALF' : 'ALL'} of its victim's budget)`, CX, TH_Y - 12, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      for (let f = 1; f < NC; f++) {
        const x = CX + f * CELL - CELL * 0.32
        const w = CELL * 0.64
        ctx.strokeStyle = 'rgba(148,163,184,0.30)'
        ctx.strokeRect(x, TH_Y, w, TH_H)
        ctx.fillStyle = theta[f] > 0.999 ? 'rgba(52,211,153,0.55)' : theta[f] > 0.3 ? '#fbbf24' : '#f87171'
        ctx.fillRect(x, TH_Y, w * theta[f], TH_H)
        text(theta[f].toFixed(3), x + w / 2 - 15, TH_Y + TH_H + 14, '#cbd5e1', '10px ui-monospace, monospace')
      }
      text('0', CX - 16, TH_Y + TH_H, '#64748b', '10px ui-monospace, monospace')
      text('1', CX + CW + 8, TH_Y + 12, '#64748b', '10px ui-monospace, monospace')

      // ================= resulting density =================
      const by = (v: number) => BOT_Y + BOT_H - ((v - bot) / (top - bot)) * BOT_H
      text('after the blended flux:  rho^(n+1)', CX, BOT_Y - 12, '#e2e8f0', 'bold 11px ui-monospace, monospace')

      ctx.fillStyle = 'rgba(248,113,113,0.10)'
      ctx.fillRect(CX, by(E), CW, BOT_Y + BOT_H - by(E))

      for (let i = 0; i < NC; i++) {
        const x = CX + i * CELL
        const v = rhoNew[i]
        const bad = v < E - 1e-9
        ctx.fillStyle = bad ? 'rgba(248,113,113,0.65)' : 'rgba(56,189,248,0.45)'
        const y0 = by(Math.max(v, bot))
        const y1 = by(0)
        ctx.fillRect(x + 3, Math.min(y0, y1), CELL - 6, Math.abs(y1 - y0))
        ctx.strokeStyle = 'rgba(148,163,184,0.30)'
        ctx.strokeRect(x + 3, by(top), CELL - 6, by(bot) - by(top))
        text(v.toFixed(3), x + CELL / 2 - 17, by(Math.max(v, bot)) + (v < E ? 14 : -6), bad ? '#f87171' : '#38bdf8', 'bold 10px ui-monospace, monospace')
        if (bad) text('rho < eps', x + CELL / 2 - 22, by(bot) - 6, '#f87171', 'bold 10px ui-monospace, monospace')
      }

      ctx.strokeStyle = '#34d399'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(CX, by(E))
      ctx.lineTo(CX + CW, by(E))
      ctx.stroke()
      ctx.setLineDash([])

      // ================= verdict =================
      const ok = worst >= E - 1e-9
      text('worst cell', CX, H - 26, '#94a3b8')
      text(worst.toFixed(4), CX + 88, H - 26, ok ? '#34d399' : '#f87171', 'bold 11px ui-monospace, monospace')
      text(
        ok
          ? 'every cell stays on the admissible side of the floor'
          : 'two legal faces, one illegal cell — the budget was handed out twice',
        CX + 170,
        H - 26,
        ok ? '#34d399' : '#f87171',
        'bold 12px ui-monospace, monospace'
      )
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean, col = '#fbbf24'): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.7rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }
  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 42 }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div style={row}>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>lambda</span>
          <input type="range" min={0.05} max={0.6} step={0.01} value={lam} onChange={(e) => setLam(parseFloat(e.target.value))} />
          <span style={mono}>{lam.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>|dF| scale</span>
          <input type="range" min={0} max={3} step={0.05} value={strength} onChange={(e) => setStrength(parseFloat(e.target.value))} />
          <span style={mono}>{strength.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>eps</span>
          <input type="range" min={0} max={0.18} step={0.005} value={eps} onChange={(e) => setEps(parseFloat(e.target.value))} />
          <span style={mono}>{eps.toFixed(3)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setSplit(true)} style={btn(split, '#34d399')}>
          half budget per face
        </button>
        <button onClick={() => setSplit(false)} style={btn(!split, '#f87171')}>
          full budget per face
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        raise |dF| until the two faces around cell 2 both turn yellow — that is the limiter working. now press
        &ldquo;full budget per face&rdquo;: both thetas jump back up, each one perfectly legal on its own, and the
        bottom bar for cell 2 drops straight through the green floor.
      </div>
    </div>
  )
}
