'use client'

import { useEffect, useRef, useState } from 'react'

// 논리(계산) 좌표 (xi, eta) ∈ [0,1]^2 를 물리 좌표 (x, y)로 보내는 매핑.
// shear 는 평행사변형 기울임, amp/waveK 는 물결 변형을 만든다.
function mapPoint(xi: number, eta: number, amp: number, shear: number, waveK: number) {
  const x = xi + shear * eta + amp * Math.sin(Math.PI * waveK * eta)
  const y = eta + amp * Math.sin(Math.PI * waveK * xi)
  return { x, y }
}

// 야코비안 비(J / J0)에 따른 셀 색. 음수면 격자 접힘(빨강).
function cellColor(jr: number): string {
  if (jr <= 0) return '#ef4444' // folded cell
  const t = Math.max(0, Math.min(1, jr / 2)) // 0..2 -> 0..1
  // dark blue (compressed) -> cyan accent (expanded)
  const c0 = [30, 58, 95]
  const c1 = [34, 211, 238]
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * t)
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * t)
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * t)
  return `rgb(${r},${g},${b})`
}

export function CurvilinearGridMapper() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [n, setN] = useState(16)
  const [shear, setShear] = useState(0.3)
  const [amp, setAmp] = useState(0.15)
  const [waveK, setWaveK] = useState(2)
  const [showJ, setShowJ] = useState(true)
  const [animate, setAnimate] = useState(false)
  const [stats, setStats] = useState({ minJ: 1, maxJ: 1, folded: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const pad = 30
    let t0 = performance.now()

    const draw = (now: number) => {
      const effAmp = animate ? amp * (0.5 + 0.5 * Math.sin((now - t0) / 700)) : amp

      // 노드 그리드 (n+1) x (n+1) 생성
      const nodes: { x: number; y: number }[][] = []
      let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity
      for (let i = 0; i <= n; i++) {
        const row: { x: number; y: number }[] = []
        for (let j = 0; j <= n; j++) {
          const p = mapPoint(j / n, i / n, effAmp, shear, waveK)
          row.push(p)
          if (p.x < xmin) xmin = p.x
          if (p.x > xmax) xmax = p.x
          if (p.y < ymin) ymin = p.y
          if (p.y > ymax) ymax = p.y
        }
        nodes.push(row)
      }

      const sx = (W - 2 * pad) / (xmax - xmin)
      const sy = (H - 2 * pad) / (ymax - ymin)
      const s = Math.min(sx, sy)
      const toPx = (p: { x: number; y: number }) => ({
        px: pad + (p.x - xmin) * s,
        py: H - pad - (p.y - ymin) * s,
      })

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const J0 = (1 / n) * (1 / n)
      let minJ = Infinity, maxJ = -Infinity, folded = 0

      // 셀 채우기 (야코비안 색)
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const p00 = nodes[i][j], p10 = nodes[i][j + 1]
          const p01 = nodes[i + 1][j], p11 = nodes[i + 1][j + 1]
          // 셀 중심 미분 근사
          const x_xi = 0.5 * ((p10.x - p00.x) + (p11.x - p01.x))
          const x_eta = 0.5 * ((p01.x - p00.x) + (p11.x - p10.x))
          const y_xi = 0.5 * ((p10.y - p00.y) + (p11.y - p01.y))
          const y_eta = 0.5 * ((p01.y - p00.y) + (p11.y - p10.y))
          const J = x_xi * y_eta - x_eta * y_xi
          const jr = J / J0
          if (jr < minJ) minJ = jr
          if (jr > maxJ) maxJ = jr
          if (jr <= 0) folded++

          if (showJ) {
            const a = toPx(p00), b = toPx(p10), c = toPx(p11), d = toPx(p01)
            ctx.beginPath()
            ctx.moveTo(a.px, a.py)
            ctx.lineTo(b.px, b.py)
            ctx.lineTo(c.px, c.py)
            ctx.lineTo(d.px, d.py)
            ctx.closePath()
            ctx.fillStyle = cellColor(jr)
            ctx.fill()
          }
        }
      }

      // 계산 격자선 (xi = const, eta = const)
      ctx.strokeStyle = showJ ? 'rgba(255,255,255,0.25)' : 'rgba(34,211,238,0.6)'
      ctx.lineWidth = 1
      for (let i = 0; i <= n; i++) {
        ctx.beginPath()
        for (let j = 0; j <= n; j++) {
          const q = toPx(nodes[i][j])
          if (j === 0) ctx.moveTo(q.px, q.py)
          else ctx.lineTo(q.px, q.py)
        }
        ctx.stroke()
      }
      for (let j = 0; j <= n; j++) {
        ctx.beginPath()
        for (let i = 0; i <= n; i++) {
          const q = toPx(nodes[i][j])
          if (i === 0) ctx.moveTo(q.px, q.py)
          else ctx.lineTo(q.px, q.py)
        }
        ctx.stroke()
      }

      setStats({ minJ, maxJ, folded })

      if (animate) rafRef.current = requestAnimationFrame(draw)
    }

    if (animate) {
      t0 = performance.now()
      rafRef.current = requestAnimationFrame(draw)
    } else {
      draw(performance.now())
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [n, shear, amp, waveK, showJ, animate])

  const labelStyle: React.CSSProperties = { fontSize: 13, color: 'var(--text-muted)' }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)', margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={460}
        height={420}
        style={{ width: '100%', maxWidth: 460, height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }}
      />
      <div style={{ marginTop: 12 }}>
        <div style={rowStyle}>
          <span style={{ ...labelStyle, width: 120 }}>shear (η 기울임) {shear.toFixed(2)}</span>
          <input type="range" min={0} max={0.7} step={0.01} value={shear} onChange={(e) => setShear(+e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <span style={{ ...labelStyle, width: 120 }}>amplitude {amp.toFixed(2)}</span>
          <input type="range" min={0} max={0.35} step={0.01} value={amp} onChange={(e) => setAmp(+e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <span style={{ ...labelStyle, width: 120 }}>wave number {waveK}</span>
          <input type="range" min={1} max={5} step={1} value={waveK} onChange={(e) => setWaveK(+e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={rowStyle}>
          <span style={{ ...labelStyle, width: 120 }}>grid n = {n}</span>
          <input type="range" min={6} max={40} step={1} value={n} onChange={(e) => setN(+e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={{ ...rowStyle, flexWrap: 'wrap' }}>
          <button onClick={() => setShowJ((v) => !v)} style={btn(showJ)}>Jacobian heatmap</button>
          <button onClick={() => setAnimate((v) => !v)} style={btn(animate)}>{animate ? 'stop' : 'animate'}</button>
        </div>
        <div style={{ fontSize: 13, marginTop: 8, color: stats.folded > 0 ? '#ef4444' : 'var(--text-muted)' }}>
          J/J₀ min = {stats.minJ.toFixed(2)}, max = {stats.maxJ.toFixed(2)} ·{' '}
          {stats.folded > 0 ? `격자 접힘 ${stats.folded}개 셀 (J≤0)` : '접힘 없음 (J>0)'}
        </div>
      </div>
    </div>
  )
}

function btn(active: boolean): React.CSSProperties {
  return {
    padding: '5px 12px',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#08111f' : 'var(--text)',
    cursor: 'pointer',
  }
}
