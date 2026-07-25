'use client'

import { useEffect, useRef, useState } from 'react'

// Second-order IMEX TVD asymptotic-preserving scheme in the low Mach regime.
// Dimarco, Loubere, Michel-Dansac, Vignal (2017).
//
// Model problem (paper eq. 12): one linear advection equation carrying a SLOW
// explicit wave and a FAST implicit (acoustic) wave,
//
//   d_t w + c_e d_x w + (c_i / sqrt(eps)) d_x w = 0,   c_e = c_i = 1,
//
// with eps = Mach^2. Courant numbers: se = c_e dt/dx (explicit) and
// si = (c_i/sqrt(eps)) dt/dx (implicit). The time step is chosen from the SLOW
// wave only, so si -> infinity as eps -> 0 and the scheme must stay stable.
//
// The blended scheme (paper eq. 17) mixes the first-order AP scheme (theta = 0,
// monotone but diffusive) with the second-order AP scheme (theta = 1, accurate
// but oscillatory). theta_M = BETA/(1-BETA) = sqrt(2)-1 is the largest weight
// for which the scheme is provably TVD.

const N = 120
const DX = 1 / N
const BETA = 1 - Math.SQRT2 / 2 // 0.2928932...
const THETA_M = BETA / (1 - BETA) // sqrt(2) - 1 = 0.4142136...

const CW = 660 // canvas logical width  (css px)
const CH = 300 // canvas logical height (css px)
const YMAX = 1.6

function initialPulse(): Float64Array {
  const w = new Float64Array(N)
  for (let j = 0; j < N; j++) {
    const x = (j + 0.5) * DX
    w[j] = x > 0.25 && x <= 0.75 ? 1 : -1
  }
  return w
}

// Solve the periodic implicit upwind system (1+s) w_j - s w_{j-1} = r_j
// in closed form:  a = s/(1+s),  w_j = sum_k a^k r_{j-k} / ((1+s)(1 - a^N)).
function solveBackward(r: Float64Array, s: number): Float64Array {
  const out = new Float64Array(N)
  if (!(s > 0)) {
    out.set(r)
    return out
  }
  const a = s / (1 + s)
  const aN = Math.pow(a, N)
  let denom = (1 + s) * (1 - aN)
  if (!Number.isFinite(denom) || Math.abs(denom) < 1e-300) denom = 1e-300
  for (let j = 0; j < N; j++) {
    let acc = 0
    let ak = 1
    for (let k = 0; k < N; k++) {
      acc += ak * r[(j - k + N) % N]
      ak *= a
    }
    out[j] = acc / denom
  }
  return out
}

// backward difference  (d- v)_j = v_j - v_{j-1}  on the periodic grid
function dminus(v: Float64Array): Float64Array {
  const d = new Float64Array(N)
  for (let j = 0; j < N; j++) d[j] = v[j] - v[(j - 1 + N) % N]
  return d
}

// one step of the blended IMEX scheme, paper eq. (17)
function imexStep(w: Float64Array, se: number, si: number, theta: number): Float64Array {
  const dw = dminus(w)

  // (17a) predictor
  const rStar = new Float64Array(N)
  for (let j = 0; j < N; j++) rStar[j] = w[j] - BETA * se * dw[j]
  const star = solveBackward(rStar, BETA * si)
  const ds = dminus(star)

  // (17b) corrector
  const rhs = new Float64Array(N)
  for (let j = 0; j < N; j++) {
    rhs[j] =
      w[j] -
      theta * (BETA - 1) * se * dw[j] -
      theta * (1 - BETA) * si * ds[j] -
      theta * (2 - BETA) * se * ds[j] -
      (1 - theta) * se * dw[j]
  }
  return solveBackward(rhs, (1 - theta + theta * BETA) * si)
}

function totalVariation(w: Float64Array): number {
  let tv = 0
  for (let j = 0; j < N; j++) tv += Math.abs(w[(j + 1) % N] - w[j])
  return tv
}

type Readout = {
  step: number
  tv: number
  overshoot: number
  diverged: boolean
}

export function LowMachIMEXPulseLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const wRef = useRef<Float64Array>(initialPulse())
  const stepRef = useRef<number>(0)
  const tickRef = useRef<number>(0)
  const overshootRef = useRef<number>(0)
  const tvRef = useRef<number>(4)
  const divergedRef = useRef<boolean>(false)

  // default eps = 1e-2: s_i ~ 9, the regime where the theta = 1 oscillations are
  // clearly visible. Below ~1e-3 the implicit upwind solve is so diffusive that
  // it flattens the pulse in a couple of steps (a real property, not a bug).
  const [epsExp, setEpsExp] = useState<number>(-2) // eps = 10^epsExp
  const [theta, setTheta] = useState<number>(THETA_M)
  const [cfl, setCfl] = useState<number>(0.9)
  const [running, setRunning] = useState<boolean>(true)
  const [readout, setReadout] = useState<Readout>({ step: 0, tv: 4, overshoot: 0, diverged: false })

  const eps = Math.pow(10, epsExp)
  const acoustic = 1 / Math.sqrt(eps) // c_i / sqrt(eps)
  const dt = cfl * DX // c_e = 1  ->  dt = CFL dx / c_e
  const se = cfl
  const si = cfl * acoustic
  const dtExplicit = (cfl * DX) / (1 + acoustic)
  const cheaper = dt / dtExplicit // = 1 + 1/sqrt(eps)

  const thetaRef = useRef<number>(theta)
  const seRef = useRef<number>(se)
  const siRef = useRef<number>(si)
  const runRef = useRef<boolean>(running)
  thetaRef.current = theta
  seRef.current = se
  siRef.current = si
  runRef.current = running

  const reset = () => {
    wRef.current = initialPulse()
    stepRef.current = 0
    overshootRef.current = 0
    tvRef.current = 4
    divergedRef.current = false
  }

  // restart whenever the discretisation itself changes
  useEffect(() => {
    reset()
  }, [epsExp, cfl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = Math.round(CW * dpr)
    canvas.height = Math.round(CH * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const padL = 52
    const padR = 16
    const padT = 18
    const padB = 34
    const plotW = CW - padL - padR
    const plotH = CH - padT - padB
    const X = (x: number) => padL + x * plotW
    const Y = (v: number) => {
      const c = Math.max(-YMAX, Math.min(YMAX, v))
      return padT + ((YMAX - c) / (2 * YMAX)) * plotH
    }

    const render = () => {
      // ---- advance one scheme step every other frame (watchable pace) ----
      if (runRef.current && !divergedRef.current) {
        tickRef.current++
        if (tickRef.current % 2 === 0) {
          const next = imexStep(wRef.current, seRef.current, siRef.current, thetaRef.current)
          let bad = false
          let hi = -Infinity
          let lo = Infinity
          for (let j = 0; j < N; j++) {
            const v = next[j]
            if (!Number.isFinite(v) || Math.abs(v) > 1e6) bad = true
            if (v > hi) hi = v
            if (v < lo) lo = v
          }
          if (bad) {
            divergedRef.current = true
          } else {
            wRef.current = next
            stepRef.current++
            tvRef.current = totalVariation(next)
            const os = Math.max(hi - 1, -1 - lo, 0)
            if (os > overshootRef.current) overshootRef.current = os
          }
        }
      }
      const w = wRef.current

      // ---- background ----
      ctx.clearRect(0, 0, CW, CH)
      const bg = ctx.createLinearGradient(0, 0, 0, CH)
      bg.addColorStop(0, '#0b1524')
      bg.addColorStop(1, '#080f1c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, CW, CH)

      // ---- admissible band |w| <= 1 ----
      ctx.fillStyle = 'rgba(56,225,200,0.06)'
      ctx.fillRect(padL, Y(1), plotW, Y(-1) - Y(1))

      ctx.strokeStyle = 'rgba(56,225,200,0.45)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(padL, Y(1))
      ctx.lineTo(padL + plotW, Y(1))
      ctx.moveTo(padL, Y(-1))
      ctx.lineTo(padL + plotW, Y(-1))
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = 'rgba(255,255,255,0.10)'
      ctx.beginPath()
      ctx.moveTo(padL, Y(0))
      ctx.lineTo(padL + plotW, Y(0))
      ctx.stroke()

      // ---- shaded excursions outside the band ----
      ctx.fillStyle = 'rgba(248,113,113,0.38)'
      for (let j = 0; j < N; j++) {
        const v = w[j]
        if (Math.abs(v) > 1) {
          const s = v > 0 ? 1 : -1
          const x0 = X(j * DX)
          const y0 = Y(s)
          const y1 = Y(v)
          ctx.fillRect(x0, Math.min(y0, y1), plotW / N, Math.abs(y1 - y0) + 0.6)
        }
      }

      // ---- w(x) polyline, red where it leaves the band ----
      ctx.lineWidth = 2.2
      ctx.lineJoin = 'round'
      for (let j = 0; j < N - 1; j++) {
        const v0 = w[j]
        const v1 = w[j + 1]
        const out = Math.abs(v0) > 1 + 1e-12 || Math.abs(v1) > 1 + 1e-12
        ctx.strokeStyle = out ? '#f87171' : '#fbbf24'
        ctx.beginPath()
        ctx.moveTo(X((j + 0.5) * DX), Y(v0))
        ctx.lineTo(X((j + 1.5) * DX), Y(v1))
        ctx.stroke()
      }

      // ---- axes ----
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, padT)
      ctx.lineTo(padL, padT + plotH)
      ctx.lineTo(padL + plotW, padT + plotH)
      ctx.stroke()

      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.fillStyle = 'rgba(226,232,240,0.72)'
      ctx.textAlign = 'right'
      ctx.fillText('+1', padL - 7, Y(1) + 4)
      ctx.fillText('0', padL - 7, Y(0) + 4)
      ctx.fillText('-1', padL - 7, Y(-1) + 4)
      ctx.textAlign = 'center'
      for (const xt of [0, 0.25, 0.5, 0.75, 1]) {
        ctx.beginPath()
        ctx.moveTo(X(xt), padT + plotH)
        ctx.lineTo(X(xt), padT + plotH + 4)
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'
        ctx.stroke()
        ctx.fillText(xt.toFixed(2), X(xt), padT + plotH + 17)
      }
      ctx.fillStyle = 'rgba(226,232,240,0.9)'
      ctx.fillText('x  (periodic domain)', padL + plotW / 2, CH - 6)
      ctx.save()
      ctx.translate(14, padT + plotH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('w', 0, 0)
      ctx.restore()

      // ---- in-canvas status ----
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(56,225,200,0.85)'
      ctx.fillText('admissible band |w| <= 1', padL + 8, padT + 13)
      if (divergedRef.current) {
        ctx.fillStyle = '#f87171'
        ctx.textAlign = 'right'
        ctx.fillText('DIVERGED - lower the CFL', padL + plotW - 8, padT + 13)
      } else if (overshootRef.current > 1e-9) {
        ctx.fillStyle = '#f87171'
        ctx.textAlign = 'right'
        ctx.fillText('overshoot: TVD violated', padL + plotW - 8, padT + 13)
      } else if (tvRef.current < 0.5 && stepRef.current > 0) {
        ctx.fillStyle = 'rgba(226,232,240,0.7)'
        ctx.textAlign = 'right'
        ctx.fillText('implicit solve flattened the pulse — raise ε', padL + plotW - 8, padT + 13)
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // pull the refs into React state so the numeric readouts stay live
  useEffect(() => {
    const id = window.setInterval(() => {
      setReadout({
        step: stepRef.current,
        tv: tvRef.current,
        overshoot: overshootRef.current,
        diverged: divergedRef.current,
      })
    }, 120)
    return () => window.clearInterval(id)
  }, [])

  const presets: { label: string; value: number; accent: string }[] = [
    { label: '1st-order AP  (θ=0)', value: 0, accent: '#38e1c8' },
    { label: 'TVD-AP  (θ=√2−1)', value: THETA_M, accent: '#fbbf24' },
    { label: '2nd-order AP  (θ=1)', value: 1, accent: '#f87171' },
  ]
  const tvViolated = readout.tv > 4 + 1e-9

  return (
    <div style={shell}>
      <div style={caption}>
        Low-Mach IMEX pulse lab — blended scheme of Dimarco et al. (2017), eq. (17)
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: CW, height: 'auto', display: 'block', borderRadius: 8 }}
      />

      <div style={controlGrid}>
        <label style={lab}>
          <span>
            Mach² ε = <b style={{ color: '#fbbf24' }}>{eps.toExponential(2)}</b>
            <span style={faint}>
              {'  ·  acoustic speed c_i/√ε = '}
              {acoustic.toFixed(1)}
            </span>
          </span>
          <input
            type="range"
            min={-4}
            max={0}
            step={0.05}
            value={epsExp}
            onChange={(e) => setEpsExp(parseFloat(e.target.value))}
            style={slider}
          />
        </label>

        <label style={lab}>
          <span>
            uniform CFL = <b style={{ color: '#fbbf24' }}>{cfl.toFixed(2)}</b>
            <span style={faint}>{'  ·  Δt = CFL·Δx/c_e = ' + dt.toExponential(2)}</span>
          </span>
          <input
            type="range"
            min={0.2}
            max={1.4}
            step={0.05}
            value={cfl}
            onChange={(e) => setCfl(parseFloat(e.target.value))}
            style={slider}
          />
        </label>

        <label style={{ ...lab, gridColumn: '1 / -1' }}>
          <span>
            blend θ (weight on the 2nd-order scheme) ={' '}
            <b style={{ color: '#fbbf24' }}>{theta.toFixed(3)}</b>
            <span style={faint}>{'  ·  s_e = ' + se.toFixed(2) + ',  s_i = ' + si.toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={theta}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
            style={slider}
          />
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setTheta(p.value)}
              style={btn(Math.abs(theta - p.value) < 0.005, p.accent)}
            >
              {p.label}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={() => setRunning((r) => !r)} style={btn(false, '#8aa')}>
            {running ? '⏸ pause' : '▶ play'}
          </button>
          <button onClick={reset} style={btn(false, '#8aa')}>
            ↺ reset
          </button>
        </div>
      </div>

      <div style={readoutRow}>
        <div style={cell}>
          <div style={cellKey}>step</div>
          <div style={cellVal}>{readout.step}</div>
        </div>
        <div style={cell}>
          <div style={cellKey}>TV / 4.000</div>
          <div style={{ ...cellVal, color: tvViolated ? '#f87171' : '#34d399' }}>
            {readout.tv.toFixed(3)} / 4.000
          </div>
        </div>
        <div style={cell}>
          <div style={cellKey}>max overshoot</div>
          <div style={{ ...cellVal, color: readout.overshoot > 1e-9 ? '#f87171' : '#34d399' }}>
            {readout.overshoot.toExponential(2)}
          </div>
        </div>
        <div style={cell}>
          <div style={cellKey}>Δt / Δt_explicit</div>
          <div style={cellVal}>
            {cheaper.toFixed(1)} <span style={faint}>×{cheaper.toFixed(0)} cheaper</span>
          </div>
        </div>
      </div>

      <div style={hint}>
        Watch the θ=1 curve punch through the ±1 lines while TV climbs above 4 — that is the TVD
        violation. Snap to θ=√2−1 and the overshoot vanishes.
      </div>
    </div>
  )
}

const shell: React.CSSProperties = {
  border: '1px solid #1e2a3d',
  borderRadius: 12,
  padding: 16,
  background: '#0a1220',
  margin: '1.5rem 0',
  color: '#dbe4f0',
  fontFamily: 'system-ui, sans-serif',
}
const caption: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 0.3,
  color: '#9fb0c6',
  marginBottom: 10,
}
const controlGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
  marginTop: 14,
}
const lab: React.CSSProperties = {
  fontSize: 13,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const slider: React.CSSProperties = { width: '100%', accentColor: '#fbbf24' }
const faint: React.CSSProperties = { color: '#7a8599', fontSize: 12 }
const readoutRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 8,
  marginTop: 14,
}
const cell: React.CSSProperties = {
  background: '#0f1a2c',
  borderRadius: 6,
  padding: '8px 10px',
}
const cellKey: React.CSSProperties = { fontSize: 11, color: '#7a8599' }
const cellVal: React.CSSProperties = {
  fontSize: 14,
  fontVariantNumeric: 'tabular-nums',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}
const hint: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  lineHeight: 1.6,
  color: '#9fb0c6',
  borderLeft: '2px solid #fbbf24',
  paddingLeft: 10,
}
function btn(active: boolean, accent: string): React.CSSProperties {
  return {
    padding: '7px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? accent : '#26344a'}`,
    background: active ? 'rgba(251,191,36,0.10)' : '#101a2b',
    color: active ? accent : '#9fb0c6',
    cursor: 'pointer',
    fontSize: 12,
  }
}
