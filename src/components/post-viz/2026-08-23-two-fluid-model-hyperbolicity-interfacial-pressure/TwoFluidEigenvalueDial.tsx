'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The two slow (material) waves of the 6-equation single-pressure two-fluid
// model, in the incompressible limit:
//
//   lambda± = (al*rg*ug + a*rl*ul)/(al*rg + a*rl)
//             ± sqrt((sigma - 1) * a*al*rg*rl) * |ul - ug| / (al*rg + a*rl)
//
// sigma is the coefficient of the Stuhmiller interfacial-pressure correction
// dp = sigma * a*al*rg*rl*ur^2 / (a*rl + al*rg).  For sigma < 1 the radicand
// is negative: the pair leaves the real axis and the initial-value problem is
// ill-posed.  For sigma > 1 the pair splits along the real axis into two
// counter-propagating void waves.  Left panel = the eigenvalue locus, right
// panel = what a void-fraction perturbation does in each case.
// ---------------------------------------------------------------------------

const W = 726
const H = 452

const LX0 = 62
const LX1 = 336
const LY0 = 40
const LY1 = 300

const RX0 = 386
const RX1 = 706
const RY0 = 40
const RY1 = 300

const RHO_G = 1.2
const RHO_L = 1000

const K_VIS = 2 * Math.PI * 6 // 6 wavelengths across the 1 m window
const TIME_SCALE = 0.05 // 20x slow motion

type Pair = { re1: number; re2: number; im: number; mean: number; spread: number }

function materialPair(a: number, sigma: number, ur: number): Pair {
  const al = 1 - a
  const den = al * RHO_G + a * RHO_L
  const mean = (al * RHO_G * ur) / den // u_g = ur, u_l = 0
  const scale = (Math.sqrt(a * al * RHO_G * RHO_L) * ur) / den
  const disc = (sigma - 1) * scale * scale
  if (disc >= 0) {
    const s = Math.sqrt(disc)
    return { re1: mean - s, re2: mean + s, im: 0, mean, spread: scale }
  }
  return { re1: mean, re2: mean, im: Math.sqrt(-disc), mean, spread: scale }
}

export function TwoFluidEigenvalueDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [sigma, setSigma] = useState(0)
  const [ur, setUr] = useState(10)
  const [alpha, setAlpha] = useState(0.5)
  const [running, setRunning] = useState(true)
  const [amp, setAmp] = useState(1)

  const live = useRef({ sigma, ur, alpha, running })
  live.current = { sigma, ur, alpha, running }
  const setAmpRef = useRef(setAmp)
  setAmpRef.current = setAmp

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let tSim = 0
    let frame = 0

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const L = live.current
      const P = materialPair(L.alpha, L.sigma, L.ur)

      if (L.running) tSim += dt * TIME_SCALE
      let envelope = Math.exp(P.im * K_VIS * tSim)
      if (envelope > 9) {
        tSim = 0
        envelope = 1
      }

      frame++
      if (frame % 12 === 0) setAmpRef.current(Math.min(envelope, 9))

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // =====================================================================
      // LEFT: complex plane of the material-wave pair
      // =====================================================================
      const R = Math.max(0.05, 1.35 * P.spread)
      const cx = (v: number) => LX0 + ((v - P.mean + R) / (2 * R)) * (LX1 - LX0)
      const cy = (v: number) => (LY0 + LY1) / 2 - (v / R) * ((LY1 - LY0) / 2)

      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(LX0, LY0, LX1 - LX0, LY1 - LY0)

      // axes through the mean
      ctx.strokeStyle = 'rgba(226,232,240,0.28)'
      ctx.beginPath()
      ctx.moveTo(LX0, cy(0))
      ctx.lineTo(LX1, cy(0))
      ctx.moveTo(cx(P.mean), LY0)
      ctx.lineTo(cx(P.mean), LY1)
      ctx.stroke()
      text('Im λ', LX0 + 6, LY0 + 14, '#64748b', '10px ui-monospace, monospace')
      text('Re λ  (m/s)', LX1 - 84, cy(0) + 16, '#64748b', '10px ui-monospace, monospace')
      text((P.mean - R).toFixed(2), LX0 + 2, LY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text((P.mean + R).toFixed(2), LX1 - 30, LY1 + 16, '#64748b', '10px ui-monospace, monospace')
      text('+' + R.toFixed(2), LX0 - 44, LY0 + 10, '#64748b', '10px ui-monospace, monospace')
      text('-' + R.toFixed(2), LX0 - 44, LY1 - 2, '#64748b', '10px ui-monospace, monospace')

      // locus swept by sigma from 0 to 2 -> a cross centred on the mean
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(cx(P.mean), cy(-P.spread))
      ctx.lineTo(cx(P.mean), cy(P.spread))
      ctx.moveTo(cx(P.mean - P.spread), cy(0))
      ctx.lineTo(cx(P.mean + P.spread), cy(0))
      ctx.stroke()
      ctx.setLineDash([])
      text('σ = 0', cx(P.mean) + 8, cy(P.spread) + 4, '#64748b', '10px ui-monospace, monospace')
      text('σ = 2', cx(P.mean + P.spread) - 34, cy(0) - 8, '#64748b', '10px ui-monospace, monospace')
      text('σ = 1', cx(P.mean) + 8, cy(0) - 8, '#94a3b8', '10px ui-monospace, monospace')

      // the two eigenvalues
      const illPosed = P.im > 1e-12
      const dotCol = illPosed ? '#f87171' : '#34d399'
      const pts: [number, number][] = illPosed
        ? [
            [P.mean, P.im],
            [P.mean, -P.im],
          ]
        : [
            [P.re1, 0],
            [P.re2, 0],
          ]
      for (const [re, im] of pts) {
        ctx.fillStyle = dotCol
        ctx.beginPath()
        ctx.arc(cx(re), cy(im), 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.strokeStyle = 'rgba(11,18,32,0.9)'
        ctx.stroke()
      }

      text('MATERIAL WAVE PAIR', LX0, 26, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      text('acoustic pair sits at ±3.4e2 m/s, off scale', LX0, LY1 + 34, '#64748b', '10px ui-monospace, monospace')

      // =====================================================================
      // RIGHT: what a void-fraction perturbation does
      // =====================================================================
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.strokeRect(RX0, RY0, RX1 - RX0, RY1 - RY0)
      const midY = (RY0 + RY1) / 2
      const halfH = (RY1 - RY0) / 2 - 12
      ctx.strokeStyle = 'rgba(226,232,240,0.2)'
      ctx.beginPath()
      ctx.moveTo(RX0, midY)
      ctx.lineTo(RX1, midY)
      ctx.stroke()
      text("α' (x, t)", RX0 + 6, RY0 + 14, '#64748b', '10px ui-monospace, monospace')
      text('x  (0 → 1 m)', RX1 - 78, RY1 + 16, '#64748b', '10px ui-monospace, monospace')

      const wave = (speed: number, gain: number, col: string, width: number) => {
        ctx.strokeStyle = col
        ctx.lineWidth = width
        ctx.beginPath()
        for (let i = 0; i <= 300; i++) {
          const x = i / 300
          const v = gain * Math.cos(K_VIS * (x - speed * tSim))
          const px = RX0 + x * (RX1 - RX0)
          const py = midY - (v / 9) * halfH
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
        ctx.lineWidth = 1
      }

      if (illPosed) {
        // growing envelope
        ctx.strokeStyle = 'rgba(248,113,113,0.35)'
        ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.moveTo(RX0, midY - (Math.min(envelope, 9) / 9) * halfH)
        ctx.lineTo(RX1, midY - (Math.min(envelope, 9) / 9) * halfH)
        ctx.moveTo(RX0, midY + (Math.min(envelope, 9) / 9) * halfH)
        ctx.lineTo(RX1, midY + (Math.min(envelope, 9) / 9) * halfH)
        ctx.stroke()
        ctx.setLineDash([])
        wave(P.mean, Math.min(envelope, 9), '#f87171', 2)
        text(`amplitude x${Math.min(envelope, 9).toFixed(2)}`, RX0 + 8, RY1 - 10, '#f87171', 'bold 11px ui-monospace, monospace')
      } else {
        wave(P.re1, 3.2, '#38bdf8', 2)
        wave(P.re2, 3.2, '#fbbf24', 2)
        text('two void waves, constant amplitude', RX0 + 8, RY1 - 10, '#34d399', 'bold 11px ui-monospace, monospace')
      }
      text('PERTURBATION', RX0, 26, '#cbd5e1', 'bold 12px ui-monospace, monospace')

      // =====================================================================
      // readout strip
      // =====================================================================
      let ry = LY1 + 62
      const col2 = 300
      const col3 = 520
      const put = (lbl: string, v: string, c: string, x: number, y: number) => {
        text(lbl, x, y, '#94a3b8')
        text(v, x + 112, y, c, 'bold 11px ui-monospace, monospace')
      }
      put('Im λ  (m/s)', P.im.toExponential(2), illPosed ? '#f87171' : '#34d399', LX0, ry)
      put('growth @N=200', (Math.PI * 200 * P.im).toFixed(1) + ' 1/s', illPosed ? '#f87171' : '#34d399', col2, ry)
      ctx.fillStyle = illPosed ? 'rgba(248,113,113,0.18)' : 'rgba(52,211,153,0.18)'
      ctx.fillRect(col3, ry - 15, 186, 24)
      text(illPosed ? 'ILL-POSED  (complex λ)' : 'HYPERBOLIC  (real λ)', col3 + 10, ry + 2, dotCol, 'bold 11px ui-monospace, monospace')
      ry += 24
      put('wave split', P.im > 0 ? '—' : (P.re2 - P.re1).toFixed(3) + ' m/s', '#e2e8f0', LX0, ry)
      put('mean speed', P.mean.toFixed(4) + ' m/s', '#e2e8f0', col2, ry)
      text('ρ_g = 1.2, ρ_l = 1000 kg/m³', col3 + 10, ry + 2, '#64748b', '10px ui-monospace, monospace')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const nameS: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 62 }
  const btn: CSSProperties = {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.4)',
    background: running ? 'rgba(56,189,248,0.15)' : 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />
      <div style={rowS}>
        <button style={btn} onClick={() => setRunning((p) => !p)}>
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        <label style={label}>
          <span style={nameS}>sigma</span>
          <input type="range" min={0} max={2} step={0.02} value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} />
          <span style={mono}>{sigma.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>slip u_r</span>
          <input type="range" min={0} max={30} step={0.5} value={ur} onChange={(e) => setUr(parseFloat(e.target.value))} />
          <span style={mono}>{ur.toFixed(1)} m/s</span>
        </label>
        <label style={label}>
          <span style={nameS}>alpha_g</span>
          <input type="range" min={0.05} max={0.95} step={0.01} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} />
          <span style={mono}>{alpha.toFixed(2)}</span>
        </label>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Push <em>sigma</em> up from 0. The two red dots slide down the imaginary axis, meet at σ = 1, then split along the real
        axis and turn green — and the right panel stops growing (envelope now ×{amp.toFixed(2)}) and starts propagating as two
        separate void waves. Set <em>slip u_r</em> to 0 and the whole pair collapses onto one point: no slip, no problem.
      </div>
    </div>
  )
}
