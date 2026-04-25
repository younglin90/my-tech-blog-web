'use client'

import { useEffect, useRef, useState } from 'react'

export function VolumeFractionAdvect() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [u, setU] = useState(1)
  const [diffuse, setDiffuse] = useState(0.02)
  const [width, setWidth] = useState(0.2)
  const tRef = useRef(0)
  const fieldRef = useRef<number[]>([])
  const N = 200

  useEffect(() => {
    fieldRef.current = new Array(N).fill(0).map((_, i) => {
      const x = i / N
      return x > 0.3 - width / 2 && x < 0.3 + width / 2 ? 1 : 0
    })
    tRef.current = 0
  }, [width])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = performance.now()

    function step() {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      tRef.current += dt
      const f = fieldRef.current
      const next = f.slice()
      const dx = 1 / N
      const cfl = (Math.abs(u) * dt) / dx
      for (let i = 1; i < N - 1; i++) {
        const upwind = u >= 0 ? f[i] - f[i - 1] : f[i + 1] - f[i]
        const diff = (f[i + 1] - 2 * f[i] + f[i - 1]) * diffuse
        next[i] = f[i] - cfl * upwind + diff
      }
      next[0] = next[1]
      next[N - 1] = next[N - 2]
      fieldRef.current = next

      const W = c!.width, H = c!.height
      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = 'rgba(8,17,31,0.95)'
      ctx!.fillRect(0, 0, W, H)
      const PAD = 30
      const innerW = W - PAD * 2, innerH = H - PAD * 2

      ctx!.strokeStyle = 'rgba(148,163,184,0.2)'
      ctx!.beginPath(); ctx!.moveTo(PAD, PAD + innerH); ctx!.lineTo(PAD + innerW, PAD + innerH); ctx!.stroke()
      ctx!.beginPath(); ctx!.moveTo(PAD, PAD); ctx!.lineTo(PAD, PAD + innerH); ctx!.stroke()

      ctx!.strokeStyle = '#22d3ee'
      ctx!.lineWidth = 2
      ctx!.beginPath()
      for (let i = 0; i < N; i++) {
        const px = PAD + (i / N) * innerW
        const py = PAD + innerH * (1 - next[i])
        if (i === 0) ctx!.moveTo(px, py); else ctx!.lineTo(px, py)
      }
      ctx!.stroke()

      ctx!.fillStyle = 'rgba(34,211,238,0.15)'
      ctx!.lineTo(PAD + innerW, PAD + innerH); ctx!.lineTo(PAD, PAD + innerH); ctx!.closePath(); ctx!.fill()

      ctx!.fillStyle = '#94a3b8'
      ctx!.font = '11px ui-monospace, monospace'
      ctx!.fillText(`α (volume fraction)  CFL=${cfl.toFixed(2)}`, 14, 18)
      ctx!.fillText('upwind + 인공 확산 → 계면이 번진다', PAD, H - 8)

      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [u, diffuse])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12 }}>
        <label>속도 u <input type="range" min={0.1} max={2} step={0.05} value={u} onChange={(e) => setU(parseFloat(e.target.value))} /> <strong>{u.toFixed(2)}</strong></label>
        <label>인공 확산 <input type="range" min={0} max={0.1} step={0.005} value={diffuse} onChange={(e) => setDiffuse(parseFloat(e.target.value))} /> <strong>{diffuse.toFixed(3)}</strong></label>
        <label>초기 폭 <input type="range" min={0.05} max={0.4} step={0.01} value={width} onChange={(e) => setWidth(parseFloat(e.target.value))} /> <strong>{width.toFixed(2)}</strong></label>
      </div>
      <canvas ref={ref} width={640} height={260} style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        5-방정식 모델의 핵심: 부피분율 α의 이류. upwind 만으로는 계면이 점차 번지므로 실제 코드는 THINC / interface sharpening을 추가한다.
      </p>
    </div>
  )
}
