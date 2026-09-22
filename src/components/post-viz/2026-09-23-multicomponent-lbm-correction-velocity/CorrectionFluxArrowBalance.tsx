'use client'

import { useEffect, useRef, useState } from 'react'

const Y = [0.3, 0.45, 0.25] // fixed mass fractions at the probe point
const COL = ['#38bdf8', '#fb923c', '#a78bfa']
const NAME = ['A', 'B', 'C']

/** Fickian flux J_k = -D_k * grad Y_k, plus the optional correction term Y_k * V_c */
function fluxes(D: number[], g: number[], correct: boolean) {
  const raw = [0, 1, 2].map((k) => -D[k] * g[k])
  const vc = D[0] * g[0] + D[1] * g[1] + D[2] * g[2]
  const corr = [0, 1, 2].map((k) => (correct ? Y[k] * vc : 0))
  const total = raw.reduce((a, b) => a + b, 0) + corr.reduce((a, b) => a + b, 0)
  return { raw, corr, vc, total }
}

export function CorrectionFluxArrowBalance() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dA, setDA] = useState(0.005)
  const [dB, setDB] = useState(0.1)
  const [dC, setDC] = useState(0.5)
  const [gA, setGA] = useState(0.4)
  const [gB, setGB] = useState(-0.25)
  const [correct, setCorrect] = useState(false)
  const [live, setLive] = useState({ vc: 0, total: 0 })

  const target = useRef({ D: [dA, dB, dC], g: [gA, gB, -gA - gB], correct })
  target.current = { D: [dA, dB, dC], g: [gA, gB, -gA - gB], correct }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // eased display values so every slider move animates instead of jumping
    const shown = { raw: [0, 0, 0], corr: [0, 0, 0], total: 0, vc: 0 }
    let phase = 0
    let frame = 0
    let raf = 0

    const draw = () => {
      const t = target.current
      const want = fluxes(t.D, t.g, t.correct)
      const ease = 0.1
      for (let k = 0; k < 3; k++) {
        shown.raw[k] += (want.raw[k] - shown.raw[k]) * ease
        shown.corr[k] += (want.corr[k] - shown.corr[k]) * ease
      }
      shown.total += (want.total - shown.total) * ease
      shown.vc += (want.vc - shown.vc) * ease
      phase += 0.035

      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0c1118'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      const cx = W * 0.46
      const span = W * 0.3
      const SC = span / 0.35 // flux units -> pixels

      ctx.strokeStyle = '#1d2733'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, 20)
      ctx.lineTo(cx, H - 20)
      ctx.stroke()
      ctx.fillStyle = '#9fb0c4'
      ctx.fillText('diffusion flux at one point   (positive = to the right)', 28, 22)

      const rowY = [70, 118, 166]
      for (let k = 0; k < 3; k++) {
        const y = rowY[k]
        ctx.fillStyle = '#8b98a9'
        ctx.fillText(`${NAME[k]}  D=${t.D[k].toFixed(3)}  dY/dx=${t.g[k].toFixed(2)}`, 20, y - 14)
        drawArrow(ctx, cx, y, shown.raw[k] * SC, COL[k], phase, 7)
        if (Math.abs(shown.corr[k]) > 1e-5) {
          drawArrow(ctx, cx + shown.raw[k] * SC, y, shown.corr[k] * SC, '#4ade80', phase, 5)
        }
        ctx.fillStyle = COL[k]
        ctx.fillText(
          `J=${(shown.raw[k] + shown.corr[k]).toFixed(4)}`,
          W - 128,
          y + 4,
        )
      }

      // ---- resultant ---------------------------------------------------
      const sumY = 250
      ctx.strokeStyle = '#2b3745'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(24, sumY - 34)
      ctx.lineTo(W - 24, sumY - 34)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#c3d0de'
      ctx.fillText('sum_k J_k   — this must be zero or the mixture loses mass', 20, sumY - 14)

      const bad = Math.abs(shown.total) > 2e-3
      const pulse = bad ? 0.75 + 0.25 * Math.sin(phase * 3) : 1
      ctx.globalAlpha = pulse
      drawArrow(ctx, cx, sumY + 14, shown.total * SC, bad ? '#f43f5e' : '#4ade80', phase, 9)
      ctx.globalAlpha = 1
      ctx.fillStyle = bad ? '#f43f5e' : '#4ade80'
      ctx.fillText(`${shown.total >= 0 ? '+' : ''}${shown.total.toFixed(5)}`, W - 128, sumY + 18)

      ctx.fillStyle = t.correct ? '#4ade80' : '#6d7b8d'
      ctx.fillText(
        t.correct
          ? `V_c = sum_k D_k dY_k/dx = ${shown.vc.toFixed(4)}  (green segments)`
          : 'V_c = 0   (no correction term)',
        20,
        H - 46,
      )
      ctx.fillStyle = '#4b5665'
      ctx.fillText(`Y_A=${Y[0]}  Y_B=${Y[1]}  Y_C=${Y[2]}   dY_C/dx is fixed by the other two`, 20, H - 24)

      frame++
      if (frame % 12 === 0) setLive({ vc: want.vc, total: want.total })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={300}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        {([
          ['D_A', dA, setDA],
          ['D_B', dB, setDB],
          ['D_C', dC, setDC],
        ] as [string, number, (v: number) => void][]).map(([label, val, set]) => (
          <label key={label}>
            {label} = {val.toFixed(3)}{' '}
            <input
              type="range"
              min={Math.log10(0.005)}
              max={Math.log10(0.5)}
              step={0.01}
              value={Math.log10(val)}
              onChange={(e) => set(Math.pow(10, parseFloat(e.target.value)))}
            />
          </label>
        ))}
        <label>
          dY_A/dx = {gA.toFixed(2)}{' '}
          <input
            type="range"
            min={-0.6}
            max={0.6}
            step={0.01}
            value={gA}
            onChange={(e) => setGA(parseFloat(e.target.value))}
          />
        </label>
        <label>
          dY_B/dx = {gB.toFixed(2)}{' '}
          <input
            type="range"
            min={-0.6}
            max={0.6}
            step={0.01}
            value={gB}
            onChange={(e) => setGB(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={correct}
            onChange={(e) => setCorrect(e.target.checked)}
          />{' '}
          correction velocity
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        sum_k J_k = {live.total.toExponential(2)}, V_c = {live.vc.toFixed(4)}. With three different
        D_k the red resultant almost never lands on zero, whatever the gradients — that residue is
        exactly the mass the solver invents each step. Switch the correction on and the green
        segments rebalance the three arrows so the resultant collapses to zero for every slider
        setting.
      </p>
    </div>
  )
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y: number,
  dx: number,
  colour: string,
  phase: number,
  head: number,
) {
  if (Math.abs(dx) < 0.6) {
    ctx.fillStyle = colour
    ctx.fillRect(x0 - 2, y - 2, 4, 4)
    return
  }
  const x1 = x0 + dx
  const s = Math.sign(dx)
  ctx.strokeStyle = colour
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x1 - s * head, y)
  ctx.stroke()
  ctx.fillStyle = colour
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x1 - s * head, y - head * 0.7)
  ctx.lineTo(x1 - s * head, y + head * 0.7)
  ctx.closePath()
  ctx.fill()

  // drifting ticks: speed follows the flux magnitude
  const len = Math.abs(dx)
  const gap = 16
  const off = ((phase * (20 + len * 0.6)) % gap) * s
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 2
  for (let d = gap * 0.5; d < len - head; d += gap) {
    const px = x0 + s * d + off
    if ((px - x0) * s < 2 || (px - x0) * s > len - head) continue
    ctx.beginPath()
    ctx.moveTo(px, y - 5)
    ctx.lineTo(px, y + 5)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
