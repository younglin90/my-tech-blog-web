'use client'

import { useEffect, useRef, useState } from 'react'

export function RiemannFan() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [pL, setPL] = useState(1.0)
  const [pR, setPR] = useState(0.1)
  const [rhoL, setRhoL] = useState(1.0)
  const [rhoR, setRhoR] = useState(0.125)
  const gamma = 1.4

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = 36
    const innerW = W - PAD * 2, innerH = H - PAD * 2

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.beginPath(); ctx.moveTo(PAD, PAD + innerH); ctx.lineTo(PAD + innerW, PAD + innerH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD + innerW / 2, PAD); ctx.lineTo(PAD + innerW / 2, PAD + innerH); ctx.stroke()

    const cL = Math.sqrt(gamma * pL / rhoL)
    const cR = Math.sqrt(gamma * pR / rhoR)
    const pStar = Math.pow((cL + cR) / (cL / Math.pow(pL, (gamma - 1) / (2 * gamma)) + cR / Math.pow(pR, (gamma - 1) / (2 * gamma))), 2 * gamma / (gamma - 1))

    const cx = PAD + innerW / 2, cy = PAD + innerH

    const draw = (slope: number, color: string, dash: number[]) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash(dash)
      const x = cx + slope * innerH * 0.5
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, PAD); ctx.stroke()
    }

    if (pStar > pL) {
      draw(-1.5, '#ef4444', [])
    } else {
      for (const k of [-1.5, -1.2]) draw(k, '#22d3ee', [3, 3])
    }
    draw(0.2, '#a78bfa', [6, 4])
    if (pStar > pR) {
      draw(1.6, '#ef4444', [])
    } else {
      for (const k of [1.2, 1.6]) draw(k, '#22d3ee', [3, 3])
    }
    ctx.setLineDash([])

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(`p* ≈ ${pStar.toFixed(3)}   c_L=${cL.toFixed(2)}  c_R=${cR.toFixed(2)}`, 14, 18)
    ctx.fillStyle = '#ef4444'; ctx.fillText('━ shock', PAD, H - 28)
    ctx.fillStyle = '#22d3ee'; ctx.fillText('┄ rarefaction', PAD + 80, H - 28)
    ctx.fillStyle = '#a78bfa'; ctx.fillText('┄ contact', PAD + 200, H - 28)
    ctx.fillStyle = '#94a3b8'; ctx.fillText('x', PAD + innerW - 10, H - 22)
    ctx.fillStyle = '#94a3b8'; ctx.fillText('t', cx + 6, PAD + 10)
  }, [pL, pR, rhoL, rhoR])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, fontSize: 12 }}>
        <label>p_L <input type="range" min={0.1} max={5} step={0.05} value={pL} onChange={(e) => setPL(parseFloat(e.target.value))} /> {pL.toFixed(2)}</label>
        <label>p_R <input type="range" min={0.01} max={2} step={0.01} value={pR} onChange={(e) => setPR(parseFloat(e.target.value))} /> {pR.toFixed(2)}</label>
        <label>ρ_L <input type="range" min={0.1} max={3} step={0.05} value={rhoL} onChange={(e) => setRhoL(parseFloat(e.target.value))} /> {rhoL.toFixed(2)}</label>
        <label>ρ_R <input type="range" min={0.05} max={2} step={0.01} value={rhoR} onChange={(e) => setRhoR(parseFloat(e.target.value))} /> {rhoR.toFixed(2)}</label>
      </div>
      <canvas ref={ref} width={520} height={320} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        x–t 다이어그램에서 좌·우로 가는 파(shock 또는 rarefaction)와 가운데 접촉 불연속이 보인다. p_L &gt; p_R이 충분히 크면 양쪽 모두 shock이 된다.
      </p>
    </div>
  )
}
