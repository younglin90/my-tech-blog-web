'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/* ---- steady flamelet in mixture-fraction space, one-step Arrhenius ---- */
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

type ArcPoint = { C: number; chi: number; tst: number; prof: number[] }

/** continuation with the progress variable C as the coordinate: solve (T, chi) together */
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
      let lam = 1
      const big = Math.max(1e-30, ...dT.map(Math.abs))
      lam = Math.min(lam, 120 / big, (0.3 * Math.abs(chi)) / Math.max(1e-30, Math.abs(dchi)))
      T = T.map((x, i) => x + lam * dT[i])
      chi += lam * dchi
      if (big < 1e-8) break
    }
    arc.push({ C, chi, tst: T[IST], prof: T.slice() })
  }
  return arc
}

const W = 760
const H = 400
const PLOT_W = 420
const PAD_L = 54
const PAD_T = 26
const PAD_B = 46

export function FlameletSCurveLookupLab() {
  const arc = useMemo(() => traceFlameletArc(220), [])
  const foldIdx = useMemo(() => arc.reduce((b, p, i) => (p.chi > arc[b].chi ? i : b), 0), [arc])
  const chiExt = arc[foldIdx].chi

  const [axis, setAxis] = useState<'chi' | 'C'>('chi')
  const [chiVal, setChiVal] = useState(50)
  const [cVal, setCVal] = useState(1200)
  const [sweep, setSweep] = useState(false)
  const [tick, setTick] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ axis, chiVal, cVal, sweep, dir: 1 })
  stateRef.current.axis = axis
  stateRef.current.sweep = sweep

  /** every flamelet the library holds at this chi: frozen + arc crossings */
  function statesAtChi(target: number) {
    const hits: ArcPoint[] = []
    for (let i = 0; i < arc.length - 1; i++) {
      const a = arc[i].chi
      const b = arc[i + 1].chi
      if ((a - target) * (b - target) <= 0 && a !== b) hits.push(arc[i + 1])
    }
    const frozen: ArcPoint = { C: 0, chi: target, tst: TU, prof: new Array<number>(NZ).fill(TU) }
    return [frozen, ...hits.sort((p, q) => p.tst - q.tst)]
  }

  const shown = axis === 'chi' ? statesAtChi(chiVal) : [arc[Math.min(arc.length - 1, Math.max(0, Math.round((cVal / (QH * ZST)) * arc.length)))]]
  const readChi = axis === 'chi' ? chiVal : shown[0].chi

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0

    const chiMax = 150
    const xOf = (c: number) => PAD_L + (Math.min(c, chiMax) / chiMax) * (PLOT_W - PAD_L - 12)
    const yOf = (t: number) => H - PAD_B - ((t - TU) / 1850) * (H - PAD_T - PAD_B)
    const px = (z: number) => PLOT_W + 70 + z * (W - PLOT_W - 90)
    const py = (t: number) => H - PAD_B - ((t - TU) / 1850) * (H - PAD_T - PAD_B)

    const render = () => {
      const st = stateRef.current
      if (st.sweep) {
        if (st.axis === 'chi') {
          st.chiVal += st.dir * 0.9
          if (st.chiVal > 148) { st.chiVal = 148; st.dir = -1 }
          if (st.chiVal < 2) { st.chiVal = 2; st.dir = 1 }
        } else {
          st.cVal += st.dir * 9
          if (st.cVal > QH * ZST - 20) { st.cVal = QH * ZST - 20; st.dir = -1 }
          if (st.cVal < 30) { st.cVal = 30; st.dir = 1 }
        }
      }
      const curChi = st.chiVal
      const curC = st.cVal
      const picked =
        st.axis === 'chi'
          ? statesAtChi(curChi)
          : [arc[Math.min(arc.length - 1, Math.max(0, Math.round((curC / (QH * ZST)) * arc.length)))]]

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      /* ---- left panel: S-curve ---- */
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD_L, PAD_T)
      ctx.lineTo(PAD_L, H - PAD_B)
      ctx.lineTo(PLOT_W - 12, H - PAD_B)
      ctx.stroke()
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      for (let t = 300; t <= 2100; t += 300) {
        const y = yOf(t)
        ctx.fillText(String(t), 16, y + 4)
        ctx.strokeStyle = '#1b2026'
        ctx.beginPath()
        ctx.moveTo(PAD_L, y)
        ctx.lineTo(PLOT_W - 12, y)
        ctx.stroke()
      }
      for (let c = 0; c <= 150; c += 50) {
        ctx.fillText(String(c), xOf(c) - 8, H - PAD_B + 16)
      }
      ctx.fillStyle = '#8b949e'
      ctx.fillText('chi_st  [1/s]', PAD_L + 110, H - 12)
      ctx.save()
      ctx.translate(14, PAD_T + 120)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('T at Z_st  [K]', 0, 0)
      ctx.restore()

      /* frozen branch: T = T_u for every chi */
      ctx.strokeStyle = '#6e7681'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(PAD_L, yOf(TU))
      ctx.lineTo(PLOT_W - 12, yOf(TU))
      ctx.stroke()
      ctx.setLineDash([])

      /* arc, coloured by branch */
      for (let i = 0; i < arc.length - 1; i++) {
        ctx.strokeStyle = i < foldIdx ? '#f85149' : '#58a6ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(xOf(arc[i].chi), yOf(arc[i].tst))
        ctx.lineTo(xOf(arc[i + 1].chi), yOf(arc[i + 1].tst))
        ctx.stroke()
      }
      /* fold */
      ctx.fillStyle = '#d29922'
      ctx.beginPath()
      ctx.arc(xOf(chiExt), yOf(arc[foldIdx].tst), 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillText(`fold  chi_ext=${chiExt.toFixed(1)}`, xOf(chiExt) - 96, yOf(arc[foldIdx].tst) - 8)

      /* the coordinate line being queried */
      if (st.axis === 'chi') {
        ctx.strokeStyle = '#e6edf3'
        ctx.setLineDash([2, 4])
        ctx.beginPath()
        ctx.moveTo(xOf(curChi), PAD_T)
        ctx.lineTo(xOf(curChi), H - PAD_B)
        ctx.stroke()
        ctx.setLineDash([])
      }
      picked.forEach((p, k) => {
        ctx.fillStyle = ['#6e7681', '#f85149', '#58a6ff'][Math.min(k, 2)]
        ctx.beginPath()
        ctx.arc(xOf(st.axis === 'chi' ? curChi : p.chi), yOf(p.tst), 5, 0, 2 * Math.PI)
        ctx.fill()
      })

      /* legend */
      ctx.font = '11px ui-monospace, monospace'
      const leg: [string, string][] = [
        ['#6e7681', 'frozen (stable)'],
        ['#f85149', 'middle (unstable)'],
        ['#58a6ff', 'burning (stable)'],
      ]
      leg.forEach(([col, lab], i) => {
        ctx.fillStyle = col
        ctx.fillRect(PAD_L + 8, PAD_T + 2 + i * 14, 9, 3)
        ctx.fillStyle = '#8b949e'
        ctx.fillText(lab, PAD_L + 22, PAD_T + 7 + i * 14)
      })

      /* ---- right panel: T(Z) of every state the lookup returns ---- */
      ctx.strokeStyle = '#30363d'
      ctx.beginPath()
      ctx.moveTo(px(0), PAD_T)
      ctx.lineTo(px(0), H - PAD_B)
      ctx.lineTo(px(1), H - PAD_B)
      ctx.stroke()
      ctx.fillStyle = '#8b949e'
      ctx.fillText('Z', px(0.5), H - 12)
      ctx.fillText('0', px(0) - 3, H - PAD_B + 16)
      ctx.fillText('1', px(1) - 3, H - PAD_B + 16)
      ctx.strokeStyle = '#1b2026'
      ctx.beginPath()
      ctx.moveTo(px(ZST), PAD_T)
      ctx.lineTo(px(ZST), H - PAD_B)
      ctx.stroke()
      ctx.fillStyle = '#6e7681'
      ctx.fillText('Z_st', px(ZST) - 10, PAD_T - 8)

      picked.forEach((p, k) => {
        ctx.strokeStyle = ['#6e7681', '#f85149', '#58a6ff'][Math.min(k, 2)]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px(0), py(TU))
        for (let i = 0; i < NZ; i++) ctx.lineTo(px(ZGRID[i]), py(p.prof[i]))
        ctx.lineTo(px(1), py(TU))
        ctx.stroke()
      })

      ctx.fillStyle = '#e6edf3'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(
        st.axis === 'chi'
          ? `lookup key chi_st = ${curChi.toFixed(1)} 1/s  ->  ${picked.length} flamelets`
          : `lookup key C = ${curC.toFixed(0)} K  ->  1 flamelet,  chi_st = ${picked[0].chi.toFixed(2)} 1/s`,
        PAD_L,
        16,
      )

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [arc, foldIdx, chiExt, tick])

  /* readouts refreshed a few times per second while sweeping, not per frame */
  useEffect(() => {
    if (!sweep) return
    const id = window.setInterval(() => {
      setChiVal(stateRef.current.chiVal)
      setCVal(stateRef.current.cVal)
      setTick((t) => t + 1)
    }, 220)
    return () => window.clearInterval(id)
  }, [sweep])

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
          table axis:{' '}
          <button
            onClick={() => setAxis('chi')}
            style={{ padding: '2px 8px', background: axis === 'chi' ? '#1f6feb' : '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5 }}
          >
            chi (SLF)
          </button>{' '}
          <button
            onClick={() => setAxis('C')}
            style={{ padding: '2px 8px', background: axis === 'C' ? '#1f6feb' : '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5 }}
          >
            C (FPV)
          </button>
        </span>
        {axis === 'chi' ? (
          <label>
            chi_st = <b>{chiVal.toFixed(1)}</b> 1/s{' '}
            <input
              type="range"
              min={2}
              max={148}
              step={0.5}
              value={chiVal}
              disabled={sweep}
              onChange={(e) => {
                const v = Number(e.target.value)
                setChiVal(v)
                stateRef.current.chiVal = v
              }}
            />
          </label>
        ) : (
          <label>
            C = <b>{cVal.toFixed(0)}</b> K{' '}
            <input
              type="range"
              min={30}
              max={1750}
              step={10}
              value={cVal}
              disabled={sweep}
              onChange={(e) => {
                const v = Number(e.target.value)
                setCVal(v)
                stateRef.current.cVal = v
              }}
            />
          </label>
        )}
        <button
          onClick={() => setSweep((s) => !s)}
          style={{ padding: '2px 10px', background: sweep ? '#8957e5' : '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5 }}
        >
          {sweep ? 'stop sweep' : 'auto sweep'}
        </button>
        <span style={{ color: shown.length > 1 ? '#f85149' : '#3fb950' }}>
          {axis === 'chi'
            ? `${shown.length} entries at one key: ${shown.map((p) => `${p.tst.toFixed(0)} K`).join(', ')}`
            : `single-valued, chi_st = ${readChi.toFixed(2)} 1/s`}
        </span>
      </div>
    </div>
  )
}
