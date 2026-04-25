'use client'

import { useEffect, useRef, useState } from 'react'

type Quat = [number, number, number, number] // w, x, y, z

function fromAxisAngle(ax: number, ay: number, az: number, theta: number): Quat {
  const n = Math.hypot(ax, ay, az) || 1
  const s = Math.sin(theta / 2)
  return [Math.cos(theta / 2), (ax / n) * s, (ay / n) * s, (az / n) * s]
}

function qmul(a: Quat, b: Quat): Quat {
  const [aw, ax, ay, az] = a
  const [bw, bx, by, bz] = b
  return [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
  ]
}

function rotate(q: Quat, v: [number, number, number]): [number, number, number] {
  const p: Quat = [0, v[0], v[1], v[2]]
  const qConj: Quat = [q[0], -q[1], -q[2], -q[3]]
  const r = qmul(qmul(q, p), qConj)
  return [r[1], r[2], r[3]]
}

const CUBE_VERTS: [number, number, number][] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
]
const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]
const FACE_COLORS: [number[], string][] = [
  [[0, 1, 2, 3], 'rgba(34,211,238,0.18)'],
  [[4, 5, 6, 7], 'rgba(245,158,11,0.18)'],
  [[0, 1, 5, 4], 'rgba(167,139,250,0.18)'],
  [[2, 3, 7, 6], 'rgba(239,68,68,0.18)'],
]

export function QuaternionRotationDemo() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [ax, setAx] = useState(0.4)
  const [ay, setAy] = useState(1)
  const [az, setAz] = useState(0.2)
  const [omega, setOmega] = useState(1.2)
  const tRef = useRef(0)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = performance.now()

    function draw(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      tRef.current += dt * omega
      const q = fromAxisAngle(ax, ay, az, tRef.current)
      const W = c!.width, H = c!.height
      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = 'rgba(8,17,31,0.95)'
      ctx!.fillRect(0, 0, W, H)

      const cx = W / 2, cy = H / 2, scale = Math.min(W, H) * 0.22
      const project = (v: [number, number, number]): [number, number, number] => {
        const r = rotate(q, v)
        const d = 4
        const f = scale * (d / (d - r[2]))
        return [cx + r[0] * f, cy - r[1] * f, r[2]]
      }

      const proj = CUBE_VERTS.map(project)

      const sortedFaces = [...FACE_COLORS]
        .map(([face, color]) => ({ face, color, z: face.reduce((s, i) => s + proj[i][2], 0) / 4 }))
        .sort((a, b) => a.z - b.z)
      for (const { face, color } of sortedFaces) {
        ctx!.beginPath()
        face.forEach((idx, i) => {
          const [px, py] = proj[idx]
          if (i === 0) ctx!.moveTo(px, py)
          else ctx!.lineTo(px, py)
        })
        ctx!.closePath()
        ctx!.fillStyle = color
        ctx!.fill()
      }

      ctx!.strokeStyle = '#22d3ee'
      ctx!.lineWidth = 1.5
      for (const [a, b] of CUBE_EDGES) {
        ctx!.beginPath(); ctx!.moveTo(proj[a][0], proj[a][1]); ctx!.lineTo(proj[b][0], proj[b][1]); ctx!.stroke()
      }

      const an = Math.hypot(ax, ay, az) || 1
      const axisEnd = project([(ax / an) * 2, (ay / an) * 2, (az / an) * 2])
      const axisStart = project([(-ax / an) * 2, (-ay / an) * 2, (-az / an) * 2])
      ctx!.strokeStyle = '#f59e0b'
      ctx!.lineWidth = 2
      ctx!.beginPath(); ctx!.moveTo(axisStart[0], axisStart[1]); ctx!.lineTo(axisEnd[0], axisEnd[1]); ctx!.stroke()

      ctx!.font = '11px ui-monospace, monospace'
      ctx!.fillStyle = '#94a3b8'
      ctx!.fillText(`q = (${q[0].toFixed(2)}, ${q[1].toFixed(2)}, ${q[2].toFixed(2)}, ${q[3].toFixed(2)})`, 10, H - 10)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [ax, ay, az, omega])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 12 }}>
        <label>axis x <input type="range" min={-1} max={1} step={0.05} value={ax} onChange={(e) => setAx(parseFloat(e.target.value))} /> {ax.toFixed(2)}</label>
        <label>axis y <input type="range" min={-1} max={1} step={0.05} value={ay} onChange={(e) => setAy(parseFloat(e.target.value))} /> {ay.toFixed(2)}</label>
        <label>axis z <input type="range" min={-1} max={1} step={0.05} value={az} onChange={(e) => setAz(parseFloat(e.target.value))} /> {az.toFixed(2)}</label>
        <label>ω <input type="range" min={0} max={4} step={0.1} value={omega} onChange={(e) => setOmega(parseFloat(e.target.value))} /> {omega.toFixed(1)}</label>
      </div>
      <canvas ref={ref} width={520} height={320} style={{ width: '100%', height: 'auto', borderRadius: 6, background: '#08111f' }} />
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        주황 화살표가 회전축. 사원수 q를 직접 곱해 매 프레임 큐브를 회전시킨다 — 짐벌락 없이 안정.
      </p>
    </div>
  )
}
