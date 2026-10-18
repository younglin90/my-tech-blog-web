'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 360
const NMAX = 40

type St = { n: number; pi: number; qc: number; qvN: number; qvQ: number; hist: number[][] }

function fresh(): St {
  return { n: 0, pi: 1, qc: 1, qvN: 1, qvQ: 1, hist: [[1, 1, 1, 1]] }
}

// one BGK step on the non-equilibrium moments of a homogeneous kick (u = 1)
function advance(s: St, omMu: number, omKa: number) {
  if (s.n >= NMAX) return
  const pi0 = s.pi
  s.pi *= 1 - omMu
  s.qc *= 1 - omKa
  s.qvN *= 1 - omKa
  s.qvQ = (1 - omKa) * s.qvQ + (omKa - omMu) * pi0
  s.n++
  s.hist.push([s.pi, s.qc, s.qvN, s.qvQ])
}

const COL = ['#f59e0b', '#a78bfa', '#f87171', '#34d399']
const LAB = ['u·(P−Peq)  stress clock ωμ', 'conduction flux  κ clock ωκ', 'viscous-work flux, 2-τ only', 'viscous-work flux, with g*']

export function ViscousWorkClockLab() {
  const [tauMu, setTauMu] = useState(2)
  const [pr, setPr] = useState(0.71)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(6)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ n: 0, rN: 1, rQ: 1 })
  const ref = useRef<HTMLCanvasElement>(null)
  const st = useRef<St>(fresh())
  const playRef = useRef(playing)
  playRef.current = playing

  const tauKa = Math.max(0.51, 0.5 + (tauMu - 0.5) / pr)
  const omMu = 1 / tauMu
  const omKa = 1 / tauKa
  const stepRef = useRef(() => {})
  stepRef.current = () => advance(st.current, omMu, omKa)

  useEffect(() => { st.current = fresh() }, [tauMu, pr, nonce])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0, acc = 0
    const ly = (v: number) => {
      const a = Math.max(Math.abs(v), 1e-6)
      return 40 + (-Math.log10(a) / 6) * (H - 90)
    }
    const lx = (n: number) => 330 + (n / NMAX) * 400
    const draw = () => {
      const s = st.current
      if (playRef.current) {
        acc += speed / 60
        while (acc >= 1) { stepRef.current(); acc -= 1 }
        if (s.n >= NMAX) setPlaying(false)
      }
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      // left: bars of current |moment|
      const cur = [s.pi, s.qc, s.qvN, s.qvQ]
      ctx.fillStyle = '#cbd5e1'; ctx.fillText(`step n = ${s.n}`, 16, 24)
      for (let k = 0; k < 4; k++) {
        const y = 50 + k * 72
        const len = 260 * Math.min(1, Math.abs(cur[k]))
        ctx.fillStyle = 'rgba(148,163,184,0.18)'; ctx.fillRect(16, y + 16, 260, 22)
        ctx.fillStyle = COL[k]; ctx.fillRect(16, y + 16, len, 22)
        ctx.fillStyle = '#e2e8f0'; ctx.fillText(LAB[k], 16, y + 10)
        ctx.fillStyle = '#94a3b8'; ctx.fillText(cur[k].toExponential(2), 200, y + 54)
      }
      // right: log decay history
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1
      ctx.strokeRect(330, 40, 400, H - 90)
      ctx.fillStyle = '#94a3b8'
      for (let e = 0; e <= 6; e += 2) ctx.fillText(`1e-${e}`, 290, ly(Math.pow(10, -e)) + 4)
      for (let n = 0; n <= NMAX; n += 10) ctx.fillText(`${n}`, lx(n) - 6, H - 32)
      ctx.fillText('|non-equilibrium moment|', 330, 30)
      ctx.fillText('collision step n', 640, H - 16)
      for (let k = 0; k < 4; k++) {
        ctx.strokeStyle = COL[k]; ctx.lineWidth = k === 3 ? 3 : 2
        ctx.setLineDash(k === 3 ? [6, 4] : [])
        ctx.beginPath()
        s.hist.forEach((h, n) => (n ? ctx.lineTo(lx(n), ly(h[k])) : ctx.moveTo(lx(n), ly(h[k]))))
        ctx.stroke()
      }
      ctx.setLineDash([])
      if (++frame % 10 === 0) {
        setRead({ n: s.n, rN: s.qvN / (s.pi || 1e-300), rQ: s.qvQ / (s.pi || 1e-300) })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [speed])

  const btn = (on: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${on ? '#38bdf8' : 'rgba(127,127,127,0.45)'}`,
    background: on ? 'rgba(56,189,248,0.15)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })
  const fmt = (v: number) => (Math.abs(v) > 1e4 || Math.abs(v) < 1e-3 ? v.toExponential(2) : v.toFixed(3))

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>τμ = {tauMu.toFixed(2)} <input type="range" min={0.6} max={3} step={0.05} value={tauMu} onChange={(e) => setTauMu(+e.target.value)} /></label>
        <label>Pr = {pr.toFixed(2)} <input type="range" min={0.3} max={3} step={0.01} value={pr} onChange={(e) => setPr(+e.target.value)} /></label>
        <span>→ τκ = {tauKa.toFixed(3)}</span>
        <label>steps/s {speed} <input type="range" min={1} max={30} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); stepRef.current() }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        n = {read.n} · viscous-work / stress: <span style={{ color: COL[2] }}>2-τ only {fmt(read.rN)}</span> ·{' '}
        <span style={{ color: COL[3] }}>with g* {fmt(read.rQ)}</span> (physics wants 1)
      </div>
    </div>
  )
}
