'use client'
import { useEffect, useRef, useState } from 'react'

// 2D acoustic refraction across a flat interface (Ballout et al. 2025, sec. 4.2).
// Snell's law:  sin(theta_i)/c1 = sin(theta_t)/c2.
// When c2 > c1 there is a critical angle theta_c = asin(c1/c2); beyond it the
// wave is totally reflected (no transmitted ray). The animation marches a
// wavefront along the incident, reflected and transmitted rays.

export function SnellAcousticRefraction() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [thetaIdeg, setThetaIdeg] = useState(10) // incidence angle [deg]
  const [csRatio, setCsRatio] = useState(4.32) // c2/c1 (air->water ~ 1481/343)

  const c1 = 1.0
  const c2 = csRatio
  const thetaI = (thetaIdeg * Math.PI) / 180
  const critical = c2 > c1 ? Math.asin(c1 / c2) : Math.PI / 2
  const sinT = (c2 / c1) * Math.sin(thetaI)
  const total = sinT > 1.0 // total internal reflection
  const thetaT = total ? null : Math.asin(sinT)
  const thetaCdeg = (critical * 180) / Math.PI

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = 560
    const H = 360
    cvs.width = W * dpr
    cvs.height = H * dpr
    cvs.style.width = W + 'px'
    cvs.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    const ox = W / 2
    const oy = H / 2 // interface at vertical center, hit point at center
    const len = 240

    let phase = 0
    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      // media backgrounds
      ctx.fillStyle = 'rgba(34,211,238,0.06)'
      ctx.fillRect(0, 0, W, oy)
      ctx.fillStyle = 'rgba(14,116,144,0.18)'
      ctx.fillRect(0, oy, W, H - oy)
      // interface + normal
      ctx.strokeStyle = 'rgba(226,232,240,0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, oy)
      ctx.lineTo(W, oy)
      ctx.stroke()
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.beginPath()
      ctx.moveTo(ox, 30)
      ctx.lineTo(ox, H - 30)
      ctx.stroke()
      ctx.setLineDash([])

      // incident ray (from upper-left toward hit point)
      const ix = ox - len * Math.sin(thetaI)
      const iy = oy - len * Math.cos(thetaI)
      drawRay(ctx, ix, iy, ox, oy, '#22d3ee', 'incident')
      // reflected ray (upper, mirrored)
      const rx = ox + len * Math.sin(thetaI)
      const ry = oy - len * Math.cos(thetaI)
      drawRay(ctx, ox, oy, rx, ry, total ? '#f59e0b' : '#7a90a8', total ? 'total reflection' : 'reflected')
      // transmitted ray (lower)
      if (thetaT !== null) {
        const tx = ox + len * Math.sin(thetaT)
        const ty = oy + len * Math.cos(thetaT)
        drawRay(ctx, ox, oy, tx, ty, '#0e7490', 'transmitted')
      }

      // marching wavefront marker along incident ray
      const m = (phase % 1)
      const wx = ix + (ox - ix) * m
      const wy = iy + (oy - iy) * m
      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(wx, wy, 4, 0, Math.PI * 2)
      ctx.fill()

      // angle labels
      ctx.fillStyle = 'rgba(226,232,240,0.9)'
      ctx.font = '13px sans-serif'
      ctx.fillText(`θi = ${thetaIdeg.toFixed(0)}°`, ix + 6, iy + 16)
      if (thetaT !== null) {
        const tx = ox + len * Math.sin(thetaT)
        ctx.fillText(`θt = ${((thetaT * 180) / Math.PI).toFixed(1)}°`, tx + 6, oy + len * Math.cos(thetaT) - 6)
      }
      ctx.fillStyle = 'rgba(148,163,184,0.85)'
      ctx.font = '12px sans-serif'
      ctx.fillText('medium 1 (slow, c1)', 10, 18)
      ctx.fillText('medium 2 (fast, c2)', 10, H - 12)

      phase += 0.012
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [thetaIdeg, csRatio, thetaI, thetaT, total])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, margin: '1.5rem 0', background: 'var(--surface)' }}>
      <canvas ref={ref} style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
        <label style={{ fontSize: 13 }}>
          incidence angle θi: <strong>{thetaIdeg.toFixed(0)}°</strong>
          <input type="range" min={0} max={45} step={1} value={thetaIdeg} onChange={(e) => setThetaIdeg(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ fontSize: 13 }}>
          sound speed ratio c2/c1: <strong>{csRatio.toFixed(2)}</strong>
          <input type="range" min={1.1} max={6} step={0.05} value={csRatio} onChange={(e) => setCsRatio(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>critical angle θc = <strong style={{ color: 'var(--accent)' }}>{thetaCdeg.toFixed(2)}°</strong></span>
        <span style={{ color: total ? '#f59e0b' : 'var(--text-muted)' }}>
          {total ? 'θi > θc → total internal reflection' : 'wave transmits into medium 2'}
        </span>
      </div>
    </div>
  )
}

function drawRay(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  label: string,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  // arrowhead
  const ang = Math.atan2(y1 - y0, x1 - x0)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - 9 * Math.cos(ang - 0.4), y1 - 9 * Math.sin(ang - 0.4))
  ctx.lineTo(x1 - 9 * Math.cos(ang + 0.4), y1 - 9 * Math.sin(ang + 0.4))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}
