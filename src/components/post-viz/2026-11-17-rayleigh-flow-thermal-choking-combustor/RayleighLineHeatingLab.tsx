'use client'

import { useEffect, useRef, useState } from 'react'

// Rayleigh line (frictionless, constant-area duct, heat added/removed) on a T–s diagram.
// The state point moves along the line as stagnation temperature T0 changes.
// Heating always pushes M toward 1; between M = 1/sqrt(g) and 1 heating LOWERS static T.

const W = 680
const H = 400
const G = 1.4
const PAD = { l: 58, r: 20, t: 20, b: 46 }
const M_T_MAX = 1 / Math.sqrt(G)
const T0_SUP_MIN = (G * G - 1) / (G * G) // T0/T0* as M -> infinity

const t0Star = (M: number) => {
  const m2 = M * M
  return (2 * (G + 1) * m2 * (1 + 0.5 * (G - 1) * m2)) / (1 + G * m2) ** 2
}
const tStar = (M: number) => ((1 + G) / (1 + G * M * M)) ** 2 * M * M
const pStar = (M: number) => (1 + G) / (1 + G * M * M)
const p0Star = (M: number) =>
  (2 / (G + 1)) ** (G / (G - 1)) * pStar(M) * (1 + 0.5 * (G - 1) * M * M) ** (G / (G - 1))
// entropy relative to the sonic point, in units of cp
const sStar = (M: number) => Math.log(tStar(M)) - ((G - 1) / G) * Math.log(pStar(M))

// invert T0/T0* on one branch (subsonic: increasing in M, supersonic: decreasing)
function machFromT0(target: number, sup: boolean) {
  if (target >= 1) return 1
  let lo = sup ? 1 : 1e-5
  let hi = sup ? 60 : 1
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    const f = t0Star(mid)
    if (sup ? f > target : f < target) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

// axes
const S_MIN = -1.6
const S_MAX = 0.05
const T_MAX_AX = 1.12
const sx = (s: number) => PAD.l + ((s - S_MIN) / (S_MAX - S_MIN)) * (W - PAD.l - PAD.r)
const ty = (t: number) => H - PAD.b - (t / T_MAX_AX) * (H - PAD.t - PAD.b)

export function RayleighLineHeatingLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [m1, setM1] = useState(0.6)
  const [q, setQ] = useState(0.6) // ΔT0 / T01
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ M: 0.6, T: 1, p0: 1, frac: 0, choked: false })
  const st = useRef({ frac: 0, playing: true })

  useEffect(() => {
    st.current.frac = 0
  }, [m1, q])
  useEffect(() => {
    st.current.playing = playing
  }, [playing])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    const sup = m1 > 1
    const t01s = t0Star(m1)
    let raf = 0
    let frame = 0

    const draw = () => {
      const s = st.current
      if (s.playing) {
        s.frac += 0.006
        if (s.frac > 1.35) s.frac = 0 // hold at end briefly, then repeat
      }
      const f = Math.min(1, s.frac)
      // target T0/T0* after fraction f of the heat
      let target = t01s * (1 + q * f)
      let choked = false
      if (target >= 1) {
        target = 1
        choked = true
      }
      if (sup && target <= T0_SUP_MIN) target = T0_SUP_MIN + 1e-6
      const M = machFromT0(target, sup)
      // how much of the heat fits before M = 1
      const fitFrac = q > 0 ? Math.min(1, (1 / t01s - 1) / q) : 1

      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px system-ui, sans-serif'
      // grid & axes
      ctx.strokeStyle = 'rgba(128,128,128,0.25)'
      ctx.lineWidth = 1
      ctx.fillStyle = 'rgba(128,128,128,1)'
      for (let t = 0; t <= 1.0001; t += 0.2) {
        ctx.beginPath()
        ctx.moveTo(PAD.l, ty(t))
        ctx.lineTo(W - PAD.r, ty(t))
        ctx.stroke()
        ctx.fillText(t.toFixed(1), PAD.l - 28, ty(t) + 4)
      }
      for (let sv = -1.6; sv <= 0.001; sv += 0.4) {
        ctx.fillText(sv.toFixed(1), sx(sv) - 10, H - PAD.b + 16)
      }
      ctx.fillText('(s − s*) / cp', W / 2 - 30, H - 10)
      ctx.save()
      ctx.translate(14, H / 2 + 20)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('T / T*', 0, 0)
      ctx.restore()

      // Rayleigh line: subsonic (blue), supersonic (purple); "heating cools" segment (orange)
      const branch = (a: number, b: number, color: string, n = 300, lw = 2) => {
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.beginPath()
        for (let i = 0; i <= n; i++) {
          const Mi = a * Math.pow(b / a, i / n)
          const x = sx(sStar(Mi))
          const y = ty(tStar(Mi))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      branch(0.08, M_T_MAX, 'rgba(56,132,255,1)')
      branch(M_T_MAX, 1, 'rgba(251,140,36,1)', 100, 4)
      branch(1, 4, 'rgba(160,90,220,1)')

      // markers
      const mark = (Mi: number, label: string, dx: number, dy: number) => {
        ctx.fillStyle = 'rgba(128,128,128,1)'
        ctx.beginPath()
        ctx.arc(sx(sStar(Mi)), ty(tStar(Mi)), 3, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillText(label, sx(sStar(Mi)) + dx, ty(tStar(Mi)) + dy)
      }
      mark(M_T_MAX, 'M = 1/√γ (T max)', -110, -8)
      mark(1, 'M = 1 (s max)', 6, 4)

      // inlet point and path traveled
      ctx.strokeStyle = choked ? 'rgba(230,60,60,0.9)' : 'rgba(34,170,90,0.9)'
      ctx.lineWidth = 5
      ctx.beginPath()
      const nPath = 80
      for (let i = 0; i <= nPath; i++) {
        const tg = Math.max(sup ? T0_SUP_MIN + 1e-6 : 0, Math.min(1, t01s * (1 + (q * f * i) / nPath)))
        const Mi = machFromT0(tg, sup)
        const x = sx(sStar(Mi))
        const y = ty(tStar(Mi))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = 'rgba(128,128,128,1)'
      ctx.beginPath()
      ctx.arc(sx(sStar(m1)), ty(tStar(m1)), 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = choked ? 'rgba(230,60,60,1)' : 'rgba(34,170,90,1)'
      ctx.beginPath()
      ctx.arc(sx(sStar(M)), ty(tStar(M)), 7, 0, 2 * Math.PI)
      ctx.fill()

      // legend
      ctx.font = '12px system-ui, sans-serif'
      const lg = [
        ['rgba(56,132,255,1)', 'subsonic: heating raises T'],
        ['rgba(251,140,36,1)', '0.845 < M < 1: heating LOWERS T'],
        ['rgba(160,90,220,1)', 'supersonic branch'],
      ]
      lg.forEach(([c, t], i) => {
        ctx.fillStyle = c
        ctx.fillRect(PAD.l + 10, PAD.t + 8 + i * 17, 14, 4)
        ctx.fillStyle = 'rgba(128,128,128,1)'
        ctx.fillText(t, PAD.l + 30, PAD.t + 13 + i * 17)
      })
      if (choked) {
        ctx.fillStyle = 'rgba(230,60,60,1)'
        ctx.font = 'bold 13px system-ui, sans-serif'
        ctx.fillText(`THERMALLY CHOKED — only ${(fitFrac * 100).toFixed(0)}% of the heat fits`, PAD.l + 10, PAD.t + 70)
      }

      if (++frame % 12 === 0) {
        setRead({
          M,
          T: tStar(M) / tStar(m1),
          p0: p0Star(M) / p0Star(m1),
          frac: f,
          choked,
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [m1, q])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28">inlet M₁: {m1.toFixed(2)}</span>
          <input type="range" min={0.1} max={3} step={0.05} value={m1} onChange={(e) => setM1(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">ΔT₀/T₀₁: {q.toFixed(2)}</span>
          <input type="range" min={-0.5} max={2} step={0.05} value={q} onChange={(e) => setQ(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (st.current.frac = 0)}>
          Reset
        </button>
        <span className="font-mono text-xs">
          heat added {(read.frac * 100).toFixed(0)}% · M = {read.M.toFixed(3)} · T/T₁ = {read.T.toFixed(3)} · p₀/p₀₁ ={' '}
          {read.p0.toFixed(3)}
          {read.choked ? ' · CHOKED' : ''}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Negative ΔT₀ = cooling (moves M away from 1). Try M₁ = 0.6 with ΔT₀/T₀₁ = 0.3: the dot crosses the orange
        segment and static temperature falls while heat is still being added.
      </p>
    </div>
  )
}
