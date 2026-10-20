'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 360
const E0 = 100

type Sim = { k: number; gap: number; step: number; done: boolean; hist: [number, number][] }

function fresh(): Sim {
  return { k: 0, gap: E0, step: NaN, done: false, hist: [] }
}

export function IncrementGapGaugeLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [n, setN] = useState(40)
  const [logEs, setLogEs] = useState(-3)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ k: 0, gap: E0, step: 0, done: false })
  const live = useRef({ n, es: Math.pow(10, logEs), playing, stepOnce: false })
  live.current.n = n
  live.current.es = Math.pow(10, logEs)
  live.current.playing = playing
  const sim = useRef<Sim>(fresh())

  useEffect(() => { sim.current = fresh() }, [n, logEs, nonce])

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0
    const loop = () => {
      const L = live.current, s = sim.current
      // slowest Jacobi mode on an n x n square: rho = cos(pi/n)
      const rho = Math.cos(Math.PI / L.n)
      const kStop = Math.max(1, Math.ceil(Math.log(L.es / (E0 * (1 - rho))) / Math.log(rho)))
      const per = Math.max(1, Math.round(kStop / 240))
      const advance = (m: number) => {
        for (let q = 0; q < m && !s.done; q++) {
          const g = s.gap * rho
          s.step = s.gap - g; s.gap = g; s.k++
          if (s.k % per === 0 || s.step < L.es) s.hist.push([s.k, s.step])
          if (s.step < L.es) s.done = true
        }
      }
      if (L.playing) advance(per)
      if (L.stepOnce) { advance(1); L.stepOnce = false }

      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // left: error hump vs increment hump (same scale, normalised to current gap)
      const px = 40, py = 50, pw = 300, ph = 230
      ctx.strokeStyle = 'rgba(203,213,225,0.4)'; ctx.strokeRect(px, py, pw, ph)
      const shape = (amp: number, color: string, fill: string) => {
        ctx.beginPath(); ctx.moveTo(px, py + ph)
        for (let i = 0; i <= 100; i++) {
          const x = i / 100
          ctx.lineTo(px + pw * x, py + ph - ph * 0.92 * amp * Math.sin(Math.PI * x))
        }
        ctx.lineTo(px + pw, py + ph); ctx.closePath()
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke()
      }
      shape(1, '#fb923c', 'rgba(251,146,60,0.25)')
      const ratio = s.k > 0 ? s.step / s.gap : 1 - rho
      shape(ratio, '#38bdf8', 'rgba(56,189,248,0.45)')
      ctx.fillStyle = '#fb923c'; ctx.fillText('remaining error  T - T* (what you want)', px, py - 24)
      ctx.fillStyle = '#38bdf8'; ctx.fillText('last increment |T^(k+1) - T^k| (what you test)', px, py - 8)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(`ratio error/increment = 1/(1-rho) = ${(1 / (1 - rho)).toFixed(0)}`, px, py + ph + 20)
      ctx.fillText(`x  (slowest mode sin(pi x))`, px + pw - 190, py + ph - 6)

      // right: log history
      const gx = 420, gy = 50, gw = 310, gh = 230
      ctx.strokeStyle = 'rgba(203,213,225,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh)
      const lo = -6, hi = 2
      const ly = (v: number) => gy + gh * (hi - Math.log10(Math.max(v, 1e-9))) / (hi - lo)
      const lx = (k: number) => gx + gw * Math.min(1, k / (kStop * 1.05))
      for (let e = lo; e <= hi; e += 2) { ctx.fillStyle = '#94a3b8'; ctx.fillText(`1e${e}`, gx - 38, ly(Math.pow(10, e)) + 4) }
      ctx.strokeStyle = '#f87171'; ctx.setLineDash([4, 4]); ctx.beginPath()
      ctx.moveTo(gx, ly(L.es)); ctx.lineTo(gx + gw, ly(L.es)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = '#f87171'; ctx.fillText(`es = ${L.es.toExponential(0)}`, gx + gw - 70, ly(L.es) - 5)
      ctx.lineWidth = 2
      for (const [col, f] of [['#38bdf8', (st: number) => st], ['#fb923c', (st: number) => st / (1 - rho)]] as [string, (v: number) => number][]) {
        ctx.strokeStyle = col; ctx.beginPath()
        s.hist.forEach(([k, st], q) => { const X = lx(k), Y = ly(f(st)); if (q) ctx.lineTo(X, Y); else ctx.moveTo(X, Y) })
        ctx.stroke()
      }
      if (s.done) {
        const X = lx(s.k)
        ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(X, ly(s.step)); ctx.lineTo(X, ly(s.gap)); ctx.stroke()
        ctx.fillStyle = '#fbbf24'; ctx.fillText('gap left at stop', Math.min(X - 50, gx + gw - 120), ly(s.gap) - 8)
      }
      ctx.fillStyle = '#cbd5e1'; ctx.fillText(`log scale vs iteration k (0..${Math.round(kStop * 1.05)})`, gx, gy - 8)

      if (++frame % 12 === 0) setRead({ k: s.k, gap: s.gap, step: s.step, done: s.done })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const rho = Math.cos(Math.PI / n)
  const es = Math.pow(10, logEs)

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
        <label>cells per side n = {n} (h = {(1 / n).toFixed(4)}){' '}
          <input type="range" min={10} max={160} step={5} value={n} onChange={(e) => setN(+e.target.value)} />
        </label>
        <label>stop tolerance es = {es.toExponential(0)}{' '}
          <input type="range" min={-5} max={-1} step={1} value={logEs} onChange={(e) => setLogEs(+e.target.value)} />
        </label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); live.current.stepOnce = true }}>Step</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <span style={{ color: read.done ? '#34d399' : '#fbbf24' }}>{read.done ? 'stopped: increment < es' : 'iterating'}</span>
        {' '}| rho = {rho.toFixed(5)} | k = {read.k} | increment = {Number.isFinite(read.step) ? read.step.toExponential(2) : '-'}
        {' '}| error left = <span style={{ color: '#fb923c' }}>{read.gap.toExponential(2)}</span>
        {' '}| predicted es/(1-rho) = {(es / (1 - rho)).toExponential(2)}
      </div>
    </div>
  )
}
