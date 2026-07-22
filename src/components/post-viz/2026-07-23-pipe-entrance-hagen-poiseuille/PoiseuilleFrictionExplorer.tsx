'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// Darcy friction factor f vs pipe Reynolds number on a log-log chart.
// Laminar branch f = 64/Re is exact (Hagen-Poiseuille); above the ~2300
// transition the empirical Blasius law f = 0.316 Re^-0.25 takes over.

const RE_MIN = 100
const RE_MAX = 100000

function frictionFactor(Re: number) {
  if (Re < 2300) return 64 / Re
  if (Re > 4000) return 0.316 * Math.pow(Re, -0.25)
  // transition: blend the two endpoints in log-space
  const fLam = 64 / 2300
  const fTur = 0.316 * Math.pow(4000, -0.25)
  const t = (Math.log10(Re) - Math.log10(2300)) / (Math.log10(4000) - Math.log10(2300))
  return Math.pow(10, (1 - t) * Math.log10(fLam) + t * Math.log10(fTur))
}

function entranceLengthOverD(Re: number) {
  if (Re < 2300) return 0.05 * Re
  return 1.359 * Math.pow(Re, 0.25) // turbulent estimate
}

export function PoiseuilleFrictionExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [logRe, setLogRe] = useState(3) // Re = 1000
  const Re = useMemo(() => Math.round(Math.pow(10, logRe)), [logRe])

  const f = frictionFactor(Re)
  const LhD = entranceLengthOverD(Re)
  const regime = Re < 2300 ? 'laminar' : Re < 4000 ? 'transition' : 'turbulent'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 560
    const H = 340
    canvas.width = W
    canvas.height = H
    const padL = 56
    const padR = 18
    const padT = 18
    const padB = 40

    const F_MIN = 0.005
    const F_MAX = 1
    const xOf = (r: number) =>
      padL + ((Math.log10(r) - Math.log10(RE_MIN)) / (Math.log10(RE_MAX) - Math.log10(RE_MIN))) * (W - padL - padR)
    const yOf = (fv: number) =>
      padT + ((Math.log10(F_MAX) - Math.log10(fv)) / (Math.log10(F_MAX) - Math.log10(F_MIN))) * (H - padT - padB)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // grid (decades)
    ctx.strokeStyle = 'rgba(148,163,184,0.18)'
    ctx.fillStyle = '#64748b'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.lineWidth = 1
    for (let e = 2; e <= 5; e++) {
      const x = xOf(Math.pow(10, e))
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, H - padB)
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillText(`10${['²', '³', '⁴', '⁵'][e - 2]}`, x, H - padB + 16)
    }
    for (const fv of [0.005, 0.01, 0.05, 0.1, 0.5, 1]) {
      const y = yOf(fv)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
      ctx.textAlign = 'right'
      ctx.fillText(String(fv), padL - 6, y + 3)
    }

    // transition band
    ctx.fillStyle = 'rgba(245,158,11,0.10)'
    ctx.fillRect(xOf(2300), padT, xOf(4000) - xOf(2300), H - padT - padB)

    // f-Re curve
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let first = true
    for (let i = 0; i <= 300; i++) {
      const r = Math.pow(10, Math.log10(RE_MIN) + (i / 300) * (Math.log10(RE_MAX) - Math.log10(RE_MIN)))
      const fv = frictionFactor(r)
      const x = xOf(r)
      const y = yOf(fv)
      if (first) {
        ctx.moveTo(x, y)
        first = false
      } else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // operating point
    const px = xOf(Re)
    const py = yOf(f)
    ctx.fillStyle = '#f43f5e'
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(244,63,94,0.5)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px, H - padB)
    ctx.moveTo(px, py)
    ctx.lineTo(padL, py)
    ctx.stroke()
    ctx.setLineDash([])

    // axis titles
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('Reynolds number  Re_D', W / 2, H - 6)
    ctx.save()
    ctx.translate(14, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Darcy friction factor  f', 0, 0)
    ctx.restore()

    // 64/Re annotation
    ctx.fillStyle = '#7dd3fc'
    ctx.textAlign = 'left'
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.fillText('f = 64/Re', xOf(160), yOf(64 / 160) - 6)
    ctx.fillText('Blasius', xOf(30000), yOf(0.316 * Math.pow(30000, -0.25)) - 8)
  }, [Re, f])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: 560, border: '1px solid #334155', borderRadius: 8 }}
      />
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          Re<sub>D</sub>
          <input
            type="range"
            min={2}
            max={5}
            step={0.02}
            value={logRe}
            onChange={(e) => setLogRe(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 66 }}>{Re.toLocaleString()}</span>
        </label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#cbd5e1' }}>
          <span>regime: <b style={{ color: regime === 'laminar' ? '#38bdf8' : regime === 'turbulent' ? '#f43f5e' : '#f59e0b' }}>{regime}</b></span>
          <span>f = <b>{f.toFixed(4)}</b></span>
          <span>L<sub>h</sub>/D ≈ <b>{LhD.toFixed(1)}</b></span>
        </div>
      </div>
    </div>
  )
}
