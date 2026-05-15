'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// Scalar problem: V(eta) + T*eta = b
// V(eta) = max(0, min(1, eta))  (piecewise linear, the "wet-depth" prototype)
// Outer linearizes V2(eta) = max(0, eta - 1)
// Inner linearizes V1(eta) = max(0, eta)
// p(eta) = 1 if eta>=0 else 0
// q(eta) = 1 if eta>1 else 0
const v = (e: number) => Math.max(0, Math.min(1, e))
const v1 = (e: number) => Math.max(0, e)
const v2 = (e: number) => Math.max(0, e - 1)
const p = (e: number) => (e >= 0 ? 1 : 0)
const q = (e: number) => (e > 1 ? 1 : 0)

type Step = { kind: 'outer' | 'inner'; n: number; m: number; eta: number; res: number }

function runNested(T: number, b: number, maxSteps = 60, tol = 1e-9): Step[] {
  const ell = 0
  const u = 1
  const steps: Step[] = []
  let etaOuter = ell - 0.4
  steps.push({ kind: 'outer', n: 0, m: 0, eta: etaOuter, res: v(etaOuter) + T * etaOuter - b })
  for (let n = 1; n <= 15 && steps.length < maxSteps; n++) {
    const Qn1 = q(etaOuter)
    const v2n1 = v2(etaOuter)
    const d = b + v2n1 - Qn1 * etaOuter
    let etaInner = u + 0.5
    steps.push({ kind: 'inner', n, m: 0, eta: etaInner, res: v(etaInner) + T * etaInner - b })
    for (let m = 1; m <= 25 && steps.length < maxSteps; m++) {
      const Pnm1 = p(etaInner)
      const v1nm1 = v1(etaInner)
      const f = Pnm1 * etaInner - v1nm1 + d
      const denom = T + Pnm1 - Qn1
      etaInner = denom === 0 ? etaInner : f / denom
      const rInner = v1(etaInner) + (T - Qn1) * etaInner - d
      steps.push({ kind: 'inner', n, m, eta: etaInner, res: rInner })
      if (Math.abs(rInner) < tol) break
    }
    etaOuter = etaInner
    const rOuter = v(etaOuter) + T * etaOuter - b
    steps.push({ kind: 'outer', n, m: 0, eta: etaOuter, res: rOuter })
    if (Math.abs(rOuter) < tol) break
  }
  return steps
}

export function NestedNewtonScalar1D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [T, setT] = useState(0.5)
  const [b, setB] = useState(0.9)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const steps = useMemo(() => runNested(T, b), [T, b])
  const last = steps[Math.min(idx, steps.length - 1)]

  useEffect(() => {
    setIdx(0)
  }, [T, b])

  useEffect(() => {
    if (!playing) return
    const loop = (t: number) => {
      if (t - lastTickRef.current > 280) {
        lastTickRef.current = t
        setIdx((i) => {
          if (i >= steps.length - 1) {
            setPlaying(false)
            return i
          }
          return i + 1
        })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, steps.length])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const M = { l: 44, r: 16, t: 16, b: 32 }
    const pw = W - M.l - M.r
    const ph = H - M.t - M.b

    const eMin = -0.6
    const eMax = 1.8
    const yMin = -0.6
    const yMax = 2.6

    const xPix = (e: number) => M.l + ((e - eMin) / (eMax - eMin)) * pw
    const yPix = (y: number) => M.t + (1 - (y - yMin) / (yMax - yMin)) * ph

    ctx.fillStyle = '#0b1424'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#1f2c44'
    ctx.lineWidth = 1
    for (let i = 0; i <= 6; i++) {
      const x = M.l + (i * pw) / 6
      ctx.beginPath()
      ctx.moveTo(x, M.t)
      ctx.lineTo(x, M.t + ph)
      ctx.stroke()
    }
    for (let i = 0; i <= 5; i++) {
      const y = M.t + (i * ph) / 5
      ctx.beginPath()
      ctx.moveTo(M.l, y)
      ctx.lineTo(M.l + pw, y)
      ctx.stroke()
    }

    // axis at eta=0 and y=b
    ctx.strokeStyle = '#3a4a66'
    ctx.beginPath()
    ctx.moveTo(xPix(0), M.t)
    ctx.lineTo(xPix(0), M.t + ph)
    ctx.stroke()

    // F(eta) = V(eta) + T*eta
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= 300; i++) {
      const e = eMin + ((eMax - eMin) * i) / 300
      const f = v(e) + T * e
      const px = xPix(e)
      const py = yPix(f)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // target line b
    ctx.strokeStyle = '#facc15'
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(M.l, yPix(b))
    ctx.lineTo(M.l + pw, yPix(b))
    ctx.stroke()
    ctx.setLineDash([])

    // history dots up to idx
    const upTo = Math.min(idx, steps.length - 1)
    for (let i = 0; i <= upTo; i++) {
      const s = steps[i]
      const px = xPix(s.eta)
      const py = yPix(v(s.eta) + T * s.eta)
      ctx.fillStyle = s.kind === 'outer' ? '#f472b6' : '#34d399'
      ctx.globalAlpha = 0.35 + (0.65 * (i + 1)) / (upTo + 1)
      ctx.beginPath()
      ctx.arc(px, py, s.kind === 'outer' ? 5 : 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // current point
    if (last) {
      const px = xPix(last.eta)
      const py = yPix(v(last.eta) + T * last.eta)
      ctx.strokeStyle = '#fafaf9'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, 7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px, M.t + ph)
      ctx.lineTo(px, py)
      ctx.stroke()
    }

    // labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText('eta', M.l + pw - 24, M.t + ph + 20)
    ctx.fillText('V(eta) + T eta', M.l + 4, M.t + 12)
    ctx.fillStyle = '#facc15'
    ctx.fillText(`b = ${b.toFixed(2)}`, M.l + pw - 80, yPix(b) - 4)
  }, [T, b, idx, steps, last])

  const reset = () => {
    setIdx(0)
    setPlaying(false)
  }
  const stepOne = () => {
    setPlaying(false)
    setIdx((i) => Math.min(i + 1, steps.length - 1))
  }

  return (
    <div style={{ margin: '1.4rem 0', padding: '0.9rem', border: '1px solid var(--border)', borderRadius: 8 }}>
      <canvas ref={canvasRef} width={640} height={300} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
      <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          T = {T.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={3}
            step={0.01}
            value={T}
            onChange={(e) => setT(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          b = {b.toFixed(2)}
          <input
            type="range"
            min={-0.5}
            max={2.5}
            step={0.01}
            value={b}
            onChange={(e) => setB(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={stepOne}
          style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
        >
          Step
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
        >
          {playing ? 'Pause' : 'Auto'}
        </button>
        <button
          onClick={reset}
          style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
        >
          Reset
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'ui-monospace, monospace' }}>
          step {Math.min(idx, steps.length - 1) + 1}/{steps.length} &middot; {last?.kind === 'outer' ? `outer n=${last.n}` : `inner n=${last?.n} m=${last?.m}`} &middot; eta={last?.eta.toFixed(4)} &middot; |r|={last ? Math.abs(last.res).toExponential(2) : '-'}
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '0.4rem', marginBottom: 0 }}>
        Pink = outer iterate (rises from below); green = inner iterate (falls from above). They squeeze toward the true root of V(eta)+T*eta=b with V(eta)=max(0,min(1,eta)).
      </p>
    </div>
  )
}
