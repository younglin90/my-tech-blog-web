'use client'

import { useEffect, useRef, useState } from 'react'

// Churchill-Chu correlation for a vertical isothermal plate (valid over all Ra):
//   Nu = ( 0.825 + 0.387 Ra^(1/6) / [ 1 + (0.492/Pr)^(9/16) ]^(8/27) )^2
// Plotted log-log against Ra. Two dashed reference lines show the simple
// laminar (0.59 Ra^1/4) and turbulent (0.10 Ra^1/3) power laws so the
// change of slope near Ra ~ 1e9 is visible.

function churchillChuNu(Ra: number, Pr: number): number {
  const denom = Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 8 / 27)
  const inner = 0.825 + (0.387 * Math.pow(Ra, 1 / 6)) / denom
  return inner * inner
}

export function NusseltRayleighCurve() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logPr, setLogPr] = useState(-0.16) // Pr = 10^logPr  (~0.7, air)
  const [logRaMark, setLogRaMark] = useState(7)

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

    const RaMin = 1e2
    const RaMax = 1e12
    const lx0 = Math.log10(RaMin)
    const lx1 = Math.log10(RaMax)
    const Pr = Math.pow(10, logPr)

    // Nu range (log)
    const ly0 = Math.log10(0.5)
    const ly1 = Math.log10(3000)

    const xOf = (logRa: number) => padL + ((logRa - lx0) / (lx1 - lx0)) * plotW
    const yOf = (logNu: number) => padT + (1 - (logNu - ly0) / (ly1 - ly0)) * plotH

    // grid + axis labels
    ctx.strokeStyle = 'rgba(127,144,168,0.18)'
    ctx.fillStyle = 'var(--text-muted)'
    ctx.font = '10px monospace'
    ctx.lineWidth = 1
    for (let e = lx0; e <= lx1; e += 1) {
      const x = xOf(e)
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
      ctx.stroke()
    }
    ctx.fillStyle = '#7a90a8'
    for (let e = lx0; e <= lx1; e += 2) {
      ctx.fillText('1e' + e, xOf(e) - 8, H - 20)
    }
    for (let e = 0; e <= 3; e++) {
      const y = yOf(e)
      ctx.strokeStyle = 'rgba(127,144,168,0.18)'
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
      ctx.fillStyle = '#7a90a8'
      ctx.fillText('1e' + e, 8, y + 3)
    }
    ctx.fillStyle = '#7a90a8'
    ctx.fillText('Ra', padL + plotW / 2, H - 6)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Nu', 0, 0)
    ctx.restore()

    // laminar / turbulent reference lines
    const drawRef = (coef: number, exp: number, color: string) => {
      ctx.strokeStyle = color
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.2
      ctx.beginPath()
      let first = true
      for (let e = lx0; e <= lx1; e += 0.1) {
        const Ra = Math.pow(10, e)
        const Nu = coef * Math.pow(Ra, exp)
        const x = xOf(e)
        const y = yOf(Math.log10(Nu))
        if (first) {
          ctx.moveTo(x, y)
          first = false
        } else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    drawRef(0.59, 0.25, 'rgba(34,197,94,0.6)') // laminar Ra^1/4
    drawRef(0.1, 1 / 3, 'rgba(244,114,182,0.6)') // turbulent Ra^1/3

    // Churchill-Chu main curve
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    let first = true
    for (let e = lx0; e <= lx1; e += 0.05) {
      const Ra = Math.pow(10, e)
      const Nu = churchillChuNu(Ra, Pr)
      const x = xOf(e)
      const y = yOf(Math.log10(Nu))
      if (first) {
        ctx.moveTo(x, y)
        first = false
      } else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // marker on the curve
    const RaM = Math.pow(10, logRaMark)
    const NuM = churchillChuNu(RaM, Pr)
    const mx = xOf(logRaMark)
    const my = yOf(Math.log10(NuM))
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(mx, my, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(251,191,36,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mx, padT)
    ctx.lineTo(mx, padT + plotH)
    ctx.stroke()

    // readout box
    ctx.fillStyle = 'rgba(8,17,31,0.78)'
    ctx.fillRect(padL + 8, padT + 6, 150, 46)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '11px monospace'
    ctx.fillText(`Pr = ${Pr.toPrecision(2)}`, padL + 16, padT + 22)
    ctx.fillText(`Ra = ${RaM.toExponential(1)}`, padL + 16, padT + 36)
    ctx.fillStyle = '#fbbf24'
    ctx.fillText(`Nu = ${NuM.toFixed(1)}`, padL + 16, padT + 50)
  }, [logPr, logRaMark])

  const Pr = Math.pow(10, logPr)

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
          <span style={{ minWidth: 150, fontFamily: 'monospace' }}>Pr = {Pr.toPrecision(2)}</span>
          <input type="range" min={-2} max={2} step={0.02} value={logPr} onChange={(e) => setLogPr(parseFloat(e.target.value))} style={{ flex: 1 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <span style={{ minWidth: 150, fontFamily: 'monospace' }}>Ra marker = 1e{logRaMark.toFixed(1)}</span>
          <input type="range" min={2} max={12} step={0.1} value={logRaMark} onChange={(e) => setLogRaMark(parseFloat(e.target.value))} style={{ flex: 1 }} />
        </label>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          cyan: Churchill–Chu &nbsp;·&nbsp; <span style={{ color: '#22c55e' }}>green</span>: laminar 0.59&nbsp;Ra<sup>1/4</sup> &nbsp;·&nbsp;{' '}
          <span style={{ color: '#f472b6' }}>pink</span>: turbulent 0.10&nbsp;Ra<sup>1/3</sup>
        </p>
      </div>
    </div>
  )
}
