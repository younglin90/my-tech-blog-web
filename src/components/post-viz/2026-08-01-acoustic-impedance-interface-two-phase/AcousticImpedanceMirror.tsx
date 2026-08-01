'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A pressure pulse hits a material interface and splits in two.
//
// Everything on screen is the exact 1D linear-acoustics solution, so the
// numbers under the canvas are not decoration — they are what draws the curves:
//
//   Z = rho * c                      acoustic impedance
//   R = (Z2 - Z1) / (Z2 + Z1)        pressure reflection coefficient
//   T = 1 + R = 2 Z2 / (Z2 + Z1)     pressure transmission coefficient
//
//   x < xi :  p = A g(x - x0 - c1 t) + R A g(2 xi - x - x0 - c1 t)
//   x > xi :  p = T A g((xi - x0) - c1 t + (c1/c2)(x - xi))
//   u = (right-going p - left-going p) / Z
//
// The point the reader should feel by dragging the sliders: with air on the
// left and water on the right, R is 0.999. Pressure at the wall DOUBLES, the
// velocity in the liquid is essentially zero, and 99.9 % of the energy comes
// straight back. The interface behaves like a mirror, not like a window.
// ---------------------------------------------------------------------------

type Material = { name: string; rho: number; c: number }

const MATERIALS: Material[] = [
  { name: 'air', rho: 1.2, c: 347 },
  { name: 'helium', rho: 0.169, c: 1007 },
  { name: 'water', rho: 998, c: 1500 },
  { name: 'oil', rho: 870, c: 1420 },
]

const W = 660
const H = 400
const PX = 46
const PW = W - PX - 16

const PA_Y = 34 // pressure panel top
const PA_H = 116
const PB_Y = 182 // velocity panel top
const PB_H = 116

const X0 = 0.1 // pulse launch position, in units of domain length
const SIG = 0.045 // gaussian half-width

export function AcousticImpedanceMirror() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [mat1, setMat1] = useState(0) // left medium, from the table
  const [logRho2, setLogRho2] = useState(Math.log10(998))
  const [logC2, setLogC2] = useState(Math.log10(1500))
  const [xi, setXi] = useState(0.52)
  const [running, setRunning] = useState(true)

  const s = useRef({ mat1, logRho2, logC2, xi, running })
  s.current = { mat1, logRho2, logC2, xi, running }

  const rho2 = Math.pow(10, logRho2)
  const c2 = Math.pow(10, logC2)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let tau = 0
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
      if (st.running) tau += dt * 0.34 // domain lengths per second, in medium 1

      const m1 = MATERIALS[st.mat1]
      const a1 = m1.c
      const a2 = Math.pow(10, st.logC2)
      const z1 = m1.rho * m1.c
      const z2 = Math.pow(10, st.logRho2) * a2
      const r = (z2 - z1) / (z2 + z1)
      const tr = 1 + r
      const speedRatio = a2 / a1
      const xf = st.xi

      // one full cycle: incident reaches the interface, then both children leave
      const tHit = (xf - X0) / 1
      const tOut = tHit + Math.max(xf / 1, (1 - xf) / speedRatio) + 0.55
      if (tau > tOut) tau = 0

      const g = (q: number) => Math.exp(-0.5 * (q / SIG) * (q / SIG))
      const pField = (x: number) => {
        if (x <= xf) return g(x - X0 - tau) + r * g(2 * xf - x - X0 - tau)
        return tr * g(xf - X0 - tau + (x - xf) / speedRatio)
      }
      // velocity, normalised by A/Z1 so that the incident pulse has amplitude 1
      const uField = (x: number) => {
        if (x <= xf) return g(x - X0 - tau) - r * g(2 * xf - x - X0 - tau)
        return (z1 / z2) * tr * g(xf - X0 - tau + (x - xf) / speedRatio)
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const sx = (x: number) => PX + x * PW
      const ix = sx(xf)

      // ---- medium 2 shading + interface line, on both panels
      for (const [top, hh] of [
        [PA_Y, PA_H],
        [PB_Y, PB_H],
      ] as const) {
        ctx.fillStyle = 'rgba(56,189,248,0.07)'
        ctx.fillRect(ix, top, PX + PW - ix, hh)
        ctx.strokeStyle = 'rgba(248,250,252,0.55)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(ix, top)
        ctx.lineTo(ix, top + hh)
        ctx.stroke()
        // zero line
        ctx.strokeStyle = 'rgba(148,163,184,0.28)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(PX, top + hh / 2)
        ctx.lineTo(PX + PW, top + hh / 2)
        ctx.stroke()
      }

      // ---- curves
      const curve = (f: (x: number) => number, top: number, hh: number, scale: number, col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 340; i++) {
          const x = i / 340
          const y = top + hh / 2 - f(x) * (hh / 2) * scale
          if (i === 0) ctx.moveTo(sx(x), y)
          else ctx.lineTo(sx(x), y)
        }
        ctx.stroke()
      }
      curve(pField, PA_Y, PA_H, 0.82, '#fbbf24')
      curve(uField, PB_Y, PB_H, 0.82, '#22d3ee')

      // ---- labels
      text("p'  (pressure)", PX, PA_Y - 10, '#fbbf24', 'bold 12px ui-monospace, monospace')
      text("u'  (velocity)", PX, PB_Y - 10, '#22d3ee', 'bold 12px ui-monospace, monospace')
      text('+2A', 6, PA_Y + 12, '#64748b')
      text('0', 6, PA_Y + PA_H / 2 + 4, '#64748b')
      text('−2A', 6, PA_Y + PA_H - 4, '#64748b')
      text('+2', 6, PB_Y + 12, '#64748b')
      text('0', 6, PB_Y + PB_H / 2 + 4, '#64748b')
      text('−2', 6, PB_Y + PB_H - 4, '#64748b')

      text(`medium 1 — ${m1.name}`, PX + 6, PA_Y + 14, '#e2e8f0')
      text('medium 2', Math.min(ix + 8, PX + PW - 66), PA_Y + 14, '#38bdf8')
      text(tau < tHit ? '→ incident' : '← reflected', PX + 6, PA_Y + PA_H - 8, '#94a3b8')
      if (tau >= tHit) text('transmitted →', Math.min(ix + 8, PX + PW - 92), PA_Y + PA_H - 8, '#94a3b8')

      // ---- energy bar
      const eR = r * r
      const by = 316
      ctx.fillStyle = 'rgba(148,163,184,0.18)'
      ctx.fillRect(PX, by, PW, 12)
      ctx.fillStyle = '#f87171'
      ctx.fillRect(PX, by, PW * eR, 12)
      ctx.fillStyle = '#34d399'
      ctx.fillRect(PX + PW * eR, by, PW * (1 - eR), 12)
      text('energy', 6, by + 10, '#64748b')
      text(`reflected ${(eR * 100).toFixed(2)} %`, PX + 6, by + 10, '#0b1220')
      if (1 - eR > 0.12)
        text(`transmitted ${((1 - eR) * 100).toFixed(2)} %`, PX + PW * eR + 6, by + 10, '#0b1220')

      // ---- readouts
      const rY = 350
      const LH = 15
      text(
        `Z1 = ρ1c1 = ${z1.toExponential(2)}   Z2 = ρ2c2 = ${z2.toExponential(2)}   Z2/Z1 = ${(z2 / z1).toFixed(z2 / z1 < 10 ? 2 : 0)}`,
        PX,
        rY,
        '#e2e8f0'
      )
      text(
        `R = (Z2−Z1)/(Z2+Z1) = ${r >= 0 ? '+' : ''}${r.toFixed(4)}      T = 1+R = ${tr.toFixed(4)}`,
        PX,
        rY + LH,
        '#fbbf24'
      )
      text(
        `velocity amplitude in medium 2 = (Z1/Z2)·T = ${((z1 / z2) * tr).toExponential(2)} × incident`,
        PX,
        rY + 2 * LH,
        '#22d3ee'
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
    background: active ? '#22d3ee' : 'transparent',
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
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>medium 1</span>
        {MATERIALS.map((m, i) => (
          <button key={m.name} onClick={() => setMat1(i)} style={btn(mat1 === i)}>
            {m.name}
          </button>
        ))}
      </div>

      <div style={row}>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>medium 2 →</span>
        {MATERIALS.map((m) => (
          <button
            key={m.name}
            onClick={() => {
              setLogRho2(Math.log10(m.rho))
              setLogC2(Math.log10(m.c))
            }}
            style={btn(Math.abs(Math.pow(10, logRho2) - m.rho) < 1e-6 && Math.abs(Math.pow(10, logC2) - m.c) < 1e-6)}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div style={row}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ρ₂
          <input
            type="range"
            min={-1.2}
            max={3.2}
            step={0.02}
            value={logRho2}
            onChange={(e) => setLogRho2(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 74 }}>
            {rho2 < 10 ? rho2.toFixed(2) : rho2.toFixed(0)} kg/m³
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          c₂
          <input
            type="range"
            min={1.7}
            max={3.6}
            step={0.01}
            value={logC2}
            onChange={(e) => setLogC2(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 62 }}>
            {c2.toFixed(0)} m/s
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          interface
          <input
            type="range"
            min={0.3}
            max={0.75}
            step={0.01}
            value={xi}
            onChange={(e) => setXi(parseFloat(e.target.value))}
          />
        </label>

        <button onClick={() => setRunning((v) => !v)} style={btn(running)}>
          {running ? '❚❚ pause' : '▶ play'}
        </button>
      </div>

      <p
        style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: '0.5rem',
          fontFamily: 'ui-monospace, monospace',
          lineHeight: 1.55,
        }}
      >
        What to watch: set medium 1 = air, medium 2 = water. The yellow pressure pulse comes back almost intact and
        nearly doubles at the interface (T = 1.998), while the cyan velocity pulse flips sign and the liquid barely
        moves. Now press medium 2 = air — R collapses to 0 and the pulse walks straight through. Only the ratio Z₂/Z₁
        matters: slide ρ₂ down and c₂ up so that the product stays put, and the picture does not change at all.
      </p>
    </div>
  )
}
