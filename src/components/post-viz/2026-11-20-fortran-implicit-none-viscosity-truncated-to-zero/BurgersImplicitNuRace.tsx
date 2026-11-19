'use client'

import { useEffect, useRef, useState } from 'react'

const W = 680
const H1 = 230
const H2 = 150
const COL = { r: '#2563eb', i: '#ef4444' }
type Run = { u: number[]; n: number; blow: number | null; hist: number[] }

// Reproduces burgers_central(): periodic [0, 2π), central convection + central diffusion, forward Euler.
const init = (nx: number): Run => {
  const dx = (2 * Math.PI) / nx
  return { u: Array.from({ length: nx }, (_, i) => 1 + 0.5 * Math.sin(i * dx)), n: 0, blow: null, hist: [] }
}
const step = (r: Run, nu: number, dx: number, dt: number) => {
  if (r.blow !== null) return
  const u = r.u, nx = u.length
  const v = new Array<number>(nx)
  let amax = 0
  for (let i = 0; i < nx; i++) {
    const up = u[(i + 1) % nx], um = u[(i - 1 + nx) % nx]
    v[i] = u[i] - (dt * u[i] * (up - um)) / (2 * dx) + (nu * dt * (up - 2 * u[i] + um)) / (dx * dx)
    amax = Math.max(amax, Math.abs(v[i]))
  }
  r.u = v
  r.n++
  r.hist.push(amax)
  if (!isFinite(amax) || amax > 10) r.blow = r.n
}

export function BurgersImplicitNuRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [nu, setNu] = useState(0.07)
  const [nx, setNx] = useState(100)
  const [cfl, setCfl] = useState(0.2)
  const [spf, setSpf] = useState(4)
  const [varName, setVarName] = useState<'nu' | 'visc'>('nu')
  const [playing, setPlaying] = useState(false)
  const [read, setRead] = useState({ n: 0, t: 0, ar: 1.5, ai: 1.5, br: '-', bi: '-' })
  const stored = varName === 'nu' ? Math.trunc(nu) : nu
  const sim = useRef({ r: init(100), i: init(100), playing: false, step: false })
  sim.current.playing = playing
  const dx = (2 * Math.PI) / nx
  const dt = (cfl * dx) / 1.5
  const steps = 2000

  const reset = () => {
    sim.current.r = init(nx)
    sim.current.i = init(nx)
    setRead({ n: 0, t: 0, ar: 1.5, ai: 1.5, br: '-', bi: '-' })
  }
  useEffect(reset, [nu, nx, cfl, varName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let raf = 0, frame = 0
    const loop = () => {
      const s = sim.current
      const k = s.step ? 1 : s.playing ? spf : 0
      s.step = false
      for (let j = 0; j < k && s.r.n < steps; j++) {
        step(s.r, nu, dx, dt)
        step(s.i, stored, dx, dt)
      }
      const dark = document.documentElement.classList.contains('dark')
      const fg = dark ? '#e5e7eb' : '#111827'
      const mut = dark ? '#4b5563' : '#d1d5db'
      ctx.clearRect(0, 0, W, H1 + H2)
      ctx.font = '12px monospace'
      // panel 1: u(x)
      const L = 50, R = W - 15, T = 15, B = H1 - 25
      const ymin = -0.5, ymax = 3
      const Y = (u: number) => B - ((Math.max(ymin, Math.min(ymax, u)) - ymin) / (ymax - ymin)) * (B - T)
      const X = (i: number, n: number) => L + (i / n) * (R - L)
      ctx.strokeStyle = mut; ctx.lineWidth = 1
      ctx.strokeRect(L, T, R - L, B - T)
      for (const g of [0, 1, 2, 3]) { ctx.beginPath(); ctx.moveTo(L, Y(g)); ctx.lineTo(R, Y(g)); ctx.stroke(); ctx.fillStyle = fg; ctx.fillText(String(g), L - 18, Y(g) + 4) }
      ctx.fillText('u(x)', 6, T + 10)
      ctx.fillText('x: 0 → 2π (periodic)', R - 150, H1 - 8)
      const curve = (r: Run, c: string, w: number) => {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath()
        r.u.forEach((u, i) => (i ? ctx.lineTo(X(i, r.u.length), Y(u)) : ctx.moveTo(X(i, r.u.length), Y(u))))
        ctx.stroke()
      }
      curve(s.i, COL.i, 1.5)
      curve(s.r, COL.r, 2.5)
      ctx.fillStyle = COL.r; ctx.fillText(`REAL ν = ${nu.toFixed(3)}`, L + 8, T + 16)
      ctx.fillStyle = COL.i; ctx.fillText(`${varName === 'nu' ? 'implicit INTEGER' : 'REAL visc'} ν = ${stored}`, L + 8, T + 32)
      // panel 2: max|u| history (log)
      const T2 = H1 + 10, B2 = H1 + H2 - 22
      const lmin = Math.log10(0.8), lmax = Math.log10(12)
      const Y2 = (a: number) => B2 - ((Math.log10(Math.max(0.8, Math.min(12, a))) - lmin) / (lmax - lmin)) * (B2 - T2)
      const X2 = (n: number) => L + (n / steps) * (R - L)
      ctx.strokeStyle = mut; ctx.strokeRect(L, T2, R - L, B2 - T2)
      for (const g of [1, 2, 5, 10]) { ctx.fillStyle = fg; ctx.fillText(String(g), L - 22, Y2(g) + 4) }
      ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(L, Y2(10)); ctx.lineTo(R, Y2(10)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = fg
      ctx.fillText('max|u| (log)', 6, T2 - 2 + 12)
      ctx.fillText(`step 0 → ${steps}`, R - 110, H1 + H2 - 6)
      const hist = (r: Run, c: string) => {
        ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath()
        r.hist.forEach((a, n) => (n ? ctx.lineTo(X2(n + 1), Y2(a)) : ctx.moveTo(X2(1), Y2(a))))
        ctx.stroke()
      }
      hist(s.i, COL.i)
      hist(s.r, COL.r)
      if (++frame % 12 === 0 || k === 1) {
        const last = (r: Run) => r.hist.length ? r.hist[r.hist.length - 1] : 1.5
        setRead({ n: s.r.n, t: s.r.n * dt, ar: last(s.r), ai: last(s.i), br: s.r.blow === null ? '-' : String(s.r.blow), bi: s.i.blow === null ? '-' : String(s.i.blow) })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [nu, stored, dx, dt, spf, varName])

  const reCell = (1.5 * dx) / nu
  const dnum = (nu * dt) / (dx * dx)
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={ref} width={W} height={H1 + H2} className="w-full" />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28">ν: {nu.toFixed(3)}</span>
          <input type="range" min={0.01} max={0.2} step={0.005} value={nu} onChange={(e) => setNu(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">nx: {nx}</span>
          <input type="range" min={40} max={100} step={10} value={nx} onChange={(e) => setNx(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">CFL: {cfl.toFixed(2)}</span>
          <input type="range" min={0.05} max={0.4} step={0.05} value={cfl} onChange={(e) => setCfl(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">speed: {spf}/frame</span>
          <input type="range" min={1} max={20} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="rounded border px-3 py-1" onClick={() => { setPlaying(false); sim.current.step = true }}>Step</button>
        <button className="rounded border px-3 py-1" onClick={() => { setPlaying(false); reset() }}>Reset</button>
        <span>variable name:</span>
        {(['nu', 'visc'] as const).map((n) => (
          <button key={n} className={`rounded border px-2 py-1 font-mono ${varName === n ? 'border-amber-500 text-amber-600' : ''}`} onClick={() => setVarName(n)}>{n}</button>
        ))}
      </div>
      <div className="mt-2 font-mono text-xs">
        step {read.n} · t = {read.t.toFixed(3)} · dt = {dt.toFixed(5)} · Re_cell = {reCell.toFixed(2)} · ν·dt/dx² = {dnum.toFixed(3)}
        <br />
        <span style={{ color: COL.r }}>REAL: max|u| = {read.ar.toPrecision(4)}, blow-up step {read.br}</span>
        {' · '}
        <span style={{ color: COL.i }}>stored ν={stored}: max|u| = {read.ai.toPrecision(4)}, blow-up step {read.bi}</span>
      </div>
      <p className="mt-2 text-xs text-gray-500">Blow-up = max|u| &gt; 10 (dashed line). Default should hit step 465 (t ≈ 3.896) for the truncated ν.</p>
    </div>
  )
}
