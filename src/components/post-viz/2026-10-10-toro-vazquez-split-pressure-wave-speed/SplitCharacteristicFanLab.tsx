'use client'

import { useEffect, useRef, useState } from 'react'

const MATS = {
  Air: { g: 1.4, pinf: 0, rho: 1.2 },
  Water: { g: 4.4, pinf: 6e8, rho: 1000 },
  Epoxy: { g: 2.43, pinf: 5.3e9, rho: 1185 },
  Spinel: { g: 1.62, pinf: 141e9, rho: 3622 },
} as const
type Mat = keyof typeof MATS

function speeds(mat: Mat, pbar: number) {
  const m = MATS[mat]
  const p = pbar * 1e5
  const rho = mat === 'Air' ? m.rho * pbar : m.rho
  return { c: Math.sqrt((m.g * (p + m.pinf)) / rho), A: Math.sqrt(((m.g - 1) * p) / rho) }
}

export function SplitCharacteristicFanLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mat, setMat] = useState<Mat>('Water')
  const [logP, setLogP] = useState(0)
  const [logM, setLogM] = useState(-1)
  const [split, setSplit] = useState(true)
  const pbar = Math.pow(10, logP)
  const mach = Math.pow(10, logM)
  const { c, A } = speeds(mat, pbar)
  const u = mach * c
  const ratio = (u + c) / u

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let raf = 0
    let phase = 0
    const W = cv.width
    const H = cv.height
    const fx0 = 40
    const fw = 470
    const fy0 = 30
    const fh = H - 70
    const ox = fx0 + fw / 2
    const oy = fy0 + fh
    // x-axis: lambda / c in [-1.3, 1.3]
    const sx = (lam: number) => ox + (lam / c) * (fw / 2.6)

    const ray = (lam: number, col: string, dash: number[], label: string, lw = 2) => {
      // x - t ray: x = lam * t, t in [0, 1] mapped to full height
      const xe = sx(lam)
      ctx.setLineDash(dash)
      ctx.strokeStyle = col
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(ox, oy)
      ctx.lineTo(xe, fy0)
      ctx.stroke()
      ctx.setLineDash([])
      // travelling marker
      const tx = ox + (xe - ox) * phase
      const ty = oy - fh * phase
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(tx, ty, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(label, Math.min(Math.max(xe - 20, fx0), fx0 + fw - 60), fy0 - 8)
    }

    const draw = () => {
      phase = (phase + 0.006) % 1
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)
      // axes
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(fx0, fy0, fw, fh)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '11px ui-monospace, monospace'
      for (const v of [-1, -0.5, 0, 0.5, 1]) {
        const x = sx(v * c)
        ctx.fillText(v.toFixed(1), x - 10, oy + 16)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.beginPath()
        ctx.moveTo(x, fy0)
        ctx.lineTo(x, oy)
        ctx.stroke()
      }
      ctx.fillText('wave speed / c  (x - t diagram, time up)', fx0 + 100, oy + 32)
      // full system: u-c, u, u+c
      ray(u - c, 'rgba(200,200,200,0.75)', [6, 5], 'u-c', 1.5)
      ray(u + c, 'rgba(200,200,200,0.75)', [6, 5], 'u+c', 1.5)
      if (split) {
        ray(u, '#60a5fa', [], 'u (advect)')
        ray(-A, '#f59e0b', [], '-A')
        ray(A, '#f59e0b', [], '+A')
      } else {
        ray(u, '#60a5fa', [], 'u')
      }
      // dt bars (log scale)
      const bx = 560
      const bw = 50
      const by = fy0
      const bh = fh
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText('time step (log)', bx, by - 8)
      const lg = (r: number) => Math.min(1, Math.log10(r) / 4)
      const hExp = bh * 0.02 + 2
      const hImp = Math.max(hExp, bh * lg(ratio))
      ctx.fillStyle = '#9ca3af'
      ctx.fillRect(bx, by + bh - hExp, bw, hExp)
      ctx.fillStyle = '#34d399'
      ctx.fillRect(bx + 80, by + bh - hImp, bw, hImp)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('explicit', bx, by + bh + 16)
      ctx.fillText('IMEX', bx + 85, by + bh + 16)
      ctx.fillText('dx/(|u|+c)', bx - 6, by + bh + 30)
      ctx.fillText('dx/|u|', bx + 85, by + bh + 30)
      for (const k of [1, 2, 3, 4]) {
        const y = by + bh - (bh * k) / 4
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillText(`x1e${k}`, bx + 140, y + 4)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.beginPath()
        ctx.moveTo(bx, y)
        ctx.lineTo(bx + 135, y)
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [c, A, u, ratio, split])

  const lab: React.CSSProperties = { fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 170 }
  return (
    <div style={{ border: '1px solid rgba(127,127,127,0.35)', borderRadius: 10, padding: 14, margin: '1.5rem 0' }}>
      <canvas ref={canvasRef} width={760} height={340} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        {(Object.keys(MATS) as Mat[]).map((k) => (
          <button key={k} onClick={() => setMat(k)}
            style={{ padding: '4px 12px', fontSize: 12, fontWeight: k === mat ? 700 : 400, outline: k === mat ? '2px solid #f59e0b' : 'none' }}>
            {k}
          </button>
        ))}
        <button onClick={() => setSplit((v) => !v)} style={{ padding: '4px 12px', fontSize: 12 }}>
          view: {split ? 'split (pressure + advection)' : 'full system only'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <label style={lab}>
          p = {pbar < 10 ? pbar.toFixed(2) : pbar.toFixed(0)} bar
          <input type="range" min={0} max={3} step={0.05} value={logP}
            onChange={(e) => setLogP(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={lab}>
          Mach = {mach.toPrecision(2)}
          <input type="range" min={-3} max={-0.3} step={0.05} value={logM}
            onChange={(e) => setLogM(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        c = {c.toFixed(1)} m/s &nbsp;|&nbsp;
        <span style={{ color: '#f59e0b' }}>A = {A.toFixed(2)} m/s (A/c = {(A / c).toFixed(4)})</span> &nbsp;|&nbsp;
        <span style={{ color: '#60a5fa' }}>u = {u.toFixed(2)} m/s</span> &nbsp;|&nbsp;
        <span style={{ color: '#34d399' }}>dt_IMEX / dt_explicit = {ratio.toFixed(1)}</span>
      </div>
    </div>
  )
}
