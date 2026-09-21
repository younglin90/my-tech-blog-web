'use client'

import { useEffect, useRef, useState } from 'react'

const DIFF = 2e-5 // m^2/s, representative gas-phase diffusivity
const X_MAX = 0.008 // m, half width of the drawn slab
const CHI_Q = 10.12 // 1/s, quench limit of the undiluted flamelet (from the Python run)

/** Numerical-Recipes erfc, good to ~1e-7 — enough for drawing */
function erfcFast(x: number) {
  const z = Math.abs(x)
  const t = 1 / (1 + 0.5 * z)
  const y =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
    )
  return x >= 0 ? y : 2 - y
}

function erfcInvFast(y: number) {
  let lo = -5
  let hi = 5
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    if (erfcFast(mid) > y) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

export function StrainSqueezedMixtureLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [strain, setStrain] = useState(60)
  const [zSt, setZSt] = useState(0.055)
  const [running, setRunning] = useState(true)

  const strainRef = useRef(strain)
  const zStRef = useRef(zSt)
  const runRef = useRef(running)
  strainRef.current = strain
  zStRef.current = zSt
  runRef.current = running

  const etaSt = erfcInvFast(2 * zSt)
  const chiStNow = (strain / Math.PI) * Math.exp(-2 * etaSt * etaSt)
  const thickness = Math.sqrt((2 * DIFF) / strain)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dots: { x: number; y: number }[] = []
    for (let i = 0; i < 220; i++) {
      dots.push({ x: (Math.random() * 2 - 1) * X_MAX, y: (Math.random() * 2 - 1) * X_MAX })
    }

    let frame = 0
    let raf = 0
    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const a = strainRef.current
      const zs = zStRef.current
      const eta = erfcInvFast(2 * zs)
      const scale = Math.sqrt(a / (2 * DIFF)) // eta = scale * x
      const xSt = eta / scale
      const chiSt = (a / Math.PI) * Math.exp(-2 * eta * eta)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0c1118'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'

      const L = 58
      const R = W - 26
      const TOP = 30
      const SPLIT = Math.round(H * 0.58)
      const BOT = H - 44
      const px = (x: number) => L + ((x + X_MAX) / (2 * X_MAX)) * (R - L)

      // ---------- top: the physical mixing layer ----------
      const NB = 220
      for (let i = 0; i < NB; i++) {
        const x = -X_MAX + ((i + 0.5) / NB) * 2 * X_MAX
        const z = 0.5 * erfcFast(-x * scale) // x>0 = fuel side
        const r = Math.round(30 + 190 * z)
        const g = Math.round(40 + 30 * z)
        const b = Math.round(150 - 120 * z)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(px(x), TOP, (R - L) / NB + 1, SPLIT - TOP)
      }

      // flame sheet: bright while chi_st stays under the quench limit
      const health = Math.max(0, 1 - chiSt / CHI_Q)
      const halfW = Math.max(1.5, ((R - L) * (0.9 / scale)) / (2 * X_MAX))
      for (let s = 3; s >= 1; s--) {
        ctx.fillStyle = `rgba(255,${180 + 50 * health},${80 + 120 * health},${(0.1 * health * s).toFixed(3)})`
        ctx.fillRect(px(xSt) - halfW * s, TOP, 2 * halfW * s, SPLIT - TOP)
      }
      ctx.strokeStyle = health > 0 ? `rgba(255,235,180,${0.35 + 0.65 * health})` : 'rgba(120,130,145,0.5)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(px(xSt), TOP)
      ctx.lineTo(px(xSt), SPLIT)
      ctx.stroke()

      // counterflow tracers: u = -a x, v = +a y
      if (runRef.current) {
        const dtn = Math.min(0.05, Math.max(0.006, 0.02 * Math.sqrt(a / 400)))
        const shrink = Math.exp(-dtn)
        for (const d of dots) {
          d.x *= shrink
          d.y /= shrink
          if (Math.abs(d.y) > X_MAX || Math.abs(d.x) < 2e-5) {
            d.x = (Math.random() * 2 - 1) * X_MAX
            d.y = (Math.random() * 0.3 - 0.15) * X_MAX
          }
        }
      }
      ctx.fillStyle = 'rgba(235,242,255,0.75)'
      for (const d of dots) {
        const cy = TOP + ((d.y + X_MAX) / (2 * X_MAX)) * (SPLIT - TOP)
        ctx.fillRect(px(d.x), cy, 2, 2)
      }

      ctx.fillStyle = '#cfd8e6'
      ctx.fillText('air  (Z = 0)', L + 6, SPLIT - 8)
      ctx.textAlign = 'right'
      ctx.fillText('fuel  (Z = 1)', R - 6, SPLIT - 8)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ffe0a3'
      ctx.fillText(`Z = Z_st sheet`, Math.min(px(xSt) + 6, R - 92), TOP + 14)

      // ---------- bottom: Z(x) and chi(x) ----------
      const gTop = SPLIT + 26
      ctx.strokeStyle = '#5a6b80'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(L, gTop)
      ctx.lineTo(L, BOT)
      ctx.lineTo(R, BOT)
      ctx.stroke()

      const chiMax = a / Math.PI
      ctx.strokeStyle = '#ff9a3c'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 240; i++) {
        const x = -X_MAX + (i / 240) * 2 * X_MAX
        const c = (a / Math.PI) * Math.exp(-2 * (x * scale) ** 2)
        const py = BOT - (c / chiMax) * (BOT - gTop)
        i === 0 ? ctx.moveTo(px(x), py) : ctx.lineTo(px(x), py)
      }
      ctx.stroke()

      ctx.strokeStyle = '#4ade80'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 240; i++) {
        const x = -X_MAX + (i / 240) * 2 * X_MAX
        const z = 0.5 * erfcFast(-x * scale)
        const py = BOT - z * (BOT - gTop)
        i === 0 ? ctx.moveTo(px(x), py) : ctx.lineTo(px(x), py)
      }
      ctx.stroke()

      ctx.setLineDash([3, 3])
      ctx.strokeStyle = 'rgba(255,224,163,0.8)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(px(xSt), gTop)
      ctx.lineTo(px(xSt), BOT)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#ffe0a3'
      ctx.beginPath()
      ctx.arc(px(xSt), BOT - (chiSt / chiMax) * (BOT - gTop), 4.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#4ade80'
      ctx.fillText('Z(x)', L + 6, gTop + 12)
      ctx.fillStyle = '#ff9a3c'
      ctx.fillText('chi(x) / chi_max', L + 46, gTop + 12)
      ctx.fillStyle = '#93a3b8'
      ctx.textAlign = 'center'
      ctx.fillText('x  [mm]   (stagnation plane at 0)', (L + R) / 2, BOT + 30)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#5b6a7d'
      for (const xm of [-8, -4, 0, 4, 8]) {
        ctx.textAlign = 'center'
        ctx.fillText(String(xm), px(xm / 1000), BOT + 15)
      }
      ctx.textAlign = 'left'

      // banner
      ctx.font = 'bold 13px ui-monospace, monospace'
      ctx.fillStyle = chiSt > CHI_Q ? '#ff4d5e' : '#ffd166'
      ctx.fillText(
        `a = ${a.toFixed(0)} 1/s    chi_st = ${chiSt.toFixed(2)} 1/s    ${
          chiSt > CHI_Q ? 'ABOVE chi_q -> the flamelet cannot hold' : 'below chi_q'
        }`,
        L,
        18
      )
      ctx.font = '11px ui-monospace, monospace'

      frame++
      raf = requestAnimationFrame(draw)
      if (frame < 0) raf = 0
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={420}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        <label>
          strain rate a = {strain.toFixed(0)} 1/s{' '}
          <input
            type="range"
            min={10}
            max={900}
            step={5}
            value={strain}
            onChange={(e) => setStrain(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Z_st = {zSt.toFixed(3)}{' '}
          <input
            type="range"
            min={0.03}
            max={0.35}
            step={0.005}
            value={zSt}
            onChange={(e) => setZSt(parseFloat(e.target.value))}
          />
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Layer thickness sqrt(2D/a) = {(thickness * 1000).toFixed(2)} mm, chi_st ={' '}
        {chiStNow.toFixed(2)} 1/s against the quench limit 10.12 1/s. Raising a squeezes the layer
        and the sheet dims; moving Z_st slides the sheet off the chi peak, so the same strain
        delivers far less dissipation to the reaction zone.
      </p>
    </div>
  )
}
