'use client'

import { useEffect, useRef, useState } from 'react'

const R = 8.314462618
type Coef = number[]
const NASA: Record<string, [Coef, Coef]> = {
  CH4: [[5.14987613, -1.36709788e-2, 4.91800599e-5, -4.84743026e-8, 1.66693956e-11, -1.02466476e4, -4.64130376],
        [7.4851495e-2, 1.33909467e-2, -5.73285809e-6, 1.22292535e-9, -1.0181523e-13, -9.46834459e3, 18.437318]],
  O2: [[3.78245636, -2.99673416e-3, 9.84730201e-6, -9.68129509e-9, 3.24372837e-12, -1.06394356e3, 3.65767573],
       [3.28253784, 1.48308754e-3, -7.57966669e-7, 2.09470555e-10, -2.16717794e-14, -1.08845772e3, 5.45323129]],
  N2: [[3.298677, 1.4082404e-3, -3.963222e-6, 5.641515e-9, -2.444854e-12, -1.0208999e3, 3.950372],
       [2.92664, 1.4879768e-3, -5.68476e-7, 1.0097038e-10, -6.753351e-15, -9.227977e2, 5.980528]],
  CO2: [[2.35677352, 8.98459677e-3, -7.12356269e-6, 2.45919022e-9, -1.43699548e-13, -4.83719697e4, 9.90105222],
        [3.85746029, 4.41437026e-3, -2.21481404e-6, 5.23490188e-10, -4.72084164e-14, -4.8759166e4, 2.27163806]],
  H2O: [[4.19864056, -2.0364341e-3, 6.52040211e-6, -5.48797062e-9, 1.77197817e-12, -3.02937267e4, -0.849032208],
        [3.03399249, 2.17691804e-3, -1.64072518e-7, -9.7041987e-11, 1.68200992e-14, -3.00042971e4, 4.9667701]],
}
const co = (s: string, T: number) => NASA[s][T < 1000 ? 0 : 1]
const cpR = (s: string, T: number) => {
  const a = co(s, T)
  return a[0] + T * (a[1] + T * (a[2] + T * (a[3] + T * a[4])))
}
const hRT = (s: string, T: number) => {
  const a = co(s, T)
  return a[0] + T * (a[1] / 2 + T * (a[2] / 3 + T * (a[3] / 4 + T * a[4] / 5))) + a[5] / T
}
type Mix = Record<string, number>
const mixture = (phi: number): [Mix, Mix] => [
  { CH4: 1, O2: 2 / phi, N2: 7.52 / phi },
  { CO2: 1, H2O: 2, O2: 2 * (1 / phi - 1), N2: 7.52 / phi },
]
const Hmix = (m: Mix, T: number) => Object.entries(m).reduce((s, [k, n]) => s + n * R * T * hRT(k, T), 0)
const T0 = 298.15
// Reproduces flame_newton(): solve H_prod(T) = H_reac(298 K) by Newton, NASA cp(T) vs frozen cp(298 K).
const Hfz = (m: Mix, T: number) =>
  Object.entries(m).reduce((s, [k, n]) => s + n * R * (hRT(k, T0) * T0 + cpR(k, T0) * (T - T0)), 0)
const Cpm = (m: Mix, T: number) => Object.entries(m).reduce((s, [k, n]) => s + n * R * cpR(k, T), 0)

type Run = { T: number; hist: number[]; Ts: number[]; done: boolean; it: number }
const W = 680
const HH = 300
const H2 = 170
const TOL = 1e-6
const COL = { n: '#2563eb', f: '#ef4444' }
const FRAMES = 28

export function AdiabaticFlameNewtonRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [phi, setPhi] = useState(1)
  const [tg, setTg] = useState(1500)
  const [playing, setPlaying] = useState(false)
  const [scan, setScan] = useState<{ phi: number; tn: number; tf: number }[]>([])
  const [read, setRead] = useState({ itn: 0, itf: 0, tn: 1500, tf: 1500, dn: 0, df: 0 })
  const scanRef = useRef(scan)
  scanRef.current = scan
  const sim = useRef({ n: null as unknown as Run, f: null as unknown as Run, p: 0, playing: false, step: false, scanning: false })

  const reset = (T: number) => {
    const mk = (): Run => ({ T, hist: [], Ts: [T], done: false, it: 0 })
    sim.current.n = mk(); sim.current.f = mk(); sim.current.p = 0
  }
  if (!sim.current.n) reset(tg)
  useEffect(() => { reset(tg) }, [phi, tg])
  useEffect(() => { sim.current.playing = playing }, [playing])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = (HH + H2) * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    const [reac, prod] = mixture(phi)
    const Hr = Hmix(reac, T0)
    const fN = (T: number) => (Hmix(prod, T) - Hr) / 1000
    const fF = (T: number) => (Hfz(prod, T) - Hr) / 1000
    const dN = (T: number) => Cpm(prod, T) / 1000
    const dF = () => Cpm(prod, T0) / 1000
    const TA = 250, TB = 3800
    const fmin = Math.min(fN(TA), fF(TA)), fmax = Math.max(fN(TB), fF(TB))
    const P = { l: 58, r: 16, t: 14, b: 30 }
    const X = (T: number) => P.l + ((T - TA) / (TB - TA)) * (W - P.l - P.r)
    const Y = (v: number) => P.t + ((fmax - v) / (fmax - fmin)) * (HH - P.t - P.b)
    let raf = 0, frame = 0

    const iterate = (r: Run, frozen: boolean) => {
      if (r.done) return
      const f = frozen ? fF(r.T) : fN(r.T)
      const dT = -f / (frozen ? dF() : dN(r.T))
      r.T += dT; r.it++; r.Ts.push(r.T); r.hist.push(Math.abs(dT))
      if (Math.abs(dT) < TOL || r.it > 40) r.done = true
    }

    const draw = () => {
      const s = sim.current
      if (s.playing || s.step) {
        s.p += 1 / FRAMES
        if (s.p >= 1) {
          iterate(s.n, false); iterate(s.f, true); s.p = 0; s.step = false
          if (s.n.done && s.f.done) {
            const tn = s.n.T, tf = s.f.T
            setScan((old) => [...old.filter((o) => Math.abs(o.phi - phi) > 1e-6), { phi, tn, tf }].sort((a, b) => a.phi - b.phi))
            if (s.scanning && phi < 0.999) setPhi((v) => Math.round((v + 0.1) * 10) / 10)
            else { s.scanning = false; s.playing = false; setPlaying(false) }
          }
        }
      }
      ctx.clearRect(0, 0, W, HH + H2)
      ctx.font = '11px system-ui, sans-serif'
      // top: residual curves f(T)
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(P.l, P.t); ctx.lineTo(P.l, HH - P.b); ctx.lineTo(W - P.r, HH - P.b); ctx.stroke()
      ctx.strokeStyle = 'rgba(100,116,139,0.6)'
      ctx.beginPath(); ctx.moveTo(P.l, Y(0)); ctx.lineTo(W - P.r, Y(0)); ctx.stroke()
      ctx.fillStyle = '#64748b'
      for (let T = 500; T <= 3500; T += 500) ctx.fillText(String(T), X(T) - 12, HH - P.b + 14)
      ctx.fillText('T [K]', W - P.r - 28, HH - 6)
      ctx.fillText('f(T) = H_prod(T) − H_reac(298) [kJ]', P.l + 6, P.t + 8)
      ctx.fillText('0', P.l - 12, Y(0) + 4)
      for (const [fn, c] of [[fN, COL.n], [fF, COL.f]] as const) {
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath()
        for (let T = TA; T <= TB; T += 20) ctx.lineTo(X(T), Y(fn(T)))
        ctx.stroke()
      }
      // Newton tangents (current, animated)
      const drawRun = (r: Run, fn: (T: number) => number, d: (T: number) => number, c: string) => {
        ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1
        for (let i = 0; i < r.Ts.length - 1; i++) {
          const a = r.Ts[i], b = r.Ts[i + 1]
          ctx.globalAlpha = 0.35
          ctx.beginPath(); ctx.moveTo(X(a), Y(fn(a))); ctx.lineTo(X(b), Y(0)); ctx.lineTo(X(b), Y(fn(b))); ctx.stroke()
          ctx.globalAlpha = 1
        }
        const T = r.T
        ctx.beginPath(); ctx.arc(X(T), Y(fn(T)), 4, 0, 7); ctx.fill()
        if (!r.done && s.p > 0) {
          const Tn = T - fn(T) / d(T)
          const tt = T + (Tn - T) * s.p
          ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.moveTo(X(T), Y(fn(T))); ctx.lineTo(X(tt), Y(fn(T) * (1 - s.p))); ctx.stroke()
          ctx.setLineDash([])
        }
      }
      drawRun(s.n, fN, dN, COL.n)
      drawRun(s.f, fF, dF, COL.f)
      ctx.fillStyle = COL.n; ctx.fillText('NASA cp(T)', W - P.r - 150, P.t + 26)
      ctx.fillStyle = COL.f; ctx.fillText('frozen cp(298)', W - P.r - 150, P.t + 40)

      // bottom-left: |ΔT| history (log)
      const y0 = HH + 10, bh = H2 - 34, lx = P.l, lw = 290
      ctx.strokeStyle = '#64748b'
      ctx.beginPath(); ctx.moveTo(lx, y0); ctx.lineTo(lx, y0 + bh); ctx.lineTo(lx + lw, y0 + bh); ctx.stroke()
      ctx.fillStyle = '#64748b'
      const LY = (v: number) => y0 + ((4 - Math.log10(Math.max(v, 1e-10))) / 14) * bh
      for (const e of [3, -2, -7]) ctx.fillText(`1e${e}`, lx - 32, LY(10 ** e) + 4)
      ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(lx, LY(TOL)); ctx.lineTo(lx + lw, LY(TOL)); ctx.stroke(); ctx.setLineDash([])
      ctx.fillText('|ΔT| [K] vs iteration (tol 1e-6)', lx + 6, y0 + 8)
      for (let k = 0; k <= 8; k += 2) ctx.fillText(String(k), lx + (k / 8) * lw - 3, y0 + bh + 13)
      for (const [r, c] of [[s.n, COL.n], [s.f, COL.f]] as const) {
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2; ctx.beginPath()
        r.hist.forEach((v, i) => { const x = lx + ((i + 1) / 8) * lw; i ? ctx.lineTo(x, LY(v)) : ctx.moveTo(x, LY(v)) })
        ctx.stroke()
        r.hist.forEach((v, i) => { ctx.beginPath(); ctx.arc(lx + ((i + 1) / 8) * lw, LY(v), 3, 0, 7); ctx.fill() })
      }
      // bottom-right: T_ad vs phi scan
      const sx0 = 420, sw = W - P.r - sx0
      const SX = (p: number) => sx0 + ((p - 0.4) / 0.65) * sw
      const SY = (T: number) => y0 + ((3000 - T) / 1700) * bh
      ctx.strokeStyle = '#64748b'
      ctx.beginPath(); ctx.moveTo(sx0, y0); ctx.lineTo(sx0, y0 + bh); ctx.lineTo(sx0 + sw, y0 + bh); ctx.stroke()
      ctx.fillStyle = '#64748b'
      for (const T of [1500, 2000, 2500, 3000]) ctx.fillText(String(T), sx0 - 30, SY(T) + 4)
      for (const p of [0.5, 0.75, 1.0]) ctx.fillText(p.toFixed(2), SX(p) - 10, y0 + bh + 13)
      ctx.fillText('T_ad [K] vs φ (converged runs)', sx0 + 6, y0 + 8)
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#94a3b8'
      ctx.beginPath(); ctx.moveTo(SX(phi), y0); ctx.lineTo(SX(phi), y0 + bh); ctx.stroke(); ctx.setLineDash([])
      for (const key of ['tn', 'tf'] as const) {
        const c = key === 'tn' ? COL.n : COL.f
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.5; ctx.beginPath()
        scanRef.current.forEach((o, i) => (i ? ctx.lineTo(SX(o.phi), SY(o[key])) : ctx.moveTo(SX(o.phi), SY(o[key]))))
        ctx.stroke()
        scanRef.current.forEach((o) => { ctx.beginPath(); ctx.arc(SX(o.phi), SY(o[key]), 3, 0, 7); ctx.fill() })
      }
      if (++frame % 10 === 0)
        setRead({ itn: s.n.it, itf: s.f.it, tn: s.n.T, tf: s.f.T, dn: s.n.hist[s.n.hist.length - 1] ?? 0, df: s.f.hist[s.f.hist.length - 1] ?? 0 })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [phi])

  const startScan = () => {
    setScan([]); sim.current.scanning = true; setPhi(0.5); reset(tg); setPlaying(true)
  }

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W, aspectRatio: `${W}/${HH + H2}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28">φ: {phi.toFixed(2)}</span>
          <input type="range" min={0.4} max={1} step={0.05} value={phi} onChange={(e) => setPhi(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28">T guess: {tg} K</span>
          <input type="range" min={300} max={3500} step={50} value={tg} onChange={(e) => setTg(+e.target.value)} className="flex-1" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="rounded border px-3 py-1" onClick={() => (sim.current.step = true)}>Step</button>
        <button className="rounded border px-3 py-1" onClick={() => { reset(tg); setPlaying(false); sim.current.scanning = false }}>Reset</button>
        <button className="rounded border px-3 py-1" onClick={startScan}>Scan φ 0.5→1.0</button>
      </div>
      <div className="mt-2 font-mono text-xs">
        <span style={{ color: COL.n }}>NASA: iter {read.itn}, T {read.tn.toFixed(1)} K, |ΔT| {read.dn.toExponential(1)}</span>
        {'  ·  '}
        <span style={{ color: COL.f }}>cp298: iter {read.itf}, T {read.tf.toFixed(1)} K, |ΔT| {read.df.toExponential(1)}</span>
        {'  ·  '}gap {(read.tf - read.tn).toFixed(1)} K
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Each Step is one Newton update T ← T − f(T)/Cp(T). The frozen-cp residual is a straight line, so Newton lands in one move and confirms on the second.
      </p>
    </div>
  )
}
