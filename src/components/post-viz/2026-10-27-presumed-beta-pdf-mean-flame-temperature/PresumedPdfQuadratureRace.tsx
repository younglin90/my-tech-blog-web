'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const T_U = 300
const T_AD = 2230
const Z_ST = 0.055

const tBurke = (z: number) =>
  z <= Z_ST ? T_U + ((T_AD - T_U) * z) / Z_ST : T_U + ((T_AD - T_U) * (1 - z)) / (1 - Z_ST)

function lgamma(x: number): number {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x
  const t = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let s = 1.000000000190015
  for (let j = 0; j < 6; j++) s += g[j] / ++y
  return -t + Math.log((2.5066282746310005 * s) / x)
}

function betacf(a: number, b: number, x: number) {
  const tiny = 1e-300
  const qab = a + b, qap = a + 1, qam = a - 1
  let c = 1, d = 1 - (qab * x) / qap
  d = 1 / (Math.abs(d) > tiny ? d : tiny)
  let h = d
  for (let m = 1; m < 300; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d; c = 1 + aa / c
    d = 1 / (Math.abs(d) > tiny ? d : tiny); h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d; c = 1 + aa / c
    d = 1 / (Math.abs(d) > tiny ? d : tiny)
    const dl = d * c; h *= dl
    if (Math.abs(dl - 1) < 1e-14) break
  }
  return h
}

function incBeta(a: number, b: number, x: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lnf = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  if (x < (a + 1) / (a + b + 2)) return (Math.exp(lnf) * betacf(a, b, x)) / a
  return 1 - (Math.exp(lnf) * betacf(b, a, 1 - x)) / b
}

function meanT(zm: number, s: number) {
  const g = 1 / s - 1, a = zm * g, b = (1 - zm) * g
  const pLo = incBeta(a, b, Z_ST), zLo = zm * incBeta(a + 1, b, Z_ST)
  const k1 = (T_AD - T_U) / Z_ST, k2 = (T_AD - T_U) / (1 - Z_ST)
  return T_U * pLo + k1 * zLo + (T_U + k2) * (1 - pLo) - k2 * (zm - zLo)
}


// same as mean_t_grid(): pdf at n cell centres, renormalised
function meanTGrid(zm: number, s: number, n: number) {
  const g = 1 / s - 1, a = zm * g, b = (1 - zm) * g
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    const z = (i + 0.5) / n
    const p = Math.exp((a - 1) * Math.log(z) + (b - 1) * Math.log(1 - z))
    num += p * tBurke(z); den += p
  }
  return num / den
}

const NS = 80
const S_MIN = 0.01, S_MAX = 0.8
const sAt = (k: number) => S_MIN * (S_MAX / S_MIN) ** (k / (NS - 1))
const TABLE = [0.01, 0.03, 0.05, 0.1, 0.2, 0.4, 0.8]

const PX0 = 64, PX1 = 470, PY0 = 24, PY1 = 250
const QX0 = 530, QX1 = W - 16
const xs = (s: number) => PX0 + ((PX1 - PX0) * Math.log(s / S_MIN)) / Math.log(S_MAX / S_MIN)
const yT = (T: number) => PY1 - ((PY1 - PY0) * T) / 2400
const qx = (s: number) => QX0 + ((QX1 - QX0) * Math.log(s / S_MIN)) / Math.log(S_MAX / S_MIN)
const qy = (e: number) => PY1 - ((PY1 - PY0) * (e + 100)) / 800

type Pt = { s: number; ex: number; g1: number; g2: number }

export function PresumedPdfQuadratureRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [zm, setZm] = useState(0.055)
  const [n1, setN1] = useState(100)
  const [n2, setN2] = useState(1000)
  const [spf, setSpf] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<Pt & { k: number; a: number }>({ s: 0, ex: 0, g1: 0, g2: 0, k: 0, a: 0 })
  const adv = useRef<(m: number) => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const pts: Pt[] = []
    const tz = tBurke(zm)
    let frame = 0, raf = 0

    const step = () => {
      if (pts.length >= NS) return
      const s = sAt(pts.length)
      pts.push({ s, ex: meanT(zm, s), g1: meanTGrid(zm, s, n1), g2: meanTGrid(zm, s, n2) })
    }
    const publish = () => {
      const p = pts[pts.length - 1]
      if (p) setRead({ ...p, k: pts.length, a: zm * (1 / p.s - 1) })
    }
    adv.current = (m: number) => { for (let i = 0; i < m; i++) step(); draw(); publish() }

    const curve = (key: 'ex' | 'g1' | 'g2', color: string, err: boolean) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath()
      pts.forEach((p, i) => {
        const x = err ? qx(p.s) : xs(p.s)
        const y = err ? qy(p[key] - p.ex) : yT(p[key])
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      })
      ctx.stroke()
    }

    const draw = () => {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'; ctx.strokeStyle = 'rgba(148,163,184,0.22)'; ctx.lineWidth = 1
      for (const T of [0, 500, 1000, 1500, 2000]) {
        ctx.beginPath(); ctx.moveTo(PX0, yT(T)); ctx.lineTo(PX1, yT(T)); ctx.stroke()
        ctx.fillStyle = '#94a3b8'; ctx.fillText(`${T}`, 22, yT(T) + 4)
      }
      for (const e of [-100, 0, 200, 400, 600]) {
        ctx.beginPath(); ctx.moveTo(QX0, qy(e)); ctx.lineTo(QX1, qy(e)); ctx.stroke()
        ctx.fillStyle = '#94a3b8'; ctx.fillText(`${e > 0 ? '+' : ''}${e}`, QX0 - 36, qy(e) + 4)
      }
      for (const s of TABLE) {
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(String(s), xs(s) - 10, PY1 + 15); ctx.fillText(String(s), qx(s) - 10, PY1 + 15)
        ctx.beginPath(); ctx.moveTo(xs(s), PY0); ctx.lineTo(xs(s), PY1); ctx.stroke()
      }
      // a = 1 boundary: pdf becomes singular at Z = 0 to the right of it
      const sA1 = zm / (1 + zm)
      if (sA1 > S_MIN && sA1 < S_MAX) {
        ctx.fillStyle = 'rgba(244,63,94,0.08)'
        ctx.fillRect(xs(sA1), PY0, PX1 - xs(sA1), PY1 - PY0); ctx.fillRect(qx(sA1), PY0, QX1 - qx(sA1), PY1 - PY0)
        ctx.fillStyle = '#fb7185'; ctx.fillText('a<1', xs(sA1) + 4, PY0 + 12); ctx.fillText('a<1', qx(sA1) + 4, PY0 + 12)
      }
      ctx.setLineDash([6, 4]); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(PX0, yT(tz)); ctx.lineTo(PX1, yT(tz)); ctx.stroke(); ctx.setLineDash([])
      curve('ex', '#a3e635', false); curve('g1', '#38bdf8', false); curve('g2', '#c084fc', false)
      ctx.strokeStyle = '#a3e635'; ctx.beginPath(); ctx.moveTo(QX0, qy(0)); ctx.lineTo(QX1, qy(0)); ctx.stroke()
      curve('g1', '#38bdf8', true); curve('g2', '#c084fc', true)
      const p = pts[pts.length - 1]
      if (p) {
        ctx.fillStyle = '#f8fafc'
        for (const [x, y] of [[xs(p.s), yT(p.ex)], [xs(p.s), yT(p.g1)], [qx(p.s), qy(p.g1 - p.ex)]]) {
          ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill()
        }
      }
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#e2e8f0'; ctx.fillText('mean temperature T̃ [K]  vs  s', PX0, PY0 - 8)
      ctx.fillText('grid − exact [K]', QX0, PY0 - 8)
      ctx.fillStyle = '#94a3b8'; ctx.fillText('s = Z″²/(Z̄(1−Z̄)), log axis', PX0 + 100, PY1 + 30)
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`--- T(Z̄) = ${tz.toFixed(0)} K`, PX0 + 4, H - 60)
      ctx.fillStyle = '#a3e635'; ctx.fillText('— exact (incomplete beta)', PX0 + 4, H - 44)
      ctx.fillStyle = '#38bdf8'; ctx.fillText(`— midpoint grid N=${n1}`, PX0 + 4, H - 28)
      ctx.fillStyle = '#c084fc'; ctx.fillText(`— midpoint grid N=${n2}`, PX0 + 4, H - 12)
      // marker table at the code's s values
      ctx.fillStyle = '#e2e8f0'; ctx.fillText('  s    T̃_exact    gap   N₁ err', QX0 - 30, 304)
      let row = 0
      for (const s0 of TABLE) {
        const last = pts[pts.length - 1]
        if (!last || last.s < s0 * 0.999) continue
        // evaluated at the code's exact s once the sweep has passed it
        const q = { ex: meanT(zm, s0), g1: meanTGrid(zm, s0, n1) }
        const e = q.g1 - q.ex
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(`${s0.toFixed(2)} ${q.ex.toFixed(1).padStart(8)} ${(q.ex - tz).toFixed(0).padStart(7)} ${((e >= 0 ? '+' : '') + e.toFixed(1)).padStart(8)}`,
          QX0 - 30, 318 + 14 * row++)
      }
    }

    const tick = () => {
      if (playing && frame % 3 === 0) for (let i = 0; i < spf; i++) step()
      draw()
      if (++frame % 12 === 0) publish()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [zm, n1, n2, spf, playing, nonce])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Z̄ = {zm.toFixed(3)} <input type="range" min={0.02} max={0.3} step={0.005} value={zm} onChange={(e) => setZm(+e.target.value)} /></label>
        <label>N₁ = {n1} <input type="range" min={10} max={500} step={10} value={n1} onChange={(e) => setN1(+e.target.value)} /></label>
        <label>N₂ = {n2} <input type="range" min={200} max={5000} step={100} value={n2} onChange={(e) => setN2(+e.target.value)} /></label>
        <label>s-points/step {spf} <input type="range" min={1} max={8} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(1) }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        point {read.k}/{NS} · s = {read.s.toFixed(3)} · a = {read.a.toFixed(3)}{read.a < 1 ? ' (singular at Z=0)' : ''} ·
        T̃_exact {read.ex.toFixed(1)} K · gap to T(Z̄) {(read.ex - tBurke(zm)).toFixed(1)} K ·
        N₁ error {(read.g1 - read.ex >= 0 ? '+' : '') + (read.g1 - read.ex).toFixed(1)} K · N₂ error {(read.g2 - read.ex >= 0 ? '+' : '') + (read.g2 - read.ex).toFixed(1)} K
      </div>
    </div>
  )
}
