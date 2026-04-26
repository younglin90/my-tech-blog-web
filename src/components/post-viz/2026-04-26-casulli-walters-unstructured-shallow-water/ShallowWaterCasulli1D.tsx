'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const N = 120
const L = 1.0
const DX = L / N
const G = 9.81
const H0 = 1.0
const C = Math.sqrt(G * H0)
const DT_EXPLICIT_LIMIT = DX / C
const MAX_T = 0.6

type Field = Float64Array

function makeInitial(): { eta: Field; u: Field } {
  const eta = new Float64Array(N)
  const u = new Float64Array(N + 1)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * DX
    eta[i] = 0.05 * Math.exp(-((x - 0.3) ** 2) / 0.005)
  }
  return { eta, u }
}

function thomasSolve(a: Field, b: Field, c: Field, d: Field): Field {
  const n = d.length
  const cp = new Float64Array(n)
  const dp = new Float64Array(n)
  cp[0] = c[0] / b[0]
  dp[0] = d[0] / b[0]
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1]
    cp[i] = c[i] / m
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m
  }
  const x = new Float64Array(n)
  x[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) {
    x[i] = dp[i] - cp[i] * x[i + 1]
  }
  return x
}

function explicitStep(eta: Field, u: Field, dt: number): { eta: Field; u: Field } {
  const newU = new Float64Array(N + 1)
  const newEta = new Float64Array(N)
  for (let j = 1; j < N; j++) {
    newU[j] = u[j] - G * (dt / DX) * (eta[j] - eta[j - 1])
  }
  newU[0] = 0
  newU[N] = 0
  for (let i = 0; i < N; i++) {
    newEta[i] = eta[i] - H0 * (dt / DX) * (newU[i + 1] - newU[i])
  }
  return { eta: newEta, u: newU }
}

function casulliStep(
  eta: Field,
  u: Field,
  dt: number,
  theta: number,
): { eta: Field; u: Field } {
  const k = (G * H0 * dt * dt * theta * theta) / (DX * DX)
  const alpha = (H0 * dt) / DX

  const G_face = new Float64Array(N + 1)
  for (let j = 1; j < N; j++) {
    G_face[j] = u[j] - G * (dt / DX) * (1 - theta) * (eta[j] - eta[j - 1])
  }
  G_face[0] = 0
  G_face[N] = 0

  const a = new Float64Array(N)
  const b = new Float64Array(N)
  const c = new Float64Array(N)
  const r = new Float64Array(N)

  for (let i = 0; i < N; i++) {
    const hasLeft = i > 0
    const hasRight = i < N - 1
    let diag = 1
    if (hasLeft) diag += k
    if (hasRight) diag += k
    b[i] = diag
    a[i] = hasLeft ? -k : 0
    c[i] = hasRight ? -k : 0

    let rhs = eta[i]
    rhs -= alpha * theta * (G_face[i + 1] - G_face[i])
    rhs -= alpha * (1 - theta) * (u[i + 1] - u[i])
    r[i] = rhs
  }

  const newEta = thomasSolve(a, b, c, r)
  const newU = new Float64Array(N + 1)
  for (let j = 1; j < N; j++) {
    newU[j] =
      u[j] -
      G *
        (dt / DX) *
        (theta * (newEta[j] - newEta[j - 1]) + (1 - theta) * (eta[j] - eta[j - 1]))
  }
  newU[0] = 0
  newU[N] = 0
  return { eta: newEta, u: newU }
}

function maxAbs(arr: Field): number {
  let m = 0
  for (let i = 0; i < arr.length; i++) {
    const v = Math.abs(arr[i])
    if (v > m) m = v
  }
  return m
}

export function ShallowWaterCasulli1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cfl, setCfl] = useState(2.0)
  const [theta, setTheta] = useState(0.6)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  const dt = useMemo(() => cfl * DT_EXPLICIT_LIMIT, [cfl])

  const stateRef = useRef<{
    expl: { eta: Field; u: Field; blown: boolean }
    semi: { eta: Field; u: Field }
    t: number
  } | null>(null)

  if (stateRef.current === null) {
    const init = makeInitial()
    stateRef.current = {
      expl: { eta: init.eta.slice(), u: init.u.slice(), blown: false },
      semi: makeInitial(),
      t: 0,
    }
  }

  useEffect(() => {
    const init = makeInitial()
    stateRef.current = {
      expl: { eta: init.eta.slice(), u: init.u.slice(), blown: false },
      semi: makeInitial(),
      t: 0,
    }
  }, [resetKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0

    function draw() {
      if (!ctx) return
      const s = stateRef.current
      if (!s) return
      if (running && s.t < MAX_T) {
        const subSteps = Math.max(1, Math.ceil(0.005 / dt))
        for (let kk = 0; kk < subSteps; kk++) {
          if (!s.expl.blown) {
            const next = explicitStep(s.expl.eta, s.expl.u, dt)
            s.expl.eta = next.eta
            s.expl.u = next.u
            if (maxAbs(s.expl.eta) > 5) s.expl.blown = true
          }
          const nextS = casulliStep(s.semi.eta, s.semi.u, dt, theta)
          s.semi.eta = nextS.eta
          s.semi.u = nextS.u
          s.t += dt
          if (s.t >= MAX_T) break
        }
      }

      const w = canvas!.width
      const h = canvas!.height
      ctx.clearRect(0, 0, w, h)

      const styles = getComputedStyle(canvas!)
      const accent = styles.getPropertyValue('--accent').trim() || '#22d3ee'
      const text = styles.getPropertyValue('--text').trim() || '#e2e8f0'
      const muted = styles.getPropertyValue('--text-muted').trim() || '#7a90a8'
      const surface = styles.getPropertyValue('--surface').trim() || '#0f1b2d'

      const padL = 50
      const padR = 16
      const padT = 24
      const padB = 32
      const plotW = w - padL - padR
      const plotH = h - padT - padB

      ctx.strokeStyle = muted
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, padT + plotH / 2)
      ctx.lineTo(padL + plotW, padT + plotH / 2)
      ctx.stroke()

      ctx.fillStyle = muted
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('η = 0', 8, padT + plotH / 2 + 4)
      ctx.fillText('η', 8, padT + 8)
      ctx.fillText('+0.1', 8, padT + plotH * 0.25 + 4)
      ctx.fillText('-0.1', 8, padT + plotH * 0.75 + 4)
      ctx.fillText('x', padL + plotW - 8, padT + plotH + 14)

      const yMax = 0.12
      const xs = (i: number) => padL + ((i + 0.5) / N) * plotW
      const ys = (v: number) => padT + plotH / 2 - (v / yMax) * (plotH / 2)

      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const v = s.expl.blown ? Math.sign(s.expl.eta[i]) * yMax : s.expl.eta[i]
        const y = ys(Math.max(-yMax, Math.min(yMax, v)))
        if (i === 0) ctx.moveTo(xs(i), y)
        else ctx.lineTo(xs(i), y)
      }
      ctx.stroke()

      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const v = s.semi.eta[i]
        const y = ys(Math.max(-yMax, Math.min(yMax, v)))
        if (i === 0) ctx.moveTo(xs(i), y)
        else ctx.lineTo(xs(i), y)
      }
      ctx.stroke()

      ctx.fillStyle = surface
      ctx.fillRect(padL + plotW - 200, padT + 4, 196, 44)
      ctx.fillStyle = text
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(`t = ${s.t.toFixed(3)} s`, padL + plotW - 192, padT + 20)
      ctx.fillText(`CFL = c·Δt/Δx = ${cfl.toFixed(2)}`, padL + plotW - 192, padT + 38)

      const legY = padT + plotH - 18
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(padL + 8, legY, 18, 3)
      ctx.fillStyle = text
      ctx.fillText(s.expl.blown ? 'Explicit (BLOWN UP)' : 'Explicit', padL + 32, legY + 6)
      ctx.fillStyle = accent
      ctx.fillRect(padL + 160, legY, 18, 3)
      ctx.fillStyle = text
      ctx.fillText('Semi-implicit (Casulli)', padL + 184, legY + 6)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [cfl, theta, running, dt])

  return (
    <div
      style={{
        border: '1px solid var(--border, #1e293b)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface, #0f1b2d)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={680}
        height={300}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <label style={{ fontSize: 13, color: 'var(--text)' }}>
          CFL ratio (Δt / Δt<sub>explicit</sub>): <strong>{cfl.toFixed(2)}</strong>
          <input
            type="range"
            min="0.1"
            max="6"
            step="0.05"
            value={cfl}
            onChange={(e) => setCfl(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontSize: 13, color: 'var(--text)' }}>
          θ (implicitness): <strong>{theta.toFixed(2)}</strong>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={theta}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--border, #1e293b)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => {
            setResetKey((k) => k + 1)
            setRunning(true)
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--border, #1e293b)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Reset
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
          CFL &gt; 1 ⇒ explicit blows up; semi-implicit stays bounded for any CFL when θ ≥ 1/2.
        </span>
      </div>
    </div>
  )
}
