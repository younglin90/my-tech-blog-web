'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Daniel Bernoulli (1753): the same solution, written as a superposition of
// standing sine modes,
//
//     u(x,t) = sum_n  b_n sin(n pi x / L) cos(n pi c t / L),
//     b_n    = (2/L) integral_0^L f(x) sin(n pi x / L) dx.
//
// Analytically identical to d'Alembert's travelling halves.  Numerically it is
// a different animal: truncating at N terms is a low-pass filter, and how the
// truncation error behaves is set entirely by the smoothness of f.  A jump
// leaves a ~9% overshoot that never shrinks; a kink converges as N^-1; a smooth
// profile converges faster than any power of N.  Dashed grey = d'Alembert.
// ---------------------------------------------------------------------------

const W = 726
const H = 452

const PX0 = 56
const PX1 = 452
const PY0 = 34
const PY1 = 300

const IX0 = 512
const IX1 = 702
const IY0 = 34
const IY1 = 300

const NX = 801
const NMAX = 200
const L = 1
const C = 1
const T_PROBE = 0.15 // time at which the convergence inset is measured

type Shape = 'jump' | 'kink' | 'smooth'

const SHAPES: { key: Shape; label: string; rate: string }[] = [
  { key: 'jump', label: 'jump', rate: 'no convergence in max-norm' },
  { key: 'kink', label: 'kink', rate: 'error ~ N^-1' },
  { key: 'smooth', label: 'smooth', rate: 'faster than any power of N' },
]

function initialProfile(shape: Shape): Float64Array {
  const f = new Float64Array(NX)
  for (let i = 0; i < NX; i++) {
    const x = (i / (NX - 1)) * L
    if (shape === 'jump') f[i] = x >= 0.35 && x <= 0.55 ? 1 : 0
    else if (shape === 'kink') f[i] = x < 0.45 ? x / 0.45 : (L - x) / (L - 0.45)
    else f[i] = Math.exp(-((x - 0.45) ** 2) / (2 * 0.055 ** 2))
  }
  return f
}

// b_n by trapezoid over the stored profile
function sineCoeffs(f: Float64Array): Float64Array {
  const b = new Float64Array(NMAX + 1)
  const h = L / (NX - 1)
  for (let n = 1; n <= NMAX; n++) {
    const k = (n * Math.PI) / L
    let s = 0
    for (let i = 0; i < NX; i++) {
      const w = i === 0 || i === NX - 1 ? 0.5 : 1
      s += w * f[i] * Math.sin(k * i * h)
    }
    b[n] = (2 / L) * s * h
  }
  return b
}

function oddExtend(f: Float64Array, s: number): number {
  let xs = s % (2 * L)
  if (xs < 0) xs += 2 * L
  let sign = 1
  if (xs > L) {
    sign = -1
    xs = 2 * L - xs
  }
  const g = (xs / L) * (NX - 1)
  const i = Math.min(NX - 2, Math.floor(g))
  const w = g - i
  return sign * (f[i] * (1 - w) + f[i + 1] * w)
}

const exactAt = (f: Float64Array, x: number, t: number) => 0.5 * (oddExtend(f, x - C * t) + oddExtend(f, x + C * t))

function modalAt(b: Float64Array, x: number, t: number, N: number): number {
  let s = 0
  for (let n = 1; n <= N; n++) {
    const k = (n * Math.PI) / L
    s += b[n] * Math.sin(k * x) * Math.cos(k * C * t)
  }
  return s
}

// max-norm error at t = T_PROBE, sampled on a coarse grid, for a ladder of N
function convergenceLadder(f: Float64Array, b: Float64Array) {
  const ns = [2, 4, 8, 16, 32, 64, 128, 200]
  const M = 240
  return ns.map((N) => {
    let e = 0
    for (let i = 0; i <= M; i++) {
      const x = (i / M) * L
      e = Math.max(e, Math.abs(modalAt(b, x, T_PROBE, N) - exactAt(f, x, T_PROBE)))
    }
    return { N, e: Math.max(e, 1e-6) }
  })
}

export function ModeCountGibbsScope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shape, setShape] = useState<Shape>('jump')
  const [nModes, setNModes] = useState(24)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(0.25)
  const [stat, setStat] = useState({ over: 0, err: 0 })

  const profile = useMemo(() => initialProfile(shape), [shape])
  const coeffs = useMemo(() => sineCoeffs(profile), [profile])
  const ladder = useMemo(() => convergenceLadder(profile, coeffs), [profile, coeffs])

  const live = useRef({ profile, coeffs, ladder, nModes, running, speed })
  live.current = { profile, coeffs, ladder, nModes, running, speed }
  const setStatRef = useRef(setStat)
  setStatRef.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let t = 0
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const px = (x: number) => PX0 + (x / L) * (PX1 - PX0)
    const py = (v: number) => (PY0 + PY1) / 2 - (v / 1.35) * ((PY1 - PY0) / 2 - 14)

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const S = live.current
      if (S.running) t = (t + dt * S.speed) % ((2 * L) / C)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ===================================================================
      // LEFT: the two representations at the same instant
      // ===================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0)
      ctx.strokeStyle = 'rgba(226,232,240,0.22)'
      ctx.beginPath()
      ctx.moveTo(PX0, py(0))
      ctx.lineTo(PX1, py(0))
      ctx.stroke()
      text('u (x, t)', PX0 + 6, PY0 + 15, '#64748b', '10px ui-monospace, monospace')
      text('x  (0 → L)', PX1 - 72, PY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text('+1', PX0 - 24, py(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('0', PX0 - 18, py(0) + 4, '#64748b', '10px ui-monospace, monospace')
      text('-1', PX0 - 24, py(-1) + 4, '#64748b', '10px ui-monospace, monospace')

      const M = 400
      const ex = new Float64Array(M + 1)
      const md = new Float64Array(M + 1)
      let exMax = -1e9
      let exMin = 1e9
      let mdMax = -1e9
      let err = 0
      for (let i = 0; i <= M; i++) {
        const x = (i / M) * L
        ex[i] = exactAt(S.profile, x, t)
        md[i] = modalAt(S.coeffs, x, t, S.nModes)
        exMax = Math.max(exMax, ex[i])
        exMin = Math.min(exMin, ex[i])
        mdMax = Math.max(mdMax, md[i])
        err = Math.max(err, Math.abs(md[i] - ex[i]))
      }
      const amp = Math.max(1e-9, exMax - exMin)
      const over = (100 * (mdMax - exMax)) / amp

      // overshoot band: exact ceiling vs truncated ceiling
      if (over > 0.4) {
        ctx.fillStyle = 'rgba(248,113,113,0.16)'
        ctx.fillRect(PX0 + 1, py(mdMax), PX1 - PX0 - 2, Math.max(1, py(exMax) - py(mdMax)))
      }
      ctx.strokeStyle = 'rgba(226,232,240,0.4)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(PX0, py(exMax))
      ctx.lineTo(PX1, py(exMax))
      ctx.stroke()
      ctx.setLineDash([])

      const plot = (arr: Float64Array, col: string, width: number, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = width
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i <= M; i++) {
          const p = px((i / M) * L)
          const q = py(arr[i])
          if (i === 0) ctx.moveTo(p, q)
          else ctx.lineTo(p, q)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
      }
      plot(ex, 'rgba(226,232,240,0.55)', 1.6, [6, 4])
      plot(md, over > 0.4 ? '#f87171' : '#34d399', 2.2, [])

      text("d'Alembert (exact)", PX0 + 6, PY1 - 22, '#94a3b8', '10px ui-monospace, monospace')
      text(`Bernoulli, N = ${S.nModes}`, PX0 + 6, PY1 - 8, over > 0.4 ? '#f87171' : '#34d399', 'bold 10px ui-monospace, monospace')

      // ===================================================================
      // RIGHT: max-norm error vs number of modes, measured at t = 0.15
      // ===================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(IX0, IY0, IX1 - IX0, IY1 - IY0)
      text('max error  vs  N', IX0 + 6, IY0 - 8, '#cbd5e1', 'bold 11px ui-monospace, monospace')
      text('measured at t·c/L = 0.15', IX0 + 6, IY0 + 15, '#64748b', '10px ui-monospace, monospace')

      const lx = (N: number) => IX0 + 22 + (Math.log2(N) / Math.log2(256)) * (IX1 - IX0 - 34)
      const ly = (e: number) => IY1 - 26 - ((Math.log10(e) + 6) / 6) * (IY1 - IY0 - 52)

      for (const p of [1e-1, 1e-3, 1e-5]) {
        ctx.strokeStyle = 'rgba(148,163,184,0.18)'
        ctx.beginPath()
        ctx.moveTo(IX0 + 8, ly(p))
        ctx.lineTo(IX1 - 6, ly(p))
        ctx.stroke()
        text('1e' + Math.round(Math.log10(p)), IX0 + 10, ly(p) - 3, '#64748b', '9px ui-monospace, monospace')
      }
      text('N=2', IX0 + 12, IY1 - 8, '#64748b', '9px ui-monospace, monospace')
      text('200', IX1 - 26, IY1 - 8, '#64748b', '9px ui-monospace, monospace')

      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      S.ladder.forEach((d, i) => {
        const p = lx(d.N)
        const q = ly(d.e)
        if (i === 0) ctx.moveTo(p, q)
        else ctx.lineTo(p, q)
      })
      ctx.stroke()
      ctx.lineWidth = 1
      for (const d of S.ladder) {
        ctx.fillStyle = '#38bdf8'
        ctx.beginPath()
        ctx.arc(lx(d.N), ly(d.e), 3, 0, 2 * Math.PI)
        ctx.fill()
      }

      // marker for the N currently on the slider
      ctx.strokeStyle = 'rgba(251,191,36,0.8)'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(lx(Math.max(2, S.nModes)), IY0 + 6)
      ctx.lineTo(lx(Math.max(2, S.nModes)), IY1 - 20)
      ctx.stroke()
      ctx.setLineDash([])
      text('N', lx(Math.max(2, S.nModes)) - 3, IY0 + 4, '#fbbf24', '10px ui-monospace, monospace')

      // ===================================================================
      // readout strip
      // ===================================================================
      const put = (lbl: string, v: string, col: string, x: number, y: number) => {
        text(lbl, x, y, '#94a3b8')
        text(v, x + 104, y, col, 'bold 11px ui-monospace, monospace')
      }
      let ry = PY1 + 48
      put('overshoot', over.toFixed(2) + ' %', over > 0.4 ? '#f87171' : '#34d399', PX0, ry)
      put('max error', err.toFixed(4), over > 0.4 ? '#f87171' : '#34d399', PX0 + 232, ry)
      ctx.fillStyle = over > 0.4 ? 'rgba(248,113,113,0.18)' : 'rgba(52,211,153,0.18)'
      ctx.fillRect(PX0 + 460, ry - 15, 206, 24)
      text(
        over > 0.4 ? 'GIBBS RINGING' : 'CLEAN CONVERGENCE',
        PX0 + 470,
        ry + 2,
        over > 0.4 ? '#f87171' : '#34d399',
        'bold 11px ui-monospace, monospace',
      )
      ry += 24
      put('t · c / L', t.toFixed(3), '#e2e8f0', PX0, ry)
      put('profile', shape, '#e2e8f0', PX0 + 232, ry)
      text('9% of the jump is the Wilbraham–Gibbs limit', PX0 + 470, ry + 2, '#64748b', '10px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) setStatRef.current({ over, err })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [shape])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 54 }
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
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        {SHAPES.map((s) => (
          <button key={s.key} style={btn(shape === s.key)} onClick={() => setShape(s.key)} title={s.rate}>
            {s.label}
          </button>
        ))}
        <label style={label}>
          <span style={nameS}>modes N</span>
          <input type="range" min={1} max={NMAX} step={1} value={nModes} onChange={(e) => setNModes(parseInt(e.target.value, 10))} />
          <span style={mono}>{nModes}</span>
        </label>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={0.02} max={0.8} step={0.01} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Drag <em>modes N</em> to the right on <em>jump</em>: the red ringing narrows but its height parks near 9%
        (now {stat.over.toFixed(2)}%), and the right-hand curve flattens out. Switch to <em>kink</em> and then{' '}
        <em>smooth</em> with N untouched — the same slider that bought nothing now buys everything, and the error curve
        turns into a cliff (max error {stat.err.toFixed(4)}).
      </div>
    </div>
  )
}
