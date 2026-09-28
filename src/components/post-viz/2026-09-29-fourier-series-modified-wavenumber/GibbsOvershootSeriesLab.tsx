'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 360
const PAD = { l: 54, r: 16, t: 20, b: 34 }

function partialSum(x: number, n: number, fejer: boolean) {
  let s = 0.5
  for (let m = 1; m <= n; m++) {
    const sm = Math.sin((m * Math.PI) / 2)
    if (sm === 0) continue
    const w = fejer ? 1 - m / (n + 1) : 1
    s += w * ((2 / (Math.PI * m)) * sm * Math.cos(2 * Math.PI * m * (x - 0.5)))
  }
  return s
}

export function GibbsOvershootSeriesLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nTerms, setNTerms] = useState(41)
  const [fejer, setFejer] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [readout, setReadout] = useState({ n: 41, over: 0, peak: 0 })

  const nRef = useRef(41)
  const playRef = useRef(false)
  const zoomRef = useRef(false)
  const fejerRef = useRef(false)
  useEffect(() => { nRef.current = nTerms }, [nTerms])
  useEffect(() => { playRef.current = playing }, [playing])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { fejerRef.current = fejer }, [fejer])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const draw = () => {
      const n = Math.max(1, Math.round(nRef.current))
      const fj = fejerRef.current
      const zm = zoomRef.current
      const x0 = zm ? 0.2 : 0.0
      const x1 = zm ? 0.4 : 1.0
      const yLo = -0.2
      const yHi = 1.25
      const pw = W - PAD.l - PAD.r
      const ph = H - PAD.t - PAD.b
      const px = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * pw
      const py = (y: number) => PAD.t + (1 - (y - yLo) / (yHi - yLo)) * ph

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = '#2a3340'
      ctx.lineWidth = 1
      ctx.fillStyle = '#7d8896'
      ctx.font = '11px ui-monospace, monospace'
      for (let i = 0; i <= 5; i++) {
        const yv = yLo + ((yHi - yLo) * i) / 5
        const y = py(yv)
        ctx.beginPath()
        ctx.moveTo(PAD.l, y)
        ctx.lineTo(W - PAD.r, y)
        ctx.stroke()
        ctx.fillText(yv.toFixed(2), 10, y + 4)
      }
      for (let i = 0; i <= 5; i++) {
        const xv = x0 + ((x1 - x0) * i) / 5
        const x = px(xv)
        ctx.beginPath()
        ctx.moveTo(x, PAD.t)
        ctx.lineTo(x, H - PAD.b)
        ctx.stroke()
        ctx.fillText(xv.toFixed(2), x - 12, H - PAD.b + 16)
      }
      ctx.fillStyle = '#9aa5b1'
      ctx.fillText('x', W - PAD.r - 8, H - PAD.b + 16)
      ctx.fillText('f(x)', 12, PAD.t - 6)

      // overshoot band at 1 + 8.9490%
      ctx.strokeStyle = '#bb5a3c'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(PAD.l, py(1.089490))
      ctx.lineTo(W - PAD.r, py(1.089490))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#bb5a3c'
      ctx.fillText('1 + 8.9490%  (Wilbraham-Gibbs limit)', PAD.l + 8, py(1.08949) - 6)

      // exact square wave
      ctx.strokeStyle = '#5c6b7a'
      ctx.lineWidth = 2
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= 600; i++) {
        const x = x0 + ((x1 - x0) * i) / 600
        const y = x >= 0.25 && x < 0.75 ? 1 : 0
        const sx = px(x)
        const sy = py(y)
        if (!started) { ctx.moveTo(sx, sy); started = true } else ctx.lineTo(sx, sy)
      }
      ctx.stroke()

      // partial sum
      const steps = 900
      let over = -Infinity
      let peakX = 0
      ctx.strokeStyle = fj ? '#4fa3c7' : '#e0a33e'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const x = x0 + ((x1 - x0) * i) / steps
        const v = partialSum(x, n, fj)
        if (x > 0.25 && x < 0.5 && v > over) { over = v; peakX = x }
        const sx = px(x)
        const sy = py(Math.max(yLo, Math.min(yHi, v)))
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.stroke()

      ctx.fillStyle = '#e0a33e'
      ctx.fillText(`partial sum, N = ${n}${fj ? '  (Fejer averaged)' : ''}`, PAD.l + 8, PAD.t + 14)
      ctx.fillStyle = '#5c6b7a'
      ctx.fillText('target square wave', PAD.l + 8, PAD.t + 30)

      // peak marker
      const mx = px(peakX)
      const my = py(over)
      if (mx > PAD.l && mx < W - PAD.r) {
        ctx.fillStyle = '#e05c5c'
        ctx.beginPath()
        ctx.arc(mx, my, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      if (playRef.current) {
        nRef.current = nRef.current >= 199 ? 1 : nRef.current + 1
        if (frame % 4 === 0) setNTerms(Math.round(nRef.current))
      }
      if (frame % 10 === 0) {
        setReadout({ n, over: (over - 1) * 100, peak: peakX })
      }
      frame++
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#11161d', borderRadius: 10, border: '1px solid #232b35' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginTop: '0.9rem', color: '#c6ced8', fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 92 }}>terms N = {nTerms}</span>
          <input type="range" min={1} max={199} step={1} value={nTerms}
            onChange={(e) => { setPlaying(false); setNTerms(Number(e.target.value)) }} style={{ width: 200 }} />
        </label>
        <button onClick={() => setPlaying((p) => !p)}
          style={{ padding: '4px 12px', background: playing ? '#3a4a5a' : '#25303c', color: '#dbe3ec', border: '1px solid #35424f', borderRadius: 5, cursor: 'pointer' }}>
          {playing ? 'Pause' : 'Play N sweep'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={fejer} onChange={(e) => setFejer(e.target.checked)} />
          Fejer average
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={zoom} onChange={(e) => setZoom(e.target.checked)} />
          zoom near jump
        </label>
      </div>
      <div style={{ marginTop: '0.6rem', color: '#8f9aa7', fontSize: 12.5, fontFamily: 'ui-monospace, monospace' }}>
        max overshoot = <span style={{ color: '#e05c5c' }}>{readout.over.toFixed(3)}%</span>
        {'  '}· peak at x = {readout.peak.toFixed(4)} (jump at x = 0.25)
        {'  '}· distance to jump = {(readout.peak - 0.25).toFixed(4)}
      </div>
    </div>
  )
}
