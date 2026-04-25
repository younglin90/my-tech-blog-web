'use client'

import { useEffect, useRef, useState } from 'react'

export function PoiseuilleProfile() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [dpdx, setDpdx] = useState(1)
  const [mu, setMu] = useState(1)
  const [Re, setRe] = useState(50)
  const tRef = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = performance.now()

    function draw(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      tRef.current += dt
      const W = c!.width, H = c!.height
      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = 'rgba(8,17,31,0.95)'
      ctx!.fillRect(0, 0, W, H)

      const PAD = { l: 60, r: 30, t: 30, b: 30 }
      const innerW = W - PAD.l - PAD.r
      const innerH = H - PAD.t - PAD.b
      const h = 1
      const uMax = (dpdx * h * h) / (2 * mu)
      const u = (y: number) => (dpdx / (2 * mu)) * (h * h - y * y)

      ctx!.strokeStyle = '#475569'
      ctx!.lineWidth = 2
      ctx!.beginPath(); ctx!.moveTo(PAD.l, PAD.t); ctx!.lineTo(PAD.l + innerW, PAD.t); ctx!.stroke()
      ctx!.beginPath(); ctx!.moveTo(PAD.l, PAD.t + innerH); ctx!.lineTo(PAD.l + innerW, PAD.t + innerH); ctx!.stroke()

      ctx!.fillStyle = 'rgba(34,211,238,0.10)'
      ctx!.beginPath()
      ctx!.moveTo(PAD.l, PAD.t + innerH / 2)
      const Ny = 60
      const uScale = innerW * 0.45 / Math.max(0.01, uMax)
      for (let i = 0; i <= Ny; i++) {
        const y = -h + (2 * h * i) / Ny
        const px = PAD.l + u(y) * uScale
        const py = PAD.t + innerH / 2 - (y / h) * (innerH / 2)
        ctx!.lineTo(px, py)
      }
      ctx!.lineTo(PAD.l, PAD.t + innerH / 2)
      ctx!.closePath()
      ctx!.fill()

      ctx!.strokeStyle = '#22d3ee'
      ctx!.lineWidth = 2
      ctx!.beginPath()
      for (let i = 0; i <= Ny; i++) {
        const y = -h + (2 * h * i) / Ny
        const px = PAD.l + u(y) * uScale
        const py = PAD.t + innerH / 2 - (y / h) * (innerH / 2)
        if (i === 0) ctx!.moveTo(px, py)
        else ctx!.lineTo(px, py)
      }
      ctx!.stroke()

      const N = 30
      for (let i = 0; i < N; i++) {
        const y = -h + (2 * h * (i + 0.5)) / N
        const speed = u(y) * uScale * 0.6
        const x = (PAD.l + ((tRef.current * speed * 0.4) % innerW) + innerW) % innerW + 1
        const py = PAD.t + innerH / 2 - (y / h) * (innerH / 2)
        ctx!.fillStyle = '#f59e0b'
        ctx!.beginPath()
        ctx!.arc(PAD.l + (x - PAD.l), py, 1.6, 0, Math.PI * 2)
        ctx!.fill()
      }

      ctx!.fillStyle = '#94a3b8'
      ctx!.font = '11px ui-monospace, monospace'
      ctx!.fillText('u(y) = (dp/dx)/(2μ) · (h² - y²)', PAD.l, 16)
      ctx!.fillText(`u_max = ${uMax.toFixed(2)}   Re = ${Re}`, PAD.l, H - 8)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [dpdx, mu, Re])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>−dp/dx <input type="range" min={0.1} max={4} step={0.1} value={dpdx} onChange={(e) => setDpdx(parseFloat(e.target.value))} /> <strong>{dpdx.toFixed(1)}</strong></label>
        <label>μ <input type="range" min={0.2} max={4} step={0.1} value={mu} onChange={(e) => setMu(parseFloat(e.target.value))} /> <strong>{mu.toFixed(1)}</strong></label>
        <label>Re <input type="range" min={1} max={2000} step={10} value={Re} onChange={(e) => setRe(parseInt(e.target.value))} /> <strong>{Re}</strong></label>
      </div>
      <canvas ref={ref} width={640} height={280} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        압력 구배가 커지거나 점성이 작아지면 포물선이 가팔라진다. Re &gt; 2300 부근부터는 이 해석해가 무의미 — 천이 영역.
      </p>
    </div>
  )
}
