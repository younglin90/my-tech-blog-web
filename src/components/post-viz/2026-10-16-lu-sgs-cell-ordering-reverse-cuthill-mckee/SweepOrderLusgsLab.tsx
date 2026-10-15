'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 760
const H = 380
const N = 20
const M = N * N
const DTAU = 1e3
const TOL = 1e-8
const CAP = 1500

type Mode = 'natural' | 'random' | 'rcm'
type Corner = 'SW' | 'SE' | 'NW' | 'NE'
type Grid = { nbr: number[][]; cf: number[][]; ap: number }
type Run = { x: number[]; r: number[]; dx: number[]; rank: number[]; order: number[]; phase: 0 | 1; p: number; it: number; hist: number[]; done: boolean }

function makeGrid(angle: number, diff: number): Grid {
  const ux = Math.cos(angle), uy = Math.sin(angle)
  const nbr: number[][] = [], cf: number[][] = []
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const l: number[] = [], c: number[] = []
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj
      if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue
      l.push(jj * N + ii)
      c.push(diff + Math.max(-(ux * di + uy * dj), 0))
    }
    nbr.push(l); cf.push(c)
  }
  return { nbr, cf, ap: 4 * diff + Math.abs(ux) + Math.abs(uy) }
}

// fixed pseudo-random labels, mimicking a mesh generator's arbitrary numbering
const LABEL = (() => {
  const a = Array.from({ length: M }, (_, k) => k)
  let s = 12345
  for (let k = M - 1; k > 0; k--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const q = s % (k + 1);[a[k], a[q]] = [a[q], a[k]]
  }
  return a
})()

function rcmOrder(nbr: number[][], start: number) {
  const seen = new Array(M).fill(false)
  const out: number[] = [start]
  seen[start] = true
  for (let h = 0; h < out.length; h++) {
    const nb = [...nbr[out[h]]].sort((a, b) => nbr[a].length - nbr[b].length || LABEL[a] - LABEL[b])
    for (const k of nb) if (!seen[k]) { seen[k] = true; out.push(k) }
  }
  return out.reverse()
}

const CORNER: Record<Corner, number> = { SW: 0, SE: N - 1, NW: N * N - N, NE: N * N - 1 }

function orderFor(g: Grid, mode: Mode, corner: Corner) {
  if (mode === 'natural') return Array.from({ length: M }, (_, k) => k)
  if (mode === 'random') return Array.from({ length: M }, (_, k) => k).sort((a, b) => LABEL[a] - LABEL[b])
  return rcmOrder(g.nbr, CORNER[corner])
}

function residual(g: Grid, x: number[], r: number[]) {
  let s = 0
  for (let c = 0; c < M; c++) {
    let v = 1 - g.ap * x[c]
    const nb = g.nbr[c], a = g.cf[c]
    for (let q = 0; q < nb.length; q++) v += a[q] * x[nb[q]]
    r[c] = v; s += v * v
  }
  return Math.sqrt(s / M)
}

function newRun(g: Grid, order: number[]): Run {
  const rank = new Array(M)
  order.forEach((c, p) => { rank[c] = p })
  const x = new Array(M).fill(0), r = new Array(M).fill(0)
  const r0 = residual(g, x, r)
  return { x, r, dx: new Array(M).fill(0), rank, order, phase: 0, p: 0, it: 0, hist: [r0], done: false }
}

// advance one cell of the forward (L) or backward (U) sweep
function advance(g: Grid, s: Run) {
  const d = g.ap + 1 / DTAU
  if (s.phase === 0) {
    const c = s.order[s.p]
    let v = s.r[c]
    g.nbr[c].forEach((k, q) => { if (s.rank[k] < s.rank[c]) v += g.cf[c][q] * s.dx[k] })
    s.dx[c] = v / d
  } else {
    const c = s.order[M - 1 - s.p]
    let v = 0
    g.nbr[c].forEach((k, q) => { if (s.rank[k] > s.rank[c]) v += g.cf[c][q] * s.dx[k] })
    s.dx[c] += v / d
  }
  s.p++
  if (s.p < M) return
  s.p = 0
  if (s.phase === 0) { s.phase = 1; return }
  s.phase = 0
  for (let c = 0; c < M; c++) { s.x[c] += s.dx[c]; s.dx[c] = 0 }
  s.it++
  const res = residual(g, s.x, s.r)
  s.hist.push(res)
  if (res < TOL || s.it >= CAP) s.done = true
}

function itersToConverge(g: Grid, order: number[]) {
  const s = newRun(g, order)
  while (!s.done) advance(g, s)
  return s.it
}

function heat(t: number) {
  const v = Math.max(0, Math.min(1, t))
  return `rgb(${Math.round(20 + 230 * v)},${Math.round(60 + 150 * v * (1 - 0.4 * v))},${Math.round(140 - 100 * v)})`
}

export function SweepOrderLusgsLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [deg, setDeg] = useState(30)
  const [logD, setLogD] = useState(-2)
  const [mode, setMode] = useState<Mode>('random')
  const [corner, setCorner] = useState<Corner>('SW')
  const [speed, setSpeed] = useState(16)
  const [showRank, setShowRank] = useState(false)
  const [read, setRead] = useState({ it: 0, res: 1, done: false })
  const [nonce, setNonce] = useState(0)

  const diff = Math.pow(10, logD)
  const grid = useMemo(() => makeGrid((deg * Math.PI) / 180, diff), [deg, diff])
  const table = useMemo(() => {
    const rows: { key: string; it: number; bw: number }[] = []
    const add = (key: string, o: number[]) => {
      const rk = new Array(M); o.forEach((c, p) => { rk[c] = p })
      let bw = 0
      grid.nbr.forEach((nb, c) => nb.forEach((k) => { bw = Math.max(bw, Math.abs(rk[c] - rk[k])) }))
      rows.push({ key, it: itersToConverge(grid, o), bw })
    }
    add('natural', orderFor(grid, 'natural', 'SW'))
    add('random', orderFor(grid, 'random', 'SW'))
    for (const c of ['SW', 'SE', 'NW', 'NE'] as Corner[]) add(`RCM ${c}`, orderFor(grid, 'rcm', c))
    return rows
  }, [grid])

  const live = useRef({ grid, speed, showRank, deg, run: newRun(grid, orderFor(grid, mode, corner)) })
  useEffect(() => {
    live.current.grid = grid
    live.current.run = newRun(grid, orderFor(grid, mode, corner))
  }, [grid, mode, corner, nonce])
  useEffect(() => { live.current.speed = speed; live.current.showRank = showRank; live.current.deg = deg }, [speed, showRank, deg])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0
    const loop = () => {
      const L = live.current, s = L.run, g = L.grid
      for (let k = 0; k < L.speed && !s.done; k++) advance(g, s)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      // grid
      const x0 = 24, y0 = 30, cs = 16
      let xmax = 1e-12
      for (let c = 0; c < M; c++) xmax = Math.max(xmax, s.x[c] + s.dx[c])
      for (let c = 0; c < M; c++) {
        const i = c % N, j = Math.floor(c / N)
        const px = x0 + i * cs, py = y0 + (N - 1 - j) * cs
        const t = L.showRank ? s.rank[c] / (M - 1) : (s.x[c] + s.dx[c]) / xmax
        ctx.fillStyle = heat(t)
        ctx.fillRect(px, py, cs - 1, cs - 1)
      }
      if (!s.done) {
        const c = s.phase === 0 ? s.order[s.p] : s.order[M - 1 - s.p]
        const i = c % N, j = Math.floor(c / N)
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
        ctx.strokeRect(x0 + i * cs - 1, y0 + (N - 1 - j) * cs - 1, cs + 1, cs + 1)
      }
      // flow arrow
      const a = (L.deg * Math.PI) / 180, cx = x0 + (N * cs) / 2, cy = y0 + (N * cs) / 2
      const ex = cx + 70 * Math.cos(a), ey = cy - 70 * Math.sin(a)
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(cx - 70 * Math.cos(a), cy + 70 * Math.sin(a)); ctx.lineTo(ex, ey); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ex, ey)
      ctx.lineTo(ex - 12 * Math.cos(a - 0.4), ey + 12 * Math.sin(a - 0.4))
      ctx.lineTo(ex - 12 * Math.cos(a + 0.4), ey + 12 * Math.sin(a + 0.4)); ctx.closePath()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill()
      ctx.fillStyle = '#cbd5e1'; ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(L.showRank ? 'color = sweep rank (blue first, yellow last)' : 'color = provisional phi = x + dx', x0, 20)
      ctx.fillText(`${s.phase === 0 ? 'forward (L) sweep' : 'backward (U) sweep'}  cell ${s.p}/${M}`, x0, y0 + N * cs + 18)
      for (const [lab, c] of Object.entries(CORNER)) {
        const i = c % N, j = Math.floor(c / N)
        ctx.fillText(lab, x0 + i * cs + (i ? cs + 3 : -22), y0 + (N - 1 - j) * cs + 12)
      }
      // residual plot
      const gx = 420, gy = 30, gw = 315, gh = 270
      ctx.strokeStyle = 'rgba(203,213,225,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(gx, gy, gw, gh)
      const itMax = 40
      const ly = (r: number) => gy + gh * Math.min(1, Math.max(0, -Math.log10(Math.max(r, 1e-12)) / 9))
      for (let e = 0; e <= 9; e += 3) {
        ctx.fillStyle = '#94a3b8'; ctx.fillText(`1e-${e}`, gx - 40, ly(Math.pow(10, -e)) + 4)
      }
      ctx.strokeStyle = '#f87171'; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(gx, ly(TOL)); ctx.lineTo(gx + gw, ly(TOL)); ctx.stroke(); ctx.setLineDash([])
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath()
      s.hist.forEach((r, k) => {
        const px = gx + (gw * Math.min(k, itMax)) / itMax
        if (k === 0) ctx.moveTo(px, ly(r)); else ctx.lineTo(px, ly(r))
      })
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('RMS residual vs LU-SGS iteration (0..40)', gx, gy - 8)
      ctx.fillText(`tol ${TOL.toExponential(0)}`, gx + gw - 60, ly(TOL) - 6)
      if (++frame % 12 === 0) setRead({ it: s.it, res: s.hist[s.hist.length - 1], done: s.done })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const best = Math.min(...table.map((r) => r.it))

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {(['natural', 'random', 'rcm'] as Mode[]).map((m) => (
          <button key={m} style={btn(mode === m)} onClick={() => setMode(m)}>
            {m === 'natural' ? 'natural (i,j)' : m === 'random' ? 'random labels' : 'RCM'}
          </button>
        ))}
        <span style={{ alignSelf: 'center', fontSize: 13, opacity: 0.7 }}>RCM start:</span>
        {(['SW', 'SE', 'NW', 'NE'] as Corner[]).map((c) => (
          <button key={c} style={btn(mode === 'rcm' && corner === c)} onClick={() => { setMode('rcm'); setCorner(c) }}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <label>flow angle = {deg}°{' '}
          <input type="range" min={0} max={360} step={15} value={deg} onChange={(e) => setDeg(+e.target.value)} />
        </label>
        <label>diffusion D = {diff.toFixed(3)} (cell Pe = {(1 / diff).toFixed(0)}){' '}
          <input type="range" min={-2.3} max={0} step={0.1} value={logD} onChange={(e) => setLogD(+e.target.value)} />
        </label>
        <label>cells/frame = {speed}{' '}
          <input type="range" min={2} max={200} step={2} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
        </label>
        <button style={btn(showRank)} onClick={() => setShowRank((v) => !v)}>{showRank ? 'show phi' : 'show numbering'}</button>
        <button style={btn(false)} onClick={() => setNonce((v) => v + 1)}>restart</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <span style={{ color: read.done ? '#34d399' : '#fbbf24' }}>{read.done ? 'converged' : 'sweeping'}</span>
        {' '}| iter = {read.it} | residual = {read.res.toExponential(1)}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          {table.map((r) => (
            <span key={r.key} style={{ color: r.it === best ? '#34d399' : r.it > 2 * best ? '#f87171' : 'inherit' }}>
              {r.key}: {r.it} it, bw {r.bw}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
