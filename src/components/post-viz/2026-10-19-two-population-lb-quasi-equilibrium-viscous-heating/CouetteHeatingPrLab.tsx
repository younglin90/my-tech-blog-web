'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 380
const N = 21
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const WT = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const CV = 1
const T0 = 1
const SMAX = 12000

type Sim = { f: Float64Array; g: Float64Array; quasi: boolean; hist: number[] }

function eqF(rho: number, ux: number, out: number[]) {
  for (let k = 0; k < 9; k++) { const cu = CX[k] * ux; out[k] = WT[k] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * ux * ux) }
}
function eqG(E: number, rho: number, ux: number, out: number[]) {
  const p = rho * (E / rho - 0.5 * ux * ux) / CV
  const qx = (E + p) * ux
  for (let k = 0; k < 9; k++) { const cu = CX[k] * ux; out[k] = WT[k] * (E + 3 * CX[k] * qx + 4.5 * E * cu * cu - 1.5 * E * ux * ux) }
}
function init(quasi: boolean): Sim {
  const f = new Float64Array(9 * N), g = new Float64Array(9 * N)
  const a: number[] = [], b: number[] = []
  eqF(1, 0, a); eqG(CV * T0, 1, 0, b)
  for (let j = 0; j < N; j++) for (let k = 0; k < 9; k++) { f[k * N + j] = a[k]; g[k * N + j] = b[k] }
  return { f, g, quasi, hist: [0] }
}
function macro(s: Sim, j: number) {
  let rho = 0, mx = 0, E = 0
  for (let k = 0; k < 9; k++) { rho += s.f[k * N + j]; mx += CX[k] * s.f[k * N + j]; E += s.g[k * N + j] }
  return { rho, ux: mx / rho, E }
}
function theta(s: Sim, U: number) {
  const out: number[] = []
  for (let j = 0; j < N; j++) {
    const m = macro(s, j)
    out.push(((m.E / m.rho - 0.5 * m.ux * m.ux) / CV - T0) / (U * U / (8 * CV)))
  }
  return out
}

const fe: number[] = [], ge: number[] = [], fn: number[] = [], gn: number[] = [], fw: number[] = [], gw: number[] = []
function step(s: Sim, omMu: number, omKa: number, U: number) {
  const { f, g } = s
  for (let j = 0; j < N; j++) {
    const { rho, ux, E } = macro(s, j)
    eqF(rho, ux, fe); eqG(E, rho, ux, ge)
    let pxy = 0
    for (let k = 0; k < 9; k++) pxy += CX[k] * CY[k] * (f[k * N + j] - fe[k])
    for (let k = 0; k < 9; k++) {
      const i = k * N + j
      f[i] += omMu * (fe[k] - f[i])
      if (s.quasi) {
        const gs = ge[k] + WT[k] * 3 * CY[k] * ux * pxy // g*: energy flux + u·(P − Peq)
        g[i] += omMu * (ge[k] - g[i]) + (omKa - omMu) * (gs - g[i])
      } else {
        g[i] += omKa * (ge[k] - g[i])
      }
    }
  }
  // streaming along y (x is one periodic cell)
  for (let k = 0; k < 9; k++) {
    if (CY[k] === 0) continue
    const fr = f.slice(k * N, k * N + N), gr = g.slice(k * N, k * N + N)
    for (let j = 0; j < N; j++) { const src = (j - CY[k] + N) % N; f[k * N + j] = fr[src]; g[k * N + j] = gr[src] }
  }
  // non-equilibrium extrapolation walls: bottom at rest, top moving with U
  for (const [wall, nb, uw] of [[0, 1, 0], [N - 1, N - 2, U]]) {
    const m = macro(s, nb)
    eqF(m.rho, m.ux, fn); eqG(m.E, m.rho, m.ux, gn)
    eqF(m.rho, uw, fw); eqG(m.rho * (CV * T0 + 0.5 * uw * uw), m.rho, uw, gw)
    for (let k = 0; k < 9; k++) {
      f[k * N + wall] = fw[k] + f[k * N + nb] - fn[k]
      g[k * N + wall] = gw[k] + g[k * N + nb] - gn[k]
    }
  }
}

const C_N = '#f87171'
const C_Q = '#34d399'
const C_X = '#e2e8f0'

export function CouetteHeatingPrLab() {
  const [pr, setPr] = useState(0.71)
  const [U, setU] = useState(0.1)
  const [tauMu, setTauMu] = useState(1)
  const [spf, setSpf] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, tN: 0, tQ: 0, um: 0 })
  const ref = useRef<HTMLCanvasElement>(null)
  const sims = useRef<{ a: Sim; b: Sim; n: number }>({ a: init(false), b: init(true), n: 0 })
  const playRef = useRef(playing)
  playRef.current = playing

  const tauKa = Math.max(0.51, 0.5 + (tauMu - 0.5) / pr)
  const omMu = 1 / tauMu, omKa = 1 / tauKa
  const adv = useRef((m: number) => { void m })
  adv.current = (m: number) => {
    const S = sims.current
    for (let i = 0; i < m && S.n < SMAX; i++) {
      step(S.a, omMu, omKa, U); step(S.b, omMu, omKa, U); S.n++
      if (S.n % 50 === 0) { S.a.hist.push(Math.max(...theta(S.a, U))); S.b.hist.push(Math.max(...theta(S.b, U))) }
    }
  }

  useEffect(() => { sims.current = { a: init(false), b: init(true), n: 0 } }, [pr, U, tauMu, nonce])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0
    const draw = () => {
      const S = sims.current
      if (playRef.current) { adv.current(spf); if (S.n >= SMAX) setPlaying(false) }
      const tA = theta(S.a, U), tB = theta(S.b, U)
      const top = Math.max(1.15, pr * 1.15, ...tA, ...tB)
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // left: profiles θ(y)
      const x0 = 50, x1 = 340, y0 = 40, y1 = H - 50
      const px = (t: number) => x0 + (t / top) * (x1 - x0)
      const py = (j: number) => y1 - (j / (N - 1)) * (y1 - y0)
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('θ = (T − T0) / (U²/8cv)', x0, 28)
      ctx.fillText('wall, U →', x1 - 70, y0 - 4); ctx.fillText('wall at rest', x0, y1 + 16)
      for (let t = 0; t <= top; t += 0.5) ctx.fillText(t.toFixed(1), px(t) - 8, y1 + 32)
      // u profile as faint arrows
      for (let j = 0; j < N; j += 2) {
        const m = macro(S.b, j)
        ctx.strokeStyle = 'rgba(56,189,248,0.35)'; ctx.beginPath()
        ctx.moveTo(x0, py(j)); ctx.lineTo(x0 + (m.ux / Math.max(U, 1e-9)) * 60, py(j)); ctx.stroke()
      }
      ctx.strokeStyle = C_X; ctx.setLineDash([5, 4]); ctx.beginPath()
      for (let j = 0; j <= 40; j++) { const e = j / 40, y = y1 - e * (y1 - y0), x = px(4 * pr * e * (1 - e)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
      ctx.stroke(); ctx.setLineDash([])
      for (const [arr, c] of [[tA, C_N], [tB, C_Q]] as [number[], string][]) {
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath()
        arr.forEach((t, j) => (j ? ctx.lineTo(px(t), py(j)) : ctx.moveTo(px(t), py(j))))
        ctx.stroke()
        ctx.fillStyle = c; arr.forEach((t, j) => ctx.fillRect(px(t) - 2, py(j) - 2, 4, 4))
      }
      ctx.lineWidth = 1
      // right: θ_max history
      const hx0 = 400, hx1 = 740
      const hx = (i: number) => hx0 + (i * 50 / SMAX) * (hx1 - hx0)
      const hy = (t: number) => y1 - (t / top) * (y1 - y0)
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.strokeRect(hx0, y0, hx1 - hx0, y1 - y0)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('θ_max vs step', hx0, 28)
      for (let s = 0; s <= SMAX; s += 4000) ctx.fillText(`${s}`, hx0 + (s / SMAX) * (hx1 - hx0) - 10, y1 + 16)
      ctx.strokeStyle = C_X; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(hx0, hy(pr)); ctx.lineTo(hx1, hy(pr)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = C_X; ctx.fillText(`exact = Pr = ${pr.toFixed(2)}`, hx0 + 6, hy(pr) - 6)
      for (const [h, c] of [[S.a.hist, C_N], [S.b.hist, C_Q]] as [number[], string][]) {
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath()
        h.forEach((t, i) => (i ? ctx.lineTo(hx(i), hy(t)) : ctx.moveTo(hx(i), hy(t))))
        ctx.stroke()
      }
      ctx.lineWidth = 1
      ctx.fillStyle = C_N; ctx.fillText('2-τ only (g → g_eq at ωκ)', hx0 + 6, y1 + 34)
      ctx.fillStyle = C_Q; ctx.fillText('with quasi-equilibrium g*', hx0 + 190, y1 + 34)
      if (++frame % 12 === 0) {
        setRead({ n: S.n, tN: Math.max(...tA), tQ: Math.max(...tB), um: macro(S.b, (N - 1) / 2).ux / U })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [spf, pr, U])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Pr = {pr.toFixed(2)} <input type="range" min={0.3} max={3} step={0.01} value={pr} onChange={(e) => setPr(+e.target.value)} /></label>
        <label>U = {U.toFixed(3)} <input type="range" min={0.02} max={0.15} step={0.005} value={U} onChange={(e) => setU(+e.target.value)} /></label>
        <label>τμ = {tauMu.toFixed(2)} <input type="range" min={0.6} max={1.8} step={0.05} value={tauMu} onChange={(e) => setTauMu(+e.target.value)} /></label>
        <span>→ τκ = {tauKa.toFixed(3)}</span>
        <label>steps/frame {spf} <input type="range" min={1} max={200} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(50) }}>Step ×50</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        step {read.n} · θ_max: <span style={{ color: C_N }}>2-τ {read.tN.toFixed(3)}</span> ·{' '}
        <span style={{ color: C_Q }}>g* {read.tQ.toFixed(3)}</span> · exact {pr.toFixed(3)} · u(mid)/U {read.um.toFixed(4)}
      </div>
    </div>
  )
}
