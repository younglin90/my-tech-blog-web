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

// inverse CDF by bisection: one beta sample per call
function sampleZ(a: number, b: number) {
  const u = Math.random()
  let lo = 0, hi = 1
  for (let k = 0; k < 40; k++) {
    const mid = 0.5 * (lo + hi)
    if (incBeta(a, b, mid) < u) lo = mid; else hi = mid
  }
  return 0.5 * (lo + hi)
}

// plotted Z axis is sqrt-stretched so the lean side near Z_st is visible
const ZMAX = 0.4
const X0 = 60, X1 = W - 20, Y0 = 30, Y1 = H - 50
const xOf = (z: number) => X0 + (X1 - X0) * Math.sqrt(Math.min(z, ZMAX) / ZMAX)
const yT = (T: number) => Y1 - ((Y1 - Y0) * (T - 0)) / 2400

type Drop = { z: number; y: number; v: number }

export function BetaPdfFlameMeanLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [zm, setZm] = useState(0.055)
  const [s, setS] = useState(0.1)
  const [rate, setRate] = useState(6)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, run: 0, exact: 0, tz: 0, a: 0, b: 0, cold: 0 })

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const g = 1 / s - 1, a = zm * g, b = (1 - zm) * g
    const exact = meanT(zm, s), tz = tBurke(zm)
    // pdf mass per plotted bin, from the exact CDF
    const NB = 90
    const bins: number[] = []
    let prev = 0
    for (let i = 1; i <= NB; i++) {
      const z = ZMAX * (i / NB) ** 2
      const c = incBeta(a, b, z)
      bins.push(c - prev); prev = c
    }
    const bmax = Math.max(...bins)
    const drops: Drop[] = []
    const hist = new Float64Array(NB)
    let n = 0, sum = 0, frame = 0, raf = 0

    const draw = () => {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1
      ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = '#94a3b8'
      for (const T of [300, 1000, 1500, 2000]) {
        ctx.beginPath(); ctx.moveTo(X0, yT(T)); ctx.lineTo(X1, yT(T)); ctx.stroke()
        ctx.fillText(`${T} K`, 8, yT(T) + 4)
      }
      for (const z of [0, 0.01, 0.055, 0.1, 0.2, 0.3, 0.4]) {
        ctx.fillText(z === 0.055 ? 'Z_st' : String(z), xOf(z) - 10, Y1 + 16)
      }
      ctx.fillText('mixture fraction Z  (√-stretched axis)', X1 - 260, Y1 + 34)
      // pdf bars (target) + sampled histogram
      for (let i = 0; i < NB; i++) {
        const za = ZMAX * (i / NB) ** 2, zb = ZMAX * ((i + 1) / NB) ** 2
        const h = (bins[i] / bmax) * 140
        ctx.fillStyle = 'rgba(56,189,248,0.18)'
        ctx.fillRect(xOf(za), Y1 - h, xOf(zb) - xOf(za) + 0.5, h)
        if (n > 0) {
          const hs = ((hist[i] / n) / bmax) * 140
          ctx.fillStyle = 'rgba(56,189,248,0.75)'
          ctx.fillRect(xOf(za) + 1, Y1 - hs, Math.max(1, xOf(zb) - xOf(za) - 1), 2)
        }
      }
      // T(Z)
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5; ctx.beginPath()
      for (let i = 0; i <= 300; i++) {
        const z = ZMAX * (i / 300) ** 2
        const x = xOf(z), y = yT(tBurke(z))
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.stroke()
      // falling particles, coloured by their own T
      for (const d of drops) {
        const T = tBurke(d.z), f = (T - T_U) / (T_AD - T_U)
        ctx.fillStyle = `rgb(${80 + 175 * f},${90 + 60 * f},${255 - 220 * f})`
        ctx.beginPath(); ctx.arc(xOf(d.z), d.y, 3, 0, 7); ctx.fill()
      }
      // T(Zmean) vs mean T lines
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5
      ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(X0, yT(tz)); ctx.lineTo(X1, yT(tz)); ctx.stroke()
      ctx.strokeStyle = '#a3e635'; ctx.beginPath(); ctx.moveTo(X0, yT(exact)); ctx.lineTo(X1, yT(exact)); ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(251,191,36,0.6)'; ctx.beginPath(); ctx.moveTo(xOf(zm), Y0); ctx.lineTo(xOf(zm), Y1); ctx.stroke()
      if (n > 0) {
        ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(xOf(zm), yT(sum / n), 6, 0, 7); ctx.fill()
      }
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillStyle = '#fbbf24'; ctx.fillText(`T(Z̄) = ${tz.toFixed(0)} K`, X1 - 170, yT(tz) - 6)
      ctx.fillStyle = '#a3e635'; ctx.fillText(`β-PDF mean T̃ = ${exact.toFixed(0)} K`, X1 - 220, yT(exact) - 6)
      ctx.fillStyle = '#f472b6'; ctx.fillText('● running mean of particles', X0 + 10, Y0 + 4)
      ctx.fillStyle = '#f97316'; ctx.fillText('— T(Z) Burke–Schumann', X0 + 10, Y0 + 20)
      ctx.fillStyle = '#38bdf8'; ctx.fillText('▮ β-PDF P(Z)', X0 + 10, Y0 + 36)
    }

    const tick = () => {
      if (playing) {
        for (let k = 0; k < rate; k++) drops.push({ z: sampleZ(a, b), y: Y0, v: 2 + Math.random() * 2 })
        for (const d of drops) { d.y += d.v; d.v += 0.25 }
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i]
          if (d.y >= yT(tBurke(d.z))) {
            n++; sum += tBurke(d.z)
            const bi = Math.min(NB - 1, Math.floor(Math.sqrt(Math.min(d.z, ZMAX - 1e-9) / ZMAX) * NB))
            if (d.z < ZMAX) hist[bi]++
            drops.splice(i, 1)
          }
        }
      }
      draw()
      if (++frame % 12 === 0 || frame === 1) {
        setRead({ n, run: n ? sum / n : 0, exact, tz, a, b, cold: incBeta(a, b, 0.01) })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [zm, s, rate, playing, nonce])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Z̄ = {zm.toFixed(3)} <input type="range" min={0.01} max={0.3} step={0.005} value={zm} onChange={(e) => setZm(+e.target.value)} /></label>
        <label>s = Z″²/(Z̄(1−Z̄)) = {s.toFixed(3)} <input type="range" min={0.005} max={0.9} step={0.005} value={s} onChange={(e) => setS(+e.target.value)} /></label>
        <label>particles/frame {rate} <input type="range" min={1} max={30} step={1} value={rate} onChange={(e) => setRate(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
        <button style={btn(false)} onClick={() => { setZm(0.055); setS(0.1); setNonce((v) => v + 1) }}>Default (Z̄=Z_st, s=0.1)</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        a = {read.a.toFixed(3)} · b = {read.b.toFixed(2)}{read.a < 1 ? ' · a<1: pdf → ∞ at Z=0' : ''} · particles {read.n} ·
        running mean {read.run.toFixed(0)} K · exact T̃ {read.exact.toFixed(0)} K · T(Z̄) {read.tz.toFixed(0)} K ·
        gap {(read.exact - read.tz).toFixed(0)} K · P(Z&lt;0.01) {(100 * read.cold).toFixed(1)}%
      </div>
    </div>
  )
}
