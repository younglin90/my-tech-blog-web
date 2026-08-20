'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Reduced van der Waals isotherm  p_r = 8 rho T / (3 - rho) - 3 rho^2
// (rho_c = 1, T_c = 1). Below T_c the isotherm folds: one pressure maps to
// three densities. The physical two-phase pressure is fixed by Maxwell's
// equal-area rule -- equivalently, equal chemical potential in both phases.
// This is the equation of state the LBM forcing term has to reproduce.
// ---------------------------------------------------------------------------

const W = 726
const H = 420

const PLOT_X0 = 66
const PLOT_X1 = 470
const PLOT_Y0 = 34
const PLOT_Y1 = 356
const RHO_MAX = 2.6
const P_MIN = -0.15
const P_MAX = 1.35

const pVdw = (rho: number, T: number) => (8 * rho * T) / (3 - rho) - 3 * rho * rho
// mu = d f / d rho for the same EOS (so that dp = rho d mu holds)
const muVdw = (rho: number, T: number) =>
  (8 / 3) * T * (Math.log(rho / (3 - rho)) + rho / (3 - rho)) - 6 * rho

const xOf = (rho: number) => PLOT_X0 + (rho / RHO_MAX) * (PLOT_X1 - PLOT_X0)
const yOf = (p: number) => PLOT_Y1 - ((p - P_MIN) / (P_MAX - P_MIN)) * (PLOT_Y1 - PLOT_Y0)

// Equal p and equal mu at the two coexisting densities -> Newton on 2 vars.
function coexistence(T: number): [number, number] | null {
  if (T >= 0.999) return null
  let a = 0.05 + 0.6 * T // vapor guess drifts up as T -> Tc
  let b = 2.4 - 0.6 * T // liquid guess drifts down
  for (let it = 0; it < 60; it++) {
    const f0 = pVdw(a, T) - pVdw(b, T)
    const f1 = muVdw(a, T) - muVdw(b, T)
    const h = 1e-7
    const dpa = (pVdw(a + h, T) - pVdw(a, T)) / h
    const dpb = -(pVdw(b + h, T) - pVdw(b, T)) / h
    const dma = (muVdw(a + h, T) - muVdw(a, T)) / h
    const dmb = -(muVdw(b + h, T) - muVdw(b, T)) / h
    const det = dpa * dmb - dpb * dma
    if (Math.abs(det) < 1e-14) break
    a -= (dmb * f0 - dpb * f1) / det
    b -= (-dma * f0 + dpa * f1) / det
    a = Math.max(0.01, Math.min(0.95, a))
    b = Math.max(1.05, Math.min(2.55, b))
  }
  if (Math.abs(a - b) < 0.05) return null
  return [a, b]
}

export function VanDerWaalsMaxwellIsotherm() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [T, setT] = useState(0.9)
  const [playing, setPlaying] = useState(true)

  const co = useMemo(() => coexistence(T), [T])
  const pSat = co ? 0.5 * (pVdw(co[0], T) + pVdw(co[1], T)) : null

  const live = useRef({ T, co, pSat, playing })
  live.current = { T, co, pSat, playing }
  const setTRef = useRef(setT)
  setTRef.current = setT

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let dir = -1
    let acc = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const L = live.current

      // slow auto-sweep of temperature (cooling / heating cycle)
      if (L.playing) {
        acc += dt
        if (acc > 0.05) {
          acc = 0
          let nt = L.T + dir * 0.006
          if (nt < 0.8) {
            nt = 0.8
            dir = 1
          } else if (nt > 0.995) {
            nt = 0.995
            dir = -1
          }
          setTRef.current(parseFloat(nt.toFixed(3)))
        }
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- axes ----
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(PLOT_X0, PLOT_Y0, PLOT_X1 - PLOT_X0, PLOT_Y1 - PLOT_Y0)
      text('p / p_c', PLOT_X0 - 40, PLOT_Y0 + 4, '#64748b', '10px ui-monospace, monospace')
      text('rho / rho_c', PLOT_X1 - 66, PLOT_Y1 + 22, '#64748b', '10px ui-monospace, monospace')
      // gridlines
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let r = 0.5; r < RHO_MAX; r += 0.5) {
        ctx.beginPath()
        ctx.moveTo(xOf(r), PLOT_Y0)
        ctx.lineTo(xOf(r), PLOT_Y1)
        ctx.stroke()
        text(r.toFixed(1), xOf(r) - 8, PLOT_Y1 + 15, '#64748b', '10px ui-monospace, monospace')
      }
      const p0y = yOf(0)
      ctx.strokeStyle = 'rgba(226,232,240,0.3)'
      ctx.beginPath()
      ctx.moveTo(PLOT_X0, p0y)
      ctx.lineTo(PLOT_X1, p0y)
      ctx.stroke()
      text('0', PLOT_X0 - 16, p0y + 4, '#64748b', '10px ui-monospace, monospace')
      text('1', xOf(1) - 3, PLOT_Y1 + 15, '#94a3b8', '10px ui-monospace, monospace')

      // ---- isotherm curve ----
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= 260; i++) {
        const rho = 0.06 + (i / 260) * (RHO_MAX - 0.12)
        const p = pVdw(rho, L.T)
        const y = yOf(p)
        if (p < P_MIN - 0.5 || p > P_MAX + 0.5) {
          started = false
          continue
        }
        if (!started) {
          ctx.moveTo(xOf(rho), y)
          started = true
        } else ctx.lineTo(xOf(rho), y)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // ---- Maxwell tie line + equal-area shading ----
      const co = L.co
      const pSat = L.pSat
      if (co && pSat != null) {
        const [rv, rl] = co
        const yS = yOf(pSat)
        // equal-area lobes between curve and the horizontal saturation line
        ctx.fillStyle = 'rgba(52,211,153,0.16)'
        ctx.beginPath()
        ctx.moveTo(xOf(rv), yS)
        for (let i = 0; i <= 120; i++) {
          const rho = rv + (i / 120) * (rl - rv)
          ctx.lineTo(xOf(rho), yOf(pVdw(rho, L.T)))
        }
        ctx.lineTo(xOf(rl), yS)
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = '#fbbf24'
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(xOf(rv), yS)
        ctx.lineTo(xOf(rl), yS)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
        text(`p_sat = ${pSat.toFixed(3)}`, xOf(rl) + 10, yS + 4, '#fbbf24', 'bold 11px ui-monospace, monospace')

        for (const [r, lbl, col] of [
          [rv, 'vapor', '#60a5fa'],
          [rl, 'liquid', '#f472b6'],
        ] as [number, string, string][]) {
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(xOf(r), yS, 5, 0, 2 * Math.PI)
          ctx.fill()
          ctx.strokeStyle = 'rgba(148,163,184,0.4)'
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(xOf(r), yS)
          ctx.lineTo(xOf(r), PLOT_Y1)
          ctx.stroke()
          ctx.setLineDash([])
          text(`${lbl}  ${r.toFixed(3)}`, xOf(r) - 14, PLOT_Y1 - 6, col, '10px ui-monospace, monospace')
        }
      } else {
        text('T >= T_c : single phase, isotherm is monotone', xOf(0.7), PLOT_Y0 + 20, '#94a3b8')
      }

      // ---- title / state ----
      text('VAN DER WAALS ISOTHERM', PLOT_X0, 22, '#cbd5e1', 'bold 12px ui-monospace, monospace')

      // ---- side readout panel ----
      const PX = 496
      text('STATE', PX, 44, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      let ry = 72
      const row = (lbl: string, v: string, col: string) => {
        text(lbl, PX, ry, '#94a3b8')
        text(v, PX + 118, ry, col, 'bold 11px ui-monospace, monospace')
        ry += 22
      }
      row('T / T_c', L.T.toFixed(3), L.T < 1 ? '#38bdf8' : '#f87171')
      if (co && pSat != null) {
        row('rho_vapor', co[0].toFixed(3), '#60a5fa')
        row('rho_liquid', co[1].toFixed(3), '#f472b6')
        row('density ratio', (co[1] / co[0]).toFixed(1) + 'x', '#e2e8f0')
        row('p_saturation', pSat.toFixed(3), '#fbbf24')
        row('mu match', (muVdw(co[0], L.T) - muVdw(co[1], L.T)).toExponential(1), '#34d399')
      } else {
        row('phase', 'supercritical', '#f87171')
      }

      // spinodal note
      ry += 8
      text('green lobes = equal area', PX, ry, '#64748b', '10px ui-monospace, monospace')
      ry += 16
      text('(equal chemical potential)', PX, ry, '#64748b', '10px ui-monospace, monospace')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 54 }
  const btn: CSSProperties = {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: playing ? 'rgba(56,189,248,0.15)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>
          {playing ? '❙❙ pause sweep' : '▶ auto-cool'}
        </button>
        <label style={label}>
          <span style={nameS}>temperature</span>
          <input
            type="range"
            min={0.8}
            max={1.02}
            step={0.002}
            value={T}
            onChange={(e) => {
              setPlaying(false)
              setT(parseFloat(e.target.value))
            }}
          />
          <span style={mono}>{T.toFixed(3)} Tc</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag <em>temperature</em> down from 1.0: the isotherm folds into an S, and the amber tie line drops in so the two green
        lobes have equal area. The blue and pink dots are the vapor and liquid densities the LBM must hold apart — their gap is
        what the forcing term exists to sustain.
      </div>
    </div>
  )
}
