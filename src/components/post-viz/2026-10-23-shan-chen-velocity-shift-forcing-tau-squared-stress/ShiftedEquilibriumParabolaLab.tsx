'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 360
const CS2 = 1 / 3
const NY = 64
const C_G = '#22c55e'
const C_S = '#f97316'
const C_E = '#a78bfa'
const C_F = '#38bdf8'

// D1Q3 equilibrium second moment at rho: Pi_eq(u) = cs^2 rho + rho u^2
function piEq(rho: number, u: number) { return CS2 * rho + rho * u * u }

export function ShiftedEquilibriumParabolaLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tau, setTau] = useState(1.5)
  const [gAmp, setGAmp] = useState(0.12)
  const [playing, setPlaying] = useState(true)
  const [show, setShow] = useState({ guo: true, sc: true, edm: true })
  const [read, setRead] = useState({ y: 0, F: 0, sc: 0, edm: 0, ueq: 0 })
  const phase = useRef(0)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0
    const b = { guo: 0, sc: (tau - 0.5) ** 2, edm: 0.25 }
    const rhoAt = (y: number) => 1 - 0.3 * Math.cos(2 * Math.PI * y / NY)
    const forceAt = (y: number) => gAmp * Math.sin(2 * Math.PI * y / NY)

    const draw = () => {
      if (playing) phase.current = (phase.current + 0.12) % NY
      const y = phase.current
      const F = forceAt(y), rho = rhoAt(y)
      const uSC = (tau - 0.5) * F / rho
      const uP = -0.5 * F / rho
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // ---- left: parabola Pi_eq(u_eq)
      const L = { x: 50, y: 30, w: 330, h: 280 }
      const uMax = 0.8, piLo = CS2 * rho - 0.02, piHi = CS2 * rho + 0.45
      const px = (u: number) => L.x + (Math.max(-uMax, Math.min(uMax, u)) + uMax) / (2 * uMax) * L.w
      const py = (p: number) => L.y + L.h - (p - piLo) / (piHi - piLo) * L.h
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(L.x, L.y, L.w, L.h)
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('u_eq (lattice units)', L.x + L.w / 2 - 60, L.y + L.h + 28)
      ctx.fillText('-0.8', L.x - 8, L.y + L.h + 14); ctx.fillText('0', px(0) - 3, L.y + L.h + 14); ctx.fillText('0.8', L.x + L.w - 12, L.y + L.h + 14)
      ctx.save(); ctx.translate(16, L.y + L.h / 2 + 60); ctx.rotate(-Math.PI / 2); ctx.fillText('Π_eq = cs²ρ + ρ u_eq²', 0, 0); ctx.restore()
      ctx.strokeStyle = 'rgba(127,127,127,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath()
      for (let i = 0; i <= 120; i++) { const u = -uMax + 2 * uMax * i / 120; const p = Math.min(piEq(rho, u), piHi); i ? ctx.lineTo(px(u), py(p)) : ctx.moveTo(px(u), py(p)) }
      ctx.stroke()
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(L.x, py(CS2 * rho)); ctx.lineTo(L.x + L.w, py(CS2 * rho)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillText('hydrostatic cs²ρ', L.x + 6, py(CS2 * rho) - 6)
      const dot = (u: number, col: string, r = 6) => {
        const p = Math.min(piEq(rho, u), piHi)
        ctx.strokeStyle = col; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(px(u), py(CS2 * rho)); ctx.lineTo(px(u), py(p)); ctx.stroke()
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px(u), py(p), r, 0, 2 * Math.PI); ctx.fill()
      }
      if (show.guo) dot(0, C_G, 7)
      if (show.edm) { dot(uP, C_E); dot(uP + F / rho, C_E) }
      if (show.sc) dot(uSC, C_S)
      // force arrow along u axis
      ctx.strokeStyle = C_F; ctx.fillStyle = C_F; ctx.lineWidth = 2
      const ay = L.y + 14
      ctx.beginPath(); ctx.moveTo(px(0), ay); ctx.lineTo(px(F / rho), ay); ctx.stroke()
      ctx.fillText(`F/ρ = ${(F / rho).toFixed(3)}`, px(0) + 6, ay + 16)

      // ---- right: column profiles along y
      const R = { x: 440, y: 30, w: 290, h: 280 }
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(R.x, R.y, R.w, R.h)
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('extra stress b·F²/ρ along the column', R.x + 10, R.y - 10)
      ctx.fillText('y →', R.x + R.w - 26, R.y + R.h + 16)
      const sMax = Math.max(0.25, (tau - 0.5) ** 2) * gAmp * gAmp / 0.7
      const rx = (yy: number) => R.x + yy / NY * R.w
      const ry = (s: number) => R.y + R.h - 20 - s / sMax * (R.h - 60)
      // force curve (top strip)
      ctx.strokeStyle = C_F; ctx.lineWidth = 1.5; ctx.beginPath()
      for (let j = 0; j <= NY; j++) { const yy = R.y + 28 - forceAt(j) / gAmp * 18; j ? ctx.lineTo(rx(j), yy) : ctx.moveTo(rx(j), yy) }
      ctx.stroke(); ctx.fillStyle = C_F; ctx.fillText('F(y)', R.x + 6, R.y + 14)
      const curve = (bb: number, col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        for (let j = 0; j <= NY; j++) { const f = forceAt(j); const s = bb * f * f / rhoAt(j); j ? ctx.lineTo(rx(j), ry(s)) : ctx.moveTo(rx(j), ry(s)) }
        ctx.stroke()
      }
      if (show.guo) curve(b.guo, C_G)
      if (show.edm) curve(b.edm, C_E)
      if (show.sc) curve(b.sc, C_S)
      ctx.strokeStyle = 'rgba(127,127,127,0.8)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(rx(y), R.y); ctx.lineTo(rx(y), R.y + R.h); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(127,127,127,0.9)'; ctx.fillText('0', R.x - 12, ry(0) + 4); ctx.fillText(sMax.toExponential(1), R.x - 8, ry(sMax) - 4)
      // legend
      let lx = 50
      for (const [k, c, t] of [['guo', C_G, 'Guo (b=0)'], ['edm', C_E, 'EDM (b=1/4)'], ['sc', C_S, `Shan–Chen (b=${b.sc.toFixed(2)})`]] as const) {
        if (!show[k]) continue
        ctx.fillStyle = c; ctx.fillRect(lx, H - 14, 12, 4); ctx.fillText(t, lx + 16, H - 8); lx += 200
      }

      if (++frame % 12 === 0) setRead({ y, F, sc: b.sc * F * F / rho, edm: 0.25 * F * F / rho, ueq: uSC })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [tau, gAmp, playing, show])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>τ = {tau.toFixed(2)} <input type="range" min={0.55} max={3} step={0.05} value={tau} onChange={(e) => setTau(+e.target.value)} /></label>
        <label>force amplitude G = {gAmp.toFixed(3)} <input type="range" min={0.02} max={0.2} step={0.005} value={gAmp} onChange={(e) => setGAmp(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause scan' : 'Play scan'}</button>
        <button style={btn(show.guo)} onClick={() => setShow((s) => ({ ...s, guo: !s.guo }))}>Guo</button>
        <button style={btn(show.edm)} onClick={() => setShow((s) => ({ ...s, edm: !s.edm }))}>EDM</button>
        <button style={btn(show.sc)} onClick={() => setShow((s) => ({ ...s, sc: !s.sc }))}>Shan–Chen</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        y = {read.y.toFixed(1)} · F = {read.F.toFixed(4)} · SC u_eq = (τ−½)F/ρ = {read.ueq.toFixed(4)} ·{' '}
        <span style={{ color: C_S }}>SC extra {read.sc.toExponential(2)}</span> ·{' '}
        <span style={{ color: C_E }}>EDM extra {read.edm.toExponential(2)}</span> · <span style={{ color: C_G }}>Guo 0</span>
      </div>
    </div>
  )
}
