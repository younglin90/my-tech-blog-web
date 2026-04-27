'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const CANVAS_W = 720
const CANVAS_H = 360
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const N_TRACERS = 90

type Tracer = {
  x: number
  y: number
  phase: number
  shade: number
}

function rankineSpeed(r: number, R: number, Umax: number): number {
  if (r < 1e-3) return 0
  if (r <= R) return (Umax * r) / R
  return (Umax * R) / r
}

function rankineVelocity(x: number, y: number, R: number, Umax: number) {
  const dx = x - CX
  const dy = y - CY
  const r = Math.hypot(dx, dy)
  const v = rankineSpeed(r, R, Umax)
  if (r < 1e-3) return { vx: 0, vy: 0, r, v }
  const nx = -dy / r
  const ny = dx / r
  return { vx: v * nx, vy: v * ny, r, v }
}

function makeTracers(): Tracer[] {
  const arr: Tracer[] = []
  for (let i = 0; i < N_TRACERS; i++) {
    const ang = Math.random() * Math.PI * 2
    const rr = 16 + Math.random() * 150
    arr.push({
      x: CX + Math.cos(ang) * rr,
      y: CY + Math.sin(ang) * rr,
      phase: Math.random() * Math.PI * 2,
      shade: 0.4 + Math.random() * 0.6,
    })
  }
  return arr
}

export function RankineVortexExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tracersRef = useRef<Tracer[]>(makeTracers())
  const [coreR, setCoreR] = useState(70)
  const [umax, setUmax] = useState(110)
  const [showVorticity, setShowVorticity] = useState(true)
  const [playing, setPlaying] = useState(true)

  const omegaCore = useMemo(() => umax / coreR, [umax, coreR])

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

      if (showVorticity) {
        ctx.fillStyle = 'rgba(34,211,238,0.16)'
        ctx.beginPath()
        ctx.arc(CX, CY, coreR, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(34,211,238,0.55)'
        ctx.lineWidth = 1.4
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      for (const ringR of [40, 80, 120, 160]) {
        ctx.beginPath()
        ctx.arc(CX, CY, ringR, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (playing) {
        for (const tr of tracersRef.current) {
          const { vx, vy, r } = rankineVelocity(tr.x, tr.y, coreR, umax)
          tr.x += vx * dt
          tr.y += vy * dt
          if (r > 220) {
            const ang = Math.random() * Math.PI * 2
            const rr = 18 + Math.random() * 100
            tr.x = CX + Math.cos(ang) * rr
            tr.y = CY + Math.sin(ang) * rr
          }
        }
      }

      for (const tr of tracersRef.current) {
        const { r } = rankineVelocity(tr.x, tr.y, coreR, umax)
        const isCore = r < coreR
        ctx.fillStyle = isCore
          ? `rgba(252,211,77,${tr.shade})`
          : `rgba(125,211,252,${tr.shade})`
        ctx.beginPath()
        ctx.arc(tr.x, tr.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      const stepN = 18
      const step = CANVAS_W / stepN
      ctx.strokeStyle = 'rgba(226,232,240,0.45)'
      ctx.lineWidth = 1
      for (let ix = 1; ix < stepN; ix++) {
        for (let iy = 1; iy < Math.floor(CANVAS_H / step); iy++) {
          const px = ix * step
          const py = iy * step
          const { vx, vy } = rankineVelocity(px, py, coreR, umax)
          const m = Math.hypot(vx, vy)
          if (m < 0.5) continue
          const len = Math.min(step * 0.42, m * 0.06)
          const nx = (vx / m) * len
          const ny = (vy / m) * len
          ctx.beginPath()
          ctx.moveTo(px - nx * 0.5, py - ny * 0.5)
          ctx.lineTo(px + nx * 0.5, py + ny * 0.5)
          ctx.stroke()
        }
      }

      const plotX0 = CANVAS_W - 200
      const plotY0 = 18
      const plotW = 180
      const plotH = 90
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(plotX0, plotY0, plotW, plotH)
      ctx.fillStyle = 'rgba(15,23,42,0.7)'
      ctx.fillRect(plotX0, plotY0, plotW, plotH)
      ctx.strokeRect(plotX0, plotY0, plotW, plotH)

      const rMaxPlot = 200
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let i = 0; i <= 80; i++) {
        const r = (i / 80) * rMaxPlot
        const u = rankineSpeed(r, coreR, umax)
        const px = plotX0 + (i / 80) * plotW
        const py = plotY0 + plotH - (u / (umax * 1.05)) * plotH
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      const splitPx = plotX0 + (coreR / rMaxPlot) * plotW
      ctx.strokeStyle = 'rgba(252,211,77,0.7)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(splitPx, plotY0)
      ctx.lineTo(splitPx, plotY0 + plotH)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(226,232,240,0.85)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('u_θ(r)', plotX0 + 4, plotY0 + 12)
      ctx.fillText('r→', plotX0 + plotW - 22, plotY0 + plotH - 4)
      ctx.fillStyle = 'rgba(252,211,77,0.9)'
      ctx.fillText('R', splitPx - 4, plotY0 + plotH + 12)

      ctx.fillStyle = 'rgba(252,211,77,0.95)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(
        `inside core: ω = 2·(U/R) = ${(2 * omegaCore).toFixed(2)} /s · forced (rotational)`,
        16,
        22,
      )
      ctx.fillStyle = 'rgba(125,211,252,0.95)'
      ctx.fillText(
        'outside core: ω = 0 · free (irrotational, ∇×u = 0)',
        16,
        40,
      )

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [coreR, umax, showVorticity, playing, omegaCore])

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
          <span style={{ color: 'var(--text-muted)' }}>core radius R =</span>
          <input
            type="range"
            min={20}
            max={140}
            step={2}
            value={coreR}
            onChange={(e) => setCoreR(parseFloat(e.target.value))}
          />
          <code>{coreR}</code>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)' }}>U_max =</span>
          <input
            type="range"
            min={30}
            max={220}
            step={5}
            value={umax}
            onChange={(e) => setUmax(parseFloat(e.target.value))}
          />
          <code>{umax}</code>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showVorticity}
            onChange={(e) => setShowVorticity(e.target.checked)}
          />
          <span style={{ color: 'var(--text-muted)' }}>highlight core (ω ≠ 0)</span>
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
        Yellow tracers sit inside the forced-vortex core and rotate as a solid body
        (ω = 2U/R). Blue tracers outside follow u_θ = ΓR/r — circular streamlines but
        zero local spin. The Rankine combined vortex is the simplest model for a
        bath-tub drain or tornado.
      </div>
    </div>
  )
}
