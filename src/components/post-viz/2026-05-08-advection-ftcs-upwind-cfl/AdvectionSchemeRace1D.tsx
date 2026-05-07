'use client'

import { useEffect, useRef, useState } from 'react'

const N = 160
const DX = 1.0 / N
const U = 1.0
const COLOR_FTCS = '#ef4444'
const COLOR_UPWIND = '#22d3ee'
const COLOR_LW = '#fb923c'
const COLOR_REF = 'rgba(248,250,252,0.55)'

type State = {
  ftcs: Float64Array
  upwind: Float64Array
  lw: Float64Array
  step: number
  shift: number
}

function topHat(): Float64Array {
  const q = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    q[i] = x > 0.2 && x < 0.4 ? 1 : 0
  }
  return q
}

function makeState(): State {
  return { ftcs: topHat(), upwind: topHat(), lw: topHat(), step: 0, shift: 0 }
}

function ftcsStep(q: Float64Array, c: number) {
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const ip = (i + 1) % N
    const im = (i - 1 + N) % N
    out[i] = q[i] - c * 0.5 * (q[ip] - q[im])
  }
  return out
}

function upwindStep(q: Float64Array, c: number) {
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N
    out[i] = q[i] - c * (q[i] - q[im])
  }
  return out
}

function laxWendroffStep(q: Float64Array, c: number) {
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const ip = (i + 1) % N
    const im = (i - 1 + N) % N
    out[i] = q[i] - 0.5 * c * (q[ip] - q[im]) + 0.5 * c * c * (q[ip] - 2 * q[i] + q[im])
  }
  return out
}

function clamp(v: number, lo: number, hi: number) {
  if (!isFinite(v)) return lo
  return Math.max(lo, Math.min(hi, v))
}

function refShifted(shift: number): Float64Array {
  const q = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = ((i + 0.5) * DX - shift + 1) % 1
    q[i] = x > 0.2 && x < 0.4 ? 1 : 0
  }
  return q
}

export function AdvectionSchemeRace1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<State>(makeState())
  const [cfl, setCfl] = useState(0.8)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const FRAME_DT = 1 / 60

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (running) {
        acc += dt
        const stepDt = 1 / 240
        while (acc > stepDt) {
          const s = stateRef.current
          const c = cfl
          s.ftcs = ftcsStep(s.ftcs, c)
          s.upwind = upwindStep(s.upwind, c)
          s.lw = laxWendroffStep(s.lw, c)
          s.step += 1
          s.shift = (s.shift + (c * DX)) % 1
          acc -= stepDt
        }
      }
      draw(canvasRef.current, stateRef.current, cfl)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, cfl])

  const reset = () => {
    stateRef.current = makeState()
  }

  const single = (fn: (q: Float64Array, c: number) => Float64Array) => () => {
    const s = stateRef.current
    s.ftcs = ftcsStep(s.ftcs, cfl)
    s.upwind = upwindStep(s.upwind, cfl)
    s.lw = laxWendroffStep(s.lw, cfl)
    s.step += 1
    s.shift = (s.shift + cfl * DX) % 1
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={760}
        height={360}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 240px' }}>
          <span style={{ marginBottom: 4 }}>CFL number c = u·dt / dx: <strong>{cfl.toFixed(2)}</strong></span>
          <input
            type="range"
            min={0.05}
            max={1.5}
            step={0.05}
            value={cfl}
            onChange={(e) => setCfl(parseFloat(e.target.value))}
          />
        </label>
        <button onClick={() => setRunning((r) => !r)} style={btn}>
          {running ? 'Pause' : 'Play'}
        </button>
        <button onClick={reset} style={btn}>Reset</button>
        <button
          onClick={() => {
            const s = stateRef.current
            s.ftcs = ftcsStep(s.ftcs, cfl)
            s.upwind = upwindStep(s.upwind, cfl)
            s.lw = laxWendroffStep(s.lw, cfl)
            s.step += 1
            s.shift = (s.shift + cfl * DX) % 1
          }}
          style={btn}
        >
          Step +1
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, fontSize: 12 }}>
        <Tag color={COLOR_FTCS}>centered (FTCS)</Tag>
        <Tag color={COLOR_UPWIND}>1st-order upwind</Tag>
        <Tag color={COLOR_LW}>Lax–Wendroff</Tag>
        <Tag color={COLOR_REF}>analytic shift</Tag>
        <span style={{ color: 'var(--text-muted)' }}>
          {cfl > 1 ? 'CFL > 1 → all explicit schemes blow up' : cfl > 0.99 ? 'CFL = 1 → upwind exact, FTCS still unstable' : 'try CFL > 1 to break the safe zone'}
        </span>
      </div>
    </div>
  )
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-block', width: 14, height: 3, background: color, borderRadius: 2 }} />
      {children}
    </span>
  )
}

const btn: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  cursor: 'pointer',
}

function draw(canvas: HTMLCanvasElement | null, s: State, cfl: number) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width
  const H = canvas.height
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, W, H)

  const padL = 40
  const padR = 14
  const padT = 14
  const padB = 32
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  ctx.strokeStyle = 'rgba(148,163,184,0.15)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    const x = padL + (i / 10) * plotW
    ctx.beginPath()
    ctx.moveTo(x, padT)
    ctx.lineTo(x, padT + plotH)
    ctx.stroke()
  }
  for (let j = 0; j <= 4; j++) {
    const y = padT + (j / 4) * plotH
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(padL + plotW, y)
    ctx.stroke()
  }

  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px ui-sans-serif, system-ui'
  ctx.fillText('1.5', 10, padT + 8)
  ctx.fillText('0', 22, padT + plotH * 0.75 + 4)
  ctx.fillText('-0.5', 6, padT + plotH + 4)

  const yAxis = (q: number) => padT + plotH * (1 - (clamp(q, -0.5, 1.5) + 0.5) / 2.0)

  const ref = refShifted(s.shift)
  ctx.strokeStyle = COLOR_REF
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = padL + (i / (N - 1)) * plotW
    const y = yAxis(ref[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  drawCurve(ctx, s.lw, COLOR_LW, padL, plotW, yAxis, 2)
  drawCurve(ctx, s.upwind, COLOR_UPWIND, padL, plotW, yAxis, 2.4)
  drawCurve(ctx, s.ftcs, COLOR_FTCS, padL, plotW, yAxis, 2)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText(`step = ${s.step}`, padL + 4, padT + plotH + 22)
  ctx.fillText(`CFL c = ${cfl.toFixed(2)}`, padL + 110, padT + plotH + 22)
  const blewFtcs = !isFinite(s.ftcs[0]) || s.ftcs.some((v) => Math.abs(v) > 5)
  if (blewFtcs) {
    ctx.fillStyle = '#ef4444'
    ctx.fillText('FTCS diverging — values clipped to ±0.5..1.5 for display', padL + 240, padT + plotH + 22)
  }
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  q: Float64Array,
  color: string,
  padL: number,
  plotW: number,
  yAxis: (v: number) => number,
  width: number,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = padL + (i / (N - 1)) * plotW
    const y = yAxis(q[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}
