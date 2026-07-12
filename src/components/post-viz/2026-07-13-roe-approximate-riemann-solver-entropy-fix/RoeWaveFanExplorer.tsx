'use client'

import { useEffect, useRef, useState } from 'react'

// Interactive explorer for the Roe-averaged wave fan of the 1-D Euler equations.
// Set the left/right primitive states (rho, u, p) and watch:
//   - the sqrt(rho)-weighted Roe average state (u_hat, H_hat, c_hat)
//   - the three eigenvalues  lambda = { u-c , u , u+c }
//   - the four constant-state regions they carve out of the (x,t) plane.
// The whole point of the Roe average is that these three straight rays reproduce
// an isolated shock or contact *exactly*, even for a finite jump.

const GAMMA = 1.4

interface Prim {
  rho: number
  u: number
  p: number
}

function roeAverage(L: Prim, R: Prim) {
  const HL = GAMMA / (GAMMA - 1) * (L.p / L.rho) + 0.5 * L.u * L.u
  const HR = GAMMA / (GAMMA - 1) * (R.p / R.rho) + 0.5 * R.u * R.u
  const sL = Math.sqrt(L.rho)
  const sR = Math.sqrt(R.rho)
  const wL = sL / (sL + sR)
  const wR = sR / (sL + sR)
  const u = wL * L.u + wR * R.u
  const H = wL * HL + wR * HR
  const c2 = (GAMMA - 1) * (H - 0.5 * u * u)
  const c = Math.sqrt(Math.max(c2, 1e-9))
  return { u, H, c, wL, wR }
}

const btnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 13,
  cursor: 'pointer',
}

export function RoeWaveFanExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [L, setL] = useState<Prim>({ rho: 1.0, u: 0.0, p: 1.0 })
  const [R, setR] = useState<Prim>({ rho: 0.25, u: 0.0, p: 0.2 })
  const [playing, setPlaying] = useState(true)
  const stateRef = useRef({ L, R, playing })
  stateRef.current = { L, R, playing }
  const tRef = useRef(0)
  const rafRef = useRef<number>(0)

  const avg = roeAverage(L, R)
  const lam = [avg.u - avg.c, avg.u, avg.u + avg.c]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const padB = 26
    const cx = W / 2
    const topY = 16

    const draw = () => {
      const s = stateRef.current
      const a = roeAverage(s.L, s.R)
      const l = [a.u - a.c, a.u, a.u + a.c]
      const span = Math.max(Math.abs(l[0]), Math.abs(l[2])) * 1.25 + 1e-6
      const Tmax = 1
      const yOf = (t: number) => H - padB - (t / Tmax) * (H - padB - topY)
      const xOf = (xp: number) => cx + (xp / span) * (W / 2 - 14)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#070f1c'
      ctx.fillRect(0, 0, W, H)

      // four regions as filled triangles from the apex (bottom center)
      const apex = { x: cx, y: H - padB }
      const top = (xp: number) => ({ x: xOf(xp), y: yOf(Tmax) })
      const edges = [-span, l[0] * Tmax, l[1] * Tmax, l[2] * Tmax, span]
      const cols = ['rgba(56,189,248,0.22)', 'rgba(129,140,248,0.30)', 'rgba(244,114,182,0.30)', 'rgba(248,113,113,0.22)']
      for (let k = 0; k < 4; k++) {
        const a0 = top(edges[k])
        const a1 = top(edges[k + 1])
        ctx.beginPath()
        ctx.moveTo(apex.x, apex.y)
        ctx.lineTo(a0.x, a0.y)
        ctx.lineTo(a1.x, a1.y)
        ctx.closePath()
        ctx.fillStyle = cols[k]
        ctx.fill()
      }

      // region labels
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      const labels = ['L', '*L', '*R', 'R']
      const lcol = ['#38bdf8', '#a5b4fc', '#f9a8d4', '#f87171']
      for (let k = 0; k < 4; k++) {
        const mid = 0.5 * (edges[k] + edges[k + 1])
        ctx.fillStyle = lcol[k]
        ctx.fillText(labels[k], xOf(mid * 0.85), yOf(Tmax * 0.62))
      }

      // three characteristic rays
      const rayCol = ['#38bdf8', '#e2e8f0', '#f87171']
      const rayName = ['u−c', 'u', 'u+c']
      for (let k = 0; k < 3; k++) {
        ctx.beginPath()
        ctx.moveTo(apex.x, apex.y)
        ctx.lineTo(xOf(l[k] * Tmax), yOf(Tmax))
        ctx.strokeStyle = rayCol[k]
        ctx.lineWidth = k === 1 ? 1.6 : 2.2
        if (k === 1) ctx.setLineDash([5, 4])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = rayCol[k]
        ctx.textAlign = 'center'
        ctx.fillText(rayName[k], xOf(l[k] * Tmax), yOf(Tmax) - 4)
      }

      // moving tracers along each ray
      const t = tRef.current
      for (let k = 0; k < 3; k++) {
        const tt = t % Tmax
        ctx.beginPath()
        ctx.arc(xOf(l[k] * tt), yOf(tt), 3.4, 0, 2 * Math.PI)
        ctx.fillStyle = rayCol[k]
        ctx.fill()
      }

      // axes
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, topY)
      ctx.lineTo(cx, H - padB)
      ctx.moveTo(14, H - padB)
      ctx.lineTo(W - 14, H - padB)
      ctx.stroke()
      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'left'
      ctx.fillText('t', cx + 6, topY + 10)
      ctx.textAlign = 'right'
      ctx.fillText('x', W - 16, H - padB - 6)

      if (s.playing) tRef.current += 0.006
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const slider = (
    label: string,
    val: number,
    min: number,
    max: number,
    step: number,
    onCh: (v: number) => void,
    color: string,
  ) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <span style={{ minWidth: 74, fontFamily: 'monospace' }}>{label} = {val.toFixed(2)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => onCh(parseFloat(e.target.value))}
        style={{ flex: 1, minWidth: 90, accentColor: color }}
      />
    </label>
  )

  return (
    <div style={{ maxWidth: 620, margin: '20px auto', color: '#e2e8f0' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', background: '#070f1c' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 12 }}>
        <div style={{ color: '#38bdf8', fontWeight: 600, gridColumn: '1' }}>Left state</div>
        <div style={{ color: '#f87171', fontWeight: 600, gridColumn: '2' }}>Right state</div>
        {slider('rhoL', L.rho, 0.1, 4, 0.05, (v) => setL({ ...L, rho: v }), '#38bdf8')}
        {slider('rhoR', R.rho, 0.1, 4, 0.05, (v) => setR({ ...R, rho: v }), '#f87171')}
        {slider('uL', L.u, -2, 2, 0.05, (v) => setL({ ...L, u: v }), '#38bdf8')}
        {slider('uR', R.u, -2, 2, 0.05, (v) => setR({ ...R, u: v }), '#f87171')}
        {slider('pL', L.p, 0.1, 4, 0.05, (v) => setL({ ...L, p: v }), '#38bdf8')}
        {slider('pR', R.p, 0.1, 4, 0.05, (v) => setR({ ...R, p: v }), '#f87171')}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button onClick={() => setPlaying((p) => !p)} style={btnStyle}>{playing ? '⏸ pause' : '▶ play'}</button>
        <button onClick={() => { tRef.current = 0 }} style={btnStyle}>↺ reset</button>
      </div>
      <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 13, color: '#fbbf24' }}>
        {'√ρ'} weights: L {avg.wL.toFixed(3)} / R {avg.wR.toFixed(3)} &nbsp;|&nbsp; {'û'} = {avg.u.toFixed(3)} &nbsp; {'ĉ'} = {avg.c.toFixed(3)}
      </div>
      <div style={{ marginTop: 2, fontFamily: 'monospace', fontSize: 13, color: '#cbd5e1' }}>
        {'λ'} = [ {lam[0].toFixed(3)}, {lam[1].toFixed(3)}, {lam[2].toFixed(3)} ]
        {lam[0] < 0 && lam[2] > 0 ? '  ← subsonic: fan straddles the interface' : ''}
      </div>
    </div>
  )
}
