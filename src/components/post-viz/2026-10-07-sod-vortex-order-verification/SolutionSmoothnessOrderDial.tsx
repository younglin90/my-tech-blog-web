'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const HALF_WIDTH = 0.12
const GRIDS = [50, 100, 200, 400, 800]

/** bump that morphs from a Gaussian (m = 2) to a top hat (m large) */
function bumpProfile(x: number, m: number): number {
  const d = Math.abs(x - 0.5) / HALF_WIDTH
  return 1 + 0.5 * Math.exp(-Math.pow(d, m))
}

function smearCellWise(q: number[], passes: number): number[] {
  let a = q.slice()
  for (let s = 0; s < passes; s++) {
    const b = a.slice()
    for (let i = 0; i < a.length; i++) {
      const lo = a[(i - 1 + a.length) % a.length]
      const hi = a[(i + 1) % a.length]
      b[i] = 0.25 * lo + 0.5 * a[i] + 0.25 * hi
    }
    a = b
  }
  return a
}

function errorPair(N: number, m: number, passes: number): { l1: number; linf: number } {
  const h = 1 / N
  const exact: number[] = []
  for (let i = 0; i < N; i++) exact.push(bumpProfile((i + 0.5) * h, m))
  const num = smearCellWise(exact, passes)
  let l1 = 0
  let linf = 0
  for (let i = 0; i < N; i++) {
    const d = Math.abs(num[i] - exact[i])
    l1 += d * h
    if (d > linf) linf = d
  }
  return { l1, linf }
}

function leastSquaresSlope(ns: number[], errs: number[]): number {
  const xs = ns.map((n) => Math.log(1 / n))
  const ys = errs.map((e) => Math.log(Math.max(e, 1e-18)))
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  return num / den
}

const M_SCAN = [2, 3, 4, 6, 8, 11, 14, 18, 23, 29, 36, 44, 54, 66, 80]
const W = 760
const H = 400

export function SolutionSmoothnessOrderDial() {
  const [mIdx, setMIdx] = useState(0)
  const [gi, setGi] = useState(2)
  const [passes, setPasses] = useState(3)
  const [norm, setNorm] = useState<'l1' | 'linf'>('l1')
  const [sweeping, setSweeping] = useState(true)
  const [slopeOut, setSlopeOut] = useState(2)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cursor = useRef(0)
  const frame = useRef(0)

  const m = M_SCAN[mIdx]

  const curve = useMemo(() => {
    const errs = GRIDS.map((n) => errorPair(n, m, passes))
    return {
      l1: errs.map((e) => e.l1),
      linf: errs.map((e) => e.linf),
      sl1: leastSquaresSlope(GRIDS, errs.map((e) => e.l1)),
      sli: leastSquaresSlope(GRIDS, errs.map((e) => e.linf)),
    }
  }, [m, passes])

  const scan = useMemo(
    () =>
      M_SCAN.map((mm) => {
        const errs = GRIDS.map((n) => errorPair(n, mm, passes))
        return {
          l1: leastSquaresSlope(GRIDS, errs.map((e) => e.l1)),
          linf: leastSquaresSlope(GRIDS, errs.map((e) => e.linf)),
        }
      }),
    [passes],
  )

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      frame.current++
      if (sweeping) {
        cursor.current += 0.006
        if (cursor.current > 1) cursor.current = 0
      }
      const cx = cursor.current
      const N = GRIDS[gi]
      const h = 1 / N
      const exact: number[] = []
      for (let i = 0; i < N; i++) exact.push(bumpProfile((i + 0.5) * h, m))
      const num = smearCellWise(exact, passes)

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      // ---- left: profile ----
      const PX = 48
      const PY = 26
      const PW = 360
      const PH = 176
      const xp = (x: number) => PX + x * PW
      const yp = (r: number) => PY + PH - ((r - 0.95) / 0.62) * PH
      ctx.strokeStyle = '#21262d'
      for (let k = 0; k <= 4; k++) {
        const y = PY + (PH * k) / 4
        ctx.beginPath()
        ctx.moveTo(PX, y)
        ctx.lineTo(PX + PW, y)
        ctx.stroke()
      }
      ctx.strokeStyle = '#484f58'
      ctx.beginPath()
      ctx.moveTo(PX, PY)
      ctx.lineTo(PX, PY + PH)
      ctx.lineTo(PX + PW, PY + PH)
      ctx.stroke()

      let cum = 0
      let total = 0
      for (let i = 0; i < N; i++) {
        const xc = (i + 0.5) * h
        const d = Math.abs(num[i] - exact[i])
        total += d * h
        if (xc <= cx) cum += d * h
        const swept = xc <= cx
        ctx.fillStyle = swept ? 'rgba(210,153,34,0.55)' : 'rgba(110,118,129,0.25)'
        const wpx = Math.max(PW / N, 0.9)
        const ya = yp(exact[i])
        const yb = yp(num[i])
        ctx.fillRect(xp(i * h), Math.min(ya, yb), wpx, Math.max(Math.abs(yb - ya), 0.7))
      }

      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let i = 0; i <= 600; i++) {
        const x = i / 600
        const r = bumpProfile(x, m)
        if (i === 0) ctx.moveTo(xp(x), yp(r))
        else ctx.lineTo(xp(x), yp(r))
      }
      ctx.stroke()
      ctx.fillStyle = '#3fb950'
      for (let i = 0; i < N; i++) {
        ctx.beginPath()
        ctx.arc(xp((i + 0.5) * h), yp(num[i]), N > 200 ? 1 : 2, 0, 2 * Math.PI)
        ctx.fill()
      }
      ctx.strokeStyle = '#d29922'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(xp(cx), PY)
      ctx.lineTo(xp(cx), PY + PH)
      ctx.stroke()

      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`exact  rho = 1 + 0.5 exp(-(|x-0.5|/0.12)^${m})`, PX + 6, PY + 14)
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('1.50', 16, yp(1.5) + 4)
      ctx.fillText('1.00', 16, yp(1.0) + 4)
      ctx.fillStyle = '#d29922'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`swept L1 = ${cum.toExponential(2)} / ${total.toExponential(2)}`, PX + 6, PY + PH - 8)

      // ---- right: log-log ----
      const IX = 452
      const IY = 26
      const IW = 276
      const IH = 176
      ctx.strokeStyle = '#30363d'
      ctx.strokeRect(IX, IY, IW, IH)
      const lx = (n: number) =>
        IX + 42 + ((Math.log(n) - Math.log(GRIDS[0])) / (Math.log(800) - Math.log(50))) * (IW - 60)
      const emin = Math.log(2e-6)
      const emax = Math.log(0.3)
      const ly = (e: number) => IY + 22 + (1 - (Math.log(Math.max(e, 1e-18)) - emin) / (emax - emin)) * (IH - 46)
      const pick: [number[], string, boolean][] = [
        [curve.l1, '#d29922', norm === 'l1'],
        [curve.linf, '#f85149', norm === 'linf'],
      ]
      pick.forEach(([arr, col, active]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = active ? 2.4 : 1
        ctx.beginPath()
        GRIDS.forEach((n, i) => (i === 0 ? ctx.moveTo(lx(n), ly(arr[i])) : ctx.lineTo(lx(n), ly(arr[i]))))
        ctx.stroke()
        ctx.fillStyle = col
        GRIDS.forEach((n, i) => {
          ctx.beginPath()
          ctx.arc(lx(n), ly(arr[i]), n === GRIDS[gi] ? 4.2 : 2, 0, 2 * Math.PI)
          ctx.fill()
        })
      })
      // reference triangles
      ctx.strokeStyle = '#30363d'
      ctx.setLineDash([3, 3])
      ;[1, 2].forEach((p) => {
        ctx.beginPath()
        ctx.moveTo(lx(50), ly(0.2 * Math.pow(0.02, p)))
        ctx.lineTo(lx(800), ly(0.2 * Math.pow(0.00125, p)))
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('slope 1', IX + IW - 58, ly(0.2 * 0.00125) - 4)
      ctx.fillText('slope 2', IX + IW - 58, ly(0.2 * 0.00125 ** 2) - 4)
      ctx.fillText('N = 50', IX + 24, IY + IH - 6)
      ctx.fillText('800', IX + IW - 26, IY + IH - 6)
      ctx.fillStyle = norm === 'l1' ? '#d29922' : '#f85149'
      ctx.font = 'bold 22px ui-monospace, monospace'
      ctx.fillText(`${(norm === 'l1' ? curve.sl1 : curve.sli).toFixed(2)}`, IX + 48, IY + 36)
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText(`measured ${norm === 'l1' ? 'L1' : 'Linf'} order`, IX + 48, IY + 50)

      // ---- bottom: slope vs m ----
      const BX = 48
      const BY = 240
      const BW = W - 100
      const BH = 128
      ctx.strokeStyle = '#484f58'
      ctx.beginPath()
      ctx.moveTo(BX, BY)
      ctx.lineTo(BX, BY + BH)
      ctx.lineTo(BX + BW, BY + BH)
      ctx.stroke()
      const sx = (i: number) => BX + (i / (M_SCAN.length - 1)) * BW
      const sy = (s: number) => BY + BH - (Math.max(Math.min(s, 2.2), -0.2) / 2.2) * BH
      ctx.strokeStyle = '#21262d'
      ;[0, 1, 2].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(BX, sy(v))
        ctx.lineTo(BX + BW, sy(v))
        ctx.stroke()
        ctx.fillStyle = '#6e7681'
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText(v.toFixed(1), 22, sy(v) + 4)
      })
      ;([['l1', '#d29922'], ['linf', '#f85149']] as const).forEach(([key, col]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = norm === key ? 2.4 : 1
        ctx.beginPath()
        scan.forEach((s, i) => {
          const v = key === 'l1' ? s.l1 : s.linf
          if (i === 0) ctx.moveTo(sx(i), sy(v))
          else ctx.lineTo(sx(i), sy(v))
        })
        ctx.stroke()
      })
      const cur = norm === 'l1' ? scan[mIdx].l1 : scan[mIdx].linf
      ctx.fillStyle = '#e6edf3'
      ctx.beginPath()
      ctx.arc(sx(mIdx), sy(cur), 4.5 + 1.5 * Math.sin(frame.current / 9), 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('measured order  vs  profile sharpness m', BX + 6, BY + 14)
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('m = 2 (smooth)', BX, BY + BH + 14)
      ctx.fillText('m = 80 (near jump)', BX + BW - 94, BY + BH + 14)
      ctx.fillStyle = '#d29922'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('L1', BX + BW + 6, sy(scan[scan.length - 1].l1))
      ctx.fillStyle = '#f85149'
      ctx.fillText('Linf', BX + BW + 6, sy(scan[scan.length - 1].linf))

      if (frame.current % 14 === 0) setSlopeOut(norm === 'l1' ? curve.sl1 : curve.sli)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [m, mIdx, gi, passes, norm, sweeping, curve, scan])

  const btn = {
    padding: '3px 12px',
    borderRadius: 6,
    border: '1px solid #30363d',
    background: '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
  } as const

  return (
    <div style={{ margin: '1.6rem 0', fontFamily: 'ui-monospace, monospace' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 8, border: '1px solid #30363d', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.7rem', alignItems: 'center', fontSize: 13 }}>
        <label>
          sharpness m = <b>{m}</b>{' '}
          <input type="range" min={0} max={M_SCAN.length - 1} step={1} value={mIdx} onChange={(e) => setMIdx(Number(e.target.value))} />
        </label>
        <label>
          N = <b>{GRIDS[gi]}</b>{' '}
          <input type="range" min={0} max={GRIDS.length - 1} step={1} value={gi} onChange={(e) => setGi(Number(e.target.value))} />
        </label>
        <label>
          smear = <b>{passes}</b> cells{' '}
          <input type="range" min={1} max={6} step={1} value={passes} onChange={(e) => setPasses(Number(e.target.value))} />
        </label>
        <button onClick={() => setNorm((n) => (n === 'l1' ? 'linf' : 'l1'))} style={btn}>
          {norm === 'l1' ? 'show Linf' : 'show L1'}
        </button>
        <button onClick={() => setSweeping((s) => !s)} style={btn}>
          {sweeping ? 'pause sweep' : 'run sweep'}
        </button>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: 13, color: '#8b949e' }}>
        m = {m} gives a measured {norm === 'l1' ? 'L1' : 'Linf'} order of{' '}
        <b style={{ color: norm === 'l1' ? '#d29922' : '#f85149' }}>{slopeOut.toFixed(2)}</b> — the scheme never changed.
      </div>
    </div>
  )
}
