'use client'

import { useEffect, useRef, useState } from 'react'

export function CheckerboardPressure() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [useRC, setUseRC] = useState(false)
  const [grid, setGrid] = useState(20)
  const [perturb, setPerturb] = useState(0.3)

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
    const cell = Math.min((W - PAD * 2), (H - PAD * 2)) / grid
    const ox = (W - cell * grid) / 2
    const oy = (H - cell * grid) / 2

    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        let p
        if (useRC) {
          p = 0.5 + 0.4 * Math.sin((i + j) * 0.4)
        } else {
          const checker = ((i + j) % 2) * 2 - 1
          p = 0.5 + perturb * checker + 0.1 * Math.sin(i * 0.3)
        }
        const v = Math.max(0, Math.min(1, p))
        const r = Math.round(34 + 200 * (1 - v))
        const g = Math.round(211 - 100 * v)
        const b = Math.round(238 - 50 * v)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(ox + i * cell, oy + j * cell, cell - 0.5, cell - 0.5)
      }
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText(useRC ? 'with Rhie–Chow correction (smooth)' : 'collocated, NO RC (checkerboard)', 12, H - 10)
  }, [useRC, grid, perturb])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, alignItems: 'center' }}>
        <label><input type="checkbox" checked={useRC} onChange={(e) => setUseRC(e.target.checked)} /> Rhie–Chow 보정 켜기</label>
        <label>격자 <input type="range" min={8} max={50} step={2} value={grid} onChange={(e) => setGrid(parseInt(e.target.value))} /> <strong>{grid}</strong></label>
        <label>섭동 <input type="range" min={0.05} max={0.5} step={0.01} value={perturb} onChange={(e) => setPerturb(parseFloat(e.target.value))} /> <strong>{perturb.toFixed(2)}</strong></label>
      </div>
      <canvas ref={ref} width={520} height={520} style={{ width: '100%', maxWidth: 520, height: 'auto', borderRadius: 6, alignSelf: 'center' }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        체크박스를 켜면 압력 체커보드가 사라진다 — Rhie–Chow가 면 속도에 압력 2차 미분 항을 추가해 시 짝수/홀수 노드의 결합을 회복한 결과.
      </p>
    </div>
  )
}
