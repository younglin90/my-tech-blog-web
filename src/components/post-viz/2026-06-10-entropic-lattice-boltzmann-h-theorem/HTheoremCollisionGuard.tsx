'use client'
import { useEffect, useRef, useState } from 'react'

const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]
const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1]

function feq9(rho: number, ux: number, uy: number): number[] {
  return W.map((w, i) => {
    const cu = 3 * (CX[i] * ux + CY[i] * uy)
    const usq = 1.5 * (ux * ux + uy * uy)
    return rho * w * (1 + cu + 0.5 * cu * cu - usq)
  })
}
function hOf(f: number[]): number {
  let s = 0
  for (let i = 0; i < 9; i++) {
    if (f[i] > 0) s += f[i] * Math.log(f[i] / W[i])
  }
  return s
}
function solveAlpha(f: number[], fe: number[]): number {
  const d = fe.map((v, i) => v - f[i])
  const H0 = hOf(f)
  const G = (a: number) => hOf(f.map((v, i) => v + a * d[i])) - H0
  let amax = Infinity
  for (let i = 0; i < 9; i++) if (d[i] < 0) amax = Math.min(amax, -f[i] / d[i])
  const hi0 = isFinite(amax) ? Math.min(amax * 0.999, 4) : 4
  if (G(hi0) <= 0) return 2
  let lo = 1
  while (G(lo) > 0 && lo > 1e-3) lo *= 0.5
  let hi = hi0
  for (let k = 0; k < 60; k++) {
    const m = 0.5 * (lo + hi)
    if (G(m) > 0) hi = m
    else lo = m
  }
  return 0.5 * (lo + hi)
}

export function HTheoremCollisionGuard() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [shear, setShear] = useState(0.07)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const Wd = c.width
    const Hd = c.height

    const fe0 = feq9(1, 0, 0)
    const f = fe0.slice()
    f[1] += shear
    f[3] -= shear
    f[5] += 0.5 * shear
    f[7] -= 0.5 * shear
    let rho = 0
    let mx = 0
    let my = 0
    for (let i = 0; i < 9; i++) {
      rho += f[i]
      mx += CX[i] * f[i]
      my += CY[i] * f[i]
    }
    const fe = feq9(rho, mx / rho, my / rho)
    const alpha = solveAlpha(f, fe)
    const fbgk = f.map((v, i) => v + 2 * (fe[i] - v))
    const fent = f.map((v, i) => v + alpha * (fe[i] - v))
    const Hpre = hOf(f)
    const Hbgk = hOf(fbgk)
    const Hent = hOf(fent)
    const violated = Hbgk > Hpre + 1e-12

    ctx.fillStyle = '#0b1626'
    ctx.fillRect(0, 0, Wd, Hd)

    const groups = [
      { f: fbgk, x0: 30, col: violated ? '#f87171' : '#7a90a8', name: 'BGK  α = 2.000' },
      { f: fent, x0: Wd / 2 + 10, col: '#22d3ee', name: `Entropic  α = ${alpha.toFixed(3)}` },
    ]
    const gw = Wd / 2 - 50
    const bw = gw / 9
    const mid = Hd * 0.6
    for (const g of groups) {
      ctx.strokeStyle = '#33455e'
      ctx.beginPath()
      ctx.moveTo(g.x0, mid)
      ctx.lineTo(g.x0 + gw, mid)
      ctx.stroke()
      for (let i = 0; i < 9; i++) {
        const v = g.f[i]
        const h = v * 200
        ctx.fillStyle = v < 0 ? '#ef4444' : g.col
        const x = g.x0 + i * bw + 2
        ctx.fillRect(x, h >= 0 ? mid - h : mid, bw - 4, Math.abs(h))
      }
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '12px monospace'
      ctx.fillText(g.name, g.x0, 18)
    }

    ctx.font = '12px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`H_pre = ${Hpre.toFixed(6)}`, 30, Hd - 46)
    ctx.fillStyle = violated ? '#f87171' : '#94a3b8'
    ctx.fillText(
      `H_BGK = ${Hbgk.toFixed(6)}  ${violated ? '▲ H increased — H-theorem violated' : '(below H_pre, ok)'}`,
      30,
      Hd - 28,
    )
    ctx.fillStyle = '#34d399'
    ctx.fillText(`H_ent = ${Hent.toFixed(6)}  = H_pre by construction`, 30, Hd - 10)
  }, [shear])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--surface)',
      }}
    >
      <canvas
        ref={ref}
        width={640}
        height={320}
        style={{ width: '100%', height: 'auto', borderRadius: 8 }}
      />
      <div
        style={{
          marginTop: 12,
          fontFamily: 'monospace',
          fontSize: 13,
          color: 'var(--text)',
        }}
      >
        <label>Non-equilibrium shear: {shear.toFixed(3)}</label>
        <input
          type="range"
          min={0}
          max={0.2}
          step={0.005}
          value={shear}
          onChange={(e) => setShear(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent)' }}
        />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
        Both panels show post-collision populations. The entropic collision lands exactly on
        the equal-entropy point, so H_ent = H_pre. Fixed-α BGK misses it; once the
        non-equilibrium part grows, BGK over-shoots and H actually increases — a violated
        discrete H-theorem, which is the seed of low-viscosity blow-up.
      </p>
    </div>
  )
}
