'use client'

import { useEffect, useRef, useState } from 'react'

type Solver = 'CG' | 'GMRES' | 'BiCGSTAB' | 'Jacobi'

const COLORS: Record<Solver, string> = {
  CG: '#22d3ee',
  GMRES: '#f59e0b',
  BiCGSTAB: '#a78bfa',
  Jacobi: '#ef4444',
}

function simulate(solver: Solver, condK: number, n: number): number[] {
  const out: number[] = []
  let r = 1
  for (let i = 0; i < n; i++) {
    let rate: number
    switch (solver) {
      case 'CG': {
        const sk = Math.sqrt(condK)
        rate = ((sk - 1) / (sk + 1)) ** 2
        break
      }
      case 'GMRES':
        rate = Math.exp(-2 / Math.sqrt(condK))
        break
      case 'BiCGSTAB':
        rate = ((Math.sqrt(condK) - 1) / (Math.sqrt(condK) + 1)) * 0.95 + 0.02 * Math.sin(i * 0.7)
        break
      case 'Jacobi':
        rate = 1 - 1 / condK
        break
    }
    r *= Math.max(0.001, Math.min(0.9999, rate))
    out.push(Math.max(1e-16, r))
  }
  return out
}

export function KrylovConvergence() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [logK, setLogK] = useState(3)
  const [iters, setIters] = useState(80)
  const condK = 10 ** logK

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,17,31,0.9)'
    ctx.fillRect(0, 0, W, H)

    const PAD = { l: 50, r: 16, t: 16, b: 36 }
    const innerW = W - PAD.l - PAD.r
    const innerH = H - PAD.t - PAD.b
    const yMin = -16, yMax = 0
    const xMin = 0, xMax = iters
    const xy = (i: number, logR: number) => [
      PAD.l + ((i - xMin) / (xMax - xMin)) * innerW,
      PAD.t + (1 - (logR - yMin) / (yMax - yMin)) * innerH,
    ] as const

    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.lineWidth = 1
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = '#94a3b8'
    for (let p = yMin; p <= yMax; p += 2) {
      const [, y] = xy(0, p)
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + innerW, y); ctx.stroke()
      ctx.fillText(`10^${p}`, 6, y + 3)
    }
    for (let i = 0; i <= iters; i += Math.max(10, Math.round(iters / 8))) {
      const [x] = xy(i, 0)
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + innerH); ctx.stroke()
      ctx.fillText(String(i), x - 6, PAD.t + innerH + 14)
    }
    ctx.fillText('iter', PAD.l + innerW - 24, PAD.t + innerH + 28)
    ctx.fillText('||r||', 8, PAD.t + 8)

    const solvers: Solver[] = ['CG', 'GMRES', 'BiCGSTAB', 'Jacobi']
    for (const s of solvers) {
      const data = simulate(s, condK, iters)
      ctx.strokeStyle = COLORS[s]
      ctx.lineWidth = 2
      ctx.beginPath()
      data.forEach((r, i) => {
        const [px, py] = xy(i, Math.log10(r))
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
    }

    let ly = PAD.t + 6
    for (const s of solvers) {
      ctx.fillStyle = COLORS[s]
      ctx.fillRect(PAD.l + innerW - 100, ly, 12, 8)
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(s, PAD.l + innerW - 84, ly + 7)
      ly += 14
    }
  }, [logK, iters, condK])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, alignItems: 'center' }}>
        <label>
          condition number κ = 10^
          <input type="range" min={1} max={8} step={0.5} value={logK} onChange={(e) => setLogK(parseFloat(e.target.value))} style={{ verticalAlign: 'middle', margin: '0 8px' }} />
          <strong>{logK.toFixed(1)}</strong>
        </label>
        <label>
          iters
          <input type="range" min={20} max={200} step={10} value={iters} onChange={(e) => setIters(parseInt(e.target.value))} style={{ verticalAlign: 'middle', margin: '0 8px' }} />
          <strong>{iters}</strong>
        </label>
      </div>
      <canvas ref={ref} width={640} height={300} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        조건수 κ를 키우면 (그림에서 오른쪽으로) Jacobi는 거의 멈추고 CG/GMRES는 √κ 한계를 따른다. BiCGSTAB는 비대칭에 강하지만 잔차가 출렁인다.
      </p>
    </div>
  )
}
