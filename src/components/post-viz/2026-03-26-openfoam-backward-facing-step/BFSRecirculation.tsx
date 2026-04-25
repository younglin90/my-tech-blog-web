'use client'

import { useEffect, useRef, useState } from 'react'

export function BFSRecirculation() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [Re, setRe] = useState(400)
  const [pcount, setPcount] = useState(220)
  const partsRef = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    partsRef.current = Array.from({ length: pcount }, () => ({
      x: Math.random() * 0.05,
      y: 0.55 + Math.random() * 0.4,
    }))
  }, [pcount])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0

    const inStep = (x: number, y: number) => x < 0.18 && y < 0.5
    const inDomain = (x: number, y: number) => x >= 0 && x <= 1 && y >= 0 && y <= 1 && !inStep(x, y)

    function velocity(x: number, y: number): [number, number] {
      const Lr = 0.16 + Re * 0.0008
      let u = 0, v = 0
      if (x < 0.18) {
        const yy = (y - 0.5) / 0.5
        u = 1.5 * (1 - yy * yy)
      } else {
        const xstep = x - 0.18
        const profileY = Math.min(1, 0.5 + xstep * 1.5)
        if (y > 0.5 - 0.5 * Math.min(1, xstep * 4)) {
          const yy = (y - 0.5 * (1 - Math.min(1, xstep * 2))) / Math.max(0.05, 0.5 + xstep * 0.5)
          u = 1.6 * Math.max(0, 1 - (yy - 0.5) ** 2 * 4)
        }
        if (xstep < Lr && y < 0.45) {
          const cxx = 0.18 + Lr * 0.5, cyy = 0.22
          const dx = x - cxx, dy = y - cyy
          const r = Math.hypot(dx, dy) + 0.01
          const omega = -1.6 * (1 - r / 0.45)
          u += -omega * dy / r
          v += omega * dx / r
        }
        v -= 0.05 * Math.exp(-((x - 0.18) ** 2) * 30) * Math.sin(profileY)
      }
      return [u, v]
    }

    function draw() {
      const W = c!.width, H = c!.height
      ctx!.fillStyle = 'rgba(8,17,31,0.10)'
      ctx!.fillRect(0, 0, W, H)

      const PAD = 10
      const innerW = W - 2 * PAD, innerH = H - 2 * PAD
      const xy = (x: number, y: number) => [PAD + x * innerW, PAD + (1 - y) * innerH] as const

      ctx!.fillStyle = '#1e293b'
      const [sx, sy] = xy(0, 0)
      const [ex, ey] = xy(0.18, 0.5)
      ctx!.fillRect(sx, ey, ex - sx, sy - ey)

      ctx!.strokeStyle = '#334155'
      ctx!.lineWidth = 1
      ctx!.strokeRect(PAD, PAD, innerW, innerH)

      const parts = partsRef.current
      for (const p of parts) {
        if (!inDomain(p.x, p.y) || p.x > 1) {
          p.x = Math.random() * 0.04
          p.y = 0.55 + Math.random() * 0.4
          continue
        }
        const [u, v] = velocity(p.x, p.y)
        const speed = Math.hypot(u, v)
        p.x += u * 0.004
        p.y += v * 0.004
        const [px, py] = xy(p.x, p.y)
        ctx!.fillStyle = `hsl(${190 - Math.min(120, speed * 60)},80%,${50 + Math.min(20, speed * 12)}%)`
        ctx!.beginPath(); ctx!.arc(px, py, 1.4, 0, Math.PI * 2); ctx!.fill()
      }

      ctx!.fillStyle = '#94a3b8'
      ctx!.font = '11px ui-monospace, monospace'
      const Lr = 0.16 + Re * 0.0008
      ctx!.fillText(`Re=${Re}   재부착 길이 Lr ≈ ${(Lr * 6).toFixed(2)}h`, 14, H - 10)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [Re])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>Re <input type="range" min={50} max={1500} step={50} value={Re} onChange={(e) => setRe(parseInt(e.target.value))} /> <strong>{Re}</strong></label>
        <label>입자 <input type="range" min={50} max={500} step={10} value={pcount} onChange={(e) => setPcount(parseInt(e.target.value))} /> <strong>{pcount}</strong></label>
      </div>
      <canvas ref={ref} width={640} height={280} style={{ width: '100%', height: 'auto', borderRadius: 6, background: '#08111f' }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        스텝 직후 재순환 영역(Lr)이 형성된다. Re가 커지면 Lr가 길어지다가 Re ≳ 1000부근부터 비정상이 된다 — Armaly et al. 1983 실험과 일치.
      </p>
    </div>
  )
}
