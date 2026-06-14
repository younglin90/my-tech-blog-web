'use client'

import { useEffect, useRef, useState } from 'react'

// Limited slope variants used by the Bell-Colella-Glaz predictor.
type Limiter = 'none' | 'minmod' | 'superbee'

function minmod(a: number, b: number): number {
  if (a * b <= 0) return 0
  return Math.abs(a) < Math.abs(b) ? a : b
}

function limitedSlope(left: number, center: number, right: number, kind: Limiter): number {
  const dL = center - left
  const dR = right - center
  if (kind === 'none') return 0.5 * (right - left) // unlimited central slope
  if (kind === 'minmod') return minmod(dL, dR)
  // superbee: max of two minmod combinations, sign-consistent
  const s1 = minmod(dR, 2 * dL)
  const s2 = minmod(2 * dR, dL)
  if (s1 * s2 <= 0) return 0
  return Math.abs(s1) > Math.abs(s2) ? s1 : s2
}

// Cell-centered samples of a profile with a smooth bump + a sharp jump.
const N = 16
function sampleData(): number[] {
  const s: number[] = []
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    const g = (x - 0.32) / 0.09
    const bump = 0.55 * Math.exp(-(g * g))
    const jump = x > 0.66 ? 0.45 : 0.0
    s.push(0.2 + bump + jump)
  }
  return s
}

export function BcgEdgeStatePredictor1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cfl, setCfl] = useState(0.5)
  const [limiter, setLimiter] = useState<Limiter>('minmod')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const padL = 36
    const padR = 16
    const padT = 16
    const padB = 28
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const s = sampleData()
    const yMin = 0.0
    const yMax = 1.4
    const X = (i: number) => padL + (i / N) * plotW
    const Y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH

    ctx.clearRect(0, 0, W, H)

    // axes / grid
    ctx.strokeStyle = 'rgba(120,144,168,0.25)'
    ctx.lineWidth = 1
    for (let i = 0; i <= N; i++) {
      ctx.beginPath()
      ctx.moveTo(X(i), padT)
      ctx.lineTo(X(i), padT + plotH)
      ctx.stroke()
    }

    // cell averages (steps)
    ctx.strokeStyle = 'rgba(122,144,168,0.9)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < N; i++) {
      ctx.beginPath()
      ctx.moveTo(X(i), Y(s[i]))
      ctx.lineTo(X(i + 1), Y(s[i]))
      ctx.stroke()
    }

    // PLM reconstruction (limited slope) per cell + predicted edge states
    const dt = cfl // dx = 1 here, u = +1 -> CFL = dt
    for (let i = 0; i < N; i++) {
      const left = i > 0 ? s[i - 1] : s[i]
      const right = i < N - 1 ? s[i + 1] : s[i]
      const slope = limitedSlope(left, s[i], right, limiter)
      // PLM line inside the cell
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(X(i), Y(s[i] - 0.5 * slope))
      ctx.lineTo(X(i + 1), Y(s[i] + 0.5 * slope))
      ctx.stroke()

      // BCG left edge state at right face (u>0): s_i + 0.5*(1 - CFL)*slope
      const edgeL = s[i] + 0.5 * (1 - cfl) * slope
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(X(i + 1), Y(edgeL), 3.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // legend baseline labels
    ctx.fillStyle = 'rgba(122,144,168,0.9)'
    ctx.font = '11px sans-serif'
    ctx.fillText('s', 8, Y(yMax) + 4)
    ctx.fillText('x', padL + plotW - 6, padT + plotH + 18)
  }, [cfl, limiter])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={620} height={260} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 78 }}>CFL = {cfl.toFixed(2)}</span>
          <input type="range" min={0} max={0.95} step={0.05} value={cfl} onChange={(e) => setCfl(parseFloat(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['none', 'minmod', 'superbee'] as Limiter[]).map((k) => (
            <button
              key={k}
              onClick={() => setLimiter(k)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: limiter === k ? 'var(--accent)' : 'transparent',
                color: limiter === k ? '#06121f' : 'var(--text)',
                fontWeight: limiter === k ? 600 : 400,
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 2px 0' }}>
        Cyan = limited PLM slope inside each cell · Amber dot = predicted left edge state at n+1/2 (advecting velocity u&gt;0).
        Pick <code>none</code> near the jump to see the slope overshoot the neighbor values.
      </p>
    </div>
  )
}
