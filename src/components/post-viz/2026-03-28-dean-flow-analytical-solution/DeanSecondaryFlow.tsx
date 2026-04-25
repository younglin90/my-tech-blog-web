'use client'

import { useEffect, useRef, useState } from 'react'

export function DeanSecondaryFlow() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [De, setDe] = useState(60)
  const [pcount, setPcount] = useState(120)
  const partsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([])

  useEffect(() => {
    partsRef.current = Array.from({ length: pcount }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      vx: 0, vy: 0,
      life: Math.random() * 100,
    }))
  }, [pcount])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0

    function draw() {
      const W = c!.width, H = c!.height
      ctx!.fillStyle = 'rgba(8,17,31,0.12)'
      ctx!.fillRect(0, 0, W, H)

      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 20

      ctx!.strokeStyle = '#475569'
      ctx!.lineWidth = 2
      ctx!.beginPath(); ctx!.arc(cx, cy, R, 0, Math.PI * 2); ctx!.stroke()

      const k = De / 200
      const parts = partsRef.current
      for (const p of parts) {
        const r = Math.hypot(p.x, p.y)
        if (r > 0.98 || p.life > 100) {
          p.x = Math.random() * 2 - 1
          p.y = Math.random() * 2 - 1
          p.life = 0
        }
        const fx = -k * p.y * (1 - p.x * p.x - p.y * p.y) + 0.04 * p.x * (Math.abs(p.y) - 0.4)
        const fy = k * p.x * (1 - p.x * p.x - p.y * p.y) - 0.04 * p.y * (Math.abs(p.x) - 0.4)
        p.vx = p.vx * 0.95 + fx * 0.05
        p.vy = p.vy * 0.95 + fy * 0.05
        p.x += p.vx * 0.02
        p.y += p.vy * 0.02
        p.life += 1

        const px = cx + p.x * R, py = cy + p.y * R
        const speed = Math.hypot(p.vx, p.vy)
        ctx!.fillStyle = `hsl(${190 - speed * 80},80%,${50 + speed * 20}%)`
        ctx!.beginPath()
        ctx!.arc(px, py, 1.4, 0, Math.PI * 2)
        ctx!.fill()
      }

      ctx!.fillStyle = '#94a3b8'
      ctx!.font = '11px ui-monospace, monospace'
      ctx!.fillText(`Dean number De = ${De}`, 10, 18)
      ctx!.fillText('두 개의 대칭 와류(Dean vortices)가 단면에 형성된다', 10, H - 8)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [De])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>De <input type="range" min={5} max={400} step={5} value={De} onChange={(e) => setDe(parseInt(e.target.value))} /> <strong>{De}</strong></label>
        <label>입자 수 <input type="range" min={30} max={400} step={10} value={pcount} onChange={(e) => setPcount(parseInt(e.target.value))} /> <strong>{pcount}</strong></label>
      </div>
      <canvas ref={ref} width={420} height={420} style={{ width: '100%', maxWidth: 420, height: 'auto', borderRadius: 6, background: '#08111f', alignSelf: 'center' }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        곡관 단면을 위에서 본 그림. De가 커지면 원심력이 점성을 누르고 두 와류가 뚜렷해진다 — 해석해의 핵심 결과.
      </p>
    </div>
  )
}
