'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Sub = {
  key: 'a' | 'b' | 'c'
  label: string
  colour: string
  speed: number
}

const W = 720
const H = 340
const PAD_L = 54
const PAD_R = 14
const PAD_T = 26
const PAD_B = 58

export function SubsystemEigenFanDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logMach, setLogMach] = useState(-1.0)
  const [alpha, setAlpha] = useState(0.5)
  const [implicitC, setImplicitC] = useState(false)
  const [implicitA, setImplicitA] = useState(true)
  const [running, setRunning] = useState(true)
  const tRef = useRef(0)
  const [tShown, setShown] = useState(0)

  const mach = Math.pow(10, logMach)

  const subs = useMemo<Sub[]>(() => {
    // c^RS(chi) with unit reference sound speeds and densities
    const acoustic = Math.sqrt(alpha / (mach * mach) + (1 - alpha) / (mach * mach))
    const material = 1.0
    // lambda^+ of the stiff mixture subsystem (3.19), w = u1 - u2 set to 0
    const chi = alpha
    const s = chi * (1 - chi)
    const kk = 1 / (mach * mach * alpha) + 1 / (mach * mach * (1 - alpha))
    const relative = Math.sqrt(s * kk)
    return [
      { key: 'a', label: 'f^a  fast acoustics  ρu, p̂', colour: '#38bdf8', speed: acoustic },
      { key: 'b', label: 'f^b  material transport  u', colour: '#4ade80', speed: material },
      { key: 'c', label: 'f^c  relative velocity  u₁−u₂, ĥ', colour: '#f472b6', speed: relative },
    ]
  }, [mach, alpha])

  const explicitSpeed = useMemo(() => {
    let m = 0
    for (const s of subs) {
      if (s.key === 'a' && implicitA) continue
      if (s.key === 'c' && implicitC) continue
      m = Math.max(m, s.speed)
    }
    return m
  }, [subs, implicitA, implicitC])

  const dtAllowed = explicitSpeed > 0 ? 1 / explicitSpeed : Infinity
  const dtMaterial = 1 / 1.0

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const maxSpeed = Math.max(...subs.map((s) => s.speed))
    const xOf = (x: number) => PAD_L + ((x + 1) / 2) * (W - PAD_L - PAD_R)
    const yOf = (t: number) => H - PAD_B - t * (H - PAD_T - PAD_B)

    const draw = () => {
      if (running) tRef.current = (tRef.current + 0.006) % 1.15
      const tNow = Math.min(tRef.current, 1)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1120'
      ctx.fillRect(0, 0, W, H)

      // axes
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD_L, PAD_T)
      ctx.lineTo(PAD_L, H - PAD_B)
      ctx.lineTo(W - PAD_R, H - PAD_B)
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('x / Δx', W - PAD_R - 44, H - PAD_B + 16)
      ctx.save()
      ctx.translate(16, PAD_T + 78)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('t / Δt', 0, 0)
      ctx.restore()

      // one-cell stencil band: |x| <= 1 is what an explicit update can see
      ctx.fillStyle = 'rgba(148,163,184,0.10)'
      ctx.fillRect(xOf(-1), PAD_T, xOf(1) - xOf(-1), H - PAD_T - PAD_B)
      ctx.strokeStyle = '#64748b'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(xOf(-1), PAD_T)
      ctx.lineTo(xOf(-1), H - PAD_B)
      ctx.moveTo(xOf(1), PAD_T)
      ctx.lineTo(xOf(1), H - PAD_B)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#64748b'
      ctx.fillText('x = ±Δx  (explicit stencil)', xOf(1) + 6, PAD_T + 12)

      // characteristic fans, x normalised by the largest speed * dt
      for (const s of subs) {
        const isImplicit = (s.key === 'a' && implicitA) || (s.key === 'c' && implicitC)
        const rel = s.speed / maxSpeed
        ctx.lineWidth = isImplicit ? 1.2 : 2.4
        ctx.strokeStyle = s.colour
        if (isImplicit) ctx.setLineDash([3, 5])
        for (const sign of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(xOf(0), yOf(0))
          ctx.lineTo(xOf(sign * rel * tNow), yOf(tNow))
          ctx.stroke()
        }
        ctx.setLineDash([])
        // travelling front markers
        for (const sign of [-1, 1]) {
          ctx.beginPath()
          ctx.arc(xOf(sign * rel * tNow), yOf(tNow), isImplicit ? 2.5 : 4, 0, Math.PI * 2)
          ctx.fillStyle = s.colour
          ctx.globalAlpha = isImplicit ? 0.45 : 1
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      // legend with the numbers
      ctx.font = '11px ui-monospace, monospace'
      let ly = PAD_T + 4
      for (const s of subs) {
        const isImplicit = (s.key === 'a' && implicitA) || (s.key === 'c' && implicitC)
        ctx.fillStyle = s.colour
        ctx.globalAlpha = isImplicit ? 0.5 : 1
        ctx.fillRect(PAD_L + 12, ly, 18, 3)
        ctx.fillText(
          `${s.label}   λ = ${s.speed.toFixed(2)}${isImplicit ? '  [implicit]' : ''}`,
          PAD_L + 36,
          ly + 5,
        )
        ctx.globalAlpha = 1
        ly += 17
      }

      // allowed dt bar
      const barY = H - PAD_B + 26
      const barW = W - PAD_L - PAD_R
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(PAD_L, barY, barW, 12)
      const frac = Number.isFinite(dtAllowed) ? Math.min(1, dtAllowed / dtMaterial) : 1
      ctx.fillStyle = frac > 0.9 ? '#4ade80' : frac > 0.2 ? '#fbbf24' : '#f87171'
      ctx.fillRect(PAD_L, barY, barW * frac, 12)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(
        `Δt_stable / Δt_material = ${Number.isFinite(dtAllowed) ? (dtAllowed / dtMaterial).toFixed(4) : '1.0000'}   M = ${mach.toExponential(2)}`,
        PAD_L + 4,
        barY - 4,
      )

      frame += 1
      if (frame % 12 === 0) setShown(tNow)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [subs, implicitA, implicitC, running, dtAllowed, mach])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.9rem',
          alignItems: 'center',
          marginTop: '0.7rem',
          fontSize: '0.82rem',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label>
          log₁₀M = {logMach.toFixed(2)} (M = {mach.toExponential(1)})
          <input
            type="range"
            min={-3}
            max={0}
            step={0.05}
            value={logMach}
            onChange={(e) => setLogMach(Number(e.target.value))}
            style={{ display: 'block', width: 200 }}
          />
        </label>
        <label>
          α = {alpha.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.01}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            style={{ display: 'block', width: 160 }}
          />
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={implicitA} onChange={(e) => setImplicitA(e.target.checked)} />
          f^a implicit
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={implicitC} onChange={(e) => setImplicitC(e.target.checked)} />
          f^c implicit
        </label>
        <button type="button" onClick={() => setRunning((r) => !r)}>
          {running ? 'pause' : 'play'}
        </button>
        <span style={{ opacity: 0.65 }}>t = {tShown.toFixed(2)} Δt</span>
      </div>
    </div>
  )
}
