'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const C0 = 1.183 // sqrt(1.4) : sound speed in units of the reference state
const U = 1
const GREY = 'rgba(127,127,127,0.85)'
const EX = '#38bdf8'
const IM = '#22c55e'
const SOUND = '#f59e0b'

// erf (Abramowitz–Stegun 7.1.26)
function erf(x: number) {
  const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}

// slab [0.3,0.7] of alpha=0.9 in 0.1, advected by u*t and smeared by diffusion D over time t (periodic images)
function alphaSmeared(x: number, t: number, D: number) {
  const xs = x - U * t
  const L = Math.sqrt(4 * D * t) + 1e-9
  let s = 0
  for (let img = -2; img <= 2; img++) {
    const a = 0.3 + img, b = 0.7 + img
    s += 0.5 * (erf((xs - a) / L) - erf((xs - b) / L))
  }
  return 0.1 + 0.8 * Math.min(1, Math.max(0, s))
}

export function AcousticMaterialClockLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logM, setLogM] = useState(-2)
  const [N, setN] = useState(100)
  const [slow, setSlow] = useState(6)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const stepRef = useRef<() => void>(() => {})
  const M = Math.pow(10, logM)
  const [read, setRead] = useState({ t: 0, nEx: 0, nIm: 0 })

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dx = 1 / N, nu = 0.5
    const lamEx = U + C0 / M, lamIm = U
    const dtEx = (nu * dx) / lamEx, dtIm = (nu * dx) / lamIm
    // modified-equation diffusion of the Rusanov/forward-Euler alpha update
    const Dex = 0.5 * dx * (lamEx - (U * U * dtEx) / dx)
    const Dim = 0.5 * dx * (lamIm - (U * U * dtIm) / dx)
    let t = 0
    const TMAX = 1
    stepRef.current = () => { t = Math.min(TMAX, t + dtIm) } // one IMEX step

    const pad = 54, pw = W - pad - 16
    const X = (x: number) => pad + (((x % 1) + 1) % 1) * pw
    const draw = () => {
      const c = ctx
      c.clearRect(0, 0, W, H)
      c.font = '12px ui-monospace, monospace'
      // panel 1: the strip — interface moves at u, sound at u ± c/M
      const y1 = 20, h1 = 70
      c.strokeStyle = GREY; c.lineWidth = 1; c.strokeRect(pad, y1, pw, h1)
      c.fillStyle = GREY
      c.fillText('periodic tube: bubble (α1 = 0.9) carried by u = 1, pressure pulses at u ± c/M', pad + 4, y1 - 6)
      c.fillStyle = 'rgba(34,197,94,0.25)'
      for (let i = 0; i < pw; i++) {
        const x = i / pw, xs = (((x - U * t) % 1) + 1) % 1
        if (xs > 0.3 && xs < 0.7) c.fillRect(pad + i, y1 + 1, 1, h1 - 2)
      }
      // sound pulses: draw a trail of recent positions (fast ones blur into the whole tube)
      const cs = C0 / M
      for (const dir of [1, -1]) {
        for (let j = 0; j < 14; j++) {
          const tt = t - j * dtIm * 0.07
          if (tt < 0) break
          const xp = 0.5 + (U + dir * cs) * tt
          c.fillStyle = `rgba(245,158,11,${0.85 - j * 0.055})`
          c.fillRect(X(xp) - 2, y1 + 8, 4, h1 - 16)
        }
      }
      // panel 2: time-step ticks over the last 0.05 time units
      const y2 = 125, h2 = 70, win = 0.05
      c.strokeStyle = GREY; c.strokeRect(pad, y2, pw, h2)
      c.fillStyle = GREY
      c.fillText(`time steps inside the last Δt_window = ${win}  (one tick = one step)`, pad + 4, y2 - 6)
      const tick = (dt: number, y: number, col: string) => {
        c.strokeStyle = col; c.lineWidth = 1
        const n0 = Math.ceil((t - win) / dt), n1 = Math.floor(t / dt)
        const stride = Math.max(1, Math.ceil((n1 - n0) / pw))
        c.beginPath()
        for (let n = Math.max(0, n0); n <= n1; n += stride) {
          const xx = pad + ((n * dt - (t - win)) / win) * pw
          c.moveTo(xx, y); c.lineTo(xx, y + 24)
        }
        c.stroke()
      }
      tick(dtEx, y2 + 6, EX)
      tick(dtIm, y2 + 40, IM)
      c.fillStyle = EX; c.fillText('explicit', 6, y2 + 22)
      c.fillStyle = IM; c.fillText('IMEX', 6, y2 + 56)
      // panel 3: alpha profiles smeared by the scheme dissipation
      const y3 = 230, h3 = 160
      const Ya = (v: number) => y3 + h3 - ((v - 0.05) / 0.9) * h3
      c.strokeStyle = GREY; c.strokeRect(pad, y3, pw, h3)
      c.fillStyle = GREY
      c.fillText('α1(x): numerical diffusion D ≈ (Δx/2)(λ − u²Δt/Δx)   — modified-equation estimate', pad + 4, y3 - 6)
      for (const v of [0.1, 0.5, 0.9]) c.fillText(v.toFixed(1), 22, Ya(v) + 4)
      const prof = (D: number, col: string, dash: number[]) => {
        c.setLineDash(dash); c.strokeStyle = col; c.lineWidth = 2; c.beginPath()
        for (let i = 0; i <= 300; i++) {
          const x = i / 300, v = alphaSmeared(x, t, D)
          const xx = pad + x * pw
          if (i === 0) c.moveTo(xx, Ya(v)); else c.lineTo(xx, Ya(v))
        }
        c.stroke(); c.setLineDash([])
      }
      prof(0, GREY, [5, 4])
      prof(Dex, EX, [])
      prof(Dim, IM, [])
      c.fillStyle = GREY
      c.fillText(`M = ${M.toPrecision(2)}   c/M = ${cs.toFixed(0)}   t = ${t.toFixed(3)}`, pad, H - 8)
    }

    let raf = 0, frame = 0, last = performance.now()
    const loop = (now: number) => {
      const el = Math.min(0.05, (now - last) / 1000); last = now
      if (playing && t < TMAX) t = Math.min(TMAX, t + el / slow)
      draw()
      if (++frame % 12 === 0) setRead({ t, nEx: Math.floor(t / dtEx + 1e-9), nIm: Math.floor(t / dtIm + 1e-9) })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [M, N, slow, playing, nonce])

  const dx = 1 / N
  const dtEx = (0.5 * dx) / (1 + C0 / M), dtIm = 0.5 * dx
  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Mach M = {M.toPrecision(2)}{' '}
          <input type="range" min={-3} max={0} step={0.05} value={logM} onChange={(e) => setLogM(+e.target.value)} />
        </label>
        <label>cells N = {N}{' '}
          <input type="range" min={20} max={100} step={10} value={N} onChange={(e) => setN(+e.target.value)} />
        </label>
        <label>slow-motion ×{slow}{' '}
          <input type="range" min={2} max={20} step={1} value={slow} onChange={(e) => setSlow(+e.target.value)} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: EX }}>explicit: Δt = νΔx/(|u|+c/M) = {dtEx.toExponential(2)}   steps so far {read.nEx}   steps to t=1 ≈ {Math.ceil(1 / dtEx)}</div>
        <div style={{ color: IM }}>IMEX:     Δt = νΔx/|u|       = {dtIm.toExponential(2)}   steps so far {read.nIm}   steps to t=1 ≈ {Math.ceil(1 / dtIm)}</div>
        <div style={{ color: SOUND }}>ratio of step counts ≈ 1 + c/M = {(1 + C0 / M).toFixed(1)}</div>
      </div>
    </div>
  )
}
