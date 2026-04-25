'use client'

import { useEffect, useRef, useState } from 'react'

type Method = 'FDM' | 'FEM' | 'FVM'

export function StencilCompare() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [method, setMethod] = useState<Method>('FDM')
  const [n, setN] = useState(8)

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
    const innerW = W - PAD * 2
    const innerH = H - PAD * 2
    const xy = (i: number, j: number) => [PAD + (i / n) * innerW, PAD + (j / n) * innerH] as const

    ctx.strokeStyle = 'rgba(148,163,184,0.25)'
    ctx.lineWidth = 1
    for (let i = 0; i <= n; i++) {
      const [x1, y1] = xy(i, 0); const [, y2] = xy(0, n)
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y2); ctx.stroke()
      const [, yj1] = xy(0, i); const [xj2] = xy(n, 0)
      ctx.beginPath(); ctx.moveTo(PAD, yj1); ctx.lineTo(xj2, yj1); ctx.stroke()
    }

    if (method === 'FDM') {
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
        const [x, y] = xy(i, j)
        ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill()
      }
      const ci = Math.floor(n / 2), cj = Math.floor(n / 2)
      const [cx, cy] = xy(ci, cj)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2
      const cells = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      for (const [di, dj] of cells) {
        const [px, py] = xy(ci + di, cj + dj)
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke()
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill()
    } else if (method === 'FVM') {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const [x1, y1] = xy(i, j); const [x2, y2] = xy(i + 1, j + 1)
        ctx.fillStyle = ((i + j) % 2) ? 'rgba(34,211,238,0.05)' : 'rgba(34,211,238,0.12)'
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2
        ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill()
      }
      const ci = Math.floor(n / 2), cj = Math.floor(n / 2)
      const [x1, y1] = xy(ci, cj); const [x2, y2] = xy(ci + 1, cj + 1)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc((x1+x2)/2, (y1+y2)/2, 4, 0, Math.PI*2); ctx.fill()
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('flux ↔', (x1+x2)/2 - 12, y1 - 4)
    } else {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const [x1, y1] = xy(i, j); const [x2, y2] = xy(i + 1, j + 1)
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2); ctx.closePath()
        ctx.strokeStyle = 'rgba(34,211,238,0.6)'; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2); ctx.closePath()
        ctx.stroke()
      }
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
        const [x, y] = xy(i, j)
        ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
      }
      const ci = Math.floor(n / 2), cj = Math.floor(n / 2)
      const [px1, py1] = xy(ci, cj); const [px2] = xy(ci + 1, cj); const [, py3] = xy(ci, cj + 1)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py1); ctx.lineTo(px1, py3); ctx.closePath()
      ctx.stroke()
      ctx.fillStyle = 'rgba(245,158,11,0.18)'; ctx.fill()
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText({ FDM: 'FDM: 노드 미분 — 1 점 + 4 이웃 (5점 stencil)', FEM: 'FEM: 삼각·사각 요소 — 형상함수로 적분', FVM: 'FVM: 셀 평균 — 면을 통과하는 flux 균형' }[method], 16, H - 12)
  }, [method, n])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>방법 <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
          <option value="FDM">FDM</option>
          <option value="FEM">FEM</option>
          <option value="FVM">FVM</option>
        </select></label>
        <label>격자 <input type="range" min={4} max={16} step={1} value={n} onChange={(e) => setN(parseInt(e.target.value))} /> <strong>{n}</strong></label>
      </div>
      <canvas ref={ref} width={460} height={460} style={{ width: '100%', maxWidth: 460, height: 'auto', borderRadius: 6, alignSelf: 'center' }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        같은 격자 위에 세 방법이 어떤 자유도(노드/셀/요소)를 가지는지 비교 — 보존성과 정확도 차이의 출발점.
      </p>
    </div>
  )
}
