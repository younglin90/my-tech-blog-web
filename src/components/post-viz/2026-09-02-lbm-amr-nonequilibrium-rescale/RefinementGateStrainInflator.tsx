'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Two real D1Q3 lattices covering the SAME physical domain and the SAME
// physical time, one coarse (N nodes, tau_c) and one fine (m*N nodes, tau_f).
// Acoustic scaling: dx_f = dx_c/m and dt_f = dt_c/m, so the fine lattice takes
// m sub-steps for every coarse step.
//
// Keeping the physical viscosity equal on both levels forces
//     tau_f = 1/2 + m (tau_c - 1/2)
// and that in turn forces the non-equilibrium flux to be rescaled by
//     r = tau_f / (m tau_c)
// when a population crosses the level interface.
//
// The right-hand ledger measures the flux q = sum_i e_i g_i on BOTH lattices
// at the same physical point and compares the measured ratio with r, next to
// what a plain copy (ratio = 1) would hand over.
// ---------------------------------------------------------------------------

const W = 760
const H = 462

const AX0 = 54
const AX1 = 714
const AY0 = 40
const AY1 = 182

const BX0 = 54
const BX1 = 372
const BY0 = 246
const BY1 = 424

const CX0 = 442
const CX1 = 714
const CY0 = 246
const CY1 = 424

const NC = 48 // coarse nodes
const CS2 = 1 / 3
const WT = [1 / 6, 2 / 3, 1 / 6]
const EV = [-1, 0, 1]
const TMAX = 260 // coarse steps kept on the decay chart

const COL_C = '#38bdf8'
const COL_F = '#fb923c'
const COL_OK = '#4ade80'
const COL_BAD = '#f87171'
const COL_AX = 'rgba(148,163,184,0.35)'

type Lattice = { g: Float64Array[]; tmp: Float64Array[]; n: number; tau: number }

function seedLattice(n: number, tau: number): Lattice {
  const g = [new Float64Array(n), new Float64Array(n), new Float64Array(n)]
  const tmp = [new Float64Array(n), new Float64Array(n), new Float64Array(n)]
  for (let y = 0; y < n; y++) {
    const mom = Math.sin((2 * Math.PI * y) / n)
    for (let i = 0; i < 3; i++) g[i][y] = WT[i] * mom
  }
  return { g, tmp, n, tau }
}

function stepLattice(L: Lattice) {
  const { g, tmp, n, tau } = L
  for (let y = 0; y < n; y++) {
    const mom = g[0][y] + g[1][y] + g[2][y]
    for (let i = 0; i < 3; i++) g[i][y] -= (g[i][y] - WT[i] * mom) / tau
  }
  for (let i = 0; i < 3; i++) {
    const e = EV[i]
    for (let y = 0; y < n; y++) tmp[i][(y + e + n) % n] = g[i][y]
  }
  for (let i = 0; i < 3; i++) g[i].set(tmp[i])
}

function momentumAt(L: Lattice, y: number) {
  return L.g[0][y] + L.g[1][y] + L.g[2][y]
}

// first moment = the whole non-equilibrium part of this scalar lattice
function fluxAt(L: Lattice, y: number) {
  return -L.g[0][y] + L.g[2][y]
}

function sineAmplitude(L: Lattice) {
  let s = 0
  for (let y = 0; y < L.n; y++) s += momentumAt(L, y) * Math.sin((2 * Math.PI * y) / L.n)
  return (2 * s) / L.n
}

export function RefinementGateStrainInflator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tauC, setTauC] = useState(0.8)
  const [m, setM] = useState(2)
  const [rescaleTau, setRescaleTau] = useState(true)
  const [running, setRunning] = useState(true)
  const [seed, setSeed] = useState(0)
  const [stat, setStat] = useState({ step: 0, ampC: 1, ampF: 1, ratio: 0 })

  const live = useRef({ running })
  live.current = { running }
  const setStatRef = useRef(setStat)
  setStatRef.current = setStat

  const tauF = rescaleTau ? 0.5 + m * (tauC - 0.5) : tauC
  const tauFIdeal = 0.5 + m * (tauC - 0.5)
  const rFactor = tauFIdeal / (m * tauC)
  const nuC = CS2 * (tauC - 0.5)
  const nuF = (CS2 * (tauF - 0.5)) / m // dx_f^2/dt_f = (dx_c^2/dt_c)/m

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const coarse = seedLattice(NC, tauC)
    const fine = seedLattice(NC * m, tauF)
    const histC: number[] = [1]
    const histF: number[] = [1]
    let step = 0
    let frame = 0
    let raf = 0

    const px = (x0: number, x1: number, u: number) => x0 + (x1 - x0) * u
    const py = (y0: number, y1: number, u: number) => y1 - (y1 - y0) * u

    const axes = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x0, y1)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }

    const draw = () => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'

      // ---- panel A : the two profiles on one physical axis ----------------
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText('momentum profile on the shared physical domain', AX0, AY0 - 14)
      axes(AX0, AY0, AX1, AY1)
      const mid = (AY0 + AY1) / 2
      ctx.strokeStyle = 'rgba(148,163,184,0.2)'
      ctx.beginPath()
      ctx.moveTo(AX0, mid)
      ctx.lineTo(AX1, mid)
      ctx.stroke()
      const half = (AY1 - AY0) / 2 - 6

      // fine lattice: continuous line
      ctx.strokeStyle = COL_F
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let y = 0; y <= fine.n; y++) {
        const u = y / fine.n
        const v = momentumAt(fine, y % fine.n)
        const sx = px(AX0, AX1, u)
        const sy = mid - v * half
        if (y === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.stroke()

      // coarse lattice: markers
      ctx.fillStyle = COL_C
      for (let y = 0; y < coarse.n; y += 2) {
        const sx = px(AX0, AX1, y / coarse.n)
        const sy = mid - momentumAt(coarse, y) * half
        ctx.beginPath()
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      // arrow field: the local shear the fine level must reproduce
      ctx.strokeStyle = 'rgba(226,232,240,0.35)'
      ctx.lineWidth = 1
      for (let k = 0; k < 24; k++) {
        const u = (k + 0.5) / 24
        const yi = Math.floor(u * fine.n)
        const v = momentumAt(fine, yi)
        const sx = px(AX0, AX1, u)
        const len = v * half * 0.55
        ctx.beginPath()
        ctx.moveTo(sx, AY1 - 8)
        ctx.lineTo(sx, AY1 - 8 - len)
        ctx.stroke()
      }

      ctx.fillStyle = COL_C
      ctx.fillText('coarse  N=' + coarse.n + '  tau=' + tauC.toFixed(2), AX0 + 6, AY0 + 14)
      ctx.fillStyle = COL_F
      ctx.fillText('fine  N=' + fine.n + '  tau=' + tauF.toFixed(3) + '  (' + m + ' sub-steps)', AX0 + 6, AY0 + 30)

      // ---- panel B : amplitude decay against physical time -----------------
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText('amplitude vs physical time', BX0, BY0 - 14)
      axes(BX0, BY0, BX1, BY1)
      ctx.fillStyle = '#64748b'
      ctx.fillText('1.0', BX0 - 30, BY0 + 4)
      ctx.fillText('0.0', BX0 - 30, BY1 + 4)
      ctx.fillText('t', BX1 - 8, BY1 + 16)

      const plot = (h: number[], col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < h.length; i++) {
          const sx = px(BX0, BX1, i / TMAX)
          const sy = py(BY0, BY1, Math.max(0, h[i]))
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.stroke()
      }
      plot(histC, COL_C)
      plot(histF, COL_F)

      // ---- panel C : what crosses the gate --------------------------------
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText('non-equilibrium flux handed to the fine level', CX0, CY0 - 14)
      const qC = fluxAt(coarse, 0)
      const qF = fluxAt(fine, 0)
      const measured = Math.abs(qC) > 1e-14 ? qF / qC : 0
      const bars: { name: string; val: number; col: string }[] = [
        { name: 'measured q_f/q_c', val: measured, col: COL_F },
        { name: 'rescale  r', val: rFactor, col: COL_OK },
        { name: 'plain copy', val: 1, col: COL_BAD },
      ]
      const bw = (CX1 - CX0) * 0.62
      bars.forEach((b, i) => {
        const y = CY0 + 26 + i * 46
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(b.name, CX0, y - 8)
        ctx.fillStyle = 'rgba(148,163,184,0.15)'
        ctx.fillRect(CX0, y, bw, 16)
        ctx.fillStyle = b.col
        ctx.fillRect(CX0, y, bw * Math.min(1.2, Math.max(0, b.val)) / 1.2, 16)
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(b.val.toFixed(4), CX0 + bw + 10, y + 13)
      })
      ctx.fillStyle = COL_BAD
      ctx.fillText('copy inflates the recovered', CX0, CY1 - 22)
      ctx.fillText('strain by ' + ((1 / rFactor - 1) * 100).toFixed(1) + ' %', CX0, CY1 - 6)

      // viscosity ledger
      ctx.fillStyle = rescaleTau ? COL_OK : COL_BAD
      ctx.fillText('nu_c = ' + nuC.toFixed(5) + '   nu_f = ' + nuF.toFixed(5), AX0, AY1 + 26)
      ctx.fillStyle = '#64748b'
      ctx.fillText(
        rescaleTau ? 'tau rescaled: both levels carry the same physical viscosity' : 'tau NOT rescaled: the fine level is running a different fluid',
        AX0,
        AY1 + 44,
      )
    }

    const loop = () => {
      if (live.current.running && step < TMAX) {
        for (let s = 0; s < 2 && step < TMAX; s++) {
          stepLattice(coarse)
          for (let k = 0; k < m; k++) stepLattice(fine)
          step++
          histC.push(sineAmplitude(coarse))
          histF.push(sineAmplitude(fine))
        }
      }
      draw()
      frame++
      if (frame % 12 === 0) {
        const qC = fluxAt(coarse, 0)
        const qF = fluxAt(fine, 0)
        setStatRef.current({
          step,
          ampC: histC[histC.length - 1],
          ampF: histF[histF.length - 1],
          ratio: Math.abs(qC) > 1e-14 ? qF / qC : 0,
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tauC, m, tauF, rescaleTau, rFactor, nuC, nuF, seed])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }
  const btn = (on: boolean): CSSProperties => ({
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        <button style={btn(false)} onClick={() => setSeed((p) => p + 1)}>
          ↺ restart
        </button>
        <button style={btn(rescaleTau)} onClick={() => setRescaleTau((p) => !p)}>
          {rescaleTau ? 'tau rescaled' : 'tau copied'}
        </button>
        <label style={label}>
          <span style={nameS}>tau_c</span>
          <input type="range" min={0.51} max={2} step={0.01} value={tauC} onChange={(e) => setTauC(parseFloat(e.target.value))} />
          <span style={mono}>{tauC.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>m</span>
          <input type="range" min={2} max={4} step={1} value={m} onChange={(e) => setM(parseInt(e.target.value, 10))} />
          <span style={mono}>{m}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Both lattices start from the same sine and advance over the same physical time. With <em>tau rescaled</em> the orange
        curve sits on the blue one; press <em>tau copied</em> and the fine level suddenly relaxes a different fluid. At step{' '}
        {stat.step} the amplitudes are {stat.ampC.toFixed(4)} and {stat.ampF.toFixed(4)}; the measured flux ratio is{' '}
        {stat.ratio.toFixed(4)} against the predicted r = {rFactor.toFixed(4)}. Drag <em>tau_c</em> towards 0.51 and r falls to
        1/2 — that is where copying a population costs you a factor of two.
      </div>
    </div>
  )
}
