'use client'

import { useEffect, useRef, useState } from 'react'

// Drag coefficient of a sphere vs Reynolds number, drawn log-log.
// Subcritical branch: Clift-Gauvin correlation, valid up to Re ~ 3e5.
//   C_D = 24/Re (1 + 0.15 Re^0.687) + 0.42 / (1 + 42500 Re^-1.16)
// Drag crisis: a smooth blend drops C_D toward the supercritical branch
// once Re passes a critical value. Surface roughness lowers that
// critical Re (this is why a golf ball is dimpled), so the slider
// shifts the whole cliff to the left.

function smoothstep(x: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function cliftGauvin(Re: number): number {
  return (24 / Re) * (1 + 0.15 * Math.pow(Re, 0.687)) + 0.42 / (1 + 42500 * Math.pow(Re, -1.16))
}

// roughness in [0,1] -> log10(Re_crit) from 5.55 (smooth) down to ~4.2 (very rough)
function dragCoefficient(Re: number, roughness: number): number {
  const sub = cliftGauvin(Re)
  const logRe = Math.log10(Re)
  const logCrit = 5.55 - 1.35 * roughness
  const t = smoothstep(logRe, logCrit - 0.18, logCrit + 0.18)
  // supercritical branch: drops to ~0.08, recovers slowly toward 0.2
  const sup = 0.08 + 0.13 * smoothstep(logRe, logCrit, 7.0)
  return sub * (1 - t) + sup * t
}

export function DragCrisisCurve() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [roughness, setRoughness] = useState(0)
  const [logReMark, setLogReMark] = useState(5.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const padL = 52
    const padR = 16
    const padT = 14
    const padB = 34
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const lx0 = -1 // Re = 1e-1
    const lx1 = 7 //  Re = 1e7
    const ly0 = Math.log10(0.05)
    const ly1 = Math.log10(400)

    const xOf = (logRe: number) => padL + ((logRe - lx0) / (lx1 - lx0)) * plotW
    const yOf = (logCd: number) => padT + (1 - (logCd - ly0) / (ly1 - ly0)) * plotH

    // grid
    ctx.lineWidth = 1
    ctx.font = '10px monospace'
    for (let e = lx0; e <= lx1; e += 1) {
      ctx.strokeStyle = 'rgba(127,144,168,0.16)'
      ctx.beginPath()
      ctx.moveTo(xOf(e), padT)
      ctx.lineTo(xOf(e), padT + plotH)
      ctx.stroke()
      ctx.fillStyle = '#7a90a8'
      ctx.fillText('1e' + e, xOf(e) - 9, H - 20)
    }
    for (let e = -1; e <= 2; e++) {
      const y = yOf(e)
      ctx.strokeStyle = 'rgba(127,144,168,0.16)'
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
      ctx.fillStyle = '#7a90a8'
      ctx.fillText('1e' + e, 10, y + 3)
    }
    ctx.fillStyle = '#7a90a8'
    ctx.fillText('Re', padL + plotW / 2, H - 6)
    ctx.save()
    ctx.translate(13, padT + plotH / 2 + 8)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('C_D', 0, 0)
    ctx.restore()

    // Stokes reference line  C_D = 24/Re
    ctx.strokeStyle = 'rgba(34,197,94,0.55)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1.2
    ctx.beginPath()
    let first = true
    for (let e = lx0; e <= 3; e += 0.1) {
      const Re = Math.pow(10, e)
      const x = xOf(e)
      const y = yOf(Math.log10(24 / Re))
      if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // main C_D curve
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    first = true
    for (let e = lx0; e <= lx1; e += 0.03) {
      const Re = Math.pow(10, e)
      const cd = dragCoefficient(Re, roughness)
      const x = xOf(e)
      const y = yOf(Math.log10(cd))
      if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // marker
    const ReM = Math.pow(10, logReMark)
    const cdM = dragCoefficient(ReM, roughness)
    const mx = xOf(logReMark)
    const my = yOf(Math.log10(cdM))
    ctx.strokeStyle = 'rgba(251,191,36,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mx, padT)
    ctx.lineTo(mx, padT + plotH)
    ctx.stroke()
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(mx, my, 5, 0, Math.PI * 2)
    ctx.fill()

    // readout
    ctx.fillStyle = 'rgba(8,17,31,0.8)'
    ctx.fillRect(padL + 8, padT + 6, 168, 46)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '11px monospace'
    ctx.fillText(`Re = ${ReM.toExponential(1)}`, padL + 16, padT + 22)
    ctx.fillText(`roughness = ${roughness.toFixed(2)}`, padL + 16, padT + 36)
    ctx.fillStyle = '#fbbf24'
    ctx.fillText(`C_D = ${cdM.toFixed(3)}`, padL + 16, padT + 50)
  }, [roughness, logReMark])

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: 'var(--bg)' }}
      />
      <div style={{ marginTop: '0.9rem', display: 'grid', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <span style={{ minWidth: 168, fontFamily: 'monospace' }}>roughness = {roughness.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.01} value={roughness} onChange={(e) => setRoughness(parseFloat(e.target.value))} style={{ flex: 1 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <span style={{ minWidth: 168, fontFamily: 'monospace' }}>Re marker = 1e{logReMark.toFixed(1)}</span>
          <input type="range" min={-1} max={7} step={0.1} value={logReMark} onChange={(e) => setLogReMark(parseFloat(e.target.value))} style={{ flex: 1 }} />
        </label>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          cyan: sphere C_D &nbsp;·&nbsp; <span style={{ color: '#22c55e' }}>green</span>: Stokes 24/Re. Raise{' '}
          <em>roughness</em> and the drag-crisis cliff slides toward lower Re — a dimpled ball trips the boundary layer early.
        </p>
      </div>
    </div>
  )
}
