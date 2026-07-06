'use client'

import { useEffect, useRef, useState } from 'react'

// Weber-number breakup regime map. A slider sweeps We; the canvas draws a
// schematic of the dominant secondary-breakup mode at that We and animates a
// simple caricature of the deforming droplet.

type Regime = {
  name: string
  weMin: number
  color: string
  desc: string
}

const REGIMES: Regime[] = [
  { name: 'Vibrational', weMin: 0, color: '#38bdf8', desc: '진동만, 거의 안 터짐' },
  { name: 'Bag', weMin: 12, color: '#22d3ee', desc: '봉지처럼 부풀어 파열' },
  { name: 'Multimode', weMin: 50, color: '#a3e635', desc: '봉지+기둥 혼합' },
  { name: 'Sheet-thinning', weMin: 100, color: '#fbbf24', desc: '가장자리에서 얇은 막이 벗겨짐' },
  { name: 'Catastrophic', weMin: 350, color: '#fca5a5', desc: '표면파가 즉시 산산조각' },
]

function regimeFor(we: number): Regime {
  let r = REGIMES[0]
  for (const cand of REGIMES) if (we >= cand.weMin) r = cand
  return r
}

export function WeberRegimeLadder() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [weber, setWeber] = useState(30)
  const weRef = useRef(weber)
  weRef.current = weber

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let phase = 0

    const draw = () => {
      phase += 0.05
      const We = weRef.current
      const reg = regimeFor(We)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // droplet caricature on the left, deformation intensity scales with log(We)
      const cx = W * 0.26
      const cy = H * 0.44
      const R = 40
      const intensity = Math.min(1, Math.log10(Math.max(We, 1)) / Math.log10(600))
      const wobble = Math.sin(phase) * 3

      ctx.fillStyle = reg.color
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1.2

      if (reg.name === 'Vibrational') {
        ctx.beginPath()
        ctx.ellipse(cx, cy, R + wobble, R - wobble, 0, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
      } else if (reg.name === 'Bag') {
        // stem ring + inflating bag downstream
        ctx.beginPath()
        ctx.ellipse(cx - 8, cy, R * 0.55, R * 0.9, 0, 0, Math.PI * 2)
        ctx.fill()
        const bag = R * (0.7 + 0.35 * Math.abs(Math.sin(phase)))
        ctx.beginPath()
        ctx.ellipse(cx + 26, cy, bag, bag * 0.85, 0, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
      } else if (reg.name === 'Multimode') {
        ctx.beginPath()
        ctx.ellipse(cx - 6, cy, R * 0.5, R, 0, 0, Math.PI * 2)
        ctx.fill()
        for (let i = -1; i <= 1; i++) {
          const b = R * (0.5 + 0.2 * Math.abs(Math.sin(phase + i)))
          ctx.beginPath()
          ctx.ellipse(cx + 24, cy + i * 22, b, b * 0.7, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (reg.name === 'Sheet-thinning') {
        ctx.beginPath()
        ctx.ellipse(cx, cy, R * 0.85, R * 0.7, 0, 0, Math.PI * 2)
        ctx.fill()
        // thin ligaments peeling off the rim
        ctx.strokeStyle = reg.color
        ctx.lineWidth = 2
        for (let i = 0; i < 6; i++) {
          const a = -0.6 + i * 0.24
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.7)
          ctx.lineTo(cx + Math.cos(a) * (R + 34 + wobble * 2), cy + Math.sin(a) * (R + 20))
          ctx.stroke()
        }
      } else {
        // catastrophic: cloud of fragments
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2 + phase * 0.3
          const rr = 12 + (i % 5) * 10
          ctx.beginPath()
          ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9, 3 + (i % 3), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // gas flow direction
      ctx.strokeStyle = 'rgba(122,144,168,0.4)'
      ctx.lineWidth = 1.4
      const ay = cy
      ctx.beginPath(); ctx.moveTo(6, ay - 62); ctx.lineTo(cx - R - 12, ay - 62); ctx.stroke()
      ctx.fillStyle = '#7a90a8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('gas →', 10, ay - 66)

      // regime ladder on the right
      const lx = W * 0.55
      const lw = W - lx - 16
      const barY = H - 46
      const barH = 16
      // log scale 1..600
      const lo = Math.log10(1)
      const hi = Math.log10(600)
      const xOf = (w: number) => lx + ((Math.log10(Math.max(w, 1)) - lo) / (hi - lo)) * lw
      // colored segments
      for (let i = 0; i < REGIMES.length; i++) {
        const a = xOf(REGIMES[i].weMin || 1)
        const b = i < REGIMES.length - 1 ? xOf(REGIMES[i + 1].weMin) : lx + lw
        ctx.fillStyle = REGIMES[i].color
        ctx.globalAlpha = 0.7
        ctx.fillRect(a, barY, b - a, barH)
        ctx.globalAlpha = 1
      }
      // current We marker
      const mx = xOf(We)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(mx, barY - 8); ctx.lineTo(mx, barY + barH + 8); ctx.stroke()
      // ticks
      ctx.fillStyle = '#7a90a8'
      ctx.font = '10px system-ui, sans-serif'
      for (const w of [12, 50, 100, 350]) {
        ctx.fillText(String(w), xOf(w) - 6, barY + barH + 22)
      }

      // labels
      ctx.fillStyle = reg.color
      ctx.font = '600 18px system-ui, sans-serif'
      ctx.fillText(reg.name, lx, 34)
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(`We = ${We}`, lx, 56)
      ctx.fillStyle = '#7a90a8'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(reg.desc, lx, 78)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        border: '1px solid var(--border, #1e293b)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface, #0b1523)',
        margin: '1.5rem 0',
      }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={260}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
      />
      <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted, #7a90a8)', marginTop: 14 }}>
        Weber number We = {weber} (log slider)
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round((Math.log10(Math.max(weber, 1)) / Math.log10(600)) * 100)}
          onChange={(e) => {
            const frac = +e.target.value / 100
            setWeber(Math.round(Math.pow(10, frac * Math.log10(600))))
          }}
          style={{ width: '100%', accentColor: '#22d3ee' }}
        />
      </label>
    </div>
  )
}
