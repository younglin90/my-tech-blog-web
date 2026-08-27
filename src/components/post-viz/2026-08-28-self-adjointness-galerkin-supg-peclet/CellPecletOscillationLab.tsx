'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Steady 1D advection-diffusion on 10 linear elements, marched in time with
// Crank-Nicolson (unconditionally stable) so the wiggle grows in front of you
// instead of appearing fully formed.
//
//   u dphi/dx = eps_eff d2phi/dx2 ,  phi(0)=0 , phi(1)=1
//   eps_eff = eps + beta * u * h / 2
//
// beta = 0    Galerkin, no stabilisation
// beta = 1    full upwind
// beta = opt  SUPG,  coth(Pe_h) - 1/Pe_h   -> nodally exact
//
// The three stencil bars are the assembled row: a_W, a_P, a_E.  The moment
// a_E turns positive the M-matrix property is gone and the profile rings.
// ---------------------------------------------------------------------------

const W = 760
const H = 430

const N = 10
const HH = 1 / N
const VEL = 1

const GX = 56
const GY = 34
const GW = 470
const GH = 300
const YMIN = -0.9
const YMAX = 1.25

const RX = 552

const COL_EX = 'rgba(148,163,184,0.85)'
const COL_NUM = '#fbbf24'
const COL_BAD = '#f87171'
const COL_OK = '#4ade80'
const COL_W_BAR = '#38bdf8'

const px = (x: number) => GX + x * GW
const py = (v: number) => GY + GH - ((v - YMIN) / (YMAX - YMIN)) * GH

function exactPhi(x: number, pe: number) {
  // stable for large Pe: divide through by exp(pe)
  return (Math.exp(pe * (x - 1)) - Math.exp(-pe)) / (1 - Math.exp(-pe))
}

function thomas(a: number[], b: number[], c: number[], d: number[]) {
  const n = d.length
  const cp = new Array<number>(n)
  const dp = new Array<number>(n)
  cp[0] = c[0] / b[0]
  dp[0] = d[0] / b[0]
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1]
    cp[i] = c[i] / m
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m
  }
  const x = new Array<number>(n)
  x[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]
  return x
}

function stencil(epsEff: number) {
  return {
    aW: -(epsEff / HH + VEL / 2),
    aP: (2 * epsEff) / HH,
    aE: -(epsEff / HH) + VEL / 2,
  }
}

export function CellPecletOscillationLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [peH, setPeH] = useState(2.0)
  const [beta, setBeta] = useState(0)
  const [running, setRunning] = useState(true)
  const [stat, setStat] = useState({ t: 0, err: 0, min: 0, res: 0 })

  const live = useRef({ peH, beta, running })
  live.current = { peH, beta, running }
  const push = useRef(setStat)
  push.current = setStat
  const resetRef = useRef(0)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let t = 0
    let phi = new Array<number>(N + 1).fill(0)
    phi[N] = 1
    let lastKey = ''
    let lastReset = -1

    const text = (s: string, x: number, y: number, c: string, f = '11px ui-monospace, monospace') => {
      ctx.fillStyle = c
      ctx.font = f
      ctx.fillText(s, x, y)
    }

    const reset = () => {
      phi = new Array<number>(N + 1).fill(0)
      phi[N] = 1
      t = 0
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const { peH: p, beta: b, running: run } = live.current
      const eps = (VEL * HH) / (2 * p)
      const epsEff = eps + (b * VEL * HH) / 2
      const st = stencil(epsEff)
      const pe = VEL / eps

      const key = `${p}|${b}`
      if (key !== lastKey || lastReset !== resetRef.current) {
        lastKey = key
        lastReset = resetRef.current
        reset()
      }

      // ---- Crank-Nicolson step on the lumped-mass system ----
      if (run) {
        const dt = 0.012
        for (let sweep = 0; sweep < 2; sweep++) {
          const m = HH / dt
          const a: number[] = []
          const bd: number[] = []
          const c: number[] = []
          const d: number[] = []
          for (let i = 1; i < N; i++) {
            a.push(st.aW / 2)
            bd.push(m + st.aP / 2)
            c.push(st.aE / 2)
            const rhs =
              m * phi[i] - (st.aW / 2) * phi[i - 1] - (st.aP / 2) * phi[i] - (st.aE / 2) * phi[i + 1]
            d.push(rhs)
          }
          d[0] -= (st.aW / 2) * phi[0]
          d[N - 2] -= (st.aE / 2) * phi[N]
          const sol = thomas(a, bd, c, d)
          for (let i = 1; i < N; i++) phi[i] = sol[i - 1]
          t += dt
        }
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---------------- profile plot ----------------
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(GX, GY, GW, GH)
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(GX, py(0))
      ctx.lineTo(GX + GW, py(0))
      ctx.moveTo(GX, py(1))
      ctx.lineTo(GX + GW, py(1))
      ctx.stroke()
      ctx.setLineDash([])
      text('1.0', GX - 30, py(1) + 4, '#64748b', '10px ui-monospace, monospace')
      text('0.0', GX - 30, py(0) + 4, '#64748b', '10px ui-monospace, monospace')
      text('-0.5', GX - 34, py(-0.5) + 4, '#64748b', '10px ui-monospace, monospace')
      text('phi', GX - 34, GY - 10, '#94a3b8')
      text('x', GX + GW - 8, GY + GH + 18, '#94a3b8')

      // element boundaries
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let i = 0; i <= N; i++) {
        ctx.beginPath()
        ctx.moveTo(px(i * HH), GY)
        ctx.lineTo(px(i * HH), GY + GH)
        ctx.stroke()
      }

      // exact solution
      ctx.strokeStyle = COL_EX
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k <= 300; k++) {
        const x = k / 300
        const v = exactPhi(x, pe)
        if (k === 0) ctx.moveTo(px(x), py(v))
        else ctx.lineTo(px(x), py(v))
      }
      ctx.stroke()

      // numerical nodal solution
      const rings = phi.some((v, i) => i > 0 && i < N && (v < -1e-6 || v > 1 + 1e-6))
      const col = rings ? COL_BAD : COL_NUM
      ctx.strokeStyle = col
      ctx.lineWidth = 2.4
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const x = i * HH
        if (i === 0) ctx.moveTo(px(x), py(phi[i]))
        else ctx.lineTo(px(x), py(phi[i]))
      }
      ctx.stroke()
      ctx.fillStyle = col
      for (let i = 0; i <= N; i++) {
        ctx.beginPath()
        ctx.arc(px(i * HH), py(phi[i]), 3.6, 0, 2 * Math.PI)
        ctx.fill()
      }

      let err = 0
      let mn = 1
      for (let i = 0; i <= N; i++) {
        err = Math.max(err, Math.abs(phi[i] - exactPhi(i * HH, pe)))
        mn = Math.min(mn, phi[i])
      }
      let res = 0
      for (let i = 1; i < N; i++) res = Math.max(res, Math.abs(st.aW * phi[i - 1] + st.aP * phi[i] + st.aE * phi[i + 1]))

      text(`exact  (Pe = u L / eps = ${pe.toFixed(0)})`, GX + 12, GY + 18, COL_EX)
      text(`FEM nodes  ${rings ? '-- outside [0,1]' : ''}`, GX + 12, GY + 34, col)
      text(`t = ${t.toFixed(2)}    steady residual = ${res.toExponential(1)}`, GX + 12, GY + GH - 12, '#64748b', '10px ui-monospace, monospace')

      // ---------------- stencil panel ----------------
      text('assembled row', RX, GY + 4, '#e2e8f0')
      const bars: Array<[string, number, string]> = [
        ['a_W', st.aW, COL_W_BAR],
        ['a_P', st.aP, '#cbd5e1'],
        ['a_E', st.aE, st.aE > 0 ? COL_BAD : COL_OK],
      ]
      const scale = 46 / Math.max(1e-9, st.aP)
      bars.forEach(([lab, v, c], j) => {
        const y = GY + 24 + j * 44
        text(lab, RX, y + 14, '#94a3b8', '11px ui-monospace, monospace')
        const zero = RX + 78
        ctx.strokeStyle = 'rgba(148,163,184,0.3)'
        ctx.beginPath()
        ctx.moveTo(zero, y - 4)
        ctx.lineTo(zero, y + 22)
        ctx.stroke()
        ctx.fillStyle = c
        const wpx = v * scale
        ctx.fillRect(Math.min(zero, zero + wpx), y + 2, Math.abs(wpx), 14)
        text(v.toFixed(2), RX + 32, y + 14, c, '11px ui-monospace, monospace')
      })

      text(st.aE > 0 ? 'a_E > 0 : M-matrix broken' : 'a_E <= 0 : M-matrix holds', RX, GY + 172, st.aE > 0 ? COL_BAD : COL_OK)

      const peEff = (VEL * HH) / (2 * epsEff)
      text(`Pe_h        = ${p.toFixed(2)}`, RX, GY + 202, '#cbd5e1')
      text(`beta        = ${b.toFixed(2)}`, RX, GY + 220, '#cbd5e1')
      text(`Pe_h,eff    = ${peEff.toFixed(2)}`, RX, GY + 238, peEff > 1 ? COL_BAD : COL_OK)
      text(`eps_eff/eps = ${(epsEff / eps).toFixed(2)}`, RX, GY + 256, '#cbd5e1')
      text(`max |err|   = ${(100 * err).toFixed(2)} %`, RX, GY + 282, COL_NUM, '12px ui-monospace, monospace')
      text(`min phi     = ${mn.toFixed(4)}`, RX, GY + 300, mn < -1e-6 ? COL_BAD : '#e2e8f0', '12px ui-monospace, monospace')

      // skew part is untouched by beta
      text(`skew part of K: u/2 = ${(VEL / 2).toFixed(2)}`, RX, GY + 330, '#f472b6')
      text('unchanged by beta', RX, GY + 346, '#f472b6')

      frame++
      if (frame % 12 === 0) push.current({ t, err: 100 * err, min: mn, res })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const betaOpt = 1 / Math.tanh(peH) - 1 / peH

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
          {running ? '❙❙ pause' : '▶ march'}
        </button>
        <button
          style={btn(false)}
          onClick={() => {
            resetRef.current += 1
          }}
        >
          ↺ restart from 0
        </button>
        <label style={label}>
          <span style={nameS}>Pe_h</span>
          <input type="range" min={0.2} max={8} step={0.1} value={peH} onChange={(e) => setPeH(parseFloat(e.target.value))} />
          <span style={mono}>{peH.toFixed(1)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>beta</span>
          <input type="range" min={0} max={1.2} step={0.02} value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} />
          <span style={mono}>{beta.toFixed(2)}</span>
        </label>
      </div>
      <div style={rowS}>
        <button style={btn(beta === 0)} onClick={() => setBeta(0)}>
          Galerkin (beta = 0)
        </button>
        <button style={btn(Math.abs(beta - 1) < 0.01)} onClick={() => setBeta(1)}>
          upwind (beta = 1)
        </button>
        <button style={btn(Math.abs(beta - betaOpt) < 0.011)} onClick={() => setBeta(Math.round(betaOpt * 50) / 50)}>
          SUPG (beta = {betaOpt.toFixed(2)})
        </button>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Leave beta at 0 and drag <em>Pe_h</em> past 1: a_E flips sign, and the marching profile starts ringing — at Pe_h
        = 2 the node next to the outlet dives to {stat.min.toFixed(3)} with the boundary values still pinned at 0 and 1.
        Hit <em>SUPG</em> and the error goes to {stat.err.toFixed(2)} %. The pink line at bottom right is the skew part
        of the matrix: none of the three buttons moves it.
      </div>
    </div>
  )
}
