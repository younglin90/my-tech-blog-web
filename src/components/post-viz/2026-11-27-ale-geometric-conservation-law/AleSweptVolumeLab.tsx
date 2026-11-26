'use client'

import { useEffect, useRef, useState } from 'react'

const W = 640
const H = 340
type Mode = 'w(t_n)' | 'w(t_n+1/2)' | 'swept (GCL)'
const MODES: Mode[] = ['w(t_n)', 'w(t_n+1/2)', 'swept (GCL)']
const PERIOD = 0.25

// one cell between two faces; faces oscillate out of phase
function faces(t: number, amp: number) {
  const s = Math.sin((2 * Math.PI * t) / PERIOD)
  return [0.4 - amp * s, 0.6 + amp * s]
}
function faceSpeeds(t: number, amp: number) {
  const c = Math.cos((2 * Math.PI * t) / PERIOD) * ((2 * Math.PI) / PERIOD) * amp
  return [-c, c]
}

export function AleSweptVolumeLab() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [dtIdx, setDtIdx] = useState(2)
  const [amp, setAmp] = useState(0.08)
  const [mode, setMode] = useState<Mode>('w(t_n)')
  const [playing, setPlaying] = useState(true)
  const [read, setRead] = useState({ t: 0, vTrue: 0.2, vFlux: 0.2, rho: 1 })
  const DTS = [0.002, 0.005, 0.01, 0.02, 0.03]
  const dt = DTS[dtIdx]
  const st = useRef({ t: 0, k: 0, vFlux: 0.2, hist: [] as { t: number; vt: number; vf: number }[] })

  function reset() {
    const [l, r] = faces(0, amp)
    st.current = { t: 0, k: 0, vFlux: r - l, hist: [{ t: 0, vt: r - l, vf: r - l }] }
  }
  useEffect(reset, [dtIdx, amp, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  function step() {
    const s = st.current
    const t0 = s.t, t1 = s.t + dt
    let wl: number, wr: number
    if (mode === 'w(t_n)') [wl, wr] = faceSpeeds(t0, amp)
    else if (mode === 'w(t_n+1/2)') [wl, wr] = faceSpeeds(t0 + dt / 2, amp)
    else {
      const a = faces(t0, amp), b = faces(t1, amp)
      wl = (b[0] - a[0]) / dt; wr = (b[1] - a[1]) / dt
    }
    s.vFlux += dt * (wr - wl) // volume the flux "thinks" the cell gained
    s.t = t1
    s.k++
    const [l, r] = faces(t1, amp)
    s.hist.push({ t: t1, vt: r - l, vf: s.vFlux })
    if (s.t > 2 * PERIOD) s.hist.shift()
  }

  useEffect(() => {
    let raf = 0, acc = 0, frame = 0
    const loop = () => {
      if (playing) {
        acc += 1 / 60 / 4 // quarter real time
        while (acc >= dt) { step(); acc -= dt }
      }
      draw()
      if (++frame % 12 === 0) {
        const s = st.current
        const [l, r] = faces(s.t, amp)
        setRead({ t: s.t, vTrue: r - l, vFlux: s.vFlux, rho: s.vFlux / (r - l) })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, dtIdx, amp, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const s = st.current
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H)
    ctx.font = '12px monospace'
    // cell strip
    const X = (x: number) => 40 + x * 560
    const [l, r] = faces(s.t, amp)
    const rho = s.vFlux / (r - l)
    const dev = Math.max(-1, Math.min(1, (rho - 1) * 8))
    ctx.fillStyle = dev >= 0 ? `rgba(248,113,113,${0.25 + 0.6 * dev})` : `rgba(56,189,248,${0.25 - 0.6 * dev})`
    ctx.fillRect(X(l), 30, X(r) - X(l), 60)
    ctx.strokeStyle = '#475569'; ctx.strokeRect(X(0), 30, 560, 60)
    // swept band of the right face over the last step vs w*dt estimate
    const prev = faces(s.t - dt, amp)
    let wr: number
    if (mode === 'w(t_n)') wr = faceSpeeds(s.t - dt, amp)[1]
    else if (mode === 'w(t_n+1/2)') wr = faceSpeeds(s.t - dt / 2, amp)[1]
    else wr = (r - prev[1]) / dt
    ctx.fillStyle = 'rgba(250,204,21,0.5)'
    ctx.fillRect(Math.min(X(prev[1]), X(r)), 92, Math.abs(X(r) - X(prev[1])), 8)
    ctx.fillStyle = 'rgba(167,139,250,0.8)'
    const est = prev[1] + wr * dt
    ctx.fillRect(Math.min(X(prev[1]), X(est)), 102, Math.abs(X(est) - X(prev[1])), 8)
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(X(l), 26); ctx.lineTo(X(l), 94); ctx.moveTo(X(r), 26); ctx.lineTo(X(r), 94); ctx.stroke()
    ctx.lineWidth = 1
    // particles: same fluid, density shown by spacing
    ctx.fillStyle = '#e2e8f0'
    const np = Math.round(14 * rho)
    for (let i = 0; i < np; i++) ctx.fillRect(X(l) + ((i + 0.5) / np) * (X(r) - X(l)) - 1.5, 58, 3, 3)
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('cell (fluid at rest, rho should stay 1)', 40, 18)
    ctx.fillStyle = '#facc15'; ctx.fillText('true swept dx', 440, 18)
    ctx.fillStyle = '#a78bfa'; ctx.fillText('w*dt used in flux', 530, 18)
    // history: V_true vs V_flux
    const gx = 60, gy = 140, gw = 560, gh = 170
    ctx.strokeStyle = '#475569'; ctx.strokeRect(gx, gy, gw, gh)
    const vmin = 0.2 - 2.2 * amp - 0.01, vmax = 0.2 + 2.2 * amp + 0.01
    const t0 = s.hist[0].t
    const px = (t: number) => gx + ((t - t0) / (2 * PERIOD)) * gw
    const py = (v: number) => gy + gh - ((v - vmin) / (vmax - vmin)) * gh
    const line = (key: 'vt' | 'vf', col: string, dash: number[]) => {
      ctx.strokeStyle = col; ctx.setLineDash(dash); ctx.lineWidth = 2; ctx.beginPath()
      s.hist.forEach((p, i) => (i ? ctx.lineTo(px(p.t), py(p[key])) : ctx.moveTo(px(p.t), py(p[key]))))
      ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1
    }
    line('vt', '#facc15', [])
    line('vf', '#a78bfa', [6, 4])
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('cell volume', gx - 50, gy - 6)
    ctx.fillText(vmax.toFixed(2), gx - 40, gy + 10); ctx.fillText(vmin.toFixed(2), gx - 40, gy + gh)
    ctx.fillText(`t (last 2 periods)  dt = ${dt}`, gx + gw - 230, gy + gh + 16)
    ctx.fillStyle = '#facc15'; ctx.fillText('V geometry', gx + 8, gy + 16)
    ctx.fillStyle = '#a78bfa'; ctx.fillText('V implied by fluxes', gx + 110, gy + 16)
  }

  const btn = { padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }
  return (
    <div style={{ border: '1px solid #334155', borderRadius: 12, padding: 12, margin: '1.5rem 0', background: '#0b1220', color: '#e2e8f0' }}>
      <canvas ref={cvRef} width={W} height={H} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginTop: 10, fontSize: 14 }}>
        <label>Time step dt: <b>{dt}</b>
          <input type="range" min={0} max={DTS.length - 1} step={1} value={dtIdx} onChange={(e) => setDtIdx(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Face amplitude: <b>{amp.toFixed(2)}</b>
          <input type="range" min={0.02} max={0.09} step={0.01} value={amp} onChange={(e) => setAmp(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label>Face speed in flux:
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ width: '100%', background: '#1e293b', color: '#e2e8f0' }}>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn} onClick={() => { step(); draw() }}>Step</button>
        <button style={btn} onClick={() => { reset(); draw() }}>Reset</button>
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
          t = {read.t.toFixed(3)} | V geom = {read.vTrue.toFixed(4)} | V flux = {read.vFlux.toFixed(4)} |{' '}
          <b style={{ color: Math.abs(read.rho - 1) > 1e-6 ? '#f87171' : '#4ade80' }}>rho = {read.rho.toFixed(6)}</b>
        </span>
      </div>
    </div>
  )
}
