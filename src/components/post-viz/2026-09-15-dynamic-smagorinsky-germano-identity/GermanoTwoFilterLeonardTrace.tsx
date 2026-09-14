'use client'

import { useEffect, useRef, useState } from 'react'

const NX = 480
const DX = (2 * Math.PI) / NX
const DELTA = 0.45 // grid filter width, in x units

type Modes = { k: number; a: number; ph: number; w: number }[]

function buildModes(kmax: number): Modes {
  const m: Modes = []
  let seed = 1337
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let k = 1; k <= kmax; k++) {
    m.push({ k, a: Math.pow(k, -5 / 6), ph: rnd() * 2 * Math.PI, w: 0.25 * Math.sqrt(k) })
  }
  return m
}

function sample(modes: Modes, t: number): Float64Array {
  const u = new Float64Array(NX)
  for (const m of modes) {
    const amp = m.a
    for (let i = 0; i < NX; i++) u[i] += amp * Math.cos(m.k * i * DX - m.w * t + m.ph)
  }
  let s = 0
  for (let i = 0; i < NX; i++) s += u[i] * u[i]
  const rms = Math.sqrt(s / NX) || 1
  for (let i = 0; i < NX; i++) u[i] /= rms
  return u
}

function boxFilter(f: Float64Array, width: number): Float64Array {
  const w = Math.max(1, 2 * Math.round(width / DX / 2) + 1)
  const r = (w - 1) / 2
  const out = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    let s = 0
    for (let o = -r; o <= r; o++) s += f[(i + o + NX * 4) % NX]
    out[i] = s / w
  }
  return out
}

export function GermanoTwoFilterLeonardTrace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [alpha, setAlpha] = useState(1.94)
  const [kmax, setKmax] = useState(14)
  const [playing, setPlaying] = useState(true)
  const [readout, setReadout] = useState({ meanL: 0, maxL: 0, resolved: 0 })

  const stateRef = useRef({ alpha, kmax, playing })
  stateRef.current = { alpha, kmax, playing }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let t = 0
    let last = performance.now()
    let modes = buildModes(stateRef.current.kmax)
    let cachedK = stateRef.current.kmax

    const W = 620
    const TOP_Y = 34
    const TOP_H = 150
    const BOT_Y = 232
    const BOT_H = 110

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const st = stateRef.current
      if (st.playing) t += dt
      if (st.kmax !== cachedK) {
        modes = buildModes(st.kmax)
        cachedK = st.kmax
      }

      const u = sample(modes, t)
      const dTest = DELTA * Math.sqrt(Math.max(0.04, st.alpha * st.alpha - 1))
      const ub = boxFilter(u, DELTA)
      const ut = boxFilter(ub, dTest)
      const uu = new Float64Array(NX)
      for (let i = 0; i < NX; i++) uu[i] = ub[i] * ub[i]
      const uuT = boxFilter(uu, dTest)
      const L = new Float64Array(NX)
      for (let i = 0; i < NX; i++) L[i] = uuT[i] - ut[i] * ut[i]

      ctx.clearRect(0, 0, W, 380)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, 380)

      const xOf = (i: number) => 46 + (i / (NX - 1)) * (W - 70)
      const plot = (f: Float64Array, y0: number, h: number, scale: number, color: string, lw: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.beginPath()
        for (let i = 0; i < NX; i++) {
          const y = y0 + h / 2 - (f[i] / scale) * (h / 2)
          if (i === 0) ctx.moveTo(xOf(i), y)
          else ctx.lineTo(xOf(i), y)
        }
        ctx.stroke()
      }

      // top panel frame
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.strokeRect(46, TOP_Y, W - 70, TOP_H)
      ctx.strokeRect(46, BOT_Y, W - 70, BOT_H)
      ctx.strokeStyle = '#21262d'
      ctx.beginPath()
      ctx.moveTo(46, TOP_Y + TOP_H / 2)
      ctx.lineTo(W - 24, TOP_Y + TOP_H / 2)
      ctx.moveTo(46, BOT_Y + BOT_H / 2)
      ctx.lineTo(W - 24, BOT_Y + BOT_H / 2)
      ctx.stroke()

      plot(u, TOP_Y, TOP_H, 3.2, '#484f58', 1)
      plot(ub, TOP_Y, TOP_H, 3.2, '#58a6ff', 2)
      plot(ut, TOP_Y, TOP_H, 3.2, '#f0883e', 2)

      // Leonard trace, filled
      let lmax = 1e-9
      for (let i = 0; i < NX; i++) lmax = Math.max(lmax, Math.abs(L[i]))
      const lscale = Math.max(0.05, lmax * 1.15)
      ctx.beginPath()
      ctx.moveTo(xOf(0), BOT_Y + BOT_H / 2)
      for (let i = 0; i < NX; i++) {
        ctx.lineTo(xOf(i), BOT_Y + BOT_H / 2 - (L[i] / lscale) * (BOT_H / 2))
      }
      ctx.lineTo(xOf(NX - 1), BOT_Y + BOT_H / 2)
      ctx.closePath()
      ctx.fillStyle = 'rgba(63, 185, 80, 0.35)'
      ctx.fill()
      plot(L, BOT_Y, BOT_H, lscale, '#3fb950', 1.6)

      // filter width bars
      const barY = TOP_Y + TOP_H + 14
      const px = (len: number) => (len / (2 * Math.PI)) * (W - 70)
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(46, barY)
      ctx.lineTo(46 + px(DELTA), barY)
      ctx.stroke()
      ctx.strokeStyle = '#f0883e'
      ctx.beginPath()
      ctx.moveTo(46, barY + 10)
      ctx.lineTo(46 + px(DELTA * st.alpha), barY + 10)
      ctx.stroke()

      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = '#8b949e'
      ctx.fillText('u (unfiltered)', 52, TOP_Y - 10)
      ctx.fillStyle = '#58a6ff'
      ctx.fillText('grid filter  ū   Δ = ' + DELTA.toFixed(2), 160, TOP_Y - 10)
      ctx.fillStyle = '#f0883e'
      ctx.fillText(
        'test level  û   Δ̂ = ' + (DELTA * st.alpha).toFixed(2),
        330,
        TOP_Y - 10,
      )
      ctx.fillStyle = '#3fb950'
      ctx.fillText('L(x) = test(ū ū) − û û   (resolved stress)', 52, BOT_Y - 10)
      ctx.fillStyle = '#6e7681'
      ctx.fillText('Δ', 46 + px(DELTA) + 6, barY + 4)
      ctx.fillText('Δ̂', 46 + px(DELTA * st.alpha) + 6, barY + 14)
      ctx.fillText('x →  0', 46, 366)
      ctx.fillText('2π', W - 40, 366)
      ctx.save()
      ctx.translate(16, TOP_Y + TOP_H / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('velocity', -26, 0)
      ctx.restore()
      ctx.save()
      ctx.translate(16, BOT_Y + BOT_H / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('L', -4, 0)
      ctx.restore()

      frame++
      if (frame % 12 === 0) {
        let sL = 0
        let uv = 0
        let bv = 0
        for (let i = 0; i < NX; i++) {
          sL += L[i]
          uv += u[i] * u[i]
          bv += ub[i] * ub[i]
        }
        setReadout({
          meanL: sL / NX,
          maxL: lmax,
          resolved: (100 * bv) / (uv || 1),
        })
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={620}
        height={380}
        style={{ width: '100%', borderRadius: 8, background: '#0d1117', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190 }}>
          <span>
            filter ratio α = Δ̂/Δ : <b>{alpha.toFixed(2)}</b>
          </span>
          <input
            type="range"
            min={1.2}
            max={4}
            step={0.02}
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190 }}>
          <span>
            highest wavenumber : <b>{kmax}</b>
          </span>
          <input
            type="range"
            min={4}
            max={28}
            step={1}
            value={kmax}
            onChange={(e) => setKmax(parseInt(e.target.value, 10))}
          />
        </label>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: '0.35rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: playing ? '#21262d' : '#238636',
            color: '#c9d1d9',
            cursor: 'pointer',
          }}
        >
          {playing ? 'pause' : 'play'}
        </button>
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          fontSize: 12.5,
          fontFamily: 'ui-monospace, monospace',
          color: '#8b949e',
        }}
      >
        mean L = {readout.meanL.toFixed(4)} &nbsp;|&nbsp; max |L| = {readout.maxL.toFixed(4)}{' '}
        &nbsp;|&nbsp; energy kept by grid filter = {readout.resolved.toFixed(1)} %
      </div>
    </div>
  )
}
