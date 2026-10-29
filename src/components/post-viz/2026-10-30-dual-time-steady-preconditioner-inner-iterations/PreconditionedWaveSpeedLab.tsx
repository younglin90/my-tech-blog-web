'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 440
const C_TRUE = '#fbbf24'
const C_PRE = '#ef4444'
const GREY = 'rgba(127,127,127,0.85)'

function pulse(s: number) {
  const d = (((s - 0.5 + 0.5) % 1) + 1) % 1 - 0.5
  return Math.exp(-((d / 0.06) ** 2))
}
// eigen-structure of Gamma*A, Gamma = diag(delta, 1), A = [[M,1],[1,M]]
function eig(M: number, d: number) {
  const tr = d * M + M, det = d * M * M - d
  const s = Math.sqrt((tr / 2) ** 2 - det)
  const lp = tr / 2 + s, lm = tr / 2 - s
  const mp = lp - d * M, mm = lm - d * M
  const den = d * (mm - mp)
  return { lp, lm, mp, mm, ap: mm / den, am: -mp / den, d }
}
// exact solution of q_t + (Gamma A) q_x = 0 from q0 = (pulse, 0)
function field(e: ReturnType<typeof eig>, x: number, t: number) {
  const gp = pulse(x - e.lp * t), gm = pulse(x - e.lm * t)
  return { p: e.d * (e.ap * gp + e.am * gm), u: e.ap * e.mp * gp + e.am * e.mm * gm }
}

export function PreconditionedWaveSpeedLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [M, setM] = useState(0.05)
  const [logd, setLogd] = useState(Math.log10(0.05 * 0.05))
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(0.15)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ t: 0, lt: [0, 0], lg: [0, 0] })
  const playRef = useRef(playing)
  const speedRef = useRef(speed)
  const adv = useRef<(dt: number) => void>(() => {})
  playRef.current = playing
  speedRef.current = speed

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const d = 10 ** logd
    const et = eig(M, 1), ep = eig(M, d)
    let t = 0, frame = 0, raf = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // --- top: pressure in the periodic box ---
      const px = 40, py = 28, pw = 690, ph = 170
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
      const X = (x: number) => px + x * pw
      const Y = (p: number) => py + ph - ((p + 0.25) / 1.35) * ph
      ctx.beginPath(); ctx.moveTo(px, Y(0)); ctx.lineTo(px + pw, Y(0)); ctx.stroke()
      for (const [e, col] of [[et, C_TRUE], [ep, C_PRE]] as const) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath()
        for (let i = 0; i <= 300; i++) {
          const x = i / 300, f = field(e, x, t)
          i === 0 ? ctx.moveTo(X(x), Y(f.p)) : ctx.lineTo(X(x), Y(f.p))
        }
        ctx.stroke(); ctx.lineWidth = 1
        ctx.setLineDash([3, 3]); ctx.beginPath()
        for (let i = 0; i <= 300; i++) {
          const x = i / 300, f = field(e, x, t)
          i === 0 ? ctx.moveTo(X(x), Y(f.u)) : ctx.lineTo(X(x), Y(f.u))
        }
        ctx.stroke(); ctx.setLineDash([])
      }
      ctx.fillStyle = GREY
      ctx.fillText(`pressure p(x) solid, velocity u(x) dashed   t = ${t.toFixed(3)} (acoustic times L/c)`, px, py - 10)
      ctx.fillText('0', px - 4, py + ph + 14); ctx.fillText('x = 1 (periodic)', px + pw - 100, py + ph + 14)
      ctx.fillStyle = C_TRUE; ctx.fillText('true physics: q_t + A q_x = 0', px + 8, py + 18)
      ctx.fillStyle = C_PRE; ctx.fillText('Gamma in physical time: q_t + ΓA q_x = 0', px + 8, py + 34)

      // --- bottom: eigenvalues of Gamma A vs delta ---
      const bx = 40, by = 240, bw = 690, bh = 170
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(bx, by, bw, bh)
      const DX = (ld: number) => bx + ((ld + 4) / 4) * bw
      const lmax = 1 + M
      const DY = (l: number) => by + bh / 2 - (l / (1.15 * lmax)) * (bh / 2)
      ctx.beginPath(); ctx.moveTo(bx, DY(0)); ctx.lineTo(bx + bw, DY(0)); ctx.stroke()
      ctx.setLineDash([5, 4]); ctx.strokeStyle = C_TRUE
      for (const l of [M + 1, M - 1, M]) { ctx.beginPath(); ctx.moveTo(bx, DY(l)); ctx.lineTo(bx + bw, DY(l)); ctx.stroke() }
      ctx.setLineDash([])
      ctx.strokeStyle = C_PRE; ctx.lineWidth = 2
      for (const sgn of [1, -1]) {
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const ld = -4 + (4 * i) / 200, e = eig(M, 10 ** ld)
          const l = sgn > 0 ? e.lp : e.lm
          i === 0 ? ctx.moveTo(DX(ld), DY(l)) : ctx.lineTo(DX(ld), DY(l))
        }
        ctx.stroke()
      }
      ctx.lineWidth = 1
      const m2 = Math.log10(M * M)
      if (m2 >= -4) {
        ctx.setLineDash([2, 3]); ctx.strokeStyle = GREY
        ctx.beginPath(); ctx.moveTo(DX(m2), by); ctx.lineTo(DX(m2), by + bh); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = GREY; ctx.fillText('δ = M²', DX(m2) + 4, by + bh - 6)
      }
      ctx.fillStyle = C_PRE
      for (const l of [ep.lp, ep.lm]) { ctx.beginPath(); ctx.arc(DX(logd), DY(l), 5, 0, 6.283); ctx.fill() }
      ctx.fillStyle = GREY
      ctx.fillText('wave speeds λ±(ΓA) vs log10 δ    dashed: u+c, u, u−c', bx, by - 10)
      ctx.fillText('−4', bx - 6, by + bh + 14); ctx.fillText('0 (no Γ)', bx + bw - 50, by + bh + 14)
      ctx.fillText(`+${lmax.toFixed(2)}`, bx + 4, DY(lmax) - 4); ctx.fillText(`${(M - 1).toFixed(2)}`, bx + 4, DY(M - 1) + 14)
    }
    const advance = (dt: number) => { t += dt; draw() }
    const pub = () => setRead({ t, lt: [et.lp, et.lm], lg: [ep.lp, ep.lm] })
    adv.current = (dt: number) => { advance(dt); pub() }
    advance(0); pub()
    const loop = () => {
      frame++
      if (playRef.current) advance(speedRef.current / 60)
      if (frame % 12 === 0) pub()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [M, logd, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const cond = (a: number, b: number) => Math.max(Math.abs(a), Math.abs(b)) / M

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          Mach M = {M.toFixed(3)}{' '}
          <input type="range" min={0.01} max={0.3} step={0.005} value={M} onChange={(e) => setM(Number(e.target.value))} />
        </label>
        <label>
          δ = {(10 ** logd).toExponential(1)}{' '}
          <input type="range" min={-4} max={0} step={0.05} value={logd} onChange={(e) => setLogd(Number(e.target.value))} />
        </label>
        <label>
          time speed = {speed.toFixed(2)}{' '}
          <input type="range" min={0.02} max={0.5} step={0.01} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(0.02) }}>Step +0.02</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
        <button style={btn(false)} onClick={() => setLogd(Math.max(-4, Math.log10(M * M)))}>δ = M²</button>
        <button style={btn(false)} onClick={() => setLogd(0)}>δ = 1 (off)</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        t = {read.t.toFixed(3)} · <span style={{ color: C_TRUE }}>true λ = {read.lt[0].toFixed(3)}, {read.lt[1].toFixed(3)} (λmax/u {cond(read.lt[0], read.lt[1]).toFixed(1)})</span> ·{' '}
        <span style={{ color: C_PRE }}>ΓA λ = {read.lg[0].toFixed(3)}, {read.lg[1].toFixed(3)} (λmax/u {cond(read.lg[0], read.lg[1]).toFixed(1)})</span>
      </div>
    </div>
  )
}
