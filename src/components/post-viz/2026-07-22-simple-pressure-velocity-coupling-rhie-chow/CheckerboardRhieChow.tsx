'use client'

import { useEffect, useRef, useState } from 'react'

// Odd-even pressure decoupling on a collocated grid, and how Rhie-Chow momentum
// interpolation cures it. We solve a 1-D periodic pressure problem  -p'' = f  by
// Gauss-Seidel, starting from a checkerboard-seeded guess.
//
//   Rhie-Chow face velocity  -> compact 3-point Laplacian:
//       2 p_i - p_{i-1} - p_{i+1} = f_i        (neighbors are coupled)
//   Naive linear interpolation -> wide, even/odd-decoupled stencil:
//       2 p_i - p_{i-2} - p_{i+2} = f_i        (checkerboard is invisible)
//
// The checkerboard mode (+,-,+,-,...) sits in the null space of the naive
// operator, so Gauss-Seidel never removes it. The compact operator sees the
// immediate neighbor pressure difference and damps it away.

function makeSource(N: number) {
  const f = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (2 * Math.PI * i) / N
    f[i] = Math.sin(x) + 0.4 * Math.sin(2 * x)
  }
  let m = 0
  for (let i = 0; i < N; i++) m += f[i]
  m /= N
  for (let i = 0; i < N; i++) f[i] -= m
  return f
}

function sweep(p: Float64Array, f: Float64Array, N: number, naive: boolean) {
  for (let i = 0; i < N; i++) {
    if (naive) {
      const ll = (i - 2 + N) % N
      const rr = (i + 2) % N
      p[i] = 0.5 * (p[ll] + p[rr] + f[i])
    } else {
      const l = (i - 1 + N) % N
      const r = (i + 1) % N
      p[i] = 0.5 * (p[l] + p[r] + f[i])
    }
  }
  // pressure is defined up to a constant on a periodic domain -> pin the mean
  let m = 0
  for (let i = 0; i < N; i++) m += p[i]
  m /= N
  for (let i = 0; i < N; i++) p[i] -= m
}

function checkerAmp(p: Float64Array, N: number) {
  let s = 0
  for (let i = 0; i < N; i++) s += p[i] * (i % 2 ? -1 : 1)
  return Math.abs(s) / N
}

export function CheckerboardRhieChow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [N, setN] = useState(32)
  const [naive, setNaive] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  // live readouts, updated from inside the animation loop
  const [sweeps, setSweeps] = useState(0)
  const [amp, setAmp] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const f = makeSource(N)

    // converged compact (Rhie-Chow) solution = the physically correct reference
    const ref = new Float64Array(N)
    for (let s = 0; s < 6000; s++) sweep(ref, f, N, false)
    let refMax = 1e-9
    for (let i = 0; i < N; i++) refMax = Math.max(refMax, Math.abs(ref[i]))

    const p = new Float64Array(N)
    for (let i = 0; i < N; i++) p[i] = (i % 2 ? 1 : -1) * 0.8 * refMax // checkerboard seed

    let count = 0
    let raf = 0
    const W = canvas.width
    const H = canvas.height

    const draw = () => {
      // a few sweeps per frame
      for (let s = 0; s < 2; s++) {
        sweep(p, f, N, naive)
        count++
      }

      ctx.fillStyle = '#111722'
      ctx.fillRect(0, 0, W, H)

      const padL = 40
      const padR = 12
      const padT = 16
      const padB = 26
      const plotW = W - padL - padR
      const plotH = H - padT - padB
      const y0 = padT + plotH / 2
      const yscale = (plotH / 2) * 0.9 / refMax

      // zero axis
      ctx.strokeStyle = '#2a3547'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, y0)
      ctx.lineTo(W - padR, y0)
      ctx.stroke()

      // reference smooth solution (line)
      ctx.strokeStyle = '#4a5568'
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = padL + ((i + 0.5) / N) * plotW
        const y = y0 - ref[i] * yscale
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // current pressure as bars
      const bw = (plotW / N) * 0.72
      for (let i = 0; i < N; i++) {
        const x = padL + ((i + 0.5) / N) * plotW
        const y = y0 - p[i] * yscale
        const h = Math.abs(y0 - y)
        ctx.fillStyle = p[i] >= 0 ? '#5aa9ff' : '#ff8a6b'
        ctx.fillRect(x - bw / 2, Math.min(y0, y), bw, h)
      }

      ctx.fillStyle = '#8b97a8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('p(x) over collocated cells (dashed = correct smooth field)', padL, H - 8)

      const a = checkerAmp(p, N)
      // throttle React state updates
      if (count % 6 === 0) {
        setSweeps(count)
        setAmp(a)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [N, naive, resetKey])

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 7,
    border: active ? '1px solid #5aa9ff' : '1px solid #33404f',
    background: active ? 'rgba(90,169,255,0.16)' : 'transparent',
    color: active ? '#bfe0ff' : '#9aa6b6',
    cursor: 'pointer',
    fontSize: 13,
  })

  const clean = amp < 1e-3

  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'system-ui, sans-serif' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 10, display: 'block' }}
      />
      <div style={{ marginTop: 8, fontSize: 13, color: clean ? '#6fd08c' : '#ffb27a' }}>
        {naive
          ? clean
            ? 'Naive interpolation happened to settle — nudge the grid to see the sawtooth return.'
            : `Naive linear interpolation — checkerboard amplitude ≈ ${amp.toFixed(3)} and it will not go away.`
          : `Rhie-Chow momentum interpolation — checkerboard amplitude ≈ ${amp.toExponential(1)}, damped to the smooth field.`}
        {'  '}(sweeps: {sweeps})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.7rem', fontSize: 13, color: '#c9d3e0', alignItems: 'center' }}>
        <button style={btn(naive)} onClick={() => setNaive(true)}>Naive interpolation</button>
        <button style={btn(!naive)} onClick={() => setNaive(false)}>Rhie-Chow</button>
        <button style={btn(false)} onClick={() => setResetKey((k) => k + 1)}>Reseed checkerboard</button>
        <label style={lab}>
          Cells N: {N}
          <input type="range" min={16} max={64} step={2} value={N} onChange={(e) => setN(+e.target.value)} />
        </label>
      </div>
    </div>
  )
}

const lab: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}
