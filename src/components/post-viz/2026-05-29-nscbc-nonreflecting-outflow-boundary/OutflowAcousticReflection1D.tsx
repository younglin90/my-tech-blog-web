'use client'

import { useEffect, useRef, useState } from 'react'

type BCMode = 'wall' | 'nscbc'

export function OutflowAcousticReflection1D() {
  const [mode, setMode] = useState<BCMode>('wall')
  const [sigma, setSigma] = useState(0.05)
  const [running, setRunning] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ Aplus: Float64Array; Aminus: Float64Array; pTrail: number[]; frame: number } | null>(
    null,
  )
  const modeRef = useRef(mode)
  const sigmaRef = useRef(sigma)
  const runRef = useRef(running)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  useEffect(() => {
    sigmaRef.current = sigma
  }, [sigma])
  useEffect(() => {
    runRef.current = running
  }, [running])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const N = 240
    const c = 1.0
    const cfl = 0.5
    const dx = 1.0 / N

    const Aplus = new Float64Array(N)
    const Aminus = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      const x = i * dx
      Aplus[i] = Math.exp(-((x - 0.22) ** 2) / 0.003)
    }
    stateRef.current = { Aplus, Aminus, pTrail: [], frame: 0 }

    let rafId = 0

    const step = () => {
      const s = stateRef.current
      if (!s) return
      const { Aplus: Ap, Aminus: Am } = s
      const ApNew = new Float64Array(N)
      const AmNew = new Float64Array(N)

      ApNew[0] = 0
      for (let i = 1; i < N; i++) {
        ApNew[i] = Ap[i] - cfl * (Ap[i] - Ap[i - 1])
      }
      for (let i = 0; i < N - 1; i++) {
        AmNew[i] = Am[i] - cfl * (Am[i] - Am[i + 1])
      }
      if (modeRef.current === 'wall') {
        AmNew[N - 1] = ApNew[N - 1]
      } else {
        AmNew[N - 1] = sigmaRef.current * ApNew[N - 1]
      }

      s.Aplus = ApNew
      s.Aminus = AmNew
      s.frame += 1
      const pBoundary = 0.5 * (ApNew[N - 1] - AmNew[N - 1])
      s.pTrail.push(pBoundary)
      if (s.pTrail.length > 320) s.pTrail.shift()
    }

    const draw = () => {
      const s = stateRef.current
      if (!s) return
      const { Aplus: Ap, Aminus: Am, pTrail } = s

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const topH = 180
      const botH = H - topH - 12

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath()
      for (let k = 0; k <= 10; k++) {
        const x = (k / 10) * W
        ctx.moveTo(x, 0)
        ctx.lineTo(x, topH)
      }
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.beginPath()
      ctx.moveTo(0, topH / 2)
      ctx.lineTo(W, topH / 2)
      ctx.stroke()

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * W
        const p = 0.5 * (Ap[i] - Am[i])
        const y = topH / 2 - p * topH * 0.42
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * W
        const u = 0.5 * (Ap[i] + Am[i])
        const y = topH / 2 - u * topH * 0.42
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(W - 1, 0)
      ctx.lineTo(W - 1, topH)
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px monospace'
      ctx.fillText("p' (cyan)   u' (pink)", 10, 16)
      const tag =
        modeRef.current === 'wall'
          ? 'BC: zero-gradient (reflective)'
          : `BC: NSCBC  sigma=${sigmaRef.current.toFixed(2)}`
      ctx.fillText(tag, 10, topH - 8)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('outflow boundary', W - 130, 16)

      const botTop = topH + 12
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, botTop, W, botH)
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath()
      ctx.moveTo(0, botTop + botH / 2)
      ctx.lineTo(W, botTop + botH / 2)
      ctx.stroke()

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      const L = pTrail.length
      for (let k = 0; k < L; k++) {
        const x = (k / Math.max(1, L - 1)) * W
        const y = botTop + botH / 2 - pTrail[k] * botH * 0.45
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px monospace'
      ctx.fillText("p' at boundary vs time", 10, botTop + 14)
    }

    const loop = () => {
      if (runRef.current) {
        for (let k = 0; k < 2; k++) step()
      }
      draw()
      rafId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(rafId)
  }, [resetKey])

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <canvas
        ref={canvasRef}
        width={720}
        height={300}
        className="w-full h-auto block rounded bg-[#0b1220]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMode('wall')
              setResetKey((k) => k + 1)
            }}
            className={`px-3 py-1 rounded border ${mode === 'wall' ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]' : 'border-[var(--border)]'}`}
            type="button"
          >
            Zero-gradient
          </button>
          <button
            onClick={() => {
              setMode('nscbc')
              setResetKey((k) => k + 1)
            }}
            className={`px-3 py-1 rounded border ${mode === 'nscbc' ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]' : 'border-[var(--border)]'}`}
            type="button"
          >
            NSCBC
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs">
          sigma (reflectivity)
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sigma}
            onChange={(e) => setSigma(parseFloat(e.target.value))}
            disabled={mode === 'wall'}
          />
          <span className="font-mono w-10">{sigma.toFixed(2)}</span>
        </label>
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-3 py-1 rounded border border-[var(--border)]"
          type="button"
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => setResetKey((k) => k + 1)}
          className="px-3 py-1 rounded border border-[var(--border)]"
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
