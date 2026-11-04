'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 470
const GREY = 'rgba(140,140,140,0.95)'
const JET = '#38bdf8'
const SLOW = '#f97316'
const LOSS = '#ef4444'
const IDEAL = '#a78bfa'
const REAL = '#22c55e'

// pipe geometry (px)
const PX0 = 30, PXE = 250, PX1 = 740, PY0 = 24, PH = 150
const LM = 110 // mixing length in px (display only)

type P = { x: number; s: number; dead: boolean; a: number; r: number; side: number }

// Sudden expansion, area ratio sigma = A1/A2, V1 = 1.
// Everything in units of ½ρV1²:
//   Bernoulli pressure rise   = 1 − σ²
//   Borda–Carnot pressure rise = 2σ(1 − σ)
//   loss                       = (1 − σ)²
export function LostVelocityExpansionLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [sigma, setSigma] = useState(0.5)
  const [showIdeal, setShowIdeal] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(true)
  const sigRef = useRef(sigma), idealRef = useRef(showIdeal), spdRef = useRef(speed), playRef = useRef(playing)
  sigRef.current = sigma; idealRef.current = showIdeal; spdRef.current = speed; playRef.current = playing

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const parts: P[] = []
    for (let i = 0; i < 170; i++) parts.push({ x: PX0 + Math.random() * (PX1 - PX0), s: Math.random() * 2 - 1, dead: false, a: 0, r: 0, side: 0 })
    for (let i = 0; i < 44; i++) parts.push({ x: 0, s: 0, dead: true, a: Math.random() * Math.PI * 2, r: 0.25 + Math.random() * 0.7, side: i % 2 })
    let raf = 0

    const mix = (x: number) => (x <= PXE ? 0 : 1 - Math.exp(-(x - PXE) / LM))

    const draw = () => {
      const sg = sigRef.current
      const V2 = sg
      const dpB = 1 - sg * sg, dpC = 2 * sg * (1 - sg), K = (1 - sg) * (1 - sg)
      const midY = PY0 + PH / 2, hJet = PH * sg
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // ---- pipe walls
      ctx.strokeStyle = GREY; ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(PX0, midY - hJet / 2); ctx.lineTo(PXE, midY - hJet / 2); ctx.lineTo(PXE, PY0); ctx.lineTo(PX1, PY0)
      ctx.moveTo(PX0, midY + hJet / 2); ctx.lineTo(PXE, midY + hJet / 2); ctx.lineTo(PXE, PY0 + PH); ctx.lineTo(PX1, PY0 + PH)
      ctx.stroke()
      // dead-water zones
      ctx.fillStyle = 'rgba(249,115,22,0.07)'
      ctx.fillRect(PXE, PY0, LM * 1.4, (PH - hJet) / 2)
      ctx.fillRect(PXE, midY + hJet / 2, LM * 1.4, (PH - hJet) / 2)

      // ---- particles
      const adv = playRef.current ? 2.2 * spdRef.current : 0
      for (const p of parts) {
        if (p.dead) {
          const gap = (PH - hJet) / 2
          if (gap < 6) continue
          p.a += adv * 0.012
          const cx = PXE + LM * 0.6, cy = p.side ? PY0 + gap / 2 : PY0 + PH - gap / 2
          const px = cx + Math.cos(p.a) * p.r * LM * 0.55, py = cy + Math.sin(p.a) * p.r * gap * 0.42
          ctx.fillStyle = SLOW
          ctx.globalAlpha = 0.75
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill()
          ctx.globalAlpha = 1
          continue
        }
        const m = mix(p.x)
        const u = 1 - (1 - V2) * m
        p.x += adv * u
        if (p.x > PX1) { p.x = PX0; p.s = Math.random() * 2 - 1 }
        const half = hJet / 2 + ((PH - hJet) / 2) * m
        const py = midY + p.s * half * 0.95
        ctx.fillStyle = u > 0.999 ? JET : `rgb(${Math.round(56 + 150 * (1 - u))},${Math.round(189 - 40 * (1 - u))},${Math.round(248 - 120 * (1 - u))})`
        ctx.beginPath(); ctx.arc(p.x, py, 2.2, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = GREY
      ctx.fillText(`A1 (V1 = 1)`, PX0 + 6, midY - hJet / 2 - 6)
      ctx.fillText(`A2 = A1/σ  (V2 = σ = ${V2.toFixed(2)})`, PX1 - 230, PY0 + PH + 16)
      ctx.fillStyle = SLOW
      ctx.fillText('dead water: p ≈ p1', PXE + 6, PY0 + 14)

      // ---- head plot
      const gx0 = PX0, gx1 = PX1, gy0 = 210, gy1 = 345
      const ymap = (v: number) => gy1 - (v / 1.05) * (gy1 - gy0)
      const xs = (x: number) => x
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'; ctx.lineWidth = 1
      ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0)
      ctx.fillStyle = GREY
      ctx.fillText('units of ½ρV1²', gx0 + 4, gy0 - 4)
      for (const v of [0, 0.5, 1]) { ctx.fillText(v.toFixed(1), gx0 - 26, ymap(v) + 4) }
      ctx.beginPath(); ctx.setLineDash([2, 4]); ctx.moveTo(PXE, gy0); ctx.lineTo(PXE, gy1); ctx.stroke(); ctx.setLineDash([])
      const line = (fn: (m: number) => number, col: string, dash: number[]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash); ctx.beginPath()
        for (let x = gx0; x <= gx1; x += 4) { const y = ymap(fn(mix(x))); x === gx0 ? ctx.moveTo(xs(x), y) : ctx.lineTo(xs(x), y) }
        ctx.stroke(); ctx.setLineDash([])
      }
      if (idealRef.current) {
        line(() => 1, IDEAL, [6, 4])
        line((m) => dpB * m, IDEAL, [2, 3])
      }
      line((m) => 1 - K * m, REAL, [6, 4])
      line((m) => dpC * m, REAL, [])
      // loss band
      ctx.fillStyle = 'rgba(239,68,68,0.12)'
      ctx.beginPath(); ctx.moveTo(PXE, ymap(1))
      for (let x = PXE; x <= gx1; x += 4) ctx.lineTo(x, ymap(1 - K * mix(x)))
      ctx.lineTo(gx1, ymap(1)); ctx.closePath(); ctx.fill()
      ctx.font = '11.5px ui-monospace, monospace'
      ctx.fillStyle = REAL; ctx.fillText(`total head (real)`, gx1 - 150, ymap(1 - K) + 14)
      ctx.fillText(`p − p1 (Borda–Carnot) = ${dpC.toFixed(3)}`, gx1 - 250, ymap(dpC) - 6)
      if (idealRef.current) { ctx.fillStyle = IDEAL; ctx.fillText(`p − p1 (Bernoulli) = ${dpB.toFixed(3)}`, gx1 - 250, ymap(dpB) - 6) }
      ctx.fillStyle = LOSS; ctx.fillText(`loss K = (1−σ)² = ${K.toFixed(3)}`, PXE + 8, ymap(1) + 14)

      // ---- energy ledger bars
      const by = 380, bh = 22, bx0 = 140, bw = 420
      const bar = (y: number, label: string, segs: [number, string, string][]) => {
        ctx.fillStyle = GREY; ctx.fillText(label, 30, y + 15)
        let x = bx0
        for (const [v, c, t] of segs) {
          const w = v * bw
          ctx.fillStyle = c; ctx.globalAlpha = 0.8; ctx.fillRect(x, y, w, bh); ctx.globalAlpha = 1
          if (w > 44) { ctx.fillStyle = '#0b0b0b'; ctx.fillText(t, x + 4, y + 15) }
          x += w
        }
      }
      bar(by, 'Bernoulli', [[sg * sg, JET, `KE ${(sg * sg).toFixed(2)}`], [dpB, IDEAL, `p ${dpB.toFixed(2)}`]])
      bar(by + 32, 'Borda–Carnot', [[sg * sg, JET, `KE ${(sg * sg).toFixed(2)}`], [dpC, REAL, `p ${dpC.toFixed(2)}`], [K, LOSS, `lost ${K.toFixed(2)}`]])
      // lost-velocity arrows (Carnot)
      const ax = 590, sc = 140
      ctx.strokeStyle = JET; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(ax, by + 6); ctx.lineTo(ax + sc, by + 6); ctx.stroke()
      ctx.strokeStyle = REAL
      ctx.beginPath(); ctx.moveTo(ax, by + 26); ctx.lineTo(ax + sc * V2, by + 26); ctx.stroke()
      ctx.strokeStyle = LOSS
      ctx.beginPath(); ctx.moveTo(ax + sc * V2, by + 42); ctx.lineTo(ax + sc, by + 42); ctx.stroke()
      ctx.fillStyle = GREY
      ctx.fillText('V1', ax + sc + 4, by + 10); ctx.fillText('V2', ax + sc * V2 + 4, by + 30)
      ctx.fillStyle = LOSS; ctx.fillText(`lost V1−V2`, ax, by + 60)
      ctx.fillStyle = GREY
      ctx.fillText(`Bernoulli / real pressure rise = ${(dpB / dpC).toFixed(2)}×`, 30, H - 8)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const K = (1 - sigma) ** 2

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          area ratio σ = A1/A2 = {sigma.toFixed(2)}{' '}
          <input type="range" min={0.1} max={0.95} step={0.01} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} />
        </label>
        <label>
          speed = {speed.toFixed(1)}×{' '}
          <input type="range" min={0.2} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <label style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={showIdeal} onChange={(e) => setShowIdeal(e.target.checked)} /> show ideal Bernoulli
        </label>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', color: GREY }}>
        V2/V1 = {sigma.toFixed(2)} · Δp_Bernoulli = {(1 - sigma * sigma).toFixed(3)} · Δp_Borda–Carnot = {(2 * sigma * (1 - sigma)).toFixed(3)} · K = {K.toFixed(3)} (units of ½ρV1²)
      </div>
    </div>
  )
}
