'use client'

import { useEffect, useRef, useState } from 'react'

// 1D 벽면 집중 매핑: 균일한 논리좌표 eta ∈ [0,1] 를
// 물리좌표 y = (exp(beta*eta) - 1) / (exp(beta) - 1) 로 보낸다.
// beta 가 커질수록 벽(y=0) 근처에서 격자가 촘촘해진다.
function stretch(eta: number, beta: number): number {
  if (Math.abs(beta) < 1e-6) return eta
  return (Math.exp(beta * eta) - 1) / (Math.exp(beta) - 1)
}

// 1D 야코비안 dy/d(eta) = beta*exp(beta*eta) / (exp(beta)-1)
function jacobian1D(eta: number, beta: number): number {
  if (Math.abs(beta) < 1e-6) return 1
  return (beta * Math.exp(beta * eta)) / (Math.exp(beta) - 1)
}

export function WallClusteringStretch1D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [beta, setBeta] = useState(2.5)
  const [n, setN] = useState(16)
  const [ratio, setRatio] = useState({ first: 0, last: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)

    const padT = 24, padB = 24
    const barX = 70
    const plotX0 = 150
    const plotW = W - plotX0 - 30
    const h = H - padT - padB
    const toY = (y: number) => padT + (1 - y) * h

    // 벽(y=0) 표시
    ctx.fillStyle = 'rgba(34,211,238,0.15)'
    ctx.fillRect(barX - 22, toY(0) - 6, 44, 6)
    ctx.fillStyle = 'var(--text-muted)'
    ctx.font = '11px sans-serif'
    ctx.fillText('wall y=0', barX - 24, toY(0) + 16)

    // 노드들을 수직 막대에 표시
    const ys: number[] = []
    for (let i = 0; i <= n; i++) {
      const y = stretch(i / n, beta)
      ys.push(y)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(barX - 16, toY(y))
      ctx.lineTo(barX + 16, toY(y))
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.moveTo(barX, toY(0))
    ctx.lineTo(barX, toY(1))
    ctx.stroke()

    // dy/d(eta) 곡선 (논리좌표 eta vs 야코비안)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    const samples = 100
    let jmax = 0
    for (let k = 0; k <= samples; k++) jmax = Math.max(jmax, jacobian1D(k / samples, beta))
    for (let k = 0; k <= samples; k++) {
      const eta = k / samples
      const jx = plotX0 + (jacobian1D(eta, beta) / jmax) * plotW
      const py = toY(eta)
      if (k === 0) ctx.moveTo(jx, py)
      else ctx.lineTo(jx, py)
    }
    ctx.stroke()
    ctx.fillStyle = 'var(--text-muted)'
    ctx.fillText('dy/dη (Jacobian) →', plotX0, padT - 8)

    const first = ys[1] - ys[0]
    const last = ys[n] - ys[n - 1]
    setRatio({ first, last })
  }, [beta, n])

  const labelStyle: React.CSSProperties = { fontSize: 13, color: 'var(--text-muted)' }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)', margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={460}
        height={300}
        style={{ width: '100%', maxWidth: 460, height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }}
      />
      <div style={{ marginTop: 12 }}>
        <div style={rowStyle}>
          <span style={{ ...labelStyle, width: 130 }}>clustering β = {beta.toFixed(1)}</span>
          <input type="range" min={0} max={5} step={0.1} value={beta} onChange={(e) => setBeta(+e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <span style={{ ...labelStyle, width: 130 }}>nodes n = {n}</span>
          <input type="range" min={6} max={40} step={1} value={n} onChange={(e) => setN(+e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>
          첫 간격 Δy₀ = {ratio.first.toFixed(4)} · 마지막 간격 = {ratio.last.toFixed(4)} ·{' '}
          비율 = {ratio.first > 0 ? (ratio.last / ratio.first).toFixed(1) : '—'}×
        </div>
      </div>
    </div>
  )
}
