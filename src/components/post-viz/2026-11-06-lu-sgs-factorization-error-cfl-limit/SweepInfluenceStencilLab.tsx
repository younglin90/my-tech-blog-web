'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 440
const G = 24
const NC = G * G
const GREY = 'rgba(140,140,140,0.95)'
const LCOL = '#38bdf8'
const UCOL = '#f97316'
const CUR = '#facc15'

type Op = { diag: Float64Array; nb: Int32Array; cf: Float64Array } // 4 neighbours per cell: W,E,S,N (−1 = wall)

function buildOp(thetaDeg: number, nu: number): Op {
  const h = 1 / G
  const ax = Math.cos((thetaDeg * Math.PI) / 180), ay = Math.sin((thetaDeg * Math.PI) / 180)
  const diag = new Float64Array(NC), nb = new Int32Array(NC * 4), cf = new Float64Array(NC * 4)
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const k = i + G * j
    diag[k] = (Math.abs(ax) + Math.abs(ay)) / h + (4 * nu) / (h * h)
    for (let d = 0; d < 4; d++) {
      const ii = i + dirs[d][0], jj = j + dirs[d][1]
      if (ii < 0 || ii >= G || jj < 0 || jj >= G) { nb[k * 4 + d] = -1; continue }
      let c = -nu / (h * h)
      if (d === 0 && ax > 0) c -= ax / h
      if (d === 1 && ax < 0) c += ax / h
      if (d === 2 && ay > 0) c -= ay / h
      if (d === 3 && ay < 0) c += ay / h
      nb[k * 4 + d] = ii + G * jj
      cf[k * 4 + d] = c
    }
  }
  return { diag, nb, cf }
}

// exact A^{-1} e by banded Gaussian elimination (bandwidth G, diagonally dominant → no pivoting)
function exactSolve(op: Op, rhs: Float64Array): Float64Array {
  const p = G, bw = 2 * p + 1
  const B = new Float64Array(NC * bw)
  const at = (r: number, c: number) => r * bw + (c - r + p)
  for (let k = 0; k < NC; k++) {
    B[at(k, k)] = op.diag[k]
    for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m >= 0) B[at(k, m)] += op.cf[k * 4 + d] }
  }
  const x = Float64Array.from(rhs)
  for (let k = 0; k < NC; k++) {
    const piv = B[at(k, k)]
    for (let r = k + 1; r <= Math.min(NC - 1, k + p); r++) {
      const f = B[at(r, k)] / piv
      if (f === 0) continue
      for (let c = k; c <= Math.min(NC - 1, k + p); c++) B[at(r, c)] -= f * B[at(k, c)]
      x[r] -= f * x[k]
    }
  }
  for (let k = NC - 1; k >= 0; k--) {
    let s = x[k]
    for (let c = k + 1; c <= Math.min(NC - 1, k + p); c++) s -= B[at(k, c)] * x[c]
    x[k] = s / B[at(k, k)]
  }
  return x
}

function color(v: number, vmax: number): string {
  if (!(v > 0) || vmax <= 0) return 'rgb(20,24,36)'
  const t = Math.max(0, Math.min(1, 1 + Math.log10(v / vmax) / 3)) // 3 decades
  const r = Math.round(30 + 225 * Math.pow(t, 1.4))
  const g = Math.round(40 + 190 * t)
  const b = Math.round(120 + 100 * Math.sin(Math.PI * t) - 60 * t)
  return `rgb(${r},${g},${Math.max(0, b)})`
}

export function SweepInfluenceStencilLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(135)
  const [logNu, setLogNu] = useState(-4)
  const [cpf, setCpf] = useState(6)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ phase: 'forward sweep', k: 0, err: NaN, inL: 0, inU: 0 })
  const playRef = useRef(playing), cpfRef = useRef(cpf)
  playRef.current = playing; cpfRef.current = cpf
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const nu = Math.pow(10, logNu)
    const op = buildOp(theta, nu)
    const src = Math.floor(G / 2) + G * Math.floor(G / 2)
    const e = new Float64Array(NC); e[src] = 1
    const g = exactSolve(op, e)
    let gmax = 0; for (let k = 0; k < NC; k++) gmax = Math.max(gmax, g[k])
    const y = new Float64Array(NC), x = new Float64Array(NC)
    const done = new Uint8Array(NC) // 1 = forward done, 2 = backward done
    let phase = 0, k = 0 // phase 0 forward (k ascending), 1 backward (k descending), 2 finished
    let err = NaN, frame = 0
    // upwind neighbours: in lexicographic order W,S are lower (L), E,N are upper (U)
    let inL = 0, inU = 0
    const kc = src
    for (let d = 0; d < 4; d++) if (op.cf[kc * 4 + d] < -nu * G * G * 1.0000001) { if (d === 0 || d === 2) inL++; else inU++ }

    const advance = () => {
      if (phase === 0) {
        let s = e[k]
        for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m >= 0 && m < k) s -= op.cf[k * 4 + d] * y[m] }
        y[k] = s / op.diag[k]; done[k] = 1
        k++; if (k === NC) { phase = 1; k = NC - 1 }
      } else if (phase === 1) {
        let s = 0
        for (let d = 0; d < 4; d++) { const m = op.nb[k * 4 + d]; if (m > k) s += op.cf[k * 4 + d] * x[m] }
        x[k] = y[k] - s / op.diag[k]; done[k] = 2
        k--; if (k < 0) {
          phase = 2
          let num = 0, den = 0
          for (let q = 0; q < NC; q++) { num += (x[q] - g[q]) ** 2; den += g[q] ** 2 }
          err = Math.sqrt(num / den)
        }
      }
    }

    const PS = 330, OX1 = 30, OX2 = 400, OY = 62, cs = PS / G
    const draw = () => {
      ctx.fillStyle = '#0b0f19'; ctx.fillRect(0, 0, W, H)
      ctx.font = '13px ui-monospace, monospace'; ctx.fillStyle = '#e5e7eb'
      ctx.fillText('LU-SGS, CFL = ∞ : M⁻¹e', OX1, 22)
      ctx.fillText('exact A⁻¹e (point source response)', OX2, 22)
      ctx.fillStyle = GREY; ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('log color, 3 decades below max of exact', OX1, 40)
      ctx.fillText(`θ = ${theta}°, cell Péclet = ${(1 / (G * nu)).toExponential(1)}`, OX2, 40)
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const q = i + G * j, px = i * cs, py = (G - 1 - j) * cs
        const v = done[q] === 2 ? x[q] : done[q] === 1 ? y[q] : 0
        ctx.fillStyle = color(v, gmax); ctx.fillRect(OX1 + px, OY + py, cs - 0.5, cs - 0.5)
        ctx.fillStyle = color(g[q], gmax); ctx.fillRect(OX2 + px, OY + py, cs - 0.5, cs - 0.5)
        if (done[q] === 1 && phase < 2) { ctx.fillStyle = 'rgba(56,189,248,0.12)'; ctx.fillRect(OX1 + px, OY + py, cs - 0.5, cs - 0.5) }
      }
      // current cell and its L / U neighbours
      if (phase < 2) {
        const ci = k % G, cj = Math.floor(k / G)
        const box = (i: number, j: number, col: string) => {
          if (i < 0 || i >= G || j < 0 || j >= G) return
          ctx.strokeStyle = col; ctx.lineWidth = 2
          ctx.strokeRect(OX1 + i * cs + 1, OY + (G - 1 - j) * cs + 1, cs - 2, cs - 2)
        }
        box(ci - 1, cj, LCOL); box(ci, cj - 1, LCOL); box(ci + 1, cj, UCOL); box(ci, cj + 1, UCOL); box(ci, cj, CUR)
      }
      // flow arrow
      const ax = Math.cos((theta * Math.PI) / 180), ay = Math.sin((theta * Math.PI) / 180)
      for (const ox of [OX1, OX2]) {
        const cx = ox + PS - 34, cy = OY + 34
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(cx - 18 * ax, cy + 18 * ay); ctx.lineTo(cx + 18 * ax, cy - 18 * ay); ctx.stroke()
        ctx.beginPath(); ctx.arc(cx + 18 * ax, cy - 18 * ay, 3.5, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill()
      }
      // sweep order hint
      ctx.fillStyle = GREY; ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('cell order k = i + 24·j  (→ then ↑)', OX1, OY + PS + 18)
      ctx.fillStyle = LCOL; ctx.fillText('■ L neighbours (W,S)', OX1, OY + PS + 34)
      ctx.fillStyle = UCOL; ctx.fillText('■ U neighbours (E,N)', OX1 + 170, OY + PS + 34)
      ctx.fillStyle = phase === 2 ? (err < 0.05 ? '#22c55e' : '#f87171') : '#e5e7eb'
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillText(phase === 2 ? `relative error ‖M⁻¹e − A⁻¹e‖/‖A⁻¹e‖ = ${err.toFixed(4)}` : phase === 0 ? 'forward sweep: uses L neighbours already updated' : 'backward sweep: uses U neighbours already updated', OX2, OY + PS + 26)
    }

    stepRef.current = () => { for (let s = 0; s < G; s++) advance(); draw(); setRead({ phase: ['forward sweep', 'backward sweep', 'finished'][phase], k, err, inL, inU }) }
    let raf = 0
    const loop = () => {
      if (playRef.current && phase < 2) for (let s = 0; s < cpfRef.current; s++) advance()
      draw()
      if (++frame % 12 === 0 || phase === 2) setRead({ phase: ['forward sweep', 'backward sweep', 'finished'][phase], k, err, inL, inU })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [theta, logNu, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          flow angle θ = {theta}°{' '}
          <input type="range" min={0} max={345} step={15} value={theta} onChange={(e) => setTheta(Number(e.target.value))} />
        </label>
        <label>
          ν = 1e{logNu.toFixed(1)}{' '}
          <input type="range" min={-4} max={0} step={0.25} value={logNu} onChange={(e) => setLogNu(Number(e.target.value))} />
        </label>
        <label>
          cells/frame = {cpf}{' '}
          <input type="range" min={1} max={60} step={1} value={cpf} onChange={(e) => setCpf(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step (1 row)</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
        <button style={btn(theta === 45)} onClick={() => { setTheta(45); setLogNu(-4); setNonce((v) => v + 1) }}>45° (with sweep)</button>
        <button style={btn(theta === 135)} onClick={() => { setTheta(135); setLogNu(-4); setNonce((v) => v + 1) }}>135° (across sweep)</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, color: GREY }}>
        {read.phase} · k = {read.k} · upwind neighbours in L: {read.inL}, in U: {read.inU}
        {read.inL > 0 && read.inU > 0 ? ' → L D⁻¹ U couples them: one LU-SGS pass cannot be exact' : read.inL + read.inU > 0 ? ' → one sweep follows the flow: L D⁻¹ U ≈ 0' : ''}
        {Number.isFinite(read.err) ? ` · error = ${read.err.toFixed(4)}` : ''}
      </div>
    </div>
  )
}
