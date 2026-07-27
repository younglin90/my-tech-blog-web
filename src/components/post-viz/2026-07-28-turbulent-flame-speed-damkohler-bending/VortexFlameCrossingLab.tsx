'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// The flame answers back: vortex / flame-front crossing.
//
// Wrinkling is only half the story. The front also REWRITES the turbulence that
// wrinkles it, because the vorticity equation gains two flame-specific terms:
//
//   D(omega)/Dt = (omega.grad)u - omega (div u) + nu lap(omega)
//                 + (1/rho^2) (grad rho x grad p)
//                   ^dilatation^                ^baroclinic^
//
// Gas expands through the front (rho_u S_L = rho_b u_b), so div u > 0 there and
// the dilatation term drains omega. And grad(rho) is normal to the front while
// grad(p) points at the vortex core - they are NOT parallel, so the cross
// product fires and manufactures COUNTER-ROTATING, flame-generated vorticity.
//
// Observed outcome, reproduced schematically below:
//   weak vortex   -> stopped and torn apart at the front; what survives is the
//                    baroclinic counter-rotating pair. Wrinkle is shallow and
//                    relaxes back.
//   strong vortex -> punches through nearly unaffected, dragging a deep cusp
//                    that persists.
//
// Survival criterion used here (schematic, not a DNS):
//   s = (u_theta/S_L) / (1 + 20/(r/delta_L)),   crosses when s >= 3
// Small vortices lose because the 20/(r/delta_L) penalty is the front eating
// them faster than they can turn over.
// ---------------------------------------------------------------------------

const GX0 = 28
const GY0 = 56
const GW = 604
const GH = 246
const FRONT_X = GX0 + GW * 0.56
const CY = GY0 + GH / 2
const RELEASE_X = GX0 + 60

const PXD = 3.6 // pixels per delta_L
const SL_PX = 0.55 // S_L in pixels per frame
const U0 = 4 * SL_PX // mean fresh-gas convection = 4 S_L
const C_SURV = 20
const S_CRIT = 3
const NT = 180 // tracer particles

export function VortexFlameCrossingLab() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const [uth, setUth] = useState(2)
  const [rad, setRad] = useState(10)
  const [ratio, setRatio] = useState(6)
  const [showBc, setShowBc] = useState(true)
  const [resetN, setResetN] = useState(0)

  const uthRef = useRef(uth)
  const radRef = useRef(rad)
  const ratRef = useRef(ratio)
  const bcRef = useRef(showBc)
  const resRef = useRef(resetN)
  uthRef.current = uth
  radRef.current = rad
  ratRef.current = ratio
  bcRef.current = showBc
  resRef.current = resetN

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const tx = new Float64Array(NT)
    const ty = new Float64Array(NT)
    const px = new Float64Array(NT)
    const py = new Float64Array(NT)
    const tag = new Uint8Array(NT)

    let vcx = RELEASE_X
    let vcy = CY
    let alive = 1
    let wr = 0
    let crossed = false
    let dead = false
    let bcFade = 1
    let hold = 0
    let lastReset = resRef.current
    let R = radRef.current * PXD

    const seed = () => {
      R = radRef.current * PXD
      for (let i = 0; i < NT; i++) {
        const a = Math.random() * Math.PI * 2
        const rr = R * Math.sqrt(Math.random())
        tx[i] = RELEASE_X + rr * Math.cos(a)
        ty[i] = CY + rr * Math.sin(a)
        px[i] = tx[i]
        py[i] = ty[i]
        tag[i] = Math.floor((a / (Math.PI * 2)) * 4) % 2
      }
    }

    const respawn = () => {
      vcx = RELEASE_X
      vcy = CY
      alive = 1
      wr = 0
      crossed = false
      dead = false
      bcFade = 1
      hold = 0
      seed()
    }
    seed()

    // ---- live per-frame quantities (closure vars read by vel/wOffset) -------
    let omega = 0
    let bcOm = 0
    let sig = 20
    let Rb = 16
    let p1x = FRONT_X
    let p1y = CY
    let p2x = FRONT_X
    let p2y = CY
    let rat = 6

    const wOffset = (y: number) => {
      const dy = y - vcy
      return wr * Math.exp(-Math.abs(dy) / sig) * (1 + 0.25 * Math.tanh(-dy / sig))
    }

    const vxOut = { x: 0, y: 0 }
    const vel = (x: number, y: number) => {
      const fx = FRONT_X + wOffset(y)
      let vx = x < fx ? U0 : U0 * rat
      let vy = 0

      const dx = x - vcx
      const dy = y - vcy
      const r = Math.sqrt(dx * dx + dy * dy)
      if (r > 0.6 && alive > 1e-3) {
        const vt = alive * (r < R ? omega * r : (omega * R * R) / r)
        vx += vt * (-dy / r)
        vy += vt * (dx / r)
      }

      if (bcOm > 1e-5) {
        // two counter-rotating (clockwise) flame-generated vortices at the front
        const ax = x - p1x
        const ay = y - p1y
        const ra = Math.sqrt(ax * ax + ay * ay)
        if (ra > 0.6) {
          const vt = ra < Rb ? bcOm * ra : (bcOm * Rb * Rb) / ra
          vx += vt * (ay / ra)
          vy += vt * (-ax / ra)
        }
        const bx = x - p2x
        const by = y - p2y
        const rb = Math.sqrt(bx * bx + by * by)
        if (rb > 0.6) {
          const vt = rb < Rb ? bcOm * rb : (bcOm * Rb * Rb) / rb
          vx += vt * (by / rb)
          vy += vt * (-bx / rb)
        }
      }
      vxOut.x = vx
      vxOut.y = vy
      return vxOut
    }

    const text = (s: string, x: number, y: number, col: string, font = '10px ui-monospace, monospace') => {
      ctx.font = font
      ctx.fillStyle = col
      ctx.fillText(s, x, y)
    }

    const arrow = (x0: number, y0: number, x1: number, y1: number, col: string, w = 1.6, head = 5) => {
      const a = Math.atan2(y1 - y0, x1 - x0)
      ctx.strokeStyle = col
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 - head * Math.cos(a - 0.42), y1 - head * Math.sin(a - 0.42))
      ctx.lineTo(x1 - head * Math.cos(a + 0.42), y1 - head * Math.sin(a + 0.42))
      ctx.closePath()
      ctx.fillStyle = col
      ctx.fill()
    }

    // curved rotation arrow, ccw>0
    const spinArrow = (x: number, y: number, r: number, col: string, ccw: boolean, alpha: number) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = col
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, r, 0.5, 0.5 + Math.PI * 1.35, !ccw)
      ctx.stroke()
      const a = ccw ? 0.5 + Math.PI * 1.35 : 0.5
      const hx = x + r * Math.cos(a)
      const hy = y + r * Math.sin(a)
      const ta = a + (ccw ? Math.PI / 2 : -Math.PI / 2)
      ctx.beginPath()
      ctx.moveTo(hx + 6 * Math.cos(ta), hy + 6 * Math.sin(ta))
      ctx.lineTo(hx + 5 * Math.cos(ta + 2.5), hy + 5 * Math.sin(ta + 2.5))
      ctx.lineTo(hx + 5 * Math.cos(ta - 2.5), hy + 5 * Math.sin(ta - 2.5))
      ctx.closePath()
      ctx.fillStyle = col
      ctx.fill()
      ctx.restore()
    }

    const step = () => {
      const uv = uthRef.current
      const rv = radRef.current
      rat = ratRef.current

      // radius slider: rescale the tracer cloud about the core so the change is felt now
      const Rnew = rv * PXD
      if (Math.abs(Rnew - R) > 0.05 && R > 1e-6) {
        const k = Rnew / R
        for (let i = 0; i < NT; i++) {
          tx[i] = vcx + (tx[i] - vcx) * k
          ty[i] = vcy + (ty[i] - vcy) * k
        }
      }
      R = Rnew
      sig = Math.max(12, R * 0.55)
      Rb = Math.max(14, R * 0.45)

      const s = uv / (1 + C_SURV / rv)
      const survives = s >= S_CRIT

      omega = Math.min(0.3, (uv * SL_PX) / Math.max(R, 1e-6))

      // proximity to the front controls both the wrinkle and the baroclinic burst
      const near = Math.exp(-Math.pow((vcx - FRONT_X) / (0.9 * R + 34), 2))
      // baroclinic torque is physics, not a display option: it always acts on the
      // tracers. The toggle only decides whether it is DRAWN and labelled.
      // once the primary vortex is gone the flame-generated pair also washes away
      if (dead) bcFade *= 0.985
      const bcTan = 0.5 * (1 - 1 / rat) * near * uv * SL_PX * bcFade
      bcOm = Math.min(0.26, bcTan / Rb)

      p1y = vcy - 0.9 * R
      p2y = vcy + 0.9 * R
      p1x = FRONT_X + wOffset(p1y)
      p2x = FRONT_X + wOffset(p2y)

      // wrinkle depth
      const drive = near * (survives ? 0.75 : 0.16) * Math.min(s, 14) * PXD
      if (drive > wr) wr += (drive - wr) * 0.12
      else wr *= survives && crossed ? 0.9988 : 0.955

      // core motion
      if (!dead) {
        const axc = vcx < FRONT_X ? U0 : U0 * rat
        if (!survives && vcx > FRONT_X - 0.35 * R - 10) {
          alive *= 0.96
          vcx = Math.min(FRONT_X + 2, vcx + axc * 0.12)
          if (alive < 0.03) {
            alive = 0
            dead = true
          }
        } else {
          vcx += axc
          if (vcx > FRONT_X) crossed = true
        }
      }

      // tracers
      let activeCount = 0
      for (let i = 0; i < NT; i++) {
        px[i] = tx[i]
        py[i] = ty[i]
        const v = vel(tx[i], ty[i])
        tx[i] += v.x
        ty[i] += v.y
        if (ty[i] < GY0 + 2) ty[i] = GY0 + 2
        if (ty[i] > GY0 + GH - 2) ty[i] = GY0 + GH - 2
        if (tx[i] < GX0 + GW - 4) activeCount++
      }
      if (activeCount === 0) {
        hold++
        if (hold > 45) respawn()
      }
      return { s, survives, near }
    }

    const draw = (ts: number, s: number, survives: boolean, near: number) => {
      ctx.fillStyle = '#08111f'
      ctx.fillRect(0, 0, c.width, c.height)

      text('vortex meets flame: dilatation + baroclinic torque rewrite the turbulence', 14, 18, '#e2e8f0', '11px ui-monospace, monospace')
      text('Domega/Dt = (omega.grad)u - omega(div u) + nu lap(omega) + (1/rho^2)(grad rho x grad p)', 14, 34, '#94a3b8')

      ctx.save()
      ctx.beginPath()
      ctx.rect(GX0, GY0, GW, GH)
      ctx.clip()

      // gases
      const N = 64
      ctx.beginPath()
      ctx.moveTo(GX0 - 20, GY0 - 10)
      for (let i = 0; i <= N; i++) {
        const y = GY0 + (i / N) * GH
        ctx.lineTo(FRONT_X + wOffset(y), y)
      }
      ctx.lineTo(GX0 - 20, GY0 + GH + 10)
      ctx.closePath()
      ctx.fillStyle = 'rgba(23,54,105,0.85)'
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(GX0 + GW + 20, GY0 - 10)
      for (let i = 0; i <= N; i++) {
        const y = GY0 + (i / N) * GH
        ctx.lineTo(FRONT_X + wOffset(y), y)
      }
      ctx.lineTo(GX0 + GW + 20, GY0 + GH + 10)
      ctx.closePath()
      ctx.fillStyle = 'rgba(217,95,26,0.62)'
      ctx.fill()

      // the front itself
      ctx.strokeStyle = 'rgba(255,241,214,0.95)'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const y = GY0 + (i / N) * GH
        const X = FRONT_X + wOffset(y)
        if (i === 0) ctx.moveTo(X, y)
        else ctx.lineTo(X, y)
      }
      ctx.stroke()

      // coarse velocity-field arrows: the length jump at the front IS the expansion
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 11; gx++) {
          const X = GX0 + ((gx + 0.5) / 11) * GW
          const Y = GY0 + ((gy + 0.5) / 5) * GH
          const v = vel(X, Y)
          const m = Math.sqrt(v.x * v.x + v.y * v.y)
          if (m < 1e-4) continue
          const L = Math.min(26, 7 * m)
          arrow(X, Y, X + (v.x / m) * L, Y + (v.y / m) * L, 'rgba(226,232,240,0.28)', 1, 3.5)
        }
      }

      // tracers
      for (let i = 0; i < NT; i++) {
        ctx.strokeStyle = tag[i] === 0 ? 'rgba(226,232,240,0.85)' : 'rgba(56,189,248,0.9)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(px[i], py[i])
        ctx.lineTo(tx[i], ty[i])
        ctx.stroke()
      }

      // vortex core marker + rotation arrow
      if (alive > 0.04) {
        ctx.strokeStyle = `rgba(148,163,184,${(0.45 * alive).toFixed(3)})`
        ctx.lineWidth = 1
        ctx.setLineDash([3, 4])
        ctx.beginPath()
        ctx.arc(vcx, vcy, R, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        spinArrow(vcx, vcy, Math.max(12, R * 0.55), '#38bdf8', true, Math.min(1, alive))
        text(`u_theta/S_L = ${uthRef.current.toFixed(1)}`, vcx - 34, vcy - Math.max(12, R * 0.55) - 8, '#38bdf8')
      }

      // flame-generated (baroclinic) vorticity
      if (bcRef.current && rat > 1.02 && near > 0.18) {
        const a = Math.min(1, near * 1.4)
        spinArrow(p1x, p1y, Rb * 0.7, '#c084fc', false, a)
        spinArrow(p2x, p2y, Rb * 0.7, '#c084fc', false, a)
        ctx.globalAlpha = a
        // grad(rho): normal to the front, pointing into the fresh (dense) gas
        arrow(p1x, p1y, p1x - 34, p1y, 'rgba(226,232,240,0.95)', 1.6, 5)
        text('grad rho', p1x - 62, p1y - 5, '#e2e8f0')
        // grad(p): toward the low-pressure vortex core
        const dxp = vcx - p1x
        const dyp = vcy - p1y
        const mp = Math.max(1e-6, Math.sqrt(dxp * dxp + dyp * dyp))
        arrow(p1x, p1y, p1x + (dxp / mp) * 34, p1y + (dyp / mp) * 34, '#c084fc', 1.6, 5)
        text('grad p', p1x + 8, p1y + 26, '#c084fc')
        text('grad rho x grad p != 0  ->  counter-rotating pair', p1x + 26, p1y - 8, '#c084fc')
        ctx.globalAlpha = 1
      } else if (bcRef.current && rat <= 1.02 && near > 0.18) {
        text('rho_u/rho_b = 1  ->  grad rho = 0  ->  NO baroclinic torque', FRONT_X + 14, CY - 6, '#94a3b8')
      }

      ctx.restore()

      ctx.strokeStyle = 'rgba(148,163,184,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(GX0, GY0, GW, GH)

      text('fresh gas  rho_u', GX0 + 8, GY0 + 14, '#93c5fd')
      text('burnt gas  rho_b', FRONT_X + 14, GY0 + 14, '#fed7aa')
      text('flame front', FRONT_X - 34, GY0 - 6, '#e2e8f0')

      // mass-conservation reference arrows
      const yb = GY0 + GH - 16
      arrow(GX0 + 14, yb, GX0 + 14 + 26, yb, '#93c5fd', 1.8, 5)
      text('u_u = S_L', GX0 + 14, yb - 7, '#93c5fd')
      const Lb = Math.min(190, 26 * rat)
      arrow(FRONT_X + 20, yb, FRONT_X + 20 + Lb, yb, '#fdba74', 1.8, 5)
      text(`u_b = (rho_u/rho_b) S_L = ${rat.toFixed(1)} S_L    (rho_u S_L = rho_b u_b)`, FRONT_X + 20, yb - 7, '#fdba74')

      // ------------------------------------------------------------ readouts
      const R0 = 330
      const LH = 15
      const verdict = survives ? 'vortex crosses through' : 'vortex quenched at the front'
      const vcol = survives ? '#4ade80' : '#f87171'
      ctx.font = 'bold 13px ui-monospace, monospace'
      const bw = ctx.measureText(verdict).width + 20
      ctx.fillStyle = vcol
      ctx.globalAlpha = 0.16
      ctx.fillRect(14, R0 - 13, bw, 20)
      ctx.globalAlpha = 1
      ctx.strokeStyle = vcol
      ctx.strokeRect(14, R0 - 13, bw, 20)
      text(verdict, 24, R0 + 2, vcol, 'bold 13px ui-monospace, monospace')

      text(
        `s = (u_theta/S_L) / (1 + 20/(r/delta_L)) = ${s.toFixed(2)}   threshold ${S_CRIT.toFixed(1)}`,
        30 + bw,
        R0 + 2,
        vcol,
      )

      const bcMag = (1 - 1 / rat) * (uthRef.current * uthRef.current) / radRef.current
      text(`u_theta/S_L = ${uthRef.current.toFixed(1)}`, 14, R0 + LH + 6, '#e2e8f0')
      text(`r/delta_L = ${radRef.current.toFixed(0)}`, 148, R0 + LH + 6, '#e2e8f0')
      text(`rho_u/rho_b = ${rat.toFixed(1)}`, 272, R0 + LH + 6, '#e2e8f0')
      text(`div u across the front ~ (rho_u/rho_b - 1) S_L/delta_L = ${(rat - 1).toFixed(1)}`, 404, R0 + LH + 6, '#fdba74')
      text(
        `baroclinic |grad rho x grad p|/rho^2 ~ (1 - rho_b/rho_u)(u_theta/S_L)^2/(r/delta_L) = ${bcMag.toFixed(2)}  [S_L^2/delta_L^2]`,
        14,
        R0 + 2 * LH + 6,
        rat > 1.02 ? '#c084fc' : '#94a3b8',
      )
      text(
        `front wrinkle depth = ${(wr / PXD).toFixed(1)} delta_L   ${survives && crossed ? '(cusp persists downstream)' : '(shallow, relaxing back)'}`,
        14,
        R0 + 3 * LH + 6,
        survives && crossed ? '#fbbf24' : '#94a3b8',
      )

      const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 0.0018))
      ctx.globalAlpha = glow
      text('drag rho_u/rho_b down to 1: the violet pair vanishes - no density jump, no baroclinic torque', 14, R0 + 4 * LH + 8, '#c084fc', '11px ui-monospace, monospace')
      ctx.globalAlpha = 1
    }

    let raf = 0
    const loop = (ts: number) => {
      if (resRef.current !== lastReset) {
        lastReset = resRef.current
        respawn()
      }
      const st = step()
      draw(ts, st.s, st.survives, st.near)
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
          u_θ/S_L
          <input type="range" min={0.2} max={20} step={0.1} value={uth} onChange={(e) => setUth(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 34 }}>{uth.toFixed(1)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          r/δ_L
          <input type="range" min={1} max={30} step={1} value={rad} onChange={(e) => setRad(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 26 }}>{rad.toFixed(0)}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ρ_u/ρ_b
          <input type="range" min={1} max={8} step={0.1} value={ratio} onChange={(e) => setRatio(parseFloat(e.target.value))} />
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 30 }}>{ratio.toFixed(1)}</span>
        </label>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.5rem' }}>
        <button onClick={() => setResetN((v) => v + 1)} style={btn(false)}>
          Release / Restart
        </button>
        <button onClick={() => setShowBc((v) => !v)} style={btn(showBc)}>
          {showBc ? '[x]' : '[ ]'} show flame-generated (baroclinic) vorticity
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace', lineHeight: 1.55 }}>
        What to watch: at the defaults (u_θ/S_L = 2, r/δ_L = 10) the vortex dies on the front and a violet counter-rotating
        pair is all that is left. Push u_θ/S_L past ~9 and it punches through, dragging a cusp that stays. The arrows get
        ρ_u/ρ_b times longer on the burnt side — that jump is the dilatation term; set ρ_u/ρ_b = 1 and the baroclinic pair
        disappears entirely.
      </p>
    </div>
  )
}
