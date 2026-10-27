'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const WT = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const CS2 = 1 / 3
const F0 = 1e-6
const MODES = ['guo', 'nohalf', 'rawout'] as const
type Mode = typeof MODES[number]
const COL: Record<Mode, string> = { guo: '#22c55e', nohalf: '#ef4444', rawout: '#3b82f6' }
const NAME: Record<Mode, string> = { guo: 'guo', nohalf: 'nohalf', rawout: 'rawout' }

type Sim = { f: Float64Array[]; hist: number[]; amp: number; u: Float64Array }

function feqInto(rho: number, ux: number, out: number[]) {
  for (let i = 0; i < 9; i++) {
    const cu = CX[i] * ux
    out[i] = WT[i] * rho * (1 + cu / CS2 + 0.5 * (cu / CS2) ** 2 - (0.5 * ux * ux) / CS2)
  }
}
function newSim(N: number): Sim {
  const e: number[] = []
  feqInto(1, 0, e)
  const f: Float64Array[] = []
  for (let j = 0; j < N; j++) f.push(Float64Array.from(e))
  return { f, hist: [], amp: 0, u: new Float64Array(N) }
}
const fe: number[] = []
// same collide + stream as the Python kolmogorov_amp loop
function stepSim(s: Sim, mode: Mode, tau: number, Fx: Float64Array) {
  const N = s.f.length
  const post: Float64Array[] = []
  for (let j = 0; j < N; j++) {
    const fj = s.f[j]
    let rho = 0, mx = 0
    for (let i = 0; i < 9; i++) { rho += fj[i]; mx += fj[i] * CX[i] }
    const ux = mode === 'nohalf' ? mx / rho : (mx + 0.5 * Fx[j]) / rho
    feqInto(rho, ux, fe)
    const p = new Float64Array(9)
    for (let i = 0; i < 9; i++) {
      const cu = CX[i] * ux
      const src = (1 - 0.5 / tau) * WT[i] * ((CX[i] - ux) / CS2 + (cu * CX[i]) / (CS2 * CS2)) * Fx[j]
      p[i] = fj[i] - (fj[i] - fe[i]) / tau + src
    }
    post.push(p)
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < 9; i++) s.f[j][i] = post[(((j - CY[i]) % N) + N) % N][i]
}
function measure(s: Sim, mode: Mode, Fx: Float64Array, k: number, Uex: number) {
  const N = s.f.length
  let amp = 0
  for (let j = 0; j < N; j++) {
    let rho = 0, mx = 0
    for (let i = 0; i < 9; i++) { rho += s.f[j][i]; mx += s.f[j][i] * CX[i] }
    const u = mode === 'guo' ? (mx + 0.5 * Fx[j]) / rho : mx / rho
    s.u[j] = u
    amp += (2 * u * Math.sin(k * (j + 0.5))) / N
  }
  s.amp = amp / Uex
}

export function KolmogorovHalfForceRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tau, setTau] = useState(0.6)
  const [N, setN] = useState(16)
  const [speed, setSpeed] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, target: 0, guo: 0, nohalf: 0, rawout: 0 })
  const adv = useRef<(k: number) => void>(() => {})
  const playRef = useRef(playing)
  playRef.current = playing
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const k = (2 * Math.PI) / N
    const nu = (tau - 0.5) / 3
    const Uex = F0 / (nu * k * k)
    const target = Math.floor(12 / (nu * k * k))
    const Fx = new Float64Array(N)
    for (let j = 0; j < N; j++) Fx[j] = F0 * Math.sin(k * (j + 0.5))
    const sims: Record<Mode, Sim> = { guo: newSim(N), nohalf: newSim(N), rawout: newSim(N) }
    let n = 0, frame = 0, raf = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      const grey = 'rgba(127,127,127,0.85)'
      // --- left: u(y) profiles vs exact ---
      const px = 40, py = 30, pw = 300, ph = 340
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
      const X = (u: number) => px + pw / 2 + (u / (1.25 * Uex)) * (pw / 2)
      const Y = (y: number) => py + ph - (y / N) * ph
      ctx.beginPath(); ctx.moveTo(X(0), py); ctx.lineTo(X(0), py + ph); ctx.stroke()
      ctx.setLineDash([5, 4]); ctx.strokeStyle = grey; ctx.beginPath()
      for (let q = 0; q <= 100; q++) {
        const y = (q / 100) * N, xx = X(Uex * Math.sin(k * y))
        q === 0 ? ctx.moveTo(xx, Y(y)) : ctx.lineTo(xx, Y(y))
      }
      ctx.stroke(); ctx.setLineDash([])
      for (const m of MODES) {
        const s = sims[m]
        ctx.strokeStyle = COL[m]; ctx.fillStyle = COL[m]; ctx.lineWidth = 2; ctx.beginPath()
        for (let j = 0; j < N; j++) {
          const xx = X(s.u[j]), yy = Y(j + 0.5)
          j === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy)
        }
        ctx.stroke(); ctx.lineWidth = 1
        for (let j = 0; j < N; j++) { ctx.beginPath(); ctx.arc(X(s.u[j]), Y(j + 0.5), 2.5, 0, 6.283); ctx.fill() }
      }
      ctx.fillStyle = grey
      ctx.fillText('u_x(y) / exact F0/(νk²) (dashed)', px, py - 10)
      ctx.fillText('y', px - 14, py + 10)
      ctx.fillText('−1', X(-Uex) - 8, py + ph + 16); ctx.fillText('0', X(0) - 3, py + ph + 16); ctx.fillText('+1', X(Uex) - 8, py + ph + 16)

      // --- right: amplitude ratio history ---
      const hx = 400, hy = 30, hw = 340, hh = 340
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(hx, hy, hw, hh)
      const HX = (t: number) => hx + (t / target) * hw
      const HY = (r: number) => hy + hh - (r / 1.2) * hh
      ctx.setLineDash([5, 4]); ctx.strokeStyle = grey
      ctx.beginPath(); ctx.moveTo(hx, HY(1)); ctx.lineTo(hx + hw, HY(1)); ctx.stroke()
      ctx.strokeStyle = COL.nohalf
      ctx.beginPath(); ctx.moveTo(hx, HY(1 - 0.5 / tau)); ctx.lineTo(hx + hw, HY(1 - 0.5 / tau)); ctx.stroke()
      ctx.setLineDash([])
      const every = Math.max(1, Math.ceil(target / 400))
      for (const m of MODES) {
        const h = sims[m].hist
        ctx.strokeStyle = COL[m]; ctx.lineWidth = 2; ctx.beginPath()
        h.forEach((r, q) => { const t = q * every; q === 0 ? ctx.moveTo(HX(t), HY(r)) : ctx.lineTo(HX(t), HY(r)) })
        ctx.stroke(); ctx.lineWidth = 1
      }
      ctx.fillStyle = grey
      ctx.fillText('amplitude / exact  vs  step', hx, hy - 10)
      ctx.fillText('1.0', hx + hw - 26, HY(1) - 4)
      ctx.fillStyle = COL.nohalf; ctx.fillText('1−1/(2τ)', hx + hw - 64, HY(1 - 0.5 / tau) - 4)
      ctx.fillStyle = grey; ctx.fillText(`0 … ${target} steps (12 decay times)`, hx + 4, hy + hh + 16)
      let ly = hy + 18
      for (const m of MODES) { ctx.fillStyle = COL[m]; ctx.fillText(NAME[m], hx + 8, ly); ly += 16 }
    }

    const advance = (kk: number) => {
      for (let s = 0; s < kk && n < target; s++) {
        for (const m of MODES) stepSim(sims[m], m, tau, Fx)
        n++
        const every = Math.max(1, Math.ceil(target / 400))
        if (n % every === 0 || n === target) for (const m of MODES) { measure(sims[m], m, Fx, k, Uex); sims[m].hist.push(sims[m].amp) }
      }
      for (const m of MODES) measure(sims[m], m, Fx, k, Uex)
      draw()
    }
    const pub = () => setRead({ n, target, guo: sims.guo.amp, nohalf: sims.nohalf.amp, rawout: sims.rawout.amp })
    adv.current = (kk: number) => { advance(kk); pub() }
    advance(0); pub()
    const loop = () => {
      frame++
      if (playRef.current && n < target) advance(speedRef.current)
      if (frame % 12 === 0) pub()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tau, N, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(34,197,94,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          τ = {tau.toFixed(2)}{' '}
          <input type="range" min={0.52} max={2} step={0.01} value={tau} onChange={(e) => setTau(Number(e.target.value))} />
        </label>
        <label>
          N = {N}{' '}
          <input type="range" min={8} max={48} step={4} value={N} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label>
          steps/frame = {speed}{' '}
          <input type="range" min={1} max={100} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(10) }}>Step ×10</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        step {read.n}/{read.target} · amplitude/exact: <span style={{ color: COL.guo }}>guo {read.guo.toFixed(4)}</span> ·{' '}
        <span style={{ color: COL.nohalf }}>nohalf {read.nohalf.toFixed(4)}</span> ·{' '}
        <span style={{ color: COL.rawout }}>rawout {read.rawout.toFixed(4)}</span> · nohalf/guo{' '}
        {(read.guo ? read.nohalf / read.guo : 0).toFixed(4)} (1−1/2τ = {(1 - 0.5 / tau).toFixed(4)})
      </div>
    </div>
  )
}
