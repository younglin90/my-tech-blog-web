'use client'

import { useEffect, useRef, useState } from 'react'

// Animated water droplet on a hot plate. The surface temperature sets the
// boiling regime, which changes how the droplet behaves and how long it lives.
// Tsat = 100 C for water at 1 atm; ΔTe = Ts - 100.

interface Bubble {
  x: number
  y: number
  r: number
  vy: number
}

export function LeidenfrostDropletDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [surfaceT, setSurfaceT] = useState(160)
  const stateRef = useRef({
    dropX: 0,
    dropVX: 0,
    dropR: 26,
    bubbles: [] as Bubble[],
    skitterPhase: 0,
    lifetime: 0,
  })

  // Leidenfrost point for water ~ 200 C (ΔTe ~ 100).
  const LEIDENFROST_T = 200

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const plateY = H - 46
    let raf = 0
    let last = performance.now()
    const st = stateRef.current
    if (st.dropX === 0) st.dropX = W / 2

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const Ts = surfaceT
      const dTe = Ts - 100
      const leid = Ts >= LEIDENFROST_T

      // Vapor film gap grows with superheat once in film boiling.
      const gap = leid ? 3 + (Ts - LEIDENFROST_T) * 0.05 : 0

      // Droplet horizontal motion: levitating droplets skitter freely;
      // nucleate-boiling droplets stay roughly pinned.
      if (leid) {
        st.skitterPhase += dt * (1.5 + (Ts - LEIDENFROST_T) * 0.01)
        st.dropVX += (Math.sin(st.skitterPhase * 1.7) + Math.sin(st.skitterPhase * 0.6)) * 6 * dt
        st.dropVX *= 0.96
        st.dropX += st.dropVX
      } else {
        st.dropX += (W / 2 - st.dropX) * 0.05
        st.dropVX = 0
      }
      const margin = st.dropR + gap + 6
      if (st.dropX < margin) {
        st.dropX = margin
        st.dropVX = Math.abs(st.dropVX)
      }
      if (st.dropX > W - margin) {
        st.dropX = W - margin
        st.dropVX = -Math.abs(st.dropVX)
      }

      // Background
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1626'
      ctx.fillRect(0, 0, W, H)

      // Hot plate — color shifts toward red-hot with temperature.
      const heat = Math.min((Ts - 100) / 300, 1)
      const r = Math.round(80 + heat * 175)
      const g = Math.round(40 + (1 - heat) * 60)
      ctx.fillStyle = `rgb(${r},${g},${50})`
      ctx.fillRect(0, plateY, W, H - plateY)
      ctx.fillStyle = 'rgba(255,200,120,' + (0.15 + heat * 0.3) + ')'
      ctx.fillRect(0, plateY, W, 4)

      const dropBottom = plateY - gap
      const cx = st.dropX
      const cy = dropBottom - st.dropR

      if (leid) {
        // Vapor film glow under the droplet
        const grad = ctx.createLinearGradient(0, dropBottom, 0, plateY)
        grad.addColorStop(0, 'rgba(180,210,255,0.5)')
        grad.addColorStop(1, 'rgba(180,210,255,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(cx, plateY - gap / 2, st.dropR * 1.1, gap / 2 + 3, 0, 0, Math.PI * 2)
        ctx.fill()
        // Levitating droplet is flattened slightly
        ctx.fillStyle = 'rgba(80,180,230,0.9)'
        ctx.beginPath()
        ctx.ellipse(cx, cy + 3, st.dropR * 1.05, st.dropR * 0.92, 0, 0, Math.PI * 2)
        ctx.fill()
        // slow evaporation
        st.lifetime += dt
        st.dropR -= dt * 0.6
      } else if (dTe <= 0) {
        // Below boiling: a calm sitting droplet
        ctx.fillStyle = 'rgba(80,180,230,0.9)'
        ctx.beginPath()
        ctx.arc(cx, cy, st.dropR, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Nucleate / transition: droplet sits, spawning bubbles, fast evaporation
        ctx.fillStyle = 'rgba(80,180,230,0.9)'
        ctx.beginPath()
        ctx.arc(cx, cy, st.dropR, 0, Math.PI * 2)
        ctx.fill()

        const rate = Math.min(dTe / 30, 1) * 3
        if (Math.random() < rate * dt * 20) {
          st.bubbles.push({
            x: cx + (Math.random() - 0.5) * st.dropR * 1.4,
            y: dropBottom - 4,
            r: 2 + Math.random() * 3,
            vy: -20 - Math.random() * 30,
          })
        }
        // faster evaporation near nucleate peak
        st.dropR -= dt * (1.0 + rate * 0.6)
      }

      // Update + draw bubbles (rising inside/around the droplet)
      ctx.fillStyle = 'rgba(220,240,255,0.8)'
      st.bubbles = st.bubbles.filter((b) => b.y > cy - st.dropR && b.r > 0.5)
      for (const b of st.bubbles) {
        b.y += b.vy * dt
        b.r -= dt * 1.2
        ctx.beginPath()
        ctx.arc(b.x, b.y, Math.max(b.r, 0.5), 0, Math.PI * 2)
        ctx.fill()
      }

      // Respawn droplet when fully evaporated
      if (st.dropR < 6) {
        st.dropR = 26
        st.bubbles = []
      }

      // Labels
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px ui-monospace, monospace'
      const regimeName = leid
        ? 'Film boiling (Leidenfrost) — droplet levitates'
        : dTe <= 0
        ? 'Below boiling — calm droplet'
        : dTe < 30
        ? 'Nucleate boiling — rapid bubbling'
        : 'Transition boiling — violent sputtering'
      ctx.fillText(regimeName, 12, 20)
      ctx.fillText(`Ts = ${Ts} °C   ΔTe = ${dTe} °C`, 12, 38)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [surfaceT])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={620}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <label style={{ display: 'block', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
        Surface temperature Ts = {surfaceT} °C
        <input
          type="range"
          min={90}
          max={400}
          step={5}
          value={surfaceT}
          onChange={(e) => setSurfaceT(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#22d3ee' }}
        />
      </label>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
        Push Ts past ~200 °C and the droplet lifts onto its own vapor film — the Leidenfrost
        effect. Counterintuitively it now lives far longer than at 130 °C.
      </p>
    </div>
  )
}
