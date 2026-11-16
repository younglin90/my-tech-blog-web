'use client'

import { useEffect, useRef, useState } from 'react'

// Reproduces the post's Python heat_march(): uniform heat release along a frictionless
// constant-area combustor, T0 rises from 1 to tau over x in [0,1]. dM^2/dT0 is integrated
// with RK4 (n = 4000 steps). Two inlet Mach numbers march side by side.
// Readouts: M, T/T1, stagnation-pressure loss, thermal-choke position.

const W = 680
const H = 430
const G = 1.4
const N = 4000
const PAD = { l: 52, r: 16, t: 16, b: 34 }
const COLORS = ['rgba(56,132,255,1)', 'rgba(251,140,36,1)']

const t0Star = (M: number) => {
  const m2 = M * M
  return (2 * (G + 1) * m2 * (1 + 0.5 * (G - 1) * m2)) / (1 + G * m2) ** 2
}
const f = (m2: number, t0: number) => (m2 * (1 + G * m2) * (1 + 0.5 * (G - 1) * m2)) / (1 - m2) / t0

function m1Max(tau: number) {
  let lo = 1e-4
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (t0Star(mid) < 1 / tau) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

function ratios(M: number, M1: number) {
  const p = (1 + G * M1 * M1) / (1 + G * M * M)
  const T = ((p * M) / M1) ** 2
  const p0 = p * ((1 + 0.5 * (G - 1) * M * M) / (1 + 0.5 * (G - 1) * M1 * M1)) ** (G / (G - 1))
  return { p, T, p0 }
}

type Case = { M1: number; m2: number; t0: number; i: number; xs: number[]; Ms: number[]; Ts: number[]; p0s: number[]; choke: number | null; tmax: number; xtmax: number }

function newCase(M1: number): Case {
  return { M1, m2: M1 * M1, t0: 1, i: 0, xs: [0], Ms: [M1], Ts: [1], p0s: [1], choke: null, tmax: 1, xtmax: 0 }
}

function advance(c: Case, tau: number, steps: number) {
  const h = (tau - 1) / N
  for (let s = 0; s < steps; s++) {
    if (c.choke !== null || c.i >= N) return
    const { m2, t0 } = c
    const k1 = f(m2, t0)
    const k2 = f(m2 + 0.5 * h * k1, t0 + 0.5 * h)
    const k3 = f(m2 + 0.5 * h * k2, t0 + 0.5 * h)
    const k4 = f(m2 + h * k3, t0 + h)
    const m2n = m2 + (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6
    c.i++
    c.t0 += h
    if (!(m2n > 0 && m2n < 1) || m2n > 0.9999) {
      c.choke = c.i / N
      return
    }
    c.m2 = m2n
    if (c.i % 20 === 0 || c.i === N) {
      const M = Math.sqrt(m2n)
      const r = ratios(M, c.M1)
      c.xs.push(c.i / N)
      c.Ms.push(M)
      c.Ts.push(r.T)
      c.p0s.push(r.p0)
      if (r.T > c.tmax) {
        c.tmax = r.T
        c.xtmax = c.i / N
      }
    }
  }
}

export function CombustorThermalChokeMarch() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [m1a, setM1a] = useState(0.3)
  const [m1b, setM1b] = useState(0.4)
  const [tau, setTau] = useState(2.0)
  const [speed, setSpeed] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState<{ x: number; M: number; T: number; loss: number; tmax: number; choke: number | null }[]>([])
  const sim = useRef<{ cases: Case[]; playing: boolean; step: boolean; speed: number }>({ cases: [], playing: true, step: false, speed: 20 })

  const reset = () => {
    sim.current.cases = [newCase(m1a), newCase(m1b)]
  }
  useEffect(reset, [m1a, m1b, tau]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    sim.current.playing = playing
  }, [playing])
  useEffect(() => {
    sim.current.speed = speed
  }, [speed])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    const mmax = m1Max(tau)
    let raf = 0
    let frame = 0
    // two stacked panels: top M(x), bottom T/T1 (solid) and p0/p01 (dashed)
    const panelH = (H - PAD.t - PAD.b - 30) / 2
    const top = PAD.t
    const bot = PAD.t + panelH + 30
    const X = (x: number) => PAD.l + x * (W - PAD.l - PAD.r)
    const Ytop = (m: number) => top + panelH - m * panelH
    const tHi = Math.max(2.2, tau + 0.2)
    const Ybot = (v: number) => bot + panelH - ((v - 0.6) / (tHi - 0.6)) * panelH

    const axes = (y0: number, ticks: number[], Y: (v: number) => number, label: string) => {
      ctx.strokeStyle = 'rgba(128,128,128,0.25)'
      ctx.fillStyle = 'rgba(128,128,128,1)'
      ctx.lineWidth = 1
      for (const t of ticks) {
        ctx.beginPath()
        ctx.moveTo(PAD.l, Y(t))
        ctx.lineTo(W - PAD.r, Y(t))
        ctx.stroke()
        ctx.fillText(t.toFixed(1), PAD.l - 26, Y(t) + 4)
      }
      ctx.strokeStyle = 'rgba(128,128,128,0.6)'
      ctx.strokeRect(PAD.l, y0, W - PAD.l - PAD.r, panelH)
      ctx.save()
      ctx.translate(12, y0 + panelH / 2 + 24)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    }

    const line = (xs: number[], ys: number[], Y: (v: number) => number, color: string, dash: number[] = []) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash(dash)
      ctx.beginPath()
      xs.forEach((x, k) => (k ? ctx.lineTo(X(x), Y(ys[k])) : ctx.moveTo(X(x), Y(ys[k]))))
      ctx.stroke()
      ctx.setLineDash([])
    }

    const draw = () => {
      const s = sim.current
      if (s.playing || s.step) {
        s.cases.forEach((c) => advance(c, tau, s.step ? 20 : s.speed))
        s.step = false
      }
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px system-ui, sans-serif'
      axes(top, [0, 0.2, 0.4, 0.6, 0.8, 1.0], Ytop, 'Mach M')
      const bt: number[] = []
      for (let v = 0.6; v <= tHi + 1e-9; v += 0.4) bt.push(v)
      axes(bot, bt, Ybot, 'T/T₁ , p₀/p₀₁')
      ctx.fillStyle = 'rgba(128,128,128,1)'
      ctx.fillText('x / L  (heat released uniformly along the duct)', W / 2 - 110, H - 8)
      for (let x = 0; x <= 1.0001; x += 0.25) ctx.fillText(x.toFixed(2), X(x) - 10, H - PAD.b + 14)
      // M = 1 and M = 1/sqrt(g) reference lines
      ctx.strokeStyle = 'rgba(230,60,60,0.7)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(PAD.l, Ytop(1))
      ctx.lineTo(W - PAD.r, Ytop(1))
      ctx.stroke()
      ctx.strokeStyle = 'rgba(128,128,128,0.7)'
      ctx.beginPath()
      ctx.moveTo(PAD.l, Ytop(1 / Math.sqrt(G)))
      ctx.lineTo(W - PAD.r, Ytop(1 / Math.sqrt(G)))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(128,128,128,1)'
      ctx.fillText('M = 1/√γ: T peaks here', W - PAD.r - 140, Ytop(1 / Math.sqrt(G)) + 13)

      s.cases.forEach((c, k) => {
        line(c.xs, c.Ms, Ytop, COLORS[k])
        line(c.xs, c.Ts, Ybot, COLORS[k])
        line(c.xs, c.p0s, Ybot, COLORS[k], [6, 4])
        if (c.choke !== null) {
          ctx.strokeStyle = COLORS[k]
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(X(c.choke), top)
          ctx.lineTo(X(c.choke), bot + panelH)
          ctx.stroke()
          ctx.fillStyle = 'rgba(230,60,60,1)'
          ctx.font = 'bold 12px system-ui, sans-serif'
          ctx.fillText(`choked at x = ${c.choke.toFixed(3)}`, X(c.choke) - 130, top + 14 + 16 * k)
          ctx.font = '11px system-ui, sans-serif'
        }
      })
      // legend
      ctx.font = '12px system-ui, sans-serif'
      ;['A', 'B'].forEach((n, k) => {
        ctx.fillStyle = COLORS[k]
        ctx.fillRect(PAD.l + 10, bot + 8 + 16 * k, 14, 4)
        ctx.fillStyle = 'rgba(128,128,128,1)'
        ctx.fillText(`case ${n}: M₁ = ${s.cases[k]?.M1.toFixed(2)}   (solid T/T₁, dashed p₀/p₀₁)`, PAD.l + 30, bot + 13 + 16 * k)
      })
      ctx.fillText(`closed-form M₁,max(τ = ${tau.toFixed(2)}) = ${mmax.toFixed(4)}`, PAD.l + 10, top + panelH - 8)

      if (++frame % 12 === 0) {
        setRead(
          s.cases.map((c) => {
            const M = Math.sqrt(c.m2)
            const r = ratios(M, c.M1)
            return { x: c.i / N, M, T: r.T, loss: 100 * (1 - r.p0), tmax: c.tmax, choke: c.choke }
          }),
        )
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [tau])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28">case A M₁: {m1a.toFixed(2)}</span>
          <input type="range" min={0.05} max={0.6} step={0.01} value={m1a} onChange={(e) => setM1a(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">case B M₁: {m1b.toFixed(2)}</span>
          <input type="range" min={0.05} max={0.6} step={0.01} value={m1b} onChange={(e) => setM1b(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">τ = T₀₂/T₀₁: {tau.toFixed(2)}</span>
          <input type="range" min={1.1} max={3.5} step={0.05} value={tau} onChange={(e) => setTau(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">RK4 steps/frame: {speed}</span>
          <input type="range" min={1} max={100} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (sim.current.step = true)}>
          Step
        </button>
        <button className="rounded border px-3 py-1" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-2">
        {read.map((r, k) => (
          <div key={k} style={{ color: COLORS[k] }}>
            {k ? 'B' : 'A'}: x={r.x.toFixed(3)} M={r.M.toFixed(4)} T/T₁={r.T.toFixed(3)} p₀ loss={r.loss.toFixed(2)}% T_max={r.tmax.toFixed(3)}
            {r.choke !== null ? ` CHOKED @ x=${r.choke.toFixed(3)}` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
