'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 380
const R = 8.314462618
const P0 = 101325
const DH = 487.7e3
const DS = 107.2
const T_END = 0.2
const NSTEPS = 500
const MODES = ['Kc (correct)', 'Kp as Kc, SI', 'Kp as Kc, CGS']
const COL = ['#34d399', '#fbbf24', '#f87171']

const kp = (T: number) => Math.exp(DS / R - DH / (R * T))
const kcTrue = (T: number) => kp(T) * (P0 / (R * T))
const kcUsed = (T: number, m: number) => (m === 0 ? kcTrue(T) : m === 1 ? kp(T) : kp(T) * 1e6)
const kForward = (T: number) => 1.0e11 * Math.exp(-DH / (R * T))

type Reactor = { xi: number; n: number; hist: number[] }
type Params = { T: number; pAtm: number; x: number }

function setup(P: Params) {
  const M = (P.pAtm * P0) / (R * P.T)
  const c0 = P.x * M
  const a = kForward(P.T) * M
  const K = kcTrue(P.T)
  const xiEq = (-K + Math.sqrt(K * K + 4 * K * c0)) / 2
  return { c0, a, b: MODES.map((_, m) => a / kcUsed(P.T, m)), alphaExact: xiEq / c0, K }
}

// backward Euler for d(xi)/dt = a(c0 - xi) - b xi^2, solved exactly as a quadratic
function step(r: Reactor, a: number, b: number, c0: number) {
  const dt = T_END / NSTEPS
  const A = b * dt, B = 1 + a * dt, C = -(r.xi + a * dt * c0)
  r.xi = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A)
  r.n++
  r.hist.push(r.xi / c0)
}

const fresh = (): Reactor[] => MODES.map(() => ({ xi: 0, n: 0, hist: [0] }))

export function ReverseRateReactorRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [T, setT] = useState(3000)
  const [logP, setLogP] = useState(0)
  const [logX, setLogX] = useState(-2)
  const [speed, setSpeed] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<{ n: number; al: number[]; q: number[] }>({ n: 0, al: [0, 0, 0], q: [0, 0, 0] })
  const P: Params = { T, pAtm: Math.pow(10, logP), x: Math.pow(10, logX) }
  const sim = setup(P)
  const live = useRef({ sim, playing, speed, stepOnce: false })
  live.current = { ...live.current, sim, playing, speed }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const rs = fresh()
    let raf = 0, frame = 0
    const loop = () => {
      const L = live.current
      const S = L.sim
      const n = (L.playing ? L.speed : 0) + (L.stepOnce ? 1 : 0)
      L.stepOnce = false
      for (let k = 0; k < n; k++) rs.forEach((r, m) => { if (r.n < NSTEPS) step(r, S.a, S.b[m], S.c0) })

      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // composition bars: [AlO] vs [Al]=[O]
      const bx = 20, by = 40
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('reactor composition (fraction of initial AlO)', bx, 22)
      rs.forEach((r, m) => {
        const y = by + m * 92, al = r.xi / S.c0
        ctx.fillStyle = COL[m]; ctx.fillText(MODES[m], bx, y + 12)
        ctx.fillStyle = 'rgba(148,163,184,0.85)'; ctx.fillRect(bx, y + 20, 200 * (1 - al), 20)
        ctx.fillStyle = COL[m]; ctx.fillRect(bx, y + 46, 200 * al, 20)
        ctx.strokeStyle = 'rgba(203,213,225,0.35)'; ctx.strokeRect(bx, y + 20, 200, 20); ctx.strokeRect(bx, y + 46, 200, 20)
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(`AlO ${(1 - al).toFixed(3)}`, bx + 208, y + 34)
        ctx.fillText(`Al=O ${al.toFixed(3)}`, bx + 208, y + 60)
      })

      // alpha(t) history
      const gx = 360, gy = 30, gw = 380, gh = 300
      ctx.strokeStyle = 'rgba(203,213,225,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh)
      const X = (i: number) => gx + (gw * i) / NSTEPS
      const Y = (v: number) => gy + gh * (1 - v)
      for (let v = 0; v <= 1.0001; v += 0.25) { ctx.fillStyle = '#64748b'; ctx.fillText(v.toFixed(2), gx - 34, Y(v) + 4) }
      for (let t = 0; t <= 200; t += 50) { ctx.fillStyle = '#64748b'; ctx.fillText(`${t}`, X((t / 200) * NSTEPS) - 8, gy + gh + 16) }
      ctx.fillStyle = '#94a3b8'; ctx.fillText('t [ms]', gx + gw - 40, gy + gh + 30)
      ctx.fillText('alpha = [Al]/[AlO]0', gx + 6, gy + 14)
      ctx.strokeStyle = '#34d399'; ctx.setLineDash([5, 4]); ctx.beginPath()
      ctx.moveTo(gx, Y(S.alphaExact)); ctx.lineTo(gx + gw, Y(S.alphaExact)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = '#34d399'; ctx.fillText(`exact eq. ${S.alphaExact.toFixed(4)}`, gx + gw - 140, Y(S.alphaExact) - 6)
      rs.forEach((r, m) => {
        ctx.strokeStyle = COL[m]; ctx.lineWidth = 2; ctx.beginPath()
        r.hist.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))))
        ctx.stroke()
      })

      if (++frame % 12 === 0) {
        setRead({
          n: rs[0].n,
          al: rs.map((r) => r.xi / S.c0),
          q: rs.map((r) => (r.xi * r.xi) / Math.max(S.c0 - r.xi, 1e-300) / S.K),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [nonce])

  const reset = () => { setNonce((v) => v + 1) }
  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, alignItems: 'center', fontSize: 13 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); live.current.stepOnce = true }}>Step</button>
        <button style={btn(false)} onClick={reset}>Reset</button>
        <label>T = {T} K{' '}
          <input type="range" min={2000} max={4000} step={50} value={T} onChange={(e) => { setT(+e.target.value); reset() }} />
        </label>
        <label>p = {P.pAtm.toFixed(2)} atm{' '}
          <input type="range" min={-1} max={1} step={0.05} value={logP} onChange={(e) => { setLogP(+e.target.value); reset() }} />
        </label>
        <label>x_AlO = {P.x.toFixed(4)}{' '}
          <input type="range" min={-3} max={-1} step={0.1} value={logX} onChange={(e) => { setLogX(+e.target.value); reset() }} />
        </label>
        <label>steps/frame = {speed}{' '}
          <input type="range" min={1} max={20} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <div>step {read.n}/{NSTEPS} (t = {((read.n * T_END) / NSTEPS * 1000).toFixed(1)} ms, backward Euler dt = 0.4 ms) | Kp = {kp(T).toExponential(3)} | Kc = {sim.K.toExponential(3)} mol/m^3</div>
        {MODES.map((m, i) => (
          <div key={m} style={{ color: COL[i] }}>
            {m.padEnd(15, ' ')}: alpha = {read.al[i].toFixed(4)} | Q/Kc_true = {read.q[i].toExponential(3)}
          </div>
        ))}
      </div>
    </div>
  )
}
