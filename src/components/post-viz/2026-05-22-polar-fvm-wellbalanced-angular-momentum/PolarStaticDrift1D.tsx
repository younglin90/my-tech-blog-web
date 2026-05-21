'use client'

import { useEffect, useRef, useState } from 'react'

type Scheme = 'naive' | 'wellbalanced'

export function PolarStaticDrift1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [scheme, setScheme] = useState<Scheme>('naive')
  const [nCells, setNCells] = useState(40)
  const [running, setRunning] = useState(true)
  const [step, setStep] = useState(0)

  const stateRef = useRef<{
    u: Float64Array
    history: Float64Array[]
  } | null>(null)

  useEffect(() => {
    stateRef.current = {
      u: new Float64Array(nCells),
      history: [],
    }
    setStep(0)
  }, [nCells, scheme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    let raf = 0
    let alive = true

    const rIn = 1.0
    const rOut = 4.0
    const P0 = 1.0
    const rho0 = 1.0
    const dr = (rOut - rIn) / nCells

    const rFace = (i: number) => rIn + i * dr
    const rCenter = (i: number) => rIn + (i + 0.5) * dr
    const Vcell = (i: number) => {
      const ra = rFace(i)
      const rb = rFace(i + 1)
      return (rb ** 3 - ra ** 3) / 3.0
    }
    const Sface = (i: number) => rFace(i) ** 2

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1422'
      ctx.fillRect(0, 0, W, H)

      const st = stateRef.current
      if (!st) return

      const padL = 44
      const padR = 12
      const padT = 16
      const padB = 28
      const plotW = W - padL - padR
      const plotH = H - padT - padB

      const yMax = 0.06
      const yMin = -0.06

      const xOf = (r: number) => padL + ((r - rIn) / (rOut - rIn)) * plotW
      const yOf = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH

      // axes
      ctx.strokeStyle = 'rgba(120, 144, 168, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, yOf(0))
      ctx.lineTo(W - padR, yOf(0))
      ctx.stroke()

      ctx.strokeStyle = 'rgba(120, 144, 168, 0.2)'
      for (let v = yMin; v <= yMax + 1e-9; v += 0.02) {
        ctx.beginPath()
        ctx.moveTo(padL, yOf(v))
        ctx.lineTo(W - padR, yOf(v))
        ctx.stroke()
      }

      // ticks
      ctx.fillStyle = 'rgba(180, 200, 220, 0.7)'
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.fillText('u_r', 6, padT + 8)
      ctx.fillText('+0.06', 6, yOf(0.06) + 4)
      ctx.fillText('0', 28, yOf(0) + 4)
      ctx.fillText('-0.06', 6, yOf(-0.06) + 4)
      ctx.fillText('r=' + rIn.toFixed(0), padL - 4, H - 8)
      ctx.fillText('r=' + rOut.toFixed(0), W - padR - 20, H - 8)

      // velocity profile
      ctx.strokeStyle = scheme === 'naive' ? '#f87171' : '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < nCells; i++) {
        const r = rCenter(i)
        const v = st.u[i]
        const x = xOf(r)
        const y = yOf(Math.max(yMin, Math.min(yMax, v)))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // legend
      ctx.fillStyle = scheme === 'naive' ? '#f87171' : '#22d3ee'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(
        scheme === 'naive' ? 'naive (2P/r · V)' : 'well-balanced (P · ΔSr)',
        padL + 6,
        padT + 12,
      )
      ctx.fillStyle = 'rgba(180, 200, 220, 0.7)'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText(`step ${step}`, W - padR - 60, padT + 12)
    }

    const physicsStep = () => {
      const st = stateRef.current
      if (!st) return
      // CFL-ish dt
      const c0 = Math.sqrt(1.4 * P0 / rho0)
      const dt = 0.4 * dr / c0

      // pressure source for radial momentum (others omitted: P, rho stay constant
      // because we only track the residual drift from source-term imbalance).
      const newU = new Float64Array(nCells)
      for (let i = 0; i < nCells; i++) {
        const ri = rCenter(i)
        const V = Vcell(i)
        let src = 0
        if (scheme === 'naive') {
          // naive: source = 2 P / r * V
          src = (2 * P0 / ri) * V
        } else {
          // well-balanced: source = P * (S_{i+1/2} - S_{i-1/2})
          src = P0 * (Sface(i + 1) - Sface(i))
        }
        // pressure-gradient flux divergence (zero since P is uniform)
        // momentum update: d(rho u V)/dt = -div(F) + src - P (S+ - S-)
        // For constant P, the "physical" pressure-gradient flux gives P (S+ - S-).
        // Net cell-rate (rho u V)' = src_naive - P(S+ - S-) (naive misses cancellation)
        const cancel = P0 * (Sface(i + 1) - Sface(i))
        const residual = src - cancel
        const du = (dt / (rho0 * V)) * residual
        newU[i] = st.u[i] + du
      }
      st.u = newU
      setStep((s) => s + 1)
    }

    let last = performance.now()
    const loop = (now: number) => {
      if (!alive) return
      if (running && now - last > 33) {
        physicsStep()
        last = now
      }
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [running, scheme, nCells, step])

  const reset = () => {
    if (stateRef.current) {
      stateRef.current.u = new Float64Array(nCells)
    }
    setStep(0)
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
        margin: '16px 0',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 260, display: 'block', borderRadius: 6 }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>cells N = {nCells}</span>
          <input
            type="range"
            min={10}
            max={80}
            step={2}
            value={nCells}
            onChange={(e) => setNCells(parseInt(e.target.value))}
          />
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {(['naive', 'wellbalanced'] as Scheme[]).map((s) => (
            <button
              key={s}
              onClick={() => setScheme(s)}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: scheme === s ? 'var(--accent)' : 'transparent',
                color: scheme === s ? '#0b1422' : 'var(--text)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {s === 'naive' ? 'naive' : 'well-balanced'}
            </button>
          ))}
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {running ? 'pause' : 'play'}
          </button>
          <button
            onClick={reset}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            reset
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Initial state: P = 1, ρ = 1, u = 0 across r ∈ [1, 4]. The pressure flux
        through each spherical face is P · S<sub>r</sub>. The discrete source
        on the right-hand side should cancel it exactly. Toggle the scheme to
        see who fails.
      </p>
    </div>
  )
}
