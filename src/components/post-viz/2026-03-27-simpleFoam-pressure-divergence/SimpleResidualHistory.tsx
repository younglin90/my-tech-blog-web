'use client'

import { useEffect, useRef, useState } from 'react'

function simulate(alphaP: number, alphaU: number, n: number): { p: number[]; u: number[] } {
  const p: number[] = [], u: number[] = []
  let rp = 1, ru = 1
  for (let i = 0; i < n; i++) {
    const stable = alphaP < 0.4 && alphaU < 0.85
    const ratep = stable ? 1 - alphaP * 0.18 : 1 - alphaP * 0.08 + 0.005 * Math.sin(i * 0.5)
    const rateu = stable ? 1 - alphaU * 0.12 : 1 - alphaU * 0.04 + 0.012 * Math.sin(i * 0.7)
    rp = Math.max(1e-12, rp * Math.max(0.6, ratep) * (alphaP > 0.6 ? 1 + 0.02 * Math.sin(i) : 1))
    ru = Math.max(1e-12, ru * Math.max(0.6, rateu))
    if (alphaP > 0.7 && i > 30) { rp *= 1.05; ru *= 1.03 }
    p.push(rp); u.push(ru)
  }
  return { p, u }
}

export function SimpleResidualHistory() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [alphaP, setAlphaP] = useState(0.3)
  const [alphaU, setAlphaU] = useState(0.7)
  const N = 120

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = { l: 50, r: 16, t: 16, b: 30 }
    const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b
    const yMin = -10, yMax = 1
    const xy = (i: number, lr: number) => [
      PAD.l + (i / N) * innerW,
      PAD.t + (1 - (lr - yMin) / (yMax - yMin)) * innerH,
    ] as const

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.lineWidth = 1
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = '#94a3b8'
    for (let p = yMin; p <= yMax; p += 1) {
      const [, y] = xy(0, p)
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + innerW, y); ctx.stroke()
      ctx.fillText(`10^${p}`, 6, y + 3)
    }

    const { p, u } = simulate(alphaP, alphaU, N)
    const drawSeries = (data: number[], color: string, label: string, off: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      data.forEach((r, i) => {
        const [px, py] = xy(i, Math.log10(r))
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.fillStyle = color
      ctx.fillRect(PAD.l + 8, PAD.t + 6 + off, 12, 8)
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(label, PAD.l + 24, PAD.t + 13 + off)
    }
    drawSeries(p, '#22d3ee', `pressure (αp=${alphaP.toFixed(2)})`, 0)
    drawSeries(u, '#f59e0b', `momentum (αu=${alphaU.toFixed(2)})`, 14)
  }, [alphaP, alphaU])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>αp (pressure URF) <input type="range" min={0.05} max={0.95} step={0.05} value={alphaP} onChange={(e) => setAlphaP(parseFloat(e.target.value))} /> <strong>{alphaP.toFixed(2)}</strong></label>
        <label>αu (momentum URF) <input type="range" min={0.1} max={0.95} step={0.05} value={alphaU} onChange={(e) => setAlphaU(parseFloat(e.target.value))} /> <strong>{alphaU.toFixed(2)}</strong></label>
      </div>
      <canvas ref={ref} width={640} height={280} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        αp를 0.7 이상으로 올리면 30 iter 부근에서 잔차가 다시 튀어오른다 — simpleFoam이 발산하는 전형 패턴. 0.3 / 0.7 이 안정 기본값.
      </p>
    </div>
  )
}
