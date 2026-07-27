'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Damkoehler's wrinkling hypothesis, drawn instead of asserted.
//
// Turbulence does not make the local chemistry faster. It WRINKLES the front,
// and a longer front eats more fresh gas per unit time:
//
//   S_T / S_L = A_T / A = Sigma          (flame surface area ratio)
//
// Damkoehler's linear law Sigma_lin = 1 + u'/S_L holds only while the eddies
// merely fold a thin sheet. Two things break it as u'/S_L grows:
//
//   saturation  the folded sheet cannot keep lengthening -> Sigma_inf = 6
//   quenching   small eddies enter the preheat zone and kill the flamelet
//
//   Da = l_t/delta_L / (u'/S_L)                        Damkoehler number
//   Ka = (u'/S_L)^1.5 / sqrt(l_t/delta_L)              Karlovitz number
//   q  = exp(-(Ka/25)^2)                               quench factor
//   Sigma = 1 + q * (ur / (1 + ur/6))                  bending + quench
//
// The front below is NOT decorative. Three sinusoidal modes whose wavelengths
// come from l_t/delta_L are given an overall amplitude found by BISECTION so
// that the MEASURED polyline arc length of the drawn curve equals Sigma above.
// "Faster flame" therefore literally means "longer line on this canvas" - the
// measured Sigma and the model Sigma in the readout must agree to 2 decimals.
// ---------------------------------------------------------------------------

const SIGMA_INF = 6.0 // wrinkling saturation
const KA_Q = 25.0 // quench Karlovitz

const DOMAIN = 120 // panel height in flame thicknesses delta_L
const NS = 481 // samples along the front
const DY = DOMAIN / (NS - 1)

const FX0 = 36
const FY0 = 58
const FW = 336
const FH = 252
const XC = FX0 + FW / 2
const PXD = FH / DOMAIN // pixels per delta_L

const PX0 = 424
const PY0 = 86
const PW = 196
const PH = 166
const UR_MAX = 12
const ST_MAX = 13.5

type Model = { ur: number; lr: number; da: number; ka: number; q: number; sigma: number; lin: number }

function evalModel(ur: number, lr: number): Model {
  const da = ur > 1e-6 ? lr / ur : Infinity
  const ka = Math.pow(ur, 1.5) / Math.sqrt(lr)
  const q = Math.exp(-Math.pow(ka / KA_Q, 2))
  const sigma = 1 + q * (ur / (1 + ur / SIGMA_INF))
  return { ur, lr, da, ka, q, sigma, lin: 1 + ur }
}

function regimeOf(ka: number): { name: string; col: string } {
  if (ka < 1) return { name: 'wrinkled flamelet', col: '#4ade80' }
  if (ka < KA_Q) return { name: 'thickened flamelet', col: '#fbbf24' }
  return { name: 'quenching', col: '#f87171' }
}

// deterministic hash in [0,1) for the quench gaps
function hash01(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

export function WrinkledFlameFrontLab() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [ur, setUr] = useState(3)
  const [lr, setLr] = useState(20)
  const [showLinear, setShowLinear] = useState(true)

  const urRef = useRef(ur)
  const lrRef = useRef(lr)
  const linRef = useRef(showLinear)
  urRef.current = ur
  lrRef.current = lr
  linRef.current = showLinear

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const shape = new Float64Array(NS)
    const d = new Float64Array(NS - 1)
    const xs = new Float64Array(NS)
    const xl = new Float64Array(NS)

    // three modes: wavelengths l_t, l_t/2, l_t/4 (in delta_L), convecting in time
    const buildShape = (lrv: number, t: number, urv: number) => {
      const cv = 3 + 1.6 * urv // wrinkle convection speed, delta_L per second
      const l1 = lrv
      const l2 = lrv / 2
      const l3 = lrv / 4
      const k1 = (2 * Math.PI) / l1
      const k2 = (2 * Math.PI) / l2
      const k3 = (2 * Math.PI) / l3
      for (let i = 0; i < NS; i++) {
        const y = i * DY
        shape[i] =
          Math.sin(k1 * (y - cv * t)) +
          0.5 * Math.sin(k2 * (y - 1.35 * cv * t) + 1.1) +
          0.25 * Math.sin(k3 * (y - 1.8 * cv * t) + 2.3)
      }
      for (let i = 0; i < NS - 1; i++) d[i] = shape[i + 1] - shape[i]
    }

    // measured arc length ratio of the polyline x = A * shape(y)
    const arcRatio = (A: number) => {
      let L = 0
      for (let i = 0; i < NS - 1; i++) {
        const dx = A * d[i]
        L += Math.sqrt(DY * DY + dx * dx)
      }
      return L / DOMAIN
    }

    // bisection for the amplitude that reproduces a target Sigma
    const solveA = (target: number) => {
      if (target <= 1.000001) return 0
      let hi = 1
      let guard = 0
      while (arcRatio(hi) < target && guard < 40) {
        hi *= 2
        guard++
      }
      let lo = 0
      for (let k = 0; k < 22; k++) {
        const mid = 0.5 * (lo + hi)
        if (arcRatio(mid) < target) lo = mid
        else hi = mid
      }
      return 0.5 * (lo + hi)
    }

    const text = (s: string, x: number, y: number, col: string, font = '10px ui-monospace, monospace') => {
      ctx.font = font
      ctx.fillStyle = col
      ctx.fillText(s, x, y)
    }

    const strokePolyline = (arr: Float64Array, holeFrac: number, tt: number) => {
      // draw in chunks so quench gaps can punch holes in the sheet
      const CH = 12
      const seed = Math.floor(tt * 0.8)
      ctx.beginPath()
      for (let s0 = 0; s0 < NS - 1; s0 += CH) {
        if (holeFrac > 0 && hash01(s0 * 0.137 + seed * 7.13) < holeFrac) continue
        const s1 = Math.min(s0 + CH, NS - 1)
        ctx.moveTo(arr[s0], FY0 + s0 * DY * PXD)
        for (let i = s0 + 1; i <= s1; i++) ctx.lineTo(arr[i], FY0 + i * DY * PXD)
      }
      ctx.stroke()
    }

    const draw = (ts: number) => {
      const t = ts * 0.001
      const urv = urRef.current
      const lrv = lrRef.current
      const m = evalModel(urv, lrv)
      const reg = regimeOf(m.ka)

      buildShape(lrv, t, urv)
      const A = solveA(m.sigma)
      const measured = arcRatio(A)
      const ALin = linRef.current ? solveA(m.lin) : 0
      const measLin = linRef.current ? arcRatio(ALin) : 0

      for (let i = 0; i < NS; i++) {
        xs[i] = XC + A * PXD * shape[i]
        xl[i] = XC + ALin * PXD * shape[i]
      }

      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, c.width, c.height)

      // ---------------------------------------------------------------- header
      text('Damkoehler wrinkling:  S_T/S_L = A_T/A = Sigma   (front length ratio)', 14, 18, '#e2e8f0', '11px ui-monospace, monospace')
      text('fresh gas moves right at S_L everywhere along the front - only the LENGTH changes', 14, 33, '#94a3b8')

      // ---------------------------------------------------------------- flame panel
      ctx.save()
      ctx.beginPath()
      ctx.rect(FX0, FY0, FW, FH)
      ctx.clip()

      // fresh gas (left, cool) and burnt gas (right, warm); burnt desaturates with Ka
      const des = Math.min(1, m.ka / KA_Q)
      const br = Math.round(249 - 110 * des)
      const bg = Math.round(115 + 25 * des)
      const bb = Math.round(22 + 110 * des)

      ctx.beginPath()
      ctx.moveTo(FX0 - 40, FY0)
      for (let i = 0; i < NS; i++) ctx.lineTo(xs[i], FY0 + i * DY * PXD)
      ctx.lineTo(FX0 - 40, FY0 + FH)
      ctx.closePath()
      ctx.fillStyle = 'rgba(23,54,105,0.85)'
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(FX0 + FW + 40, FY0)
      for (let i = 0; i < NS; i++) ctx.lineTo(xs[i], FY0 + i * DY * PXD)
      ctx.lineTo(FX0 + FW + 40, FY0 + FH)
      ctx.closePath()
      ctx.fillStyle = `rgba(${br},${bg},${bb},0.72)`
      ctx.fill()

      // Damkoehler linear-law ghost front
      if (linRef.current) {
        ctx.strokeStyle = 'rgba(251,191,36,0.55)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        for (let i = 0; i < NS; i++) {
          const X = xl[i]
          const Y = FY0 + i * DY * PXD
          if (i === 0) ctx.moveTo(X, Y)
          else ctx.lineTo(X, Y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      // the front itself: thin sheet -> smeared band as Ka grows
      const thickDelta = m.ka < 1 ? 1 : Math.min(12, 1 + 1.6 * Math.sqrt(m.ka - 1))
      const bandPx = thickDelta * PXD
      const holeFrac = Math.min(0.82, 1 - m.q)

      if (thickDelta > 1.05) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = `rgba(253,186,116,${0.1 + 0.12 * Math.min(1, m.ka / 8)})`
        ctx.lineWidth = bandPx
        strokePolyline(xs, holeFrac, t)
        ctx.strokeStyle = 'rgba(254,215,170,0.22)'
        ctx.lineWidth = bandPx * 0.5
        strokePolyline(xs, holeFrac, t)
      }
      const coreAlpha = 1 / (1 + 0.16 * (thickDelta - 1))
      ctx.strokeStyle = `rgba(255,241,214,${coreAlpha.toFixed(3)})`
      ctx.lineWidth = Math.max(1.1, 2.6 - 0.12 * (thickDelta - 1))
      strokePolyline(xs, holeFrac, t)

      ctx.restore()

      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(FX0, FY0, FW, FH)

      text('fresh gas', FX0 + 6, FY0 + 14, '#93c5fd')
      text('burnt gas', FX0 + FW - 58, FY0 + 14, '#fed7aa')
      text(`panel height = ${DOMAIN} delta_L`, FX0, FY0 - 6, '#94a3b8')
      text(`front band = ${thickDelta.toFixed(1)} delta_L`, FX0 + FW - 118, FY0 - 6, thickDelta > 1.05 ? '#fbbf24' : '#94a3b8')
      if (linRef.current) text(`- - - Damkoehler linear front, Sigma = ${measLin.toFixed(2)}`, FX0 + 6, FY0 + FH - 8, '#fbbf24')
      if (holeFrac > 0.12) text('holes = quenched flamelets', FX0 + FW - 148, FY0 + FH - 8, '#f87171')

      // ---------------------------------------------------------------- inset plot
      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.strokeRect(PX0, PY0, PW, PH)
      const gx = (u: number) => PX0 + (u / UR_MAX) * PW
      const gy = (v: number) => PY0 + PH - (v / ST_MAX) * PH

      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      for (let v = 2; v < ST_MAX; v += 2) {
        ctx.beginPath()
        ctx.moveTo(PX0, gy(v))
        ctx.lineTo(PX0 + PW, gy(v))
        ctx.stroke()
      }

      // Damkoehler straight line
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.4
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(gx(0), gy(1))
      ctx.lineTo(gx(UR_MAX), gy(1 + UR_MAX))
      ctx.stroke()
      ctx.setLineDash([])

      // bending + quench curve for the CURRENT l_t/delta_L
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let px = 0; px <= PW; px++) {
        const u = (px / PW) * UR_MAX
        const sm = evalModel(u, lrv).sigma
        const X = PX0 + px
        const Y = gy(sm)
        if (px === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // the gap that "bending" means
      ctx.strokeStyle = 'rgba(248,113,113,0.6)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(gx(m.ur), gy(m.sigma))
      ctx.lineTo(gx(m.ur), gy(m.lin))
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.arc(gx(m.ur), gy(Math.min(m.lin, ST_MAX)), 3.2, 0, Math.PI * 2)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.4
      ctx.stroke()

      const pulse = 4.2 + 1.1 * Math.sin(ts * 0.005)
      ctx.beginPath()
      ctx.arc(gx(m.ur), gy(m.sigma), pulse, 0, Math.PI * 2)
      ctx.fillStyle = reg.col
      ctx.fill()

      text('S_T/S_L', PX0 - 6, PY0 - 20, '#cbd5e1')
      text(String(ST_MAX), PX0 - 24, PY0 + 8, '#94a3b8')
      text('1', PX0 - 12, gy(1) + 3, '#94a3b8')
      text('0', PX0 - 12, PY0 + PH, '#94a3b8')
      text('0', PX0 - 2, PY0 + PH + 13, '#94a3b8')
      text(String(UR_MAX), PX0 + PW - 8, PY0 + PH + 13, '#94a3b8')
      text("u'/S_L", PX0 + PW / 2 - 18, PY0 + PH + 25, '#cbd5e1')
      text('Damkoehler 1 + u\'/S_L', PX0, PY0 - 6, '#fbbf24')
      text(`bending + quench, l_t/delta_L = ${lrv.toFixed(0)}`, PX0, PY0 + PH + 38, '#22d3ee')
      text('red tie = the bending deficit', PX0, PY0 + PH + 50, '#f87171')

      // ---------------------------------------------------------------- readouts
      const R0 = 336
      const LH = 15
      text(`u'/S_L = ${m.ur.toFixed(1)}`, 14, R0, '#e2e8f0')
      text(`l_t/delta_L = ${m.lr.toFixed(0)}`, 130, R0, '#e2e8f0')
      text(`Da = l_t/delta_L / (u'/S_L) = ${Number.isFinite(m.da) ? m.da.toFixed(2) : 'inf'}`, 260, R0, '#e2e8f0')
      text(`Ka = (u'/S_L)^1.5 / sqrt(l_t/delta_L) = ${m.ka.toFixed(2)}`, 14, R0 + LH, reg.col)
      text(`q = exp(-(Ka/25)^2) = ${m.q.toFixed(3)}`, 320, R0 + LH, reg.col)
      text(`Sigma measured (arc length of the drawn curve) = ${measured.toFixed(3)}`, 14, R0 + 2 * LH, '#22d3ee')
      text(`S_T/S_L model = ${m.sigma.toFixed(3)}`, 360, R0 + 2 * LH, '#22d3ee')
      text(`Sigma_linear = 1 + u'/S_L = ${m.lin.toFixed(2)}`, 14, R0 + 3 * LH, '#fbbf24')
      text(`deficit = ${(m.lin - m.sigma).toFixed(2)}  (${((1 - m.sigma / m.lin) * 100).toFixed(0)} % below the linear law)`, 210, R0 + 3 * LH, '#fbbf24')

      // regime badge
      ctx.font = 'bold 11px ui-monospace, monospace'
      const bw = ctx.measureText(reg.name).width + 18
      ctx.fillStyle = reg.col
      ctx.globalAlpha = 0.16
      ctx.fillRect(14, R0 + 4 * LH - 1, bw, 18)
      ctx.globalAlpha = 1
      ctx.strokeStyle = reg.col
      ctx.lineWidth = 1
      ctx.strokeRect(14, R0 + 4 * LH - 1, bw, 18)
      text(reg.name, 23, R0 + 4 * LH + 12, reg.col, 'bold 11px ui-monospace, monospace')

      const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.0018))
      ctx.globalAlpha = glow
      text("push u'/S_L past 4: the amber ghost keeps stretching, the real front stops", 24 + bw, R0 + 4 * LH + 12, '#22d3ee', '11px ui-monospace, monospace')
      ctx.globalAlpha = 1
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
    background: active ? '#fbbf24' : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={660}
        height={430}
        style={{ width: '100%', maxWidth: 660, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center', marginTop: '0.7rem', fontSize: 13, color: '#cbd5e1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          u&apos;/S_L
          <input type="range" min={0} max={12} step={0.1} value={ur} onChange={(e) => setUr(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }}>{ur.toFixed(1)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          l_t/δ_L
          <input type="range" min={2} max={50} step={1} value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 26 }}>{lr.toFixed(0)}</span>
        </label>
        <button onClick={() => setShowLinear((v) => !v)} style={btn(showLinear)}>
          {showLinear ? '[x]' : '[ ]'} Damköhler linear law overlay
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace', lineHeight: 1.55 }}>
        What to watch: the drawn front&apos;s measured arc length is forced to equal S_T/S_L, so a faster flame is a
        literally longer line. Raise u&apos;/S_L and the amber linear-law ghost runs away from the real front — that gap is the
        bending effect. Lower l_t/δ_L to drive Ka past 25 and the sheet thickens, desaturates, then breaks into holes.
      </p>
    </div>
  )
}
