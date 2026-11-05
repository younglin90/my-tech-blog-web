'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 460
const N = 32
const NC = N * N
const TOL = 1e-8
const ITMAX = 5000
const GREY = 'rgba(140,140,140,0.95)'
const LUS = '#f97316'
const EXA = '#38bdf8'

type Op = { diag: Float64Array; nb: Int32Array; cf: Float64Array }

// same as Python build_operator(): 1st-order upwind + central diffusion, Dirichlet 0, k = i + N*j
function buildOp(thetaDeg: number, a: number, nu: number) {
  const h = 1 / N
  const ax = a * Math.cos((thetaDeg * Math.PI) / 180), ay = a * Math.sin((thetaDeg * Math.PI) / 180)
  const diag = new Float64Array(NC), nb = new Int32Array(NC * 4), cf = new Float64Array(NC * 4)
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = i + N * j
    diag[k] = (Math.abs(ax) + Math.abs(ay)) / h + (4 * nu) / (h * h)
    for (let d = 0; d < 4; d++) {
      const ii = i + dirs[d][0], jj = j + dirs[d][1]
      if (ii < 0 || ii >= N || jj < 0 || jj >= N) { nb[k * 4 + d] = -1; continue }
      let c = -nu / (h * h)
      if (d === 0 && ax > 0) c -= ax / h
      if (d === 1 && ax < 0) c += ax / h
      if (d === 2 && ay > 0) c -= ay / h
      if (d === 3 && ay < 0) c += ay / h
      nb[k * 4 + d] = ii + N * jj; cf[k * 4 + d] = c
    }
  }
  const spec = (Math.abs(ax) + Math.abs(ay)) / h + (4 * nu) / (h * h)
  return { op: { diag, nb, cf } as Op, spec }
}

function residual(op: Op, phi: Float64Array, R: Float64Array) {
  let s = 0
  for (let k = 0; k < NC; k++) {
    let v = op.diag[k] * phi[k] - 1 // b = 1
    for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m >= 0) v += op.cf[k * 4 + d] * phi[m] }
    R[k] = v; s += v * v
  }
  return Math.sqrt(s)
}

// banded LU of (A + I/dtau), factor once, solve per iteration (Python: splu)
function bandedLU(op: Op, shift: number) {
  const p = N, bw = 2 * p + 1
  const B = new Float64Array(NC * bw)
  const at = (r: number, c: number) => r * bw + (c - r + p)
  for (let k = 0; k < NC; k++) {
    B[at(k, k)] = op.diag[k] + shift
    for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m >= 0) B[at(k, m)] += op.cf[k * 4 + d] }
  }
  for (let k = 0; k < NC; k++) {
    const piv = B[at(k, k)]
    for (let r = k + 1; r <= Math.min(NC - 1, k + p); r++) {
      const f = B[at(r, k)] / piv
      B[at(r, k)] = f
      if (f === 0) continue
      for (let c = k + 1; c <= Math.min(NC - 1, k + p); c++) B[at(r, c)] -= f * B[at(k, c)]
    }
  }
  return (rhs: Float64Array, out: Float64Array) => {
    out.set(rhs)
    for (let r = 0; r < NC; r++) for (let c = Math.max(0, r - p); c < r; c++) out[r] -= B[at(r, c)] * out[c]
    for (let r = NC - 1; r >= 0; r--) {
      let s = out[r]
      for (let c = r + 1; c <= Math.min(NC - 1, r + p); c++) s -= B[at(r, c)] * out[c]
      out[r] = s / B[at(r, r)]
    }
  }
}

type Run = { phi: Float64Array; hist: number[]; r0: number; it: number; done: boolean }
type Read = { itL: number; itE: number; resL: number; resE: number; rate: number; doneL: boolean; doneE: boolean }

export function PseudoTimeCflSaturationRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(135)
  const [a, setA] = useState(1)
  const [logNu, setLogNu] = useState(-4)
  const [logCfl, setLogCfl] = useState(8)
  const [ipf, setIpf] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Read>({ itL: 0, itE: 0, resL: 1, resE: 1, rate: NaN, doneL: false, doneE: false })
  const playRef = useRef(playing), ipfRef = useRef(ipf)
  playRef.current = playing; ipfRef.current = ipf
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const nu = Math.pow(10, logNu)
    const { op, spec } = buildOp(theta, a, nu)
    const dtau = Math.pow(10, logCfl) / spec
    const D = new Float64Array(NC)
    for (let k = 0; k < NC; k++) D[k] = op.diag[k] + 1 / dtau
    const exactSolve = bandedLU(op, 1 / dtau)
    const R = new Float64Array(NC), y = new Float64Array(NC), dphi = new Float64Array(NC), rhs = new Float64Array(NC)
    const mk = (): Run => { const phi = new Float64Array(NC); return { phi, hist: [1], r0: residual(op, phi, R), it: 0, done: false } }
    const L = mk(), E = mk()

    const iterLusgs = () => {
      if (L.done) return
      residual(op, L.phi, R)
      for (let k = 0; k < NC; k++) { // forward sweep (D+L) y = -R
        let s = -R[k]
        for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m >= 0 && m < k) s -= op.cf[k * 4 + d] * y[m] }
        y[k] = s / D[k]
      }
      for (let k = NC - 1; k >= 0; k--) { // backward sweep (D+U) dphi = D y
        let s = D[k] * y[k]
        for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m > k) s -= op.cf[k * 4 + d] * dphi[m] }
        dphi[k] = s / D[k]
      }
      for (let k = 0; k < NC; k++) L.phi[k] += dphi[k]
      L.it++
      L.hist.push(residual(op, L.phi, R) / L.r0)
      if (L.hist[L.hist.length - 1] < TOL || L.it >= ITMAX) L.done = true
    }
    const iterExact = () => {
      if (E.done) return
      residual(op, E.phi, R)
      for (let k = 0; k < NC; k++) rhs[k] = -R[k]
      exactSolve(rhs, dphi)
      for (let k = 0; k < NC; k++) E.phi[k] += dphi[k]
      E.it++
      E.hist.push(residual(op, E.phi, R) / E.r0)
      if (E.hist[E.hist.length - 1] < TOL || E.it >= ITMAX) E.done = true
    }
    const rateOf = (h: number[]) => {
      const n = h.length - 1
      if (n < 1) return NaN
      const m = Math.min(10, n)
      return Math.pow(h[n] / h[n - m], 1 / m)
    }

    const FX = 20, FY = 50, FS = 300, cs = FS / N
    const GX = 380, GY = 50, GW = 350, GH = 300
    const draw = () => {
      ctx.fillStyle = '#0b0f19'; ctx.fillRect(0, 0, W, H)
      ctx.font = '13px ui-monospace, monospace'; ctx.fillStyle = '#e5e7eb'
      ctx.fillText(`LU-SGS field φ after ${L.it} iterations`, FX, 22)
      ctx.fillText('residual ‖R‖/‖R₀‖ vs pseudo-time iteration', GX, 22)
      let vmax = 1e-12
      for (let k = 0; k < NC; k++) vmax = Math.max(vmax, Math.abs(E.phi[k]), Math.abs(L.phi[k]))
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const t = Math.max(0, Math.min(1, L.phi[i + N * j] / vmax))
        ctx.fillStyle = `rgb(${Math.round(20 + 235 * t)},${Math.round(30 + 170 * Math.sqrt(t))},${Math.round(80 + 60 * (1 - t))})`
        ctx.fillRect(FX + i * cs, FY + (N - 1 - j) * cs, cs - 0.3, cs - 0.3)
      }
      ctx.fillStyle = GREY; ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`32×32, b = 1, φ = 0 on walls · color max = ${vmax.toExponential(2)}`, FX, FY + FS + 16)
      // flow arrow
      if (a > 0) {
        const ax = Math.cos((theta * Math.PI) / 180), ay = Math.sin((theta * Math.PI) / 180)
        const cx = FX + FS - 30, cy = FY + 30
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(cx - 16 * ax, cy + 16 * ay); ctx.lineTo(cx + 16 * ax, cy - 16 * ay); ctx.stroke()
        ctx.beginPath(); ctx.arc(cx + 16 * ax, cy - 16 * ay, 3.5, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill()
      }
      // residual plot (log y from 1 to 1e-10, x up to max(30, it))
      const xmax = Math.max(30, L.it, E.it) * 1.05
      const px = (it: number) => GX + (it / xmax) * GW
      const py = (r: number) => GY + (Math.min(10, -Math.log10(Math.max(r, 1e-10))) / 10) * GH
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'; ctx.lineWidth = 1
      ctx.strokeRect(GX, GY, GW, GH)
      ctx.fillStyle = GREY
      for (let e = 0; e <= 10; e += 2) { const yy = py(Math.pow(10, -e)); ctx.beginPath(); ctx.moveTo(GX, yy); ctx.lineTo(GX + GW, yy); ctx.stroke(); ctx.fillText(`1e-${e}`, GX + GW - 36, yy - 2) }
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#22c55e'
      ctx.beginPath(); ctx.moveTo(GX, py(TOL)); ctx.lineTo(GX + GW, py(TOL)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillText(`0 … ${Math.round(xmax)} iterations`, GX, GY + GH + 16)
      const curve = (h: number[], col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        const stride = Math.max(1, Math.floor(h.length / 600))
        for (let q = 0; q < h.length; q += stride) { const X = px(q), Y = py(h[q]); if (q === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y) }
        const q = h.length - 1; ctx.lineTo(px(q), py(h[q])); ctx.stroke()
      }
      curve(E.hist, EXA); curve(L.hist, LUS)
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = LUS; ctx.fillText(`LU-SGS: ${L.it}${L.done ? (L.it >= ITMAX ? ' (cap)' : ' ✓') : ''}`, GX + 10, GY + GH + 36)
      ctx.fillStyle = EXA; ctx.fillText(`exact implicit: ${E.it}${E.done ? ' ✓' : ''}`, GX + 180, GY + GH + 36)
      ctx.fillStyle = GREY
      ctx.fillText(`CFL = 1e${logCfl} · Δτ = ${dtau.toExponential(2)} · cell Pe = ${nu > 0 ? ((a / N) / nu).toExponential(1) : '∞'}`, FX, FY + FS + 36)
      ctx.fillText(`LU-SGS factor/iter (last 10) = ${rateOf(L.hist).toFixed(4)}`, FX, FY + FS + 54)
    }

    const iterate = () => { iterLusgs(); iterExact() }
    const push = () => setRead({ itL: L.it, itE: E.it, resL: L.hist[L.hist.length - 1], resE: E.hist[E.hist.length - 1], rate: rateOf(L.hist), doneL: L.done, doneE: E.done })
    stepRef.current = () => { iterate(); draw(); push() }
    let raf = 0, frame = 0
    const loop = () => {
      if (playRef.current && !(L.done && E.done)) for (let s = 0; s < ipfRef.current; s++) iterate()
      draw()
      if (++frame % 12 === 0) push()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [theta, a, logNu, logCfl, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const preset = (th: number, aa: number, ln: number) => { setTheta(th); setA(aa); setLogNu(ln); setPlaying(true); setNonce((v) => v + 1) }

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          CFL = 1e{logCfl}{' '}
          <input type="range" min={0} max={8} step={1} value={logCfl} onChange={(e) => setLogCfl(Number(e.target.value))} />
        </label>
        <label>
          flow angle θ = {theta}°{' '}
          <input type="range" min={0} max={345} step={15} value={theta} onChange={(e) => setTheta(Number(e.target.value))} />
        </label>
        <label>
          speed a = {a.toFixed(2)}{' '}
          <input type="range" min={0} max={1} step={0.05} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label>
          ν = 1e{logNu.toFixed(2)}{' '}
          <input type="range" min={-4} max={0} step={0.25} value={logNu} onChange={(e) => setLogNu(Number(e.target.value))} />
        </label>
        <label>
          iterations/frame = {ipf}{' '}
          <input type="range" min={1} max={40} step={1} value={ipf} onChange={(e) => setIpf(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
        <button style={btn(theta === 45 && a === 1 && logNu === -4)} onClick={() => preset(45, 1, -4)}>advection 45°</button>
        <button style={btn(theta === 135 && a === 1 && logNu === -4)} onClick={() => preset(135, 1, -4)}>advection 135°</button>
        <button style={btn(a === 0 && logNu === 0)} onClick={() => { preset(45, 0, 0); setIpf(40) }}>diffusion only</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, color: GREY }}>
        <span style={{ color: LUS }}>LU-SGS {read.itL} it · ‖R‖/‖R₀‖ = {read.resL.toExponential(2)}{read.doneL ? ' · done' : ''}</span>
        {'  |  '}
        <span style={{ color: EXA }}>exact {read.itE} it · {read.resE.toExponential(2)}{read.doneE ? ' · done' : ''}</span>
        {'  |  '}factor/iter = {Number.isFinite(read.rate) ? read.rate.toFixed(4) : '—'}
      </div>
    </div>
  )
}
