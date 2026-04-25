'use client'

import { useEffect, useRef, useState } from 'react'

type Method = 'VOF' | 'LevelSet' | 'Diffuse'

export function VOFvsLevelSet() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [method, setMethod] = useState<Method>('VOF')
  const [n, setN] = useState(40)
  const [r, setR] = useState(0.3)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = 24
    const inner = Math.min(W, H) - PAD * 2
    const cell = inner / n
    const ox = (W - cell * n) / 2
    const oy = (H - cell * n) / 2
    const cx = 0.5, cy = 0.5

    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i + 0.5) / n, y = (j + 0.5) / n
      const d = Math.hypot(x - cx, y - cy) - r
      let v = 0
      if (method === 'VOF') {
        // 부피분율: 셀 4점 표본 평균
        let inside = 0
        for (let si = 0; si < 4; si++) for (let sj = 0; sj < 4; sj++) {
          const xs = (i + (si + 0.5) / 4) / n, ys = (j + (sj + 0.5) / 4) / n
          if (Math.hypot(xs - cx, ys - cy) < r) inside++
        }
        v = inside / 16
        const r0 = Math.round(8 + 200 * (1 - v))
        const g0 = Math.round(17 + 194 * v)
        const b0 = Math.round(31 + 207 * v)
        ctx.fillStyle = `rgb(${r0},${g0},${b0})`
      } else if (method === 'LevelSet') {
        // φ = signed distance, 시그모이드로 시각화
        const t = 1 / (1 + Math.exp(d * 30))
        const r0 = Math.round(8 + 220 * (1 - t))
        const g0 = Math.round(17 + 194 * t)
        const b0 = Math.round(31 + 207 * t)
        ctx.fillStyle = `rgb(${r0},${g0},${b0})`
      } else {
        // 확산 계면: tanh profile (epsilon = 1.5*cell)
        const eps = 1.5 / n
        const phi = 0.5 * (1 - Math.tanh(d / eps))
        const r0 = Math.round(8 + 220 * (1 - phi))
        const g0 = Math.round(17 + 194 * phi)
        const b0 = Math.round(31 + 207 * phi)
        ctx.fillStyle = `rgb(${r0},${g0},${b0})`
      }
      ctx.fillRect(ox + i * cell, oy + j * cell, cell, cell)
    }

    if (method === 'LevelSet') {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ox + cx * cell * n, oy + cy * cell * n, r * cell * n, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    const desc = { VOF: 'VOF: 부피분율 α — 셀 단위 평균', LevelSet: 'Level Set: φ=0이 계면', Diffuse: 'Diffuse: tanh 프로파일' }[method]
    ctx.fillText(desc, 12, H - 10)
  }, [method, n, r])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>방법 <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
          <option value="VOF">VOF</option>
          <option value="LevelSet">Level Set</option>
          <option value="Diffuse">Diffuse Interface</option>
        </select></label>
        <label>격자 N <input type="range" min={20} max={80} step={2} value={n} onChange={(e) => setN(parseInt(e.target.value))} /> <strong>{n}</strong></label>
        <label>반경 <input type="range" min={0.1} max={0.45} step={0.01} value={r} onChange={(e) => setR(parseFloat(e.target.value))} /> <strong>{r.toFixed(2)}</strong></label>
      </div>
      <canvas ref={ref} width={460} height={460} style={{ width: '100%', maxWidth: 460, height: 'auto', borderRadius: 6, alignSelf: 'center' }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        같은 원을 세 방법이 어떻게 표현하는지 비교 — VOF는 셀 평균, Level Set는 부호거리, Diffuse는 매끄러운 전이.
      </p>
    </div>
  )
}
