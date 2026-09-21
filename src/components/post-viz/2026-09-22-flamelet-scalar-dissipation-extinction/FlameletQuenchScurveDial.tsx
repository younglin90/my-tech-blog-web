'use client'

import { useEffect, useRef, useState } from 'react'

const T_U = 300 // K, both feed streams
const T_ACT = 24000 // K, activation temperature
const Q_HEAT = 36000 // K per unit fuel mass fraction
const S_RATIO = 4.0 // kg O2 per kg fuel
const Y_OX = 0.232 // oxidiser mass fraction in air
const C_PRE = 8.4e7 // calibrated so the undiluted flame quenches near chi_q = 10 1/s

/** stoichiometric mixture fraction and adiabatic peak for a given fuel dilution */
function feedState(yFuel: number) {
  const zSt = 1 / (1 + (S_RATIO * yFuel) / Y_OX)
  const tAd = T_U + Q_HEAT * yFuel * zSt
  return { zSt, tAd }
}

/**
 * Reduced one-step S-curve: the scalar dissipation a flamelet can survive while
 * sitting at reaction progress u. Rising part = unstable middle branch,
 * falling part = burning branch. The maximum is the quench limit chi_q.
 */
function chiSupported(u: number, tAd: number) {
  const t = T_U + (tAd - T_U) * u
  return C_PRE * (1 - u) * (1 - u) * Math.exp(-T_ACT / t)
}

function quenchPoint(tAd: number) {
  let uBest = 0
  let chiBest = 0
  for (let i = 1; i < 400; i++) {
    const u = i / 400
    const c = chiSupported(u, tAd)
    if (c > chiBest) {
      chiBest = c
      uBest = u
    }
  }
  return { uQ: uBest, chiQ: chiBest }
}

/** smoothed Burke-Schumann tent: sharper peak as the flame approaches equilibrium */
function profileT(z: number, zSt: number, tAd: number, u: number) {
  const a = z / zSt
  const b = (1 - z) / (1 - zSt)
  const k = Math.min(120, Math.max(5, 9 / (1 - u + 0.04)))
  const sm = -Math.log(Math.exp(-k * a) + Math.exp(-k * b)) / k
  return T_U + (tAd - T_U) * u * Math.max(sm, 0)
}

function flameColor(frac: number) {
  const f = Math.max(0, Math.min(1, frac))
  const r = Math.round(40 + 215 * Math.min(1, f * 1.5))
  const g = Math.round(60 + 160 * Math.max(0, f - 0.25) * 1.33)
  const b = Math.round(140 - 110 * f + 90 * Math.max(0, f - 0.85) * 6)
  return `rgb(${r},${Math.min(255, g)},${Math.max(0, Math.min(255, b))})`
}

export function FlameletQuenchScurveDial() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [chiSt, setChiSt] = useState(0.5)
  const [yFuel, setYFuel] = useState(1.0)
  const [running, setRunning] = useState(true)
  const [readout, setReadout] = useState({ tMax: 2273, burning: true })

  const chiRef = useRef(chiSt)
  const fuelRef = useRef(yFuel)
  const runRef = useRef(running)
  const uRef = useRef(0.995)
  chiRef.current = chiSt
  fuelRef.current = yFuel
  runRef.current = running

  const { zSt, tAd } = feedState(yFuel)
  const { chiQ } = quenchPoint(tAd)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const trail: { chi: number; t: number }[] = []
    let frame = 0
    let raf = 0

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const fuel = fuelRef.current
      const st = feedState(fuel)
      const q = quenchPoint(st.tAd)
      const chi = chiRef.current

      // ---- relax the flame state toward the branch that supports chi ----
      if (runRef.current) {
        const u = uRef.current
        const sup = chiSupported(u, st.tAd)
        const rate = (sup - chi) / Math.max(sup, chi, 1e-9)
        uRef.current = Math.min(0.9995, Math.max(0.0005, u + 0.035 * rate))
      }
      const u = uRef.current
      const tMax = T_U + (st.tAd - T_U) * u

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0c1118'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '11px ui-monospace, monospace'

      // =============== left panel: the S-curve =========================
      const L = 56
      const R = Math.round(W * 0.52) - 20
      const TOP = 32
      const BOT = H - 44
      const lx = (c: number) => L + ((Math.log10(Math.max(c, 1e-4)) + 4) / 6) * (R - L)
      const ly = (t: number) => BOT - ((t - T_U) / (st.tAd - T_U + 1)) * (BOT - TOP)

      ctx.strokeStyle = '#26313f'
      ctx.lineWidth = 1
      for (let e = -4; e <= 2; e++) {
        const px = lx(Math.pow(10, e))
        ctx.beginPath()
        ctx.moveTo(px, TOP)
        ctx.lineTo(px, BOT)
        ctx.stroke()
        ctx.fillStyle = '#5b6a7d'
        ctx.textAlign = 'center'
        ctx.fillText(`1e${e}`, px, BOT + 15)
      }
      ctx.textAlign = 'left'

      // frozen (lower) branch
      ctx.strokeStyle = '#4b5a6d'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(L, ly(T_U))
      ctx.lineTo(R, ly(T_U))
      ctx.stroke()
      ctx.setLineDash([])

      // middle (unstable) + burning branch
      for (let branch = 0; branch < 2; branch++) {
        ctx.strokeStyle = branch === 0 ? '#7a6bd8' : '#ff9a3c'
        ctx.setLineDash(branch === 0 ? [4, 3] : [])
        ctx.lineWidth = branch === 0 ? 1.8 : 2.6
        ctx.beginPath()
        let started = false
        for (let i = 1; i < 400; i++) {
          const uu = i / 400
          if (branch === 0 && uu > q.uQ) break
          if (branch === 1 && uu < q.uQ) continue
          const px = lx(chiSupported(uu, st.tAd))
          const py = ly(T_U + (st.tAd - T_U) * uu)
          if (!started) {
            ctx.moveTo(px, py)
            started = true
          } else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      ctx.setLineDash([])

      // quench limit
      const pxq = lx(q.chiQ)
      ctx.strokeStyle = '#ff4d5e'
      ctx.lineWidth = 1.6
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(pxq, TOP)
      ctx.lineTo(pxq, BOT)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#ff4d5e'
      ctx.fillText(`chi_q = ${q.chiQ.toFixed(2)} 1/s`, Math.min(pxq + 5, R - 96), TOP + 12)

      // operating point + trail
      trail.push({ chi, t: tMax })
      if (trail.length > 90) trail.shift()
      trail.forEach((p, i) => {
        ctx.fillStyle = `rgba(255,255,255,${(0.04 + (0.5 * i) / trail.length).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(lx(p.chi), ly(p.t), 1.6, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.fillStyle = u > 0.4 ? '#ffd166' : '#6ea8ff'
      ctx.beginPath()
      ctx.arc(lx(chi), ly(tMax), 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0c1118'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#93a3b8'
      ctx.textAlign = 'center'
      ctx.fillText('stoichiometric scalar dissipation  chi_st  [1/s]', (L + R) / 2, BOT + 32)
      ctx.textAlign = 'left'
      ctx.save()
      ctx.translate(16, (TOP + BOT) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('peak temperature  [K]', 0, 0)
      ctx.restore()
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ff9a3c'
      ctx.fillText('burning branch', L + 4, TOP + 12)
      ctx.fillStyle = '#7a6bd8'
      ctx.fillText('unstable middle', L + 4, TOP + 26)
      ctx.fillStyle = '#4b5a6d'
      ctx.fillText('frozen', L + 4, BOT - 6)

      // =============== right panel: T(Z) in mixture-fraction space =====
      const L2 = Math.round(W * 0.52) + 46
      const R2 = W - 26
      const zx = (z: number) => L2 + z * (R2 - L2)
      const zy = (t: number) => BOT - ((t - T_U) / (st.tAd - T_U + 1)) * (BOT - TOP)

      // equilibrium (Burke-Schumann) reference
      ctx.strokeStyle = 'rgba(160,170,185,0.5)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(zx(0), zy(T_U))
      ctx.lineTo(zx(st.zSt), zy(st.tAd))
      ctx.lineTo(zx(1), zy(T_U))
      ctx.stroke()
      ctx.setLineDash([])

      // current flamelet, filled with a temperature colour ramp
      const NZ = 160
      for (let i = 0; i < NZ; i++) {
        const z0 = i / NZ
        const z1 = (i + 1) / NZ
        const t0 = profileT(z0, st.zSt, st.tAd, u)
        const t1 = profileT(z1, st.zSt, st.tAd, u)
        ctx.fillStyle = flameColor((0.5 * (t0 + t1) - T_U) / (st.tAd - T_U))
        ctx.beginPath()
        ctx.moveTo(zx(z0), zy(T_U))
        ctx.lineTo(zx(z0), zy(t0))
        ctx.lineTo(zx(z1), zy(t1))
        ctx.lineTo(zx(z1), zy(T_U))
        ctx.closePath()
        ctx.fill()
      }
      ctx.strokeStyle = '#ffe0a3'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= NZ; i++) {
        const z = i / NZ
        const px = zx(z)
        const py = zy(profileT(z, st.zSt, st.tAd, u))
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()

      ctx.strokeStyle = '#4ade80'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(zx(st.zSt), TOP)
      ctx.lineTo(zx(st.zSt), BOT)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#4ade80'
      ctx.fillText(`Z_st = ${st.zSt.toFixed(3)}`, zx(st.zSt) + 5, TOP + 12)

      ctx.strokeStyle = '#5a6b80'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(L2, TOP)
      ctx.lineTo(L2, BOT)
      ctx.lineTo(R2, BOT)
      ctx.stroke()
      ctx.fillStyle = '#93a3b8'
      ctx.textAlign = 'center'
      ctx.fillText('mixture fraction  Z   (0 = air, 1 = fuel)', (L2 + R2) / 2, BOT + 32)
      ctx.fillText('T(Z)  flamelet', (L2 + R2) / 2, TOP - 14)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#6b7a8d'
      ctx.fillText('dashed = equilibrium', L2 + 4, BOT - 6)

      // banner
      ctx.font = 'bold 13px ui-monospace, monospace'
      ctx.fillStyle = u > 0.4 ? '#ffd166' : '#ff4d5e'
      ctx.fillText(
        u > 0.4
          ? `BURNING   T_max = ${tMax.toFixed(0)} K`
          : `QUENCHED  T_max = ${tMax.toFixed(0)} K  (press re-ignite)`,
        L,
        18
      )
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillStyle = '#93a3b8'
      ctx.textAlign = 'right'
      ctx.fillText(`chi_st = ${chi.toFixed(3)} 1/s`, W - 26, 18)
      ctx.textAlign = 'left'

      frame++
      if (frame % 12 === 0) setReadout({ tMax, burning: u > 0.4 })
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <canvas
        ref={canvasRef}
        width={880}
        height={400}
        style={{ width: '100%', borderRadius: 8, border: '1px solid #26313f', display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '0.75rem',
          fontSize: 13,
          fontFamily: 'ui-monospace, monospace',
          alignItems: 'center',
        }}
      >
        <label>
          chi_st = {chiSt.toFixed(3)} 1/s{' '}
          <input
            type="range"
            min={-2}
            max={2}
            step={0.01}
            value={Math.log10(chiSt)}
            onChange={(e) => setChiSt(Math.pow(10, parseFloat(e.target.value)))}
          />
        </label>
        <label>
          fuel Y_F1 = {yFuel.toFixed(3)}{' '}
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.005}
            value={yFuel}
            onChange={(e) => setYFuel(parseFloat(e.target.value))}
          />
        </label>
        <button onClick={() => (uRef.current = 0.995)}>re-ignite</button>
        <button onClick={() => setRunning((r) => !r)}>{running ? 'pause' : 'play'}</button>
      </div>
      <p style={{ fontSize: 12, color: '#8b98a9', marginTop: '0.5rem' }}>
        Z_st = {zSt.toFixed(3)}, T_ad = {tAd.toFixed(0)} K, quench limit chi_q ={' '}
        {chiQ.toFixed(2)} 1/s, current T_max = {readout.tMax.toFixed(0)} K (
        {readout.burning ? 'burning' : 'quenched'}). Push chi_st past the red line and the dot falls
        off the orange branch. Pull it back down — it stays on the floor, because the frozen branch
        is also a steady solution. Only re-ignite lifts it.
      </p>
    </div>
  )
}
