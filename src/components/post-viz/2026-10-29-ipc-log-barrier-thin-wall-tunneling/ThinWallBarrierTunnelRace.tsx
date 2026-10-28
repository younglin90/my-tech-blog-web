'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 460
const WALL = 0.503
const TH = 0.02
const M = 1
const KAPPA = 1e4
const STEPS = 80
const XL = 0
const XR = 0.6

type P = { h: number; k: number; dhat: number }
type Lane = { x: number; v: number; xs: number[]; its: number[]; through: boolean; xmax: number }

function barrier(d: number, dhat: number) {
  if (d >= dhat) return [0, 0, 0]
  const l = Math.log(d / dhat)
  const b = -((d - dhat) ** 2) * l
  const db = -2 * (d - dhat) * l - (d - dhat) ** 2 / d
  const d2b = -2 * l - (4 * (d - dhat)) / d + (d - dhat) ** 2 / d ** 2
  return [KAPPA * b, KAPPA * db, KAPPA * d2b]
}
function penDepth(x: number): [number, number] {
  if (x > WALL && x < WALL + TH) {
    const a = x - WALL, c = WALL + TH - x
    return a <= c ? [a, -1] : [c, 1]
  }
  return [0, 0]
}
function energy(x: number, xt: number, ipc: boolean, p: P) {
  let e = 0.5 * M * (x - xt) ** 2
  if (ipc) {
    const d = WALL - x
    if (d <= 0) return Infinity
    e += p.h * p.h * barrier(d, p.dhat)[0]
  } else {
    const [q] = penDepth(x)
    e += p.h * p.h * 0.5 * p.k * q * q
  }
  return e
}
// same Newton + CCD-filtered line search as the Python ip_newton
function ipNewton(x0: number, xt: number, ipc: boolean, p: P): [number, number] {
  let x = x0, it = 0
  for (it = 1; it < 60; it++) {
    let g = M * (x - xt), hs = M
    if (ipc) {
      const [, db, d2b] = barrier(WALL - x, p.dhat)
      g += -p.h * p.h * db
      hs += p.h * p.h * d2b
    } else {
      const [q, s] = penDepth(x)
      g += p.h * p.h * p.k * q * -s
      hs += q > 0 ? p.h * p.h * p.k : 0
    }
    const dx = -g / hs
    if (Math.abs(dx) < 1e-10) break
    let a = 1
    if (ipc && x + dx >= WALL) a = (0.9 * (WALL - x)) / dx
    const e0 = energy(x, xt, ipc, p)
    while (energy(x + a * dx, xt, ipc, p) > e0 && a > 1e-12) a *= 0.5
    x += a * dx
  }
  return [x, it]
}
function newLane(v0: number): Lane {
  return { x: 0, v: v0, xs: [0], its: [], through: false, xmax: 0 }
}
function stepLane(L: Lane, ipc: boolean, p: P) {
  if (L.through || L.xs.length > STEPS) return
  const xt = L.x + p.h * L.v
  const [xn, it] = ipNewton(L.x, xt, ipc, p)
  L.v = (xn - L.x) / p.h
  L.x = xn
  L.xs.push(xn)
  L.its.push(it)
  if (xn > WALL + TH) L.through = true
  else L.xmax = Math.max(L.xmax, xn)
}

export function ThinWallBarrierTunnelRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [v0, setV0] = useState(5)
  const [hMs, setHMs] = useState(10)
  const [logK, setLogK] = useState(4)
  const [dhatMm, setDhatMm] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, pen: 'flying', ipcGap: 0, ipcIt: 0 })
  const adv = useRef<(n: number) => void>(() => {})
  const playRef = useRef(playing)
  playRef.current = playing

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const p: P = { h: hMs / 1000, k: 10 ** logK, dhat: dhatMm / 1000 }
    const pen = newLane(v0)
    const ipc = newLane(v0)
    let raf = 0, frame = 0

    const penStatus = () =>
      pen.through ? 'TUNNELED' : pen.xmax > WALL ? `stopped, pen ${((pen.xmax - WALL) * 1000).toFixed(2)} mm` : 'flying'
    const sync = () => {
      const ipcIt = ipc.its.length ? Math.max(...ipc.its) : 0
      setRead({ n: ipc.xs.length - 1, pen: penStatus(), ipcGap: (WALL - ipc.xmax) * 1e6, ipcIt })
    }
    adv.current = (n: number) => {
      for (let i = 0; i < n; i++) { stepLane(pen, false, p); stepLane(ipc, true, p) }
      draw(); sync()
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      const lx = (x: number) => 50 + ((x - XL) / (XR - XL)) * (W - 70)
      // lane strips with every discrete position
      const lanes: [Lane, string, string, number][] = [[pen, '#ef4444', 'penalty', 40], [ipc, '#22c55e', 'IPC barrier', 95]]
      for (const [L, col, name, y] of lanes) {
        ctx.fillStyle = 'rgba(148,163,184,0.35)'
        ctx.fillRect(lx(WALL), y - 18, Math.max(3, lx(WALL + TH) - lx(WALL)), 36)
        ctx.strokeStyle = '#888'
        ctx.beginPath(); ctx.moveTo(lx(XL), y); ctx.lineTo(lx(XR), y); ctx.stroke()
        ctx.fillStyle = col
        ctx.fillText(name, 4, y - 22)
        for (const x of L.xs) { ctx.beginPath(); ctx.arc(lx(x), y, 2.5, 0, 2 * Math.PI); ctx.fill() }
        ctx.beginPath(); ctx.arc(lx(Math.min(L.x, XR)), y, 8, 0, 2 * Math.PI); ctx.fill()
      }
      // x(t) plot
      const top = 140, bot = 300, tx = (n: number) => 50 + (n / STEPS) * (W - 70)
      const ty = (x: number) => bot - (Math.min(x, XR) / XR) * (bot - top)
      ctx.strokeStyle = '#888'
      ctx.beginPath(); ctx.moveTo(50, top); ctx.lineTo(50, bot); ctx.lineTo(W - 20, bot); ctx.stroke()
      ctx.fillStyle = 'rgba(148,163,184,0.3)'
      ctx.fillRect(50, ty(WALL + TH), W - 70, ty(WALL) - ty(WALL + TH))
      ctx.fillStyle = '#888'
      ctx.fillText('x [m]', 6, top + 10)
      ctx.fillText('0.6', 22, top + 4)
      ctx.fillText('0', 34, bot)
      ctx.fillText('time step', W - 90, bot + 16)
      for (const [L, col] of lanes) {
        ctx.strokeStyle = col; ctx.lineWidth = 2
        ctx.beginPath()
        L.xs.forEach((x, n) => (n ? ctx.lineTo(tx(n), ty(x)) : ctx.moveTo(tx(n), ty(x))))
        ctx.stroke(); ctx.lineWidth = 1
      }
      // Newton iterations per step (IPC)
      const b0 = 430, bh = 100
      ctx.fillStyle = '#888'
      ctx.fillText('Newton iters / step (IPC green, penalty red)', 50, b0 - bh - 4)
      ctx.strokeStyle = '#888'
      ctx.beginPath(); ctx.moveTo(50, b0); ctx.lineTo(W - 20, b0); ctx.stroke()
      const bw = (W - 70) / STEPS
      ipc.its.forEach((it, n) => {
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(50 + n * bw, b0 - (Math.min(it, 20) / 20) * bh, bw * 0.45, (Math.min(it, 20) / 20) * bh)
      })
      pen.its.forEach((it, n) => {
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(50 + n * bw + bw * 0.5, b0 - (Math.min(it, 20) / 20) * bh, bw * 0.45, (Math.min(it, 20) / 20) * bh)
      })
      ctx.fillStyle = '#888'
      ctx.fillText('20', 30, b0 - bh + 8)
    }

    let acc = 0
    const loop = () => {
      if (playRef.current) {
        acc += 1
        if (acc >= 4) { acc = 0; stepLane(pen, false, p); stepLane(ipc, true, p) }
      }
      draw()
      if (frame++ % 12 === 0) sync()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [v0, hMs, logK, dhatMm, nonce])

  const btn = (on: boolean) => ({
    padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(34,197,94,0.18)' : 'transparent', cursor: 'pointer', fontSize: 13,
  })
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>v0 = {v0} m/s{' '}
          <input type="range" min={1} max={50} step={1} value={v0} onChange={(e) => setV0(Number(e.target.value))} />
        </label>
        <label>h = {hMs} ms{' '}
          <input type="range" min={1} max={30} step={1} value={hMs} onChange={(e) => setHMs(Number(e.target.value))} />
        </label>
        <label>penalty k = 1e{logK.toFixed(1)}{' '}
          <input type="range" min={3} max={8} step={0.5} value={logK} onChange={(e) => setLogK(Number(e.target.value))} />
        </label>
        <label>d̂ = {dhatMm.toFixed(1)} mm{' '}
          <input type="range" min={0.1} max={5} step={0.1} value={dhatMm} onChange={(e) => setDhatMm(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(1) }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        step {read.n}/{STEPS} · wall {TH * 1000} mm thick ·{' '}
        <span style={{ color: '#ef4444' }}>penalty: {read.pen}</span> ·{' '}
        <span style={{ color: '#22c55e' }}>IPC: min gap {read.ipcGap.toFixed(1)} µm, max Newton {read.ipcIt}</span>
      </div>
    </div>
  )
}
