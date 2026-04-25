'use client'

import { useEffect, useRef, useState } from 'react'

export function PINNLossLandscape() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [lambdaPDE, setLambdaPDE] = useState(1)
  const [lambdaBC, setLambdaBC] = useState(10)
  const [lambdaData, setLambdaData] = useState(1)
  const [Re, setRe] = useState(100)

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
    const N = 200
    const yMax = 0
    const yMin = -8
    const xy = (i: number, lr: number) => [
      PAD.l + (i / N) * innerW,
      PAD.t + (1 - (lr - yMin) / (yMax - yMin)) * innerH,
    ] as const

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.lineWidth = 1
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = '#94a3b8'
    for (let p = yMin; p <= yMax; p++) {
      const [, y] = xy(0, p)
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + innerW, y); ctx.stroke()
      ctx.fillText(`10^${p}`, 6, y + 3)
    }

    // 손실 항별 가짜 학습 곡선 (Re 가 클수록 PDE 수렴 느려짐)
    const stiff = 1 + Math.log10(Re) * 0.4
    const lossCurve = (lambda: number, base: number, noise: number) => {
      const out: number[] = []
      let l = base
      for (let i = 0; i < N; i++) {
        const decay = Math.exp(-0.02 * Math.sqrt(lambda) / stiff)
        l = Math.max(1e-8, l * decay + noise * Math.sin(i * 0.1) * 0.0001)
        out.push(l)
      }
      return out
    }

    const series: [string, string, number[]][] = [
      ['L_PDE', '#22d3ee', lossCurve(lambdaPDE, 1.0, 0.005)],
      ['L_BC', '#f59e0b', lossCurve(lambdaBC, 0.6, 0.001)],
      ['L_data', '#a78bfa', lossCurve(lambdaData, 0.4, 0.001)],
    ]
    const total: number[] = new Array(N).fill(0)
    for (const [, , data] of series) data.forEach((v, i) => (total[i] += v))

    for (const [name, col, data] of series) {
      ctx.strokeStyle = col
      ctx.lineWidth = 1.5
      ctx.beginPath()
      data.forEach((v, i) => {
        const [px, py] = xy(i, Math.log10(v))
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke()
      void name
    }

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.beginPath()
    total.forEach((v, i) => {
      const [px, py] = xy(i, Math.log10(v))
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    })
    ctx.stroke()

    let ly = PAD.t + 6
    for (const [name, col] of series) {
      ctx.fillStyle = col
      ctx.fillRect(PAD.l + innerW - 110, ly, 12, 8)
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(name, PAD.l + innerW - 94, ly + 7)
      ly += 14
    }
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText('total', PAD.l + innerW - 94, ly + 7)
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(PAD.l + innerW - 110, ly, 12, 8)
  }, [lambdaPDE, lambdaBC, lambdaData, Re])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 12 }}>
        <label>λ_PDE <input type="range" min={0.01} max={100} step={0.5} value={lambdaPDE} onChange={(e) => setLambdaPDE(parseFloat(e.target.value))} /> <strong>{lambdaPDE.toFixed(1)}</strong></label>
        <label>λ_BC <input type="range" min={0.01} max={1000} step={1} value={lambdaBC} onChange={(e) => setLambdaBC(parseFloat(e.target.value))} /> <strong>{lambdaBC.toFixed(0)}</strong></label>
        <label>λ_data <input type="range" min={0.01} max={100} step={0.5} value={lambdaData} onChange={(e) => setLambdaData(parseFloat(e.target.value))} /> <strong>{lambdaData.toFixed(1)}</strong></label>
        <label>Re <input type="range" min={10} max={10000} step={10} value={Re} onChange={(e) => setRe(parseInt(e.target.value))} /> <strong>{Re}</strong></label>
      </div>
      <canvas ref={ref} width={640} height={280} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        손실 가중치 λ가 너무 작으면 그 항이 안 떨어지고, 너무 크면 다른 항을 짓누른다. Re가 커지면 PDE 항이 stiff 해진다 — PINN의 핵심 난점.
      </p>
    </div>
  )
}
