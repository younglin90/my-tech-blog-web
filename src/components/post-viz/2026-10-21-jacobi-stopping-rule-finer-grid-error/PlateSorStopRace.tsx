'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 760
const H = 420
const LX = 1, LY = 2, TB = 100
const GRIDS: [number, number][] = [[21, 41], [41, 81], [81, 161]]

type Ref = { td: Float64Array; ta: Float64Array; rhoJ: number; wOpt: number }
type Run = { T: Float64Array; k: number; d: number; done: boolean; hist: [number, number, number][]; iterErr: number; tot: number }

// exact solution of the 5-point system: sine transform in x, recurrence in y
function discretePlate(nx: number, ny: number) {
  const T = new Float64Array(nx * ny), J = ny - 1
  for (let p = 1; p < nx - 1; p++) {
    let c = 0
    for (let i = 1; i < nx - 1; i++) c += TB * Math.sin((p * Math.PI * i) / (nx - 1))
    c *= 2 / (nx - 1)
    const lam = 2 - 2 * Math.cos((p * Math.PI) / (nx - 1))
    const r = (2 + lam + Math.sqrt((2 + lam) ** 2 - 4)) / 2
    for (let j = 0; j < ny; j++) {
      const a = (c * (Math.pow(r, j - J) - Math.pow(r, J - j))) / (Math.pow(r, -J) - Math.pow(r, J))
      for (let i = 1; i < nx - 1; i++) T[i * ny + j] += Math.sin((p * Math.PI * i) / (nx - 1)) * a
    }
  }
  for (let i = 1; i < nx - 1; i++) T[i * ny] = TB
  return T
}

// analytic Fourier series of the continuous problem
function exactPlate(nx: number, ny: number) {
  const T = new Float64Array(nx * ny)
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = (LX * i) / (nx - 1), y = (LY * j) / (ny - 1)
    let s = 0
    for (let n = 1; n <= 399; n += 2) {
      const k = (n * Math.PI) / LX
      const decay = (Math.exp(-k * y) * (1 - Math.exp(-2 * k * (LY - y)))) / (1 - Math.exp(-2 * k * LY))
      s += ((4 * TB) / (n * Math.PI)) * Math.sin(k * x) * decay
    }
    T[i * ny + j] = s
  }
  return T
}

function fresh(nx: number, ny: number): Run {
  const T = new Float64Array(nx * ny)
  for (let i = 1; i < nx - 1; i++) T[i * ny] = TB
  return { T, k: 0, d: NaN, done: false, hist: [], iterErr: NaN, tot: NaN }
}

function sweep(r: Run, nx: number, ny: number, w: number, jacobi: boolean, es: number, ref: Ref) {
  const T = r.T
  let d = 0
  if (jacobi) {
    const Tn = T.slice()
    for (let i = 1; i < nx - 1; i++) for (let j = 1; j < ny - 1; j++) {
      const q = i * ny + j
      Tn[q] = 0.25 * (T[q + ny] + T[q - ny] + T[q + 1] + T[q - 1])
      d = Math.max(d, Math.abs(Tn[q] - T[q]))
    }
    r.T = Tn
  } else {
    // red-black SOR: one colour at a time, in place
    for (let c = 0; c < 2; c++) for (let i = 1; i < nx - 1; i++) for (let j = 1 + ((i + 1 + c) % 2); j < ny - 1; j += 2) {
      const q = i * ny + j
      const gs = 0.25 * (T[q + ny] + T[q - ny] + T[q + 1] + T[q - 1])
      const v = (1 - w) * T[q] + w * gs
      d = Math.max(d, Math.abs(v - T[q])); T[q] = v
    }
  }
  r.k++; r.d = d
  let ie = 0, te = 0
  const j0 = Math.floor((ny - 1) / 8)
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const q = i * ny + j
    ie = Math.max(ie, Math.abs(r.T[q] - ref.td[q]))
    if (j >= j0) te = Math.max(te, Math.abs(r.T[q] - ref.ta[q]))
  }
  r.iterErr = ie; r.tot = te
  r.hist.push([r.k, d, ie])
  if (d < es) r.done = true
}

function heat(v: number) {
  const t = Math.min(1, Math.max(0, v))
  const r = Math.round(255 * Math.min(1, 1.6 * t)), g = Math.round(255 * Math.max(0, Math.min(1, 1.8 * t - 0.6)))
  const b = Math.round(255 * Math.max(0, 0.55 - t) * 1.4)
  return `rgb(${r},${g},${b})`
}

export function PlateSorStopRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [gi, setGi] = useState(0)
  const [logEs, setLogEs] = useState(-3)
  const [omega, setOmega] = useState(1.78)
  const [speed, setSpeed] = useState(4)
  const [showErr, setShowErr] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<{ a: Run | null; b: Run | null }>({ a: null, b: null })
  const [nx, ny] = GRIDS[gi]
  const refs = useMemo<Ref>(() => {
    const rhoJ = 0.5 * (Math.cos(Math.PI / (nx - 1)) + Math.cos(Math.PI / (ny - 1)))
    return { td: discretePlate(nx, ny), ta: exactPlate(nx, ny), rhoJ, wOpt: 2 / (1 + Math.sqrt(1 - rhoJ * rhoJ)) }
  }, [nx, ny])
  const live = useRef({ nx, ny, es: 1e-3, omega, speed, showErr, playing, refs, stepOnce: false })
  Object.assign(live.current, { nx, ny, es: Math.pow(10, logEs), omega, speed, showErr, playing, refs })
  const runs = useRef({ a: fresh(nx, ny), b: fresh(nx, ny) })

  useEffect(() => { runs.current = { a: fresh(nx, ny), b: fresh(nx, ny) } }, [nx, ny, logEs, omega, nonce])

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0
    const loop = () => {
      const L = live.current, R = runs.current
      if (R.a.T.length === L.nx * L.ny) {
        const m = L.playing ? L.speed : L.stepOnce ? 1 : 0
        L.stepOnce = false
        for (let q = 0; q < m; q++) {
          if (!R.a.done) sweep(R.a, L.nx, L.ny, 1, true, L.es, L.refs)
          if (!R.b.done) sweep(R.b, L.nx, L.ny, L.omega, false, L.es, L.refs)
        }
      }
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      const ph = 320, pw = 160, py = 40
      const panels: [Run, number, string, string][] = [[R.a, 20, 'Jacobi', '#fb923c'], [R.b, 200, `SOR w=${L.omega.toFixed(3)}`, '#38bdf8']]
      for (const [r, x0, name, col] of panels) {
        if (r.T.length !== L.nx * L.ny) continue
        const cw = pw / L.nx, ch = ph / L.ny
        for (let i = 0; i < L.nx; i++) for (let j = 0; j < L.ny; j++) {
          const q = i * L.ny + j
          const v = L.showErr ? Math.abs(r.T[q] - L.refs.td[q]) / 2 : r.T[q] / TB
          ctx.fillStyle = heat(L.showErr ? Math.log10(1e-4 + v * 2) / 4 + 1 : v)
          ctx.fillRect(x0 + i * cw, py + ph - (j + 1) * ch, cw + 0.6, ch + 0.6)
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x0, py, pw, ph)
        ctx.fillStyle = col; ctx.fillText(name, x0, py - 22)
        ctx.fillStyle = r.done ? '#34d399' : '#fbbf24'
        ctx.fillText(r.done ? `stopped k=${r.k}` : `k=${r.k}`, x0, py - 8)
      }
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(L.showErr ? 'color = log10 |T - T_discrete| (1e-4 .. 1)' : 'color = T (0..100 C), hot wall at bottom', 20, py + ph + 20)
      ctx.fillText(`grid ${L.nx}x${L.ny}`, 20, py + ph + 38)

      // history
      const gx = 420, gy = 40, gw = 315, gh = 320
      ctx.strokeStyle = 'rgba(203,213,225,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh)
      const lo = -5, hi = 2
      const ly = (v: number) => gy + gh * Math.min(1, Math.max(0, (hi - Math.log10(Math.max(v, 1e-9))) / (hi - lo)))
      const kmax = Math.max(50, R.a.k, R.b.k)
      const lx = (k: number) => gx + (gw * k) / kmax
      for (let e = lo; e <= hi; e++) { ctx.fillStyle = '#94a3b8'; ctx.fillText(`1e${e}`, gx - 38, ly(Math.pow(10, e)) + 4) }
      ctx.strokeStyle = '#f87171'; ctx.setLineDash([4, 4]); ctx.beginPath()
      ctx.moveTo(gx, ly(L.es)); ctx.lineTo(gx + gw, ly(L.es)); ctx.stroke(); ctx.setLineDash([])
      for (const [r, col] of [[R.a, '#fb923c'], [R.b, '#38bdf8']] as [Run, string][]) {
        const stride = Math.max(1, Math.floor(r.hist.length / 400))
        for (const [idx, dash] of [[1, [3, 3]], [2, []]] as [number, number[]][]) {
          ctx.strokeStyle = col; ctx.lineWidth = idx === 2 ? 2 : 1.2; ctx.setLineDash(dash); ctx.beginPath()
          for (let q = 0; q < r.hist.length; q += stride) {
            const h = r.hist[q], X = lx(h[0]), Y = ly(h[idx])
            if (q) ctx.lineTo(X, Y); else ctx.moveTo(X, Y)
          }
          ctx.stroke()
        }
      }
      ctx.setLineDash([])
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(`solid: true iteration error   dashed: increment   (k 0..${kmax})`, gx - 30, gy - 8)
      ctx.fillStyle = '#f87171'; ctx.fillText(`es`, gx + gw - 20, ly(L.es) - 5)

      if (++frame % 12 === 0) setRead({ a: { ...R.a }, b: { ...R.b } })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const es = Math.pow(10, logEs)
  const row = (r: Run | null, name: string, rho: number | null, col: string) => (
    <div style={{ color: col }}>
      {name}: k = {r?.k ?? 0} | increment = {r && Number.isFinite(r.d) ? r.d.toExponential(2) : '-'}
      {' '}| iter_err = {r && Number.isFinite(r.iterErr) ? r.iterErr.toFixed(4) : '-'}
      {' '}| total err (y ≥ LY/8) = {r && Number.isFinite(r.tot) ? r.tot.toFixed(4) : '-'}
      {rho !== null ? ` | es/(1-rho) = ${(es / (1 - rho)).toFixed(3)}` : ''}
      {r?.done ? '  ✓ stopped' : ''}
    </div>
  )

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {GRIDS.map(([a, b], q) => (
          <button key={a} style={btn(gi === q)} onClick={() => { setGi(q); setOmega(+(2 / (1 + Math.sqrt(1 - (0.5 * (Math.cos(Math.PI / (a - 1)) + Math.cos(Math.PI / (b - 1)))) ** 2))).toFixed(3)) }}>{a}x{b}</button>
        ))}
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); live.current.stepOnce = true }}>Step</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
        <button style={btn(showErr)} onClick={() => setShowErr((v) => !v)}>{showErr ? 'show T' : 'show error field'}</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <label>es = {es.toExponential(0)}{' '}
          <input type="range" min={-4} max={-1} step={1} value={logEs} onChange={(e) => setLogEs(+e.target.value)} />
        </label>
        <label>SOR omega = {omega.toFixed(3)}{' '}
          <input type="range" min={0.8} max={1.98} step={0.01} value={omega} onChange={(e) => setOmega(+e.target.value)} />
        </label>
        <button style={btn(Math.abs(omega - refs.wOpt) < 0.001)} onClick={() => setOmega(+refs.wOpt.toFixed(3))}>omega_opt = {refs.wOpt.toFixed(3)}</button>
        <label>sweeps/frame = {speed}{' '}
          <input type="range" min={1} max={60} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        {row(read.a, 'Jacobi ', refs.rhoJ, '#fb923c')}
        {row(read.b, `SOR    `, Math.abs(omega - refs.wOpt) < 0.001 ? refs.wOpt - 1 : null, '#38bdf8')}
        <div style={{ opacity: 0.75 }}>discretization error of this grid (y ≥ LY/8) is the floor no solver can beat</div>
      </div>
    </div>
  )
}
