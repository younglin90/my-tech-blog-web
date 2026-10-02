'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Closure = 'acid' | 'zero' | 'flip'

const CLOSURES: { id: Closure; label: string; color: string }[] = [
  { id: 'acid', label: 'ACID  K = (B_g-B_l)ψ(1-ψ)/D', color: '#38bdf8' },
  { id: 'zero', label: 'K = 0  (plain ψ∇·u)', color: '#f59e0b' },
  { id: 'flip', label: 'K with flipped sign', color: '#f43f5e' },
]

const GAM_L = 4.4
const GAM_G = 1.4

/** stiffened-gas density ratio ρ(p)/ρ(p0) at pressure ratio r, with Π scaled by B */
function densityRatio(r: number, gam: number, pi: number) {
  return Math.pow((r + pi) / (1 + pi), 1 / gam)
}

export function AcidClosureSqueezeCell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [psi0, setPsi0] = useState(0.5)
  const [ratioMax, setRatioMax] = useState(10)
  const [logStiff, setLogStiff] = useState(4.3) // log10(B_l / B_g)
  const [closure, setClosure] = useState<Closure>('zero')
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ r: 1, psi: 0.5, vl: 0.5, vlExact: 0.5, k: 0 })

  const stateRef = useRef({ r: 1, psi: psi0, vol: 1, trace: [] as [number, number][] })

  const reset = useCallback(() => {
    stateRef.current = { r: 1, psi: psi0, vol: 1, trace: [[1, psi0]] }
  }, [psi0])

  useEffect(() => { reset() }, [reset, closure, logStiff, ratioMax])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // non-dimensional bulk moduli at p = p0:  B_g = 1, B_l = 10^logStiff
    const bg0 = 1
    const bl0 = Math.pow(10, logStiff)
    // stiffened-gas Π for the liquid so that B_l = γ_l (p + Π):  Π = B_l/γ_l - 1
    const piL = bl0 / GAM_L - 1
    const piG = bg0 / GAM_G - 1

    const kOf = (psi: number, r: number) => {
      const bl = GAM_L * (r + piL)
      const bg = GAM_G * (r + piG)
      const k = ((bg - bl) * psi * (1 - psi)) / (bg * psi + bl * (1 - psi))
      return closure === 'zero' ? 0 : closure === 'flip' ? -k : k
    }

    let raf = 0
    let frame = 0

    const step = () => {
      const s = stateRef.current
      if (running && s.r < ratioMax) {
        for (let sub = 0; sub < 8; sub++) {
          if (s.r >= ratioMax) break
          const dr = Math.min(ratioMax * 0.0012, ratioMax - s.r)
          const bl = GAM_L * (s.r + piL)
          const bg = GAM_G * (s.r + piG)
          // mixture compliance -> (1/V) dV/dp
          const compl = -(s.psi / bl + (1 - s.psi) / bg)
          const divudt = compl * dr
          s.psi = Math.min(1, Math.max(0, s.psi + kOf(s.psi, s.r) * divudt))
          s.vol *= 1 + divudt
          s.r += dr
        }
        const last = s.trace[s.trace.length - 1]
        if (!last || s.r - last[0] > ratioMax / 220) s.trace.push([s.r, s.psi])
      }
      draw()
      frame++
      if (frame % 12 === 0) {
        const s2 = stateRef.current
        const vlEx = psi0 / densityRatio(s2.r, GAM_L, piL)
        setReadout({
          r: s2.r,
          psi: s2.psi,
          vl: s2.psi * s2.vol,
          vlExact: vlEx,
          k: kOf(s2.psi, s2.r),
        })
      }
      raf = requestAnimationFrame(step)
    }

    const draw = () => {
      const s = stateRef.current
      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'

      // exact Lagrangian volumes
      const vlEx = psi0 / densityRatio(s.r, GAM_L, piL)
      const vgEx = (1 - psi0) / densityRatio(s.r, GAM_G, piG)
      const vlNum = s.psi * s.vol
      const vgNum = (1 - s.psi) * s.vol

      const baseY = H - 46
      const fullH = 212
      const colW = 76
      const cols: { x: number; vl: number; vg: number; tag: string }[] = [
        { x: 48, vl: vlEx, vg: vgEx, tag: 'exact' },
        { x: 170, vl: vlNum, vg: vgNum, tag: 'scheme' },
      ]

      for (const c of cols) {
        const hl = vlEx + vgEx > 0 ? c.vl * fullH : 0
        const hg = c.vg * fullH
        // gas on top, liquid at the bottom
        ctx.fillStyle = '#334155'
        ctx.fillRect(c.x, baseY - hl - hg, colW, hg)
        ctx.fillStyle = c.tag === 'exact' ? '#1d4ed8' : CLOSURES.find((q) => q.id === closure)!.color
        ctx.fillRect(c.x, baseY - hl, colW, hl)
        ctx.strokeStyle = '#64748b'
        ctx.strokeRect(c.x, baseY - hl - hg, colW, hl + hg)
        // piston
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(c.x - 6, baseY - hl - hg - 9, colW + 12, 8)
        ctx.fillStyle = '#94a3b8'
        ctx.textAlign = 'center'
        ctx.fillText(c.tag, c.x + colW / 2, baseY + 16)
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(`V_l=${c.vl.toFixed(4)}`, c.x + colW / 2, baseY + 30)
      }
      ctx.strokeStyle = '#475569'
      ctx.beginPath()
      ctx.moveTo(32, baseY + 0.5)
      ctx.lineTo(262, baseY + 0.5)
      ctx.stroke()
      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748b'
      ctx.fillText('wall', 32, baseY + 42)
      ctx.fillStyle = '#1d4ed8'
      ctx.fillRect(32, 14, 9, 9)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('liquid', 46, 22)
      ctx.fillStyle = '#334155'
      ctx.fillRect(100, 14, 9, 9)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('gas', 114, 22)

      // --- psi(p) trace -------------------------------------------------
      const px = 300
      const py = 34
      const pw = W - px - 22
      const ph = H - py - 56
      ctx.strokeStyle = '#334155'
      ctx.strokeRect(px, py, pw, ph)
      const psiLo = Math.max(0, psi0 - 0.12)
      const psiHi = Math.min(1, psi0 + 0.24)
      const X = (r: number) => px + (pw * (r - 1)) / Math.max(1e-9, ratioMax - 1)
      const Y = (v: number) => py + ph - (ph * (v - psiLo)) / (psiHi - psiLo)

      for (let g = 0; g <= 4; g++) {
        const v = psiLo + ((psiHi - psiLo) * g) / 4
        ctx.strokeStyle = '#1e293b'
        ctx.beginPath()
        ctx.moveTo(px, Y(v))
        ctx.lineTo(px + pw, Y(v))
        ctx.stroke()
        ctx.fillStyle = '#64748b'
        ctx.fillText(v.toFixed(2), px - 30, Y(v) + 4)
      }

      // exact psi curve
      ctx.strokeStyle = '#1d4ed8'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const r = 1 + ((ratioMax - 1) * i) / 160
        const a = psi0 / densityRatio(r, GAM_L, piL)
        const b = (1 - psi0) / densityRatio(r, GAM_G, piG)
        const v = a + b > 0 ? a / (a + b) : 0
        const yy = Math.min(py + ph, Math.max(py, Y(v)))
        if (i === 0) ctx.moveTo(X(r), yy)
        else ctx.lineTo(X(r), yy)
      }
      ctx.stroke()

      // scheme trace
      ctx.strokeStyle = CLOSURES.find((q) => q.id === closure)!.color
      ctx.beginPath()
      s.trace.forEach(([r, v], i) => {
        const yy = Math.min(py + ph, Math.max(py, Y(v)))
        if (i === 0) ctx.moveTo(X(r), yy)
        else ctx.lineTo(X(r), yy)
      })
      ctx.stroke()
      ctx.lineWidth = 1

      ctx.fillStyle = '#94a3b8'
      ctx.fillText('ψ  (liquid volume fraction)', px + 4, py - 10)
      ctx.fillText('p / p₀', px + pw - 38, py + ph + 18)
      for (let g = 0; g <= 3; g++) {
        const r = 1 + ((ratioMax - 1) * g) / 3
        ctx.fillStyle = '#64748b'
        ctx.fillText(r.toFixed(1), X(r) - 8, py + ph + 18)
      }
      ctx.fillStyle = '#1d4ed8'
      ctx.fillText('exact (isobaric closure)', px + 4, py + ph + 34)
      ctx.fillStyle = CLOSURES.find((q) => q.id === closure)!.color
      ctx.fillText(closure === 'acid' ? 'ACID' : closure === 'zero' ? 'K = 0' : 'flipped K', px + 170, py + ph + 34)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [running, psi0, ratioMax, logStiff, closure])

  const lossPct = readout.vlExact > 0 ? (100 * (readout.vl - readout.vlExact)) / readout.vlExact : 0

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <canvas
        ref={canvasRef}
        width={700}
        height={310}
        style={{ width: '100%', maxWidth: 700, borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CLOSURES.map((c) => (
          <button
            key={c.id}
            onClick={() => setClosure(c.id)}
            style={{
              padding: '4px 9px',
              fontSize: 12,
              borderRadius: 6,
              border: `1px solid ${closure === c.id ? c.color : '#475569'}`,
              background: closure === c.id ? c.color : 'transparent',
              color: closure === c.id ? '#0b1220' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
        <button
          onClick={() => setRunning((v) => !v)}
          style={{ padding: '4px 9px', fontSize: 12, borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          {running ? 'pause' : 'play'}
        </button>
        <button
          onClick={reset}
          style={{ padding: '4px 9px', fontSize: 12, borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          reset
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, fontSize: 12 }}>
        <label>
          ψ₀ (initial liquid fraction) = {psi0.toFixed(2)}
          <input type="range" min={0.05} max={0.95} step={0.05} value={psi0} onChange={(e) => setPsi0(+e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          final p/p₀ = {ratioMax.toFixed(0)}
          <input type="range" min={2} max={50} step={1} value={ratioMax} onChange={(e) => setRatioMax(+e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          log₁₀(ρ_l a_l² / ρ_g a_g²) = {logStiff.toFixed(1)}
          <input type="range" min={1} max={5} step={0.1} value={logStiff} onChange={(e) => setLogStiff(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.7 }}>
        p/p₀ = {readout.r.toFixed(2)} &nbsp;|&nbsp; ψ = {readout.psi.toFixed(5)} &nbsp;|&nbsp; K = {readout.k.toFixed(5)} &nbsp;|&nbsp; ψ+K = {(readout.psi + readout.k).toExponential(2)}
        <br />
        V_liquid: scheme {readout.vl.toFixed(5)} vs exact {readout.vlExact.toFixed(5)} &nbsp;→&nbsp; {lossPct >= 0 ? '+' : ''}
        {lossPct.toFixed(2)}%
      </div>
    </div>
  )
}
