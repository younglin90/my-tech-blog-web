'use client'

import { useEffect, useRef, useState } from 'react'

const TWO_PI = Math.PI * 2
const SQRT_2PI = Math.sqrt(TWO_PI)

function gauss(c: number) {
  return Math.exp(-(c * c) / 2) / SQRT_2PI
}

// Probabilist Hermite polynomials He_n(c)
function he(n: number, c: number) {
  if (n === 0) return 1
  if (n === 1) return c
  if (n === 2) return c * c - 1
  if (n === 3) return c * c * c - 3 * c
  if (n === 4) return c * c * c * c - 6 * c * c + 3
  return 0
}

// Maxwell-Boltzmann at unit T (cs=1), drift u
function maxwell(c: number, u: number) {
  return Math.exp(-((c - u) * (c - u)) / 2) / SQRT_2PI
}

// Hermite expansion of MB truncated at order N (using exp(uc - u^2/2) = sum u^n/n! He_n)
function truncated(c: number, u: number, N: number) {
  const w = gauss(c)
  let s = 0
  let fact = 1
  for (let n = 0; n <= N; n++) {
    if (n > 0) fact *= n
    s += (Math.pow(u, n) / fact) * he(n, c)
  }
  return w * s
}

export function HermiteTruncationVsMaxwell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [u, setU] = useState(0.4)
  const [order, setOrder] = useState(2)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const padL = 56
    const padR = 24
    const padT = 28
    const padB = 36

    const cMin = -4
    const cMax = 4
    const yMin = -0.05
    const yMax = 0.5
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const toX = (c: number) => padL + ((c - cMin) / (cMax - cMin)) * plotW
    const toY = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH

    // grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let k = 0; k <= 6; k++) {
      const x = padL + (k / 6) * plotW
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
    }
    for (let k = 0; k <= 5; k++) {
      const y = padT + (k / 5) * plotH
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
    }
    ctx.stroke()

    // axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, toY(0))
    ctx.lineTo(padL + plotW, toY(0))
    ctx.moveTo(toX(0), padT)
    ctx.lineTo(toX(0), padT + plotH)
    ctx.stroke()

    // axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.font = '11px ui-sans-serif, system-ui'
    for (let k = -4; k <= 4; k += 2) {
      const x = toX(k)
      ctx.fillText(String(k), x - 4, padT + plotH + 14)
    }
    ctx.fillText('c (분자 속도)', padL + plotW - 80, padT + plotH + 28)
    ctx.save()
    ctx.translate(14, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('f(c)', -10, 0)
    ctx.restore()

    // Maxwell-Boltzmann reference
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= 240; i++) {
      const c = cMin + (i / 240) * (cMax - cMin)
      const y = maxwell(c, u)
      const px = toX(c)
      const py = toY(y)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Truncated expansion
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    for (let i = 0; i <= 240; i++) {
      const c = cMin + (i / 240) * (cMax - cMin)
      const y = truncated(c, u, order)
      const px = toX(c)
      const py = toY(y)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Legend
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(padL + 10, padT + 10, 14, 3)
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
    ctx.fillText('Maxwell–Boltzmann (참값)', padL + 30, padT + 14)
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(padL + 10, padT + 28, 14, 3)
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
    ctx.fillText(`Hermite 절단 N = ${order}`, padL + 30, padT + 32)

    // Compute moments for both
    const N = 600
    const dc = (cMax - cMin) / N
    let m0mb = 0, m1mb = 0, m2mb = 0
    let m0tr = 0, m1tr = 0, m2tr = 0
    for (let i = 0; i < N; i++) {
      const c = cMin + (i + 0.5) * dc
      const fmb = maxwell(c, u)
      const ftr = truncated(c, u, order)
      m0mb += fmb * dc
      m1mb += c * fmb * dc
      m2mb += c * c * fmb * dc
      m0tr += ftr * dc
      m1tr += c * ftr * dc
      m2tr += c * c * ftr * dc
    }

    // Moment table
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
    ctx.font = '11px ui-monospace, monospace'
    const tx = padL + plotW - 200
    let ty = padT + 18
    ctx.fillText('모멘트         MB        Hermite', tx, ty)
    ty += 14
    ctx.fillText(`∫f dc  (ρ):    ${m0mb.toFixed(3)}     ${m0tr.toFixed(3)}`, tx, ty)
    ty += 14
    ctx.fillText(`∫cf dc (ρu):   ${m1mb.toFixed(3)}     ${m1tr.toFixed(3)}`, tx, ty)
    ty += 14
    ctx.fillText(`∫c²f dc (E):   ${m2mb.toFixed(3)}     ${m2tr.toFixed(3)}`, tx, ty)
  }, [u, order])

  return (
    <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 text-sm text-[var(--text-muted)]">
        Maxwell–Boltzmann과 그 Hermite 절단의 비교. 표의 세 모멘트(밀도·운동량·에너지)가 같아지는 차수가 바로 LBM이 멈추는 자리다.
      </div>
      <div className="w-full" style={{ aspectRatio: '16 / 9' }}>
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">drift velocity u = {u.toFixed(2)} (= |u|/c_s)</span>
          <input
            type="range"
            min={-1.2}
            max={1.2}
            step={0.05}
            value={u}
            onChange={(e) => setU(parseFloat(e.target.value))}
            className="accent-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">truncation order N = {order}</span>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value))}
            className="accent-[var(--accent)]"
          />
        </label>
      </div>
      <div className="mt-3 text-xs text-[var(--text-muted)]">
        N=2면 ρ·ρu·에너지 세 모멘트가 정확히 일치한다. u가 |u|/c_s ≈ 1을 넘어가면 절단오차가 폭주하며 격자가 깨진다 — LBM이 저속(낮은 마하수)에 묶이는 이유.
      </div>
    </div>
  )
}
