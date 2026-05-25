'use client'

import { useEffect, useRef, useState } from 'react'

export function CounterRotatingVortexPair() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gamma, setGamma] = useState(3.0)
  const [sep, setSep] = useState(1.5)
  const [downstream, setDownstream] = useState(0.0)

  const paramsRef = useRef({ gamma, sep, downstream })
  useEffect(() => {
    paramsRef.current = { gamma, sep, downstream }
  }, [gamma, sep, downstream])

  const resetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const yMin = -4
    const yMax = 4
    const zMin = 0
    const zMax = 6
    const sx = (y: number) => ((y - yMin) / (yMax - yMin)) * W
    const sy = (z: number) => H - ((z - zMin) / (zMax - zMin)) * H
    const zc = 2.0

    type P = { y: number; z: number; life: number }
    const MAX = 720
    let dye: P[] = []

    const seed = (n: number) => {
      for (let i = 0; i < n; i++) {
        dye.push({ y: (Math.random() - 0.5) * 1.6, z: 0.3 + Math.random() * 0.4, life: 0 })
      }
    }

    const induced = (y: number, z: number, g: number, b: number, core: number) => {
      let uy = 0
      let uz = 0
      const add = (y0: number, z0: number, gg: number) => {
        const dy = y - y0
        const dz = z - z0
        const r2 = dy * dy + dz * dz + core * core
        uy += (-gg / (2 * Math.PI)) * (dz / r2)
        uz += (gg / (2 * Math.PI)) * (dy / r2)
      }
      add(-b / 2, zc, +g)
      add(+b / 2, zc, -g)
      return [uy, uz] as const
    }

    let raf = 0
    let last = performance.now()
    let lastReset = resetRef.current

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000)
      last = now
      const { gamma: g0, sep: b, downstream: ds } = paramsRef.current

      if (resetRef.current !== lastReset) {
        dye = []
        lastReset = resetRef.current
      }

      const g = g0 * (1 - 0.7 * ds)
      const core = 0.14 + 0.5 * ds

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1422'
      ctx.fillRect(0, 0, W, H)

      if (dye.length < MAX) seed(14)

      for (const p of dye) {
        const [uy, uz] = induced(p.y, p.z, g, b, core)
        p.y += uy * dt * 2.2
        p.z += uz * dt * 2.2
        p.life += dt * 0.32
      }
      dye = dye.filter(p => p.life < 1.5 && p.z > -0.5 && p.z < zMax + 0.5 && Math.abs(p.y) < yMax + 0.5)

      for (const p of dye) {
        const a = Math.max(0, 0.8 - p.life * 0.5)
        ctx.fillStyle = `rgba(34,211,238,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(sx(p.y), sy(p.z), 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      const drawVortex = (y0: number, ccw: boolean) => {
        ctx.strokeStyle = 'rgba(244,114,182,0.9)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.arc(sx(y0), sy(zc), 9, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        const a0 = ccw ? -0.5 : Math.PI - 0.5
        const a1 = ccw ? 1.2 : Math.PI + 1.2
        ctx.arc(sx(y0), sy(zc), 9, a0, a1)
        ctx.stroke()
        const tipx = sx(y0) + 9 * Math.cos(a1)
        const tipy = sy(zc) + 9 * Math.sin(a1)
        ctx.beginPath()
        ctx.moveTo(tipx, tipy)
        ctx.lineTo(tipx + (ccw ? 4 : -4), tipy - 4)
        ctx.lineTo(tipx + (ccw ? -1 : 1), tipy - 6)
        ctx.closePath()
        ctx.fillStyle = 'rgba(244,114,182,0.9)'
        ctx.fill()
      }
      drawVortex(-b / 2, true)
      drawVortex(+b / 2, false)

      ctx.fillStyle = 'rgba(226,232,240,0.9)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`+Γ          −Γ   (Γ = ${g.toFixed(2)},  b = ${b.toFixed(2)})`, 12, 20)
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('cross-section looking downstream  (y, z)', 12, H - 12)

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 14,
      background: 'var(--surface)',
      margin: '16px 0'
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 340, display: 'block', borderRadius: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Circulation Γ = {gamma.toFixed(1)}</span>
          <input type="range" min={0.5} max={5.0} step={0.1} value={gamma}
                 onChange={e => setGamma(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Separation b = {sep.toFixed(1)}</span>
          <input type="range" min={0.6} max={2.6} step={0.1} value={sep}
                 onChange={e => setSep(parseFloat(e.target.value))} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Downstream / diffusion = {downstream.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.02} value={downstream}
                 onChange={e => setDownstream(parseFloat(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <button
            onClick={() => { resetRef.current += 1 }}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 12
            }}>
            reset dye
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Left vortex spins counter-clockwise (+Γ), right clockwise (−Γ): between them the dye is pumped
        upward and folds outward into the kidney-shaped mushroom. Push the downstream slider toward 1 and
        diffusion saps Γ — the mushroom stalls, just as the real CVP weakens far from the exit.
      </p>
    </div>
  )
}
