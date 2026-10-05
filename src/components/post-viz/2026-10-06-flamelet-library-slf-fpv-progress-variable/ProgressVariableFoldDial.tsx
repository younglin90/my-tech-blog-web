'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const TU = 300
const QH = 9000
const SR = 4
const TACT = 16000
const APRE = 4e8
const ZST = 1 / (1 + SR)
const NZ = 41
const DZ = 1 / (NZ + 1)
const ZGRID = Array.from({ length: NZ }, (_, i) => (i + 1) * DZ)
const IST = ZGRID.reduce((best, z, i) => (Math.abs(z - ZST) < Math.abs(ZGRID[best] - ZST) ? i : best), 0)

function arrhenius(z: number, t: number): [number, number] {
  const r = (t - TU) / QH
  const yf = z - r
  const yo = 1 - z - SR * r
  if (yf <= 0 || yo <= 0) return [0, 0]
  const e = Math.exp(-TACT / t)
  return [APRE * yf * yo * e, APRE * e * (-(yo + SR * yf) / QH + (yf * yo * TACT) / (t * t))]
}

function thomas(diag: number[], off: number, rhs: number[]): number[] {
  const n = rhs.length
  const c = new Array<number>(n)
  const d = new Array<number>(n)
  c[0] = off / diag[0]
  d[0] = rhs[0] / diag[0]
  for (let i = 1; i < n; i++) {
    const m = diag[i] - off * c[i - 1]
    c[i] = off / m
    d[i] = (rhs[i] - off * d[i - 1]) / m
  }
  const x = new Array<number>(n)
  x[n - 1] = d[n - 1]
  for (let i = n - 2; i >= 0; i--) x[i] = d[i] - c[i] * x[i + 1]
  return x
}

type ArcPoint = { chi: number; tst: number; prof: number[]; s: number }

function traceFlameletArc(steps: number): ArcPoint[] {
  let T = new Array<number>(NZ).fill(TU + 1e-3)
  let chi = 1e-7
  const cMax = QH * ZST
  const arc: ArcPoint[] = []
  for (let k = 1; k < steps; k++) {
    const C = (cMax * k) / steps
    for (let it = 0; it < 60; it++) {
      const R = new Array<number>(NZ)
      const diag = new Array<number>(NZ)
      const b = new Array<number>(NZ)
      for (let i = 0; i < NZ; i++) {
        const tl = i === 0 ? TU : T[i - 1]
        const tr = i === NZ - 1 ? TU : T[i + 1]
        const lap = (tl - 2 * T[i] + tr) / (DZ * DZ)
        const [w, dw] = arrhenius(ZGRID[i], T[i])
        R[i] = 0.5 * chi * lap + QH * w
        diag[i] = -chi / (DZ * DZ) + QH * dw
        b[i] = 0.5 * lap
      }
      const off = chi / (2 * DZ * DZ)
      const u = thomas(diag, off, R.map((v) => -v))
      const v = thomas(diag, off, b.map((x) => -x))
      const dchi = (-(T[IST] - TU - C) - u[IST]) / v[IST]
      const dT = u.map((x, i) => x + v[i] * dchi)
      const big = Math.max(1e-30, ...dT.map(Math.abs))
      const lam = Math.min(1, 120 / big, (0.3 * Math.abs(chi)) / Math.max(1e-30, Math.abs(dchi)))
      T = T.map((x, i) => x + lam * dT[i])
      chi += lam * dchi
      if (big < 1e-8) break
    }
    arc.push({ chi, tst: T[IST], prof: T.slice(), s: 0 })
  }
  let acc = 0
  for (let i = 1; i < arc.length; i++) {
    const dx = (arc[i].chi - arc[i - 1].chi) / 150
    const dy = (arc[i].tst - arc[i - 1].tst) / 1800
    acc += Math.hypot(dx, dy)
    arc[i].s = acc
  }
  for (const p of arc) p.s /= acc
  return arc
}

const W = 760
const H = 390
const PAD_L = 60
const PAD_R = 18
const PAD_T = 26
const AX_H = 220
const STRIP_Y = 300

export function ProgressVariableFoldDial() {
  const arc = useMemo(() => traceFlameletArc(220), [])
  const [axis, setAxis] = useState<'C' | 'chi'>('C')
  const [zRef, setZRef] = useState(ZST)
  const [cells, setCells] = useState(24)
  const [running, setRunning] = useState(true)
  const [sPos, setSPos] = useState(0.5)

  const iRef = useMemo(
    () => ZGRID.reduce((best, z, i) => (Math.abs(z - zRef) < Math.abs(ZGRID[best] - zRef) ? i : best), 0),
    [zRef],
  )

  const vals = useMemo(
    () => arc.map((p) => (axis === 'C' ? p.prof[iRef] - TU : p.chi)),
    [arc, axis, iRef],
  )

  /** uniform table cells on the chosen axis, mapped back onto the arc */
  const report = useMemo(() => {
    const lo = Math.min(...vals)
    const hi = Math.max(...vals)
    const ticks: number[] = []
    let multi = 0
    for (let k = 0; k <= cells; k++) {
      const level = lo + ((hi - lo) * k) / cells
      let found = 0
      for (let i = 0; i < vals.length - 1; i++) {
        const a = vals[i]
        const b = vals[i + 1]
        if ((a - level) * (b - level) <= 0 && a !== b) {
          const f = (level - a) / (b - a)
          ticks.push(arc[i].s + f * (arc[i + 1].s - arc[i].s))
          found++
        }
      }
      if (found > 1) multi++
    }
    ticks.sort((a, b) => a - b)
    const gaps: number[] = []
    for (let i = 1; i < ticks.length; i++) gaps.push(ticks[i] - ticks[i - 1])
    const gmin = Math.min(...gaps.filter((g) => g > 1e-9))
    const gmax = Math.max(...gaps)
    return { ticks, multi, stretch: gmax / gmin, lo, hi }
  }, [vals, cells, arc])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runRef = useRef({ s: 0.5, dir: 1, running })
  runRef.current.running = running

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const xOf = (s: number) => PAD_L + s * (W - PAD_L - PAD_R)
    const yOf = (v: number) => PAD_T + AX_H - ((v - report.lo) / Math.max(1e-9, report.hi - report.lo)) * AX_H

    const render = () => {
      const st = runRef.current
      if (st.running) {
        st.s += st.dir * 0.0035
        if (st.s > 1) { st.s = 1; st.dir = -1 }
        if (st.s < 0) { st.s = 0; st.dir = 1 }
      }
      const s = st.s
      const idx = Math.min(arc.length - 1, Math.max(0, Math.round(s * (arc.length - 1))))

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'

      /* axes */
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD_L, PAD_T)
      ctx.lineTo(PAD_L, PAD_T + AX_H)
      ctx.lineTo(W - PAD_R, PAD_T + AX_H)
      ctx.stroke()
      ctx.fillStyle = '#8b949e'
      ctx.fillText(axis === 'C' ? `C = T(Z_ref) - T_u   [K]` : 'chi_st   [1/s]', PAD_L + 6, PAD_T - 10)
      ctx.fillText('arclength s along the S-curve  (0 = frozen, 1 = equilibrium)', PAD_L + 6, H - 8)
      ctx.fillText(report.hi.toFixed(0), 18, PAD_T + 4)
      ctx.fillText(report.lo.toFixed(0), 18, PAD_T + AX_H + 4)

      /* uniform cell levels */
      for (let k = 0; k <= cells; k += Math.max(1, Math.round(cells / 12))) {
        const level = report.lo + ((report.hi - report.lo) * k) / cells
        ctx.strokeStyle = '#1b2026'
        ctx.beginPath()
        ctx.moveTo(PAD_L, yOf(level))
        ctx.lineTo(W - PAD_R, yOf(level))
        ctx.stroke()
      }

      /* the coordinate curve */
      ctx.lineWidth = 2
      for (let i = 0; i < arc.length - 1; i++) {
        const rising = vals[i + 1] >= vals[i]
        ctx.strokeStyle = axis === 'chi' && !rising ? '#f85149' : '#58a6ff'
        ctx.beginPath()
        ctx.moveTo(xOf(arc[i].s), yOf(vals[i]))
        ctx.lineTo(xOf(arc[i + 1].s), yOf(vals[i + 1]))
        ctx.stroke()
      }

      /* cell boundaries dropped onto the arclength axis */
      report.ticks.forEach((t) => {
        ctx.strokeStyle = report.multi > 0 ? '#f85149' : '#3fb950'
        ctx.beginPath()
        ctx.moveTo(xOf(t), STRIP_Y - 14)
        ctx.lineTo(xOf(t), STRIP_Y + 14)
        ctx.stroke()
      })
      ctx.strokeStyle = '#30363d'
      ctx.beginPath()
      ctx.moveTo(PAD_L, STRIP_Y)
      ctx.lineTo(W - PAD_R, STRIP_Y)
      ctx.stroke()
      ctx.fillStyle = '#8b949e'
      ctx.fillText(`${cells} uniform cells -> ${report.ticks.length} boundaries on the arc`, PAD_L + 6, STRIP_Y + 30)

      /* travelling marker */
      ctx.fillStyle = '#d29922'
      ctx.beginPath()
      ctx.arc(xOf(s), yOf(vals[idx]), 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = '#d29922'
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(xOf(s), PAD_T)
      ctx.lineTo(xOf(s), STRIP_Y + 14)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#e6edf3'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(
        `s = ${s.toFixed(3)}   chi_st = ${arc[idx].chi.toFixed(2)} 1/s   T_st = ${arc[idx].tst.toFixed(0)} K   axis value = ${vals[idx].toFixed(1)}`,
        PAD_L,
        H - 28,
      )

      frame++
      if (frame % 14 === 0 && st.running) setSPos(st.s)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [arc, vals, report, axis, cells])

  return (
    <div style={{ margin: '1.6rem 0', fontFamily: 'ui-monospace, monospace' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 8, border: '1px solid #30363d', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.7rem', alignItems: 'center', fontSize: 13 }}>
        <span>
          axis:{' '}
          <button
            onClick={() => setAxis('C')}
            style={{ padding: '2px 8px', background: axis === 'C' ? '#1f6feb' : '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5 }}
          >
            C(Z_ref)
          </button>{' '}
          <button
            onClick={() => setAxis('chi')}
            style={{ padding: '2px 8px', background: axis === 'chi' ? '#1f6feb' : '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5 }}
          >
            chi
          </button>
        </span>
        <label style={{ opacity: axis === 'C' ? 1 : 0.4 }}>
          Z_ref = <b>{ZGRID[iRef].toFixed(3)}</b>{' '}
          <input
            type="range"
            min={0.024}
            max={0.976}
            step={0.0238}
            value={zRef}
            disabled={axis !== 'C'}
            onChange={(e) => setZRef(Number(e.target.value))}
          />
        </label>
        <label>
          cells = <b>{cells}</b>{' '}
          <input type="range" min={8} max={64} step={4} value={cells} onChange={(e) => setCells(Number(e.target.value))} />
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: '2px 10px', background: running ? '#8957e5' : '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5 }}
        >
          {running ? 'pause' : 'run'}
        </button>
        {!running && (
          <label>
            s = <b>{sPos.toFixed(3)}</b>{' '}
            <input
              type="range"
              min={0}
              max={1}
              step={0.002}
              value={sPos}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSPos(v)
                runRef.current.s = v
              }}
            />
          </label>
        )}
        <span style={{ color: report.multi > 0 ? '#f85149' : report.stretch > 40 ? '#d29922' : '#3fb950' }}>
          {report.multi > 0
            ? `folds: ${report.multi} levels hit the arc more than once`
            : `single-valued, cell stretch ${report.stretch.toFixed(0)}:1`}
        </span>
      </div>
    </div>
  )
}
