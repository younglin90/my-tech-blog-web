'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 480
const KAPPA = 1 / 3
const MAX_PERIODS = 5
const KEYS = ['up', 'mp', 'bj', 'cmp'] as const
type Key = typeof KEYS[number]
const COL: Record<Key, string> = { up: '#94a3b8', mp: '#38bdf8', bj: '#22c55e', cmp: '#f97316' }

type Run = { step: Float64Array; wave: Float64Array; mix: number[]; err: number[] }

// right-face value of every cell, eq. (3.9)-(3.10); beta<=0 -> first order
function faces(z: Float64Array, out: Float64Array, beta: number, midpoint: boolean) {
  const N = z.length
  for (let i = 0; i < N; i++) {
    const zi = z[i], zm = z[(i - 1 + N) % N], zp = z[(i + 1) % N]
    if (beta <= 0) { out[i] = zi; continue }
    const g = 0.5 * (zp - zm)
    const dR = 0.5 * KAPPA * (zp - zi) + (1 - KAPPA) * 0.5 * g
    const dL = 0.5 * KAPPA * (zm - zi) - (1 - KAPPA) * 0.5 * g
    const bl = midpoint ? 0.5 * (zi + zm) : zm
    const br = midpoint ? 0.5 * (zi + zp) : zp
    const zmin = Math.min(zi, bl, br), zmax = Math.max(zi, bl, br)
    const dmax = Math.max(Math.abs(dL), Math.abs(dR))
    const phi = dmax > 0 ? Math.min(beta, (zi - zmin) / dmax, (zmax - zi) / dmax) : 0
    out[i] = zi + phi * dR
  }
}

// one Heun step of z_t + z_x = 0, same as the Python advect()
function heun(z: Float64Array, beta: number, mp: boolean, lam: number, f: Float64Array, z1: Float64Array) {
  const N = z.length
  faces(z, f, beta, mp)
  for (let i = 0; i < N; i++) z1[i] = z[i] - lam * (f[i] - f[(i - 1 + N) % N])
  faces(z1, f, beta, mp)
  for (let i = 0; i < N; i++) z[i] = 0.5 * (z[i] + z1[i] - lam * (f[i] - f[(i - 1 + N) % N]))
}

const exactStep = (x: number) => (x > 0.3 && x < 0.7 ? 1 : 0)
const exactWave = (x: number) => 0.5 + 0.5 * Math.sin(2 * Math.PI * x)

export function AdvectionBetaRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [beta, setBeta] = useState(2)
  const [N, setN] = useState(100)
  const [cfl, setCfl] = useState(0.4)
  const [spf, setSpf] = useState(4)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<{ t: number; mix: Record<Key, number>; err: Record<Key, number> }>({
    t: 0, mix: { up: 0, mp: 0, bj: 0, cmp: 0 }, err: { up: 0, mp: 0, bj: 0, cmp: 0 },
  })
  const adv = useRef<(k: number) => void>(() => {})
  // playing / spf are read through refs so toggling them does not restart the run
  const playRef = useRef(playing), spfRef = useRef(spf)
  playRef.current = playing; spfRef.current = spf

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const h = 1 / N, dt = cfl * h, nPer = Math.round(1 / dt)
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) * h)
    const s0 = Float64Array.from(xs, exactStep), w0 = Float64Array.from(xs, exactWave)
    const runs = {} as Record<Key, Run>
    for (const k of KEYS) runs[k] = { step: s0.slice(), wave: w0.slice(), mix: [], err: [] }
    const par: Record<Key, [number, boolean]> = { up: [0, false], mp: [1, true], bj: [1, false], cmp: [beta, false] }
    const f = new Float64Array(N), z1 = new Float64Array(N)
    let n = 0, raf = 0, frame = 0

    const measure = (r: Run) => {
      let mix = 0, e = 0
      for (let i = 0; i < N; i++) {
        if (r.step[i] > 0.01 && r.step[i] < 0.99) mix++
        e += Math.abs(r.wave[i] - w0[i]) * h      // after whole periods the exact wave equals w0
      }
      return [mix, e]
    }
    const errNow = (r: Run, t: number) => {
      let e = 0
      for (let i = 0; i < N; i++) e += Math.abs(r.wave[i] - exactWave(((xs[i] - t) % 1 + 1) % 1)) * h
      return e
    }
    const tick = () => {
      for (const k of KEYS) { heun(runs[k].step, par[k][0], par[k][1], cfl, f, z1); heun(runs[k].wave, par[k][0], par[k][1], cfl, f, z1) }
      n++
      if (n % Math.max(1, Math.round(nPer / 50)) === 0) for (const k of KEYS) { const [m] = measure(runs[k]); runs[k].mix.push(m); runs[k].err.push(errNow(runs[k], n * dt)) }
    }
    const P1 = { x: 40, y: 22, w: 430, h: 190 }, P2 = { x: 40, y: 250, w: 430, h: 190 }
    const G1 = { x: 520, y: 22, w: 220, h: 190 }, G2 = { x: 520, y: 250, w: 220, h: 190 }
    const grey = 'rgba(127,127,127,0.9)'

    const profile = (P: typeof P1, key: 'step' | 'wave', exact: (x: number) => number, t: number, title: string) => {
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(P.x, P.y, P.w, P.h)
      const X = (x: number) => P.x + x * P.w, Y = (z: number) => P.y + P.h - 10 - z * (P.h - 30)
      ctx.setLineDash([4, 4]); ctx.strokeStyle = grey; ctx.beginPath()
      for (let k = 0; k <= 400; k++) { const x = k / 400, v = exact(((x - t) % 1 + 1) % 1); k ? ctx.lineTo(X(x), Y(v)) : ctx.moveTo(X(x), Y(v)) }
      ctx.stroke(); ctx.setLineDash([])
      for (const k of KEYS) {
        const z = runs[k][key]
        ctx.strokeStyle = COL[k]; ctx.lineWidth = k === 'cmp' ? 2.5 : 1.6; ctx.beginPath()
        for (let i = 0; i < N; i++) i ? ctx.lineTo(X(xs[i]), Y(z[i])) : ctx.moveTo(X(xs[i]), Y(z[i]))
        ctx.stroke()
      }
      ctx.fillStyle = grey; ctx.fillText(title, P.x + 4, P.y + 14)
      ctx.fillText('0', P.x - 12, Y(0) + 4); ctx.fillText('1', P.x - 12, Y(1) + 4); ctx.fillText('x', P.x + P.w - 10, P.y + P.h + 14)
    }
    const history = (G: typeof G1, pick: (r: Run) => number[], ymax: number, title: string) => {
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(G.x, G.y, G.w, G.h)
      const X = (p: number) => G.x + (p / MAX_PERIODS) * G.w, Y = (v: number) => G.y + G.h - Math.min(1, v / ymax) * (G.h - 20)
      ctx.strokeStyle = 'rgba(127,127,127,0.25)'
      for (let p = 1; p < MAX_PERIODS; p++) { ctx.beginPath(); ctx.moveTo(X(p), G.y); ctx.lineTo(X(p), G.y + G.h); ctx.stroke() }
      const every = Math.max(1, Math.round(nPer / 50)) * dt
      for (const k of KEYS) {
        const a = pick(runs[k]); ctx.strokeStyle = COL[k]; ctx.lineWidth = 2; ctx.beginPath()
        a.forEach((v, j) => (j ? ctx.lineTo(X((j + 1) * every), Y(v)) : ctx.moveTo(X((j + 1) * every), Y(v))))
        ctx.stroke()
      }
      ctx.fillStyle = grey; ctx.fillText(title, G.x + 4, G.y + 14)
      ctx.fillText(`${ymax}`, G.x - 30, G.y + 24); ctx.fillText('periods →', G.x + G.w - 64, G.y + G.h + 14)
    }
    const draw = () => {
      const t = n * dt
      ctx.clearRect(0, 0, W, H); ctx.font = '12px ui-monospace, monospace'
      profile(P1, 'step', exactStep, t, 'volume fraction z: slab 0.3<x<0.7')
      profile(P2, 'wave', exactWave, t, 'smooth profile: 0.5+0.5 sin 2πx')
      history(G1, (r) => r.mix, N, 'mixture cells 0.01<z<0.99')
      history(G2, (r) => r.err, 0.2, 'L1 error of the sine')
      const names: Record<Key, string> = { up: '1st order', mp: 'β=1 MP', bj: 'β=1 nbr', cmp: `β=${beta.toFixed(2)}` }
      let lx = 40
      for (const k of KEYS) { ctx.fillStyle = COL[k]; ctx.fillRect(lx, H - 16, 12, 4); ctx.fillText(names[k], lx + 16, H - 10); lx += 110 }
      ctx.fillStyle = grey; ctx.fillText(`t = ${t.toFixed(2)} periods · step ${n}`, W - 220, H - 10)
    }
    const publish = () => {
      const mix = {} as Record<Key, number>, err = {} as Record<Key, number>
      for (const k of KEYS) { mix[k] = measure(runs[k])[0]; err[k] = errNow(runs[k], n * dt) }
      setRead({ t: n * dt, mix, err })
    }
    adv.current = (k: number) => { for (let j = 0; j < k && n < MAX_PERIODS * nPer; j++) tick(); draw(); publish() }
    const loop = () => {
      if (playRef.current && n < MAX_PERIODS * nPer) {
        for (let j = 0; j < spfRef.current && n < MAX_PERIODS * nPer; j++) tick()
        draw()
        if (++frame % 12 === 0 || n >= MAX_PERIODS * nPer) publish()
      }
      raf = requestAnimationFrame(loop)
    }
    draw(); publish()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [beta, N, cfl, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(249,115,22,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>β (orange) = {beta.toFixed(2)} <input type="range" min={1} max={3} step={0.05} value={beta} onChange={(e) => setBeta(+e.target.value)} /></label>
        <label>cells N = {N} <input type="range" min={40} max={200} step={20} value={N} onChange={(e) => setN(+e.target.value)} /></label>
        <label>CFL = {cfl.toFixed(2)} <input type="range" min={0.1} max={0.5} step={0.05} value={cfl} onChange={(e) => setCfl(+e.target.value)} /></label>
        <label>steps/frame {spf} <input type="range" min={1} max={20} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(25) }}>Step ×25</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        t = {read.t.toFixed(2)} periods (stops at {MAX_PERIODS}) · mixture / L1(sine):{' '}
        {KEYS.map((k) => (
          <span key={k} style={{ color: COL[k], marginRight: 10 }}>
            {k === 'up' ? '1st' : k === 'mp' ? 'β=1 MP' : k === 'bj' ? 'β=1 nbr' : `β=${beta.toFixed(2)}`} {read.mix[k]} / {read.err[k].toFixed(4)}
          </span>
        ))}
      </div>
    </div>
  )
}
