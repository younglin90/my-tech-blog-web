'use client'

import { useEffect, useRef, useState } from 'react'

// Adiabatic flame temperature as an "area match":
// the heat released Q (per mol CH4) must equal the area under Cp_products(T) from 298 K to T_ad.
// NASA 7-coefficient cp(T) rises with T, so its area grows faster than the frozen cp(298 K) rectangle.

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
const SPECIES = ['N2', 'H2O', 'CO2', 'O2']
const COLORS: Record<string, string> = { N2: '#94a3b8', H2O: '#38bdf8', CO2: '#f59e0b', O2: '#a78bfa' }

const W = 680
const HH = 380
const PAD = { l: 62, r: 20, t: 18, b: 44 }
const TMAX = 3000

export function NasaCpAreaFillLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [phi, setPhi] = useState(1)
  const [stack, setStack] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ q: 0, tn: T0, tf: T0, Q: 0 })
  const st = useRef({ f: 0, playing: true })

  useEffect(() => { st.current.f = 0 }, [phi])
  useEffect(() => { st.current.playing = playing }, [playing])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = HH * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    const [reac, prod] = mixture(phi)
    const Q = Hmix(reac, T0) - Hmix(prod, T0) // J per mol CH4 (lower heating value)
    const cpP = (T: number) => Object.entries(prod).reduce((s, [k, n]) => s + n * R * cpR(k, T), 0)
    const cp298 = cpP(T0)
    // T where area under NASA curve equals target (bisection on enthalpy)
    const tNasa = (q: number) => {
      let lo = T0, hi = 6000
      const h0 = Hmix(prod, T0)
      for (let i = 0; i < 50; i++) {
        const m = 0.5 * (lo + hi)
        if (Hmix(prod, m) - h0 < q) lo = m
        else hi = m
      }
      return 0.5 * (lo + hi)
    }
    const tFrozen = (q: number) => T0 + q / cp298
    const ymax = Math.ceil(cpP(TMAX) / 50) * 50 + 20
    const X = (T: number) => PAD.l + ((T - T0) / (TMAX - T0)) * (W - PAD.l - PAD.r)
    const Y = (c: number) => HH - PAD.b - (c / ymax) * (HH - PAD.t - PAD.b)
    let raf = 0
    let frame = 0

    const draw = () => {
      const s = st.current
      if (s.playing) {
        s.f += 0.005
        if (s.f > 1.4) s.f = 0
      }
      const f = Math.min(1, s.f)
      const q = f * Q
      const tn = tNasa(q)
      const tf = tFrozen(q)
      ctx.clearRect(0, 0, W, HH)
      ctx.font = '11px system-ui, sans-serif'
      // axes
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, HH - PAD.b); ctx.lineTo(W - PAD.r, HH - PAD.b)
      ctx.stroke()
      ctx.fillStyle = '#64748b'
      for (let T = 500; T <= TMAX; T += 500) {
        ctx.fillText(String(T), X(T) - 12, HH - PAD.b + 15)
      }
      for (let c = 0; c <= ymax; c += 100) {
        ctx.fillText(String(c), PAD.l - 28, Y(c) + 4)
        ctx.strokeStyle = 'rgba(100,116,139,0.15)'
        ctx.beginPath(); ctx.moveTo(PAD.l, Y(c)); ctx.lineTo(W - PAD.r, Y(c)); ctx.stroke()
      }
      ctx.fillText('T [K]', W - PAD.r - 30, HH - 8)
      ctx.save(); ctx.translate(14, HH / 2 + 70); ctx.rotate(-Math.PI / 2)
      ctx.fillText('Cp of products [J/K per mol CH4]', 0, 0); ctx.restore()
      // Tmid marker
      ctx.setLineDash([3, 4]); ctx.strokeStyle = '#94a3b8'
      ctx.beginPath(); ctx.moveTo(X(1000), PAD.t); ctx.lineTo(X(1000), HH - PAD.b); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#94a3b8'; ctx.fillText('T_mid = 1000 K', X(1000) + 4, PAD.t + 10)

      // frozen rectangle
      ctx.fillStyle = 'rgba(239,68,68,0.18)'
      ctx.fillRect(X(T0), Y(cp298), X(Math.min(tf, TMAX)) - X(T0), Y(0) - Y(cp298))
      // NASA area (stacked by species or single)
      const N = 160
      if (stack) {
        let base = new Array(N + 1).fill(0)
        for (const sp of SPECIES) {
          const n = prod[sp] || 0
          if (n <= 0) continue
          ctx.fillStyle = COLORS[sp] + '99'
          ctx.beginPath()
          const top: number[] = []
          for (let i = 0; i <= N; i++) {
            const T = T0 + ((tn - T0) * i) / N
            top.push(base[i] + n * R * cpR(sp, T))
          }
          for (let i = 0; i <= N; i++) ctx.lineTo(X(T0 + ((tn - T0) * i) / N), Y(top[i]))
          for (let i = N; i >= 0; i--) ctx.lineTo(X(T0 + ((tn - T0) * i) / N), Y(base[i]))
          ctx.closePath(); ctx.fill()
          base = top
        }
      } else {
        ctx.fillStyle = 'rgba(37,99,235,0.3)'
        ctx.beginPath(); ctx.moveTo(X(T0), Y(0))
        for (let i = 0; i <= N; i++) { const T = T0 + ((tn - T0) * i) / N; ctx.lineTo(X(T), Y(cpP(T))) }
        ctx.lineTo(X(tn), Y(0)); ctx.closePath(); ctx.fill()
      }
      // curves
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2
      ctx.beginPath()
      for (let T = T0; T <= TMAX; T += 10) ctx.lineTo(X(T), Y(cpP(T)))
      ctx.stroke()
      ctx.strokeStyle = '#ef4444'; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(X(T0), Y(cp298)); ctx.lineTo(X(TMAX), Y(cp298)); ctx.stroke()
      ctx.setLineDash([])
      // markers
      const mark = (T: number, col: string, label: string, dy: number) => {
        if (T > TMAX) T = TMAX
        ctx.strokeStyle = col; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(X(T), PAD.t + 18); ctx.lineTo(X(T), HH - PAD.b); ctx.stroke()
        ctx.fillStyle = col; ctx.font = 'bold 12px system-ui, sans-serif'
        ctx.fillText(label, Math.min(X(T) + 4, W - 130), PAD.t + 30 + dy)
        ctx.font = '11px system-ui, sans-serif'
      }
      mark(tn, '#2563eb', `NASA ${tn.toFixed(0)} K`, 0)
      mark(tf, '#ef4444', `cp(298) ${tf.toFixed(0)} K`, 16)
      // legend
      ctx.fillStyle = '#2563eb'; ctx.fillText('— NASA 7-coef Cp(T)', PAD.l + 10, HH - PAD.b - 40)
      ctx.fillStyle = '#ef4444'; ctx.fillText('- - frozen Cp(298 K)', PAD.l + 10, HH - PAD.b - 26)
      if (stack) {
        let x = PAD.l + 140
        for (const sp of SPECIES) {
          if (!(prod[sp] > 0)) continue
          ctx.fillStyle = COLORS[sp]; ctx.fillRect(x, HH - PAD.b - 49, 10, 10)
          ctx.fillStyle = '#64748b'; ctx.fillText(sp, x + 13, HH - PAD.b - 40); x += 50
        }
      }
      if (++frame % 12 === 0) setRead({ q, tn, tf, Q })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [phi, stack])

  return (
    <div className="my-6 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W, aspectRatio: `${W}/${HH}` }} />
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28">φ (equiv.): {phi.toFixed(2)}</span>
          <input type="range" min={0.4} max={1} step={0.02} value={phi} onChange={(e) => setPhi(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={stack} onChange={(e) => setStack(e.target.checked)} />
          <span>stack area by species</span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded border px-3 py-1" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="rounded border px-3 py-1" onClick={() => (st.current.f = 0)}>
          Reset
        </button>
        <span className="font-mono text-xs">
          Q released {(read.q / 1000).toFixed(0)} / {(read.Q / 1000).toFixed(0)} kJ · T_NASA {read.tn.toFixed(0)} K · T_cp298{' '}
          {read.tf.toFixed(0)} K · gap {(read.tf - read.tn).toFixed(0)} K
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Shaded area = heat absorbed by the products. Both areas grow at the same rate; the NASA curve is taller at high T, so it reaches Q at a lower temperature.
      </p>
    </div>
  )
}
