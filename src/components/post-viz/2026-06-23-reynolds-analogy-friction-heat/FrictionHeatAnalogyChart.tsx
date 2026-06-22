'use client'

import { useEffect, useRef, useState } from 'react'

// At a fixed station (fixed Re_x) we plot three quantities against Pr:
//   C_f/2          = 0.332 / sqrt(Re_x)            (flat, independent of Pr)
//   St             = (C_f/2) * Pr^(-2/3)            (raw Stanton number)
//   St * Pr^(2/3)  = C_f/2                          (Chilton-Colburn collapse)
// The collapsed curve sits on top of C_f/2 for every Pr; raw St only meets it at Pr=1.
export function FrictionHeatAnalogyChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logRex, setLogRex] = useState(5)
  const [prMark, setPrMark] = useState(0.7)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const padL = 56
    const padR = 18
    const padT = 22
    const padB = 46
    const Rex = Math.pow(10, logRex)
    const cfHalf = 0.332 / Math.sqrt(Rex)

    // x axis: log10(Pr) from -1 (Pr=0.1) to 1.778 (Pr=60)
    const prMin = 0.1
    const prMax = 60
    const lx0 = Math.log10(prMin)
    const lx1 = Math.log10(prMax)
    // y axis: log scale of the quantities, anchored on cfHalf
    const yTop = cfHalf * 4 // raw St can rise above Cf/2 at small Pr
    const yBot = cfHalf * 0.1
    const ly0 = Math.log10(yBot)
    const ly1 = Math.log10(yTop)

    const sx = (pr: number) => padL + ((Math.log10(pr) - lx0) / (lx1 - lx0)) * (W - padL - padR)
    const sy = (v: number) => padT + (1 - (Math.log10(v) - ly0) / (ly1 - ly0)) * (H - padT - padB)

    ctx.fillStyle = '#08111f'
    ctx.fillRect(0, 0, W, H)

    // grid (vertical at Pr = 0.1,1,10 ; horizontal at cfHalf)
    ctx.strokeStyle = '#1e2d40'
    ctx.lineWidth = 1
    ctx.fillStyle = '#7a90a8'
    ctx.font = '11px monospace'
    ;[0.1, 1, 10, 60].forEach((pr) => {
      const X = sx(pr)
      ctx.beginPath()
      ctx.moveTo(X, padT)
      ctx.lineTo(X, H - padB)
      ctx.stroke()
      ctx.fillText('Pr=' + pr, X - 14, H - padB + 16)
    })

    const plot = (fn: (pr: number) => number, color: string, dash: number[]) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash(dash)
      ctx.beginPath()
      let first = true
      for (let lp = lx0; lp <= lx1 + 1e-9; lp += 0.02) {
        const pr = Math.pow(10, lp)
        const Y = sy(fn(pr))
        const X = sx(pr)
        if (first) {
          ctx.moveTo(X, Y)
          first = false
        } else ctx.lineTo(X, Y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // C_f/2 (flat) — slate
    plot(() => cfHalf, '#94a3b8', [6, 4])
    // raw St — orange
    plot((pr) => cfHalf * Math.pow(pr, -2 / 3), '#f59e0b', [])
    // Chilton-Colburn collapse St*Pr^(2/3) — cyan (lies on Cf/2)
    plot(() => cfHalf, '#22d3ee', [])

    // marker at chosen Pr
    const stMark = cfHalf * Math.pow(prMark, -2 / 3)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(sx(prMark), sy(stMark), 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(245,158,11,0.4)'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(sx(prMark), sy(stMark))
    ctx.lineTo(sx(prMark), sy(cfHalf))
    ctx.stroke()
    ctx.setLineDash([])

    // legend
    ctx.font = '12px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('— — C_f/2', padL + 6, padT + 12)
    ctx.fillStyle = '#f59e0b'
    ctx.fillText('—— St', padL + 6, padT + 28)
    ctx.fillStyle = '#22d3ee'
    ctx.fillText('—— St·Pr^(2/3)', padL + 6, padT + 44)
  }, [logRex, prMark])

  const Rex = Math.pow(10, logRex)
  const cfHalf = 0.332 / Math.sqrt(Rex)
  const stMark = cfHalf * Math.pow(prMark, -2 / 3)

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#0b1626', borderRadius: 12 }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={320}
        style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto', borderRadius: 8 }}
      />
      <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 13 }}>
        <label>
          log₁₀ Re_x: {logRex.toFixed(1)}
          <input
            type="range"
            min={4}
            max={6}
            step={0.1}
            value={logRex}
            onChange={(e) => setLogRex(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <label style={{ display: 'block', marginTop: 10 }}>
          marker Pr: {prMark.toFixed(2)}
          <input
            type="range"
            min={0.1}
            max={60}
            step={0.1}
            value={prMark}
            onChange={(e) => setPrMark(Number(e.target.value))}
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>
          St(Pr={prMark.toFixed(2)}) = {stMark.toExponential(3)} &nbsp;|&nbsp; C_f/2 = {cfHalf.toExponential(3)}
          <br />
          St &middot; Pr^(2/3) = {(stMark * Math.pow(prMark, 2 / 3)).toExponential(3)} (= C_f/2)
        </div>
      </div>
    </div>
  )
}
