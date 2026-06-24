'use client'

import { useEffect, useRef, useState } from 'react'

// Ratio of specific heats for air (cold air-standard).
const K = 1.4

type Cycle = 'otto' | 'diesel'

// Four corner states of the air-standard cycle in (V, P) space.
// State 1 is normalized to V=1, P=1.
function cyclePoints(cycle: Cycle, r: number, heat: number) {
  const V1 = 1
  const P1 = 1
  const V2 = 1 / r
  const P2 = P1 * Math.pow(r, K) // isentropic compression 1->2
  let V3: number
  let P3: number
  if (cycle === 'otto') {
    // heat = pressure ratio alpha = P3/P2 (constant-volume heat addition)
    V3 = V2
    P3 = P2 * heat
  } else {
    // heat = cut-off ratio rc = V3/V2 (constant-pressure heat addition)
    P3 = P2
    V3 = V2 * heat
  }
  const V4 = V1
  const P4 = P3 * Math.pow(V3 / V4, K) // isentropic expansion 3->4
  return { V1, P1, V2, P2, V3, P3, V4, P4 }
}

function efficiency(cycle: Cycle, r: number, heat: number) {
  if (cycle === 'otto') return 1 - 1 / Math.pow(r, K - 1)
  const rc = heat
  return 1 - (1 / Math.pow(r, K - 1)) * (Math.pow(rc, K) - 1) / (K * (rc - 1))
}

// Sample the closed cycle into a dense polyline so we can animate a marker.
function samplePath(cycle: Cycle, r: number, heat: number) {
  const p = cyclePoints(cycle, r, heat)
  const pts: { V: number; P: number }[] = []
  const N = 40

  // 1->2 isentropic compression
  for (let i = 0; i <= N; i++) {
    const V = p.V1 + (p.V2 - p.V1) * (i / N)
    pts.push({ V, P: p.P1 * Math.pow(p.V1 / V, K) })
  }
  // 2->3 heat addition
  for (let i = 1; i <= N; i++) {
    const t = i / N
    pts.push({ V: p.V2 + (p.V3 - p.V2) * t, P: p.P2 + (p.P3 - p.P2) * t })
  }
  // 3->4 isentropic expansion
  for (let i = 1; i <= N; i++) {
    const V = p.V3 + (p.V4 - p.V3) * (i / N)
    pts.push({ V, P: p.P3 * Math.pow(p.V3 / V, K) })
  }
  // 4->1 constant-volume heat rejection
  for (let i = 1; i <= N; i++) {
    const t = i / N
    pts.push({ V: p.V4, P: p.P4 + (p.P1 - p.P4) * t })
  }
  return pts
}

export function OttoDieselPVDiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cycle, setCycle] = useState<Cycle>('otto')
  const [r, setR] = useState(9)
  // heat slider: Otto -> pressure ratio, Diesel -> cut-off ratio
  const [heat, setHeat] = useState(3)
  const markerRef = useRef(0)

  const heatMin = cycle === 'otto' ? 1.5 : 1.2
  const heatMax = cycle === 'otto' ? 6 : 3
  const heatLabel = cycle === 'otto' ? 'Heat (pressure ratio P₃/P₂)' : 'Heat (cut-off ratio V₃/V₂)'

  const eta = efficiency(cycle, r, Math.min(Math.max(heat, heatMin), heatMax))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const W = 520
    const H = 360
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.height = 'auto'
    ctx.scale(dpr, dpr)

    const clamped = Math.min(Math.max(heat, heatMin), heatMax)
    const pts = samplePath(cycle, r, clamped)
    const cp = cyclePoints(cycle, r, clamped)

    const pad = { l: 56, r: 16, t: 20, b: 40 }
    const plotW = W - pad.l - pad.r
    const plotH = H - pad.t - pad.b

    const Pmax = Math.max(...pts.map((q) => q.P)) * 1.08
    const Vmax = 1.05
    const Vmin = 0

    const sx = (V: number) => pad.l + ((V - Vmin) / (Vmax - Vmin)) * plotW
    const sy = (P: number) => pad.t + plotH - (P / Pmax) * plotH

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // axes
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad.l, pad.t)
      ctx.lineTo(pad.l, pad.t + plotH)
      ctx.lineTo(pad.l + plotW, pad.t + plotH)
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '13px ui-sans-serif, system-ui'
      ctx.fillText('P', pad.l - 44, pad.t + 8)
      ctx.fillText('Volume V', pad.l + plotW - 70, pad.t + plotH + 28)
      ctx.save()
      ctx.translate(pad.l - 40, pad.t + plotH / 2 + 26)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('Pressure', 0, 0)
      ctx.restore()

      // filled net-work area
      ctx.beginPath()
      ctx.moveTo(sx(pts[0].V), sy(pts[0].P))
      pts.forEach((q) => ctx.lineTo(sx(q.V), sy(q.P)))
      ctx.closePath()
      ctx.fillStyle = 'rgba(34, 211, 238, 0.13)'
      ctx.fill()

      // cycle curve
      ctx.beginPath()
      ctx.moveTo(sx(pts[0].V), sy(pts[0].P))
      pts.forEach((q) => ctx.lineTo(sx(q.V), sy(q.P)))
      ctx.closePath()
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.stroke()

      // corner labels
      const corners: [number, number, string][] = [
        [cp.V1, cp.P1, '1'],
        [cp.V2, cp.P2, '2'],
        [cp.V3, cp.P3, '3'],
        [cp.V4, cp.P4, '4'],
      ]
      corners.forEach(([V, P, label]) => {
        ctx.beginPath()
        ctx.arc(sx(V), sy(P), 4, 0, Math.PI * 2)
        ctx.fillStyle = '#f59e0b'
        ctx.fill()
        ctx.fillStyle = '#cbd5e1'
        ctx.font = 'bold 13px ui-sans-serif, system-ui'
        ctx.fillText(label, sx(V) + 7, sy(P) - 6)
      })

      // travelling marker
      markerRef.current = (markerRef.current + 1) % pts.length
      const m = pts[markerRef.current]
      ctx.beginPath()
      ctx.arc(sx(m.V), sy(m.P), 6, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [cycle, r, heat, heatMin, heatMax])

  return (
    <div
      style={{
        border: '1px solid var(--border, #334155)',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: 'var(--surface, rgba(255,255,255,0.02))',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['otto', 'diesel'] as Cycle[]).map((c) => (
          <button
            key={c}
            onClick={() => {
              setCycle(c)
              setHeat(c === 'otto' ? 3 : 2)
              setR(c === 'otto' ? 9 : 18)
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #475569',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: cycle === c ? '#22d3ee' : 'transparent',
              color: cycle === c ? '#08111f' : '#94a3b8',
            }}
          >
            {c === 'otto' ? 'Otto (gasoline)' : 'Diesel'}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} />

      <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>
          Compression ratio r = {r.toFixed(1)}
          <input
            type="range"
            min={4}
            max={24}
            step={0.5}
            value={r}
            onChange={(e) => setR(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 10 }}>
          {heatLabel} = {Math.min(Math.max(heat, heatMin), heatMax).toFixed(2)}
          <input
            type="range"
            min={heatMin}
            max={heatMax}
            step={0.05}
            value={Math.min(Math.max(heat, heatMin), heatMax)}
            onChange={(e) => setHeat(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <div
          style={{
            marginTop: 6,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(34,211,238,0.10)',
            color: '#22d3ee',
            fontWeight: 600,
          }}
        >
          Thermal efficiency η = {(eta * 100).toFixed(1)}%
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>
            {'  '}(k = {K}, shaded area = net work)
          </span>
        </div>
      </div>
    </div>
  )
}
