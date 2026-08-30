'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// One shell patch, deformed as F = R(theta) * U.
//
//   U      = [[lam, gam], [gam, 1]]      the real stretch, set by the sliders
//   R      = plane rotation by theta     a rigid motion, no strain at all
//
//   eps    = sym(F - I)                  engineering / small strain
//   E      = (F^T F - I) / 2             Green-Lagrange
//
// Because F^T F = U^T R^T R U = U^T U, every component of E is blind to
// theta.  eps is not: spin the patch with the stretch frozen and the two
// gauges walk apart.  At theta = 30 deg with no stretch at all, eps_xx reads
// -0.134 on a body that was never strained.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

// element stage
const SX = 40
const SY = 30
const SW = 350
const SH = 340
const CX = SX + SW / 2
const CY = SY + SH / 2
const SCALE = 96

// gauge panel
const BX = 432
const BY = 58
const BW = 296
const BAR_H = 22
const BAR_GAP = 46

const COL_REF = 'rgba(148,163,184,0.55)'
const COL_DEF = '#38bdf8'
const COL_EPS = '#f87171'
const COL_GL = '#4ade80'
const COL_DIR = '#fbbf24'

type Mat2 = [number, number, number, number] // [xx, xy, yx, yy]

function rotation(theta: number): Mat2 {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return [c, -s, s, c]
}

function stretch(lam: number, gam: number): Mat2 {
  return [lam, gam, gam, 1]
}

function matmul(A: Mat2, B: Mat2): Mat2 {
  return [
    A[0] * B[0] + A[1] * B[2],
    A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2],
    A[2] * B[1] + A[3] * B[3],
  ]
}

/** eps = sym(F - I) */
function smallStrain(F: Mat2) {
  return { xx: F[0] - 1, yy: F[3] - 1, xy: (F[1] + F[2]) / 2 }
}

/** E = (F^T F - I) / 2 */
function greenLagrange(F: Mat2) {
  const c11 = F[0] * F[0] + F[2] * F[2]
  const c22 = F[1] * F[1] + F[3] * F[3]
  const c12 = F[0] * F[1] + F[2] * F[3]
  return { xx: (c11 - 1) / 2, yy: (c22 - 1) / 2, xy: c12 / 2 }
}

const NODES: Array<[number, number]> = [
  [-1, -0.6],
  [1, -0.6],
  [1, 0.6],
  [-1, 0.6],
]

export function RotationStrainGaugeDial() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [theta, setTheta] = useState(30)
  const [lam, setLam] = useState(1.0)
  const [gam, setGam] = useState(0)
  const [spin, setSpin] = useState(true)
  const [stat, setStat] = useState({ th: 30, exx: 0, Exx: 0, gap: 0 })

  const live = useRef({ theta, lam, gam, spin })
  live.current = { theta, lam, gam, spin }
  const push = useRef(setStat)
  push.current = setStat
  const spinAngle = useRef(30)
  const setThetaRef = useRef(setTheta)
  setThetaRef.current = setTheta

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { lam: L, gam: G, spin: sp } = live.current

      if (sp) {
        spinAngle.current = (spinAngle.current + 0.55) % 180
      } else {
        spinAngle.current = live.current.theta
      }
      const th = spinAngle.current
      const F = matmul(rotation((th * Math.PI) / 180), stretch(L, G))
      const eps = smallStrain(F)
      const E = greenLagrange(F)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- element stage ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(SX, SY, SW, SH)
      text('shell patch  (mid-surface)', SX + 10, SY + 18, '#e2e8f0')

      // axes
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'
      ctx.beginPath()
      ctx.moveTo(SX + 8, CY)
      ctx.lineTo(SX + SW - 8, CY)
      ctx.moveTo(CX, SY + 8)
      ctx.lineTo(CX, SY + SH - 8)
      ctx.stroke()
      text('x', SX + SW - 16, CY - 8, '#64748b', '10px ui-monospace, monospace')
      text('y', CX + 8, SY + 20, '#64748b', '10px ui-monospace, monospace')

      // reference element
      ctx.strokeStyle = COL_REF
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      NODES.forEach(([a, b], i) => {
        const x = CX + a * SCALE
        const y = CY - b * SCALE
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])

      // deformed element
      const map = (a: number, b: number) => [CX + (F[0] * a + F[1] * b) * SCALE, CY - (F[2] * a + F[3] * b) * SCALE]
      ctx.strokeStyle = COL_DEF
      ctx.fillStyle = 'rgba(56,189,248,0.12)'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      NODES.forEach(([a, b], i) => {
        const [x, y] = map(a, b)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = COL_DEF
      NODES.forEach(([a, b]) => {
        const [x, y] = map(a, b)
        ctx.beginPath()
        ctx.arc(x, y, 3.6, 0, 2 * Math.PI)
        ctx.fill()
      })

      // the director: the material fibre that started along x
      const [dx, dy] = map(1, 0)
      ctx.strokeStyle = COL_DIR
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.lineTo(dx, dy)
      ctx.stroke()
      ctx.fillStyle = COL_DIR
      ctx.beginPath()
      ctx.arc(dx, dy, 4, 0, 2 * Math.PI)
      ctx.fill()
      const fibre = Math.hypot(F[0], F[2])
      text(`fibre |F e_x| = ${fibre.toFixed(4)}`, SX + 10, SY + SH - 32, COL_DIR)
      text(`theta = ${th.toFixed(0)} deg`, SX + 10, SY + SH - 14, '#94a3b8')

      // ---------------- gauge panel ----------------
      text('strain gauges on the same patch', BX, SY + 18, '#e2e8f0')

      const rows: Array<[string, number, number]> = [
        ['xx', eps.xx, E.xx],
        ['yy', eps.yy, E.yy],
        ['xy', eps.xy, E.xy],
      ]
      const FULL = 0.6 // +-0.6 spans the bar
      const zero = BX + BW / 2

      rows.forEach(([lab, ev, Ev], j) => {
        const y = BY + j * (2 * BAR_GAP)
        text(`eps_${lab}`, BX, y - 4, '#94a3b8', '10px ui-monospace, monospace')
        text(`E_${lab}`, BX, y + BAR_H + 18, '#94a3b8', '10px ui-monospace, monospace')

        // track
        ctx.strokeStyle = 'rgba(148,163,184,0.18)'
        ctx.strokeRect(BX, y, BW, BAR_H)
        ctx.strokeRect(BX, y + BAR_H + 22, BW, BAR_H)
        ctx.strokeStyle = 'rgba(148,163,184,0.4)'
        ctx.beginPath()
        ctx.moveTo(zero, y - 2)
        ctx.lineTo(zero, y + 2 * BAR_H + 24)
        ctx.stroke()

        const bar = (v: number, top: number, col: string) => {
          const w = Math.max(-BW / 2, Math.min(BW / 2, (v / FULL) * (BW / 2)))
          ctx.fillStyle = col
          ctx.fillRect(Math.min(zero, zero + w), top + 3, Math.abs(w), BAR_H - 6)
        }
        bar(ev, y, COL_EPS)
        bar(Ev, y + BAR_H + 22, COL_GL)

        text(ev.toFixed(4), BX + BW + 6, y + 15, COL_EPS, '11px ui-monospace, monospace')
        text(Ev.toFixed(4), BX + BW + 6, y + BAR_H + 37, COL_GL, '11px ui-monospace, monospace')
      })

      text('eps = sym(F - I)', BX, BY + 3 * 2 * BAR_GAP + 4, COL_EPS)
      text('E   = (F^T F - I)/2', BX, BY + 3 * 2 * BAR_GAP + 22, COL_GL)

      // verdict
      const gap = Math.abs(eps.xx - E.xx)
      const spurious = Math.abs(eps.xx - (L - 1)) > 1e-4
      text(
        spurious ? `eps_xx drifted ${(100 * Math.abs(eps.xx - (L - 1))).toFixed(1)} % from the true stretch` : 'eps_xx still matches the true stretch',
        BX,
        BY + 3 * 2 * BAR_GAP + 48,
        spurious ? COL_EPS : COL_GL,
        '12px ui-monospace, monospace',
      )
      text('E is a function of F^T F only : theta cannot reach it', BX, BY + 3 * 2 * BAR_GAP + 68, '#64748b', '10px ui-monospace, monospace')

      frame++
      if (frame % 12 === 0) {
        push.current({ th, exx: eps.xx, Exx: E.xx, gap })
        if (live.current.spin) setThetaRef.current(Math.round(th))
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 48 }
  const btn = (on: boolean): CSSProperties => ({
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: on ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn(spin)} onClick={() => setSpin((p) => !p)}>
          {spin ? '❙❙ hold theta' : '▶ spin the patch'}
        </button>
        <label style={label}>
          <span style={nameS}>theta</span>
          <input
            type="range"
            min={0}
            max={179}
            step={1}
            value={theta}
            onChange={(e) => {
              setSpin(false)
              setTheta(parseFloat(e.target.value))
            }}
          />
          <span style={mono}>{theta.toFixed(0)}&deg;</span>
        </label>
        <label style={label}>
          <span style={nameS}>lam</span>
          <input type="range" min={0.8} max={1.35} step={0.01} value={lam} onChange={(e) => setLam(parseFloat(e.target.value))} />
          <span style={mono}>{lam.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>gam</span>
          <input type="range" min={0} max={0.4} step={0.01} value={gam} onChange={(e) => setGam(parseFloat(e.target.value))} />
          <span style={mono}>{gam.toFixed(2)}</span>
        </label>
      </div>
      <div style={rowS}>
        <button
          style={btn(lam === 1 && gam === 0)}
          onClick={() => {
            setLam(1)
            setGam(0)
          }}
        >
          rigid rotation only
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            setSpin(false)
            setTheta(30)
            setLam(1)
            setGam(0)
          }}
        >
          ↺ theta = 30&deg;, no stretch
        </button>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Press <em>rigid rotation only</em> and let it spin: the patch never changes shape, yet the red eps bars swing all
        the way across while the green E bars stay pinned at zero. At theta = {stat.th.toFixed(0)}&deg; the small-strain
        gauge reads {stat.exx.toFixed(4)} against {stat.Exx.toFixed(4)} — a gap of {stat.gap.toFixed(4)} invented by the
        rotation alone. Now add <em>lam</em> and <em>gam</em>: E moves, and it keeps the same value at every theta.
      </div>
    </div>
  )
}
