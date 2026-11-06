'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 460
const G = 1.4
const BG = '#0b0f19'
const GREY = 'rgba(160,160,170,0.95)'
const CONS = '#38bdf8'
const PRIM = '#f97316'
const EXACT = '#facc15'

type Rp = { name: string; rL: number; uL: number; pL: number; rR: number; uR: number; pR: number; xd: number; tend: number }
const PROBS: Record<string, Rp> = {
  RP3: { name: 'RP3 (blast, p ratio 1e5)', rL: 1, uL: 0, pL: 1000, rR: 1, uR: 0, pR: 0.01, xd: 0.1, tend: 0.012 },
  Sod: { name: 'Sod (RP1)', rL: 1, uL: 0, pL: 1, rR: 0.125, uR: 0, pR: 0.1, xd: 0, tend: 0.2 },
}

function starState(rp: Rp): { ps: number; us: number } {
  const fk = (p: number, r: number, pk: number) => {
    const a = Math.sqrt((G * pk) / r)
    if (p > pk) {
      const A = 2 / ((G + 1) * r), Bc = ((G - 1) / (G + 1)) * pk
      return (p - pk) * Math.sqrt(A / (p + Bc))
    }
    return ((2 * a) / (G - 1)) * (Math.pow(p / pk, (G - 1) / (2 * G)) - 1)
  }
  let p = 0.5 * (rp.pL + rp.pR)
  for (let k = 0; k < 100; k++) {
    const f = fk(p, rp.rL, rp.pL) + fk(p, rp.rR, rp.pR) + rp.uR - rp.uL
    const d = 1e-7 * p
    const df = (fk(p + d, rp.rL, rp.pL) + fk(p + d, rp.rR, rp.pR) - fk(p - d, rp.rL, rp.pL) - fk(p - d, rp.rR, rp.pR)) / (2 * d)
    p = Math.max(p - f / df, 1e-10)
  }
  const us = 0.5 * (rp.uL + rp.uR) + 0.5 * (fk(p, rp.rR, rp.pR) - fk(p, rp.rL, rp.pL))
  return { ps: p, us }
}

function thomas(lo: Float64Array, di: Float64Array, up: Float64Array, rhs: Float64Array): Float64Array {
  const n = rhs.length
  const cp = new Float64Array(n), dp = new Float64Array(n)
  cp[0] = up[0] / di[0]; dp[0] = rhs[0] / di[0]
  for (let i = 1; i < n; i++) {
    const m = di[i] - lo[i] * cp[i - 1]
    cp[i] = up[i] / m; dp[i] = (rhs[i] - lo[i] * dp[i - 1]) / m
  }
  const x = new Float64Array(n)
  x[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
  return x
}

type Sim = {
  N: number; dx: number; xc: Float64Array
  rf: Float64Array; mf: Float64Array; p: Float64Array; rE: Float64Array
  t: number; dt: number; steps: number; E0: number
}

function cellRk(r: Float64Array, m: Float64Array): Float64Array {
  const n = r.length - 1
  const k = new Float64Array(n)
  for (let i = 0; i < n; i++) k[i] = 0.5 * (0.5 * (m[i] * m[i]) / r[i] + 0.5 * (m[i + 1] * m[i + 1]) / r[i + 1])
  return k
}

function initSim(rp: Rp, N: number): Sim {
  const dx = 1 / N
  const xc = new Float64Array(N), rf = new Float64Array(N + 1), mf = new Float64Array(N + 1), p = new Float64Array(N)
  for (let j = 0; j <= N; j++) {
    const x = -0.5 + j * dx
    rf[j] = x < rp.xd ? rp.rL : rp.rR
    mf[j] = rf[j] * (x < rp.xd ? rp.uL : rp.uR)
  }
  for (let i = 0; i < N; i++) { xc[i] = -0.5 + (i + 0.5) * dx; p[i] = xc[i] < rp.xd ? rp.pL : rp.pR }
  const kc = cellRk(rf, mf)
  const rE = new Float64Array(N)
  let E0 = 0
  for (let i = 0; i < N; i++) { rE[i] = p[i] / (G - 1) + kc[i]; E0 += rE[i] * dx }
  return { N, dx, xc, rf, mf, p, rE, t: 0, dt: 1e-4, steps: 0, E0 }
}

function totalEnergy(s: Sim): number {
  const kc = cellRk(s.rf, s.mf)
  let E = 0
  for (let i = 0; i < s.N; i++) E += (s.p[i] / (G - 1) + kc[i]) * s.dx
  return E
}

// shared explicit convection on the faces: eqs (11)(12)(14)(15)
function convect(s: Sim, cfl: number, tend: number) {
  const { N, dx, rf, mf } = s
  const u = new Float64Array(N + 1)
  let umaxAll = 1e-12
  for (let j = 0; j <= N; j++) { u[j] = mf[j] / rf[j]; umaxAll = Math.max(umaxAll, Math.abs(u[j])) }
  const dt = Math.min((cfl * dx) / umaxAll, 1.1 * s.dt, tend - s.t)
  const fr = new Float64Array(N), fm = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const um = Math.max(Math.abs(u[i]), Math.abs(u[i + 1]))
    fr[i] = 0.5 * (mf[i] + mf[i + 1]) - 0.5 * um * (rf[i + 1] - rf[i])
    fm[i] = 0.5 * (u[i] * mf[i] + u[i + 1] * mf[i + 1]) - 0.5 * um * (mf[i + 1] - mf[i])
  }
  const rn = Float64Array.from(rf), Fm = Float64Array.from(mf)
  for (let j = 1; j < N; j++) {
    rn[j] -= (dt / dx) * (fr[j] - fr[j - 1])
    Fm[j] -= (dt / dx) * (fm[j] - fm[j - 1])
  }
  return { u, dt, rn, Fm }
}

function faceEnthalpy(pr: Float64Array, rn: Float64Array): Float64Array {
  const N = pr.length
  const h = new Float64Array(N + 1)
  for (let j = 0; j <= N; j++) {
    const pf = Math.max(0, j === 0 ? pr[0] : j === N ? pr[N - 1] : Math.max(pr[j - 1], pr[j]))
    h[j] = ((G / (G - 1)) * pf) / rn[j]
  }
  return h
}

// Dumbser–Casulli conservative semi-implicit step (Picard + eq. (24))
function stepConservative(s: Sim, cfl: number, picard: number, tend: number) {
  const { N, dx } = s
  const { u, dt, rn, Fm } = convect(s, cfl, tend)
  let kc = cellRk(s.rf, s.mf)
  const fk = new Float64Array(N + 1)
  fk[0] = u[0] * kc[0]; fk[N] = u[N] * kc[N - 1]
  for (let j = 1; j < N; j++) fk[j] = 0.5 * u[j] * (kc[j] + kc[j - 1]) - 0.5 * Math.abs(u[j]) * (kc[j] - kc[j - 1])
  const FE = new Float64Array(N)
  for (let i = 0; i < N; i++) FE[i] = s.rE[i] - (dt / dx) * (fk[i + 1] - fk[i])
  let m: Float64Array = Float64Array.from(Fm)
  let pr: Float64Array = Float64Array.from(s.p)
  const lo = new Float64Array(N), di = new Float64Array(N), up = new Float64Array(N), b = new Float64Array(N)
  for (let r = 0; r < picard; r++) {
    const h = faceEnthalpy(pr, rn)
    kc = cellRk(rn, m)
    const w = new Float64Array(N + 1)
    for (let j = 1; j < N; j++) w[j] = (dt * dt * h[j]) / dx
    for (let i = 0; i < N; i++) {
      b[i] = dx * (FE[i] - kc[i]) - dt * (h[i + 1] * Fm[i + 1] - h[i] * Fm[i])
      di[i] = dx / (G - 1) + w[i + 1] + w[i]
      lo[i] = -w[i]; up[i] = -w[i + 1]
    }
    pr = thomas(lo, di, up, b)
    m = Float64Array.from(Fm)
    for (let j = 1; j < N; j++) m[j] -= (dt / dx) * (pr[j] - pr[j - 1])
  }
  const h = faceEnthalpy(pr, rn)
  const rE = new Float64Array(N)
  for (let i = 0; i < N; i++) rE[i] = FE[i] - (dt / dx) * (h[i + 1] * m[i + 1] - h[i] * m[i])
  kc = cellRk(rn, m)
  const p = new Float64Array(N)
  for (let i = 0; i < N; i++) p[i] = (G - 1) * (rE[i] - kc[i])
  s.rf = rn; s.mf = m; s.rE = rE; s.p = p
  s.t += dt; s.dt = dt; s.steps++
}

// non-conservative comparison: primitive pressure equation p_t + u p_x + G p u_x = 0
function stepPrimitive(s: Sim, cfl: number, tend: number) {
  const { N, dx } = s
  const { u, dt, rn, Fm } = convect(s, cfl, tend)
  const p = s.p
  const lo = new Float64Array(N), di = new Float64Array(N), up = new Float64Array(N), b = new Float64Array(N)
  const w = new Float64Array(N + 1)
  for (let j = 1; j < N; j++) w[j] = (dt * dt) / (dx * dx * rn[j])
  for (let i = 0; i < N; i++) {
    const uc = 0.5 * (u[i] + u[i + 1])
    const pl = i > 0 ? p[i - 1] : p[0], prr = i < N - 1 ? p[i + 1] : p[N - 1]
    const Fp = p[i] - (dt / dx) * (Math.max(uc, 0) * (p[i] - pl) + Math.min(uc, 0) * (prr - p[i]))
    const gp = G * p[i]
    b[i] = Fp - (dt / dx) * gp * (Fm[i + 1] / rn[i + 1] - Fm[i] / rn[i])
    di[i] = 1 + gp * (w[i + 1] + w[i])
    lo[i] = -gp * w[i]; up[i] = -gp * w[i + 1]
  }
  const pn = thomas(lo, di, up, b)
  const m = Float64Array.from(Fm)
  for (let j = 1; j < N; j++) m[j] -= (dt / dx) * (pn[j] - pn[j - 1])
  s.rf = rn; s.mf = m; s.p = pn
  s.t += dt; s.dt = dt; s.steps++
}

function shockX(s: Sim, ps: number, pR: number): number {
  const mid = 0.5 * (ps + pR)
  let i = -1
  for (let k = 0; k < s.N; k++) if (s.p[k] > mid) i = k
  if (i < 0 || i >= s.N - 1) return NaN
  return s.xc[i] + ((s.p[i] - mid) / (s.p[i] - s.p[i + 1])) * (s.xc[i + 1] - s.xc[i])
}

function plateau(s: Sim, xd: number, xs: number): number {
  let sum = 0, n = 0
  for (let i = 0; i < s.N; i++) if (s.xc[i] > xd && s.xc[i] < xs - 0.03) { sum += s.p[i]; n++ }
  return n ? sum / n : NaN
}

type Readout = {
  t: number; nC: number; nP: number; xsC: number; xsP: number; xsE: number
  pC: number; pP: number; ps: number; dEC: number; dEP: number; done: boolean
}

export function ConservativeShockPlacementRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [prob, setProb] = useState<'RP3' | 'Sod'>('RP3')
  const [N, setN] = useState(200)
  const [cfl, setCfl] = useState(0.5)
  const [picard, setPicard] = useState(3)
  const [spf, setSpf] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Readout | null>(null)
  const stepRef = useRef<() => void>(() => {})
  const playingRef = useRef(playing)
  playingRef.current = playing
  const spfRef = useRef(spf)
  spfRef.current = spf

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const rp = PROBS[prob]
    const { ps, us } = starState(rp)
    const q = (G - 1) / (G + 1)
    const rs = (rp.rR * (ps / rp.pR + q)) / ((q * ps) / rp.pR + 1)
    const S = (rs * us) / (rs - rp.rR)
    const xsFinal = rp.xd + S * rp.tend
    const C = initSim(rp, N), P = initSim(rp, N)
    const histC: [number, number][] = [], histP: [number, number][] = []
    let frame = 0, raf = 0

    const finished = (s: Sim) => s.t >= rp.tend - 1e-12
    const stepBoth = () => {
      if (!finished(C)) stepConservative(C, cfl, picard, rp.tend)
      if (!finished(P)) stepPrimitive(P, cfl, rp.tend)
      const xe = (t: number) => rp.xd + S * t
      const a = shockX(C, ps, rp.pR), b = shockX(P, ps, rp.pR)
      if (Number.isFinite(a) && C.t > 0.05 * rp.tend) histC.push([C.t, a - xe(C.t)])
      if (Number.isFinite(b) && P.t > 0.05 * rp.tend) histP.push([P.t, b - xe(P.t)])
    }
    stepRef.current = stepBoth

    const pTop = rp.pL * 1.15
    const X0 = 60, X1 = 735, Y0 = 34, Y1 = 250
    const sx = (x: number) => X0 + (x + 0.5) * (X1 - X0)
    const sy = (p: number) => Y1 - (p / pTop) * (Y1 - Y0)
    const HX0 = 60, HX1 = 735, HY0 = 300, HY1 = 430
    const errMax = 0.08
    const hx = (t: number) => HX0 + (t / rp.tend) * (HX1 - HX0)
    const hy = (e: number) => (HY0 + HY1) / 2 - (e / errMax) * ((HY1 - HY0) / 2)

    const line = (s: Sim, col: string) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < s.N; i++) { const X = sx(s.xc[i]), Y = sy(s.p[i]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y) }
      ctx.stroke()
    }

    const draw = () => {
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      ctx.strokeStyle = 'rgba(160,160,170,0.45)'; ctx.lineWidth = 1
      ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0)
      ctx.fillStyle = GREY
      ctx.fillText(`pressure p(x)   t = ${C.t.toFixed(4)} / ${rp.tend}`, X0, Y0 - 12)
      for (const v of [0, rp.pL / 2, rp.pL]) ctx.fillText(String(+v.toPrecision(3)), 8, sy(v) + 4)
      for (const v of [-0.5, 0, 0.5]) ctx.fillText(v.toFixed(1), sx(v) - 10, Y1 + 15)
      // exact markers: shock position and p* plateau
      const xe = rp.xd + S * C.t
      ctx.setLineDash([5, 4]); ctx.strokeStyle = EXACT; ctx.lineWidth = 1.3
      ctx.beginPath(); ctx.moveTo(sx(xe), Y0); ctx.lineTo(sx(xe), Y1); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(sx(rp.xd), sy(ps)); ctx.lineTo(sx(xe), sy(ps)); ctx.stroke()
      ctx.setLineDash([])
      line(P, PRIM)
      line(C, CONS)
      ctx.fillStyle = EXACT; ctx.fillText(`- - exact shock x and p* = ${ps.toFixed(3)}`, X0 + 300, Y0 + 16)
      ctx.fillStyle = CONS; ctx.fillText('— conservative SI (energy eq. 24)', X0 + 300, Y0 + 32)
      ctx.fillStyle = PRIM; ctx.fillText('— primitive pressure-eq. SI', X0 + 300, Y0 + 48)

      // history of shock-position error
      ctx.strokeStyle = 'rgba(160,160,170,0.45)'; ctx.strokeRect(HX0, HY0, HX1 - HX0, HY1 - HY0)
      ctx.beginPath(); ctx.moveTo(HX0, hy(0)); ctx.lineTo(HX1, hy(0)); ctx.stroke()
      ctx.fillStyle = GREY
      ctx.fillText('shock position error  x_num − x_exact  vs time', HX0, HY0 - 10)
      for (const e of [-errMax, 0, errMax]) ctx.fillText(e.toFixed(2), 14, hy(e) + 4)
      const hl = (h: [number, number][], col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        h.forEach(([t, e], i) => { const Y = hy(Math.max(-errMax, Math.min(errMax, e))); if (i) ctx.lineTo(hx(t), Y); else ctx.moveTo(hx(t), Y) })
        ctx.stroke()
      }
      hl(histP, PRIM); hl(histC, CONS)
      ctx.fillStyle = GREY; ctx.fillText(`Δx = ${(1 / N).toFixed(4)}`, HX1 - 100, HY0 + 14)
    }

    const publish = () => {
      const done = finished(C) && finished(P)
      setRead({
        t: C.t, nC: C.steps, nP: P.steps,
        xsC: shockX(C, ps, rp.pR), xsP: shockX(P, ps, rp.pR), xsE: rp.xd + S * C.t,
        pC: plateau(C, rp.xd, xsFinal), pP: plateau(P, rp.xd, xsFinal), ps,
        dEC: (C.rE.reduce((a, v) => a + v, 0) * C.dx - C.E0) / C.E0,
        dEP: (totalEnergy(P) - P.E0) / P.E0, done,
      })
      if (done) setPlaying(false)
    }

    const loop = () => {
      frame++
      if (playingRef.current && !(finished(C) && finished(P))) {
        for (let k = 0; k < spfRef.current; k++) stepBoth()
      }
      draw()
      if (frame % 12 === 0) publish()
      raf = requestAnimationFrame(loop)
    }
    stepRef.current = () => { stepBoth(); draw(); publish() }
    draw(); publish()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [prob, N, cfl, picard, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const f4 = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : '—')
  const f3 = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : '—')

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {(['RP3', 'Sod'] as const).map((k) => (
          <button key={k} style={btn(prob === k)} onClick={() => { setProb(k); setPlaying(true) }}>{PROBS[k].name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, fontSize: 13, alignItems: 'center' }}>
        <label>
          cells N = {N}{' '}
          <input type="range" min={50} max={400} step={50} value={N} onChange={(e) => { setN(Number(e.target.value)); setPlaying(true) }} />
        </label>
        <label>
          CFL (|u| only) = {cfl.toFixed(2)}{' '}
          <input type="range" min={0.1} max={0.9} step={0.05} value={cfl} onChange={(e) => { setCfl(Number(e.target.value)); setPlaying(true) }} />
        </label>
        <label>
          Picard iterations = {picard}{' '}
          <input type="range" min={1} max={4} step={1} value={picard} onChange={(e) => { setPicard(Number(e.target.value)); setPlaying(true) }} />
        </label>
        <label>
          steps/frame = {spf}{' '}
          <input type="range" min={1} max={8} step={1} value={spf} onChange={(e) => setSpf(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      {read && (
        <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7, color: GREY }}>
          <div>t = {read.t.toFixed(4)} · exact shock x = {f4(read.xsE)} · exact p* = {f3(read.ps)}{read.done ? ' · finished' : ''}</div>
          <div style={{ color: CONS }}>
            conservative SI: steps {read.nC} · shock x {f4(read.xsC)} · p* {f3(read.pC)} · energy drift {(read.dEC * 100).toExponential(1)} %
          </div>
          <div style={{ color: PRIM }}>
            primitive p-eq SI: steps {read.nP} · shock x {f4(read.xsP)} · p* {f3(read.pP)} · energy drift {(read.dEP * 100).toFixed(2)} %
          </div>
        </div>
      )}
    </div>
  )
}
