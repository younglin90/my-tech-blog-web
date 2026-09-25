'use client'

import { useEffect, useRef, useState } from 'react'

/** cubic B-spline in 1D, written in q = r/h with the 2/3h factor folded in */
function wq(q: number) {
  if (q >= 2) return 0
  if (q < 1) return (2 / 3) * (1 - 1.5 * q * q + 0.75 * q * q * q)
  const t = 2 - q
  return (2 / 3) * 0.25 * t * t * t
}

function dwq(q: number) {
  if (q >= 2) return 0
  if (q < 1) return (2 / 3) * (-3 * q + 2.25 * q * q)
  const t = 2 - q
  return (2 / 3) * -0.75 * t * t
}

function ddwq(q: number) {
  if (q >= 2) return 0
  if (q < 1) return (2 / 3) * (-3 + 4.5 * q)
  return (2 / 3) * 1.5 * (2 - q)
}

export function SwegleSignBandKernel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hfac, setHfac] = useState(1.2)
  const [sig0, setSig0] = useState(0.05)
  const [showFirst, setShowFirst] = useState(true)
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0
    let phase = 0

    const draw = () => {
      const W = cv.width
      const H = cv.height
      ctx.fillStyle = '#0d1520'
      ctx.fillRect(0, 0, W, H)

      const left = 62
      const right = W - 150
      const top = 56
      const bot = 216
      const rMax = 2 * hfac // in units of dx
      const xOf = (r: number) => left + ((right - left) * r) / rMax
      const scale = 2.6
      const yOf = (v: number) => (top + bot) / 2 - ((bot - top) / 2) * Math.max(-1, Math.min(1, v * scale))

      // neighbours of a particle sitting at r = 0, on the undeformed lattice
      const neigh: { r: number; dd: number }[] = []
      for (let k = 1; k * 1 < rMax; k++) neigh.push({ r: k, dd: ddwq(k / hfac) / (hfac * hfac * hfac) })
      const sum = neigh.reduce((s, n) => s + sig0 * n.dd, 0)
      const unstable = sum > 0

      // sign bands of W''
      ctx.font = '11px ui-monospace, monospace'
      for (let px = left; px < right; px += 2) {
        const r = ((px - left) / (right - left)) * rMax
        const dd = ddwq(r / hfac)
        if (dd === 0) continue
        ctx.fillStyle = dd > 0 ? 'rgba(248,113,113,0.10)' : 'rgba(96,165,250,0.10)'
        ctx.fillRect(px, top, 2, bot - top)
      }

      // axes
      ctx.strokeStyle = '#334155'
      ctx.beginPath()
      ctx.moveTo(left, yOf(0))
      ctx.lineTo(right, yOf(0))
      ctx.stroke()
      ctx.fillStyle = '#64748b'
      for (let k = 0; k <= Math.floor(rMax); k++) {
        const x = xOf(k)
        ctx.beginPath()
        ctx.moveTo(x, bot)
        ctx.lineTo(x, bot + 5)
        ctx.strokeStyle = '#334155'
        ctx.stroke()
        ctx.fillText(`${k}`, x - 3, bot + 18)
      }
      ctx.fillText('r / dx', right - 34, bot + 34)

      // curves
      const plot = (f: (q: number) => number, norm: number, colour: string, width: number) => {
        ctx.strokeStyle = colour
        ctx.lineWidth = width
        ctx.beginPath()
        for (let px = left; px <= right; px += 1) {
          const r = ((px - left) / (right - left)) * rMax
          const y = yOf(f(r / hfac) * norm)
          if (px === left) ctx.moveTo(px, y)
          else ctx.lineTo(px, y)
        }
        ctx.stroke()
      }
      plot(wq, 1 / hfac, '#475569', 1.5)
      if (showFirst) plot(dwq, 1 / (hfac * hfac), '#a78bfa', 1.5)
      plot(ddwq, 1 / (hfac * hfac * hfac), '#fbbf24', 2.5)

      // neighbour dots on the W'' curve + animated pair arrows
      neigh.forEach((n) => {
        const x = xOf(n.r)
        const y = yOf(n.dd)
        const bad = sig0 * n.dd > 0
        ctx.strokeStyle = '#1e293b'
        ctx.beginPath()
        ctx.moveTo(x, top)
        ctx.lineTo(x, bot)
        ctx.stroke()
        ctx.fillStyle = bad ? '#f87171' : '#60a5fa'
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
        // arrow: destabilising pairs get a swelling pull, stabilising pairs a steady bounce
        const grow = bad ? 1 + 0.9 * (0.5 + 0.5 * Math.sin(phase)) : 1
        const len = (bad ? 16 : 9) * grow * Math.abs(Math.sin(phase))
        const dir = bad ? -1 : 1
        ctx.strokeStyle = bad ? '#f87171' : '#60a5fa'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, top - 14)
        ctx.lineTo(x + dir * len, top - 14)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + dir * len, top - 14)
        ctx.lineTo(x + dir * (len - 5), top - 18)
        ctx.lineTo(x + dir * (len - 5), top - 10)
        ctx.closePath()
        ctx.fill()
      })

      // legend
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#475569'
      ctx.fillText('W', right + 12, top + 4)
      if (showFirst) {
        ctx.fillStyle = '#a78bfa'
        ctx.fillText("W'", right + 12, top + 22)
      }
      ctx.fillStyle = '#fbbf24'
      ctx.fillText("W''", right + 12, top + 40)
      ctx.fillStyle = 'rgba(248,113,113,0.85)'
      ctx.fillText("W'' > 0", right + 12, top + 66)
      ctx.fillStyle = 'rgba(96,165,250,0.85)'
      ctx.fillText("W'' < 0", right + 12, top + 84)

      // header + verdict
      ctx.font = '600 14px ui-monospace, monospace'
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(
        `h/dx = ${hfac.toFixed(2)}   sigma0/E = ${sig0 >= 0 ? '+' : ''}${sig0.toFixed(2)}   neighbours inside 2h: ${neigh.length}`,
        left,
        28
      )
      ctx.font = '600 15px ui-monospace, monospace'
      ctx.fillStyle = unstable ? '#f87171' : '#4ade80'
      ctx.fillText(
        `sum of sigma0 * W''(r_ij) = ${sum >= 0 ? '+' : ''}${sum.toFixed(5)}  ->  ${unstable ? 'UNSTABLE (pairs pull in)' : 'STABLE (pairs push back)'}`,
        left,
        bot + 60
      )

      // two-particle cartoon driven by the same verdict
      const cy = H - 26
      const cx = left + 150
      const gap = unstable
        ? 46 * (1 - 0.55 * (0.5 + 0.5 * Math.sin(phase)))
        : 46 + 7 * Math.sin(phase)
      ctx.fillStyle = '#64748b'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('one pair:', left, cy + 4)
      ctx.fillStyle = unstable ? '#f87171' : '#60a5fa'
      ctx.beginPath()
      ctx.arc(cx - gap / 2, cy, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + gap / 2, cy, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#64748b'
      ctx.fillText(
        unstable ? 'gap collapses -> a hole opens next door' : 'gap oscillates about dx',
        cx + 44,
        cy + 4
      )
    }

    const loop = () => {
      if (running) phase += 0.055
      draw()
      frame += 1
      if (frame % 15 === 0) setTick((t) => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [hfac, sig0, showFirst, running])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={320}
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
        <label>
          h / dx = {hfac.toFixed(2)}{' '}
          <input
            type="range"
            min={0.8}
            max={2.2}
            step={0.05}
            value={hfac}
            onChange={(e) => setHfac(parseFloat(e.target.value))}
          />
        </label>
        <label>
          sigma0 / E = {sig0 >= 0 ? '+' : ''}
          {sig0.toFixed(2)}{' '}
          <input
            type="range"
            min={-0.1}
            max={0.2}
            step={0.01}
            value={sig0}
            onChange={(e) => setSig0(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={showFirst}
            onChange={(e) => setShowFirst(e.target.checked)}
          />{' '}
          show W&apos;
        </label>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Vertical lines are the lattice neighbours of one particle; the dot sits on W&apos;&apos; at
        that separation. Red dot = that pair is destabilising, and its arrow swells inward.
        Slide h/dx and watch neighbours cross the sign change of W&apos;&apos; near r/h = 2/3, and
        new ones enter at r = 2h. Flip sigma0 negative and every red dot turns blue without the
        curve moving at all — only the sign of the product changed (frame {tick}).
      </p>
    </div>
  )
}
