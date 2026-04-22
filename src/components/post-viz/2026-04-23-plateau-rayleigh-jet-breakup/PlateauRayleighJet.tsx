'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const CANVAS_W = 720
const CANVAS_H = 260
const AXIS_Y = CANVAS_H - 50
const R0 = 28
const JET_X0 = 20
const JET_X1 = CANVAS_W - 20
const PINCH_AMP = 0.92

type Droplet = {
  x: number
  y: number
  r: number
  vy: number
  life: number
}

function rayleighGrowth(kR: number, Oh: number): number {
  if (kR <= 0 || kR >= 1) return 0
  const inviscid = Math.sqrt(0.5 * kR * kR * (1 - kR * kR))
  return inviscid / (1 + 3 * Oh * kR)
}

function envelope(kR: number): number[] {
  const pts: number[] = []
  const N = 120
  for (let i = 0; i <= N; i++) {
    const x = i / N
    pts.push(rayleighGrowth(x, 0))
  }
  return pts
}

export function PlateauRayleighJet() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ampRef = useRef(0.03)
  const tRef = useRef(0)
  const dropletsRef = useRef<Droplet[]>([])
  const [kR, setKR] = useState(0.696)
  const [Oh, setOh] = useState(0.02)
  const [playing, setPlaying] = useState(true)
  const [tick, setTick] = useState(0)

  const sigma = useMemo(() => rayleighGrowth(kR, Oh), [kR, Oh])
  const curve = useMemo(() => envelope(kR), [kR])

  const reset = useCallback(() => {
    ampRef.current = 0.03
    tRef.current = 0
    dropletsRef.current = []
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    reset()
  }, [kR, Oh, reset])

  useEffect(() => {
    let raf = 0
    let cancelled = false
    let last = performance.now()

    const draw = (now: number) => {
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) {
        raf = requestAnimationFrame(draw)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        raf = requestAnimationFrame(draw)
        return
      }

      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      if (playing) {
        const growth = sigma > 0 ? sigma : -0.2
        ampRef.current = ampRef.current * Math.exp(growth * dt * 6)
        if (ampRef.current < 0.01) ampRef.current = 0.01
        if (sigma > 0 && ampRef.current >= PINCH_AMP) {
          const k = kR / R0
          const wavelength = (2 * Math.PI) / k
          const jetLen = JET_X1 - JET_X0
          const nWaves = Math.floor(jetLen / wavelength)
          if (nWaves > 0 && dropletsRef.current.length === 0) {
            const volumePerWave = Math.PI * R0 * R0 * wavelength
            const dropR = Math.cbrt((3 * volumePerWave) / (4 * Math.PI))
            for (let i = 0; i < nWaves; i++) {
              const cx = JET_X0 + (i + 0.5) * wavelength
              dropletsRef.current.push({
                x: cx,
                y: AXIS_Y,
                r: Math.min(dropR, R0 * 1.6),
                vy: 30 + Math.random() * 20,
                life: 1,
              })
            }
          }
        }
        tRef.current += dt

        for (const d of dropletsRef.current) {
          d.vy += 120 * dt
          d.y += d.vy * dt
          d.life -= dt * 0.6
        }
        dropletsRef.current = dropletsRef.current.filter(
          (d) => d.y < CANVAS_H + 40 && d.life > 0,
        )
      }

      ctx.fillStyle = '#0b1424'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      const midY = CANVAS_H / 2 - 40
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(JET_X0, midY)
      ctx.lineTo(JET_X1, midY)
      ctx.stroke()
      ctx.setLineDash([])

      const amp = ampRef.current
      const k = kR / R0
      const phase = 0

      if (dropletsRef.current.length === 0) {
        ctx.beginPath()
        const steps = 180
        for (let i = 0; i <= steps; i++) {
          const x = JET_X0 + ((JET_X1 - JET_X0) * i) / steps
          const r = R0 * (1 + amp * Math.cos(k * (x - JET_X0) + phase))
          const y = midY - r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        for (let i = steps; i >= 0; i--) {
          const x = JET_X0 + ((JET_X1 - JET_X0) * i) / steps
          const r = R0 * (1 + amp * Math.cos(k * (x - JET_X0) + phase))
          const y = midY + r
          ctx.lineTo(x, y)
        }
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, midY - R0, 0, midY + R0)
        grad.addColorStop(0, 'rgba(56,189,248,0.95)')
        grad.addColorStop(0.5, 'rgba(14,165,233,0.95)')
        grad.addColorStop(1, 'rgba(37,99,235,0.95)')
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = 'rgba(125,211,252,0.9)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      } else {
        for (const d of dropletsRef.current) {
          const alpha = Math.max(0, Math.min(1, d.life))
          ctx.beginPath()
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(
            d.x - d.r * 0.3,
            d.y - d.r * 0.3,
            d.r * 0.1,
            d.x,
            d.y,
            d.r,
          )
          grad.addColorStop(0, `rgba(186,230,253,${alpha})`)
          grad.addColorStop(1, `rgba(14,116,144,${alpha})`)
          ctx.fillStyle = grad
          ctx.fill()
        }
      }

      const plotX0 = 20
      const plotX1 = CANVAS_W - 20
      const plotY0 = AXIS_Y - 28
      const plotY1 = AXIS_Y
      const plotW = plotX1 - plotX0
      const plotH = plotY1 - plotY0
      const sigmaMax = 0.343
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(plotX0, plotY1)
      ctx.lineTo(plotX1, plotY1)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(34,211,238,0.8)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < curve.length; i++) {
        const x = plotX0 + (plotW * i) / (curve.length - 1)
        const y = plotY1 - (plotH * curve[i]) / sigmaMax
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      const kxPix = plotX0 + plotW * kR
      const kyPix = plotY1 - (plotH * sigma) / sigmaMax
      ctx.fillStyle = sigma > 0 ? '#22d3ee' : '#94a3b8'
      ctx.beginPath()
      ctx.arc(kxPix, kyPix, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(226,232,240,0.85)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('σ* vs kR  (0 < kR < 1 : 불안정)', plotX0, plotY0 - 4)
      ctx.fillText('0', plotX0 - 4, plotY1 + 12)
      ctx.fillText('1', plotX1 - 4, plotY1 + 12)

      ctx.fillStyle = sigma > 0 ? '#7dd3fc' : '#fca5a5'
      ctx.font = '12px ui-monospace, monospace'
      const statusText =
        sigma > 0
          ? `불안정 · σ* = ${sigma.toFixed(3)}  (진폭 ${amp.toFixed(2)})`
          : '안정 · 파장이 둘레보다 짧다 (kR > 1)'
      ctx.fillText(statusText, 20, 20)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [playing, sigma, kR, Oh, tick, curve])

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
          <span style={{ color: 'var(--text-muted)' }}>파수 kR =</span>
          <input
            type="range"
            min={0.05}
            max={1.5}
            step={0.01}
            value={kR}
            onChange={(e) => setKR(parseFloat(e.target.value))}
          />
          <code>{kR.toFixed(2)}</code>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>Ohnesorge =</span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={Oh}
            onChange={(e) => setOh(parseFloat(e.target.value))}
          />
          <code>{Oh.toFixed(2)}</code>
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
          {playing ? '일시정지' : '재생'}
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
          리셋
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
        kR은 파장 λ를 반지름으로 나눈 값(λ = 2πR/kR). kR &lt; 1이면 Plateau 조건을 만족해 불안정,
        가장 빠른 성장은 kR ≈ 0.697에서 발생한다. Ohnesorge를 올리면 점성이 커져 성장이 느려진다.
      </div>
    </div>
  )
}
