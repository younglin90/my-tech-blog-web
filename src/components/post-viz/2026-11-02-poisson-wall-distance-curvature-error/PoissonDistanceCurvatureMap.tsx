'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const G = 72
const L = 3
const SHAPES = ['convex', 'flat', 'concave'] as const
type Shape = typeof SHAPES[number]

function exactDist(shape: Shape, x: number, y: number, a: number) {
  const r = Math.hypot(x, y)
  if (shape === 'convex') return r - a
  if (shape === 'concave') return a * 1.8 - r
  return y + L * 0.7
}
// diverging color: blue (<1, underestimate) – white – red (>1, overestimate)
function ratioColor(q: number) {
  const t = Math.max(-1, Math.min(1, Math.log2(q) / Math.log2(2)))
  if (t >= 0) return `rgb(${255},${Math.round(255 - 190 * t)},${Math.round(255 - 200 * t)})`
  const u = -t
  return `rgb(${Math.round(255 - 200 * u)},${Math.round(255 - 140 * u)},255)`
}

export function PoissonDistanceCurvatureMap() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [shape, setShape] = useState<Shape>('convex')
  const [a, setA] = useState(0.8)
  const [probe, setProbe] = useState(0.8)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ it: 0, dp: 0, de: 0 })
  const playRef = useRef(playing)
  const probeRef = useRef(probe)
  const adv = useRef<(k: number) => void>(() => {})
  useEffect(() => { playRef.current = playing }, [playing])
  useEffect(() => { probeRef.current = probe }, [probe])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const h = (2 * L) / G
    const xc = (i: number) => -L + (i + 0.5) * h
    const wall = new Uint8Array(G * G)
    const de = new Float64Array(G * G)
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const e = exactDist(shape, xc(i), xc(j), a)
      de[j * G + i] = e
      wall[j * G + i] = e <= 0 ? 1 : 0
    }
    const phi = new Float64Array(G * G)
    const dp = new Float64Array(G * G)
    let it = 0, raf = 0, frame = 0
    const at = (i: number, j: number) => {
      // Neumann on the box: mirror back inside
      const ii = i < 0 ? 0 : i >= G ? G - 1 : i
      const jj = j < 0 ? 0 : j >= G ? G - 1 : j
      return phi[jj * G + ii]
    }
    const sweep = () => {
      for (let color = 0; color < 2; color++)
        for (let j = 0; j < G; j++) for (let i = (j + color) % 2; i < G; i += 2) {
          const id = j * G + i
          if (wall[id]) continue
          const nv = 0.25 * (at(i - 1, j) + at(i + 1, j) + at(i, j - 1) + at(i, j + 1) + h * h)
          phi[id] += 1.9 * (nv - phi[id])
        }
      it++
    }
    const distance = () => {
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const id = j * G + i
        if (wall[id]) { dp[id] = 0; continue }
        const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * h), gy = (at(i, j + 1) - at(i, j - 1)) / (2 * h)
        const g = Math.hypot(gx, gy)
        dp[id] = -g + Math.sqrt(g * g + 2 * Math.max(phi[id], 0))
      }
    }
    // probe along a ray from the wall
    const probeIdx = () => {
      const y = probeRef.current
      let x = 0, yy = 0
      if (shape === 'convex') { x = (a + y) * Math.SQRT1_2; yy = (a + y) * Math.SQRT1_2 }
      else if (shape === 'concave') { x = (1.8 * a - y) * Math.SQRT1_2; yy = (1.8 * a - y) * Math.SQRT1_2 }
      else { x = 0.5; yy = -L * 0.7 + y }
      const i = Math.min(G - 1, Math.max(0, Math.floor((x + L) / h)))
      const j = Math.min(G - 1, Math.max(0, Math.floor((yy + L) / h)))
      return { i, j, x, y: yy }
    }
    const grey = 'rgba(127,127,127,0.9)'
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      const ox = 20, oy = 24, S = 372, c = S / G
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const id = j * G + i
        if (wall[id]) ctx.fillStyle = 'rgba(100,100,100,0.85)'
        else if (de[id] < 1.5 * h || phi[id] <= 0) ctx.fillStyle = 'rgba(255,255,255,0.9)'
        else ctx.fillStyle = ratioColor(dp[id] / de[id])
        ctx.fillRect(ox + i * c, oy + (G - 1 - j) * c, c + 0.5, c + 0.5)
      }
      // contours: exact (dashed) vs PDE (solid) at levels 0.5, 1.0, 1.5
      const levels = [0.5, 1, 1.5]
      for (const lv of levels) {
        for (const [arr, dash] of [[de, true], [dp, false]] as const) {
          ctx.setLineDash(dash ? [3, 3] : []); ctx.strokeStyle = dash ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.95)'
          ctx.lineWidth = dash ? 1 : 1.6; ctx.beginPath()
          for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) {
            const id = j * G + i
            if (wall[id] || wall[id + 1] || wall[id + G]) continue
            const v = arr[id] - lv, vr = arr[id + 1] - lv, vu = arr[id + G] - lv
            const cx = ox + (i + 0.5) * c, cy = oy + (G - 1 - j + 0.5) * c
            if (v * vr < 0) { const t = v / (v - vr); ctx.moveTo(cx + t * c, cy - c * 0.5); ctx.lineTo(cx + t * c, cy + c * 0.5) }
            if (v * vu < 0) { const t = v / (v - vu); ctx.moveTo(cx - c * 0.5, cy - t * c); ctx.lineTo(cx + c * 0.5, cy - t * c) }
          }
          ctx.stroke()
        }
      }
      ctx.setLineDash([]); ctx.lineWidth = 1
      const p = probeIdx()
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#facc15'
      ctx.beginPath(); ctx.arc(ox + (p.x + L) / (2 * L) * S, oy + S - (p.y + L) / (2 * L) * S, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
      ctx.fillStyle = grey
      ctx.fillText('color: d_PDE / d_exact   solid: d_PDE = 0.5, 1, 1.5   dashed: exact', ox, oy - 8)
      // legend bar
      const bx = 430, by = 40
      for (let q = 0; q < 200; q++) { ctx.fillStyle = ratioColor(Math.pow(2, (q - 100) / 100)); ctx.fillRect(bx + q * 1.5, by, 2, 14) }
      ctx.fillStyle = grey
      ctx.fillText('0.5×', bx - 4, by + 28); ctx.fillText('1', bx + 147, by + 28); ctx.fillText('2×', bx + 288, by + 28)
      ctx.fillText('under-estimate', bx, by - 6); ctx.fillText('over-estimate', bx + 200, by - 6)
      // ray plot along the 45° (or vertical) ray: d_PDE vs exact
      const rx = 440, ry = 110, rw = 290, rh = 250, ymax = 2
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(rx, ry, rw, rh)
      const X = (y: number) => rx + (y / ymax) * rw
      const Y = (d: number) => ry + rh - (d / 3) * rh
      ctx.setLineDash([5, 4]); ctx.strokeStyle = grey
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(ymax), Y(ymax)); ctx.stroke(); ctx.setLineDash([])
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.beginPath()
      let first = true
      const yEnd = shape === 'concave' ? 1.8 * a : ymax
      for (let y = 0.02; y <= Math.min(ymax, yEnd); y += 0.02) {
        const save = probeRef.current; probeRef.current = y
        const q = probeIdx(); probeRef.current = save
        const id = q.j * G + q.i
        if (wall[id]) continue
        const v = de[id] > 0 ? dp[id] * (y / de[id]) : 0
        if (first) { ctx.moveTo(X(y), Y(v)); first = false } else ctx.lineTo(X(y), Y(v))
      }
      ctx.stroke(); ctx.lineWidth = 1
      ctx.strokeStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(X(probeRef.current), ry); ctx.lineTo(X(probeRef.current), ry + rh); ctx.stroke()
      ctx.fillStyle = grey
      ctx.fillText('along the probe ray: d_PDE (orange) vs exact (dashed)', rx - 10, ry - 8)
      ctx.fillText('0', X(0) - 3, ry + rh + 16); ctx.fillText('1', X(1) - 3, ry + rh + 16); ctx.fillText('2  y', X(2) - 12, ry + rh + 16)
      ctx.fillText('d', rx - 14, ry + 10); ctx.fillText(`SOR sweep ${it}`, rx, ry + rh + 34)
    }
    const advance = (k: number) => { for (let q = 0; q < k; q++) sweep(); distance(); draw() }
    const pub = () => { const p = probeIdx(); const id = p.j * G + p.i; setRead({ it, dp: dp[id], de: de[id] }) }
    adv.current = (k: number) => { advance(k); pub() }
    advance(0); pub()
    const loop = () => {
      frame++
      if (playRef.current && it < 1500) advance(6)
      else if (frame % 6 === 0) draw()
      if (frame % 12 === 0) pub()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [shape, a, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(249,115,22,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const ratio = read.de > 0 ? read.dp / read.de : 0

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {SHAPES.map((s) => (
          <button key={s} style={btn(shape === s)} onClick={() => setShape(s)}>
            {s === 'convex' ? 'Convex: cylinder' : s === 'flat' ? 'Flat wall' : 'Concave: inside pipe'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, fontSize: 13, alignItems: 'center' }}>
        <label>
          wall radius a = {a.toFixed(2)}{' '}
          <input type="range" min={0.3} max={1.6} step={0.05} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label>
          probe y = {probe.toFixed(2)}{' '}
          <input type="range" min={0.1} max={2} step={0.05} value={probe} onChange={(e) => setProbe(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(5) }}>Step ×5</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        sweep {read.it} · probe: exact d = {read.de.toFixed(3)} · Poisson d = {read.dp.toFixed(3)} ·{' '}
        <span style={{ color: ratio > 1.02 ? '#ef4444' : ratio < 0.98 ? '#3b82f6' : 'inherit' }}>ratio {ratio.toFixed(3)}</span>
        {' '}(near-wall model 1 + κy/2 = {(1 + (shape === 'convex' ? 1 : shape === 'concave' ? -1 : 0) * probe / (2 * (shape === 'concave' ? 1.8 * a : a))).toFixed(3)})
      </div>
    </div>
  )
}
