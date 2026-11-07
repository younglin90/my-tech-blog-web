'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 460
const BG = '#0b0f19'
const GRID = 'rgba(160,160,170,0.18)'
const TXT = 'rgba(220,220,230,0.92)'
const PHI = '#facc15'
const SA = '#38bdf8'
const NSA = '#f97316'

const g = 1 - 1 / Math.SQRT2
const d = Math.SQRT2 / 4
const al = (3 + 2 * Math.SQRT2) / 6
type Scheme = { Ae: number[][]; Ai: number[][]; b: number[] }
const ARK2: Scheme = { Ae: [[0, 0, 0], [2 * g, 0, 0], [1 - al, al, 0]], Ai: [[0, 0, 0], [g, g, 0], [d, d, g]], b: [d, d, g] }
const SSP2: Scheme = { Ae: [[0, 0], [1, 0]], Ai: [[g, 0], [1 - 2 * g, g]], b: [0.5, 0.5] }

type StepOut = { ts: number[]; Ys: number[]; y1: number }

function oneStep(sc: Scheme, eps: number, h: number, t: number, y: number): StepOut {
  const s = sc.b.length
  const ce = sc.Ae.map((r) => r.reduce((a, v) => a + v, 0))
  const ci = sc.Ai.map((r) => r.reduce((a, v) => a + v, 0))
  const FE: number[] = [], FI: number[] = [], Ys: number[] = [], ts: number[] = []
  for (let l = 0; l < s; l++) {
    let rhs = y
    for (let m = 0; m < l; m++) rhs += h * (sc.Ae[l][m] * FE[m] + sc.Ai[l][m] * FI[m])
    const a = (h * sc.Ai[l][l]) / eps
    const Y = (rhs + a * Math.sin(t + ci[l] * h)) / (1 + a)
    FE.push(Math.cos(t + ce[l] * h))
    FI.push((Math.sin(t + ci[l] * h) - Y) / eps)
    Ys.push(Y); ts.push(t + ci[l] * h)
  }
  let y1 = y
  for (let l = 0; l < s; l++) y1 += h * sc.b[l] * (FE[l] + FI[l])
  return { ts, Ys, y1 }
}

export function StageSnapAnatomyLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logEps, setLogEps] = useState(-6)
  const [h, setH] = useState(0.6)
  const [off, setOff] = useState(0.15)
  const [playing, setPlaying] = useState(false)
  const [read, setRead] = useState({ eA: 0, eS: 0, ratio: 0 })
  const epsRef = useRef(logEps)
  const dirRef = useRef(-1)
  epsRef.current = logEps

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0
    let le = epsRef.current
    const t0 = 0.5

    const draw = () => {
      if (playing) {
        le += dirRef.current * 0.02
        if (le < -6) { le = -6; dirRef.current = 1 }
        if (le > 0) { le = 0; dirRef.current = -1 }
      } else le = epsRef.current
      const eps = Math.pow(10, le)
      const y0 = Math.sin(t0) + off
      const A = oneStep(ARK2, eps, h, t0, y0)
      const S = oneStep(SSP2, eps, h, t0, y0)
      const target = Math.sin(t0 + h)

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
      // ---- left: one step anatomy
      const L = { x: 50, y: 30, w: 400, h: 380 }
      const tmin = t0 - 0.1, tmax = t0 + h + 0.1
      const ys = [y0, target, ...A.Ys, ...S.Ys, A.y1, S.y1, Math.sin(t0)]
      let ymin = Math.min(...ys), ymax = Math.max(...ys)
      const pad = 0.15 * (ymax - ymin + 0.05)
      ymin -= pad; ymax += pad
      const X = (t: number) => L.x + ((t - tmin) / (tmax - tmin)) * L.w
      const Y = (v: number) => L.y + L.h - ((v - ymin) / (ymax - ymin)) * L.h
      ctx.strokeStyle = GRID
      ctx.strokeRect(L.x, L.y, L.w, L.h)
      ctx.fillStyle = TXT
      ctx.font = '12px sans-serif'
      ctx.fillText('one IMEX step: stages and update', L.x, L.y - 10)
      ctx.fillText('t', L.x + L.w - 8, L.y + L.h + 16)
      ctx.fillText(`t_n=${t0.toFixed(1)}`, X(t0) - 18, L.y + L.h + 16)
      ctx.fillText('t_n+Δt', X(t0 + h) - 18, L.y + L.h + 16)
      ctx.setLineDash([3, 4])
      ctx.beginPath(); ctx.moveTo(X(t0), L.y); ctx.lineTo(X(t0), L.y + L.h)
      ctx.moveTo(X(t0 + h), L.y); ctx.lineTo(X(t0 + h), L.y + L.h); ctx.stroke()
      ctx.setLineDash([])
      // slow manifold y = phi(t)
      ctx.strokeStyle = PHI; ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 100; i++) {
        const t = tmin + ((tmax - tmin) * i) / 100
        if (i === 0) ctx.moveTo(X(t), Y(Math.sin(t))); else ctx.lineTo(X(t), Y(Math.sin(t)))
      }
      ctx.stroke()
      // y_n
      ctx.fillStyle = '#e5e7eb'
      ctx.beginPath(); ctx.arc(X(t0), Y(y0), 5, 0, 2 * Math.PI); ctx.fill()
      ctx.fillText('y_n', X(t0) + 8, Y(y0) - 6)
      const drawSet = (o: StepOut, col: string, dx: number) => {
        ctx.fillStyle = col; ctx.strokeStyle = col
        o.ts.forEach((t, i) => {
          ctx.beginPath(); ctx.arc(X(t) + dx, Y(o.Ys[i]), 4, 0, 2 * Math.PI); ctx.stroke()
        })
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(X(t0), Y(y0)); ctx.lineTo(X(t0 + h) + dx, Y(o.y1)); ctx.stroke()
        ctx.beginPath(); ctx.arc(X(t0 + h) + dx, Y(o.y1), 6, 0, 2 * Math.PI); ctx.fill()
      }
      drawSet(A, SA, -4)
      drawSet(S, NSA, 4)
      ctx.strokeStyle = PHI
      ctx.beginPath(); ctx.arc(X(t0 + h), Y(target), 9, 0, 2 * Math.PI); ctx.stroke()

      // ---- right: error at t_n+dt vs eps (sweep)
      const R = { x: 520, y: 30, w: 220, h: 380 }
      const emin = -8, emax = 0
      const PX = (lx: number) => R.x + ((lx - -6) / 6) * R.w
      const PY = (lv: number) => R.y + R.h - ((Math.max(emin, Math.min(emax, lv)) - emin) / (emax - emin)) * R.h
      ctx.strokeStyle = GRID; ctx.lineWidth = 1
      ctx.strokeRect(R.x, R.y, R.w, R.h)
      ctx.fillStyle = TXT
      ctx.fillText('|y_n+1 − φ(t_n+Δt)| vs ε', R.x, R.y - 10)
      for (let e = emin; e <= emax; e += 2) { ctx.fillText(`1e${e}`, R.x - 34, PY(e) + 4) }
      for (let e = -6; e <= 0; e += 2) { ctx.fillText(`1e${e}`, PX(e) - 12, R.y + R.h + 16) }
      const curve = (sc: Scheme, col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        for (let i = 0; i <= 60; i++) {
          const lx = -6 + (6 * i) / 60
          const o = oneStep(sc, Math.pow(10, lx), h, t0, y0)
          const v = Math.log10(Math.abs(o.y1 - target) + 1e-16)
          if (i === 0) ctx.moveTo(PX(lx), PY(v)); else ctx.lineTo(PX(lx), PY(v))
        }
        ctx.stroke()
      }
      curve(ARK2, SA); curve(SSP2, NSA)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath(); ctx.moveTo(PX(le), R.y); ctx.lineTo(PX(le), R.y + R.h); ctx.stroke()
      // legend
      ctx.fillStyle = SA; ctx.fillText('● ARK2 (SA)', L.x + 8, L.y + 18)
      ctx.fillStyle = NSA; ctx.fillText('● SSP2 (non-SA)', L.x + 8, L.y + 34)
      ctx.fillStyle = PHI; ctx.fillText('— φ(t)=sin t  ◯ target', L.x + 8, L.y + 50)
      ctx.fillStyle = TXT; ctx.fillText(`ε = ${eps.toExponential(1)}   Δt/ε = ${(h / eps).toExponential(1)}`, L.x + 8, L.y + L.h - 10)

      if (++frame % 12 === 0) {
        setRead({ eA: Math.abs(A.y1 - target), eS: Math.abs(S.y1 - target), ratio: h / eps })
        if (playing) setLogEps(Math.round(le * 100) / 100)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, h, off])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const row = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 } as const

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button style={btn(playing)} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause ε sweep' : 'Play ε sweep'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); setLogEps(-6); setH(0.6); setOff(0.15) }}>Reset</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
        <label style={row}>log₁₀ ε (≈ M²)
          <input type="range" min={-6} max={0} step={0.05} value={logEps} onChange={(e) => { setPlaying(false); setLogEps(+e.target.value) }} />
          <span>{logEps.toFixed(2)}</span></label>
        <label style={row}>Δt
          <input type="range" min={0.1} max={1} step={0.05} value={h} onChange={(e) => setH(+e.target.value)} />
          <span>{h.toFixed(2)}</span></label>
        <label style={row}>y_n off manifold
          <input type="range" min={0} max={0.4} step={0.01} value={off} onChange={(e) => setOff(+e.target.value)} />
          <span>{off.toFixed(2)}</span></label>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 10, fontSize: 13, fontFamily: 'monospace' }}>
        <span style={{ color: SA }}>ARK2 err = {read.eA.toExponential(2)}</span>
        <span style={{ color: NSA }}>SSP2 err = {read.eS.toExponential(2)}</span>
        <span>Δt/ε = {read.ratio.toExponential(1)}</span>
        <span>ratio = {(read.eS / Math.max(read.eA, 1e-16)).toFixed(1)}×</span>
      </div>
    </div>
  )
}
