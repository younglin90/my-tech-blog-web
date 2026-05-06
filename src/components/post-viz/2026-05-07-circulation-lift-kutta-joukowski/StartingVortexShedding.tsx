'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const CANVAS_W = 720
const CANVAS_H = 320
const TWO_PI = Math.PI * 2

type ShedBlob = {
  x: number
  y: number
  age: number
  vy: number
  strength: number
}

type AirfoilPath = {
  upper: { x: number; y: number }[]
  lower: { x: number; y: number }[]
  leading: { x: number; y: number }
  trailing: { x: number; y: number }
}

function makeAirfoil(
  cx: number,
  cy: number,
  chord: number,
  alphaDeg: number,
): AirfoilPath {
  const alpha = (alphaDeg * Math.PI) / 180
  const cosA = Math.cos(alpha)
  const sinA = Math.sin(alpha)
  const m = 0.04
  const p = 0.4
  const tThick = 0.12
  const N = 26
  const upper: { x: number; y: number }[] = []
  const lower: { x: number; y: number }[] = []
  for (let i = 0; i <= N; i++) {
    const xc = i / N
    let yc = 0
    if (xc < p) yc = (m / (p * p)) * (2 * p * xc - xc * xc)
    else yc = (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * xc - xc * xc)
    const yt =
      5 *
      tThick *
      (0.2969 * Math.sqrt(xc) -
        0.126 * xc -
        0.3516 * xc * xc +
        0.2843 * xc * xc * xc -
        0.1015 * xc * xc * xc * xc)
    const xLocal = (xc - 0.5) * chord
    const yUp = (yc + yt) * chord
    const yLo = (yc - yt) * chord
    upper.push({
      x: cx + xLocal * cosA - yUp * sinA,
      y: cy + xLocal * sinA + yUp * cosA,
    })
    lower.push({
      x: cx + xLocal * cosA - yLo * sinA,
      y: cy + xLocal * sinA + yLo * cosA,
    })
  }
  return {
    upper,
    lower,
    leading: upper[0],
    trailing: upper[upper.length - 1],
  }
}

export function StartingVortexShedding() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const blobsRef = useRef<ShedBlob[]>([])
  const stateRef = useRef({
    t: 0,
    boundGamma: 0,
    shedSum: 0,
    running: false,
    airfoilX: CANVAS_W * 0.78,
  })

  const [alpha, setAlpha] = useState(8)
  const [speed, setSpeed] = useState(70)
  const [running, setRunning] = useState(false)
  const [tDisplay, setTDisplay] = useState(0)
  const [bound, setBound] = useState(0)
  const [shed, setShed] = useState(0)

  const start = useCallback(() => {
    blobsRef.current = []
    stateRef.current.t = 0
    stateRef.current.boundGamma = 0
    stateRef.current.shedSum = 0
    stateRef.current.airfoilX = CANVAS_W * 0.78
    stateRef.current.running = true
    setRunning(true)
    setTDisplay(0)
    setBound(0)
    setShed(0)
  }, [])

  const reset = useCallback(() => {
    blobsRef.current = []
    stateRef.current.t = 0
    stateRef.current.boundGamma = 0
    stateRef.current.shedSum = 0
    stateRef.current.airfoilX = CANVAS_W * 0.78
    stateRef.current.running = false
    setRunning(false)
    setTDisplay(0)
    setBound(0)
    setShed(0)
  }, [])

  useEffect(() => {
    let raf = 0
    let cancelled = false
    let last = performance.now()
    let acc = 0
    let frame = 0

    const tick = (now: number) => {
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) {
        raf = requestAnimationFrame(tick)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        raf = requestAnimationFrame(tick)
        return
      }

      const dt = Math.min(0.04, (now - last) / 1000)
      last = now
      frame += 1

      const st = stateRef.current
      const cy = CANVAS_H / 2

      if (st.running) {
        st.t += dt
        st.airfoilX -= speed * dt
        if (st.airfoilX < CANVAS_W * 0.28) {
          st.running = false
          setRunning(false)
        }

        acc += dt
        const targetBound = -alpha * 0.55
        const tau = 0.7
        const newBound = st.boundGamma + (targetBound - st.boundGamma) * (1 - Math.exp(-dt / tau))
        const dGamma = newBound - st.boundGamma
        st.boundGamma = newBound
        st.shedSum -= dGamma

        if (acc > 0.06 && Math.abs(dGamma) > 1e-3) {
          acc = 0
          const af = makeAirfoil(st.airfoilX, cy, 130, alpha)
          blobsRef.current.push({
            x: af.trailing.x + 4,
            y: af.trailing.y,
            age: 0,
            vy: (Math.random() - 0.5) * 4,
            strength: -dGamma * 8,
          })
        }
      }

      ctx.fillStyle = '#0b1424'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      for (let y = 0; y < CANVAS_H; y += 32) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_W, y)
        ctx.stroke()
      }

      for (const b of blobsRef.current) {
        b.x += dt * 4
        b.y += b.vy * dt
        b.vy *= 0.985
        b.age += dt
      }
      blobsRef.current = blobsRef.current.filter(
        (b) => b.x < CANVAS_W + 30 && b.age < 30,
      )

      for (const b of blobsRef.current) {
        const fade = Math.max(0, 1 - b.age / 25)
        const radius = 6 + Math.min(18, b.age * 1.6)
        const sgnPos = b.strength > 0
        const inner = sgnPos ? 'rgba(248,113,113,0.72)' : 'rgba(34,211,238,0.72)'
        const outer = sgnPos ? 'rgba(248,113,113,0)' : 'rgba(34,211,238,0)'
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius)
        grad.addColorStop(0, inner)
        grad.addColorStop(1, outer)
        ctx.fillStyle = grad
        ctx.globalAlpha = fade
        ctx.beginPath()
        ctx.arc(b.x, b.y, radius, 0, TWO_PI)
        ctx.fill()
        ctx.globalAlpha = 1

        const swirlR = Math.min(8, 3 + b.age * 0.4)
        ctx.strokeStyle = sgnPos
          ? `rgba(248,113,113,${0.7 * fade})`
          : `rgba(34,211,238,${0.7 * fade})`
        ctx.lineWidth = 1.4
        ctx.beginPath()
        const arcStart = b.age * (sgnPos ? 3 : -3)
        ctx.arc(b.x, b.y, swirlR, arcStart, arcStart + Math.PI * 1.4)
        ctx.stroke()
      }

      const af = makeAirfoil(st.airfoilX, cy, 130, alpha)
      ctx.fillStyle = 'rgba(15,23,42,0.95)'
      ctx.strokeStyle = 'rgba(248,250,252,0.8)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(af.upper[0].x, af.upper[0].y)
      for (const p of af.upper) ctx.lineTo(p.x, p.y)
      for (let i = af.lower.length - 1; i >= 0; i--) ctx.lineTo(af.lower[i].x, af.lower[i].y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      if (Math.abs(st.boundGamma) > 0.05) {
        const ringR = 38
        const phase = frame * 0.06 * Math.sign(st.boundGamma)
        ctx.strokeStyle = 'rgba(34,211,238,0.7)'
        ctx.lineWidth = 1.6
        for (let k = 0; k < 8; k++) {
          const a = phase + (k * TWO_PI) / 8
          const a2 = a + 0.5
          const ax = st.airfoilX + ringR * Math.cos(a)
          const ay = cy + ringR * Math.sin(a)
          const bx = st.airfoilX + ringR * Math.cos(a2)
          const by = cy + ringR * Math.sin(a2)
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.stroke()
        }
      }

      ctx.fillStyle = 'rgba(15,23,42,0.78)'
      ctx.fillRect(12, 12, 320, 86)
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.strokeRect(12, 12, 320, 86)
      ctx.fillStyle = 'rgba(226,232,240,0.95)'
      ctx.font = '12px ui-monospace, monospace'
      const dispBound = st.boundGamma
      const dispShed = st.shedSum
      ctx.fillText(`t = ${st.t.toFixed(2)} s`, 22, 32)
      ctx.fillStyle = '#22d3ee'
      ctx.fillText(`Γ_bound (around wing, CW) = ${dispBound.toFixed(2)}`, 22, 52)
      ctx.fillStyle = '#f87171'
      ctx.fillText(`Γ_shed  (in wake, CCW)    = ${dispShed.toFixed(2)}`, 22, 70)
      ctx.fillStyle = 'rgba(252,211,77,0.95)'
      ctx.fillText(`Γ_total = ${(dispBound + dispShed).toFixed(2)}  (Kelvin: 0)`, 22, 88)

      ctx.fillStyle = 'rgba(226,232,240,0.55)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('starting vortex (CCW)', CANVAS_W - 200, CANVAS_H - 22)
      ctx.fillText('← wing direction', 16, CANVAS_H - 12)

      if (
        Math.abs(stateRef.current.boundGamma - bound) > 0.01 ||
        Math.abs(stateRef.current.shedSum - shed) > 0.01
      ) {
        if (frame % 6 === 0) {
          setBound(parseFloat(stateRef.current.boundGamma.toFixed(2)))
          setShed(parseFloat(stateRef.current.shedSum.toFixed(2)))
          setTDisplay(parseFloat(stateRef.current.t.toFixed(2)))
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [alpha, speed, bound, shed])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          marginBottom: 12,
          fontSize: 13,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>angle of attack α =</span>
          <input
            type="range"
            min={0}
            max={14}
            step={1}
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
          />
          <code>{alpha}°</code>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>U =</span>
          <input
            type="range"
            min={30}
            max={140}
            step={5}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <code>{speed}</code>
        </label>
        <button
          onClick={start}
          disabled={running}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: running ? 'transparent' : 'var(--accent, #22d3ee)',
            color: running ? 'var(--text-muted)' : '#0b1424',
            cursor: running ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          {running ? 'flying…' : 'start motion'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          reset
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: '100%',
          maxWidth: CANVAS_W,
          height: 'auto',
          display: 'block',
          borderRadius: 6,
        }}
      />

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        Press <strong>start motion</strong>: a counterclockwise <span style={{ color: '#f87171' }}>starting vortex</span>{' '}
        sheds from the trailing edge while an equal-magnitude clockwise{' '}
        <span style={{ color: '#22d3ee' }}>bound circulation</span> grows around the
        wing. Their sum is zero (Kelvin&apos;s circulation theorem). The bound circulation
        is what produces lift L′ = ρU∞Γ_bound. t={tDisplay.toFixed(2)} s, Γ_bound=
        {bound.toFixed(2)}, Γ_shed={shed.toFixed(2)}.
      </div>
    </div>
  )
}
