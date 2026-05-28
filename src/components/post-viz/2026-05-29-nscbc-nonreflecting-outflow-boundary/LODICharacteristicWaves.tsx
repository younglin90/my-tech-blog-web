'use client'

import { useEffect, useRef, useState } from 'react'

type Side = 'inflow' | 'outflow'

export function LODICharacteristicWaves() {
  const [M, setM] = useState(0.3)
  const [side, setSide] = useState<Side>('outflow')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, W, H)

    const padL = 60
    const padR = 230
    const padT = 30
    const padB = 50
    const Xleft = padL
    const Xright = W - padR
    const Ytop = padT
    const Ybot = H - padB

    // Domain box
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Xleft, Ytop)
    ctx.lineTo(Xleft, Ybot)
    ctx.lineTo(Xright, Ybot)
    ctx.stroke()

    // Domain fill
    ctx.fillStyle = 'rgba(34, 211, 238, 0.04)'
    ctx.fillRect(Xleft, Ytop, Xright - Xleft, Ybot - Ytop)

    // Boundary line (right edge = outflow, left edge = inflow)
    const boundaryX = side === 'outflow' ? Xright : Xleft
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(boundaryX, Ytop - 6)
    ctx.lineTo(boundaryX, Ybot + 6)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px monospace'
    ctx.fillText('t', Xleft - 14, Ytop - 4)
    ctx.fillText('x', Xright + 6, Ybot + 14)
    ctx.fillStyle = '#fbbf24'
    ctx.fillText(side === 'outflow' ? 'outflow (x = L)' : 'inflow (x = 0)', boundaryX - 40, Ytop - 12)

    const c = 1.0
    const u = M * c
    const speeds = [
      { name: 'u − c', s: u - c, color: '#f87171', dash: false },
      { name: 'u  (s)', s: u, color: '#a78bfa', dash: false },
      { name: 'u  (v)', s: u, color: '#a78bfa', dash: true },
      { name: 'u  (w)', s: u, color: '#a78bfa', dash: true },
      { name: 'u + c', s: u + c, color: '#22d3ee', dash: false },
    ]

    const Lx = Xright - Xleft
    const Ly = Ybot - Ytop
    const tspan = 1.2
    const sScale = (Lx / tspan) * 0.55

    const isIncoming = (s: number) => (side === 'outflow' ? s < 0 : s > 0)

    speeds.forEach((sp, idx) => {
      const dxPx = sp.s * tspan * sScale
      const offset = (idx - 2) * 3
      const startX = boundaryX + offset
      const startY = Ybot
      let endX = startX + dxPx
      let endY = Ytop

      if (endX < Xleft - 30) {
        const t = (Xleft - 30 - startX) / (endX - startX)
        endY = startY + (endY - startY) * t
        endX = Xleft - 30
      } else if (endX > Xright + 30) {
        const t = (Xright + 30 - startX) / (endX - startX)
        endY = startY + (endY - startY) * t
        endX = Xright + 30
      }

      const incoming = isIncoming(sp.s)
      ctx.strokeStyle = sp.color
      ctx.globalAlpha = incoming ? 1.0 : 0.55
      ctx.lineWidth = incoming ? 2.5 : 1.6
      ctx.setLineDash(sp.dash ? [4, 4] : [])
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      const ang = Math.atan2(endY - startY, endX - startX)
      const ah = 8
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - ah * Math.cos(ang - 0.4), endY - ah * Math.sin(ang - 0.4))
      ctx.lineTo(endX - ah * Math.cos(ang + 0.4), endY - ah * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fillStyle = sp.color
      ctx.fill()
    })

    // Legend (right side)
    const legX = Xright + 24
    let legY = Ytop + 8
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '11px monospace'
    ctx.fillText('characteristic    speed   dir', legX, legY)
    legY += 16
    speeds.forEach((sp) => {
      const incoming = isIncoming(sp.s)
      ctx.strokeStyle = sp.color
      ctx.lineWidth = 2
      ctx.setLineDash(sp.dash ? [4, 4] : [])
      ctx.beginPath()
      ctx.moveTo(legX, legY - 4)
      ctx.lineTo(legX + 22, legY - 4)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(`${sp.name}  ${sp.s.toFixed(2)}  ${incoming ? 'IN' : 'out'}`, legX + 28, legY)
      legY += 16
    })

    const incomingCount = speeds.filter((sp) => isIncoming(sp.s)).length
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 12px monospace'
    ctx.fillText(`BCs needed: ${incomingCount}`, legX, legY + 8)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px monospace'
    const flavor = M < 1 ? (side === 'outflow' ? 'subsonic outflow' : 'subsonic inflow') : (side === 'outflow' ? 'supersonic outflow' : 'supersonic inflow')
    ctx.fillText(`M = ${M.toFixed(2)}  (${flavor})`, Xleft, Ybot + 22)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px monospace'
    ctx.fillText('Lines = characteristic rays from the boundary. Bold = incoming (needs a BC).', Xleft, Ybot + 38)
  }, [M, side])

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <canvas
        ref={canvasRef}
        width={760}
        height={320}
        className="w-full h-auto block rounded bg-[#0b1220]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setSide('outflow')}
            className={`px-3 py-1 rounded border ${side === 'outflow' ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]' : 'border-[var(--border)]'}`}
            type="button"
          >
            Outflow
          </button>
          <button
            onClick={() => setSide('inflow')}
            className={`px-3 py-1 rounded border ${side === 'inflow' ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]' : 'border-[var(--border)]'}`}
            type="button"
          >
            Inflow
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs">
          Mach number M
          <input
            type="range"
            min="0"
            max="1.6"
            step="0.01"
            value={M}
            onChange={(e) => setM(parseFloat(e.target.value))}
          />
          <span className="font-mono w-12">{M.toFixed(2)}</span>
        </label>
      </div>
    </div>
  )
}
