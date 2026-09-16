'use client'

import { useEffect, useRef, useState } from 'react'

const COLORS = ['#58a6ff', '#7ee787', '#d29922', '#f85149', '#bc8cff']
const YMIN = 0.02 // smallest y/R plotted; the log law is not valid below this

const frictionFactor = (Re: number) => (0.79 * Math.log(Re) - 1.64) ** -2

/** u/V̄ from the velocity-defect law, and the defect itself, at wall distance y/R */
function sample(Re: number, y: number) {
  const us = Math.sqrt(frictionFactor(Re) / 8) // u*/V̄
  const defect = 2.5 * Math.log(1 / y) // (Uc − u)/u*, Re-free
  return { raw: 1 + us * (3.75 - defect), defect, us }
}

export function DefectLawCollapseSlider() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [t, setT] = useState(0)
  const [nCurves, setNCurves] = useState(4)
  const [sweep, setSweep] = useState(false)

  const tRef = useRef(t)
  const nRef = useRef(nCurves)
  const sweepRef = useRef(sweep)
  const dirRef = useRef(1)
  tRef.current = t
  nRef.current = nCurves
  sweepRef.current = sweep

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const X0 = 66
    const X1 = 534
    const Y0 = 34
    const Y1 = 232
    const lx = (y: number) => X0 + ((Math.log(y) - Math.log(YMIN)) / -Math.log(YMIN)) * (X1 - X0)
    // raw axis 0.45..1.35 (bottom..top), defect axis 10..0 (bottom..top)
    const pyRaw = (v: number) => Y1 - ((v - 0.45) / 0.9) * (Y1 - Y0)
    const pyDef = (v: number) => Y0 + (v / 10) * (Y1 - Y0)

    let raf = 0
    let last = performance.now()
    let frame = 0

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (sweepRef.current) {
        let v = tRef.current + dirRef.current * dt * 0.45
        if (v >= 1) {
          v = 1
          dirRef.current = -1
        }
        if (v <= 0) {
          v = 0
          dirRef.current = 1
        }
        tRef.current = v
        if (frame % 8 === 0) setT(v)
      }
      const m = tRef.current
      const ease = m * m * (3 - 2 * m)
      frame++

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, cv.width, cv.height)

      // ---- frame + x axis (log in y/R) --------------------------------
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0)
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      for (const g of [0.02, 0.05, 0.1, 0.2, 0.5, 1.0]) {
        const px = lx(g)
        ctx.strokeStyle = '#21262d'
        ctx.beginPath()
        ctx.moveTo(px, Y0)
        ctx.lineTo(px, Y1)
        ctx.stroke()
        ctx.fillText(String(g), px - 9, Y1 + 14)
      }
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('wall distance  y/R   (log scale)', X0 + 150, Y1 + 30)

      // ---- morphing y axis labels -------------------------------------
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillStyle = `rgba(139,148,158,${1 - ease})`
      for (const v of [0.6, 0.8, 1.0, 1.2]) ctx.fillText(v.toFixed(1), X0 - 34, pyRaw(v) + 3)
      ctx.fillStyle = `rgba(139,148,158,${ease})`
      for (const v of [0, 2, 4, 6, 8]) ctx.fillText(String(v), X0 - 24, pyDef(v) + 3)

      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = `rgba(88,166,255,${1 - ease})`
      ctx.fillText('u / V   (mean-normalised)', X0, Y0 - 12)
      ctx.fillStyle = `rgba(210,153,34,${ease})`
      ctx.fillText('(Uc − u) / u*   — defect', X0 + 250, Y0 - 12)

      // ---- guide line 2.5 ln(R/y), only meaningful when collapsed -----
      if (ease > 0.05) {
        ctx.strokeStyle = `rgba(210,153,34,${0.85 * ease})`
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let i = 0; i <= 120; i++) {
          const y = YMIN * Math.pow(1 / YMIN, i / 120)
          const px = lx(y)
          const py = pyDef(2.5 * Math.log(1 / y))
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      // ---- the Re curves ----------------------------------------------
      const count = nRef.current
      for (let k = 0; k < count; k++) {
        const Re = Math.pow(10, 4 + k)
        ctx.strokeStyle = COLORS[k % COLORS.length]
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= 160; i++) {
          const y = YMIN * Math.pow(1 / YMIN, i / 160)
          const { raw, defect } = sample(Re, y)
          const px = lx(y)
          const py = pyRaw(raw) * (1 - ease) + pyDef(defect) * ease
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.stroke()

        const { raw, defect, us } = sample(Re, 1)
        const py = pyRaw(raw) * (1 - ease) + pyDef(defect) * ease
        ctx.fillStyle = COLORS[k % COLORS.length]
        ctx.beginPath()
        ctx.arc(X1, py, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText(`Re 1e${4 + k}  u*/V ${us.toFixed(3)}`, X0 + 8, Y0 + 16 + k * 14)
      }

      // ---- spread readout ---------------------------------------------
      const spread =
        sample(Math.pow(10, 3 + count), 0.05).raw - sample(1e4, 0.05).raw
      ctx.fillStyle = '#c9d1d9'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(
        ease < 0.5
          ? `at y/R = 0.05 the curves are ${Math.abs(spread * 100).toFixed(1)}% of V apart`
          : 'every Re lands on the same line: 2.5 ln(R/y)',
        X0,
        Y1 + 50
      )

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={580}
        height={300}
        style={{ width: '100%', borderRadius: 8, background: '#0d1117', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 230 }}>
          <span>
            collapse : <b style={{ color: '#d29922' }}>{(t * 100).toFixed(0)}%</b> (u/V → defect)
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={t}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              tRef.current = v
              setT(v)
              sweepRef.current = false
              setSweep(false)
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 180 }}>
          <span>
            Reynolds curves : <b style={{ color: '#58a6ff' }}>{nCurves}</b>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={nCurves}
            onChange={(e) => setNCurves(parseInt(e.target.value, 10))}
          />
        </label>
        <button
          onClick={() => setSweep((v) => !v)}
          style={{
            padding: '0.35rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: sweep ? '#238636' : '#21262d',
            color: '#c9d1d9',
            cursor: 'pointer',
          }}
        >
          {sweep ? 'pause morph' : 'auto morph'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8b949e', marginTop: '0.6rem' }}>
        Drag <i>collapse</i> from 0 to 100%. On the left the Reynolds curves are clearly separated;
        dividing by u* and measuring from the centreline folds them onto one dashed line that has no
        Reynolds number in it at all.
      </p>
    </div>
  )
}
