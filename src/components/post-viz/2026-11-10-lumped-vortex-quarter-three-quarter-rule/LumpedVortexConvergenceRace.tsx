'use client'

import { useEffect, useRef, useState } from 'react'

// TS port of the post's lumped_vortex(): N uniform panels on a thin airfoil (c = 1, V = 1),
// vortex at fraction a of each panel, control point at fraction b, camber z = 4h x(1-x).
// Race: A = (0.25, 0.75) vs B = (a, b) chosen by the reader, N sweeping 1 -> 64.
const W = 760
const H = 540
const BG = '#0f172a'
const CA = '#38bdf8'
const CB = '#f97316'
const EXA = '#e2e8f0'
const TXT = '#cbd5e1'
const GRID = 'rgba(148,163,184,0.22)'
const NSEQ = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]
const FRAMES_PER_N = 40

function solveLumped(N: number, a: number, b: number, alpha: number, h: number) {
  const xv: number[] = [], xc: number[] = []
  for (let j = 0; j < N; j++) { xv.push((j + a) / N); xc.push((j + b) / N) }
  const A = xc.map((xi) => xv.map((xj) => 1 / (2 * Math.PI * (xi - xj))))
  const r = xc.map((x) => alpha - 4 * h * (1 - 2 * x))
  for (let k = 0; k < N; k++) {
    let p = k
    for (let i = k + 1; i < N; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i
    ;[A[k], A[p]] = [A[p], A[k]];[r[k], r[p]] = [r[p], r[k]]
    for (let i = k + 1; i < N; i++) {
      const m = A[i][k] / A[k][k]
      for (let j = k; j < N; j++) A[i][j] -= m * A[k][j]
      r[i] -= m * r[k]
    }
  }
  const G = new Array(N).fill(0)
  for (let i = N - 1; i >= 0; i--) {
    let s = r[i]
    for (let j = i + 1; j < N; j++) s -= A[i][j] * G[j]
    G[i] = s / A[i][i]
  }
  let CL = 0, Cm = 0
  for (let j = 0; j < N; j++) { CL += 2 * G[j]; Cm -= 2 * G[j] * xv[j] }
  return { G, xv, CL, Cm }
}

type Pt = { n: number; eA: number; eB: number; mA: number; mB: number }

export function LumpedVortexConvergenceRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [a, setA] = useState(0)
  const [b, setB] = useState(0.5)
  const [h, setH] = useState(0.04)
  const [alphaDeg, setAlphaDeg] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 1, CLA: 0, CLB: 0, CmA: 0, CmB: 0, CLx: 0, Cmx: 0 })
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const alpha = (alphaDeg * Math.PI) / 180
    const CLx = 2 * Math.PI * (alpha + 2 * h)
    const Cmx = (-Math.PI / 2) * (alpha + 4 * h)
    const hist: Pt[] = []
    let idx = -1, frame = 0, raf = 0
    let cur = { A: solveLumped(1, 0.25, 0.75, alpha, h), B: solveLumped(1, a, b, alpha, h) }
    const relErr = (v: number, x: number) => Math.abs(v / x - 1)

    const advance = () => {
      if (idx >= NSEQ.length - 1) return
      idx++
      const n = NSEQ[idx]
      cur = { A: solveLumped(n, 0.25, 0.75, alpha, h), B: solveLumped(n, a, b, alpha, h) }
      hist.push({ n, eA: relErr(cur.A.CL, CLx), eB: relErr(cur.B.CL, CLx), mA: relErr(cur.A.Cm, Cmx), mB: relErr(cur.B.Cm, Cmx) })
      setRead({ n, CLA: cur.A.CL, CLB: cur.B.CL, CmA: cur.A.Cm, CmB: cur.B.Cm, CLx, Cmx })
    }
    stepRef.current = () => { advance(); render() }

    const render = () => {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px sans-serif'
      // --- top: gamma(x) bars vs exact
      const X0 = 60, X1 = W - 20, Y0 = 30, Y1 = 230
      const gx = (x: number) => X0 + x * (X1 - X0)
      const A0 = alpha, A1 = 4 * h
      const gExact = (x: number) => {
        const th = Math.acos(1 - 2 * x)
        return 2 * (A0 * (1 + Math.cos(th)) / Math.sin(th) + A1 * Math.sin(th))
      }
      const gmax = Math.max(0.05, 2 * gExact(0.1))
      const gy = (g: number) => Y1 - (Math.max(-0.2 * gmax, Math.min(g, gmax)) / gmax) * (Y1 - Y0)
      ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke()
      if (idx >= 0) {
        const n = NSEQ[idx], wbar = (X1 - X0) / n
        for (const [S, col, off] of [[cur.A, CA, 0], [cur.B, CB, 0.5]] as const) {
          ctx.fillStyle = col + '99'
          for (let j = 0; j < n; j++) {
            const g = S.G[j] * n
            const y = gy(g)
            ctx.fillRect(X0 + j * wbar + off * wbar * 0.9 + 1, Math.min(y, Y1), Math.max(1, wbar * 0.45 - 1), Math.abs(Y1 - y))
          }
        }
      }
      ctx.strokeStyle = EXA; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 1; i <= 300; i++) { const x = i / 300 - 1e-6; const Y = gy(gExact(x)); if (i === 1) ctx.moveTo(gx(x), Y); else ctx.lineTo(gx(x), Y) }
      ctx.stroke(); ctx.lineWidth = 1
      ctx.fillStyle = TXT
      ctx.fillText('γ(x)/V per panel  (bars: Γj/Δx, white: exact thin-airfoil)', X0, Y0 - 12)
      for (let x = 0; x <= 1.001; x += 0.25) ctx.fillText(x.toFixed(2), gx(x) - 12, Y1 + 15)

      // --- bottom: |error| vs N (log-log)
      const P0 = 60, P1 = W - 20, Q0 = 280, Q1 = H - 40
      const lx = (n: number) => P0 + (Math.log2(n) / 6) * (P1 - P0)
      const EMIN = 1e-5, EMAX = 2
      const ly = (e: number) => Q1 - ((Math.log10(Math.max(e, EMIN)) - Math.log10(EMIN)) / (Math.log10(EMAX) - Math.log10(EMIN))) * (Q1 - Q0)
      ctx.strokeStyle = GRID
      for (let k = 0; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(lx(2 ** k), Q0); ctx.lineTo(lx(2 ** k), Q1); ctx.stroke(); ctx.fillStyle = TXT; ctx.fillText(String(2 ** k), lx(2 ** k) - 6, Q1 + 15) }
      for (let e = -5; e <= 0; e++) { ctx.beginPath(); ctx.moveTo(P0, ly(10 ** e)); ctx.lineTo(P1, ly(10 ** e)); ctx.stroke(); ctx.fillText(e === 0 ? '100%' : `1e${e + 2}%`, 8, ly(10 ** e) + 4) }
      ctx.fillText('N panels', P1 - 60, Q1 + 30)
      ctx.fillText('|relative error|  (solid CL, dashed Cm_LE; ≤1e-3 % drawn at floor)', P0, Q0 - 10)
      const line = (key: keyof Pt, col: string, dash: boolean) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash ? [6, 4] : [])
        ctx.beginPath()
        hist.forEach((p, i) => { const X = lx(p.n), Y = ly(p[key] as number); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y) })
        ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = col
        hist.forEach((p) => { ctx.beginPath(); ctx.arc(lx(p.n), ly(p[key] as number), 3, 0, 2 * Math.PI); ctx.fill() })
      }
      line('eA', CA, false); line('mA', CA, true); line('eB', CB, false); line('mB', CB, true)
      ctx.fillStyle = CA; ctx.fillText('A (0.25, 0.75)', P1 - 220, Q0 + 14)
      ctx.fillStyle = CB; ctx.fillText(`B (${a.toFixed(2)}, ${b.toFixed(2)})`, P1 - 110, Q0 + 14)
    }

    advance(); render()
    const loop = () => {
      if (playing) {
        frame++
        if (frame % FRAMES_PER_N === 0) { advance(); render() }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [a, b, h, alphaDeg, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const pct = (v: number, x: number) => `${(100 * (v / x - 1)).toFixed(2)}%`

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>B vortex a = {a.toFixed(2)} <input type="range" min={0} max={0.5} step={0.05} value={a} onChange={(e) => { const v = Number(e.target.value); setA(v); setB((bb) => Math.max(bb, v + 0.05)) }} /></label>
        <label>B control b = {b.toFixed(2)} <input type="range" min={0.3} max={1} step={0.05} value={b} onChange={(e) => { const v = Number(e.target.value); setB(v); setA((aa) => Math.min(aa, v - 0.05)) }} /></label>
        <label>camber h/c = {h.toFixed(2)} <input type="range" min={0} max={0.08} step={0.01} value={h} onChange={(e) => setH(Number(e.target.value))} /></label>
        <label>alpha = {alphaDeg}° <input type="range" min={-4} max={8} step={1} value={alphaDeg} onChange={(e) => setAlphaDeg(Number(e.target.value))} /></label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
        <div>N = {read.n} · exact CL = {read.CLx.toFixed(4)} · exact Cm_LE = {read.Cmx.toFixed(4)}</div>
        <div style={{ color: CA }}>A (0.25,0.75): CL = {read.CLA.toFixed(4)} ({pct(read.CLA, read.CLx)}) · Cm_LE = {read.CmA.toFixed(4)} ({pct(read.CmA, read.Cmx)})</div>
        <div style={{ color: CB }}>B ({a.toFixed(2)},{b.toFixed(2)}): CL = {read.CLB.toFixed(4)} ({pct(read.CLB, read.CLx)}) · Cm_LE = {read.CmB.toFixed(4)} ({pct(read.CmB, read.Cmx)})</div>
      </div>
    </div>
  )
}
