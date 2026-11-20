'use client'

import { useEffect, useRef, useState } from 'react'

// Concept: uniform u and p, a density bump advected by first-order upwind.
// After the explicit convective step q* = u * rho*. The implicit enthalpy flux
// h * q* is constant (no pressure source) only when h = (rho h)^n / rho^{n+1}.
// With h = (rho h)^n / rho^n the flux carries the factor rho*/rho^n -> spurious dp.

const W = 680
const H = 420
const N = 100
const G = 1.4

function profiles(x0: number, amp: number, width: number, sigma: number) {
  const rho = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    let d = x - x0
    d -= Math.round(d)
    rho[i] = 1 + amp * Math.exp(-((d / width) ** 2))
  }
  const rs = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    rs[i] = rho[i] - sigma * (rho[i] - rho[im])
  }
  // normalized enthalpy flux at faces i+1/2: (h q*) / (g p u / (g-1))
  const fNew = new Float64Array(N)
  const fOld = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const ip = (i + 1) % N
    const qf = 0.5 * (rs[i] + rs[ip])
    fNew[i] = 0.5 * (1 / rs[i] + 1 / rs[ip]) * qf
    fOld[i] = 0.5 * (1 / rho[i] + 1 / rho[ip]) * qf
  }
  // spurious pressure source ~ -(g-1) * sigma * d(hq*)/dx-like, normalized by p
  const sNew = new Float64Array(N)
  const sOld = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    sNew[i] = -G * sigma * (fNew[i] - fNew[im])
    sOld[i] = -G * sigma * (fOld[i] - fOld[im])
  }
  return { rho, rs, fNew, fOld, sNew, sOld }
}

export function EnthalpyFluxDenominatorLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sigma, setSigma] = useState(0.9)
  const [amp, setAmp] = useState(0.2)
  const [width, setWidth] = useState(0.05)
  const [showOld, setShowOld] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [info, setInfo] = useState({ devNew: 0, devOld: 0, dpOld: 0 })
  const st = useRef({ x0: 0.3, frame: 0, step: false })

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    let raf = 0
    const css = getComputedStyle(document.documentElement)
    const dark = document.documentElement.classList.contains('dark') || css.colorScheme === 'dark'
    const fg = dark ? 'rgba(230,230,230,0.9)' : 'rgba(30,30,30,0.9)'
    const grid = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
    const BLUE = 'rgb(56,132,255)'
    const GREEN = 'rgb(30,160,90)'
    const RED = 'rgb(225,70,60)'
    const GRAY = 'rgb(140,140,140)'

    const panel = (top: number, h: number, title: string, lo: number, hi: number) => {
      const l = 60
      const r = W - 16
      ctx.strokeStyle = grid
      ctx.strokeRect(l, top, r - l, h)
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText(title, l + 6, top + 14)
      ctx.font = '10px monospace'
      ctx.fillText(hi.toPrecision(3), 4, top + 10)
      ctx.fillText(lo.toPrecision(3), 4, top + h - 2)
      return (arr: Float64Array, color: string, dash = false, shift = 0) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.setLineDash(dash ? [5, 4] : [])
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const X = l + ((i + 0.5 + shift) / N) * (r - l)
          const v = Math.max(lo, Math.min(hi, arr[i]))
          const Y = top + h - ((v - lo) / (hi - lo)) * h
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    const draw = () => {
      const s = st.current
      if (playing || s.step) {
        s.x0 = (s.x0 + 0.0025) % 1
        s.step = false
      }
      const P = profiles(s.x0, amp, width, sigma)
      ctx.clearRect(0, 0, W, H)
      const p1 = panel(8, 120, 'density: rho^n (gray dashed), rho^{n+1} = rho* (blue)', 0.95, 1 + Math.max(amp, 0.05) * 1.1)
      p1(P.rho, GRAY, true)
      p1(P.rs, BLUE)
      let devN = 0
      let devO = 0
      for (let i = 0; i < N; i++) {
        devN = Math.max(devN, Math.abs(P.fNew[i] - 1))
        devO = Math.max(devO, Math.abs(P.fOld[i] - 1))
      }
      const fr = Math.max(0.002, devO * 1.2)
      const p2 = panel(144, 120, 'face enthalpy flux h*q* / (g p u/(g-1))  — flat = no pressure source', 1 - fr, 1 + fr)
      if (showOld) p2(P.fOld, RED, false, 0.5)
      p2(P.fNew, GREEN, false, 0.5)
      let dpo = 0
      for (let i = 0; i < N; i++) dpo = Math.max(dpo, Math.abs(P.sOld[i]))
      const sr = Math.max(1e-4, dpo * 1.2)
      const p3 = panel(280, 120, 'pressure source per step  dp/p  (before implicit smoothing)', -sr, sr)
      if (showOld) p3(P.sOld, RED)
      p3(P.sNew, GREEN)
      ctx.fillStyle = fg
      ctx.font = '11px sans-serif'
      ctx.fillText('x  →  (flow direction, periodic)', W / 2 - 70, H - 4)
      s.frame++
      if (s.frame % 12 === 0) setInfo({ devNew: devN, devOld: devO, dpOld: dpo })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [sigma, amp, width, showOld, playing])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-44">material Courant u·dt/dx: {sigma.toFixed(2)}</span>
          <input type="range" min={0.05} max={1} step={0.01} value={sigma} onChange={(e) => setSigma(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44">bump amplitude: {amp.toFixed(2)}</span>
          <input type="range" min={0} max={0.8} step={0.01} value={amp} onChange={(e) => setAmp(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44">bump width: {width.toFixed(3)}</span>
          <input type="range" min={0.02} max={0.2} step={0.005} value={width} onChange={(e) => setWidth(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showOld} onChange={(e) => setShowOld(e.target.checked)} />
          <span>show h with rho^n denominator (red)</span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (st.current.step = true)}>
          Step
        </button>
        <button
          className="rounded border px-3 py-1"
          onClick={() => {
            setPlaying(false)
            st.current.x0 = 0.3
            st.current.step = true
          }}
        >
          Reset
        </button>
        <span className="font-mono">
          <span style={{ color: 'rgb(30,160,90)' }}>rho^n+1: max|flux−1| = {info.devNew.toExponential(1)}</span>
          {' · '}
          <span style={{ color: 'rgb(225,70,60)' }}>
            rho^n: max|flux−1| = {info.devOld.toExponential(2)}, max dp/p = {info.dpOld.toExponential(2)}
          </span>
        </span>
      </div>
    </div>
  )
}

export default EnthalpyFluxDenominatorLab
