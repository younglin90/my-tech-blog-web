'use client'

import { useEffect, useRef, useState } from 'react'

const CS2 = 1 / 3
const NODES_3 = [-1, 0, 1]
const NODES_5 = [-2, -1, 0, 1, 2]
const W3 = [1 / 6, 2 / 3, 1 / 6]

/** D1Q3 equilibrium (the x-projection of the standard D2Q9 f^eq at u_y = 0) */
function projectedEq(u: number): number[] {
  return NODES_3.map((c, i) => {
    const cu = c * u
    return W3[i] * (1 + cu / CS2 + (cu * cu) / (2 * CS2 * CS2) - (u * u) / (2 * CS2))
  })
}

/** five populations matched to the Maxwell moments M0..M4 (Gaussian elimination) */
function fiveSpeedEq(u: number): number[] {
  const m = [
    1,
    u,
    u * u + CS2,
    u * u * u + 3 * CS2 * u,
    u ** 4 + 6 * CS2 * u * u + 3 * CS2 * CS2,
  ]
  const A: number[][] = []
  for (let j = 0; j < 5; j++) A.push(NODES_5.map((c) => c ** j).concat([m[j]]))
  for (let col = 0; col < 5; col++) {
    let piv = col
    for (let r = col + 1; r < 5; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r
    const t = A[col]
    A[col] = A[piv]
    A[piv] = t
    for (let r = 0; r < 5; r++) {
      if (r === col) continue
      const k = A[r][col] / A[col][col]
      for (let c = col; c <= 5; c++) A[r][c] -= k * A[col][c]
    }
  }
  return A.map((row, i) => row[5] / row[i])
}

function moment(f: number[], nodes: number[], p: number): number {
  let s = 0
  for (let i = 0; i < f.length; i++) s += f[i] * nodes[i] ** p
  return s
}

const maxwellM3 = (u: number) => u * u * u + 3 * CS2 * u

export function CubicMomentGapDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const uRef = useRef(0.18)
  const sweepRef = useRef(false)
  const fiveRef = useRef(false)
  const [u, setU] = useState(0.18)
  const [sweep, setSweep] = useState(false)
  const [five, setFive] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const BG = '#0d1117'
    const GRID = '#21262d'
    const TXT = '#c9d1d9'
    const MUTED = '#8b949e'
    const AMBER = '#fbbf24'
    const BLUE = '#5b9bd5'
    const RED = '#e06c4f'

    const BX = 34
    const BW = 232
    const BASE = 252
    const TOP = 52
    const PX = 316
    const PY = 46
    const PW = 224
    const PH = 210
    const UMAX = 0.35
    const MMAX = 0.45

    let raf = 0
    let frame = 0
    const t0 = performance.now()

    const sx = (uu: number) => PX + ((uu + UMAX) / (2 * UMAX)) * PW
    const sy = (mm: number) => PY + PH / 2 - (mm / MMAX) * (PH / 2)

    const draw = () => {
      if (sweepRef.current) {
        uRef.current = 0.3 * Math.sin(((performance.now() - t0) / 6000) * 2 * Math.PI)
      }
      const uu = uRef.current
      const nodes = fiveRef.current ? NODES_5 : NODES_3
      const f = fiveRef.current ? fiveSpeedEq(uu) : projectedEq(uu)
      const m3 = moment(f, nodes, 3)
      const tgt = maxwellM3(uu)

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'left'

      /* ---- left: populations ---- */
      ctx.fillStyle = TXT
      ctx.fillText(
        fiveRef.current ? 'f_i^eq   c ∈ {−2…2}  (5 speeds)' : 'f_i^eq   c ∈ {−1,0,1}  (D2Q9, x-projection)',
        BX - 6,
        22,
      )
      ctx.strokeStyle = GRID
      ctx.beginPath()
      ctx.moveTo(BX - 6, BASE)
      ctx.lineTo(BX + BW + 6, BASE)
      ctx.stroke()

      const slot = BW / 5
      const bw = slot * 0.52
      for (let k = 0; k < 5; k++) {
        const c = NODES_5[k]
        const idx = nodes.indexOf(c)
        const val = idx >= 0 ? f[idx] : 0
        const cx = BX + slot * (k + 0.5)
        const h = (val / 0.8) * (BASE - TOP)
        ctx.fillStyle = val < 0 ? RED : c === 0 ? '#3f5875' : AMBER
        ctx.fillRect(cx - bw / 2, h >= 0 ? BASE - h : BASE, bw, Math.max(1, Math.abs(h)))
        ctx.fillStyle = MUTED
        ctx.textAlign = 'center'
        ctx.fillText('c=' + c, cx, BASE + 16)
        ctx.fillStyle = val === 0 ? '#3d444d' : TXT
        ctx.fillText(val.toFixed(4), cx, (h >= 0 ? BASE - h : BASE + Math.abs(h)) - 6)
        ctx.textAlign = 'left'
      }
      ctx.fillStyle = MUTED
      ctx.fillText('bars = equilibrium populations, flow →  u = ' + uu.toFixed(3), BX - 6, BASE + 34)

      /* ---- right: third moment ---- */
      ctx.fillStyle = TXT
      ctx.fillText('third moment  Σ f c³   vs   Maxwell', PX - 6, 22)
      ctx.strokeStyle = GRID
      ctx.beginPath()
      ctx.moveTo(PX, sy(0))
      ctx.lineTo(PX + PW, sy(0))
      ctx.moveTo(sx(0), PY)
      ctx.lineTo(sx(0), PY + PH)
      ctx.stroke()

      /* shaded gap */
      ctx.fillStyle = 'rgba(224,108,79,0.22)'
      ctx.beginPath()
      ctx.moveTo(sx(-UMAX), sy(maxwellM3(-UMAX)))
      for (let i = 0; i <= 80; i++) {
        const q = -UMAX + (2 * UMAX * i) / 80
        ctx.lineTo(sx(q), sy(maxwellM3(q)))
      }
      for (let i = 80; i >= 0; i--) {
        const q = -UMAX + (2 * UMAX * i) / 80
        const lat = fiveRef.current ? maxwellM3(q) : q
        ctx.lineTo(sx(q), sy(lat))
      }
      ctx.fill()

      ctx.lineWidth = 1.8
      ctx.strokeStyle = AMBER
      ctx.beginPath()
      for (let i = 0; i <= 80; i++) {
        const q = -UMAX + (2 * UMAX * i) / 80
        const y = sy(maxwellM3(q))
        i === 0 ? ctx.moveTo(sx(q), y) : ctx.lineTo(sx(q), y)
      }
      ctx.stroke()
      ctx.strokeStyle = BLUE
      ctx.beginPath()
      for (let i = 0; i <= 80; i++) {
        const q = -UMAX + (2 * UMAX * i) / 80
        const y = sy(fiveRef.current ? maxwellM3(q) : q)
        i === 0 ? ctx.moveTo(sx(q), y) : ctx.lineTo(sx(q), y)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      ctx.setLineDash([3, 3])
      ctx.strokeStyle = '#4b5563'
      ctx.beginPath()
      ctx.moveTo(sx(uu), sy(m3))
      ctx.lineTo(sx(uu), sy(tgt))
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = AMBER
      ctx.beginPath()
      ctx.arc(sx(uu), sy(tgt), 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = BLUE
      ctx.beginPath()
      ctx.arc(sx(uu), sy(m3), 4, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = MUTED
      ctx.fillText('u', PX + PW - 8, sy(0) - 6)
      ctx.fillStyle = AMBER
      ctx.fillText('Maxwell  ρ(u³+3c_s²u)', PX, PY + PH + 16)
      ctx.fillStyle = BLUE
      ctx.fillText(fiveRef.current ? 'lattice  (matched)' : 'lattice  Σ f c³ = ρu', PX, PY + PH + 30)
      ctx.fillStyle = RED
      ctx.fillText('gap = ' + (tgt - m3).toFixed(5), PX, PY + PH + 44)

      frame++
      if (frame % 12 === 0 && sweepRef.current) setU(uRef.current)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nodes = five ? NODES_5 : NODES_3
  const f = five ? fiveSpeedEq(u) : projectedEq(u)
  const m3 = moment(f, nodes, 3)
  const gap = maxwellM3(u) - m3

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={560}
        height={310}
        style={{ width: '100%', borderRadius: 8, background: '#0d1117', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 210 }}>
          <span>
            velocity u : <b style={{ color: '#fbbf24' }}>{u.toFixed(3)}</b> (Ma ={' '}
            {(u / Math.sqrt(CS2)).toFixed(2)})
          </span>
          <input
            type="range"
            min={-0.3}
            max={0.3}
            step={0.005}
            value={u}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              uRef.current = v
              setU(v)
              sweepRef.current = false
              setSweep(false)
            }}
          />
        </label>
        <button
          onClick={() => {
            const n = !five
            fiveRef.current = n
            setFive(n)
          }}
          style={{
            padding: '0.35rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: five ? '#238636' : '#21262d',
            color: '#c9d1d9',
            cursor: 'pointer',
          }}
        >
          {five ? 'speeds ±2 ON' : 'speeds ±2 OFF'}
        </button>
        <button
          onClick={() => {
            const n = !sweep
            sweepRef.current = n
            setSweep(n)
          }}
          style={{
            padding: '0.35rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#c9d1d9',
            cursor: 'pointer',
          }}
        >
          {sweep ? 'pause sweep' : 'sweep u'}
        </button>
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          fontSize: 12.5,
          fontFamily: 'ui-monospace, monospace',
          color: '#8b949e',
        }}
      >
        Σ f c³ = <b style={{ color: '#5b9bd5' }}>{m3.toFixed(6)}</b> &nbsp;|&nbsp; Maxwell ={' '}
        <b style={{ color: '#fbbf24' }}>{maxwellM3(u).toFixed(6)}</b> &nbsp;|&nbsp; gap ={' '}
        <b style={{ color: '#e06c4f' }}>{gap.toFixed(6)}</b> &nbsp;|&nbsp; gap / u³ ={' '}
        <b style={{ color: '#e06c4f' }}>{Math.abs(u) < 1e-3 ? '—' : (gap / u ** 3).toFixed(4)}</b>
      </div>
    </div>
  )
}

export default CubicMomentGapDial
