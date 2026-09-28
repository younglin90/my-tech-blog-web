'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 380

const STENCILS: Record<number, number[]> = {
  2: [1, -2, 1],
  4: [-1 / 12, 4 / 3, -5 / 2, 4 / 3, -1 / 12],
  6: [1 / 90, -3 / 20, 3 / 2, -49 / 18, 3 / 2, -3 / 20, 1 / 90],
}

/** central difference symbol: modified (k dx)^2 for a given theta = k dx */
function modifiedK2(order: number, theta: number) {
  const c = STENCILS[order]
  const h = (c.length - 1) / 2
  let sym = 0
  for (let j = -h; j <= h; j++) sym += c[h + j] * Math.cos(j * theta)
  return -sym
}

export function NyquistDecayLagDial() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [order, setOrder] = useState(2)
  const [thetaFrac, setThetaFrac] = useState(1.0)
  const [running, setRunning] = useState(true)
  const [tau, setTau] = useState(0)

  const orderRef = useRef(2)
  const thetaRef = useRef(1.0)
  const runRef = useRef(true)
  const tauRef = useRef(0)
  useEffect(() => { orderRef.current = order }, [order])
  useEffect(() => { thetaRef.current = thetaFrac }, [thetaFrac])
  useEffect(() => { runRef.current = running }, [running])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const draw = () => {
      const ord = orderRef.current
      const th = thetaRef.current * Math.PI
      const exact = th * th
      const grid = modifiedK2(ord, th)

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'

      // ---------- left: symbol curves ----------
      const L = { x: 48, y: 22, w: 320, h: H - 70 }
      const sx = (t: number) => L.x + (t / Math.PI) * L.w
      const sy = (v: number) => L.y + L.h - (v / 10.2) * L.h

      ctx.strokeStyle = '#2a3340'
      ctx.lineWidth = 1
      ctx.fillStyle = '#7d8896'
      for (let i = 0; i <= 5; i++) {
        const v = (10.2 * i) / 5
        ctx.beginPath()
        ctx.moveTo(L.x, sy(v))
        ctx.lineTo(L.x + L.w, sy(v))
        ctx.stroke()
        ctx.fillText(v.toFixed(1), 12, sy(v) + 4)
      }
      for (let i = 0; i <= 4; i++) {
        const t = (Math.PI * i) / 4
        ctx.beginPath()
        ctx.moveTo(sx(t), L.y)
        ctx.lineTo(sx(t), L.y + L.h)
        ctx.stroke()
        ctx.fillText((i / 4).toFixed(2), sx(t) - 11, L.y + L.h + 15)
      }
      ctx.fillStyle = '#9aa5b1'
      ctx.fillText('theta / pi   (theta = k dx)', L.x + 90, L.y + L.h + 31)
      ctx.save()
      ctx.translate(14, L.y + L.h / 2 + 40)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('(k dx)^2  effective', 0, 0)
      ctx.restore()

      // exact parabola
      ctx.strokeStyle = '#cbd5e0'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const t = (Math.PI * i) / 200
        const p = [sx(t), sy(t * t)] as const
        i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])
      }
      ctx.stroke()
      ctx.setLineDash([])

      const colors: Record<number, string> = { 2: '#e0a33e', 4: '#4fa3c7', 6: '#6fbf73' }
      for (const o of [2, 4, 6]) {
        ctx.strokeStyle = colors[o]
        ctx.lineWidth = o === ord ? 2.6 : 1
        ctx.globalAlpha = o === ord ? 1 : 0.38
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const t = (Math.PI * i) / 200
          const p = [sx(t), sy(modifiedK2(o, t))] as const
          i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      ctx.strokeStyle = '#e05c5c'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx(th), L.y)
      ctx.lineTo(sx(th), L.y + L.h)
      ctx.stroke()
      for (const [v, col] of [[exact, '#cbd5e0'], [grid, colors[ord]]] as const) {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(sx(th), sy(v), 4.5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#cbd5e0'
      ctx.fillText('exact  theta^2', L.x + 8, L.y + 12)
      ctx.fillStyle = colors[2]; ctx.fillText('2nd order', L.x + 8, L.y + 26)
      ctx.fillStyle = colors[4]; ctx.fillText('4th order', L.x + 8, L.y + 40)
      ctx.fillStyle = colors[6]; ctx.fillText('6th order', L.x + 8, L.y + 54)

      // ---------- right: decaying waves ----------
      const R = { x: 408, y: 22, w: W - 408 - 18, h: H - 70 }
      const midE = R.y + R.h * 0.27
      const midG = R.y + R.h * 0.74
      const amp = R.h * 0.2

      ctx.strokeStyle = '#2a3340'
      for (const m of [midE, midG]) {
        ctx.beginPath()
        ctx.moveTo(R.x, m)
        ctx.lineTo(R.x + R.w, m)
        ctx.stroke()
      }

      const t = tauRef.current
      const aE = Math.exp(-exact * t)
      const aG = Math.exp(-grid * t)

      const wave = (mid: number, a: number, col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 260; i++) {
          const u = i / 260
          const y = mid - a * amp * Math.sin(2 * Math.PI * 3 * u)
          const px = R.x + u * R.w
          i === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.strokeStyle = col
        ctx.globalAlpha = 0.3
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(R.x, mid - a * amp)
        ctx.lineTo(R.x + R.w, mid - a * amp)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }
      wave(midE, aE, '#cbd5e0')
      wave(midG, aG, colors[ord])

      ctx.fillStyle = '#cbd5e0'
      ctx.fillText(`exact PDE     amplitude ${aE.toFixed(4)}`, R.x + 4, R.y + 12)
      ctx.fillStyle = colors[ord]
      ctx.fillText(`grid stencil  amplitude ${aG.toFixed(4)}`, R.x + 4, midG - amp - 10)
      ctx.fillStyle = '#7d8896'
      ctx.fillText(`diffusion time  a*t/dx^2 = ${t.toFixed(3)}`, R.x + 4, R.y + R.h + 15)

      if (runRef.current) {
        tauRef.current += 0.0016
        if (tauRef.current > 1.4) tauRef.current = 0
      }
      if (frame % 12 === 0) setTau(tauRef.current)
      frame++
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const th = thetaFrac * Math.PI
  const ratio = modifiedK2(order, th) / (th * th)

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#11161d', borderRadius: 10, border: '1px solid #232b35' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginTop: '0.9rem', color: '#c6ced8', fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 118 }}>theta/pi = {thetaFrac.toFixed(2)}</span>
          <input type="range" min={0.05} max={1} step={0.01} value={thetaFrac}
            onChange={(e) => setThetaFrac(Number(e.target.value))} style={{ width: 190 }} />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[2, 4, 6].map((o) => (
            <button key={o} onClick={() => setOrder(o)}
              style={{ padding: '4px 10px', background: order === o ? '#3a4a5a' : '#25303c', color: '#dbe3ec', border: '1px solid #35424f', borderRadius: 5, cursor: 'pointer' }}>
              {o}nd/th order
            </button>
          ))}
        </div>
        <button onClick={() => setRunning((r) => !r)}
          style={{ padding: '4px 12px', background: running ? '#3a4a5a' : '#25303c', color: '#dbe3ec', border: '1px solid #35424f', borderRadius: 5, cursor: 'pointer' }}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={() => { tauRef.current = 0; setTau(0) }}
          style={{ padding: '4px 12px', background: '#25303c', color: '#dbe3ec', border: '1px solid #35424f', borderRadius: 5, cursor: 'pointer' }}>
          Reset time
        </button>
      </div>
      <div style={{ marginTop: '0.6rem', color: '#8f9aa7', fontSize: 12.5, fontFamily: 'ui-monospace, monospace' }}>
        k&apos;^2 / k^2 = <span style={{ color: '#e05c5c' }}>{ratio.toFixed(4)}</span>
        {'  '}· grid decays <span style={{ color: '#e05c5c' }}>{(1 / ratio).toFixed(3)}x</span> slower
        {'  '}· a*t/dx^2 = {tau.toFixed(3)}
      </div>
    </div>
  )
}
