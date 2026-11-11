'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 460
const WATER = 'rgba(56,189,248,0.22)'
const WLINE = '#38bdf8'
const RIGHT = '#22c55e'
const CAPS = '#ef4444'
const BCOL = '#38bdf8'
const GCOL = '#f97316'
const MCOL = '#a78bfa'
const GREY = 'rgba(140,140,140,0.95)'

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

export function MetacentricRollLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [b, setB] = useState(1.0)
  const [s, setS] = useState(0.5)
  const [g0, setG0] = useState(0)
  const [th0, setTh0] = useState(5)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ th: 5, gz: 0, gm: 0 })
  const playRef = useRef(playing)
  playRef.current = playing

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const h = 1
    let th = (th0 * Math.PI) / 180, om = 0
    const gm = (b * b) / (12 * s * h) + (s * h) / 2 - h / 2 - g0
    // GZ curve for the inset
    const curve: number[] = []
    for (let i = 0; i <= 180; i++) {
      const t = ((i - 90) * Math.PI) / 180
      const f = floatState(t, s, b, h)
      curve.push(-g0 * Math.sin(t) - f.xB)
    }
    const gzMax = Math.max(0.05, ...curve.map(Math.abs))
    let frame = 0, raf = 0
    const sc = 150
    const cx0 = 260, cy0 = 230

    const gzOf = (t: number) => {
      const f = floatState(t, s, b, h)
      return { f, gz: -g0 * Math.sin(t) - f.xB }
    }

    const draw = () => {
      const { f, gz } = gzOf(th)
      const X = (x: number) => cx0 + x * sc
      const Y = (y: number) => cy0 - (y - f.c) * sc
      ctx.clearRect(0, 0, W, H)
      // water
      ctx.fillStyle = WATER
      ctx.fillRect(0, cy0, 520, H - cy0)
      // submerged part
      ctx.fillStyle = 'rgba(56,189,248,0.35)'
      ctx.beginPath(); f.sub.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.closePath(); ctx.fill()
      // body
      ctx.strokeStyle = GREY; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(180,140,90,0.35)'
      ctx.beginPath(); f.poly.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.strokeStyle = WLINE; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, cy0); ctx.lineTo(520, cy0); ctx.stroke()
      // body centreline
      const co = Math.cos(th), si = Math.sin(th)
      ctx.setLineDash([4, 4]); ctx.strokeStyle = GREY; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(X(-si * 0.9), Y(co * 0.9)); ctx.lineTo(X(si * 0.9), Y(-co * 0.9)); ctx.stroke(); ctx.setLineDash([])
      const xG = -g0 * si, yG = g0 * co
      // metacentre: buoyancy vertical through B meets centreline (x = -t si, y = t co)
      let mPt: P | null = null
      if (Math.abs(si) > 1e-3) { const t = -f.xB / si; mPt = [-t * si, t * co] }
      else { const t = g0 + gm; mPt = [0, t] }
      // forces
      const arrow = (x: number, y: number, dy: number, col: string) => {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x), Y(y + dy)); ctx.stroke()
        const yy = Y(y + dy), d = dy > 0 ? 1 : -1
        ctx.beginPath(); ctx.moveTo(X(x), yy); ctx.lineTo(X(x) - 6, yy + 10 * d); ctx.lineTo(X(x) + 6, yy + 10 * d); ctx.closePath(); ctx.fill()
      }
      arrow(f.xB, f.yB, 0.75, BCOL)
      arrow(xG, yG, -0.75, GCOL)
      // righting arm GZ
      const col = gz * Math.sign(th || 1) >= 0 ? RIGHT : CAPS
      ctx.strokeStyle = col; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(X(xG), Y(yG)); ctx.lineTo(X(f.xB), Y(yG)); ctx.stroke()
      const dot = (x: number, y: number, c: string, lab: string) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(x), Y(y), 5, 0, 2 * Math.PI); ctx.fill()
        ctx.font = 'bold 13px ui-sans-serif, system-ui'; ctx.fillText(lab, X(x) + 8, Y(y) - 6)
      }
      dot(f.xB, f.yB, BCOL, 'B'); dot(xG, yG, GCOL, 'G')
      if (mPt && Math.abs(mPt[1]) < 1.6) dot(mPt[0], mPt[1], MCOL, 'M')
      // inset GZ(θ)
      const ix = 540, iy = 40, iw = 200, ih = 200
      ctx.strokeStyle = GREY; ctx.lineWidth = 1; ctx.strokeRect(ix, iy, iw, ih)
      ctx.beginPath(); ctx.moveTo(ix, iy + ih / 2); ctx.lineTo(ix + iw, iy + ih / 2); ctx.moveTo(ix + iw / 2, iy); ctx.lineTo(ix + iw / 2, iy + ih); ctx.stroke()
      ctx.lineWidth = 2
      for (let i = 0; i < 180; i++) {
        const v0 = curve[i], v1 = curve[i + 1]
        const t = i - 90
        ctx.strokeStyle = v0 * Math.sign(t || 1) >= 0 ? RIGHT : CAPS
        ctx.beginPath()
        ctx.moveTo(ix + (i / 180) * iw, iy + ih / 2 - (v0 / gzMax) * ih * 0.45)
        ctx.lineTo(ix + ((i + 1) / 180) * iw, iy + ih / 2 - (v1 / gzMax) * ih * 0.45)
        ctx.stroke()
      }
      const thd = (th * 180) / Math.PI
      const px = ix + ((Math.max(-90, Math.min(90, thd)) + 90) / 180) * iw
      ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(px, iy + ih / 2 - (gz / gzMax) * ih * 0.45, 5, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = GREY; ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText('GZ(θ)  green = righting', ix, iy - 8)
      ctx.fillText('−90°', ix, iy + ih + 14); ctx.fillText('0', ix + iw / 2 - 3, iy + ih + 14); ctx.fillText('+90°', ix + iw - 28, iy + ih + 14)
      ctx.fillText(`±${gzMax.toFixed(2)} h`, ix + 4, iy + 14)
      ctx.fillStyle = GREY
      ctx.fillText('B buoyancy · G gravity · M metacentre (M above G → stable)', 12, H - 14)
      return gz
    }

    const loop = () => {
      if (playRef.current) {
        for (let k = 0; k < 4; k++) {
          const dt = 1 / 240
          const { gz } = gzOf(th)
          om += (-40 * gz - 1.0 * om) * dt
          th += om * dt
          if (th > Math.PI) th -= 2 * Math.PI
          if (th < -Math.PI) th += 2 * Math.PI
        }
      }
      const gz = draw()
      if (frame++ % 12 === 0) setRead({ th: (th * 180) / Math.PI, gz, gm })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [b, s, g0, th0, nonce])

  const btn = (on: boolean) => ({ padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)', background: on ? 'rgba(56,189,248,0.2)' : 'transparent', cursor: 'pointer', fontSize: 13 })
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>width b/h = {b.toFixed(2)}
          <input type="range" min={0.6} max={1.8} step={0.01} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
        <label>density ratio s = {s.toFixed(2)}
          <input type="range" min={0.05} max={0.95} step={0.01} value={s} onChange={(e) => setS(Number(e.target.value))} />
        </label>
        <label>G shift = {g0.toFixed(2)} h
          <input type="range" min={-0.3} max={0.3} step={0.01} value={g0} onChange={(e) => setG0(Number(e.target.value))} />
        </label>
        <label>initial heel = {th0}°
          <input type="range" min={-60} max={60} step={1} value={th0} onChange={(e) => setTh0(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Release'}</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div>heel θ = {read.th.toFixed(1)}° · GZ = {read.gz.toFixed(4)} h</div>
        <div style={{ color: read.gm >= 0 ? RIGHT : CAPS }}>GM = b²/(12 s h) + s h/2 − KG = {read.gm.toFixed(4)} h → {read.gm >= 0 ? 'upright is stable' : 'upright is unstable'}</div>
      </div>
    </div>
  )
}
