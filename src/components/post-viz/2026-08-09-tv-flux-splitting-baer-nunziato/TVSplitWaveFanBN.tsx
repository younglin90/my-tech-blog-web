'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Tokareva & Toro split the Baer-Nunziato flux into two pieces
//
//   F(Q) = A(Q) + P(Q)
//
// where A holds every term carrying rho*u (advection, no pressure at all) and
// P holds every term carrying p (pressure, no advection at all). Each piece is
// then its own hyperbolic system with its own characteristic speeds:
//
//   A-system :  { 0, u, u }                       per phase  -> material only
//   P-system :  { (u - A)/2, 0, (u + A)/2 },  A = sqrt(u^2 + 4a^2)
//
// Set u = 0 and the P-system speeds collapse to -a, 0, +a. That is the whole
// point: the acoustics live entirely in P. The A-system never sees the sound
// speed, so it never sets the time step.
//
// The nonconservative term T(Q) d_x(alpha_bar) rides along at lambda_7 = u_bar
// -- the solid contact, the only field across which the volume fraction jumps.
// ---------------------------------------------------------------------------

const W = 760
const H = 452

const PY = 62
const PH = 268
const PW = 216
const PX = [36, 284, 532]

const C_GAS = '#fbbf24'
const C_SOL = '#38bdf8'
const C_INT = '#e879f9'
const C_ZERO = '#64748b'
const BG = '#08111f'

type Wave = { s: number; col: string; label: string; wide?: boolean }

// P-system nonlinear wave speed:  A = sqrt(u^2 + 4 h /(rho e_p)),
// which for ideal / stiffened EOS reduces to sqrt(u^2 + 4 a^2).
function bigA(u: number, a: number): number {
  return Math.sqrt(u * u + 4 * a * a)
}

function fullWaves(u: number, a: number, ub: number, ab: number): Wave[] {
  return [
    { s: u - a, col: C_GAS, label: 'u−a' },
    { s: u, col: C_GAS, label: 'u' },
    { s: u + a, col: C_GAS, label: 'u+a' },
    { s: ub - ab, col: C_SOL, label: 'ū−ā' },
    { s: ub, col: C_SOL, label: 'ū' },
    { s: ub + ab, col: C_SOL, label: 'ū+ā' },
    { s: ub, col: C_INT, label: 'ū (ᾱ)', wide: true },
  ]
}

function advWaves(u: number, ub: number): Wave[] {
  return [
    { s: 0, col: C_ZERO, label: '0' },
    { s: u, col: C_GAS, label: 'u' },
    { s: ub, col: C_SOL, label: 'ū' },
    { s: ub, col: C_INT, label: 'ū (ᾱ)', wide: true },
  ]
}

function presWaves(u: number, a: number, ub: number, ab: number): Wave[] {
  const A = bigA(u, a)
  const Ab = bigA(ub, ab)
  return [
    { s: 0.5 * (u - A), col: C_GAS, label: '(u−A)/2' },
    { s: 0, col: C_ZERO, label: '0' },
    { s: 0.5 * (u + A), col: C_GAS, label: '(u+A)/2' },
    { s: 0.5 * (ub - Ab), col: C_SOL, label: '(ū−Ā)/2' },
    { s: 0.5 * (ub + Ab), col: C_SOL, label: '(ū+Ā)/2' },
    { s: ub, col: C_INT, label: 'ū (ᾱ)', wide: true },
  ]
}

function maxSpeed(ws: Wave[]): number {
  return ws.reduce((m, w) => Math.max(m, Math.abs(w.s)), 0)
}

export function TVSplitWaveFanBN() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [u, setU] = useState(0.4)
  const [a, setA] = useState(1.0)
  const [ub, setUb] = useState(-0.3)
  const [ab, setAb] = useState(0.6)
  const [running, setRunning] = useState(true)

  const cfg = useRef({ u, a, ub, ab, running })
  cfg.current = { u, a, ub, ab, running }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    let raf = 0
    let phase = 0
    let last = 0

    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      const c = cfg.current
      if (c.running) phase = (phase + dt * 0.32) % 1

      const panels: { title: string; sub: string; ws: Wave[] }[] = [
        { title: 'full BN system', sub: '7 waves, acoustic CFL', ws: fullWaves(c.u, c.a, c.ub, c.ab) },
        { title: 'A-system  ∂ₜQ+∂ₓA(Q)=0', sub: 'λ = 0, u, u  (no pressure)', ws: advWaves(c.u, c.ub) },
        { title: 'P-system  ∂ₜQ+∂ₓP(Q)+T∂ₓᾱ=0', sub: 'λ = (u∓A)/2, 0  (no advection)', ws: presWaves(c.u, c.a, c.ub, c.ab) },
      ]

      // one shared velocity scale so the three fans are directly comparable
      const sMax = Math.max(...panels.map((p) => maxSpeed(p.ws)), 0.3) * 1.12

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      text('Same state, three systems: where does the sound speed go?', 36, 26, '#e2e8f0', '13px ui-sans-serif, system-ui')
      text(`shared velocity scale  |λ|max = ${sMax.toFixed(2)}`, 36, 44, '#64748b')

      panels.forEach((pan, k) => {
        const px = PX[k]
        const cx = px + PW / 2
        const yb = PY + PH // t = 0
        const yt = PY // t = 1

        // frame
        ctx.fillStyle = 'rgba(148,163,184,0.05)'
        ctx.fillRect(px, PY, PW, PH)
        ctx.strokeStyle = 'rgba(148,163,184,0.22)'
        ctx.lineWidth = 1
        ctx.strokeRect(px, PY, PW, PH)

        text(pan.title, px, PY - 24, '#cbd5e1', '12px ui-sans-serif, system-ui')
        text(pan.sub, px, PY - 10, '#64748b', '10px ui-monospace, monospace')

        // axes: x horizontal (centred on 0), t vertical upward
        ctx.strokeStyle = 'rgba(148,163,184,0.3)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(cx, PY)
        ctx.lineTo(cx, yb)
        ctx.stroke()
        ctx.setLineDash([])
        text('x', px + PW - 10, yb + 14, '#64748b', '10px ui-monospace, monospace')
        text('t', cx + 5, PY + 10, '#64748b', '10px ui-monospace, monospace')

        const xOf = (s: number, t: number) => cx + (s * t) / sMax * (PW / 2)
        const yOf = (t: number) => yb - t * PH

        // characteristics + travelling pulses
        pan.ws.forEach((wv) => {
          ctx.strokeStyle = wv.col
          ctx.globalAlpha = wv.wide ? 0.95 : 0.75
          ctx.lineWidth = wv.wide ? 2.6 : 1.5
          ctx.beginPath()
          ctx.moveTo(cx, yb)
          ctx.lineTo(xOf(wv.s, 1), yOf(1))
          ctx.stroke()
          ctx.globalAlpha = 1

          // three pulses per characteristic, evenly offset in phase
          for (let m = 0; m < 3; m++) {
            const t = (phase + m / 3) % 1
            const dotX = xOf(wv.s, t)
            const dotY = yOf(t)
            if (dotX < px + 2 || dotX > px + PW - 2) continue
            ctx.fillStyle = wv.col
            ctx.globalAlpha = 0.35 + 0.65 * (1 - t)
            ctx.beginPath()
            ctx.arc(dotX, dotY, wv.wide ? 3.6 : 2.6, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 1
          }
        })

        // per-panel |lambda|max readout + a bar
        const mx = maxSpeed(pan.ws)
        const barW = (mx / sMax) * (PW - 16)
        ctx.fillStyle = 'rgba(148,163,184,0.16)'
        ctx.fillRect(px + 8, yb + 24, PW - 16, 8)
        ctx.fillStyle = k === 2 ? '#f87171' : k === 1 ? '#34d399' : '#cbd5e1'
        ctx.fillRect(px + 8, yb + 24, barW, 8)
        text(`|λ|max = ${mx.toFixed(3)}`, px + 8, yb + 48, k === 1 ? '#34d399' : '#cbd5e1')
        text(`Δt ∝ ${(1 / Math.max(mx, 1e-6)).toFixed(2)} · Δx`, px + 8, yb + 64, '#94a3b8')
      })

      // ---- legend + the subsonic-configuration gate ----
      const A = bigA(c.u, c.a)
      const SL = 0.5 * (c.u - A)
      const SR = 0.5 * (c.u + A)
      const subsonic = SL < c.ub && c.ub < SR

      text('gas phase', 36, H - 30, C_GAS)
      text('solid phase', 118, H - 30, C_SOL)
      text('ᾱ contact (λ₇ = ū)', 214, H - 30, C_INT)
      text('λ = 0', 356, H - 30, C_ZERO)

      const gx = 430
      ctx.fillStyle = subsonic ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)'
      ctx.fillRect(gx, H - 44, 296, 22)
      ctx.strokeStyle = subsonic ? '#34d399' : '#f87171'
      ctx.lineWidth = 1
      ctx.strokeRect(gx, H - 44, 296, 22)
      text(
        subsonic
          ? `subsonic OK:  ${SL.toFixed(2)} < ū=${c.ub.toFixed(2)} < ${SR.toFixed(2)}`
          : `OUT of paper's regime:  ū=${c.ub.toFixed(2)} ∉ (${SL.toFixed(2)}, ${SR.toFixed(2)})`,
        gx + 10,
        H - 29,
        subsonic ? '#34d399' : '#f87171'
      )

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 48 }
  const btn = (on: boolean): CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 6,
    border: `1px solid ${on ? '#38bdf8' : 'rgba(148,163,184,0.35)'}`,
    background: on ? 'rgba(56,189,248,0.16)' : 'transparent',
    color: on ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  })

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
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>u (gas)</span>
          <input type="range" min={-2} max={2} step={0.05} value={u} onChange={(e) => setU(parseFloat(e.target.value))} />
          <span style={mono}>{u.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>a (gas)</span>
          <input type="range" min={0.1} max={2} step={0.05} value={a} onChange={(e) => setA(parseFloat(e.target.value))} />
          <span style={mono}>{a.toFixed(2)}</span>
        </label>
      </div>
      <div style={row}>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>ū (solid)</span>
          <input type="range" min={-2} max={2} step={0.05} value={ub} onChange={(e) => setUb(parseFloat(e.target.value))} />
          <span style={mono}>{ub.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>ā (solid)</span>
          <input type="range" min={0.1} max={2} step={0.05} value={ab} onChange={(e) => setAb(parseFloat(e.target.value))} />
          <span style={mono}>{ab.toFixed(2)}</span>
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn(running)}>
          {running ? 'pause pulses' : 'run pulses'}
        </button>
      </div>
      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Push a → 2.0 and watch: the outer fan of the middle panel does not move at all, while the right
        panel opens up. Every bit of the acoustic time-step restriction sits in the P-system.
      </div>
    </div>
  )
}
