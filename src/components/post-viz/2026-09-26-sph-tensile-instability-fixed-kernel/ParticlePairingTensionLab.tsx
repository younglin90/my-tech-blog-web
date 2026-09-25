'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const N = 48
const DX = 1
const L = N * DX
const RHO0 = 1
const EMOD = 1
const MASS = RHO0 * DX
const SEED = 1e-4

function splineW(q: number) {
  if (q >= 2) return 0
  if (q < 1) return (2 / 3) * (1 - 1.5 * q * q + 0.75 * q * q * q)
  const t = 2 - q
  return (2 / 3) * 0.25 * t * t * t
}

function splineDW(q: number) {
  if (q >= 2) return 0
  if (q < 1) return (2 / 3) * (-3 * q + 2.25 * q * q)
  const t = 2 - q
  return (2 / 3) * -0.75 * t * t
}

/** shortest periodic separation */
function wrap(d: number) {
  let r = d
  while (r > L / 2) r -= L
  while (r < -L / 2) r += L
  return r
}

type State = { u: Float64Array; v: Float64Array; rho: Float64Array; step: number; amp: number }

function freshState(): State {
  const u = new Float64Array(N)
  const v = new Float64Array(N)
  // seed the 2*dx pairing mode only — nothing else
  for (let i = 0; i < N; i++) u[i] = (i % 2 === 0 ? SEED : -SEED) * DX
  return { u, v, rho: new Float64Array(N).fill(RHO0), step: 0, amp: SEED }
}

/** kernel rebuilt from CURRENT positions: the Eulerian (classic) SPH form */
function eulerianAccel(u: Float64Array, h: number, sig0: number, rho: Float64Array, a: Float64Array) {
  const sig = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    let s = 0
    for (let j = 0; j < N; j++) {
      const d = wrap(i * DX + u[i] - (j * DX + u[j]))
      s += (MASS * splineW(Math.abs(d) / h)) / h
    }
    rho[i] = s
    sig[i] = sig0 + EMOD * (RHO0 / s - 1)
  }
  for (let i = 0; i < N; i++) {
    let acc = 0
    for (let j = 0; j < N; j++) {
      if (j === i) continue
      const d = wrap(i * DX + u[i] - (j * DX + u[j]))
      const dW = (splineDW(Math.abs(d) / h) / (h * h)) * Math.sign(d)
      acc += MASS * (sig[i] / (rho[i] * rho[i]) + sig[j] / (rho[j] * rho[j])) * dW
    }
    a[i] = acc
  }
}

/** kernel frozen on the INITIAL lattice: total-Lagrangian SPH */
function lagrangianAccel(
  u: Float64Array,
  dW0: Float64Array,
  sig0: number,
  rho: Float64Array,
  a: Float64Array
) {
  const P = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    let F = 1
    for (let j = 0; j < N; j++) F += (MASS / RHO0) * (u[j] - u[i]) * dW0[((j - i + N) % N)]
    P[i] = sig0 + EMOD * (F - 1)
    rho[i] = RHO0 / Math.max(F, 0.2)
  }
  for (let i = 0; i < N; i++) {
    let acc = 0
    for (let j = 0; j < N; j++) {
      if (j === i) continue
      acc += (MASS / (RHO0 * RHO0)) * (P[i] + P[j]) * dW0[((j - i + N) % N)]
    }
    a[i] = acc
  }
}

export function ParticlePairingTensionLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [sig0, setSig0] = useState(0.05)
  const [hfac, setHfac] = useState(1.2)
  const [frozen, setFrozen] = useState(false)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ step: 0, amp: SEED, saturated: false })

  const stateRef = useRef<State>(freshState())
  const traceRef = useRef<number[]>([])
  const satRef = useRef(false)

  // dW0 for the undeformed lattice, indexed by signed index offset (j - i)
  const dW0 = useMemo(() => {
    const t = new Float64Array(N)
    const h = hfac * DX
    for (let k = 0; k < N; k++) {
      const d = wrap(-k * DX) // x_i - x_j with j - i = k
      t[k] = k === 0 ? 0 : (splineDW(Math.abs(d) / h) / (h * h)) * Math.sign(d)
    }
    return t
  }, [hfac])

  const reset = useCallback(() => {
    stateRef.current = freshState()
    traceRef.current = []
    satRef.current = false
    setReadout({ step: 0, amp: SEED, saturated: false })
  }, [])

  useEffect(() => {
    reset()
  }, [sig0, hfac, frozen, reset])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const a = new Float64Array(N)
    const h = hfac * DX
    const dt = 0.08 * DX // c = sqrt(E/rho0) = 1

    const advance = () => {
      const st = stateRef.current
      for (let s = 0; s < 2; s++) {
        if (frozen) lagrangianAccel(st.u, dW0, sig0, st.rho, a)
        else eulerianAccel(st.u, h, sig0, st.rho, a)
        let peak = 0
        for (let i = 0; i < N; i++) {
          st.v[i] += dt * a[i]
          st.u[i] += dt * st.v[i]
          peak = Math.max(peak, Math.abs(st.u[i]))
        }
        st.step += 1
        st.amp = peak / DX
        if (st.step % 6 === 0) traceRef.current.push(st.amp)
        if (peak / DX > 0.55) {
          satRef.current = true
          return
        }
      }
    }

    const draw = () => {
      const W = cv.width
      const H = cv.height
      const st = stateRef.current
      ctx.fillStyle = '#0d1520'
      ctx.fillRect(0, 0, W, H)

      const left = 60
      const right = W - 24
      const rowY = 96
      const xOf = (p: number) => left + ((right - left) * (((p % L) + L) % L)) / L

      // header
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '600 14px ui-monospace, monospace'
      ctx.fillText(
        `${frozen ? 'total-Lagrangian kernel (frozen)' : 'Eulerian kernel (rebuilt each step)'}   sigma0/E = ${sig0 >= 0 ? '+' : ''}${sig0.toFixed(2)}   h/dx = ${hfac.toFixed(2)}`,
        left,
        30
      )
      ctx.fillStyle = sig0 > 0 ? '#fca5a5' : sig0 < 0 ? '#93c5fd' : '#94a3b8'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(sig0 > 0 ? 'TENSION' : sig0 < 0 ? 'COMPRESSION' : 'UNSTRESSED', left, 50)

      // lattice reference ticks
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      for (let i = 0; i < N; i++) {
        const x = xOf(i * DX)
        ctx.beginPath()
        ctx.moveTo(x, rowY - 20)
        ctx.lineTo(x, rowY + 20)
        ctx.stroke()
      }

      // particles, coloured by rho/rho0
      for (let i = 0; i < N; i++) {
        const x = xOf(i * DX + st.u[i])
        const rr = st.rho[i] / RHO0
        const hot = Math.max(-1, Math.min(1, (rr - 1) * 6))
        ctx.fillStyle =
          hot > 0
            ? `rgb(${Math.round(180 + 70 * hot)},${Math.round(110 - 60 * hot)},${Math.round(110 - 60 * hot)})`
            : `rgb(${Math.round(110 + 40 * hot)},${Math.round(150 - 20 * hot)},${Math.round(200 - 30 * hot)})`
        ctx.beginPath()
        ctx.arc(x, rowY, 6.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#64748b'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('particles (colour = rho/rho0: blue stretched, red packed)', left, rowY + 40)
      ctx.fillText('| = initial lattice site', right - 150, rowY + 40)

      // amplitude trace, log axis
      const gTop = 176
      const gBot = H - 34
      const lo = Math.log10(SEED / 3)
      const hi = Math.log10(1)
      const yOf = (v: number) =>
        gBot - ((gBot - gTop) * (Math.log10(Math.max(v, 1e-9)) - lo)) / (hi - lo)
      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      ctx.moveTo(left, gBot)
      ctx.lineTo(right, gBot)
      ctx.stroke()
      ctx.fillStyle = '#64748b'
      for (const gv of [1e-4, 1e-3, 1e-2, 1e-1, 1]) {
        const y = yOf(gv)
        ctx.strokeStyle = '#16212e'
        ctx.beginPath()
        ctx.moveTo(left, y)
        ctx.lineTo(right, y)
        ctx.stroke()
        ctx.fillText(gv.toExponential(0), 8, y + 4)
      }
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('max |u| / dx   vs   steps', left, gTop - 8)

      const tr = traceRef.current
      if (tr.length > 1) {
        ctx.strokeStyle = satRef.current ? '#f87171' : '#4ade80'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let k = 0; k < tr.length; k++) {
          const x = left + ((right - left) * k) / Math.max(tr.length - 1, 240)
          if (x > right) break
          const y = yOf(tr[k])
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      ctx.fillStyle = satRef.current ? '#fca5a5' : '#e2e8f0'
      ctx.font = '600 13px ui-monospace, monospace'
      ctx.fillText(
        satRef.current
          ? `step ${st.step}: pairing saturated, max |u| = ${st.amp.toFixed(3)} dx — press reset`
          : `step ${st.step}   max |u| / dx = ${st.amp.toExponential(2)}`,
        left,
        H - 12
      )
    }

    const loop = () => {
      if (running && !satRef.current) advance()
      draw()
      frame += 1
      if (frame % 12 === 0) {
        const st = stateRef.current
        setReadout({ step: st.step, amp: st.amp, saturated: satRef.current })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [sig0, hfac, frozen, running, dW0])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={340}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        <label>
          sigma0 / E = {sig0 >= 0 ? '+' : ''}
          {sig0.toFixed(2)}{' '}
          <input
            type="range"
            min={-0.1}
            max={0.2}
            step={0.01}
            value={sig0}
            onChange={(e) => setSig0(parseFloat(e.target.value))}
          />
        </label>
        <label>
          h / dx = {hfac.toFixed(2)}{' '}
          <input
            type="range"
            min={1}
            max={2}
            step={0.05}
            value={hfac}
            onChange={(e) => setHfac(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={frozen} onChange={(e) => setFrozen(e.target.checked)} />{' '}
          freeze kernel on initial lattice (TL-SPH)
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
        <button onClick={reset}>reset</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        48 particles on a periodic line, seeded with a 2dx zig-zag of amplitude 1e-4 dx and nothing
        else. Push sigma0 positive and the seed grows until neighbours collide into visible pairs;
        pull it negative and the same seed just sits there. The trace is logarithmic, so a straight
        rising line is exponential growth. Tick the checkbox to freeze the kernel on the initial
        lattice — the line goes flat at every sigma0, step {readout.step} included.
      </p>
    </div>
  )
}
