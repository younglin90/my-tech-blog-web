'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const ALPHA = 2
const T_END = 1.5
type Key = 'ftcs' | 'dufort' | 'laasonen'
const KEYS: Key[] = ['ftcs', 'dufort', 'laasonen']
const COL: Record<Key, string> = { ftcs: '#f97316', dufort: '#22c55e', laasonen: '#38bdf8' }
const LAB: Record<Key, string> = { ftcs: 'FTCS', dufort: 'DuFort-Frankel', laasonen: 'Laasonen' }

type Sim = { u: Float64Array; uOld: Float64Array; hist: number[]; minMid: number; blow: boolean }

// same as the Python march_heat(): u_t = α u_xx on [0, π], u = sin x, u(0) = u(π) = 0
export function HeatBarSchemeRace() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [r, setR] = useState(10)
  const [nx, setNx] = useState(21)
  const [exactStart, setExactStart] = useState(false)
  const [sps, setSps] = useState(6)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, nstep: 0, t: 0, ue: 0, mid: { ftcs: 0, dufort: 0, laasonen: 0 }, err: { ftcs: 0, dufort: 0, laasonen: 0 }, min: { ftcs: 0, dufort: 0, laasonen: 0 }, blow: { ftcs: false, dufort: false, laasonen: false } })
  const playRef = useRef(playing), spsRef = useRef(sps)
  playRef.current = playing; spsRef.current = sps
  const stepRef = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const N = nx, dx = Math.PI / (N - 1), dt = r * dx * dx / ALPHA
    const nstep = Math.max(2, Math.round(T_END / dt))
    const mid = Math.floor(N / 2)
    const x = Float64Array.from({ length: N }, (_, i) => i * dx)
    const exact = (t: number) => Float64Array.from(x, (xi) => Math.exp(-ALPHA * t) * Math.sin(xi))
    const sims = {} as Record<Key, Sim>
    for (const key of KEYS) {
      const u = exact(0)
      sims[key] = { u, uOld: u.slice(), hist: [u[mid]], minMid: u[mid], blow: false }
    }
    let n = 0, acc = 0, raf = 0, frame = 0, last = performance.now()
    const a = new Float64Array(N), b = new Float64Array(N), d = new Float64Array(N)

    const ftcs = (u: Float64Array) => {
      const v = new Float64Array(N)
      for (let i = 1; i < N - 1; i++) v[i] = u[i] + r * (u[i + 1] - 2 * u[i] + u[i - 1])
      return v
    }
    const laasonen = (u: Float64Array) => {
      // Thomas algorithm on interior points, coefficients (-r, 1+2r, -r)
      for (let i = 1; i < N - 1; i++) { b[i] = 1 + 2 * r; d[i] = u[i]; a[i] = -r }
      for (let i = 2; i < N - 1; i++) {
        const m = a[i] / b[i - 1]
        b[i] -= m * -r; d[i] -= m * d[i - 1]
      }
      const v = new Float64Array(N)
      v[N - 2] = d[N - 2] / b[N - 2]
      for (let i = N - 3; i >= 1; i--) v[i] = (d[i] + r * v[i + 1]) / b[i]
      return v
    }
    const advance = () => {
      if (n >= nstep) return
      for (const key of KEYS) {
        const s = sims[key]
        if (key === 'ftcs') s.u = ftcs(s.u)
        else if (key === 'laasonen') s.u = laasonen(s.u)
        else if (n === 0) { s.uOld = s.u; s.u = exactStart ? exact(dt) : ftcs(s.u) }
        else {
          const v = new Float64Array(N)
          for (let i = 1; i < N - 1; i++) v[i] = ((1 - 2 * r) * s.uOld[i] + 2 * r * (s.u[i + 1] + s.u[i - 1])) / (1 + 2 * r)
          s.uOld = s.u; s.u = v
        }
        s.hist.push(s.u[mid]); s.minMid = Math.min(s.minMid, s.u[mid])
      }
      n++
      const ue = exact(n * dt)
      for (const key of KEYS) {
        let e = 0
        for (let i = 0; i < N; i++) e = Math.max(e, Math.abs(sims[key].u[i] - ue[i]))
        if (!(e <= 1)) sims[key].blow = true
      }
    }
    stepRef.current = advance

    const grey = 'rgba(140,140,140,0.95)'
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // profile panel
      const px = 50, py = 30, pw = 320, ph = 300
      const ymap = (v: number) => py + ph * (1 - (Math.max(-1.1, Math.min(1.1, v)) + 1.1) / 2.2)
      const xmap = (xi: number) => px + (xi / Math.PI) * pw
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(px, py, pw, ph)
      ctx.fillStyle = 'rgba(239,68,68,0.08)'; ctx.fillRect(px, ymap(0), pw, ymap(-1.1) - ymap(0))
      ctx.strokeStyle = 'rgba(127,127,127,0.4)'
      ctx.beginPath(); ctx.moveTo(px, ymap(0)); ctx.lineTo(px + pw, ymap(0)); ctx.stroke()
      ctx.fillStyle = grey
      ctx.fillText('u(x)  bar profile', px + 4, py - 10)
      ctx.fillText('1', px - 14, ymap(1) + 4); ctx.fillText('0', px - 14, ymap(0) + 4); ctx.fillText('-1', px - 20, ymap(-1) + 4)
      ctx.fillText('x = 0', px - 8, py + ph + 16); ctx.fillText('π', px + pw - 4, py + ph + 16)
      ctx.fillStyle = 'rgba(239,68,68,0.8)'; ctx.fillText('u < 0: unphysical', px + 6, ymap(-1.0))
      ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2
      ctx.beginPath()
      for (let j = 0; j <= 100; j++) {
        const xi = (j / 100) * Math.PI, v = Math.exp(-ALPHA * n * dt) * Math.sin(xi)
        if (j === 0) ctx.moveTo(xmap(xi), ymap(v)); else ctx.lineTo(xmap(xi), ymap(v))
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1
      for (const key of KEYS) {
        const s = sims[key]
        ctx.strokeStyle = COL[key]; ctx.fillStyle = COL[key]; ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < N; i++) { const X = xmap(x[i]), Y = ymap(s.u[i]); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y) }
        ctx.stroke(); ctx.lineWidth = 1
        for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(xmap(x[i]), ymap(s.u[i]), 2.2, 0, 2 * Math.PI); ctx.fill() }
      }
      // history panel: u_mid vs t
      const hx = 430, hy = 30, hw = 310, hh = 300
      const hY = (v: number) => hy + hh * (1 - (Math.max(-1.1, Math.min(1.1, v)) + 1.1) / 2.2)
      const hX = (t: number) => hx + (t / (nstep * dt)) * hw
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.strokeRect(hx, hy, hw, hh)
      ctx.strokeStyle = 'rgba(127,127,127,0.4)'
      ctx.beginPath(); ctx.moveTo(hx, hY(0)); ctx.lineTo(hx + hw, hY(0)); ctx.stroke()
      ctx.fillStyle = grey
      ctx.fillText('u(π/2, t)  centre temperature', hx + 4, hy - 10)
      ctx.fillText('t = 0', hx - 8, hy + hh + 16); ctx.fillText(`${(nstep * dt).toFixed(2)}`, hx + hw - 24, hy + hh + 16)
      ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.setLineDash([5, 4]); ctx.beginPath()
      for (let j = 0; j <= 100; j++) {
        const t = (j / 100) * nstep * dt
        if (j === 0) ctx.moveTo(hX(t), hY(Math.exp(-ALPHA * t))); else ctx.lineTo(hX(t), hY(Math.exp(-ALPHA * t)))
      }
      ctx.stroke(); ctx.setLineDash([])
      for (const key of KEYS) {
        const h = sims[key].hist
        ctx.strokeStyle = COL[key]; ctx.fillStyle = COL[key]; ctx.lineWidth = 2; ctx.beginPath()
        h.forEach((v, i) => { if (i === 0) ctx.moveTo(hX(i * dt), hY(v)); else ctx.lineTo(hX(i * dt), hY(v)) })
        ctx.stroke(); ctx.lineWidth = 1
        if (nstep <= 80) h.forEach((v, i) => { ctx.beginPath(); ctx.arc(hX(i * dt), hY(v), 2.5, 0, 2 * Math.PI); ctx.fill() })
      }
      // legend
      let lx = 50
      ctx.fillStyle = 'rgba(148,163,184,0.95)'; ctx.fillText('- - exact', lx, H - 40); lx += 90
      for (const key of KEYS) {
        ctx.fillStyle = COL[key]
        ctx.fillText(`■ ${LAB[key]}${sims[key].blow ? ' (BLOWUP)' : ''}`, lx, H - 40); lx += sims[key].blow ? 210 : 150
      }
      ctx.fillStyle = grey
      ctx.fillText(`step ${n}/${nstep}   Δt = ${dt.toFixed(4)}   r = ${r.toFixed(1)}   NX = ${N}`, 50, H - 16)
    }

    const publish = () => {
      const ue = exact(n * dt)
      const o = { n, nstep, t: n * dt, ue: ue[mid], mid: {} as Record<Key, number>, err: {} as Record<Key, number>, min: {} as Record<Key, number>, blow: {} as Record<Key, boolean> }
      for (const key of KEYS) {
        const s = sims[key]
        let e = 0
        for (let i = 0; i < N; i++) e = Math.max(e, Math.abs(s.u[i] - ue[i]))
        o.mid[key] = s.u[mid]; o.err[key] = e; o.min[key] = s.minMid; o.blow[key] = s.blow
      }
      setRead(o)
    }

    const loop = (now: number) => {
      const el = Math.min(0.1, (now - last) / 1000); last = now
      if (playRef.current && n < nstep) {
        acc += el * spsRef.current
        while (acc >= 1 && n < nstep) { advance(); acc -= 1 }
      }
      draw()
      if (++frame % 12 === 0) publish()
      raf = requestAnimationFrame(loop)
    }
    publish()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [r, nx, exactStart, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(251,191,36,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const f = (v: number) => (Math.abs(v) >= 1e3 ? v.toExponential(1) : v.toFixed(5))

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>
          r = αΔt/Δx² = {r.toFixed(1)}{' '}
          <input type="range" min={0.1} max={20} step={0.1} value={r} onChange={(e) => setR(Number(e.target.value))} />
        </label>
        <label>
          NX = {nx}{' '}
          <input type="range" min={11} max={61} step={10} value={nx} onChange={(e) => setNx(Number(e.target.value))} />
        </label>
        <label>
          steps/s = {sps}{' '}
          <input type="range" min={1} max={120} step={1} value={sps} onChange={(e) => setSps(Number(e.target.value))} />
        </label>
        <label style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={exactStart} onChange={(e) => setExactStart(e.target.checked)} /> DF first step = exact (else FTCS)
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}>
        <div style={{ color: 'rgba(140,140,140,0.95)' }}>
          step {read.n}/{read.nstep} · t = {read.t.toFixed(3)} · exact u_mid = {read.ue.toFixed(5)}
        </div>
        {KEYS.map((key) => (
          <div key={key} style={{ color: COL[key] }}>
            {LAB[key].padEnd(15, ' ')} u_mid = {f(read.mid[key])} · max_err = {read.err[key].toExponential(2)} · min u_mid = {f(read.min[key])}
            {read.blow[key] ? ' · BLOWUP' : read.min[key] < 0 ? ' · went below 0' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
