'use client'

import { useEffect, useRef, useState } from 'react'

// Absolute stability regions of explicit vs implicit time integrators.
// Amplification factor G(z) with z = lambda * dt (complex). A scheme is
// stable at z when |G(z)| <= 1. Implicit schemes leave the whole left half
// plane open, which is the entire reason we pay for a matrix solve.

type Scheme = 'fe' | 'rk4' | 'be' | 'tr'

const SCHEMES: { key: Scheme; label: string; implicit: boolean }[] = [
  { key: 'fe', label: 'Forward Euler', implicit: false },
  { key: 'rk4', label: 'RK4', implicit: false },
  { key: 'be', label: 'Backward Euler', implicit: true },
  { key: 'tr', label: 'Trapezoidal (CN)', implicit: true },
]

// complex helpers: c = [re, im]
function cMul(a: number[], b: number[]): number[] {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
}
function cDiv(a: number[], b: number[]): number[] {
  const d = b[0] * b[0] + b[1] * b[1]
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]
}
function cAbs(a: number[]): number {
  return Math.hypot(a[0], a[1])
}

function amp(scheme: Scheme, z: number[]): number {
  if (scheme === 'fe') return cAbs([1 + z[0], z[1]])
  if (scheme === 'rk4') {
    // G = sum_{k=0}^{4} z^k / k!
    let term = [1, 0]
    const g = [0, 0]
    const fact = [1, 1, 2, 6, 24]
    for (let k = 0; k <= 4; k++) {
      g[0] += term[0] / fact[k]
      g[1] += term[1] / fact[k]
      term = cMul(term, z)
    }
    return cAbs(g)
  }
  if (scheme === 'be') return cAbs(cDiv([1, 0], [1 - z[0], -z[1]]))
  // trapezoidal
  return cAbs(cDiv([1 + z[0] / 2, z[1] / 2], [1 - z[0] / 2, -z[1] / 2]))
}

export function AbsoluteStabilityRegion() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [scheme, setScheme] = useState<Scheme>('fe')
  const [reZ, setReZ] = useState(-1.0)
  const [imZ, setImZ] = useState(1.4)

  const xMin = -5
  const xMax = 2
  const yMin = -3.4
  const yMax = 3.4

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const padL = 40
    const padR = 14
    const padT = 12
    const padB = 26
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const X = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW
    const Y = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin)) * plotH

    ctx.clearRect(0, 0, W, H)

    // shade the stable region |G| <= 1 cell by cell
    const step = 3
    for (let px = 0; px < plotW; px += step) {
      for (let py = 0; py < plotH; py += step) {
        const zr = xMin + ((px + step / 2) / plotW) * (xMax - xMin)
        const zi = yMax - ((py + step / 2) / plotH) * (yMax - yMin)
        const g = amp(scheme, [zr, zi])
        if (g <= 1) {
          // closer to neutral = brighter
          const a = 0.10 + 0.30 * (1 - g)
          ctx.fillStyle = `rgba(34,211,238,${a.toFixed(3)})`
          ctx.fillRect(padL + px, padT + py, step, step)
        }
      }
    }

    // axes
    ctx.strokeStyle = 'rgba(120,144,168,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(padL + plotW, Y(0)); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(X(0), padT); ctx.lineTo(X(0), padT + plotH); ctx.stroke()
    ctx.fillStyle = 'rgba(122,144,168,0.95)'
    ctx.font = '11px sans-serif'
    for (let x = xMin + 1; x <= xMax; x++) ctx.fillText(String(x), X(x) - 4, Y(0) + 14)
    ctx.fillText('Re(λΔt)', padL + plotW - 56, Y(0) - 6)
    ctx.fillText('Im(λΔt)', X(0) + 6, padT + 10)

    // probe point
    const g = amp(scheme, [reZ, imZ])
    const stable = g <= 1
    ctx.strokeStyle = 'rgba(226,232,240,0.45)'
    ctx.setLineDash([2, 3])
    ctx.beginPath(); ctx.moveTo(X(reZ), padT); ctx.lineTo(X(reZ), padT + plotH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(padL, Y(imZ)); ctx.lineTo(padL + plotW, Y(imZ)); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = stable ? '#22d3ee' : '#f472b6'
    ctx.beginPath(); ctx.arc(X(reZ), Y(imZ), 5, 0, Math.PI * 2); ctx.fill()

    // readout
    ctx.fillStyle = stable ? 'rgba(34,211,238,0.95)' : 'rgba(244,114,182,0.95)'
    ctx.font = '13px sans-serif'
    ctx.fillText(
      `|G| = ${g.toFixed(3)}  →  ${stable ? 'STABLE' : 'UNSTABLE'}`,
      padL + 8, padT + plotH - 8,
    )
  }, [scheme, reZ, imZ])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '20px 0', background: 'var(--surface)' }}>
      <canvas ref={canvasRef} width={620} height={320} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SCHEMES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScheme(s.key)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: scheme === s.key ? 'var(--accent)' : 'transparent',
                color: scheme === s.key ? '#06121f' : 'var(--text)',
                fontWeight: scheme === s.key ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 96 }}>Re(λΔt) = {reZ.toFixed(2)}</span>
          <input type="range" min={-5} max={2} step={0.05} value={reZ} onChange={(e) => setReZ(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 96 }}>Im(λΔt) = {imZ.toFixed(2)}</span>
          <input type="range" min={-3.4} max={3.4} step={0.05} value={imZ} onChange={(e) => setImZ(parseFloat(e.target.value))} />
        </label>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 2px 0' }}>
        Cyan = stable region (|G| ≤ 1). Forward Euler and RK4 are bounded blobs — push λΔt past their edge and the mode
        blows up. Backward Euler and Trapezoidal cover the entire left half plane, so any decaying physical mode stays
        stable no matter how large Δt grows.
      </p>
    </div>
  )
}
