'use client'

import { useEffect, useRef, useState } from 'react'

// Specific-energy diagram for rectangular open-channel flow.
// E(h) = h + q^2 / (2 g h^2).  The nose of the curve is the critical
// depth h_c = (q^2/g)^(1/3), where E is minimal and Fr = 1.
// Upper branch: subcritical (tranquil).  Lower branch: supercritical (rapid).

const G = 9.81

export function SpecificEnergyDiagram() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [q, setQ] = useState(0.8) // unit-width discharge, m^2/s
  const [h, setH] = useState(0.2) // operating depth, m

  const hc = Math.cbrt((q * q) / G)
  const u = q / h
  const fr = u / Math.sqrt(G * h)
  const E = h + (q * q) / (2 * G * h * h)
  const regime = fr > 1.02 ? 'supercritical (사류)' : fr < 0.98 ? 'subcritical (상류)' : 'critical (임계)'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = 460
    const H = 360
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const pad = 44
    const hMax = 1.6
    const eMax = 2.2
    const x = (e: number) => pad + (e / eMax) * (W - pad - 16)
    const y = (d: number) => H - pad - (d / hMax) * (H - pad - 16)

    // axes
    ctx.strokeStyle = '#7a90a8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, y(0))
    ctx.lineTo(x(eMax), y(0))
    ctx.moveTo(pad, y(0))
    ctx.lineTo(pad, y(hMax))
    ctx.stroke()
    ctx.fillStyle = '#7a90a8'
    ctx.font = '12px monospace'
    ctx.fillText('E (m)', x(eMax) - 42, y(0) + 26)
    ctx.save()
    ctx.translate(14, y(hMax) + 40)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('h (m)', 0, 0)
    ctx.restore()

    // E = h asymptote (45-degree line the curve hugs for large h)
    ctx.strokeStyle = 'rgba(122,144,168,0.45)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x(0), y(0))
    ctx.lineTo(x(hMax), y(hMax))
    ctx.stroke()
    ctx.setLineDash([])

    // specific-energy curve E(h)
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false
    for (let d = 0.03; d <= hMax; d += 0.004) {
      const e = d + (q * q) / (2 * G * d * d)
      if (e > eMax) continue
      const px = x(e)
      const py = y(d)
      if (!started) {
        ctx.moveTo(px, py)
        started = true
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()

    // critical point (nose)
    const eCrit = 1.5 * hc
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(x(eCrit), y(hc), 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillText('hc', x(eCrit) + 8, y(hc) - 6)

    // operating point
    if (E <= eMax && h <= hMax) {
      ctx.strokeStyle = 'rgba(226,232,240,0.5)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(x(E), y(0))
      ctx.lineTo(x(E), y(h))
      ctx.lineTo(pad, y(h))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = fr > 1 ? '#ef4444' : '#38bdf8'
      ctx.beginPath()
      ctx.arc(x(E), y(h), 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [q, h, hc, E])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, margin: '20px 0', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
        <div style={{ flex: '1 1 200px', minWidth: 200, fontSize: 14 }}>
          <label style={{ display: 'block', marginBottom: 10 }}>
            q (unit-width discharge): <strong>{q.toFixed(2)}</strong> m²/s
            <input type="range" min={0.3} max={1.6} step={0.05} value={q} onChange={(e) => setQ(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginBottom: 14 }}>
            h (flow depth): <strong>{h.toFixed(2)}</strong> m
            <input type="range" min={0.08} max={1.5} step={0.01} value={h} onChange={(e) => setH(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <div style={{ fontFamily: 'monospace', lineHeight: 1.9 }}>
            <div>u = q/h = <strong>{u.toFixed(2)}</strong> m/s</div>
            <div>Fr = u/√(gh) = <strong style={{ color: fr > 1 ? '#ef4444' : '#38bdf8' }}>{fr.toFixed(2)}</strong></div>
            <div>E = <strong>{E.toFixed(2)}</strong> m</div>
            <div>h_c = <strong style={{ color: '#f59e0b' }}>{hc.toFixed(2)}</strong> m</div>
            <div style={{ marginTop: 6 }}>{regime}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
