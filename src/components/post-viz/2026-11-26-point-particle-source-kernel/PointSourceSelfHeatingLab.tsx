'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const HGT = 320
const HCOEF = 0.25
const CP = 0.002
const SIGMA = 0.06
const T_ISO = (CP / HCOEF) * Math.LN2
const WIN = 0.125 // half-width of the zoomed slice (box units)

type Kind = 'cell' | 'stencil27' | 'gauss'
const KINDS: Kind[] = ['cell', 'stencil27', 'gauss']
const COLORS: Record<Kind, string> = { cell: '#f87171', stencil27: '#fbbf24', gauss: '#38bdf8' }

// quasi-steady "self temperature per unit heat release" seen by the particle
function g0(kind: Kind, N: number) {
  const dx = 1 / N
  if (kind === 'cell') return 0.253 / dx
  if (kind === 'stencil27') return 0.04 / dx
  return 1 / Math.hypot(dx / 0.253, SIGMA / 0.0449)
}
const tHalf = (kind: Kind, N: number) => T_ISO * (1 + HCOEF * g0(kind, N))

function heat(t: number) {
  const x = Math.max(0, Math.min(1, t))
  const r = Math.round(20 + 235 * Math.min(1, x * 1.6))
  const g = Math.round(30 + 200 * Math.max(0, x - 0.35) / 0.65)
  const b = Math.round(70 + 90 * (1 - x) - 60 * x)
  return `rgb(${r},${g},${Math.max(20, b)})`
}

export function PointSourceSelfHeatingLab() {
  const [N, setN] = useState(32)
  const [kind, setKind] = useState<Kind>('cell')
  const [playing, setPlaying] = useState(false)
  const [, setTick] = useState(0)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const st = useRef({ Tp: 1, t: 0, phase: 0 })
  const cfg = useRef({ N, kind, playing })
  cfg.current = { N, kind, playing }

  const reset = () => { st.current = { Tp: 1, t: 0, phase: 0 }; setTick((v) => v + 1) }
  useEffect(() => { reset() }, [N, kind]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let raf = 0
    let frame = 0
    const loop = () => {
      const { N, kind, playing } = cfg.current
      const s = st.current
      const G = g0(kind, N)
      if (playing && s.Tp > 0.02) {
        const dt = T_ISO / 90
        for (let k = 0; k < 10; k++) {
          const Q = (HCOEF * s.Tp) / (1 + HCOEF * G)
          s.Tp -= (dt / 10) * Q / CP
          s.t += dt / 10
        }
        s.phase += 0.02
      }
      draw(N, kind, s)
      if (++frame % 12 === 0) setTick((v) => v + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function draw(N: number, kind: Kind, s: { Tp: number; t: number; phase: number }) {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, W, HGT)
    const dx = 1 / N
    const G = g0(kind, N)
    const Q = (HCOEF * s.Tp) / (1 + HCOEF * G)
    const a = 1 / (4 * Math.PI * G)
    // --- left: centre slice of the cells around the particle
    const ox = 10, oy = 10, S = 300
    const px = S / (2 * WIN)
    const nc = Math.ceil(WIN / dx) + 1
    for (let i = -nc; i <= nc; i++) for (let j = -nc; j <= nc; j++) {
      const r = Math.hypot(i * dx, j * dx)
      const T = Q / (4 * Math.PI * Math.hypot(r, a))
      const x0 = ox + S / 2 + (i - 0.5) * dx * px, y0 = oy + S / 2 + (j - 0.5) * dx * px
      if (x0 > ox + S || y0 > oy + S || x0 + dx * px < ox || y0 + dx * px < oy) continue
      ctx.fillStyle = heat(T / 0.8)
      const xa = Math.max(ox, x0), ya = Math.max(oy, y0)
      ctx.fillRect(xa, ya, Math.min(ox + S, x0 + dx * px) - xa, Math.min(oy + S, y0 + dx * px) - ya)
    }
    if (dx * px > 5) {
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      for (let i = -nc; i <= nc + 1; i++) {
        const x = ox + S / 2 + (i - 0.5) * dx * px
        if (x < ox || x > ox + S) continue
        ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + S); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ox, oy + S / 2 + (i - 0.5) * dx * px); ctx.lineTo(ox + S, oy + S / 2 + (i - 0.5) * dx * px); ctx.stroke()
      }
    }
    // heat pulses (strength ~ Q)
    const cx = ox + S / 2, cy = oy + S / 2
    for (let k = 0; k < 3; k++) {
      const f = (s.phase + k / 3) % 1
      ctx.strokeStyle = `rgba(253,224,71,${(0.7 * (1 - f) * Q) / (HCOEF / (1 + HCOEF * 0.253 * 8))})`
      ctx.beginPath(); ctx.arc(cx, cy, 6 + f * 120, 0, 2 * Math.PI); ctx.stroke()
    }
    // kernel footprint
    ctx.strokeStyle = COLORS[kind]
    ctx.lineWidth = 2
    if (kind === 'gauss') { ctx.beginPath(); ctx.arc(cx, cy, 2 * SIGMA * px, 0, 2 * Math.PI); ctx.stroke() }
    else { const h = (kind === 'cell' ? 0.5 : 1.5) * dx * px; ctx.strokeRect(cx - h, cy - h, 2 * h, 2 * h) }
    ctx.fillStyle = heat(s.Tp)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px monospace'
    ctx.fillText(`centre slice, ${(2 * WIN).toFixed(2)} x ${(2 * WIN).toFixed(2)}`, ox + 4, oy + 14)
    ctx.fillText(`dx = ${dx.toFixed(4)}  (particle ~ 0.01)`, ox + 4, oy + S - 6)
    // --- right: t_half / t_iso versus N for the three kernels
    const gx = 360, gy = 20, gw = 260, gh = 250
    const xOf = (n: number) => gx + (gw * Math.log2(n / 8)) / 4
    const yMax = 10
    const yOf = (v: number) => gy + gh - (gh * (v - 1)) / (yMax - 1)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1
    ctx.strokeRect(gx, gy, gw, gh)
    ctx.fillStyle = '#94a3b8'
    for (const n of [8, 16, 32, 64, 128]) { ctx.fillText(String(n), xOf(n) - 8, gy + gh + 14) }
    for (const v of [1, 4, 7, 10]) { ctx.fillText(String(v), gx - 22, yOf(v) + 4) }
    ctx.fillText('cells per box edge N', gx + 70, gy + gh + 30)
    ctx.save(); ctx.translate(gx - 30, gy + gh / 2 + 60); ctx.rotate(-Math.PI / 2); ctx.fillText('t_half / t_isolated', 0, 0); ctx.restore()
    KINDS.forEach((k, ki) => {
      ctx.strokeStyle = COLORS[k]
      ctx.lineWidth = k === kind ? 3 : 1.5
      ctx.beginPath()
      for (let p = 0; p <= 80; p++) {
        const n = 8 * Math.pow(2, (4 * p) / 80)
        const y = yOf(Math.min(yMax, tHalf(k, n) / T_ISO))
        if (p === 0) ctx.moveTo(xOf(n), y); else ctx.lineTo(xOf(n), y)
      }
      ctx.stroke()
      ctx.fillStyle = COLORS[k]
      ctx.fillText(k === 'gauss' ? `gauss s=${SIGMA}` : k, gx + 8, gy + 16 + 15 * ki)
    })
    ctx.strokeStyle = '#e2e8f0'
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(xOf(N), gy); ctx.lineTo(xOf(N), gy + gh); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = COLORS[kind]
    ctx.beginPath(); ctx.arc(xOf(N), yOf(Math.min(yMax, tHalf(kind, N) / T_ISO)), 5, 0, 2 * Math.PI); ctx.fill()
  }

  const s = st.current
  const G = g0(kind, N)
  const Q = (HCOEF * s.Tp) / (1 + HCOEF * G)
  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={HGT} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>Cells per edge N: <b>{N}</b> (dx = {(1 / N).toFixed(4)})
          <input type="range" min={8} max={128} step={4} value={N} onChange={(e) => setN(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <div>Deposit kernel:
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {KINDS.map((k) => (
              <button key={k} onClick={() => setKind(k)} style={{ borderColor: COLORS[k], fontWeight: k === kind ? 700 : 400, color: k === kind ? COLORS[k] : undefined }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button onClick={reset}>Reset</button>
        <span style={{ fontSize: 13, color: '#94a3b8', alignSelf: 'center' }}>quasi-steady estimate, H = {HCOEF}, Cp = {CP}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 6, marginTop: 8, fontSize: 13, fontFamily: 'monospace' }}>
        <div>T_particle: {s.Tp.toFixed(3)}</div>
        <div style={{ color: COLORS[kind] }}>T_seen: {(Q * G).toFixed(3)}</div>
        <div>Q / Q_iso: {(1 / (1 + HCOEF * G)).toFixed(3)}</div>
        <div>t: {s.t.toFixed(4)}</div>
        <div style={{ color: COLORS[kind] }}>t_half: {tHalf(kind, N).toFixed(4)}</div>
        <div>t_half iso: {T_ISO.toFixed(4)}</div>
      </div>
    </div>
  )
}
