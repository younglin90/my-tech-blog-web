'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

function pmod(i: number, N: number): number {
  return ((i % N) + N) % N
}

function minmod(a: number, b: number): number {
  if (a * b <= 0) return 0
  return Math.sign(a) * Math.min(Math.abs(a), Math.abs(b))
}

type Edges = { qL: number; qR: number }

function musclEdges(u: Float64Array, i: number): Edges {
  const N = u.length
  const um = u[pmod(i - 1, N)]
  const u0 = u[i]
  const up = u[pmod(i + 1, N)]
  const slope = minmod(u0 - um, up - u0)
  return { qL: u0 - 0.5 * slope, qR: u0 + 0.5 * slope }
}

function thincEdges(u: Float64Array, i: number, beta: number): Edges {
  const N = u.length
  const um = u[pmod(i - 1, N)]
  const u0 = u[i]
  const up = u[pmod(i + 1, N)]
  const qmin = Math.min(um, up)
  const qmax = Math.max(um, up) - qmin
  if (qmax < 1e-12) return { qL: u0, qR: u0 }
  const theta = Math.sign(up - um)
  const eps = 1e-20
  const C = (u0 - qmin + eps) / (qmax + eps)
  if (C <= 1e-6 || C >= 1 - 1e-6) return { qL: u0, qR: u0 }
  const B = Math.exp(theta * beta * (2 * C - 1))
  const A = (B / Math.cosh(beta) - 1) / Math.tanh(beta)
  const qR = qmin + 0.5 * qmax * (1 + theta * A)
  const qL = qmin + 0.5 * qmax * ((1 + theta * A * Math.tanh(beta) + theta * Math.tanh(beta)) / (1 + A * Math.tanh(beta)))
  return { qL, qR }
}

function bvdPick(u: Float64Array, i: number, beta: number): { edges: Edges; pickedThinc: boolean } {
  const N = u.length
  const um = u[pmod(i - 1, N)]
  const u0 = u[i]
  const up = u[pmod(i + 1, N)]
  const delta = 1e-4
  const qmin = Math.min(um, up)
  const qmax = Math.max(um, up) - qmin
  const monotone = (up - u0) * (u0 - um) > 0
  const C = qmax > 1e-12 ? (u0 - qmin) / qmax : 0.5
  const eligible = monotone && C > delta && C < 1 - delta

  const m = musclEdges(u, i)
  if (!eligible) return { edges: m, pickedThinc: false }

  const t = thincEdges(u, i, beta)
  const mLeft = musclEdges(u, pmod(i - 1, N))
  const mRight = musclEdges(u, pmod(i + 1, N))
  const tbvM = Math.abs(mLeft.qR - m.qL) + Math.abs(m.qR - mRight.qL)
  const tbvT = Math.abs(mLeft.qR - t.qL) + Math.abs(t.qR - mRight.qL)
  if (tbvT < tbvM) return { edges: t, pickedThinc: true }
  return { edges: m, pickedThinc: false }
}

type SchemeName = 'muscl' | 'thinc' | 'bvd'

function godunovStep(u: Float64Array, dx: number, dt: number, scheme: SchemeName, beta: number, picks?: Uint8Array): Float64Array {
  const N = u.length
  const fluxRight = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    let edges: Edges
    if (scheme === 'muscl') edges = musclEdges(u, i)
    else if (scheme === 'thinc') edges = thincEdges(u, i, beta)
    else {
      const r = bvdPick(u, i, beta)
      edges = r.edges
      if (picks) picks[i] = r.pickedThinc ? 1 : 0
    }
    fluxRight[i] = edges.qR
  }
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const left = fluxRight[pmod(i - 1, N)]
    const right = fluxRight[i]
    out[i] = u[i] - (dt / dx) * (right - left)
  }
  return out
}

function initialProfile(N: number): Float64Array {
  const u = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    if (x >= 0.15 && x <= 0.35) {
      const xi = (x - 0.15) / 0.2
      u[i] = Math.sin(Math.PI * xi) ** 2
    } else if (x >= 0.55 && x <= 0.8) {
      u[i] = 1
    } else {
      u[i] = 0
    }
  }
  return u
}

function exactAt(x: number, t: number): number {
  const xp = ((x - t) % 1 + 1) % 1
  if (xp >= 0.15 && xp <= 0.35) {
    const xi = (xp - 0.15) / 0.2
    return Math.sin(Math.PI * xi) ** 2
  }
  if (xp >= 0.55 && xp <= 0.8) return 1
  return 0
}

export function MUSCLTHINCBVDPicker() {
  const [N, setN] = useState(80)
  const [beta, setBeta] = useState(1.6)
  const [cfl, setCfl] = useState(0.4)
  const [playing, setPlaying] = useState(true)
  const [showMuscl, setShowMuscl] = useState(true)
  const [showThinc, setShowThinc] = useState(true)
  const [showBvd, setShowBvd] = useState(true)
  const [t, setT] = useState(0)
  const [pickRatio, setPickRatio] = useState(0)

  const dx = 1 / N

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    uM: Float64Array
    uT: Float64Array
    uB: Float64Array
    picks: Uint8Array
    t: number
  }>({
    uM: initialProfile(N),
    uT: initialProfile(N),
    uB: initialProfile(N),
    picks: new Uint8Array(N),
    t: 0,
  })
  const rafRef = useRef<number | null>(null)

  const reset = () => {
    stateRef.current = {
      uM: initialProfile(N),
      uT: initialProfile(N),
      uB: initialProfile(N),
      picks: new Uint8Array(N),
      t: 0,
    }
    setT(0)
    setPickRatio(0)
  }

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N])

  const params = useMemo(() => ({ beta, cfl }), [beta, cfl])

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
      const padL = 36
      const padR = 12
      const padT = 14
      const padB = 50
      const plotW = W - padL - padR
      const plotH = H - padT - padB
      const yMin = -0.2
      const yMax = 1.3
      const yScale = plotH / (yMax - yMin)
      const toX = (x: number) => padL + x * plotW
      const toY = (y: number) => padT + (yMax - y) * yScale

      ctx.strokeStyle = '#1f2b44'
      ctx.lineWidth = 1
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
      const Nloc = cur.uM.length

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

      const drawLine = (data: Float64Array, color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 1.7
        ctx.beginPath()
        for (let i = 0; i < Nloc; i++) {
          const x = (i + 0.5) / Nloc
          const X = toX(x)
          const Y = toY(data[i])
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      }

      if (showMuscl) drawLine(cur.uM, '#f59e0b')
      if (showThinc) drawLine(cur.uT, '#ef4444')
      if (showBvd) drawLine(cur.uB, '#22d3ee')

      // BVD pick strip
      const stripY = padT + plotH + 8
      const stripH = 14
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(padL, stripY, plotW, stripH)
      for (let i = 0; i < Nloc; i++) {
        const x0 = padL + (i / Nloc) * plotW
        const xw = plotW / Nloc
        ctx.fillStyle = cur.picks[i] === 1 ? '#22d3ee' : '#334155'
        ctx.fillRect(x0, stripY, xw - 0.5, stripH)
      }
      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('BVD pick: cyan = THINC, dark = MUSCL', padL, stripY + stripH + 12)

      // Legend
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
      let lx = padL + 200
      const ly = padT + 10
      const item = (color: string, label: string) => {
        ctx.fillStyle = color
        ctx.fillRect(lx, ly - 8, 14, 3)
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(label, lx + 18, ly)
        lx += ctx.measureText(label).width + 50
      }
      item('#94a3b8', 'exact')
      if (showMuscl) item('#f59e0b', 'MUSCL')
      if (showThinc) item('#ef4444', 'THINC')
      if (showBvd) item('#22d3ee', 'BVD')
    }

    function step() {
      const cur = stateRef.current
      const dt = params.cfl * dx
      cur.uM = godunovStep(cur.uM, dx, dt, 'muscl', params.beta)
      cur.uT = godunovStep(cur.uT, dx, dt, 'thinc', params.beta)
      cur.uB = godunovStep(cur.uB, dx, dt, 'bvd', params.beta, cur.picks)
      cur.t += dt
      let count = 0
      for (let i = 0; i < cur.picks.length; i++) if (cur.picks[i]) count++
      setT(cur.t)
      setPickRatio(count / cur.picks.length)
    }

    let lastFrame = 0
    function frame(ts: number) {
      if (ts - lastFrame > 50) {
        if (playing) step()
        lastFrame = ts
      }
      draw()
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, showMuscl, showThinc, showBvd, params, dx])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        background: 'var(--surface)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={720}
        height={340}
        style={{ width: '100%', maxWidth: 720, display: 'block', borderRadius: 6 }}
      />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, fontSize: 13 }}>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {playing ? 'pause' : 'play'}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          reset
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>N = {N}</span>
          <input
            type="range"
            min={40}
            max={160}
            step={20}
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={1.2}
            max={2.4}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(Number(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>CFL = {cfl.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={0.6}
            step={0.05}
            value={cfl}
            onChange={(e) => setCfl(Number(e.target.value))}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 12 }}>
        <label>
          <input type="checkbox" checked={showMuscl} onChange={(e) => setShowMuscl(e.target.checked)} /> MUSCL
        </label>
        <label>
          <input type="checkbox" checked={showThinc} onChange={(e) => setShowThinc(e.target.checked)} /> THINC
        </label>
        <label>
          <input type="checkbox" checked={showBvd} onChange={(e) => setShowBvd(e.target.checked)} /> BVD
        </label>
        <span style={{ color: 'var(--text-muted)' }}>t = {t.toFixed(2)}</span>
        <span style={{ color: 'var(--text-muted)' }}>THINC picked: {(pickRatio * 100).toFixed(0)}% of cells</span>
      </div>
    </div>
  )
}
