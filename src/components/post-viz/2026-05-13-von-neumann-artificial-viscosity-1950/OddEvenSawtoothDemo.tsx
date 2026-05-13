'use client'

import { useEffect, useRef, useState } from 'react'

const N = 32
const DX = 1.0 / N
const DT = 0.0008
const GAMMA = 1.4

type Mode = 'collocated' | 'staggered'

function initRho(): Float64Array {
  const rho = new Float64Array(N)
  for (let i = 0; i < N; i++) rho[i] = i % 2 === 0 ? 2.0 : 1.0
  return rho
}

function pressure(rho: number): number {
  return rho
}

function stepCollocated(rho: Float64Array, mom: Float64Array) {
  const flux = new Float64Array(N + 1)
  for (let i = 0; i <= N; i++) {
    const iL = (i - 1 + N) % N
    const iR = i % N
    flux[i] = 0.5 * (pressure(rho[iL]) + pressure(rho[iR]))
  }
  for (let i = 0; i < N; i++) {
    mom[i] -= (DT / DX) * (flux[i + 1] - flux[i])
  }
  const massFlux = new Float64Array(N + 1)
  for (let i = 0; i <= N; i++) {
    const iL = (i - 1 + N) % N
    const iR = i % N
    massFlux[i] = 0.5 * (mom[iL] + mom[iR])
  }
  for (let i = 0; i < N; i++) {
    rho[i] -= (DT / DX) * (massFlux[i + 1] - massFlux[i])
    if (rho[i] < 0.01) rho[i] = 0.01
  }
}

function stepStaggered(rho: Float64Array, momFace: Float64Array) {
  for (let i = 0; i < N; i++) {
    const iL = i
    const iR = (i + 1) % N
    const dp = pressure(rho[iR]) - pressure(rho[iL])
    momFace[i] -= (DT / DX) * dp
  }
  for (let i = 0; i < N; i++) {
    const iL = (i - 1 + N) % N
    rho[i] -= (DT / DX) * (momFace[i] - momFace[iL])
    if (rho[i] < 0.01) rho[i] = 0.01
  }
}

export function OddEvenSawtoothDemo() {
  const [mode, setMode] = useState<Mode>('collocated')
  const [t, setT] = useState(0)
  const [running, setRunning] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rhoRef = useRef(initRho())
  const momCellRef = useRef(new Float64Array(N))
  const momFaceRef = useRef(new Float64Array(N))
  const modeRef = useRef(mode)
  const tRef = useRef(0)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const reset = () => {
    rhoRef.current = initRho()
    momCellRef.current = new Float64Array(N)
    momFaceRef.current = new Float64Array(N)
    tRef.current = 0
    setT(0)
  }

  useEffect(() => {
    if (!running) return
    let raf = 0
    const tick = () => {
      for (let k = 0; k < 4; k++) {
        if (modeRef.current === 'collocated') {
          stepCollocated(rhoRef.current, momCellRef.current)
        } else {
          stepStaggered(rhoRef.current, momFaceRef.current)
        }
        tRef.current += DT
      }
      setT(tRef.current)
      draw()
      if (tRef.current < 1.5) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, t === 0])

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width
    const H = c.height
    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)
    const rho = rhoRef.current
    const barW = (W - 40) / N
    ctx.fillStyle = '#22d3ee'
    for (let i = 0; i < N; i++) {
      const h = (rho[i] / 2.5) * (H - 60)
      ctx.fillRect(20 + i * barW, H - 30 - h, barW - 2, h)
    }
    ctx.strokeStyle = '#475569'
    ctx.beginPath()
    ctx.moveTo(20, H - 30)
    ctx.lineTo(W - 20, H - 30)
    ctx.stroke()
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px system-ui'
    ctx.fillText('ρ (sawtooth, expecting smoothing)', 24, 18)
    ctx.fillText(`mode = ${mode}    t = ${t.toFixed(2)}`, W - 220, 18)
    const equilibrium = rho.reduce((a, b) => a + b, 0) / N
    const maxDev = Math.max(...Array.from(rho).map((r) => Math.abs(r - equilibrium)))
    ctx.fillStyle = '#f59e0b'
    ctx.fillText(`max |ρ - ρ̄| = ${maxDev.toFixed(3)}`, 24, H - 8)
  }

  useEffect(() => {
    draw()
  })

  return (
    <div style={{ background: '#0e1a2e', padding: 16, borderRadius: 8, margin: '24px 0' }}>
      <canvas ref={canvasRef} width={680} height={220} style={{ width: '100%', display: 'block' }} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap', color: '#cbd5e1', fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => {
              setMode('collocated')
              reset()
            }}
            style={{
              padding: '6px 12px',
              background: mode === 'collocated' ? '#22d3ee' : 'transparent',
              color: mode === 'collocated' ? '#08111f' : '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            collocated
          </button>
          <button
            onClick={() => {
              setMode('staggered')
              reset()
            }}
            style={{
              padding: '6px 12px',
              background: mode === 'staggered' ? '#22d3ee' : 'transparent',
              color: mode === 'staggered' ? '#08111f' : '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            staggered
          </button>
        </div>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '6px 14px', background: '#22d3ee', color: '#08111f', border: 0, borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
          {running ? 'pause' : 'play'}
        </button>
        <button onClick={reset} style={{ padding: '6px 14px', background: 'transparent', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }}>
          reset
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        Initial: ρ alternates 1↔2 (isothermal, p=ρ). Collocated: ∂p/∂x at cell center cancels — sawtooth survives. Staggered: face gradient sees the jump and damps it.
      </div>
    </div>
  )
}
