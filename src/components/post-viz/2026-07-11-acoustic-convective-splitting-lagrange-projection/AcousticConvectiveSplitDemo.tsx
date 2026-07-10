'use client'

import { useEffect, useRef, useState } from 'react'

// Linear characteristic decomposition of a localized perturbation in a
// uniformly moving gas (speed of sound c = 1, background velocity u = Mach).
// A pressure/velocity pulse splits into two acoustic simple waves that travel
// at u - c and u + c. An entropy (density-only) anomaly rides the contact at u.
//   lambda_1 = u - c   (acoustic, left)
//   lambda_2 = u       (contact / convective)
//   lambda_5 = u + c   (acoustic, right)
// This is exactly the additive split lambda = lambda^acoustic + lambda^convective
// that the Lagrange-Projection (acoustic-convective splitting) scheme exploits.

const C_SOUND = 1
const X0 = 0.5
const WIDTH_ACOUSTIC = 0.045
const WIDTH_ENTROPY = 0.05

// periodic distance on the unit interval
function wrapDist(x: number, center: number): number {
  let d = Math.abs(x - center)
  if (d > 0.5) d = 1 - d
  return d
}

function gaussian(x: number, center: number, w: number): number {
  const d = wrapDist(x, center)
  return Math.exp(-(d * d) / (w * w))
}

export function AcousticConvectiveSplitDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mach, setMach] = useState(0.15)
  const [playing, setPlaying] = useState(true)
  const [showSplit, setShowSplit] = useState(true)
  const machRef = useRef(mach)
  const playingRef = useRef(playing)
  const splitRef = useRef(showSplit)
  const tRef = useRef(0)
  const rafRef = useRef<number>(0)

  machRef.current = mach
  playingRef.current = playing
  splitRef.current = showSplit

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const padX = 14
    const midY = H * 0.52
    const amp = H * 0.32
    const N = 260

    const draw = () => {
      const M = machRef.current
      const u = M * C_SOUND
      const t = tRef.current
      // characteristic positions (wrapped into [0,1))
      const posR = (((X0 + (u + C_SOUND) * t) % 1) + 1) % 1
      const posL = (((X0 + (u - C_SOUND) * t) % 1) + 1) % 1
      const posC = (((X0 + u * t) % 1) + 1) % 1

      // background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0b1524')
      bg.addColorStop(1, '#070f1c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const sx = (x: number) => padX + x * (W - 2 * padX)

      // zero axis
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padX, midY)
      ctx.lineTo(W - padX, midY)
      ctx.stroke()

      // entropy / contact packet (convective, teal) -- density anomaly, no pressure
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i / N
        const val = -0.55 * gaussian(x, posC, WIDTH_ENTROPY)
        const y = midY - val * amp
        if (i === 0) ctx.moveTo(sx(x), y)
        else ctx.lineTo(sx(x), y)
      }
      ctx.lineTo(W - padX, midY)
      ctx.lineTo(padX, midY)
      ctx.closePath()
      ctx.fillStyle = 'rgba(45,212,191,0.16)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(45,212,191,0.9)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i / N
        const val = -0.55 * gaussian(x, posC, WIDTH_ENTROPY)
        const y = midY - val * amp
        if (i === 0) ctx.moveTo(sx(x), y)
        else ctx.lineTo(sx(x), y)
      }
      ctx.stroke()

      // pressure field = two acoustic packets (amber)
      const acoustic = (x: number) =>
        0.5 * gaussian(x, posR, WIDTH_ACOUSTIC) + 0.5 * gaussian(x, posL, WIDTH_ACOUSTIC)

      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i / N
        const y = midY - acoustic(x) * amp
        if (i === 0) ctx.moveTo(sx(x), y)
        else ctx.lineTo(sx(x), y)
      }
      ctx.lineTo(W - padX, midY)
      ctx.lineTo(padX, midY)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, midY - amp, 0, midY)
      grad.addColorStop(0, 'rgba(251,191,36,0.34)')
      grad.addColorStop(1, 'rgba(251,191,36,0.05)')
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i / N
        const y = midY - acoustic(x) * amp
        if (i === 0) ctx.moveTo(sx(x), y)
        else ctx.lineTo(sx(x), y)
      }
      ctx.stroke()

      // speed markers along the bottom ruler
      const rulerY = H - 16
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.beginPath()
      ctx.moveTo(padX, rulerY)
      ctx.lineTo(W - padX, rulerY)
      ctx.stroke()

      const mark = (pos: number, color: string, label: string) => {
        const px = sx(pos)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(px, rulerY - 6)
        ctx.lineTo(px - 4, rulerY + 2)
        ctx.lineTo(px + 4, rulerY + 2)
        ctx.closePath()
        ctx.fill()
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(label, px, rulerY + 13)
      }
      if (splitRef.current) {
        mark(posL, '#fbbf24', 'u−c')
        mark(posC, '#2dd3bf', 'u')
        mark(posR, '#fbbf24', 'u+c')
      }

      // legend / speeds
      ctx.textAlign = 'left'
      ctx.font = '11px monospace'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(`acoustic  u±c = ${(u - 1).toFixed(2)} , ${(u + 1).toFixed(2)}`, padX + 4, 16)
      ctx.fillStyle = '#2dd3bf'
      ctx.fillText(`convective  u = ${u.toFixed(2)}`, padX + 4, 30)

      if (playingRef.current) {
        tRef.current += 0.0016
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const btnStyle: React.CSSProperties = {
    padding: '5px 14px',
    borderRadius: 6,
    border: '1px solid #24425a',
    background: 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'monospace',
  }

  const ratio = mach > 0 ? (mach + 1) / mach : Infinity

  return (
    <div
      style={{
        border: '1px solid #24425a',
        borderRadius: 12,
        padding: 16,
        margin: '1.5rem 0',
        background: '#0d1a2b',
      }}
    >
      <canvas
        ref={canvasRef}
        width={560}
        height={280}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#070f1c' }}
      />
      <div style={{ marginTop: 12, fontSize: 14, color: '#e2e8f0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ minWidth: 150, fontFamily: 'monospace' }}>Mach  M = u/c = {mach.toFixed(3)}</span>
          <input
            type="range"
            min={0.01}
            max={0.9}
            step={0.005}
            value={mach}
            onChange={(e) => setMach(parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 160, accentColor: '#fbbf24' }}
          />
        </label>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setPlaying((p) => !p)} style={btnStyle}>
            {playing ? '⏸ pause' : '▶ play'}
          </button>
          <button onClick={() => { tRef.current = 0 }} style={btnStyle}>
            ↺ reset
          </button>
          <button onClick={() => setShowSplit((s) => !s)} style={btnStyle}>
            {showSplit ? 'hide split markers' : 'show split markers'}
          </button>
        </div>
        <div style={{ marginTop: 10, fontFamily: 'monospace', color: '#fbbf24', fontWeight: 600 }}>
          stiffness ratio (u+c)/u = {ratio === Infinity ? '∞' : ratio.toFixed(1)}×
        </div>
        <div style={{ marginTop: 4, opacity: 0.6, fontSize: 12 }}>
          amber = 압력 섭동(음향파, u±c) · teal = 엔트로피 이상(대류/접촉, u). M을 0.02까지 내리면
          음향파가 접촉파를 압도적으로 앞질러 달아난다.
        </div>
      </div>
    </div>
  )
}
