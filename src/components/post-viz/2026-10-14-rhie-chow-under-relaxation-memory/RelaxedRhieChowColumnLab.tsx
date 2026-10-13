'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const W = 760
const H = 380
const N = 40

type Sim = { p: number[]; u: number[]; uf: number[]; it: number; res: number }

function density(ratio: number) {
  return Array.from({ length: N }, (_, i) => ((i + 0.5) / N < 0.5 ? ratio : 1))
}

function cellGrad(p: number[], h: number) {
  const pf = new Array(N + 1)
  pf[0] = 1.5 * p[0] - 0.5 * p[1]
  for (let i = 0; i < N - 1; i++) pf[i + 1] = 0.5 * (p[i] + p[i + 1])
  pf[N] = 1.5 * p[N - 1] - 0.5 * p[N - 2]
  return Array.from({ length: N }, (_, i) => (pf[i + 1] - pf[i]) / h)
}

function fresh(): Sim {
  return { p: new Array(N).fill(0), u: new Array(N).fill(0), uf: new Array(N + 1).fill(0), it: 0, res: 1 }
}

// one SIMPLE outer iteration on the 1D hydrostatic column (a_P = 1, V = 1)
function step(s: Sim, alpha: number, mj: number, f: number[]) {
  const h = 1 / N
  const d = alpha
  const gp = cellGrad(s.p, h)
  const us = s.u.map((ui, i) => alpha * (f[i] - gp[i]) + (1 - alpha) * ui)
  const uh = us.map((v, i) => v + d * gp[i] - mj * (1 - alpha) * s.u[i])
  const ufs = new Array(N + 1).fill(0)
  for (let i = 1; i < N; i++) {
    ufs[i] = 0.5 * (uh[i - 1] + uh[i]) - (d * (s.p[i] - s.p[i - 1])) / h + mj * (1 - alpha) * s.uf[i]
  }
  const pc = new Array(N).fill(0)
  for (let i = 1; i < N; i++) pc[i] = pc[i - 1] + (h * ufs[i]) / d
  const gc = cellGrad(pc, h)
  const un = us.map((v, i) => v - d * gc[i])
  let res = 0
  for (let i = 0; i < N; i++) res = Math.max(res, Math.abs(un[i] - s.u[i]))
  s.p = s.p.map((v, i) => v + pc[i])
  s.u = un
  s.uf = new Array(N + 1).fill(0)
  s.it += 1
  s.res = res
}

function converge(alpha: number, mj: number, f: number[]) {
  const s = fresh()
  for (let k = 0; k < 4000; k++) {
    step(s, alpha, mj, f)
    if (s.res < 1e-12 && s.it > 5) break
  }
  return s
}

export function RelaxedRhieChowColumnLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [alpha, setAlpha] = useState(0.3)
  const [majumdar, setMajumdar] = useState(false)
  const [ratio, setRatio] = useState(10)
  const [speed, setSpeed] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ it: 0, res: 1, peak: 0, wide: 0, dp: 0 })
  const sim = useRef<Sim>(fresh())
  const cfg = useRef({ alpha, mj: 0, speed, playing, f: density(ratio).map((r) => -r), ref: converge(1, 0, density(ratio).map((r) => -r)) })

  useEffect(() => {
    const f = density(ratio).map((r) => -r)
    cfg.current = { alpha, mj: majumdar ? 1 : 0, speed, playing, f, ref: converge(1, 0, f) }
  }, [alpha, majumdar, ratio, speed, playing])

  const reset = useCallback(() => { sim.current = fresh() }, [])
  useEffect(() => { reset() }, [alpha, majumdar, ratio, reset])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const draw = () => {
      const c = cfg.current
      const s = sim.current
      if (c.playing && !(s.res < 1e-12 && s.it > 5)) {
        for (let k = 0; k < c.speed; k++) step(s, c.alpha, c.mj, c.f)
      }
      const r = c.ref
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      // density strip
      const x0 = 70, x1 = W - 20, bw = (x1 - x0) / N
      for (let i = 0; i < N; i++) {
        const heavy = -c.f[i] > 1
        ctx.fillStyle = heavy ? '#1e3a8a' : '#1e293b'
        ctx.fillRect(x0 + i * bw, 18, bw - 1, 18)
      }
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('rho', 30, 31)
      ctx.fillText(`heavy (rho=${(-c.f[0]).toFixed(0)})  |  light (rho=1)     gravity: ← (toward x=0)`, x0 + 4, 52)

      // velocity panel
      const top = 70, bot = 250, mid = (top + bot) / 2
      const umax = 0.25 * Math.max(1, -c.f[0] - 1) + 0.3
      const sy = (bot - top) / 2 / umax
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.stroke()
      ctx.strokeRect(x0, top, x1 - x0, bot - top)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('u_P', 30, mid + 4)
      ctx.fillText(`+${umax.toFixed(2)}`, 18, top + 10)
      ctx.fillText(`-${umax.toFixed(2)}`, 18, bot)
      let peak = 0, wide = 0, dp = 0
      for (let i = 0; i < N; i++) {
        const v = s.u[i]
        peak = Math.max(peak, Math.abs(v))
        if (Math.abs(v) > 0.01) wide++
        dp = Math.max(dp, Math.abs(s.p[i] - r.p[i]))
        const hpx = Math.max(-mid + top, Math.min(bot - mid, -v * sy))
        ctx.fillStyle = v >= 0 ? '#f87171' : '#60a5fa'
        ctx.fillRect(x0 + i * bw + 1, Math.min(mid, mid + hpx), bw - 3, Math.abs(hpx))
        // alpha = 1 reference ghost
        const gy = mid - r.u[i] * sy
        ctx.strokeStyle = '#fbbf24'
        ctx.beginPath(); ctx.moveTo(x0 + i * bw, gy); ctx.lineTo(x0 + (i + 1) * bw - 2, gy); ctx.stroke()
      }

      // pressure deviation panel
      const pt = 270, pb = 350
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.strokeRect(x0, pt, x1 - x0, pb - pt)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('p-p(a=1)', 4, (pt + pb) / 2 + 4)
      const ps = (pb - pt) / 2 / 0.05
      ctx.strokeStyle = '#34d399'
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const y = (pt + pb) / 2 - Math.max(-0.05, Math.min(0.05, s.p[i] - s.p[0] - (r.p[i] - r.p[0]))) * ps
        const x = x0 + (i + 0.5) * bw
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('±0.05', x1 - 50, pt + 12)
      ctx.fillText('bars: current u_P (red +, blue -)   yellow ticks: converged u_P at alpha = 1', x0, H - 10)

      if (++frame % 12 === 0) setRead({ it: s.it, res: s.res, peak, wide, dp })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.45)',
    background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  }
  const conv = read.res < 1e-12 && read.it > 5

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <label>alpha_u = {alpha.toFixed(2)}{' '}
          <input type="range" min={0.05} max={1} step={0.05} value={alpha} onChange={(e) => setAlpha(+e.target.value)} />
        </label>
        <label>density ratio = {ratio}{' '}
          <input type="range" min={1} max={20} step={1} value={ratio} onChange={(e) => setRatio(+e.target.value)} />
        </label>
        <label>iters/frame = {speed}{' '}
          <input type="range" min={1} max={20} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={{ ...btn, borderColor: majumdar ? '#34d399' : '#f87171' }} onClick={() => setMajumdar((m) => !m)}>
          face velocity: {majumdar ? 'Majumdar (keeps u_f^old)' : 'standard (interpolates u_P^old)'}
        </button>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? 'pause' : 'play'}</button>
        <button style={btn} onClick={reset}>restart SIMPLE</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <span style={{ color: conv ? '#34d399' : '#fbbf24' }}>{conv ? 'converged' : 'iterating'}</span>
        {' '}| iter = {read.it} | residual = {read.res.toExponential(1)} | peak |u_P| = {read.peak.toFixed(4)}
        {' '}| cells |u|&gt;0.01 = {read.wide} | max |p-p(a=1)| = {read.dp.toExponential(2)}
      </div>
    </div>
  )
}
