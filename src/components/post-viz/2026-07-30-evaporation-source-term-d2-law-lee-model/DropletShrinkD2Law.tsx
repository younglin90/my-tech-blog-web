'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Diffusion-limited evaporation, drawn as area instead of asserted as a law.
//
// A droplet far below its boiling point still disappears. Nothing boils; the
// vapor simply diffuses away, and the rate is set by the GRADIENT of vapor
// mass fraction between the surface and the far field:
//
//   B_M = (Y_s - Y_inf) / (1 - Y_s)             Spalding mass transfer number
//   K   = 8 rho_g D / rho_l * ln(1 + B_M)       evaporation constant [m^2/s]
//   d(t)^2 = d0^2 - K t                          the d^2-law
//   t_life = d0^2 / K
//
// Y_s comes from saturation at the droplet temperature (Antoine), Y_inf from
// the ambient relative humidity at the same temperature. Raising RH squeezes
// (Y_s - Y_inf) toward zero and the lifetime blows up - that is the whole
// point of the panel.
//
// The disk on the left is drawn with radius d(t)/2 taken from the SAME d(t)
// that the right-hand plot traces, so "the line is flatter" and "the drop
// hangs around longer" are one statement, not two.
// ---------------------------------------------------------------------------

const M_V = 18.015 // kg/kmol, water vapor
const M_A = 28.96 // kg/kmol, air
const P_ATM = 101325 // Pa
const RHO_L = 997 // kg/m^3, liquid water
const D_AB = 2.5e-5 // m^2/s, water vapor in air
const RHO_G = 1.18 // kg/m^3, humid air

// physical seconds advanced per second of wall clock
const TIME_SCALE = 220

// Antoine (water, mmHg) -> Pa
function pSat(tC: number): number {
  return Math.pow(10, 8.07131 - 1730.63 / (233.426 + tC)) * 133.322
}

// mole fraction -> mass fraction of vapor in air
function massFrac(x: number): number {
  return (x * M_V) / (x * M_V + (1 - x) * M_A)
}

type Model = {
  ys: number
  yinf: number
  bm: number
  k: number // mm^2/s
  life: number // s
}

function evalModel(tC: number, rh: number): Model {
  const xs = Math.min(0.98, pSat(tC) / P_ATM)
  const ys = massFrac(xs)
  const yinf = massFrac(xs * rh)
  const bm = Math.max(0, (ys - yinf) / (1 - ys))
  const kSI = ((8 * RHO_G * D_AB) / RHO_L) * Math.log(1 + bm) // m^2/s
  const k = kSI * 1e6 // mm^2/s
  return { ys, yinf, bm, k, life: k > 1e-12 ? 1 / k : Infinity } // life for d0 = 1 mm
}

const CX = 176 // droplet panel center
const CY = 196
const RMAX = 108 // pixels for a 2 mm diameter

const PX0 = 392
const PY0 = 96
const PW = 232
const PH = 196

export function DropletShrinkD2Law() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [tC, setTC] = useState(25)
  const [rh, setRh] = useState(0.3)
  const [d0, setD0] = useState(1.0) // mm
  const [running, setRunning] = useState(true)

  const tRef = useRef(tC)
  const rhRef = useRef(rh)
  const d0Ref = useRef(d0)
  const runRef = useRef(running)
  tRef.current = tC
  rhRef.current = rh
  d0Ref.current = d0
  runRef.current = running

  const resetRef = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    let elapsed = 0 // physical seconds since the drop was placed
    let prev = -1
    let lastReset = resetRef.current

    const text = (s: string, x: number, y: number, col: string, font = '10px ui-monospace, monospace') => {
      ctx.font = font
      ctx.fillStyle = col
      ctx.fillText(s, x, y)
    }

    const draw = (ts: number) => {
      const dtWall = prev < 0 ? 0 : Math.min(0.05, (ts - prev) * 0.001)
      prev = ts

      const tv = tRef.current
      const rv = rhRef.current
      const dv = d0Ref.current
      const m = evalModel(tv, rv)
      const life = m.k > 1e-12 ? (dv * dv) / m.k : Infinity

      if (resetRef.current !== lastReset) {
        lastReset = resetRef.current
        elapsed = 0
      }
      if (runRef.current) elapsed += dtWall * TIME_SCALE
      if (elapsed > life) elapsed = 0 // recycle: a fresh drop is placed

      const d2 = Math.max(0, dv * dv - m.k * elapsed)
      const d = Math.sqrt(d2)

      // ------------------------------------------------------------ background
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, c.width, c.height)

      text('d²-law: a drop at 25 °C empties without ever boiling', 14, 20, '#e2e8f0', '11px ui-monospace, monospace')
      text('the vapor leaves by diffusion - the driver is (Y_s − Y_∞), not the boiling point', 14, 36, '#94a3b8')

      // ------------------------------------------------------------ vapor halo
      // Y(r) = Y_inf + (Y_s - Y_inf) * (R/r): the quasi-steady 1/r shell
      const rPix = (d / 2 / 1.0) * RMAX
      const haloMax = RMAX * 2.0
      const steps = 26
      for (let i = steps; i >= 1; i--) {
        const rr = rPix + ((haloMax - rPix) * i) / steps
        const shell = rPix > 0.5 ? rPix / rr : 0
        const yLocal = m.yinf + (m.ys - m.yinf) * shell
        const sat = m.ys > 1e-9 ? (yLocal - m.yinf) / Math.max(1e-9, m.ys - m.yinf) : 0
        ctx.beginPath()
        ctx.arc(CX, CY, rr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34,211,238,${(0.055 * sat).toFixed(4)})`
        ctx.fill()
      }

      // ambient humidity wash: the "floor" the gradient has to climb out of
      ctx.fillStyle = `rgba(34,211,238,${(0.10 * rv).toFixed(3)})`
      ctx.fillRect(14, 52, 324, 288)
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.lineWidth = 1
      ctx.strokeRect(14, 52, 324, 288)

      // ------------------------------------------------------------ the droplet
      if (d > 1e-3) {
        const g = ctx.createRadialGradient(CX - rPix * 0.35, CY - rPix * 0.4, rPix * 0.1, CX, CY, rPix)
        g.addColorStop(0, 'rgba(191,219,254,0.98)')
        g.addColorStop(1, 'rgba(37,99,235,0.92)')
        ctx.beginPath()
        ctx.arc(CX, CY, rPix, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.strokeStyle = 'rgba(226,232,240,0.85)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // initial-size ghost outline
      ctx.beginPath()
      ctx.arc(CX, CY, (dv / 2) * RMAX, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(251,191,36,0.45)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
      text('d₀', CX + (dv / 2) * RMAX + 5, CY - (dv / 2) * RMAX + 4, '#fbbf24')

      // escaping vapor parcels, density proportional to B_M
      const flux = Math.min(1, m.bm / 0.03)
      const nP = Math.round(4 + 26 * flux)
      for (let i = 0; i < nP; i++) {
        const ph = (i * 2.399963) % (Math.PI * 2)
        const travel = ((ts * 0.00006 * (0.6 + 0.9 * ((i * 37) % 11) / 10) + i * 0.137) % 1)
        const rr = rPix + travel * (haloMax - rPix)
        const a = 0.55 * (1 - travel) * (runRef.current ? 1 : 0.35)
        ctx.beginPath()
        ctx.arc(CX + rr * Math.cos(ph), CY + rr * Math.sin(ph), 1.9, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34,211,238,${a.toFixed(3)})`
        ctx.fill()
      }

      text(`Y_∞ = ${m.yinf.toFixed(5)}  (RH ${(rv * 100).toFixed(0)} %)`, 24, 70, '#22d3ee')
      text(`Y_s  = ${m.ys.toFixed(5)}  (saturated at ${tv.toFixed(0)} °C)`, 24, 84, '#93c5fd')
      text(`d = ${d.toFixed(3)} mm`, 24, 330, '#e2e8f0', '11px ui-monospace, monospace')
      text(`t = ${elapsed.toFixed(0)} s`, 132, 330, '#e2e8f0', '11px ui-monospace, monospace')

      // ------------------------------------------------------------ d^2 plot
      const d2max = 2.25 // mm^2, matches d0 = 1.5 mm cap
      const tmaxPlot = Math.max(20, Math.min(4000, life * 1.05))
      const gx = (t: number) => PX0 + (t / tmaxPlot) * PW
      const gy = (v: number) => PY0 + PH - (v / d2max) * PH

      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX0, PY0, PW, PH)
      for (let i = 1; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(PX0, PY0 + (PH * i) / 4)
        ctx.lineTo(PX0 + PW, PY0 + (PH * i) / 4)
        ctx.strokeStyle = 'rgba(148,163,184,0.12)'
        ctx.stroke()
      }

      // the straight line d^2 = d0^2 - K t
      ctx.beginPath()
      ctx.moveTo(gx(0), gy(dv * dv))
      ctx.lineTo(gx(Math.min(life, tmaxPlot)), gy(Math.max(0, dv * dv - m.k * Math.min(life, tmaxPlot))))
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.8
      ctx.stroke()

      // travelled part, thick
      ctx.beginPath()
      ctx.moveTo(gx(0), gy(dv * dv))
      ctx.lineTo(gx(Math.min(elapsed, tmaxPlot)), gy(d2))
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(gx(Math.min(elapsed, tmaxPlot)), gy(d2), 4, 0, Math.PI * 2)
      ctx.fillStyle = '#22d3ee'
      ctx.fill()

      text('d² [mm²]', PX0 - 4, PY0 - 22, '#cbd5e1')
      text(d2max.toFixed(2), PX0 - 30, PY0 + 8, '#94a3b8')
      text('0', PX0 - 12, PY0 + PH + 3, '#94a3b8')
      text('0', PX0 - 2, PY0 + PH + 15, '#94a3b8')
      text(`${tmaxPlot.toFixed(0)} s`, PX0 + PW - 26, PY0 + PH + 15, '#94a3b8')
      text('time', PX0 + PW / 2 - 12, PY0 + PH + 27, '#cbd5e1')
      text('slope = −K   (straight = the d²-law)', PX0, PY0 - 8, '#fbbf24')

      // ------------------------------------------------------------ readouts
      const R0 = 356
      const LH = 15
      text(`B_M = (Y_s − Y_∞)/(1 − Y_s) = ${m.bm.toExponential(3)}`, 14, R0, '#e2e8f0')
      text(`K = 8ρ_g D/ρ_l · ln(1+B_M) = ${m.k.toExponential(3)} mm²/s`, 300, R0, '#fbbf24')
      text(
        `lifetime = d₀²/K = ${Number.isFinite(life) ? (life < 600 ? life.toFixed(0) + ' s' : (life / 60).toFixed(1) + ' min') : '∞'}`,
        14,
        R0 + LH,
        '#22d3ee',
      )
      text(`Sc = ν/D ≈ 0.60   (momentum vs vapor diffusion)`, 300, R0 + LH, '#94a3b8')

      const glow = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(ts * 0.0018))
      ctx.globalAlpha = glow
      text('drag RH to 95 %: Y_∞ climbs to meet Y_s, the amber line goes flat, the drop stops leaving', 14, R0 + 2 * LH, '#f87171')
      ctx.globalAlpha = 1
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

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={660}
        height={410}
        style={{ width: '100%', maxWidth: 660, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center', marginTop: '0.7rem', fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          RH
          <input type="range" min={0} max={0.97} step={0.01} value={rh} onChange={(e) => setRh(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 36 }}>{(rh * 100).toFixed(0)} %</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          T
          <input type="range" min={5} max={80} step={1} value={tC} onChange={(e) => setTC(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 40 }}>{tC.toFixed(0)} °C</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          d₀
          <input type="range" min={0.3} max={1.5} step={0.05} value={d0} onChange={(e) => setD0(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }}>{d0.toFixed(2)} mm</span>
        </label>
        <button onClick={() => setRunning((v) => !v)} style={btn(running)}>
          {running ? '❚❚ pause' : '▶ run'}
        </button>
        <button
          onClick={() => {
            resetRef.current += 1
          }}
          style={btn(false)}
        >
          ↺ new drop
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace', lineHeight: 1.55 }}>
        What to watch: the disk radius is d(t)/2 from the same d(t) the cyan trace draws, so the plot and the drop are one
        object. Push RH from 30 % to 95 % — B_M collapses, the amber line flattens, and the lifetime jumps from minutes to
        the better part of an hour. Raise T instead and Y_s runs away from Y_∞, so the same drop empties in seconds.
      </p>
    </div>
  )
}
