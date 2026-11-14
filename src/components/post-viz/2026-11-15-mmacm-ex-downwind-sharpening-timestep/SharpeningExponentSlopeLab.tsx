'use client'

import { useEffect, useRef, useState } from 'react'

// Concept: H(r) = 1 - ((1-r)/(1+r))^p blends the upwind face value toward the
// downwind cell. Near r -> 0 it behaves like 2p*r, which sets dt < dx / ((2p+1) u).

const W = 680
const H = 300
const N = 24

function Hfun(r: number, p: number) {
  const a = Math.abs(r)
  return 1 - Math.pow((1 - a) / (1 + a), p)
}

export function SharpeningExponentSlopeLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [p, setP] = useState(4)
  const [width, setWidth] = useState(3)
  const [playing, setPlaying] = useState(true)
  const [readout, setReadout] = useState({ cell: 0, r: 0, h: 0 })
  const stateRef = useRef({ shift: 0, p: 4, width: 3, playing: true })

  useEffect(() => {
    stateRef.current.p = p
    stateRef.current.width = width
    stateRef.current.playing = playing
  }, [p, width, playing])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.scale(dpr, dpr)
    let raf = 0
    let frame = 0

    const draw = () => {
      const s = stateRef.current
      if (s.playing) s.shift += 0.012
      if (s.shift > 4) s.shift -= 8
      frame++
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px system-ui, sans-serif'

      // ---------- left: profile with per-cell H bars ----------
      const lx = 40, ly = 20, lw = 360, lh = 200
      const cw = lw / N
      const center = N / 2 + s.shift
      const alpha: number[] = []
      for (let i = 0; i < N; i++) {
        const x = i + 0.5
        alpha.push(0.5 * (1 - Math.tanh((x - center) / Math.max(0.15, s.width * 0.5))))
      }
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(lx, ly, lw, lh)
      let probe = { cell: 0, r: 0, h: 0, best: -1 }
      for (let i = 1; i < N - 1; i++) {
        const dm = alpha[i] - alpha[i - 1]
        const dp = alpha[i + 1] - alpha[i]
        const r = Math.abs(dp) > 1e-12 ? dm / dp : 0
        const iface = alpha[i] > 1e-4 && alpha[i] < 1 - 1e-4 && dm * dp > 0
        const h = iface ? Hfun(r, s.p) : 0
        // alpha bar
        ctx.fillStyle = 'rgba(56,132,255,0.55)'
        const ah = alpha[i] * lh
        ctx.fillRect(lx + i * cw + 1, ly + lh - ah, cw - 2, ah)
        // H strip
        ctx.fillStyle = `rgba(255,120,40,${0.15 + 0.85 * h})`
        ctx.fillRect(lx + i * cw + 1, ly + lh + 8, cw - 2, 14)
        // downwind arrow strength at face i+1/2
        if (h > 0.02) {
          const ax = lx + (i + 1) * cw
          const ay = ly + lh - alpha[i] * lh
          ctx.strokeStyle = 'rgba(255,120,40,0.95)'
          ctx.lineWidth = 1 + 3 * h
          ctx.beginPath()
          ctx.moveTo(ax - cw * 0.4, ay)
          ctx.lineTo(ax + cw * 0.2, ay + (alpha[i + 1] - alpha[i]) * lh * h * -1)
          ctx.stroke()
          ctx.lineWidth = 1
        }
        const score = iface ? Math.abs(alpha[i] - 0.15) : 9
        if (iface && (probe.best < 0 || score < probe.best)) probe = { cell: i, r, h, best: score }
      }
      ctx.fillStyle = 'rgba(128,128,128,0.9)'
      ctx.fillText('alpha (blue) and H per cell (orange strip)  →  u > 0', lx, ly - 6)
      ctx.fillText('1', lx - 12, ly + 8)
      ctx.fillText('0', lx - 12, ly + lh)
      if (probe.best >= 0) {
        ctx.strokeStyle = 'rgba(220,40,80,0.9)'
        ctx.strokeRect(lx + probe.cell * cw, ly, cw, lh + 22)
      }

      // ---------- right: H(r) curve ----------
      const rx = 450, ry = 20, rw = 210, rh = 200
      const rmax = 3
      const X = (r: number) => rx + (r / rmax) * rw
      const Y = (h: number) => ry + rh - (h / 1.05) * rh
      ctx.strokeStyle = 'rgba(128,128,128,0.5)'
      ctx.strokeRect(rx, ry, rw, rh)
      // TVD-ish bound min(2r, 1) dotted
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = 'rgba(128,128,128,0.8)'
      ctx.beginPath()
      ctx.moveTo(X(0), Y(0))
      ctx.lineTo(X(0.5), Y(1))
      ctx.lineTo(X(rmax), Y(1))
      ctx.stroke()
      // slope 2p line
      ctx.strokeStyle = 'rgba(220,40,80,0.7)'
      ctx.beginPath()
      ctx.moveTo(X(0), Y(0))
      const rEnd = Math.min(rmax, 1.05 / (2 * s.p))
      ctx.lineTo(X(rEnd), Y(2 * s.p * rEnd))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(255,120,40,1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k <= 200; k++) {
        const r = (k / 200) * rmax
        const y = Y(Hfun(r, s.p))
        if (k === 0) ctx.moveTo(X(r), y)
        else ctx.lineTo(X(r), y)
      }
      ctx.stroke()
      ctx.lineWidth = 1
      if (probe.best >= 0) {
        const pr = Math.min(rmax, Math.abs(probe.r))
        ctx.fillStyle = 'rgba(220,40,80,1)'
        ctx.beginPath()
        ctx.arc(X(pr), Y(probe.h), 5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(128,128,128,0.9)'
      ctx.fillText('H(r)', rx + 4, ry + 12)
      ctx.fillText('r', rx + rw - 8, ry + rh + 14)
      ctx.fillText('0', rx - 2, ry + rh + 14)
      ctx.fillText('1', X(1) - 3, ry + rh + 14)
      ctx.fillText('3', X(3) - 6, ry + rh + 14)
      ctx.fillStyle = 'rgba(220,40,80,0.9)'
      ctx.fillText(`slope ${2 * s.p} near r=0`, rx + 30, ry + rh - 10)

      // bottom text
      ctx.fillStyle = 'rgba(128,128,128,1)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(
        `exponent p = ${s.p}   →   H ≈ ${2 * s.p}·r   →   sufficient bound  u·dt/dx < 1/${2 * s.p + 1} = ${(1 / (2 * s.p + 1)).toFixed(3)}`,
        lx,
        H - 30,
      )

      if (frame % 12 === 0 && probe.best >= 0) setReadout({ cell: probe.cell, r: probe.r, h: probe.h })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const reset = () => {
    stateRef.current.shift = 0
    setP(4)
    setWidth(3)
  }

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-36">exponent p: {p}</span>
          <input type="range" min={1} max={8} step={1} value={p} onChange={(e) => setP(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-36">interface width: {width.toFixed(1)} cells</span>
          <input type="range" min={0.5} max={8} step={0.1} value={width} onChange={(e) => setWidth(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={reset}>
          Reset
        </button>
        <span className="font-mono">
          probe cell {readout.cell}: r = {readout.r.toFixed(3)}, H = {readout.h.toFixed(3)}, 2p·r = {(2 * p * Math.abs(readout.r)).toFixed(3)}
        </span>
      </div>
    </div>
  )
}

export default SharpeningExponentSlopeLab
