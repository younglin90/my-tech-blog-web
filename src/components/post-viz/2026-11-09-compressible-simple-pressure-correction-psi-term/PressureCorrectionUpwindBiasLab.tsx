'use client'

import { useEffect, useRef, useState } from 'react'

// One row of cells, one unit of mass imbalance in the middle cell.
// Pressure-correction equation per cell:
//   (2D + C) p'_i - D p'_{i+1} - (D + C) p'_{i-1} = b_i
// D = rho*d*A (velocity response), C = u*psi*A (density carried by the flow).
// C/D ~ gamma*M^2/alpha_u. C = 0 is the incompressible-style equation.

const W = 760
const H = 440
const N = 41
const MID = 20
const BG = '#0f172a'
const INC = '#f97316'
const CMP = '#38bdf8'
const GRID = 'rgba(148,163,184,0.25)'
const TXT = '#cbd5e1'

type Read = { sweeps: number; peakI: number; peakC: number; fracRho: number; ratio: number; res: number }

function gsSweep(p: Float64Array, D: number, C: number) {
  let r = 0
  for (let i = 0; i < N; i++) {
    const pw = i > 0 ? p[i - 1] : 0
    const pe = i < N - 1 ? p[i + 1] : 0
    const b = i === MID ? 1 : 0
    const nw = (b + D * pe + (D + C) * pw) / (2 * D + C)
    r = Math.max(r, Math.abs(nw - p[i]))
    p[i] = nw
  }
  return r
}

export function PressureCorrectionUpwindBiasLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mach, setMach] = useState(0.5)
  const [au, setAu] = useState(0.5)
  const [spf, setSpf] = useState(10)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Read>({ sweeps: 0, peakI: 0, peakC: 0, fracRho: 0, ratio: 0, res: 1 })
  const playRef = useRef(playing), spfRef = useRef(spf)
  playRef.current = playing; spfRef.current = spf
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const D = 1
    const C = (1.4 * mach * mach) / au
    const pI = new Float64Array(N), pC = new Float64Array(N)
    let sweeps = 0, res = 1, frame = 0, raf = 0

    const step = () => {
      if (res < 1e-10) return
      const r1 = gsSweep(pI, D, 0)
      const r2 = gsSweep(pC, D, C)
      res = Math.max(r1, r2); sweeps++
    }
    stepRef.current = () => { step(); draw(); push() }

    const push = () => {
      // at convergence the unit imbalance leaves through both ends:
      // west D*p'_0, east (D + C)*p'_{N-1}; the C part is carried as rho'u
      const rhoPart = C * pC[N - 1]
      const total = D * pC[0] + (D + C) * pC[N - 1]
      setRead({
        sweeps, peakI: Math.max(...pI), peakC: Math.max(...pC),
        fracRho: total > 0 ? rhoPart / total : 0, ratio: C / D, res,
      })
    }

    const draw = () => {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      const L = 60, R = W - 20, T = 40, B = 300
      const pmax = Math.max(0.55, ...pI, ...pC) * 1.08
      const X = (i: number) => L + ((i + 0.5) / N) * (R - L)
      const Y = (v: number) => B - (v / pmax) * (B - T)
      ctx.strokeStyle = GRID; ctx.lineWidth = 1
      for (let k = 0; k <= 5; k++) {
        const v = (pmax * k) / 5
        ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(R, Y(v)); ctx.stroke()
        ctx.fillStyle = TXT; ctx.font = '11px monospace'; ctx.fillText(v.toFixed(2), 14, Y(v) + 4)
      }
      // cells
      for (let i = 0; i < N; i++) {
        ctx.fillStyle = i === MID ? 'rgba(250,204,21,0.25)' : 'rgba(148,163,184,0.06)'
        ctx.fillRect(X(i) - (R - L) / N / 2 + 1, T, (R - L) / N - 2, B - T)
      }
      // flow arrow
      ctx.fillStyle = TXT; ctx.font = '12px sans-serif'
      ctx.fillText(`flow u > 0  →   (M = ${mach.toFixed(2)})`, L, 24)
      ctx.fillText('mass imbalance b = 1 here', X(MID) - 70, B + 18)
      const curve = (p: Float64Array, col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath()
        for (let i = 0; i < N; i++) { const x = X(i), y = Y(p[i]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) }
        ctx.stroke()
        ctx.fillStyle = col
        for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(X(i), Y(p[i]), 2.5, 0, 7); ctx.fill() }
      }
      curve(pI, INC); curve(pC, CMP)
      // velocity correction bars u' = d (p'_W - p'_E) on faces, compressible
      const yb = 380, sc = 55
      ctx.fillStyle = TXT; ctx.font = '11px sans-serif'
      ctx.fillText("face velocity correction u' ∝ p'_W − p'_E", L, 330)
      ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(L, yb); ctx.lineTo(R, yb); ctx.stroke()
      for (let f = 1; f < N; f++) {
        const x = L + (f / N) * (R - L)
        const dI = pI[f - 1] - pI[f], dC = pC[f - 1] - pC[f]
        ctx.fillStyle = INC; ctx.fillRect(x - 4, yb, 3, -dI * sc)
        ctx.fillStyle = CMP; ctx.fillRect(x + 1, yb, 3, -dC * sc)
      }
      // legend
      ctx.font = '12px sans-serif'
      ctx.fillStyle = INC; ctx.fillRect(R - 260, 50, 12, 3); ctx.fillText("incompressible p' (C = 0)", R - 242, 55)
      ctx.fillStyle = CMP; ctx.fillRect(R - 260, 70, 12, 3); ctx.fillText("compressible p' (+ψ u p')", R - 242, 75)
      ctx.fillStyle = TXT; ctx.fillText(`Gauss–Seidel sweeps: ${sweeps}`, R - 260, 95)
      ctx.fillText("p'", 30, T - 8); ctx.fillText('cell index →', R - 80, B + 18)
    }

    const loop = () => {
      if (playRef.current) for (let k = 0; k < spfRef.current; k++) step()
      draw()
      if (++frame % 12 === 0) push()
      raf = requestAnimationFrame(loop)
    }
    push(); raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mach, au, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          Mach M = {mach.toFixed(2)}{' '}
          <input type="range" min={0} max={1.2} step={0.02} value={mach} onChange={(e) => setMach(Number(e.target.value))} />
        </label>
        <label>
          α_u = {au.toFixed(2)}{' '}
          <input type="range" min={0.2} max={1} step={0.05} value={au} onChange={(e) => setAu(Number(e.target.value))} />
        </label>
        <label>
          sweeps/frame = {spf}{' '}
          <input type="range" min={1} max={60} step={1} value={spf} onChange={(e) => setSpf(Number(e.target.value))} />
        </label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
        C/D = γM²/α_u = {read.ratio.toFixed(3)} · peak p′ incompressible = <span style={{ color: INC }}>{read.peakI.toFixed(3)}</span> ·
        compressible = <span style={{ color: CMP }}>{read.peakC.toFixed(3)}</span> ·
        share carried as ρ′u = {(read.fracRho * 100).toFixed(1)}% · residual = {read.res.toExponential(1)}
      </div>
    </div>
  )
}
