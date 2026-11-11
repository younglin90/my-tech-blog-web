'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 470
const RIGHT = '#22c55e'
const CAPS = '#ef4444'
const LIN = '#a78bfa'
const GREY = 'rgba(140,140,140,0.95)'
const N = 901

type P = [number, number]

function clipBelow(poly: P[], c: number): P[] {
  const out: P[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length]
    const pin = p[1] < c, qin = q[1] < c
    if (pin) out.push(p)
    if (pin !== qin) {
      const t = (c - p[1]) / (q[1] - p[1])
      out.push([p[0] + t * (q[0] - p[0]), c])
    }
  }
  return out
}

function areaCentroid(poly: P[]): [number, number, number] {
  let A = 0, cx = 0, cy = 0
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]
    const cr = x0 * y1 - x1 * y0
    A += cr; cx += (x0 + x1) * cr; cy += (y0 + y1) * cr
  }
  A *= 0.5
  if (Math.abs(A) < 1e-12) return [0, 0, 0]
  return [A, cx / (6 * A), cy / (6 * A)]
}

function boxAt(th: number, b: number, h: number): P[] {
  const co = Math.cos(th), si = Math.sin(th)
  const box: P[] = [[-b / 2, -h / 2], [b / 2, -h / 2], [b / 2, h / 2], [-b / 2, h / 2]]
  return box.map(([x, y]) => [x * co - y * si, x * si + y * co])
}

// waterline c (bisection on displaced area), centre of buoyancy B
function floatState(th: number, s: number, b: number, h: number) {
  const poly = boxAt(th, b, h)
  const target = s * b * h
  let lo = -0.8 * (b + h), hi = 0.8 * (b + h), c = 0
  for (let k = 0; k < 50; k++) {
    c = 0.5 * (lo + hi)
    const sub = clipBelow(poly, c)
    const A = sub.length >= 3 ? areaCentroid(sub)[0] : 0
    if (A < target) lo = c; else hi = c
  }
  const sub = clipBelow(poly, c)
  const [, xB, yB] = areaCentroid(sub)
  return { poly, sub, c, xB, yB }
}


type Read = { i: number; th: number; gz: number; gmNum: number; gmTh: number; stable: number[]; done: boolean }

// same as the Python floating_angles(): θ swept 0→90° on 901 points,
// each point bisects the waterline (righting_arm), stable where GZ crosses − → +
export function SquareLogEquilibriumScan() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [s, setS] = useState(0.5)
  const [b, setB] = useState(1.0)
  const [spf, setSpf] = useState(6)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Read>({ i: 0, th: 0, gz: 0, gmNum: 0, gmTh: 0, stable: [], done: false })
  const playRef = useRef(playing), spfRef = useRef(spf)
  playRef.current = playing; spfRef.current = spf
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const h = 1
    const ra = (t: number) => -floatState(t, s, b, h).xB
    const gmNum = ra(1e-4) / 1e-4
    const gmTh = (b * b) / (12 * s * h) + (s * h) / 2 - h / 2
    const ths = Array.from({ length: N }, (_, k) => ((Math.PI / 2) * k) / (N - 1))
    const gz: number[] = []
    const stable: number[] = gmNum > 0 ? [0] : []
    let i = 0, frame = 0, raf = 0
    // y-range estimate for plot
    let ymax = 0.02
    for (let k = 0; k < N; k += 50) ymax = Math.max(ymax, Math.abs(ra(ths[k])))
    ymax = Math.max(ymax, Math.abs(gmNum) * 0.5) * 1.25

    const step = () => {
      if (i >= N) return
      gz.push(ra(ths[i]))
      const k = i - 1
      if (k >= 1 && k < N - 2 && gz[k] < -1e-9 && gz[k + 1] > -1e-9)
        stable.push(((ths[k] - (gz[k] * (ths[k + 1] - ths[k])) / (gz[k + 1] - gz[k])) * 180) / Math.PI)
      i++
      if (i === N && b !== h && gz[N - 2] < 0) stable.push(90)
    }
    stepRef.current = () => { for (let k = 0; k < 10; k++) step(); draw(); push() }

    const push = () => setRead({ i, th: i ? (ths[i - 1] * 180) / Math.PI : 0, gz: i ? gz[i - 1] : 0, gmNum, gmTh, stable: [...stable], done: i >= N })

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const th = i ? ths[i - 1] : 0
      const f = floatState(th, s, b, h)
      // left: body at current θ
      const sc = 120, cx0 = 160, cy0 = 230
      const X = (x: number) => cx0 + x * sc
      const Y = (y: number) => cy0 - (y - f.c) * sc
      ctx.fillStyle = 'rgba(56,189,248,0.2)'; ctx.fillRect(0, cy0, 320, H - cy0 - 30)
      ctx.fillStyle = 'rgba(56,189,248,0.4)'
      ctx.beginPath(); f.sub.forEach(([x, y], k) => (k ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = GREY; ctx.lineWidth = 2
      ctx.beginPath(); f.poly.forEach(([x, y], k) => (k ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.closePath(); ctx.stroke()
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, cy0); ctx.lineTo(320, cy0); ctx.stroke()
      const g = i ? gz[i - 1] : 0
      ctx.strokeStyle = g >= 0 ? RIGHT : CAPS; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(f.xB), Y(0)); ctx.stroke()
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(X(0), Y(0), 5, 0, 7); ctx.fill()
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(X(f.xB), Y(f.yB), 5, 0, 7); ctx.fill()
      ctx.fillStyle = GREY; ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(`θ = ${((th * 180) / Math.PI).toFixed(1)}°  waterline c = ${f.c.toFixed(3)}`, 12, 22)
      ctx.fillText('orange G · blue B · bar = GZ', 12, 40)
      // right: GZ(θ) plot
      const px = 380, py = 30, pw = 360, ph = 380
      const PX = (d: number) => px + (d / 90) * pw
      const PY = (v: number) => py + ph / 2 - (v / ymax) * (ph / 2)
      ctx.strokeStyle = GREY; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, ph)
      ctx.beginPath(); ctx.moveTo(px, PY(0)); ctx.lineTo(px + pw, PY(0)); ctx.stroke()
      for (const d of [0, 15, 30, 45, 60, 75, 90]) { ctx.fillText(`${d}°`, PX(d) - 8, py + ph + 15) }
      ctx.fillText(`GZ / h  (±${ymax.toFixed(3)})`, px + 4, py + 14)
      // small-angle theory GM sinθ
      ctx.strokeStyle = LIN; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath()
      for (let d = 0; d <= 90; d++) { const v = Math.max(-ymax, Math.min(ymax, gmTh * Math.sin((d * Math.PI) / 180))); d ? ctx.lineTo(PX(d), PY(v)) : ctx.moveTo(PX(d), PY(v)) }
      ctx.stroke(); ctx.setLineDash([])
      ctx.lineWidth = 2
      for (let k = 1; k < gz.length; k++) {
        ctx.strokeStyle = gz[k] >= 0 ? RIGHT : CAPS
        ctx.beginPath(); ctx.moveTo(PX((ths[k - 1] * 180) / Math.PI), PY(gz[k - 1])); ctx.lineTo(PX((ths[k] * 180) / Math.PI), PY(gz[k])); ctx.stroke()
      }
      for (const a of stable) {
        ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(PX(a), PY(0), 6, 0, 7); ctx.fill()
        ctx.fillText(`${a.toFixed(1)}°`, PX(a) - 14, PY(0) - 10)
      }
      ctx.fillStyle = LIN; ctx.fillText('dashed: GM sin θ (small-angle)', px + pw - 190, py + ph - 8)
      ctx.fillStyle = GREY; ctx.fillText('yellow = stable equilibrium (GZ crosses − → +)', 12, H - 8)
    }

    const loop = () => {
      if (playRef.current && i < N) for (let k = 0; k < spfRef.current; k++) step()
      draw()
      if (frame++ % 10 === 0 || i >= N) push()
      if (i >= N && frame > 2) { draw(); push(); return }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [s, b, nonce])

  const btn = (on: boolean) => ({ padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)', background: on ? 'rgba(56,189,248,0.2)' : 'transparent', cursor: 'pointer', fontSize: 13 })
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>density ratio s = {s.toFixed(2)}
          <input type="range" min={0.05} max={0.95} step={0.01} value={s} onChange={(e) => setS(Number(e.target.value))} />
        </label>
        <label>width b/h = {b.toFixed(2)}
          <input type="range" min={0.6} max={1.6} step={0.01} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
        <label>angles / frame = {spf}
          <input type="range" min={1} max={40} step={1} value={spf} onChange={(e) => setSpf(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: GREY }}>point {read.i}/{N} · θ = {read.th.toFixed(2)}° · GZ = {read.gz.toFixed(5)} h</div>
        <div style={{ color: read.gmNum >= 0 ? RIGHT : CAPS }}>GM_theory = {read.gmTh >= 0 ? '+' : ''}{read.gmTh.toFixed(5)} · GM_numeric = {read.gmNum >= 0 ? '+' : ''}{read.gmNum.toFixed(5)}</div>
        <div style={{ color: '#eab308' }}>stable heel angle(s): {read.stable.length ? read.stable.map((a) => a.toFixed(1) + '°').join(', ') : '—'}{read.done ? '' : ' (scanning…)'}</div>
      </div>
    </div>
  )
}
