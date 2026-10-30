'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 470
const U = 1
const P0 = 1e5
const EPS = 1e-6
const RHO0 = [1000, 1.2]
const C_AIR = 340
const T_END = 0.3
const GREY = 'rgba(127,127,127,0.85)'

type AlphaRule = 1 | 2 | 'central'
type CaseDef = { name: string; ar: AlphaRule; mo: 1 | 2; color: string }
const CASES: CaseDef[] = [
  { name: 'A  alpha 1st / mass 1st', ar: 1, mo: 1, color: '#22c55e' },
  { name: 'B  alpha 1st / mass 2nd', ar: 1, mo: 2, color: '#ef4444' },
  { name: 'C  alpha 2nd / mass 2nd', ar: 2, mo: 2, color: '#38bdf8' },
  { name: 'D  alpha central / mass 1st', ar: 'central', mo: 1, color: '#fbbf24' },
]

function minmodSlope(q: Float64Array, s: Float64Array) {
  const n = q.length
  for (let i = 0; i < n; i++) {
    const a = q[i] - q[(i - 1 + n) % n]
    const b = q[(i + 1) % n] - q[i]
    s[i] = a * b > 0 ? Math.sign(a) * Math.min(Math.abs(a), Math.abs(b)) : 0
  }
}

// Rusanov flux with S=|u|, u>0 -> upwind face value (MUSCL-minmod if order 2)
function faceFlux(q: Float64Array, order: number, F: Float64Array, s: Float64Array) {
  if (order === 2) minmodSlope(q, s)
  for (let i = 0; i < q.length; i++) F[i] = U * (order === 2 ? q[i] + 0.5 * s[i] : q[i])
}
function centralFlux(q: Float64Array, F: Float64Array) {
  const n = q.length
  for (let i = 0; i < n; i++) F[i] = 0.5 * U * (q[i] + q[(i + 1) % n])
}

type Sim = { a1: Float64Array; m1: Float64Array; m2: Float64Array; dp: Float64Array; hist: number[]; max: number }

function initSim(N: number): Sim {
  const dx = 1 / N
  const a1 = new Float64Array(N), m1 = new Float64Array(N), m2 = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * dx
    a1[i] = Math.abs(x - 0.3) < 0.15 ? 1 - EPS : EPS
    m1[i] = RHO0[0] * a1[i]
    m2[i] = RHO0[1] * (1 - a1[i])
  }
  return { a1, m1, m2, dp: new Float64Array(N), hist: [], max: 0 }
}

// p_mix - p0 = sum_s alpha_s c_s^2 (rho_s - rho0_s) with rho_s = m_s / alpha_s
function mixtureDp(s: Sim, cw: number) {
  const c2 = [cw * cw, C_AIR * C_AIR]
  let mx = 0
  for (let i = 0; i < s.a1.length; i++) {
    const a = [s.a1[i], 1 - s.a1[i]]
    const m = [s.m1[i], s.m2[i]]
    let pm = 0
    for (let k = 0; k < 2; k++) {
      const p = P0 + c2[k] * (m[k] / a[k] - RHO0[k])
      pm += a[k] * p
    }
    s.dp[i] = Math.abs(pm - P0)
    mx = Math.max(mx, s.dp[i])
  }
  s.max = mx
  return mx
}

export function AlphaMassConsistencyRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [N, setN] = useState(200)
  const [cfl, setCfl] = useState(0.5)
  const [cw, setCw] = useState(1500)
  const [spf, setSpf] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<{ n: number; ns: number; dp: number[] }>({ n: 0, ns: 0, dp: [0, 0, 0, 0] })
  const adv = useRef<(k: number) => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dx = 1 / N
    const dt = (cfl * dx) / U
    const ns = Math.round(T_END / dt)
    const sims = CASES.map(() => initSim(N))
    const Fa = new Float64Array(N), F1 = new Float64Array(N), F2 = new Float64Array(N), sl = new Float64Array(N)
    let n = 0
    sims.forEach((s) => mixtureDp(s, cw))

    const stepOne = () => {
      if (n >= ns) return
      const r = dt / dx
      CASES.forEach((c, k) => {
        const s = sims[k]
        if (c.ar === 'central') centralFlux(s.a1, Fa)
        else faceFlux(s.a1, c.ar, Fa, sl)
        faceFlux(s.m1, c.mo, F1, sl)
        faceFlux(s.m2, c.mo, F2, sl)
        const na = new Float64Array(N)
        for (let i = 0; i < N; i++) {
          const im = (i - 1 + N) % N
          na[i] = Math.min(1 - EPS, Math.max(EPS, s.a1[i] - r * (Fa[i] - Fa[im])))
        }
        const n1 = s.m1.slice(), n2 = s.m2.slice()
        for (let i = 0; i < N; i++) {
          const im = (i - 1 + N) % N
          n1[i] = s.m1[i] - r * (F1[i] - F1[im])
          n2[i] = s.m2[i] - r * (F2[i] - F2[im])
        }
        s.a1.set(na); s.m1.set(n1); s.m2.set(n2)
        s.hist.push(Math.log10(Math.max(1e-8, mixtureDp(s, cw))))
      })
      n++
    }
    adv.current = (k: number) => { for (let j = 0; j < k; j++) stepOne(); draw() }

    const pad = 58, pw = W - pad - 16
    const X = (i: number) => pad + ((i + 0.5) / N) * pw
    const LMIN = -8, LMAX = 10

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      ctx!.font = '12px ui-monospace, monospace'
      // panel 1: alpha_water
      const y1 = 14, h1 = 110
      ctx!.strokeStyle = GREY; ctx!.strokeRect(pad, y1, pw, h1)
      ctx!.fillStyle = GREY
      ctx!.fillText('α_water', 6, y1 + 14)
      ctx!.fillText('1', pad - 12, y1 + 10); ctx!.fillText('0', pad - 12, y1 + h1)
      CASES.forEach((c, k) => {
        const s = sims[k]
        ctx!.strokeStyle = c.color; ctx!.lineWidth = 1.5
        ctx!.beginPath()
        for (let i = 0; i < N; i++) {
          const yy = y1 + h1 - Math.min(1.2, Math.max(-0.2, s.a1[i])) * h1
          if (i === 0) ctx!.moveTo(X(i), yy); else ctx!.lineTo(X(i), yy)
        }
        ctx!.stroke()
      })
      // panel 2: log10 |p_mix - p0| per cell
      const y2 = 145, h2 = 140
      const Yl = (v: number, y0: number, h: number) => y0 + h - ((Math.max(LMIN, Math.min(LMAX, v)) - LMIN) / (LMAX - LMIN)) * h
      ctx!.lineWidth = 1; ctx!.strokeStyle = GREY; ctx!.strokeRect(pad, y2, pw, h2)
      ctx!.fillStyle = GREY
      for (const v of [-8, -4, 0, 4, 8]) ctx!.fillText(`1e${v}`, 8, Yl(v, y2, h2) + 4)
      ctx!.fillText('|p_mix − p0| per cell [Pa]', pad + 6, y2 + 14)
      CASES.forEach((c, k) => {
        const s = sims[k]
        ctx!.strokeStyle = c.color; ctx!.lineWidth = 1.5
        ctx!.beginPath()
        for (let i = 0; i < N; i++) {
          const yy = Yl(Math.log10(Math.max(1e-8, s.dp[i])), y2, h2)
          if (i === 0) ctx!.moveTo(X(i), yy); else ctx!.lineTo(X(i), yy)
        }
        ctx!.stroke()
      })
      // panel 3: history of max |dp|
      const y3 = 310, h3 = 130
      ctx!.lineWidth = 1; ctx!.strokeStyle = GREY; ctx!.strokeRect(pad, y3, pw, h3)
      ctx!.fillStyle = GREY
      for (const v of [-8, 0, 8]) ctx!.fillText(`1e${v}`, 8, Yl(v, y3, h3) + 4)
      ctx!.fillText(`max |p_mix − p0| vs step  (stops at t = ${T_END}, step ${ns})`, pad + 6, y3 + 14)
      ctx!.fillText(`step ${n}`, pad + pw - 70, H - 10)
      CASES.forEach((c, k) => {
        const h = sims[k].hist
        ctx!.strokeStyle = c.color; ctx!.lineWidth = 1.8
        ctx!.beginPath()
        h.forEach((v, j) => {
          const xx = pad + ((j + 1) / ns) * pw, yy = Yl(v, y3, h3)
          if (j === 0) ctx!.moveTo(xx, yy); else ctx!.lineTo(xx, yy)
        })
        ctx!.stroke()
      })
      ctx!.lineWidth = 1
    }

    let raf = 0, frame = 0
    const loop = () => {
      if (playing) for (let j = 0; j < spf; j++) stepOne()
      draw()
      if (++frame % 12 === 0) setRead({ n, ns, dp: sims.map((s) => s.max) })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [N, cfl, cw, spf, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          N = {N}{' '}
          <input type="range" min={50} max={200} step={10} value={N} onChange={(e) => { setN(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
        <label>
          CFL = {cfl.toFixed(2)}{' '}
          <input type="range" min={0.1} max={0.9} step={0.05} value={cfl} onChange={(e) => { setCfl(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
        <label>
          c_water = {cw} m/s{' '}
          <input type="range" min={100} max={1500} step={50} value={cw} onChange={(e) => { setCw(Number(e.target.value)); setNonce((v) => v + 1) }} />
        </label>
        <label>
          steps/frame = {spf}{' '}
          <input type="range" min={1} max={10} step={1} value={spf} onChange={(e) => setSpf(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(1) }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div>steps = {read.n} / {read.ns}</div>
        {CASES.map((c, k) => (
          <div key={c.name} style={{ color: c.color }}>
            {c.name.padEnd(30, ' ')} max|p_mix − p0| = {read.dp[k].toExponential(3)} Pa
          </div>
        ))}
      </div>
    </div>
  )
}
