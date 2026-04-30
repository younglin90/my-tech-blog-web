'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const N = 256
const TMAX = 1.6

function initialQ(x: number, A: number, k: number) {
  return 0.55 + A * Math.sin(2 * Math.PI * k * x)
}

function godunovBurgersStep(q: Float64Array, dx: number, dt: number) {
  const n = q.length
  const f = new Float64Array(n + 1)
  for (let i = 0; i <= n; i++) {
    const qL = q[(i - 1 + n) % n]
    const qR = q[i % n]
    let ff: number
    if (qL <= qR) {
      if (0 <= qL) ff = 0.5 * qL * qL
      else if (qR <= 0) ff = 0.5 * qR * qR
      else ff = 0
    } else {
      const s = 0.5 * (qL + qR)
      ff = s >= 0 ? 0.5 * qL * qL : 0.5 * qR * qR
    }
    f[i] = ff
  }
  const next = new Float64Array(n)
  for (let i = 0; i < n; i++) next[i] = q[i] - (dt / dx) * (f[i + 1] - f[i])
  return next
}

function precomputeSnapshots(A: number, k: number) {
  const dx = 1 / N
  let q = new Float64Array(N)
  let qmax = 0
  for (let i = 0; i < N; i++) {
    q[i] = initialQ((i + 0.5) * dx, A, k)
    if (Math.abs(q[i]) > qmax) qmax = Math.abs(q[i])
  }
  const cfl = 0.4
  const dt = (cfl * dx) / qmax
  const nSteps = Math.ceil(TMAX / dt)
  const dtAdj = TMAX / nSteps
  const snapshotEvery = Math.max(1, Math.floor(nSteps / 80))
  const snapshots: Float64Array[] = [new Float64Array(q)]
  const tValues: number[] = [0]
  let tNow = 0
  for (let step = 0; step < nSteps; step++) {
    q = godunovBurgersStep(q, dx, dtAdj)
    tNow += dtAdj
    if ((step + 1) % snapshotEvery === 0) {
      snapshots.push(new Float64Array(q))
      tValues.push(tNow)
    }
  }
  const tStar = 1 / (A * 2 * Math.PI * k)
  return { snapshots, tValues, tStar }
}

export function BurgersShockBirth() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [A, setA] = useState(0.35)
  const [k, setK] = useState(1)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)

  const data = useMemo(() => precomputeSnapshots(A, k), [A, k])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT(prev => {
        const next = prev + dt * 0.25
        return next > TMAX ? 0 : next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    const cnv = canvasRef.current
    if (!cnv) return
    const ctx = cnv.getContext('2d')
    if (!ctx) return

    const styles = getComputedStyle(document.documentElement)
    const bg = styles.getPropertyValue('--bg').trim() || '#08111f'
    const text = styles.getPropertyValue('--text').trim() || '#e5e7eb'
    const accent = styles.getPropertyValue('--accent').trim() || '#22d3ee'
    const muted = styles.getPropertyValue('--text-muted').trim() || '#7a90a8'
    const border = styles.getPropertyValue('--border').trim() || '#1e293b'

    const W = cnv.width
    const H = cnv.height

    const padL = 56
    const padR = 24
    const profH = 150
    const gap = 28
    const planeY0 = 14 + profH + gap
    const planeY1 = H - 28
    const planeH = planeY1 - planeY0

    const x2px = (x: number) => padL + (W - padL - padR) * x
    const q2py = (qv: number) => 14 + profH - profH * qv / 1.1
    const t2py = (tv: number) => planeY1 - planeH * tv / TMAX

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, 14)
    ctx.lineTo(padL, 14 + profH)
    ctx.lineTo(W - padR, 14 + profH)
    ctx.stroke()

    ctx.fillStyle = muted
    ctx.font = '11px ui-monospace, Menlo, monospace'
    ctx.fillText('q(x, t)', padL - 40, 24)
    ctx.fillText('1.0', padL - 30, q2py(1.0) + 4)
    ctx.fillText('0.5', padL - 30, q2py(0.5) + 4)
    ctx.fillText('0.0', padL - 30, q2py(0.0) + 4)
    ctx.fillText('x', W - padR - 8, 14 + profH + 16)

    ctx.strokeStyle = muted
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    for (let i = 0; i <= 200; i++) {
      const x = i / 200
      const y = q2py(initialQ(x, A, k))
      if (i === 0) ctx.moveTo(x2px(x), y)
      else ctx.lineTo(x2px(x), y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    let idx = 0
    for (let i = 0; i < data.tValues.length; i++) {
      if (data.tValues[i] <= t) idx = i
    }
    const snap = data.snapshots[idx]
    if (snap) {
      ctx.strokeStyle = accent
      ctx.lineWidth = 2.2
      ctx.beginPath()
      const dx = 1 / N
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * dx
        const y = q2py(snap[i])
        if (i === 0) ctx.moveTo(x2px(x), y)
        else ctx.lineTo(x2px(x), y)
      }
      ctx.stroke()
    }

    ctx.fillStyle = text
    ctx.font = '12px ui-monospace, Menlo, monospace'
    ctx.fillText(
      `t = ${t.toFixed(3)}    t* = ${data.tStar.toFixed(3)}    ${t >= data.tStar ? 'shock formed' : 'pre-shock'}`,
      padL,
      8,
    )

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, planeY0)
    ctx.lineTo(padL, planeY1)
    ctx.lineTo(W - padR, planeY1)
    ctx.stroke()

    ctx.fillStyle = muted
    ctx.fillText('t', padL - 14, planeY0 + 12)
    ctx.fillText(TMAX.toFixed(1), padL - 30, t2py(TMAX) + 4)
    ctx.fillText('0', padL - 14, planeY1 + 4)
    ctx.fillText('x', W - padR - 8, planeY1 + 16)

    const Nlines = 64
    for (let i = 0; i < Nlines; i++) {
      const x0 = (i + 0.5) / Nlines
      const u = initialQ(x0, A, k)
      const hue = Math.max(0, Math.min(1, (u - 0.1) / 0.9))
      const rr = Math.round(34 + (245 - 34) * hue)
      const gg = Math.round(211 - (211 - 100) * hue)
      const bb = Math.round(238 - (238 - 100) * hue)
      ctx.strokeStyle = `rgb(${rr}, ${gg}, ${bb})`
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 1
      let xCur = x0
      let tCur = 0
      let safety = 0
      while (tCur < TMAX && safety < 6) {
        safety++
        const dxRem = u > 0 ? 1 - xCur : -xCur
        const tStep = u !== 0 ? dxRem / u : TMAX
        const tNext = Math.min(TMAX, tCur + tStep)
        const xNext = xCur + u * (tNext - tCur)
        ctx.beginPath()
        ctx.moveTo(x2px(xCur), t2py(tCur))
        ctx.lineTo(x2px(Math.max(0, Math.min(1, xNext))), t2py(tNext))
        ctx.stroke()
        if (tNext >= TMAX) break
        tCur = tNext
        xCur = u > 0 ? 0 : 1
      }
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = '#f87171'
    ctx.setLineDash([5, 4])
    ctx.lineWidth = 1.2
    ctx.beginPath()
    const ystar = t2py(Math.min(data.tStar, TMAX))
    ctx.moveTo(padL, ystar)
    ctx.lineTo(W - padR, ystar)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#f87171'
    ctx.fillText('t*  (lines first cross)', W - padR - 140, ystar - 4)

    ctx.strokeStyle = accent
    ctx.lineWidth = 1.6
    ctx.beginPath()
    const yt = t2py(Math.min(t, TMAX))
    ctx.moveTo(padL, yt)
    ctx.lineTo(W - padR, yt)
    ctx.stroke()
    ctx.fillStyle = accent
    ctx.fillText('t (now)', padL + 6, yt - 4)
  }, [t, A, k, data])

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 8,
        padding: 16,
        border: '1px solid var(--border)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={720}
        height={460}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--text-muted)',
            gap: 12,
          }}
        >
          <span style={{ minWidth: 130 }}>Amplitude A: {A.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={0.45}
            step={0.01}
            value={A}
            onChange={e => setA(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--text-muted)',
            gap: 12,
          }}
        >
          <span style={{ minWidth: 130 }}>Wave number k: {k}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={1}
            value={k}
            onChange={e => setK(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPlaying(p => !p)}
            style={{
              padding: '6px 14px',
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setT(0)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Reset t
          </button>
          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            q0(x) = 0.55 + A sin(2 pi k x)
          </span>
        </div>
      </div>
    </div>
  )
}
