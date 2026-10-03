'use client'

import { useEffect, useRef, useState } from 'react'

const MODES = 10 // modal basis functions per direction
const OMEGA = 0.8 // damped-Jacobi relaxation weight
const RW = 192 // raster width  (error field is drawn continuously)
const RH = 96
const TOL = 1e-8

type Method = 'jacobi' | 'mgFixed' | 'mgGrown'

const METHODS: { id: Method; label: string; colour: string }[] = [
  { id: 'jacobi', label: 'point Jacobi (1 level)', colour: '#f87171' },
  { id: 'mgFixed', label: 'multigrid, 3 levels fixed', colour: '#fbbf24' },
  { id: 'mgGrown', label: 'multigrid, levels grown', colour: '#34d399' },
]

function levelsOf(method: Method, k: number) {
  if (method === 'jacobi') return 1
  if (method === 'mgFixed') return 3
  return k + 3 // coarsest grid stays 8 x 4 cells
}

/** per-cycle amplification of one Fourier mode, seen through the hierarchy */
function cycleFactor(thx: number, thy: number, levels: number) {
  const s = Math.pow(2, levels - 1)
  const cx = Math.min(thx * s, Math.PI)
  const cy = Math.min(thy * s, Math.PI)
  const lam = 4 - 2 * Math.cos(cx) - 2 * Math.cos(cy)
  const g = Math.abs(1 - (OMEGA * lam) / 4)
  return levels === 1 ? g : Math.max(0.08, Math.pow(g, 6))
}

function initialAmps() {
  const a = new Float64Array(MODES * MODES)
  for (let i = 1; i <= MODES; i++) {
    for (let j = 1; j <= MODES; j++) {
      const sign = ((i * 7 + j * 13) % 5) - 2
      a[(i - 1) * MODES + (j - 1)] = sign / (1 + 0.35 * (i + j))
    }
  }
  return a
}

export function WeakScalingTreadmillLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [k, setK] = useState(1)
  const [method, setMethod] = useState<Method>('jacobi')
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [readout, setReadout] = useState({ sweeps: 0, res: 1, done: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ny = 32 * Math.pow(2, k)
    const nx = 2 * ny
    const levels = levelsOf(method, k)

    // mode tables -------------------------------------------------------
    const amps = initialAmps()
    const lam = new Float64Array(MODES * MODES)
    const fac = new Float64Array(MODES * MODES)
    for (let i = 1; i <= MODES; i++) {
      for (let j = 1; j <= MODES; j++) {
        const thx = (Math.PI * i) / nx
        const thy = (Math.PI * j) / ny
        const m = (i - 1) * MODES + (j - 1)
        lam[m] = 4 - 2 * Math.cos(thx) - 2 * Math.cos(thy)
        fac[m] = cycleFactor(thx, thy, levels)
      }
    }
    // Dirichlet in x -> sin ;  no-flow in y -> cos
    const phi = new Float64Array(MODES * RW)
    const psi = new Float64Array(MODES * RH)
    for (let i = 1; i <= MODES; i++)
      for (let px = 0; px < RW; px++) phi[(i - 1) * RW + px] = Math.sin((Math.PI * i * (px + 0.5)) / RW)
    for (let j = 1; j <= MODES; j++)
      for (let py = 0; py < RH; py++) psi[(j - 1) * RH + py] = Math.cos((Math.PI * j * (py + 0.5)) / RH)

    const resOf = () => {
      let s = 0
      for (let m = 0; m < lam.length; m++) s += (lam[m] * amps[m]) ** 2
      return Math.sqrt(s)
    }
    const res0 = resOf()

    // slowest mode fixes the budget, so the animation always finishes
    const slowest = Math.max(...Array.from(fac))
    const total = Math.max(1, Math.ceil(Math.log(TOL) / Math.log(Math.min(slowest, 0.999999))))
    const batch = Math.max(1, Math.round(total / 800))

    const img = ctx.createImageData(RW, RH)
    const off = document.createElement('canvas')
    off.width = RW
    off.height = RH
    const offCtx = off.getContext('2d')!
    const field = new Float64Array(RW * RH)
    const colBuf = new Float64Array(MODES * RW)
    const history: number[] = [1]
    let sweeps = 0
    let frame = 0
    let raf = 0

    const paint = () => {
      // field = sum_ij a_ij phi_i(x) psi_j(y)   (separable, cheap)
      for (let j = 0; j < MODES; j++) {
        for (let px = 0; px < RW; px++) {
          let s = 0
          for (let i = 0; i < MODES; i++) s += amps[i * MODES + j] * phi[i * RW + px]
          colBuf[j * RW + px] = s
        }
      }
      let peak = 1e-30
      for (let py = 0; py < RH; py++) {
        for (let px = 0; px < RW; px++) {
          let s = 0
          for (let j = 0; j < MODES; j++) s += colBuf[j * RW + px] * psi[j * RH + py]
          field[py * RW + px] = s
          if (Math.abs(s) > peak) peak = Math.abs(s)
        }
      }
      for (let p = 0; p < RW * RH; p++) {
        const v = Math.max(-1, Math.min(1, field[p] / peak))
        const o = p * 4
        img.data[o] = v > 0 ? 20 + 235 * v : 20
        img.data[o + 1] = 25 + 90 * (1 - Math.abs(v))
        img.data[o + 2] = v < 0 ? 40 + 215 * -v : 35
        img.data[o + 3] = 255
      }
    }

    const draw = () => {
      if (running && history[history.length - 1] > TOL) {
        for (let m = 0; m < amps.length; m++) amps[m] *= Math.pow(fac[m], batch)
        sweeps += batch
        history.push(Math.max(1e-12, resOf() / res0))
        if (history.length > 1200) history.splice(0, 1)
      }
      paint()

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'

      // ---- left panel: error field over the doublet aquifer ------------
      const fx = 46
      const fy = 34
      const fw = 330
      const fh = 165
      ctx.imageSmoothingEnabled = true
      offCtx.putImageData(img, 0, 0)
      ctx.drawImage(off, fx, fy, fw, fh)
      ctx.strokeStyle = '#475569'
      ctx.strokeRect(fx, fy, fw, fh)
      // process decomposition: p = 4^k subdomains
      const pSide = Math.pow(2, k)
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      for (let i = 1; i < 2 * pSide; i++) {
        ctx.beginPath()
        ctx.moveTo(fx + (fw * i) / (2 * pSide), fy)
        ctx.lineTo(fx + (fw * i) / (2 * pSide), fy + fh)
        ctx.stroke()
      }
      for (let i = 1; i < pSide; i++) {
        ctx.beginPath()
        ctx.moveTo(fx, fy + (fh * i) / pSide)
        ctx.lineTo(fx + fw, fy + (fh * i) / pSide)
        ctx.stroke()
      }
      // wells
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(fx + fw * 0.3, fy + fh * 0.5, 4, 0, 7)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(fx + fw * 0.7, fy + fh * 0.5, 4, 0, 7)
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('inject', fx + fw * 0.3 - 16, fy + fh * 0.5 - 8)
      ctx.fillText('extract', fx + fw * 0.7 - 18, fy + fh * 0.5 - 8)
      ctx.fillText('error field  (blue − / orange +, rescaled each frame)', fx, fy - 8)
      ctx.fillText('x  0 → 5000 m', fx + fw - 92, fy + fh + 15)
      ctx.save()
      ctx.translate(fx - 10, fy + fh)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('y  0 → 2500 m', 0, 0)
      ctx.restore()
      ctx.fillText(`${2 * pSide}×${pSide} = ${Math.pow(4, k)} subdomains`, fx, fy + fh + 30)

      // ---- right panel: residual history (semi-log) --------------------
      const gx = 430
      const gy = 34
      const gw = 240
      const gh = 165
      ctx.strokeStyle = '#334155'
      ctx.strokeRect(gx, gy, gw, gh)
      const Y = (r: number) => gy + gh * (Math.log10(Math.max(r, 1e-10)) / -10)
      ctx.strokeStyle = '#64748b'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(gx, Y(TOL))
      ctx.lineTo(gx + gw, Y(TOL))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#64748b'
      ctx.fillText('rtol 1e-8', gx + gw - 60, Y(TOL) - 4)
      for (let e = 0; e >= -10; e -= 2) {
        ctx.fillStyle = '#64748b'
        ctx.fillText(`1e${e}`, gx - 32, Y(Math.pow(10, e)) + 4)
      }
      const colour = METHODS.find((m) => m.id === method)!.colour
      ctx.strokeStyle = colour
      ctx.lineWidth = 1.6
      ctx.beginPath()
      history.forEach((r, i) => {
        const X = gx + (gw * i) / Math.max(1, history.length - 1)
        i === 0 ? ctx.moveTo(X, Y(r)) : ctx.lineTo(X, Y(r))
      })
      ctx.stroke()
      ctx.lineWidth = 1
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('relative residual  vs  sweeps', gx, gy - 8)

      // ---- status line -------------------------------------------------
      const r = history[history.length - 1]
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(
        `levels ${levels}   coarsest ${Math.round(nx / Math.pow(2, levels - 1))}×${Math.round(
          ny / Math.pow(2, levels - 1),
        )}   sweeps ${sweeps.toLocaleString()}   residual ${r.toExponential(2)}${
          r <= TOL ? '   ✓ converged' : ''
        }`,
        fx,
        gy + gh + 48,
      )
      ctx.fillStyle = colour
      ctx.fillText(METHODS.find((m) => m.id === method)!.label, fx, gy + gh + 66)

      frame++
      if (frame % 12 === 0) setReadout({ sweeps, res: r, done: r <= TOL })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [k, method, running, resetKey])

  const ny = 32 * Math.pow(2, k)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <canvas
        ref={canvasRef}
        width={700}
        height={310}
        style={{ width: '100%', maxWidth: 700, borderRadius: 8, background: '#0b1220' }}
      />
      <div style={{ fontSize: 12 }}>
        <label>
          refinement: {Math.pow(4, k)} processes, {2 * ny}&times;{ny} grid, {(2 * ny * ny) / Math.pow(4, k)} cells per
          process
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={k}
            onChange={(e) => {
              setK(+e.target.value)
              setResetKey((v) => v + 1)
            }}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMethod(m.id)
              setResetKey((v) => v + 1)
            }}
            style={{
              padding: '4px 9px',
              fontSize: 12,
              borderRadius: 6,
              cursor: 'pointer',
              border: `1px solid ${method === m.id ? m.colour : '#475569'}`,
              background: method === m.id ? 'rgba(148,163,184,0.15)' : 'transparent',
              color: method === m.id ? m.colour : '#94a3b8',
            }}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setRunning((v) => !v)}
          style={{
            padding: '4px 9px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #475569',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          {running ? 'pause' : 'play'}
        </button>
        <button
          onClick={() => setResetKey((v) => v + 1)}
          style={{
            padding: '4px 9px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #475569',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          reset
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        sweeps to reach 1e-8: {readout.done ? readout.sweeps.toLocaleString() : `${readout.sweeps.toLocaleString()} and counting`}
      </div>
    </div>
  )
}
