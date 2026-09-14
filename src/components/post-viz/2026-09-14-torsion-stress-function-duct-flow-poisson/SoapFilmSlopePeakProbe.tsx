'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Prandtl's soap-film analogy, and the one thing the film tells you that the
// integral does not: WHERE the boundary slope peaks.
//
//   torsion  : tau = |grad Phi|      -> peak shear stress on the section
//   duct flow: tau_w = mu |grad u|   -> peak wall shear on the perimeter
//
// Same field, same gradient, two names.  The peak always sits at the middle of
// the LONG side, never at the corner, where the film is flat.
// ---------------------------------------------------------------------------

const W = 760
const H = 420

const PLAN_X = 46
const PLAN_Y = 44
const PLAN_W = 330
const PLAN_H = 190

const CH_X = 452
const CH_Y = 44
const CH_W = 278
const CH_H = 170

const FILM_Y = 286
const FILM_H = 104

const COL_TOR = '#f0abfc'
const COL_DUCT = '#38bdf8'
const COL_TXT = '#94a3b8'
const COL_DIM = '#64748b'
const COL_HOT = '#fb7185'

const NY = 24

export function SoapFilmSlopePeakProbe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ar, setAr] = useState(2)
  const [mode, setMode] = useState<'torsion' | 'duct'>('torsion')
  const [inflating, setInflating] = useState(true)
  const [read, setRead] = useState({ c1: 0, ratio: 0, peakSide: 'long' })

  const st = useRef({ ar, mode, inflating })
  st.current = { ar, mode, inflating }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let builtFor = -1
    let nx = 0
    let ny = 0
    let dx = 0
    let field: Float64Array = new Float64Array(0)
    let puff = 0 // 0..1 inflation of the film drawing

    const build = (aspect: number) => {
      ny = NY
      nx = Math.min(160, Math.max(NY, Math.round(NY * aspect)))
      dx = 1 / ny
      field = new Float64Array((nx + 1) * (ny + 1))
      puff = 0
      builtFor = aspect
    }

    const at = (i: number, j: number) => field[j * (nx + 1) + i]

    const relax = (n: number) => {
      const omega = 2 / (1 + Math.PI / Math.max(nx, ny))
      for (let s = 0; s < n; s++) {
        for (let j = 1; j < ny; j++) {
          for (let i = 1; i < nx; i++) {
            const k = j * (nx + 1) + i
            const t =
              0.25 * (field[k - 1] + field[k + 1] + field[k - nx - 1] + field[k + nx + 1] + dx * dx)
            field[k] += omega * (t - field[k])
          }
        }
      }
    }

    const draw = () => {
      const s = st.current
      if (builtFor !== s.ar) build(s.ar)
      relax(6)
      if (s.inflating) puff = Math.min(1, puff + 0.02)

      const wid = nx * dx
      const hei = ny * dx

      // ---- boundary slope, walked anticlockwise from the bottom-left corner
      const slopes: Array<{ x: number; y: number; nx: number; ny: number; v: number }> = []
      for (let i = 1; i < nx; i++) slopes.push({ x: i * dx, y: 0, nx: 0, ny: -1, v: at(i, 1) / dx })
      for (let j = 1; j < ny; j++)
        slopes.push({ x: wid, y: j * dx, nx: 1, ny: 0, v: at(nx - 1, j) / dx })
      for (let i = nx - 1; i > 0; i--)
        slopes.push({ x: i * dx, y: hei, nx: 0, ny: 1, v: at(i, ny - 1) / dx })
      for (let j = ny - 1; j > 0; j--) slopes.push({ x: 0, y: j * dx, nx: -1, ny: 0, v: at(1, j) / dx })

      let smax = 0
      let kmax = 0
      for (let k = 0; k < slopes.length; k++)
        if (slopes[k].v > smax) {
          smax = slopes[k].v
          kmax = k
        }
      let shortMax = 0
      for (const p of slopes) if (p.nx !== 0 && p.v > shortMax) shortMax = p.v

      let integral = 0
      for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) integral += at(i, j)
      integral *= dx * dx

      const c1 = smax > 0 ? (2 * integral) / (smax * wid * hei * hei) : 0
      const dh = (4 * wid * hei) / (2 * (wid + hei))
      const tauRatio = smax / (dh / 4)
      const peakSide = slopes[kmax].ny !== 0 ? 'long side' : 'short side'

      // ---- paint
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)
      const accent = s.mode === 'torsion' ? COL_TOR : COL_DUCT

      ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
      ctx.fillStyle = accent
      ctx.fillText(
        s.mode === 'torsion'
          ? 'shear stress  τ = |∇Φ|  around the section'
          : 'wall shear  τw = μ|∇u|  around the perimeter',
        PLAN_X,
        26,
      )

      // plan view
      const sc = Math.min(PLAN_W / wid, PLAN_H / hei)
      const pw = wid * sc
      const ph = hei * sc
      const ox = PLAN_X + (PLAN_W - pw) / 2
      const oy = PLAN_Y + (PLAN_H - ph) / 2
      ctx.fillStyle = 'rgba(148,163,184,0.07)'
      ctx.fillRect(ox, oy, pw, ph)
      ctx.strokeStyle = 'rgba(226,232,240,0.6)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(ox, oy, pw, ph)

      const BAR = 34
      for (let k = 0; k < slopes.length; k += 1) {
        const p = slopes[k]
        const px = ox + p.x * sc
        const py = oy + p.y * sc
        const len = (p.v / smax) * BAR
        ctx.strokeStyle = k === kmax ? COL_HOT : accent
        ctx.globalAlpha = k === kmax ? 1 : 0.55
        ctx.lineWidth = k === kmax ? 2.5 : 1.4
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px + p.nx * len, py + p.ny * len)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      const mx = ox + slopes[kmax].x * sc
      const my = oy + slopes[kmax].y * sc
      ctx.fillStyle = COL_HOT
      ctx.beginPath()
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('peak', mx + 8, my + (slopes[kmax].ny > 0 ? 26 : -14))

      ctx.fillStyle = COL_DIM
      ctx.fillText('corners: slope = 0', ox + 6, oy - 10)
      ctx.fillText(`w/h = ${wid.toFixed(2)} : ${hei.toFixed(2)}`, ox, oy + ph + 44)

      // unrolled perimeter chart
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(CH_X, CH_Y, CH_W, CH_H)
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('slope along the perimeter (unrolled)', CH_X, CH_Y - 10)
      ctx.beginPath()
      for (let k = 0; k < slopes.length; k++) {
        const px = CH_X + (k / (slopes.length - 1)) * CH_W
        const py = CH_Y + CH_H - (slopes[k].v / smax) * (CH_H - 14)
        if (k === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.stroke()
      const kx = CH_X + (kmax / (slopes.length - 1)) * CH_W
      ctx.strokeStyle = COL_HOT
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(kx, CH_Y)
      ctx.lineTo(kx, CH_Y + CH_H)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COL_DIM
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('bottom', CH_X + 2, CH_Y + CH_H + 14)
      ctx.fillText('right', CH_X + CH_W * 0.4, CH_Y + CH_H + 14)
      ctx.fillText('top', CH_X + CH_W * 0.58, CH_Y + CH_H + 14)
      ctx.fillText('left', CH_X + CH_W - 26, CH_Y + CH_H + 14)

      // soap film, cut across the short direction at mid-length
      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('soap film blown over the same hole — cut across the short side', PLAN_X, FILM_Y - 12)
      const fx0 = PLAN_X
      const fx1 = W - 60
      const base = FILM_Y + FILM_H
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.beginPath()
      ctx.moveTo(fx0, base)
      ctx.lineTo(fx1, base)
      ctx.stroke()
      const iMid = Math.round(nx / 2)
      let fmax = 0
      for (let j = 0; j <= ny; j++) if (at(iMid, j) > fmax) fmax = at(iMid, j)
      ctx.beginPath()
      ctx.moveTo(fx0, base)
      for (let j = 0; j <= ny; j++) {
        const px = fx0 + (j / ny) * (fx1 - fx0)
        const py = base - (at(iMid, j) / (fmax || 1)) * (FILM_H - 10) * puff
        ctx.lineTo(px, py)
      }
      ctx.lineTo(fx1, base)
      ctx.closePath()
      ctx.fillStyle = 'rgba(56,189,248,0.16)'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.stroke()

      // tangent marks at the two film edges
      for (const side of [0, 1]) {
        const jj = side === 0 ? 1 : ny - 1
        const px = fx0 + ((side === 0 ? 0 : ny) / ny) * (fx1 - fx0)
        const slope = (at(iMid, jj) / dx / smax) * 40 * puff
        ctx.strokeStyle = COL_HOT
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, base)
        ctx.lineTo(px + (side === 0 ? 34 : -34), base - slope)
        ctx.stroke()
      }
      ctx.fillStyle = COL_DIM
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('edge slope = shear', fx0 + 4, base - 6)

      // readouts
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = COL_DIM
      ctx.fillText('peak sits on the', CH_X, 250)
      ctx.fillStyle = COL_HOT
      ctx.fillText(peakSide, CH_X + 108, 250)
      ctx.fillStyle = COL_DIM
      ctx.fillText(
        s.mode === 'torsion' ? 'c1 = T / (τmax w h²)' : 'τmax / τmean',
        CH_X,
        272,
      )
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(s.mode === 'torsion' ? c1.toFixed(4) : tauRatio.toFixed(3), CH_X + 160, 272)
      ctx.fillStyle = COL_DIM
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText(
        s.mode === 'torsion'
          ? 'handbook: 0.208 at w/h = 1, 0.333 when thin'
          : 'thin duct → 1.0, wall shear goes uniform',
        CH_X,
        290,
      )

      frame += 1
      if (frame % 12 === 0) setReadRef.current({ c1, ratio: tauRatio, peakSide })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />
      <div style={rowS}>
        <button style={btn(inflating)} onClick={() => setInflating((p) => !p)}>
          {inflating ? '❙❙ hold' : '▶ blow'}
        </button>
        <button style={btn(mode === 'torsion', COL_TOR)} onClick={() => setMode('torsion')}>
          shear stress τ
        </button>
        <button style={btn(mode === 'duct', COL_DUCT)} onClick={() => setMode('duct')}>
          wall shear τw
        </button>
        <label style={label}>
          <span style={nameS}>aspect ratio w/h</span>
          <input
            type="range"
            min={1}
            max={6}
            step={0.5}
            value={ar}
            onChange={(e) => setAr(parseFloat(e.target.value))}
          />
          <span style={mono}>{ar.toFixed(1)}</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: COL_HOT }}>peak on the {read.peakSide}</span>
        <span style={{ color: COL_TOR }}>c1 {read.c1.toFixed(4)}</span>
        <span style={{ color: COL_DUCT }}>τmax/τmean {read.ratio.toFixed(3)}</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Stretch the section and watch the red marker: it stays at the middle of the long side and never moves to a corner, where
        the film is flat. Switch the two buttons — the bars are not redrawn, only relabelled.
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 40 }

function btn(active: boolean, colour = '#38bdf8'): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(148,163,184,0.16)' : 'transparent',
    color: active ? colour : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
