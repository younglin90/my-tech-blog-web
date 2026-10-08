'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const NR = 128
const DR = 0.5
const DOMAIN = NR * DR
const rc = Array.from({ length: NR }, (_, i) => (i + 0.5) * DR)
const rf = Array.from({ length: NR - 1 }, (_, i) => (i + 1) * DR)

type Hist = { t: number; rk: number; rc: number; mk: number; mc: number }

function tanhDisk(r0: number, w: number) {
  return rc.map((r) => 0.5 * (1 - Math.tanh((2 * (r - r0)) / w)))
}

function diskMass(f: number[]) {
  let s = 0
  for (let i = 0; i < NR; i++) s += rc[i] * f[i]
  return s * DR
}

function diskRadius(f: number[]) {
  return Math.sqrt(Math.max(0, 2 * diskMass(f)))
}

function fluxDiv(F: number[]) {
  const out = new Array<number>(NR)
  for (let i = 0; i < NR; i++) {
    const lo = i > 0 ? rf[i - 1] * F[i - 1] : 0
    const hi = i < NR - 1 ? rf[i] * F[i] : 0
    out[i] = (hi - lo) / (rc[i] * DR)
  }
  return out
}

function stepClassical(f: number[], w: number, m: number, dt: number) {
  const g = new Array<number>(NR - 1)
  for (let i = 0; i < NR - 1; i++) g[i] = (f[i + 1] - f[i]) / DR
  const lap = fluxDiv(g)
  const out = new Array<number>(NR)
  for (let i = 0; i < NR; i++) {
    const v = f[i]
    const well = ((16 / (w * w)) * v * (1 - v) * (1 - 2 * v))
    out[i] = v + dt * m * (lap[i] - well)
  }
  return out
}

function stepConservative(f: number[], w: number, m: number, dt: number) {
  const F = new Array<number>(NR - 1)
  for (let i = 0; i < NR - 1; i++) {
    const g = (f[i + 1] - f[i]) / DR
    const pf = 0.5 * (f[i] + f[i + 1])
    F[i] = g - ((4 / w) * pf * (1 - pf) * g) / (Math.abs(g) + 1e-12)
  }
  const div = fluxDiv(F)
  const out = new Array<number>(NR)
  for (let i = 0; i < NR; i++) out[i] = f[i] + dt * m * div[i]
  return out
}

export function CurvatureMeltDropletLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const classicRef = useRef<number[]>(tanhDisk(20, 4))
  const consRef = useRef<number[]>(tanhDisk(20, 4))
  const histRef = useRef<Hist[]>([])
  const timeRef = useRef(0)
  const m0Ref = useRef(diskMass(tanhDisk(20, 4)))
  const frameRef = useRef(0)

  const [r0, setR0] = useState(20)
  const [width, setWidth] = useState(4)
  const [mob, setMob] = useState(0.05)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ t: 0, rk: 20, rcv: 20, mk: 1, mc: 1 })

  const reset = useCallback(() => {
    const f = tanhDisk(r0, width)
    classicRef.current = f.slice()
    consRef.current = f.slice()
    m0Ref.current = diskMass(f)
    timeRef.current = 0
    histRef.current = []
    setReadout({ t: 0, rk: diskRadius(f), rcv: diskRadius(f), mk: 1, mc: 1 })
  }, [r0, width])

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

      const fk = classicRef.current
      const fc = consRef.current

      // ---- left panel: droplet, left half = classical, right half = conservative
      const cx = 170
      const cy = Hc / 2
      const px = 148 / DOMAIN
      for (let p = 148; p >= 1; p--) {
        const r = p / px
        const idx = Math.min(NR - 1, Math.max(0, Math.round(r / DR - 0.5)))
        const a1 = Math.min(1, Math.max(0, fk[idx]))
        const a2 = Math.min(1, Math.max(0, fc[idx]))
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.strokeStyle = `rgba(248,113,113,${a1.toFixed(3)})`
        ctx.arc(cx, cy, p, Math.PI / 2, (3 * Math.PI) / 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.strokeStyle = `rgba(96,165,250,${a2.toFixed(3)})`
        ctx.arc(cx, cy, p, -Math.PI / 2, Math.PI / 2)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, 12)
      ctx.lineTo(cx, Hc - 12)
      ctx.stroke()
      // initial radius reference ring
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      ctx.arc(cx, cy, r0 * px, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f87171'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('classical AC', 24, 20)
      ctx.fillStyle = '#60a5fa'
      ctx.fillText('conservative AC', cx + 12, 20)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText('dashed = initial R', 24, Hc - 10)

      // ---- right panel: R(t) and mass(t)
      const x0 = 370
      const x1 = Wc - 54
      const yTop = 26
      const yBot = Hc - 34
      const tMax = 2000
      const rMax = Math.max(26, r0 * 1.25)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(x0, yTop)
      ctx.lineTo(x0, yBot)
      ctx.lineTo(x1, yBot)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('R [lu]', x0 - 34, yTop + 4)
      ctx.fillText('m/m0', x1 + 6, yTop + 4)
      ctx.fillText('t [steps]', (x0 + x1) / 2 - 24, Hc - 14)
      ctx.fillText('0', x0 - 10, yBot + 4)
      ctx.fillText(rMax.toFixed(0), x0 - 22, yTop + 14)
      ctx.fillText(tMax.toFixed(0), x1 - 16, yBot + 16)

      const sx = (t: number) => x0 + (Math.min(t, tMax) / tMax) * (x1 - x0)
      const syR = (r: number) => yBot - (Math.min(r, rMax) / rMax) * (yBot - yTop)
      const syM = (m: number) => yBot - Math.min(1, Math.max(0, m)) * (yBot - yTop)

      const hist = histRef.current
      const lines: Array<[keyof Hist, string, boolean]> = [
        ['rk', '#f87171', false],
        ['rc', '#60a5fa', false],
        ['mk', '#fbbf24', true],
        ['mc', '#34d399', true],
      ]
      for (const [key, color, isMass] of lines) {
        ctx.strokeStyle = color
        ctx.lineWidth = 1.8
        if (isMass) ctx.setLineDash([5, 3])
        ctx.beginPath()
        hist.forEach((h, i) => {
          const y = isMass ? syM(h[key]) : syR(h[key])
          if (i === 0) ctx.moveTo(sx(h.t), y)
          else ctx.lineTo(sx(h.t), y)
        })
        ctx.stroke()
        ctx.setLineDash([])
      }
      // analytic curvature law R^2 = R0^2 - 2 M t
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.setLineDash([2, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let t = 0; t <= tMax; t += 20) {
        const v = r0 * r0 - 2 * mob * t
        if (v <= 0) break
        const y = syR(Math.sqrt(v))
        if (t === 0) ctx.moveTo(sx(t), y)
        else ctx.lineTo(sx(t), y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = '#f87171'
      ctx.fillText('R classical', x0 + 8, yTop + 18)
      ctx.fillStyle = '#60a5fa'
      ctx.fillText('R conservative', x0 + 8, yTop + 32)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('mass classical', x0 + 8, yTop + 46)
      ctx.fillStyle = '#34d399'
      ctx.fillText('mass conservative', x0 + 8, yTop + 60)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText('dotted: sqrt(R0^2 - 2Mt)', x0 + 8, yTop + 74)
    }

    const loop = () => {
      if (running) {
        for (let k = 0; k < 10; k++) {
          classicRef.current = stepClassical(classicRef.current, width, mob, 0.5)
          consRef.current = stepConservative(consRef.current, width, mob, 0.5)
          timeRef.current += 0.5
        }
        const t = timeRef.current
        const h = histRef.current
        if (h.length === 0 || t - h[h.length - 1].t >= 10) {
          h.push({
            t,
            rk: diskRadius(classicRef.current),
            rc: diskRadius(consRef.current),
            mk: diskMass(classicRef.current) / m0Ref.current,
            mc: diskMass(consRef.current) / m0Ref.current,
          })
          if (h.length > 400) h.shift()
        }
        if (t >= 2000) setRunning(false)
      }
      draw()
      frameRef.current += 1
      if (frameRef.current % 12 === 0) {
        setReadout({
          t: timeRef.current,
          rk: diskRadius(classicRef.current),
          rcv: diskRadius(consRef.current),
          mk: diskMass(classicRef.current) / m0Ref.current,
          mc: diskMass(consRef.current) / m0Ref.current,
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, width, mob, r0])

  const row: React.CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }
  const lab: React.CSSProperties = { fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 132 }

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={canvasRef} width={760} height={330} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ ...row, marginTop: 12 }}>
        <label style={lab}>
          R0 = {r0} lu
          <input type="range" min={10} max={30} step={1} value={r0}
            onChange={(e) => setR0(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={lab}>
          W = {width.toFixed(1)} lu
          <input type="range" min={2} max={8} step={0.5} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={lab}>
          M = {mob.toFixed(3)}
          <input type="range" min={0.01} max={0.1} step={0.005} value={mob}
            onChange={(e) => setMob(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <button onClick={() => setRunning((v) => !v)} style={{ padding: '4px 12px', fontSize: 12 }}>
          {running ? 'pause' : 'run'}
        </button>
        <button onClick={reset} style={{ padding: '4px 12px', fontSize: 12 }}>reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        t = {readout.t.toFixed(0)} &nbsp;|&nbsp;
        <span style={{ color: '#f87171' }}>classical R = {readout.rk.toFixed(3)}, m/m0 = {readout.mk.toFixed(4)}</span>
        &nbsp;|&nbsp;
        <span style={{ color: '#60a5fa' }}>conservative R = {readout.rcv.toFixed(3)}, m/m0 = {readout.mc.toFixed(9)}</span>
      </div>
    </div>
  )
}
