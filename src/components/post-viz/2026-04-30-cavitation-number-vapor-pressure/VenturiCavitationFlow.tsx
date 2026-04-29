'use client'

import { useEffect, useRef, useState } from 'react'

const RHO = 1000
const P_AMBIENT = 101300
const P_VAPOR_20C = 2339

interface Bubble {
  x: number
  y: number
  r: number
  age: number
  life: number
  vx: number
  vy: number
}

function areaProfile(xNorm: number, throatRatio: number): number {
  const a0 = 0.3
  const a1 = 0.42
  const a2 = 0.58
  const a3 = 0.7
  if (xNorm <= a0) return 1
  if (xNorm < a1) {
    const t = (xNorm - a0) / (a1 - a0)
    const s = 0.5 - 0.5 * Math.cos(Math.PI * t)
    return 1 + (throatRatio - 1) * s
  }
  if (xNorm <= a2) return throatRatio
  if (xNorm < a3) {
    const t = (xNorm - a2) / (a3 - a2)
    const s = 0.5 - 0.5 * Math.cos(Math.PI * t)
    return throatRatio + (1 - throatRatio) * s
  }
  return 1
}

export function VenturiCavitationFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const rafRef = useRef<number>(0)

  const [uInlet, setUInlet] = useState(4.0)
  const [throatRatio, setThroatRatio] = useState(0.45)
  const [waterTemp, setWaterTemp] = useState(20)
  const [running, setRunning] = useState(true)

  const pVapor = (() => {
    const lnP = 23.2 - 3816.44 / (waterTemp + 227.02)
    return Math.exp(lnP)
  })()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const tubeTop = 40
    const tubeBottom = 200
    const tubeAxis = (tubeTop + tubeBottom) / 2
    const tubeHalf = (tubeBottom - tubeTop) / 2
    const plotTop = 230
    const plotBottom = 360
    const margin = 40

    let last = performance.now()

    const samples = 200
    const xs: number[] = []
    const areas: number[] = []
    const us: number[] = []
    const ps: number[] = []
    for (let i = 0; i <= samples; i++) {
      const xn = i / samples
      xs.push(xn)
      const a = areaProfile(xn, throatRatio)
      areas.push(a)
      const u = uInlet / a
      us.push(u)
      const p = P_AMBIENT + 0.5 * RHO * (uInlet * uInlet - u * u)
      ps.push(p)
    }
    const pMin = Math.min(...ps)
    const pMax = P_AMBIENT + 0.5 * RHO * uInlet * uInlet * 0.1
    const pLo = Math.min(pMin, pVapor) - 5000
    const pHi = Math.max(pMax, P_AMBIENT) + 5000
    const pRange = pHi - pLo

    const sigmaMin =
      (pMin - pVapor) / (0.5 * RHO * uInlet * uInlet || 1)

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      ctx.fillStyle = '#0a1628'
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = 'rgba(34, 211, 238, 0.06)'
      ctx.beginPath()
      ctx.moveTo(margin, tubeAxis)
      for (let i = 0; i <= samples; i++) {
        const px = margin + (xs[i] * (W - 2 * margin))
        const py = tubeAxis - tubeHalf * areas[i]
        ctx.lineTo(px, py)
      }
      for (let i = samples; i >= 0; i--) {
        const px = margin + (xs[i] * (W - 2 * margin))
        const py = tubeAxis + tubeHalf * areas[i]
        ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = '#7a90a8'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= samples; i++) {
        const px = margin + (xs[i] * (W - 2 * margin))
        const py = tubeAxis - tubeHalf * areas[i]
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.beginPath()
      for (let i = 0; i <= samples; i++) {
        const px = margin + (xs[i] * (W - 2 * margin))
        const py = tubeAxis + tubeHalf * areas[i]
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      for (let i = 0; i < samples; i += 4) {
        const px = margin + (xs[i] * (W - 2 * margin))
        const innerHalf = tubeHalf * areas[i] - 4
        if (innerHalf < 0) continue
        const cavitating = ps[i] < pVapor
        ctx.strokeStyle = cavitating
          ? 'rgba(239, 68, 68, 0.22)'
          : 'rgba(34, 211, 238, 0.18)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, tubeAxis - innerHalf)
        ctx.lineTo(px, tubeAxis + innerHalf)
        ctx.stroke()
      }

      if (running && pMin < pVapor) {
        const cavStart = xs.findIndex((_, i) => ps[i] < pVapor)
        const cavEndIdx = (() => {
          for (let i = samples; i >= 0; i--) if (ps[i] < pVapor) return i
          return cavStart
        })()
        if (cavStart >= 0 && cavEndIdx >= cavStart) {
          const spawnRate = Math.min(8, Math.floor((pVapor - pMin) / 800))
          for (let n = 0; n < spawnRate; n++) {
            const idx =
              cavStart + Math.floor(Math.random() * (cavEndIdx - cavStart + 1))
            const xn = xs[idx]
            const px = margin + xn * (W - 2 * margin)
            const innerHalf = tubeHalf * areas[idx] - 5
            if (innerHalf <= 0) continue
            const y = tubeAxis + (Math.random() - 0.5) * 2 * innerHalf
            bubblesRef.current.push({
              x: px,
              y,
              r: 1.5 + Math.random() * 2.0,
              age: 0,
              life: 0.4 + Math.random() * 0.7,
              vx: us[idx] * 12,
              vy: (Math.random() - 0.5) * 10,
            })
          }
        }
      }

      const surviving: Bubble[] = []
      for (const b of bubblesRef.current) {
        b.age += dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        if (b.age < b.life && b.x < W) {
          const xn = (b.x - margin) / (W - 2 * margin)
          if (xn >= 0 && xn <= 1) {
            const idx = Math.min(samples, Math.max(0, Math.floor(xn * samples)))
            const innerHalf = tubeHalf * areas[idx] - 3
            const cy = tubeAxis
            if (b.y > cy + innerHalf) b.y = cy + innerHalf
            if (b.y < cy - innerHalf) b.y = cy - innerHalf
          }
          const alpha = 1 - b.age / b.life
          ctx.fillStyle = `rgba(248, 250, 252, ${0.55 * alpha})`
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
          ctx.fill()
          surviving.push(b)
        } else if (b.x < W && b.age >= b.life) {
          ctx.strokeStyle = `rgba(239, 68, 68, 0.4)`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.r * 1.6, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      bubblesRef.current = surviving

      ctx.fillStyle = '#7a90a8'
      ctx.font = '11px sans-serif'
      ctx.fillText('inlet', margin + 4, tubeTop - 8)
      ctx.fillText('throat', W * 0.5 - 16, tubeTop - 8)
      ctx.fillText('outlet', W - margin - 36, tubeTop - 8)

      ctx.strokeStyle = '#1e3a5f'
      ctx.lineWidth = 1
      ctx.strokeRect(margin, plotTop, W - 2 * margin, plotBottom - plotTop)

      const yForP = (p: number) =>
        plotBottom - ((p - pLo) / pRange) * (plotBottom - plotTop)

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      const yVap = yForP(pVapor)
      ctx.moveTo(margin, yVap)
      ctx.lineTo(W - margin, yVap)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)'
      ctx.fillText(`p_vapor (${waterTemp}°C) ≈ ${(pVapor / 1000).toFixed(1)} kPa`, margin + 6, yVap - 4)

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= samples; i++) {
        const px = margin + xs[i] * (W - 2 * margin)
        const py = yForP(ps[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      for (let i = 0; i < samples; i++) {
        if (ps[i] < pVapor) {
          const px = margin + xs[i] * (W - 2 * margin)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'
          ctx.fillRect(px, yVap, (W - 2 * margin) / samples + 1, plotBottom - yVap)
        }
      }

      ctx.fillStyle = '#7a90a8'
      ctx.fillText('p (Pa)', margin - 30, plotTop - 6)
      ctx.fillText('x along tube', W - margin - 70, plotBottom + 16)

      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px sans-serif'
      const cavOn = pMin < pVapor
      ctx.fillText(
        `σ_min = ${sigmaMin.toFixed(2)}   p_min = ${(pMin / 1000).toFixed(1)} kPa   ${cavOn ? 'CAVITATING' : 'no cavitation'}`,
        margin,
        H - 8,
      )
      if (cavOn) {
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(W - 90, H - 22, 70, 14)
        ctx.fillStyle = '#0a1628'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText('CAVITATING', W - 84, H - 12)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [uInlet, throatRatio, waterTemp, running, pVapor])

  return (
    <div
      style={{
        background: '#0a1628',
        border: '1px solid #1e3a5f',
        borderRadius: 8,
        padding: 12,
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={680}
        height={400}
        style={{ width: '100%', maxWidth: 680, display: 'block', margin: '0 auto' }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 12,
          color: '#cbd5e1',
          fontSize: 13,
          fontFamily: 'sans-serif',
        }}
      >
        <label>
          Inlet velocity U: <strong>{uInlet.toFixed(1)} m/s</strong>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={uInlet}
            onChange={(e) => setUInlet(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Throat ratio A_min/A_in: <strong>{throatRatio.toFixed(2)}</strong>
          <input
            type="range"
            min={0.15}
            max={0.9}
            step={0.01}
            value={throatRatio}
            onChange={(e) => setThroatRatio(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Water temperature: <strong>{waterTemp}°C</strong>
          <input
            type="range"
            min={5}
            max={95}
            step={1}
            value={waterTemp}
            onChange={(e) => setWaterTemp(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '6px 12px',
            background: running ? '#1e3a5f' : '#22d3ee',
            color: running ? '#cbd5e1' : '#0a1628',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            alignSelf: 'end',
          }}
        >
          {running ? 'Pause bubbles' : 'Resume bubbles'}
        </button>
      </div>
      <p
        style={{
          color: '#7a90a8',
          fontSize: 12,
          marginTop: 8,
          marginBottom: 0,
          fontFamily: 'sans-serif',
        }}
      >
        Top: venturi tube cross-section. Bubbles spawn where p(x) {'<'} p_vapor and collapse
        downstream (red ring). Bottom: pressure profile and vapor-pressure threshold.
        Reference: water at 20°C with p_vapor ≈ {(P_VAPOR_20C / 1000).toFixed(1)} kPa
        (Antoine fit used for slider).
      </p>
    </div>
  )
}
