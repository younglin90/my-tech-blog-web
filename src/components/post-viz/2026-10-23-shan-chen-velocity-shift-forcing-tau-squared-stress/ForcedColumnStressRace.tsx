'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 400
const N = 32
const CS2 = 1 / 3
const CV = [0, 1, -1]
const WT = [2 / 3, 1 / 6, 1 / 6]
const KEYS = ['guo', 'sc', 'edm'] as const
type Key = typeof KEYS[number]
const COL: Record<Key, string> = { guo: '#22c55e', sc: '#f97316', edm: '#a78bfa' }
const NAME: Record<Key, string> = { guo: 'Guo', sc: 'Shan–Chen', edm: 'EDM' }

type Col = { f: Float64Array; hist: number[] }

function eq(rho: number, u: number, out: number[]) {
  for (let i = 0; i < 3; i++) { const cu = CV[i] * u; out[i] = WT[i] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * u * u) }
}
function initCol(): Col {
  const f = new Float64Array(3 * N), e: number[] = []
  eq(1, 0, e)
  for (let j = 0; j < N; j++) for (let i = 0; i < 3; i++) f[i * N + j] = e[i]
  return { f, hist: [] }
}
const fe: number[] = [], fs: number[] = [], post = new Float64Array(3 * N)
// one collide + stream step, same three schemes as the Python collide_node
function step(c: Col, key: Key, tau: number, F: Float64Array) {
  const f = c.f
  for (let j = 0; j < N; j++) {
    const f0 = f[j], fp = f[N + j], fm = f[2 * N + j]
    const rho = f0 + fp + fm, mom = fp - fm, Fj = F[j], loc = [f0, fp, fm]
    if (key === 'guo') {
      const u = (mom + 0.5 * Fj) / rho
      eq(rho, u, fe)
      for (let i = 0; i < 3; i++) {
        const S = WT[i] * ((CV[i] - u) * 3 + CV[i] * u * CV[i] * 9) * Fj
        post[i * N + j] = loc[i] - (loc[i] - fe[i]) / tau + (1 - 0.5 / tau) * S
      }
    } else if (key === 'sc') {
      eq(rho, mom / rho + tau * Fj / rho, fe)
      for (let i = 0; i < 3; i++) post[i * N + j] = loc[i] - (loc[i] - fe[i]) / tau
    } else {
      const up = mom / rho
      eq(rho, up, fe); eq(rho, up + Fj / rho, fs)
      for (let i = 0; i < 3; i++) post[i * N + j] = loc[i] - (loc[i] - fe[i]) / tau + fs[i] - fe[i]
    }
  }
  for (let j = 0; j < N; j++) {
    f[j] = post[j]
    f[N + j] = post[N + ((j - 1 + N) % N)]
    f[2 * N + j] = post[2 * N + ((j + 1) % N)]
  }
}
function density(c: Col) {
  const r = new Float64Array(N)
  for (let j = 0; j < N; j++) r[j] = c.f[j] + c.f[N + j] + c.f[2 * N + j]
  return r
}
// fit cs^2 rho = lam P - b F^2/rho + c  (same as stress_fit)
function stressFit(rho: Float64Array, F: Float64Array, G: number) {
  const k = 2 * Math.PI / N
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0]
  for (let j = 0; j < N; j++) {
    const x = [F[j] * F[j] / rho[j], -G / k * Math.cos(k * (j + 0.5)), 1], r = CS2 * rho[j]
    for (let a = 0; a < 3; a++) { v[a] += x[a] * r; for (let b = 0; b < 3; b++) A[a][b] += x[a] * x[b] }
  }
  for (let i = 0; i < 3; i++) for (let jj = i + 1; jj < 3; jj++) {
    const m = A[jj][i] / A[i][i]
    for (let c = 0; c < 3; c++) A[jj][c] -= m * A[i][c]
    v[jj] -= m * v[i]
  }
  const x = [0, 0, 0]
  for (let i = 2; i >= 0; i--) { let s = v[i]; for (let c = i + 1; c < 3; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i] }
  return { b: -x[0], lam: x[1], c: x[2] }
}

export function ForcedColumnStressRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tau, setTau] = useState(1.5)
  const [G, setG] = useState(0.02)
  const [spf, setSpf] = useState(10)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, guo: 0, sc: 0, edm: 0, drho: 0, res: 1, bad: false })
  const adv = useRef<(k: number) => void>(() => {})
  const playRef = useRef(playing)
  const spfRef = useRef(spf)
  playRef.current = playing
  spfRef.current = spf

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const F = new Float64Array(N)
    for (let j = 0; j < N; j++) F[j] = G * Math.sin(2 * Math.PI * (j + 0.5) / N)
    const cols: Record<Key, Col> = { guo: initCol(), sc: initCol(), edm: initCol() }
    let n = 0, frame = 0, raf = 0, res = 1, bad = false
    let prev = density(cols.guo)

    const advance = (k: number) => {
      if (bad) return
      for (let s = 0; s < k; s++) { for (const key of KEYS) step(cols[key], key, tau, F); n++ }
      const r = density(cols.guo)
      res = 0
      for (let j = 0; j < N; j++) res = Math.max(res, Math.abs(r[j] - prev[j]) / k)
      prev = r
      if (!Number.isFinite(res)) bad = true
      for (const key of KEYS) {
        const h = cols[key].hist
        h.push(stressFit(density(cols[key]), F, G).b)
        if (h.length > 300) h.shift()
      }
    }
    adv.current = (k: number) => { advance(k); draw() }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      const fits = {} as Record<Key, { b: number; lam: number; c: number; rho: Float64Array }>
      for (const key of KEYS) { const rho = density(cols[key]); fits[key] = { ...stressFit(rho, F, G), rho } }
      // ---- left: residual stress cs^2 rho - lam P - c along y, vs -b F^2/rho prediction
      const L = { x: 56, y: 26, w: 330, h: 300 }
      const k = 2 * Math.PI / N
      const bTh: Record<Key, number> = { guo: 0, sc: (tau - 0.5) ** 2, edm: 0.25 }
      const sMax = Math.max(0.3, bTh.sc) * G * G / 0.6
      const px = (j: number) => L.x + (j + 0.5) / N * L.w
      const py = (s: number) => L.y + L.h / 2 - s / sMax * (L.h / 2 - 10)
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(L.x, L.y, L.w, L.h)
      ctx.beginPath(); ctx.moveTo(L.x, py(0)); ctx.lineTo(L.x + L.w, py(0)); ctx.stroke()
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('residual stress  cs²ρ − λP − c', L.x + 4, L.y - 8)
      ctx.fillText('y (node) →', L.x + L.w - 76, L.y + L.h + 16)
      ctx.fillText((sMax).toExponential(1), 4, py(sMax) + 4); ctx.fillText((-sMax).toExponential(1), 0, py(-sMax) + 4); ctx.fillText('0', L.x - 12, py(0) + 4)
      for (const key of KEYS) {
        const { lam, c, rho } = fits[key]
        ctx.strokeStyle = COL[key]; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath()
        for (let j = 0; j < N; j++) { const s = -bTh[key] * F[j] * F[j] / rho[j]; j ? ctx.lineTo(px(j), py(s)) : ctx.moveTo(px(j), py(s)) }
        ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = COL[key]
        for (let j = 0; j < N; j++) {
          const s = CS2 * rho[j] - lam * (-G / k * Math.cos(k * (j + 0.5))) - c
          ctx.beginPath(); ctx.arc(px(j), py(Math.max(-1.2 * sMax, Math.min(1.2 * sMax, s))), 2.6, 0, 2 * Math.PI); ctx.fill()
        }
      }
      ctx.fillStyle = 'rgba(127,127,127,0.9)'; ctx.fillText('dots: LB   dashed: −b·F²/ρ theory', L.x + 4, L.y + L.h - 8)
      // ---- right: history of fitted b
      const R = { x: 440, y: 26, w: 300, h: 300 }
      const bMax = Math.max(1.2 * bTh.sc, 0.4)
      const hx = (i: number) => R.x + i / 300 * R.w
      const hy = (b: number) => R.y + R.h - (Math.max(-0.2 * bMax, Math.min(bMax, b)) + 0.2 * bMax) / (1.2 * bMax) * R.h
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(R.x, R.y, R.w, R.h)
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('fitted b vs time  (one point per frame)', R.x + 4, R.y - 8)
      for (const key of KEYS) {
        ctx.strokeStyle = COL[key]; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(R.x, hy(bTh[key])); ctx.lineTo(R.x + R.w, hy(bTh[key])); ctx.stroke(); ctx.setLineDash([])
        const h = cols[key].hist
        ctx.lineWidth = 2; ctx.beginPath()
        h.forEach((b, i) => { i ? ctx.lineTo(hx(i), hy(b)) : ctx.moveTo(hx(i), hy(b)) })
        ctx.stroke(); ctx.lineWidth = 1
        ctx.fillStyle = COL[key]; ctx.fillText(`${NAME[key]} → ${bTh[key].toFixed(3)}`, R.x + R.w - 130, hy(bTh[key]) - 4)
      }
      let lx = 56
      for (const key of KEYS) { ctx.fillStyle = COL[key]; ctx.fillRect(lx, H - 16, 12, 4); ctx.fillText(NAME[key], lx + 16, H - 10); lx += 120 }
      ctx.fillStyle = 'rgba(127,127,127,0.9)'; ctx.fillText(`step ${n}`, W - 110, H - 10)
      if (bad) { ctx.fillStyle = '#ef4444'; ctx.font = '16px ui-monospace, monospace'; ctx.fillText('diverged — lower G or raise τ, then Reset', 160, H / 2) }

      if (frame % 10 === 0) {
        let drho = 0
        for (let j = 0; j < N; j++) drho = Math.max(drho, Math.abs(fits.sc.rho[j] - fits.guo.rho[j]))
        setRead({ n, guo: fits.guo.b, sc: fits.sc.b, edm: fits.edm.b, drho, res, bad })
      }
    }

    const loop = () => {
      if (playRef.current && !bad) advance(spfRef.current)
      frame++
      draw()
      raf = requestAnimationFrame(loop)
    }
    draw()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tau, G, nonce])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>τ = {tau.toFixed(2)} <input type="range" min={0.7} max={3} step={0.05} value={tau} onChange={(e) => setTau(+e.target.value)} /></label>
        <label>G = {G.toFixed(3)} <input type="range" min={0.005} max={0.025} step={0.001} value={G} onChange={(e) => setG(+e.target.value)} /></label>
        <label>steps/frame {spf} <input type="range" min={1} max={60} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(100) }}>Step ×100</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        step {read.n} · b: <span style={{ color: COL.guo }}>Guo {read.guo.toFixed(3)}</span> ·{' '}
        <span style={{ color: COL.sc }}>SC {read.sc.toFixed(3)}</span> (theory {((tau - 0.5) ** 2).toFixed(3)}) ·{' '}
        <span style={{ color: COL.edm }}>EDM {read.edm.toFixed(3)}</span> · max|ρ_SC−ρ_Guo| {read.drho.toExponential(2)} ·
        Δρ/step {read.res.toExponential(1)}{read.bad ? ' · DIVERGED' : ''}
      </div>
    </div>
  )
}
