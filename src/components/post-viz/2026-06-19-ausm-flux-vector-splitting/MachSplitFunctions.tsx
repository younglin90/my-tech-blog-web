'use client'

import { useEffect, useRef, useState } from 'react'

// AUSM+ split Mach number and pressure functions of Liou (1996).
// beta in [-1/16, 1/2] (default 1/8), alpha in [-3/4, 3/16] (default 3/16).
function machPlus(M: number, beta: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (M + Math.abs(M))
  return 0.25 * (M + 1) * (M + 1) + beta * (M * M - 1) * (M * M - 1)
}
function machMinus(M: number, beta: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (M - Math.abs(M))
  return -0.25 * (M - 1) * (M - 1) - beta * (M * M - 1) * (M * M - 1)
}
function presPlus(M: number, alpha: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (1 + Math.sign(M))
  return 0.25 * (M + 1) * (M + 1) * (2 - M) + alpha * M * (M * M - 1) * (M * M - 1)
}
function presMinus(M: number, alpha: number): number {
  if (Math.abs(M) >= 1) return 0.5 * (1 - Math.sign(M))
  return 0.25 * (M - 1) * (M - 1) * (2 + M) - alpha * M * (M * M - 1) * (M * M - 1)
}

type Mode = 'mach' | 'pressure'

export function MachSplitFunctions() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mode, setMode] = useState<Mode>('mach')
  const [beta, setBeta] = useState(0.125)
  const [alpha, setAlpha] = useState(0.1875)
  const [probe, setProbe] = useState(0.4)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const padL = 40
    const padR = 16
    const padT = 14
    const padB = 28
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    const xMin = -2.5
    const xMax = 2.5
    const yMin = mode === 'mach' ? -1.6 : -0.1
    const yMax = mode === 'mach' ? 1.6 : 1.6
    const X = (m: number) => padL + ((m - xMin) / (xMax - xMin)) * plotW
    const Y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH

    ctx.clearRect(0, 0, W, H)

    // grid
    ctx.strokeStyle = 'rgba(120,144,168,0.18)'
    ctx.lineWidth = 1
    for (let m = -2; m <= 2; m++) {
      ctx.beginPath()
      ctx.moveTo(X(m), padT)
      ctx.lineTo(X(m), padT + plotH)
      ctx.stroke()
    }
    // zero axis + sonic lines M = +-1
    ctx.strokeStyle = 'rgba(120,144,168,0.45)'
    ctx.beginPath()
    ctx.moveTo(padL, Y(0))
    ctx.lineTo(padL + plotW, Y(0))
    ctx.stroke()
    ctx.strokeStyle = 'rgba(245,158,11,0.5)'
    ctx.setLineDash([4, 4])
    for (const ms of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(X(ms), padT)
      ctx.lineTo(X(ms), padT + plotH)
      ctx.stroke()
    }
    ctx.setLineDash([])

    const plus = mode === 'mach' ? (m: number) => machPlus(m, beta) : (m: number) => presPlus(m, alpha)
    const minus = mode === 'mach' ? (m: number) => machMinus(m, beta) : (m: number) => presMinus(m, alpha)

    const drawCurve = (fn: (m: number) => number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      let started = false
      for (let px = 0; px <= plotW; px++) {
        const m = xMin + (px / plotW) * (xMax - xMin)
        const v = fn(m)
        const py = Y(v)
        if (!started) {
          ctx.moveTo(padL + px, py)
          started = true
        } else ctx.lineTo(padL + px, py)
      }
      ctx.stroke()
    }

    drawCurve(plus, '#22d3ee')
    drawCurve(minus, '#f472b6')

    // probe vertical line + dots
    const mProbe = probe
    ctx.strokeStyle = 'rgba(226,232,240,0.5)'
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(X(mProbe), padT)
    ctx.lineTo(X(mProbe), padT + plotH)
    ctx.stroke()
    ctx.setLineDash([])
    const vp = plus(mProbe)
    const vm = minus(mProbe)
    ctx.fillStyle = '#22d3ee'
    ctx.beginPath(); ctx.arc(X(mProbe), Y(vp), 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#f472b6'
    ctx.beginPath(); ctx.arc(X(mProbe), Y(vm), 4, 0, Math.PI * 2); ctx.fill()

    // labels
    ctx.fillStyle = 'rgba(122,144,168,0.95)'
    ctx.font = '11px sans-serif'
    ctx.fillText(mode === 'mach' ? 'M+(M)' : 'P+(M)', padL + 6, padT + 12)
    ctx.fillText('M', padL + plotW - 10, Y(0) - 6)
    ctx.fillText('-1', X(-1) - 6, padT + plotH + 18)
    ctx.fillText('+1', X(1) - 6, padT + plotH + 18)

    // readout box
    ctx.fillStyle = 'rgba(226,232,240,0.92)'
    ctx.font = '12px sans-serif'
    const lbl = mode === 'mach'
      ? `M=${mProbe.toFixed(2)}  M+=${vp.toFixed(3)}  M-=${vm.toFixed(3)}`
      : `M=${mProbe.toFixed(2)}  P+=${vp.toFixed(3)}  P-=${vm.toFixed(3)}`
    ctx.fillText(lbl, padL + plotW - 230, padT + plotH - 8)
  }, [mode, beta, alpha, probe])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={620} height={280} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['mach', 'pressure'] as Mode[]).map((k) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: mode === k ? 'var(--accent)' : 'transparent',
                color: mode === k ? '#06121f' : 'var(--text)',
                fontWeight: mode === k ? 600 : 400,
              }}
            >
              {k === 'mach' ? 'Mach split' : 'Pressure split'}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 88 }}>M = {probe.toFixed(2)}</span>
          <input type="range" min={-2.4} max={2.4} step={0.05} value={probe} onChange={(e) => setProbe(parseFloat(e.target.value))} />
        </label>
        {mode === 'mach' ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 78 }}>β = {beta.toFixed(3)}</span>
            <input type="range" min={-0.0625} max={0.5} step={0.0125} value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} />
          </label>
        ) : (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 78 }}>α = {alpha.toFixed(3)}</span>
            <input type="range" min={-0.75} max={0.1875} step={0.015625} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} />
          </label>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 2px 0' }}>
        Cyan = forward split (M+ / P+), pink = backward split (M- / P-). Outside the sonic band |M|&gt;1 the curves
        collapse onto the fully upwind branch; inside, the polynomial blend keeps them smooth and differentiable.
      </p>
    </div>
  )
}
