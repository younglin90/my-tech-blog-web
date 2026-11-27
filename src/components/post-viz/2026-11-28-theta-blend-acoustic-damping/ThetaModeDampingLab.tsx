'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const H = 400

// theta-scheme + central flux for u_t + u_x = 0, Fourier mode kappa = k*dx
function amp(theta: number, nu: number, kappa: number) {
  const s = nu * Math.sin(kappa)
  const re = 1 + (1 - theta) * (1 - theta) * s * s
  const im = 1 + theta * theta * s * s
  const mag = Math.sqrt(re / im)
  const phase = -Math.atan((1 - theta) * s) - Math.atan(theta * s)
  return { mag, phase }
}

export function ThetaModeDampingLab() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(1)
  const [nu, setNu] = useState(0.5)
  const [ppw, setPpw] = useState(80)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ n: 0, ampNow: 1, lapAmp: 1, g: 1 })
  const nRef = useRef(0)
  const accRef = useRef(0)

  const kappa = (2 * Math.PI) / ppw
  const N = 200
  const lapSteps = Math.round(N / nu)

  function reset() { nRef.current = 0; accRef.current = 0 }
  useEffect(reset, [theta, nu, ppw])

  useEffect(() => {
    let raf = 0, frame = 0
    const loop = () => {
      if (playing) {
        accRef.current += 0.35
        while (accRef.current >= 1) { nRef.current++; accRef.current -= 1 }
        if (nRef.current > lapSteps) nRef.current = 0
      }
      draw()
      if (++frame % 12 === 0) {
        const g = amp(theta, nu, kappa).mag
        setRead({ n: nRef.current, ampNow: Math.pow(g, nRef.current), lapAmp: Math.pow(g, lapSteps), g })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, theta, nu, ppw]) // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H)
    ctx.font = '12px monospace'
    const n = nRef.current
    const { mag, phase } = amp(theta, nu, kappa)
    // top: wave in the box, 3 wavelengths shown
    const gx = 60, gy = 24, gw = 560, gh = 150
    ctx.strokeStyle = '#475569'; ctx.strokeRect(gx, gy, gw, gh)
    ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke()
    const cells = 3 * ppw
    const A = Math.pow(mag, n)
    const draws: [string, number, number, boolean][] = [
      ['#94a3b8', 1, -nu * kappa * n, true],
      [theta < 0.75 ? '#60a5fa' : '#f87171', A, phase * n, false],
    ]
    for (const [col, a, ph, dash] of draws) {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash ? [6, 5] : [])
      ctx.beginPath()
      for (let p = 0; p <= 400; p++) {
        const j = (p / 400) * cells
        const X = gx + (p / 400) * gw
        const Y = gy + gh / 2 - a * Math.cos(kappa * j + ph) * (gh / 2 - 8)
        p ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
      }
      ctx.stroke()
    }
    ctx.setLineDash([]); ctx.lineWidth = 1
    // envelope
    ctx.strokeStyle = '#fbbf24'
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2 - A * (gh / 2 - 8)); ctx.lineTo(gx + gw, gy + gh / 2 - A * (gh / 2 - 8)); ctx.stroke()
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`step ${n} / ${lapSteps} (one lap of a 200-cell box)`, gx + 4, gy + 14)
    ctx.fillText('dashed: exact  |  solid: theta-scheme  |  yellow: |G|^n', gx + 4, gy + gh - 6)
    // bottom: |G| vs kappa
    const bx = 60, by = 210, bw = 560, bh = 160
    ctx.strokeStyle = '#475569'; ctx.strokeRect(bx, by, bw, bh)
    const yMin = 0.4
    const py = (g: number) => by + bh - ((g - yMin) / (1 - yMin)) * bh
    for (const g of [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) {
      ctx.fillStyle = '#64748b'; ctx.fillText(g.toFixed(1), bx - 30, py(g) + 4)
      ctx.strokeStyle = '#1e293b'; ctx.beginPath(); ctx.moveTo(bx, py(g)); ctx.lineTo(bx + bw, py(g)); ctx.stroke()
    }
    const curves: [number, string][] = [[1, '#f87171'], [0.5, '#60a5fa'], [theta, '#fbbf24']]
    for (const [th, col] of curves) {
      ctx.strokeStyle = col; ctx.lineWidth = th === theta ? 2.5 : 1.5; ctx.beginPath()
      for (let p = 0; p <= 200; p++) {
        const k = (p / 200) * Math.PI
        const Y = py(Math.max(yMin, amp(th, nu, k).mag))
        const X = bx + (p / 200) * bw
        p ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
      }
      ctx.stroke()
    }
    ctx.lineWidth = 1
    const mx = bx + (kappa / Math.PI) * bw
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(mx, py(Math.max(yMin, mag)), 5, 0, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('|G| per step', bx, by - 6)
    ctx.fillText('k dx: 0', bx, by + bh + 16)
    ctx.fillText('pi', bx + bw - 14, by + bh + 16)
    ctx.fillStyle = '#f87171'; ctx.fillText('BE (theta=1)', bx + 150, by - 6)
    ctx.fillStyle = '#60a5fa'; ctx.fillText('CN (theta=1/2)', bx + 270, by - 6)
    ctx.fillStyle = '#fbbf24'; ctx.fillText(`current theta=${theta.toFixed(2)}`, bx + 400, by - 6)
  }

  const btn = { padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }
  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>theta: <b>{theta.toFixed(2)}</b>
          <input type="range" min={0.5} max={1} step={0.01} value={theta} onChange={(e) => setTheta(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>CFL nu = c dt/dx: <b>{nu.toFixed(2)}</b>
          <input type="range" min={0.1} max={4} step={0.05} value={nu} onChange={(e) => setNu(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Cells per wavelength: <b>{ppw}</b>
          <input type="range" min={4} max={120} step={1} value={ppw} onChange={(e) => setPpw(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { nRef.current = Math.min(lapSteps, nRef.current + 1); draw() }}>Step</button>
        <button style={btn} onClick={() => { reset(); draw() }}>Reset</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        |G| = {read.g.toFixed(5)} per step | amplitude now = {read.ampNow.toFixed(4)} | after one lap ({lapSteps} steps) = <b style={{ color: read.lapAmp < 0.9 ? '#f87171' : '#4ade80' }}>{read.lapAmp.toFixed(4)}</b>
      </div>
    </div>
  )
}
