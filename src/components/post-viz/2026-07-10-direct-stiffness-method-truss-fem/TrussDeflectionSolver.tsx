'use client'

import { useEffect, useRef, useState } from 'react'

const W = 560
const H = 320

// Undeformed node coordinates in meters. Nodes 0,1 sit against the wall (x = 0).
const NODES: [number, number][] = [
  [0, 0], [0, 1],
  [1, 0], [1, 1],
  [2, 0], [2, 1],
  [3, 0], [3, 1],
]

// Truss members as pairs of node indices.
const MEMBERS: [number, number][] = [
  [0, 2], [2, 4], [4, 6], // bottom chord
  [1, 3], [3, 5], [5, 7], // top chord
  [2, 3], [4, 5], [6, 7], // verticals
  [1, 2], [3, 4], [5, 6], // diagonals
]

const FIXED = [0, 1] // fully pinned nodes at the wall
const LOAD_NODES = [6, 7] // free-end nodes that carry the applied load

// Solve A x = b with Gaussian elimination + partial pivoting (small dense system).
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    const tmp = M[col]; M[col] = M[piv]; M[piv] = tmp
    const d = M[col][col]
    if (Math.abs(d) < 1e-12) continue
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / d
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = 0; i < n; i++) x[i] = M[i][n] / (M[i][i] || 1)
  return x
}

type Result = { disp: number[]; forces: number[] }

// Assemble the global stiffness matrix, impose loads + supports, and solve K u = f.
function solveTruss(EA: number, P: number, angleRad: number): Result {
  const nDof = NODES.length * 2
  const K = Array.from({ length: nDof }, () => new Array(nDof).fill(0))
  const len: number[] = []
  const dir: [number, number][] = []
  MEMBERS.forEach(([a, b], m) => {
    const dx = NODES[b][0] - NODES[a][0]
    const dy = NODES[b][1] - NODES[a][1]
    const L = Math.hypot(dx, dy)
    len[m] = L
    const c = dx / L, s = dy / L
    dir[m] = [c, s]
    const k = EA / L
    // 4x4 global element stiffness for a 2D bar.
    const ke = [
      [c * c, c * s, -c * c, -c * s],
      [c * s, s * s, -c * s, -s * s],
      [-c * c, -c * s, c * c, c * s],
      [-c * s, -s * s, c * s, s * s],
    ]
    const map = [2 * a, 2 * a + 1, 2 * b, 2 * b + 1]
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) K[map[i]][map[j]] += k * ke[i][j]
  })

  // Load vector: split P over the free-end nodes; angle 0 points straight down.
  const F = new Array(nDof).fill(0)
  const fx = Math.sin(angleRad) * P
  const fy = -Math.cos(angleRad) * P
  for (const n of LOAD_NODES) { F[2 * n] += fx / 2; F[2 * n + 1] += fy / 2 }

  // Partition into free / fixed degrees of freedom, then solve the free block.
  const fixedDof = new Set<number>()
  FIXED.forEach((n) => { fixedDof.add(2 * n); fixedDof.add(2 * n + 1) })
  const freeDof: number[] = []
  for (let i = 0; i < nDof; i++) if (!fixedDof.has(i)) freeDof.push(i)
  const Kff = freeDof.map((ri) => freeDof.map((ci) => K[ri][ci]))
  const Ff = freeDof.map((ri) => F[ri])
  const uf = solveLinear(Kff, Ff)
  const disp = new Array(nDof).fill(0)
  freeDof.forEach((d, i) => { disp[d] = uf[i] })

  // Axial force per member: N = (EA/L) [-c, -s, c, s] . u
  const forces = MEMBERS.map(([a, b], m) => {
    const [c, s] = dir[m]
    return (EA / len[m]) * (-c * disp[2 * a] - s * disp[2 * a + 1] + c * disp[2 * b] + s * disp[2 * b + 1])
  })
  return { disp, forces }
}

export function TrussDeflectionSolver() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadKN, setLoadKN] = useState(24) // applied load in kN
  const [angleDeg, setAngleDeg] = useState(0) // 0 = straight down
  const [eaMN, setEaMN] = useState(8) // axial rigidity EA in MN
  const [animate, setAnimate] = useState(true)

  const stateRef = useRef({ loadKN, angleDeg, eaMN, animate })
  stateRef.current = { loadKN, angleDeg, eaMN, animate }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pad = 46
    const scale = Math.min((W - 2 * pad) / 3, (H - 2 * pad) / 1.5)
    const toPx = (x: number, y: number): [number, number] => [pad + x * scale, H - pad - y * scale]

    let raf = 0
    let t0: number | null = null

    const frame = (ts: number) => {
      if (t0 === null) t0 = ts
      const t = (ts - t0) / 1000
      const s = stateRef.current
      const pulse = s.animate ? 0.55 + 0.45 * Math.sin(t * 1.6) : 1
      const EA = s.eaMN * 1e6
      const P = s.loadKN * 1e3 * pulse
      const ang = (s.angleDeg * Math.PI) / 180
      const { disp, forces } = solveTruss(EA, P, ang)

      // Auto-amplify the deformation so it is visible.
      let maxD = 1e-9
      for (let n = 0; n < NODES.length; n++) maxD = Math.max(maxD, Math.hypot(disp[2 * n], disp[2 * n + 1]))
      const amp = Math.min(2000, 0.32 / maxD)
      const maxF = Math.max(1, ...forces.map((f) => Math.abs(f)))

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(8,17,31,0.6)'
      ctx.fillRect(0, 0, W, H)

      // Wall.
      const [wx, wy0] = toPx(0, -0.25)
      const [, wy1] = toPx(0, 1.25)
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(wx, wy0); ctx.lineTo(wx, wy1); ctx.stroke()

      // Undeformed members (faint).
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.lineWidth = 1
      MEMBERS.forEach(([a, b]) => {
        const [xa, ya] = toPx(NODES[a][0], NODES[a][1])
        const [xb, yb] = toPx(NODES[b][0], NODES[b][1])
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke()
      })

      // Deformed members, colored by axial force sign.
      MEMBERS.forEach(([a, b], m) => {
        const [xa, ya] = toPx(NODES[a][0] + disp[2 * a] * amp, NODES[a][1] + disp[2 * a + 1] * amp)
        const [xb, yb] = toPx(NODES[b][0] + disp[2 * b] * amp, NODES[b][1] + disp[2 * b + 1] * amp)
        const rel = Math.abs(forces[m]) / maxF
        const tension = forces[m] > 0
        ctx.strokeStyle = tension
          ? `rgba(248,113,113,${0.35 + 0.6 * rel})`
          : `rgba(56,189,248,${0.35 + 0.6 * rel})`
        ctx.lineWidth = 1.5 + 4 * rel
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke()
      })

      // Nodes.
      for (let n = 0; n < NODES.length; n++) {
        const [x, y] = toPx(NODES[n][0] + disp[2 * n] * amp, NODES[n][1] + disp[2 * n + 1] * amp)
        ctx.fillStyle = FIXED.includes(n) ? '#94a3b8' : '#22d3ee'
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
      }

      // Load arrow at the free end.
      const ln = LOAD_NODES[0]
      const [lx, ly] = toPx(NODES[ln][0] + disp[2 * ln] * amp, NODES[ln][1] + disp[2 * ln + 1] * amp)
      const ax = Math.sin(ang), ay = Math.cos(ang)
      const alen = 34 * pulse
      const ex = lx + ax * alen, ey = ly + ay * alen
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(ex, ey); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - ay * 6 - ax * 7, ey + ax * 6 - ay * 7)
      ctx.lineTo(ex + ay * 6 - ax * 7, ey - ax * 6 - ay * 7)
      ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill()

      // Readout.
      ctx.fillStyle = 'rgba(203,213,225,0.9)'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`max deflection: ${(maxD * 1000).toFixed(2)} mm  (shown ×${amp.toFixed(0)})`, 12, 20)
      ctx.fillText(`peak |N|: ${(maxF / 1000).toFixed(1)} kN`, 12, 38)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        <label style={lab}>Load P: {loadKN} kN
          <input type="range" min={0} max={40} value={loadKN} onChange={(e) => setLoadKN(+e.target.value)} style={sl} />
        </label>
        <label style={lab}>Angle: {angleDeg}&deg;
          <input type="range" min={-60} max={60} value={angleDeg} onChange={(e) => setAngleDeg(+e.target.value)} style={sl} />
        </label>
        <label style={lab}>EA: {eaMN} MN
          <input type="range" min={2} max={20} value={eaMN} onChange={(e) => setEaMN(+e.target.value)} style={sl} />
        </label>
        <label style={{ ...lab, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'end' }}>
          <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
          Pulse load
        </label>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: W, borderRadius: 8, display: 'block' }} />
      <p style={caption}>
        Red members are in tension, blue in compression; thickness scales with axial force. Raise <b>EA</b> and the
        same load bends the truss far less &mdash; stiffness is literally the matrix that maps load to displacement.
      </p>
    </div>
  )
}

const card: React.CSSProperties = {
  margin: '1.5rem 0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12,
  padding: 14, background: 'rgba(15,23,42,0.35)',
}
const lab: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', fontSize: 12, color: '#cbd5e1', gap: 4,
}
const sl: React.CSSProperties = { width: 130 }
const caption: React.CSSProperties = { fontSize: 12, color: 'rgba(148,163,184,0.85)', marginTop: 8 }

export default TrussDeflectionSolver
