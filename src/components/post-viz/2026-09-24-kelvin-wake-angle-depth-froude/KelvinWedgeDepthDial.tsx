'use client'

import { useEffect, useRef, useState } from 'react'

const G = 9.81

function cPhase(k: number, h: number) {
  return Math.sqrt((G / k) * Math.tanh(k * h))
}

function solveK(v: number, h: number): number | null {
  if (v <= 1e-9) return null
  if (v >= Math.sqrt(G * h)) return null
  let lo = 1e-7
  let hi = 1
  while (cPhase(hi, h) > v) {
    hi *= 2
    if (hi > 1e7) return null
  }
  for (let i = 0; i < 90; i++) {
    const mid = 0.5 * (lo + hi)
    if (cPhase(mid, h) > v) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

function groupVel(k: number, h: number) {
  const kh = k * h
  const f = kh > 20 ? 1 : 1 + (2 * kh) / Math.sinh(2 * kh)
  return 0.5 * cPhase(k, h) * f
}

type Ray = { theta: number; cg: number }

function buildRays(v: number, h: number): Ray[] {
  const out: Ray[] = []
  const n = 160
  for (let i = 1; i < n; i++) {
    const theta = (0.5 * Math.PI * i) / n
    const k = solveK(v * Math.cos(theta), h)
    if (k === null) continue
    out.push({ theta, cg: groupVel(k, h) })
  }
  return out
}

function wedgeDeg(rays: Ray[], v: number) {
  let best = 0
  for (const r of rays) {
    const den = v - r.cg * Math.cos(r.theta)
    const a = den <= 0 ? 0.5 * Math.PI : Math.atan2(r.cg * Math.sin(r.theta), den)
    if (a > best) best = a
  }
  return (best * 180) / Math.PI
}

export function KelvinWedgeDepthDial() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [speed, setSpeed] = useState(4.0)
  const [depth, setDepth] = useState(2.0)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ frh: 0, wedge: 0, lam: 0 })

  const stateRef = useRef({ speed: 4.0, depth: 2.0, running: true })
  stateRef.current = { speed, depth, running }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let phase = 0
    let frame = 0
    let cachedV = -1
    let cachedH = -1
    let rays: Ray[] = []

    const draw = () => {
      const { speed: v, depth: h, running: run } = stateRef.current
      if (v !== cachedV || h !== cachedH) {
        rays = buildRays(v, h)
        cachedV = v
        cachedH = h
      }
      if (run) phase = (phase + 0.006) % 1

      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#081420'
      ctx.fillRect(0, 0, W, H)

      const shipX = W - 70
      const shipY = H / 2
      const scale = 28 // px per (V * tau) unit of 1 s

      // wake crest rings: for each generation age tau, locus over theta
      const nRing = 14
      for (let r = 0; r < nRing; r++) {
        const tau = ((r + phase) / nRing) * 11
        if (tau <= 0.05) continue
        const fade = 1 - (r + phase) / nRing
        ctx.strokeStyle = `rgba(96, 200, 255, ${0.13 + 0.45 * fade})`
        ctx.lineWidth = 1.3
        ctx.beginPath()
        let started = false
        for (let i = rays.length - 1; i >= 0; i--) {
          const { theta, cg } = rays[i]
          const xb = (v - cg * Math.cos(theta)) * tau
          const yb = cg * Math.sin(theta) * tau
          const px = shipX - xb * scale
          const py = shipY - yb * scale
          if (px < -20) continue
          if (!started) {
            ctx.moveTo(px, py)
            started = true
          } else ctx.lineTo(px, py)
        }
        for (let i = 0; i < rays.length; i++) {
          const { theta, cg } = rays[i]
          const xb = (v - cg * Math.cos(theta)) * tau
          const yb = cg * Math.sin(theta) * tau
          const px = shipX - xb * scale
          const py = shipY + yb * scale
          if (px < -20) continue
          ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      const wd = wedgeDeg(rays, v)
      const frh = v / Math.sqrt(G * h)

      // wedge boundary
      const rad = (wd * Math.PI) / 180
      ctx.strokeStyle = frh > 0.98 && frh < 1.02 ? '#ff7b6b' : '#ffd166'
      ctx.lineWidth = 2
      ctx.setLineDash([7, 5])
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(shipX, shipY)
        ctx.lineTo(shipX - 900 * Math.cos(rad), shipY + s * 900 * Math.sin(rad))
        ctx.stroke()
      }
      ctx.setLineDash([])

      // centre track
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, shipY)
      ctx.lineTo(W, shipY)
      ctx.stroke()

      // ship
      ctx.fillStyle = '#f2f6fa'
      ctx.beginPath()
      ctx.moveTo(shipX + 14, shipY)
      ctx.lineTo(shipX - 12, shipY - 6)
      ctx.lineTo(shipX - 12, shipY + 6)
      ctx.closePath()
      ctx.fill()

      // angle arc label
      ctx.strokeStyle = '#ffd166'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(shipX, shipY, 58, Math.PI - rad, Math.PI + rad)
      ctx.stroke()
      ctx.fillStyle = '#ffd166'
      ctx.font = '13px ui-monospace, monospace'
      ctx.fillText(`${wd.toFixed(1)}°`, shipX - 108, shipY - 4)

      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('top view — ship moves right, wake trails left', 12, 18)
      ctx.fillText('crest rings are lines of equal wake age (0-11 s)', 12, H - 12)

      frame++
      if (frame % 12 === 0) {
        const k0 = solveK(v, h)
        setReadout({ frh, wedge: wd, lam: k0 ? (2 * Math.PI) / k0 : Infinity })
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const frh = readout.frh
  const regime = frh < 0.95 ? 'subcritical' : frh > 1.05 ? 'supercritical' : 'near critical'
  const regimeColor = frh < 0.95 ? '#60c8ff' : frh > 1.05 ? '#9ae66e' : '#ff7b6b'

  return (
    <div style={{ border: '1px solid #1e3245', borderRadius: 10, padding: 14, background: '#0b1622' }}>
      <canvas
        ref={canvasRef}
        width={720}
        height={380}
        style={{ width: '100%', height: 'auto', borderRadius: 6, display: 'block' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginTop: 14 }}>
        <label style={{ color: '#cfe3f2', fontSize: 13 }}>
          Ship speed V = {speed.toFixed(2)} m/s
          <input type="range" min={0.5} max={9} step={0.05} value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ color: '#cfe3f2', fontSize: 13 }}>
          Water depth h = {depth >= 400 ? 'deep' : depth.toFixed(2) + ' m'}
          <input type="range" min={0.5} max={500} step={0.05} value={depth}
            onChange={(e) => setDepth(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <button onClick={() => setRunning((r) => !r)}
          style={{ alignSelf: 'end', padding: '6px 12px', borderRadius: 6, border: '1px solid #2a4a66',
            background: running ? '#16304a' : '#24455f', color: '#cfe3f2', cursor: 'pointer', fontSize: 13 }}>
          {running ? 'Pause' : 'Play'}
        </button>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        <span style={{ color: regimeColor }}>Fr_h = {frh.toFixed(3)} ({regime})</span>
        <span style={{ color: '#ffd166' }}>half-angle = {readout.wedge.toFixed(2)}&deg;</span>
        <span style={{ color: '#cfe3f2' }}>
          transverse &lambda; = {Number.isFinite(readout.lam) ? readout.lam.toFixed(1) + ' m' : 'none (no transverse wave)'}
        </span>
      </div>
      <p style={{ color: '#8ba6bd', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
        Push V up with h fixed at &ldquo;deep&rdquo;: the yellow wedge never budges from 19.47&deg;.
        Now drag h down toward 2 m and raise V until Fr_h &rarr; 1: the wedge opens to 90&deg;,
        then closes again once Fr_h &gt; 1.
      </p>
    </div>
  )
}
