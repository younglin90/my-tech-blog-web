'use client'

import { useEffect, useRef, useState } from 'react'

// Solves inviscid Burgers  u_t + (u^2/2)_x = 0  through the Jin-Xin
// relaxation system:
//   u_t + v_x = 0
//   v_t + a^2 u_x = (f(u) - v) / eps
// In the stiff limit eps -> 0 the second equation forces v = f(u) and the
// original conservation law is recovered. The relaxation parameter `a` must
// satisfy the sub-characteristic condition a >= max|f'(u)| = max|u|.

const N = 200
const XMIN = -1
const XMAX = 1
const DX = (XMAX - XMIN) / N

function burgersFlux(u: number) {
  return 0.5 * u * u
}

type Preset = 'shock' | 'sine' | 'rarefaction'

function initialField(preset: Preset): Float64Array {
  const u = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = XMIN + (i + 0.5) * DX
    if (preset === 'shock') u[i] = x < 0 ? 1.0 : -0.4
    else if (preset === 'rarefaction') u[i] = x < 0 ? -0.6 : 0.9
    else u[i] = 0.5 * Math.sin(Math.PI * x) // sine
  }
  return u
}

export function JinXinRelaxationLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef<{ u: Float64Array; v: Float64Array; t: number } | null>(null)

  const [a, setA] = useState(1.3)
  const [logEps, setLogEps] = useState(-3) // eps = 10^logEps
  const [preset, setPreset] = useState<Preset>('shock')
  const [running, setRunning] = useState(true)
  const [maxU, setMaxU] = useState(1.0)

  // keep the animation loop reading the latest controls without restarting
  const paramRef = useRef({ a, logEps, running })
  paramRef.current = { a, logEps, running }

  function reset(p: Preset) {
    const u = initialField(p)
    const v = new Float64Array(N)
    for (let i = 0; i < N; i++) v[i] = burgersFlux(u[i]) // start on equilibrium
    stateRef.current = { u, v, t: 0 }
  }

  useEffect(() => {
    reset(preset)
  }, [preset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function step() {
      const st = stateRef.current
      const cv = canvasRef.current
      if (!st || !cv || !ctx) return
      const { a: aa, logEps: le, running: run } = paramRef.current
      const eps = Math.pow(10, le)

      if (run) {
        // sub-steps keep the CFL number a*dt/dx <= 0.9 comfortably
        const dt = (0.9 * DX) / aa
        for (let sub = 0; sub < 3; sub++) {
          const u = st.u
          const v = st.v
          // characteristic variables: r moves at +a, s moves at -a
          const r = new Float64Array(N)
          const s = new Float64Array(N)
          for (let i = 0; i < N; i++) {
            r[i] = 0.5 * (u[i] + v[i] / aa)
            s[i] = 0.5 * (u[i] - v[i] / aa)
          }
          const nu = (aa * dt) / DX
          const rn = new Float64Array(N)
          const sn = new Float64Array(N)
          for (let i = 0; i < N; i++) {
            const iL = i === 0 ? 0 : i - 1
            const iR = i === N - 1 ? N - 1 : i + 1
            rn[i] = r[i] - nu * (r[i] - r[iL]) // upwind, right-moving
            sn[i] = s[i] + nu * (s[iR] - s[i]) // upwind, left-moving
          }
          // reconstruct u, v then relax v -> f(u)
          const relax = eps > 1e-12 ? 1 - Math.exp(-dt / eps) : 1
          let mx = 0
          for (let i = 0; i < N; i++) {
            const ui = rn[i] + sn[i]
            let vi = aa * (rn[i] - sn[i])
            vi += (burgersFlux(ui) - vi) * relax
            u[i] = ui
            v[i] = vi
            if (Math.abs(ui) > mx) mx = Math.abs(ui)
          }
          st.t += dt
          if (mx > 6 || !Number.isFinite(mx)) {
            // blow-up guard when sub-characteristic condition is broken
            reset(preset)
            break
          }
        }
        let mm = 0
        for (let i = 0; i < N; i++) if (Math.abs(st.u[i]) > mm) mm = Math.abs(st.u[i])
        setMaxU(mm)
      }

      // ---- draw ----
      const W = cv.width
      const H = cv.height
      ctx.clearRect(0, 0, W, H)
      const bg = getComputedStyle(cv).getPropertyValue('color') || '#7a90a8'
      const pad = 28
      const plotW = W - 2 * pad
      const plotH = H - 2 * pad
      const uLo = -1.4
      const uHi = 1.4
      const xToPx = (i: number) => pad + (i / (N - 1)) * plotW
      const uToPx = (val: number) => pad + (1 - (val - uLo) / (uHi - uLo)) * plotH

      // axes
      ctx.strokeStyle = 'rgba(122,144,168,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad, uToPx(0))
      ctx.lineTo(W - pad, uToPx(0))
      ctx.stroke()

      // u(x)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const px = xToPx(i)
        const py = uToPx(st.u[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      // labels
      ctx.fillStyle = bg.trim() || '#7a90a8'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('u(x)', W - pad - 34, pad + 4)
      ctx.fillText(`t = ${st.t.toFixed(2)}`, pad + 4, pad + 4)

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [preset])

  const violated = a < maxU - 1e-6

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
        color: 'var(--text-muted)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={620}
        height={280}
        style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--text-muted)' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>
          relaxation speed a = <b style={{ color: violated ? '#f87171' : '#22d3ee' }}>{a.toFixed(2)}</b>
          <input
            type="range" min={0.3} max={2.5} step={0.05} value={a}
            onChange={(e) => setA(parseFloat(e.target.value))}
            style={{ display: 'block', width: 190 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          relaxation time ε = 1e{logEps}
          <input
            type="range" min={-5} max={0} step={1} value={logEps}
            onChange={(e) => setLogEps(parseInt(e.target.value))}
            style={{ display: 'block', width: 150 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['shock', 'rarefaction', 'sine'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid var(--border)',
                background: preset === p ? '#22d3ee' : 'transparent',
                color: preset === p ? '#08111f' : 'var(--text-muted)',
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)',
            }}
          >
            {running ? 'pause' : 'play'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>
        {violated ? (
          <span style={{ color: '#f87171' }}>
            a = {a.toFixed(2)} &lt; max|u| = {maxU.toFixed(2)} — sub-characteristic condition broken.
            The solution destabilizes and auto-resets.
          </span>
        ) : (
          <span>
            a = {a.toFixed(2)} ≥ max|u| = {maxU.toFixed(2)} — sub-characteristic condition satisfied.
            Smaller ε projects v onto f(u) faster (sharper shock, more relaxation diffusion trade-off).
          </span>
        )}
      </p>
    </div>
  )
}
