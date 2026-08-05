'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A shock only ever feels the velocity component NORMAL to itself.
//
// Tilt the shock by beta and the incoming V1 splits into
//
//   Vt = V1 cos(beta)   -- rides through untouched
//   Vn = V1 sin(beta)   -- the only part that gets compressed
//
// so the shock strength is set by Mn1 = M1 sin(beta), not by M1. Lay the shock
// down flat and Mn1 -> 1: the loss goes to zero. That is the whole trick behind
// a shock train.
//
// The catch is the theta-beta-M relation: for one deflection theta there are
// TWO wave angles (weak / strong), and above theta_max there is none at all --
// the shock rips off the wedge and stands in front of it as a bow shock.
// ---------------------------------------------------------------------------

const W = 700
const H = 430
const GAM = 1.4
const DEG = Math.PI / 180

// ---- gas dynamics -------------------------------------------------------

function p0Ratio(mn: number): number {
  if (mn <= 1) return 1
  const m2 = mn * mn
  const a = ((GAM + 1) * m2 * 0.5) / (1 + ((GAM - 1) * m2) / 2)
  const b = (GAM + 1) / (2 * GAM * m2 - (GAM - 1))
  return Math.pow(a, GAM / (GAM - 1)) * Math.pow(b, 1 / (GAM - 1))
}

function machNormalAfter(mn: number): number {
  const m2 = mn * mn
  return Math.sqrt((1 + ((GAM - 1) / 2) * m2) / (GAM * m2 - (GAM - 1) / 2))
}

function staticPRatio(mn: number): number {
  if (mn <= 1) return 1
  return 1 + ((2 * GAM) / (GAM + 1)) * (mn * mn - 1)
}

// tan(theta) = 2 cot(beta) (M^2 sin^2 beta - 1) / ( M^2 (gam + cos 2beta) + 2 )
function thetaOfBeta(M: number, beta: number): number {
  const s = Math.sin(beta)
  const num = 2 * (Math.cos(beta) / s) * (M * M * s * s - 1)
  const den = M * M * (GAM + Math.cos(2 * beta)) + 2
  return Math.atan2(num, den)
}

// ternary search for the knee of the theta(beta) curve
function detachLimit(M: number): { thMax: number; betaStar: number } {
  let lo = Math.asin(1 / M)
  let hi = Math.PI / 2
  for (let i = 0; i < 90; i++) {
    const a = lo + (hi - lo) / 3
    const b = hi - (hi - lo) / 3
    if (thetaOfBeta(M, a) < thetaOfBeta(M, b)) lo = a
    else hi = b
  }
  const betaStar = (lo + hi) / 2
  return { thMax: thetaOfBeta(M, betaStar), betaStar }
}

// bisection on the requested branch; null == detached
function solveBeta(M: number, theta: number, weak: boolean, betaStar: number, thMax: number): number | null {
  if (M <= 1) return null
  if (theta > thMax) return null
  if (theta <= 1e-9) return weak ? Math.asin(1 / M) : Math.PI / 2
  let lo = weak ? Math.asin(1 / M) : betaStar
  let hi = weak ? betaStar : Math.PI / 2
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2
    const t = thetaOfBeta(M, mid)
    if (weak ? t < theta : t > theta) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function lossColor(f: number): string {
  if (f > 0.95) return '#34d399'
  if (f >= 0.7) return '#fbbf24'
  return '#f87171'
}

// ---- plot frame ---------------------------------------------------------

const PX = 54
const PY = 46
const PW = 268
const PH = 230
const TH_SPAN = 50 // degrees on the x axis

const RX = 350
const RY = 46
const RW = 332
const RH = 230

export function ObliqueShockPolarDial() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mach, setMach] = useState(3.0)
  const [theta, setTheta] = useState(8)
  const [weak, setWeak] = useState(true)

  const cfg = useRef({ mach, theta, weak })
  cfg.current = { mach, theta, weak }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const arrow = (x0: number, y0: number, x1: number, y1: number, col: string, wdt: number, head = 7) => {
      ctx.strokeStyle = col
      ctx.lineWidth = wdt
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      const a = Math.atan2(y1 - y0, x1 - x0)
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 - head * Math.cos(a - 0.42), y1 - head * Math.sin(a - 0.42))
      ctx.lineTo(x1 - head * Math.cos(a + 0.42), y1 - head * Math.sin(a + 0.42))
      ctx.closePath()
      ctx.fill()
    }

    let frame = 0

    const draw = () => {
      frame++
      const M1 = cfg.current.mach
      const thDeg = cfg.current.theta
      const th = thDeg * DEG
      const useWeak = cfg.current.weak

      const mu = Math.asin(1 / M1)
      const { thMax, betaStar } = detachLimit(M1)
      const beta = solveBeta(M1, th, useWeak, betaStar, thMax)
      const detached = beta === null

      const mn1 = detached ? M1 : M1 * Math.sin(beta)
      const mn2 = machNormalAfter(mn1)
      const M2 = detached ? NaN : th < 1e-9 && useWeak ? M1 : mn2 / Math.sin(beta - th)
      const pr = staticPRatio(mn1)
      const p0r = p0Ratio(mn1)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, W, H)

      const pulse = 0.55 + 0.45 * Math.sin(frame / 18)

      // ================= LEFT: theta-beta-M diagram =================
      const sx = (t: number) => PX + (t / TH_SPAN) * PW
      const sy = (b: number) => PY + PH - (b / 90) * PH

      text(`theta-beta-M curve at M1 = ${M1.toFixed(2)}`, PX - 6, PY - 22, '#e2e8f0', 'bold 11px ui-monospace, monospace')

      // grid
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      ctx.lineWidth = 1
      for (let t = 0; t <= TH_SPAN; t += 10) {
        ctx.beginPath()
        ctx.moveTo(sx(t), PY)
        ctx.lineTo(sx(t), PY + PH)
        ctx.stroke()
      }
      for (let b = 0; b <= 90; b += 15) {
        ctx.beginPath()
        ctx.moveTo(PX, sy(b))
        ctx.lineTo(PX + PW, sy(b))
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.strokeRect(PX, PY, PW, PH)

      for (let t = 0; t <= TH_SPAN; t += 10) text(`${t}`, sx(t) - 6, PY + PH + 14, '#64748b', '10px ui-monospace, monospace')
      for (let b = 0; b <= 90; b += 15) text(`${b}`, PX - 22, sy(b) + 4, '#64748b', '10px ui-monospace, monospace')
      text('deflection theta  [deg]', PX + 62, PY + PH + 28, '#94a3b8', '10px ui-monospace, monospace')
      ctx.save()
      ctx.translate(PX - 38, PY + PH / 2 + 46)
      ctx.rotate(-Math.PI / 2)
      text('wave angle beta  [deg]', 0, 0, '#94a3b8', '10px ui-monospace, monospace')
      ctx.restore()

      // Mach line
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(PX, sy(mu / DEG))
      ctx.lineTo(PX + PW, sy(mu / DEG))
      ctx.stroke()
      ctx.setLineDash([])
      text(`mu = ${(mu / DEG).toFixed(1)}`, PX + PW - 64, sy(mu / DEG) - 5, '#64748b', '10px ui-monospace, monospace')

      // the curve, split at the knee
      const NS = 320
      for (const seg of [0, 1]) {
        ctx.strokeStyle = seg === 0 ? '#38bdf8' : '#f87171'
        ctx.lineWidth = 2
        ctx.beginPath()
        let started = false
        for (let i = 0; i <= NS; i++) {
          const b = seg === 0 ? mu + ((betaStar - mu) * i) / NS : betaStar + ((Math.PI / 2 - betaStar) * i) / NS
          const t = thetaOfBeta(M1, b) / DEG
          const X = sx(Math.max(t, 0))
          const Y = sy(b / DEG)
          if (!started) {
            ctx.moveTo(X, Y)
            started = true
          } else ctx.lineTo(X, Y)
        }
        ctx.stroke()
      }
      text('weak', sx(thMax / DEG) * 0.5 + PX * 0.5 - 40, sy(20) + 4, '#38bdf8', 'bold 10px ui-monospace, monospace')
      text('strong', PX + 10, sy(78), '#f87171', 'bold 10px ui-monospace, monospace')

      // theta_max marker
      ctx.strokeStyle = '#fbbf24'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(sx(thMax / DEG), PY)
      ctx.lineTo(sx(thMax / DEG), PY + PH)
      ctx.stroke()
      ctx.setLineDash([])
      const lblX = Math.min(sx(thMax / DEG) + 5, PX + PW - 86)
      text(`thetamax = ${(thMax / DEG).toFixed(1)}`, lblX, PY + 12, '#fbbf24', 'bold 10px ui-monospace, monospace')

      // operating point
      if (!detached && beta !== null) {
        const X = sx(thDeg)
        const Y = sy(beta / DEG)
        ctx.fillStyle = useWeak ? '#38bdf8' : '#f87171'
        ctx.beginPath()
        ctx.arc(X, Y, 5.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = `rgba(251,191,36,${pulse})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(X, Y, 9 + 3 * pulse, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        const X = Math.min(sx(thDeg), PX + PW - 4)
        ctx.strokeStyle = '#f87171'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(X - 7, PY + PH / 2 - 7)
        ctx.lineTo(X + 7, PY + PH / 2 + 7)
        ctx.moveTo(X + 7, PY + PH / 2 - 7)
        ctx.lineTo(X - 7, PY + PH / 2 + 7)
        ctx.stroke()
      }

      // ================= RIGHT: the physical wedge =================
      ctx.save()
      ctx.beginPath()
      ctx.rect(RX, RY, RW, RH)
      ctx.clip()

      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 1
      ctx.strokeRect(RX, RY, RW, RH)

      const apx = RX + 74
      const apy = RY + RH - 52
      const wallLen = 176
      const wx = apx + wallLen * Math.cos(th)
      const wy = apy - wallLen * Math.sin(th)

      // wedge body
      ctx.fillStyle = 'rgba(148,163,184,0.16)'
      ctx.beginPath()
      ctx.moveTo(apx, apy)
      ctx.lineTo(wx, wy)
      ctx.lineTo(wx, RY + RH)
      ctx.lineTo(apx, RY + RH)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(203,213,225,0.75)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(apx, apy)
      ctx.lineTo(wx, wy)
      ctx.stroke()

      // deflection angle arc at the apex
      ctx.strokeStyle = 'rgba(251,191,36,0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(apx, apy, 34, -th, 0)
      ctx.stroke()
      text(`theta=${thDeg.toFixed(1)}`, apx + 38, apy - 6, '#fbbf24', '10px ui-monospace, monospace')

      const V1px = 1.0
      const V2px = detached || beta === null ? 0.35 : Math.cos(beta) / Math.cos(beta - th)

      // ---- streamlines + particles ----
      const heights = [30, 58, 86, 114, 142, 170]
      const xIn = RX + 3
      for (let hi = 0; hi < heights.length; hi++) {
        const h = heights[hi]
        const y0 = apy - h
        let xShock: number
        if (!detached && beta !== null && beta > 1e-4) xShock = apx + h / Math.tan(beta)
        else xShock = apx - 30

        // path polyline
        ctx.strokeStyle = 'rgba(148,163,184,0.22)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(xIn, y0)
        ctx.lineTo(xShock, y0)
        const rem = RX + RW - xShock
        ctx.lineTo(xShock + rem * Math.cos(th), y0 - rem * Math.sin(th))
        ctx.stroke()

        // particles: time-parametrised so upstream runs faster
        const s1 = Math.max(xShock - xIn, 1)
        const s2 = Math.max(rem, 1)
        const t1 = s1 / V1px
        const t2 = s2 / Math.max(V2px, 0.05)
        const T = t1 + t2
        const NP = 4
        for (let p = 0; p < NP; p++) {
          const u = ((frame * 1.35 + (T * p) / NP + hi * 11) % T + T) % T
          let px: number
          let py: number
          let fast: boolean
          if (u < t1) {
            px = xIn + u * V1px
            py = y0
            fast = true
          } else {
            const d = (u - t1) * Math.max(V2px, 0.05)
            px = xShock + d * Math.cos(th)
            py = y0 - d * Math.sin(th)
            fast = false
          }
          ctx.fillStyle = fast ? '#38bdf8' : '#a5b4fc'
          ctx.beginPath()
          ctx.arc(px, py, fast ? 2.4 : 2.0, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (!detached && beta !== null) {
        // ---- the shock ----
        const shLen = 300
        const shx = apx + shLen * Math.cos(beta)
        const shy = apy - shLen * Math.sin(beta)
        ctx.strokeStyle = lossColor(p0r)
        ctx.lineWidth = 1.5 + 7 * (1 - p0r)
        ctx.beginPath()
        ctx.moveTo(apx, apy)
        ctx.lineTo(shx, shy)
        ctx.stroke()
        text(`beta=${(beta / DEG).toFixed(1)}`, apx + 92 * Math.cos(beta) - 16, apy - 92 * Math.sin(beta) - 8, lossColor(p0r), 'bold 10px ui-monospace, monospace')

        // ---- V1 -> (Vt, Vn) decomposition on the shock ----
        const L = Math.min(112, wallLen * 0.62)
        const P = { x: apx + L * Math.cos(beta), y: apy - L * Math.sin(beta) }
        const tx = Math.cos(beta)
        const ty = -Math.sin(beta)
        const nx = Math.sin(beta)
        const ny = Math.cos(beta)
        const A = 60
        const vt = A * Math.cos(beta)
        const vn1 = A * Math.sin(beta)
        const vn2 = A * Math.cos(beta) * Math.tan(beta - th)

        const A0 = { x: P.x - A, y: P.y }
        // upstream legs
        const K = { x: A0.x + vt * tx, y: A0.y + vt * ty }
        arrow(A0.x, A0.y, K.x, K.y, 'rgba(203,213,225,0.85)', 2, 6)
        arrow(K.x, K.y, P.x, P.y, '#fbbf24', 2.4, 7)
        ctx.strokeStyle = 'rgba(56,189,248,0.55)'
        ctx.setLineDash([3, 3])
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(A0.x, A0.y)
        ctx.lineTo(P.x, P.y)
        ctx.stroke()
        ctx.setLineDash([])
        text('V1', A0.x - 4, A0.y - 8, '#38bdf8', 'bold 10px ui-monospace, monospace')

        // downstream legs
        const K2 = { x: P.x + vt * tx, y: P.y + vt * ty }
        const P2 = { x: K2.x + vn2 * nx, y: K2.y + vn2 * ny }
        arrow(P.x, P.y, K2.x, K2.y, 'rgba(203,213,225,0.85)', 2, 6)
        arrow(K2.x, K2.y, P2.x, P2.y, '#fbbf24', 2.4, 7)
        ctx.strokeStyle = 'rgba(165,180,252,0.7)'
        ctx.setLineDash([3, 3])
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(P.x, P.y)
        ctx.lineTo(P2.x, P2.y)
        ctx.stroke()
        ctx.setLineDash([])
        text('V2', P2.x + 4, P2.y + 12, '#a5b4fc', 'bold 10px ui-monospace, monospace')

        text('Vt same', RX + 8, RY + 16, 'rgba(203,213,225,0.9)', '10px ui-monospace, monospace')
        text(`Vn shrinks  ${vn1.toFixed(0)} -> ${vn2.toFixed(0)} px`, RX + 8, RY + 30, '#fbbf24', '10px ui-monospace, monospace')
      } else {
        // ---- detached bow shock ----
        const off = 34
        ctx.strokeStyle = '#f87171'
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(apx - off + 130, RY + 4)
        ctx.quadraticCurveTo(apx - off - 14, apy - 60, apx - off, apy)
        ctx.quadraticCurveTo(apx - off - 14, apy + 60, apx - off + 130, RY + RH - 4)
        ctx.stroke()
        text('DETACHED - no attached-shock solution above thetamax', RX + 8, RY + 16, '#f87171', 'bold 10.5px ui-monospace, monospace')
        text('bow shock stands off the wedge', apx - off - 6, apy + 28, '#f87171', '10px ui-monospace, monospace')
      }

      ctx.restore()
      text('physical picture (flow left to right)', RX - 2, RY - 22, '#e2e8f0', 'bold 11px ui-monospace, monospace')

      // ================= readout strip =================
      const RSY = 306
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(PX - 6, RSY, W - 2 * (PX - 6) + 24, 96)

      const cells: Array<[string, string, string]> = [
        ['beta  [deg]', detached ? '--' : (beta! / DEG).toFixed(2), detached ? '#f87171' : useWeak ? '#38bdf8' : '#f87171'],
        ['Mn1 = M1 sin b', detached ? '--' : mn1.toFixed(4), '#fbbf24'],
        ['M2  [-]', detached ? '--' : M2.toFixed(4), '#cbd5e1'],
        ['p2/p1  [-]', detached ? '--' : pr.toFixed(4), '#cbd5e1'],
        ['p02/p01  [-]', detached ? '--' : p0r.toFixed(4), detached ? '#f87171' : lossColor(p0r)],
      ]
      const cw = (W - 2 * (PX - 6) + 24) / cells.length
      for (let i = 0; i < cells.length; i++) {
        const cx0 = PX - 6 + i * cw
        if (i > 0) {
          ctx.strokeStyle = 'rgba(148,163,184,0.18)'
          ctx.beginPath()
          ctx.moveTo(cx0, RSY + 8)
          ctx.lineTo(cx0, RSY + 88)
          ctx.stroke()
        }
        text(cells[i][0], cx0 + 12, RSY + 24, '#94a3b8', '10px ui-monospace, monospace')
        text(cells[i][1], cx0 + 12, RSY + 50, cells[i][2], 'bold 17px ui-monospace, monospace')
      }
      text(
        detached
          ? `theta = ${thDeg.toFixed(1)} deg > thetamax = ${(thMax / DEG).toFixed(2)} deg  ->  shock detaches, huge loss`
          : `${useWeak ? 'WEAK' : 'STRONG'} branch  ${useWeak ? '(the one nature picks on an unconfined wedge)' : '(needs downstream back-pressure to hold it)'}`,
        PX + 6,
        RSY + 78,
        detached ? '#f87171' : useWeak ? '#38bdf8' : '#f87171',
        'bold 11px ui-monospace, monospace'
      )

      // header
      text('a shock only compresses the NORMAL velocity component', PX - 6, 24, '#fbbf24', 'bold 12px ui-monospace, monospace')
      text('gamma = 1.4', W - 96, 24, '#64748b', '10px ui-monospace, monospace')
    }

    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const btn = (active: boolean, col: string): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? col : 'transparent',
    color: active ? '#08111f' : '#cbd5e1',
    fontWeight: active ? 700 : 400,
    fontFamily: 'ui-monospace, monospace',
  })

  const row: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.7rem',
    alignItems: 'center',
    marginTop: '0.7rem',
    fontSize: 13,
    color: '#cbd5e1',
  }
  const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: '100%',
          maxWidth: W,
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.25)',
          display: 'block',
        }}
      />

      <div style={row}>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>M1</span>
          <input type="range" min={1.5} max={5} step={0.05} value={mach} onChange={(e) => setMach(parseFloat(e.target.value))} />
          <span style={mono}>{mach.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>theta [deg]</span>
          <input type="range" min={0} max={45} step={0.5} value={theta} onChange={(e) => setTheta(parseFloat(e.target.value))} />
          <span style={mono}>{theta.toFixed(1)}</span>
        </label>
      </div>

      <div style={row}>
        <button onClick={() => setWeak(true)} style={btn(weak, '#38bdf8')}>
          weak solution
        </button>
        <button onClick={() => setWeak(false)} style={btn(!weak, '#f87171')}>
          strong solution
        </button>
      </div>

      <div style={{ ...row, color: '#64748b', fontSize: 12 }}>
        drag <strong>theta</strong> and watch the amber <em>Vn</em> arrow grow while the slate <em>Vt</em> arrow never
        changes &mdash; that is why p02/p01 falls. push theta past the amber thetamax line and the shock detaches. then
        drag <strong>M1</strong>: the whole theta-beta knee slides right, so a faster inlet can turn the flow harder.
      </div>
    </div>
  )
}
