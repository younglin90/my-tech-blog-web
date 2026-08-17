'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// How much does the primitive form's rho = const actually throw away?
//
// Same converging duct, two models of the same flow:
//
//   TOP     isentropic (rho varies)   A/A* = (1/M)[(2/(g+1))(1+(g-1)/2 M^2)]^((g+1)/(2(g-1)))
//   BOTTOM  rho = const               u A = const        (div u = 0)
//
// Markers are released at a fixed rate, so their spacing IS the local speed.
// At low exit Mach the two lanes drift together; the density bar stays near
// 1.00 and div u is numerically zero. Past M ~ 0.3 the lanes separate, and the
// gap is exactly the term the incompressible continuity equation deleted.
// ---------------------------------------------------------------------------

const W = 726
const H = 430

const DX0 = 44 // duct left
const DW = 420 // duct width
const RX = DX0 + DW + 26

const N_MARK = 26

function areaOf(x: number) {
  // converging duct, A(1)/A(0) = 0.5
  return 1 - 0.5 * x
}

function areaRatio(m: number, g: number) {
  const t = (2 / (g + 1)) * (1 + ((g - 1) / 2) * m * m)
  return (1 / m) * Math.pow(t, (g + 1) / (2 * (g - 1)))
}

function machFromArea(ar: number, g: number) {
  // subsonic branch, bisection on A/A* = ar
  let lo = 1e-4
  let hi = 1
  for (let k = 0; k < 60; k++) {
    const mid = 0.5 * (lo + hi)
    if (areaRatio(mid, g) > ar) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

export function MachDensityBudgetGauge() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mach, setMach] = useState(0.25)
  const [gamma, setGamma] = useState(1.4)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ drho: 0, dv: 0 })

  const cfg = useRef({ mach, gamma, running })
  cfg.current = { mach, gamma, running }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let frame = 0
    const phase = [0, 0]

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const wall = (top: number, half: number) => {
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 2
      for (const sgn of [-1, 1]) {
        ctx.beginPath()
        for (let k = 0; k <= 60; k++) {
          const x = k / 60
          const y = top + half + sgn * half * areaOf(x)
          const px = DX0 + x * DW
          if (k === 0) ctx.moveTo(px, y)
          else ctx.lineTo(px, y)
        }
        ctx.stroke()
      }
      ctx.lineWidth = 1
    }

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw)
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0
      last = ts
      frame++

      const { mach: me, gamma: g, running: run } = cfg.current

      // exit conditions
      const arExit = areaRatio(me, g)
      const rhoOf = (m: number) => Math.pow(1 + ((g - 1) / 2) * m * m, -1 / (g - 1))
      const uOf = (m: number) => m / Math.sqrt(1 + ((g - 1) / 2) * m * m) // u / a0

      const nS = 90
      const mArr: number[] = []
      const uComp: number[] = []
      const rho: number[] = []
      for (let k = 0; k <= nS; k++) {
        const x = k / nS
        const m = machFromArea((areaOf(x) / areaOf(1)) * arExit, g)
        mArr.push(m)
        uComp.push(uOf(m))
        rho.push(rhoOf(m))
      }
      const uExit = uComp[nS]
      const uInc = uComp.map((_, k) => (uExit * areaOf(1)) / areaOf(k / nS))

      if (run) {
        phase[0] = (phase[0] + dt * 0.55) % 1
        phase[1] = (phase[1] + dt * 0.55) % 1
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      text('CONVERGING DUCT — WHAT rho = const DELETES', DX0, 20, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text('markers released at a fixed rate: their spacing is the local speed', DX0, 36, '#64748b')

      const lane = (top: number, half: number, arr: number[], col: string, lbl: string, shade: boolean) => {
        wall(top, half)
        // density shading
        for (let k = 0; k < nS; k++) {
          const x = k / nS
          const px = DX0 + x * DW
          const pw = DW / nS + 1
          const d = shade ? rho[k] : 1
          const a = 0.10 + 0.55 * (1 - d) * 4
          ctx.fillStyle = `rgba(56,189,248,${Math.min(Math.max(a, 0.06), 0.7)})`
          ctx.fillRect(px, top + half - half * areaOf(x), pw, 2 * half * areaOf(x))
        }
        // markers: integrate 1/u to place equal-time-of-flight dots
        const tof: number[] = [0]
        for (let k = 1; k <= nS; k++) tof.push(tof[k - 1] + (1 / nS) / (0.5 * (arr[k] + arr[k - 1])))
        const total = tof[nS]
        for (let j = 0; j < N_MARK; j++) {
          const frac = (j / N_MARK + phase[0]) % 1
          const target = frac * total
          let k = 1
          while (k < nS && tof[k] < target) k++
          const s = (target - tof[k - 1]) / (tof[k] - tof[k - 1] + 1e-12)
          const x = (k - 1 + s) / nS
          const px = DX0 + x * DW
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(px, top + half, 3.2, 0, Math.PI * 2)
          ctx.fill()
        }
        text(lbl, DX0 + 6, top - 6, col, 'bold 12px ui-monospace, monospace')
      }

      lane(72, 52, uComp, '#34d399', 'isentropic — rho varies with M', true)
      lane(208, 52, uInc, '#f472b6', 'rho = const — div u = 0', false)

      // marker-speed gap readout on the duct
      const dv = (uInc[Math.round(nS * 0.5)] / uComp[Math.round(nS * 0.5)] - 1) * 100
      const drho = (1 - rho[nS]) * 100

      // plot: density deficit vs exit Mach
      const gx = RX
      const gy = 330
      const gw = 214
      const gh = 200
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(gx, gy - gh, gw, gh)
      const yOf = (v: number) => gy - (Math.min(v, 40) / 40) * gh
      for (const [lvl, cl] of [[2, '#34d399'], [5, '#fbbf24']] as [number, string][]) {
        ctx.setLineDash([3, 3])
        ctx.strokeStyle = cl
        ctx.beginPath()
        ctx.moveTo(gx, yOf(lvl))
        ctx.lineTo(gx + gw, yOf(lvl))
        ctx.stroke()
        ctx.setLineDash([])
        text(`${lvl}%`, gx + gw - 26, yOf(lvl) - 3, cl)
      }
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k <= 80; k++) {
        const m = (k / 80) * 0.9
        const v = (1 - rhoOf(m)) * 100
        const px = gx + (m / 0.9) * gw
        if (k === 0) ctx.moveTo(px, yOf(v))
        else ctx.lineTo(px, yOf(v))
      }
      ctx.stroke()
      ctx.lineWidth = 1
      // M^2/2 asymptote
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = '#94a3b8'
      ctx.beginPath()
      for (let k = 0; k <= 80; k++) {
        const m = (k / 80) * 0.9
        const px = gx + (m / 0.9) * gw
        const py = yOf(50 * m * m)
        if (k === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
      const mx = gx + (Math.min(me, 0.9) / 0.9) * gw
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(mx, yOf(drho), 4.5, 0, Math.PI * 2)
      ctx.fill()
      text('1 - rho/rho_0  [%]  vs exit M', gx, gy - gh - 8, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      text('0', gx - 4, gy + 14, '#64748b')
      text('0.9', gx + gw - 14, gy + 14, '#64748b')
      text('dashed: M^2 / 2', gx, gy + 30, '#64748b')

      // numeric column
      text('EXIT MACH', RX, 62, '#94a3b8')
      text(me.toFixed(2), RX + 96, 62, '#e2e8f0', 'bold 13px ui-monospace, monospace')
      text('1 - rho/rho_0', RX, 84, '#94a3b8')
      text(`${drho.toFixed(2)} %`, RX + 96, 84, drho < 2 ? '#34d399' : drho < 5 ? '#fbbf24' : '#f87171', 'bold 13px ui-monospace, monospace')
      text('speed error', RX, 106, '#94a3b8')
      text(`${dv.toFixed(2)} %`, RX + 96, 106, Math.abs(dv) < 2 ? '#34d399' : Math.abs(dv) < 5 ? '#fbbf24' : '#f87171', 'bold 13px ui-monospace, monospace')
      text('gamma', RX, 128, '#94a3b8')
      text(g.toFixed(3), RX + 96, 128, '#e2e8f0', 'bold 13px ui-monospace, monospace')

      if (frame % 12 === 0) setReadout({ drho, dv })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const row: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }
  const btn = (active: boolean, col: string): CSSProperties => ({
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

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={row}>
        <label style={label}>
          <span style={name}>exit Mach</span>
          <input type="range" min={0.05} max={0.85} step={0.01} value={mach} onChange={(e) => setMach(parseFloat(e.target.value))} />
          <span style={mono}>{mach.toFixed(2)}</span>
        </label>
        <button onClick={() => setGamma(gamma === 1.4 ? 1.667 : 1.4)} style={btn(gamma !== 1.4, '#c084fc')}>
          gamma = {gamma === 1.4 ? '1.400 air' : '1.667 argon'}
        </button>
        <button onClick={() => setRunning(!running)} style={btn(running, '#38bdf8')}>
          {running ? 'pause' : 'play'}
        </button>
        <span style={{ ...mono, color: '#94a3b8', minWidth: 0 }}>
          drho {readout.drho.toFixed(2)}% · speed error {readout.dv.toFixed(2)}%
        </span>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        Drag <em>exit Mach</em> from 0.05 upward. Below 0.2 the two rows of dots stay in step and both readouts sit green — the
        deleted term is under 2%. Past 0.3 the pink row falls behind the green one, and the yellow dot climbs off the M²/2 dashed
        line: the density the incompressible model froze is now doing real work.
      </div>
    </div>
  )
}
