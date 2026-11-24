'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const H = 340
const NP = 140

type Particle = { x: number; y: number }

function profile(y: number, P: number) {
  return y + P * y * (1 - y)
}

export function CouettePoiseuilleSplitLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [P, setP] = useState(-2)
  const [playing, setPlaying] = useState(true)
  const [showParts, setShowParts] = useState(true)
  const pRef = useRef(P)
  const playRef = useRef(playing)
  const partsRef = useRef(showParts)
  const particles = useRef<Particle[]>([])
  const phase = useRef(0)

  pRef.current = P
  playRef.current = playing
  partsRef.current = showParts

  const seed = () => {
    const arr: Particle[] = []
    for (let i = 0; i < NP; i++) arr.push({ x: Math.random(), y: 0.02 + 0.96 * Math.random() })
    particles.current = arr
  }

  useEffect(() => {
    seed()
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    const top = 40
    const bot = H - 40
    const chL = 20
    const chR = 360
    const pfL = 400
    const pfR = W - 20
    const yPix = (y: number) => bot - y * (bot - top)

    const draw = () => {
      const Pv = pRef.current
      if (playRef.current) {
        phase.current = (phase.current + 0.004) % 1
        for (const p of particles.current) {
          p.x += 0.004 * profile(p.y, Pv)
          if (p.x > 1) p.x -= 1
          if (p.x < 0) p.x += 1
        }
      }
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      // channel
      ctx.fillStyle = '#334155'
      ctx.fillRect(chL, bot, chR - chL, 10)
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(chL, top - 10, chR - chL, 10)
      ctx.strokeStyle = '#0f172a'
      for (let k = 0; k < 14; k++) {
        const x = chL + (((k / 14 + phase.current) % 1) * (chR - chL))
        ctx.beginPath()
        ctx.moveTo(x, top - 10)
        ctx.lineTo(x + 6, top)
        ctx.stroke()
      }
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px sans-serif'
      ctx.fillText('moving plate  U →', chL + 4, top - 14)
      ctx.fillText('fixed wall', chL + 4, bot + 24)

      // reversal zone shading
      const yr = Pv < -1 ? 1 + 1 / Pv : 0
      if (yr > 0) {
        ctx.fillStyle = 'rgba(239,68,68,0.15)'
        ctx.fillRect(chL, yPix(yr), chR - chL, bot - yPix(yr))
        ctx.fillStyle = '#fca5a5'
        ctx.fillText(`backflow  y/h < ${yr.toFixed(3)}`, chL + 200, bot - 6)
      }

      if (partsRef.current) {
        for (const p of particles.current) {
          const u = profile(p.y, Pv)
          ctx.fillStyle = u < 0 ? '#ef4444' : '#38bdf8'
          ctx.beginPath()
          ctx.arc(chL + p.x * (chR - chL), yPix(p.y), 2.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // profile panel
      let umin = -1.5
      let umax = 2.0
      for (let i = 0; i <= 50; i++) {
        const u = profile(i / 50, Pv)
        umin = Math.min(umin, u)
        umax = Math.max(umax, u)
      }
      const uPix = (u: number) => pfL + ((u - umin) / (umax - umin)) * (pfR - pfL)
      ctx.strokeStyle = '#475569'
      ctx.beginPath()
      ctx.moveTo(uPix(0), top)
      ctx.lineTo(uPix(0), bot)
      ctx.moveTo(pfL, bot)
      ctx.lineTo(pfR, bot)
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('u/U', pfR - 26, bot + 16)
      ctx.fillText('y/h', uPix(0) + 4, top + 10)
      ctx.fillText(umin.toFixed(1), pfL, bot + 16)

      const line = (f: (y: number) => number, color: string, dash: number[]) => {
        ctx.strokeStyle = color
        ctx.setLineDash(dash)
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 60; i++) {
          const y = i / 60
          const X = uPix(f(y))
          if (i === 0) ctx.moveTo(X, yPix(y))
          else ctx.lineTo(X, yPix(y))
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
      }
      line((y) => y, '#a3e635', [6, 4])
      line((y) => Pv * y * (1 - y), '#c084fc', [2, 4])
      line((y) => profile(y, Pv), '#f8fafc', [])

      // arrows
      for (let i = 1; i < 12; i++) {
        const y = i / 12
        const u = profile(y, Pv)
        ctx.strokeStyle = u < 0 ? '#ef4444' : '#38bdf8'
        ctx.beginPath()
        ctx.moveTo(uPix(0), yPix(y))
        ctx.lineTo(uPix(u), yPix(y))
        ctx.stroke()
      }

      // wall shear marker
      const tau = 1 + Pv
      ctx.fillStyle = Math.abs(tau) < 0.05 ? '#facc15' : tau < 0 ? '#ef4444' : '#38bdf8'
      ctx.fillText(`τ_wall,bottom ∝ 1+P = ${tau.toFixed(2)}`, pfL, H - 8)

      ctx.fillStyle = '#a3e635'
      ctx.fillText('--- Couette y', pfL, 18)
      ctx.fillStyle = '#c084fc'
      ctx.fillText('··· P·y(1−y)', pfL + 90, 18)
      ctx.fillStyle = '#f8fafc'
      ctx.fillText('— sum', pfL + 180, 18)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const tau = 1 + P
  const Q = 0.5 + P / 6
  const regime = P > -1 ? 'attached (no backflow)' : P === -1 ? 'incipient separation' : 'backflow near fixed wall'

  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 10, fontSize: 14 }}>
        <label style={{ flex: '1 1 260px' }}>
          Pressure parameter P = −(h²/2μU)·dp/dx: <b>{P.toFixed(2)}</b>
          <input type="range" min={-5} max={3} step={0.25} value={P} onChange={(e) => setP(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <button onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => { seed(); setP(-2) }}>Reset</button>
        <label><input type="checkbox" checked={showParts} onChange={(e) => setShowParts(e.target.checked)} /> particles</label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, marginTop: 8, fontSize: 13, fontFamily: 'monospace' }}>
        <div>τ_bottom: {tau.toFixed(2)}</div>
        <div>τ_top: {(1 - P).toFixed(2)}</div>
        <div>Q/(Uh): {Q.toFixed(3)}</div>
        <div style={{ color: P < -1 ? '#fca5a5' : P === -1 ? '#facc15' : '#7dd3fc' }}>{regime}</div>
      </div>
    </div>
  )
}
