'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const CANVAS_W = 720
const CANVAS_H = 360
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const R_CYL = 56
const N_TRACERS = 220
const TWO_PI = Math.PI * 2

type Tracer = {
  x: number
  y: number
  age: number
  band: number
}

function magnusVelocity(
  px: number,
  py: number,
  U: number,
  Gamma: number,
  R: number,
) {
  const dx = px - CX
  const dy = -(py - CY)
  const r2 = dx * dx + dy * dy
  if (r2 < R * R + 1e-6) return { vx: 0, vy: 0, inside: true }
  const r4 = r2 * r2
  const term = (U * R * R) / r4
  const swirl = Gamma / (TWO_PI * r2)
  const u = U - term * (dx * dx - dy * dy) + swirl * dy
  const w = -2 * term * dx * dy - swirl * dx
  return { vx: u, vy: -w, inside: false }
}

function spawnTracer(band: number): Tracer {
  return {
    x: -10 + Math.random() * 12,
    y: 20 + (band + Math.random() * 0.96) * ((CANVAS_H - 40) / 12),
    age: Math.random() * 50,
    band,
  }
}

function makeTracers(): Tracer[] {
  const arr: Tracer[] = []
  for (let i = 0; i < N_TRACERS; i++) {
    const band = i % 12
    const t = spawnTracer(band)
    t.x = Math.random() * CANVAS_W
    arr.push(t)
  }
  return arr
}

export function MagnusCylinderStreamlines() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tracersRef = useRef<Tracer[]>(makeTracers())
  const [Uflow, setUflow] = useState(60)
  const [gammaSign, setGammaSign] = useState<1 | -1>(1)
  const [gammaMag, setGammaMag] = useState(80)
  const [showCp, setShowCp] = useState(true)
  const [playing, setPlaying] = useState(true)

  const Gamma = gammaSign * gammaMag

  const stagnation = useMemo(() => {
    const ratio = -Gamma / (4 * Math.PI * Uflow * R_CYL)
    if (Math.abs(ratio) > 1) {
      const sign = ratio > 0 ? 1 : -1
      return { detached: true, theta: sign * Math.PI / 2 }
    }
    const t1 = Math.asin(ratio)
    return { detached: false, theta: t1, theta2: Math.PI - t1 }
  }, [Uflow, Gamma])

  const reset = useCallback(() => {
    tracersRef.current = makeTracers()
  }, [])

  useEffect(() => {
    let raf = 0
    let cancelled = false
    let last = performance.now()

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

      ctx.fillStyle = '#0b1424'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      if (showCp) {
        const cellW = 8
        const cellH = 8
        for (let py = 0; py < CANVAS_H; py += cellH) {
          for (let px = 0; px < CANVAS_W; px += cellW) {
            const { vx, vy, inside } = magnusVelocity(
              px + cellW / 2,
              py + cellH / 2,
              Uflow,
              Gamma,
              R_CYL,
            )
            if (inside) continue
            const speed2 = vx * vx + vy * vy
            const cp = 1 - speed2 / (Uflow * Uflow + 1e-6)
            const t = Math.max(-3, Math.min(1, cp))
            let r = 0
            let g = 0
            let b = 0
            if (t >= 0) {
              const k = t
              r = 200 + k * 30
              g = 80 + (1 - k) * 60
              b = 60 + (1 - k) * 40
            } else {
              const k = -t / 3
              r = 30 + (1 - k) * 60
              g = 110 + k * 100
              b = 200 + k * 40
            }
            ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0.42)`
            ctx.fillRect(px, py, cellW, cellH)
          }
        }
      }

      if (playing) {
        for (const tr of tracersRef.current) {
          const { vx, vy, inside } = magnusVelocity(tr.x, tr.y, Uflow, Gamma, R_CYL)
          if (inside) {
            const fresh = spawnTracer(tr.band)
            tr.x = fresh.x
            tr.y = fresh.y
            tr.age = 0
            continue
          }
          tr.x += vx * dt
          tr.y += vy * dt
          tr.age += 1
          if (tr.x > CANVAS_W + 8 || tr.y < -8 || tr.y > CANVAS_H + 8 || tr.age > 600) {
            const fresh = spawnTracer(tr.band)
            tr.x = fresh.x
            tr.y = fresh.y
            tr.age = 0
          }
        }
      }

      for (const tr of tracersRef.current) {
        const { vx, vy } = magnusVelocity(tr.x, tr.y, Uflow, Gamma, R_CYL)
        const m = Math.hypot(vx, vy)
        if (m < 1e-3) continue
        const len = 6
        const nx = (vx / m) * len
        const ny = (vy / m) * len
        const speedNorm = Math.min(1, m / (Uflow * 2.4))
        ctx.strokeStyle = `rgba(226,232,240,${0.35 + speedNorm * 0.55})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(tr.x - nx * 0.5, tr.y - ny * 0.5)
        ctx.lineTo(tr.x + nx * 0.5, tr.y + ny * 0.5)
        ctx.stroke()
      }

      ctx.fillStyle = '#0b1424'
      ctx.beginPath()
      ctx.arc(CX, CY, R_CYL, 0, TWO_PI)
      ctx.fill()
      ctx.strokeStyle = 'rgba(248,250,252,0.85)'
      ctx.lineWidth = 1.6
      ctx.stroke()

      ctx.strokeStyle = 'rgba(248,250,252,0.55)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      const arcDir = Gamma > 0 ? -1 : 1
      const arcStart = arcDir > 0 ? -Math.PI * 0.6 : Math.PI * 0.4
      const arcEnd = arcDir > 0 ? Math.PI * 0.6 : -Math.PI * 0.4
      ctx.arc(CX, CY, R_CYL * 0.55, arcStart, arcEnd, arcDir < 0)
      ctx.stroke()
      const headAngle = arcDir > 0 ? arcEnd : arcEnd
      const hx = CX + R_CYL * 0.55 * Math.cos(headAngle)
      const hy = CY + R_CYL * 0.55 * Math.sin(headAngle)
      const tangentSign = arcDir
      const tangX = -Math.sin(headAngle) * tangentSign
      const tangY = Math.cos(headAngle) * tangentSign
      ctx.beginPath()
      ctx.moveTo(hx, hy)
      ctx.lineTo(hx - tangX * 8 + tangY * 5, hy - tangY * 8 - tangX * 5)
      ctx.lineTo(hx - tangX * 8 - tangY * 5, hy - tangY * 8 + tangX * 5)
      ctx.closePath()
      ctx.fillStyle = 'rgba(248,250,252,0.85)'
      ctx.fill()

      if (!stagnation.detached) {
        const points = [stagnation.theta, stagnation.theta2 ?? Math.PI - stagnation.theta]
        for (const t of points) {
          const sx = CX + R_CYL * Math.cos(t)
          const sy = CY - R_CYL * Math.sin(t)
          ctx.fillStyle = '#fbbf24'
          ctx.beginPath()
          ctx.arc(sx, sy, 4.2, 0, TWO_PI)
          ctx.fill()
        }
      } else {
        const yDet =
          (-Gamma / (4 * Math.PI * Uflow)) +
          Math.sqrt(
            Math.max(
              0,
              Gamma * Gamma / (16 * Math.PI * Math.PI * Uflow * Uflow) - R_CYL * R_CYL,
            ),
          )
        const sy = CY - yDet * (Gamma > 0 ? -1 : 1)
        ctx.fillStyle = '#f87171'
        ctx.beginPath()
        ctx.arc(CX, sy, 4.6, 0, TWO_PI)
        ctx.fill()
      }

      const lift = Uflow * Gamma
      const cl = (2 * Gamma) / (Uflow * R_CYL * 2)

      ctx.fillStyle = 'rgba(15,23,42,0.7)'
      ctx.fillRect(12, 12, 280, 80)
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.strokeRect(12, 12, 280, 80)

      ctx.fillStyle = 'rgba(226,232,240,0.95)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`U∞ = ${Uflow.toFixed(0)}    Γ = ${Gamma.toFixed(0)}`, 22, 32)
      ctx.fillText(`L′ = ρ U∞ Γ ∝ ${lift.toFixed(0)}`, 22, 50)
      ctx.fillText(`C_L = 2Γ/(U∞·d) = ${cl.toFixed(2)}`, 22, 68)
      ctx.fillText(
        stagnation.detached
          ? 'stagnation point: detached (Γ > 4πU R)'
          : `stagnation θ = ±${(180 / Math.PI) * Math.asin(-Gamma / (4 * Math.PI * Uflow * R_CYL)) | 0}° (lower half)`,
        22,
        86,
      )

      const arrowX = CANVAS_W - 90
      const arrowYbase = CY
      const liftPx = Math.max(-90, Math.min(90, lift / 70))
      ctx.strokeStyle = lift > 0 ? '#22d3ee' : '#fb7185'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(arrowX, arrowYbase)
      ctx.lineTo(arrowX, arrowYbase - liftPx)
      ctx.stroke()
      const tip = arrowYbase - liftPx
      const dir = liftPx >= 0 ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(arrowX, tip)
      ctx.lineTo(arrowX - 6, tip + dir * 10)
      ctx.lineTo(arrowX + 6, tip + dir * 10)
      ctx.closePath()
      ctx.fillStyle = lift > 0 ? '#22d3ee' : '#fb7185'
      ctx.fill()
      ctx.fillStyle = 'rgba(226,232,240,0.85)'
      ctx.fillText('lift', arrowX - 12, arrowYbase + 18)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [Uflow, Gamma, showCp, playing, stagnation])

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
          <span style={{ color: 'var(--text-muted)' }}>U∞ =</span>
          <input
            type="range"
            min={20}
            max={140}
            step={2}
            value={Uflow}
            onChange={(e) => setUflow(parseFloat(e.target.value))}
          />
          <code>{Uflow}</code>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>|Γ| =</span>
          <input
            type="range"
            min={0}
            max={260}
            step={4}
            value={gammaMag}
            onChange={(e) => setGammaMag(parseFloat(e.target.value))}
          />
          <code>{gammaMag}</code>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>spin:</span>
          <button
            onClick={() => setGammaSign((s) => (s === 1 ? -1 : 1))}
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {gammaSign === 1 ? 'CW (lift up)' : 'CCW (lift down)'}
          </button>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showCp}
            onChange={(e) => setShowCp(e.target.checked)}
          />
          <span style={{ color: 'var(--text-muted)' }}>show Cp field</span>
        </label>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {playing ? 'pause' : 'play'}
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
        Streamlines from uniform flow U∞ + doublet (cylinder) + point vortex Γ. Top
        flow accelerates, bottom decelerates: by Bernoulli, low pressure on top → upward
        force L′ = ρU∞Γ. Yellow dots are stagnation points; when |Γ| &gt; 4πU∞R they
        merge and detach below the cylinder (red dot).
      </div>
    </div>
  )
}
