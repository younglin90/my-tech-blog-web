'use client'

import { useEffect, useRef, useState } from 'react'

// Concept: insulation around a wire adds a conduction resistance ln(r_o/r_i)/(2 pi k)
// but shrinks the convection resistance 1/(2 pi r_o h). Their sum has a MINIMUM at r_o = k/h,
// so heat loss q' = dT / R'_tot has a MAXIMUM there. Particles leave the wire at a rate ~ q'.

const W = 680
const H = 360
const RI = 0.005
const DT_K = 75
const RMAX = 0.06

function parts(ro: number, k: number, h: number) {
  const rc = Math.log(ro / RI) / (2 * Math.PI * k)
  const rv = 1 / (2 * Math.PI * ro * h)
  return { rc, rv, rt: rc + rv, q: DT_K / (rc + rv) }
}

type P = { a: number; r: number; v: number }

export function CriticalRadiusResistanceLab() {
  const [roMm, setRoMm] = useState(11)
  const [k, setK] = useState(0.055)
  const [h, setH] = useState(5)
  const [playing, setPlaying] = useState(true)
  const run = useRef(true)
  run.current = playing
  const ref = useRef<HTMLCanvasElement>(null)
  const prm = useRef({ ro: 0.011, k: 0.055, h: 5 })
  prm.current = { ro: roMm / 1000, k, h }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const ps: P[] = []
    let acc = 0
    let raf = 0
    const cx = 170
    const cy = H / 2
    const scale = 2300 // px per metre for the cross-section

    const draw = () => {
      const { ro, k, h } = prm.current
      const cur = parts(ro, k, h)
      const bare = parts(RI, k, h)
      // spawn particles at a rate proportional to q'
      if (run.current) acc += cur.q * 0.06
      while (acc >= 1) {
        acc -= 1
        ps.push({ a: Math.random() * Math.PI * 2, r: RI, v: 0 })
      }
      ctx.clearRect(0, 0, W, H)
      // ---- cross-section ----
      const rPx = Math.min(ro * scale, 150)
      const s = rPx / (ro * scale)
      ctx.fillStyle = 'rgba(120,170,230,0.10)'
      ctx.fillRect(0, 0, 340, H)
      ctx.beginPath()
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(240,200,90,0.55)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, RI * scale * s, 0, Math.PI * 2)
      ctx.fillStyle = 'rgb(200,110,50)'
      ctx.fill()
      // particles: slow inside insulation (conduction), then carried off by air
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        if (run.current) p.r += p.r < ro ? (0.00004 * k) / 0.055 / (p.r / RI) + 0.000012 : 0.00006 * (h / 5) + 0.00002
        const px = cx + Math.cos(p.a) * p.r * scale * s
        const py = cy + Math.sin(p.a) * p.r * scale * s
        if (px < -5 || px > 345 || py < -5 || py > H + 5) {
          ps.splice(i, 1)
          continue
        }
        ctx.fillStyle = p.r < ro ? 'rgb(220,80,40)' : 'rgb(230,120,60)'
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3)
      }
      if (ps.length > 900) ps.splice(0, ps.length - 900)
      ctx.fillStyle = 'rgb(130,130,130)'
      ctx.font = '12px sans-serif'
      ctx.fillText('wire r_i = 5 mm, 100 °C', 10, 18)
      ctx.fillText(`insulation r_o = ${(ro * 1000).toFixed(1)} mm`, 10, 34)
      ctx.fillText('air 25 °C', 10, H - 10)
      if (rPx >= 150) ctx.fillText('(drawing scaled)', 230, H - 10)
      // ---- R'(r_o) plot ----
      const x0 = 400
      const x1 = W - 15
      const y0 = H - 40
      const y1 = 25
      const rMaxR = 8
      const X = (r: number) => x0 + ((r - RI) / (RMAX - RI)) * (x1 - x0)
      const Y = (v: number) => y0 - (Math.min(v, rMaxR) / rMaxR) * (y0 - y1)
      ctx.strokeStyle = 'rgb(150,150,150)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x0, y1)
      ctx.lineTo(x0, y0)
      ctx.lineTo(x1, y0)
      ctx.stroke()
      const curves: [keyof ReturnType<typeof parts>, string][] = [
        ['rc', 'rgb(200,140,40)'],
        ['rv', 'rgb(60,140,210)'],
        ['rt', 'rgb(200,60,60)'],
      ]
      for (const [key, col] of curves) {
        ctx.strokeStyle = col
        ctx.lineWidth = key === 'rt' ? 2.5 : 1.5
        ctx.beginPath()
        for (let j = 0; j <= 200; j++) {
          const r = RI + ((RMAX - RI) * j) / 200
          const v = parts(r, k, h)[key]
          if (j === 0) ctx.moveTo(X(r), Y(v))
          else ctx.lineTo(X(r), Y(v))
        }
        ctx.stroke()
      }
      // critical radius and bare-wire level
      const rcr = k / h
      if (rcr > RI && rcr < RMAX) {
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = 'rgb(200,60,60)'
        ctx.beginPath()
        ctx.moveTo(X(rcr), y1)
        ctx.lineTo(X(rcr), y0)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgb(200,60,60)'
        ctx.fillText(`r_cr = k/h = ${(rcr * 1000).toFixed(1)} mm`, Math.min(X(rcr) + 4, x1 - 130), y1 + 12)
      }
      ctx.setLineDash([2, 3])
      ctx.strokeStyle = 'rgb(130,130,130)'
      ctx.beginPath()
      ctx.moveTo(x0, Y(bare.rt))
      ctx.lineTo(x1, Y(bare.rt))
      ctx.stroke()
      ctx.setLineDash([])
      // current point
      ctx.fillStyle = 'rgb(200,60,60)'
      ctx.beginPath()
      ctx.arc(X(ro), Y(cur.rt), 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgb(130,130,130)'
      ctx.fillText("R' [m·K/W]", x0 + 4, y1 - 8)
      ctx.fillText('r_o [mm] →', x1 - 70, y0 + 28)
      for (const t of [5, 20, 40, 60]) ctx.fillText(String(t), X(t / 1000) - 6, y0 + 14)
      ctx.fillText('bare wire R\'', x1 - 75, Y(bare.rt) - 4)
      ctx.fillStyle = 'rgb(200,140,40)'
      ctx.fillText('conduction ln(r_o/r_i)/2πk', x0 + 10, y0 - 46)
      ctx.fillStyle = 'rgb(60,140,210)'
      ctx.fillText('convection 1/2πr_o h', x0 + 10, y0 - 30)
      ctx.fillStyle = 'rgb(200,60,60)'
      ctx.fillText('total', x0 + 10, y0 - 14)
      // readout
      const gain = (cur.q / bare.q - 1) * 100
      ctx.font = 'bold 13px sans-serif'
      ctx.fillStyle = gain > 0 ? 'rgb(210,60,50)' : 'rgb(40,150,90)'
      ctx.fillText(`q' = ${cur.q.toFixed(2)} W/m  (${gain >= 0 ? '+' : ''}${gain.toFixed(1)}% vs bare)`, 10, 54)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const cur = parts(roMm / 1000, k, h)
  const bare = parts(RI, k, h)
  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={ref} width={W} height={H} className="w-full" style={{ maxWidth: W }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="w-28">r_o: {roMm.toFixed(1)} mm</span>
          <input type="range" min={5} max={60} step={0.5} value={roMm} onChange={(e) => setRoMm(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">k: {k.toFixed(3)} W/mK</span>
          <input type="range" min={0.02} max={0.2} step={0.005} value={k} onChange={(e) => setK(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">h: {h} W/m²K</span>
          <input type="range" min={2} max={50} step={1} value={h} onChange={(e) => setH(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setRoMm(Math.min(60, Math.max(5, Math.round((k / h) * 2000) / 2)))}>
          Jump to r_cr
        </button>
        <button
          className="rounded border px-3 py-1"
          onClick={() => {
            setRoMm(11)
            setK(0.055)
            setH(5)
          }}
        >
          Reset
        </button>
      </div>
      <p className="mt-2 font-mono text-xs">
        R&apos;_cond = {cur.rc.toFixed(3)} · R&apos;_conv = {cur.rv.toFixed(3)} · R&apos;_tot = {cur.rt.toFixed(3)} m·K/W · bare R&apos; ={' '}
        {bare.rt.toFixed(3)} · r_cr = {((k / h) * 1000).toFixed(1)} mm
      </p>
    </div>
  )
}
