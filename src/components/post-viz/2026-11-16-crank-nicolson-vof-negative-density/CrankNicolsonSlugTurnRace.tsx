'use client'

import { useEffect, useRef, useState } from 'react'

// Reproduces the post's Python: a water slug (alpha=1 on 0.2<x<0.5) advected one
// full turn on a periodic 100-cell grid with three implicit schemes:
// EI-upwind (theta=1), theta-upwind (slider, 0.5 = CN-upwind), CN-central.
// Each step solves A a_new = B a_old; we precompute M = A^-1 B (dense, N=100).

const W = 680
const H = 400
const N = 100
const RHO_W = 998
const RHO_A = 1.2
const CO_LIST = [0.5, 1, 2, 2.5, 3, 4, 5, 10]

const SCHEMES = [
  { label: 'EI-upwind (θ=1)', color: 'rgba(150,150,150,1)' },
  { label: 'θ-upwind', color: 'rgba(251,160,36,1)' },
  { label: 'CN-central', color: 'rgba(56,132,255,1)' },
]

function initAlpha() {
  const a = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    a[i] = x > 0.2 && x < 0.5 ? 1 : 0
  }
  return a
}
const A0 = initAlpha()

// M = A^-1 B for the theta scheme, D = upwind (a_i - a_{i-1}) or central
function stepMatrix(co: number, th: number, upwind: boolean) {
  const A: number[][] = []
  const B: number[][] = []
  for (let i = 0; i < N; i++) {
    const D = new Array(N).fill(0)
    if (upwind) {
      D[i] += 1
      D[(i - 1 + N) % N] -= 1
    } else {
      D[(i + 1) % N] += 0.5
      D[(i - 1 + N) % N] -= 0.5
    }
    A.push(D.map((d, j) => (j === i ? 1 : 0) + th * co * d))
    B.push(D.map((d, j) => (j === i ? 1 : 0) - (1 - th) * co * d))
  }
  // Gauss-Jordan on [A | B]
  for (let c = 0; c < N; c++) {
    let piv = c
    for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r
    ;[A[c], A[piv]] = [A[piv], A[c]]
    ;[B[c], B[piv]] = [B[piv], B[c]]
    const inv = 1 / A[c][c]
    for (let j = 0; j < N; j++) {
      A[c][j] *= inv
      B[c][j] *= inv
    }
    for (let r = 0; r < N; r++) {
      if (r === c) continue
      const f = A[r][c]
      if (f === 0) continue
      for (let j = 0; j < N; j++) {
        A[r][j] -= f * A[c][j]
        B[r][j] -= f * B[c][j]
      }
    }
  }
  const M = new Float64Array(N * N)
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) M[i * N + j] = B[i][j]
  return M
}

function matvec(M: Float64Array, a: Float64Array) {
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    let s = 0
    for (let j = 0; j < N; j++) s += M[i * N + j] * a[j]
    out[i] = s
  }
  return out
}

type Sim = {
  mats: Float64Array[]
  fields: Float64Array[]
  amin: number[]
  amax: number[]
  hist: number[][]
  steps: number
  total: number
  co: number
  playing: boolean
  stepOnce: boolean
  speed: number
}

function makeSim(coIdx: number, theta: number, speed: number, playing: boolean): Sim {
  const co = CO_LIST[coIdx]
  return {
    mats: [stepMatrix(co, 1, true), stepMatrix(co, theta, true), stepMatrix(co, 0.5, false)],
    fields: [A0.slice(), A0.slice(), A0.slice()],
    amin: [0, 0, 0],
    amax: [1, 1, 1],
    hist: [[0], [0], [0]],
    steps: 0,
    total: Math.round(N / co),
    co,
    playing,
    stepOnce: false,
    speed,
  }
}

function exactAt(i: number, shift: number) {
  let x = ((i + 0.5) / N - shift) % 1
  if (x < 0) x += 1
  return x > 0.2 && x < 0.5 ? 1 : 0
}

function l1(a: Float64Array, shift: number) {
  let s = 0
  for (let i = 0; i < N; i++) s += Math.abs(a[i] - exactAt(i, shift))
  return s / N
}

export function CrankNicolsonSlugTurnRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [coIdx, setCoIdx] = useState(5)
  const [theta, setTheta] = useState(0.5)
  const [speed, setSpeed] = useState(6)
  const [playing, setPlaying] = useState(true)
  const sim = useRef<Sim | null>(null)
  const [info, setInfo] = useState({ steps: 0, total: 25, rows: SCHEMES.map(() => ({ amin: 0, amax: 1, rmin: RHO_A, l1: 0 })) })

  const rebuild = () => {
    sim.current = makeSim(coIdx, theta, speed, playing)
  }
  useEffect(rebuild, [coIdx, theta]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sim.current) sim.current.speed = speed
  }, [speed])
  useEffect(() => {
    if (sim.current) sim.current.playing = playing
  }, [playing])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    let raf = 0
    let frame = 0
    const loop = () => {
      const s = sim.current
      if (!s) {
        raf = requestAnimationFrame(loop)
        return
      }
      const interval = Math.max(1, Math.round(60 / s.speed))
      if (((s.playing && frame % interval === 0) || s.stepOnce) && s.steps < s.total) {
        s.stepOnce = false
        for (let k = 0; k < 3; k++) {
          const a = matvec(s.mats[k], s.fields[k])
          s.fields[k] = a
          for (let i = 0; i < N; i++) {
            if (a[i] < s.amin[k]) s.amin[k] = a[i]
            if (a[i] > s.amax[k]) s.amax[k] = a[i]
          }
          s.hist[k].push(s.amin[k])
        }
        s.steps++
        if (s.steps >= s.total) {
          s.playing = false
          setPlaying(false)
        }
      }
      frame++
      const shift = (s.steps * s.co) / N
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px system-ui, sans-serif'

      // field panel
      const fx = 50, fy = 18, fw = 610, fh = 200
      const lo = -0.9, hi = 1.9
      const Y = (v: number) => fy + fh - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * fh
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(fx, fy, fw, fh)
      ctx.fillStyle = 'rgba(230,60,60,0.08)'
      const yNeg = Y(-0.0012)
      ctx.fillRect(fx, yNeg, fw, fy + fh - yNeg)
      ctx.setLineDash([3, 3])
      ;[0, 1].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(fx, Y(v))
        ctx.lineTo(fx + fw, Y(v))
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(128,128,128,0.3)'
      ctx.lineWidth = 6
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const px = fx + ((i + 0.5) / N) * fw
        i === 0 ? ctx.moveTo(px, Y(exactAt(i, shift))) : ctx.lineTo(px, Y(exactAt(i, shift)))
      }
      ctx.stroke()
      ctx.lineWidth = 1.7
      SCHEMES.forEach((sc, k) => {
        const a = s.fields[k]
        ctx.strokeStyle = sc.color
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const px = fx + ((i + 0.5) / N) * fw
          i === 0 ? ctx.moveTo(px, Y(a[i])) : ctx.lineTo(px, Y(a[i]))
        }
        ctx.stroke()
      })
      ctx.lineWidth = 1
      ctx.fillStyle = 'rgba(128,128,128,0.95)'
      ctx.fillText('1', fx - 12, Y(1) + 4)
      ctx.fillText('0', fx - 12, Y(0) + 4)
      ctx.fillText('alpha(x)   red band: alpha < −0.0012 ⇒ rho < 0', fx + 4, fy + fh - 6)
      SCHEMES.forEach((sc, k) => {
        const label = k === 1 ? `θ-upwind (θ=${theta.toFixed(2)})` : sc.label
        ctx.fillStyle = sc.color
        ctx.fillRect(fx + 8 + k * 190, fy + 8, 14, 3)
        ctx.fillStyle = 'rgba(128,128,128,0.95)'
        ctx.fillText(label, fx + 26 + k * 190, fy + 12)
      })

      // min-alpha history panel
      const hx = 50, hy = 258, hw = 610, hh = 110
      const hlo = -0.9
      const HY = (v: number) => hy + hh - ((Math.max(hlo, v) - hlo) / (0.1 - hlo)) * hh
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(hx, hy, hw, hh)
      ctx.beginPath()
      ctx.moveTo(hx, HY(0))
      ctx.lineTo(hx + hw, HY(0))
      ctx.stroke()
      ctx.lineWidth = 1.7
      SCHEMES.forEach((sc, k) => {
        ctx.strokeStyle = sc.color
        ctx.beginPath()
        s.hist[k].forEach((v, j) => {
          const px = hx + (j / s.total) * hw
          j === 0 ? ctx.moveTo(px, HY(v)) : ctx.lineTo(px, HY(v))
        })
        ctx.stroke()
      })
      ctx.lineWidth = 1
      ctx.fillStyle = 'rgba(128,128,128,0.95)'
      ctx.fillText('running min(alpha) over time', hx + 4, hy + 12)
      ctx.fillText('0', hx - 12, HY(0) + 4)
      ctx.fillText('−0.9', hx - 28, HY(-0.9) + 4)
      ctx.fillText(`step ${s.steps} / ${s.total}  (one full turn)`, hx + hw - 170, hy + hh + 14)

      if (frame % 12 === 0) {
        setInfo({
          steps: s.steps,
          total: s.total,
          rows: SCHEMES.map((_, k) => ({
            amin: s.amin[k],
            amax: s.amax[k],
            rmin: RHO_A + s.amin[k] * (RHO_W - RHO_A),
            l1: l1(s.fields[k], shift),
          })),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [theta])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="w-20">Co: {CO_LIST[coIdx]}</span>
          <input type="range" min={0} max={CO_LIST.length - 1} step={1} value={coIdx} onChange={(e) => setCoIdx(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-20">θ: {theta.toFixed(2)}</span>
          <input type="range" min={0.5} max={1} step={0.05} value={theta} onChange={(e) => setTheta(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-24">steps/s: {speed}</span>
          <input type="range" min={1} max={60} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => sim.current && (sim.current.stepOnce = true)}>
          Step
        </button>
        <button
          className="rounded border px-3 py-1"
          onClick={() => {
            rebuild()
            setPlaying(true)
            if (sim.current) sim.current.playing = true
          }}
        >
          Reset
        </button>
        <span className="ml-2 font-mono text-xs">
          step {info.steps}/{info.total} · θ needed for Co={CO_LIST[coIdx]}: θ ≥ {Math.max(0, 1 - 1 / CO_LIST[coIdx]).toFixed(2)}
        </span>
      </div>
      <table className="mt-3 w-full font-mono text-xs">
        <thead>
          <tr className="text-left">
            <th>scheme</th>
            <th>min alpha</th>
            <th>max alpha</th>
            <th>min rho [kg/m³]</th>
            <th>L1</th>
          </tr>
        </thead>
        <tbody>
          {info.rows.map((r, k) => (
            <tr key={k} style={{ color: SCHEMES[k].color }}>
              <td>{k === 1 ? `θ-upwind θ=${theta.toFixed(2)}` : SCHEMES[k].label}</td>
              <td>{r.amin.toFixed(4)}</td>
              <td>{r.amax.toFixed(4)}</td>
              <td style={{ color: r.rmin < 0 ? 'rgb(230,60,60)' : undefined }}>{r.rmin.toFixed(1)}</td>
              <td>{r.l1.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
