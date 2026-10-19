'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 760
const H = 400
const RHO = 1000
const MU = 1.0e-3
const G = 9.81
const STEPS_PER_TAU = 400
const C_P = '#fbbf24'
const C_R = '#38bdf8'

function weight(d: number, rp: number) { return (rp - RHO) * Math.PI * d ** 3 / 6 * G }
function pronyDrag(d: number, v: number, cinf: number) {
  return [3 * Math.PI * MU * d * v, cinf * Math.PI / 8 * RHO * d * d * v * v]
}
function vtProny(d: number, rp: number, cinf: number) {
  const a = cinf * Math.PI / 8 * RHO * d * d, b = 3 * Math.PI * MU * d
  return (-b + Math.sqrt(b * b + 4 * a * weight(d, rp))) / (2 * a)
}
function cdSchiller(re: number) { return re < 1000 ? 24 / re * (1 + 0.15 * re ** 0.687) : 0.44 }
function refDrag(d: number, v: number) {
  if (v <= 0) return 0
  return cdSchiller(RHO * v * d / MU) * 0.5 * RHO * v * v * Math.PI * d * d / 4
}
function vtRef(d: number, rp: number) {
  let lo = 1e-9, hi = 10
  const wt = weight(d, rp)
  for (let i = 0; i < 80; i++) { const v = 0.5 * (lo + hi); if (refDrag(d, v) < wt) lo = v; else hi = v }
  return 0.5 * (lo + hi)
}

type Run = { v: number; t: number; t99: number; hist: number[] }

export function PronySettlingRaceLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [logD, setLogD] = useState(Math.log10(0.3))
  const [cinf, setCinf] = useState(0.4)
  const [rp, setRp] = useState(2500)
  const [spf, setSpf] = useState(8)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, vP: 0, vR: 0, t99: 0 })
  const playRef = useRef(playing)
  playRef.current = playing
  const adv = useRef<(n: number) => void>(() => {})

  const d = 10 ** logD * 1e-3
  const stat = useMemo(() => {
    const vt = vtProny(d, rp, cinf), vr = vtRef(d, rp)
    const [lin, quad] = pronyDrag(d, vt, cinf)
    const wt = weight(d, rp)
    return {
      vt, vr, re: RHO * vt * d / MU, err: 100 * (vt - vr) / vr, lin: 100 * lin / (lin + quad),
      st: wt / (3 * Math.PI * MU * d) / vt, nw: Math.sqrt(wt / (cinf * Math.PI / 8 * RHO * d * d)) / vt,
    }
  }, [d, rp, cinf])
  // err% vs d scan over the whole slider range (the output table as a curve)
  const scan = useMemo(() => {
    const out: [number, number][] = []
    for (let i = 0; i <= 120; i++) {
      const ld = -1.7 + 3 * i / 120, dd = 10 ** ld * 1e-3
      const a = vtProny(dd, rp, cinf), b = vtRef(dd, rp)
      out.push([ld, 100 * (a - b) / b])
    }
    return out
  }, [rp, cinf])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const m = rp * Math.PI * d ** 3 / 6
    const wt = weight(d, rp)
    const tau = stat.vt / ((1 - RHO / rp) * G)
    const dt = tau / STEPS_PER_TAU
    const P: Run = { v: 0, t: 0, t99: 0, hist: [0] }
    const R: Run = { v: 0, t: 0, t99: 0, hist: [0] }
    let n = 0, frame = 0, raf = 0
    const tEnd = 7 * tau

    const step = () => {
      if (P.t >= tEnd) return
      const [lin, quad] = pronyDrag(d, P.v, cinf)
      P.v += dt * (wt - lin - quad) / m; P.t += dt
      R.v += dt * (wt - refDrag(d, R.v)) / m; R.t += dt
      if (!P.t99 && P.v >= 0.99 * stat.vt) P.t99 = P.t
      if (!R.t99 && R.v >= 0.99 * stat.vr) R.t99 = R.t
      n++
      if (n % 10 === 0) { P.hist.push(P.v); R.hist.push(R.v) }
    }
    adv.current = (k: number) => { for (let i = 0; i < k; i++) step() }

    const draw = () => {
      if (playRef.current) for (let i = 0; i < spf; i++) step()
      ctx.fillStyle = '#08111f'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      const vmax = Math.max(stat.vt, stat.vr) * 1.15

      // two columns: sphere position = integral of v (scrolling streaks show speed)
      const cols: [Run, string, string][] = [[P, C_P, 'Prony a·v²+b·v'], [R, C_R, 'Schiller–Naumann']]
      cols.forEach(([run, col, name], k) => {
        const x0 = 20 + k * 90, y0 = 40, h = 300
        ctx.fillStyle = 'rgba(56,189,248,0.08)'; ctx.fillRect(x0, y0, 70, h)
        ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(x0, y0, 70, h)
        const y = y0 + 12 + (h - 24) * Math.min(run.v / vmax, 1)
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0 + 35, y, 9, 0, 2 * Math.PI); ctx.fill()
        ctx.fillStyle = col; ctx.fillText(k ? 'S–N ref' : 'Prony', x0 + 10, y0 - 8)
        ctx.fillStyle = '#94a3b8'; ctx.fillText(`${(run.v * 1e3).toFixed(1)}`, x0 + 12, y0 + h + 16)
        void name
      })
      ctx.fillStyle = '#94a3b8'; ctx.fillText('↓ depth ∝ v (mm/s)', 20, 376)

      // v(t) history
      const hx0 = 230, hx1 = 500, hy0 = 40, hy1 = 340
      const X = (t: number) => hx0 + (t / tEnd) * (hx1 - hx0)
      const Y = (v: number) => hy1 - (v / vmax) * (hy1 - hy0)
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(hx0, hy0, hx1 - hx0, hy1 - hy0)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('v [mm/s]  vs  t / τ', hx0, hy0 - 8)
      for (let s = 0; s <= 7; s++) ctx.fillText(`${s}`, X(s * tau) - 3, hy1 + 16)
      for (const [vv, col] of [[stat.vt, C_P], [stat.vr, C_R]] as [number, string][]) {
        ctx.strokeStyle = col; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(hx0, Y(vv)); ctx.lineTo(hx1, Y(vv)); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = col; ctx.fillText(`${(vv * 1e3).toFixed(2)}`, hx1 - 52, Y(vv) - 4)
      }
      for (const [run, col] of [[P, C_P], [R, C_R]] as [Run, string][]) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        run.hist.forEach((v, i) => { const xx = X(i * 10 * dt); i ? ctx.lineTo(xx, Y(v)) : ctx.moveTo(xx, Y(v)) })
        ctx.stroke(); ctx.lineWidth = 1
        if (run.t99) { ctx.fillStyle = col; ctx.fillRect(X(run.t99) - 1, hy1 - 8, 3, 8) }
      }

      // err% vs d scan
      const sx0 = 540, sx1 = 740, sy0 = 40, sy1 = 340
      const SX = (ld: number) => sx0 + ((ld + 1.7) / 3) * (sx1 - sx0)
      const emax = Math.max(50, ...scan.map((p) => Math.abs(p[1])))
      const SY = (e: number) => (sy0 + sy1) / 2 - (e / emax) * (sy1 - sy0) / 2
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0)
      ctx.beginPath(); ctx.moveTo(sx0, SY(0)); ctx.lineTo(sx1, SY(0)); ctx.stroke()
      ctx.fillStyle = '#94a3b8'; ctx.fillText('v_t error % vs d [mm]', sx0, sy0 - 8)
      for (const ld of [-1, 0, 1]) ctx.fillText(`${10 ** ld}`, SX(ld) - 8, sy1 + 16)
      ctx.fillText(`+${emax.toFixed(0)}%`, sx0 + 4, sy0 + 14); ctx.fillText(`-${emax.toFixed(0)}%`, sx0 + 4, sy1 - 6)
      ctx.strokeStyle = C_P; ctx.lineWidth = 2; ctx.beginPath()
      scan.forEach(([ld, e], i) => (i ? ctx.lineTo(SX(ld), SY(e)) : ctx.moveTo(SX(ld), SY(e))))
      ctx.stroke(); ctx.lineWidth = 1
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(SX(logD), SY(stat.err), 5, 0, 2 * Math.PI); ctx.fill()

      if (++frame % 12 === 0) setRead({ n, vP: P.v, vR: R.v, t99: P.t99 / tau })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [d, rp, cinf, spf, nonce, stat, scan, logD])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? C_P : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(251,191,36,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>d = {(10 ** logD).toFixed(2)} mm <input type="range" min={-1.7} max={1.3} step={0.01} value={logD} onChange={(e) => setLogD(+e.target.value)} /></label>
        <label>C∞ = {cinf.toFixed(2)} <input type="range" min={0.2} max={0.6} step={0.01} value={cinf} onChange={(e) => setCinf(+e.target.value)} /></label>
        <label>ρp = {rp} kg/m³ <input type="range" min={1100} max={8000} step={100} value={rp} onChange={(e) => setRp(+e.target.value)} /></label>
        <label>steps/frame {spf} <input type="range" min={1} max={60} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(20) }}>Step ×20</button>
        <button style={btn(false)} onClick={() => { setNonce((k) => k + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        step {read.n} · <span style={{ color: C_P }}>Prony v = {(read.vP * 1e3).toFixed(2)}</span> ·{' '}
        <span style={{ color: C_R }}>ref v = {(read.vR * 1e3).toFixed(2)}</span> mm/s · t99/τ = {read.t99 ? read.t99.toFixed(2) : '…'}<br />
        Re_t {stat.re.toFixed(2)} · vt {(stat.vt * 1e3).toFixed(2)} · ref {(stat.vr * 1e3).toFixed(2)} · err {stat.err.toFixed(1)}% ·
        lin {stat.lin.toFixed(1)}% · Stokes/vt {stat.st.toFixed(2)} · Newton/vt {stat.nw.toFixed(2)}
      </div>
    </div>
  )
}
