'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Marker spacing ds/h has two failure modes pulling in opposite directions.
//
//   ds/h too large  -> the kernel supports stop overlapping along the curve.
//                      No-slip is met AT the markers, and the stream squirts
//                      through the gaps BETWEEN them.
//   ds/h too small  -> adjacent markers see almost the same grid nodes, so the
//                      rows of A = I S become parallel and A goes singular.
//                      The explicit MDF sweep still runs; the implicit solve dies.
//
// This panel runs the real thing: uniform stream u = 1, a ring of markers with
// zero target velocity, n multi-direct-forcing passes, then it measures the
// residual slip on the markers and halfway between them, and the cosine between
// neighboring rows of the influence operator.
// ---------------------------------------------------------------------------

const W = 690
const H = 452

const NG = 52 // Eulerian cells per side
const HG = 1 / NG
const RAD = 0.19
const CX = 0.42
const CY = 0.5

const FX = 26 // field viewport
const FY = 34
const FS = 382

function phi(r: number) {
  const a = Math.abs(r)
  if (a <= 1) return (3 - 2 * a + Math.sqrt(1 + 4 * a - 4 * a * a)) / 8
  if (a <= 2) return (5 - 2 * a - Math.sqrt(-7 + 12 * a - 4 * a * a)) / 8
  return 0
}

type Stencil = { idx: Int32Array; w: Float64Array; n: number }

// 4x4 support: flat node index and weight for every marker
function buildStencil(xs: Float64Array, ys: Float64Array): Stencil {
  const n = xs.length
  const idx = new Int32Array(n * 16)
  const w = new Float64Array(n * 16)
  for (let l = 0; l < n; l++) {
    const i0 = Math.floor(xs[l] / HG - 1.5)
    const j0 = Math.floor(ys[l] / HG - 1.5)
    for (let a = 0; a < 4; a++) {
      const wx = phi(xs[l] / HG - (i0 + a))
      const ii = (((i0 + a) % NG) + NG) % NG
      for (let b = 0; b < 4; b++) {
        const wy = phi(ys[l] / HG - (j0 + b))
        const jj = (((j0 + b) % NG) + NG) % NG
        idx[l * 16 + a * 4 + b] = ii * NG + jj
        w[l * 16 + a * 4 + b] = wx * wy
      }
    }
  }
  return { idx, w, n }
}

function ring(count: number, offset: number) {
  const xs = new Float64Array(count)
  const ys = new Float64Array(count)
  for (let l = 0; l < count; l++) {
    const t = ((l + offset) / count) * Math.PI * 2
    xs[l] = CX + RAD * Math.cos(t)
    ys[l] = CY + RAD * Math.sin(t)
  }
  return { xs, ys }
}

function interp(u: Float64Array, st: Stencil) {
  const out = new Float64Array(st.n)
  for (let l = 0; l < st.n; l++) {
    let acc = 0
    for (let k = 0; k < 16; k++) acc += u[st.idx[l * 16 + k]] * st.w[l * 16 + k]
    out[l] = acc
  }
  return out
}

// how parallel are neighboring rows of the influence operator?
function adjacentCosine(st: Stencil) {
  let worst = 0
  const map = new Map<number, number>()
  for (let l = 0; l < st.n; l++) {
    const m = (l + 1) % st.n
    map.clear()
    let na = 0
    let nb = 0
    let dot = 0
    for (let k = 0; k < 16; k++) {
      const wa = st.w[l * 16 + k]
      map.set(st.idx[l * 16 + k], (map.get(st.idx[l * 16 + k]) ?? 0) + wa)
      na += wa * wa
    }
    for (let k = 0; k < 16; k++) {
      const wb = st.w[m * 16 + k]
      nb += wb * wb
      dot += wb * (map.get(st.idx[m * 16 + k]) ?? 0)
    }
    worst = Math.max(worst, dot / Math.sqrt(na * nb))
  }
  return worst
}

type Solution = {
  u: Float64Array
  count: number
  ds: number
  mx: Float64Array
  my: Float64Array
  slipOn: number
  slipGap: number
  cosine: number
}

function solve(ratio: number, passes: number): Solution {
  const ds = ratio * HG
  const count = Math.max(8, Math.round((2 * Math.PI * RAD) / ds))
  const dsExact = (2 * Math.PI * RAD) / count
  const { xs, ys } = ring(count, 0)
  const st = buildStencil(xs, ys)
  const gapRing = ring(count, 0.5)
  const gapSt = buildStencil(gapRing.xs, gapRing.ys)

  const u = new Float64Array(NG * NG).fill(1)
  const scale = dsExact / HG
  for (let p = 0; p < passes; p++) {
    const slip = interp(u, st) // target velocity is zero on a fixed body
    for (let l = 0; l < count; l++) {
      const d = -slip[l] * scale
      for (let k = 0; k < 16; k++) u[st.idx[l * 16 + k]] += d * st.w[l * 16 + k]
    }
  }

  const on = interp(u, st)
  const gap = interp(u, gapSt)
  let slipOn = 0
  let slipGap = 0
  for (let l = 0; l < count; l++) {
    slipOn = Math.max(slipOn, Math.abs(on[l]))
    slipGap = Math.max(slipGap, Math.abs(gap[l]))
  }
  return { u, count, ds: dsExact, mx: xs, my: ys, slipOn, slipGap, cosine: adjacentCosine(st) }
}

const NPART = 340

export function MarkerSpacingLeakLab() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [ratio, setRatio] = useState(1.0)
  const [passes, setPasses] = useState(6)

  const sol = useMemo(() => solve(ratio, passes), [ratio, passes])

  const solRef = useRef(sol)
  solRef.current = sol

  const field = useRef<HTMLCanvasElement | null>(null)
  if (!field.current && typeof document !== 'undefined') {
    const c = document.createElement('canvas')
    c.width = NG
    c.height = NG
    field.current = c
  }

  // repaint the offscreen field whenever the solution changes
  useEffect(() => {
    const fc = field.current
    if (!fc) return
    const fx = fc.getContext('2d')
    if (!fx) return
    const img = fx.createImageData(NG, NG)
    for (let i = 0; i < NG; i++) {
      for (let j = 0; j < NG; j++) {
        const braked = Math.pow(Math.max(0, Math.min(1, 1 - sol.u[i * NG + j])), 0.75)
        const p = ((NG - 1 - j) * NG + i) * 4
        img.data[p] = 8 + 243 * braked
        img.data[p + 1] = 17 + 174 * braked
        img.data[p + 2] = 31 + 5 * braked
        img.data[p + 3] = 255
      }
    }
    fx.putImageData(img, 0, 0)
  }, [sol])

  const parts = useRef<{ x: Float64Array; y: Float64Array; age: Float64Array } | null>(null)
  if (!parts.current) {
    const x = new Float64Array(NPART)
    const y = new Float64Array(NPART)
    const age = new Float64Array(NPART)
    for (let k = 0; k < NPART; k++) {
      x[k] = (k * 0.6180339887) % 1
      y[k] = ((k * 0.7548776662) % 1) * 0.86 + 0.07
      age[k] = (k / NPART) * 3
    }
    parts.current = { x, y, age }
  }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let last = -1

    const text = (str: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(str, x, y)
    }

    const sample = (u: Float64Array, x: number, y: number) => {
      const i = Math.min(NG - 1, Math.max(0, Math.floor(x / HG)))
      const j = Math.min(NG - 1, Math.max(0, Math.floor(y / HG)))
      return u[i * NG + j]
    }

    const draw = (ts: number) => {
      const dt = last < 0 ? 0 : Math.min((ts - last) / 1000, 0.04)
      last = ts
      const st = solRef.current
      const P = parts.current!

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      // ---------- velocity field ----------
      if (field.current) {
        ctx.imageSmoothingEnabled = true
        ctx.globalAlpha = 0.9
        ctx.drawImage(field.current, FX, FY, FS, FS)
        ctx.globalAlpha = 1
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(FX, FY, FS, FS)

      const sx = (x: number) => FX + x * FS
      const sy = (y: number) => FY + (1 - y) * FS

      // ---------- tracers ----------
      for (let k = 0; k < NPART; k++) {
        P.age[k] += dt
        const uu = sample(st.u, P.x[k], P.y[k])
        P.x[k] += uu * dt * 0.34
        if (P.x[k] > 1 || P.age[k] > 5.5) {
          P.x[k] = 0.002
          P.y[k] = ((k * 0.7548776662 + P.age[k] * 0.37) % 1) * 0.86 + 0.07
          P.age[k] = 0
        }
        const speed = Math.max(0, Math.min(1, uu))
        const inside = (P.x[k] - CX) ** 2 + (P.y[k] - CY) ** 2 < RAD * RAD
        ctx.fillStyle = inside ? '#f87171' : `rgba(226,232,240,${0.3 + 0.6 * speed})`
        ctx.beginPath()
        ctx.arc(sx(P.x[k]), sy(P.y[k]), inside ? 2.2 : 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // ---------- body outline + markers ----------
      ctx.strokeStyle = 'rgba(248,250,252,0.35)'
      ctx.setLineDash([3, 4])
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(sx(CX), sy(CY), (RAD * FS), 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      for (let l = 0; l < st.count; l++) {
        ctx.fillStyle = '#38bdf8'
        ctx.beginPath()
        ctx.arc(sx(st.mx[l]), sy(st.my[l]), 1.9, 0, Math.PI * 2)
        ctx.fill()
      }

      text('u = 1', FX + 6, FY + FS - 8, '#94a3b8', '10px ui-monospace, monospace')
      text('0', FX + 76, FY + FS - 8, '#fbbf24', '10px ui-monospace, monospace')
      const gr = ctx.createLinearGradient(FX + 42, 0, FX + 70, 0)
      gr.addColorStop(0, '#08111f')
      gr.addColorStop(1, '#fbbf24')
      ctx.fillStyle = gr
      ctx.fillRect(FX + 42, FY + FS - 16, 28, 7)
      text('uniform stream →', FX + 6, FY - 10, '#64748b', '10px ui-monospace, monospace')
      text('blue dots = Lagrangian markers   amber = braked fluid   red = tracer inside the body', FX, FY + FS + 18, '#64748b', '10px ui-monospace, monospace')

      // ---------- right panel ----------
      const RX = FX + FS + 26
      text('ds / h', RX, FY + 12, '#94a3b8')
      text(ratio.toFixed(2), RX + 110, FY + 12, '#fbbf24', 'bold 12px ui-monospace, monospace')
      text('markers', RX, FY + 30, '#94a3b8')
      text(`${st.count}`, RX + 110, FY + 30, '#e2e8f0', 'bold 12px ui-monospace, monospace')
      text('MDF passes', RX, FY + 48, '#94a3b8')
      text(`${passes}`, RX + 110, FY + 48, '#e2e8f0', 'bold 12px ui-monospace, monospace')

      const bar = (label: string, v: number, y: number, col: string, note: string) => {
        text(label, RX, y, '#cbd5e1')
        const bw = 132
        ctx.fillStyle = 'rgba(148,163,184,0.16)'
        ctx.fillRect(RX, y + 10, bw, 10)
        ctx.fillStyle = col
        ctx.fillRect(RX, y + 10, bw * Math.min(1, v / 0.4), 10)
        text(v.toFixed(4), RX + bw + 8, y + 19, col, 'bold 11px ui-monospace, monospace')
        text(note, RX, y + 34, '#64748b', '10px ui-monospace, monospace')
      }

      bar('max slip ON markers', st.slipOn, FY + 92, '#34d399', 'no-slip where it is imposed')
      bar(
        'max slip BETWEEN markers',
        st.slipGap,
        FY + 148,
        st.slipGap > 0.2 ? '#f87171' : st.slipGap > 0.14 ? '#fbbf24' : '#34d399',
        'the stream leaks here first'
      )

      // conditioning gauge
      text('adjacent row cos of A = I·S', RX, FY + 212, '#cbd5e1')
      const bw = 132
      ctx.fillStyle = 'rgba(148,163,184,0.16)'
      ctx.fillRect(RX, FY + 222, bw, 10)
      const c = st.cosine
      ctx.fillStyle = c > 0.9 ? '#f87171' : c > 0.8 ? '#fbbf24' : '#34d399'
      ctx.fillRect(RX, FY + 222, bw * Math.min(1, Math.max(0, (c - 0.4) / 0.6)), 10)
      text(c.toFixed(4), RX + bw + 8, FY + 231, c > 0.9 ? '#f87171' : '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text('cos -> 1 : rows parallel, A singular', RX, FY + 246, '#64748b', '10px ui-monospace, monospace')

      const verdict =
        st.cosine > 0.9
          ? ['markers too dense', 'A is singular: the implicit solve dies']
          : st.slipGap > 0.12
            ? ['markers too sparse', 'the stream squirts through the gaps']
            : ['balanced', 'ds ~ h: both failure modes stay quiet']
      const vcol = verdict[0] === 'balanced' ? '#34d399' : '#f87171'
      ctx.strokeStyle = vcol
      ctx.lineWidth = 1
      ctx.strokeRect(RX, FY + 282, 232, 52)
      text(verdict[0], RX + 10, FY + 304, vcol, 'bold 12px ui-monospace, monospace')
      text(verdict[1], RX + 10, FY + 322, '#94a3b8', '10px ui-monospace, monospace')
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ratio, passes])

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.1rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
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
      <div style={row}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          marker spacing ds/h
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={ratio}
            onChange={(e) => setRatio(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 40 }}>
            {ratio.toFixed(2)}
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          MDF passes
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={passes}
            onChange={(e) => setPasses(parseInt(e.target.value, 10))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 24 }}>{passes}</span>
        </label>
      </div>
    </div>
  )
}
