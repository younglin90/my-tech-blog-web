'use client'
import { useEffect, useRef, useState } from 'react'

// D2Q9 lattice weights
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36]

function hFunc(f: number[]): number {
  let s = 0
  for (let i = 0; i < 9; i++) {
    if (f[i] > 0) s += f[i] * Math.log(f[i] / W[i])
  }
  return s
}

// rest-frame equilibrium for D2Q9 (u = 0)
function feqRest(): number[] {
  return W.slice()
}

export function EntropicAlphaSolver() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [amp, setAmp] = useState(0.06)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const Wd = canvas.width
    const Hd = canvas.height

    // Build a non-equilibrium state: equilibrium plus a shear-like perturbation.
    const feq = feqRest()
    const f = feq.slice()
    f[1] += amp
    f[3] -= amp
    f[5] += 0.5 * amp
    f[7] -= 0.5 * amp
    const d = feq.map((v, i) => v - f[i]) // direction toward equilibrium
    const H0 = hFunc(f)
    const G = (a: number) => hFunc(f.map((v, i) => v + a * d[i])) - H0

    // positivity bound on alpha
    let amax = Infinity
    for (let i = 0; i < 9; i++) if (d[i] < 0) amax = Math.min(amax, -f[i] / d[i])
    const aHi = isFinite(amax) ? Math.min(amax * 0.999, 4) : 4

    // non-trivial root of G (the trivial one is alpha = 0)
    let alpha = 2
    if (G(aHi) > 0) {
      let lo = 1
      while (G(lo) > 0 && lo > 1e-3) lo *= 0.5
      let hi = aHi
      for (let k = 0; k < 80; k++) {
        const mid = 0.5 * (lo + hi)
        if (G(mid) > 0) hi = mid
        else lo = mid
      }
      alpha = 0.5 * (lo + hi)
    }

    // draw
    ctx.fillStyle = '#0b1626'
    ctx.fillRect(0, 0, Wd, Hd)
    const pad = 40
    const aMax = aHi
    const N = 260
    const xs: number[] = []
    const gs: number[] = []
    let gmin = Infinity
    let gmax = -Infinity
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * aMax
      const g = G(a)
      xs.push(a)
      gs.push(g)
      if (isFinite(g)) {
        gmin = Math.min(gmin, g)
        gmax = Math.max(gmax, g)
      }
    }
    if (!isFinite(gmin) || gmin === gmax) {
      gmin = -1
      gmax = 1
    }
    const x2px = (a: number) => pad + (a / aMax) * (Wd - 2 * pad)
    const y2px = (g: number) =>
      Hd - pad - ((g - gmin) / (gmax - gmin)) * (Hd - 2 * pad)

    // zero line
    ctx.strokeStyle = '#33455e'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, y2px(0))
    ctx.lineTo(Wd - pad, y2px(0))
    ctx.stroke()

    // BGK alpha = 2 reference
    ctx.strokeStyle = '#7a90a8'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x2px(2), pad)
    ctx.lineTo(x2px(2), Hd - pad)
    ctx.stroke()
    ctx.setLineDash([])

    // G curve
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const px = x2px(xs[i])
      const py = y2px(gs[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // roots
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(x2px(0), y2px(0), 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(x2px(alpha), y2px(0), 5, 0, Math.PI * 2)
    ctx.fill()

    // labels
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '12px monospace'
    ctx.fillText('G(α) = H(f + αΔ) − H(f)', pad, pad - 12)
    ctx.fillStyle = '#fbbf24'
    ctx.fillText(`α* = ${alpha.toFixed(3)}`, x2px(alpha) - 16, y2px(0) - 12)
    ctx.fillStyle = '#7a90a8'
    ctx.fillText('BGK α=2', x2px(2) - 26, pad + 6)
  }, [amp])

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
        ref={canvasRef}
        width={620}
        height={300}
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
        <label>Non-equilibrium perturbation: {amp.toFixed(3)}</label>
        <input
          type="range"
          min={0}
          max={0.18}
          step={0.005}
          value={amp}
          onChange={(e) => setAmp(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent)' }}
        />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
        The yellow dot is the non-trivial root α* where the discrete H-function returns to
        its pre-collision value. Near equilibrium α* ≈ 2, which is exactly standard BGK.
        Push the perturbation up and α* drifts away from 2 — that gap is the entropic
        correction BGK ignores.
      </p>
    </div>
  )
}
