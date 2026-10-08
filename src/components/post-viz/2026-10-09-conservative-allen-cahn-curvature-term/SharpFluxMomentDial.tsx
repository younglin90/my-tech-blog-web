'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const N = 160
const DX = 0.5
const XC = Array.from({ length: N }, (_, i) => (i + 0.5) * DX)
const X_MID = (N * DX) / 2
const MOB = 0.05
const CS2 = 1 / 3

function slabProfile(w: number) {
  return XC.map((x) => 0.5 * (1 + Math.tanh((2 * (x - X_MID)) / w)))
}

function faceTerms(f: number[], w: number) {
  const g: number[] = []
  const s: number[] = []
  for (let i = 0; i < N - 1; i++) {
    const gi = (f[i + 1] - f[i]) / DX
    const pf = 0.5 * (f[i] + f[i + 1])
    g.push(gi)
    s.push(((4 / w) * pf * (1 - pf) * gi) / (Math.abs(gi) + 1e-12))
  }
  return { g, s }
}

function advance(f: number[], w: number, spill: boolean, dt: number) {
  const { g, s } = faceTerms(f, w)
  const out = f.slice()
  for (let i = 0; i < N; i++) {
    const hi = i < N - 1 ? g[i] - s[i] : 0
    const lo = i > 0 ? g[i - 1] - s[i - 1] : 0
    out[i] = f[i] + (dt * MOB * (hi - lo)) / DX
    if (spill) out[i] += ((dt * MOB * (4 / w) * f[i] * (1 - f[i])) / CS2) * 0.5
  }
  return out
}

function peakWidth(f: number[]) {
  let m = 0
  for (let i = 0; i < N - 1; i++) m = Math.max(m, Math.abs(f[i + 1] - f[i]) / DX)
  return m > 0 ? 1 / m : 0
}

function totalMass(f: number[]) {
  return f.reduce((a, b) => a + b, 0) * DX
}

export function SharpFluxMomentDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fRef = useRef<number[]>(slabProfile(3))
  const m0Ref = useRef(totalMass(slabProfile(3)))
  const timeRef = useRef(0)
  const histRef = useRef<Array<{ t: number; w: number; m: number }>>([])
  const frameRef = useRef(0)

  const [wInit, setWInit] = useState(3)
  const [wModel, setWModel] = useState(6)
  const [spill, setSpill] = useState(false)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ t: 0, w: 3, m: 1, net: 0 })

  const reset = useCallback(() => {
    const f = slabProfile(wInit)
    fRef.current = f
    m0Ref.current = totalMass(f)
    timeRef.current = 0
    histRef.current = []
    setReadout({ t: 0, w: peakWidth(f), m: 1, net: 0 })
  }, [wInit])

  useEffect(() => {
    reset()
  }, [reset])

  useEffect(() => {
    let raf = 0
    const draw = () => {
      const cv = canvasRef.current
      if (!cv) return
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const Wc = cv.width
      const Hc = cv.height
      ctx.clearRect(0, 0, Wc, Hc)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, Wc, Hc)
      ctx.font = '11px ui-monospace, monospace'

      const f = fRef.current
      const { g, s } = faceTerms(f, wModel)

      // window around the interface
      const lo = Math.round(N * 0.28)
      const hi = Math.round(N * 0.72)
      const xa = 54
      const xb = 430
      const px = (i: number) => xa + ((i - lo) / (hi - lo)) * (xb - xa)

      // ---- top: phi profile
      const pTop = 24
      const pBot = 140
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(xa, pTop)
      ctx.lineTo(xa, pBot)
      ctx.lineTo(xb, pBot)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('phi', xa - 26, pTop + 4)
      ctx.fillText('1', xa - 12, pTop + 10)
      ctx.fillText('0', xa - 12, pBot + 4)
      const target = slabProfile(wModel)
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      for (let i = lo; i <= hi; i++) {
        const y = pBot - target[i] * (pBot - pTop)
        if (i === lo) ctx.moveTo(px(i), y)
        else ctx.lineTo(px(i), y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = lo; i <= hi; i++) {
        const y = pBot - Math.min(1.2, Math.max(-0.2, f[i])) * (pBot - pTop)
        if (i === lo) ctx.moveTo(px(i), y)
        else ctx.lineTo(px(i), y)
      }
      ctx.stroke()
      ctx.fillStyle = '#60a5fa'
      ctx.fillText('phi (live)', xa + 8, pTop + 12)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('dashed: tanh with W_model', xa + 8, pTop + 26)

      // ---- bottom: face fluxes
      const fTop = 168
      const fBot = Hc - 34
      const fMid = (fTop + fBot) / 2
      let fmax = 1e-6
      for (let i = lo; i < hi; i++) fmax = Math.max(fmax, Math.abs(g[i]), Math.abs(s[i]))
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(xa, fTop)
      ctx.lineTo(xa, fBot)
      ctx.moveTo(xa, fMid)
      ctx.lineTo(xb, fMid)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('flux', xa - 30, fTop + 4)
      ctx.fillText('0', xa - 12, fMid + 4)
      ctx.fillText('x [lu]', (xa + xb) / 2 - 16, Hc - 14)
      const curves: Array<[number[], string, number]> = [
        [g, '#34d399', 1],
        [s, '#fbbf24', 1],
        [g.map((v, i) => v - s[i]), '#f87171', 2.4],
      ]
      for (const [arr, color, lw] of curves) {
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.beginPath()
        for (let i = lo; i < hi; i++) {
          const y = fMid - (arr[i] / fmax) * ((fBot - fTop) / 2 - 6)
          if (i === lo) ctx.moveTo(px(i), y)
          else ctx.lineTo(px(i), y)
        }
        ctx.stroke()
      }
      ctx.fillStyle = '#34d399'
      ctx.fillText('diffusive  grad phi', xa + 8, fTop + 12)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('sharpening  (4/W) phi(1-phi) n', xa + 8, fTop + 26)
      ctx.fillStyle = '#f87171'
      ctx.fillText('net  (drives the profile)', xa + 8, fTop + 40)

      // ---- right: width and mass history
      const gx0 = 492
      const gx1 = Wc - 54
      const gTop = 40
      const gBot = Hc - 48
      const tMax = 600
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(gx0, gTop)
      ctx.lineTo(gx0, gBot)
      ctx.lineTo(gx1, gBot)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('W_eff [lu]', gx0 - 6, gTop - 10)
      ctx.fillText('t [steps]', (gx0 + gx1) / 2 - 22, Hc - 28)
      ctx.fillText('0', gx0 - 10, gBot + 4)
      ctx.fillText('12', gx0 - 18, gTop + 4)
      ctx.fillText(String(tMax), gx1 - 14, gBot + 16)
      const sx = (t: number) => gx0 + (Math.min(t, tMax) / tMax) * (gx1 - gx0)
      const syW = (w: number) => gBot - (Math.min(12, Math.max(0, w)) / 12) * (gBot - gTop)
      const syM = (m: number) => gBot - ((Math.min(1.6, Math.max(0.4, m)) - 0.4) / 1.2) * (gBot - gTop)
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(gx0, syW(wModel))
      ctx.lineTo(gx1, syW(wModel))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('W_model', gx1 - 56, syW(wModel) - 5)
      const hist = histRef.current
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      hist.forEach((h, i) => {
        const y = syW(h.w)
        if (i === 0) ctx.moveTo(sx(h.t), y)
        else ctx.lineTo(sx(h.t), y)
      })
      ctx.stroke()
      ctx.strokeStyle = spill ? '#f87171' : '#34d399'
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      hist.forEach((h, i) => {
        const y = syM(h.m)
        if (i === 0) ctx.moveTo(sx(h.t), y)
        else ctx.lineTo(sx(h.t), y)
      })
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#60a5fa'
      ctx.fillText('W_eff', gx0 + 8, gTop + 12)
      ctx.fillStyle = spill ? '#f87171' : '#34d399'
      ctx.fillText('mass / mass0  (0.4 - 1.6)', gx0 + 8, gTop + 26)
    }

    const loop = () => {
      if (running) {
        for (let k = 0; k < 8; k++) {
          fRef.current = advance(fRef.current, wModel, spill, 0.5)
          timeRef.current += 0.5
        }
        const t = timeRef.current
        const h = histRef.current
        if (h.length === 0 || t - h[h.length - 1].t >= 4) {
          h.push({ t, w: peakWidth(fRef.current), m: totalMass(fRef.current) / m0Ref.current })
          if (h.length > 400) h.shift()
        }
        if (t >= 600) setRunning(false)
      }
      draw()
      frameRef.current += 1
      if (frameRef.current % 12 === 0) {
        const { g, s } = faceTerms(fRef.current, wModel)
        let net = 0
        for (let i = 0; i < N - 1; i++) net = Math.max(net, Math.abs(g[i] - s[i]))
        setReadout({
          t: timeRef.current,
          w: peakWidth(fRef.current),
          m: totalMass(fRef.current) / m0Ref.current,
          net,
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, wModel, spill])

  const lab: React.CSSProperties = { fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 140 }

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={canvasRef} width={760} height={330} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <label style={lab}>
          W_init = {wInit.toFixed(1)} lu
          <input type="range" min={1.5} max={10} step={0.5} value={wInit}
            onChange={(e) => setWInit(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={lab}>
          W_model = {wModel.toFixed(1)} lu
          <input type="range" min={2} max={9} step={0.5} value={wModel}
            onChange={(e) => setWModel(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <button onClick={() => setSpill((v) => !v)} style={{ padding: '4px 12px', fontSize: 12 }}>
          source: {spill ? '0th-moment spill' : 'moment-safe'}
        </button>
        <button onClick={() => setRunning((v) => !v)} style={{ padding: '4px 12px', fontSize: 12 }}>
          {running ? 'pause' : 'run'}
        </button>
        <button onClick={reset} style={{ padding: '4px 12px', fontSize: 12 }}>reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        t = {readout.t.toFixed(0)} &nbsp;|&nbsp; W_eff = {readout.w.toFixed(3)} lu &nbsp;|&nbsp;
        max |net flux| = {readout.net.toExponential(2)} &nbsp;|&nbsp;
        <span style={{ color: spill ? '#f87171' : '#34d399' }}>mass / mass0 = {readout.m.toFixed(6)}</span>
      </div>
    </div>
  )
}
