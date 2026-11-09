'use client'

import { useEffect, useRef, useState } from 'react'

// One flat-plate panel (chord 1, V = 1): a point vortex at x = a, a control point at x = b.
// Gamma is fixed by "no flow through the plate at b": Gamma / (2 pi (b - a)) = alpha.
// Exact thin-airfoil sheet: gamma(x) = 2 alpha sqrt((1-x)/x), total Gamma = pi alpha, centroid c/4.
const W = 760
const H = 520
const TOP = 300
const BG = '#0f172a'
const LUMP = '#f97316'
const EXA = '#38bdf8'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.22)'
const NP = 260
const NS = 40 // discrete vortices used to represent the exact sheet

// exact sheet represented by NS lumped vortices with the 1/4-3/4 placement (gives exact total)
function exactSheet(alpha: number) {
  const xv: number[] = [], g: number[] = []
  const dx = 1 / NS
  const xc: number[] = []
  for (let j = 0; j < NS; j++) { xv.push((j + 0.25) * dx); xc.push((j + 0.75) * dx) }
  const A = xc.map((xi) => xv.map((xj) => 1 / (2 * Math.PI * (xi - xj))))
  const rhs = xc.map(() => alpha)
  // Gaussian elimination
  const n = NS
  for (let k = 0; k < n; k++) {
    let p = k
    for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i
    ;[A[k], A[p]] = [A[p], A[k]];[rhs[k], rhs[p]] = [rhs[p], rhs[k]]
    for (let i = k + 1; i < n; i++) {
      const m = A[i][k] / A[k][k]
      for (let j = k; j < n; j++) A[i][j] -= m * A[k][j]
      rhs[i] -= m * rhs[k]
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = rhs[i]
    for (let j = i + 1; j < n; j++) s -= A[i][j] * g[j]
    g[i] = s / A[i][i]
  }
  return { xv, g }
}

export function LumpedVortexPlacementLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [alphaDeg, setAlphaDeg] = useState(8)
  const [a, setA] = useState(0.25)
  const [b, setB] = useState(0.5)
  const [mode, setMode] = useState<'lumped' | 'exact'>('lumped')
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const P = useRef({ x: new Float32Array(NP), y: new Float32Array(NP) })

  const alpha = (alphaDeg * Math.PI) / 180
  const d = b - a
  const gamma = d > 0.02 ? 2 * Math.PI * d * alpha : NaN
  const gEx = Math.PI * alpha
  const cmLump = -2 * gamma * a
  const cmEx = (-Math.PI / 2) * alpha
  const cmQ = -2 * gamma * (a - 0.25)

  useEffect(() => {
    const p = P.current
    for (let i = 0; i < NP; i++) { p.x[i] = -0.7 + Math.random() * 2.6; p.y[i] = -0.55 + Math.random() * 1.1 }
  }, [nonce])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const sheet = exactSheet(alpha)
    const vx: number[] = mode === 'lumped' ? [a] : sheet.xv
    const vg: number[] = mode === 'lumped' ? [Number.isFinite(gamma) ? gamma : 0] : sheet.g
    const X0 = 170, SC = 380, Y0 = 150
    const sx = (x: number) => X0 + x * SC
    const sy = (y: number) => Y0 - y * SC
    const vel = (x: number, y: number) => {
      let u = Math.cos(alpha), v = Math.sin(alpha)
      for (let k = 0; k < vx.length; k++) {
        const rx = x - vx[k], r2 = rx * rx + y * y + 4e-4
        u += (vg[k] / (2 * Math.PI)) * (y / r2)
        v -= (vg[k] / (2 * Math.PI)) * (rx / r2)
      }
      return [u, v]
    }
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)
    let raf = 0
    const draw = () => {
      // fade trails in the top panel
      ctx.fillStyle = 'rgba(15,23,42,0.18)'
      ctx.fillRect(0, 0, W, TOP)
      const p = P.current
      const dt = 0.006
      ctx.fillStyle = mode === 'lumped' ? LUMP : EXA
      for (let i = 0; i < NP; i++) {
        if (playing) {
          const [u1, v1] = vel(p.x[i], p.y[i])
          const [u2, v2] = vel(p.x[i] + 0.5 * dt * u1, p.y[i] + 0.5 * dt * v1)
          p.x[i] += dt * u2; p.y[i] += dt * v2
          if (p.x[i] > 1.55 || Math.abs(p.y[i]) > 0.62) { p.x[i] = -0.45 + Math.random() * 0.05; p.y[i] = -0.6 + Math.random() * 1.0 }
        }
        ctx.fillRect(sx(p.x[i]) - 1, sy(p.y[i]) - 1, 2, 2)
      }
      // plate
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(1), sy(0)); ctx.stroke()
      // normal-velocity residual arrows along the plate
      for (let k = 0; k <= 10; k++) {
        const x = 0.02 + 0.96 * (k / 10)
        const vn = vel(x, 0)[1]
        const len = Math.max(-40, Math.min(40, vn * 260))
        ctx.strokeStyle = Math.abs(vn) < 0.01 ? '#4ade80' : '#f87171'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(0) - len); ctx.stroke()
      }
      // vortex + control point
      if (mode === 'lumped') {
        ctx.fillStyle = LUMP; ctx.beginPath(); ctx.arc(sx(a), sy(0), 7, 0, 2 * Math.PI); ctx.fill()
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(sx(b) - 7, sy(0) - 7); ctx.lineTo(sx(b) + 7, sy(0) + 7); ctx.moveTo(sx(b) + 7, sy(0) - 7); ctx.lineTo(sx(b) - 7, sy(0) + 7); ctx.stroke()
      }
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, 24)
      ctx.fillStyle = TXT; ctx.font = '13px sans-serif'
      ctx.fillText(mode === 'lumped' ? `1 vortex (orange dot) at x/c=${a.toFixed(2)}, control point (green x) at x/c=${b.toFixed(2)}` : `exact sheet gamma(x) (40 vortices)`, 12, 17)
      ctx.fillText('arrows: flow through plate (red) / zero (green)', 440, TOP - 10)

      // bottom: induced normal velocity along chord
      const BX0 = 70, BX1 = W - 30, BY0 = TOP + 20, BY1 = H - 30
      ctx.fillStyle = BG; ctx.fillRect(0, TOP, W, H - TOP)
      const bx = (x: number) => BX0 + ((x + 0.2) / 1.6) * (BX1 - BX0)
      const wmax = 2.5 * alpha
      const by = (w: number) => BY1 - ((w + 0.25 * wmax) / (1.25 * wmax)) * (BY1 - BY0)
      ctx.strokeStyle = GRID; ctx.lineWidth = 1
      for (let x = -0.2; x <= 1.401; x += 0.2) { ctx.beginPath(); ctx.moveTo(bx(x), BY0); ctx.lineTo(bx(x), BY1); ctx.stroke() }
      ctx.beginPath(); ctx.moveTo(BX0, by(0)); ctx.lineTo(BX1, by(0)); ctx.stroke()
      ctx.fillStyle = 'rgba(226,232,240,0.12)'; ctx.fillRect(bx(0), BY0, bx(1) - bx(0), BY1 - BY0)
      // target downwash = V alpha on the plate
      ctx.strokeStyle = '#e2e8f0'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(bx(0), by(alpha)); ctx.lineTo(bx(1), by(alpha)); ctx.stroke(); ctx.setLineDash([])
      const curve = (xs: number[], gs: number[], col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        let pen = false
        for (let i = 0; i <= 400; i++) {
          const x = -0.2 + (1.6 * i) / 400
          let w = 0
          for (let k = 0; k < xs.length; k++) w += gs[k] / (2 * Math.PI * (x - xs[k]))
          const Y = by(w)
          if (!Number.isFinite(Y) || Y < BY0 - 2 || Y > BY1 + 2) { pen = false; continue }
          if (pen) ctx.lineTo(bx(x), Y); else ctx.moveTo(bx(x), Y)
          pen = true
        }
        ctx.stroke()
      }
      curve(sheet.xv, sheet.g, EXA)
      if (Number.isFinite(gamma)) curve([a], [gamma], LUMP)
      ctx.fillStyle = TXT; ctx.font = '12px sans-serif'
      for (let x = 0; x <= 1.001; x += 0.25) ctx.fillText(x.toFixed(2), bx(x) - 12, BY1 + 16)
      ctx.fillText('x/c', BX1 - 20, BY1 + 16)
      ctx.fillText('downwash w(x)/V', 8, BY0 + 4)
      ctx.fillStyle = '#e2e8f0'; ctx.fillText('target w = V·alpha', bx(1) + 6, by(alpha) + 4)
      ctx.fillStyle = LUMP; ctx.fillText('1 point vortex', bx(1.05), by(0.6 * wmax))
      ctx.fillStyle = EXA; ctx.fillText('exact sheet', bx(1.05), by(0.6 * wmax) + 16)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [alpha, a, b, gamma, mode, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const ok = Math.abs(d - 0.5) < 0.005

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>alpha = {alphaDeg}° <input type="range" min={2} max={12} step={1} value={alphaDeg} onChange={(e) => setAlphaDeg(Number(e.target.value))} /></label>
        <label>vortex a = {a.toFixed(2)} <input type="range" min={0} max={0.5} step={0.05} value={a} onChange={(e) => { const v = Number(e.target.value); setA(v); setB((bb) => Math.max(bb, v + 0.05)) }} /></label>
        <label>control b = {b.toFixed(2)} <input type="range" min={0.3} max={1} step={0.05} value={b} onChange={(e) => { const v = Number(e.target.value); setB(v); setA((aa) => Math.max(0, Math.min(aa, v - 0.05))) }} /></label>
        <button style={btn(mode === 'lumped')} onClick={() => setMode('lumped')}>1 vortex</button>
        <button style={btn(mode === 'exact')} onClick={() => setMode('exact')}>exact sheet</button>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
        <div>b − a = {d.toFixed(2)} c {ok ? '(half chord)' : ''}</div>
        <div style={{ color: ok ? '#4ade80' : LUMP }}>Γ / Γ_exact = CL / 2πα = {Number.isFinite(gamma) ? (gamma / gEx).toFixed(3) : '—'} (= 2(b−a)/c)</div>
        <div style={{ color: Math.abs(a - 0.25) < 0.01 && ok ? '#4ade80' : LUMP }}>Cm_LE = {Number.isFinite(gamma) ? cmLump.toFixed(4) : '—'} vs exact {cmEx.toFixed(4)} · Cm_c/4 = {Number.isFinite(gamma) ? cmQ.toFixed(4) : '—'} (exact 0)</div>
      </div>
    </div>
  )
}
