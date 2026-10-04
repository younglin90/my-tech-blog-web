'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/** probabilists' Hermite He_n(v) */
function he(n: number, v: number): number {
  let a = 1
  let b = v
  if (n === 0) return a
  for (let k = 1; k < n; k++) {
    const next = v * b - k * a
    a = b
    b = next
  }
  return b
}

function factorial(n: number): number {
  let f = 1
  for (let k = 2; k <= n; k++) f *= k
  return f
}

/** nodes = roots of He_Q (bisection on a fine grid), weights = Q!/(Q^2 He_{Q-1}^2) */
function gaussHermite(Q: number): { nodes: number[]; weights: number[] } {
  const nodes: number[] = []
  const step = 2e-3
  let x0 = -8
  let f0 = he(Q, x0)
  while (x0 < 8) {
    const x1 = x0 + step
    const f1 = he(Q, x1)
    if (f0 === 0 || f0 * f1 < 0) {
      let a = x0
      let b = x1
      for (let i = 0; i < 60; i++) {
        const m = 0.5 * (a + b)
        if (he(Q, a) * he(Q, m) <= 0) b = m
        else a = m
      }
      nodes.push(0.5 * (a + b))
    }
    x0 = x1
    f0 = f1
  }
  const weights = nodes.map((v) => factorial(Q) / (Q * Q * he(Q - 1, v) ** 2))
  return { nodes, weights }
}

function exactMoment(n: number): number {
  if (n % 2 === 1) return 0
  let m = 1
  for (let k = 1; k < n; k += 2) m *= k
  return m
}

const NMAX = 10
const W = 760
const H = 420
const TOP_H = 236
const PAD_L = 52
const PAD_R = 18

export function HermiteNodeMomentBench() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [Q, setQ] = useState(3)
  const [nTarget, setNTarget] = useState(6)
  const [sweeping, setSweeping] = useState(true)
  const nSmooth = useRef(6)
  const dir = useRef(1)
  const frame = useRef(0)
  const [readout, setReadout] = useState({ n: 6, quad: 0, exact: 15, err: 6 })

  const rule = useMemo(() => gaussHermite(Q), [Q])

  const errors = useMemo(() => {
    const out: number[] = []
    for (let n = 0; n <= NMAX; n++) {
      let s = 0
      for (let i = 0; i < rule.nodes.length; i++) s += rule.weights[i] * rule.nodes[i] ** n
      out.push(Math.abs(s - exactMoment(n)))
    }
    return out
  }, [rule])

  const firstFail = useMemo(() => {
    for (let n = 0; n <= NMAX; n++) if (errors[n] > 1e-9) return n
    return NMAX + 1
  }, [errors])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0

    const draw = () => {
      frame.current++
      if (sweeping) {
        nSmooth.current += dir.current * 0.035
        if (nSmooth.current > NMAX) {
          nSmooth.current = NMAX
          dir.current = -1
        }
        if (nSmooth.current < 0) {
          nSmooth.current = 0
          dir.current = 1
        }
      } else {
        nSmooth.current += (nTarget - nSmooth.current) * 0.18
      }
      const nF = nSmooth.current
      const nI = Math.round(nF)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      // ---- top panel: integrand v^n w(v) and the node sticks ----
      const vMax = 4.6
      const xOf = (v: number) => PAD_L + ((v + vMax) / (2 * vMax)) * (W - PAD_L - PAD_R)
      const baseY = TOP_H - 54
      const gauss = (v: number) => Math.exp(-0.5 * v * v) / Math.sqrt(2 * Math.PI)
      const integrand = (v: number) => Math.sign(v) ** nI * Math.pow(Math.abs(v), nF) * gauss(v)

      let peak = 1e-9
      for (let v = -vMax; v <= vMax; v += 0.01) peak = Math.max(peak, Math.abs(integrand(v)))
      const yOf = (f: number) => baseY - (f / peak) * (TOP_H - 104)

      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD_L, baseY)
      ctx.lineTo(W - PAD_R, baseY)
      ctx.stroke()
      for (let v = -4; v <= 4; v += 1) {
        ctx.fillStyle = '#6e7681'
        ctx.font = '10px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(v), xOf(v), baseY + 14)
      }
      ctx.fillStyle = '#6e7681'
      ctx.textAlign = 'right'
      ctx.fillText('v', W - PAD_R, baseY + 28)

      // Gaussian weight (reference)
      ctx.strokeStyle = '#30475e'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      for (let v = -vMax; v <= vMax; v += 0.02) {
        const y = baseY - (gauss(v) / gauss(0)) * (TOP_H - 150)
        if (v === -vMax) ctx.moveTo(xOf(v), y)
        else ctx.lineTo(xOf(v), y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // integrand
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let v = -vMax; v <= vMax; v += 0.01) {
        const y = yOf(integrand(v))
        if (v === -vMax) ctx.moveTo(xOf(v), y)
        else ctx.lineTo(xOf(v), y)
      }
      ctx.stroke()

      // quadrature sticks: w_i * v_i^n
      const exact = exactMoment(nI)
      let quad = 0
      for (let i = 0; i < rule.nodes.length; i++) quad += rule.weights[i] * rule.nodes[i] ** nI
      const bad = Math.abs(quad - exact) > 1e-9
      for (let i = 0; i < rule.nodes.length; i++) {
        const v = rule.nodes[i]
        const val = rule.weights[i] * (Math.sign(v) ** nI) * Math.pow(Math.abs(v), nF)
        const x = xOf(v)
        const pulse = 1 + 0.12 * Math.sin(frame.current * 0.08 + i)
        ctx.strokeStyle = bad ? '#f0883e' : '#3fb950'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x, baseY)
        ctx.lineTo(x, baseY - (val / peak) * (TOP_H - 104) * pulse)
        ctx.stroke()
        ctx.fillStyle = bad ? '#f0883e' : '#3fb950'
        ctx.beginPath()
        ctx.arc(x, baseY, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#c9d1d9'
      ctx.font = '12px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`integrand  v^${nI} w(v)      Q = ${Q} nodes`, PAD_L, 20)
      ctx.fillStyle = '#58a6ff'
      ctx.fillText('— exact curve', PAD_L, 38)
      ctx.fillStyle = bad ? '#f0883e' : '#3fb950'
      ctx.fillText(bad ? '| node samples (moment MISSED)' : '| node samples (moment exact)', PAD_L + 100, 38)

      // ---- bottom panel: |error| per moment degree, log scale ----
      const by0 = TOP_H + 26
      const by1 = H - 34
      const bw = (W - PAD_L - PAD_R) / (NMAX + 1)
      const logLo = -16
      const logHi = 3
      const hOf = (e: number) => {
        const l = Math.log10(Math.max(e, 1e-18))
        return ((Math.min(Math.max(l, logLo), logHi) - logLo) / (logHi - logLo)) * (by1 - by0)
      }
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD_L, by1)
      ctx.lineTo(W - PAD_R, by1)
      ctx.stroke()
      for (const gl of [-12, -6, 0]) {
        const y = by1 - hOf(Math.pow(10, gl))
        ctx.strokeStyle = '#21262d'
        ctx.beginPath()
        ctx.moveTo(PAD_L, y)
        ctx.lineTo(W - PAD_R, y)
        ctx.stroke()
        ctx.fillStyle = '#6e7681'
        ctx.font = '9px ui-monospace, monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`1e${gl}`, PAD_L - 5, y + 3)
      }
      for (let n = 0; n <= NMAX; n++) {
        const x = PAD_L + n * bw + 5
        const h = hOf(errors[n])
        const exactHere = errors[n] <= 1e-9
        const live = n === nI
        ctx.fillStyle = exactHere ? '#238636' : '#da3633'
        if (live) ctx.fillStyle = exactHere ? '#3fb950' : '#f85149'
        ctx.fillRect(x, by1 - h, bw - 10, h)
        ctx.fillStyle = live ? '#e6edf3' : '#6e7681'
        ctx.font = live ? 'bold 11px ui-monospace, monospace' : '10px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(n), x + (bw - 10) / 2, by1 + 14)
      }
      // 2Q-1 marker
      const cliffX = PAD_L + (2 * Q - 1 + 1) * bw
      ctx.strokeStyle = '#d29922'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(cliffX, by0 - 6)
      ctx.lineTo(cliffX, by1)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#d29922'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`2Q-1 = ${2 * Q - 1}`, Math.min(cliffX + 5, W - 80), by0 + 4)
      ctx.fillStyle = '#c9d1d9'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText('|quadrature - exact|   per moment degree n', PAD_L, TOP_H + 14)
      ctx.fillStyle = '#6e7681'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('moment degree n', (W + PAD_L) / 2, H - 6)

      if (frame.current % 12 === 0) {
        setReadout({ n: nI, quad, exact, err: Math.abs(quad - exact) })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [Q, nTarget, sweeping, rule, errors])

  return (
    <div style={{ margin: '1.6rem 0', fontFamily: 'ui-monospace, monospace' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 8, border: '1px solid #30363d', display: 'block' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.7rem', alignItems: 'center', fontSize: 13 }}>
        <label>
          nodes Q = <b>{Q}</b>{' '}
          <input type="range" min={1} max={6} step={1} value={Q} onChange={(e) => setQ(Number(e.target.value))} />
        </label>
        <label style={{ opacity: sweeping ? 0.45 : 1 }}>
          degree n = <b>{nTarget}</b>{' '}
          <input
            type="range"
            min={0}
            max={NMAX}
            step={1}
            value={nTarget}
            disabled={sweeping}
            onChange={(e) => setNTarget(Number(e.target.value))}
          />
        </label>
        <button
          onClick={() => setSweeping((s) => !s)}
          style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid #30363d', background: '#21262d', color: '#c9d1d9', cursor: 'pointer' }}
        >
          {sweeping ? 'pause sweep' : 'sweep n'}
        </button>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: 13, color: '#8b949e' }}>
        n = {readout.n}: quadrature {readout.quad.toFixed(4)} vs exact {readout.exact.toFixed(1)} → error{' '}
        <b style={{ color: readout.err > 1e-9 ? '#f85149' : '#3fb950' }}>{readout.err.toExponential(2)}</b>
        {'  ·  '}Q = {Q} is exact through degree {firstFail - 1} (2Q-1 = {2 * Q - 1})
      </div>
    </div>
  )
}
