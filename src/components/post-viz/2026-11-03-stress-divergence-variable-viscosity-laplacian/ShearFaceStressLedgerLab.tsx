'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const NP = 201

// steady channel, G = -dp/dx = 1, mu(y) = r^(-y):  tau(y) = mu u' = C - y  (linear, whatever mu does)
function channel(r: number) {
  const k = Math.log(r)
  let C = 0.5
  if (k > 1e-9) {
    const e = Math.exp(k)
    const i0 = (e - 1) / k
    const i1 = e / k - (e - 1) / (k * k)
    C = i1 / i0
  }
  const u = new Float64Array(NP)
  const ds = 1 / (NP - 1)
  let prev = C
  for (let i = 1; i < NP; i++) {
    const s = i * ds
    const cur = (C - s) * Math.exp(k * s)
    u[i] = u[i - 1] + 0.5 * (prev + cur) * ds
    prev = cur
  }
  let umax = 0
  for (let i = 0; i < NP; i++) umax = Math.max(umax, u[i])
  return { k, C, u, umax }
}
const uAt = (u: Float64Array, y: number) => {
  const f = Math.min(Math.max(y, 0), 1) * (NP - 1)
  const i = Math.min(Math.floor(f), NP - 2)
  return u[i] + (f - i) * (u[i + 1] - u[i])
}

type Read = { y0: number; tt: number; tb: number; div: number; lap: number; miss: number }

export function ShearFaceStressLedgerLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [r, setR] = useState(10)
  const [h, setH] = useState(0.16)
  const [y0, setY0] = useState(0.7)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState<Read>({ y0: 0.7, tt: 0, tb: 0, div: -1, lap: 0, miss: 0 })
  const playRef = useRef(playing)
  const y0Ref = useRef(y0)
  playRef.current = playing
  useEffect(() => { y0Ref.current = y0 }, [y0])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const ch = channel(r)
    let raf = 0
    let frame = 0
    let phase = Math.asin(Math.min(Math.max((y0Ref.current - 0.5) / 0.38, -1), 1))
    let xel = 0.15
    let shear = 0

    // channel panel
    const cx = 40, cy = 40, cw = 330, chh = 330
    const Y = (y: number) => cy + chh * (1 - y)
    // ledger panel
    const bx = 430, by = 70, bw = 300, bh = 300

    const draw = (yc: number) => {
      const yt = Math.min(yc + h / 2, 1), yb = Math.max(yc - h / 2, 0)
      const tt = ch.C - yt, tb = ch.C - yb
      const div = (tt - tb) / (yt - yb)
      const lap = -1 + ch.k * (ch.C - yc)
      const miss = -ch.k * (ch.C - yc)
      ctx.clearRect(0, 0, W, H)
      const grey = 'rgba(140,140,140,0.95)'
      ctx.font = '12px ui-monospace, monospace'
      // viscosity background stripes
      for (let j = 0; j < 60; j++) {
        const y = (j + 0.5) / 60
        const mu = Math.exp(-ch.k * y)
        ctx.fillStyle = `rgba(251,191,36,${0.05 + 0.32 * mu})`
        ctx.fillRect(cx, Y((j + 1) / 60), cw, chh / 60 + 0.5)
      }
      ctx.fillStyle = 'rgba(127,127,127,0.6)'
      ctx.fillRect(cx, cy - 4, cw, 4); ctx.fillRect(cx, cy + chh, cw, 4)
      // velocity profile
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath()
      for (let i = 0; i < NP; i++) {
        const y = i / (NP - 1)
        const px = cx + 8 + (cw - 40) * ch.u[i] / ch.umax
        if (i === 0) ctx.moveTo(px, Y(y)); else ctx.lineTo(px, Y(y))
      }
      ctx.stroke()
      // element (sheared parallelogram drifting with u(yc))
      const s = chh * (yt - yb)
      const ex = cx + xel * cw
      const du = (uAt(ch.u, yt) - uAt(ch.u, yb)) / ch.umax
      const off = Math.min(shear * du * 60, 60)
      ctx.fillStyle = 'rgba(56,189,248,0.22)'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(ex, Y(yb)); ctx.lineTo(ex + s, Y(yb)); ctx.lineTo(ex + s + off, Y(yt)); ctx.lineTo(ex + off, Y(yt)); ctx.closePath()
      ctx.fill(); ctx.stroke()
      // face stress arrows (force on element: +tau_top on top, -tau_bot on bottom)
      const arrow = (x: number, y: number, len: number, col: string) => {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke()
        const d = Math.sign(len) || 1
        ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x + len - 7 * d, y - 4); ctx.lineTo(x + len - 7 * d, y + 4); ctx.fill()
      }
      const sc = 70
      arrow(ex + off + s / 2, Y(yt) - 8, sc * tt, '#22c55e')
      arrow(ex + s / 2, Y(yb) + 8, -sc * tb, '#ef4444')
      ctx.fillStyle = grey
      ctx.fillText('y=1  hot wall, μ = 1/r', cx + 4, cy - 10)
      ctx.fillText('y=0  cold wall, μ = 1', cx + 4, cy + chh + 18)
      ctx.fillStyle = '#38bdf8'; ctx.fillText('u(y)', cx + cw - 36, Y(0.5))
      ctx.fillStyle = '#22c55e'; ctx.fillText(`+τ(top) ${tt.toFixed(3)}`, cx + cw - 128, cy + 16)
      ctx.fillStyle = '#ef4444'; ctx.fillText(`−τ(bot) ${(-tb).toFixed(3)}`, cx + cw - 128, cy + 32)

      // ledger bars: force per unit volume in x
      const zero = bx + bw / 2
      const sx = bw / 2 / 2.6
      const rows: [string, number, string][] = [
        ['pressure  G', 1, '#94a3b8'],
        ['∂τ/∂y  (face diff)', div, '#22c55e'],
        ['μ ∂²u/∂y²  (Laplacian)', lap, '#f97316'],
        ['μ′ ∂u/∂y  (dropped)', miss, '#a855f7'],
        ['G + μ∂²u  → fake net', 1 + lap, '#ef4444'],
      ]
      ctx.fillStyle = grey
      ctx.fillText('x-force per unit volume at the element', bx, by - 30)
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(zero, by - 12); ctx.lineTo(zero, by + bh - 20); ctx.stroke()
      rows.forEach(([lab, v, col], i) => {
        const yy = by + i * 56
        const vv = Math.max(-2.6, Math.min(2.6, v))
        ctx.fillStyle = col
        ctx.fillRect(Math.min(zero, zero + vv * sx), yy + 14, Math.abs(vv * sx), 18)
        ctx.fillText(lab, bx, yy + 8)
        ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(3), v >= 0 ? zero - 58 : zero + 6, yy + 28)
      })
      ctx.fillStyle = grey
      ctx.fillText('−2.6', bx - 4, by + bh - 4); ctx.fillText('0', zero - 3, by + bh - 4); ctx.fillText('+2.6', bx + bw - 26, by + bh - 4)
      return { y0: yc, tt, tb, div, lap, miss }
    }

    let last: Read = draw(y0Ref.current)
    setRead(last)
    const loop = () => {
      frame++
      let yc = y0Ref.current
      if (playRef.current) {
        phase += 0.008
        yc = 0.5 + 0.38 * Math.sin(phase)
        xel += 0.0035 * (0.25 + uAt(ch.u, yc) / ch.umax)
        shear += 0.012
        if (xel > 0.72) { xel = 0.05; shear = 0 }
      }
      last = draw(yc)
      if (frame % 12 === 0) setRead(last)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [r, h])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          viscosity ratio r = μ_bot/μ_top = {r}{' '}
          <input type="range" min={1} max={30} step={1} value={r} onChange={(e) => setR(Number(e.target.value))} />
        </label>
        <label>
          element height h = {h.toFixed(2)}{' '}
          <input type="range" min={0.04} max={0.4} step={0.02} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
        <label>
          element y = {(playing ? read.y0 : y0).toFixed(2)}{' '}
          <input type="range" min={0.1} max={0.9} step={0.01} value={playing ? read.y0 : y0}
            onChange={(e) => { setPlaying(false); setY0(Number(e.target.value)) }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => { if (playing) setY0(read.y0); setPlaying((v) => !v) }}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); setY0(0.7); setR(10); setH(0.16) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div>τ(top) − τ(bot) over h = <b style={{ color: '#22c55e' }}>{read.div.toFixed(3)}</b> (always −1: balances G = 1)</div>
        <div>Laplacian μ∂²u = <b style={{ color: '#f97316' }}>{read.lap.toFixed(3)}</b> · dropped μ′u′ = <b style={{ color: '#a855f7' }}>{read.miss.toFixed(3)}</b> · fake net force = <b style={{ color: '#ef4444' }}>{(1 + read.lap).toFixed(3)}</b></div>
      </div>
    </div>
  )
}
