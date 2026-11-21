'use client'

import { useEffect, useRef, useState } from 'react'

// One implicit step of the acoustic part, linearized, momentum switched off (pure density mode).
// Newton (true implicit):   G_N = 1 / (1 + nu^2 s^2)
// Jin-Xin relaxed implicit: G_R = 1 - (c/a)^2 * z / (1 + z),  z = (a/c)^2 nu^2 s^2
// with nu = c dt / dx and s = 2 sin(theta/2). At a = c both are identical.
// Right panel: a density pulse evolved mode by mode with G^n (with 1e-6 round-off noise).

const W = 680
const H = 330
const N = 100
const MODES = N / 2

function gains(theta: number, r: number, nu: number) {
  const s2 = (2 * Math.sin(theta / 2)) ** 2
  const gN = 1 / (1 + nu * nu * s2)
  const z = r * r * nu * nu * s2
  const gR = 1 - (1 / (r * r)) * (z / (1 + z))
  return { gN, gR }
}

type Spec = { re: Float64Array; im: Float64Array }

function initSpec(): Spec {
  const re = new Float64Array(MODES + 1)
  const im = new Float64Array(MODES + 1)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    const v = 0.2 * Math.exp(-(((x - 0.5) / 0.05) ** 2)) + 1e-6 * Math.sin(12.9898 * i * i)
    for (let k = 0; k <= MODES; k++) {
      re[k] += v * Math.cos((2 * Math.PI * k * i) / N)
      im[k] -= v * Math.sin((2 * Math.PI * k * i) / N)
    }
  }
  return { re, im }
}

function synth(spec: Spec, g: Float64Array, n: number) {
  const out = new Float64Array(N)
  for (let k = 0; k <= MODES; k++) {
    const amp = Math.pow(g[k], n)
    const w = k === 0 || k === MODES ? 1 / N : 2 / N
    const a = spec.re[k] * amp * w
    const b = spec.im[k] * amp * w
    for (let i = 0; i < N; i++) {
      const ph = (2 * Math.PI * k * i) / N
      out[i] += a * Math.cos(ph) - b * Math.sin(ph)
    }
  }
  return out
}

export function RelaxedImplicitAmplificationLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ratio, setRatio] = useState(1)
  const [nu, setNu] = useState(18)
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [info, setInfo] = useState({ n: 0, ampN: 0.2, ampR: 0.2, gPi: 0, dead: false })
  const st = useRef({ n: 0, stepOnce: false, spec: initSpec() })

  useEffect(() => {
    st.current.n = 0
    setPlaying(false)
  }, [ratio, nu, resetKey])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const dark = document.documentElement.classList.contains('dark')
    const fg = dark ? 'rgba(230,230,230,0.9)' : 'rgba(30,30,30,0.9)'
    const grid = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
    const blue = 'rgb(60,110,220)'
    const orange = 'rgb(230,120,30)'
    const red = 'rgb(225,60,50)'
    const gN = new Float64Array(MODES + 1)
    const gR = new Float64Array(MODES + 1)
    for (let k = 0; k <= MODES; k++) {
      const g = gains((2 * Math.PI * k) / N, ratio, nu)
      gN[k] = g.gN
      gR[k] = g.gR
    }
    let raf = 0
    let frame = 0
    let pN = synth(st.current.spec, gN, 0)
    let pR = pN
    let lastN = -1

    const draw = () => {
      const S = st.current
      frame++
      if (playing && frame % 6 === 0 && S.n < 400) S.n++
      if (S.stepOnce) {
        S.n++
        S.stepOnce = false
      }
      if (S.n !== lastN) {
        pN = synth(S.spec, gN, S.n)
        pR = synth(S.spec, gR, S.n)
        lastN = S.n
      }
      ctx.clearRect(0, 0, W, H)
      const top = 28
      const ph = H - top - 34

      // left: G(theta)
      const lx = 44
      const lw = 260
      ctx.strokeStyle = grid
      ctx.strokeRect(lx, top, lw, ph)
      const gy = (g: number) => top + ph - ((g + 1.5) / 3) * ph
      ctx.fillStyle = 'rgba(225,60,50,0.10)'
      ctx.fillRect(lx, top, lw, gy(1) - top)
      ctx.fillRect(lx, gy(-1), lw, top + ph - gy(-1))
      ctx.fillStyle = fg
      ctx.font = '10px monospace'
      for (const g of [-1, 0, 1]) {
        ctx.fillText(g.toFixed(0), lx - 14, gy(g) + 3)
        ctx.strokeStyle = grid
        ctx.beginPath()
        ctx.moveTo(lx, gy(g))
        ctx.lineTo(lx + lw, gy(g))
        ctx.stroke()
      }
      ctx.fillText('θ = 0', lx, top + ph + 12)
      ctx.fillText('π (2Δx)', lx + lw - 44, top + ph + 12)
      const curve = (arr: Float64Array, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let k = 0; k <= MODES; k++) {
          const X = lx + (k / MODES) * lw
          const Y = Math.max(top, Math.min(top + ph, gy(arr[k])))
          if (k === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
      }
      curve(gN, blue, [])
      curve(gR, orange, [6, 3])
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText('gain per implicit step G(θ)  (red band: |G| > 1)', lx - 30, 16)
      ctx.fillStyle = blue
      ctx.fillText('Newton', lx + 8, top + 16)
      ctx.fillStyle = orange
      ctx.fillText('relaxed', lx + 70, top + 16)

      // right: pulse evolution
      const rx = 340
      const rw = W - rx - 12
      ctx.strokeStyle = grid
      ctx.strokeRect(rx, top, rw, ph)
      const py = (v: number) => top + ph - ((v + 0.05) / 0.3) * ph
      ctx.strokeStyle = grid
      ctx.beginPath()
      ctx.moveTo(rx, py(0))
      ctx.lineTo(rx + rw, py(0))
      ctx.stroke()
      const line = (arr: Float64Array, col: string, dash: number[]) => {
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const X = rx + ((i + 0.5) / N) * rw
          const Y = Math.max(top, Math.min(top + ph, py(arr[i])))
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = 1
      }
      line(pN, blue, [])
      line(pR, orange, [6, 3])
      let mR = 0
      let mN = 0
      for (let i = 0; i < N; i++) {
        mR = Math.max(mR, Math.abs(pR[i]))
        mN = Math.max(mN, Math.abs(pN[i]))
      }
      const dead = mR > 1 || !Number.isFinite(mR)
      ctx.fillStyle = fg
      ctx.font = '12px sans-serif'
      ctx.fillText(`density perturbation ρ' after n = ${S.n} implicit steps`, rx, 16)
      ctx.font = '10px monospace'
      ctx.fillText('0.2', rx + 4, py(0.2) + 3)
      ctx.fillText('0', rx + 4, py(0) - 3)
      if (dead) {
        ctx.fillStyle = red
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('BLOW-UP: 2Δx mode grows', rx + 20, top + 40)
      }

      if (frame % 12 === 0) setInfo({ n: S.n, ampN: mN, ampR: mR, gPi: gR[MODES], dead })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playing, ratio, nu])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-32">a / c: {ratio.toFixed(2)}</span>
          <input type="range" min={0.4} max={10} step={0.02} value={ratio} onChange={(e) => setRatio(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-32">ν = cΔt/Δx: {nu.toFixed(1)}</span>
          <input type="range" min={0.5} max={30} step={0.5} value={nu} onChange={(e) => setNu(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (st.current.stepOnce = true)}>
          Step
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setResetKey((v) => v + 1)}>
          Reset
        </button>
        <span className="font-mono text-xs">
          n = {info.n} · peak Newton {info.ampN.toExponential(2)} · peak relaxed {info.ampR.toExponential(2)} · G_relaxed(π) ={' '}
          <span style={{ color: Math.abs(info.gPi) > 1 ? 'rgb(225,60,50)' : 'rgb(30,160,90)' }}>{info.gPi.toFixed(3)}</span>
          {info.dead ? ' · blow-up' : ''}
        </span>
      </div>
    </div>
  )
}

export default RelaxedImplicitAmplificationLab
