'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 440
const BG = '#0b0f19'
const GRID = 'rgba(160,160,170,0.18)'
const TXT = 'rgba(220,220,230,0.92)'
const SA = '#38bdf8'
const NSA = '#f97316'
const T_END = 2
const DTS = [0.1, 0.05, 0.025, 0.0125, 0.00625, 0.003125]

const g = 1 - 1 / Math.SQRT2
const d = Math.SQRT2 / 4
const al = (3 + 2 * Math.SQRT2) / 6
type Scheme = { Ae: number[][]; Ai: number[][]; b: number[]; ce: number[]; ci: number[] }
const mk = (Ae: number[][], Ai: number[][], b: number[]): Scheme => ({
  Ae, Ai, b, ce: Ae.map((r) => r.reduce((a, v) => a + v, 0)), ci: Ai.map((r) => r.reduce((a, v) => a + v, 0)),
})
const ARK2 = mk([[0, 0, 0], [2 * g, 0, 0], [1 - al, al, 0]], [[0, 0, 0], [g, g, 0], [d, d, g]], [d, d, g])
const SSP2 = mk([[0, 0], [1, 0]], [[g, 0], [1 - 2 * g, g]], [0.5, 0.5])

// same loop as pr_imex() in the post: y' = phi'(t) [explicit] + (phi - y)/eps [implicit]
function imexStep(sc: Scheme, eps: number, dt: number, t: number, y: number): number {
  const s = sc.b.length
  const FE = new Array<number>(s), FI = new Array<number>(s)
  for (let l = 0; l < s; l++) {
    let rhs = y
    for (let m = 0; m < l; m++) rhs += dt * (sc.Ae[l][m] * FE[m] + sc.Ai[l][m] * FI[m])
    const a = (dt * sc.Ai[l][l]) / eps
    const Y = (rhs + a * Math.sin(t + sc.ci[l] * dt)) / (1 + a)
    FE[l] = Math.cos(t + sc.ce[l] * dt)
    FI[l] = (Math.sin(t + sc.ci[l] * dt) - Y) / eps
  }
  let y1 = y
  for (let l = 0; l < s; l++) y1 += dt * sc.b[l] * (FE[l] + FI[l])
  return y1
}

type Run = { k: number; n: number; N: number; yA: number; yS: number; histA: number[]; histS: number[]; finA: number[]; finS: number[] }
const fresh = (): Run => ({ k: 0, n: 0, N: Math.round(T_END / DTS[0]), yA: 0, yS: 0, histA: [], histS: [], finA: [], finS: [] })

export function ProtheroRobinsonOrderRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logEps, setLogEps] = useState(-6)
  const [speed, setSpeed] = useState(4)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ k: 0, n: 0, N: 20, eA: 0, eS: 0, pA: NaN, pS: NaN })
  const runRef = useRef<Run>(fresh())
  const stepReq = useRef(0)

  useEffect(() => { runRef.current = fresh() }, [logEps, nonce])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const eps = Math.pow(10, logEps)
    let raf = 0, frame = 0

    const advance = () => {
      const r = runRef.current
      if (r.k >= DTS.length) return
      const dt = DTS[r.k]
      const t = r.n * dt
      r.yA = imexStep(ARK2, eps, dt, t, r.yA)
      r.yS = imexStep(SSP2, eps, dt, t, r.yS)
      r.n++
      const te = Math.sin(r.n * dt)
      r.histA.push(Math.abs(r.yA - te)); r.histS.push(Math.abs(r.yS - te))
      if (r.n >= r.N) {
        r.finA.push(Math.abs(r.yA - te)); r.finS.push(Math.abs(r.yS - te))
        r.k++
        if (r.k < DTS.length) { r.n = 0; r.N = Math.round(T_END / DTS[r.k]); r.yA = 0; r.yS = 0; r.histA = []; r.histS = [] }
      }
    }

    const LE = (v: number) => Math.log10(Math.max(v, 1e-16))
    const draw = () => {
      const r = runRef.current
      if (playing) {
        const per = Math.max(1, Math.round(Math.pow(2, speed - 1) * (r.k < DTS.length ? DTS[0] / DTS[r.k] : 1) / 8))
        for (let i = 0; i < per; i++) advance()
      }
      while (stepReq.current > 0) { advance(); stepReq.current-- }

      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px sans-serif'
      // ---- left: error history of current run
      const L = { x: 56, y: 30, w: 330, h: 360 }
      const emin = -9, emax = -1
      const PY = (v: number) => L.y + L.h - ((Math.max(emin, Math.min(emax, LE(v))) - emin) / (emax - emin)) * L.h
      ctx.strokeStyle = GRID; ctx.strokeRect(L.x, L.y, L.w, L.h)
      ctx.fillStyle = TXT
      const kk = Math.min(r.k, DTS.length - 1)
      ctx.fillText(`|y − sin t| during run, Δt = ${DTS[kk]}`, L.x, L.y - 10)
      for (let e = emin; e <= emax; e += 2) ctx.fillText(`1e${e}`, L.x - 38, PY(Math.pow(10, e)) + 4)
      for (let t = 0; t <= T_END; t += 0.5) ctx.fillText(t.toFixed(1), L.x + (t / T_END) * L.w - 8, L.y + L.h + 16)
      ctx.fillText('t', L.x + L.w - 6, L.y + L.h + 30)
      const hist = (hs: number[], col: string) => {
        if (!hs.length) return
        const dt = DTS[kk]
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        hs.forEach((v, i) => {
          const x = L.x + (((i + 1) * dt) / T_END) * L.w
          if (i === 0) ctx.moveTo(x, PY(v)); else ctx.lineTo(x, PY(v))
        })
        ctx.stroke()
      }
      hist(r.histA, SA); hist(r.histS, NSA)

      // ---- right: convergence at T
      const R = { x: 470, y: 30, w: 270, h: 360 }
      const xmin = Math.log10(0.0025), xmax = Math.log10(0.12)
      const PX = (dt: number) => R.x + ((Math.log10(dt) - xmin) / (xmax - xmin)) * R.w
      ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.strokeRect(R.x, R.y, R.w, R.h)
      ctx.fillStyle = TXT
      ctx.fillText('error at t = 2 vs Δt (log-log)', R.x, R.y - 10)
      for (let e = emin; e <= emax; e += 2) ctx.fillText(`1e${e}`, R.x - 38, PY(Math.pow(10, e)) + 4)
      ;[0.003125, 0.0125, 0.05].forEach((dt) => ctx.fillText(String(dt), PX(dt) - 14, R.y + R.h + 16))
      ctx.fillText('Δt', R.x + R.w - 14, R.y + R.h + 30)
      // reference slopes
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(200,200,210,0.45)'
      const ref1 = (p: number, c: number, lab: string) => {
        ctx.beginPath(); ctx.moveTo(PX(0.003), PY(c * Math.pow(0.003, p))); ctx.lineTo(PX(0.1), PY(c * Math.pow(0.1, p))); ctx.stroke()
        ctx.fillStyle = 'rgba(200,200,210,0.7)'; ctx.fillText(lab, PX(0.1) - 40, PY(c * Math.pow(0.1, p)) - 6)
      }
      ref1(1, 0.6, 'slope 1'); ref1(2, 2e-3, 'slope 2')
      ctx.setLineDash([])
      const pts = (fs: number[], col: string) => {
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2
        ctx.beginPath()
        fs.forEach((v, i) => { if (i === 0) ctx.moveTo(PX(DTS[i]), PY(v)); else ctx.lineTo(PX(DTS[i]), PY(v)) })
        ctx.stroke()
        fs.forEach((v, i) => { ctx.beginPath(); ctx.arc(PX(DTS[i]), PY(v), 4, 0, 2 * Math.PI); ctx.fill() })
      }
      pts(r.finA, SA); pts(r.finS, NSA)
      ctx.fillStyle = SA; ctx.fillText('ARK2 (type II, SA)', L.x + 8, L.y + 18)
      ctx.fillStyle = NSA; ctx.fillText('SSP2 (type I, non-SA)', L.x + 8, L.y + 34)
      ctx.fillStyle = TXT; ctx.fillText(`ε = ${eps.toExponential(0)}`, L.x + 8, L.y + 50)

      if (++frame % 10 === 0) {
        const ord = (f: number[]) => (f.length >= 2 ? Math.log2(f[f.length - 2] / f[f.length - 1]) : NaN)
        setRead({
          k: r.k, n: r.n, N: r.N,
          eA: r.histA.length ? r.histA[r.histA.length - 1] : 0, eS: r.histS.length ? r.histS[r.histS.length - 1] : 0,
          pA: ord(r.finA), pS: ord(r.finS),
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, logEps, speed, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const row = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 } as const
  const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '—')
  const done = read.k >= DTS.length

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button style={btn(playing)} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepReq.current++ }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((n) => n + 1); setPlaying(true) }}>Reset</button>
        {[0, -2, -4, -6].map((e) => (
          <button key={e} style={btn(logEps === e)} onClick={() => { setLogEps(e); setPlaying(true) }}>ε = 1e{e}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
        <label style={row}>log₁₀ ε
          <input type="range" min={-8} max={0} step={0.5} value={logEps} onChange={(e) => setLogEps(+e.target.value)} />
          <span>{logEps.toFixed(1)}</span></label>
        <label style={row}>speed
          <input type="range" min={1} max={8} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
          <span>{speed}</span></label>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 10, fontSize: 13, fontFamily: 'monospace' }}>
        <span>{done ? 'all 6 runs done' : `run ${read.k + 1}/6  Δt=${DTS[read.k]}  step ${read.n}/${read.N}`}</span>
        <span style={{ color: SA }}>ARK2 err {read.eA.toExponential(2)}  order {f2(read.pA)}</span>
        <span style={{ color: NSA }}>SSP2 err {read.eS.toExponential(2)}  order {f2(read.pS)}</span>
      </div>
    </div>
  )
}
