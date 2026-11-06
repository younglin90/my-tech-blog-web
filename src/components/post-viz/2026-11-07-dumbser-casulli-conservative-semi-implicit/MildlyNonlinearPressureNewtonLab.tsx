'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 440
const N = 32
const CV = 1.0
const R = 0.4
const B = 0.5
const GAMMA = 1.4
const BG = '#0b0f19'
const GREY = 'rgba(160,160,170,0.95)'
const TARGET = '#facc15'
const CUR = '#38bdf8'
const OLD = 'rgba(56,189,248,0.25)'
const TAN = '#f97316'

type Eos = 'ideal' | 'vdw' | 'rk'

const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N)
const rhoCell = xs.map((x) => 1 + 0.4 * Math.sin(2 * Math.PI * x))

// T(p, rho): ideal → not needed; vdW → closed form; Redlich–Kwong → Newton on monotone p(T)
function tempOf(p: number, rho: number, eos: Eos, a: number): number {
  const v = 1 / rho
  if (eos === 'vdw') return ((p + a * rho * rho) * (v - B)) / R
  let T = Math.max((p * (v - B)) / R, 1e-3)
  for (let k = 0; k < 60; k++) {
    const f = (R * T) / (v - B) - a / (Math.sqrt(T) * v * (v + B)) - p
    const d = R / (v - B) + (0.5 * a) / (Math.pow(T, 1.5) * v * (v + B))
    const Tn = Math.max(T - f / d, 1e-8)
    if (Math.abs(Tn - T) < 1e-14 * Math.max(1, T)) { T = Tn; break }
    T = Tn
  }
  return T
}

// V(p) = rho * e(p, rho)  (Δx = 1)
function Vof(p: number, rho: number, eos: Eos, a: number): number {
  if (eos === 'ideal') return p / (GAMMA - 1)
  const T = tempOf(p, rho, eos, a)
  const v = 1 / rho
  if (eos === 'vdw') return rho * (CV * T - a * rho)
  return rho * (CV * T + ((1.5 * a) / (B * Math.sqrt(T))) * Math.log(v / (v + B)))
}

function dVof(p: number, rho: number, eos: Eos, a: number): number {
  const h = 1e-6 * Math.max(1, Math.abs(p))
  return (Vof(p + h, rho, eos, a) - Vof(p - h, rho, eos, a)) / (2 * h)
}

function thomas(lo: number[], di: number[], up: number[], rhs: number[]): number[] {
  const n = rhs.length
  const cp = new Array(n).fill(0), dp = new Array(n).fill(0)
  cp[0] = up[0] / di[0]; dp[0] = rhs[0] / di[0]
  for (let i = 1; i < n; i++) {
    const m = di[i] - lo[i] * cp[i - 1]
    cp[i] = up[i] / m; dp[i] = (rhs[i] - lo[i] * dp[i - 1]) / m
  }
  const x = new Array(n).fill(0)
  x[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
  return x
}

// T p with Neumann ends: (T p)_i = κ(2p_i − p_{i−1} − p_{i+1}) (one-sided at ends)
function applyT(p: number[], kap: number): number[] {
  return p.map((pi, i) => {
    let s = 0
    if (i > 0) s += kap * (pi - p[i - 1])
    if (i < N - 1) s += kap * (pi - p[i + 1])
    return s
  })
}

type Setup = { target: number[]; b: number[]; iters: number[][]; res: number[] }

function buildSetup(eos: Eos, kap: number, amp: number, a: number): Setup {
  const target = xs.map((x) => 1 + amp * Math.exp(-(((x - 0.5) / 0.08) ** 2)))
  const Tp = applyT(target, kap)
  const b = target.map((pt, i) => Vof(pt, rhoCell[i], eos, a) + Tp[i])
  const residual = (p: number[]) => {
    const Tq = applyT(p, kap)
    return p.map((q, i) => Vof(q, rhoCell[i], eos, a) + Tq[i] - b[i])
  }
  const bmax = Math.max(...b.map(Math.abs))
  let p = new Array(N).fill(1)
  const iters = [p.slice()]
  const res: number[] = []
  for (let k = 0; k < 12; k++) {
    const F = residual(p)
    const rn = Math.max(...F.map(Math.abs)) / bmax
    res.push(rn)
    if (rn < 1e-12) break
    const lo = new Array(N).fill(0), up = new Array(N).fill(0), di = new Array(N).fill(0)
    for (let i = 0; i < N; i++) {
      di[i] = dVof(p[i], rhoCell[i], eos, a)
      if (i > 0) { di[i] += kap; lo[i] = -kap }
      if (i < N - 1) { di[i] += kap; up[i] = -kap }
    }
    const dp = thomas(lo, di, up, F)
    p = p.map((q, i) => q - dp[i])
    iters.push(p.slice())
  }
  return { target, b, iters, res }
}

const FRAMES_PER_ITER = 45

export function MildlyNonlinearPressureNewtonLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [eos, setEos] = useState<Eos>('rk')
  const [logKap, setLogKap] = useState(1)
  const [amp, setAmp] = useState(6)
  const [attr, setAttr] = useState(0.5)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ k: 0, res: 1, total: 0 })
  const stepRef = useRef<() => void>(() => {})
  const playingRef = useRef(playing)
  playingRef.current = playing

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const kap = Math.pow(10, logKap)
    const S = buildSetup(eos, kap, amp, attr)
    const nIt = S.iters.length - 1
    let k = 0 // completed iterations
    let f = 0 // frame within transition to k+1
    let moving = false
    let frame = 0
    let raf = 0

    const pmax = Math.max(...S.target, ...S.iters.flat()) * 1.1
    const pmin = Math.min(0, ...S.iters.flat())
    const mainX0 = 60, mainX1 = 470, mainY0 = 40, mainY1 = 270
    const px = (x: number) => mainX0 + x * (mainX1 - mainX0)
    const py = (p: number) => mainY1 - ((p - pmin) / (pmax - pmin)) * (mainY1 - mainY0)

    const peak = N / 2
    const insX0 = 530, insX1 = 735, insY0 = 40, insY1 = 270
    const prMax = pmax
    const vMax = Vof(prMax, rhoCell[peak], eos, attr)
    const vMin = Math.min(0, Vof(Math.max(pmin, 0.05), rhoCell[peak], eos, attr))
    const ix = (p: number) => insX0 + (p / prMax) * (insX1 - insX0)
    const iy = (v: number) => insY1 - ((v - vMin) / (vMax - vMin)) * (insY1 - insY0)

    const resX0 = 60, resX1 = 735, resY0 = 315, resY1 = 420
    const ry = (r: number) => {
      const l = Math.log10(Math.max(r, 1e-16))
      return resY0 + ((0 - l) / 16) * (resY1 - resY0)
    }

    const draw = () => {
      const t = moving ? f / FRAMES_PER_ITER : 0
      const pa = S.iters[k]
      const pb = S.iters[Math.min(k + 1, nIt)]
      const pc = pa.map((q, i) => q + (pb[i] - q) * (t * t * (3 - 2 * t)))

      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'

      // main panel axes
      ctx.strokeStyle = 'rgba(160,160,170,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(mainX0, mainY0, mainX1 - mainX0, mainY1 - mainY0)
      ctx.fillStyle = GREY
      ctx.fillText('pressure p_i (cell centers)', mainX0, mainY0 - 12)
      ctx.fillText('x', mainX1 - 8, mainY1 + 16)
      for (const v of [pmin, (pmin + pmax) / 2, pmax]) ctx.fillText(v.toFixed(1), 8, py(v) + 4)

      // density as faint bars
      for (let i = 0; i < N; i++) {
        const h = (rhoCell[i] / 1.4) * 40
        ctx.fillStyle = 'rgba(167,139,250,0.18)'
        ctx.fillRect(px(i / N) + 1, mainY1 - h, (mainX1 - mainX0) / N - 2, h)
      }
      ctx.fillStyle = 'rgba(167,139,250,0.8)'; ctx.fillText('ρ_i (known from mass eq.)', mainX0 + 6, mainY1 - 46)

      // target
      ctx.setLineDash([6, 4]); ctx.strokeStyle = TARGET; ctx.lineWidth = 1.5
      ctx.beginPath(); S.target.forEach((q, i) => (i ? ctx.lineTo(px(xs[i]), py(q)) : ctx.moveTo(px(xs[i]), py(q)))); ctx.stroke()
      ctx.setLineDash([])
      // old iterates
      for (let j = 0; j < k; j++) {
        ctx.strokeStyle = OLD; ctx.lineWidth = 1
        ctx.beginPath(); S.iters[j].forEach((q, i) => (i ? ctx.lineTo(px(xs[i]), py(q)) : ctx.moveTo(px(xs[i]), py(q)))); ctx.stroke()
      }
      // current
      ctx.strokeStyle = CUR; ctx.lineWidth = 2.2
      ctx.beginPath(); pc.forEach((q, i) => (i ? ctx.lineTo(px(xs[i]), py(q)) : ctx.moveTo(px(xs[i]), py(q)))); ctx.stroke()
      for (let i = 0; i < N; i++) { ctx.fillStyle = CUR; ctx.beginPath(); ctx.arc(px(xs[i]), py(pc[i]), 2.4, 0, 7); ctx.fill() }
      ctx.fillStyle = TARGET; ctx.fillText('- - exact solution of V(p)+Tp=b', mainX0 + 200, mainY0 + 16)
      ctx.fillStyle = CUR; ctx.fillText(`— Newton iterate k=${k}${moving ? '→' + (k + 1) : ''}`, mainX0 + 200, mainY0 + 32)

      // inset: V(p) for peak cell, with tangent at the current iterate
      ctx.strokeStyle = 'rgba(160,160,170,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(insX0, insY0, insX1 - insX0, insY1 - insY0)
      ctx.fillStyle = GREY
      ctx.fillText(`V(p)=ρe(p,ρ) at peak cell`, insX0, insY0 - 12)
      ctx.fillText('p →', insX1 - 26, insY1 + 16)
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2
      ctx.beginPath()
      for (let s = 0; s <= 80; s++) {
        const p = 0.05 + (s / 80) * (prMax - 0.05)
        const v = Vof(p, rhoCell[peak], eos, attr)
        if (s) ctx.lineTo(ix(p), iy(v)); else ctx.moveTo(ix(p), iy(v))
      }
      ctx.stroke()
      // straight chord from origin-ish to end: shows (non)linearity
      ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(160,160,170,0.6)'
      const p0 = 0.05, v0 = Vof(p0, rhoCell[peak], eos, attr)
      ctx.beginPath(); ctx.moveTo(ix(p0), iy(v0)); ctx.lineTo(ix(prMax), iy(vMax)); ctx.stroke(); ctx.setLineDash([])
      const pk = Math.max(pc[peak], 0.05)
      const vk = Vof(pk, rhoCell[peak], eos, attr), sk = dVof(pk, rhoCell[peak], eos, attr)
      ctx.strokeStyle = TAN; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(ix(pk - 0.35 * prMax), iy(vk - 0.35 * prMax * sk)); ctx.lineTo(ix(pk + 0.35 * prMax), iy(vk + 0.35 * prMax * sk)); ctx.stroke()
      ctx.fillStyle = CUR; ctx.beginPath(); ctx.arc(ix(pk), iy(vk), 4, 0, 7); ctx.fill()
      ctx.fillStyle = TARGET; ctx.beginPath(); ctx.arc(ix(S.target[peak]), iy(Vof(S.target[peak], rhoCell[peak], eos, attr)), 3, 0, 7); ctx.fill()
      ctx.fillStyle = TAN; ctx.fillText(`tangent V'(p) = ${sk.toFixed(3)}`, insX0 + 6, insY0 + 16)
      ctx.fillStyle = GREY; ctx.fillText('dashed: straight chord', insX0 + 6, insY0 + 32)

      // residual history
      ctx.fillStyle = GREY
      ctx.fillText('relative residual ‖V(p)+Tp−b‖∞ / ‖b‖∞ per Newton iteration (log)', resX0, resY0 - 10)
      ctx.strokeStyle = 'rgba(160,160,170,0.4)'
      ctx.strokeRect(resX0, resY0, resX1 - resX0, resY1 - resY0)
      for (const e of [0, -4, -8, -12, -16]) ctx.fillText(`1e${e}`, 14, ry(Math.pow(10, e)) + 4)
      const shown = Math.min(k + 1, S.res.length)
      const bw = (resX1 - resX0) / 12
      for (let j = 0; j < shown; j++) {
        const y = ry(S.res[j])
        ctx.fillStyle = S.res[j] < 1e-12 ? '#34d399' : TAN
        ctx.fillRect(resX0 + j * bw + 6, y, bw - 12, resY1 - y)
        ctx.fillStyle = GREY; ctx.fillText(`k=${j}`, resX0 + j * bw + 10, resY1 + 14)
      }
    }

    const advance = () => {
      if (k >= nIt) return
      moving = true; f = 0
    }
    stepRef.current = advance

    const loop = () => {
      if (moving) {
        f++
        if (f >= FRAMES_PER_ITER) { moving = false; k++; f = 0 }
      } else if (playingRef.current && k < nIt) {
        frame++
        if (frame % 20 === 0) advance()
      }
      draw()
      if (frame % 12 === 0 || !moving) setRead((r) => (r.k === k && r.total === nIt ? r : { k, res: S.res[Math.min(k, S.res.length - 1)], total: nIt }))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [eos, logKap, amp, attr, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const eosLabel: Record<Eos, string> = { ideal: 'Ideal gas', vdw: 'van der Waals', rk: 'Redlich–Kwong' }

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {(['ideal', 'vdw', 'rk'] as Eos[]).map((e) => (
          <button key={e} style={btn(eos === e)} onClick={() => setEos(e)}>{eosLabel[e]}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, fontSize: 13, alignItems: 'center' }}>
        <label>
          coupling κ = Δt²h/Δx² = 1e{logKap.toFixed(1)}{' '}
          <input type="range" min={-2} max={4} step={0.5} value={logKap} onChange={(e) => setLogKap(Number(e.target.value))} />
        </label>
        <label>
          pulse amplitude = {amp}{' '}
          <input type="range" min={1} max={12} step={1} value={amp} onChange={(e) => setAmp(Number(e.target.value))} />
        </label>
        <label>
          attraction a = {attr.toFixed(2)}{' '}
          <input type="range" min={0} max={2} step={0.1} value={attr} onChange={(e) => setAttr(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step (1 Newton iter)</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, color: GREY }}>
        {eosLabel[eos]} · iteration {read.k} / {read.total} · residual = {read.res.toExponential(2)}
        {read.total === 1 ? ' → e(p) is linear in p: one Newton step is exact' : ` → curved e(p): ${read.total} Newton steps, T stays symmetric`}
      </div>
    </div>
  )
}
