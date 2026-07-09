'use client'

import { useEffect, useRef, useState } from 'react'

const W = 560
const H = 260

const DOF_LABELS = ['u₁', 'v₁', 'u₂', 'v₂']

// 4x4 global stiffness of a unit-EA/L 2D bar at orientation theta.
function stiffness(theta: number): number[][] {
  const c = Math.cos(theta), s = Math.sin(theta)
  return [
    [c * c, c * s, -c * c, -c * s],
    [c * s, s * s, -c * s, -s * s],
    [-c * c, -c * s, c * c, c * s],
    [-c * s, -s * s, c * s, s * s],
  ]
}

export function BarElementStiffnessMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angleDeg, setAngleDeg] = useState(30)
  const [spin, setSpin] = useState(false)
  const stateRef = useRef({ angleDeg, spin })
  stateRef.current = { angleDeg, spin }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t0: number | null = null
    let spun = 0

    const frame = (ts: number) => {
      if (t0 === null) t0 = ts
      const dt = (ts - t0) / 1000; t0 = ts
      const s = stateRef.current
      if (s.spin) spun = (spun + dt * 30) % 180
      const deg = s.spin ? spun : s.angleDeg
      const theta = (deg * Math.PI) / 180
      const K = stiffness(theta)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(8,17,31,0.6)'
      ctx.fillRect(0, 0, W, H)

      // --- Left: the bar element at orientation theta. ---
      const cx = 150, cy = H / 2, R = 78
      const c = Math.cos(theta), sn = Math.sin(theta)
      const x1 = cx - c * R, y1 = cy + sn * R
      const x2 = cx + c * R, y2 = cy - sn * R
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke()
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath(); ctx.arc(x1, y1, 5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x2, y2, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(203,213,225,0.85)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('node 1', x1 - 42, y1 + 4)
      ctx.fillText('node 2', x2 + 8, y2 + 4)
      ctx.fillText(`θ = ${deg.toFixed(0)}°`, cx - 22, cy + R + 24)
      ctx.fillText(`c = ${c.toFixed(2)}  s = ${sn.toFixed(2)}`, cx - 58, 24)

      // --- Right: the 4x4 matrix as a colored grid. ---
      const gx = 320, gy = 46, cell = 44
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const v = K[i][j]
          const mag = Math.min(1, Math.abs(v))
          ctx.fillStyle = v >= 0
            ? `rgba(45,212,191,${0.12 + 0.7 * mag})`
            : `rgba(244,114,182,${0.12 + 0.7 * mag})`
          ctx.fillRect(gx + j * cell, gy + i * cell, cell - 2, cell - 2)
          ctx.fillStyle = 'rgba(15,23,42,0.95)'
          ctx.font = '11px ui-monospace, monospace'
          ctx.fillText(v.toFixed(2), gx + j * cell + 5, gy + i * cell + cell / 2 + 3)
        }
      }
      // Row / column DOF labels.
      ctx.fillStyle = 'rgba(203,213,225,0.85)'
      ctx.font = '12px ui-monospace, monospace'
      for (let k = 0; k < 4; k++) {
        ctx.fillText(DOF_LABELS[k], gx + k * cell + 12, gy - 8)
        ctx.fillText(DOF_LABELS[k], gx - 20, gy + k * cell + cell / 2 + 4)
      }
      ctx.fillText('k = (EA/L) ×', gx - 4, gy + 4 * cell + 22)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10, alignItems: 'end' }}>
        <label style={lab}>Orientation &theta;: {angleDeg}&deg;
          <input type="range" min={0} max={180} value={angleDeg} disabled={spin}
            onChange={(e) => setAngleDeg(+e.target.value)} style={{ width: 180 }} />
        </label>
        <label style={{ ...lab, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} />
          Auto-rotate
        </label>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: W, borderRadius: 8, display: 'block' }} />
      <p style={caption}>
        Teal cells are positive, pink negative. At &theta; = 0&deg; only the horizontal DOFs carry stiffness; rotate the
        bar and the entries redistribute as <b>c&sup2;</b>, <b>s&sup2;</b>, and <b>cs</b> &mdash; every 2&times;2 block is rank one.
      </p>
    </div>
  )
}

const card: React.CSSProperties = {
  margin: '1.5rem 0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12,
  padding: 14, background: 'rgba(15,23,42,0.35)',
}
const lab: React.CSSProperties = { display: 'flex', flexDirection: 'column', fontSize: 12, color: '#cbd5e1', gap: 4 }
const caption: React.CSSProperties = { fontSize: 12, color: 'rgba(148,163,184,0.85)', marginTop: 8 }

export default BarElementStiffnessMatrix
