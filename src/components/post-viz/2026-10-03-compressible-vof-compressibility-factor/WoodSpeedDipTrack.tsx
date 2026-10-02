'use client'

import { useEffect, useRef, useState } from 'react'

const GAM_L = 4.4
const PI_L = 6.0e8
const RHO_L0 = 1000
const GAM_G = 1.4
const RHO_G0 = 1.2
const P0 = 1.0e5
const SLAB = 2.0 // metres

function rhoL(p: number) {
  return RHO_L0 * Math.pow((p + PI_L) / (P0 + PI_L), 1 / GAM_L)
}
function rhoG(p: number) {
  return RHO_G0 * Math.pow(p / P0, 1 / GAM_G)
}
function speeds(psi: number, p: number) {
  const bl = GAM_L * (p + PI_L)
  const bg = GAM_G * p
  const rl = rhoL(p)
  const rg = rhoG(p)
  const rhoM = psi * rl + (1 - psi) * rg
  const compl = psi / bl + (1 - psi) / bg
  return {
    mix: Math.sqrt(1 / (rhoM * compl)),
    liq: Math.sqrt(bl / rl),
    gas: Math.sqrt(bg / rg),
    rhoM,
  }
}

export function WoodSpeedDipTrack() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [psi, setPsi] = useState(0.5)
  const [barP, setBarP] = useState(1)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ mix: 23.65, liq: 1625, gas: 341.6, rhoM: 500.6, t: 0 })
  const tRef = useRef(0)

  useEffect(() => {
    tRef.current = 0
  }, [psi, barP])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let prev = performance.now()

    const draw = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const p = barP * P0
      const s = speeds(psi, p)
      if (running) {
        tRef.current += dt * 0.04 // 1 s of animation ≈ 40 ms of physical time
        if (tRef.current * s.mix > SLAB * 1.05) tRef.current = 0
      }
      const t = tRef.current

      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'

      // ---- a_mix(ψ) curve, log y ---------------------------------------
      const px = 48
      const py = 24
      const pw = W - px - 18
      const ph = 168
      ctx.strokeStyle = '#334155'
      ctx.strokeRect(px, py, pw, ph)
      const loDec = 1 // 10 m/s
      const hiDec = 3.4 // ~2500 m/s
      const X = (v: number) => px + pw * v
      const Y = (a: number) => {
        const l = Math.log10(Math.max(1e-3, a))
        return py + ph - (ph * (l - loDec)) / (hiDec - loDec)
      }
      for (let d = 1; d <= 3; d++) {
        const yy = Y(Math.pow(10, d))
        ctx.strokeStyle = '#1e293b'
        ctx.beginPath()
        ctx.moveTo(px, yy)
        ctx.lineTo(px + pw, yy)
        ctx.stroke()
        ctx.fillStyle = '#64748b'
        ctx.fillText(`1e${d}`, 14, yy + 4)
      }
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 300; i++) {
        const q = i / 300
        const a = speeds(q, p).mix
        const yy = Math.min(py + ph, Math.max(py, Y(a)))
        if (i === 0) ctx.moveTo(X(q), yy)
        else ctx.lineTo(X(q), yy)
      }
      ctx.stroke()
      ctx.lineWidth = 1
      // pure-phase reference lines
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = '#1d4ed8'
      ctx.beginPath()
      ctx.moveTo(px, Y(s.liq))
      ctx.lineTo(px + pw, Y(s.liq))
      ctx.stroke()
      ctx.strokeStyle = '#94a3b8'
      ctx.beginPath()
      ctx.moveTo(px, Y(s.gas))
      ctx.lineTo(px + pw, Y(s.gas))
      ctx.stroke()
      ctx.setLineDash([])
      // marker
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(X(psi), Y(s.mix), 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.beginPath()
      ctx.moveTo(X(psi), py)
      ctx.lineTo(X(psi), py + ph)
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.fillText('a  [m/s]  (log)', 10, py - 8)
      ctx.fillText('ψ  liquid volume fraction', px + pw - 150, py + ph + 15)
      for (let g = 0; g <= 5; g++) {
        ctx.fillStyle = '#64748b'
        ctx.fillText((g / 5).toFixed(1), X(g / 5) - 8, py + ph + 15)
      }
      ctx.fillStyle = '#1d4ed8'
      ctx.fillText(`a_liquid ${s.liq.toFixed(0)}`, px + 6, Y(s.liq) - 5)
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(`a_gas ${s.gas.toFixed(0)}`, px + 6, Y(s.gas) - 5)
      ctx.fillStyle = '#f59e0b'
      ctx.fillText(`a_mix ${s.mix.toFixed(2)}`, X(psi) + 7, Y(s.mix) - 7)

      // ---- pulse race over a 2 m slab ----------------------------------
      const ty = py + ph + 36
      const trackH = 16
      const lanes: { a: number; c: string; name: string }[] = [
        { a: s.liq, c: '#1d4ed8', name: 'pure liquid' },
        { a: s.gas, c: '#94a3b8', name: 'pure gas' },
        { a: s.mix, c: '#f59e0b', name: 'mixture' },
      ]
      lanes.forEach((ln, i) => {
        const yy = ty + i * (trackH + 10)
        ctx.strokeStyle = '#334155'
        ctx.strokeRect(px, yy, pw, trackH)
        const frac = Math.min(1, (ln.a * t) / SLAB)
        ctx.fillStyle = ln.c
        ctx.fillRect(px, yy, pw * frac, trackH)
        ctx.fillStyle = '#e2e8f0'
        ctx.textAlign = 'left'
        ctx.fillText(`${ln.name}  ${(ln.a * t).toFixed(2)} m`, px + pw * frac + 6, yy + 12)
        ctx.fillStyle = '#64748b'
        ctx.fillText(ln.name.slice(0, 1).toUpperCase(), px - 14, yy + 12)
      })
      ctx.fillStyle = '#64748b'
      ctx.fillText(`acoustic pulse over a ${SLAB.toFixed(1)} m slab   t = ${(t * 1000).toFixed(1)} ms`, px, ty - 8)

      frame++
      if (frame % 12 === 0) setReadout({ ...s, t })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [psi, barP, running])

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <canvas
        ref={canvasRef}
        width={700}
        height={310}
        style={{ width: '100%', maxWidth: 700, borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, fontSize: 12 }}>
        <label>
          ψ (liquid volume fraction) = {psi.toFixed(3)}
          <input type="range" min={0} max={1} step={0.005} value={psi} onChange={(e) => setPsi(+e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          pressure = {barP.toFixed(0)} bar
          <input type="range" min={1} max={50} step={1} value={barP} onChange={(e) => setBarP(+e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setRunning((v) => !v)}
          style={{ padding: '4px 9px', fontSize: 12, borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          {running ? 'pause' : 'play'}
        </button>
        <button
          onClick={() => setPsi(0.5)}
          style={{ padding: '4px 9px', fontSize: 12, borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          ψ = 0.5
        </button>
      </div>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.7 }}>
        a_mix = {readout.mix.toFixed(2)} m/s &nbsp;|&nbsp; ρ_mix = {readout.rhoM.toFixed(2)} kg/m³ &nbsp;|&nbsp; a_mix / a_gas = {(readout.mix / readout.gas).toFixed(3)}
        <br />
        crossing {SLAB.toFixed(1)} m: liquid {((SLAB / readout.liq) * 1e3).toFixed(2)} ms &nbsp;|&nbsp; gas {((SLAB / readout.gas) * 1e3).toFixed(2)} ms &nbsp;|&nbsp; mixture {((SLAB / readout.mix) * 1e3).toFixed(2)} ms
      </div>
    </div>
  )
}
