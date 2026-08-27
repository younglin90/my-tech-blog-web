'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Two degrees of freedom, one stiffness matrix, one question:
// does the residual field -K.phi come from a potential?
//
//   K = S + A      S = [[2s, -s], [-s, 2s]]   (diffusion, symmetric)
//                  A = a * [[0, 1], [-1, 0]]  (advection, skew)
//
// The grey ellipses are level curves of Pi = 0.5 phi^T S phi -- the energy
// functional you get to keep only while a = 0.  Release the ball and watch
// it cut across those curves once a > 0: the field is no longer a gradient.
//
// The loop probe integrates the field once around the unit circle.  Green's
// theorem says the answer is 2*pi*a exactly -- diffusion never enters it.
// Turn s up as far as it goes; the number does not move.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const PX = 20
const PY = 40
const PS = 336
const PCX = PX + PS / 2
const PCY = PY + PS / 2
const RANGE = 1.35
const SCALE = PS / 2 / RANGE

const RX = 396
const RW = 344

const COL_FIELD = 'rgba(56,189,248,0.55)'
const COL_BALL = '#fbbf24'
const COL_LOOP = '#f472b6'
const COL_CONT = 'rgba(148,163,184,0.32)'
const COL_SYM = '#4ade80'
const COL_SKEW = '#f472b6'

function matrix(s: number, a: number) {
  return [
    [2 * s, -s + a],
    [-s - a, 2 * s],
  ]
}

function apply(K: number[][], x: number, y: number) {
  return [K[0][0] * x + K[0][1] * y, K[1][0] * x + K[1][1] * y]
}

const toPx = (x: number) => PCX + x * SCALE
const toPy = (y: number) => PCY - y * SCALE

export function SkewGradientEnergyBasin() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [adv, setAdv] = useState(1.0)
  const [dif, setDif] = useState(1.0)
  const [running, setRunning] = useState(true)
  const [contours, setContours] = useState(true)
  const [probing, setProbing] = useState(true)
  const [stat, setStat] = useState({ loop: 0, turn: 0, crossed: 0 })

  const live = useRef({ adv, dif, running, contours, probing })
  live.current = { adv, dif, running, contours, probing }
  const push = useRef(setStat)
  push.current = setStat

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let bx = 0.95
    let by = 0.35
    let seed = 0
    const trail: number[][] = []
    let theta = 0
    let work = 0
    let lastWork = 0
    let uphill = 0
    let lastKey = ''

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const reseed = () => {
      seed += 1
      const ang = 0.6 + seed * 1.1
      bx = 1.05 * Math.cos(ang)
      by = 1.05 * Math.sin(ang)
      trail.length = 0
      uphill = 0
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { adv: a, dif: s, running: run, contours: showC, probing: probe } = live.current
      const K = matrix(s, a)

      const key = `${a}|${s}`
      if (key !== lastKey) {
        lastKey = key
        theta = 0
        work = 0
        reseed()
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- phase plane ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.28)'
      ctx.strokeRect(PX, PY, PS, PS)
      text('DOF space  (phi_1 right, phi_2 up)   field = -K.phi', PX, PY - 12, '#e2e8f0')

      if (showC) {
        // level curves of 0.5 phi^T S phi -- axes along (1,-1) and (1,1)
        for (let i = 1; i <= 6; i++) {
          const L = 0.09 * i * i * s
          ctx.strokeStyle = COL_CONT
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.ellipse(PCX, PCY, SCALE * Math.sqrt((2 * L) / (3 * s)), SCALE * Math.sqrt((2 * L) / s), Math.PI / 4, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }

      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(PX + 6, PCY)
      ctx.lineTo(PX + PS - 6, PCY)
      ctx.moveTo(PCX, PY + 6)
      ctx.lineTo(PCX, PY + PS - 6)
      ctx.stroke()
      ctx.setLineDash([])

      // vector field
      const N = 11
      ctx.lineWidth = 1.4
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const gx = -RANGE * 0.9 + (i / (N - 1)) * 1.8 * RANGE * 0.9
          const gy = -RANGE * 0.9 + (j / (N - 1)) * 1.8 * RANGE * 0.9
          const [rx, ry] = apply(K, gx, gy)
          const len = Math.hypot(rx, ry)
          if (len < 1e-6) continue
          const g = Math.min(1, len / (3.2 * s + 1.6 * a))
          const px = toPx(gx)
          const py = toPy(gy)
          const ux = (-rx / len) * (7 + 9 * g)
          const uy = (ry / len) * (7 + 9 * g)
          ctx.strokeStyle = COL_FIELD
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + ux, py + uy)
          ctx.stroke()
          ctx.fillStyle = COL_FIELD
          ctx.beginPath()
          ctx.arc(px + ux, py + uy, 1.9, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      // relaxing ball: d(phi)/dt = -K.phi
      if (run) {
        for (let k = 0; k < 3; k++) {
          const [rx, ry] = apply(K, bx, by)
          const dt = 0.006 / (1 + 0.15 * (s + a))
          const pOld = 0.5 * (2 * s * bx * bx - 2 * s * bx * by + 2 * s * by * by)
          bx -= rx * dt
          by -= ry * dt
          const pNew = 0.5 * (2 * s * bx * bx - 2 * s * bx * by + 2 * s * by * by)
          if (pNew > pOld + 1e-9) uphill += 1
        }
        trail.push([bx, by])
        if (trail.length > 420) trail.shift()
        if (Math.hypot(bx, by) < 0.05) reseed()
      }

      ctx.lineWidth = 1.8
      for (let i = 1; i < trail.length; i++) {
        ctx.strokeStyle = `rgba(251,191,36,${(0.1 + (0.75 * i) / trail.length).toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(toPx(trail[i - 1][0]), toPy(trail[i - 1][1]))
        ctx.lineTo(toPx(trail[i][0]), toPy(trail[i][1]))
        ctx.stroke()
      }
      ctx.fillStyle = COL_BALL
      ctx.beginPath()
      ctx.arc(toPx(bx), toPy(by), 5, 0, 2 * Math.PI)
      ctx.fill()

      // loop probe on the unit circle
      ctx.strokeStyle = 'rgba(244,114,182,0.35)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(PCX, PCY, SCALE, 0, 2 * Math.PI)
      ctx.stroke()
      if (probe) {
        const dth = 0.028
        for (let k = 0; k < 2; k++) {
          const cx = Math.cos(theta)
          const cy = Math.sin(theta)
          const [rx, ry] = apply(K, cx, cy)
          work += (-rx * -Math.sin(theta) + -ry * Math.cos(theta)) * dth
          theta += dth
          if (theta >= 2 * Math.PI) {
            lastWork = work
            theta = 0
            work = 0
          }
        }
        ctx.strokeStyle = COL_LOOP
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(PCX, PCY, SCALE, -0, -theta, true)
        ctx.stroke()
        ctx.fillStyle = COL_LOOP
        ctx.beginPath()
        ctx.arc(toPx(Math.cos(theta)), toPy(Math.sin(theta)), 4.5, 0, 2 * Math.PI)
        ctx.fill()
      }

      // ---------------- readout panel ----------------
      text('stiffness matrix  K = S + A', RX, PY - 12, '#e2e8f0')
      const cw = 92
      const ch = 40
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const x = RX + j * (cw + 8)
          const y = PY + i * (ch + 8)
          const off = i !== j
          ctx.strokeStyle = off ? 'rgba(244,114,182,0.7)' : 'rgba(74,222,128,0.55)'
          ctx.lineWidth = 1.4
          ctx.strokeRect(x, y, cw, ch)
          text(K[i][j].toFixed(2), x + 26, y + 25, off ? COL_SKEW : COL_SYM, '15px ui-monospace, monospace')
        }
      }
      text(`K12 - K21 = ${(K[0][1] - K[1][0]).toFixed(2)}  (= 2a)`, RX + 2 * cw + 22, PY + 25, a > 0.001 ? COL_SKEW : '#64748b')
      text(a > 0.001 ? 'not symmetric -> no Pi' : 'symmetric -> Pi exists', RX + 2 * cw + 22, PY + 71, a > 0.001 ? COL_SKEW : COL_SYM)

      const symN = Math.sqrt(2 * (4 * s) ** 2 + 2 * (2 * s) ** 2)
      const skewN = Math.sqrt(2 * (2 * a) ** 2)
      text(`||K - K^T|| / ||K + K^T||  = ${(skewN / symN).toFixed(3)}`, RX, PY + 118, '#cbd5e1')

      // loop-work bar
      text('work around one closed loop', RX, PY + 152, '#e2e8f0')
      const barY = PY + 162
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(RX, barY, RW, 26)
      const full = 2 * Math.PI * 2.0
      ctx.fillStyle = COL_LOOP
      ctx.fillRect(RX + 1, barY + 1, Math.max(0, Math.min(1, Math.abs(work) / full)) * (RW - 2), 24)
      text(`running  = ${work.toFixed(3)}`, RX, barY + 46, COL_LOOP, '12px ui-monospace, monospace')
      text(`last lap = ${lastWork.toFixed(3)}      2*pi*a = ${(2 * Math.PI * a).toFixed(3)}`, RX, barY + 66, '#e2e8f0', '12px ui-monospace, monospace')
      text(`ball climbed Pi on ${uphill} of the last steps`, RX, barY + 92, uphill > 0 ? COL_BALL : '#64748b')
      text('grey ellipses: level curves of', RX, barY + 122, '#94a3b8')
      text('Pi = 0.5 phi^T S phi  (symmetric part only)', RX, barY + 140, '#94a3b8')

      frame++
      if (frame % 12 === 0) push.current({ loop: lastWork, turn: theta, crossed: uphill })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 44 }
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
        <button style={btn(running)} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause ball' : '▶ release ball'}
        </button>
        <label style={label}>
          <span style={nameS}>advection a</span>
          <input type="range" min={0} max={2} step={0.05} value={adv} onChange={(e) => setAdv(parseFloat(e.target.value))} />
          <span style={mono}>{adv.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>diffusion s</span>
          <input type="range" min={0.4} max={2.5} step={0.05} value={dif} onChange={(e) => setDif(parseFloat(e.target.value))} />
          <span style={mono}>{dif.toFixed(2)}</span>
        </label>
        <button style={btn(contours)} onClick={() => setContours((p) => !p)}>
          contours
        </button>
        <button style={btn(probing)} onClick={() => setProbing((p) => !p)}>
          loop probe
        </button>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Set <em>advection a</em> to 0: the pink dot goes all the way around and brings back{' '}
        {adv < 0.001 ? stat.loop.toFixed(3) : '0.000'} — the field is a gradient, and the amber ball slides straight
        down the ellipses. Push a up and the last lap returns {(2 * Math.PI * adv).toFixed(3)}, exactly 2&pi;a. Now drag{' '}
        <em>diffusion s</em> across its whole range: the lap total does not budge. No amount of added diffusion buys
        back a potential.
      </div>
    </div>
  )
}
