'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// A heated room with two openings. Hydrostatics inside and outside run at
// different slopes, so the two pressure lines cross at exactly one height --
// the neutral plane z_n. Above it air leaves, below it air enters.
//
//   dp(z) = p_out - p_in = (rho_o - rho_i) g (z_n - z)
//
// Mass balance through both openings fixes z_n in closed form:
//
//   z_n = (rho_o A1^2 z1 + rho_i A2^2 z2) / (rho_o A1^2 + rho_i A2^2)
//
// Drag the indoor temperature through the outdoor value and the whole picture
// flips: the driving term changes sign and the room breathes the other way.
// ---------------------------------------------------------------------------

const W = 726
const H = 404

const G = 9.81
const R_AIR = 287
const P_ATM = 101325
const T_OUT = 283
const CD = 0.62
const A1 = 0.09 // lower opening area [m2]

const FLOOR = 352
const SCALE = 95
const yOf = (z: number) => FLOOR - z * SCALE
const RX0 = 60
const RX1 = 330
const PX0 = 430
const PW = 250

const rhoOf = (T: number) => P_ATM / (R_AIR * T)

function solveRoom(tIn: number, z1: number, z2: number, ratio: number) {
  const rhoI = rhoOf(tIn)
  const rhoO = rhoOf(T_OUT)
  const a2 = A1 * ratio
  const w1 = rhoO * A1 * A1
  const w2 = rhoI * a2 * a2
  const zn = (w1 * z1 + w2 * z2) / (w1 + w2)
  const dp = (z: number) => (rhoO - rhoI) * G * (zn - z)
  const dp1 = dp(z1)
  const dp2 = dp(z2)
  // inflow through whichever opening the pressure pushes inward
  const flow = (dpv: number, area: number) => {
    const rho = dpv > 0 ? rhoO : rhoI
    return Math.sign(dpv) * CD * area * Math.sqrt((2 * Math.abs(dpv)) / rho)
  }
  return { rhoI, rhoO, zn, dp, dp1, dp2, q1: flow(dp1, A1), q2: flow(dp2, a2), a2 }
}

export function NeutralPlaneRoomExchange() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tIn, setTIn] = useState(303)
  const [z1, setZ1] = useState(0.4)
  const [z2, setZ2] = useState(2.6)
  const [ratio, setRatio] = useState(1)

  const sol = useMemo(() => solveRoom(tIn, z1, z2, ratio), [tIn, z1, z2, ratio])
  const live = useRef({ sol, tIn, z1, z2 })
  live.current = { sol, tIn, z1, z2 }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    const air = Array.from({ length: 34 }, () => ({ x: 0, y: 0, life: 99, top: false }))

    const text = (s: string, x: number, y: number, col: string, font = '11px ui-monospace, monospace') => {
      ctx.fillStyle = col
      ctx.font = font
      ctx.fillText(s, x, y)
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const { sol: s, tIn: Ti, z1: za, z2: zb } = live.current
      const warm = Ti > T_OUT

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // ---- room box ----
      const tint = Math.max(0, Math.min(1, (Ti - 263) / 70))
      ctx.fillStyle = `rgba(${Math.round(30 + 90 * tint)},${Math.round(52 - 6 * tint)},${Math.round(90 - 60 * tint)},0.45)`
      ctx.fillRect(RX0, yOf(3), RX1 - RX0, 3 * SCALE)
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.strokeRect(RX0, yOf(3), RX1 - RX0, 3 * SCALE)
      text(`INSIDE  ${Ti.toFixed(0)} K`, RX0 + 12, yOf(3) + 18, '#e2e8f0', 'bold 11px ui-monospace, monospace')
      text(`rho_i ${s.rhoI.toFixed(3)}`, RX0 + 12, yOf(3) + 34, '#94a3b8')
      text(`OUTSIDE ${T_OUT} K`, 8, 22, '#94a3b8')
      text(`rho_o ${s.rhoO.toFixed(3)}`, 8, 38, '#94a3b8')

      // height axis
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      for (let z = 0; z <= 3; z += 0.5) {
        ctx.beginPath()
        ctx.moveTo(RX0 - 8, yOf(z))
        ctx.lineTo(RX0, yOf(z))
        ctx.stroke()
        text(`${z.toFixed(1)}`, RX0 - 32, yOf(z) + 4, '#64748b', '10px ui-monospace, monospace')
      }
      text('z [m]', RX0 - 40, yOf(3) - 10, '#64748b', '10px ui-monospace, monospace')

      // ---- openings ----
      const openH = 16
      for (const [z, lbl] of [
        [za, 'lower'],
        [zb, 'upper'],
      ] as [number, string][]) {
        ctx.fillStyle = '#0b1220'
        ctx.fillRect(RX0 - 3, yOf(z) - openH / 2, 7, openH)
        ctx.strokeStyle = '#38bdf8'
        ctx.strokeRect(RX0 - 3, yOf(z) - openH / 2, 7, openH)
        text(lbl, RX0 + 10, yOf(z) + 4, '#38bdf8', '10px ui-monospace, monospace')
      }

      // ---- neutral plane ----
      const zn = Math.max(0, Math.min(3, s.zn))
      ctx.strokeStyle = '#fbbf24'
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(RX0, yOf(zn))
      ctx.lineTo(PX0 + PW, yOf(zn))
      ctx.stroke()
      ctx.setLineDash([])
      text(`neutral plane  z_n = ${s.zn.toFixed(2)} m`, RX0 + 92, yOf(zn) - 7, '#fbbf24', 'bold 11px ui-monospace, monospace')

      // ---- air particles through the openings ----
      for (const p of air) {
        p.life += dt
        if (p.life > 2.6) {
          p.life = 0
          p.top = Math.random() > 0.5
          const z = p.top ? zb : za
          const dpv = p.top ? s.dp2 : s.dp1
          const inward = dpv > 0
          p.x = inward ? RX0 - 46 : RX0 + 6
          p.y = yOf(z) + (Math.random() - 0.5) * 12
        }
        const dpv = p.top ? s.dp2 : s.dp1
        const q = Math.abs(p.top ? s.q2 : s.q1)
        const speed = 30 + Math.min(150, q * 900)
        p.x += (dpv > 0 ? 1 : -1) * speed * dt
        const col = dpv > 0 ? 'rgba(96,165,250,' : 'rgba(251,146,60,'
        ctx.fillStyle = `${col}${Math.max(0, 0.75 - p.life / 3.4)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.2, 0, 2 * Math.PI)
        ctx.fill()
      }

      // arrows at each opening
      const arrow = (z: number, dpv: number) => {
        const y = yOf(z)
        const dir = dpv > 0 ? 1 : -1
        const x = RX0 + dir * 26
        ctx.strokeStyle = dpv > 0 ? '#60a5fa' : '#fb923c'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x - dir * 22, y)
        ctx.lineTo(x + dir * 8, y)
        ctx.lineTo(x + dir * 2, y - 5)
        ctx.moveTo(x + dir * 8, y)
        ctx.lineTo(x + dir * 2, y + 5)
        ctx.stroke()
        ctx.lineWidth = 1
      }
      arrow(za, s.dp1)
      arrow(zb, s.dp2)

      // ---- dp(z) profile ----
      text('PRESSURE DIFFERENCE  p_out - p_in', PX0 - 12, 30, '#cbd5e1', 'bold 12px ui-monospace, monospace')
      ctx.strokeStyle = 'rgba(148,163,184,0.25)'
      ctx.strokeRect(PX0, yOf(3), PW, 3 * SCALE)
      const zeroX = PX0 + PW / 2
      ctx.strokeStyle = 'rgba(226,232,240,0.4)'
      ctx.beginPath()
      ctx.moveTo(zeroX, yOf(3))
      ctx.lineTo(zeroX, yOf(0))
      ctx.stroke()
      text('0', zeroX - 3, yOf(0) + 16, '#64748b', '10px ui-monospace, monospace')
      const span = 8 // Pa full scale each side
      text(`+${span}`, PX0 + PW - 18, yOf(0) + 16, '#64748b', '10px ui-monospace, monospace')
      text(`-${span}`, PX0 + 2, yOf(0) + 16, '#64748b', '10px ui-monospace, monospace')
      text('[Pa]', PX0 + PW - 30, yOf(3) - 8, '#64748b', '10px ui-monospace, monospace')

      const xOfP = (v: number) => zeroX + Math.max(-1, Math.min(1, v / span)) * (PW / 2)
      // shaded halves
      ctx.fillStyle = 'rgba(96,165,250,0.12)'
      ctx.beginPath()
      ctx.moveTo(zeroX, yOf(0))
      ctx.lineTo(xOfP(s.dp(0)), yOf(0))
      ctx.lineTo(xOfP(s.dp(zn)), yOf(zn))
      ctx.lineTo(zeroX, yOf(zn))
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgba(251,146,60,0.12)'
      ctx.beginPath()
      ctx.moveTo(zeroX, yOf(zn))
      ctx.lineTo(xOfP(s.dp(zn)), yOf(zn))
      ctx.lineTo(xOfP(s.dp(3)), yOf(3))
      ctx.lineTo(zeroX, yOf(3))
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(xOfP(s.dp(0)), yOf(0))
      ctx.lineTo(xOfP(s.dp(3)), yOf(3))
      ctx.stroke()
      ctx.lineWidth = 1

      for (const [z, dpv] of [
        [za, s.dp1],
        [zb, s.dp2],
      ] as [number, number][]) {
        ctx.fillStyle = dpv > 0 ? '#60a5fa' : '#fb923c'
        ctx.beginPath()
        ctx.arc(xOfP(dpv), yOf(z), 4.5, 0, 2 * Math.PI)
        ctx.fill()
        text(`${dpv >= 0 ? '+' : ''}${dpv.toFixed(2)}`, xOfP(dpv) + 8, yOf(z) - 6, dpv > 0 ? '#60a5fa' : '#fb923c', '10px ui-monospace, monospace')
      }

      // ---- readout ----
      let ry = 300
      const row = (lbl: string, v: string, col: string) => {
        text(lbl, PX0 - 12, ry, '#94a3b8')
        text(v, PX0 + 122, ry, col, 'bold 11px ui-monospace, monospace')
        ry += 19
      }
      row('driving rho_o - rho_i', `${(s.rhoO - s.rhoI).toFixed(4)} kg/m3`, warm ? '#34d399' : '#f87171')
      row('lower opening', `${(s.q1 * 1000).toFixed(1)} L/s ${s.dp1 > 0 ? 'IN' : 'OUT'}`, s.dp1 > 0 ? '#60a5fa' : '#fb923c')
      row('upper opening', `${(s.q2 * 1000).toFixed(1)} L/s ${s.dp2 > 0 ? 'IN' : 'OUT'}`, s.dp2 > 0 ? '#60a5fa' : '#fb923c')
      row('area ratio A2/A1', `${(s.a2 / A1).toFixed(2)}`, '#e2e8f0')
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rowS: CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }
  const label: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }
  const name: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }
  const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#fbbf24', minWidth: 52 }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', display: 'block' }}
      />

      <div style={rowS}>
        <label style={label}>
          <span style={name}>inside T</span>
          <input type="range" min={263} max={333} step={1} value={tIn} onChange={(e) => setTIn(parseFloat(e.target.value))} />
          <span style={mono}>{tIn.toFixed(0)} K</span>
        </label>
        <label style={label}>
          <span style={name}>lower z1</span>
          <input type="range" min={0.05} max={1.4} step={0.05} value={z1} onChange={(e) => setZ1(parseFloat(e.target.value))} />
          <span style={mono}>{z1.toFixed(2)} m</span>
        </label>
        <label style={label}>
          <span style={name}>upper z2</span>
          <input type="range" min={1.5} max={2.95} step={0.05} value={z2} onChange={(e) => setZ2(parseFloat(e.target.value))} />
          <span style={mono}>{z2.toFixed(2)} m</span>
        </label>
        <label style={label}>
          <span style={name}>area ratio A2/A1</span>
          <input type="range" min={0.25} max={4} step={0.05} value={ratio} onChange={(e) => setRatio(parseFloat(e.target.value))} />
          <span style={mono}>{ratio.toFixed(2)}</span>
        </label>
      </div>

      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Enlarge the upper opening and the amber neutral plane climbs toward it — the big hole is the one that sits near zero
        pressure difference. Then drag <em>inside T</em> below 283 K: the blue line tips the other way, both arrows reverse, and the
        room that was drawing at the floor starts drawing at the ceiling.
      </div>
    </div>
  )
}
