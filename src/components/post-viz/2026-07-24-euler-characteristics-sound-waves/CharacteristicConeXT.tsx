'use client'

import { useEffect, useRef, useState } from 'react'

// The same three signals, now drawn in the (x, t) plane as characteristic lines
// rising from the emission point (x0, 0):
//
//   C+ :  x = x0 + (u0 + c0) t
//   C0 :  x = x0 +  u0       t
//   C- :  x = x0 + (u0 - c0) t
//
// The wedge between C- and C+ is the DOMAIN OF INFLUENCE: the set of space-time
// events the source can reach. Drag the round probe anywhere in the plane; it
// turns green inside the wedge (reachable) and red outside (unreachable). Raise
// u0 past c0 and the wedge "tops over" — it leans entirely to the right of the
// vertical, so no event upstream of the source is ever reachable.

export function CharacteristicConeXT() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mach, setMach] = useState(0.4) // u0 with c0 = 1
  const [probe, setProbe] = useState({ x: -0.9, t: 1.8 }) // in physical units
  const stateRef = useRef({ mach: 0.4, probe: { x: -0.9, t: 1.8 }, phase: 0 })

  useEffect(() => {
    stateRef.current.mach = mach
    stateRef.current.probe = probe
  }, [mach, probe])

  // geometry (shared by draw + pointer mapping)
  const W = 620
  const H = 300
  const cx = W / 2
  const yBottom = H - 26
  const yTop = 20
  const TMAX = 3
  const PX = 30 // px per space unit
  const xToPx = (x: number) => cx + x * PX
  const tToPy = (t: number) => yBottom - (t / TMAX) * (yBottom - yTop)
  const pxToX = (px: number) => (px - cx) / PX
  const pyToT = (py: number) => ((yBottom - py) / (yBottom - yTop)) * TMAX

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      const st = stateRef.current
      st.phase += 0.016
      const u0 = st.mach
      const c0 = 1
      const vP = u0 + c0
      const vM = u0 - c0

      ctx.clearRect(0, 0, W, H)

      // axes
      ctx.strokeStyle = 'rgba(150,165,195,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, yBottom)
      ctx.lineTo(W - 12, yBottom)
      ctx.moveTo(cx, yBottom)
      ctx.lineTo(cx, yTop)
      ctx.stroke()
      ctx.fillStyle = 'rgba(170,180,205,0.8)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('space x →', W - 84, yBottom + 18)
      ctx.textAlign = 'center'
      ctx.fillText('↑ time t', cx + 34, yTop + 4)

      // domain of influence (wedge between C- and C+)
      ctx.beginPath()
      ctx.moveTo(cx, yBottom)
      ctx.lineTo(xToPx(vM * TMAX), tToPy(TMAX))
      ctx.lineTo(xToPx(vP * TMAX), tToPy(TMAX))
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,178,84,0.10)'
      ctx.fill()

      // characteristic lines
      const line = (v: number, color: string, w: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = w
        ctx.beginPath()
        ctx.moveTo(cx, yBottom)
        ctx.lineTo(xToPx(v * TMAX), tToPy(TMAX))
        ctx.stroke()
      }
      line(vM, 'rgba(88,209,255,0.9)', 2) // C-
      line(u0, 'rgba(226,120,232,0.85)', 1.6) // C0
      line(vP, 'rgba(255,178,84,0.95)', 2) // C+

      // travelling signal fronts (dots climbing each characteristic)
      const frac = (st.phase % 1)
      const dot = (v: number, color: string) => {
        const t = frac * TMAX
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(xToPx(v * t), tToPy(t), 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
      dot(vM, 'rgba(88,209,255,1)')
      dot(u0, 'rgba(226,120,232,1)')
      dot(vP, 'rgba(255,178,84,1)')

      // line labels near the top
      ctx.font = '11px system-ui, sans-serif'
      const lab = (v: number, txt: string, color: string) => {
        const px = xToPx(v * TMAX)
        if (px < 30 || px > W - 6) return
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.fillText(txt, px, tToPy(TMAX) - 6)
      }
      lab(vM, 'C−', 'rgba(88,209,255,1)')
      lab(u0, 'C₀', 'rgba(226,120,232,1)')
      lab(vP, 'C+', 'rgba(255,178,84,1)')

      // source point
      ctx.fillStyle = 'rgba(220,228,245,0.95)'
      ctx.beginPath()
      ctx.arc(cx, yBottom, 4, 0, Math.PI * 2)
      ctx.fill()

      // probe
      const p = st.probe
      const inside = p.t > 0 && p.x >= vM * p.t - 1e-9 && p.x <= vP * p.t + 1e-9
      const ppx = xToPx(p.x)
      const ppy = tToPy(p.t)
      ctx.strokeStyle = inside ? 'rgba(120,230,150,0.95)' : 'rgba(255,110,110,0.95)'
      ctx.fillStyle = inside ? 'rgba(120,230,150,0.22)' : 'rgba(255,110,110,0.20)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ppx, ppy, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = inside ? 'rgba(150,240,175,1)' : 'rgba(255,150,150,1)'
      ctx.textAlign = 'left'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText(inside ? 'reachable ✓' : 'unreachable ✗', ppx + 12, ppy + 4)

      // regime badge
      const sup = u0 > 1 + 1e-9
      ctx.textAlign = 'left'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillStyle = sup ? 'rgba(255,140,120,0.95)' : 'rgba(120,220,160,0.95)'
      ctx.fillText(`M = ${u0.toFixed(2)}  ${sup ? 'supersonic — cone tipped over' : 'subsonic — cone opens upstream'}`, 44, yTop + 2)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // dragging the probe
  const dragging = useRef(false)
  const setFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * W
    const py = ((clientY - rect.top) / rect.height) * H
    const t = Math.max(0, Math.min(TMAX, pyToT(py)))
    const x = Math.max(-9, Math.min(9, pxToX(px)))
    setProbe({ x, t })
  }

  return (
    <div
      style={{
        border: '1px solid #2b3550',
        borderRadius: 12,
        padding: 16,
        background: 'linear-gradient(160deg,#0d1424,#131c30)',
        color: '#dce4f5',
        maxWidth: 660,
        margin: '1.5rem auto',
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', display: 'block', borderRadius: 8, cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          setFromEvent(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFromEvent(e.clientX, e.clientY)
        }}
        onPointerUp={() => {
          dragging.current = false
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label style={{ flex: '1 1 320px' }}>
          background flow u&#8320; (Mach, c&#8320;=1) = {mach.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2.2}
            step={0.02}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8a93a0', margin: '8px 2px 0' }}>
        Drag the probe across the plane. At M = 0.4 the wedge straddles the vertical, so events both upstream and
        downstream are reachable. Slide u&#8320; above 1 and the whole wedge leans right — drop the probe anywhere to the
        left of the source and it stays red.
      </p>
    </div>
  )
}
