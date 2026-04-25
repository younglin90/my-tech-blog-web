'use client'

import { useEffect, useRef, useState } from 'react'

export function SpeedOfSoundMix() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [pBar, setPBar] = useState(1.0) // bar
  const rho_l = 1000, rho_g = 1.2
  const c_l = 1500, c_g = 340

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = { l: 50, r: 16, t: 18, b: 30 }
    const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = '#94a3b8'
    for (let i = 0; i <= 5; i++) {
      const y = PAD.t + (innerH / 5) * i
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + innerW, y); ctx.stroke()
      const c_val = (1500 - 300 * i)
      ctx.fillText(`${c_val}`, 8, y + 3)
    }
    ctx.fillText('c [m/s]', 6, PAD.t + 10)
    ctx.fillText('α (gas)', PAD.l + innerW - 30, PAD.t + innerH + 16)

    const N = 200
    const cWood = (alpha: number) => {
      const rhoMix = (1 - alpha) * rho_l + alpha * rho_g
      const inv = (1 - alpha) / (rho_l * c_l * c_l) + alpha / (rho_g * c_g * c_g)
      return 1 / Math.sqrt(rhoMix * inv)
    }
    const cFrozen = (alpha: number) => (1 - alpha) * c_l + alpha * c_g

    const mapY = (c: number) => PAD.t + (1 - (c - 0) / 1500) * innerH

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const a = i / N
      const cv = Math.min(1500, cWood(a))
      const x = PAD.l + a * innerW
      const y = mapY(cv)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#f59e0b'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const a = i / N
      const cv = cFrozen(a)
      const x = PAD.l + a * innerW
      const y = mapY(cv)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    const aProbe = pBar / 5
    const cw = cWood(aProbe)
    const px = PAD.l + aProbe * innerW
    const py = mapY(Math.min(1500, cw))
    ctx.fillStyle = '#ef4444'
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.fillText(`α=${aProbe.toFixed(2)}  c_Wood=${cw.toFixed(0)} m/s`, px + 8, py - 6)

    ctx.fillStyle = '#22d3ee'; ctx.fillText('━ Wood (등압 평형, 음속 최소 ≈20m/s)', PAD.l, H - 8)
    ctx.fillStyle = '#f59e0b'; ctx.fillText('┄ frozen', PAD.l + 250, H - 8)
  }, [pBar])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>탐침 위치 (gas fraction × 5) <input type="range" min={0} max={5} step={0.05} value={pBar} onChange={(e) => setPBar(parseFloat(e.target.value))} /> <strong>α={(pBar/5).toFixed(2)}</strong></label>
      </div>
      <canvas ref={ref} width={620} height={300} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        다상 혼합물의 음속은 단상보다 훨씬 작다 — α ≈ 0.5에서 Wood 음속은 ~20 m/s까지 떨어진다. 압축성 다상 해석이 어려운 핵심 이유.
      </p>
    </div>
  )
}
