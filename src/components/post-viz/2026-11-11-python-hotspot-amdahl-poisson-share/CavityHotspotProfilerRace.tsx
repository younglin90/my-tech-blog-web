'use client'

import { useEffect, useRef, useState } from 'react'

// Browser port of the post's cavity_run(): lid-driven cavity, vorticity-streamfunction,
// Re = 100, Thom wall vorticity, FTCS transport, Jacobi Poisson until max|dpsi| < tol.
// The solver really runs here. Wall-clock is NOT measured in JS (JS is compiled);
// instead each stage is charged with per-cell costs measured in the post's Python run:
//   loop Jacobi 0.709 us/cell, loop transport 1.789 us/cell, NumPy Jacobi ~11.5 us/sweep (N=33).
const W = 760
const H = 560
const BG = '#0f172a'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.22)'
const C_BC = '#a78bfa'
const C_TR = '#64748b'
const C_PO = '#f97316'
const OK = '#4ade80'
const ACC = '#38bdf8'
const RE = 100

const US_LOOP_JAC = 0.709
const US_LOOP_TR = 1.789
const US_LOOP_BC = 0.3 // per boundary node (4n per step)
const npJacobi = (cells: number) => 8 + 0.0036 * cells // us per sweep
const NP_TR = 33 // us per step
const NP_BC = 13 // us per step

type Sim = {
  n: number; h: number; dt: number; tol: number
  w: Float64Array; psi: Float64Array; tmp: Float64Array
  step: number; sweeps: number; hist: number[]
  // accumulated cost in microseconds: [bc, transport, poisson] for 3 versions
  cost: { py: number[]; hy: number[]; np: number[] }
}

function makeSim(n: number, tol: number): Sim {
  const h = 1 / (n - 1)
  const dt = Math.min(0.25 * h * h * RE / 4, 0.5 * h)
  return {
    n, h, dt, tol,
    w: new Float64Array(n * n), psi: new Float64Array(n * n), tmp: new Float64Array(n * n),
    step: 0, sweeps: 0, hist: [],
    cost: { py: [0, 0, 0], hy: [0, 0, 0], np: [0, 0, 0] },
  }
}

function advance(S: Sim) {
  const { n, h, dt, w, psi, tmp } = S
  const id = (i: number, j: number) => i * n + j
  const h2 = h * h
  // 1) Thom wall vorticity (row i = 0 bottom, i = n-1 lid moving at u = 1)
  for (let k = 0; k < n; k++) {
    w[id(k, 0)] = -2 * psi[id(k, 1)] / h2
    w[id(k, n - 1)] = -2 * psi[id(k, n - 2)] / h2
    w[id(0, k)] = -2 * psi[id(1, k)] / h2
    w[id(n - 1, k)] = -2 * psi[id(n - 2, k)] / h2 - 2 / h
  }
  // 2) FTCS vorticity transport
  tmp.set(w)
  for (let i = 1; i < n - 1; i++) {
    for (let j = 1; j < n - 1; j++) {
      const u = (psi[id(i + 1, j)] - psi[id(i - 1, j)]) / (2 * h)
      const v = -(psi[id(i, j + 1)] - psi[id(i, j - 1)]) / (2 * h)
      const wx = (w[id(i, j + 1)] - w[id(i, j - 1)]) / (2 * h)
      const wy = (w[id(i + 1, j)] - w[id(i - 1, j)]) / (2 * h)
      const lap = (w[id(i + 1, j)] + w[id(i - 1, j)] + w[id(i, j + 1)] + w[id(i, j - 1)] - 4 * w[id(i, j)]) / h2
      tmp[id(i, j)] = w[id(i, j)] + dt * (-u * wx - v * wy + lap / RE)
    }
  }
  w.set(tmp)
  // 3) Jacobi until max change < tol
  let sw = 0
  for (;;) {
    let err = 0
    tmp.set(psi)
    for (let i = 1; i < n - 1; i++) {
      for (let j = 1; j < n - 1; j++) {
        const val = 0.25 * (psi[id(i + 1, j)] + psi[id(i - 1, j)] + psi[id(i, j + 1)] + psi[id(i, j - 1)] + h2 * w[id(i, j)])
        const d = Math.abs(val - psi[id(i, j)])
        if (d > err) err = d
        tmp[id(i, j)] = val
      }
    }
    psi.set(tmp)
    sw++
    if (err < S.tol || sw > 20000) break
  }
  const cells = (n - 2) * (n - 2)
  const bcPy = US_LOOP_BC * 4 * n, trPy = US_LOOP_TR * cells
  S.cost.py[0] += bcPy; S.cost.py[1] += trPy; S.cost.py[2] += US_LOOP_JAC * cells * sw
  S.cost.hy[0] += bcPy; S.cost.hy[1] += trPy; S.cost.hy[2] += npJacobi(cells) * sw
  S.cost.np[0] += NP_BC; S.cost.np[1] += NP_TR; S.cost.np[2] += npJacobi(cells) * sw
  S.step++
  S.sweeps += sw
  S.hist.push(sw)
}

const sum = (a: number[]) => a[0] + a[1] + a[2]

export function CavityHotspotProfilerRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tolExp, setTolExp] = useState(-4)
  const [n, setN] = useState(33)
  const [target, setTarget] = useState(60)
  const [spf, setSpf] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ step: 0, spp: 0, p: 0, amd: 1, hy: 1, all: 1, ceil: 1, py: 0, psiMin: 0 })
  const sim = useRef<Sim>(makeSim(33, 1e-4))
  const stepOnce = useRef(false)

  useEffect(() => { sim.current = makeSim(n, Math.pow(10, tolExp)) }, [n, tolExp, nonce])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const draw = () => {
      const S = sim.current
      if ((playing || stepOnce.current) && S.step < target) {
        const k = stepOnce.current ? 1 : spf
        for (let q = 0; q < k && S.step < target; q++) advance(S)
        stepOnce.current = false
      }
      const { n, psi } = S
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      ctx.font = '13px ui-sans-serif, system-ui'

      // --- psi field ---
      const FX = 20, FY = 34, FS = 250
      let pmin = 0
      for (let i = 0; i < psi.length; i++) if (psi[i] < pmin) pmin = psi[i]
      const cs = FS / n
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const t = pmin < 0 ? Math.min(1, psi[i * n + j] / pmin) : 0
        const r = Math.round(15 + 40 * t), g = Math.round(23 + 140 * t), b = Math.round(42 + 200 * t)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(FX + j * cs, FY + (n - 1 - i) * cs, cs + 0.6, cs + 0.6)
      }
      // contour-ish: mark cells crossing psi levels
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      for (let L = 1; L <= 5; L++) {
        const lev = (pmin * L) / 6
        for (let i = 0; i < n - 1; i++) for (let j = 0; j < n - 1; j++) {
          const a = psi[i * n + j] - lev, b = psi[i * n + j + 1] - lev, c = psi[(i + 1) * n + j] - lev
          if (a * b < 0 || a * c < 0) ctx.fillRect(FX + (j + 0.5) * cs, FY + (n - 1.5 - i) * cs, 1.6, 1.6)
        }
      }
      ctx.strokeStyle = TXT; ctx.strokeRect(FX, FY, FS, FS)
      ctx.fillStyle = ACC
      ctx.fillText('lid u = 1  →', FX + 80, FY - 8)
      ctx.fillStyle = TXT
      ctx.fillText(`ψ (min ${pmin.toFixed(5)})  step ${S.step}/${target}`, FX, FY + FS + 18)

      // --- projected wall-clock bars ---
      const BX = 300, BX1 = W - 30, BWd = BX1 - BX
      const tPy = sum(S.cost.py)
      ctx.fillStyle = TXT
      ctx.fillText('projected wall-clock (costs measured in the Python run)', BX, 26)
      const rows = [
        { name: 'all Python loops', c: S.cost.py },
        { name: 'Poisson → NumPy', c: S.cost.hy },
        { name: 'all NumPy', c: S.cost.np },
      ]
      rows.forEach((r, k) => {
        const y = 46 + k * 62
        const tot = sum(r.c)
        ctx.fillStyle = TXT
        ctx.fillText(`${r.name}  ${(tot / 1e6).toFixed(3)} s${k && tot > 0 ? `  (${(tPy / tot).toFixed(1)}×)` : ''}`, BX, y)
        let x = BX
        const cols = [C_BC, C_TR, C_PO]
        for (let q = 0; q < 3; q++) {
          const wdt = tPy > 0 ? (BWd * r.c[q]) / tPy : 0
          ctx.fillStyle = cols[q]
          ctx.fillRect(x, y + 8, wdt, 24)
          x += wdt
        }
        ctx.strokeStyle = GRID; ctx.strokeRect(BX, y + 8, BWd, 24)
      })
      ;[['wall ω (BC)', C_BC], ['transport', C_TR], ['Poisson (Jacobi)', C_PO]].forEach(([lab, col], q) => {
        ctx.fillStyle = col; ctx.fillRect(BX + q * 140, 236, 12, 10)
        ctx.fillStyle = TXT; ctx.fillText(lab, BX + q * 140 + 16, 246)
      })

      // --- sweeps per step history ---
      const PX0 = 70, PX1 = W - 30, PY0 = 330, PY1 = H - 40
      const hist = S.hist
      const ymaxL = 4 // log10 sweeps up to 10^4
      const sy = (v: number) => PY1 - (Math.log10(Math.max(1, v)) / ymaxL) * (PY1 - PY0)
      const sx = (k: number) => PX0 + (k / Math.max(1, target - 1)) * (PX1 - PX0)
      ctx.strokeStyle = GRID
      for (let e = 0; e <= ymaxL; e++) {
        ctx.beginPath(); ctx.moveTo(PX0, sy(Math.pow(10, e))); ctx.lineTo(PX1, sy(Math.pow(10, e))); ctx.stroke()
        ctx.fillStyle = TXT; ctx.fillText(`${Math.pow(10, e)}`, 24, sy(Math.pow(10, e)) + 4)
      }
      ctx.fillStyle = TXT
      ctx.fillText('Jacobi sweeps per time step (log) — warm start makes later steps cheap', PX0, PY0 - 12)
      ctx.fillText('time step', PX1 - 60, PY1 + 22)
      ctx.strokeStyle = C_PO
      ctx.lineWidth = 2
      ctx.beginPath()
      hist.forEach((v, k) => (k ? ctx.lineTo(sx(k), sy(v)) : ctx.moveTo(sx(k), sy(v))))
      ctx.stroke()
      ctx.lineWidth = 1
      if (hist.length) {
        const avg = S.sweeps / S.step
        ctx.strokeStyle = OK; ctx.setLineDash([5, 4])
        ctx.beginPath(); ctx.moveTo(PX0, sy(avg)); ctx.lineTo(PX1, sy(avg)); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = OK; ctx.fillText(`mean ${avg.toFixed(1)}`, PX1 - 90, sy(avg) - 6)
      }

      frame++
      if (frame % 12 === 0) {
        const p = tPy > 0 ? S.cost.py[2] / tPy : 0
        const sK = S.cost.hy[2] > 0 ? S.cost.py[2] / S.cost.hy[2] : 1
        setRead({
          step: S.step, spp: S.step ? S.sweeps / S.step : 0, p,
          amd: 1 / ((1 - p) + p / sK), hy: sum(S.cost.hy) > 0 ? tPy / sum(S.cost.hy) : 1,
          all: sum(S.cost.np) > 0 ? tPy / sum(S.cost.np) : 1, ceil: 1 / (1 - p), py: tPy / 1e6, psiMin: pmin,
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, target, spf, n, tolExp, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>tol = 1e{tolExp.toFixed(1).replace('.0', '')}{' '}
          <input type="range" min={-7} max={-3} step={0.5} value={tolExp} onChange={(e) => setTolExp(+e.target.value)} />
        </label>
        <label>steps {target}{' '}
          <input type="range" min={20} max={200} step={10} value={target} onChange={(e) => setTarget(+e.target.value)} />
        </label>
        <label>speed {spf}/frame{' '}
          <input type="range" min={1} max={5} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} />
        </label>
        <button style={btn(n === 17)} onClick={() => setN(17)}>N = 17</button>
        <button style={btn(n === 33)} onClick={() => setN(33)}>N = 33</button>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { stepOnce.current = true }}>Step</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
        <div>step {read.step} · sweeps/step {read.spp.toFixed(1)} · ψ_min {read.psiMin.toFixed(5)} · all-Python {read.py.toFixed(3)} s</div>
        <div>Poisson share p = <b style={{ color: C_PO }}>{read.p.toFixed(3)}</b> · Amdahl {read.amd.toFixed(1)}× · Poisson→NumPy <b style={{ color: OK }}>{read.hy.toFixed(1)}×</b> · all NumPy {read.all.toFixed(1)}× · ceiling 1/(1−p) {read.ceil.toFixed(1)}×</div>
      </div>
    </div>
  )
}
