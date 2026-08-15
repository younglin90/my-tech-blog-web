'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Two solvers race to simulate the same physical time T = 1.
//
//   lane A, explicit surface tension : dt = min( CFL_max * dx/U , dt_sigma )
//   lane B, implicit surface tension : dt = min( CFL_cap * dx/U , S * dt_sigma )
//
// with dt_sigma = sqrt( (rho_A + rho_B) dx^3 / (2 pi sigma) ), rho_A/rho_B = 1000.
//
// Making surface tension implicit deletes dt_sigma from the budget -- but only
// as far as the interface advection scheme allows. CFL_cap is that scheme: 0.01
// for CICSAM, 0.05 for THINC/QQ in Janodet et al. Slide it and watch lane B
// stall at exactly the ceiling the colour-function transport imposes.
//
// The volume-error readout uses the law measured in this post's vortex runs,
// dM/M ~ 2.3 * C * dx, so opening the CFL cap is visibly not free.
// ---------------------------------------------------------------------------

const W = 748
const H = 372
const RHO = 1001 // rho_A + rho_B with a 1000:1 ratio, sigma = 1
const TEND = 1
const SPS = 900 // solver steps per second of wall clock

const LX0 = 176
const LX1 = 716

export function StepBudgetRaceTrack() {
  const [res, setRes] = useState(120) // D / dx
  const [u, setU] = useState(0.02) // characteristic velocity
  const [cap, setCap] = useState(0.05) // interface-advection CFL ceiling
  const [breach, setBreach] = useState(8) // how far past dt_sigma the implicit scheme may go
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)

  const cfg = useRef({ res, u, cap, breach, running })
  cfg.current = { res, u, cap, breach, running }
  const st = useRef({ tA: 0, tB: 0, nA: 0, nB: 0, key: '' })
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let last = 0

    const text = (s: string, x: number, y: number, col: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      const dtw = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const c = cfg.current

      const dx = 1 / c.res
      const dtSig = Math.sqrt((RHO * dx * dx * dx) / (2 * Math.PI))
      const dtCflA = (0.5 * dx) / c.u
      const dtCflB = (c.cap * dx) / c.u
      const dtA = Math.min(dtCflA, dtSig)
      const dtB = Math.min(dtCflB, c.breach * dtSig)

      const key = `${c.res}|${c.u}|${c.cap}|${c.breach}`
      if (st.current.key !== key) {
        st.current = { tA: 0, tB: 0, nA: 0, nB: 0, key }
      }

      if (c.running) {
        const steps = dtw * SPS
        if (st.current.tA < TEND) {
          st.current.tA = Math.min(TEND, st.current.tA + steps * dtA)
          st.current.nA += steps
        }
        if (st.current.tB < TEND) {
          st.current.tB = Math.min(TEND, st.current.tB + steps * dtB)
          st.current.nB += steps
        }
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const lane = (
        y: number,
        title: string,
        dt: number,
        t: number,
        n: number,
        bind: string,
        bindCol: string,
        col: string,
      ) => {
        text(title, 16, y - 14, '#e2e8f0', 'bold 12px ui-monospace, monospace')
        text(`dt = ${dt.toExponential(2)}`, 16, y + 4, '#94a3b8')
        text(`bound by ${bind}`, 16, y + 20, bindCol)
        text(`steps to T=1: ${Math.ceil(TEND / dt)}`, 16, y + 36, '#64748b')

        ctx.fillStyle = 'rgba(148,163,184,0.10)'
        ctx.fillRect(LX0, y - 12, LX1 - LX0, 40)
        const w = ((LX1 - LX0) * t) / TEND
        ctx.fillStyle = col
        ctx.fillRect(LX0, y - 12, w, 40)

        // tick marks: one per 5% of simulated time
        ctx.strokeStyle = 'rgba(11,18,32,0.55)'
        ctx.lineWidth = 1
        for (let k = 1; k < 20; k++) {
          const x = LX0 + ((LX1 - LX0) * k) / 20
          ctx.beginPath()
          ctx.moveTo(x, y - 12)
          ctx.lineTo(x, y + 28)
          ctx.stroke()
        }
        ctx.strokeStyle = 'rgba(148,163,184,0.35)'
        ctx.strokeRect(LX0, y - 12, LX1 - LX0, 40)

        const C = (dt * cfg.current.u) / (1 / cfg.current.res)
        const leak = 2.3 * C * (1 / cfg.current.res)
        text(
          `${(100 * t).toFixed(0)}% of T   |   ${Math.round(n).toLocaleString('en-US')} steps taken   |   C = ${C.toFixed(3)}   |   volume error ~ ${(100 * leak).toFixed(2)}%`,
          LX0 + 8,
          y + 46,
          t >= TEND ? '#34d399' : '#94a3b8',
        )
      }

      const bindA = dtCflA < dtSig ? 'CFL' : 'capillary dt_sigma'
      const bindB = dtCflB < c.breach * dtSig ? 'interface-advection CFL cap' : 'implicit capillary limit'

      lane(70, 'A  explicit surface tension', dtA, st.current.tA, st.current.nA, bindA, bindA === 'CFL' ? '#38bdf8' : '#fb7185', 'rgba(56,189,248,0.55)')
      lane(190, 'B  implicit surface tension (this paper)', dtB, st.current.tB, st.current.nB, bindB, bindB.startsWith('interface') ? '#fbbf24' : '#a78bfa', 'rgba(251,191,36,0.55)')

      // budget bar: the three candidate time steps, log scale
      const items: [string, number, string][] = [
        ['dt_sigma', dtSig, '#fb7185'],
        ['S * dt_sigma', c.breach * dtSig, '#a78bfa'],
        ['CFL 0.5', dtCflA, '#38bdf8'],
        ['CFL cap', dtCflB, '#fbbf24'],
      ]
      const lg = (v: number) => Math.log10(Math.max(v, 1e-9))
      const vmin = Math.min(...items.map((i) => lg(i[1]))) - 0.4
      const vmax = Math.max(...items.map((i) => lg(i[1]))) + 0.4
      const bx = (v: number) => LX0 + ((LX1 - LX0) * (lg(v) - vmin)) / (vmax - vmin)

      text('time-step budget  (log scale, smallest wins)', 16, 300, '#94a3b8')
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(LX0, 322)
      ctx.lineTo(LX1, 322)
      ctx.stroke()
      items.forEach((it, k) => {
        const x = bx(it[1])
        ctx.strokeStyle = it[2]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, 310)
        ctx.lineTo(x, 334)
        ctx.stroke()
        text(it[0], x - 24, k % 2 === 0 ? 304 : 350, it[2])
      })
      text('smaller dt', LX0, 322 + 40, '#64748b')
      text('larger dt', LX1 - 56, 322 + 40, '#64748b')

      const gain = dtB / dtA
      text(
        `speed-up B/A = ${gain.toFixed(1)}x`,
        16,
        330,
        gain > 1.5 ? '#34d399' : '#fb7185',
        'bold 13px ui-monospace, monospace',
      )

      if (++frame % 12 === 0) setTick((v) => v + 1)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 50 }

  return (
    <div style={{ margin: '1.5rem 0' }} data-tick={tick}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>D / dx</span>
          <input type="range" min={20} max={400} step={5} value={res} onChange={(e) => setRes(parseInt(e.target.value))} />
          <span style={mono}>{res}</span>
        </label>
        <label style={label}>
          <span style={name}>U (flow speed)</span>
          <input type="range" min={-3} max={0} step={0.05} value={Math.log10(u)} onChange={(e) => setU(10 ** parseFloat(e.target.value))} />
          <span style={mono}>{u.toExponential(1)}</span>
        </label>
      </div>

      <div style={row}>
        <label style={label}>
          <span style={name}>interface CFL cap</span>
          <input type="range" min={0.01} max={0.5} step={0.01} value={cap} onChange={(e) => setCap(parseFloat(e.target.value))} />
          <span style={mono}>{cap.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={name}>breach factor S</span>
          <input type="range" min={1} max={16} step={0.5} value={breach} onChange={(e) => setBreach(parseFloat(e.target.value))} />
          <span style={mono}>{breach.toFixed(1)}</span>
        </label>
        <button
          onClick={() => setRunning(!running)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            border: '1px solid rgba(148,163,184,0.35)',
            background: running ? 'transparent' : '#fbbf24',
            color: running ? '#cbd5e1' : '#08111f',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {running ? 'pause race' : 'run race'}
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Leave U small &mdash; capillary-driven flow &mdash; and lane A is bound by dt_sigma while lane B runs away: that is the
        paper&rsquo;s selling point. Now drag the interface CFL cap down to 0.01, the CICSAM value: lane B collapses back onto lane
        A even though surface tension is still implicit. Push the cap up to 0.5 instead and the volume-error readout is what pays
        for it.
      </div>
    </div>
  )
}
