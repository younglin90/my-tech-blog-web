'use client'

import { useEffect, useRef, useState } from 'react'

const W = 660
const H = 340
const LX = 12
const LY = 26
const LS = 300
const RX = 352
const RY = 46
const RW = 292
const RH = 236

const requiredShell = (x: number) => Math.max(1, Math.ceil(1 / x - 1e-9))
const scanArea = (x: number, shell: number) => ((2 * shell + 1) * x) ** 2
const lookups = (shell: number) => (2 * shell + 1) ** 2

export function ShellCostCrossoverDial() {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [sOverD, setSOverD] = useState(1)
  const [lambda, setLambda] = useState(0.4)
  const [worstCase, setWorstCase] = useState(false)
  const [info, setInfo] = useState({ shell: 1, area: 9, look: 9, best: 1 })

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const render = () => {
      frame++
      const x = sOverD
      const shell = requiredShell(x)
      const area = scanArea(x, shell)
      const look = lookups(shell)

      // cost curve
      let best = 0.1
      let bestCost = Infinity
      const curve: { x: number; a: number; t: number }[] = []
      for (let i = 0; i <= 76; i++) {
        const xx = 0.1 + (1.9 * i) / 76
        const sh = requiredShell(xx)
        const a = scanArea(xx, sh)
        const t = a + lambda * lookups(sh)
        curve.push({ x: xx, a, t })
        if (t < bestCost) {
          bestCost = t
          best = xx
        }
      }
      const tMax = Math.max(...curve.map((c) => c.t))

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // ---------- left: geometry ----------
      ctx.fillStyle = '#8b949e'
      ctx.fillText('sector stencil vs contact reach d', LX, 16)

      const ppd = 58 // pixels per d
      const cell = ppd * x
      const cx = LX + LS / 2
      const cy = LY + LS / 2
      const wobble = worstCase ? 0.5 : 0.5 + 0.49 * Math.sin(frame * 0.035)
      // probe sits at fractional position `wobble` inside its own cell
      const px = cx - cell / 2 + cell * (worstCase ? 0.999 : wobble)
      const py = cy - cell / 2 + cell * (worstCase ? 0.999 : 1 - wobble)

      ctx.save()
      ctx.beginPath()
      ctx.rect(LX, LY, LS, LS)
      ctx.clip()

      const i0 = Math.floor((LX - cx) / cell) - 1
      const i1 = Math.ceil((LX + LS - cx) / cell) + 1
      const probeI = Math.floor((px - cx) / cell)
      const probeJ = Math.floor((py - cy) / cell)

      for (let a = i0; a <= i1; a++) {
        for (let b = i0; b <= i1; b++) {
          const x0 = cx + a * cell
          const y0 = cy + b * cell
          // nearest point of this cell to the probe
          const nx = Math.min(Math.max(px, x0), x0 + cell)
          const ny = Math.min(Math.max(py, y0), y0 + cell)
          const needed = Math.hypot(nx - px, ny - py) < ppd
          const scanned = Math.abs(a - probeI) <= shell && Math.abs(b - probeJ) <= shell
          if (needed && !scanned) {
            ctx.fillStyle = 'rgba(248,81,73,0.45)'
            ctx.fillRect(x0, y0, cell, cell)
          } else if (scanned) {
            ctx.fillStyle = 'rgba(56,139,253,0.18)'
            ctx.fillRect(x0, y0, cell, cell)
          }
        }
      }
      ctx.strokeStyle = '#2b3442'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let a = i0; a <= i1; a++) {
        ctx.moveTo(cx + a * cell, LY)
        ctx.lineTo(cx + a * cell, LY + LS)
        ctx.moveTo(LX, cy + a * cell)
        ctx.lineTo(LX + LS, cy + a * cell)
      }
      ctx.stroke()

      // contact reach circle
      ctx.strokeStyle = '#d29922'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.arc(px, py, ppd, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])

      // scanned stencil outline
      ctx.strokeStyle = '#388bfd'
      ctx.lineWidth = 1.8
      ctx.strokeRect(cx + (probeI - shell) * cell, cy + (probeJ - shell) * cell, (2 * shell + 1) * cell, (2 * shell + 1) * cell)

      ctx.beginPath()
      ctx.arc(px, py, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#58a6ff'
      ctx.fill()
      ctx.restore()

      ctx.strokeStyle = '#4b5666'
      ctx.lineWidth = 1.5
      ctx.strokeRect(LX, LY, LS, LS)

      ctx.fillStyle = '#d29922'
      ctx.fillText(`dashed circle = reach d`, LX + 6, LY + LS - 26)
      ctx.fillStyle = '#388bfd'
      ctx.fillText(`blue = scanned  (2*${shell}+1)^2 = ${look} cells`, LX + 6, LY + LS - 10)

      // ---------- right: cost curves ----------
      ctx.fillStyle = '#8b949e'
      ctx.fillText('cost per grain  vs  s/d', RX, 16)
      ctx.fillStyle = '#388bfd'
      ctx.fillText('scan area (distance checks)', RX, 32)
      ctx.fillStyle = '#f0883e'
      ctx.fillText('+ lookups = total', RX + 196, 32)

      ctx.strokeStyle = '#2b3442'
      ctx.lineWidth = 1
      ctx.strokeRect(RX, RY, RW, RH)
      const gx = (v: number) => RX + ((v - 0.1) / 1.9) * RW
      const gy = (v: number) => RY + RH - (v / tMax) * (RH - 10)

      for (const v of [0.25, 0.5, 1, 1.5, 2]) {
        ctx.strokeStyle = '#1c2432'
        ctx.beginPath()
        ctx.moveTo(gx(v), RY)
        ctx.lineTo(gx(v), RY + RH)
        ctx.stroke()
        ctx.fillStyle = '#6e7681'
        ctx.fillText(String(v), gx(v) - 8, RY + RH + 14)
      }

      const plot = (key: 'a' | 't', col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        curve.forEach((c, i) => (i ? ctx.lineTo(gx(c.x), gy(c[key])) : ctx.moveTo(gx(c.x), gy(c[key]))))
        ctx.stroke()
      }
      plot('a', '#388bfd')
      plot('t', '#f0883e')

      // minimum of total
      ctx.strokeStyle = '#3fb950'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(gx(best), RY)
      ctx.lineTo(gx(best), RY + RH)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#3fb950'
      ctx.fillText(`min at s/d = ${best.toFixed(2)}`, Math.min(RX + RW - 118, gx(best) + 4), RY + 14)

      // current marker
      const cur = area + lambda * look
      ctx.beginPath()
      ctx.arc(gx(x), gy(cur), 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#e6edf3'
      ctx.fill()

      ctx.fillStyle = '#c9d1d9'
      ctx.fillText(`s/d = ${x.toFixed(2)}   shell = ${shell}   area = ${area.toFixed(2)} d^2   total = ${cur.toFixed(2)}`, RX, RY + RH + 34)

      if (frame % 12 === 0) setInfo({ shell, area, look, best })
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [sOverD, lambda, worstCase])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas ref={canvas} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginTop: '0.7rem', fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          s / d
          <input type="range" min={0.1} max={2} step={0.05} value={sOverD} onChange={(e) => setSOverD(Number(e.target.value))} />
          <b>{sOverD.toFixed(2)}</b>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          lookup / check cost
          <input type="range" min={0} max={2} step={0.05} value={lambda} onChange={(e) => setLambda(Number(e.target.value))} />
          <b>{lambda.toFixed(2)}</b>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={worstCase} onChange={(e) => setWorstCase(e.target.checked)} />
          pin grain at cell corner
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace' }}>
        shell = ceil(d/s) = {info.shell} → {info.look} cells scanned, {info.area.toFixed(2)} d² of area. Total cost bottoms out near s/d = {info.best.toFixed(2)}.
      </p>
    </div>
  )
}
