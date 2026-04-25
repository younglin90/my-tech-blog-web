'use client'

import { useEffect, useRef, useState } from 'react'

function legendre(n: number, x: number): number {
  if (n === 0) return 1
  if (n === 1) return x
  let p0 = 1, p1 = x
  for (let k = 2; k <= n; k++) {
    const pk = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k
    p0 = p1
    p1 = pk
  }
  return p1
}

export function DGElementBasis() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [order, setOrder] = useState(3)
  const [nElem, setNElem] = useState(6)
  const [shape, setShape] = useState<'gauss' | 'step'>('gauss')

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.95)'
    ctx.fillRect(0, 0, W, H)

    const PAD = { l: 30, r: 12, t: 16, b: 28 }
    const innerW = W - PAD.l - PAD.r
    const innerH = H - PAD.t - PAD.b
    const target = (x: number) =>
      shape === 'gauss' ? Math.exp(-((x - 0.5) ** 2) * 40) : (x > 0.45 && x < 0.55 ? 1 : 0)

    ctx.strokeStyle = 'rgba(148,163,184,0.2)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const y = PAD.t + (innerH / 10) * i
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + innerW, y); ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(148,163,184,0.45)'
    ctx.setLineDash([2, 3])
    for (let i = 0; i <= nElem; i++) {
      const x = PAD.l + (innerW / nElem) * i
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + innerH); ctx.stroke()
    }
    ctx.setLineDash([])

    const yOf = (v: number) => PAD.t + innerH - ((v + 0.2) / 1.4) * innerH
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i <= 400; i++) {
      const x = i / 400
      const px = PAD.l + x * innerW
      const py = yOf(target(x))
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    const Nq = order * 4 + 4
    for (let e = 0; e < nElem; e++) {
      const xL = e / nElem, xR = (e + 1) / nElem
      const coeffs: number[] = []
      for (let p = 0; p <= order; p++) {
        let num = 0, den = 0
        for (let q = 0; q < Nq; q++) {
          const xi = -1 + (2 * q + 1) / Nq
          const xg = xL + (xi + 1) / 2 * (xR - xL)
          const fv = target(xg)
          const phi = legendre(p, xi)
          num += fv * phi / Nq
          den += phi * phi / Nq
        }
        coeffs.push(num / den)
      }

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      const M = 60
      for (let i = 0; i <= M; i++) {
        const xi = -1 + (2 * i) / M
        let v = 0
        for (let p = 0; p <= order; p++) v += coeffs[p] * legendre(p, xi)
        const xg = xL + (xi + 1) / 2 * (xR - xL)
        const px = PAD.l + xg * innerW
        const py = yOf(v)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }

    ctx.font = '11px ui-monospace, monospace'
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText('회색 = 참값, 시안 = DG 근사 (요소 경계마다 점프 허용)', PAD.l, H - 8)
  }, [order, nElem, shape])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, alignItems: 'center' }}>
        <label>p (다항식 차수) <input type="range" min={0} max={6} step={1} value={order} onChange={(e) => setOrder(parseInt(e.target.value))} /> <strong>{order}</strong></label>
        <label>요소 수 <input type="range" min={2} max={20} step={1} value={nElem} onChange={(e) => setNElem(parseInt(e.target.value))} /> <strong>{nElem}</strong></label>
        <label>
          <select value={shape} onChange={(e) => setShape(e.target.value as 'gauss' | 'step')}>
            <option value="gauss">smooth (gauss)</option>
            <option value="step">discontinuous (step)</option>
          </select>
        </label>
      </div>
      <canvas ref={ref} width={640} height={300} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        DG는 각 요소 안에서만 다항식 — 요소 경계에 점프가 보인다. p=3까지 올리면 부드러운 함수는 거의 일치, step은 Gibbs 진동이 나타난다.
      </p>
    </div>
  )
}
