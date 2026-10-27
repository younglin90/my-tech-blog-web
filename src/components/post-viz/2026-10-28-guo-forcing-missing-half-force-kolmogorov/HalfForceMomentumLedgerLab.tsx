'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const OK = '#22c55e'
const BAD = '#ef4444'
const REF = 'rgba(127,127,127,0.8)'
const TMAX = 200

type Lane = { m: number; hist: number[]; x: number[] }

function newLane(): Lane {
  const x: number[] = []
  for (let i = 0; i < 14; i++) x.push((i / 14) * 1)
  return { m: 0, hist: [0], x }
}

// one BGK + Guo-source step for a uniform fluid (rho = 1): the whole post in one line
function stepLane(l: Lane, tau: number, F: number, half: boolean) {
  const ueq = half ? l.m + 0.5 * F : l.m
  const relax = -(l.m - ueq) / tau
  const src = (1 - 0.5 / tau) * F
  l.m = l.m + relax + src
  l.hist.push(l.m)
  return { relax, src }
}

export function HalfForceMomentumLedgerLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tau, setTau] = useState(0.6)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, ok: 0, bad: 0 })
  const adv = useRef<(k: number) => void>(() => {})
  const playRef = useRef(playing)
  playRef.current = playing

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const F = 1e-3
    const A = newLane(), B = newLane()
    let ledA = { relax: 0, src: 0 }, ledB = { relax: 0, src: 0 }
    let n = 0, frame = 0, raf = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // --- left: momentum history ---
      const px = 56, py = 24, pw = 420, ph = 250
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'
      ctx.strokeRect(px, py, pw, ph)
      const mMax = F * TMAX
      const X = (t: number) => px + (t / TMAX) * pw
      const Y = (m: number) => py + ph - (m / mMax) * ph
      ctx.setLineDash([5, 4]); ctx.strokeStyle = REF; ctx.beginPath()
      ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(TMAX), Y(mMax)); ctx.stroke(); ctx.setLineDash([])
      for (const [l, col] of [[A, OK], [B, BAD]] as const) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath()
        l.hist.forEach((m, t) => (t === 0 ? ctx.moveTo(X(t), Y(m)) : ctx.lineTo(X(t), Y(m))))
        ctx.stroke(); ctx.lineWidth = 1
      }
      ctx.fillStyle = REF
      ctx.fillText('momentum ρu (lattice units)', px, py - 8)
      ctx.fillText('time step →', px + pw - 80, py + ph + 16)
      ctx.fillText('0', px - 14, py + ph + 4)
      ctx.fillText((mMax).toFixed(2), px - 40, py + 10)
      ctx.fillText('dashed: exact F·t', px + 8, py + 16)
      ctx.fillStyle = OK; ctx.fillText('u_eq = (Σfc + F/2)/ρ', px + 8, py + 34)
      ctx.fillStyle = BAD; ctx.fillText('u_eq = Σfc/ρ  (half-force missing)', px + 8, py + 52)

      // --- right: per-step ledger bars ---
      const bx = 520, by = 40, bh = 220
      const Yb = (v: number) => by + bh - (v / F) * bh
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'
      ctx.beginPath(); ctx.moveTo(bx - 6, Yb(0)); ctx.lineTo(bx + 220, Yb(0)); ctx.stroke()
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx - 6, Yb(F)); ctx.lineTo(bx + 220, Yb(F)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = REF; ctx.fillText('gain per step / F', bx, by - 22); ctx.fillText('1.0', bx + 196, Yb(F) - 4)
      const bars = (led: { relax: number; src: number }, x0: number, col: string, label: string) => {
        const ySrc = Yb(led.src)
        ctx.fillStyle = col; ctx.globalAlpha = 0.55
        ctx.fillRect(x0, ySrc, 40, Yb(0) - ySrc)
        ctx.globalAlpha = 1
        const yTop = Yb(led.src + led.relax)
        ctx.fillStyle = col
        ctx.fillRect(x0, yTop, 40, ySrc - yTop)
        ctx.fillStyle = REF
        ctx.fillText(label, x0 - 4, Yb(0) + 16)
        ctx.fillText(((led.src + led.relax) / F).toFixed(3), x0, Math.min(yTop, ySrc) - 6)
      }
      bars(ledA, bx + 20, OK, 'with F/2')
      bars(ledB, bx + 120, BAD, 'without')
      ctx.fillStyle = REF
      ctx.fillText('pale: source (1−1/2τ)F', bx - 6, by + bh + 40)
      ctx.fillText('solid: relaxation F/(2τ)', bx - 6, by + bh + 56)

      // --- bottom: tracer strip, dots advected at the lane velocity ---
      const sy = 320
      for (const [l, col, row] of [[A, OK, 0], [B, BAD, 1]] as const) {
        const yy = sy + row * 40
        ctx.strokeStyle = 'rgba(127,127,127,0.3)'; ctx.strokeRect(px, yy - 12, W - px - 20, 24)
        ctx.fillStyle = col
        for (const x of l.x) { ctx.beginPath(); ctx.arc(px + x * (W - px - 20), yy, 4, 0, 6.283); ctx.fill() }
      }
      ctx.fillStyle = REF; ctx.fillText('tracers moving with u (periodic box)', px, sy - 18)
    }

    const advance = (k: number) => {
      for (let s = 0; s < k; s++) {
        if (n >= TMAX) { A.hist = [0]; B.hist = [0]; A.m = 0; B.m = 0; n = 0 }
        ledA = stepLane(A, tau, F, true)
        ledB = stepLane(B, tau, F, false)
        for (const l of [A, B]) l.x = l.x.map((x) => (x + l.m * 0.02) % 1)
        n++
      }
      draw()
    }
    adv.current = (k: number) => { advance(k); setRead({ n, ok: A.m / (F * n || 1), bad: B.m / (F * n || 1) }) }
    draw()
    const loop = () => {
      frame++
      if (playRef.current && frame % 3 === 0) advance(1)
      if (frame % 12 === 0) setRead({ n, ok: A.m / (F * n || 1), bad: B.m / (F * n || 1) })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tau, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(34,197,94,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          relaxation time τ = {tau.toFixed(2)}{' '}
          <input type="range" min={0.51} max={2} step={0.01} value={tau}
            onChange={(e) => { setTau(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
        <span>ν = (τ−½)/3 = {((tau - 0.5) / 3).toFixed(4)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(1) }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        step {read.n} · ρu/(F·t): <span style={{ color: OK }}>with F/2 {read.ok.toFixed(4)}</span> ·{' '}
        <span style={{ color: BAD }}>without {read.bad.toFixed(4)}</span> · theory 1−1/(2τ) = {(1 - 0.5 / tau).toFixed(4)}
      </div>
    </div>
  )
}
