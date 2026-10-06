'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const G = 1.4
const RL = 1.0
const PL = 1.0
const RR = 0.125
const PR = 0.1

/** Newton iteration on the star pressure of the Sod Riemann problem. */
function sodStarState(): { pStar: number; uStar: number } {
  const aL = Math.sqrt((G * PL) / RL)
  const aR = Math.sqrt((G * PR) / RR)
  const branch = (p: number, r: number, a: number, pk: number): [number, number] => {
    if (p > pk) {
      const A = 2 / ((G + 1) * r)
      const B = ((G - 1) / (G + 1)) * pk
      return [
        (p - pk) * Math.sqrt(A / (p + B)),
        Math.sqrt(A / (B + p)) * (1 - (0.5 * (p - pk)) / (B + p)),
      ]
    }
    return [
      ((2 * a) / (G - 1)) * (Math.pow(p / pk, (G - 1) / (2 * G)) - 1),
      (1 / (r * a)) * Math.pow(p / pk, -(G + 1) / (2 * G)),
    ]
  }
  let p = 0.5 * (PL + PR)
  for (let i = 0; i < 60; i++) {
    const [f1, d1] = branch(p, RL, aL, PL)
    const [f2, d2] = branch(p, RR, aR, PR)
    const dp = (f1 + f2) / (d1 + d2)
    p = Math.max(p - dp, 1e-10)
    if (Math.abs(dp) < 1e-13) break
  }
  const [f1] = branch(p, RL, aL, PL)
  const [f2] = branch(p, RR, aR, PR)
  return { pStar: p, uStar: 0.5 * (f2 - f1) }
}

/** exact density of the Sod solution as a function of the self-similar ray xi = (x-0.5)/t */
function exactDensityRay(xi: number, pStar: number, uStar: number): number {
  const aL = Math.sqrt((G * PL) / RL)
  const aR = Math.sqrt((G * PR) / RR)
  if (xi <= uStar) {
    const aStarL = aL * Math.pow(pStar / PL, (G - 1) / (2 * G))
    if (xi < -aL) return RL
    if (xi > uStar - aStarL) return RL * Math.pow(pStar / PL, 1 / G)
    const c = 2 / (G + 1) + ((G - 1) / ((G + 1) * aL)) * -xi
    return RL * Math.pow(c, 2 / (G - 1))
  }
  const sShock = aR * Math.sqrt(((G + 1) / (2 * G)) * (pStar / PR) + (G - 1) / (2 * G))
  if (xi > sShock) return RR
  const ratio = pStar / PR
  const k = (G - 1) / (G + 1)
  return RR * ((ratio + k) / (k * ratio + 1))
}

/** numerical solution model: the exact profile smeared over a fixed number of CELLS */
function smearCells(q: number[], passes: number): number[] {
  let a = q.slice()
  for (let s = 0; s < passes; s++) {
    const b = a.slice()
    for (let i = 1; i < a.length - 1; i++) b[i] = 0.25 * a[i - 1] + 0.5 * a[i] + 0.25 * a[i + 1]
    a = b
  }
  return a
}

type Norms = { h: number; l1: number; linf: number; argmax: number }

function normsAt(N: number, t: number, pStar: number, uStar: number, passes: number): Norms {
  const h = 1 / N
  const exact: number[] = []
  for (let i = 0; i < N; i++) exact.push(exactDensityRay(((i + 0.5) * h - 0.5) / t, pStar, uStar))
  const num = smearCells(exact, passes)
  let l1 = 0
  let linf = 0
  let argmax = 0
  for (let i = 0; i < N; i++) {
    const d = Math.abs(num[i] - exact[i])
    l1 += d * h
    if (d > linf) {
      linf = d
      argmax = (i + 0.5) * h
    }
  }
  return { h, l1, linf, argmax }
}

function fitSlope(ns: number[], errs: number[]): number {
  const xs = ns.map((n) => Math.log(1 / n))
  const ys = errs.map((e) => Math.log(Math.max(e, 1e-16)))
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

const GRIDS = [25, 50, 100, 200, 400, 800]
const W = 760
const H = 430

export function ShockNormSplitBench() {
  const [gi, setGi] = useState(2)
  const [time, setTime] = useState(0.2)
  const [passes, setPasses] = useState(3)
  const [norm, setNorm] = useState<'l1' | 'linf'>('l1')
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState<Norms>({ h: 0.01, l1: 0, linf: 0, argmax: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frame = useRef(0)
  const tRef = useRef(0.2)

  const star = useMemo(() => sodStarState(), [])

  const sweep = useMemo(() => {
    const l1 = GRIDS.map((n) => normsAt(n, time, star.pStar, star.uStar, passes).l1)
    const li = GRIDS.map((n) => normsAt(n, time, star.pStar, star.uStar, passes).linf)
    return { l1, li, sl1: fitSlope(GRIDS, l1), sli: fitSlope(GRIDS, li) }
  }, [time, passes, star])

  useEffect(() => {
    tRef.current = time
  }, [time])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      frame.current++
      if (running) {
        tRef.current += 0.0012
        if (tRef.current > 0.26) tRef.current = 0.03
      }
      const t = tRef.current
      const N = GRIDS[gi]
      const h = 1 / N
      const exact: number[] = []
      for (let i = 0; i < N; i++) exact.push(exactDensityRay(((i + 0.5) * h - 0.5) / t, star.pStar, star.uStar))
      const num = smearCells(exact, passes)
      let l1 = 0
      let linf = 0
      let argmax = 0
      for (let i = 0; i < N; i++) {
        const d = Math.abs(num[i] - exact[i])
        l1 += d * h
        if (d > linf) {
          linf = d
          argmax = i
        }
      }

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      const PX = 52
      const PY = 26
      const PW = W - 80
      const PH = 210
      const xp = (x: number) => PX + x * PW
      const yp = (r: number) => PY + PH - (r / 1.08) * PH

      ctx.strokeStyle = '#21262d'
      ctx.lineWidth = 1
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
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      for (let k = 0; k <= 4; k++) {
        ctx.fillText((1.08 - (1.08 * k) / 4).toFixed(2), 16, PY + (PH * k) / 4 + 4)
      }
      ctx.fillText('x = 0', PX - 8, PY + PH + 14)
      ctx.fillText('x = 1', PX + PW - 14, PY + PH + 14)
      ctx.save()
      ctx.translate(14, PY + PH / 2 + 20)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('density', 0, 0)
      ctx.restore()

      // error band between exact and smeared
      ctx.fillStyle = norm === 'l1' ? 'rgba(210,153,34,0.38)' : 'rgba(248,81,73,0.22)'
      for (let i = 0; i < N; i++) {
        const x0 = xp(i * h)
        const wpx = Math.max(PW / N, 0.9)
        const ya = yp(exact[i])
        const yb = yp(num[i])
        ctx.fillRect(x0, Math.min(ya, yb), wpx, Math.max(Math.abs(yb - ya), 0.7))
      }

      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let i = 0; i < 900; i++) {
        const x = (i + 0.5) / 900
        const r = exactDensityRay((x - 0.5) / t, star.pStar, star.uStar)
        if (i === 0) ctx.moveTo(xp(x), yp(r))
        else ctx.lineTo(xp(x), yp(r))
      }
      ctx.stroke()

      ctx.fillStyle = '#3fb950'
      const dot = N > 200 ? 1.1 : 2.1
      for (let i = 0; i < N; i++) {
        ctx.beginPath()
        ctx.arc(xp((i + 0.5) * h), yp(num[i]), dot, 0, 2 * Math.PI)
        ctx.fill()
      }

      if (norm === 'linf') {
        const x = xp((argmax + 0.5) * h)
        ctx.strokeStyle = '#f85149'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(x, PY)
        ctx.lineTo(x, PY + PH)
        ctx.stroke()
        ctx.fillStyle = '#f85149'
        ctx.font = 'bold 11px ui-monospace, monospace'
        ctx.fillText(`max |err| = ${linf.toFixed(4)}`, Math.min(x + 6, PX + PW - 130), PY + 14)
      }

      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('exact Riemann solution', PX + 8, PY + 14)
      ctx.fillStyle = '#3fb950'
      ctx.fillText('numerical cells', PX + 8, PY + 28)
      ctx.fillStyle = '#6e7681'
      ctx.fillText(`t = ${t.toFixed(3)}   shock at x = ${(0.5 + 1.75216 * t).toFixed(3)}`, PX + PW - 230, PY + 14)

      // log-log convergence inset
      const IX = 450
      const IY = 272
      const IW = 262
      const IH = 128
      ctx.strokeStyle = '#30363d'
      ctx.strokeRect(IX, IY, IW, IH)
      const lx = (n: number) => IX + 12 + ((Math.log(n) - Math.log(GRIDS[0])) / (Math.log(GRIDS[GRIDS.length - 1]) - Math.log(GRIDS[0]))) * (IW - 30)
      const emin = Math.log(1e-4)
      const emax = Math.log(0.4)
      const ly = (e: number) => IY + 14 + (1 - (Math.log(Math.max(e, 1e-16)) - emin) / (emax - emin)) * (IH - 34)
      const series: [string, number[], string][] = [
        ['L1', sweep.l1, '#d29922'],
        ['Linf', sweep.li, '#f85149'],
      ]
      series.forEach(([lab, arr, col]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = norm === (lab === 'L1' ? 'l1' : 'linf') ? 2.2 : 1
        ctx.beginPath()
        GRIDS.forEach((n, i) => (i === 0 ? ctx.moveTo(lx(n), ly(arr[i])) : ctx.lineTo(lx(n), ly(arr[i]))))
        ctx.stroke()
        ctx.fillStyle = col
        GRIDS.forEach((n, i) => {
          ctx.beginPath()
          ctx.arc(lx(n), ly(arr[i]), n === GRIDS[gi] ? 4 : 2, 0, 2 * Math.PI)
          ctx.fill()
        })
      })
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('N (log)', IX + IW - 50, IY + IH - 4)
      ctx.fillText('error (log)', IX + 6, IY + 11)
      ctx.fillStyle = '#d29922'
      ctx.font = 'bold 11px ui-monospace, monospace'
      ctx.fillText(`L1 slope ${sweep.sl1.toFixed(2)}`, IX + 150, IY + 26)
      ctx.fillStyle = '#f85149'
      ctx.fillText(`Linf slope ${sweep.sli.toFixed(2)}`, IX + 150, IY + 42)

      // numeric panel
      ctx.fillStyle = '#e6edf3'
      ctx.font = 'bold 13px ui-monospace, monospace'
      ctx.fillText(`N = ${N}      h = ${h.toExponential(2)}`, 52, 292)
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#d29922'
      ctx.fillText(`L1   = ${l1.toExponential(3)}`, 52, 318)
      ctx.fillStyle = '#f85149'
      ctx.fillText(`Linf = ${linf.toExponential(3)}`, 52, 338)
      ctx.fillStyle = '#8b949e'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`smear width = ${passes} cells = ${(passes * h).toExponential(2)}`, 52, 366)
      ctx.fillText('halving h halves the smeared WIDTH,', 52, 384)
      ctx.fillText('never the JUMP across it', 52, 398)

      if (frame.current % 12 === 0) setReadout({ h, l1, linf, argmax: (argmax + 0.5) * h })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [gi, passes, norm, running, star, sweep])

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
          N = <b>{GRIDS[gi]}</b>{' '}
          <input type="range" min={0} max={GRIDS.length - 1} step={1} value={gi} onChange={(e) => setGi(Number(e.target.value))} />
        </label>
        <label>
          smear = <b>{passes}</b> cells{' '}
          <input type="range" min={1} max={6} step={1} value={passes} onChange={(e) => setPasses(Number(e.target.value))} />
        </label>
        <label>
          t = <b>{time.toFixed(3)}</b>{' '}
          <input
            type="range"
            min={0.03}
            max={0.25}
            step={0.005}
            value={time}
            onChange={(e) => {
              setRunning(false)
              setTime(Number(e.target.value))
            }}
          />
        </label>
        <button onClick={() => setNorm((n) => (n === 'l1' ? 'linf' : 'l1'))} style={btn}>
          {norm === 'l1' ? 'show Linf' : 'show L1'}
        </button>
        <button onClick={() => setRunning((r) => !r)} style={btn}>
          {running ? 'pause time' : 'run time'}
        </button>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: 13, color: '#8b949e' }}>
        at N = {GRIDS[gi]}: L1 <b style={{ color: '#d29922' }}>{readout.l1.toExponential(2)}</b>
        {'  ·  '}Linf <b style={{ color: '#f85149' }}>{readout.linf.toExponential(2)}</b>
        {'  ·  '}max error sits at x = <b>{readout.argmax.toFixed(3)}</b>
      </div>
    </div>
  )
}
