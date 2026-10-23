'use client'

import { useEffect, useRef, useState } from 'react'

const W = 760
const H = 420
const NC = 7            // cells 0..6, cells 1..5 drawn
const KAPPA = 1 / 3
const C_MP = '#38bdf8'
const C_BETA = '#f97316'

// cell averages of a sharp step z=1 for x<s (cell j spans [j, j+1])
function averages(s: number) {
  const z = new Float64Array(NC)
  for (let j = 0; j < NC; j++) z[j] = Math.min(1, Math.max(0, s - j))
  return z
}

// eq. (3.9)-(3.10) in 1D: returns [phi, dLeft, dRight, zmin, zmax]
function limit(z: Float64Array, i: number, beta: number, midpoint: boolean) {
  const zi = z[i], zm = z[i - 1], zp = z[i + 1]
  const g = 0.5 * (zp - zm)
  const dR = 0.5 * KAPPA * (zp - zi) + (1 - KAPPA) * 0.5 * g
  const dL = 0.5 * KAPPA * (zm - zi) - (1 - KAPPA) * 0.5 * g
  const bl = midpoint ? 0.5 * (zi + zm) : zm
  const br = midpoint ? 0.5 * (zi + zp) : zp
  const zmin = Math.min(zi, bl, br), zmax = Math.max(zi, bl, br)
  const dmax = Math.max(Math.abs(dL), Math.abs(dR))
  const phi = dmax > 0 ? Math.min(beta, (zi - zmin) / dmax, (zmax - zi) / dmax) : 0
  return [phi, dL, dR, zmin, zmax]
}

export function BetaFaceBoundsLab() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [beta, setBeta] = useState(2)
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [read, setRead] = useState({ s: 1, zi: 0, phiMp: 0, phiB: 0, fMp: 0, fB: 0 })
  const sRef = useRef(1.0)
  const adv = useRef<(k: number) => void>(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    sRef.current = 1.0
    const trMp: number[] = [], trB: number[] = []
    const P = { x: 50, y: 30, w: 440, h: 300 }      // profile panel
    const T = { x: 540, y: 30, w: 200, h: 300 }     // phi trace panel
    const cx = (x: number) => P.x + ((x - 1) / 5) * P.w
    const cy = (z: number) => P.y + P.h - z * P.h * 0.85 - 20
    let raf = 0, frame = 0

    const draw = () => {
      const s = sRef.current
      const z = averages(s)
      ctx.clearRect(0, 0, W, H)
      ctx.font = '12px ui-monospace, monospace'
      ctx.strokeStyle = 'rgba(127,127,127,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(P.x, P.y, P.w, P.h); ctx.strokeRect(T.x, T.y, T.w, T.h)
      for (let j = 1; j <= 5; j++) {
        ctx.beginPath(); ctx.moveTo(cx(j), P.y); ctx.lineTo(cx(j), P.y + P.h); ctx.stroke()
      }
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('z=1', P.x - 34, cy(1) + 4); ctx.fillText('z=0', P.x - 34, cy(0) + 4)
      for (let j = 1; j <= 5; j++) ctx.fillText(j === 3 ? 'i' : j < 3 ? `i${j - 3}` : `i+${j - 3}`, cx(j + 0.5) - 10, P.y + P.h + 16)
      // bounds band of the middle cell, compressive version
      const lb = limit(z, 3, beta, false)
      ctx.fillStyle = 'rgba(249,115,22,0.12)'
      ctx.fillRect(cx(3), cy(lb[4]), cx(4) - cx(3), cy(lb[3]) - cy(lb[4]))
      const lm = limit(z, 3, 1, true)
      ctx.fillStyle = 'rgba(56,189,248,0.18)'
      ctx.fillRect(cx(3) + 6, cy(lm[4]), cx(4) - cx(3) - 12, cy(lm[3]) - cy(lm[4]))
      // exact step
      ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(127,127,127,0.9)'
      ctx.beginPath(); ctx.moveTo(cx(1), cy(1)); ctx.lineTo(cx(Math.max(1, Math.min(6, s))), cy(1))
      ctx.lineTo(cx(Math.max(1, Math.min(6, s))), cy(0)); ctx.lineTo(cx(6), cy(0)); ctx.stroke(); ctx.setLineDash([])
      // cell averages
      ctx.strokeStyle = 'rgba(127,127,127,0.8)'; ctx.lineWidth = 2
      for (let j = 1; j <= 5; j++) { ctx.beginPath(); ctx.moveTo(cx(j) + 2, cy(z[j])); ctx.lineTo(cx(j + 1) - 2, cy(z[j])); ctx.stroke() }
      // reconstructed linear profiles z_i + phi*Delta at the faces
      const seg = (j: number, b: number, mp: boolean, col: string) => {
        const [phi, dL, dR] = limit(z, j, b, mp)
        ctx.strokeStyle = col; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(cx(j), cy(z[j] + phi * dL)); ctx.lineTo(cx(j + 1), cy(z[j] + phi * dR)); ctx.stroke()
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx(j + 1), cy(z[j] + phi * dR), 4, 0, 2 * Math.PI); ctx.fill()
      }
      for (let j = 1; j <= 5; j++) { seg(j, 1, true, C_MP); seg(j, beta, false, C_BETA) }
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('dots: right-face value = upwind flux (u>0)', P.x + 6, P.y + 14)
      // phi trace
      const tx = (k: number, n: number) => T.x + (k / Math.max(1, n - 1)) * T.w
      const ty = (p: number) => T.y + T.h - (p / 3) * T.h
      ctx.strokeStyle = 'rgba(127,127,127,0.35)'
      for (const p of [1, 2, 3]) { ctx.beginPath(); ctx.moveTo(T.x, ty(p)); ctx.lineTo(T.x + T.w, ty(p)); ctx.stroke(); ctx.fillStyle = 'rgba(127,127,127,0.9)'; ctx.fillText(`${p}`, T.x - 12, ty(p) + 4) }
      ctx.setLineDash([3, 3]); ctx.strokeStyle = C_BETA
      ctx.beginPath(); ctx.moveTo(T.x, ty(beta)); ctx.lineTo(T.x + T.w, ty(beta)); ctx.stroke(); ctx.setLineDash([])
      for (const [tr, col] of [[trMp, C_MP], [trB, C_BETA]] as const) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath()
        tr.forEach((p, k) => (k ? ctx.lineTo(tx(k, tr.length), ty(p)) : ctx.moveTo(tx(k, tr.length), ty(p))))
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(127,127,127,0.9)'
      ctx.fillText('φ_i of cell i vs time', T.x + 4, T.y + 14)
      ctx.fillText(`β = ${beta.toFixed(2)} cap`, T.x + 4, ty(beta) - 4)
      ctx.fillStyle = C_MP; ctx.fillRect(P.x, H - 40, 12, 4); ctx.fillText('β=1, bounds = face averages (MP)', P.x + 16, H - 34)
      ctx.fillStyle = C_BETA; ctx.fillRect(P.x + 290, H - 40, 12, 4); ctx.fillText(`β=${beta.toFixed(2)}, bounds = neighbour values`, P.x + 306, H - 34)
      ctx.fillStyle = 'rgba(127,127,127,0.9)'; ctx.fillText('dashed: exact step · grey: cell averages · bands: [z_min, z_max] of cell i', P.x, H - 14)
    }

    const advanceS = (k: number) => {
      for (let n = 0; n < k; n++) {
        sRef.current += 0.01
        if (sRef.current > 5.6) sRef.current = 1.4
        const z = averages(sRef.current)
        trMp.push(limit(z, 3, 1, true)[0]); trB.push(limit(z, 3, beta, false)[0])
        if (trMp.length > 300) { trMp.shift(); trB.shift() }
      }
    }
    const advance = (k: number) => {
      advanceS(k)
      draw()
      const z = averages(sRef.current), a = limit(z, 3, 1, true), b = limit(z, 3, beta, false)
      setRead({ s: sRef.current, zi: z[3], phiMp: a[0], phiB: b[0], fMp: z[3] + a[0] * a[2], fB: z[3] + b[0] * b[2] })
    }
    adv.current = advance
    const loop = () => {
      if (playing) {
        frame++
        advanceS(speed)
        draw()
        if (frame % 12 === 0) {
          const z = averages(sRef.current), a = limit(z, 3, 1, true), b = limit(z, 3, beta, false)
          setRead({ s: sRef.current, zi: z[3], phiMp: a[0], phiB: b[0], fMp: z[3] + a[0] * a[2], fB: z[3] + b[0] * b[2] })
        }
      }
      raf = requestAnimationFrame(loop)
    }
    draw()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [beta, speed, playing, nonce])

  const btn = (on: boolean) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(127,127,127,0.5)',
    background: on ? 'rgba(249,115,22,0.18)' : 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 13, alignItems: 'center' }}>
        <label>β = {beta.toFixed(2)} <input type="range" min={1} max={3} step={0.05} value={beta} onChange={(e) => setBeta(+e.target.value)} /></label>
        <label>speed {speed} <input type="range" min={1} max={6} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button style={btn(playing)} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(false)} onClick={() => { setPlaying(false); adv.current(10) }}>Step</button>
        <button style={btn(false)} onClick={() => { setNonce((v) => v + 1); setPlaying(true) }}>Reset</button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
        interface x = {(read.s - 3).toFixed(2)} (cells from i) · z_i = {read.zi.toFixed(3)} ·{' '}
        <span style={{ color: C_MP }}>φ_MP {read.phiMp.toFixed(2)}, face {read.fMp.toFixed(3)}</span> ·{' '}
        <span style={{ color: C_BETA }}>φ_β {read.phiB.toFixed(2)}, face {read.fB.toFixed(3)}</span>
      </div>
    </div>
  )
}
