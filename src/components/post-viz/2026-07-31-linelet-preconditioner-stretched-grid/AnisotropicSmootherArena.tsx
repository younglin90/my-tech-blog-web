'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Why a point smoother dies on a boundary-layer mesh, and what a linelet fixes.
//
// We iterate on the implicit system that every dual-time / backward-Euler CFD
// code assembles for a scalar transport-diffusion equation:
//
//   ( V/dt + A ) u = f,   A = anisotropic Laplacian on a stretched cell
//
//   a_x = 1/dx^2 ,  a_y = 1/dy^2 ,  AR = dx/dy   =>   a_y/a_x = AR^2
//   d0  = V/dt term, held at 4*a_x so that AR = 1 is a healthy system
//
// f = 0, so the exact answer is u = 0 and whatever is on the screen IS the
// error. Three iterations are offered:
//
//   point Jacobi     u += w r / (d0 + 2a_x + 2a_y)
//                    iteration-matrix bound (2 + 2AR^2)/(6 + 2AR^2) -> 1
//   point Gauss-Seidel   same diagonal, latest values, same AR dependence
//   linelet          each wall-normal column solved EXACTLY by Thomas, so a_y
//                    leaves the iteration; the bound becomes
//                    2a_x/(d0 + 2a_x) = 1/3, with no AR in it
//
// Both numbers are upper bounds, and the measured factor ||e_k||/||e_k-1|| is
// printed live next to them so the reader can check. The point bound saturates
// at 1 and stops being informative; what actually caps point-smoother stalling
// is the lowest wall-normal mode, 1 - pi^2/(2 Ny^2), which is already 0.998.
// ---------------------------------------------------------------------------

const NX = 56
const NY = 34
const HIST = 300
const TOL = 1e-6

// heat map panel
const HX = 18
const HY = 46
const HW = 396
const HH = 168

// residual history panel
const RX = 452
const RY = 46
const RW = 190
const RH = 168

type Mode = 'jacobi' | 'gs' | 'linelet'

const MODES: { key: Mode; label: string; col: string }[] = [
  { key: 'jacobi', label: 'point Jacobi', col: '#f87171' },
  { key: 'gs', label: 'point Gauss-Seidel', col: '#fbbf24' },
  { key: 'linelet', label: 'linelet (line-implicit)', col: '#22d3ee' },
]

export function AnisotropicSmootherArena() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [logAR, setLogAR] = useState(2)
  const [mode, setMode] = useState<Mode>('jacobi')
  const [running, setRunning] = useState(true)
  const [omega, setOmega] = useState(1)

  const arRef = useRef(logAR)
  const modeRef = useRef(mode)
  const runRef = useRef(running)
  const wRef = useRef(omega)
  arRef.current = logAR
  modeRef.current = mode
  runRef.current = running
  wRef.current = omega

  const resetRef = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const u = new Float64Array(NX * NY)
    const un = new Float64Array(NX * NY)
    const cA = new Float64Array(NY)
    const cB = new Float64Array(NY)
    const cC = new Float64Array(NY)
    const cD = new Float64Array(NY)
    const cP = new Float64Array(NY)
    const cQ = new Float64Array(NY)

    const hist = new Float64Array(HIST)
    let histN = 0
    let sweeps = 0
    let e0 = 1
    let ePrev = 1
    let rhoMeas = 0
    let converged = -1
    let lastAR = -1
    let lastMode: Mode | null = null

    const at = (i: number, j: number) => i * NY + j

    const seed = () => {
      // a deliberately broad error: smooth hump + cell-to-cell noise, so both
      // the wall-normal and the wall-parallel content are visible from step 0
      let s = 12345
      const rnd = () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff
        return s / 0x7fffffff - 0.5
      }
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
          const x = i / (NX - 1)
          const y = j / (NY - 1)
          const smooth = Math.sin(Math.PI * x) * Math.sin(Math.PI * y)
          u[at(i, j)] = 0.7 * smooth + 0.6 * rnd()
        }
      }
      histN = 0
      sweeps = 0
      converged = -1
      rhoMeas = 0
    }

    // f = 0, so the exact answer is u = 0 and ||u|| IS the error norm
    const errorNorm = () => {
      let sum = 0
      for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NY - 1; j++) {
          const v = u[at(i, j)]
          sum += v * v
        }
      }
      return Math.sqrt(sum)
    }

    const sweepJacobi = (ax: number, ay: number, d0: number, w: number) => {
      const dg = d0 + 2 * ax + 2 * ay
      un.set(u)
      for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NY - 1; j++) {
          const k = at(i, j)
          const r =
            -(d0 * u[k] + ax * (2 * u[k] - u[k - NY] - u[k + NY]) + ay * (2 * u[k] - u[k - 1] - u[k + 1]))
          un[k] = u[k] + (w * r) / dg
        }
      }
      u.set(un)
    }

    const sweepGaussSeidel = (ax: number, ay: number, d0: number, w: number) => {
      const dg = d0 + 2 * ax + 2 * ay
      for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NY - 1; j++) {
          const k = at(i, j)
          const r =
            -(d0 * u[k] + ax * (2 * u[k] - u[k - NY] - u[k + NY]) + ay * (2 * u[k] - u[k - 1] - u[k + 1]))
          u[k] += (w * r) / dg
        }
      }
    }

    // one linelet = one wall-normal column, inverted exactly with Thomas
    const sweepLinelet = (ax: number, ay: number, d0: number) => {
      const dg = d0 + 2 * ax + 2 * ay
      for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NY - 1; j++) {
          cA[j] = -ay
          cB[j] = dg
          cC[j] = -ay
          cD[j] = ax * (u[at(i - 1, j)] + u[at(i + 1, j)])
        }
        // forward elimination
        let j0 = 1
        cP[j0] = cC[j0] / cB[j0]
        cQ[j0] = cD[j0] / cB[j0]
        for (j0 = 2; j0 < NY - 1; j0++) {
          const den = cB[j0] - cA[j0] * cP[j0 - 1]
          cP[j0] = cC[j0] / den
          cQ[j0] = (cD[j0] - cA[j0] * cQ[j0 - 1]) / den
        }
        // back substitution
        u[at(i, NY - 2)] = cQ[NY - 2]
        for (j0 = NY - 3; j0 >= 1; j0--) {
          u[at(i, j0)] = cQ[j0] - cP[j0] * u[at(i, j0 + 1)]
        }
      }
    }

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      const AR = Math.pow(10, arRef.current)
      const m = modeRef.current
      const modeInfo = MODES.find((v) => v.key === m) as { key: Mode; label: string; col: string }

      const dx = 1 / NX
      const dy = dx / AR
      const ax = 1 / (dx * dx)
      const ay = 1 / (dy * dy)
      const d0 = 4 * ax

      if (AR !== lastAR || m !== lastMode || resetRef.current !== 0) {
        if (resetRef.current !== 0) resetRef.current = 0
        lastAR = AR
        lastMode = m
        seed()
        e0 = errorNorm()
        ePrev = e0
      }

      if (runRef.current && converged < 0) {
        if (m === 'jacobi') sweepJacobi(ax, ay, d0, wRef.current)
        else if (m === 'gs') sweepGaussSeidel(ax, ay, d0, wRef.current)
        else sweepLinelet(ax, ay, d0)
        sweeps += 1
        const en = errorNorm()
        rhoMeas = en / Math.max(ePrev, 1e-300)
        ePrev = en
        const rn = en / e0
        if (histN < HIST) hist[histN++] = rn
        else {
          hist.copyWithin(0, 1)
          hist[HIST - 1] = rn
        }
        if (rn < TOL) converged = sweeps
      }

      const rNow = histN > 0 ? hist[histN - 1] : 1

      ctx.clearRect(0, 0, 660, 430)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, 660, 430)

      text('error field  (f = 0, so everything you see is error)', HX, HY - 12, '#cbd5e1')

      // ------------------------------------------------------------- heat map
      const cw = HW / NX
      const ch = HH / NY
      let peak = 1e-12
      for (let k = 0; k < NX * NY; k++) peak = Math.max(peak, Math.abs(u[k]))
      for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
          const v = u[at(i, j)] / peak
          const a = Math.min(1, Math.abs(v))
          ctx.fillStyle =
            v >= 0 ? `rgba(248,113,113,${a.toFixed(3)})` : `rgba(56,189,248,${a.toFixed(3)})`
          ctx.fillRect(HX + i * cw, HY + HH - (j + 1) * ch, cw + 0.6, ch + 0.6)
        }
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(HX, HY, HW, HH)

      // the wall, and the linelets that stand on it
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(HX, HY + HH)
      ctx.lineTo(HX + HW, HY + HH)
      ctx.stroke()
      text('wall (y = 0)', HX + 4, HY + HH + 14, '#e2e8f0')
      text('peak |e| = ' + peak.toExponential(1), HX + HW - 118, HY + HH + 14, '#94a3b8')

      if (m === 'linelet') {
        ctx.strokeStyle = 'rgba(34,211,238,0.5)'
        ctx.lineWidth = 1
        for (let i = 2; i < NX - 1; i += 5) {
          const X = HX + (i + 0.5) * cw
          ctx.beginPath()
          ctx.moveTo(X, HY + HH - ch * 0.5)
          ctx.lineTo(X, HY + ch * 0.5)
          ctx.stroke()
        }
        text('each cyan column is inverted exactly, in one Thomas pass', HX, HY - 26, '#22d3ee')
      } else {
        text('the point smoother only ever talks to the 4 face neighbors', HX, HY - 26, '#94a3b8')
      }

      // ----------------------------------------------------- residual history
      text('‖e‖ / ‖e₀‖   (log scale, 10⁰ … 10⁻⁸)', RX, RY - 12, '#cbd5e1')
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(RX, RY, RW, RH)
      ctx.strokeStyle = 'rgba(148,163,184,0.16)'
      for (let d = 1; d <= 7; d++) {
        const Y = RY + (d / 8) * RH
        ctx.beginPath()
        ctx.moveTo(RX, Y)
        ctx.lineTo(RX + RW, Y)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(74,222,128,0.7)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(RX, RY + (6 / 8) * RH)
      ctx.lineTo(RX + RW, RY + (6 / 8) * RH)
      ctx.stroke()
      ctx.setLineDash([])
      text('10⁻⁶', RX + RW - 30, RY + (6 / 8) * RH - 3, '#4ade80')

      ctx.beginPath()
      for (let i = 0; i < histN; i++) {
        const X = RX + (i / (HIST - 1)) * RW
        const e = Math.max(-8, Math.log10(Math.max(hist[i], 1e-30)))
        const Y = RY + (-e / 8) * RH
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.strokeStyle = modeInfo.col
      ctx.lineWidth = 1.8
      ctx.stroke()

      // ------------------------------------------------------------- readouts
      const R0 = 258
      const LH = 16
      text(`AR = Δx/Δy = ${AR < 10 ? AR.toFixed(1) : AR.toFixed(0)}`, HX, R0, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text(`a_y/a_x = AR² = ${(AR * AR).toExponential(1)}`, 190, R0, '#94a3b8')
      text(`sweeps = ${sweeps}`, 400, R0, '#e2e8f0')
      text(`‖e‖/‖e₀‖ = ${rNow.toExponential(2)}`, 500, R0, rNow < TOL ? '#4ade80' : '#e2e8f0')

      // bounds on the iteration matrix, written out so the reader can check
      const pointRho = (2 + 2 * AR * AR) / (6 + 2 * AR * AR)
      const lineRho = 2 / 6
      text(
        `point-smoother bound  (2 + 2AR²)/(6 + 2AR²) = ${pointRho.toFixed(5)}`,
        HX,
        R0 + LH,
        m === 'linelet' ? '#64748b' : '#f87171'
      )
      text(
        `linelet bound  2a_x/(d₀ + 2a_x) = ${lineRho.toFixed(5)}   — no AR in it`,
        HX,
        R0 + 2 * LH,
        m === 'linelet' ? '#22d3ee' : '#64748b'
      )

      text(
        `measured ‖e_k‖/‖e_{k−1}‖ = ${sweeps > 0 ? rhoMeas.toFixed(5) : '—'}`,
        HX,
        R0 + 3 * LH,
        '#cbd5e1'
      )

      if (converged > 0) {
        text(`converged in ${converged} sweeps`, 300, R0 + 3 * LH, '#4ade80', 'bold 11px ui-monospace, monospace')
      } else if (sweeps > 400) {
        text('still grinding — this is a stalled smoother', 300, R0 + 3 * LH, '#f87171')
      }

      // active mode badge
      ctx.font = 'bold 11px ui-monospace, monospace'
      const bw = ctx.measureText(modeInfo.label).width + 18
      ctx.fillStyle = modeInfo.col
      ctx.globalAlpha = 0.16
      ctx.fillRect(HX, R0 + 4 * LH - 2, bw, 18)
      ctx.globalAlpha = 1
      ctx.strokeStyle = modeInfo.col
      ctx.lineWidth = 1
      ctx.strokeRect(HX, R0 + 4 * LH - 2, bw, 18)
      text(modeInfo.label, HX + 9, R0 + 4 * LH + 11, modeInfo.col, 'bold 11px ui-monospace, monospace')

      // physical cell glyph — what the mesh actually looks like at this AR
      const gx = 470
      const gy = R0 + LH - 4
      const gw = 150
      const gh = Math.max(1.2, 150 / AR)
      ctx.strokeStyle = 'rgba(226,232,240,0.75)'
      ctx.lineWidth = 1
      ctx.strokeRect(gx, gy + 40 - gh / 2, gw, gh)
      text('one cell, to scale', gx, gy + 66, '#94a3b8')
      text('Δx', gx + gw / 2 - 8, gy + 40 - gh / 2 - 6, '#94a3b8')
      text('Δy', gx - 20, gy + 44, '#94a3b8')
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean, col: string): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={660}
        height={430}
        style={{
          width: '100%',
          maxWidth: 660,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.7rem',
          alignItems: 'center',
          marginTop: '0.7rem',
          fontSize: 13,
          color: '#cbd5e1',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          log₁₀ AR
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={logAR}
            onChange={(e) => setLogAR(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }}>
            {Math.pow(10, logAR).toFixed(Math.pow(10, logAR) < 10 ? 1 : 0)}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ω
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.05}
            value={omega}
            onChange={(e) => setOmega(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 30 }}>
            {omega.toFixed(2)}
          </span>
        </label>

        {MODES.map((v) => (
          <button key={v.key} onClick={() => setMode(v.key)} style={btn(mode === v.key, v.col)}>
            {v.label}
          </button>
        ))}

        <button onClick={() => setRunning((v) => !v)} style={btn(running, '#94a3b8')}>
          {running ? '❚❚ pause' : '▶ run'}
        </button>
        <button
          onClick={() => {
            resetRef.current = 1
          }}
          style={btn(false, '#94a3b8')}
        >
          ↺ reseed error
        </button>
      </div>

      <p
        style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: '0.5rem',
          fontFamily: 'ui-monospace, monospace',
          lineHeight: 1.55,
        }}
      >
        What to watch: at AR = 1 all three iterations finish in tens of sweeps. Drag AR to 100 and the two point smoothers
        flatten out — the wall-normal stripes vanish almost at once, but the wall-parallel streaks just sit there and the
        measured factor climbs to 0.997. Switch to linelet at the same AR and it lands in single digits. The two bounds
        under the map say why: AR is in the point-smoother one and absent from the linelet one.
      </p>
    </div>
  )
}
