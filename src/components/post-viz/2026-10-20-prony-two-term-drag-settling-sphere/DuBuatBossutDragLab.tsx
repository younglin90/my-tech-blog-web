'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 400
const G = 9.81
const RHO_P = 2500
const C_INF = 0.4
const C_LIN = '#38bdf8'
const C_QUAD = '#f97316'
const C_TOT = '#e2e8f0'
const C_W = '#a3e635'

type Fluid = { name: string; rho: number; mu: number }
const FLUIDS: Fluid[] = [
  { name: 'water', rho: 1000, mu: 1.0e-3 },
  { name: 'glycerol', rho: 1260, mu: 1.0 },
  { name: 'air', rho: 1.2, mu: 1.8e-5 },
]

function coeffs(d: number, fl: Fluid) {
  const wt = (RHO_P - fl.rho) * Math.PI * d ** 3 / 6 * G
  const a = C_INF * Math.PI / 8 * fl.rho * d * d
  const b = 3 * Math.PI * fl.mu * d
  const vt = (-b + Math.sqrt(b * b + 4 * a * wt)) / (2 * a)
  return { wt, a, b, vt, m: RHO_P * Math.PI * d ** 3 / 6 }
}

export function DuBuatBossutDragLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logD, setLogD] = useState(Math.log10(0.3))
  const [fi, setFi] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ v: 0, vt: 1, re: 0, lin: 100 })
  const playRef = useRef(playing)
  playRef.current = playing

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const fl = FLUIDS[fi]
    const d = 10 ** logD * 1e-3
    const c = coeffs(d, fl)
    const tau = c.vt / ((1 - fl.rho / RHO_P) * G)
    const dt = tau / 60 // ~60 frames per acceleration time scale
    let v = 0, y = 0, t = 0, frame = 0, raf = 0
    const hist: number[] = []

    const drawFrame = () => {
      if (playRef.current && v < 0.9995 * c.vt) {
        for (let k = 0; k < 4; k++) {
          const f = c.wt - c.b * v - c.a * v * v
          v += (dt / 4) * f / c.m
          t += dt / 4
        }
        hist.push(v / c.vt)
      }
      y = (y + (v / c.vt) * 3.2) % 300
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // tank
      const tx = 30, ty = 30, tw = 120, th = 300
      ctx.fillStyle = fi === 2 ? 'rgba(148,163,184,0.08)' : 'rgba(56,189,248,0.12)'
      ctx.fillRect(tx, ty, tw, th)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.strokeRect(tx, ty, tw, th)
      // streaks scroll upward relative to the sphere
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      for (let k = 0; k < 8; k++) {
        const yy = ty + ((k * 40 - y + 600) % 300)
        ctx.beginPath(); ctx.moveTo(tx + 15 + (k % 3) * 40, yy); ctx.lineTo(tx + 15 + (k % 3) * 40, yy + 12 * (v / c.vt) + 1); ctx.stroke()
      }
      const r = 6 + 10 * (logD + 1.7) / 3
      const sx = tx + tw / 2, sy = ty + th / 2
      ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 2 * Math.PI); ctx.fill()
      const fl1 = c.b * v / c.wt, fq = c.a * v * v / c.wt
      ctx.lineWidth = 4
      ctx.strokeStyle = C_W; ctx.beginPath(); ctx.moveTo(sx, sy + r); ctx.lineTo(sx, sy + r + 70); ctx.stroke()
      ctx.strokeStyle = C_LIN; ctx.beginPath(); ctx.moveTo(sx - 8, sy - r); ctx.lineTo(sx - 8, sy - r - 70 * fl1); ctx.stroke()
      ctx.strokeStyle = C_QUAD; ctx.beginPath(); ctx.moveTo(sx + 8, sy - r); ctx.lineTo(sx + 8, sy - r - 70 * fq); ctx.stroke()
      ctx.lineWidth = 1
      ctx.fillStyle = '#94a3b8'; ctx.fillText(`d = ${(10 ** logD).toFixed(2)} mm glass`, tx, ty - 10)
      ctx.fillText(`in ${fl.name}`, tx, ty + th + 18)
      ctx.fillStyle = C_LIN; ctx.fillText('b·v', sx - 40, sy - r - 74 * Math.max(fl1, 0.15))
      ctx.fillStyle = C_QUAD; ctx.fillText('a·v²', sx + 14, sy - r - 74 * Math.max(fq, 0.15))
      ctx.fillStyle = C_W; ctx.fillText('weight', sx + 8, sy + r + 64)

      // force vs v plot
      const px0 = 210, px1 = 470, py0 = 30, py1 = 300
      const X = (u: number) => px0 + (u / 1.5) * (px1 - px0)
      const Y = (f: number) => py1 - (f / 2) * (py1 - py0)
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(px0, py0, px1 - px0, py1 - py0)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('force / weight', px0, py0 - 10)
      for (const u of [0, 0.5, 1, 1.5]) ctx.fillText(u.toFixed(1), X(u) - 8, py1 + 16)
      ctx.fillText('v / v_t', px1 - 40, py1 + 32)
      for (const f of [0, 1, 2]) ctx.fillText(`${f}`, px0 - 14, Y(f) + 4)
      ctx.strokeStyle = C_W; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(px0, Y(1)); ctx.lineTo(px1, Y(1)); ctx.stroke(); ctx.setLineDash([])
      const curve = (fn: (u: number) => number, col: string, w: number) => {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath()
        for (let i = 0; i <= 60; i++) { const u = 1.5 * i / 60; const yy = Math.max(Y(fn(u)), py0); i ? ctx.lineTo(X(u), yy) : ctx.moveTo(X(u), yy) }
        ctx.stroke(); ctx.lineWidth = 1
      }
      curve((u) => c.b * u * c.vt / c.wt, C_LIN, 2)
      curve((u) => c.a * (u * c.vt) ** 2 / c.wt, C_QUAD, 2)
      curve((u) => (c.b * u * c.vt + c.a * (u * c.vt) ** 2) / c.wt, C_TOT, 2)
      const u0 = v / c.vt
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(X(u0), Y(fl1 + fq), 5, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = C_TOT; ctx.fillText('total', X(1.15), Math.max(Y((c.b * 1.15 * c.vt + c.a * (1.15 * c.vt) ** 2) / c.wt), py0 + 12) - 6)

      // v(t) history
      const hx0 = 510, hx1 = 740
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(hx0, py0, hx1 - hx0, py1 - py0)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('v / v_t  vs  t / τ', hx0, py0 - 10)
      const HY = (u: number) => py1 - u * (py1 - py0) * 0.9
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(hx0, HY(1)); ctx.lineTo(hx1, HY(1)); ctx.stroke(); ctx.setLineDash([])
      for (const s of [0, 2, 4, 6]) ctx.fillText(`${s}`, hx0 + (s / 6) * (hx1 - hx0) - 4, py1 + 16)
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.beginPath()
      hist.forEach((u, i) => { const xx = hx0 + (i / 360) * (hx1 - hx0); i ? ctx.lineTo(xx, HY(u)) : ctx.moveTo(xx, HY(u)) })
      ctx.stroke(); ctx.lineWidth = 1

      // Re strip
      const re = fl.rho * v * d / fl.mu, reT = fl.rho * c.vt * d / fl.mu
      const rx0 = 210, rx1 = 740, ry = 360
      const RX = (r: number) => rx0 + ((Math.log10(Math.max(r, 1e-4)) + 4) / 9) * (rx1 - rx0)
      const grd = ctx.createLinearGradient(rx0, 0, rx1, 0)
      grd.addColorStop(0, C_LIN); grd.addColorStop((RX(60) - rx0) / (rx1 - rx0), '#a78bfa'); grd.addColorStop(1, C_QUAD)
      ctx.fillStyle = grd; ctx.fillRect(rx0, ry - 4, rx1 - rx0, 8)
      ctx.fillStyle = '#94a3b8'
      for (const e of [-4, -2, 0, 2, 4]) ctx.fillText(`1e${e}`, RX(10 ** e) - 12, ry + 22)
      ctx.fillText('Re_t (log)', rx0 - 2, ry - 12)
      ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(RX(60), ry - 9); ctx.lineTo(RX(60), ry + 9); ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.fillText('60: b·v = a·v²', RX(60) - 40, ry - 12)
      ctx.fillStyle = C_LIN; ctx.fillText('Du Buat pipe', rx0 + 120, ry - 12)
      ctx.fillStyle = C_QUAD; ctx.fillText('Bossut ship', RX(3e3), ry - 12)
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(RX(reT), ry + 6); ctx.lineTo(RX(reT) - 6, ry + 16); ctx.lineTo(RX(reT) + 6, ry + 16); ctx.fill()

      if (++frame % 12 === 0) setRead({ v, vt: c.vt, re, lin: 100 * c.b * v / Math.max(c.b * v + c.a * v * v, 1e-30) })
      raf = requestAnimationFrame(drawFrame)
    }
    raf = requestAnimationFrame(drawFrame)
    return () => cancelAnimationFrame(raf)
  }, [logD, fi, nonce])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>d = {(10 ** logD).toFixed(2)} mm <input type="range" min={-1.7} max={1.3} step={0.01} value={logD} onChange={(e) => setLogD(+e.target.value)} /></label>
        <span>fluid:</span>
        {FLUIDS.map((f, i) => (
          <button key={f.name} style={btn(fi === i)} onClick={() => setFi(i)}>{f.name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setNonce((n) => n + 1); setPlaying(true) }}>Drop again</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        v = {(read.v * 1e3).toPrecision(3)} mm/s · v_t = {(read.vt * 1e3).toPrecision(4)} mm/s · Re = {read.re.toPrecision(3)} ·{' '}
        <span style={{ color: C_LIN }}>linear share {read.lin.toFixed(1)}%</span> ·{' '}
        <span style={{ color: C_QUAD }}>quadratic {(100 - read.lin).toFixed(1)}%</span>
      </div>
    </div>
  )
}
