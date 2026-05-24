'use client'

import { useEffect, useRef, useState } from 'react'

// D2Q9 lattice vectors and weights
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const LABEL = ['0', 'E', 'N', 'W', 'S', 'NE', 'NW', 'SW', 'SE']

function feq(i: number, rho: number, ux: number, uy: number) {
  const ciu = CX[i] * ux + CY[i] * uy
  const uu = ux * ux + uy * uy
  return W[i] * rho * (1 + 3 * ciu + 4.5 * ciu * ciu - 1.5 * uu)
}

function initialF(rho: number) {
  // arbitrary non-equilibrium start: equally distributed (perturbation from eq)
  const f = new Array(9)
  for (let i = 0; i < 9; i++) f[i] = W[i] * rho
  // add asymmetric kick to f_E and f_W
  f[1] += 0.05 * rho
  f[3] -= 0.04 * rho
  f[2] += 0.03 * rho
  f[4] -= 0.02 * rho
  return f
}

export function D2Q9CollisionRelaxation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ux, setUx] = useState(0.12)
  const [uy, setUy] = useState(0.06)
  const [tau, setTau] = useState(0.8)
  const [running, setRunning] = useState(true)
  const stateRef = useRef<{ f: number[]; step: number }>({ f: initialF(1.0), step: 0 })

  // reset when u changes meaningfully? Keep state across slider changes.
  const reset = () => {
    stateRef.current = { f: initialF(1.0), step: 0 }
  }

  useEffect(() => {
    let raf = 0
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1

    const draw = () => {
      const W2 = canvas.clientWidth
      const H = canvas.clientHeight
      if (canvas.width !== W2 * dpr || canvas.height !== H * dpr) {
        canvas.width = W2 * dpr
        canvas.height = H * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W2, H)

      // Collision step (BGK, one step per frame when running)
      const f = stateRef.current.f
      const rho = f.reduce((a, b) => a + b, 0)
      if (running) {
        for (let i = 0; i < 9; i++) {
          f[i] = f[i] - (f[i] - feq(i, rho, ux, uy)) / tau
        }
        stateRef.current.step += 1
      }

      // Layout: left = D2Q9 arrow viz, right = bar chart
      const leftW = Math.min(W2 * 0.5, 320)
      const cx = leftW / 2
      const cy = H / 2
      const scale = Math.min(leftW, H) * 0.32

      // Background grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let g = -1; g <= 1; g++) {
        ctx.moveTo(cx + g * scale, cy - scale * 1.2)
        ctx.lineTo(cx + g * scale, cy + scale * 1.2)
        ctx.moveTo(cx - scale * 1.2, cy + g * scale)
        ctx.lineTo(cx + scale * 1.2, cy + g * scale)
      }
      ctx.stroke()

      // 9 distributions as arrows colored by f_i / max
      let fmax = 0
      for (let i = 0; i < 9; i++) fmax = Math.max(fmax, f[i])
      for (let i = 1; i < 9; i++) {
        const dx = CX[i] * scale
        const dy = -CY[i] * scale // canvas y flipped
        const t = f[i] / fmax
        const r = Math.round(34 + 200 * t)
        const g = Math.round(211 - 100 * (1 - t))
        const b = Math.round(238 - 180 * t)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.95)`
        ctx.lineWidth = 2 + 6 * t
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + dx, cy + dy)
        ctx.stroke()
        // arrowhead
        const angle = Math.atan2(dy, dx)
        const ah = 8
        ctx.beginPath()
        ctx.moveTo(cx + dx, cy + dy)
        ctx.lineTo(cx + dx - ah * Math.cos(angle - 0.4), cy + dy - ah * Math.sin(angle - 0.4))
        ctx.lineTo(cx + dx - ah * Math.cos(angle + 0.4), cy + dy - ah * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fill()
        // label
        ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
        ctx.font = '11px ui-sans-serif, system-ui'
        ctx.fillText(LABEL[i], cx + dx * 1.18 - 6, cy + dy * 1.18 + 4)
      }
      // f_0 center bubble
      const t0 = f[0] / fmax
      ctx.fillStyle = `rgba(${34 + 200 * t0}, ${211 - 100 * (1 - t0)}, ${238 - 180 * t0}, 0.95)`
      ctx.beginPath()
      ctx.arc(cx, cy, 6 + 18 * t0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('f₀', cx - 6, cy + 3)

      // velocity vector arrow
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      const uScale = scale * 6
      ctx.lineTo(cx + ux * uScale, cy - uy * uScale)
      ctx.stroke()
      ctx.fillStyle = '#facc15'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('u', cx + ux * uScale + 4, cy - uy * uScale - 4)

      // Title
      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(`D2Q9, step = ${stateRef.current.step}`, 12, 18)

      // Right: bar chart of f_i vs f_i^eq
      const barW = W2 - leftW - 20
      const barX = leftW + 10
      const barTop = 30
      const barBottom = H - 28
      const barH = barBottom - barTop
      const slotW = barW / 9
      // axis
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(barX, barBottom)
      ctx.lineTo(barX + barW, barBottom)
      ctx.stroke()

      // scale: 0 to max(W_0 * rho * 1.5) to fit f_0
      const maxY = (4 / 9) * rho * 1.6
      const toY = (v: number) => barBottom - (v / maxY) * barH

      // f_i bars (current state)
      for (let i = 0; i < 9; i++) {
        const x = barX + i * slotW + slotW * 0.18
        const w = slotW * 0.32
        const y = toY(f[i])
        const t = f[i] / fmax
        ctx.fillStyle = `rgba(${34 + 200 * t}, ${211 - 100 * (1 - t)}, ${238 - 180 * t}, 0.9)`
        ctx.fillRect(x, y, w, barBottom - y)
      }
      // f_i^eq bars (target)
      for (let i = 0; i < 9; i++) {
        const x = barX + i * slotW + slotW * 0.52
        const w = slotW * 0.32
        const eq = feq(i, rho, ux, uy)
        const y = toY(eq)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.85)'
        ctx.fillRect(x, y, w, barBottom - y)
      }
      // labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
      ctx.font = '10px ui-sans-serif, system-ui'
      for (let i = 0; i < 9; i++) {
        ctx.fillText(LABEL[i], barX + i * slotW + slotW * 0.32, barBottom + 14)
      }
      // legend
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
      ctx.fillRect(barX, 8, 10, 10)
      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('현재 fᵢ', barX + 14, 17)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'
      ctx.fillRect(barX + 70, 8, 10, 10)
      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
      ctx.fillText('평형 fᵢ^eq', barX + 84, 17)

      // residual
      let res = 0
      for (let i = 0; i < 9; i++) {
        const d = f[i] - feq(i, rho, ux, uy)
        res += d * d
      }
      res = Math.sqrt(res)
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`||f - f^eq||₂ = ${res.toExponential(2)}`, barX + barW - 180, 17)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [ux, uy, tau, running])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 text-sm text-[var(--text-muted)]">
        D2Q9 격자 위에서 9개 분포 함수가 BGK 충돌을 통해 평형으로 끌려가는 과정. 노란 화살표는 거시 속도 u, 가는 화살표는 각 격자 방향 c_i의 분포 크기.
      </div>
      <div className="w-full" style={{ aspectRatio: '16 / 9' }}>
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">u_x = {ux.toFixed(2)}</span>
          <input
            type="range"
            min={-0.2}
            max={0.2}
            step={0.01}
            value={ux}
            onChange={(e) => setUx(parseFloat(e.target.value))}
            className="accent-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">u_y = {uy.toFixed(2)}</span>
          <input
            type="range"
            min={-0.2}
            max={0.2}
            step={0.01}
            value={uy}
            onChange={(e) => setUy(parseFloat(e.target.value))}
            className="accent-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">τ (이완 시간) = {tau.toFixed(2)}</span>
          <input
            type="range"
            min={0.55}
            max={2.5}
            step={0.05}
            value={tau}
            onChange={(e) => setTau(parseFloat(e.target.value))}
            className="accent-[var(--accent)]"
          />
        </label>
      </div>
      <div className="mt-3 flex gap-2 text-sm">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--surface-2)]"
        >
          {running ? '일시정지' : '재생'}
        </button>
        <button
          onClick={reset}
          className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--surface-2)]"
        >
          초기화
        </button>
        <span className="ml-2 self-center text-xs text-[var(--text-muted)]">
          τ→0.5에 가까울수록 한 스텝에 평형으로 끌려가지만, 점성 ν = c_s²(τ−1/2)도 작아져 안정성이 흔들린다.
        </span>
      </div>
    </div>
  )
}
