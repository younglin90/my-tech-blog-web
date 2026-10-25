'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 760
const H = 400
const N = 240

// reduced van der Waals: rho_c = T_c = p_c = 1
const p0 = (r: number, T: number) => (8 * T * r) / (3 - r) - 3 * r * r
const mu0 = (r: number, T: number) => ((8 * T) / 3) * (Math.log(r / (3 - r)) + r / (3 - r)) - 6 * r

function maxwell(T: number) {
  let rg = 1 - 2 * Math.sqrt(1 - T), rl = 1 + 2 * Math.sqrt(1 - T)
  const h = 1e-7
  for (let k = 0; k < 50; k++) {
    const f1 = mu0(rl, T) - mu0(rg, T), f2 = p0(rl, T) - p0(rg, T)
    const a = (mu0(rl + h, T) - mu0(rl, T)) / h, b = -(mu0(rg + h, T) - mu0(rg, T)) / h
    const c = (p0(rl + h, T) - p0(rl, T)) / h, d = -(p0(rg + h, T) - p0(rg, T)) / h
    const det = a * d - b * c
    rl -= (d * f1 - b * f2) / det
    rg -= (-c * f1 + a * f2) / det
  }
  return [rg, rl]
}

type Prof = { z: Float64Array; r: Float64Array; pN: Float64Array; pT: Float64Array; pb: number; rg: number; rl: number; sigma: number; width: number; L: number }

// fine-grid equilibrium profile: relax mu0 - kappa rho'' = mu_b, then evaluate the Korteweg tensor
function solve(T: number, kappa: number): Prof {
  const [rg, rl] = maxwell(T)
  const mub = mu0(rl, T), pb = p0(rl, T)
  const L = 14 * Math.sqrt(kappa / (1 - T)), dz = L / N
  const z = new Float64Array(N), r = new Float64Array(N), res = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    z[i] = (i + 0.5) * dz - L / 2
    r[i] = 0.5 * (rl + rg) + 0.5 * (rl - rg) * Math.tanh((z[i] * Math.sqrt(1 - T)) / Math.sqrt(kappa))
  }
  const dt = (0.2 * dz * dz) / kappa
  for (let it = 0; it < 20000; it++) {
    let m = 0
    for (let i = 0; i < N; i++) {
      const a = r[i > 0 ? i - 1 : 0], b = r[i < N - 1 ? i + 1 : N - 1]
      res[i] = mu0(r[i], T) - (kappa * (a - 2 * r[i] + b)) / (dz * dz) - mub
      m = Math.max(m, Math.abs(res[i]))
    }
    for (let i = 0; i < N; i++) r[i] -= dt * res[i]
    if (m < 1e-9) break
  }
  const pN = new Float64Array(N), pT = new Float64Array(N)
  let sigma = 0, gmax = 0
  for (let i = 0; i < N; i++) {
    const a = r[i > 0 ? i - 1 : 0], b = r[i < N - 1 ? i + 1 : N - 1]
    const d1 = (b - a) / (2 * dz), lap = (a - 2 * r[i] + b) / (dz * dz)
    const iso = p0(r[i], T) - kappa * r[i] * lap
    pN[i] = iso + 0.5 * kappa * d1 * d1
    pT[i] = iso - 0.5 * kappa * d1 * d1
    sigma += (pN[i] - pT[i]) * dz
    gmax = Math.max(gmax, Math.abs(d1))
  }
  return { z, r, pN, pT, pb, rg, rl, sigma, width: (rl - rg) / gmax, L }
}

export function KortewegStressProbeLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [T, setT] = useState(0.85)
  const [kappa, setKappa] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [probe, setProbe] = useState(0.5)
  const probeRef = useRef(0.5)
  const [read, setRead] = useState({ zp: 0, rho: 0, dN: 0, dT: 0 })
  const prof = useMemo(() => solve(T, kappa), [T, kappa])

  useEffect(() => { probeRef.current = probe }, [probe])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let raf = 0, frame = 0, dir = 1
    const P = prof
    const x0 = 56, x1 = 500
    const zMin = -P.L / 2, zMax = P.L / 2
    const X = (z: number) => x0 + ((z - zMin) / (zMax - zMin)) * (x1 - x0)
    let dmin = 0
    for (let i = 0; i < N; i++) dmin = Math.min(dmin, P.pT[i] - P.pb)
    const dScale = Math.max(-dmin * 1.25, 1e-4)
    const draw = () => {
      frame++
      if (playing) {
        let s = probeRef.current + dir * 0.0025
        if (s > 0.92) { s = 0.92; dir = -1 }
        if (s < 0.08) { s = 0.08; dir = 1 }
        probeRef.current = s
      }
      const s = probeRef.current
      const ip = Math.min(N - 1, Math.max(0, Math.round(s * (N - 1))))
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-sans-serif, system-ui'
      // panel A: density profile
      const yA0 = 30, yA1 = 170
      const YA = (r: number) => yA1 - ((r - 0) / 2.2) * (yA1 - yA0)
      for (let i = 0; i < N - 1; i++) {
        const t = (P.r[i] - P.rg) / (P.rl - P.rg)
        ctx.fillStyle = `rgba(${Math.round(56 + 40 * t)},${Math.round(130 + 60 * t)},${Math.round(200 + 48 * t)},${0.12 + 0.35 * t})`
        ctx.fillRect(X(P.z[i]), YA(P.r[i]), X(P.z[i + 1]) - X(P.z[i]) + 1, yA1 - YA(P.r[i]))
      }
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < N; i++) { const x = X(P.z[i]), y = YA(P.r[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('density ρ(z)', x0, yA0 - 10)
      ctx.fillText(`gas ρ=${P.rg.toFixed(3)}`, x0 + 4, YA(P.rg) - 6)
      ctx.fillText(`liquid ρ=${P.rl.toFixed(3)}`, x1 - 110, YA(P.rl) - 6)
      // panel B: pN - pb and pT - pb
      const yB0 = 210, yB1 = 370, yMid = yB0 + 30
      const YB = (d: number) => yMid - (d / dScale) * (yB1 - yMid)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x1, yMid); ctx.stroke()
      ctx.fillStyle = 'rgba(249,115,22,0.22)'; ctx.beginPath(); ctx.moveTo(X(P.z[0]), yMid)
      for (let i = 0; i < N; i++) ctx.lineTo(X(P.z[i]), YB(P.pT[i] - P.pb))
      ctx.lineTo(X(P.z[N - 1]), yMid); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < N; i++) { const x = X(P.z[i]), y = YB(P.pT[i] - P.pb); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke()
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < N; i++) { const x = X(P.z[i]), y = YB(P.pN[i] - P.pb); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke()
      ctx.fillStyle = '#22c55e'; ctx.fillText('p_N − p_b (normal)', x0, yB0 - 8)
      ctx.fillStyle = '#f97316'; ctx.fillText('p_T − p_b (tangential)', x0 + 150, yB0 - 8)
      ctx.fillStyle = '#fdba74'; ctx.fillText(`shaded area = σ = ${P.sigma.toFixed(4)}`, x0 + 320, yB0 - 8)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('z  (lattice-free units)', x1 - 130, yB1 + 18)
      ctx.fillText(`${(-dScale).toFixed(3)}`, 8, YB(-dScale) + 4); ctx.fillText('0', 40, yMid + 4)
      // probe line
      const xp = X(P.z[ip])
      ctx.strokeStyle = 'rgba(250,204,21,0.9)'; ctx.setLineDash([4, 4]); ctx.beginPath()
      ctx.moveTo(xp, yA0); ctx.lineTo(xp, yB1); ctx.stroke(); ctx.setLineDash([])
      // fluid element: arrows ∝ pN (along z, horizontal) and pT (in-plane, vertical)
      const cx = 630, cy = 200, half = 34
      const kN = P.pN[ip] / P.pb, kT = P.pT[ip] / P.pb
      ctx.strokeStyle = 'rgba(148,163,184,0.6)'; ctx.setLineDash([3, 3]); ctx.beginPath()
      ctx.arc(cx, cy, half + 60, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(56,189,248,0.25)'; ctx.fillRect(cx - half, cy - half, 2 * half, 2 * half)
      ctx.strokeStyle = '#38bdf8'; ctx.strokeRect(cx - half, cy - half, 2 * half, 2 * half)
      const arrow = (xa: number, ya: number, xb: number, yb: number, col: string) => {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke()
        const a = Math.atan2(yb - ya, xb - xa)
        ctx.beginPath(); ctx.moveTo(xb, yb)
        ctx.lineTo(xb - 9 * Math.cos(a - 0.4), yb - 9 * Math.sin(a - 0.4))
        ctx.lineTo(xb - 9 * Math.cos(a + 0.4), yb - 9 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill()
      }
      const LN = 60 * kN, LT = 60 * kT
      // pressure pushes inward on each face
      arrow(cx - half - LN, cy, cx - half, cy, '#22c55e'); arrow(cx + half + LN, cy, cx + half, cy, '#22c55e')
      arrow(cx, cy - half - LT, cx, cy - half, '#f97316'); arrow(cx, cy + half + LT, cx, cy + half, '#f97316')
      ctx.lineWidth = 1
      ctx.fillStyle = '#cbd5e1'; ctx.fillText('fluid element at probe', cx - 62, 42)
      ctx.fillText('dashed circle = bulk p_b', cx - 66, 58)
      ctx.fillStyle = '#22c55e'; ctx.fillText(`p_N/p_b = ${kN.toFixed(3)}`, cx - 60, 340)
      ctx.fillStyle = '#f97316'; ctx.fillText(`p_T/p_b = ${kT.toFixed(3)}`, cx - 60, 358)
      if (frame % 12 === 0) setRead({ zp: P.z[ip], rho: P.r[ip], dN: P.pN[ip] - P.pb, dT: P.pT[ip] - P.pb })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [prof, playing])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>T/T_c = {T.toFixed(2)} <input type="range" min={0.75} max={0.98} step={0.01} value={T} onChange={(e) => setT(+e.target.value)} /></label>
        <label>κ = {kappa.toFixed(2)} <input type="range" min={0.1} max={8} step={0.05} value={kappa} onChange={(e) => setKappa(+e.target.value)} /></label>
        <label>probe <input type="range" min={0.08} max={0.92} step={0.005} value={probe} onChange={(e) => { setPlaying(false); setProbe(+e.target.value); probeRef.current = +e.target.value }} /></label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause sweep' : 'Play sweep'}</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        z = {read.zp.toFixed(2)} · ρ = {read.rho.toFixed(3)} ·{' '}
        <span style={{ color: '#22c55e' }}>p_N−p_b = {read.dN.toExponential(1)}</span> ·{' '}
        <span style={{ color: '#f97316' }}>p_T−p_b = {read.dT.toFixed(4)}</span> · σ = {prof.sigma.toFixed(4)} · σ/√κ = {(prof.sigma / Math.sqrt(kappa)).toFixed(4)} · width = {prof.width.toFixed(2)}
      </div>
    </div>
  )
}
