'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Poiseuille's 1838 bench, redone every second.
//
// A set of glass tubes spanning [Dmin, Dmin*span] carries the true flow
// Q = pi dp D^4 / (128 mu L).  The flow rate is weighed accurately; the bore
// is not — each diameter is read off with a relative error.  Fitting
// log Q against log D gives an exponent that should be 4.
//
// The scatter of that exponent is (noise) / (lever arm in log D).  Narrow the
// range of tubes and the estimate wobbles; stretch it towards a hair-thin
// bore and it locks onto 4 even with a clumsy ruler.  That is why the
// smallest tube on Poiseuille's bench was 0.015 mm.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const AX = 56 // scatter axes
const AY = 44
const AW = 400
const AH = 306

const HX = 512 // histogram
const HY = 44
const HW = 216
const HH = 306

const NBIN = 28
const EMIN = 3.4
const EMAX = 4.6

const COL_PT = '#38bdf8'
const COL_FIT = '#fbbf24'
const COL_TRUE = '#4ade80'
const COL_TXT = '#e2e8f0'
const COL_DIM = '#94a3b8'

const DMIN_MM = 0.015

function gauss(): number {
  const a = Math.random() || 1e-9
  const b = Math.random()
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b)
}

/** least squares slope of log y against log x */
function slopeOf(xs: number[], ys: number[]): number {
  const n = xs.length
  const lx = xs.map(Math.log)
  const ly = ys.map(Math.log)
  const mx = lx.reduce((s, v) => s + v, 0) / n
  const my = ly.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (lx[i] - mx) * (ly[i] - my)
    den += (lx[i] - mx) ** 2
  }
  return num / den
}

export function ExponentFitNoiseBench() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [noise, setNoise] = useState(3)
  const [span, setSpan] = useState(3)
  const [ntube, setNtube] = useState(12)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ last: 4, mean: 4, sd: 0, n: 0 })
  const resetAt = useRef(0)

  const live = useRef({ noise, span, ntube, running })
  live.current = { noise, span, ntube, running }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let bins = new Array<number>(NBIN).fill(0)
    let sum = 0
    let sum2 = 0
    let count = 0
    let lastKey = ''
    let lastMark = -1
    let pts: Array<{ d: number; q: number }> = []
    let fit = 4
    let frame = 0
    let raf = 0

    const text = (s: string, x: number, y: number, c = COL_TXT, f = '12px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const resample = () => {
      const L = live.current
      pts = []
      const ds: number[] = []
      const qs: number[] = []
      for (let k = 0; k < L.ntube; k++) {
        const f = L.ntube === 1 ? 0 : k / (L.ntube - 1)
        const dTrue = DMIN_MM * Math.pow(L.span, f)
        const q = Math.pow(dTrue, 4) // pi dp / (128 mu L) folded away
        const dRead = dTrue * (1 + (L.noise / 100) * gauss())
        ds.push(Math.max(1e-6, dRead))
        qs.push(q)
        pts.push({ d: Math.max(1e-6, dRead), q })
      }
      fit = slopeOf(ds, qs)
      const b = Math.floor(((fit - EMIN) / (EMAX - EMIN)) * NBIN)
      if (b >= 0 && b < NBIN) bins[b]++
      count++
      sum += fit
      sum2 += fit * fit
    }

    const clear = () => {
      bins = new Array<number>(NBIN).fill(0)
      sum = 0
      sum2 = 0
      count = 0
      resample()
    }

    clear()

    const draw = () => {
      const L = live.current
      const key = `${L.noise}|${L.span}|${L.ntube}`
      if (key !== lastKey) {
        lastKey = key
        clear()
      }
      if (resetAt.current !== lastMark) {
        lastMark = resetAt.current
        clear()
      }
      if (L.running && frame % 36 === 0) resample()

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- log-log scatter ----------------
      const dMax = DMIN_MM * L.span
      const lx0 = Math.log10(DMIN_MM) - 0.12
      const lx1 = Math.log10(dMax) + 0.12
      const ly0 = 4 * (Math.log10(DMIN_MM) - 0.15)
      const ly1 = 4 * (Math.log10(dMax) + 0.15)
      const sx = (d: number) => AX + ((Math.log10(d) - lx0) / (lx1 - lx0)) * AW
      const sy = (q: number) => AY + AH - ((Math.log10(q) - ly0) / (ly1 - ly0)) * AH

      ctx.strokeStyle = 'rgba(148,163,184,0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(AX, AY, AW, AH)
      for (let g = 1; g < 4; g++) {
        ctx.beginPath()
        ctx.moveTo(AX, AY + (g * AH) / 4)
        ctx.lineTo(AX + AW, AY + (g * AH) / 4)
        ctx.moveTo(AX + (g * AW) / 4, AY)
        ctx.lineTo(AX + (g * AW) / 4, AY + AH)
        ctx.stroke()
      }
      text('log Q   (arbitrary units)', AX - 44, AY - 14, COL_DIM, '11px ui-monospace, monospace')
      text('log D   [mm]', AX + AW - 78, AY + AH + 20, COL_DIM, '11px ui-monospace, monospace')
      text(`${DMIN_MM.toFixed(3)}`, AX - 6, AY + AH + 20, COL_DIM, '10px ui-monospace, monospace')
      text(`${dMax.toFixed(3)}`, AX + AW - 34, AY + AH + 34, COL_DIM, '10px ui-monospace, monospace')

      // slope 4 reference through the mid point
      const dm = Math.sqrt(DMIN_MM * dMax)
      const qm = Math.pow(dm, 4)
      const lineAt = (s: number, col: string, dash: number[]) => {
        ctx.setLineDash(dash)
        ctx.strokeStyle = col
        ctx.lineWidth = 1.8
        ctx.beginPath()
        const d0 = Math.pow(10, lx0)
        const d1 = Math.pow(10, lx1)
        ctx.moveTo(sx(d0), sy(qm * Math.pow(d0 / dm, s)))
        ctx.lineTo(sx(d1), sy(qm * Math.pow(d1 / dm, s)))
        ctx.stroke()
        ctx.setLineDash([])
      }
      lineAt(4, COL_TRUE, [5, 5])
      lineAt(fit, COL_FIT, [])

      ctx.fillStyle = COL_PT
      for (const p of pts) {
        ctx.beginPath()
        ctx.arc(sx(p.d), sy(p.q), 3.4, 0, 2 * Math.PI)
        ctx.fill()
      }

      text(`fitted exponent  ${fit.toFixed(3)}`, AX + 10, AY + 22, COL_FIT, '13px ui-monospace, monospace')
      text('true slope 4', AX + 10, AY + 40, COL_TRUE, '11px ui-monospace, monospace')
      text(`lever arm  log10(Dmax/Dmin) = ${Math.log10(L.span).toFixed(2)}`, AX + 10, AY + AH - 14, COL_DIM, '11px ui-monospace, monospace')

      // ---------------- histogram ----------------
      const mean = count ? sum / count : 4
      const varr = count ? Math.max(0, sum2 / count - mean * mean) : 0
      const sd = Math.sqrt(varr)
      const top = Math.max(1, ...bins)

      ctx.strokeStyle = 'rgba(148,163,184,0.2)'
      ctx.strokeRect(HX, HY, HW, HH)
      text('exponents fitted so far', HX, HY - 14, COL_DIM, '11px ui-monospace, monospace')
      for (let b = 0; b < NBIN; b++) {
        const h = (bins[b] / top) * (HH - 60)
        ctx.fillStyle = 'rgba(56,189,248,0.55)'
        ctx.fillRect(HX + 2 + (b * (HW - 4)) / NBIN, HY + HH - 40 - h, (HW - 4) / NBIN - 1.5, h)
      }
      const ex = (v: number) => HX + ((v - EMIN) / (EMAX - EMIN)) * HW
      ctx.strokeStyle = COL_TRUE
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(ex(4), HY + 8)
      ctx.lineTo(ex(4), HY + HH - 36)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = COL_FIT
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ex(fit), HY + HH - 44)
      ctx.lineTo(ex(fit), HY + HH - 34)
      ctx.stroke()

      text(`${EMIN.toFixed(1)}`, HX - 2, HY + HH - 18, COL_DIM, '10px ui-monospace, monospace')
      text('4.0', ex(4) - 10, HY + HH - 18, COL_TRUE, '10px ui-monospace, monospace')
      text(`${EMAX.toFixed(1)}`, HX + HW - 20, HY + HH - 18, COL_DIM, '10px ui-monospace, monospace')
      text(`mean ${mean.toFixed(3)}`, HX, HY + HH - 2, COL_TXT, '12px ui-monospace, monospace')
      text(`sd   ${sd.toFixed(3)}`, HX + 108, HY + HH - 2, COL_FIT, '12px ui-monospace, monospace')
      text(`${count} fits`, HX + HW - 54, HY + 18, COL_DIM, '11px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) push.current({ last: fit, mean, sd, n: count })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }
  const btn = (on: boolean): CSSProperties => ({
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ hold the bench' : '▶ keep measuring'}
        </button>
        <button style={btn(false)} onClick={() => (resetAt.current += 1)}>
          ↺ clear the histogram
        </button>
        <label style={label}>
          <span style={nameS}>noise on D</span>
          <input type="range" min={0} max={6} step={0.5} value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} />
          <span style={mono}>{noise.toFixed(1)}%</span>
        </label>
        <label style={label}>
          <span style={nameS}>Dmax/Dmin</span>
          <input type="range" min={2} max={40} step={1} value={span} onChange={(e) => setSpan(parseInt(e.target.value, 10))} />
          <span style={mono}>x{span}</span>
        </label>
        <label style={label}>
          <span style={nameS}>tubes</span>
          <input type="range" min={5} max={24} step={1} value={ntube} onChange={(e) => setNtube(parseInt(e.target.value, 10))} />
          <span style={mono}>{ntube}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Leave the bench running with <em>Dmax/Dmin</em> at 3: the histogram spreads out and the fitted exponent wanders
        (mean {stat.mean.toFixed(3)}, sd {stat.sd.toFixed(3)} over {stat.n} fits). Now push the range to 40 without
        touching the noise — the same clumsy ruler, the same number of tubes, and the histogram collapses onto 4. The
        exponent is bought with the lever arm in log D, not with a better ruler.
      </div>
    </div>
  )
}
