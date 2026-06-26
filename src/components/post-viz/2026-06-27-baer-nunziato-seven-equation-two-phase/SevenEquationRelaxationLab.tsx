'use client'

import { useEffect, useRef, useState } from 'react'

// Baer-Nunziato relaxation operator demo.
// Two phases start out of mechanical equilibrium (different pressures and
// velocities). Pressure relaxation drives the volume fraction until p1 = p2;
// velocity relaxation drives both phases to a common (mass-weighted) velocity.
// Both are linearized exponential relaxations — the qualitative behaviour of
// the stiff source terms in the seven-equation model.

type Trace = { t: number; p1: number; p2: number; u1: number; u2: number; alpha: number }

const TOTAL_T = 1.0 // ms of physical relaxation shown
const STEPS = 600
const M1 = 0.7 // mass fraction of phase 1 (for velocity averaging)
const M2 = 0.3
const K1 = 1.4 // effective pressure stiffness of phase 1 vs volume fraction
const K2 = 2.6 // effective pressure stiffness of phase 2

function simulate(mu: number, lambda: number, dP0: number, dU0: number): Trace[] {
  // Pressure block: p1 = p1e - K1*(a-ae), p2 = p2e + K2*(a-ae)
  // start gap dP0 = p1 - p2 at a = ae => offset volume fraction by da0
  const ae = 0.5
  const da0 = dP0 / (K1 + K2) // initial volume-fraction offset producing the gap
  let a = ae + da0
  let u1 = 1.0 + 0.5 * dU0
  let u2 = 1.0 - 0.5 * dU0
  const uMix = M1 * u1 + M2 * u2 // conserved mixture momentum / mass
  const dt = TOTAL_T / STEPS
  const out: Trace[] = []
  for (let i = 0; i <= STEPS; i++) {
    const p1 = 2.0 - K1 * (a - ae)
    const p2 = 2.0 + K2 * (a - ae)
    out.push({ t: i * dt, p1, p2, u1, u2, alpha: a })
    // pressure relaxation: da/dt = mu * (p1 - p2)
    a += dt * mu * (p1 - p2)
    // velocity relaxation toward mass-weighted mean (momentum conserving)
    const du = u1 - u2
    u1 += dt * (-lambda * M2 * du)
    u2 += dt * (lambda * M1 * du)
    // keep mixture momentum pinned against round-off
    const cur = M1 * u1 + M2 * u2
    const corr = uMix - cur
    u1 += corr
    u2 += corr
  }
  return out
}

export function SevenEquationRelaxationLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const [mu, setMu] = useState(18)
  const [lambda, setLambda] = useState(14)
  const [dP0, setDP0] = useState(1.6)
  const [dU0, setDU0] = useState(0.8)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(1)

  const traces = simulate(mu, lambda, dP0, dU0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = 640
    const H = 360
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const draw = (frac: number) => {
      const idx = Math.max(1, Math.floor(frac * STEPS))
      ctx.clearRect(0, 0, W, H)
      // panel layout: top = pressure, bottom = velocity
      const pad = 44
      const panelH = (H - 3 * pad) / 2 + pad / 2
      const plotW = W - 2 * pad

      const drawPanel = (
        y0: number,
        title: string,
        a: number[],
        b: number[],
        labelA: string,
        labelB: string,
        colA: string,
        colB: string,
        unit: string,
      ) => {
        let lo = Infinity
        let hi = -Infinity
        for (const v of [...a, ...b]) {
          if (v < lo) lo = v
          if (v > hi) hi = v
        }
        const span = hi - lo || 1
        lo -= span * 0.15
        hi += span * 0.15
        const xOf = (i: number) => pad + (i / STEPS) * plotW
        const yOf = (v: number) => y0 + panelH - ((v - lo) / (hi - lo)) * panelH

        // axes
        ctx.strokeStyle = 'rgba(122,144,168,0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pad, y0)
        ctx.lineTo(pad, y0 + panelH)
        ctx.lineTo(pad + plotW, y0 + panelH)
        ctx.stroke()

        ctx.fillStyle = '#7a90a8'
        ctx.font = '12px system-ui, sans-serif'
        ctx.fillText(title, pad, y0 - 8)
        ctx.fillText(unit, pad - 38, y0 + 10)

        const line = (arr: number[], col: string) => {
          ctx.strokeStyle = col
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = 0; i <= idx; i++) {
            const x = xOf(i)
            const yy = yOf(arr[i])
            if (i === 0) ctx.moveTo(x, yy)
            else ctx.lineTo(x, yy)
          }
          ctx.stroke()
          // moving dot
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(xOf(idx), yOf(arr[idx]), 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
        line(a, colA)
        line(b, colB)

        // legend
        ctx.font = '12px system-ui, sans-serif'
        ctx.fillStyle = colA
        ctx.fillText(labelA, pad + plotW - 150, y0 + 4)
        ctx.fillStyle = colB
        ctx.fillText(labelB, pad + plotW - 70, y0 + 4)
      }

      drawPanel(
        pad - 8,
        'Pressure relaxation  (p1 ↔ p2)',
        traces.map((t) => t.p1),
        traces.map((t) => t.p2),
        'p1',
        'p2',
        '#22d3ee',
        '#f59e0b',
        'bar',
      )
      drawPanel(
        2 * pad + panelH - 8,
        'Velocity relaxation  (u1 ↔ u2)',
        traces.map((t) => t.u1),
        traces.map((t) => t.u2),
        'u1',
        'u2',
        '#22d3ee',
        '#f59e0b',
        'm/s',
      )

      // x-axis label
      ctx.fillStyle = '#7a90a8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('time →  (relaxation toward mechanical equilibrium)', pad, H - 6)
    }

    if (playing) {
      startRef.current = performance.now()
      const loop = (now: number) => {
        const frac = Math.min(1, (now - startRef.current) / 1600)
        setProgress(frac)
        draw(frac)
        if (frac < 1) {
          rafRef.current = requestAnimationFrame(loop)
        } else {
          setPlaying(false)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    } else {
      draw(progress)
    }
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mu, lambda, dP0, dU0, playing])

  const final = traces[traces.length - 1]
  const pGap = Math.abs(final.p1 - final.p2)
  const uGap = Math.abs(final.u1 - final.u2)

  const ctrl = (
    label: string,
    val: number,
    set: (v: number) => void,
    min: number,
    max: number,
    step: number,
    fmt: (v: number) => string,
  ) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
      <span style={{ color: '#7a90a8' }}>
        {label}: <strong style={{ color: '#cbd5e1' }}>{fmt(val)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => {
          set(parseFloat(e.target.value))
          setProgress(1)
        }}
        style={{ accentColor: '#22d3ee' }}
      />
    </label>
  )

  return (
    <div
      style={{
        border: '1px solid var(--border, #1e293b)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface, #0d1626)',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 640, height: 'auto' }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          marginTop: 14,
        }}
      >
        {ctrl('압력 완화율 μ', mu, setMu, 0, 60, 1, (v) => v.toFixed(0))}
        {ctrl('속도 완화율 λ', lambda, setLambda, 0, 60, 1, (v) => v.toFixed(0))}
        {ctrl('초기 압력차 Δp', dP0, setDP0, 0, 3, 0.1, (v) => v.toFixed(1))}
        {ctrl('초기 속도차 Δu', dU0, setDU0, 0, 2, 0.1, (v) => v.toFixed(1))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setProgress(0)
            setPlaying(true)
          }}
          style={{
            background: '#22d3ee',
            color: '#08111f',
            border: 'none',
            borderRadius: 8,
            padding: '7px 16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ▶ 완화 재생
        </button>
        <span style={{ fontSize: 12.5, color: '#7a90a8' }}>
          종료 시 압력차 <strong style={{ color: pGap < 0.02 ? '#22d3ee' : '#f59e0b' }}>{pGap.toFixed(3)}</strong> bar ·
          속도차 <strong style={{ color: uGap < 0.02 ? '#22d3ee' : '#f59e0b' }}>{uGap.toFixed(3)}</strong> m/s
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#7a90a8', marginTop: 8, marginBottom: 0 }}>
        μ·λ를 0으로 내리면 두 상은 영영 평형에 도달하지 못한다 — 이것이 7-방정식의 &ldquo;비평형&rdquo; 상태다.
      </p>
    </div>
  )
}
