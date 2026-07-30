'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Building the linelets themselves on a real boundary-layer mesh.
//
// Wall-normal spacing grows geometrically:  dy_j = dy_0 * g^j
// With a uniform wall-parallel spacing dx, the coupling ratio of cell (i,j) is
//
//   sigma_j = a_y / a_x = (dx / dy_j)^2
//
// A linelet is a maximal chain of cells, walking away from the wall, whose
// edges all satisfy sigma_j >= sigma_min. The chain stops at the first cell
// that has gone isotropic; everything above it falls back to point Jacobi.
//
// Two things the reader should get out of dragging the sliders:
//   1. the chains are short — they cover the boundary layer and nothing else,
//      which is exactly why linelet costs almost nothing;
//   2. renumbering along a chain turns that part of the matrix tridiagonal,
//      which is what makes a Thomas pass legal.
// ---------------------------------------------------------------------------

const NX = 18
const NY = 22

const MX = 26
const MY = 44
const MW = 336
const MH = 250

const SX = 404
const SY = 44
const SW = 234

export function LineletChainBuilder() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [logDy0, setLogDy0] = useState(-3.2) // first layer thickness, m
  const [growth, setGrowth] = useState(1.25)
  const [logSigma, setLogSigma] = useState(1.5) // strength threshold
  const [sweeping, setSweeping] = useState(true)
  const [showMatrix, setShowMatrix] = useState(true)

  const dy0Ref = useRef(logDy0)
  const gRef = useRef(growth)
  const sRef = useRef(logSigma)
  const swRef = useRef(sweeping)
  const mxRef = useRef(showMatrix)
  dy0Ref.current = logDy0
  gRef.current = growth
  sRef.current = logSigma
  swRef.current = sweeping
  mxRef.current = showMatrix

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const dy = new Float64Array(NY)
    const yEdge = new Float64Array(NY + 1)
    const sigma = new Float64Array(NY)

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (ts: number) => {
      const dyw = Math.pow(10, dy0Ref.current)
      const g = gRef.current
      const sMin = Math.pow(10, sRef.current)

      // ---------------------------------------------------------- the mesh
      yEdge[0] = 0
      for (let j = 0; j < NY; j++) {
        dy[j] = dyw * Math.pow(g, j)
        yEdge[j + 1] = yEdge[j] + dy[j]
      }
      const H = yEdge[NY]
      const dx = H / 6 // wall-parallel spacing, tied to the layer height

      let chainLen = 0
      for (let j = 0; j < NY; j++) {
        sigma[j] = (dx / dy[j]) * (dx / dy[j])
        if (sigma[j] >= sMin && chainLen === j) chainLen = j + 1
      }

      ctx.clearRect(0, 0, 660, 400)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, 660, 400)

      text('boundary-layer mesh, drawn to scale', MX, MY - 12, '#cbd5e1')
      text(`Δx = ${(dx * 1000).toFixed(2)} mm   (uniform along the wall)`, MX, MY - 26, '#94a3b8')

      const px = (i: number) => MX + (i / NX) * MW
      const py = (y: number) => MY + MH - (y / H) * MH

      // cells
      for (let j = 0; j < NY; j++) {
        const inChain = j < chainLen
        const y0 = py(yEdge[j + 1])
        const h = Math.max(1, py(yEdge[j]) - py(yEdge[j + 1]))
        for (let i = 0; i < NX; i++) {
          ctx.fillStyle = inChain
            ? `rgba(34,211,238,${(0.1 + 0.32 * (1 - j / Math.max(1, chainLen))).toFixed(3)})`
            : 'rgba(100,116,139,0.10)'
          ctx.fillRect(px(i), y0, MW / NX - 0.8, h - 0.8)
        }
      }

      // grid lines
      ctx.strokeStyle = 'rgba(148,163,184,0.22)'
      ctx.lineWidth = 0.6
      for (let i = 0; i <= NX; i++) {
        ctx.beginPath()
        ctx.moveTo(px(i), MY)
        ctx.lineTo(px(i), MY + MH)
        ctx.stroke()
      }
      for (let j = 0; j <= NY; j++) {
        const Y = py(yEdge[j])
        ctx.beginPath()
        ctx.moveTo(MX, Y)
        ctx.lineTo(MX + MW, Y)
        ctx.stroke()
      }

      // wall
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(MX, MY + MH)
      ctx.lineTo(MX + MW, MY + MH)
      ctx.stroke()
      text('wall', MX + 2, MY + MH + 15, '#e2e8f0')

      // the chains, with a Thomas sweep marching along them
      const phase = (ts * 0.0009) % 2
      const upward = phase < 1
      const frac = upward ? phase : 2 - phase
      for (let i = 0; i < NX; i++) {
        if (chainLen < 2) break
        const X = px(i) + MW / NX / 2
        ctx.strokeStyle = 'rgba(34,211,238,0.85)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(X, py(yEdge[0] + dy[0] / 2))
        ctx.lineTo(X, py(yEdge[chainLen - 1] + dy[chainLen - 1] / 2))
        ctx.stroke()
        for (let j = 0; j < chainLen; j++) {
          ctx.fillStyle = '#22d3ee'
          ctx.beginPath()
          ctx.arc(X, py(yEdge[j] + dy[j] / 2), 1.7, 0, Math.PI * 2)
          ctx.fill()
        }
        if (swRef.current) {
          const jf = frac * (chainLen - 1)
          const j0 = Math.min(chainLen - 1, Math.floor(jf))
          const Y = py(yEdge[j0] + dy[j0] / 2)
          ctx.fillStyle = upward ? '#fbbf24' : '#4ade80'
          ctx.beginPath()
          ctx.arc(X, Y, 3.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (chainLen >= 2) {
        text(
          swRef.current ? (upward ? 'forward elimination →' : '← back substitution') : 'sweep paused',
          MX + MW - 130,
          MY - 26,
          upward ? '#fbbf24' : '#4ade80'
        )
      } else {
        text('threshold too high — no chain survives', MX + MW - 210, MY - 26, '#f87171')
      }

      // ------------------------------------------------------- sigma profile
      text('σ_j = (Δx/Δy_j)²  per layer', SX, SY - 12, '#cbd5e1')
      const barH = MH / NY
      let sMax = 1
      for (let j = 0; j < NY; j++) sMax = Math.max(sMax, sigma[j])
      const lmax = Math.log10(sMax) + 0.4
      for (let j = 0; j < NY; j++) {
        const w = Math.max(2, (Math.max(0, Math.log10(Math.max(sigma[j], 1))) / lmax) * SW)
        const Y = SY + MH - (j + 1) * barH
        ctx.fillStyle = j < chainLen ? 'rgba(34,211,238,0.75)' : 'rgba(100,116,139,0.5)'
        ctx.fillRect(SX, Y, w, barH - 1.4)
      }
      // threshold line
      const tx = SX + (Math.max(0, Math.log10(sMin)) / lmax) * SW
      ctx.strokeStyle = '#f87171'
      ctx.lineWidth = 1.4
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(tx, SY)
      ctx.lineTo(tx, SY + MH)
      ctx.stroke()
      ctx.setLineDash([])
      text(`σ_min = ${sMin.toFixed(0)}`, Math.min(tx + 4, SX + SW - 76), SY + 12, '#f87171')
      text('log scale', SX + SW - 58, SY + MH + 14, '#94a3b8')
      text('wall', SX - 22, SY + MH - 2, '#94a3b8')

      // ---------------------------------------------------------- matrix view
      if (mxRef.current && chainLen >= 2) {
        const n = Math.min(chainLen, 11)
        const cell = 11
        const ox = SX + 6
        const oy = SY + MH + 34
        text(`renumbered along one linelet → tridiagonal (${n}×${n} shown)`, ox, oy - 8, '#cbd5e1')
        for (let a = 0; a < n; a++) {
          for (let b = 0; b < n; b++) {
            const band = Math.abs(a - b) <= 1
            ctx.fillStyle = band ? (a === b ? '#22d3ee' : 'rgba(34,211,238,0.55)') : 'rgba(100,116,139,0.14)'
            ctx.fillRect(ox + b * cell, oy + a * cell, cell - 2, cell - 2)
          }
        }
        text('a_y', ox + n * cell + 8, oy + 12, '#22d3ee')
        text('off-line a_x → Jacobi', ox + n * cell + 8, oy + 28, '#64748b')
      }

      // ------------------------------------------------------------- readouts
      const R0 = MY + MH + 40
      const LH = 15
      text(
        `Δy_wall = ${(dyw * 1e6).toFixed(0)} µm   growth = ${g.toFixed(2)}   layer height = ${(H * 1000).toFixed(1)} mm`,
        MX,
        R0,
        '#e2e8f0'
      )
      text(`max AR = Δx/Δy_wall = ${(dx / dyw).toFixed(0)}`, MX, R0 + LH, '#fbbf24')
      text(
        `linelets = ${chainLen >= 2 ? NX : 0}   ·  length = ${chainLen} cells  ·  coverage = ${((chainLen / NY) * 100).toFixed(0)} % of layers`,
        MX,
        R0 + 2 * LH,
        '#22d3ee'
      )
      const extra = chainLen >= 2 ? chainLen * NX * 3 : 0
      text(
        `extra storage ≈ ${extra} doubles (3 bands × ${chainLen} × ${NX})  vs ${NX * NY} unknowns`,
        MX,
        R0 + 3 * LH,
        '#94a3b8'
      )
    }

    let raf = 0
    const loop = (ts: number) => {
      draw(ts)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? '#22d3ee' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={660}
        height={400}
        style={{
          width: '100%',
          maxWidth: 660,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.8rem',
          alignItems: 'center',
          marginTop: '0.7rem',
          fontSize: 13,
          color: '#cbd5e1',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Δy_wall
          <input
            type="range"
            min={-4.5}
            max={-2}
            step={0.05}
            value={logDy0}
            onChange={(e) => setLogDy0(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 58 }}>
            {(Math.pow(10, logDy0) * 1e6).toFixed(0)} µm
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          growth
          <input
            type="range"
            min={1.05}
            max={1.5}
            step={0.01}
            value={growth}
            onChange={(e) => setGrowth(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }}>
            {growth.toFixed(2)}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          log₁₀ σ_min
          <input
            type="range"
            min={0.3}
            max={4}
            step={0.05}
            value={logSigma}
            onChange={(e) => setLogSigma(parseFloat(e.target.value))}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 46 }}>
            {Math.pow(10, logSigma).toFixed(0)}
          </span>
        </label>

        <button onClick={() => setSweeping((v) => !v)} style={btn(sweeping)}>
          {sweeping ? '❚❚ sweep' : '▶ sweep'}
        </button>
        <button onClick={() => setShowMatrix((v) => !v)} style={btn(showMatrix)}>
          {showMatrix ? '[x]' : '[ ]'} matrix
        </button>
      </div>

      <p
        style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: '0.5rem',
          fontFamily: 'ui-monospace, monospace',
          lineHeight: 1.55,
        }}
      >
        What to watch: shrink Δy_wall and the cyan chain grows downward into the layer while the bars on the right cross
        the red threshold. Raise the growth ratio and the chain gets shorter — the mesh goes isotropic sooner, so there is
        less for the linelet to own. Push σ_min past a few thousand and the chains disappear entirely: the preconditioner
        quietly degrades back to plain Jacobi, which is the failure mode nobody notices in the log file.
      </p>
    </div>
  )
}
