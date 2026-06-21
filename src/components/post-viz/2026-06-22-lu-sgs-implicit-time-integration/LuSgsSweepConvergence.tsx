'use client'

import { useEffect, useRef, useState } from 'react'

// LU-SGS as a relaxation on the implicit update system A x = b, where
// A = I/Δt + ∂R/∂U. Here we use the diffusion-dominated case (viscous
// Jacobian = 1D Laplacian) so A = diag(1 + 2d) with off-diagonals -d,
// d being the diffusion number ν Δt / Δx². One forward + one backward
// Gauss-Seidel pass = one symmetric (LU-SGS) sweep. We watch the L2
// residual fall sweep by sweep; a larger Δt (larger d) weakens diagonal
// dominance and slows the relaxation.

const MAX_SWEEPS = 70

export function LuSgsSweepConvergence() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [d, setD] = useState(6)
  const [n, setN] = useState(48)
  const [running, setRunning] = useState(true)

  // mutable solver state kept in refs so rAF can mutate without re-render
  const xRef = useRef<Float64Array>(new Float64Array(n))
  const bRef = useRef<Float64Array>(new Float64Array(n))
  const histRef = useRef<number[]>([])
  const sweepRef = useRef(0)
  const rafRef = useRef<number>(0)

  // (re)initialise whenever d or n changes
  useEffect(() => {
    const b = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      const xi = (i + 0.5) / n
      b[i] = Math.sin(Math.PI * xi) + 0.4 * Math.sin(4 * Math.PI * xi)
    }
    bRef.current = b
    xRef.current = new Float64Array(n)
    histRef.current = []
    sweepRef.current = 0
  }, [d, n])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const residual = () => {
      const x = xRef.current
      const b = bRef.current
      const diag = 1 + 2 * d
      let s = 0
      for (let i = 0; i < n; i++) {
        const xl = i > 0 ? x[i - 1] : 0
        const xr = i < n - 1 ? x[i + 1] : 0
        const ax = diag * x[i] - d * (xl + xr)
        const r = b[i] - ax
        s += r * r
      }
      return Math.sqrt(s / n)
    }

    const oneSweep = () => {
      const x = xRef.current
      const b = bRef.current
      const inv = 1 / (1 + 2 * d)
      // forward pass (uses freshly updated left neighbour)
      for (let i = 0; i < n; i++) {
        const xl = i > 0 ? x[i - 1] : 0
        const xr = i < n - 1 ? x[i + 1] : 0
        x[i] = (b[i] + d * (xl + xr)) * inv
      }
      // backward pass (uses freshly updated right neighbour)
      for (let i = n - 1; i >= 0; i--) {
        const xl = i > 0 ? x[i - 1] : 0
        const xr = i < n - 1 ? x[i + 1] : 0
        x[i] = (b[i] + d * (xl + xr)) * inv
      }
    }

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const padL = 46
      const padR = 14
      const padT = 14
      const padB = 28
      const plotW = W - padL - padR
      const plotH = H - padT - padB
      const top = 1 // log10 residual upper
      const bot = -10 // log10 residual lower
      const X = (k: number) => padL + (k / MAX_SWEEPS) * plotW
      const Y = (lr: number) => padT + (1 - (lr - bot) / (top - bot)) * plotH

      ctx.clearRect(0, 0, W, H)
      // grid
      ctx.strokeStyle = 'rgba(120,144,168,0.16)'
      ctx.lineWidth = 1
      for (let e = top; e >= bot; e -= 2) {
        ctx.beginPath(); ctx.moveTo(padL, Y(e)); ctx.lineTo(padL + plotW, Y(e)); ctx.stroke()
        ctx.fillStyle = 'rgba(122,144,168,0.9)'
        ctx.font = '10px sans-serif'
        ctx.fillText(`1e${e}`, 6, Y(e) + 3)
      }
      ctx.fillStyle = 'rgba(122,144,168,0.95)'
      ctx.font = '11px sans-serif'
      ctx.fillText('sweeps →', padL + plotW - 56, padT + plotH + 18)
      ctx.fillText('‖residual‖', padL + 4, padT + 10)

      // residual curve
      const hist = histRef.current
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      hist.forEach((r, k) => {
        const lr = Math.log10(Math.max(r, 1e-12))
        const px = X(k)
        const py = Y(lr)
        if (k === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
      hist.forEach((r, k) => {
        const lr = Math.log10(Math.max(r, 1e-12))
        ctx.fillStyle = '#22d3ee'
        ctx.beginPath(); ctx.arc(X(k), Y(lr), 2, 0, Math.PI * 2); ctx.fill()
      })

      // readout
      const last = hist.length ? hist[hist.length - 1] : NaN
      ctx.fillStyle = 'rgba(226,232,240,0.92)'
      ctx.font = '12px sans-serif'
      ctx.fillText(
        `sweep ${sweepRef.current}/${MAX_SWEEPS}   ‖r‖ = ${Number.isFinite(last) ? last.toExponential(2) : '—'}`,
        padL + 8, padT + 14,
      )
    }

    const tick = () => {
      if (running && sweepRef.current < MAX_SWEEPS) {
        if (histRef.current.length === 0) histRef.current.push(residual())
        oneSweep()
        sweepRef.current += 1
        histRef.current.push(residual())
      }
      draw()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [d, n, running])

  const reset = () => {
    xRef.current = new Float64Array(n)
    histRef.current = []
    sweepRef.current = 0
    setRunning(true)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={620} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text)' }}
        >
          {running ? 'Pause' : 'Run'}
        </button>
        <button
          onClick={reset}
          style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text)' }}
        >
          Reset
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 124 }}>diffusion # d = {d.toFixed(1)}</span>
          <input type="range" min={0.5} max={40} step={0.5} value={d} onChange={(e) => setD(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 64 }}>N = {n}</span>
          <input type="range" min={16} max={80} step={4} value={n} onChange={(e) => setN(parseInt(e.target.value))} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 2px 0' }}>
        Each sweep is one forward + one backward Gauss-Seidel pass. At d ≈ 1 the residual drops ten orders in a handful
        of sweeps. Crank d up to 40 (a huge implicit Δt) and the same curve flattens — the matrix is stiffer, so LU-SGS
        needs more sweeps or a stronger preconditioner to keep up.
      </p>
    </div>
  )
}
