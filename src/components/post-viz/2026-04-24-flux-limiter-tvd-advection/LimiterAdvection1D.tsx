'use client'

import { useEffect, useRef, useState } from 'react'

type LimName = 'donor' | 'lax-wendroff' | 'minmod' | 'superbee' | 'vanLeer' | 'MC'

const LIMITERS: LimName[] = ['donor', 'lax-wendroff', 'minmod', 'superbee', 'vanLeer', 'MC']

function limiterPhi(name: LimName, r: number): number {
  if (!isFinite(r)) return 0
  switch (name) {
    case 'donor':
      return 0
    case 'lax-wendroff':
      return 1
    case 'minmod':
      return Math.max(0, Math.min(1, r))
    case 'superbee':
      return Math.max(0, Math.min(2 * r, 1), Math.min(r, 2))
    case 'vanLeer':
      return (r + Math.abs(r)) / (1 + Math.abs(r))
    case 'MC':
      return Math.max(0, Math.min((1 + r) / 2, 2, 2 * r))
  }
}

function initialStepWave(N: number): Float64Array {
  const q = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = i / N
    q[i] = x > 0.2 && x < 0.4 ? 1 : 0
  }
  return q
}

function advectOneStep(q: Float64Array, cfl: number, lim: LimName): Float64Array {
  const N = q.length
  const pmod = (i: number) => ((i % N) + N) % N
  const flux = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const qLL = q[pmod(i - 2)]
    const qL = q[pmod(i - 1)]
    const qC = q[pmod(i)]
    const denom = qC - qL
    const num = qL - qLL
    const r = Math.abs(denom) > 1e-14 ? num / denom : 0
    const phiVal = limiterPhi(lim, r)
    flux[i] = qL + 0.5 * phiVal * (1 - cfl) * denom
  }
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    out[i] = q[i] - cfl * (flux[pmod(i + 1)] - flux[i])
  }
  return out
}

export function LimiterAdvection1D() {
  const N = 200
  const [limiter, setLimiter] = useState<LimName>('lax-wendroff')
  const [cfl, setCfl] = useState(0.5)
  const [steps, setSteps] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ q: Float64Array; steps: number }>({
    q: initialStepWave(N),
    steps: 0,
  })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = { q: initialStepWave(N), steps: 0 }
    setSteps(0)
  }, [limiter, cfl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    function draw(q: Float64Array, shift: number) {
      if (!ctx) return
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#223049'
      ctx.lineWidth = 1
      const baseY = H * 0.85
      ctx.beginPath()
      ctx.moveTo(0, baseY)
      ctx.lineTo(W, baseY)
      ctx.stroke()

      ctx.strokeStyle = '#22d3ee'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const xPhys = (i / N - shift + 1) % 1
        const val = xPhys > 0.2 && xPhys < 0.4 ? 1 : 0
        const X = (i / N) * W
        const Y = baseY - val * H * 0.7
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const X = (i / N) * W
        const Y = baseY - q[i] * H * 0.7
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('exact (dashed)  |  numerical (orange)', 10, 18)
    }

    let acc = 0
    let last = performance.now()
    const simStepMs = 16

    function loop(now: number) {
      const dt = now - last
      last = now
      acc += dt
      while (acc >= simStepMs) {
        stateRef.current.q = advectOneStep(stateRef.current.q, cfl, limiter)
        stateRef.current.steps += 1
        acc -= simStepMs
      }
      const shift = (stateRef.current.steps * cfl) / N
      draw(stateRef.current.q, shift)
      setSteps(stateRef.current.steps)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [limiter, cfl])

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: 'var(--surface)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={240}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
      />
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {LIMITERS.map((n) => (
          <button
            key={n}
            onClick={() => setLimiter(n)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: limiter === n ? 'var(--accent)' : 'transparent',
              color: limiter === n ? '#08111f' : 'var(--text)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--font-mono, ui-monospace), monospace',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>CFL</label>
        <input
          type="range"
          min={0.1}
          max={0.95}
          step={0.05}
          value={cfl}
          onChange={(e) => setCfl(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
          {cfl.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>steps: {steps}</span>
      </div>
    </div>
  )
}
