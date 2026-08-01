'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Why pressure needs two coupling terms, and what each linearisation keeps.
//
// The Newton linearisation of the face mass flux splits into two pieces:
//
//   rho~^(n) theta^(n+1)      pressure -> velocity coupling   (elliptic side)
//   rho~^(n+1) theta^(n)      pressure -> density  coupling   (hyperbolic side)
//
// Differentiating each with respect to pressure gives their weights:
//
//   velocity side :  rho * dhat            = dt/dx
//   density  side :  theta * drho/dp       = theta / a_T^2
//
//   ratio = (theta / a_T^2) / (rho dhat) = M / Co
//
// So the same single number M/Co that decides the fixed-point contraction
// also decides which physical coupling carries the pressure equation. The
// fixed-coefficient linearisation simply deletes the density side — which is
// harmless at M << Co and fatal once the density side is the heavy one.
// ---------------------------------------------------------------------------

const W = 690
const H = 452

const CX = 345 // pivot
const CY = 150
const ARM = 196
const BEAM_MAX = 0.30 // radians

type Mode = 'fixed' | 'rho-newton'

export function MachCouplingSeesaw() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [logM, setLogM] = useState(Math.log10(0.05))
  const [logCo, setLogCo] = useState(Math.log10(0.4))
  const [mode, setMode] = useState<Mode>('rho-newton')

  const M = Math.pow(10, logM)
  const Co = Math.pow(10, logCo)
  const ratio = M / Co

  const s = useRef({ M, Co, ratio, mode })
  s.current = { M, Co, ratio, mode }

  const angle = useRef(0)
  const glow = useRef(0)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let last = -1

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const draw = (ts: number) => {
      const dt = last < 0 ? 0 : Math.min((ts - last) / 1000, 0.05)
      last = ts
      const st = s.current

      // the density side is deleted entirely by the fixed-coefficient scheme
      const wVel = 1
      const wRho = st.mode === 'fixed' ? 0 : st.ratio

      // beam tilt: positive angle = density side (right) sinks
      const target =
        wRho === 0 ? -BEAM_MAX : BEAM_MAX * Math.tanh(Math.log10(Math.max(wRho, 1e-6) / wVel) / 1.6)
      angle.current += (target - angle.current) * Math.min(1, dt * 4.5)
      glow.current = (glow.current + dt * 1.4) % 1

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------- Mach regime strip ----------
      const SX = 44
      const SW = W - SX - 26
      const SY = 30
      const lo = -3
      const hi = 0.6
      const mx = (lm: number) => SX + ((lm - lo) / (hi - lo)) * SW
      const bands: [number, number, string, string][] = [
        [-3, -1, 'rgba(56,189,248,0.18)', 'near-incompressible'],
        [-1, -0.1, 'rgba(52,211,153,0.16)', 'subsonic'],
        [-0.1, 0.1, 'rgba(251,191,36,0.20)', 'trans.'],
        [0.1, 0.6, 'rgba(248,113,113,0.18)', 'supersonic'],
      ]
      for (const [a, b, fill, label] of bands) {
        ctx.fillStyle = fill
        ctx.fillRect(mx(a), SY, mx(b) - mx(a), 20)
        if (mx(b) - mx(a) > label.length * 6 + 10)
          text(label, mx(a) + 5, SY + 14, '#94a3b8', '10px ui-monospace, monospace')
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(SX, SY, SW, 20)
      const mkx = mx(Math.log10(st.M))
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.moveTo(mkx, SY - 6)
      ctx.lineTo(mkx - 5, SY - 14)
      ctx.lineTo(mkx + 5, SY - 14)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#f8fafc'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(mkx, SY)
      ctx.lineTo(mkx, SY + 20)
      ctx.stroke()
      text('M', SX - 22, SY + 15, '#e2e8f0')

      // ---------- the beam ----------
      const th = angle.current
      const lx = CX - ARM * Math.cos(th)
      const ly = CY - ARM * Math.sin(th)
      const rx = CX + ARM * Math.cos(th)
      const ry = CY + ARM * Math.sin(th)

      // pivot
      ctx.fillStyle = 'rgba(148,163,184,0.35)'
      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.lineTo(CX - 20, CY + 62)
      ctx.lineTo(CX + 20, CY + 62)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.lineTo(rx, ry)
      ctx.stroke()
      ctx.lineCap = 'butt'

      // ---------- the two weights ----------
      const block = (
        px: number,
        py: number,
        weight: number,
        col: string,
        title: string,
        formula: string,
        magnitude: string,
        muted: boolean
      ) => {
        const hgt = 14 + 52 * Math.min(1, Math.pow(weight / (1 + weight), 0.75) * 2)
        const wid = 132
        ctx.strokeStyle = 'rgba(148,163,184,0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px, py + 26)
        ctx.stroke()

        if (muted) {
          ctx.setLineDash([5, 4])
          ctx.strokeStyle = 'rgba(148,163,184,0.45)'
          ctx.strokeRect(px - wid / 2, py + 26, wid, 34)
          ctx.setLineDash([])
          text('term deleted', px - 36, py + 47, '#94a3b8')
          text(title, px - wid / 2, py + 78, '#64748b', 'bold 11px ui-monospace, monospace')
          text(formula, px - wid / 2, py + 93, '#475569')
          return
        }

        const grd = ctx.createLinearGradient(0, py + 26, 0, py + 26 + hgt)
        grd.addColorStop(0, col)
        grd.addColorStop(1, 'rgba(11,18,32,0.65)')
        ctx.fillStyle = grd
        ctx.fillRect(px - wid / 2, py + 26, wid, hgt)
        ctx.strokeStyle = col
        ctx.lineWidth = 1.5
        ctx.strokeRect(px - wid / 2, py + 26, wid, hgt)

        text(title, px - wid / 2, py + 26 + hgt + 16, col, 'bold 11px ui-monospace, monospace')
        text(formula, px - wid / 2, py + 26 + hgt + 31, '#cbd5e1')
        text(magnitude, px - wid / 2, py + 26 + hgt + 46, '#94a3b8')
      }

      block(
        lx,
        ly,
        wVel,
        '#22d3ee',
        'pressure → velocity',
        'rho(n) · theta(n+1)',
        'weight = rho·d = Δt/Δx  ≡ 1',
        false
      )
      block(
        rx,
        ry,
        wRho,
        '#fbbf24',
        'pressure → density',
        'rho(n+1) · theta(n)',
        `weight = theta/a_T² = ${st.ratio < 0.01 ? st.ratio.toExponential(1) : st.ratio.toFixed(3)}`,
        st.mode === 'fixed'
      )

      // ---------- character bar ----------
      const BXX = 44
      const BWW = W - BXX - 26
      const BYY = 372
      const g = ctx.createLinearGradient(BXX, 0, BXX + BWW, 0)
      g.addColorStop(0, 'rgba(34,211,238,0.55)')
      g.addColorStop(0.5, 'rgba(251,191,36,0.55)')
      g.addColorStop(1, 'rgba(248,113,113,0.55)')
      ctx.fillStyle = g
      ctx.fillRect(BXX, BYY, BWW, 14)
      const pos = BXX + BWW * Math.min(1, Math.max(0, (Math.log10(Math.max(st.ratio, 1e-6)) + 3) / 4.2))
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(pos - 1.5, BYY - 5, 3, 24)
      text('elliptic — pressure constrains velocity', BXX, BYY - 9, '#22d3ee')
      const rlbl = 'hyperbolic — pressure moves density'
      ctx.font = '11px ui-monospace, monospace'
      text(rlbl, BXX + BWW - ctx.measureText(rlbl).width, BYY - 9, '#f87171')
      text('M/Co', 6, BYY + 12, '#e2e8f0')

      // ---------- readouts ----------
      text(
        `M = ${st.M < 0.01 ? st.M.toExponential(1) : st.M.toFixed(3)}     Co = ${st.Co.toFixed(3)}     ` +
          `density side / velocity side = M/Co = ${st.ratio < 0.01 ? st.ratio.toExponential(2) : st.ratio.toFixed(3)}`,
        BXX,
        BYY + 38,
        '#e2e8f0'
      )
      text(
        st.mode === 'fixed'
          ? st.ratio < 1
            ? 'the deleted side is the light one — you get away with it'
            : 'danger — the deleted side is the heavy one'
          : 'both sides are in the matrix — the balance may tip, the solver does not',
        BXX,
        BYY + 56,
        st.mode === 'fixed' ? (st.ratio < 1 ? '#34d399' : '#f87171') : '#34d399',
        'bold 12px ui-monospace, monospace'
      )
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#fbbf24' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }

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
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>linearisation</span>
        <button onClick={() => setMode('fixed')} style={btn(mode === 'fixed')}>
          fixed-coefficient
        </button>
        <button onClick={() => setMode('rho-newton')} style={btn(mode === 'rho-newton')}>
          Newton (ρ implicit)
        </button>
      </div>

      <div style={row}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Mach M
          <input
            type="range"
            min={-3}
            max={0.6}
            step={0.01}
            value={logM}
            onChange={(e) => setLogM(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 66 }}>
            {M < 0.01 ? M.toExponential(1) : M.toFixed(3)}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Courant Co
          <input
            type="range"
            min={-1.3}
            max={0.7}
            step={0.01}
            value={logCo}
            onChange={(e) => setLogCo(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }}>
            {Co.toFixed(3)}
          </span>
        </label>
      </div>
    </div>
  )
}
