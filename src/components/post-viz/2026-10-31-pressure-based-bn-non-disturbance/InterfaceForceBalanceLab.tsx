'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 440
const N = 48
const DX = 1 / N
const U0 = 1
const DT = (0.5 * DX) / U0
const RHO_W = 1000
const EPS = 1e-6
const GREY = 'rgba(127,127,127,0.85)'
const C_A = '#38bdf8'
const C_R = '#ef4444'
const C_U = '#22c55e'

type Rule = 'jump' | 'averaged' | 'omitted'
const RULES: { key: Rule; label: string }[] = [
  { key: 'jump', label: 'H_P = P_I (α_{i+1} − α_i)  (eq. 49)' },
  { key: 'averaged', label: 'H_P = P_I · face-avg of central ∂α' },
  { key: 'omitted', label: 'H_P = 0' },
]

const wrap = (i: number) => ((i % N) + N) % N

function alphaAt(i: number, x0: number, w: number) {
  const x = (i + 0.5) * DX
  let d = x - x0
  d -= Math.round(d)
  const a = 0.5 * (1 + Math.tanh((0.2 - Math.abs(d)) / (w * DX)))
  return Math.min(1 - EPS, Math.max(EPS, a))
}

// -[(aP)_{i+1} - (aP)_i] + H_P on the staggered face between cell i and i+1
function faceResidual(a: Float64Array, P: number, rule: Rule) {
  const R = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const ap = a[wrap(i + 1)], am = a[i]
    const grad = -(ap * P - am * P)
    let hp = 0
    if (rule === 'jump') hp = P * (ap - am)
    else if (rule === 'averaged') {
      const g0 = 0.5 * (a[wrap(i + 1)] - a[wrap(i - 1)])
      const g1 = 0.5 * (a[wrap(i + 2)] - a[i])
      hp = P * 0.5 * (g0 + g1)
    }
    R[i] = grad + hp
  }
  return R
}

export function InterfaceForceBalanceLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [rule, setRule] = useState<Rule>('averaged')
  const [width, setWidth] = useState(1)
  const [logP, setLogP] = useState(5)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, R: 0, du: 0 })
  const adv = useRef<(k: number) => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const P = 10 ** logP
    let x0 = 0.5
    let n = 0
    const uk = new Float64Array(N).fill(U0)
    let a = new Float64Array(N)
    let R = new Float64Array(N)
    const refresh = () => {
      for (let i = 0; i < N; i++) a[i] = alphaAt(i, x0, width)
      R = faceResidual(a, P, rule)
    }
    refresh()

    const step = () => {
      for (let i = 0; i < N; i++) {
        const af = 0.5 * (a[i] + a[wrap(i + 1)])
        if (af > 0.5) uk[i] += (DT * R[i]) / (DX * af * RHO_W)
      }
      x0 = (x0 + U0 * DT) % 1
      n++
      refresh()
    }
    adv.current = (k: number) => { for (let j = 0; j < k; j++) step(); draw() }

    const pad = 54
    const pw = W - pad - 20
    const X = (i: number) => pad + (i / N) * pw

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      ctx!.font = '12px ui-monospace, monospace'
      // panel 1: alpha (water fraction) and cells
      const y1 = 20, h1 = 110
      ctx!.strokeStyle = GREY
      ctx!.strokeRect(pad, y1, pw, h1)
      ctx!.fillStyle = 'rgba(56,189,248,0.25)'
      for (let i = 0; i < N; i++) {
        const h = a[i] * h1
        ctx!.fillRect(X(i) + 1, y1 + h1 - h, pw / N - 2, h)
      }
      ctx!.fillStyle = C_A
      ctx!.fillText('α_water per cell (uniform P everywhere)', pad + 6, y1 + 14)
      ctx!.fillStyle = GREY
      ctx!.fillText('1', pad - 14, y1 + 10)
      ctx!.fillText('0', pad - 14, y1 + h1)

      // panel 2: face residual R_k
      const y2 = 155, h2 = 110
      ctx!.strokeStyle = GREY
      ctx!.strokeRect(pad, y2, pw, h2)
      const mid = y2 + h2 / 2
      ctx!.beginPath(); ctx!.moveTo(pad, mid); ctx!.lineTo(pad + pw, mid); ctx!.stroke()
      let Rmax = 0
      for (let i = 0; i < N; i++) Rmax = Math.max(Rmax, Math.abs(R[i]))
      const Rscale = Math.max(Rmax, 1e-9 * P, 1)
      for (let i = 0; i < N; i++) {
        const h = (R[i] / Rscale) * (h2 / 2 - 6)
        const xf = X(i + 1)
        ctx!.fillStyle = Math.abs(R[i]) < 1e-6 * P ? C_U : C_R
        ctx!.fillRect(xf - 3, Math.min(mid, mid - h), 6, Math.max(1.5, Math.abs(h)))
      }
      ctx!.fillStyle = C_R
      ctx!.fillText(`face force R_k = −Δ(αP) + H_P   (scale ±${Rscale.toExponential(1)} Pa)`, pad + 6, y2 + 14)

      // panel 3: water velocity on faces
      const y3 = 290, h3 = 120
      ctx!.strokeStyle = GREY
      ctx!.strokeRect(pad, y3, pw, h3)
      let dmax = 0
      for (let i = 0; i < N; i++) dmax = Math.max(dmax, Math.abs(uk[i] - U0))
      const span = Math.max(0.05, dmax * 1.1)
      const Y = (u: number) => y3 + h3 / 2 - ((u - U0) / span) * (h3 / 2 - 6)
      ctx!.setLineDash([4, 4])
      ctx!.beginPath(); ctx!.moveTo(pad, Y(U0)); ctx!.lineTo(pad + pw, Y(U0)); ctx!.stroke()
      ctx!.setLineDash([])
      ctx!.strokeStyle = C_U
      ctx!.lineWidth = 2
      ctx!.beginPath()
      for (let i = 0; i < N; i++) {
        const xf = X(i + 1), yy = Y(uk[i])
        if (i === 0) ctx!.moveTo(xf, yy); else ctx!.lineTo(xf, yy)
      }
      ctx!.stroke()
      ctx!.lineWidth = 1
      ctx!.fillStyle = C_U
      ctx!.fillText(`water velocity on faces [m/s] — should stay at u = 1  (±${span.toExponential(1)})`, pad + 6, y3 + 14)
      ctx!.fillStyle = GREY
      ctx!.fillText('x →  (interface moves with u = 1, CFL 0.5)', pad + pw - 300, H - 8)
      return { R: Rmax, du: dmax }
    }

    let raf = 0
    let frame = 0
    const loop = () => {
      if (playing) step()
      const r = draw()
      if (++frame % 12 === 0) setRead({ n, R: r.R, du: r.du })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [rule, width, logP, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {RULES.map((r) => (
          <button key={r.key} style={btn(rule === r.key)} onClick={() => { setRule(r.key); setNonce((v) => v + 1) }}>{r.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          interface width = {width.toFixed(1)} cells{' '}
          <input type="range" min={0.5} max={8} step={0.5} value={width} onChange={(e) => { setWidth(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
        <label>
          P = {(10 ** logP).toExponential(1)} Pa{' '}
          <input type="range" min={3} max={7} step={0.1} value={logP} onChange={(e) => { setLogP(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(1) }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div>step {read.n} · max|R_k| = {read.R.toExponential(2)} Pa</div>
        <div style={{ color: C_U }}>max|u_water − 1| = {read.du.toExponential(2)} m/s (water-rich faces)</div>
      </div>
    </div>
  )
}
