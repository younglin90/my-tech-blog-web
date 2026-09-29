'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]

/** Populations with zero 0th/1st/2nd moments and a unit third moment. */
const V_XXY = [0, 0, -0.5, 0, 0.5, 0.25, 0.25, -0.25, -0.25]
const V_XYY = [0, -0.5, 0, 0.5, 0, 0.25, -0.25, -0.25, 0.25]

function guoPopulations(ux: number, uy: number, fx: number, fy: number, tau: number) {
  const half = 1 - 1 / (2 * tau)
  const gxx = ux * fx
  const gyy = uy * fy
  const gxy = 0.5 * (ux * fy + uy * fx)
  const s: number[] = []
  for (let i = 0; i < 9; i++) {
    const cF = CX[i] * fx + CY[i] * fy
    const quad =
      gxx * (CX[i] * CX[i] - CS2) + gyy * (CY[i] * CY[i] - CS2) + 2 * gxy * CX[i] * CY[i]
    s.push(W[i] * half * (cF / CS2 + quad / (CS2 * CS2)))
  }
  return s
}

function moment(s: number[], f: (cx: number, cy: number) => number) {
  let m = 0
  for (let i = 0; i < 9; i++) m += s[i] * f(CX[i], CY[i])
  return m
}

type Row = { label: string; want: number; got: number; state: 'match' | 'free' | 'locked' }

function buildRows(s: number[], ux: number, uy: number, fx: number, fy: number): Row[] {
  // Third moment demanded by the continuous Boltzmann force term.
  const want3 = (a: 0 | 1, b: 0 | 1, c: 0 | 1) => {
    const u = [ux, uy]
    const F = [fx, fy]
    const d = (i: number, j: number) => (i === j ? 1 : 0)
    return (
      F[a] * (u[b] * u[c] + CS2 * d(b, c)) +
      F[b] * (u[a] * u[c] + CS2 * d(a, c)) +
      F[c] * (u[a] * u[b] + CS2 * d(a, b))
    )
  }
  return [
    { label: 'S', want: 0, got: moment(s, () => 1), state: 'match' },
    { label: 'S cx', want: fx, got: moment(s, (cx) => cx), state: 'match' },
    { label: 'S cx cy', want: ux * fy + uy * fx, got: moment(s, (cx, cy) => cx * cy), state: 'match' },
    {
      label: 'S cx cx cy',
      want: want3(0, 0, 1),
      got: moment(s, (cx, cy) => cx * cx * cy),
      state: 'free',
    },
    {
      label: 'S cx cy cy',
      want: want3(0, 1, 1),
      got: moment(s, (cx, cy) => cx * cy * cy),
      state: 'free',
    },
    {
      label: 'S cx cx cx',
      want: want3(0, 0, 0),
      got: moment(s, (cx) => cx * cx * cx),
      state: 'locked',
    },
  ]
}

export function ForceMomentLockLadder() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ux, setUx] = useState(0.22)
  const [uy, setUy] = useState(0.18)
  const [fAngle, setFAngle] = useState(0)
  const [fill3, setFill3] = useState(false)
  const [tau] = useState(1)
  const st = useRef({ ux, uy, fAngle, fill3, tau })
  const [gap, setGap] = useState(0)

  useEffect(() => {
    st.current = { ux, uy, fAngle, fill3, tau }
  }, [ux, uy, fAngle, fill3, tau])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let frame = 0

    const draw = () => {
      frame++
      const p = st.current
      const fmag = 0.02
      const fx = fmag * Math.cos(p.fAngle)
      const fy = fmag * Math.sin(p.fAngle)
      const s = guoPopulations(p.ux, p.uy, fx, fy, p.tau)
      if (p.fill3) {
        const half = 1 - 1 / (2 * p.tau)
        const dxxy = 2 * fx * p.ux * p.uy + fy * p.ux * p.ux
        const dxyy = fx * p.uy * p.uy + 2 * fy * p.ux * p.uy
        for (let i = 0; i < 9; i++) s[i] += half * (V_XXY[i] * dxxy + V_XYY[i] * dxyy)
      }
      const rows = buildRows(s, p.ux, p.uy, fx, fy)

      ctx.fillStyle = '#0d1420'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.font = '12px ui-monospace, monospace'

      // ---- left: the nine populations of the force term ----
      const cxp = 170
      const cyp = 215
      const sp = 66
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('force populations S_i on D2Q9 (cyan +, orange -)', 20, 28)
      let smax = 1e-9
      for (let i = 0; i < 9; i++) smax = Math.max(smax, Math.abs(s[i]))
      for (let i = 0; i < 9; i++) {
        const tx = cxp + CX[i] * sp
        const ty = cyp - CY[i] * sp
        const mag = Math.abs(s[i]) / smax
        ctx.strokeStyle = '#26313f'
        ctx.beginPath()
        ctx.moveTo(cxp, cyp)
        ctx.lineTo(tx, ty)
        ctx.stroke()
        // travelling dot: speed follows |S_i|
        if (i > 0 && mag > 0.02) {
          const t = ((frame * (0.004 + 0.02 * mag)) % 1 + 1) % 1
          const dir = s[i] >= 0 ? t : 1 - t
          ctx.fillStyle = s[i] >= 0 ? '#38bdf8' : '#fb923c'
          ctx.beginPath()
          ctx.arc(cxp + (tx - cxp) * dir, cyp + (ty - cyp) * dir, 3.2, 0, 2 * Math.PI)
          ctx.fill()
        }
        const r = 6 + 16 * mag
        ctx.fillStyle = s[i] >= 0 ? 'rgba(56,189,248,0.75)' : 'rgba(251,146,60,0.75)'
        ctx.beginPath()
        ctx.arc(tx, ty, r, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(`${i}`, tx - 3, ty + 4)
      }
      // velocity and force arrows
      const arrow = (dx: number, dy: number, colour: string, label: string) => {
        const L = 52
        ctx.strokeStyle = colour
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(cxp, cyp)
        ctx.lineTo(cxp + dx * L, cyp - dy * L)
        ctx.stroke()
        ctx.lineWidth = 1
        ctx.fillStyle = colour
        ctx.fillText(label, cxp + dx * L + 4, cyp - dy * L - 4)
      }
      const un = Math.hypot(p.ux, p.uy) || 1
      arrow(p.ux / un, p.uy / un, '#4ade80', 'u')
      arrow(Math.cos(p.fAngle), Math.sin(p.fAngle), '#f472b6', 'F')
      ctx.fillStyle = '#8b98a9'
      ctx.fillText(`|u| = ${Math.hypot(p.ux, p.uy).toFixed(3)}   Ma = ${(Math.hypot(p.ux, p.uy) / Math.sqrt(CS2)).toFixed(2)}`, 20, 350)

      // ---- right: moment ladder ----
      const x0 = 366
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText('moment of S_i :  demanded by kinetic theory  vs  supplied', x0, 28)
      let mmax = 1e-12
      for (const r of rows) mmax = Math.max(mmax, Math.abs(r.want), Math.abs(r.got))
      const bw = 210
      let worst = 0
      rows.forEach((r, j) => {
        const y = 56 + j * 52
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(`sum ${r.label}`, x0, y + 4)
        const bx = x0 + 120
        const scale = (v: number) => (v / mmax) * (bw / 2)
        ctx.strokeStyle = '#26313f'
        ctx.beginPath()
        ctx.moveTo(bx + bw / 2, y - 12)
        ctx.lineTo(bx + bw / 2, y + 22)
        ctx.stroke()
        const bar = (v: number, off: number, colour: string) => {
          const w = scale(v)
          ctx.fillStyle = colour
          ctx.fillRect(bx + bw / 2, y - 10 + off, w, 9)
        }
        bar(r.want, 0, '#64748b')
        bar(r.got, 12, r.state === 'locked' ? '#f87171' : r.state === 'free' ? '#fbbf24' : '#4ade80')
        const err = Math.abs(r.want - r.got)
        if (r.state !== 'match') worst = Math.max(worst, err / (mmax || 1))
        ctx.fillStyle = '#8b98a9'
        ctx.fillText(
          `${r.want >= 0 ? ' ' : ''}${r.want.toExponential(2)} / ${r.got >= 0 ? ' ' : ''}${r.got.toExponential(2)}`,
          bx + bw + 14,
          y + 4,
        )
        ctx.fillStyle = r.state === 'locked' ? '#f87171' : r.state === 'free' ? '#fbbf24' : '#4ade80'
        ctx.fillText(
          err < 1e-14 ? 'matched' : r.state === 'locked' ? 'locked by c^3 = c' : 'free to fill',
          bx + bw + 150,
          y + 4,
        )
      })
      ctx.fillStyle = '#8b98a9'
      ctx.fillText('grey = demanded    coloured = supplied', x0 + 120, 56 + 6 * 52 + 2)

      if (frame % 12 === 0) setGap(worst)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={400}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        <label>
          ux = {ux.toFixed(2)}{' '}
          <input
            type="range"
            min={-0.3}
            max={0.3}
            step={0.01}
            value={ux}
            onChange={(e) => setUx(parseFloat(e.target.value))}
          />
        </label>
        <label>
          uy = {uy.toFixed(2)}{' '}
          <input
            type="range"
            min={-0.3}
            max={0.3}
            step={0.01}
            value={uy}
            onChange={(e) => setUy(parseFloat(e.target.value))}
          />
        </label>
        <label>
          F angle = {((fAngle * 180) / Math.PI).toFixed(0)} deg{' '}
          <input
            type="range"
            min={0}
            max={Math.PI * 2}
            step={0.02}
            value={fAngle}
            onChange={(e) => setFAngle(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={fill3} onChange={(e) => setFill3(e.target.checked)} /> fill
          the third moment
        </label>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Drag ux, uy toward zero and every row lines up. Push them out and the two yellow rows open a
        gap that the checkbox can close, while the red row cannot be touched at all: on D2Q9 cx^3 is
        the same vector as cx. Largest remaining gap, relative to the biggest moment on screen:{' '}
        {(gap * 100).toFixed(2)}%.
      </p>
    </div>
  )
}
