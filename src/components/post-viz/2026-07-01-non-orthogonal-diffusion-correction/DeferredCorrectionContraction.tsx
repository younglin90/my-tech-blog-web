'use client'

import { useEffect, useRef, useState } from 'react'

// Models the deferred-correction outer loop for the non-orthogonal diffusion term.
// Each sweep keeps E_f implicit and lags the T_f correction; the residual contracts
// at rate rho = |T_f| / |E_f| per sweep. rho < 1 converges, rho >= 1 stalls/diverges.
// We literally iterate r_{m+1} = rho * r_m and plot the three approaches together.

type Approach = 'min' | 'orth' | 'over'

const COLORS: Record<Approach, string> = {
  min: '#f59e0b',
  orth: '#a78bfa',
  over: '#22d3ee',
}
const NAMES: Record<Approach, string> = {
  min: 'minimum',
  orth: 'orthogonal',
  over: 'over-relaxed',
}

const SWEEPS = 30

function implicitLen(a: Approach, theta: number): number {
  const c = Math.cos(theta)
  if (a === 'min') return c
  if (a === 'orth') return 1
  return 1 / c
}

function contraction(a: Approach, theta: number): number {
  const e = implicitLen(a, theta)
  const t = Math.sqrt(Math.max(0, 1 + e * e - 2 * e * Math.cos(theta)))
  return t / e
}

// run the deferred-correction sweeps and return normalized residual history
function runSweeps(rho: number): number[] {
  const r: number[] = [1]
  let cur = 1
  for (let m = 0; m < SWEEPS; m++) {
    cur = cur * rho
    r.push(cur)
  }
  return r
}

export function DeferredCorrectionContraction() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [thetaDeg, setThetaDeg] = useState(55)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = 560
    const H = 300
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    canvas.style.height = 'auto'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const theta = (thetaDeg * Math.PI) / 180
    const padL = 52
    const padR = 16
    const padT = 16
    const padB = 34
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const logMin = -8
    const logMax = 4 // allow growth above 1 to show divergence
    const xOf = (i: number) => padL + (i / SWEEPS) * plotW
    const yOf = (v: number) => {
      const lg = Math.max(logMin, Math.min(logMax, Math.log10(Math.max(v, 1e-12))))
      return padT + (1 - (lg - logMin) / (logMax - logMin)) * plotH
    }

    // grid lines per decade
    ctx.strokeStyle = 'rgba(120,140,160,0.14)'
    ctx.lineWidth = 1
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = 'rgba(150,170,190,0.7)'
    for (let e = logMin; e <= logMax; e += 2) {
      const y = padT + (1 - (e - logMin) / (logMax - logMin)) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
      ctx.fillText(`1e${e}`, 6, y + 3)
    }
    // residual = 1 reference line
    ctx.strokeStyle = 'rgba(248,113,113,0.5)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    const y1 = yOf(1)
    ctx.moveTo(padL, y1)
    ctx.lineTo(W - padR, y1)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(248,113,113,0.8)'
    ctx.fillText('residual = 1 (no progress)', padL + 6, y1 - 5)
    ctx.fillStyle = 'rgba(150,170,190,0.85)'
    ctx.fillText('deferred-correction sweeps →', padL, H - 8)

    ;(['min', 'orth', 'over'] as Approach[]).forEach((a) => {
      const rho = contraction(a, theta)
      const hist = runSweeps(rho)
      ctx.strokeStyle = COLORS[a]
      ctx.lineWidth = 2.4
      ctx.beginPath()
      hist.forEach((v, i) => {
        const x = xOf(i)
        const y = yOf(v)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
    })
  }, [thetaDeg])

  const theta = (thetaDeg * Math.PI) / 180

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{ marginTop: 14, fontSize: 13 }}>
        <label>
          mesh non-orthogonality θ = {thetaDeg}°
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 12,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12.5,
        }}
      >
        {(['min', 'orth', 'over'] as Approach[]).map((a) => {
          const rho = contraction(a, theta)
          return (
            <span key={a} style={{ color: COLORS[a] }}>
              ● {NAMES[a]} ρ={rho.toFixed(2)}{' '}
              <span style={{ color: rho < 1 ? '#4ade80' : '#f87171' }}>
                {rho < 1 ? 'converges' : 'diverges'}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
