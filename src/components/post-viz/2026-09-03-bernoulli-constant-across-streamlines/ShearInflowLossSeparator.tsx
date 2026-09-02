'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Two channels that can produce the SAME total-pressure contour at the outlet
// for completely different reasons.
//
//   top    : inviscid channel with a sheared inlet.  p0 varies across y from
//            the first cell on, and never changes along a streamline.  Loss 0.
//   bottom : uniform inlet, a body, a viscous wake.  p0 is flat at the inlet
//            and drops along the streamlines that cross the wake.  Loss real.
//
// Each dot is colored by the p0 it carries.  Watch the colors, not the map.
// ---------------------------------------------------------------------------

const W = 760
const H = 420

const XL = 44
const XR = 596
const PXL = 616 // outlet profile box
const PXR = 748

const A_TOP = 44
const A_BOT = 182
const B_TOP = 258
const B_BOT = 396

const RHO = 1.2
const U0 = 40
const BODY_X = 0.42
const WAKE_W = 0.15

const COL_AX = 'rgba(148,163,184,0.35)'
const COL_TXT = '#94a3b8'

function shearU(yn: number, s: number) {
  return U0 * (1 + s * (1 - 2 * yn))
}

function wakeRamp(x: number) {
  if (x <= BODY_X) return 0
  const t = (x - BODY_X) / 0.18
  return t >= 1 ? 1 : t * t * (3 - 2 * t)
}

function wakeU(x: number, yn: number, d: number) {
  const g = Math.exp(-Math.pow((yn - 0.5) / WAKE_W, 2))
  return U0 * (1 - d * g * wakeRamp(x))
}

function headOf(u: number) {
  return 0.5 * RHO * u * u
}

function heat(t: number) {
  // t = 0 -> low p0 (deep blue), t = 1 -> high p0 (warm yellow)
  const c = Math.max(0, Math.min(1, t))
  if (c < 0.5) {
    const k = c / 0.5
    return `rgb(${Math.round(30 + 60 * k)},${Math.round(64 + 120 * k)},${Math.round(175 + 40 * k)})`
  }
  const k = (c - 0.5) / 0.5
  return `rgb(${Math.round(90 + 160 * k)},${Math.round(184 + 40 * k)},${Math.round(215 - 130 * k)})`
}

type Dot = { x: number; yn: number }

export function ShearInflowLossSeparator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shear, setShear] = useState(0.15)
  const [deficit, setDeficit] = useState(0.32)
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(true)
  const [read, setRead] = useState({ spreadA: 0, spreadB: 0, lossA: 0, lossB: 0 })

  const live = useRef({ shear, deficit, speed, running })
  live.current = { shear, deficit, speed, running }
  const setReadRef = useRef(setRead)
  setReadRef.current = setRead

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const dotsA: Dot[] = []
    const dotsB: Dot[] = []
    for (let i = 0; i < 240; i++) {
      dotsA.push({ x: Math.random(), yn: 0.03 + Math.random() * 0.94 })
      dotsB.push({ x: Math.random(), yn: 0.03 + Math.random() * 0.94 })
    }
    let frame = 0
    let raf = 0

    const drawPanel = (
      top: number,
      bot: number,
      dots: Dot[],
      uOf: (x: number, yn: number) => number,
      lo: number,
      hi: number,
      title: string,
      titleCol: string,
    ) => {
      const yOf = (yn: number) => top + yn * (bot - top)

      ctx.strokeStyle = COL_AX
      ctx.lineWidth = 1
      ctx.strokeRect(XL, top, XR - XL, bot - top)

      for (const d of dots) {
        const u = uOf(d.x, d.yn)
        ctx.fillStyle = heat((headOf(u) - lo) / (hi - lo))
        ctx.beginPath()
        ctx.arc(XL + d.x * (XR - XL), yOf(d.yn), 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = titleCol
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(title, XL + 4, top - 8)

      // outlet p0 profile
      ctx.strokeStyle = COL_AX
      ctx.beginPath()
      ctx.moveTo(PXL, top)
      ctx.lineTo(PXL, bot)
      ctx.stroke()
      ctx.strokeStyle = titleCol
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const yn = i / 60
        const v = (headOf(uOf(1, yn)) - lo) / (hi - lo)
        const x = PXL + v * (PXR - PXL)
        if (i === 0) ctx.moveTo(x, yOf(yn))
        else ctx.lineTo(x, yOf(yn))
      }
      ctx.stroke()
      ctx.fillStyle = COL_TXT
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText('p0 at outlet', PXL - 2, top - 8)
    }

    const draw = () => {
      const { shear: s, deficit: d, speed: sp, running: run } = live.current
      const dt = run ? 0.0022 * sp : 0

      for (const p of dotsA) {
        p.x += (shearU(p.yn, s) / U0) * dt
        if (p.x > 1) p.x -= 1
      }
      for (const p of dotsB) {
        p.x += (wakeU(p.x, p.yn, d) / U0) * dt
        if (p.x > 1) p.x -= 1
      }

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      const lo = Math.min(headOf(U0 * (1 - s)), headOf(U0 * (1 - d)))
      const hi = Math.max(headOf(U0 * (1 + s)), headOf(U0))

      drawPanel(A_TOP, A_BOT, dotsA, (_x, yn) => shearU(yn, s), lo, hi, 'A  inviscid, sheared inlet   loss = 0', '#4ade80')
      drawPanel(B_TOP, B_BOT, dotsB, (x, yn) => wakeU(x, yn, d), lo, hi, 'B  uniform inlet, body, wake   loss > 0', '#fb923c')

      // body marker on panel B
      ctx.fillStyle = '#e2e8f0'
      const bx = XL + BODY_X * (XR - XL)
      ctx.beginPath()
      ctx.arc(bx, (B_TOP + B_BOT) / 2, 9, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(226,232,240,0.35)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      for (const t of [A_TOP, B_TOP]) {
        ctx.beginPath()
        ctx.moveTo(XL, t - 1)
        ctx.lineTo(XL, t + (t === A_TOP ? A_BOT - A_TOP : B_BOT - B_TOP) + 1)
        ctx.stroke()
      }
      ctx.setLineDash([])

      ctx.fillStyle = COL_TXT
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('inlet', XL - 2, H - 10)
      ctx.fillText('outlet', XR - 34, H - 10)
      ctx.fillText('flow ->', (XL + XR) / 2 - 18, H - 10)
      ctx.fillText('dot color = p0 carried by that fluid parcel', XL + 4, 18)

      if (frame % 12 === 0) {
        const hA: number[] = []
        const hB: number[] = []
        for (let i = 0; i <= 60; i++) {
          hA.push(headOf(shearU(i / 60, s)))
          hB.push(headOf(wakeU(1, i / 60, d)))
        }
        setReadRef.current({
          spreadA: Math.max(...hA) - Math.min(...hA),
          spreadB: Math.max(...hB) - Math.min(...hB),
          lossA: 0,
          lossB: headOf(U0) - headOf(wakeU(1, 0.5, d)),
        })
      }
      frame += 1
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const matchSpread = () => {
    const inner = 1 - 4 * shear
    setDeficit(inner <= 0 ? 0.6 : Math.min(0.6, Math.max(0.05, 1 - Math.sqrt(inner))))
  }

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
          {running ? '❙❙ pause' : '▶ run'}
        </button>
        <button style={btn(false)} onClick={matchSpread}>
          = match outlet spread
        </button>
        <label style={label}>
          <span style={nameS}>inlet shear S</span>
          <input type="range" min={0.05} max={0.24} step={0.01} value={shear} onChange={(e) => setShear(parseFloat(e.target.value))} />
          <span style={mono}>{shear.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>wake deficit D</span>
          <input type="range" min={0.05} max={0.6} step={0.01} value={deficit} onChange={(e) => setDeficit(parseFloat(e.target.value))} />
          <span style={mono}>{deficit.toFixed(2)}</span>
        </label>
        <label style={label}>
          <span style={nameS}>speed</span>
          <input type="range" min={0.3} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={mono}>{speed.toFixed(1)}x</span>
        </label>
      </div>
      <div style={{ ...rowS, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#cbd5e1' }}>
        <span style={{ color: '#4ade80' }}>A spread {read.spreadA.toFixed(0)} Pa</span>
        <span style={{ color: '#4ade80' }}>A loss {read.lossA.toFixed(0)} Pa</span>
        <span style={{ color: '#fb923c' }}>B spread {read.spreadB.toFixed(0)} Pa</span>
        <span style={{ color: '#fb923c' }}>B loss {read.lossB.toFixed(0)} Pa</span>
      </div>
      <div style={{ ...rowS, color: '#64748b', fontSize: 12 }}>
        Press <em>match outlet spread</em> — the two outlet profiles now cover the same range of p0, so a contour plot of the
        outlet cannot tell them apart. The dots can: in A every parcel keeps the color it entered with, in B the parcels that pass
        the body change color on the way out. Only a color change along a streamline is a loss.
      </div>
    </div>
  )
}

const rowS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
  marginTop: '0.6rem',
}

const label: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 12 }
const nameS: CSSProperties = { color: '#94a3b8' }
const mono: CSSProperties = { fontFamily: 'ui-monospace, monospace', color: '#cbd5e1', minWidth: 44 }

function btn(active: boolean): CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.35)',
    background: active ? 'rgba(56,189,248,0.18)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  }
}
