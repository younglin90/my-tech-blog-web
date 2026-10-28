'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 400
const WALL = 0.5
const TH = 0.02
const X0 = 0.44
const X1 = 0.58
const M = 1
const PAD = { l: 56, r: 16, t: 28, b: 44 }
const NS = 700

function barrier(d: number, dhat: number, kappa: number) {
  if (d <= 0) return Infinity
  if (d >= dhat) return 0
  return -kappa * (d - dhat) ** 2 * Math.log(d / dhat)
}
function penDepth(x: number) {
  if (x <= WALL || x >= WALL + TH) return 0
  return Math.min(x - WALL, WALL + TH - x)
}

export function IncrementalPotentialLandscapeLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [h, setH] = useState(0.01)
  const [logK, setLogK] = useState(4)
  const [dhatMm, setDhatMm] = useState(4)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ xt: 0.47, pen: 0.47, ipc: 0.47, gap: 0 })
  const xtRef = useRef(0.46)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    const k = 10 ** logK
    const kappa = 1e4
    const dhat = dhatMm / 1000
    const px = (x: number) => PAD.l + ((x - X0) / (X1 - X0)) * (W - PAD.l - PAD.r)

    const draw = () => {
      const xt = xtRef.current
      const ePen: number[] = []
      const eIpc: number[] = []
      let pMin = Infinity, pArg = X0, iMin = Infinity, iArg = X0
      for (let i = 0; i <= NS; i++) {
        const x = X0 + ((X1 - X0) * i) / NS
        const inert = 0.5 * M * (x - xt) ** 2
        const ep = inert + h * h * 0.5 * k * penDepth(x) ** 2
        const ei = inert + h * h * barrier(WALL - x, dhat, kappa)
        ePen.push(ep); eIpc.push(ei)
        if (ep < pMin) { pMin = ep; pArg = x }
        if (ei < iMin) { iMin = ei; iArg = x }
      }
      const yMax = 3e-4
      const py = (e: number) => H - PAD.b - (Math.min(e, yMax) / yMax) * (H - PAD.t - PAD.b)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(148,163,184,0.25)'
      ctx.fillRect(px(WALL), PAD.t, px(WALL + TH) - px(WALL), H - PAD.t - PAD.b)
      ctx.fillStyle = 'rgba(59,130,246,0.10)'
      ctx.fillRect(px(WALL - dhat), PAD.t, px(WALL) - px(WALL - dhat), H - PAD.t - PAD.b)
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke()
      ctx.fillStyle = '#888'
      ctx.font = '12px ui-monospace, monospace'
      for (let t = 0.44; t <= 0.581; t += 0.02) {
        ctx.fillText(t.toFixed(2), px(t) - 14, H - PAD.b + 16)
      }
      ctx.fillText('x [m]', W - 60, H - 8)
      ctx.fillText('E(x) = ½m(x−x̃)² + h²·contact', PAD.l + 4, PAD.t - 10)
      ctx.fillText('wall', px(WALL) + 2, PAD.t + 14)
      ctx.fillText('d̂', px(WALL - dhat) - 2, PAD.t + 28)

      const curve = (arr: number[], col: string) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2.2
        ctx.beginPath()
        let pen = false
        for (let i = 0; i <= NS; i++) {
          const x = X0 + ((X1 - X0) * i) / NS
          if (!isFinite(arr[i])) { pen = false; continue }
          const X = px(x), Y = py(arr[i])
          if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y)
          pen = true
        }
        ctx.stroke()
      }
      curve(ePen, '#ef4444')
      curve(eIpc, '#22c55e')

      ctx.strokeStyle = '#a855f7'
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(px(xt), PAD.t); ctx.lineTo(px(xt), H - PAD.b); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#a855f7'
      ctx.fillText('x̃', px(xt) + 3, H - PAD.b - 6)

      const dot = (x: number, e: number, col: string) => {
        ctx.fillStyle = col
        ctx.beginPath(); ctx.arc(px(x), py(e), 6, 0, 2 * Math.PI); ctx.fill()
      }
      dot(pArg, pMin, '#ef4444')
      dot(iArg, iMin, '#22c55e')

      ctx.fillStyle = '#ef4444'
      ctx.fillText(pArg > WALL + TH ? 'penalty min: BEHIND the wall' : pArg > WALL ? 'penalty min: inside wall' : 'penalty min: in front', W - 260, PAD.t + 14)
      ctx.fillStyle = '#22c55e'
      ctx.fillText('IPC min: always in front (E→∞ at d=0)', W - 300, PAD.t + 30)
      return { pArg, iArg }
    }

    const loop = () => {
      if (playing) {
        xtRef.current += 0.00018
        if (xtRef.current > X1) xtRef.current = X0 + 0.02
      }
      const r = draw()
      if (frame++ % 12 === 0) setRead({ xt: xtRef.current, pen: r.pArg, ipc: r.iArg, gap: WALL - r.iArg })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [h, logK, dhatMm, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(34,197,94,0.18)' : 'transparent', cursor: 'pointer', fontSize: 13,
  })
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>predicted x̃ = x + h·v{' '}
          <input type="range" min={X0} max={X1} step={0.001} value={read.xt}
            onChange={(e) => { setPlaying(false); xtRef.current = Number(e.target.value); setNonce((v) => v + 1) }} />
        </label>
        <label>h = {(h * 1000).toFixed(0)} ms{' '}
          <input type="range" min={0.002} max={0.03} step={0.001} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
        <label>penalty k = 1e{logK.toFixed(1)}{' '}
          <input type="range" min={3} max={7} step={0.5} value={logK} onChange={(e) => setLogK(Number(e.target.value))} />
        </label>
        <label>d̂ = {dhatMm.toFixed(1)} mm{' '}
          <input type="range" min={0.5} max={10} step={0.5} value={dhatMm} onChange={(e) => setDhatMm(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play sweep x̃'}</button>
        <button style={btn(false)} onClick={() => { xtRef.current = 0.46; setPlaying(true); setNonce((v) => v + 1) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        x̃ = {read.xt.toFixed(3)} m · <span style={{ color: '#ef4444' }}>penalty argmin {read.pen.toFixed(4)} m</span> ·{' '}
        <span style={{ color: '#22c55e' }}>IPC argmin {read.ipc.toFixed(4)} m (gap {(read.gap * 1000).toFixed(2)} mm)</span>
      </div>
    </div>
  )
}
