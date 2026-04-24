'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Stencils = {
  um2: number
  um1: number
  u0: number
  up1: number
  up2: number
  b0: number
  b1: number
  b2: number
}

function pmod(i: number, N: number): number {
  return ((i % N) + N) % N
}

function stencilData(u: Float64Array, i: number): Stencils {
  const N = u.length
  const um2 = u[pmod(i - 2, N)]
  const um1 = u[pmod(i - 1, N)]
  const u0 = u[i]
  const up1 = u[pmod(i + 1, N)]
  const up2 = u[pmod(i + 2, N)]
  const b0 =
    (13 / 12) * (um2 - 2 * um1 + u0) ** 2 + 0.25 * (um2 - 4 * um1 + 3 * u0) ** 2
  const b1 =
    (13 / 12) * (um1 - 2 * u0 + up1) ** 2 + 0.25 * (um1 - up1) ** 2
  const b2 =
    (13 / 12) * (u0 - 2 * up1 + up2) ** 2 + 0.25 * (3 * u0 - 4 * up1 + up2) ** 2
  return { um2, um1, u0, up1, up2, b0, b1, b2 }
}

function wenoJSLeft(u: Float64Array, i: number): number {
  const s = stencilData(u, i)
  const eps = 1e-6
  const d0 = 1 / 10
  const d1 = 6 / 10
  const d2 = 3 / 10
  const a0 = d0 / (s.b0 + eps) ** 2
  const a1 = d1 / (s.b1 + eps) ** 2
  const a2 = d2 / (s.b2 + eps) ** 2
  const sa = a0 + a1 + a2
  const w0 = a0 / sa
  const w1 = a1 / sa
  const w2 = a2 / sa
  const p0 = (2 * s.um2 - 7 * s.um1 + 11 * s.u0) / 6
  const p1 = (-s.um1 + 5 * s.u0 + 2 * s.up1) / 6
  const p2 = (2 * s.u0 + 5 * s.up1 - s.up2) / 6
  return w0 * p0 + w1 * p1 + w2 * p2
}

function tenoLeft(u: Float64Array, i: number, CT: number): number {
  const s = stencilData(u, i)
  const eps = 1e-40
  const q = 6
  const tau = Math.abs(s.b0 - s.b2)
  const b3 = Math.max(s.b0, s.b1, s.b2)
  const g0 = Math.pow(1 + tau / (s.b0 + eps), q)
  const g1 = Math.pow(1 + tau / (s.b1 + eps), q)
  const g2 = Math.pow(1 + tau / (s.b2 + eps), q)
  const g3 = Math.pow(1 + tau / (b3 + eps), q)
  const gs = g0 + g1 + g2 + g3
  const chi0 = g0 / gs
  const chi1 = g1 / gs
  const chi2 = g2 / gs
  const chi3 = g3 / gs
  const d0 = chi0 >= CT ? 1 : 0
  const d1 = chi1 >= CT ? 1 : 0
  const d2 = chi2 >= CT ? 1 : 0
  const d3 = chi3 >= CT ? 1 : 0
  if (d3 === 1) {
    return (2 * s.um2 - 13 * s.um1 + 47 * s.u0 + 27 * s.up1 - 3 * s.up2) / 60
  }
  const ds = [1 / 10, 6 / 10, 3 / 10]
  const aa0 = ds[0] * d0
  const aa1 = ds[1] * d1
  const aa2 = ds[2] * d2
  const sa = aa0 + aa1 + aa2
  if (sa < 1e-14) return s.u0
  const ww0 = aa0 / sa
  const ww1 = aa1 / sa
  const ww2 = aa2 / sa
  const p0 = (2 * s.um2 - 7 * s.um1 + 11 * s.u0) / 6
  const p1 = (-s.um1 + 5 * s.u0 + 2 * s.up1) / 6
  const p2 = (2 * s.u0 + 5 * s.up1 - s.up2) / 6
  return ww0 * p0 + ww1 * p1 + ww2 * p2
}

type Reconstructor = (u: Float64Array, i: number) => number

function rhs(u: Float64Array, rec: Reconstructor, dx: number): Float64Array {
  const N = u.length
  const fHalf = new Float64Array(N)
  for (let i = 0; i < N; i++) fHalf[i] = rec(u, i)
  const res = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    res[i] = -(fHalf[i] - fHalf[pmod(i - 1, N)]) / dx
  }
  return res
}

function ssprk3Step(
  u: Float64Array,
  dt: number,
  dx: number,
  rec: Reconstructor,
): Float64Array {
  const N = u.length
  const k1 = rhs(u, rec, dx)
  const u1 = new Float64Array(N)
  for (let i = 0; i < N; i++) u1[i] = u[i] + dt * k1[i]
  const k2 = rhs(u1, rec, dx)
  const u2 = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    u2[i] = 0.75 * u[i] + 0.25 * u1[i] + 0.25 * dt * k2[i]
  }
  const k3 = rhs(u2, rec, dx)
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    out[i] = u[i] / 3 + (2 * u2[i]) / 3 + ((2 * dt) / 3) * k3[i]
  }
  return out
}

function initialCondition(N: number): Float64Array {
  const u = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    if (x >= 0.1 && x <= 0.4) {
      const xi = (x - 0.1) / 0.3
      u[i] = Math.sin(Math.PI * xi) ** 2
    } else if (x >= 0.55 && x <= 0.85) {
      u[i] = 1
    } else {
      u[i] = 0
    }
  }
  return u
}

function exactAt(x: number, t: number): number {
  let xp = ((x - t) % 1 + 1) % 1
  if (xp >= 0.1 && xp <= 0.4) {
    const xi = (xp - 0.1) / 0.3
    return Math.sin(Math.PI * xi) ** 2
  }
  if (xp >= 0.55 && xp <= 0.85) return 1
  return 0
}

export function TENOvsWENOAdvection1D() {
  const [N, setN] = useState(120)
  const [cfl, setCfl] = useState(0.4)
  const [ctExp, setCtExp] = useState(-5)
  const [playing, setPlaying] = useState(true)
  const [showWeno, setShowWeno] = useState(true)
  const [showTeno, setShowTeno] = useState(true)
  const [t, setT] = useState(0)
  const [errors, setErrors] = useState({ weno: 0, teno: 0 })

  const CT = Math.pow(10, ctExp)
  const dx = 1 / N

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ uW: Float64Array; uT: Float64Array; t: number }>({
    uW: initialCondition(N),
    uT: initialCondition(N),
    t: 0,
  })
  const rafRef = useRef<number | null>(null)

  const reset = () => {
    stateRef.current = {
      uW: initialCondition(N),
      uT: initialCondition(N),
      t: 0,
    }
    setT(0)
    setErrors({ weno: 0, teno: 0 })
  }

  useEffect(() => {
    reset()
  }, [N])

  const recTeno = useMemo<Reconstructor>(
    () => (u, i) => tenoLeft(u, i, CT),
    [CT],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    function draw() {
      if (!ctx) return
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#1f2b44'
      ctx.lineWidth = 1
      const padL = 36
      const padR = 10
      const padT = 12
      const padB = 26
      const plotW = W - padL - padR
      const plotH = H - padT - padB
      const yMin = -0.2
      const yMax = 1.3
      const yScale = plotH / (yMax - yMin)
      const toX = (x: number) => padL + x * plotW
      const toY = (y: number) => padT + (yMax - y) * yScale

      ctx.strokeStyle = '#1f2b44'
      for (let gy = 0; gy <= 4; gy++) {
        const yv = yMin + ((yMax - yMin) * gy) / 4
        const Y = toY(yv)
        ctx.beginPath()
        ctx.moveTo(padL, Y)
        ctx.lineTo(W - padR, Y)
        ctx.stroke()
      }

      ctx.fillStyle = '#64748b'
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('0', padL - 14, toY(0) + 4)
      ctx.fillText('1', padL - 14, toY(1) + 4)

      const cur = stateRef.current
      const Nloc = cur.uW.length

      ctx.strokeStyle = '#94a3b8'
      ctx.setLineDash([3, 4])
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i <= 400; i++) {
        const x = i / 400
        const y = exactAt(x, cur.t)
        const X = toX(x)
        const Y = toY(y)
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      if (showWeno) {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        for (let i = 0; i < Nloc; i++) {
          const x = (i + 0.5) / Nloc
          const X = toX(x)
          const Y = toY(cur.uW[i])
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      }

      if (showTeno) {
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        for (let i = 0; i < Nloc; i++) {
          const x = (i + 0.5) / Nloc
          const X = toX(x)
          const Y = toY(cur.uT[i])
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      }

      ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('exact', padL + 6, padT + 14)
      if (showWeno) {
        ctx.fillStyle = '#f59e0b'
        ctx.fillText('WENO-JS', padL + 56, padT + 14)
      }
      if (showTeno) {
        ctx.fillStyle = '#22d3ee'
        ctx.fillText('TENO-5', padL + 130, padT + 14)
      }

      ctx.fillStyle = '#64748b'
      ctx.fillText(`t = ${cur.t.toFixed(3)}`, W - padR - 70, padT + 14)
    }

    let last = performance.now()
    let acc = 0
    const frameMs = 16

    function loop(now: number) {
      const delta = now - last
      last = now
      if (playing) acc += delta
      while (acc >= frameMs) {
        const cur = stateRef.current
        const n = cur.uW.length
        const dt = cfl * dx
        cur.uW = ssprk3Step(cur.uW, dt, dx, wenoJSLeft)
        cur.uT = ssprk3Step(cur.uT, dt, dx, recTeno)
        cur.t += dt
        if (cur.t > 2.0) {
          cur.uW = initialCondition(n)
          cur.uT = initialCondition(n)
          cur.t = 0
        }
        acc -= frameMs
      }
      const cur2 = stateRef.current
      const n2 = cur2.uW.length
      let ew = 0
      let et = 0
      for (let i = 0; i < n2; i++) {
        const xc = (i + 0.5) / n2
        const ue = exactAt(xc, cur2.t)
        ew += (cur2.uW[i] - ue) ** 2
        et += (cur2.uT[i] - ue) ** 2
      }
      setErrors({
        weno: Math.sqrt(ew / n2),
        teno: Math.sqrt(et / n2),
      })
      setT(cur2.t)
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [cfl, dx, playing, recTeno, showWeno, showTeno])

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
        width={720}
        height={280}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
      />
      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            N cells: {N}
          </label>
          <input
            type="range"
            min={40}
            max={200}
            step={10}
            value={N}
            onChange={(e) => setN(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            CFL: {cfl.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.1}
            max={0.6}
            step={0.05}
            value={cfl}
            onChange={(e) => setCfl(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            TENO cutoff C_T: 1e{ctExp}
          </label>
          <input
            type="range"
            min={-8}
            max={-2}
            step={1}
            value={ctExp}
            onChange={(e) => setCtExp(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--accent)',
            color: '#08111f',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Reset
        </button>
        <label style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showWeno}
            onChange={(e) => setShowWeno(e.target.checked)}
          />
          WENO-JS
        </label>
        <label style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showTeno}
            onChange={(e) => setShowTeno(e.target.checked)}
          />
          TENO-5
        </label>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            fontFamily: 'var(--font-mono, ui-monospace), monospace',
            color: 'var(--text-muted)',
          }}
        >
          L2 err — WENO: {errors.weno.toFixed(4)} | TENO: {errors.teno.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
