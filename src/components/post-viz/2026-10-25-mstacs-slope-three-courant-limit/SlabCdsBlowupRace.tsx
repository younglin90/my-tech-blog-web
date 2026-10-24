'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 520
const N = 100
const LAPS = 2
const KEYS = ['hc', 'sb', 'bd', 'ms'] as const
type Key = typeof KEYS[number]
const COL: Record<Key, string> = { hc: '#38bdf8', sb: '#22c55e', bd: '#a78bfa', ms: '#f59e0b' }
const NAME: Record<Key, string> = { hc: 'HYPER-C', sb: 'SUPERBEE', bd: 'BD-SAISH', ms: 'MSTACS' }

function cds(k: Key, t: number, co: number) {
  if (k === 'hc') return Math.min(t / co, 1)
  if (k === 'sb') return t < 1 / 3 ? 2 * t : t < 0.5 ? 0.5 + 0.5 * t : t < 2 / 3 ? 1.5 * t : 1
  if (k === 'bd') return Math.min(4 * t, 1)
  return co <= 1 / 3 ? Math.min(t / co, 1) : Math.min(3 * t, 1)
}

// downwind weight gamma_f of face i+1/2, eq. (8) — Python face_gamma()
function faceGamma(c: Float64Array, co: number, k: Key, g: Float64Array) {
  for (let i = 0; i < N; i++) {
    g[i] = 0
    const cu = c[(i - 1 + N) % N], cd = c[i], ca = c[(i + 1) % N]
    if (Math.abs(ca - cu) < 1e-12) continue
    const t = (cd - cu) / (ca - cu)
    if (t > 0 && t < 1) g[i] = (cds(k, t, co) - t) / (1 - t)
  }
}

// periodic tridiagonal solve (Sherman–Morrison) — Python solve_cyclic()
function solveCyclic(a: number[], b: number[], c: number[], r: number[]) {
  const gam = -b[0], bb = b.slice()
  bb[0] -= gam; bb[N - 1] -= (a[0] * c[N - 1]) / gam
  const thomas = (d: number[]) => {
    const cp = new Array(N).fill(0), dp = new Array(N).fill(0)
    cp[0] = c[0] / bb[0]; dp[0] = d[0] / bb[0]
    for (let i = 1; i < N; i++) { const m = bb[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m }
    const x = new Array(N).fill(0); x[N - 1] = dp[N - 1]
    for (let i = N - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
    return x
  }
  const y = thomas(r), u = new Array(N).fill(0)
  u[0] = gam; u[N - 1] = c[N - 1]
  const z = thomas(u)
  const f = (y[0] + (a[0] * y[N - 1]) / gam) / (1 + z[0] + (a[0] * z[N - 1]) / gam)
  return y.map((v, i) => v - f * z[i])
}

// eq. (7): gamma frozen at C^n, face value = average of C^n and C^(n+1)
function cnStep(c: Float64Array, co: number, g: Float64Array) {
  const h = 0.5 * co, a: number[] = [], b: number[] = [], up: number[] = [], r: number[] = []
  for (let i = 0; i < N; i++) {
    const im = (i - 1 + N) % N, ip = (i + 1) % N
    a.push(-h * (1 - g[im])); b.push(1 + h * (1 - g[i]) - h * g[im]); up.push(h * g[i])
    r.push(c[i] - h * ((g[i] * c[ip] + (1 - g[i]) * c[i]) - (g[im] * c[i] + (1 - g[im]) * c[im])))
  }
  const x = solveCyclic(a, b, up, r)
  for (let i = 0; i < N; i++) c[i] = x[i]
}

function redistribute(c: Float64Array) {
  for (let p = 0; p < 3; p++) for (let i = 0; i < N; i++) {
    let e = 0
    if (c[i] > 1) { e = c[i] - 1; c[i] = 1 } else if (c[i] < 0) { e = c[i]; c[i] = 0 } else continue
    c[(i + 1) % N] += e / 2; c[(i - 1 + N) % N] += e / 2
  }
}

const slabInit = () => Float64Array.from({ length: N }, (_, i) => Math.max(0, Math.min(i + 1, 60.4) - Math.max(i, 30.4)))

type Run = { c: Float64Array; dead: number; hist: number[] }
type Stat = { l1: number; width: number; over: number; dead: number }

export function SlabCdsBlowupRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [co, setCo] = useState(0.5)
  const [fix, setFix] = useState(false)
  const [spf, setSpf] = useState(3)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState<{ n: number; total: number; s: Record<Key, Stat> }>({ n: 0, total: 0, s: {} as Record<Key, Stat> })
  const adv = useRef<(k: number) => void>(() => {})
  const playRef = useRef(playing), spfRef = useRef(spf)
  playRef.current = playing; spfRef.current = spf

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const c0 = slabInit(), total = Math.round((LAPS * N) / co)
    const runs = {} as Record<Key, Run>
    for (const k of KEYS) runs[k] = { c: c0.slice(), dead: 0, hist: [] }
    const g = new Float64Array(N)
    let n = 0, raf = 0, frame = 0

    const stat = (r: Run): Stat => {
      let l1 = 0, width = 0, mx = -Infinity, mn = Infinity
      for (let i = 0; i < N; i++) {
        const v = r.c[i]; l1 += Math.abs(v - c0[i]); if (v > 0.05 && v < 0.95) width++
        mx = Math.max(mx, v); mn = Math.min(mn, v)
      }
      return { l1: l1 / N, width, over: Math.max(mx - 1, -mn, 0), dead: r.dead }
    }
    const tick = () => {
      n++
      for (const k of KEYS) {
        const r = runs[k]
        if (r.dead) continue
        faceGamma(r.c, co, k, g); cnStep(r.c, co, g)
        if (fix) redistribute(r.c)
        let mx = -Infinity
        for (let i = 0; i < N; i++) mx = Math.max(mx, r.c[i])
        if (mx > 10 || !isFinite(mx)) r.dead = n
        r.hist.push(stat(r).over)
      }
    }
    const grey = 'rgba(127,127,127,0.9)'
    const draw = () => {
      ctx.clearRect(0, 0, W, H); ctx.font = '12px ui-monospace, monospace'
      const ph = 64
      KEYS.forEach((k, j) => {
        const P = { x: 40, y: 14 + j * (ph + 18), w: 420, h: ph }, r = runs[k]
        const X = (i: number) => P.x + ((i + 0.5) / N) * P.w, Y = (v: number) => P.y + P.h - Math.max(-0.2, Math.min(1.25, v)) / 1.25 * (P.h - 8)
        ctx.strokeStyle = 'rgba(127,127,127,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(P.x, P.y, P.w, P.h)
        const sh = ((n * co) % N)
        ctx.setLineDash([3, 3]); ctx.strokeStyle = grey; ctx.beginPath()
        for (let i = 0; i < N; i++) { const v = c0[Math.floor(((i - sh) % N + N) % N)]; i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)) }
        ctx.stroke(); ctx.setLineDash([])
        ctx.strokeStyle = r.dead ? '#ef4444' : COL[k]; ctx.lineWidth = 2; ctx.beginPath()
        for (let i = 0; i < N; i++) i ? ctx.lineTo(X(i), Y(r.c[i])) : ctx.moveTo(X(i), Y(r.c[i]))
        ctx.stroke()
        ctx.fillStyle = r.dead ? '#ef4444' : COL[k]
        ctx.fillText(r.dead ? `${NAME[k]} — BLOW-UP at step ${r.dead}` : NAME[k], P.x + 4, P.y + 13)
      })
      // overshoot history, log scale
      const G = { x: 510, y: 14, w: 230, h: 312 }
      ctx.strokeStyle = 'rgba(127,127,127,0.45)'; ctx.strokeRect(G.x, G.y, G.w, G.h)
      const Xs = (s: number) => G.x + (s / total) * G.w
      const Yl = (v: number) => G.y + G.h - ((Math.log10(Math.max(v, 1e-16)) + 16) / 17) * G.h
      ctx.strokeStyle = 'rgba(127,127,127,0.25)'
      for (const e of [-12, -8, -4, 0]) { ctx.beginPath(); ctx.moveTo(G.x, Yl(10 ** e)); ctx.lineTo(G.x + G.w, Yl(10 ** e)); ctx.stroke() }
      for (const k of KEYS) {
        const hs = runs[k].hist; ctx.strokeStyle = COL[k]; ctx.lineWidth = 1.6; ctx.beginPath()
        hs.forEach((v, s) => (s ? ctx.lineTo(Xs(s + 1), Yl(v)) : ctx.moveTo(Xs(1), Yl(v))))
        ctx.stroke()
      }
      ctx.fillStyle = grey
      ctx.fillText('overshoot max(C−1, −C)', G.x + 4, G.y + 14)
      for (const e of [-12, -8, -4, 0]) ctx.fillText(`1e${e}`, G.x - 34, Yl(10 ** e) + 4)
      ctx.fillText('step →', G.x + G.w - 44, G.y + G.h + 14)
      ctx.fillText(`step ${n}/${total} · Co=${co.toFixed(2)} · ${fix ? 'redistribution ON' : 'no redistribution'}`, 40, H - 12)
    }
    const publish = () => {
      const s = {} as Record<Key, Stat>
      for (const k of KEYS) s[k] = stat(runs[k])
      setRead({ n, total, s })
    }
    adv.current = (m: number) => { for (let j = 0; j < m && n < total; j++) tick(); draw(); publish() }
    const loop = () => {
      if (playRef.current && n < total) {
        for (let j = 0; j < spfRef.current && n < total; j++) tick()
        draw()
        if (++frame % 12 === 0 || n >= total) publish()
      }
      raf = requestAnimationFrame(loop)
    }
    draw(); publish()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [co, fix, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(245,158,11,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>Courant Co = {co.toFixed(2)} <input type="range" min={0.1} max={0.9} step={0.01} value={co} onChange={(e) => setCo(+e.target.value)} /></label>
        <label><input type="checkbox" checked={fix} onChange={(e) => setFix(e.target.checked)} /> clip-redistribution</label>
        <label>steps/frame {spf} <input type="range" min={1} max={12} step={1} value={spf} onChange={(e) => setSpf(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(10) }}>Step ×10</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace', display: 'grid', gap: 2 }}>
        <span>step {read.n}/{read.total} (2 laps)</span>
        {KEYS.map((k) => {
          const s = read.s[k]
          if (!s) return null
          return (
            <span key={k} style={{ color: s.dead ? '#ef4444' : COL[k] }}>
              {NAME[k].padEnd(9)} {s.dead ? `blow-up at step ${s.dead}` : `L1=${s.l1.toFixed(4)} width=${s.width} overshoot=${s.over.toExponential(1)}`}
            </span>
          )
        })}
      </div>
    </div>
  )
}
